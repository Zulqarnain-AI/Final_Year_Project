import logging
import os
import time

import requests


HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "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")
HF_MODEL_NAME = os.environ.get("HF_MODEL_NAME", "google/gemma-2-2b-it")
HF_MODEL_CANDIDATES_RAW = os.environ.get(
    "HF_MODEL_CANDIDATES",
    "Qwen/Qwen2.5-7B-Instruct,meta-llama/Llama-3.1-8B-Instruct,microsoft/Phi-3-mini-4k-instruct,HuggingFaceH4/zephyr-7b-beta,mistralai/Mistral-7B-Instruct-v0.2",
)
HF_MAX_RETRIES = int(os.environ.get("HF_MAX_RETRIES", "2"))
HF_RETRY_DELAY_SECONDS = float(os.environ.get("HF_RETRY_DELAY_SECONDS", "1.5"))
HF_ROUTER_CHAT_URL = os.environ.get("HF_ROUTER_CHAT_URL", "https://router.huggingface.co/v1/chat/completions")


def build_hf_endpoint(model_name):
    return f"https://router.huggingface.co/hf-inference/models/{model_name}"


def get_hf_model_candidates():
    candidates = [item.strip() for item in HF_MODEL_CANDIDATES_RAW.split(",") if item.strip()]
    if HF_MODEL_NAME not in candidates:
        candidates.append(HF_MODEL_NAME)
    return candidates


def generate_hf_response(prompt, trace_id=None):
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json",
    }
    transient_status_codes = {429, 500, 502, 503, 504}
    total_attempts = HF_MAX_RETRIES + 1
    model_candidates = get_hf_model_candidates()

    for model_name in model_candidates:
        endpoint_url = HF_ROUTER_CHAT_URL
        for attempt in range(1, total_attempts + 1):
            chat_payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "You are a helpful lung-care assistant."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 320,
                "temperature": 0.4,
                "top_p": 0.9,
            }

            response = requests.post(endpoint_url, headers=headers, json=chat_payload, timeout=60)
            status_code = response.status_code
            logging.info(
                f"[chatbot:{trace_id}] HF attempt {attempt}/{total_attempts} "
                f"status={status_code} model={model_name} endpoint={endpoint_url} mode=chat"
            )

            if status_code >= 400:
                error_preview = (response.text or "")[:300]
                if status_code in transient_status_codes and attempt < total_attempts:
                    delay = HF_RETRY_DELAY_SECONDS * attempt
                    logging.warning(
                        f"[chatbot:{trace_id}] HF transient error status={status_code}. "
                        f"Retrying in {delay:.1f}s. Body preview: {error_preview}"
                    )
                    time.sleep(delay)
                    continue

                if status_code in {400, 402, 403, 404}:
                    logging.warning(
                        f"[chatbot:{trace_id}] Model unavailable on chat endpoint: {model_name}. "
                        "Trying next candidate model."
                    )
                    break

                logging.warning(
                    f"[chatbot:{trace_id}] HF endpoint failed status={status_code} endpoint={endpoint_url}. "
                    f"Body preview: {error_preview}"
                )
                break

            data = response.json()
            generated_text = ""

            if isinstance(data, dict):
                choices = data.get("choices")
                if isinstance(choices, list) and choices:
                    message_obj = choices[0].get("message") if isinstance(choices[0], dict) else None
                    if isinstance(message_obj, dict):
                        generated_text = str(message_obj.get("content", "") or "").strip()

            if generated_text:
                logging.info(
                    f"[chatbot:{trace_id}] HF generated text length={len(generated_text)} "
                    f"endpoint={endpoint_url} model={model_name} mode=chat"
                )
                return generated_text, model_name

            if attempt < total_attempts:
                delay = HF_RETRY_DELAY_SECONDS * attempt
                logging.warning(
                    f"[chatbot:{trace_id}] HF returned empty output on attempt {attempt}. "
                    f"Retrying in {delay:.1f}s."
                )
                time.sleep(delay)
                continue

            logging.warning(
                f"[chatbot:{trace_id}] HF returned empty output after {total_attempts} attempts "
                f"endpoint={endpoint_url}"
            )

        endpoint_url = build_hf_endpoint(model_name)
        for attempt in range(1, total_attempts + 1):
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 256,
                    "temperature": 0.4,
                    "top_p": 0.9,
                    "return_full_text": False,
                },
                "options": {"wait_for_model": True},
            }

            response = requests.post(endpoint_url, headers=headers, json=payload, timeout=60)
            status_code = response.status_code
            logging.info(
                f"[chatbot:{trace_id}] HF attempt {attempt}/{total_attempts} "
                f"status={status_code} model={model_name} endpoint={endpoint_url} mode=textgen"
            )

            if status_code >= 400:
                error_preview = (response.text or "")[:300]
                if status_code in transient_status_codes and attempt < total_attempts:
                    delay = HF_RETRY_DELAY_SECONDS * attempt
                    logging.warning(
                        f"[chatbot:{trace_id}] HF transient error status={status_code}. "
                        f"Retrying in {delay:.1f}s. Body preview: {error_preview}"
                    )
                    time.sleep(delay)
                    continue

                logging.warning(
                    f"[chatbot:{trace_id}] HF textgen failed status={status_code} endpoint={endpoint_url}. "
                    f"Body preview: {error_preview}"
                )
                break

            data = response.json()
            generated_text = ""
            if isinstance(data, list) and data:
                first_item = data[0]
                if isinstance(first_item, dict):
                    generated_text = str(first_item.get("generated_text") or first_item.get("text") or "").strip()
            elif isinstance(data, dict):
                generated_text = str(data.get("generated_text") or data.get("text") or data.get("answer") or "").strip()

            if generated_text:
                logging.info(
                    f"[chatbot:{trace_id}] HF generated text length={len(generated_text)} "
                    f"endpoint={endpoint_url} model={model_name} mode=textgen"
                )
                return generated_text, model_name

            if attempt < total_attempts:
                delay = HF_RETRY_DELAY_SECONDS * attempt
                logging.warning(
                    f"[chatbot:{trace_id}] HF returned empty output on attempt {attempt}. "
                    f"Retrying in {delay:.1f}s."
                )
                time.sleep(delay)
                continue

            logging.warning(
                f"[chatbot:{trace_id}] HF returned empty output after {total_attempts} attempts "
                f"endpoint={endpoint_url} mode=textgen"
            )

        logging.warning(f"[chatbot:{trace_id}] Switching HF model after failures: {model_name}")

    return "", None
from flask import Flask, request, jsonify
from flask_cors import CORS # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import ( # type: ignore
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from bson import ObjectId # type: ignore
from config import Config
from database import mongo
import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
import librosa
from tempfile import NamedTemporaryFile
from datetime import datetime
import logging
import requests
import time
import uuid
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
import joblib

# -------------------------------
# App Setup
# -------------------------------
app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
mongo.init_app(app)
jwt = JWTManager(app)


@jwt.invalid_token_loader
def handle_invalid_token(reason):
    logging.warning(f"Invalid JWT token: {reason}")
    return jsonify({"error": "Invalid or malformed authentication token"}), 401


@jwt.unauthorized_loader
def handle_missing_token(reason):
    logging.warning(f"Missing JWT token: {reason}")
    return jsonify({"error": "Authentication token is required"}), 401


@jwt.expired_token_loader
def handle_expired_token(jwt_header, jwt_payload):
    return jsonify({"error": "Authentication token has expired"}), 401

# -------------------------------
# Audio model inference
# -------------------------------
CLASS_NAMES = ["asthma", "copd", "bronchial", "pneumonia", "healthy"]

SAMPLE_RATE = 22050
DURATION = 5
SAMPLES = SAMPLE_RATE * DURATION
N_MELS = 128
FMAX = 8000
TARGET_TIME_FRAMES = 216

MODEL_FILENAME = "lung_model.keras"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_FILENAME)
SYMPTOMS_MODEL_FILENAME = "symptoms_model_pipeline.pkl"
SYMPTOMS_MODEL_PATH = os.path.join(os.path.dirname(__file__), SYMPTOMS_MODEL_FILENAME)

CANONICAL_CLASS_NAMES = ["asthma", "copd", "bronchial", "pneumonia", "healthy"]
LABEL_ALIASES = {
    "asthma": "asthma",
    "copd": "copd",
    "bronchial": "bronchial",
    "bronchitis": "bronchial",
    "pneumonia": "pneumonia",
    "healthy": "healthy"
}


def load_ml_model():
    if os.path.exists(MODEL_PATH):
        try:
            return tf.keras.models.load_model(MODEL_PATH)
        except Exception as exc:
            logging.error(f"Unable to load model: {exc}")
    else:
        logging.warning(f"Model file not found: {MODEL_PATH}")
    return None


model = load_ml_model()


def load_symptoms_model():
    if os.path.exists(SYMPTOMS_MODEL_PATH):
        try:
            return joblib.load(SYMPTOMS_MODEL_PATH)
        except Exception as exc:
            logging.error(f"Unable to load symptoms model: {exc}")
    else:
        logging.warning(f"Symptoms model file not found: {SYMPTOMS_MODEL_PATH}")
    return None


symptoms_model = load_symptoms_model()


def normalize_label(label):
    cleaned = str(label).strip().lower()
    return LABEL_ALIASES.get(cleaned, cleaned)


def normalize_probability_map(probabilities):
    normalized = {name: 0.0 for name in CANONICAL_CLASS_NAMES}
    for label, value in probabilities.items():
        mapped = normalize_label(label)
        if mapped in normalized:
            normalized[mapped] = float(value)
    return normalized


def predict_symptoms(symptoms_list, age, sex):
    if symptoms_model is None:
        raise RuntimeError("Symptoms model is not loaded.")

    symptoms_text = " ".join(symptoms_list).strip() if isinstance(symptoms_list, list) else str(symptoms_list)
    input_df = pd.DataFrame({
        "Symptoms": [symptoms_text],
        "Age": [float(age)],
        "Sex": [str(sex)]
    })

    prediction = symptoms_model.predict(input_df)[0]
    raw_probs = {}
    if hasattr(symptoms_model, "predict_proba"):
        prob_values = symptoms_model.predict_proba(input_df)[0]
        for cls, prob in zip(symptoms_model.classes_, prob_values):
            raw_probs[str(cls)] = float(prob)

    symptom_probs = normalize_probability_map(raw_probs)
    predicted_label = normalize_label(prediction)
    confidence = symptom_probs.get(predicted_label, 0.0)

    return {
        "prediction": predicted_label,
        "confidence": float(confidence),
        "probabilities": symptom_probs,
        "symptoms_text": symptoms_text
    }


def combine_probabilities(audio_probs, symptom_probs, audio_weight=0.65):
    combined = {}
    for label in CANONICAL_CLASS_NAMES:
        combined[label] = (
            audio_weight * float(audio_probs.get(label, 0.0))
            + (1 - audio_weight) * float(symptom_probs.get(label, 0.0))
        )
    return combined


def compute_severity(prediction, confidence, symptom_count):
    if prediction == "healthy":
        return "Low"
    if confidence >= 0.8 or symptom_count >= 5:
        return "Severe"
    if confidence >= 0.55 or symptom_count >= 3:
        return "Moderate"
    return "Mild"


def ensure_human_id_for_user(user_doc, collection, prefix, field_name):
    human_id = user_doc.get(field_name)
    if human_id:
        return human_id

    generated_id = generate_human_id(collection, prefix)
    try:
        collection.update_one({"_id": user_doc.get("_id")}, {"$set": {field_name: generated_id}})
    except Exception:
        pass
    return generated_id


def resolve_patient_human_id(report_doc):
    existing = report_doc.get("patientId")
    if existing:
        return existing

    patient_object_id = report_doc.get("patient_id")
    if not patient_object_id:
        return None

    patient = None
    try:
        patient = patients_collection.find_one({"_id": ObjectId(patient_object_id)})
    except Exception:
        patient = None

    if not patient:
        return None

    patient_id = ensure_human_id_for_user(patient, patients_collection, "P", "patientId")

    try:
        reports_collection.update_one(
            {"_id": report_doc.get("_id")},
            {"$set": {"patientId": patient_id}}
        )
    except Exception:
        pass

    return patient_id


def serialize_report(report_doc):
    patient_human_id = resolve_patient_human_id(report_doc)
    return {
        "id": str(report_doc.get("_id")),
        "patient_id": report_doc.get("patient_id"),
        "patientId": patient_human_id,
        "symptoms": report_doc.get("symptoms", []),
        "age": report_doc.get("age"),
        "sex": report_doc.get("sex"),
        "audio_prediction": report_doc.get("audio_prediction"),
        "symptom_prediction": report_doc.get("symptom_prediction"),
        "final_prediction": report_doc.get("final_prediction"),
        "final_confidence": report_doc.get("final_confidence"),
        "final_probabilities": report_doc.get("final_probabilities"),
        "severity": report_doc.get("severity"),
        "created_at": report_doc.get("created_at").isoformat() if report_doc.get("created_at") else None,
    }


HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "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")
HF_MODEL_NAME = os.environ.get("HF_MODEL_NAME", "google/gemma-2-2b-it")
HF_MODEL_CANDIDATES_RAW = os.environ.get(
    "HF_MODEL_CANDIDATES",
    "Qwen/Qwen2.5-7B-Instruct,meta-llama/Llama-3.1-8B-Instruct,microsoft/Phi-3-mini-4k-instruct,HuggingFaceH4/zephyr-7b-beta,mistralai/Mistral-7B-Instruct-v0.2"
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


def sanitize_chat_history(chat_history):
    if not isinstance(chat_history, list):
        return []

    cleaned = []
    for item in chat_history[-8:]:
        if not isinstance(item, dict):
            continue
        role_raw = str(item.get("type", "")).lower()
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        role = "Patient" if role_raw == "user" else "Assistant"
        cleaned.append(f"{role}: {text}")

    return cleaned


def build_lung_care_prompt(user_message, context="", chat_history=None):
    history_lines = sanitize_chat_history(chat_history)
    history_text = "\n".join(history_lines) if history_lines else "No previous turns in this chat."

    return f"""You are BreatheCare, a compassionate AI care assistant specialized in lung and respiratory health.

Rules:
- Focus on lung disease care: asthma, COPD, pneumonia, bronchitis, cough, breathlessness, inhaler use, recovery, and symptom monitoring.
- Questions about the patient's diagnosis report, severity, and what to do next are in scope.
- Keep continuity with this same chat. If the patient asks a follow-up such as "so what should I care about", use previous turns and report context.
- Decline only clearly unrelated domains (coding, finance, sports betting, gaming strategy, politics, etc.).
- Do not provide definitive diagnosis. Encourage clinical follow-up for treatment changes.
- If severe warning symptoms appear (severe shortness of breath, chest pain, blue lips, confusion, coughing blood), advise urgent care immediately.
- Be practical and supportive. Prefer short action-oriented guidance.

Patient report context:
{context if context else 'No recent diagnosis report was provided.'}

Recent chat context:
{history_text}

Current patient question:
{user_message}

Assistant response:"""


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

                # Some models/providers are not available for this token; try next model.
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
                        generated_text = str(message_obj.get("content", "")).strip()

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

        # Fallback to legacy text-generation inference path for this model
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
                "options": {
                    "wait_for_model": True,
                },
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
                    generated_text = (first_item.get("generated_text") or first_item.get("text") or "").strip()
            elif isinstance(data, dict):
                generated_text = (data.get("generated_text") or data.get("text") or data.get("answer") or "").strip()

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


def is_report_question(user_message):
    message = user_message.lower()
    return any(term in message for term in [
        "diagnosis report",
        "my diagnosis report",
        "latest report",
        "report summary",
        "what does my report mean",
        "tell me about my diagnosis",
        "tell me about my diagnosis report",
        "explain my report",
        "what is my diagnosis"
    ])


def is_follow_up_question(user_message):
    message = user_message.lower().strip()
    follow_up_terms = [
        "what should i care",
        "what should i do",
        "what now",
        "what about that",
        "what about it",
        "so now",
        "next step",
        "next steps",
        "care about",
        "is it serious",
        "should i worry",
        "what can i do"
    ]
    if any(term in message for term in follow_up_terms):
        return True
    return len(message.split()) <= 8 and any(token in message for token in ["so", "now", "it", "that", "this"])


def is_doctor_consult_question(user_message):
    message = user_message.lower()
    consult_terms = [
        "consult doctor",
        "see a doctor",
        "should i see a doctor",
        "should i consult",
        "do i need a doctor",
        "doctor visit",
        "book appointment",
        "hospital",
        "go to clinic",
        "need medical help"
    ]
    return any(term in message for term in consult_terms)


def is_clearly_unrelated_domain(user_message):
    message = user_message.lower()
    lung_related_terms = [
        "lung", "respiratory", "breath", "asthma", "copd", "pneumonia", "bronch", "cough", "inhaler",
        "diagnosis", "report", "symptom", "phlegm", "mucus", "oxygen", "chest"
    ]
    if any(term in message for term in lung_related_terms):
        return False

    unrelated_terms = [
        "javascript", "python code", "react", "algorithm", "stocks", "crypto", "bitcoin", "forex",
        "sports", "football", "basketball", "betting", "movie", "song", "gaming", "politics",
        "travel", "recipe", "cooking", "homework", "exam answers"
    ]
    return any(term in message for term in unrelated_terms)


def build_report_summary(report_doc):
    if not report_doc:
        return None

    symptoms_list = report_doc.get("symptoms", []) or []
    diagnosis = report_doc.get("final_prediction", "Unknown")
    confidence = report_doc.get("final_confidence", 0)
    severity = report_doc.get("severity", "Unknown")
    age = report_doc.get("age")
    sex = report_doc.get("sex")

    return {
        "age": age,
        "sex": sex,
        "symptoms": symptoms_list,
        "diagnosis": diagnosis,
        "confidence": confidence,
        "severity": severity,
    }


def format_report_response(report_summary):
    if not report_summary:
        return "I could not find a recent diagnosis report for you yet. Please complete a new report, and I can explain it."

    symptoms_text = ", ".join(report_summary.get("symptoms", [])) if report_summary.get("symptoms") else "none reported"
    diagnosis = str(report_summary.get("diagnosis", "Unknown")).lower()
    confidence = report_summary.get("confidence", 0)
    severity = report_summary.get("severity", "Unknown")
    age = report_summary.get("age", "not provided")
    sex = report_summary.get("sex", "not provided")

    return (
        f"Your latest diagnosis report shows {diagnosis} with a confidence of {float(confidence):.2%}. "
        f"Recorded symptoms were: {symptoms_text}. Severity was marked as {severity}. "
        f"Patient details used for the report were age {age} and sex {sex}. "
        f"This is not a final medical diagnosis, but it suggests your respiratory symptoms should be followed up with a doctor, especially if breathing gets worse. "
        f"If you want, I can also explain what this means for daily care, inhaler use, or warning signs to watch for."
    )


def format_care_advice_response(report_summary):
    if not report_summary:
        return "Based on lung care best practices, focus on hydration, avoiding smoke and dust exposure, taking prescribed medicines correctly, and monitoring symptom worsening. If breathing gets worse, contact your doctor promptly."

    diagnosis = str(report_summary.get("diagnosis", "lung condition")).lower()
    symptoms = report_summary.get("symptoms", []) or []
    severity = str(report_summary.get("severity", "Unknown"))
    symptoms_text = ", ".join(symptoms) if symptoms else "your reported respiratory symptoms"

    return (
        f"Given your latest report ({diagnosis}, severity {severity}), here is what to care about most: "
        f"1) Watch warning symptoms like increasing breathlessness, persistent fever, chest pain, confusion, or blue lips. "
        f"2) Manage current symptoms ({symptoms_text}) with rest, hydration, and prescribed medicines/inhalers on time. "
        f"3) Avoid triggers such as smoke, dust, strong fumes, and very cold air. "
        f"4) Track symptoms daily and seek doctor review if you are not improving within 24-48 hours or symptoms worsen."
    )


def format_doctor_consult_response(report_summary):
    if not report_summary:
        return (
            "If you are having ongoing breathing symptoms, yes, consulting a doctor is a good idea. "
            "Seek urgent care immediately if you have severe shortness of breath, chest pain, blue lips, confusion, or cough blood."
        )

    diagnosis = str(report_summary.get("diagnosis", "lung condition")).lower()
    severity = str(report_summary.get("severity", "Unknown")).lower()
    symptoms = [str(item).lower() for item in (report_summary.get("symptoms", []) or [])]

    emergency_terms = ["shortness of breath", "chest pain", "blue lips", "cough blood", "coughing blood", "confusion"]
    has_emergency_signal = any(term in " ".join(symptoms) for term in emergency_terms)

    if has_emergency_signal or severity in ["high", "severe", "critical"]:
        return (
            f"Yes, you should consult a doctor immediately. Your report suggests {diagnosis} with {severity} severity, "
            "and these symptoms can worsen quickly. If breathing becomes difficult right now, go to emergency care."
        )

    if severity in ["moderate", "medium"]:
        return (
            f"Yes, based on your report ({diagnosis}, {severity} severity), you should consult a doctor soon (preferably within 24 hours) "
            "to confirm treatment and prevent worsening. Seek urgent care sooner if symptoms intensify."
        )

    return (
        f"A doctor consultation is still recommended for your {diagnosis} report, even if severity appears {severity}. "
        "You can book a routine appointment and monitor symptoms closely in the meantime."
    )


def chat_history_has_report_context(chat_history):
    if not isinstance(chat_history, list):
        return False

    for item in reversed(chat_history[-8:]):
        if not isinstance(item, dict):
            continue
        role_raw = str(item.get("type", "")).lower()
        text = str(item.get("text", "")).lower()
        if role_raw == "ai" and any(term in text for term in ["diagnosis report", "latest diagnosis", "severity", "confidence"]):
            return True

    return False


def fallback_lung_response(user_message, report_summary=None, chat_history=None):
    message = user_message.lower()

    if is_report_question(user_message):
        return format_report_response(report_summary)

    if is_doctor_consult_question(user_message):
        return format_doctor_consult_response(report_summary)

    if is_follow_up_question(user_message) and (report_summary or chat_history_has_report_context(chat_history)):
        return format_care_advice_response(report_summary)

    if is_clearly_unrelated_domain(user_message):
        return "I am your lung care assistant, so I can only help with respiratory health, diagnosis reports, symptom care, and breathing-related guidance. Ask me anything in that area and I’ll help."

    report_hint = ""
    if report_summary:
        report_hint = (
            f" Based on your latest report: diagnosis {str(report_summary.get('diagnosis', 'Unknown')).lower()}, "
            f"symptoms {', '.join(report_summary.get('symptoms', [])) if report_summary.get('symptoms') else 'none reported'}, "
            f"severity {report_summary.get('severity', 'Unknown')}."
        )

    if any(term in message for term in ["breathless", "short of breath", "can't breathe", "chest pain", "coughing blood", "blue lips", "wheezing badly"]):
        return "Your symptoms may need urgent medical review. Please seek immediate medical attention or contact emergency services now." + report_hint

    if any(term in message for term in ["inhaler", "asthma", "copd", "pneumonia", "bronch", "cough", "mucus", "phlegm", "breathing", "symptom", "care"]):
        return "I can help with lung disease care guidance, inhaler reminders, breathing exercises, symptom monitoring, and when to seek medical help." + report_hint + " Please share your specific lung symptom or concern, and I’ll respond within that scope."

    return "I can support you with lung health and care planning. If your question is about your diagnosis, symptoms, medicines, breathing, or recovery, I can guide you." + report_hint


def preprocess_audio(file_path):
    signal, sr = librosa.load(file_path, sr=SAMPLE_RATE)

    # Fix length
    if len(signal) > SAMPLES:
        signal = signal[:SAMPLES]
    else:
        signal = np.pad(signal, (0, SAMPLES - len(signal)))

    # Mel Spectrogram
    mel = librosa.feature.melspectrogram(
        y=signal,
        sr=sr,
        n_mels=N_MELS,
        fmax=FMAX
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)

    # Add delta features (VERY IMPORTANT - must match training)
    delta = librosa.feature.delta(mel_db)
    delta2 = librosa.feature.delta(mel_db, order=2)

    # Stack → (128, time, 3)
    feature = np.stack([mel_db, delta, delta2], axis=-1)

    # Resize to match training shape
    if feature.shape[1] < TARGET_TIME_FRAMES:
        pad_width = TARGET_TIME_FRAMES - feature.shape[1]
        feature = np.pad(feature, ((0, 0), (0, pad_width), (0, 0)), mode="constant")
    elif feature.shape[1] > TARGET_TIME_FRAMES:
        feature = feature[:, :TARGET_TIME_FRAMES, :]

    # CRITICAL: Normalize using PER-SAMPLE stats (matching training preprocessing)
    feature = (feature - np.mean(feature)) / (np.std(feature) + 1e-6)

    return feature


@app.route('/predict-audio', methods=['POST'])
def predict_audio():
    if model is None:
        return jsonify({"error": "Model is not loaded. Place lung_model.keras in the Backend folder."}), 500

    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded."}), 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "Uploaded file must have a name."}), 400

    if not uploaded_file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")): # type: ignore
        return jsonify({"error": "Unsupported audio format. Upload WAV or compatible audio file."}), 400

    tmp_file = None
    try:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.filename)[1] or ".wav") as tmp: # type: ignore
            uploaded_file.save(tmp.name)
            tmp_file = tmp.name

        feature = preprocess_audio(tmp_file)
        input_tensor = np.expand_dims(feature, axis=0)
        predictions = model.predict(input_tensor)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        probs = {
            CLASS_NAMES[i]: float(predictions[0][i])
            for i in range(len(CLASS_NAMES))
        }
        a={
            "prediction": CLASS_NAMES[predicted_index],
            "confidence": confidence,
            "probabilities": probs
        }
        print(a)

        return jsonify({
            "prediction": CLASS_NAMES[predicted_index],
            "confidence": confidence,
            "probabilities": probs
        }), 200

    except Exception as exc:
        logging.error(f"Audio prediction failed: {exc}")
        return jsonify({"error": "Audio prediction failed. " + str(exc)}), 500

    finally:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                pass


@app.route('/diagnose', methods=['POST'])
@jwt_required()
def diagnose():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can create diagnosis reports"}), 403

    user_id = get_jwt_identity()
    patient = patients_collection.find_one({"_id": ObjectId(user_id)})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    patient_human_id = ensure_human_id_for_user(patient, patients_collection, "P", "patientId")

    symptoms_raw = request.form.get("symptoms", "[]")
    try:
        symptoms = json.loads(symptoms_raw) if symptoms_raw else []
    except Exception:
        symptoms = [s.strip() for s in symptoms_raw.split(",") if s.strip()]

    if not isinstance(symptoms, list):
        symptoms = []

    symptoms = [str(item).strip() for item in symptoms if str(item).strip()]

    age = request.form.get("age") or patient.get("age")
    sex = request.form.get("sex") or patient.get("gender")

    uploaded_file = request.files.get("file")

    if not symptoms and not uploaded_file:
        return jsonify({"error": "Provide at least symptoms or an audio file."}), 400

    audio_result = None
    symptom_result = None

    if uploaded_file is not None:
        if model is None:
            return jsonify({"error": "Audio model is not loaded."}), 500
        if uploaded_file.filename == "":
            return jsonify({"error": "Uploaded file must have a name."}), 400
        if not uploaded_file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")): # type: ignore
            return jsonify({"error": "Unsupported audio format."}), 400

        tmp_file = None
        try:
            with NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.filename)[1] or ".wav") as tmp: # type: ignore
                uploaded_file.save(tmp.name)
                tmp_file = tmp.name

            feature = preprocess_audio(tmp_file)
            input_tensor = np.expand_dims(feature, axis=0)
            predictions = model.predict(input_tensor)
            predicted_index = int(np.argmax(predictions[0]))
            probs = {CLASS_NAMES[i]: float(predictions[0][i]) for i in range(len(CLASS_NAMES))}
            normalized_probs = normalize_probability_map(probs)
            predicted_label = normalize_label(CLASS_NAMES[predicted_index])

            audio_result = {
                "prediction": predicted_label,
                "confidence": float(np.max(predictions[0])),
                "probabilities": normalized_probs,
                "file_name": uploaded_file.filename
            }
        finally:
            if tmp_file and os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except Exception:
                    pass

    if symptoms:
        if symptoms_model is None:
            return jsonify({"error": "Symptoms model is not loaded."}), 500
        if age is None or sex is None:
            return jsonify({"error": "Age and sex are required for symptom analysis."}), 400
        symptom_result = predict_symptoms(symptoms, age, sex)

    if audio_result and symptom_result:
        final_probs = combine_probabilities(audio_result["probabilities"], symptom_result["probabilities"])
    elif audio_result:
        final_probs = audio_result["probabilities"]
    else:
        final_probs = symptom_result["probabilities"] # type: ignore

    final_prediction = max(final_probs, key=final_probs.get) # type: ignore
    final_confidence = float(final_probs[final_prediction])
    severity = compute_severity(final_prediction, final_confidence, len(symptoms))

    report_doc = {
        "patient_id": str(patient.get("_id")),
        "patientId": patient_human_id,
        "symptoms": symptoms,
        "age": int(float(age)) if age is not None else None,
        "sex": str(sex) if sex is not None else None,
        "audio_prediction": audio_result,
        "symptom_prediction": symptom_result,
        "final_prediction": final_prediction,
        "final_confidence": final_confidence,
        "final_probabilities": final_probs,
        "severity": severity,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    inserted = reports_collection.insert_one(report_doc)
    report_doc["_id"] = inserted.inserted_id

    return jsonify({
        "message": "Diagnosis report created successfully",
        "report_id": str(inserted.inserted_id),
        "report": serialize_report(report_doc)
    }), 201


@app.route('/reports/latest', methods=['GET'])
@jwt_required()
def get_latest_report():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can access reports"}), 403

    user_id = get_jwt_identity()
    report = reports_collection.find_one({"patient_id": user_id}, sort=[("created_at", -1)])
    if not report:
        return jsonify({"error": "No report found"}), 404

    return jsonify(serialize_report(report)), 200


@app.route('/reports/patient', methods=['GET'])
@jwt_required()
def get_patient_reports():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can access reports"}), 403

    user_id = get_jwt_identity()
    reports_cursor = reports_collection.find(
        {"patient_id": user_id},
        sort=[("created_at", -1)]
    )

    reports = [serialize_report(report) for report in reports_cursor]
    return jsonify({"reports": reports, "count": len(reports)}), 200


# configure logging
logging.basicConfig(level=logging.INFO)


# Helper: generate a simple human-readable ID (P0001, D0001)
def generate_human_id(collection, prefix):
    try:
        count = collection.count_documents({}) + 1
    except Exception:
        # fallback in case count fails
        count = 1
    return f"{prefix}{count:04d}"


# -------------------------------
# Collections
# -------------------------------
doctors_collection = mongo.db.doctors
patients_collection = mongo.db.patients
reports_collection = mongo.db.reports
appointments_collection = mongo.db.appointments
medical_records_collection = mongo.db.medical_records
doctor_reviews_collection = mongo.db.doctor_reviews


def serialize_review(review):
    return {
        "id": str(review.get("_id")),
        "doctor_id": review.get("doctor_id"),
        "doctorId": review.get("doctorId"),
        "doctorName": review.get("doctorName", ""),
        "patient_id": review.get("patient_id"),
        "patientId": review.get("patientId", ""),
        "appointment_id": review.get("appointment_id"),
        "rating": review.get("rating", 0),
        "comment": review.get("comment", ""),
        "created_at": review.get("created_at").isoformat() if review.get("created_at") else None,
    }


def get_doctor_review_stats(doctor_id):
    reviews = list(doctor_reviews_collection.find({"doctor_id": doctor_id}).sort("created_at", -1))
    ratings = [float(review.get("rating", 0)) for review in reviews if review.get("rating") is not None]
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    return average_rating, len(reviews), [serialize_review(review) for review in reviews[:5]]


def refresh_doctor_rating(doctor_id):
    average_rating, review_count, recent_reviews = get_doctor_review_stats(doctor_id)
    doctors_collection.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"rating": average_rating, "reviewCount": review_count, "recentReviews": recent_reviews}},
    )
    return average_rating, review_count, recent_reviews


# -------------------------------
# Register
# -------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    required_fields = ["fullName", "email", "password", "confirmPassword",
                       "age", "gender", "height", "weight", "role"]

    for field in required_fields:
        if field not in data or data[field] == "":
            return jsonify({"error": "Please fill all fields"}), 400

    if data["role"] not in ["doctor", "patient"]:
        return jsonify({"error": "Role must be doctor or patient"}), 400

    if data["password"] != data["confirmPassword"]:
        return jsonify({"error": "Passwords do not match"}), 400

    collection = doctors_collection if data["role"] == "doctor" else patients_collection

    if collection.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(data["password"])

    # split full name into first/last name (best-effort)
    full_name = data.get("fullName", "")
    if " " in full_name.strip():
        first_name, last_name = full_name.strip().split(" ", 1)
    else:
        first_name = full_name.strip()
        last_name = ""

    # create human-readable id
    prefix = "D" if data["role"] == "doctor" else "P"
    human_id = generate_human_id(collection, prefix)

    user_data = {
        "fullName": full_name,
        "firstName": first_name,
        "lastName": last_name,
        "email": data["email"],
        "password": hashed_password,
        "age": data["age"],
        "gender": data["gender"],
        "height": data["height"],
        "weight": data["weight"],
        # store human-readable id per role
        ("doctorId" if data["role"] == "doctor" else "patientId"): human_id,

        # New profile fields
        "phone": "",
        "dob": "",
        "address": "",
        "bloodGroup": "",
        "allergies": "",
        "primaryPhysician": "",
        "lastCheckup": "",
        "emergencyContact": "",
        "medicalConditions": "",
        "languages": [],
        "profileImage": "",
        "qualification": "",
        "department": "",
        "hospitals": [],

        "created_at": datetime.utcnow()
    }

    collection.insert_one(user_data)

    return jsonify({"message": "Registration successful", "id": human_id}), 201


# -------------------------------
# Login with JWT
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not email or not password or not role:
        return jsonify({"error": "Provide email, password and role"}), 400

    if role not in ["doctor", "patient"]:
        return jsonify({"error": "Invalid role"}), 400

    collection = doctors_collection if role == "doctor" else patients_collection
    user = collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    if role == "patient":
        human_id = ensure_human_id_for_user(user, patients_collection, "P", "patientId")
        user["patientId"] = human_id
    else:
        human_id = ensure_human_id_for_user(user, doctors_collection, "D", "doctorId")
        user["doctorId"] = human_id

    # Use a string identity (user id) and put other fields into additional claims.
    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={
            "email": user["email"],
            "role": role
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "fullName": user.get("fullName", ""),
            "email": user.get("email", ""),
            "role": role,
            # include human-readable id if present
            "patientId": user.get("patientId") if role == "patient" else None,
            "doctorId": user.get("doctorId") if role == "doctor" else None
        }
    }), 200


# -------------------------------
# Protected Dashboard Route
# -------------------------------
@app.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    # identity is the user id (string); role and email are in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role == "patient":
        total_reports = reports_collection.count_documents({"patient_id": user_id})
        total_appointments = appointments_collection.count_documents({"patient_id": user_id})

        return jsonify({
            "role": role,
            "total_reports": total_reports,
            "total_appointments": total_appointments
        })

    else:
        total_patients = patients_collection.count_documents({})
        pending_appointments = appointments_collection.count_documents({
            "doctor_id": user_id,
            "status": "pending"
        })

        return jsonify({
            "role": role,
            "total_patients": total_patients,
            "pending_appointments": pending_appointments
        })


# -------------------------------
# Doctors endpoints
# -------------------------------


@app.route('/doctors', methods=['GET'])
def list_doctors():
    doctors = []
    for d in doctors_collection.find({}):
        average_rating, review_count, recent_reviews = get_doctor_review_stats(str(d.get("_id")))
        doctors.append({
            "id": str(d.get("_id")),
            "doctorId": d.get("doctorId"),
            "firstName": d.get("firstName"),
            "lastName": d.get("lastName"),
            "fullName": d.get("fullName"),
            "email": d.get("email"),
            "specialization": d.get("specialization", ""),
            "bio": d.get("bio", ""),
            "clinics": d.get("clinics", []),
            "hospitals": d.get("hospitals", []),
            "availableSlots": d.get("availableSlots", []),
            "profileImage": d.get("profileImage", ""),
            "rating": average_rating,
            "reviewCount": review_count,
            "recentReviews": recent_reviews,
            "experience": d.get("experience", ""),
            "qualification": d.get("qualification", ""),
            "department": d.get("department", ""),
            "languages": d.get("languages", [])
        })
    return jsonify(doctors), 200


@app.route('/doctors/<doctor_identifier>', methods=['GET'])
def get_doctor(doctor_identifier):
    # allow either ObjectId or human-readable doctorId
    doctor = None
    try:
        if len(doctor_identifier) == 24:
            doctor = doctors_collection.find_one({"_id": ObjectId(doctor_identifier)})
    except Exception:
        doctor = None

    if not doctor:
        doctor = doctors_collection.find_one({"doctorId": doctor_identifier})

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    doc = {
        "id": str(doctor.get("_id")),
        "doctorId": doctor.get("doctorId"),
        "firstName": doctor.get("firstName"),
        "lastName": doctor.get("lastName"),
        "fullName": doctor.get("fullName"),
        "email": doctor.get("email"),
        "specialization": doctor.get("specialization", ""),
        "bio": doctor.get("bio", ""),
        "clinics": doctor.get("clinics", []),
        "hospitals": doctor.get("hospitals", []),
        "availableSlots": doctor.get("availableSlots", []),
        "profileImage": doctor.get("profileImage", ""),
        "rating": doctor.get("rating", 0),
        "reviewCount": doctor.get("reviewCount", 0),
        "recentReviews": doctor.get("recentReviews", []),
        "experience": doctor.get("experience", ""),
        "qualification": doctor.get("qualification", ""),
        "department": doctor.get("department", ""),
        "languages": doctor.get("languages", [])
    }

    return jsonify(doc), 200


# -------------------------------
# Appointments endpoints
# -------------------------------


@app.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can create appointments"}), 403

    user_id = get_jwt_identity()
    patient = patients_collection.find_one({"_id": ObjectId(user_id)})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json() or {}
    doctor_identifier = data.get("doctorId") or data.get("doctor_id")
    date = data.get("date")
    time = data.get("time")
    notes = data.get("notes", "")
    additional_info = data.get("additionalInfo", "")

    if not doctor_identifier or not date or not time:
        return jsonify({"error": "doctorId, date and time are required"}), 400

    # resolve doctor identifier
    doctor = None
    try:
        if len(doctor_identifier) == 24:
            doctor = doctors_collection.find_one({"_id": ObjectId(doctor_identifier)})
    except Exception:
        doctor = None
    if not doctor:
        doctor = doctors_collection.find_one({"doctorId": doctor_identifier})

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    latest_report = reports_collection.find_one(
        {"patient_id": user_id},
        sort=[("created_at", -1)]
    )

    diagnosis_summary = None
    if latest_report:
        diagnosis_summary = {
            "reportId": str(latest_report.get("_id")) if latest_report.get("_id") else None,
            "final_prediction": latest_report.get("final_prediction", ""),
            "severity": latest_report.get("severity", ""),
            "final_confidence": latest_report.get("final_confidence", 0),
            "created_at": latest_report.get("created_at").isoformat() if latest_report.get("created_at") else None,
            "symptoms": latest_report.get("symptoms", []),
        }

    appt = {
        "patient_id": str(patient.get("_id")),
        "doctor_id": str(doctor.get("_id")),
        "patientName": patient.get("fullName"),
        "doctorName": doctor.get("fullName"),
        "patientId": patient.get("patientId"),
        "doctorId": doctor.get("doctorId"),
        "patientAge": patient.get("age"),
        "patientSex": patient.get("gender") or patient.get("sex") or "",
        "diagnosis_summary": diagnosis_summary,
        "date": date,
        "time": time,
        "notes": notes,
        "additionalInfo": additional_info,
        "status": "pending",
        "reviewed": False,
        "review_rating": None,
        "review_comment": "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    res = appointments_collection.insert_one(appt)

    return jsonify({"message": "Appointment requested", "id": str(res.inserted_id)}), 201


@app.route('/appointments/patient', methods=['GET'])
@jwt_required()
def list_patient_appointments():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can access this"}), 403

    user_id = get_jwt_identity()
    appts = []
    for a in appointments_collection.find({"patient_id": user_id}):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    appts.sort(key=lambda item: item.get("created_at") or datetime.min, reverse=True)

    return jsonify(appts), 200


@app.route('/appointments/doctor', methods=['GET'])
@jwt_required()
def list_doctor_appointments():
    claims = get_jwt()
    role = claims.get("role")
    if role != "doctor":
        return jsonify({"error": "Only doctors can access this"}), 403

    user_id = get_jwt_identity()
    appts = []
    for a in appointments_collection.find({"doctor_id": user_id}):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    appts.sort(key=lambda item: item.get("created_at") or datetime.min, reverse=True)

    return jsonify(appts), 200


@app.route('/appointments/<appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    a = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not a:
        return jsonify({"error": "Appointment not found"}), 404
    a["id"] = str(a.get("_id"))
    return jsonify(a), 200


@app.route('/appointments/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()

    data = request.get_json() or {}
    update_fields = {}
    if data.get("notes") is not None:
        update_fields["notes"] = data.get("notes")
    update_fields["updated_at"] = datetime.utcnow()

    appt = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    # Only the doctor assigned may update appointment status.
    if role == "doctor" and appt.get("doctor_id") != user_id:
        return jsonify({"error": "Not authorized"}), 403
    if role == "patient" and appt.get("patient_id") != user_id:
        return jsonify({"error": "Not authorized"}), 403

    if data.get("status"):
        if role != "doctor":
            return jsonify({"error": "Only the doctor can update appointment status"}), 403
        new_status = data.get("status")
        allowed_statuses = ["pending", "accepted", "rejected", "completed"]
        if new_status not in allowed_statuses:
            return jsonify({"error": "Invalid appointment status"}), 400
        update_fields["status"] = new_status

    if role == "patient" and data.get("notes") is not None:
        update_fields["notes"] = data.get("notes")

    if role == "doctor" and data.get("notes") is None:
        update_fields.pop("notes", None)

    appointments_collection.update_one({"_id": ObjectId(appointment_id)}, {"$set": update_fields})

    return jsonify({"message": "Appointment updated"}), 200


@app.route('/appointments/<appointment_id>/review', methods=['POST'])
@jwt_required()
def review_appointment(appointment_id):
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can review appointments"}), 403

    user_id = get_jwt_identity()
    appt = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    if appt.get("patient_id") != user_id:
        return jsonify({"error": "Not authorized"}), 403

    if appt.get("status") != "completed":
        return jsonify({"error": "You can only review completed appointments"}), 400

    data = request.get_json() or {}
    try:
        rating_value = data.get("rating")
        rating = float(rating_value) if rating_value is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be a number"}), 400

    if rating is None:
        return jsonify({"error": "Rating must be a number"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    comment = (data.get("comment") or "").strip()

    existing_review = doctor_reviews_collection.find_one({"appointment_id": appointment_id, "patient_id": user_id})
    if existing_review:
        doctor_reviews_collection.update_one(
            {"_id": existing_review.get("_id")},
            {"$set": {"rating": rating, "comment": comment, "created_at": datetime.utcnow()}},
        )
    else:
        doctor_reviews_collection.insert_one({
            "doctor_id": appt.get("doctor_id"),
            "doctorId": appt.get("doctorId", ""),
            "doctorName": appt.get("doctorName", ""),
            "patient_id": user_id,
            "patientId": appt.get("patientId", ""),
            "appointment_id": appointment_id,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.utcnow(),
        })

    appointments_collection.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"reviewed": True, "review_rating": rating, "review_comment": comment, "updated_at": datetime.utcnow()}},
    )

    refresh_doctor_rating(appt.get("doctor_id"))

    return jsonify({"message": "Review saved successfully"}), 200


# -------------------------------
# Doctor profile (own account) endpoints
# -------------------------------


@app.route('/api/doctors/profile', methods=['GET'])
@app.route('/doctor/profile', methods=['GET'])
@jwt_required()
def get_doctor_profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if role != 'doctor':
        return jsonify({'error': 'Only doctors can access this profile'}), 403

    doctor = doctors_collection.find_one({'_id': ObjectId(user_id)})
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    profile = {
        'id': str(doctor.get('_id')),
        'doctorId': doctor.get('doctorId') or str(doctor.get('_id')),
        'firstName': doctor.get('firstName', ''),
        'lastName': doctor.get('lastName', ''),
        'fullName': doctor.get('fullName', ''),
        'email': doctor.get('email', ''),
        'specialization': doctor.get('specialization', ''),
        'bio': doctor.get('bio', ''),
        'clinics': doctor.get('clinics', []),
        'availableSlots': doctor.get('availableSlots', []),
        'phone': doctor.get('phone', ''),
        'dob': doctor.get('dob', ''),
        'address': doctor.get('address', ''),
        'experience': doctor.get('experience', ''),
        'rating': doctor.get('rating', 0),
        'qualification': doctor.get('qualification', ''),
        'department': doctor.get('department', ''),
        'languages': doctor.get('languages', []),
        'hospitals': doctor.get('hospitals', []),
        'profileImage': doctor.get('profileImage', '')
    }
    return jsonify(profile), 200


@app.route('/api/doctors/profile', methods=['PUT'])
@app.route('/doctor/profile', methods=['PUT'])
@jwt_required()
def update_doctor_profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if role != 'doctor':
        return jsonify({'error': 'Only doctors can update profile'}), 403

    data = request.get_json() or {}
    update_fields = {}
    # allow updates to common fields
    for field in ['firstName', 'lastName', 'fullName', 'specialization', 'bio', 'phone', 'dob', 'address', 'experience', 'rating', 'qualification', 'department', 'profileImage']:
        if field in data:
            update_fields[field] = data.get(field)

    # clinics and availableSlots expected as arrays
    if 'clinics' in data:
        update_fields['clinics'] = data.get('clinics')
    if 'availableSlots' in data:
        update_fields['availableSlots'] = data.get('availableSlots')
    if 'languages' in data:
        update_fields['languages'] = data.get('languages')
    if 'hospitals' in data:
        update_fields['hospitals'] = data.get('hospitals')

    if update_fields:
        doctors_collection.update_one({'_id': ObjectId(user_id)}, {'$set': update_fields})

    return jsonify({'message': 'Doctor profile updated successfully'}), 200



# -------------------------------
# Get Patient Profile
# -------------------------------
# Compatibility routes for frontend which expects /api/users/profile
@app.route('/api/users/profile', methods=['GET'])
@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():

    # identity is the user id (string); role is stored in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "patient":
        return jsonify({"error": "Only patients can access this profile"}), 403

    patient = patients_collection.find_one({"_id": ObjectId(user_id)})

    if not patient:
        return jsonify({"error": "User not found"}), 404

    # best-effort: support both legacy fullName and newer firstName/lastName
    first_name = patient.get("firstName") or (patient.get("fullName", "").split(" ", 1)[0] if patient.get("fullName") else "")
    last_name = patient.get("lastName") or (patient.get("fullName", "").split(" ", 1)[1] if (patient.get("fullName") and " " in patient.get("fullName")) else "")

    patient_human_id = ensure_human_id_for_user(patient, patients_collection, "P", "patientId")
    latest_report = reports_collection.find_one({"patient_id": user_id}, sort=[("created_at", -1)])

    current_condition = patient.get("medicalConditions", "")
    if not current_condition and latest_report:
        current_condition = str(latest_report.get("final_prediction", "")).replace("_", " ").title()

    last_checkup = patient.get("lastCheckup", "")
    if (not last_checkup) and latest_report and latest_report.get("created_at"):
        try:
            last_checkup = latest_report.get("created_at").date().isoformat()
        except Exception:
            last_checkup = ""

    profile_data = {
        "id": str(patient["_id"]),
        "patientId": patient_human_id,
        "firstName": first_name,
        "lastName": last_name,
        "fullName": patient.get("fullName", ""),
        "email": patient.get("email", ""),
        "age": patient.get("age", ""),
        "gender": patient.get("gender", ""),
        "height": patient.get("height", ""),
        "weight": patient.get("weight", ""),
        "phone": patient.get("phone", ""),
        "dob": patient.get("dob", ""),
        "address": patient.get("address", ""),
        "bloodGroup": patient.get("bloodGroup", ""),
        "allergies": patient.get("allergies", ""),
        "primaryPhysician": patient.get("primaryPhysician", ""),
        "lastCheckup": last_checkup,
        "emergencyContact": patient.get("emergencyContact", ""),
        "medicalConditions": patient.get("medicalConditions", ""),
        "currentMedicalCondition": current_condition,
        "lastDiagnosisDate": latest_report.get("created_at").isoformat() if latest_report and latest_report.get("created_at") else None,
        "languages": patient.get("languages", []),
        "profileImage": patient.get("profileImage", "")
    }


    return jsonify(profile_data), 200


# -------------------------------
# Update Patient Profile
# -------------------------------
# Compatibility routes for frontend which expects /api/users/profile
@app.route('/api/users/profile', methods=['PUT'])
@app.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():

    # identity is the user id (string); role is stored in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "patient":
        return jsonify({"error": "Only patients can update profile"}), 403

    data = request.get_json()

    # allow updating firstName/lastName and keep fullName for backward compatibility
    update_fields = {}
    if data.get("firstName") is not None:
        update_fields["firstName"] = data.get("firstName")
    if data.get("lastName") is not None:
        update_fields["lastName"] = data.get("lastName")
    # update fullName if provided, otherwise reconstruct from names
    if data.get("fullName"):
        update_fields["fullName"] = data.get("fullName")
    else:
        fn = data.get("firstName")
        ln = data.get("lastName")
        if fn or ln:
            update_fields["fullName"] = " ".join([p for p in [fn, ln] if p])

    for field in ["age", "gender", "height", "weight"]:
        if data.get(field) is not None:
            update_fields[field] = data.get(field)

    # other profile fields
    for field in ["phone", "dob", "address", "bloodGroup", "allergies", "primaryPhysician", "lastCheckup", "emergencyContact", "medicalConditions", "profileImage"]:
        if field in data:
            update_fields[field] = data.get(field)

    if "languages" in data:
        update_fields["languages"] = data.get("languages")

    if update_fields:
        patients_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )

    return jsonify({"message": "Profile updated successfully"}), 200


# -------------------------------
# Chatbot Endpoint - Lung Disease Care Assistant
# -------------------------------
@app.route('/chatbot/ask', methods=['POST'])
@jwt_required()
def chatbot_ask():
    """
    Chatbot endpoint that uses Hugging Face inference to provide lung disease-specific responses.
    
    Expected JSON payload:
    {
        "message": "User's question",
        "include_context": true/false (optional, default: true)
    }
    """
    try:
        trace_id = str(uuid.uuid4())[:8]
        # Get authenticated user
        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get("role")
        
        # Only patients can use chatbot
        if role != "patient":
            return jsonify({"error": "Only patients can use the chatbot"}), 403
        
        # Get request data
        data = request.get_json() or {}
        user_message = (data.get("message") or "").strip()
        include_context = data.get("include_context", True)
        chat_history = data.get("chat_history", [])
        logging.info(
            f"[chatbot:{trace_id}] Incoming request role={role} "
            f"message_len={len(user_message)} history_len={len(chat_history) if isinstance(chat_history, list) else 0}"
        )
        
        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Get patient's latest diagnosis report for context
        context = ""
        latest_report = None
        if include_context:
            try:
                patient = patients_collection.find_one({"_id": ObjectId(user_id)})
                if patient:
                    latest_report = reports_collection.find_one(
                        {"patient_id": str(patient.get("_id"))},
                        sort=[("created_at", -1)]
                    )
                    
                    if latest_report:
                        symptoms_list = latest_report.get("symptoms", [])
                        age = latest_report.get("age")
                        sex = latest_report.get("sex")
                        diagnosis = latest_report.get("final_prediction", "Unknown")
                        confidence = latest_report.get("final_confidence", 0)
                        severity = latest_report.get("severity", "Unknown")
                        
                        context = f"""
PATIENT CONTEXT (for personalized response):
- Age: {age}
- Sex: {sex}
- Reported Symptoms: {', '.join(symptoms_list) if symptoms_list else 'None reported'}
- Latest Diagnosis: {diagnosis} (Confidence: {confidence:.2%})
- Severity Level: {severity}

Please provide a response tailored to this patient's condition and history.
"""
            except Exception as e:
                logging.warning(f"Could not fetch patient context: {e}")
                context = ""

        report_summary = build_report_summary(latest_report)
        full_message = build_lung_care_prompt(user_message, context, chat_history)
        response_source = "fallback"
        response_model = None

        try:
            ai_response, response_model = generate_hf_response(full_message, trace_id=trace_id)
        except Exception as hf_error:
            logging.warning(f"[chatbot:{trace_id}] Hugging Face chatbot call failed: {hf_error}")
            ai_response = ""
            response_model = None

        if not ai_response:
            ai_response = fallback_lung_response(user_message, report_summary, chat_history)
            logging.info(f"[chatbot:{trace_id}] Responded via fallback")
        else:
            response_source = "model"
            logging.info(f"[chatbot:{trace_id}] Responded via model model={response_model}")
        
        return jsonify({
            "response": ai_response,
            "success": True,
            "source": response_source,
            "model": response_model,
            "trace_id": trace_id
        }), 200
        
    except Exception as e:
        logging.error(f"Chatbot error: {str(e)}")
        return jsonify({
            "error": f"Failed to process chatbot request: {str(e)}",
            "success": False
        }), 500


# Run App
if __name__ == '__main__':
    # Log registered routes for debugging
    for rule in app.url_map.iter_rules():
        logging.info(f"Route: {rule} -> methods={','.join(sorted(rule.methods))}") # type: ignore

    app.run(debug=True, port=5000)


@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ok", "service": "BreatheWell API"}), 200

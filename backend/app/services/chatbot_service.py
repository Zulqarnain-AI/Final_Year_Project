import json
import os
from datetime import datetime

import requests
from bson import ObjectId  # type: ignore

from app.repositories.chatbot_repository import (
    append_messages,
    find_user_conversation_by_id,
    find_user_conversations,
    insert_conversation,
    update_conversation_fields,
)
from app.repositories.patient_repository import find_patient_by_id
from app.repositories.report_repository import find_latest_report_for_patient


GROQ_API_URL = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
WEATHER_API_BASE = os.environ.get("WEATHER_API_BASE", "http://api.weatherapi.com/v1/current.json")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "b22130263a3a449a8d0155902251312")

PRIMARY_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

SYSTEM_PROMPT_TEMPLATE = """
You are the BreatheWell AI Assistant, a specialized medical companion for respiratory health.
Your knowledge is EXCLUSIVELY limited to lung diseases (Asthma, COPD, Bronchitis, Pneumonia, etc.).

STRICT RULES:
1. TOPIC FILTER: If the user asks about anything NOT related to lung health (e.g., sports, cooking, general coding, other diseases), you must reply: "I am specialized only in respiratory health and lung disease assistance. I cannot provide information on other topics."
2. PERSONALIZATION: You have access to the user's data. Always address them by name and reference their 'Last AI Diagnosis' and local 'Environmental Data' (AQI, Humidity) when giving advice.
3. SAFETY: Always include a disclaimer that you are an AI, not a doctor, especially when suggesting care steps.

USER CONTEXT:
- Name: {user_name}
- Last Diagnosis: {last_report}
- Local Weather: {weather_temp}°C, {weather_humidity}% humidity
- Air Quality Index (AQI): {weather_aqi}
""".strip()


def _safe_text(value, fallback=""):
    if value is None:
        return fallback
    text = str(value).strip()
    return text or fallback


def _extract_user_name(patient):
    full_name = _safe_text(patient.get("fullName"))
    if full_name:
        return full_name
    first_name = _safe_text(patient.get("firstName"))
    last_name = _safe_text(patient.get("lastName"))
    combined = " ".join(part for part in [first_name, last_name] if part).strip()
    return combined or "there"


def _format_last_report(report):
    if not report:
        return "No previous diagnosis report is available."

    created_at = report.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    report_summary = {
        "final_prediction": report.get("final_prediction"),
        "severity": report.get("severity"),
        "confidence": report.get("final_confidence"),
        "symptoms": report.get("symptoms", []),
        "created_at": created_at,
    }
    return json.dumps(report_summary, default=str, ensure_ascii=False)


def _resolve_city(payload, patient):
    for source in [
        payload.get("city"),
        payload.get("current_city"),
        patient.get("city"),
        patient.get("currentCity"),
        patient.get("address"),
    ]:
        city = _safe_text(source)
        if city:
            return city
    return "auto:ip"


def _fetch_weather_snapshot(city):
    normalized_city = _safe_text(city, "auto:ip")
    api_url = f"{WEATHER_API_BASE}?key={WEATHER_API_KEY}&q={requests.utils.quote(normalized_city)}&aqi=yes"

    response = requests.get(api_url, timeout=12)
    payload = response.json()

    if not response.ok:
        message = payload.get("error", {}).get("message") if isinstance(payload, dict) else None
        raise RuntimeError(message or "Unable to fetch environmental data")

    current = payload.get("current", {}) if isinstance(payload, dict) else {}
    location = payload.get("location", {}) if isinstance(payload, dict) else {}
    air_quality = current.get("air_quality", {}) if isinstance(current, dict) else {}

    return {
        "city": location.get("name") or normalized_city,
        "temp": current.get("temp_c"),
        "humidity": current.get("humidity"),
        "air_quality_index": air_quality.get("us-epa-index") or air_quality.get("aqi"),
    }


def _build_system_prompt(user_name, last_report, weather):
    return SYSTEM_PROMPT_TEMPLATE.format(
        user_name=user_name,
        last_report=last_report,
        weather_temp=_safe_text(weather.get("temp"), "unknown"),
        weather_humidity=_safe_text(weather.get("humidity"), "unknown"),
        weather_aqi=_safe_text(weather.get("air_quality_index"), "unknown"),
    )


def _build_messages(system_prompt, chat_history, user_message):
    messages = [{"role": "system", "content": system_prompt}]

    history_items = chat_history if isinstance(chat_history, list) else []
    for item in history_items[-10:]:
        role = "assistant" if _safe_text(item.get("type")) == "ai" else "user"
        text = _safe_text(item.get("text"))
        if text:
            messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": _safe_text(user_message)})
    return messages


def _build_messages_from_conversation(system_prompt, conversation_messages, user_message):
    messages = [{"role": "system", "content": system_prompt}]

    items = conversation_messages if isinstance(conversation_messages, list) else []
    for item in items[-10:]:
        role = _safe_text(item.get("role"), "user")
        if role not in ["assistant", "user"]:
            role = "user"
        text = _safe_text(item.get("content"))
        if text:
            messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": _safe_text(user_message)})
    return messages


def _build_conversation_title(message):
    words = _safe_text(message).split()
    if not words:
        return "New Chat"
    title = " ".join(words[:8])
    if len(words) > 8:
        title += "..."
    return title


def _serialize_message(message):
    created_at = message.get("created_at")
    created_at_iso = created_at.isoformat() if isinstance(created_at, datetime) else None
    return {
        "id": str(message.get("id") or ""),
        "role": _safe_text(message.get("role"), "user"),
        "content": _safe_text(message.get("content")),
        "created_at": created_at_iso,
    }


def _serialize_conversation_summary(doc):
    updated_at = doc.get("updated_at")
    created_at = doc.get("created_at")
    updated_at_iso = updated_at.isoformat() if isinstance(updated_at, datetime) else None
    created_at_iso = created_at.isoformat() if isinstance(created_at, datetime) else None
    return {
        "id": str(doc.get("_id")),
        "title": _safe_text(doc.get("title"), "New Chat"),
        "message_count": len(doc.get("messages", [])),
        "created_at": created_at_iso,
        "updated_at": updated_at_iso,
    }


def _serialize_conversation_detail(doc):
    payload = _serialize_conversation_summary(doc)
    payload["messages"] = [_serialize_message(item) for item in doc.get("messages", [])]
    return payload


def _call_groq(messages, model):
    api_key = (os.environ.get("GROQ_API_KEY") or GROQ_API_KEY or "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    response = requests.post(
        GROQ_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.3,
        },
        timeout=45,
    )

    payload = response.json()
    if not response.ok:
        error_message = payload.get("error", {}).get("message") if isinstance(payload, dict) else None
        raise RuntimeError(error_message or f"Groq request failed for {model}")

    content = ""
    if isinstance(payload, dict):
        choices = payload.get("choices") or []
        if choices:
            message = choices[0].get("message") or {}
            content = (message.get("content") or "").strip()

    if not content:
        raise RuntimeError(f"Groq returned an empty response for {model}")

    return content


def ask_breathewell_chatbot(user_id, payload):
    payload = payload or {}
    user_message = _safe_text(payload.get("message"))
    if not user_message:
        return {"success": False, "error": "Message cannot be empty"}, 400

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return {"success": False, "error": "Invalid user id"}, 400

    patient = find_patient_by_id(user_object_id)
    if not patient:
        return {"success": False, "error": "Patient not found"}, 404

    user_name = _extract_user_name(patient)
    latest_report = find_latest_report_for_patient(user_id)
    last_report = _format_last_report(latest_report)
    city = _resolve_city(payload, patient)

    conversation = None
    conversation_id = _safe_text(payload.get("conversation_id"))
    if conversation_id:
        try:
            conversation = find_user_conversation_by_id(ObjectId(conversation_id), user_id)
        except Exception:
            return {"success": False, "error": "Invalid conversation id"}, 400

        if not conversation:
            return {"success": False, "error": "Conversation not found"}, 404
    else:
        now = datetime.utcnow()
        conversation_doc = {
            "user_id": user_id,
            "title": _build_conversation_title(user_message),
            "messages": [],
            "created_at": now,
            "updated_at": now,
        }
        inserted = insert_conversation(conversation_doc)
        conversation_doc["_id"] = inserted.inserted_id
        conversation = conversation_doc

    try:
        weather = _fetch_weather_snapshot(city)
    except Exception as exc:
        weather = {
            "city": city,
            "temp": None,
            "humidity": None,
            "air_quality_index": None,
            "weather_error": str(exc),
        }

    context_payload = {
        "user_profile": {
            "name": user_name,
            "last_diagnosis_report": last_report,
        },
        "environmental_data": weather,
        "requested_at": datetime.utcnow().isoformat(),
    }

    system_prompt = _build_system_prompt(user_name, last_report, weather)
    stored_messages = conversation.get("messages", []) if conversation else []
    if stored_messages:
        messages = _build_messages_from_conversation(system_prompt, stored_messages, user_message)
    else:
        messages = _build_messages(system_prompt, payload.get("chat_history", []), user_message)

    last_error = None
    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            assistant_message = _call_groq(messages, model)

            now = datetime.utcnow()
            persisted_messages = [
                {
                    "id": str(ObjectId()),
                    "role": "user",
                    "content": user_message,
                    "created_at": now,
                },
                {
                    "id": str(ObjectId()),
                    "role": "assistant",
                    "content": assistant_message,
                    "created_at": now,
                },
            ]
            append_messages(conversation.get("_id"), persisted_messages, now)
            update_conversation_fields(
                conversation.get("_id"),
                {
                    "model_last_used": model,
                    "context_last": context_payload,
                },
            )

            return {
                "success": True,
                "response": assistant_message,
                "model_used": model,
                "context": context_payload,
                "conversation_id": str(conversation.get("_id")),
            }, 200
        except Exception as exc:
            last_error = exc

    return {"success": False, "error": f"Unable to generate a response: {last_error}"}, 502


def list_breathewell_conversations(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return {"success": False, "error": "Invalid user id"}, 400

    patient = find_patient_by_id(user_object_id)
    if not patient:
        return {"success": False, "error": "Patient not found"}, 404

    items = [_serialize_conversation_summary(doc) for doc in find_user_conversations(user_id)]
    return {"success": True, "conversations": items}, 200


def get_breathewell_conversation(user_id, conversation_id):
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return {"success": False, "error": "Invalid user id"}, 400

    patient = find_patient_by_id(user_object_id)
    if not patient:
        return {"success": False, "error": "Patient not found"}, 404

    try:
        conversation = find_user_conversation_by_id(ObjectId(conversation_id), user_id)
    except Exception:
        return {"success": False, "error": "Invalid conversation id"}, 400

    if not conversation:
        return {"success": False, "error": "Conversation not found"}, 404

    return {"success": True, "conversation": _serialize_conversation_detail(conversation)}, 200

import json
import os
import re
from datetime import datetime

import requests
from bson import ObjectId  # type: ignore

from app.repositories.patient_repository import find_patient_by_id
from app.repositories.report_repository import find_latest_report_for_patient
from app.utils.serializers import serialize_report


GROQ_API_URL = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
WEATHER_API_BASE = os.environ.get("WEATHER_API_BASE", "http://api.weatherapi.com/v1/current.json")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "b22130263a3a449a8d0155902251312")

PRIMARY_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

CONDITION_HINTS = {
    "asthma": {
        "home": ["Keep rescue inhaler nearby.", "Avoid smoke, dust, and strong fragrances.", "Use warm steam or humidified air when the airway feels tight."],
        "activity": ["Do light breathing exercises for 10 minutes.", "Take short indoor walks if breathing is stable.", "Track any wheeze or chest tightness."],
        "environment": ["Limit time outdoors when AQI is elevated.", "Keep windows closed during pollution peaks.", "Use a mask in dusty or smoky spaces."],
        "follow_up": "Review symptoms if wheeze, chest tightness, or breathlessness increases.",
    },
    "copd": {
        "home": ["Practice pursed-lip breathing.", "Stay hydrated throughout the day.", "Avoid smoke and chemical fumes."],
        "activity": ["Walk slowly for 10 to 15 minutes if comfortable.", "Pause often and avoid overexertion.", "Monitor any change in breathing effort."],
        "environment": ["Stay indoors when air quality is poor.", "Avoid outdoor activity near traffic and industrial areas.", "Use clean indoor air when possible."],
        "follow_up": "Seek medical review if breathlessness becomes more frequent or severe.",
    },
    "bronchial": {
        "home": ["Drink warm fluids regularly.", "Use humidified air at home.", "Rest the voice and avoid throat irritants."],
        "activity": ["Do gentle stretching for 10 minutes.", "Avoid cold outdoor exposure.", "Track cough frequency and chest irritation."],
        "environment": ["Stay away from dust, smoke, and strong odors.", "Prefer indoor activity during bad air quality.", "Keep rooms well-ventilated but not exposed to polluted air."],
        "follow_up": "Get medical attention if cough worsens or fever persists.",
    },
    "pneumonia": {
        "home": ["Take adequate rest.", "Complete prescribed medicine exactly as directed.", "Drink warm fluids and maintain hydration."],
        "activity": ["Take short indoor walks only if comfortable.", "Do deep breathing every few hours.", "Monitor fever and chest pain carefully."],
        "environment": ["Avoid outdoor exposure during recovery.", "Keep the room comfortable and not too cold.", "Avoid smoke and stale air."],
        "follow_up": "Urgent review is recommended if shortness of breath or chest pain persists.",
    },
    "healthy": {
        "home": ["Maintain hydration.", "Keep a balanced diet.", "Sleep at least 7 to 8 hours."],
        "activity": ["Do a 20-minute walk.", "Practice daily breathing exercises.", "Maintain indoor air quality."],
        "environment": ["Avoid heavy pollution exposure when possible.", "Monitor AQI on poor-air days.", "Keep your living space clean and ventilated."],
        "follow_up": "Continue preventive respiratory care and watch for new symptoms.",
    },
}

SYSTEM_PROMPT = """
You are BreatheWell's respiratory care-plan generator.

Return only valid JSON. Do not add markdown, bullet points outside JSON, or explanatory text.

Generate a practical care plan using the patient's latest symptoms, diagnosis, severity, and environmental data.
Keep the guidance specific, concise, and safe. Never claim to be a doctor.

JSON schema:
{
  "title": "string",
  "summary": "string",
  "priority": "string",
  "condition_focus": "string",
  "home_care": [{"title": "string", "detail": "string"}],
  "daily_activities": [{"title": "string", "detail": "string"}],
  "environmental_guidance": [{"title": "string", "detail": "string"}],
  "warning_signs": ["string"],
  "follow_up": "string",
  "questions_for_doctor": ["string"],
  "disclaimer": "string"
}

Prefer short titles and detailed, patient-friendly advice that reflects the respiratory condition.
""".strip()


def _safe_text(value, fallback=""):
    if value is None:
        return fallback
    text = str(value).strip()
    return text or fallback


def _normalize_condition(value):
    normalized = _safe_text(value, "healthy").lower().replace(" ", "_")
    if normalized in CONDITION_HINTS:
        return normalized
    return "healthy"


def _extract_user_name(patient):
    full_name = _safe_text(patient.get("fullName"))
    if full_name:
        return full_name
    first_name = _safe_text(patient.get("firstName"))
    last_name = _safe_text(patient.get("lastName"))
    combined = " ".join(part for part in [first_name, last_name] if part).strip()
    return combined or "there"


def _resolve_city(patient):
    for source in [patient.get("city"), patient.get("currentCity"), patient.get("address")]:
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


def _report_summary(report):
    created_at = report.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    return {
        "final_prediction": report.get("final_prediction"),
        "severity": report.get("severity"),
        "confidence": report.get("final_confidence"),
        "symptoms": report.get("symptoms", []),
        "created_at": created_at,
    }


def _build_context_payload(patient, report, weather):
    return {
        "patient_name": _extract_user_name(patient),
        "condition": _normalize_condition(report.get("final_prediction")),
        "severity": _safe_text(report.get("severity"), "Moderate"),
        "confidence": report.get("final_confidence"),
        "symptoms": report.get("symptoms", []),
        "environment": weather,
    }


def _build_messages(context_payload):
    user_prompt = {
        "patient_name": context_payload["patient_name"],
        "condition": context_payload["condition"],
        "severity": context_payload["severity"],
        "confidence": context_payload["confidence"],
        "symptoms": context_payload["symptoms"],
        "environment": context_payload["environment"],
    }

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": json.dumps(user_prompt, ensure_ascii=False),
        },
    ]


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
            "temperature": 0.25,
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


def _extract_json_object(content):
    text = _safe_text(content)
    if not text:
        return None

    raw = text
    if "```" in raw:
        fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.S | re.I)
        if fenced:
            raw = fenced.group(1)

    if not raw.startswith("{"):
        match = re.search(r"\{.*\}", raw, re.S)
        if match:
            raw = match.group(0)

    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def _build_fallback_plan(context_payload):
    condition = context_payload["condition"]
    hints = CONDITION_HINTS.get(condition, CONDITION_HINTS["healthy"])
    weather = context_payload["environment"]
    aqi = _safe_text(weather.get("air_quality_index"), "unknown")
    humidity = weather.get("humidity")
    temp = weather.get("temp")

    environmental_guidance = [
        {"title": "Air quality", "detail": f"Keep outdoor exposure low when AQI is elevated. Current AQI: {aqi}."},
        {"title": "Humidity", "detail": f"Adjust your indoor airflow if humidity feels uncomfortable. Current humidity: {humidity if humidity is not None else 'unknown'}%."},
        {"title": "Temperature", "detail": f"Use breathable clothing and warm fluids if the temperature feels harsh. Current temperature: {temp if temp is not None else 'unknown'}°C."},
    ]

    return {
        "title": "Personalized respiratory care plan",
        "summary": f"Generated from your latest {condition.replace('_', ' ')} report, symptoms, and current environmental conditions.",
        "priority": "Moderate",
        "condition_focus": f"Focus on managing {condition.replace('_', ' ')} symptoms and reducing trigger exposure.",
        "home_care": [
            {"title": item, "detail": ""} for item in hints["home"]
        ],
        "daily_activities": [
            {"title": item, "detail": ""} for item in hints["activity"]
        ],
        "environmental_guidance": environmental_guidance + [
            {"title": "Avoid triggers", "detail": "Limit smoke, dust, and strong fragrances in your surroundings."},
        ],
        "warning_signs": [
            "Shortness of breath that gets worse",
            "Chest pain or persistent wheeze",
            "Fever that does not settle",
        ],
        "follow_up": hints["follow_up"],
        "questions_for_doctor": [
            "Do I need any medication changes based on my current symptoms?",
            "Should I limit outdoor activity until my breathing improves?",
            "What warning signs mean I should seek urgent care?",
        ],
        "disclaimer": "This plan is AI-generated and should support, not replace, medical advice from a qualified clinician.",
    }


def _normalize_plan_payload(payload, context_payload):
    plan = _build_fallback_plan(context_payload)

    if isinstance(payload, dict):
        plan.update({k: payload.get(k, plan.get(k)) for k in [
            "title",
            "summary",
            "priority",
            "condition_focus",
            "follow_up",
            "disclaimer",
        ]})

        for section in ["home_care", "daily_activities", "environmental_guidance"]:
            items = payload.get(section)
            if isinstance(items, list) and items:
                normalized_items = []
                for index, item in enumerate(items[:6]):
                    if isinstance(item, dict):
                        title = _safe_text(item.get("title"))
                        detail = _safe_text(item.get("detail"))
                    else:
                        title = _safe_text(item)
                        detail = ""
                    if title:
                        normalized_items.append({
                            "id": f"{section}_{index + 1}",
                            "title": title,
                            "detail": detail,
                        })
                if normalized_items:
                    plan[section] = normalized_items

        if isinstance(payload.get("warning_signs"), list) and payload.get("warning_signs"):
            plan["warning_signs"] = [
                _safe_text(item) for item in payload.get("warning_signs")[:6] if _safe_text(item)
            ]

        if isinstance(payload.get("questions_for_doctor"), list) and payload.get("questions_for_doctor"):
            plan["questions_for_doctor"] = [
                _safe_text(item) for item in payload.get("questions_for_doctor")[:6] if _safe_text(item)
            ]

    for section in ["home_care", "daily_activities", "environmental_guidance"]:
        normalized_items = []
        for index, item in enumerate(plan.get(section, [])):
            if isinstance(item, dict):
                title = _safe_text(item.get("title"))
                detail = _safe_text(item.get("detail"))
            else:
                title = _safe_text(item)
                detail = ""
            if title:
                normalized_items.append({
                    "id": f"{section}_{index + 1}",
                    "title": title,
                    "detail": detail,
                })
        plan[section] = normalized_items

    return plan


def generate_latest_care_plan(user_id):
    try:
        patient = find_patient_by_id(ObjectId(user_id))
    except Exception:
        return {"error": "Invalid user id"}, 400

    if not patient:
        return {"error": "Patient not found"}, 404

    latest_report = find_latest_report_for_patient(user_id)
    if not latest_report:
        return {"error": "No diagnosis report found. Complete a diagnosis first."}, 404

    city = _resolve_city(patient)
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

    context_payload = _build_context_payload(patient, _report_summary(latest_report), weather)
    messages = _build_messages(context_payload)

    raw_response = ""
    provider = "fallback"
    last_error = None
    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            raw_response = _call_groq(messages, model)
            provider = model
            last_error = None
            break
        except Exception as exc:
            last_error = exc

    parsed_payload = _extract_json_object(raw_response)
    if parsed_payload is None:
        parsed_payload = {}

    plan = _normalize_plan_payload(parsed_payload, context_payload)

    return {
        "success": True,
        "generated_by": provider,
        "generated_at": datetime.utcnow().isoformat(),
        "patient": {
            "id": str(patient.get("_id")),
            "patientId": patient.get("patientId"),
            "name": _extract_user_name(patient),
            "address": patient.get("address", ""),
        },
        "report": serialize_report(latest_report),
        "environmental_data": weather,
        "care_plan": plan,
        "context": context_payload,
        "warning": None if provider != "fallback" else _safe_text(last_error, "Generated using fallback guidance."),
    }, 200

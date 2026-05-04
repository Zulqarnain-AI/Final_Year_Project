import logging
import uuid

from bson import ObjectId  # type: ignore

from app.chatbot.fallback import fallback_lung_response
from app.chatbot.hf_client import generate_hf_response
from app.chatbot.prompts import build_lung_care_prompt
from app.chatbot.utils import build_report_summary
from app.repositories.patient_repository import find_patient_by_id
from app.repositories.report_repository import find_latest_report_for_patient


def ask_chatbot(user_id, role, data):
    trace_id = str(uuid.uuid4())[:8]
    if role != "patient":
        return {"error": "Only patients can use the chatbot"}, 403

    user_message = (data.get("message") or "").strip()
    include_context = data.get("include_context", True)
    chat_history = data.get("chat_history", [])

    logging.info(
        f"[chatbot:{trace_id}] Incoming request role={role} "
        f"message_len={len(user_message)} history_len={len(chat_history) if isinstance(chat_history, list) else 0}"
    )

    if not user_message:
        return {"error": "Message cannot be empty"}, 400

    context = ""
    latest_report = None
    if include_context:
        try:
            patient = find_patient_by_id(ObjectId(user_id))
            if patient:
                latest_report = find_latest_report_for_patient(str(patient.get("_id")))
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

    return {
        "response": ai_response,
        "success": True,
        "source": response_source,
        "model": response_model,
        "trace_id": trace_id,
    }, 200
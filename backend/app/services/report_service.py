from datetime import datetime

from bson import ObjectId  # type: ignore

from app.ml.inference import build_final_diagnosis, predict_symptoms
from app.repositories.patient_repository import find_patient_by_id, get_collection as get_patients_collection
from app.repositories.report_repository import find_latest_report_for_patient, find_reports_for_patient, insert_report
from app.services.audio_service import predict_audio_from_upload
from app.utils.ids import ensure_human_id_for_user
from app.utils.serializers import serialize_report
from app.utils.validators import is_supported_audio_filename, parse_symptoms_value


def create_diagnosis_report(user_id, patient, form_data, uploaded_file):
    symptoms = parse_symptoms_value(form_data.get("symptoms", "[]"))
    age = form_data.get("age") or patient.get("age")
    sex = form_data.get("sex") or patient.get("gender")

    if not symptoms and not uploaded_file:
        return {"error": "Provide at least symptoms or an audio file."}, 400

    audio_result = None
    symptom_result = None

    if uploaded_file is not None:
        if not is_supported_audio_filename(uploaded_file.filename):
            return {"error": "Unsupported audio format."}, 400

        audio_result_payload, status = predict_audio_from_upload(uploaded_file)
        if status != 200:
            return audio_result_payload, status
        audio_result = audio_result_payload
        if audio_result and isinstance(audio_result, dict):
            audio_result["file_name"] = uploaded_file.filename

    if symptoms:
        if age is None or sex is None:
            return {"error": "Age and sex are required for symptom analysis."}, 400
        symptom_result = predict_symptoms(symptoms, age, sex)

    if audio_result and symptom_result:
        final_prediction, final_confidence, final_probs, severity = build_final_diagnosis(audio_result, symptom_result, symptoms)
    elif audio_result:
        final_prediction, final_confidence, final_probs, severity = build_final_diagnosis(audio_result, None, symptoms)
    else:
        final_prediction, final_confidence, final_probs, severity = build_final_diagnosis(None, symptom_result, symptoms)

    patient_human_id = ensure_human_id_for_user(patient, get_patients_collection(), "P", "patientId")

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
        "updated_at": datetime.utcnow(),
    }

    inserted = insert_report(report_doc)
    report_doc["_id"] = inserted.inserted_id

    return {
        "message": "Diagnosis report created successfully",
        "report_id": str(inserted.inserted_id),
        "report": serialize_report(report_doc),
    }, 201


def get_latest_report(user_id):
    report = find_latest_report_for_patient(user_id)
    if not report:
        return {"error": "No report found"}, 404
    return serialize_report(report), 200


def get_patient_reports(user_id):
    reports = [serialize_report(report) for report in find_reports_for_patient(user_id)]
    return {"reports": reports, "count": len(reports)}, 200
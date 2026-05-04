from bson import ObjectId  # type: ignore

from app.repositories.patient_repository import get_collection as get_patient_collection, find_patient_by_object_id
from app.repositories.report_repository import update_report_fields
from app.utils.ids import ensure_human_id_for_user


def resolve_patient_human_id(report_doc):
    existing = report_doc.get("patientId")
    if existing:
        return existing

    patient_object_id = report_doc.get("patient_id")
    if not patient_object_id:
        return None

    patient = None
    try:
        patient = find_patient_by_object_id(ObjectId(patient_object_id))
    except Exception:
        patient = None

    if not patient:
        return None

    patient_id = ensure_human_id_for_user(patient, get_patient_collection(), "P", "patientId")

    try:
        update_report_fields(report_doc.get("_id"), {"patientId": patient_id})
    except Exception:
        pass

    return patient_id


def serialize_report(report_doc):
    patient_human_id = resolve_patient_human_id(report_doc)
    created_at = report_doc.get("created_at")
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
        "created_at": created_at.isoformat() if created_at else None,
    }


def serialize_review(review):
    created_at = review.get("created_at")
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
        "created_at": created_at.isoformat() if created_at else None,
    }
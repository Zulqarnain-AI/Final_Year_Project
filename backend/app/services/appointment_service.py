from datetime import datetime

from bson import ObjectId  # type: ignore

from app.repositories.appointment_repository import (
    find_appointment_by_id,
    find_doctor_appointments,
    find_patient_appointments,
    insert_appointment,
    update_appointment_fields,
)
from app.repositories.doctor_repository import find_doctor_by_human_id, find_doctor_by_object_id
from app.repositories.patient_repository import find_patient_by_id
from app.repositories.report_repository import find_latest_report_for_patient
from app.repositories.review_repository import find_existing_review, refresh_doctor_rating, upsert_review


def create_appointment(user_id, data):
    patient = find_patient_by_id(ObjectId(user_id))
    if not patient:
        return {"error": "Patient not found"}, 404

    doctor_identifier = data.get("doctorId") or data.get("doctor_id")
    date = data.get("date")
    time_value = data.get("time")
    notes = data.get("notes", "")
    additional_info = data.get("additionalInfo", "")

    if not doctor_identifier or not date or not time_value:
        return {"error": "doctorId, date and time are required"}, 400

    doctor = None
    try:
        if len(doctor_identifier) == 24:
            doctor = find_doctor_by_object_id(ObjectId(doctor_identifier))
    except Exception:
        doctor = None
    if not doctor:
        doctor = find_doctor_by_human_id(doctor_identifier)

    if not doctor:
        return {"error": "Doctor not found"}, 404

    latest_report = find_latest_report_for_patient(user_id)
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
        "time": time_value,
        "notes": notes,
        "additionalInfo": additional_info,
        "status": "pending",
        "reviewed": False,
        "review_rating": None,
        "review_comment": "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    res = insert_appointment(appt)
    return {"message": "Appointment requested", "id": str(res.inserted_id)}, 201


def list_patient_appointments(user_id):
    appts = []
    for a in find_patient_appointments(user_id):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    appts.sort(key=lambda item: item.get("created_at") or datetime.min, reverse=True)
    return appts, 200


def list_doctor_appointments(user_id):
    appts = []
    for a in find_doctor_appointments(user_id):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    appts.sort(key=lambda item: item.get("created_at") or datetime.min, reverse=True)
    return appts, 200


def get_appointment(appointment_id):
    a = find_appointment_by_id(ObjectId(appointment_id))
    if not a:
        return {"error": "Appointment not found"}, 404
    a["id"] = str(a.get("_id"))
    return a, 200


def update_appointment(appointment_id, user_id, role, data):
    update_fields = {}
    if data.get("notes") is not None:
        update_fields["notes"] = data.get("notes")
    update_fields["updated_at"] = datetime.utcnow()

    appt = find_appointment_by_id(ObjectId(appointment_id))
    if not appt:
        return {"error": "Appointment not found"}, 404

    if role == "doctor" and appt.get("doctor_id") != user_id:
        return {"error": "Not authorized"}, 403
    if role == "patient" and appt.get("patient_id") != user_id:
        return {"error": "Not authorized"}, 403

    if data.get("status"):
        if role != "doctor":
            return {"error": "Only the doctor can update appointment status"}, 403
        new_status = data.get("status")
        allowed_statuses = ["pending", "accepted", "rejected", "completed"]
        if new_status not in allowed_statuses:
            return {"error": "Invalid appointment status"}, 400
        update_fields["status"] = new_status

    if role == "patient" and data.get("notes") is not None:
        update_fields["notes"] = data.get("notes")

    if role == "doctor" and data.get("notes") is None:
        update_fields.pop("notes", None)

    update_appointment_fields(ObjectId(appointment_id), update_fields)
    return {"message": "Appointment updated"}, 200


def review_appointment(appointment_id, user_id, role, data, doctors_collection):
    if role != "patient":
        return {"error": "Only patients can review appointments"}, 403

    appt = find_appointment_by_id(ObjectId(appointment_id))
    if not appt:
        return {"error": "Appointment not found"}, 404

    if appt.get("patient_id") != user_id:
        return {"error": "Not authorized"}, 403

    if appt.get("status") != "completed":
        return {"error": "You can only review completed appointments"}, 400

    try:
        rating_value = data.get("rating")
        rating = float(rating_value) if rating_value is not None else None
    except (TypeError, ValueError):
        return {"error": "Rating must be a number"}, 400

    if rating is None:
        return {"error": "Rating must be a number"}, 400

    if rating < 1 or rating > 5:
        return {"error": "Rating must be between 1 and 5"}, 400

    comment = (data.get("comment") or "").strip()

    existing_review = find_existing_review(appointment_id, user_id)
    review_doc = {
        "doctor_id": appt.get("doctor_id"),
        "doctorId": appt.get("doctorId", ""),
        "doctorName": appt.get("doctorName", ""),
        "patient_id": user_id,
        "patientId": appt.get("patientId", ""),
        "appointment_id": appointment_id,
        "rating": rating,
        "comment": comment,
    }
    upsert_review(review_doc, existing_review=existing_review)

    update_appointment_fields(
        ObjectId(appointment_id),
        {"reviewed": True, "review_rating": rating, "review_comment": comment, "updated_at": datetime.utcnow()},
    )

    refresh_doctor_rating(doctors_collection, ObjectId(appt.get("doctor_id")))

    return {"message": "Review saved successfully"}, 200
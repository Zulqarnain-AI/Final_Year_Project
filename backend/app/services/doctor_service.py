from bson import ObjectId  # type: ignore

from app.repositories.doctor_repository import (
    find_doctor_by_human_id,
    find_doctor_by_id,
    find_doctor_by_object_id,
    get_collection as get_doctors_collection,
    list_doctors_cursor,
    update_doctor_fields,
)
from app.repositories.review_repository import get_doctor_review_stats


def list_doctors():
    doctors = []
    for d in list_doctors_cursor():
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
            "languages": d.get("languages", []),
        })
    return doctors, 200


def get_doctor(doctor_identifier):
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
        "languages": doctor.get("languages", []),
    }

    return doc, 200


def get_doctor_profile(user_id):
    doctor = find_doctor_by_id(ObjectId(user_id))
    if not doctor:
        return {"error": "Doctor not found"}, 404

    profile = {
        "id": str(doctor.get("_id")),
        "doctorId": doctor.get("doctorId") or str(doctor.get("_id")),
        "firstName": doctor.get("firstName", ""),
        "lastName": doctor.get("lastName", ""),
        "fullName": doctor.get("fullName", ""),
        "email": doctor.get("email", ""),
        "specialization": doctor.get("specialization", ""),
        "bio": doctor.get("bio", ""),
        "clinics": doctor.get("clinics", []),
        "availableSlots": doctor.get("availableSlots", []),
        "phone": doctor.get("phone", ""),
        "dob": doctor.get("dob", ""),
        "address": doctor.get("address", ""),
        "experience": doctor.get("experience", ""),
        "rating": doctor.get("rating", 0),
        "qualification": doctor.get("qualification", ""),
        "department": doctor.get("department", ""),
        "languages": doctor.get("languages", []),
        "hospitals": doctor.get("hospitals", []),
        "profileImage": doctor.get("profileImage", ""),
    }
    return profile, 200


def update_doctor_profile(user_id, data):
    update_fields = {}
    for field in ["firstName", "lastName", "fullName", "specialization", "bio", "phone", "dob", "address", "experience", "rating", "qualification", "department", "profileImage"]:
        if field in data:
            update_fields[field] = data.get(field)

    if "clinics" in data:
        update_fields["clinics"] = data.get("clinics")
    if "availableSlots" in data:
        update_fields["availableSlots"] = data.get("availableSlots")
    if "languages" in data:
        update_fields["languages"] = data.get("languages")
    if "hospitals" in data:
        update_fields["hospitals"] = data.get("hospitals")

    if update_fields:
        update_doctor_fields(ObjectId(user_id), update_fields)

    return {"message": "Doctor profile updated successfully"}, 200
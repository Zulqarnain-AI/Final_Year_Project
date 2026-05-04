from bson import ObjectId  # type: ignore

from app.repositories.patient_repository import find_patient_by_id, get_collection as get_patients_collection, update_patient_fields
from app.repositories.report_repository import find_latest_report_for_patient
from app.utils.ids import ensure_human_id_for_user


def get_patient_profile(user_id):
    patient = find_patient_by_id(ObjectId(user_id))
    if not patient:
        return {"error": "User not found"}, 404

    first_name = patient.get("firstName") or (patient.get("fullName", "").split(" ", 1)[0] if patient.get("fullName") else "")
    last_name = patient.get("lastName") or (patient.get("fullName", "").split(" ", 1)[1] if (patient.get("fullName") and " " in patient.get("fullName")) else "")

    patient_human_id = ensure_human_id_for_user(patient, get_patients_collection(), "P", "patientId")
    latest_report = find_latest_report_for_patient(user_id)

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
        "profileImage": patient.get("profileImage", ""),
    }

    return profile_data, 200


def update_patient_profile(user_id, data):
    update_fields = {}
    if data.get("firstName") is not None:
        update_fields["firstName"] = data.get("firstName")
    if data.get("lastName") is not None:
        update_fields["lastName"] = data.get("lastName")
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

    for field in ["phone", "dob", "address", "bloodGroup", "allergies", "primaryPhysician", "lastCheckup", "emergencyContact", "medicalConditions", "profileImage"]:
        if field in data:
            update_fields[field] = data.get(field)

    if "languages" in data:
        update_fields["languages"] = data.get("languages")

    if update_fields:
        update_patient_fields(ObjectId(user_id), update_fields)

    return {"message": "Profile updated successfully"}, 200
from app.repositories.doctor_repository import count_doctors, get_collection as get_doctors_collection
from app.repositories.patient_repository import count_patients, get_collection as get_patients_collection


def _count_gender_breakdown(collection):
    counts = {"male": 0, "female": 0, "other": 0}

    for document in collection.find({}):
        gender = str(document.get("gender", "")).strip().lower()
        if gender in counts:
            counts[gender] += 1
        elif gender:
            counts["other"] += 1

    return counts


def get_dashboard_stats():
    total_patients = count_patients()
    total_doctors = count_doctors()

    payload = {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "overall_users": total_patients + total_doctors,
        "patient_gender_counts": _count_gender_breakdown(get_patients_collection()),
        "doctor_gender_counts": _count_gender_breakdown(get_doctors_collection()),
    }

    return payload, 200
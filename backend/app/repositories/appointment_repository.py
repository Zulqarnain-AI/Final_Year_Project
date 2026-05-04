from app.extensions import mongo


def get_collection():
    return mongo.db.appointments


def insert_appointment(appt_doc):
    return get_collection().insert_one(appt_doc)


def find_appointment_by_id(appointment_id):
    return get_collection().find_one({"_id": appointment_id})


def find_patient_appointments(patient_id):
    return get_collection().find({"patient_id": patient_id})


def find_doctor_appointments(doctor_id):
    return get_collection().find({"doctor_id": doctor_id})


def update_appointment_fields(appointment_id, update_fields):
    return get_collection().update_one({"_id": appointment_id}, {"$set": update_fields})


def count_patient_appointments(patient_id):
    return get_collection().count_documents({"patient_id": patient_id})


def count_pending_appointments(doctor_id):
    return get_collection().count_documents({"doctor_id": doctor_id, "status": "pending"})
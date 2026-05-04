from app.extensions import mongo


def get_collection():
    return mongo.db.patients


def find_patient_by_email(email):
    return get_collection().find_one({"email": email})


def find_patient_by_object_id(object_id):
    return get_collection().find_one({"_id": object_id})


def find_patient_by_id(user_id):
    return get_collection().find_one({"_id": user_id})


def insert_patient(user_data):
    return get_collection().insert_one(user_data)


def update_patient_fields(user_id, update_fields):
    return get_collection().update_one({"_id": user_id}, {"$set": update_fields})


def count_patients():
    return get_collection().count_documents({})
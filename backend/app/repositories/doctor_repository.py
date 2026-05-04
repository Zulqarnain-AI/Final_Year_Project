from app.extensions import mongo


def get_collection():
    return mongo.db.doctors


def find_doctor_by_email(email):
    return get_collection().find_one({"email": email})


def find_doctor_by_object_id(object_id):
    return get_collection().find_one({"_id": object_id})


def find_doctor_by_id(user_id):
    return get_collection().find_one({"_id": user_id})


def find_doctor_by_human_id(doctor_id):
    return get_collection().find_one({"doctorId": doctor_id})


def list_doctors_cursor():
    return get_collection().find({})


def insert_doctor(user_data):
    return get_collection().insert_one(user_data)


def update_doctor_fields(user_id, update_fields):
    return get_collection().update_one({"_id": user_id}, {"$set": update_fields})


def count_doctors():
    return get_collection().count_documents({})
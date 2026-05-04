from app.extensions import mongo


def get_collection():
    return mongo.db.reports


def insert_report(report_doc):
    return get_collection().insert_one(report_doc)


def find_latest_report_for_patient(patient_id):
    return get_collection().find_one({"patient_id": patient_id}, sort=[("created_at", -1)])


def find_reports_for_patient(patient_id):
    return get_collection().find({"patient_id": patient_id}, sort=[("created_at", -1)])


def update_report_fields(report_id, update_fields):
    return get_collection().update_one({"_id": report_id}, {"$set": update_fields})
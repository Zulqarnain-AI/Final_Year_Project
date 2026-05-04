from datetime import datetime

from app.extensions import mongo
from app.utils.serializers import serialize_review


def get_collection():
    return mongo.db.doctor_reviews


def find_existing_review(appointment_id, patient_id):
    return get_collection().find_one({"appointment_id": appointment_id, "patient_id": patient_id})


def upsert_review(review_doc, existing_review=None):
    if existing_review:
        return get_collection().update_one(
            {"_id": existing_review.get("_id")},
            {"$set": {"rating": review_doc["rating"], "comment": review_doc["comment"], "created_at": datetime.utcnow()}},
        )
    return get_collection().insert_one(review_doc)


def get_doctor_review_stats(doctor_id):
    reviews = list(get_collection().find({"doctor_id": doctor_id}).sort("created_at", -1))
    ratings = [float(review.get("rating", 0)) for review in reviews if review.get("rating") is not None]
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    return average_rating, len(reviews), [serialize_review(review) for review in reviews[:5]]


def refresh_doctor_rating(doctors_collection, doctor_id):
    average_rating, review_count, recent_reviews = get_doctor_review_stats(doctor_id)
    doctors_collection.update_one(
        {"_id": doctor_id},
        {"$set": {"rating": average_rating, "reviewCount": review_count, "recentReviews": recent_reviews}},
    )
    return average_rating, review_count, recent_reviews
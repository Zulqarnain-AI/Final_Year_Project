def generate_human_id(collection, prefix):
    try:
        count = collection.count_documents({}) + 1
    except Exception:
        count = 1
    return f"{prefix}{count:04d}"


def ensure_human_id_for_user(user_doc, collection, prefix, field_name):
    human_id = user_doc.get(field_name)
    if human_id:
        return human_id

    generated_id = generate_human_id(collection, prefix)
    try:
        collection.update_one({"_id": user_doc.get("_id")}, {"$set": {field_name: generated_id}})
    except Exception:
        pass
    return generated_id
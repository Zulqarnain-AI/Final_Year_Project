from app.extensions import mongo


def get_collection():
    return mongo.db.chatbot_conversations


def insert_conversation(document):
    return get_collection().insert_one(document)


def find_user_conversation_by_id(conversation_id, user_id):
    return get_collection().find_one({"_id": conversation_id, "user_id": user_id})


def find_user_conversations(user_id):
    return get_collection().find({"user_id": user_id}, sort=[("updated_at", -1)])


def append_messages(conversation_id, messages, updated_at):
    return get_collection().update_one(
        {"_id": conversation_id},
        {
            "$push": {"messages": {"$each": messages}},
            "$set": {"updated_at": updated_at},
        },
    )


def update_conversation_fields(conversation_id, fields):
    return get_collection().update_one({"_id": conversation_id}, {"$set": fields})
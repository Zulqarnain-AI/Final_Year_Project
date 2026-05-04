from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.services.chatbot_service import (
    ask_breathewell_chatbot,
    get_breathewell_conversation,
    list_breathewell_conversations,
)


chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chatbot/ask", methods=["POST"])
@jwt_required()
def ask_chatbot():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"success": False, "error": "Only patients can use the BreatheWell chatbot"}), 403

    payload, status = ask_breathewell_chatbot(get_jwt_identity(), request.get_json(silent=True) or {})
    return jsonify(payload), status


@chatbot_bp.route("/chatbot/conversations", methods=["GET"])
@jwt_required()
def list_conversations():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"success": False, "error": "Only patients can use the BreatheWell chatbot"}), 403

    payload, status = list_breathewell_conversations(get_jwt_identity())
    return jsonify(payload), status


@chatbot_bp.route("/chatbot/conversations/<conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation(conversation_id):
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"success": False, "error": "Only patients can use the BreatheWell chatbot"}), 403

    payload, status = get_breathewell_conversation(get_jwt_identity(), conversation_id)
    return jsonify(payload), status
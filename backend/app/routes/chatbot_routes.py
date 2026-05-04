from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.services.chatbot_service import ask_chatbot


chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chatbot/ask", methods=["POST"])
@jwt_required()
def chatbot_ask():
    claims = get_jwt()
    payload, status = ask_chatbot(get_jwt_identity(), claims.get("role"), request.get_json() or {})
    return jsonify(payload), status
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.services.auth_service import change_password, login_user, register_user


auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    payload, status = register_user(request.get_json() or {})
    return jsonify(payload), status


@auth_bp.route("/login", methods=["POST"])
def login():
    payload, status = login_user(request.get_json() or {})
    return jsonify(payload), status


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password_route():
    claims = get_jwt()
    payload, status = change_password(get_jwt_identity(), claims.get("role"), request.get_json() or {})
    return jsonify(payload), status
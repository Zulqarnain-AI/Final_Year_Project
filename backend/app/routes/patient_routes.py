from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.services.patient_service import get_patient_profile, update_patient_profile


patient_bp = Blueprint("patient_bp", __name__)


@patient_bp.route("/api/users/profile", methods=["GET"])
@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access this profile"}), 403
    payload, status = get_patient_profile(get_jwt_identity())
    return jsonify(payload), status


@patient_bp.route("/api/users/profile", methods=["PUT"])
@patient_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can update profile"}), 403
    payload, status = update_patient_profile(get_jwt_identity(), request.get_json() or {})
    return jsonify(payload), status
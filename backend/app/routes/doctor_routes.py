from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.services.doctor_service import get_doctor, get_doctor_profile, list_doctors, update_doctor_profile


doctor_bp = Blueprint("doctor_bp", __name__)


@doctor_bp.route("/doctors", methods=["GET"])
def list_doctors_route():
    payload, status = list_doctors()
    return jsonify(payload), status


@doctor_bp.route("/doctors/<doctor_identifier>", methods=["GET"])
def get_doctor_route(doctor_identifier):
    payload, status = get_doctor(doctor_identifier)
    return jsonify(payload), status


@doctor_bp.route("/api/doctors/profile", methods=["GET"])
@doctor_bp.route("/doctor/profile", methods=["GET"])
@jwt_required()
def get_doctor_profile_route():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Only doctors can access this profile"}), 403
    payload, status = get_doctor_profile(get_jwt_identity())
    return jsonify(payload), status


@doctor_bp.route("/api/doctors/profile", methods=["PUT"])
@doctor_bp.route("/doctor/profile", methods=["PUT"])
@jwt_required()
def update_doctor_profile_route():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Only doctors can update profile"}), 403
    payload, status = update_doctor_profile(get_jwt_identity(), request.get_json() or {})
    return jsonify(payload), status
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.extensions import mongo
from app.services.appointment_service import (
    create_appointment,
    get_appointment,
    list_doctor_appointments,
    list_patient_appointments,
    review_appointment,
    update_appointment,
)


appointment_bp = Blueprint("appointment_bp", __name__)


@appointment_bp.route("/appointments", methods=["POST"])
@jwt_required()
def create_appointment_route():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can create appointments"}), 403
    payload, status = create_appointment(get_jwt_identity(), request.get_json() or {})
    return jsonify(payload), status


@appointment_bp.route("/appointments/patient", methods=["GET"])
@jwt_required()
def list_patient_appointments_route():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access this"}), 403
    payload, status = list_patient_appointments(get_jwt_identity())
    return jsonify(payload), status


@appointment_bp.route("/appointments/doctor", methods=["GET"])
@jwt_required()
def list_doctor_appointments_route():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Only doctors can access this"}), 403
    payload, status = list_doctor_appointments(get_jwt_identity())
    return jsonify(payload), status


@appointment_bp.route("/appointments/<appointment_id>", methods=["GET"])
@jwt_required()
def get_appointment_route(appointment_id):
    payload, status = get_appointment(appointment_id)
    return jsonify(payload), status


@appointment_bp.route("/appointments/<appointment_id>", methods=["PUT"])
@jwt_required()
def update_appointment_route(appointment_id):
    claims = get_jwt()
    payload, status = update_appointment(appointment_id, get_jwt_identity(), claims.get("role"), request.get_json() or {})
    return jsonify(payload), status


@appointment_bp.route("/appointments/<appointment_id>/review", methods=["POST"])
@jwt_required()
def review_appointment_route(appointment_id):
    claims = get_jwt()
    payload, status = review_appointment(appointment_id, get_jwt_identity(), claims.get("role"), request.get_json() or {}, mongo.db.doctors)
    return jsonify(payload), status
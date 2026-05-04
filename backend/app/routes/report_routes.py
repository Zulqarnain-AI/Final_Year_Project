from bson import ObjectId  # type: ignore
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.repositories.patient_repository import find_patient_by_id
from app.services.report_service import create_diagnosis_report, get_latest_report, get_patient_reports


report_bp = Blueprint("report_bp", __name__)


@report_bp.route("/diagnose", methods=["POST"])
@jwt_required()
def diagnose():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can create diagnosis reports"}), 403

    user_id = get_jwt_identity()
    patient = find_patient_by_id(ObjectId(user_id))
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    payload, status = create_diagnosis_report(user_id, patient, request.form, request.files.get("file"))
    return jsonify(payload), status


@report_bp.route("/reports/latest", methods=["GET"])
@jwt_required()
def get_latest_report_route():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access reports"}), 403
    payload, status = get_latest_report(get_jwt_identity())
    return jsonify(payload), status


@report_bp.route("/reports/patient", methods=["GET"])
@jwt_required()
def get_patient_reports_route():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access reports"}), 403
    payload, status = get_patient_reports(get_jwt_identity())
    return jsonify(payload), status
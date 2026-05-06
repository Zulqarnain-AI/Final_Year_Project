from bson import ObjectId  # type: ignore
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required  # type: ignore

from app.repositories.patient_repository import find_patient_by_id
from app.services.care_plan_service import generate_latest_care_plan


care_plan_bp = Blueprint("care_plan_bp", __name__)


@care_plan_bp.route("/care-plans/latest", methods=["GET"])
@jwt_required()
def get_latest_care_plan_route():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access care plans"}), 403

    user_id = get_jwt_identity()
    patient = find_patient_by_id(ObjectId(user_id))
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    payload, status = generate_latest_care_plan(user_id)
    return jsonify(payload), status

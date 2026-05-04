from flask import Blueprint, jsonify

from app.services.dashboard_service import get_dashboard_stats


dashboard_bp = Blueprint("dashboard_bp", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():
    payload, status = get_dashboard_stats()
    return jsonify(payload), status
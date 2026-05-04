from flask import Blueprint, jsonify, request

from app.services.audio_service import predict_audio_from_upload


audio_bp = Blueprint("audio_bp", __name__)


@audio_bp.route("/predict-audio", methods=["POST"])
def predict_audio_route():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded."}), 400

    payload, status = predict_audio_from_upload(request.files["file"])
    return jsonify(payload), status
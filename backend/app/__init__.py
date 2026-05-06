from flask import Flask, jsonify
from flask_cors import CORS  # type: ignore
from flask_jwt_extended import JWTManager  # type: ignore

from app.config import Config
from app.extensions import mongo


jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    mongo.init_app(app)
    jwt.init_app(app)

    from app.routes.appointment_routes import appointment_bp
    from app.routes.care_plan_routes import care_plan_bp
    from app.routes.audio_routes import audio_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.chatbot_routes import chatbot_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.doctor_routes import doctor_bp
    from app.routes.patient_routes import patient_bp
    from app.routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(care_plan_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(audio_bp)

    @jwt.invalid_token_loader
    def handle_invalid_token(reason):
        import logging

        logging.warning(f"Invalid JWT token: {reason}")
        return jsonify({"error": "Invalid or malformed authentication token"}), 401

    @jwt.unauthorized_loader
    def handle_missing_token(reason):
        import logging

        logging.warning(f"Missing JWT token: {reason}")
        return jsonify({"error": "Authentication token is required"}), 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Authentication token has expired"}), 401

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({"status": "ok", "service": "BreatheWell API"}), 200

    return app
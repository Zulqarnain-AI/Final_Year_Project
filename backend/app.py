from flask import Flask, request, jsonify
from flask_cors import CORS # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import ( # type: ignore
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from bson import ObjectId # type: ignore
from config import Config
from database import mongo
import os
from datetime import datetime
import logging

# -------------------------------
# App Setup
# -------------------------------
app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
mongo.init_app(app)
jwt = JWTManager(app)

# configure logging
logging.basicConfig(level=logging.INFO)


# JWT error handlers - provide clearer responses for frontend
@jwt.unauthorized_loader
def unauthorized_loader_callback(reason):
    logging.warning(f"JWT unauthorized: {reason} | Authorization header: %s", request.headers.get('Authorization'))
    return jsonify({"error": "Authorization header missing or malformed", "message": reason}), 401


@jwt.invalid_token_loader
def invalid_token_callback(reason):
    logging.warning(f"JWT invalid token: {reason} | Authorization header: %s", request.headers.get('Authorization'))
    return jsonify({"error": "Invalid token", "message": reason}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    logging.info(f"JWT expired token for payload: {jwt_payload}")
    return jsonify({"error": "Token has expired"}), 401


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    logging.info("JWT revoked token")
    return jsonify({"error": "Token has been revoked"}), 401


# -------------------------------
# Collections
# -------------------------------
doctors_collection = mongo.db.doctors
patients_collection = mongo.db.patients
reports_collection = mongo.db.reports
appointments_collection = mongo.db.appointments
medical_records_collection = mongo.db.medical_records

# -------------------------------
# Register
# -------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    required_fields = ["fullName", "email", "password", "confirmPassword",
                       "age", "gender", "height", "weight", "role"]

    for field in required_fields:
        if field not in data or data[field] == "":
            return jsonify({"error": "Please fill all fields"}), 400

    if data["role"] not in ["doctor", "patient"]:
        return jsonify({"error": "Role must be doctor or patient"}), 400

    if data["password"] != data["confirmPassword"]:
        return jsonify({"error": "Passwords do not match"}), 400

    collection = doctors_collection if data["role"] == "doctor" else patients_collection

    if collection.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(data["password"])

    user_data = {
    "fullName": data["fullName"],
    "email": data["email"],
    "password": hashed_password,
    "age": data["age"],
    "gender": data["gender"],
    "height": data["height"],
    "weight": data["weight"],

    # New profile fields
    "phone": "",
    "dob": "",
    "address": "",
    "bloodGroup": "",
    "allergies": "",
    "primaryPhysician": "",
    "lastCheckup": "",

    "created_at": datetime.utcnow()
}


    collection.insert_one(user_data)

    return jsonify({"message": "Registration successful"}), 201


# -------------------------------
# Login with JWT
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not email or not password or not role:
        return jsonify({"error": "Provide email, password and role"}), 400

    if role not in ["doctor", "patient"]:
        return jsonify({"error": "Invalid role"}), 400

    collection = doctors_collection if role == "doctor" else patients_collection
    user = collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    # Use a string identity (user id) and put other fields into additional claims.
    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={
            "email": user["email"],
            "role": role
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "fullName": user["fullName"],
            "email": user["email"],
            "role": role
        }
    }), 200


# -------------------------------
# Protected Dashboard Route
# -------------------------------
@app.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    # identity is the user id (string); role and email are in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role == "patient":
        total_reports = reports_collection.count_documents({"patient_id": user_id})
        total_appointments = appointments_collection.count_documents({"patient_id": user_id})

        return jsonify({
            "role": role,
            "total_reports": total_reports,
            "total_appointments": total_appointments
        })

    else:
        total_patients = patients_collection.count_documents({})
        pending_appointments = appointments_collection.count_documents({
            "doctor_id": user_id,
            "status": "pending"
        })

        return jsonify({
            "role": role,
            "total_patients": total_patients,
            "pending_appointments": pending_appointments
        })

# -------------------------------
# Get Patient Profile
# -------------------------------
# Compatibility routes for frontend which expects /api/users/profile
@app.route('/api/users/profile', methods=['GET'])
@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():

    # identity is the user id (string); role is stored in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "patient":
        return jsonify({"error": "Only patients can access this profile"}), 403

    patient = patients_collection.find_one({"_id": ObjectId(user_id)})

    if not patient:
        return jsonify({"error": "User not found"}), 404

    profile_data = {
        "id": str(patient["_id"]),
        "fullName": patient.get("fullName", ""),
        "email": patient.get("email", ""),
        "age": patient.get("age", ""),
        "gender": patient.get("gender", ""),
        "height": patient.get("height", ""),
        "weight": patient.get("weight", ""),
        "phone": patient.get("phone", ""),
        "dob": patient.get("dob", ""),
        "address": patient.get("address", ""),
        "bloodGroup": patient.get("bloodGroup", ""),
        "allergies": patient.get("allergies", ""),
        "primaryPhysician": patient.get("primaryPhysician", ""),
        "lastCheckup": patient.get("lastCheckup", "")
    }

    return jsonify(profile_data), 200

# -------------------------------
# Update Patient Profile
# -------------------------------
# Compatibility routes for frontend which expects /api/users/profile
@app.route('/api/users/profile', methods=['PUT'])
@app.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():

    # identity is the user id (string); role is stored in JWT claims
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "patient":
        return jsonify({"error": "Only patients can update profile"}), 403

    data = request.get_json()

    update_fields = {
        "fullName": data.get("fullName"),
        "phone": data.get("phone"),
        "dob": data.get("dob"),
        "address": data.get("address"),
        "bloodGroup": data.get("bloodGroup"),
        "allergies": data.get("allergies"),
        "primaryPhysician": data.get("primaryPhysician"),
        "lastCheckup": data.get("lastCheckup")
    }

    patients_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    return jsonify({"message": "Profile updated successfully"}), 200



# -------------------------------
# Run App
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)

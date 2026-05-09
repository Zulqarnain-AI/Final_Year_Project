from datetime import datetime

from bson import ObjectId  # type: ignore

from flask_jwt_extended import create_access_token  # type: ignore
from werkzeug.security import check_password_hash, generate_password_hash

from app.repositories.doctor_repository import (
    find_doctor_by_email,
    get_collection as get_doctors_collection,
    insert_doctor,
)
from app.repositories.patient_repository import (
    find_patient_by_email,
    get_collection as get_patients_collection,
    insert_patient,
)
from app.utils.ids import ensure_human_id_for_user, generate_human_id


def register_user(data):
    required_fields = ["fullName", "email", "password", "confirmPassword", "age", "gender", "height", "weight", "role"]

    for field in required_fields:
        if field not in data or data[field] == "":
            return {"error": "Please fill all fields"}, 400

    if data["role"] not in ["doctor", "patient"]:
        return {"error": "Role must be doctor or patient"}, 400

    if data["password"] != data["confirmPassword"]:
        return {"error": "Passwords do not match"}, 400

    role = data["role"]
    if role == "doctor":
        if find_doctor_by_email(data["email"]):
            return {"error": "User already exists"}, 400
        repo_collection = get_doctors_collection()
    else:
        if find_patient_by_email(data["email"]):
            return {"error": "User already exists"}, 400
        repo_collection = get_patients_collection()

    hashed_password = generate_password_hash(data["password"])

    full_name = data.get("fullName", "")
    if " " in full_name.strip():
        first_name, last_name = full_name.strip().split(" ", 1)
    else:
        first_name = full_name.strip()
        last_name = ""

    prefix = "D" if role == "doctor" else "P"
    human_id = generate_human_id(repo_collection, prefix)

    user_data = {
        "fullName": full_name,
        "firstName": first_name,
        "lastName": last_name,
        "email": data["email"],
        "password": hashed_password,
        "age": data["age"],
        "gender": data["gender"],
        "height": data["height"],
        "weight": data["weight"],
        ("doctorId" if role == "doctor" else "patientId"): human_id,
        "phone": "",
        "dob": "",
        "address": "",
        "bloodGroup": "",
        "allergies": "",
        "primaryPhysician": "",
        "lastCheckup": "",
        "emergencyContact": "",
        "medicalConditions": "",
        "languages": [],
        "profileImage": "",
        "qualification": "",
        "department": "",
        "hospitals": [],
        "created_at": datetime.utcnow(),
    }

    if role == "doctor":
        insert_doctor(user_data)
    else:
        insert_patient(user_data)

    return {"message": "Registration successful", "id": human_id}, 201


def login_user(data):
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not email or not password or not role:
        return {"error": "Provide email, password and role"}, 400

    if role not in ["doctor", "patient"]:
        return {"error": "please selesct role"}, 400

    user = find_doctor_by_email(email) if role == "doctor" else find_patient_by_email(email)
    if not user:
        return {"error": "User not found, register first"}, 404

    if not check_password_hash(user["password"], password):
        return {"error": "Incorrect password"}, 401

    if role == "patient":
        human_id = ensure_human_id_for_user(user, get_patients_collection(), "P", "patientId")
        user["patientId"] = human_id
    else:
        human_id = ensure_human_id_for_user(user, get_doctors_collection(), "D", "doctorId")
        user["doctorId"] = human_id

    access_token = create_access_token(identity=str(user["_id"]), additional_claims={"email": user["email"], "role": role})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "fullName": user.get("fullName", ""),
            "email": user.get("email", ""),
            "role": role,
            "patientId": user.get("patientId") if role == "patient" else None,
            "doctorId": user.get("doctorId") if role == "doctor" else None,
        },
    }, 200


def change_password(user_id, role, data):
    current = data.get("currentPassword")
    new_pass = data.get("newPassword")

    if not current or not new_pass:
        return {"error": "currentPassword and newPassword are required"}, 400

    if len(new_pass) < 8:
        return {"error": "New password must be at least 8 characters"}, 400

    collection = get_doctors_collection() if role == "doctor" else get_patients_collection()
    user = collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}, 404

    if not check_password_hash(user.get("password", ""), current):
        return {"error": "Current password is incorrect"}, 401

    hashed = generate_password_hash(new_pass)
    collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"password": hashed}})

    return {"message": "Password updated successfully"}, 200
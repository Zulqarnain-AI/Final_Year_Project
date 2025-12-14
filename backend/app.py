from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# -------------------------------
# MongoDB connection
# -------------------------------
client = MongoClient("mongodb://localhost:27017/")  # Replace with your MongoDB URI if using Atlas
db = client.breathewell_db

doctors_collection = db.doctors
patients_collection = db.patients

# -------------------------------
# Register endpoint
# -------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required_fields = ["fullName", "email", "password", "confirmPassword", "age", "gender", "height", "weight", "role"]
    is_invalid = False
    for field in required_fields:
        if field not in data or data[field] == "":
            is_invalid = True
            break
        if is_invalid:
            return jsonify({"error":"please fill all fields"}),400
        
    if data["role"] not in ["doctor", "patient"]:
        return jsonify({"error": "Role must be doctor or patient"}), 400

    # Password match validation
    if data["password"] != data["confirmPassword"]:
        return jsonify({"error": "Passwords do not match"}), 400

    # Select the correct collection
    collection = doctors_collection if data["role"] == "doctor" else patients_collection

    # Check if user already exists
    if collection.find_one({"email": data["email"]}):
        return jsonify({"error": f"{data['role'].capitalize()} already exists"}), 400

    # Hash password
    hashed_password = generate_password_hash(data["password"])

    # User document
    user_data = {
        "fullName": data["fullName"],
        "email": data["email"],
        "password": hashed_password,
        "age": data["age"],
        "gender": data["gender"],
        "height": data["height"],
        "weight": data["weight"],
    }

    collection.insert_one(user_data)

    return jsonify({"message": f"{data['role'].capitalize()} registered successfully"}), 201

# -------------------------------
# Login endpoint
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")  # Role must be sent from frontend

    if not email or not password or not role:
        return jsonify({"error": "Please provide email, password, and role"}), 400

    if role not in ["doctor", "patient"]:
        return jsonify({"error": "Role must be doctor or patient"}), 400

    # Select collection based on role
    collection = doctors_collection if role == "doctor" else patients_collection
    user = collection.find_one({"email": email})

    if not user:
        return jsonify({"error": f"{role.capitalize()} not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    # Remove password before sending user info
    user_data = {
        "fullName": user["fullName"],
        "email": user["email"],
        "age": user["age"],
        "gender": user["gender"],
        "height": user["height"],
        "weight": user["weight"],
        "role": role
    }

    return jsonify({"message": "Login successful", "user": user_data}), 200

# -------------------------------
# Run the app
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)

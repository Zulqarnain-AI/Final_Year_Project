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
import json
import numpy as np
import tensorflow as tf
import librosa
from tempfile import NamedTemporaryFile
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

# -------------------------------
# Audio model inference
# -------------------------------
CLASS_NAMES = ["asthma", "copd", "bronchial", "pneumonia", "healthy"]

SAMPLE_RATE = 22050
DURATION = 5
SAMPLES = SAMPLE_RATE * DURATION
N_MELS = 128
FMAX = 8000
TARGET_TIME_FRAMES = 216

MODEL_FILENAME = "lung_model.keras"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_FILENAME)


def load_ml_model():
    if os.path.exists(MODEL_PATH):
        try:
            return tf.keras.models.load_model(MODEL_PATH)
        except Exception as exc:
            logging.error(f"Unable to load model: {exc}")
    else:
        logging.warning(f"Model file not found: {MODEL_PATH}")
    return None


model = load_ml_model()


def preprocess_audio(file_path):
    signal, sr = librosa.load(file_path, sr=SAMPLE_RATE)

    # Fix length
    if len(signal) > SAMPLES:
        signal = signal[:SAMPLES]
    else:
        signal = np.pad(signal, (0, SAMPLES - len(signal)))

    # Mel Spectrogram
    mel = librosa.feature.melspectrogram(
        y=signal,
        sr=sr,
        n_mels=N_MELS,
        fmax=FMAX
    )
    mel_db = librosa.power_to_db(mel, ref=np.max)

    # Add delta features (VERY IMPORTANT - must match training)
    delta = librosa.feature.delta(mel_db)
    delta2 = librosa.feature.delta(mel_db, order=2)

    # Stack → (128, time, 3)
    feature = np.stack([mel_db, delta, delta2], axis=-1)

    # Resize to match training shape
    if feature.shape[1] < TARGET_TIME_FRAMES:
        pad_width = TARGET_TIME_FRAMES - feature.shape[1]
        feature = np.pad(feature, ((0, 0), (0, pad_width), (0, 0)), mode="constant")
    elif feature.shape[1] > TARGET_TIME_FRAMES:
        feature = feature[:, :TARGET_TIME_FRAMES, :]

    # CRITICAL: Normalize using PER-SAMPLE stats (matching training preprocessing)
    feature = (feature - np.mean(feature)) / (np.std(feature) + 1e-6)

    return feature


@app.route('/predict-audio', methods=['POST'])
def predict_audio():
    if model is None:
        return jsonify({"error": "Model is not loaded. Place lung_model.keras in the Backend folder."}), 500

    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded."}), 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "Uploaded file must have a name."}), 400

    if not uploaded_file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
        return jsonify({"error": "Unsupported audio format. Upload WAV or compatible audio file."}), 400

    tmp_file = None
    try:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.filename)[1] or ".wav") as tmp:
            uploaded_file.save(tmp.name)
            tmp_file = tmp.name

        feature = preprocess_audio(tmp_file)
        input_tensor = np.expand_dims(feature, axis=0)
        predictions = model.predict(input_tensor)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        probs = {
            CLASS_NAMES[i]: float(predictions[0][i])
            for i in range(len(CLASS_NAMES))
        }
        a={
            "prediction": CLASS_NAMES[predicted_index],
            "confidence": confidence,
            "probabilities": probs
        }
        print(a)

        return jsonify({
            "prediction": CLASS_NAMES[predicted_index],
            "confidence": confidence,
            "probabilities": probs
        }), 200

    except Exception as exc:
        logging.error(f"Audio prediction failed: {exc}")
        return jsonify({"error": "Audio prediction failed. " + str(exc)}), 500

    finally:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                pass


# configure logging
logging.basicConfig(level=logging.INFO)


# Helper: generate a simple human-readable ID (P0001, D0001)
def generate_human_id(collection, prefix):
    try:
        count = collection.count_documents({}) + 1
    except Exception:
        # fallback in case count fails
        count = 1
    return f"{prefix}{count:04d}"


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

    # split full name into first/last name (best-effort)
    full_name = data.get("fullName", "")
    if " " in full_name.strip():
        first_name, last_name = full_name.strip().split(" ", 1)
    else:
        first_name = full_name.strip()
        last_name = ""

    # create human-readable id
    prefix = "D" if data["role"] == "doctor" else "P"
    human_id = generate_human_id(collection, prefix)

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
        # store human-readable id per role
        ("doctorId" if data["role"] == "doctor" else "patientId"): human_id,

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

    return jsonify({"message": "Registration successful", "id": human_id}), 201


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
            "fullName": user.get("fullName", ""),
            "email": user.get("email", ""),
            "role": role,
            # include human-readable id if present
            "patientId": user.get("patientId") if role == "patient" else None,
            "doctorId": user.get("doctorId") if role == "doctor" else None
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
# Doctors endpoints
# -------------------------------


@app.route('/doctors', methods=['GET'])
def list_doctors():
    doctors = []
    for d in doctors_collection.find({}):
        doctors.append({
            "id": str(d.get("_id")),
            "doctorId": d.get("doctorId"),
            "firstName": d.get("firstName"),
            "lastName": d.get("lastName"),
            "fullName": d.get("fullName"),
            "email": d.get("email"),
            "specialization": d.get("specialization", ""),
            "bio": d.get("bio", ""),
            "clinics": d.get("clinics", []),
            "availableSlots": d.get("availableSlots", []),
            "rating": d.get("rating", 0)
        })
    return jsonify(doctors), 200


@app.route('/doctors/<doctor_identifier>', methods=['GET'])
def get_doctor(doctor_identifier):
    # allow either ObjectId or human-readable doctorId
    doctor = None
    try:
        if len(doctor_identifier) == 24:
            doctor = doctors_collection.find_one({"_id": ObjectId(doctor_identifier)})
    except Exception:
        doctor = None

    if not doctor:
        doctor = doctors_collection.find_one({"doctorId": doctor_identifier})

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    doc = {
        "id": str(doctor.get("_id")),
        "doctorId": doctor.get("doctorId"),
        "firstName": doctor.get("firstName"),
        "lastName": doctor.get("lastName"),
        "fullName": doctor.get("fullName"),
        "email": doctor.get("email"),
        "specialization": doctor.get("specialization", ""),
        "bio": doctor.get("bio", ""),
        "clinics": doctor.get("clinics", []),
        "availableSlots": doctor.get("availableSlots", []),
        "rating": doctor.get("rating", 0)
    }

    return jsonify(doc), 200


# -------------------------------
# Appointments endpoints
# -------------------------------


@app.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can create appointments"}), 403

    user_id = get_jwt_identity()
    patient = patients_collection.find_one({"_id": ObjectId(user_id)})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json() or {}
    doctor_identifier = data.get("doctorId") or data.get("doctor_id")
    date = data.get("date")
    time = data.get("time")
    notes = data.get("notes", "")

    if not doctor_identifier or not date or not time:
        return jsonify({"error": "doctorId, date and time are required"}), 400

    # resolve doctor identifier
    doctor = None
    try:
        if len(doctor_identifier) == 24:
            doctor = doctors_collection.find_one({"_id": ObjectId(doctor_identifier)})
    except Exception:
        doctor = None
    if not doctor:
        doctor = doctors_collection.find_one({"doctorId": doctor_identifier})

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    appt = {
        "patient_id": str(patient.get("_id")),
        "doctor_id": str(doctor.get("_id")),
        "patientName": patient.get("fullName"),
        "doctorName": doctor.get("fullName"),
        "patientId": patient.get("patientId"),
        "doctorId": doctor.get("doctorId"),
        "date": date,
        "time": time,
        "notes": notes,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    res = appointments_collection.insert_one(appt)

    return jsonify({"message": "Appointment requested", "id": str(res.inserted_id)}), 201


@app.route('/appointments/patient', methods=['GET'])
@jwt_required()
def list_patient_appointments():
    claims = get_jwt()
    role = claims.get("role")
    if role != "patient":
        return jsonify({"error": "Only patients can access this"}), 403

    user_id = get_jwt_identity()
    appts = []
    for a in appointments_collection.find({"patient_id": user_id}):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    return jsonify(appts), 200


@app.route('/appointments/doctor', methods=['GET'])
@jwt_required()
def list_doctor_appointments():
    claims = get_jwt()
    role = claims.get("role")
    if role != "doctor":
        return jsonify({"error": "Only doctors can access this"}), 403

    user_id = get_jwt_identity()
    appts = []
    for a in appointments_collection.find({"doctor_id": user_id}):
        a["id"] = str(a.get("_id"))
        appts.append(a)

    return jsonify(appts), 200


@app.route('/appointments/<appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    a = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not a:
        return jsonify({"error": "Appointment not found"}), 404
    a["id"] = str(a.get("_id"))
    return jsonify(a), 200


@app.route('/appointments/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()

    data = request.get_json() or {}
    update_fields = {}
    if data.get("status"):
        update_fields["status"] = data.get("status")
    if data.get("notes") is not None:
        update_fields["notes"] = data.get("notes")
    update_fields["updated_at"] = datetime.utcnow()

    appt = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    # Only the doctor assigned or patient who created it may update status/notes
    if role == "doctor" and appt.get("doctor_id") != user_id:
        return jsonify({"error": "Not authorized"}), 403
    if role == "patient" and appt.get("patient_id") != user_id:
        return jsonify({"error": "Not authorized"}), 403

    appointments_collection.update_one({"_id": ObjectId(appointment_id)}, {"$set": update_fields})

    return jsonify({"message": "Appointment updated"}), 200


# -------------------------------
# Doctor profile (own account) endpoints
# -------------------------------


@app.route('/api/doctors/profile', methods=['GET'])
@app.route('/doctor/profile', methods=['GET'])
@jwt_required()
def get_doctor_profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if role != 'doctor':
        return jsonify({'error': 'Only doctors can access this profile'}), 403

    doctor = doctors_collection.find_one({'_id': ObjectId(user_id)})
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    profile = {
        'id': str(doctor.get('_id')),
        'doctorId': doctor.get('doctorId') or str(doctor.get('_id')),
        'firstName': doctor.get('firstName', ''),
        'lastName': doctor.get('lastName', ''),
        'fullName': doctor.get('fullName', ''),
        'email': doctor.get('email', ''),
        'specialization': doctor.get('specialization', ''),
        'bio': doctor.get('bio', ''),
        'clinics': doctor.get('clinics', []),
        'availableSlots': doctor.get('availableSlots', []),
        'phone': doctor.get('phone', ''),
        'dob': doctor.get('dob', ''),
        'address': doctor.get('address', ''),
        'experience': doctor.get('experience', ''),
        'rating': doctor.get('rating', 0)
    }
    return jsonify(profile), 200


@app.route('/api/doctors/profile', methods=['PUT'])
@app.route('/doctor/profile', methods=['PUT'])
@jwt_required()
def update_doctor_profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if role != 'doctor':
        return jsonify({'error': 'Only doctors can update profile'}), 403

    data = request.get_json() or {}
    update_fields = {}
    # allow updates to common fields
    for field in ['firstName', 'lastName', 'fullName', 'specialization', 'bio', 'phone', 'dob', 'address', 'experience', 'rating']:
        if field in data:
            update_fields[field] = data.get(field)

    # clinics and availableSlots expected as arrays
    if 'clinics' in data:
        update_fields['clinics'] = data.get('clinics')
    if 'availableSlots' in data:
        update_fields['availableSlots'] = data.get('availableSlots')

    if update_fields:
        doctors_collection.update_one({'_id': ObjectId(user_id)}, {'$set': update_fields})

    return jsonify({'message': 'Doctor profile updated successfully'}), 200



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

    # best-effort: support both legacy fullName and newer firstName/lastName
    first_name = patient.get("firstName") or (patient.get("fullName", "").split(" ", 1)[0] if patient.get("fullName") else "")
    last_name = patient.get("lastName") or (patient.get("fullName", "").split(" ", 1)[1] if (patient.get("fullName") and " " in patient.get("fullName")) else "")

    profile_data = {
        "id": str(patient["_id"]),
        "patientId": patient.get("patientId") or str(patient.get("_id")),
        "firstName": first_name,
        "lastName": last_name,
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

    # allow updating firstName/lastName and keep fullName for backward compatibility
    update_fields = {}
    if data.get("firstName") is not None:
        update_fields["firstName"] = data.get("firstName")
    if data.get("lastName") is not None:
        update_fields["lastName"] = data.get("lastName")
    # update fullName if provided, otherwise reconstruct from names
    if data.get("fullName"):
        update_fields["fullName"] = data.get("fullName")
    else:
        fn = data.get("firstName")
        ln = data.get("lastName")
        if fn or ln:
            update_fields["fullName"] = " ".join([p for p in [fn, ln] if p])

    # other profile fields
    for field in ["phone", "dob", "address", "bloodGroup", "allergies", "primaryPhysician", "lastCheckup"]:
        if field in data:
            update_fields[field] = data.get(field)

    if update_fields:
        patients_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )

    return jsonify({"message": "Profile updated successfully"}), 200



# -------------------------------
# Run App
# -------------------------------
if __name__ == '__main__':
    # Log registered routes for debugging
    for rule in app.url_map.iter_rules():
        logging.info(f"Route: {rule} -> methods={','.join(sorted(rule.methods))}")

    app.run(debug=True, port=5000)


@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ok", "service": "BreatheWell API"}), 200

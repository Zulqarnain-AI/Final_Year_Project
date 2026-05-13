import numpy as np
import pandas as pd

from app.ml.audio_model import model as audio_model
from app.ml.preprocessing import preprocess_audio
from app.ml.symptom_model import symptoms_model
from app.utils.helpers import compute_severity, normalize_probability_map


CLASS_NAMES = ["asthma", "copd", "bronchial", "pneumonia", "healthy"]
CANONICAL_CLASS_NAMES = ["asthma", "copd", "bronchial", "pneumonia", "healthy"]
LABEL_ALIASES = {
    "asthma": "asthma",
    "copd": "copd",
    "bronchial": "bronchial",
    "bronchitis": "bronchial",
    "pneumonia": "pneumonia",
    "healthy": "healthy",
}


def normalize_label(label):
    cleaned = str(label).strip().lower()
    return LABEL_ALIASES.get(cleaned, cleaned)


def normalize_probability_payload(probabilities):
    return normalize_probability_map(probabilities, CANONICAL_CLASS_NAMES, LABEL_ALIASES)


def predict_audio(file_path):
    if audio_model is None:
        raise RuntimeError("Model is not loaded. Place lung_model.keras in the Backend folder.")

    feature = preprocess_audio(file_path)
    input_tensor = np.expand_dims(feature, axis=0)
    predictions = audio_model.predict(input_tensor)
    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(np.max(predictions[0]))
    probs = {CLASS_NAMES[i]: float(predictions[0][i]) for i in range(len(CLASS_NAMES))}

    return {
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": confidence,
        "probabilities": probs,
    }


def predict_symptoms(symptoms_list, age, sex):
    if symptoms_model is None:
        raise RuntimeError("Symptoms model is not loaded.")

    symptoms_text = " ".join(symptoms_list).strip() if isinstance(symptoms_list, list) else str(symptoms_list)
    input_df = pd.DataFrame({"Symptoms": [symptoms_text], "Age": [float(age)], "Sex": [str(sex)]})

    prediction = symptoms_model.predict(input_df)[0]
    raw_probs = {}
    if hasattr(symptoms_model, "predict_proba"):
        prob_values = symptoms_model.predict_proba(input_df)[0]
        for cls, prob in zip(symptoms_model.classes_, prob_values):
            raw_probs[str(cls)] = float(prob)

    symptom_probs = normalize_probability_payload(raw_probs)
    predicted_label = normalize_label(prediction)
    confidence = symptom_probs.get(predicted_label, 0.0)

    return {
        "prediction": predicted_label,
        "confidence": float(confidence),
        "probabilities": symptom_probs,
        "symptoms_text": symptoms_text,
    }


def combine_probabilities(audio_probs, symptom_probs, audio_weight=0.60):
    combined = {}
    for label in CANONICAL_CLASS_NAMES:
        combined[label] = (
            audio_weight * float(audio_probs.get(label, 0.0))
            + (1 - audio_weight) * float(symptom_probs.get(label, 0.0))
        )
    return combined


def build_final_diagnosis(audio_result=None, symptom_result=None, symptoms=None):
    symptoms = symptoms or []
    if audio_result and symptom_result:
        final_probs = combine_probabilities(audio_result["probabilities"], symptom_result["probabilities"])
    elif audio_result:
        final_probs = audio_result["probabilities"]
    else:
        final_probs = symptom_result["probabilities"]

    final_prediction = max(final_probs, key=final_probs.get)
    final_confidence = float(final_probs[final_prediction])
    severity = compute_severity(final_prediction, final_confidence, len(symptoms))

    return final_prediction, final_confidence, final_probs, severity
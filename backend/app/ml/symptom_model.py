import logging
import os

import joblib


MODEL_FILENAME = "symptoms_model_pipeline.pkl"
_SYMPTOMS_MODEL = None


def _candidate_paths():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return [
        os.path.join(base_dir, MODEL_FILENAME),
        os.path.join(base_dir, "models", MODEL_FILENAME),
        os.path.join(os.path.dirname(__file__), MODEL_FILENAME),
    ]


def load_symptoms_model():
    for path in _candidate_paths():
        if os.path.exists(path):
            try:
                return joblib.load(path)
            except Exception as exc:
                logging.error(f"Unable to load symptoms model: {exc}")
    logging.warning(f"Symptoms model file not found: {_candidate_paths()[0]}")
    return None


def get_symptoms_model():
    global _SYMPTOMS_MODEL
    if _SYMPTOMS_MODEL is None:
        _SYMPTOMS_MODEL = load_symptoms_model()
    return _SYMPTOMS_MODEL


symptoms_model = get_symptoms_model()
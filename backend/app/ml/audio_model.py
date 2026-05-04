import logging
import os

import tensorflow as tf  # type: ignore


MODEL_FILENAME = "lung_model.keras"
_AUDIO_MODEL = None


def _candidate_paths():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return [
        os.path.join(base_dir, MODEL_FILENAME),
        os.path.join(base_dir, "models", MODEL_FILENAME),
        os.path.join(os.path.dirname(__file__), MODEL_FILENAME),
    ]


def load_audio_model():
    for path in _candidate_paths():
        if os.path.exists(path):
            try:
                return tf.keras.models.load_model(path)
            except Exception as exc:
                logging.error(f"Unable to load model: {exc}")
    logging.warning(f"Model file not found: {_candidate_paths()[0]}")
    return None


def get_audio_model():
    global _AUDIO_MODEL
    if _AUDIO_MODEL is None:
        _AUDIO_MODEL = load_audio_model()
    return _AUDIO_MODEL


model = get_audio_model()
def is_supported_audio_filename(filename):
    return str(filename).lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a"))


def parse_symptoms_value(symptoms_raw):
    import json

    try:
        symptoms = json.loads(symptoms_raw) if symptoms_raw else []
    except Exception:
        symptoms = [s.strip() for s in str(symptoms_raw).split(",") if s.strip()]

    if not isinstance(symptoms, list):
        symptoms = []

    return [str(item).strip() for item in symptoms if str(item).strip()]
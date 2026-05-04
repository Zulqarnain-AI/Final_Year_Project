import os
from tempfile import NamedTemporaryFile

from app.ml.inference import predict_audio
from app.utils.validators import is_supported_audio_filename


def predict_audio_from_upload(uploaded_file):
    if uploaded_file.filename == "":
        return {"error": "Uploaded file must have a name."}, 400

    if not is_supported_audio_filename(uploaded_file.filename):
        return {"error": "Unsupported audio format. Upload WAV or compatible audio file."}, 400

    tmp_file = None
    try:
        with NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.filename)[1] or ".wav") as tmp:
            uploaded_file.save(tmp.name)
            tmp_file = tmp.name

        result = predict_audio(tmp_file)
        return result, 200
    except Exception as exc:
        return {"error": "Audio prediction failed. " + str(exc)}, 500
    finally:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                pass
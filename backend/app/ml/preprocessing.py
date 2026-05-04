import numpy as np
import librosa


SAMPLE_RATE = 22050
DURATION = 5
SAMPLES = SAMPLE_RATE * DURATION
N_MELS = 128
FMAX = 8000
TARGET_TIME_FRAMES = 216


def preprocess_audio(file_path):
    signal, sr = librosa.load(file_path, sr=SAMPLE_RATE)

    if len(signal) > SAMPLES:
        signal = signal[:SAMPLES]
    else:
        signal = np.pad(signal, (0, SAMPLES - len(signal)))

    mel = librosa.feature.melspectrogram(y=signal, sr=sr, n_mels=N_MELS, fmax=FMAX)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    delta = librosa.feature.delta(mel_db)
    delta2 = librosa.feature.delta(mel_db, order=2)

    feature = np.stack([mel_db, delta, delta2], axis=-1)

    if feature.shape[1] < TARGET_TIME_FRAMES:
        pad_width = TARGET_TIME_FRAMES - feature.shape[1]
        feature = np.pad(feature, ((0, 0), (0, pad_width), (0, 0)), mode="constant")
    elif feature.shape[1] > TARGET_TIME_FRAMES:
        feature = feature[:, :TARGET_TIME_FRAMES, :]

    feature = (feature - np.mean(feature)) / (np.std(feature) + 1e-6)

    return feature
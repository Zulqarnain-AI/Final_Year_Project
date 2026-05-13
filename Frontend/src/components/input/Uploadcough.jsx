import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VoiceRecorder from "./image/Mic.png";
import FileUpload from "./image/upload file.png";

const API_URL = "http://127.0.0.1:5000/diagnose";
const SUPPORTED_AUDIO_EXTENSIONS = ["wav", "mp3", "flac", "ogg", "m4a"];

function getFileExtension(filename = "") {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function isSupportedAudioFile(file) {
  if (!file?.name) return false;
  const extension = getFileExtension(file.name);
  return SUPPORTED_AUDIO_EXTENSIONS.includes(extension);
}

function writeAsciiString(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function audioBufferToWav(audioBuffer) {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numFrames = audioBuffer.length;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

async function convertRecordedBlobToWavFile(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Your browser does not support audio conversion.");
  }

  const audioContext = new AudioContextClass();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decodedAudio = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const wavBuffer = audioBufferToWav(decodedAudio);
    return new File([wavBuffer], "recorded-cough.wav", { type: "audio/wav" });
  } finally {
    await audioContext.close();
  }
}

function getCurrentUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function getPatientScopedKey(baseKey, user) {
  return user?.id ? `${baseKey}_${user.id}` : baseKey;
}

function Uploadcough() {
  const location = useLocation();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordChunksRef = useRef([]);
  const analysisIntervalRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);

  const currentUser = getCurrentUser();
  const symptomsStorageKey = getPatientScopedKey("selected_symptoms", currentUser);
  const reportStorageKey = getPatientScopedKey("latest_diagnosis_report", currentUser);

  const routeSymptoms = location.state?.symptoms;
  const storedSymptoms = JSON.parse(localStorage.getItem(symptomsStorageKey) || "[]");
  const selectedSymptoms = Array.isArray(routeSymptoms)
    ? routeSymptoms
    : Array.isArray(storedSymptoms)
    ? storedSymptoms
    : [];

  const analysisSteps = [
    "Preparing your inputs...",
    "Analyzing Breathe waveform...",
    "Matching symptom profile...",
    "Generating final diagnosis...",
  ];

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }

      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedAudioUrl]);

  const handleFileChange = (event) => {
    setError("");
    setPrediction(null);
    const selected = event.target.files[0];
    if (!selected) {
      return;
    }

    if (!isSupportedAudioFile(selected)) {
      setFile(null);
      setError("Unsupported audio format. Please upload WAV, MP3, FLAC, OGG, or M4A.");
      event.target.value = "";
      return;
    }

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl("");
    }

    setFile(selected);
  };

  const startRecording = async () => {
    setError("");
    setPrediction(null);

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const recordingMimeType = recorder.mimeType || "audio/webm";
          const rawBlob = new Blob(recordChunksRef.current, { type: recordingMimeType });
          const recordedFile = await convertRecordedBlobToWavFile(rawBlob);
          const audioUrl = URL.createObjectURL(recordedFile);
          setRecordedAudioUrl(audioUrl);
          setFile(recordedFile);
        } catch {
          setFile(null);
          setError("Recording captured, but conversion to WAV failed. Please upload a WAV, MP3, FLAC, OGG, or M4A file.");
        } finally {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Unable to access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleDiagnosis = async () => {
    if (!file || selectedSymptoms.length === 0) {
      setError("Please select symptoms and upload a breath audio file before diagnosis.");
      return;
    }

    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      return;
    }

    setLoading(true);
    setAnalysisStep(0);
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % analysisSteps.length);
    }, 900);
    setError("");
    setPrediction(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("symptoms", JSON.stringify(selectedSymptoms));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

      localStorage.setItem(reportStorageKey, JSON.stringify(data.report));
      localStorage.removeItem(symptomsStorageKey);
      setPrediction(data.report);
      navigate("/Report", { state: { report: data.report } });
    } catch (err) {
      setError(err.message);
    } finally {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      setLoading(false);
    }
  };

  return (
    <>
      <main className="mx-auto mt-6 w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white/95 p-5 shadow-xl shadow-cyan-100/70 sm:p-8">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-100/60 blur-2xl"></div>
          <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-teal-100/60 blur-2xl"></div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              ← Back
            </button>
            <span className="rounded-full bg-cyan-50 px-4 py-1 text-sm font-medium text-cyan-700">
              Step 2 of 2
            </span>
          </div>

          <div className="relative z-10 mt-5 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Record or Upload Breathe Audio
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Use your microphone or upload an audio file. Our AI combines this with your symptoms to improve diagnosis accuracy.
            </p>
            <p className="mx-auto mt-4 max-w-3xl rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm text-slate-700">
              <span className="font-semibold">Selected Symptoms:</span>{" "}
              {selectedSymptoms.length > 0 ? selectedSymptoms.join(", ") : "None"}
            </p>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
              <img src={VoiceRecorder} alt="Record" className="mx-auto h-[80px] w-[52px]" />
              <h2 className="mt-4 text-center text-xl font-bold text-cyan-700">Record Breathe</h2>
              <p className="mt-2 text-center text-sm text-slate-600">
                Press start, Breathe clearly for a few seconds, then stop to save and preview.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isRecording}
                  className="rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start Recording
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="rounded-full border border-cyan-300 bg-white px-5 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Stop
                </button>
              </div>

              {isRecording && (
                <p className="mt-4 animate-pulse text-center text-sm font-semibold text-red-500">
                  Recording in progress...
                </p>
              )}

              {recordedAudioUrl && (
                <div className="mt-4 rounded-xl border border-cyan-100 bg-white p-3">
                  <p className="mb-2 text-center text-sm font-medium text-slate-700">Recorded Preview</p>
                  <audio controls src={recordedAudioUrl} className="w-full"></audio>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
              <img src={FileUpload} alt="Upload" className="mx-auto h-[80px] w-[80px]" />
              <h2 className="mt-4 text-center text-xl font-bold text-cyan-700">Upload Audio File</h2>
              <p className="mt-2 text-center text-sm text-slate-600">
                Accepts common audio formats. Choose your cough sample to include in diagnosis.
              </p>

              <input
                type="file"
                accept=".wav,.mp3,.flac,.ogg,.m4a,audio/wav,audio/mpeg,audio/flac,audio/ogg,audio/mp4"
                onChange={handleFileChange}
                className="mt-5 w-full rounded-lg border border-cyan-200 bg-white p-2 text-sm text-slate-700"
              />

              {file && (
                <p className="mt-3 rounded-lg bg-cyan-100/70 p-2 text-sm text-slate-700 text-center">
                  Selected audio: {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-8 flex justify-center">
            <button
              onClick={handleDiagnosis}
              disabled={loading}
              className="min-w-[220px] rounded-full bg-cyan-600 px-8 py-3 text-base font-bold text-white shadow-lg shadow-cyan-200 transition duration-300 hover:-translate-y-1 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Get Diagnosis"}
            </button>
          </div>

          {error && <p className="relative z-10 mt-4 text-center text-red-600">{error}</p>}

          {prediction && (
            <div className="relative z-10 mx-auto mt-6 w-full max-w-xl rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
              <h2 className="text-2xl font-bold mb-3 text-slate-900">Prediction Result</h2>
              <p className="text-lg">
                <span className="font-semibold">Diagnosis:</span> {prediction.final_prediction}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Confidence:</span> {(prediction.final_confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Running AI Diagnosis</h3>
              <p className="mt-1 animate-pulse text-sm font-medium text-cyan-700">
                {analysisSteps[analysisStep]}
              </p>
              <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-cyan-100">
                <div className="h-full w-1/2 animate-[pulse_0.9s_ease-in-out_infinite] rounded-full bg-cyan-500"></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Uploadcough;

import React, { useState } from "react";
import VoiceRecorder from "./image/Mic.png";
import FileUpload from "./image/upload file.png";

const API_URL = "http://127.0.0.1:5000/predict-audio";

function Uploadcough() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setError("");
    setPrediction(null);
    const selected = event.target.files[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleDiagnosis = async () => {
    if (!file) {
      setError("Please upload a cough audio file before diagnosis.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main>
        <div className="flex justify-center items-center gap-6 flex-col w-full py-10">
          <div>
            <h1 className="style-poppins text-center fon-weight-700 font-bold text-[40px]">
              Record or Upload Cough
            </h1>
            <p className="style-poppins fon-weight-400 text-[30px]">
              Upload a sample of your cough audio for AI prediction.
            </p>
          </div>

          <div className="flex flex-row gap-5 flex-wrap justify-center w-full max-w-5xl">
            <div className="card w-[423px] h-[260px] shadow-md border-0 rounded-lg mt-5 flex flex-col justify-center items-center p-6 bg-white">
              <img src={VoiceRecorder} alt="Record" className="w-[58px] h-[90px]" />
              <h1 className="style-poppins text-[#1FB9C1] fon-weight-700 font-bold text-[20px] mt-4">
                Record
              </h1>
              <p className="text-slate-600 text-center mt-2">
                Recording support can be added later; upload a WAV file now.
              </p>
            </div>

            <div className="card w-[423px] h-[260px] shadow-md border-0 rounded-lg mt-5 flex flex-col justify-center items-center p-6 bg-white">
              <img src={FileUpload} alt="Upload" className="w-[100px] h-[100px]" />
              <h1 className="style-poppins text-[#1FB9C1] fon-weight-700 font-bold text-[20px] mt-4">
                Upload
              </h1>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="mt-4"
              />
              {file && (
                <p className="mt-2 text-sm text-slate-700 text-center">
                  Selected file: {file.name}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleDiagnosis}
            disabled={loading}
            className="w-[200px] h-[50px] bg-[#1FB9C1] hover:bg-[#6EE7EC] rounded-lg font-bold text-white style-poppins text-[18px] mt-6"
          >
            {loading ? "Analyzing..." : "Get Diagnosis"}
          </button>

          {error && <p className="text-red-600 mt-4">{error}</p>}

          {prediction && (
            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6">
              <h2 className="text-2xl font-bold mb-3 text-slate-900">Prediction Result</h2>
              <p className="text-lg">
                <span className="font-semibold">Diagnosis:</span> {prediction.prediction}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Confidence:</span> {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Uploadcough;

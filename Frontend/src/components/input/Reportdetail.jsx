import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000/reports/latest";

const diseaseDescriptions = {
  asthma: "Chronic inflammatory disease of the airways",
  copd: "Progressive lung disease causing airflow limitation",
  bronchial: "Inflammation of the bronchial tubes",
  pneumonia: "Infection that inflames the air sacs in one or both lungs",
  healthy: "No major respiratory disease pattern detected",
};

function normalizeLabel(value) {
  if (!value) return "Unknown";
  const text = String(value).toLowerCase();
  if (text === "copd") return "COPD";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ReportDetail() {
  const location = useLocation();

  const [report, setReport] = useState(() => {
    if (location.state?.report) return location.state.report;
    const cached = localStorage.getItem("latest_diagnosis_report");
    return cached ? JSON.parse(cached) : null;
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (report) return;

    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      setError("Please login to view your report.");
      return;
    }

    const loadLatestReport = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load report.");
        }
        setReport(data);
        localStorage.setItem("latest_diagnosis_report", JSON.stringify(data));
      } catch (err) {
        setError(err.message || "Unable to load report.");
      }
    };

    loadLatestReport();
  }, [report]);

  const prediction = report?.final_prediction || "unknown";
  const confidence = Number(report?.final_confidence || 0);
  const severity = report?.severity || "Moderate";
  const symptoms = Array.isArray(report?.symptoms) ? report.symptoms : [];
  const audioPrediction = report?.audio_prediction;
  const symptomPrediction = report?.symptom_prediction;

  const probabilityRows = useMemo(() => {
    const probabilities = report?.final_probabilities || {};
    return Object.entries(probabilities)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5);
  }, [report]);

  const createdAt = report?.created_at ? new Date(report.created_at) : new Date();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-md max-w-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Report Error</h2>
          <p className="text-slate-700">{error}</p>
          <div className="mt-4">
            <Link to="/Input" className="bg-[#059AA0] text-white py-2 px-4 rounded">
              Go to Diagnosis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-700 text-lg font-semibold">Loading report...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#059AA0] rounded-xl shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Diagnostic Analysis Report</h1>
                <p className="text-slate-600 mt-1">AI-Powered Respiratory Disease Assessment</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-teal-50 text-teal-700 border-2 border-teal-200 rounded-lg">
              <span className="font-medium">Generated: {createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 border-2 border-slate-200 bg-white rounded-lg shadow-sm">
          <div className="py-4 px-6">
            <div className="flex items-center gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Patient ID:</span>
                <span className="font-semibold text-slate-900">{report.patientId || "N/A"}</span>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Analysis Date:</span>
                <span className="font-semibold text-slate-900">{createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-5 w-full flex-wrap lg:flex-nowrap">
          <div className="w-full lg:w-[800px] mt-[30px] border-2 border-[#059AA0] p-6 shadow-lg rounded-[10px] bg-white">
            <p className="text-[20px] mb-2 text-slate-800">
              <span className="font-semibold">Likely Condition:</span> <span className="text-[#059AA0] font-bold">{normalizeLabel(prediction)}</span>
            </p>
            <p className="text-[20px] mb-2 text-slate-800">
              <span className="font-semibold">Probability: </span> <span className="text-[#059AA0] font-bold">{(confidence * 100).toFixed(1)}%</span>
            </p>
            <p className="text-[20px] text-slate-800">
              <span className="font-semibold">Severity Level:</span> <span className="text-amber-600 font-bold">{severity}</span>
            </p>
          </div>

          <div className="flex-1 min-w-[250px] mt-[30px] border-2 border-slate-300 shadow-lg rounded-[10px] bg-gradient-to-br from-teal-50 to-white p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm font-semibold text-slate-600 mb-3">AI Confidence Score</p>
              <div className="text-5xl font-bold text-[#059AA0] mb-2">{(confidence * 100).toFixed(1)}%</div>
              <div className="w-full bg-slate-200 rounded-full h-3 mt-4">
                <div className="h-full bg-[#059AA0] rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, confidence * 100))}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-2 border-[#059AA0] bg-gradient-to-br from-teal-50 to-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-[#059AA0]">Clinical Summary</h3>
          <p className="text-3xl font-bold text-[#059AA0] mt-3">{normalizeLabel(prediction)}</p>
          <p className="text-slate-600 mt-1">{diseaseDescriptions[prediction] || "Respiratory condition detected based on model inference."}</p>
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t-2 border-teal-100 mt-6">
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-[#059AA0]">{symptoms.length}</p>
              <p className="text-xs text-slate-600 mt-1">Symptoms Analyzed</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-[#059AA0]">{audioPrediction ? "1" : "0"}</p>
              <p className="text-xs text-slate-600 mt-1">Audio Samples</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-[#059AA0]">{Math.max(60, (confidence * 100)).toFixed(0)}%</p>
              <p className="text-xs text-slate-600 mt-1">Data Quality</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-8">
          <div className="border-2 border-slate-200 rounded-lg shadow-lg bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Symptom Profile</h3>
            {symptoms.length === 0 && <p className="text-slate-600">No symptoms were submitted.</p>}
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div key={symptom} className="flex items-start gap-3 p-3 bg-sky-50 border-2 border-sky-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sky-900">{symptom}</p>
                  </div>
                </div>
              ))}
            </div>
            {symptomPrediction && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">
                  Symptom Model Prediction: <span className="font-semibold">{normalizeLabel(symptomPrediction.prediction)}</span>
                </p>
              </div>
            )}
          </div>

          <div className="border-2 border-slate-200 rounded-lg shadow-lg bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Audio & Probability Analysis</h3>
            {audioPrediction ? (
              <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 mb-4">
                <p className="text-sm text-slate-700">File: {audioPrediction.file_name || "Uploaded sample"}</p>
                <p className="text-sm text-slate-700">
                  Audio Model Prediction: <span className="font-semibold">{normalizeLabel(audioPrediction.prediction)}</span>
                </p>
              </div>
            ) : (
              <p className="text-slate-600 mb-4">No audio sample was submitted.</p>
            )}

            <div className="space-y-2">
              {probabilityRows.map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{normalizeLabel(label)}</span>
                    <span className="font-semibold text-[#059AA0]">{(Number(value) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="h-2.5 bg-gradient-to-r from-[#059AA0] to-teal-400 rounded-full" style={{ width: `${Math.max(0, Math.min(100, Number(value) * 100))}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-end mb-6 w-full mt-8">
          <Link to="/dashboard" className="mr-4 bg-[#059AA0] text-white py-2 px-4 rounded border-2 border-transparent hover:bg-white hover:text-[#059AA0] hover:border-[#059AA0] transition-all duration-300">
            Back to Dashboard
          </Link>
          <Link to="/DoctorList" className="mr-4 bg-[#059AA0] text-white py-2 px-4 rounded border-2 border-transparent hover:bg-white hover:text-[#059AA0] hover:border-[#059AA0] transition-all duration-300">
            Doctor Appointment
          </Link>
        </div>

        <div className="border-2 border-slate-300 bg-slate-50 rounded-lg">
          <div className="py-4 px-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              This AI-generated report is intended for preliminary assessment only and should not replace professional medical diagnosis.
              Please consult a qualified healthcare provider for final evaluation and treatment guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;

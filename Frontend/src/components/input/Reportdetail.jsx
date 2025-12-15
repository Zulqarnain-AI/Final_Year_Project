import { Link } from "react-router-dom";

function ReportDetail() {
  const diseaseData = {
    name: "Asthma",
    description: "Chronic inflammatory disease of the airways",
    severity: "Moderate",
    severityLevel: "2/4",
    confidenceScore: 95,
    color: "teal", // using teal color scheme
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#059AA0] rounded-xl shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                  Diagnostic Analysis Report
                </h1>
                <p className="text-slate-600 mt-1">
                  AI-Powered Respiratory Disease Assessment
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-teal-50 text-teal-700 border-2 border-teal-200 rounded-lg flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">
                Generated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Info Bar */}
        <div className="mb-6 border-2 border-slate-200 bg-white rounded-lg shadow-sm">
          <div className="py-4 px-6">
            <div className="flex items-center gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-slate-600">Patient ID:</span>
                <span className="font-semibold text-slate-900">P-2024-001</span>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-slate-600">Analysis Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              
            </div>
          </div>
        </div>

        <h1 className="font-bold text-[40px] text-center my-[20px] text-slate-900">
          Report
        </h1>

        

        <div className="flex gap-5 w-full flex-wrap lg:flex-nowrap">
          <div className="w-full lg:w-[800px] mt-[30px] border-2 border-[#059AA0] p-6 shadow-lg rounded-[10px] bg-white">
            <p className="text-[20px] mb-2 text-slate-800">
              <span className="font-semibold">Likely Condition:</span>{" "}
              <span className="text-[#059AA0] font-bold">Asthma</span>
            </p>
            <p className="text-[20px] mb-2 text-slate-800">
              <span className="font-semibold">Probability: </span>{" "}
              <span className="text-[#059AA0] font-bold">
                95%
              </span>
            </p>
            <p className="text-[20px] text-slate-800">
              <span className="font-semibold">Severity Level:</span>{" "}
              <span className="text-amber-600 font-bold">Moderate</span>
            </p>
          </div>

          <div className="flex-1 min-w-[250px] mt-[30px] border-2 border-slate-300 shadow-lg rounded-[10px] bg-gradient-to-br from-teal-50 to-white p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm font-semibold text-slate-600 mb-3">
                AI Confidence Score
              </p>
              <div className="text-5xl font-bold text-[#059AA0] mb-2">
                95%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mt-4">
                <div
                  className="h-full bg-[#059AA0] rounded-full transition-all duration-500"
                  style={{ width: "89.5%" }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-3">High Confidence</p>
            </div>
          </div>
        </div>

        {/* Primary Diagnosis Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2 mt-8">
            <svg
              className="h-6 w-6 text-[#059AA0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Clinical Summary
          </h2>

          {/* Main Diagnosis Card - Full Width */}
          <div className="border-2 border-[#059AA0] bg-gradient-to-br from-teal-50 to-white rounded-lg shadow-lg">
            <div className="p-6 border-b-2 border-teal-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#059AA0] flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Diagnosed Condition
                </h3>
                <div className="px-3 py-1 bg-[#059AA0] text-white rounded-full text-sm font-semibold">
                  High Confidence
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Likely Condition
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#059AA0] mb-1">
                  {diseaseData.name}
                </p>
                <p className="text-slate-600">{diseaseData.description}</p>
              </div>

              <div className="h-px bg-slate-200"></div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Severity Level
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-700 border-2 border-amber-200 rounded-lg font-semibold">
                      {diseaseData.severity}
                    </div>
                    
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    AI Confidence Score
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Model Accuracy
                      </span>
                      <span className="font-bold text-[#059AA0] text-lg">
                        {diseaseData.confidenceScore}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#059AA0] to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${diseaseData.confidenceScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-teal-100">
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#059AA0]">12</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Symptoms Analyzed
                  </p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#059AA0]">3</p>
                  <p className="text-xs text-slate-600 mt-1">Audio Samples</p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#059AA0]">98%</p>
                  <p className="text-xs text-slate-600 mt-1">Data Quality</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Data Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="h-6 w-6 text-[#059AA0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Clinical Data Analysis
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Symptom Analysis Card */}
            <div className="border-2 border-slate-200 rounded-lg shadow-lg bg-white">
              <div className="p-6 bg-gradient-to-r from-teal-50 to-transparent border-b-2 border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-[#059AA0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Symptom Profile
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Patient-reported symptoms and clinical indicators
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">
                        High-Impact Symptoms
                      </h4>
                      <div className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        Analyzed
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="p-1.5 bg-red-100 rounded-lg">
                          <svg
                            className="h-4 w-4 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">Fever</p>
                          <p className="text-sm text-red-700">
                            Elevated body temperature detected
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                          <svg
                            className="h-4 w-4 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900">
                            Persistent Cough
                          </p>
                          <p className="text-sm text-amber-700">
                            Type: Dry, non-productive
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-sky-50 border-2 border-sky-200 rounded-lg">
                        <div className="p-1.5 bg-sky-100 rounded-lg">
                          <svg
                            className="h-4 w-4 text-sky-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sky-900">
                            Shortness of Breath
                          </p>
                          <p className="text-sm text-sky-700">
                            Dyspnea on exertion
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <svg
                            className="h-4 w-4 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-purple-900">
                            Wheezing
                          </p>
                          <p className="text-sm text-purple-700">
                            Audible respiratory sounds
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Analysis Card */}
            <div className="border-2 border-slate-200 rounded-lg shadow-lg bg-white">
              <div className="p-6 bg-gradient-to-r from-teal-50 to-transparent border-b-2 border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-[#059AA0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Cough Audio Analysis
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  AI-powered acoustic pattern recognition
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Recording Info */}
                  <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Recording Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sample ID</span>
                        <span className="font-mono text-slate-900 font-semibold">
                          CoughSample_001.wav
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duration</span>
                        <span className="font-semibold text-slate-900">
                          20 seconds
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sample Rate</span>
                        <span className="font-semibold text-slate-900">
                          44.1 kHz
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Findings */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      AI Acoustic Findings
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-green-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Cough Pattern
                          </p>
                          <p className="text-sm text-slate-600">
                            Frequent, harsh, irregular intervals
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-green-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Wheeze Detection
                          </p>
                          <p className="text-sm text-slate-600">
                            Confirmed presence at 850-1200 Hz
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-amber-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Respiratory Rate
                          </p>
                          <p className="text-sm text-slate-600">
                            Slightly elevated (22 breaths/min)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 text-green-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Sound Quality
                          </p>
                          <p className="text-sm text-slate-600">
                            Clear recording, high confidence
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end mb-6 w-full">
          <Link to="/dashboard" className="mr-4 bg-[#059AA0] text-white py-2 px-4 rounded border-2 border-transparent hover:bg-white hover:text-[#059AA0] hover:border-[#059AA0] transition-all duration-300">
            Back to Dashboard
          </Link>

          <Link to="/DoctorList" className="mr-4 bg-[#059AA0] text-white py-2 px-4 rounded border-2 border-transparent hover:bg-white hover:text-[#059AA0] hover:border-[#059AA0] transition-all duration-300">
            Doctor Appointment
          </Link>
        </div>

        {/* Footer Notice */}
        <div className="border-2 border-slate-300 bg-slate-50 rounded-lg">
          <div className="py-4 px-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-bold">Clinical Disclaimer</p>
                <p className="text-slate-600 leading-relaxed">
                  This AI-generated report is intended for preliminary
                  assessment only and should not replace professional medical
                  diagnosis. Please consult with a qualified healthcare provider
                  for complete evaluation and treatment recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;

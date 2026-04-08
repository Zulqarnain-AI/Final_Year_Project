import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const REPORT_API_URL = "http://127.0.0.1:5000/reports/latest";

const conditionAdvice = {
  asthma: {
    home: ["Use prescribed inhaler on time", "Warm steam inhalation once daily", "Avoid smoke and strong fragrances"],
    activity: ["Breathing exercise for 10 minutes", "Light walk for 15 minutes", "Track breathlessness episodes"],
    notes: "Keep rescue inhaler nearby and avoid known triggers."
  },
  copd: {
    home: ["Practice pursed-lip breathing", "Maintain hydration (6-8 glasses/day)", "Avoid exposure to dust or fumes"],
    activity: ["Slow paced walk for 10-15 minutes", "Chest physiotherapy if advised", "Monitor oxygen symptoms"],
    notes: "Stop smoking completely and follow medication schedule strictly."
  },
  bronchial: {
    home: ["Warm fluids and honey-lemon tea", "Use humidified air at home", "Saltwater gargle twice daily"],
    activity: ["Gentle stretching for 10 minutes", "Avoid cold outdoor exposure", "Track cough frequency"],
    notes: "Seek medical care if cough worsens or fever persists."
  },
  pneumonia: {
    home: ["Take adequate rest", "Drink warm fluids regularly", "Complete prescribed medicine course"],
    activity: ["Short indoor walk if comfortable", "Deep breathing every 2-3 hours", "Monitor fever and chest pain"],
    notes: "Urgent doctor follow-up is recommended for persistent shortness of breath."
  },
  healthy: {
    home: ["Maintain hydration", "Continue balanced nutrition", "Sleep at least 7-8 hours"],
    activity: ["Moderate walk for 20 minutes", "Daily breathing exercise", "Maintain indoor air quality"],
    notes: "No strong disease signal found. Continue preventive respiratory care."
  }
};

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

function isReportOwnedByUser(report, user) {
  if (!report || !user) return false;
  return (
    (report?.patient_id && report.patient_id === user.id) ||
    (report?.patientId && user?.patientId && report.patientId === user.patientId)
  );
}

function normalizeCondition(value) {
  return String(value || "healthy").toLowerCase();
}

function createTaskMap(report) {
  const condition = normalizeCondition(report?.final_prediction);
  const basePlan = conditionAdvice[condition] || conditionAdvice.healthy;
  const symptoms = Array.isArray(report?.symptoms) ? report.symptoms : [];

  const symptomBasedTips = [];
  if (symptoms.some((item) => String(item).toLowerCase().includes("fever"))) {
    symptomBasedTips.push("Track body temperature morning and evening");
  }
  if (symptoms.some((item) => String(item).toLowerCase().includes("shortness of breath"))) {
    symptomBasedTips.push("Practice controlled breathing during breathlessness");
  }
  if (symptoms.some((item) => String(item).toLowerCase().includes("cough"))) {
    symptomBasedTips.push("Avoid cold drinks and monitor cough intensity");
  }

  const tasks = {};
  [...basePlan.home, ...basePlan.activity, ...symptomBasedTips].forEach((label, index) => {
    tasks[`task_${index + 1}`] = {
      label,
      done: false,
      category: index < basePlan.home.length ? "Home Care" : "Daily Activity"
    };
  });

  return {
    tasks,
    notes: basePlan.notes
  };
}

const CircularProgress = ({ percent }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className="text-teal-500 transition-all duration-700 ease-out"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{`${percent}%`}</span>
      </div>
    </div>
  );
};

const CheckboxItem = ({ label, isChecked, onChange }) => (
  <label className="flex items-center space-x-3 text-gray-700 cursor-pointer">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="form-checkbox h-5 w-5 text-teal-500 rounded-sm border-gray-300 focus:ring-teal-500"
      style={{
        backgroundColor: isChecked ? "#14b8a6" : "transparent",
        borderColor: isChecked ? "#14b8a6" : "#d1d5db",
        color: "white"
      }}
    />
    <span className="text-base sm:text-lg">{label}</span>
  </label>
);

function CarePlanUI() {
  const location = useLocation();
  const currentUser = getCurrentUser();

  const reportStorageKey = getPatientScopedKey("latest_diagnosis_report", currentUser);
  const carePlanStorageKey = getPatientScopedKey("care_plan_progress", currentUser);

  const [report, setReport] = useState(() => {
    if (location.state?.report && isReportOwnedByUser(location.state.report, currentUser)) {
      return location.state.report;
    }

    const cached = localStorage.getItem(reportStorageKey);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      return isReportOwnedByUser(parsed, currentUser) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [tasks, setTasks] = useState({});
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (report) return;

    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      setError("Please login to view your care plan.");
      return;
    }

    const loadLatestReport = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(REPORT_API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load latest diagnosis report.");
        }

        if (!isReportOwnedByUser(data, currentUser)) {
          throw new Error("Unauthorized report data received.");
        }

        localStorage.setItem(reportStorageKey, JSON.stringify(data));
        setReport(data);
      } catch (err) {
        setError(err.message || "Unable to load latest diagnosis report.");
      } finally {
        setLoading(false);
      }
    };

    loadLatestReport();
  }, [report, currentUser, reportStorageKey]);

  useEffect(() => {
    if (!report) return;

    const generated = createTaskMap(report);
    const savedRaw = localStorage.getItem(carePlanStorageKey);

    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw);
        const hydratedTasks = {};
        Object.entries(generated.tasks).forEach(([key, value]) => {
          hydratedTasks[key] = {
            ...value,
            done: Boolean(saved?.[key]?.done)
          };
        });
        setTasks(hydratedTasks);
      } catch {
        setTasks(generated.tasks);
      }
    } else {
      setTasks(generated.tasks);
    }

    setNotes(generated.notes);
  }, [report, carePlanStorageKey]);

  const handleTaskToggle = (taskName) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [taskName]: {
        ...prevTasks[taskName],
        done: !prevTasks[taskName].done
      }
    }));
  };

  const handleUpdate = () => {
    localStorage.setItem(carePlanStorageKey, JSON.stringify(tasks));
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const taskEntries = Object.entries(tasks);
  const completedCount = taskEntries.filter(([, task]) => task.done).length;
  const totalTasks = taskEntries.length || 1;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const groupedTasks = useMemo(() => {
    return {
      home: taskEntries.filter(([, task]) => task.category === "Home Care"),
      activity: taskEntries.filter(([, task]) => task.category === "Daily Activity")
    };
  }, [taskEntries]);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="max-w-xl bg-white rounded-xl border border-red-200 p-6 shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Care Plan Error</h2>
          <p className="text-slate-700">{error}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/Input" className="bg-[#059AA0] text-white py-2 px-4 rounded">
              Run Diagnosis
            </Link>
            <Link to="/dashboard" className="bg-white text-[#059AA0] py-2 px-4 rounded border border-[#059AA0]">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="w-full min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-slate-700 text-lg font-semibold">Preparing your personalized care plan...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4 flex justify-center items-start overflow-auto">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg transition-opacity duration-300">
          <p className="font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Care plan updated successfully.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl p-6 flex flex-col">
        <header className="flex justify-between items-center pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center text-xl font-bold text-teal-600">BreatheWell</div>
          <div className="text-sm text-gray-600">
            Patient: <span className="font-semibold">{report.patientId || "N/A"}</span>
          </div>
        </header>

        <section className="py-5 border-b border-gray-100">
          <h1 className="text-3xl font-semibold text-gray-800">Personalized Care Plan</h1>
          <p className="text-slate-600 mt-2">
            Condition: <span className="font-semibold text-teal-700 capitalize">{report.final_prediction || "healthy"}</span>
            {" | "}
            Severity: <span className="font-semibold text-amber-700">{report.severity || "Moderate"}</span>
            {" | "}
            Confidence: <span className="font-semibold text-teal-700">{(Number(report.final_confidence || 0) * 100).toFixed(1)}%</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Array.isArray(report.symptoms) ? report.symptoms : []).map((symptom) => (
              <span key={symptom} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">
                {symptom}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Home Care</h2>
            <div className="space-y-4">
              {groupedTasks.home.map(([taskName, task]) => (
                <CheckboxItem
                  key={taskName}
                  label={task.label}
                  isChecked={task.done}
                  onChange={() => handleTaskToggle(taskName)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Progress</h2>
            <div className="flex items-center space-x-6">
              <CircularProgress percent={progressPercent} />
              <div>
                <p className="text-lg font-medium text-gray-800">Tasks completed</p>
                <p className="text-sm text-gray-500 mt-1">{completedCount} of {taskEntries.length} done</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Daily Activity</h2>
            <div className="space-y-4">
              {groupedTasks.activity.map(([taskName, task]) => (
                <CheckboxItem
                  key={taskName}
                  label={task.label}
                  isChecked={task.done}
                  onChange={() => handleTaskToggle(taskName)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Notes</h2>
            <p className="text-gray-700 text-lg">{notes}</p>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-4">
          <button
            onClick={handleUpdate}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-12 rounded-lg shadow-md transition-colors text-lg"
          >
            Update
          </button>
          <Link to="/Report" className="bg-white border border-teal-500 text-teal-600 font-semibold py-3 px-8 rounded-lg shadow-sm transition-colors text-lg hover:bg-teal-50">
            View Report
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CarePlanUI;
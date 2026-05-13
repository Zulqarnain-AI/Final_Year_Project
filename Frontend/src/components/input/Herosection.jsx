
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Herosection() {
  const [selected, setSelected] = useState([]);

  const getSymptomStorageKey = () => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return "selected_symptoms";
    try {
      const user = JSON.parse(rawUser);
      return user?.id ? `selected_symptoms_${user.id}` : "selected_symptoms";
    } catch {
      return "selected_symptoms";
    }
  };

  const toggleSymptom = (symptom) => {
    if (selected.includes(symptom)) {
      setSelected(selected.filter((item) => item !== symptom));
    } else {
      setSelected([...selected, symptom]);
    }
  };

  const symptoms = [
    "fever",
    "shortness of breath",
    "cough",
    "chest pain",
    "yellow cough",
    "tight feeling in the chest",
    "fatigue",
    "feeling run-down or tired",
    "chronic cough",
    "mucus",
    "chest Tightness",
    "wheezing",
    "cough with blood",
    "whistling sound while breathing",
    "runny nose",
  ];

  const handleNext = () => {
    const storageKey = getSymptomStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(selected));
  };

  return (
    <section className="mx-auto mt-2 w-full max-w-6xl">
      <div className="rounded-3xl border border-cyan-100 bg-white/95 shadow-xl shadow-cyan-100/70 backdrop-blur-sm">
        <div className="flex flex-col gap-5 border-b border-cyan-100 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              ← Back
            </Link>
            <p className="rounded-full bg-cyan-50 px-4 py-1 text-sm font-medium text-cyan-700">
              Selected: {selected.length}
            </p>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Select Your Symptoms
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Choose all symptoms that match your current condition. You can select multiple options before continuing to audio analysis.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {symptoms.map((symptom) => {
                const isSelected = selected.includes(symptom);
                return (
                  <button
                    type="button"
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`group min-h-[54px] rounded-xl border px-4 py-3 text-left text-sm font-medium capitalize transition-all duration-300 sm:text-base ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500 text-white shadow-lg shadow-cyan-200"
                        : "border-cyan-100 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full transition ${
                          isSelected ? "bg-white" : "bg-cyan-300 group-hover:bg-cyan-400"
                        }`}
                      ></span>
                      {symptom}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Tip: Use at least 3 symptoms for better diagnosis confidence.
            </p>

            <Link
              to="/Uploadcough"
              state={{ symptoms: selected }}
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-300 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Audio
              <span className="animate-pulse">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Herosection;



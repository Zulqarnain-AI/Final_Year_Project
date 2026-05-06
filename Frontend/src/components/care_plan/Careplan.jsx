import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight, Loader2, RefreshCcw, Sparkles, Stethoscope, Wind } from "lucide-react";

const CARE_PLAN_API_URL = "http://127.0.0.1:5000/care-plans/latest";

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

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function progressFromPlan(plan, progressMap) {
  const items = [
    ...(plan?.home_care || []),
    ...(plan?.daily_activities || []),
    ...(plan?.environmental_guidance || []),
  ];
  if (!items.length) return 0;
  const completed = items.filter((item) => progressMap[item.id]).length;
  return Math.round((completed / items.length) * 100);
}

function SectionCard({ title, icon: Icon, subtitle, children, accent = "teal" }) {
  const accentMap = {
    teal: "from-teal-500/20 via-white to-white",
    blue: "from-sky-500/20 via-white to-white",
    amber: "from-amber-500/20 via-white to-white",
    emerald: "from-emerald-500/20 via-white to-white",
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accentMap[accent] || accentMap.teal} shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function TaskRow({ item, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${checked ? "border-teal-300 bg-teal-50/70" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-transparent"}`}>
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${checked ? "text-teal-900 line-through decoration-teal-500/70" : "text-slate-900"}`}>{item.title}</p>
          {item.detail ? <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p> : null}
        </div>
      </div>
    </button>
  );
}

function CarePlanUI() {
  const location = useLocation();
  const currentUser = getCurrentUser();

  const reportStorageKey = getPatientScopedKey("latest_diagnosis_report", currentUser);
  const progressStorageKey = getPatientScopedKey("care_plan_progress", currentUser);
  const carePlanStorageKey = getPatientScopedKey("generated_care_plan", currentUser);

  const [report] = useState(() => {
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
  const [plan, setPlan] = useState(() => {
    const cached = localStorage.getItem(carePlanStorageKey);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  });
  const [progressMap, setProgressMap] = useState(() => {
    const cached = localStorage.getItem(progressStorageKey);
    if (!cached) return {};
    try {
      return JSON.parse(cached) || {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(!plan);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  const fetchPlan = async ({ isRefresh = false } = {}) => {
    if (!token) {
      setError("Please login to view your care plan.");
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(CARE_PLAN_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate your care plan right now.");
      }

      setPlan(data);
      localStorage.setItem(carePlanStorageKey, JSON.stringify(data));
      setNotice("Your care plan has been refreshed using the latest diagnosis and environmental data.");
    } catch (err) {
      setError(err.message || "Unable to generate your care plan right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (plan) return;
    fetchPlan();
  }, []);

  useEffect(() => {
    localStorage.setItem(progressStorageKey, JSON.stringify(progressMap));
  }, [progressMap, progressStorageKey]);

  const sections = useMemo(() => {
    return {
      home: plan?.care_plan?.home_care || [],
      activity: plan?.care_plan?.daily_activities || [],
      environment: plan?.care_plan?.environmental_guidance || [],
    };
  }, [plan]);

  const allItems = useMemo(() => {
    return [...sections.home, ...sections.activity, ...sections.environment];
  }, [sections]);

  const progressPercent = progressFromPlan(plan?.care_plan, progressMap);
  const completedCount = allItems.filter((item) => progressMap[item.id]).length;

  const diagnosisLabel = safeText(plan?.report?.final_prediction, "healthy").replace(/_/g, " ");
  const severity = safeText(plan?.report?.severity, "Moderate");
  const confidence = Number(plan?.report?.final_confidence || 0);
  const environmental = plan?.environmental_data || {};

  const toggleTask = (itemId) => {
    setProgressMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleReset = () => {
    setProgressMap({});
    localStorage.removeItem(progressStorageKey);
    setNotice("Progress was cleared for this care plan.");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eefaf7_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-slate-900">Care plan unavailable</h2>
              <p className="mt-2 text-slate-600">{error}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => fetchPlan()} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Try again
                </button>
                <Link to="/Input" className="rounded-2xl border border-teal-300 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100">
                  Run diagnosis
                </Link>
                <Link to="/dashboard" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !plan) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eefaf7_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_30px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
            <p className="mt-4 text-lg font-semibold text-slate-800">Generating your personalized care plan...</p>
            <p className="mt-2 text-sm text-slate-500">We’re combining your diagnosis, symptoms, and current environmental conditions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eefaf7_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-7 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI-generated care plan
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Your personalized breathing plan</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  The plan adapts to your recent diagnosis, reported symptoms, and local air conditions so the guidance is more actionable than a static checklist.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700">Condition: {diagnosisLabel}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700">Severity: {severity}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700">Confidence: {(confidence * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => fetchPlan({ isRefresh: true })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Regenerate plan
              </button>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <Link to="/Report" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  View report
                </Link>
                <button type="button" onClick={handleReset} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Reset progress
                </button>
              </div>
            </div>
          </div>
          {notice ? <p className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-medium text-slate-500">Patient</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{safeText(plan?.patient?.name, "Patient")}</p>
                <p className="mt-1 text-sm text-slate-500">{safeText(plan?.patient?.patientId, safeText(plan?.patient?.id, "N/A"))}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-medium text-slate-500">Progress</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{progressPercent}%</p>
                <p className="mt-1 text-sm text-slate-500">{completedCount} of {allItems.length} tasks done</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-medium text-slate-500">AQI</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{safeText(environmental.air_quality_index, "Unknown")}</p>
                <p className="mt-1 text-sm text-slate-500">Humidity {safeText(environmental.humidity, "N/A")}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-medium text-slate-500">Generated by</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">BreatheWell</p>
                <p className="mt-1 text-sm text-slate-500">based on Symtomps, AI diagnosis, and environmental data</p>
              </div>
            </div>

            <SectionCard title="Summary" icon={BrainCircuit} subtitle={safeText(plan?.care_plan?.summary, "A personalized respiratory care plan." )} accent="teal">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{safeText(plan?.care_plan?.priority, "Moderate")}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Condition focus</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{safeText(plan?.care_plan?.condition_focus)}</p>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-3">
              <SectionCard title="Home Care" icon={Stethoscope} subtitle="Daily actions at home" accent="emerald">
                <div className="space-y-3">
                  {sections.home.map((item) => (
                    <TaskRow key={item.id} item={item} checked={Boolean(progressMap[item.id])} onToggle={() => toggleTask(item.id)} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Daily Activity" icon={CheckCircle2} subtitle="Safe movement and breathing habits" accent="blue">
                <div className="space-y-3">
                  {sections.activity.map((item) => (
                    <TaskRow key={item.id} item={item} checked={Boolean(progressMap[item.id])} onToggle={() => toggleTask(item.id)} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Environment" icon={Wind} subtitle="Reduce exposure to triggers" accent="amber">
                <div className="space-y-3">
                  {sections.environment.map((item) => (
                    <TaskRow key={item.id} item={item} checked={Boolean(progressMap[item.id])} onToggle={() => toggleTask(item.id)} />
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Progress ring</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">{progressPercent}% complete</h3>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Mark tasks as complete as you follow the plan. Your progress is saved locally for your account.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Warning signs</h3>
                  <p className="text-sm text-slate-500">Know when to get medical help</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {(plan?.care_plan?.warning_signs || []).map((item) => (
                  <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <h3 className="text-xl font-semibold text-slate-900">Questions for your doctor</h3>
              <div className="mt-4 space-y-3">
                {(plan?.care_plan?.questions_for_doctor || []).map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
              <h3 className="text-xl font-semibold">Follow-up</h3>
              <p className="mt-3 text-sm leading-6 text-slate-900">{safeText(plan?.care_plan?.follow_up)}</p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-900">
                {safeText(plan?.care_plan?.disclaimer, "This plan is AI-generated and should support, not replace, medical advice from a qualified clinician.")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
          <button onClick={() => fetchPlan({ isRefresh: true })} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-800" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Regenerate plan
          </button>
          <Link to="/Report" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
            View report
          </Link>
          <Link to="/dashboard" className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CarePlanUI;
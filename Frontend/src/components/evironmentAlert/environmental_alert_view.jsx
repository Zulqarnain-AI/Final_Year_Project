import fetchAqiData from "./Api_data-fetching";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./Card";
import { Activity, Bell, HeartPulse, Info, MapPin, ShieldAlert } from "lucide-react";

const REPORT_API_URL = "http://127.0.0.1:5000/reports/latest";
const PROFILE_API_URLS = [
  "http://127.0.0.1:5000/api/users/profile",
  "http://localhost:5000/api/users/profile",
];

const RISK_STYLES = {
  normal: {
    label: "Normal",
    color: "#16a34a",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  caution: {
    label: "Caution",
    color: "#ca8a04",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  risky: {
    label: "Risky",
    color: "#ea580c",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  high_risk: {
    label: "High Risk",
    color: "#dc2626",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const EPA_TO_RISK = {
  1: "normal",
  2: "caution",
  3: "risky",
  4: "risky",
  5: "high_risk",
  6: "high_risk",
};

const POLLUTANT_META = [
  {
    key: "pm2_5",
    label: "PM2.5 (Fine Dust)",
    short: "Fine dust particles",
    unit: "ug/m3",
    safeTip: "Usually safe below 15",
    meaning: "Very tiny dust that can go deep into the lungs.",
    effects: "Can trigger cough, wheeze, and breathing difficulty.",
    thresholds: { normal: 15, caution: 35, risky: 55 },
  },
  {
    key: "pm10",
    label: "PM10 (Dust)",
    short: "Larger dust particles",
    unit: "ug/m3",
    safeTip: "Usually safe below 45",
    meaning: "Dust particles that irritate nose and throat.",
    effects: "Can worsen sneezing, cough, and airway irritation.",
    thresholds: { normal: 45, caution: 100, risky: 150 },
  },
  {
    key: "no2",
    label: "NO2 (Traffic Gas)",
    short: "Gas from traffic and fuel burning",
    unit: "ug/m3",
    safeTip: "Usually safe below 25",
    meaning: "Common near roads and heavy traffic.",
    effects: "Can inflame airways and worsen asthma symptoms.",
    thresholds: { normal: 25, caution: 50, risky: 100 },
  },
  {
    key: "o3",
    label: "O3 (Ground Ozone)",
    short: "Smog-related gas",
    unit: "ug/m3",
    safeTip: "Usually safe below 100",
    meaning: "A harmful gas formed on sunny, polluted days.",
    effects: "Can cause chest discomfort and shortness of breath.",
    thresholds: { normal: 100, caution: 160, risky: 200 },
  },
  {
    key: "so2",
    label: "SO2 (Irritant Gas)",
    short: "Gas from industrial burning",
    unit: "ug/m3",
    safeTip: "Usually safe below 40",
    meaning: "Gas from factories and fuel combustion.",
    effects: "Can trigger throat irritation and breathing stress.",
    thresholds: { normal: 40, caution: 80, risky: 160 },
  },
  {
    key: "co",
    label: "CO (Carbon Monoxide)",
    short: "Toxic gas from incomplete burning",
    unit: "ug/m3",
    safeTip: "Usually safe below 4000",
    meaning: "Reduces oxygen delivery in the body when high.",
    effects: "Can cause headache, dizziness, and fatigue.",
    thresholds: { normal: 4000, caution: 9000, risky: 15000 },
  },
];

const DIAGNOSIS_LABEL = {
  asthma: "Asthma",
  copd: "COPD",
  bronchial: "Bronchial inflammation",
  bronchitis: "Bronchitis",
  pneumonia: "Pneumonia",
  healthy: "No major respiratory condition",
  general: "General guidance",
};

const DIAGNOSIS_RECOMMENDATIONS = {
  asthma: {
    primary: "Keep rescue inhaler nearby and reduce outdoor time during pollution peaks.",
    avoid: "Outdoor exercise near traffic and dusty areas.",
    watch: "Wheeze, chest tightness, or sudden shortness of breath.",
  },
  copd: {
    primary: "Stay indoors with clean air and avoid physical strain outdoors.",
    avoid: "Smoke, heavy road exposure, and strong cleaning chemicals.",
    watch: "Increased breathlessness, fatigue, or changes in sputum.",
  },
  bronchial: {
    primary: "Protect your airways with a mask in polluted environments.",
    avoid: "Dusty rooms, smoke, and prolonged outdoor exposure.",
    watch: "Persistent cough or chest irritation.",
  },
  bronchitis: {
    primary: "Rest, hydrate, and reduce pollutant exposure to support recovery.",
    avoid: "Cold polluted air and smoke-heavy environments.",
    watch: "Worsening cough, fever, or breathlessness.",
  },
  pneumonia: {
    primary: "Prioritize rest indoors and maintain medication schedule carefully.",
    avoid: "Any polluted outdoor activity until clinically improved.",
    watch: "Fever, chest pain, or reduced oxygen comfort.",
  },
  healthy: {
    primary: "Maintain hydration and limit outdoor activity when air quality worsens.",
    avoid: "Long outdoor workouts in heavy traffic hours.",
    watch: "New cough, throat irritation, or unusual breathing discomfort.",
  },
  general: {
    primary: "Follow air quality alerts and reduce exposure during risky periods.",
    avoid: "High traffic pollution windows and smoke.",
    watch: "Any breathing discomfort that does not improve.",
  },
};

function normalizeDiagnosis(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (!normalized) return "general";
  if (normalized === "copd") return "copd";
  if (["bronchial", "bronchitis"].includes(normalized)) return normalized;
  if (["asthma", "pneumonia", "healthy"].includes(normalized)) return normalized;
  return "general";
}

function classifyByThreshold(value, thresholds) {
  const numericValue = Number(value ?? 0);
  if (numericValue <= thresholds.normal) return "normal";
  if (numericValue <= thresholds.caution) return "caution";
  if (numericValue <= thresholds.risky) return "risky";
  return "high_risk";
}

function riskWeight(level) {
  if (level === "high_risk") return 4;
  if (level === "risky") return 3;
  if (level === "caution") return 2;
  return 1;
}

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token");
}

function getProfileCondition(profile) {
  if (!profile) return "";
  if (typeof profile.currentMedicalCondition === "string" && profile.currentMedicalCondition.trim()) {
    return profile.currentMedicalCondition;
  }
  if (Array.isArray(profile.medicalConditions) && profile.medicalConditions.length > 0) {
    return profile.medicalConditions[0];
  }
  return "";
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getCachedCondition(user) {
  if (!user?.id) return "";
  const key = `latest_diagnosis_report_${user.id}`;
  const raw = localStorage.getItem(key);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed?.final_prediction || "";
  } catch {
    return "";
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => reject(new Error("Location permission denied")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

async function fetchLatestDiagnosis(token) {
  if (!token) return null;
  try {
    const response = await fetch(REPORT_API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchProfile(token) {
  if (!token) return null;
  for (const endpoint of PROFILE_API_URLS) {
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // Try next endpoint if available.
    }
  }
  return null;
}

async function resolveCityFromCoordinates(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
    const response = await fetch(url);
    if (!response.ok) return "";
    const data = await response.json();
    return (
      data?.city ||
      data?.locality ||
      data?.principalSubdivision ||
      ""
    );
  } catch {
    return "";
  }
}

export default function EnvironmentalAlertView() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [context, setContext] = useState({
    locationSource: "IP based",
    displayCity: "",
    diagnosis: "general",
    diagnosisSource: "General guidance",
  });

  const loadContextAndData = async () => {
    setLoading(true);
    setError("");
    try {
      const user = getCurrentUser();
      const token = getToken();

      let diagnosis = normalizeDiagnosis(getCachedCondition(user));
      let diagnosisSource = diagnosis === "general" ? "General guidance" : "Latest diagnosis (cached)";

      const latestReport = await fetchLatestDiagnosis(token);
      if (latestReport?.final_prediction) {
        diagnosis = normalizeDiagnosis(latestReport.final_prediction);
        diagnosisSource = "Latest diagnosis report";
      } else {
        const profile = await fetchProfile(token);
        const profileCondition = normalizeDiagnosis(getProfileCondition(profile));
        if (profileCondition !== "general") {
          diagnosis = profileCondition;
          diagnosisSource = "Profile medical condition";
        }
      }

      let query = "auto:ip";
      let locationSource = "IP based";
      let displayCity = "";
      try {
        const position = await getCurrentPosition();
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        query = `${lat},${lon}`;
        locationSource = "GPS";
        displayCity = await resolveCityFromCoordinates(lat, lon);
      } catch {
        locationSource = "IP based";
      }

      const weather = await fetchAqiData(query);
      setApiData(weather);
      const fallbackCity = weather?.location?.region || weather?.location?.name || "";
      setContext({
        locationSource,
        displayCity: displayCity || fallbackCity,
        diagnosis,
        diagnosisSource,
      });
    } catch (err) {
      setError(err.message || "Unable to load environmental data at the moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContextAndData();
  }, []);

  const aqi = apiData?.current?.air_quality || {};
  const epaIndex = Number(aqi["us-epa-index"] || 1);

  const pollutantCards = useMemo(() => {
    return POLLUTANT_META.map((meta) => {
      const value = Number(aqi[meta.key] ?? 0);
      const level = classifyByThreshold(value, meta.thresholds);
      return {
        ...meta,
        value,
        level,
      };
    });
  }, [aqi]);

  const overallRisk = useMemo(() => {
    const pollutantMax = pollutantCards.reduce(
      (max, item) => Math.max(max, riskWeight(item.level)),
      1
    );
    const epaRiskWeight = riskWeight(EPA_TO_RISK[epaIndex] || "normal");
    const maxWeight = Math.max(pollutantMax, epaRiskWeight);
    if (maxWeight >= 4) return "high_risk";
    if (maxWeight === 3) return "risky";
    if (maxWeight === 2) return "caution";
    return "normal";
  }, [pollutantCards, epaIndex]);

  const weatherSnapshot = useMemo(() => {
    if (!apiData?.current) return [];
    return [
      { label: "Temperature", value: `${apiData.current.temp_c} C`, tip: "High heat can worsen breathing stress." },
      { label: "Humidity", value: `${apiData.current.humidity}%`, tip: "Very high humidity may make breathing feel heavy." },
      { label: "Wind", value: `${apiData.current.wind_kph} km/h`, tip: "Wind can spread dust and pollen." },
      { label: "UV Index", value: `${apiData.current.uv}`, tip: "Higher UV often aligns with stronger daytime smog." },
    ];
  }, [apiData]);

  const recommendation = useMemo(() => {
    const base = DIAGNOSIS_RECOMMENDATIONS[context.diagnosis] || DIAGNOSIS_RECOMMENDATIONS.general;
    const level = RISK_STYLES[overallRisk];

    let urgencyText = "Daily risk is low. Regular preventive care is enough.";
    if (overallRisk === "caution") urgencyText = "Some sensitivity expected. Reduce prolonged outdoor exposure.";
    if (overallRisk === "risky") urgencyText = "Air can aggravate symptoms. Keep activities light and indoor-focused.";
    if (overallRisk === "high_risk") urgencyText = "Health impact likely. Minimize outdoor exposure and monitor symptoms closely.";

    return {
      ...base,
      levelLabel: level.label,
      levelColor: level.color,
      urgencyText,
    };
  }, [context.diagnosis, overallRisk]);

  if (loading) {
    return (
      <div className="p-6">
        <Card className="border border-cyan-100">
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-cyan-700">Preparing your personalized air safety view...</p>
            <p className="text-sm text-slate-600 mt-2">
              Detecting your location and health context to provide clearer recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !apiData) {
    return (
      <div className="p-6">
        <Card className="border border-red-200">
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-red-600">Unable to load environmental alert right now</p>
            <p className="text-sm text-slate-600 mt-2">{error || "Please try again in a few moments."}</p>
            <button
              type="button"
              onClick={loadContextAndData}
              className="mt-4 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { location, current } = apiData;
  const overallStyle = RISK_STYLES[overallRisk];
  const diagnosisLabel = DIAGNOSIS_LABEL[context.diagnosis] || DIAGNOSIS_LABEL.general;
  const riskPercent = Math.min(100, Math.max(20, riskWeight(overallRisk) * 25));
  const cityLabel = context.displayCity || location.region || location.name;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="rounded-2xl p-6 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow-lg">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Environmental Alert</h1>
            <p className="text-cyan-50 mt-1 text-sm md:text-base">
              Easy-to-understand air safety guidance based on your health context.
            </p>
          </div>
          <button
            type="button"
            onClick={loadContextAndData}
            className="rounded-lg bg-white text-cyan-700 px-4 py-2 text-sm font-semibold"
          >
            Refresh Data
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/15 p-3 border border-white/25">
            <p className="font-semibold flex items-center gap-2">
              <MapPin size={16} /> {cityLabel}, {location.country}
            </p>
            <p className="text-cyan-50 mt-1">Location source: {context.locationSource}</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 border border-white/25">
            <p className="font-semibold flex items-center gap-2">
              <HeartPulse size={16} /> Detected condition: {diagnosisLabel}
            </p>
            <p className="text-cyan-50 mt-1">Diagnosis source: {context.diagnosisSource}</p>
          </div>
        </div>
      </div>

      <Card className={`border ${overallStyle.border}`}>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <p className="text-sm text-slate-500">Today's Air Risk</p>
              <p className="text-2xl font-bold" style={{ color: overallStyle.color }}>
                {overallStyle.label}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                US-EPA index is {epaIndex}. We translated this into a simpler safety status.
              </p>
            </div>
            {overallRisk !== "normal" && (
              <div className={`rounded-lg px-3 py-2 ${overallStyle.bg} ${overallStyle.text} font-semibold flex items-center gap-2`}>
                <Bell size={16} /> Extra care advised today
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Daily risk meter</p>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${riskPercent}%`, backgroundColor: overallStyle.color }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Higher bar means higher chance of breathing discomfort for sensitive users.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {weatherSnapshot.map((item) => (
          <Card key={item.label} className="border border-slate-200">
            <CardContent>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-800">{item.value}</p>
              <p className="text-xs text-slate-500 mt-1">{item.tip}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800">Air Components Explained</h2>
        <p className="text-sm text-slate-600 mt-1">
          Technical terms are translated below with simple meanings and safe ranges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pollutantCards.map((item) => {
          const style = RISK_STYLES[item.level];
          const meterMax = item.thresholds.risky * 1.4;
          const fill = Math.min(100, (item.value / meterMax) * 100);
          return (
            <Card key={item.key} className={`border ${style.border}`}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{item.label}</h3>
                    <p className="text-xs text-slate-500">{item.short}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-bold" style={{ color: style.color }}>
                    {item.value.toFixed(1)} <span className="text-sm font-medium text-slate-600">{item.unit}</span>
                  </p>
                  <p className="text-xs text-slate-500">{item.safeTip}</p>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${fill}%`, backgroundColor: style.color }}></div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-start gap-1"><Info size={14} className="mt-0.5" /> {item.meaning}</p>
                  <p>{item.effects}</p>
                  <p>
                    Range guide: Normal {`<=${item.thresholds.normal}`}, Caution {`${item.thresholds.normal + 1}-${item.thresholds.caution}`}, Risky {`${item.thresholds.caution + 1}-${item.thresholds.risky}`}, High Risk {`>${item.thresholds.risky}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-l-4 shadow-lg" style={{ borderColor: recommendation.levelColor }}>
        <CardContent className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: recommendation.levelColor }}>
            <Activity className="w-5 h-5" /> Personalized Health Recommendation
          </h3>

          <div className={`rounded-xl p-4 border ${overallStyle.border} ${overallStyle.bg}`}>
            <p className={`font-semibold ${overallStyle.text}`}>Current level: {recommendation.levelLabel}</p>
            <p className="text-sm text-slate-700 mt-1">{recommendation.urgencyText}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <p className="text-sm font-semibold text-cyan-800">What to do now</p>
              <p className="text-sm text-slate-700 mt-2">{recommendation.primary}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-sm font-semibold text-amber-800">What to avoid today</p>
              <p className="text-sm text-slate-700 mt-2">{recommendation.avoid}</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <p className="text-sm font-semibold text-rose-800 flex items-center gap-1">
                <ShieldAlert size={14} /> If symptoms worsen
              </p>
              <p className="text-sm text-slate-700 mt-2">Watch for {recommendation.watch}. Seek medical support if symptoms persist.</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            This guidance combines your detected health condition and today's air risk indicators.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500">
        <Card><CardContent>Visibility: {current.vis_km} km</CardContent></Card>
        <Card><CardContent>Pressure: {current.pressure_mb} mb</CardContent></Card>
        <Card><CardContent>Cloud cover: {current.cloud}%</CardContent></Card>
      </div>
    </div>
  );
}

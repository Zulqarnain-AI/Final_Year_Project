import fetch_aqi_data from "./api_data-fetching";
import { useState, useEffect } from "react";
import { Card, CardContent } from "./Card";
import { MapPin, Bell, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export default function EnvironmentalAlertView() {
  const [apiData, setApiData] = useState(null);
  const [city, setCity] = useState("Islamabad");
  const [disease, setDisease] = useState("healthy");

  useEffect(() => {
    fetch_aqi_data(city).then(setApiData);
  }, [city]);

  if (!apiData) return <p className="p-6">Loading...</p>;

  const { location, current } = apiData;
  const aqi = current.air_quality;

  /* AQI severity */
  const severityMap = {
    1: { label: "Good", color: "#22c55e", sensitivity: "Low" },
    2: { label: "Moderate", color: "#eab308", sensitivity: "Mild" },
    3: { label: "Unhealthy (Sensitive)", color: "#f97316", sensitivity: "High" },
    4: { label: "Unhealthy", color: "#ef4444", sensitivity: "Very High" },
    5: { label: "Hazardous", color: "#7f1d1d", sensitivity: "Extreme" },
  };

  const severity = severityMap[aqi["us-epa-index"]];

  /* Disease-based recommendations */
  const recommendations = {
    asthma: "Avoid outdoor activity. Use mask, keep inhaler ready. PM2.5 is a major trigger.",
    COPD: "High risk of breathlessness. Stay indoors, avoid exertion, follow medication plan.",
    bronchitis: "Air pollutants may worsen cough. Avoid smoke and polluted areas.",
    pneumonia: "Rest indoors and avoid exposure. Polluted air delays recovery.",
    healthy: "Limit prolonged outdoor exposure. Stay hydrated and monitor air quality.",
  };

  /* Charts data */
  const pollutants = [
    { name: "PM2.5", value: aqi.pm2_5 },
    { name: "PM10", value: aqi.pm10 },
    { name: "CO", value: aqi.co },
    { name: "NO₂", value: aqi.no2 },
    { name: "O₃", value: aqi.o3 },
    { name: "SO₂", value: aqi.so2 },
  ];

  const trend = [
    { t: "6 AM", pm25: 30 },
    { t: "9 AM", pm25: 45 },
    { t: "12 PM", pm25: 60 },
    { t: "3 PM", pm25: aqi.pm2_5 },
    { t: "6 PM", pm25: 55 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#14b8a6" }}>
            Environmental Alert
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={16} /> {location.name}, {location.country}
          </p>
        </div>
        <div className="flex gap-3">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="border rounded px-3 py-1">
            <option>Islamabad</option>
            <option>Lahore</option>
            <option>Karachi</option>
          </select>
          <select value={disease} onChange={(e) => setDisease(e.target.value)} className="border rounded px-3 py-1">
            <option value="healthy">Healthy</option>
            <option value="asthma">Asthma</option>
            <option value="COPD">COPD</option>
            <option value="bronchitis">Bronchitis</option>
            <option value="pneumonia">Pneumonia</option>
          </select>
        </div>
      </div>

      {/* AQI Severity */}
      <Card className="border-l-4" style={{ borderColor: severity.color }}>
        <CardContent className="flex justify-between items-center">
          <div>
            <p className="text-sm">Air Quality Status</p>
            <p className="text-xl font-bold" style={{ color: severity.color }}>
              {severity.label}
            </p>
            <p className="text-sm text-gray-500">Sensitivity: {severity.sensitivity}</p>
          </div>
          {aqi.pm2_5 > 35 && (
            <div className="flex items-center gap-2 text-red-600">
              <Bell /> PM2.5 Alert
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather + environment info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent>🌡 Temp: {current.temp_c} °C</CardContent></Card>
        <Card><CardContent>💧 Humidity: {current.humidity}%</CardContent></Card>
        <Card><CardContent>💨 Wind: {current.wind_kph} km/h</CardContent></Card>
        <Card><CardContent>☀ UV Index: {current.uv}</CardContent></Card>
        <Card><CardContent>🌫 Visibility: {current.vis_km} km</CardContent></Card>
        <Card><CardContent>🧪 Pressure: {current.pressure_mb} mb</CardContent></Card>
        <Card><CardContent>☁ Cloud: {current.cloud}%</CardContent></Card>
        <Card><CardContent>🌧 Precip: {current.precip_mm} mm</CardContent></Card>
      </div>
      {/* PM2.5 Trend */}
      <Card>
        <CardContent>
          <h3 className="font-semibold mb-2" style={{ color: "#14b8a6" }}>
            PM2.5 Hourly Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pm25" stroke="#14b8a6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pollutant charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pollutants.map((p) => (
          <Card key={p.name}>
            <CardContent>
              <h3 className="font-semibold mb-2" style={{ color: "#14b8a6" }}>{p.name}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[p]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      

           {/* Recommendations */}
      <Card className="border-l-4 shadow-lg" style={{ borderColor: "#14b8a6" }}>
        <CardContent>
          <h3
            className="font-bold text-lg mb-2 flex items-center gap-2"
            style={{ color: "#14b8a6" }}
          >
            <Activity className="w-5 h-5" /> Personalized Health Recommendation
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Recommendation Text */}
            <div className="bg-teal-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {recommendations[disease]}
              </p>
            </div>

            {/* Actionable Tips */}
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm font-semibold mb-2 text-gray-800">Suggested Actions</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Avoid outdoor activity during peak pollution hours</li>
                <li>Wear a mask if you must go outside</li>
                <li>Keep medications readily available</li>
                <li>Ensure good indoor ventilation</li>
              </ul>
            </div>
          </div>

          {/* Risk Level Indicator */}
          <div className="mt-4">
            <p className="text-sm font-semibold mb-1 text-gray-700">Current Risk Level</p>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full"
                style={{
                  width:
                    aqi.pm2_5 < 25
                      ? "25%"
                      : aqi.pm2_5 < 35
                      ? "50%"
                      : aqi.pm2_5 < 55
                      ? "75%"
                      : "100%",
                  backgroundColor: severity.color,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on PM2.5 concentration and selected health condition
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
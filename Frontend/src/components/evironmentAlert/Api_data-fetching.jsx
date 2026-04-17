const WEATHER_API_BASE = "http://api.weatherapi.com/v1/current.json";
const WEATHER_API_KEY = "b22130263a3a449a8d0155902251312";

export default async function fetchAqiData(query = "auto:ip") {
  const normalizedQuery = String(query || "auto:ip").trim() || "auto:ip";
  const apiUrl = `${WEATHER_API_BASE}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(normalizedQuery)}&aqi=yes`;

  const response = await fetch(apiUrl);
  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || "Unable to fetch environmental data";
    throw new Error(message);
  }

  if (!payload?.current?.air_quality || !payload?.location) {
    throw new Error("Environmental data is incomplete. Please try again.");
  }

  return payload;
}
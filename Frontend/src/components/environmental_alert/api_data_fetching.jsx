
export default async function fetch_aqi_data() {
    const api_url = "http://api.weatherapi.com/v1/current.json?key=b22130263a3a449a8d0155902251312&q=Islamabad&aqi=yes";

    let response = await fetch(api_url)

    return await response.json();
}
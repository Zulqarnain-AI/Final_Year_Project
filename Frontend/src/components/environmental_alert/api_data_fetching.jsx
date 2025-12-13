import { useEffect, useState } from "react"

export default function Fetch_aqi_data() {
    const [api_data, setApi_data] = useState();
    const api_url = "http://api.weatherapi.com/v1/current.json?key=b22130263a3a449a8d0155902251312&q=Islamabad&aqi=yes";
    const fetch_data = async () => {
        let api_data = await fetch(api_url)

        api_data = await api_data.json()
        setApi_data(api_data)
        console.log(api_data)
    }
    useEffect(() => {
        fetch_data();
    }, [])
    if (!api_data) return <h1>loading</h1>
    return (
        <>
        <ul>
            <li>countrr: {api_data.location.country}</li>
            <li>city: {api_data.location.region}</li>
            <h2>current aqi:</h2>
            <li>condition:{api_data.current.condition.text} </li>
            <li>humidity:{api_data.current.humidity} </li>
            

        </ul>

        </>
    )
}
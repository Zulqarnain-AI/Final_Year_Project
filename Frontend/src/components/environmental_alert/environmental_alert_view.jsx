import fetch_aqi_data from "./api_data_fetching";
import { useState,useEffect } from "react";

export default function EnvironmentalAlertView() {

    const [api_data, setApi_data] = useState()
    
    const getdata=async ()=>{
        let data = await fetch_aqi_data();
        setApi_data(data);
    }

    useEffect(()=>{
        getdata();
    },[])

    if (!api_data) return <h1>loading...</h1>
    
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
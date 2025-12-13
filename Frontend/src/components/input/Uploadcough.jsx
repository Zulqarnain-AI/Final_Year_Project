import React,{useState} from "react";
import {Mic} from "lucide-react"
import {UploadCloud} from "lucide-react"
import VoiceRecorder from "./image/Mic.png"
import FileUpload from "./image/upload file.png"
import { Link, useNavigate } from "react-router-dom";

function Uploadcough() {
  const [loading, setLoading]= useState(false);
  const navigate= useNavigate();
  const handleDiagonsis=()=>{
    setLoading(true);

    setTimeout(()=>{
      setLoading(false);
      navigate("/Report");
    },2000)

  }
  return (
    <>
      <main >
        <div className="flex justify-center items-center gap-6 flex-col w-full py-10">
          <div>
        <h1 className="style-poppins text-center fon-weight-700 font-bold text-[40px]">Record or Upload Cough</h1>
        <p className="style-poppins fon-weight-400  text-[30px]">Record or upload a sample of your cough</p>
        </div>
        <div className=" flex flex-row gap-5">
          <div className="card w-[423px] h-[207px] shadow-md border-0 rounded-lg mt-5 flex flex-col justify-center items-center">
            <span className="flex flex-col justify-center  items-center  cursor-pointer">
           {/* <Mic  className="text-[#1FB9C1] w-[98px] h-[70px] hover:text-[#6EE7EC]" size={48} /> */}
           <img src={VoiceRecorder} alt="" className="text-[#1FB9C1] w-[58px] h-[90px] hover:text-[#6EE7EC]" />
           <h1 className="style-poppins hover:text-[#6EE7EC] text-[#1FB9C1] fon-weight-700 font-bold text-[20px]">Record</h1>
           </span>
          </div>
          <div className="card w-[423px] h-[207px] shadow-md border-0 rounded-lg mt-5 flex flex-col justify-center items-center">
            <span className="flex flex-col justify-center  items-center  cursor-pointer">
           
           <img src={FileUpload} alt="" className="text-[#1FB9C1] w-[100px] h-[100px] hover:text-[#6EE7EC]" />
           <h1 className="style-poppins hover:text-[#6EE7EC] text-[#1FB9C1] fon-weight-700 font-bold text-[20px]">Upload</h1>
           </span>
          </div>
         
        </div>
         
            <button
            onClick={handleDiagonsis}
            // Disable while loading
            className="w-[200px] h-[50px] bg-[#1FB9C1] hover:bg-[#6EE7EC] rounded-lg font-bold  text-white style-poppins text-[18px]"
            >
            {loading ? "Analyzing..." : "Get Diagnosis"}
            </button>
            
        
        </div>
       
      </main>
    </>
  );
}

export default Uploadcough;

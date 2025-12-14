import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import lungIcon from "../dashboard/image/lung logo.png";
import { useState } from "react";
import Doctor from "./image/doctor1.png";
import Patient from "./image/user.png";
import { ArrowLeft } from "lucide-react";
function Navbar() {
  const [form, setForm] = useState(false);

  return (
    <>
      <nav className="p-5 px-5 shadow-md">
        <div className="flex justify-between">
          {/* Logo-section */}
          <div className="primary">
            <h1 className="text-xl font-bold primary flex flex-row gap-1">
              <img src={lungIcon} alt="" className="w-[26px] h-[27px]" />
              BreatheWell
            </h1>
          </div>
          {/* Menu-section */}
          <div>
            <ul className="flex align-center gap-10 pr-4 font-semibold">
              <li
                className="  relative cursor-pointer  
             after:content-[''] after:absolute after:left-0 after:-bottom-1 
             after:w-0 after:h-[2px] after:bg-[#059AA0] 
             after:transition-all after:duration-300 
             hover:after:w-full"
              >
                <a href="#">Home</a>
              </li>
              <li
                className="  relative cursor-pointer  
             after:content-[''] after:absolute after:left-0 after:-bottom-1 
             after:w-0 after:h-[2px] after:bg-[#059AA0]
             after:transition-all after:duration-300 
             hover:after:w-full"
              >
                <a href="#about">About Us</a>
              </li>
              <li
                className="  relative cursor-pointer  
             after:content-[''] after:absolute after:left-0 after:-bottom-1 
             after:w-0 after:h-[2px] after:bg-[#059AA0] 
             after:transition-all after:duration-300 
             hover:after:w-full"
              >
                <a href="#contact">Contact</a>
              </li>
              <li className="cursor-pointer" onClick={() => setForm(!form)}>
                <button className="primary-bg  hover:border-primary hover:border-1  hover:bg-white hover:text-black text-white py-1 px-4 rounded-full">
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {form && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
    
    {/* Modal */}
    <div
      className="relative w-[540px] bg-white rounded-2xl shadow-2xl p-8"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <ArrowLeft
          onClick={() => setForm(false)}
          className="w-6 h-6 cursor-pointer text-[#059AA0] bg-[#E6EEF8] rounded-full hover:opacity-70"
        />
        <h1 className="flex-1 text-center text-2xl font-bold">
          Welcome to BreatheWell
        </h1>
      </div>

      <p className="text-center text-gray-600 mb-8">
        To access the portal, please choose your access type
      </p>

      {/* Options */}
      <div className="flex gap-6 justify-center">
        <Link to="/login">
          <div className="w-[160px] h-[180px] border border-[#E6EEF8] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg hover:border-[#059AA0]">
            <img src={Doctor} alt="Doctor" className="w-[90px] h-[90px]" />
            <p className="mt-3 text-lg font-semibold">Doctor</p>
          </div>
        </Link>

        <Link to="/login">
          <div className="w-[160px] h-[180px] border border-[#E6EEF8] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg hover:border-[#059AA0]">
            <img src={Patient} alt="Patient" className="w-[90px] h-[90px]" />
            <p className="mt-3 text-lg font-semibold">Patient</p>
          </div>
        </Link>
      </div>
    </div>
  </div>
)}

    </>
  );
}
export default Navbar;

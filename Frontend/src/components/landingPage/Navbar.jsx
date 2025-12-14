import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from '../login/Login';
import Herosection from './HeroSection';
import lungIcon from "../dashboard/image/lung logo.png"
import { useState } from 'react';
import Doctor from './image/doctor1.png'
import Patient from './image/user.png'
function Home() {
  const [form, setForm] = useState(false);
  function colseform() {
    setForm(!form)
  }
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
              <Link to="/login">
                <li className="cursor-pointer">
                  <button className="primary-bg  hover:border-black  hover:bg-white hover:text-black text-white py-1 px-4 rounded-full">
                    get started
                  </button>
                </li>
              </Link>
            </ul>
          </div>
        </div>
      </nav>

    </>
  );
}
export default Home;

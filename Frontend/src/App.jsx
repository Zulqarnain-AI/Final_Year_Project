import Home from "./components/landingPage/Navbar"
import Herosection from "./components/landingPage/HeroSection"
import Login from "./components/login/Login"
import Dashboard from "./components/dashboard/dashboard"
import Input from "./components/input/Input"
import Landing from "./components/landingPage/Landing"
import Uploadcough from "./components/input/UploadInput"
import Report from "./components/input/Report"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import RegisterForm from "./components/login/RegisterForm"
import EnvironmentalAlertView from "./components/evironmentAlert/environmental_alert_view"
import DoctorList from "./components/doctor_apointment/DoctorList"
import DoctorProfile from "./components/doctor_apointment/DoctorPeofile"
function App() {

  return (

    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/environmmental_alert" element={<EnvironmentalAlertView />} />
          <Route path="/Input" element={<Input />} />
          <Route path="/Uploadcough" element={<Uploadcough />} />
          <Route path="/Report" element={<Report />} />
          <Route path="/RegisterForm" element={<RegisterForm />} />
          <Route path="/DoctorList" element={<DoctorList />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />


        </Routes>
      </Router>






    </>
  )
} export default App
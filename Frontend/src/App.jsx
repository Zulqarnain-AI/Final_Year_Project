import Home from "./components/landingPage/Navbar"
import Herosection from "./components/landingPage/HeroSection"
import Login from "./components/login/Login"
import Dashboard from "./components/dashboard/dashboard"
import Input from "./components/input/Input"
import Landing from "./components/landingPage/Landing"
import Uploadcough from "./components/input/UploadInput"
import Report from "./components/input/Report"
import EnvironmentalAlertView from "./components/environmental_alert/environmental_alert_view"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import RegisterForm from "./components/login/RegisterForm"
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

        </Routes>
      </Router>






    </>
  )
} export default App
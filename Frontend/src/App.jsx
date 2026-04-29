import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom"

import Home from "./components/landingPage/Navbar"
import Herosection from "./components/landingPage/HeroSection"
import Login from "./components/login/Login"
import Dashboard from "./components/dashboard/dashboard"
import Input from "./components/input/Input"
import Landing from "./components/landingPage/Landing"
import Uploadcough from "./components/input/UploadInput"
import Report from "./components/input/Report"
import RegisterForm from "./components/login/RegisterForm"
import EnvironmentalAlertView from "./components/evironmentAlert/environmental_alert_view"
import DoctorList from "./components/doctor_apointment/DoctorList"
import DoctorProfile from "./components/doctor_apointment/DoctorPeofile"
import PatientAppointments from "./components/doctor_apointment/PatientAppointments"
import DoctorDashboard from "./components/doctor_dashboard/DoctorDashboard"
import AppointmentDetail from "./components/doctor_dashboard/AppointmentDetail"
import DoctorProfileView from "./components/doctor_profile/DoctorProfileView"
import DoctorProfileEdit from "./components/doctor_profile/DoctorProfileEdit"
import CarePlanUI from "./components/care_plan/Careplan"
import UserProfileView from "./components/profile/UserProfileView"
import UserSettings from "./components/profile/Setting"
import Editprofile from "./components/profile/Editprofile"
import History from "./components/history/History"
import Header from "./components/global/Header"
import Chatbot from "./components/chatbot/Chatbot"

function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-4 py-6 sm:px-8 lg:px-12">
      <Header />
      <Outlet />
    </div>
  )
}

function App() {

  return (

    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/RegisterForm" element={<RegisterForm />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/environmmental_alert" element={<EnvironmentalAlertView />} />
            <Route path="/Input" element={<Input />} />
            <Route path="/Uploadcough" element={<Uploadcough />} />
            <Route path="/Report" element={<Report />} />
            <Route path="/DoctorList" element={<DoctorList />} />
            <Route path="/doctors/:id" element={<DoctorProfile />} />
            <Route path="/appointments" element={<PatientAppointments />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments/:id" element={<AppointmentDetail />} />
            <Route path="/doctor/profile" element={<DoctorProfileView />} />
            <Route path="/doctor/profile/edit" element={<DoctorProfileEdit />} />
            <Route path="/careplan" element={<CarePlanUI />} />
            <Route path="/profile" element={<UserProfileView />} />
            <Route path="/setting" element={<UserSettings />} />
            <Route path="/editProfile" element={<Editprofile />} />
            <Route path="/history" element={<History />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Route>


        </Routes>
      </Router>






    </>
  )
} export default App
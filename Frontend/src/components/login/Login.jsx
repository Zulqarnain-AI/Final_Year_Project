"use client"

import google from "./image/google.webp"
import facebook from "./image/facebook.webp"
import apple from "./image/apple.png"
import image from "./image/mainimage.png"
import { useState } from "react"
import Lung from "../dashboard/image/lung logo.png"
import { Link } from "react-router-dom"

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  // const [showForm, setShowForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  // const handleOpen = () => setShowForm(true)
  // const handleClose = () => setShowForm(false)
  const handleOpenRegister = () => setShowRegisterForm(true)
  const handleCloseRegister = () => setShowRegisterForm(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    console.log("Register data:", registerData)
    handleCloseRegister()
  }

  return (
    <>
      {/* Navigation */}
       <div className="px-[10px] py-[20px] hide-scrollbar  h-screen overflow-y-scroll">
       
      <nav className="p-5 px-5 shadow-lg shadow-[#059AA0]">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="">
            <h1 className="text-xl font-bold text-[#059AA0] flex flex-row gap-1"><img src={Lung} alt="" className="w-[26px] h-[27px] object-cover"/> BreatheWell</h1>
          </div>

          {/* Menu */}
          <div className="flex gap-12 font-medium text-gray-800">
            <a href="#" className="relative group cursor-pointer hover:text-teal-500 transition">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="relative group cursor-pointer hover:text-teal-500 transition">
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="relative group cursor-pointer hover:text-teal-500 transition">
              How to use
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 text-sm font-medium">
            {/* Improved language selector with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="text-gray-600 cursor-pointer hover:text-teal-500 transition flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-50"
              >
                🌐 {selectedLanguage}
                <span className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`}>▼</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max">
                  {["English", "Spanish", "French", "German", "Chinese"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang)
                        setShowLanguageMenu(false)
                      }}
                      className={`block w-full text-left px-4 py-2 hover:bg-teal-50 hover:text-teal-600 transition ${
                        selectedLanguage === lang ? "bg-teal-100 text-teal-600 font-semibold" : "text-gray-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/dashboard" className="text-teal-500 hover:text-teal-600 underline">
            <a href="#" className="text-teal-500 hover:text-teal-600 underline">
              Sign in
            </a>
            </Link>
            <button
              onClick={handleOpenRegister}
              className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition duration-200"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-gradient-to-br from-cyan-50 via-white to-white min-h-screen px-20 py-10">
        <div className="grid grid-cols-3 gap-16 items-center">
          {/* Left Section - Promotional Text */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight">
              Welcome back to
              <br />
              BreatheWell
            </h2>
            <p className="text-gray-700 text-base leading-relaxed">
              If you don't have an
              <br />
              account
              <br />
              you can{" "}
              <button
                onClick={handleOpenRegister}
                className="text-[#059AA0] font-semibold hover:text-teal-600 underline"
              >
                Register here!
              </button>
            </p>
          </div>

          {/* Center Section - Illustration */}
          <div className="flex justify-center items-center">
            <img
              src={image || "/placeholder.svg"}
              alt="Person with lungs illustration"
              className="w-full max-w-xs object-contain"
            />
          </div>

          {/* Right Section - Login Form */}
          <div className="bg-white px-8 py-4  rounded-2xl shadow-lg">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Welcome Back</h3>

            <form className="space-y-5">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#C5F2E8] text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#C5F2E8] text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-500 transition text-lg"
                >
                  {showPassword ? "🔓" : "🔒"}
                </button>
              </div>

              {/* Forget Password link */}
              <div className="text-right">
                <button type="button" className="text-sm text-gray-600 hover:text-teal-500 transition font-medium">
                  Forget Password ?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-[#059AA0] text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition duration-200 mt-6"
              >
                Sign In
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-gray-300"></span>
                <span className="text-xs text-gray-500 font-medium">Or continue with</span>
                <span className="flex-1 h-px bg-gray-300"></span>
              </div>

              {/* Social Login */}
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg hover:shadow-md transition border border-gray-200 hover:border-gray-300"
                  title="Sign in with Google"
                >
                  <img src={google || "/placeholder.svg"} alt="Google" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg hover:shadow-md transition border border-gray-200 hover:border-gray-300"
                  title="Sign in with Apple"
                >
                  <img src={apple || "/placeholder.svg"} alt="Apple" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg hover:shadow-md transition border border-gray-200 hover:border-gray-300"
                  title="Sign in with Facebook"
                >
                  <img src={facebook || "/placeholder.svg"} alt="Facebook" className="w-6 h-6" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      </div>

      {/* Register Form Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white px-8 py-1 rounded-2xl shadow-2xl w-96 max-h-[95vh] w-[600px] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseRegister}
              className="absolute top-7 right-[350px] text-gray-500 hover:text-red-700 text-2xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Create Account</h2>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your name"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-500 transition text-lg"
                  >
                    {showRegisterPassword ? "🔓" : "🔒"}
                  </button>
                </div>
              </div>

              {/* Age and Gender - 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    value={registerData.age}
                    onChange={handleRegisterChange}
                    className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={registerData.gender}
                    onChange={handleRegisterChange}
                    className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium transition cursor-pointer"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Height and Weight - 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="Enter height"
                    value={registerData.height}
                    onChange={handleRegisterChange}
                    className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="Enter weight"
                    value={registerData.weight}
                    onChange={handleRegisterChange}
                    className="w-full bg-cyan-100 text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500 font-medium transition"
                  />
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full bg-teal-500 text-white font-semibold py-1 rounded-lg hover:bg-teal-600 transition duration-200 mt-6"
              >
                Register
              </button>

              

              {/* Social Login */}
             

              
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Login

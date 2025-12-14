import google from "./image/google.webp"
import facebook from "./image/facebook.webp"
import apple from "./image/apple.png"
import image from "./image/mainimage.png"
import { useState } from "react"
import Lung from "../dashboard/image/lung logo.png"
import { Link, useNavigate } from "react-router-dom" // 🌟 IMPORT useNavigate
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"

function Login() {
  const [registerForm, setRegisterForm] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const [success, setSuccess] = useState("") // 🌟 STATE for success message
  const [error, setError] = useState("")     // 🌟 STATE for API error message
  
  const navigate = useNavigate() // 🌟 INITIALIZE useNavigate

  // Function to switch to login view (e.g., when clicking "Sign in" in the nav)
  const switchToLogin = () => {
    setRegisterForm(false);
    setError(""); // Clear previous errors
    setSuccess("");
  };
  
  // Clear messages when opening register form
  const switchToRegister = () => {
    setRegisterForm(true);
    setError("");
    setSuccess("");
  }


  return (
    <>
      {/* Navigation */}
      <div className="px-[10px] py-[20px] hide-scrollbar h-screen overflow-y-scroll">
        
        <nav className="p-5 px-5 shadow-lg shadow-[#059AA0]">
          <div className="flex justify-between items-center">
            {/* Logo (remains unchanged) */}
            <div className="">
              <h1 className="text-xl font-bold text-[#059AA0] flex flex-row gap-1"><img src={Lung} alt="" className="w-[26px] h-[27px] object-cover"/> BreatheWell</h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 text-sm font-medium">
              {/* Language Selector (remains unchanged) */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="text-gray-600 cursor-pointer hover:text-teal-500 transition flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-50"
                >
                  🌐 {selectedLanguage}
                  <span className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`}>▼</span>
                </button>
                {/* ... (Language dropdown content remains unchanged) ... */}
              </div>
              
              {/* 🌟 Update Link to trigger switch to login view */}
              <button onClick={switchToLogin} className="text-teal-500 hover:text-teal-600 underline">
                Sign in
              </button>
              
              {/* 🌟 Update button to trigger switch to register view */}
              <button onClick={switchToRegister} className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition duration-200">
                Register
              </button>
              
            </div>
          </div>
        </nav>

        {/* Register Form Modal (conditionally rendered) */}
        {registerForm && (
            <RegisterForm 
                registerForm={registerForm} 
                setRegisterForm={setRegisterForm}
                setError={setError} // Pass API error state handler
                setSuccess={setSuccess} // Pass API success state handler
            />
        )}


        {/* Main Content */}
        <main className="bg-gradient-to-br from-cyan-50 via-white to-white min-h-screen px-20 py-10">
          <div className="grid grid-cols-3 gap-16 items-center">
            {/* Left Section - Promotional Text */}
            <div className="space-y-6">
              {/* ... (Promotional text remains unchanged) ... */}
              <p className="text-gray-700 text-base leading-relaxed">
                If you don't have an
                <br />
                account
                <br />
                you can{" "}
                <button
                  onClick={switchToRegister} // 🌟 Use dedicated function
                  className="text-[#059AA0] font-semibold hover:text-teal-600 underline"
                >
                  Register here!
                </button>
              </p>
            </div>

            {/* Center Section - Illustration (remains unchanged) */}
            <div className="flex justify-center items-center">
              <img
                src={image || "/placeholder.svg"}
                alt="Person with lungs illustration"
                className="w-full max-w-xs object-contain"
              />
            </div>
            
            {/* Right Section - Login/Register Form */}
            <div className="flex flex-col items-center justify-start">
               {/* 🌟 Display Global Messages here (from API calls) */}
               {error && <p className="text-red-500 text-base mb-4 w-full max-w-md">{error}</p>}
               {success && <p className="text-green-500 text-base mb-4 w-full max-w-md">{success}</p>}

               {/* 🌟 Pass navigate and state setters to LoginForm */}
               {/* Show LoginForm only if registerForm is false */}
               {!registerForm && (
                  <LoginForm 
                    navigate={navigate} 
                    setParentError={setError}
                    setParentSuccess={setSuccess}
                  />
               )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default Login
import React from 'react'

function Header() {
  return (
    <>
       {/* Navigation */}
      <nav className="bg-white px-20 py-5 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div>
            <h1 className="text-xl font-bold text-[#059AA0]">▲ BreatheWell</h1>
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
            <a href="#" className="text-teal-500 hover:text-teal-600 underline">
              Sign in
            </a>
            <button
              onClick={handleOpenRegister}
              className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition duration-200"
            >
              Register
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Header

import { useState } from "react";
// Removed unnecessary imports for google, facebook, apple

// 🌟 Update prop acceptance: accept navigate, and parent state setters
export default function LoginForm({ navigate, setParentError, setParentSuccess }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "", // doctor or patient
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState(""); // Local error for internal form validation

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => { // 🌟 MAKE FUNCTION ASYNC
        e.preventDefault();

        // Simple validation
        if (!formData.email || !formData.password || !formData.role) {
            setLocalError("Please fill all fields and select your role");
            return;
        }

        setLocalError("");
        setParentError(""); // Clear any general API error on new submit
        setParentSuccess(""); // Clear any general success message

        // 🌟 API CALL LOGIC
        try {
            const res = await fetch("http://127.0.0.1:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData), // Sending email, password, and role
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle HTTP errors (400, 401, 404, etc. from Flask)
                setLocalError(data.error || "Login failed due to a server error.");
            } else {
                // 🚀 SUCCESS: Login successful
                setParentSuccess(data.message);

                // 1. Store user data 
                localStorage.setItem('user', JSON.stringify(data.user));

                // 2. Redirect to the dashboard
                if (navigate) {
                    navigate("/dashboard");
                }
            }
        } catch (err) {
            console.error("Network or Fetch Error:", err);
            setLocalError("Failed to connect to the server.");
        }
    };

    return (
        <div className="bg-white px-8 py-6 rounded-2xl shadow-lg w-full max-w-md">
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h3>

            {localError && <p className="text-red-500 text-sm mb-4">{localError}</p>}
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Role Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login as</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full bg-[#C5F2E8] text-gray-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Select Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                    </select>
                </div>

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
                        Forget Password?
                    </button>
                </div>

                {/* Sign In Button */}
                <button
                    type="submit"
                    className="w-full bg-[#059AA0] text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition duration-200 mt-2"
                >
                    Sign In
                </button>


            </form>
        </div>
    );
}

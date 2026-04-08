import { useState } from "react";

export default function LoginForm({ navigate, setParentError, setParentSuccess }) {

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password || !formData.role) {
            setLocalError("Please fill all fields and select your role");
            return;
        }

        setLocalError("");
        setParentError("");
        setParentSuccess("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setLocalError(data.error || "Login failed.");
                setLoading(false);
                return;
            }

            // ✅ Store token (IMPORTANT for protected routes)
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
            }

            // ✅ Store user if exists
            if (data.user) {
                const previousRawUser = localStorage.getItem("user");
                let previousUser = null;
                try {
                    previousUser = previousRawUser ? JSON.parse(previousRawUser) : null;
                } catch {
                    previousUser = null;
                }

                if (previousUser?.id && previousUser.id !== data.user?.id) {
                    localStorage.removeItem(`latest_diagnosis_report_${previousUser.id}`);
                    localStorage.removeItem(`selected_symptoms_${previousUser.id}`);
                }

                localStorage.removeItem("latest_diagnosis_report");
                localStorage.removeItem("selected_symptoms");
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            setParentSuccess(data.message);

            setLoading(false);

            if (navigate) {
                // Redirect based on role
                const role = data.user?.role;
                if (role === 'doctor') navigate('/doctor/dashboard');
                else navigate('/dashboard');
            }

        } catch (err) {
            console.error(err);
            setLocalError("Failed to connect to server.");
            setLoading(false);
        }
    };

    return (
        <div className="bg-white px-8 py-6 rounded-2xl shadow-lg w-full max-w-md">
            <h3 className="text-3xl text-gray-900 mb-6 text-center">
                Enter your credentials
            </h3>

            {localError && <p className="text-red-500 text-sm mb-4">{localError}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>

                {/* Role Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Login as
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full bg-[#C5F2E8] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Select Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                    </select>
                </div>

                {/* Email */}
                <div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-[#C5F2E8] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-[#C5F2E8] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                        {showPassword ? "🔓" : "🔒"}
                    </button>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#059AA0] text-white py-3 rounded-lg hover:bg-teal-600 transition"
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>

            </form>
        </div>
    );
}

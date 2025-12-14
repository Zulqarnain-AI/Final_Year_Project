import { useState } from "react";

export default function RegisterForm({ registerForm, setRegisterForm }) {
    const [registerData, setRegisterData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        age: "",
        gender: "",
        height: "",
        weight: "",
        role: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRegisterData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { fullName, email, password, confirmPassword, age, gender, height, weight, role } = registerData;
        if (!fullName || !email || !password || !confirmPassword || !age || !gender || !height || !weight || !role) {
            setError("Please fill all fields");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://127.0.0.1:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password, confirmPassword, age, gender, height, weight, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong");
            } else {
                setSuccess(data.message);
                setRegisterData({
                    fullName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    age: "",
                    gender: "",
                    height: "",
                    weight: "",
                    role: "",
                });
                setTimeout(() => setRegisterForm(false), 2000);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start py-10 z-50 overflow-y-auto">
            <div className="relative bg-white px-8 py-6 rounded-2xl shadow-2xl w-full max-w-[600px] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={() => setRegisterForm(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold cursor-pointer"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Create Account
                </h2>


                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your name"
                            value={registerData.fullName}
                            onChange={handleChange}
                            className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={registerData.email}
                            onChange={handleChange}
                            className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={registerData.password}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-500 transition"
                            >
                                {showPassword ? "🔓" : "🔒"}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={registerData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-500 transition"
                            >
                                {showConfirmPassword ? "🔓" : "🔒"}
                            </button>
                        </div>
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input
                                type="number"
                                name="age"
                                placeholder="Enter age"
                                value={registerData.age}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={registerData.gender}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                placeholder="Enter height"
                                value={registerData.height}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                placeholder="Enter weight"
                                value={registerData.weight}
                                onChange={handleChange}
                                className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Register as</label>
                        <select
                            name="role"
                            value={registerData.role}
                            onChange={handleChange}
                            className="w-full bg-cyan-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        >
                            <option value="">Select Role</option>
                            <option value="doctor">Doctor</option>
                            <option value="patient">Patient</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 mt-4 transition duration-200"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

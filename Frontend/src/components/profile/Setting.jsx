import React, { useState } from "react";
import { API_BASE_URL } from "../../constant";
import { Link } from "react-router-dom";
import Logo from "./image/lung logo.png"; 
import { Bell, Lock, Settings, HelpCircle, Edit } from "lucide-react"; 
import Editprofile from "./Editprofile.jsx";
import DoctorProfileEdit from "../doctor_profile/DoctorProfileEdit.jsx";

const NotificationContent = ({ notificationState, setNotificationState }) => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100"> 
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Notification Settings</h3>
        <p className="text-gray-600">Manage how you receive alerts and updates from BreatheWell.</p>
        <div className="mt-6 space-y-4">
            <label className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    checked={notificationState.carePlan}
                    onChange={(e) => setNotificationState((prev) => ({ ...prev, carePlan: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-teal-600 rounded"
                />
                <span>Email Notifications for Care Plan updates</span>
            </label>
            <label className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    checked={notificationState.criticalAlerts}
                    onChange={(e) => setNotificationState((prev) => ({ ...prev, criticalAlerts: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-teal-600 rounded"
                />
                <span>Push Notifications for critical alerts</span>
            </label>
            <label className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    checked={notificationState.appointments}
                    onChange={(e) => setNotificationState((prev) => ({ ...prev, appointments: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-teal-600 rounded"
                />
                <span>Appointment Reminders</span>
            </label>
        </div>
    </div>
);

const SecurityContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Security Settings</h3>
        <p className="text-gray-600">Review your login activity and update your password to keep your account secure.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold mb-2">Change Password</h4>
                <ChangePasswordForm />
            </div>

            
        </div>
    </div>
);


const HelpContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Help & Support</h3>
        <p className="text-gray-600">Find answers to common questions or contact support.</p>

        <div className="mt-6">
            <FAQAccordion />

            <div className="mt-6 text-sm text-gray-600">
                <p>Still need help? Email <a href="mailto:support@breathewell.com" className="text-[#059AA0] hover:underline">support@breathewell.com</a></p>
            </div>
        </div>
    </div>
);


function ChangePasswordForm() {
    const [current, setCurrent] = React.useState("");
    const [newPass, setNewPass] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [message, setMessage] = React.useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!current || !newPass || !confirm) {
            setMessage({ type: 'error', text: 'Please fill all fields.' });
            return;
        }
        if (newPass.length < 8) {
            setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
            return;
        }
        if (newPass !== confirm) {
            setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
            return;
        }

        try {
            const token = (localStorage.getItem("access_token") || localStorage.getItem("token") || "").trim();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const res = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword: current, newPassword: newPass })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const err = data?.error || data?.message || 'Failed to update password';
                if (res.status === 401) {
                    // clear tokens if unauthorized
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('token');
                }
                setMessage({ type: 'error', text: err });
                return;
            }

            setMessage({ type: 'success', text: data?.message || 'Password updated successfully.' });
            setCurrent(''); setNewPass(''); setConfirm('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error while updating password.' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className="text-sm text-gray-700">Current password</label>
                <input type="password" value={current} onChange={(e)=>setCurrent(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
            </div>
            <div>
                <label className="text-sm text-gray-700">New password</label>
                <input type="password" value={newPass} onChange={(e)=>setNewPass(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" placeholder="At least 8 characters" />
            </div>
            <div>
                <label className="text-sm text-gray-700">Confirm new password</label>
                <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
            </div>

            {message && (
                <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
            )}

            <div className="flex items-center space-x-3">
                <button type="submit" className="bg-[#059AA0] text-white px-4 py-2 rounded">Update password</button>
                <button type="button" onClick={() => { setCurrent(''); setNewPass(''); setConfirm(''); setMessage(null); }} className="px-4 py-2 rounded border">Reset</button>
            </div>
        </form>
    );
}



function FAQAccordion() {
    const faqs = [
        { q: 'How do I reset my password?', a: 'Go to Settings → Security and use the Change Password form. If you cannot access your account, use the Forgot Password flow on the login page.' },
        { q: 'How do I update my profile information?', a: 'Open Settings → Patient Profile (or Doctor Profile) and edit your details. Changes save automatically or via the Save button in the profile editor.' },
        { q: 'How are my notifications managed?', a: 'Notification preferences are stored in your browser via the Settings page. You can toggle email, push, and appointment reminders.' },
        { q: 'How can I contact support?', a: 'Email support@breathewell.com with your issue and account details. For urgent issues, include "URGENT" in the subject.' },
    ];

    const [open, setOpen] = React.useState(null);

    return (
        <div className="space-y-2">
            {faqs.map((f, idx) => (
                <div key={idx} className="border rounded">
                    <button onClick={() => setOpen(open === idx ? null : idx)} className="w-full text-left px-4 py-3 flex justify-between items-center">
                        <span className="font-medium">{f.q}</span>
                        <span className="text-gray-500">{open === idx ? '-' : '+'}</span>
                    </button>
                    {open === idx && (
                        <div className="px-4 pb-3 text-sm text-gray-700 border-t">{f.a}</div>
                    )}
                </div>
            ))}
        </div>
    );
}

const ContentMap = {
    profile: "profile",
    notification: "notification",
    security: "security",
    help: "help",
};


function Setting() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isDoctor = user.role === "doctor";

    const [notificationState, setNotificationState] = useState(() => {
        const stored = localStorage.getItem("settings_notifications");
        return stored ? JSON.parse(stored) : { carePlan: true, criticalAlerts: false, appointments: true };
    });

    const [appearanceState, setAppearanceState] = useState(() => {
        const stored = localStorage.getItem("settings_appearance");
        return stored ? JSON.parse(stored) : { theme: "light" };
    });

    const items = [
        { id: 'profile', name: isDoctor ? "Doctor Profile" : "Patient Profile", icon: Edit }, 
        { id: 'notification', name: "Notification", icon: Bell },
        { id: 'security', name: "Security", icon: Lock },
        { id: 'help', name: "Help", icon: HelpCircle },
    ];
    
    const [activeTab, setActiveTab] = useState('profile');

    React.useEffect(() => {
        localStorage.setItem("settings_notifications", JSON.stringify(notificationState));
    }, [notificationState]);

    React.useEffect(() => {
        localStorage.setItem("settings_appearance", JSON.stringify(appearanceState));
    }, [appearanceState]);
    
    const renderContent = () => {
        switch (ContentMap[activeTab]) {
            case "profile":
                return isDoctor ? <DoctorProfileEdit /> : <Editprofile />;
            case "notification":
                return <NotificationContent notificationState={notificationState} setNotificationState={setNotificationState} />;
            case "security":
                return <SecurityContent />;
            case "help":
                return <HelpContent />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50"> 
            
            {/* Main Grid Container: Set to full width and min-height, and uses fixed sidebar */}
            <main className="grid grid-cols-5 w-full min-h-screen">
                
                {/* Sidebar Section (col-span-1) - Fixed */}
                <section className="col-span-1 border-r border-gray-200 bg-white fixed h-full w-[20%] p-6">
                    
                    
                    {/* Settings Title in Sidebar */}
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">Settings</h3>

                    {/* Navigation List */}
                    <ul className="flex flex-col space-y-1">
                        {items.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = activeTab === item.id;
                            
                            return (
                                <li
                                    key={item.id}
                                    className={`text-lg px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 
                                        flex items-center space-x-3
                                        ${isActive ? "bg-[#059AA0] text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`
                                    }
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* Main Content Area (col-span-4) 
                    Change: Removed p-10 from here, and will apply padding internally
                    Removed overflow-y-auto from here.
                */}
                <section className="col-span-4 ml-[20%] w-full h-screen overflow-y-auto ">
                    
                    {/* Inner Content Wrapper with Padding and Top Buffer */}
                    <div className="pl-10 ml-5"> 
                        {/* Explicit Top Buffer - This ensures the content heading has a safe margin */}
                        {/* <div className="h-8 md:h-12 w-full"></div>  */}

                        {/* Render the Active Component */}
                            {renderContent()}
                    </div>
                </section>
                
            </main>
        </div>
    );
}

export default Setting;
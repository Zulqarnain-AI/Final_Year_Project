import React, { useState } from "react";
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
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Security Settings</h3>
        <p className="text-gray-600">Review your login activity and keep your account secure.</p>
        <div className="mt-6 space-y-4">
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300">Change Password (Coming Soon)</button>
            <p className="text-sm text-gray-500">Last login: 2 minutes ago</p>
        </div>
    </div>
);

const AppearanceContent = ({ appearanceState, setAppearanceState }) => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Appearance Settings</h3>
        <p className="text-gray-600">Choose your preferred theme.</p>
        <div className="mt-6 space-x-4">
            <button
                onClick={() => setAppearanceState({ ...appearanceState, theme: "light" })}
                className={`px-4 py-2 rounded-md transition duration-300 ${appearanceState.theme === "light" ? "bg-[#059AA0] text-white" : "bg-white border border-gray-300 hover:bg-gray-100"}`}
            >
                Light Mode
            </button>
            <button
                onClick={() => setAppearanceState({ ...appearanceState, theme: "dark" })}
                className={`px-4 py-2 rounded-md transition duration-300 ${appearanceState.theme === "dark" ? "bg-gray-800 text-white" : "bg-white border border-gray-300 hover:bg-gray-100"}`}
            >
                Dark Mode
            </button>
        </div>
    </div>
);

const HelpContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Help & Support</h3>
        <p className="text-gray-600">Find answers to common questions or contact support.</p>
        <div className="mt-6 space-y-4">
            <a href="#" className="text-[#059AA0] hover:underline">View FAQ</a>
            <p>Email Support: <a href="mailto:support@breathewell.com" className="text-[#059AA0] hover:underline">support@breathewell.com</a></p>
        </div>
    </div>
);

const ContentMap = {
    profile: "profile",
    notification: "notification",
    security: "security",
    appearance: "appearance",
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
        { id: 'appearance', name: "Appearance", icon: Settings },
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
            case "appearance":
                return <AppearanceContent appearanceState={appearanceState} setAppearanceState={setAppearanceState} />;
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
                    
                    {/* Logo and App Name */}
                    <Link to = "/dashboard">
                    <div className="flex items-center gap-3 justify-start mb-10">
                        <img className="h-6 w-6" src={Logo} alt="logo" />
                        <h1 className="text-xl font-bold text-[#059AA0]">BreatheWell</h1>
                    </div>
                    
                    </Link>
                    
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
                    <div className="p-10 ml-5"> 
                        {/* Explicit Top Buffer - This ensures the content heading has a safe margin */}
                        <div className="h-8 md:h-12 w-full"></div> 

                        {/* Render the Active Component */}
                            {renderContent()}
                    </div>
                </section>
                
            </main>
        </div>
    );
}

export default Setting;
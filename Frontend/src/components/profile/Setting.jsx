import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./image/lung logo.png"; 
import { Bell, Lock, Settings, HelpCircle, Edit } from "lucide-react"; 
import Editprofile from "./Editprofile.jsx";

// --- PLACEHOLDER COMPONENTS (Using the revised, standardized versions) ---
// Note: These components still rely on the 'p-5 bg-white rounded-xl shadow-lg' wrapper
const NotificationContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg"> 
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Notification Settings</h3>
        <p className="text-gray-600">Manage how you receive alerts and updates from BreatheWell.</p>
        <div className="mt-6 space-y-4">
            <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-teal-600 rounded" />
                <span>Email Notifications for Care Plan updates</span>
            </label>
            <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked={false} className="form-checkbox h-5 w-5 text-teal-600 rounded" />
                <span>Push Notifications for critical alerts</span>
            </label>
        </div>
    </div>
);

const SecurityContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Security Settings</h3>
        <p className="text-gray-600">Review your login activity and enable two-factor authentication.</p>
        <div className="mt-6 space-y-4">
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300">Change Password</button>
            <p className="text-sm text-gray-500">Last login: 2 minutes ago</p>
        </div>
    </div>
);

const AppearanceContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Appearance Settings</h3>
        <p className="text-gray-600">Choose your preferred theme.</p>
        <div className="mt-6 space-x-4">
            <button className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300">Light Mode</button>
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300">Dark Mode</button>
        </div>
    </div>
);

const HelpContent = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Help & Support</h3>
        <p className="text-gray-600">Find answers to common questions or contact support.</p>
        <div className="mt-6 space-y-4">
            <a href="#" className="text-[#059AA0] hover:underline">View FAQ</a>
            <p>Email Support: <a href="mailto:support@breathewell.com" className="text-[#059AA0] hover:underline">support@breathewell.com</a></p>
        </div>
    </div>
);

const ContentMap = {
    'edit-profile': Editprofile,
    'notification': NotificationContent,
    'security': SecurityContent,
    'appearance': AppearanceContent,
    'help': HelpContent,
};


function Setting() {
    const items = [
        { id: 'edit-profile', name: "Edit Profile", icon: Edit }, 
        { id: 'notification', name: "Notification", icon: Bell },
        { id: 'security', name: "Security", icon: Lock },
        { id: 'appearance', name: "Appearance", icon: Settings },
        { id: 'help', name: "Help", icon: HelpCircle },
    ];
    
    const [activeTab, setActiveTab] = useState('edit-profile');
    
    const ActiveContentComponent = ContentMap[activeTab];

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
                        {ActiveContentComponent && <ActiveContentComponent />}
                    </div>
                </section>
                
            </main>
        </div>
    );
}

export default Setting;
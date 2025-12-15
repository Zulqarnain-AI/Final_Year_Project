// UserProfileView.jsx
import { Link } from 'react-router-dom';
import React from 'react';
import { Pencil, Calendar, Mail, Phone, MapPin, Heart } from 'lucide-react';
import profile_img from './image/doctor4.png'
// Sample data structure for the user
const mockUserProfile = {
    firstName: "Amelia",
    lastName: "Pond",
    email: "amelia.pond@example.com",
    phone: "+1 (555) 123-4567",
    dob: "1990-07-02",
    address: "123 Gallifrey St, London, UK",
    patientId: "BW-00721",
    primaryPhysician: "Dr. The Doctor",
    bloodGroup: "A+",
    allergies: "Penicillin, Dust Mites",
    lastCheckup: "2025-11-28",
};

/**
 * Renders a single piece of information in the profile.
 * @param {object} props
 * @param {React.Component} props.Icon - The Lucide React icon component.
 * @param {string} props.label - The label for the data field.
 * @param {string} props.value - The actual data value.
 */
const InfoBlock = ({ Icon, label, value }) => (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <Icon className="text-[#059AA0] w-6 h-6 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-lg font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

/**
 * Main component for viewing the user's profile information.
 * @param {object} props
 * @param {function} props.onEditClick - Function to call when the 'Edit Profile' button is clicked.
 */
function UserProfileView({ onEditClick }) {
    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header and Edit Button */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Patient Profile
                </h1>
                <Link to = "/editProfile">
                <button
                    onClick={onEditClick}
                    className="flex items-center space-x-2 bg-[#059AA0] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#047D80] transition duration-300 shadow-md"
                >
                    <Pencil className="w-5 h-5" />
                    <span>Edit Profile</span>
                </button>
                
                </Link>
            </div>

            {/* Profile Card Container */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                {/* Profile Header (Banner style) */}
                <div className="p-8 bg-gradient-to-r from-[#059AA0] to-[#047D80] text-white flex items-center space-x-8">
                    {/* Placeholder for Profile Picture */}
                    
                       <img src={profile_img} alt="profile image" className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-[#059AA0] border-4 border-white shadow-lg"/>
                    <div>
                        <h2 className="text-3xl font-bold">
                            {mockUserProfile.firstName} {mockUserProfile.lastName}
                        </h2>
                        <p className="text-lg font-light mt-1">
                            Patient ID: {mockUserProfile.patientId}
                        </p>
                    </div>
                </div>

                {/* Personal Information Grid */}
                <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoBlock Icon={Mail} label="Email Address" value={mockUserProfile.email} />
                        <InfoBlock Icon={Phone} label="Phone Number" value={mockUserProfile.phone} />
                        <InfoBlock Icon={Calendar} label="Date of Birth" value={mockUserProfile.dob} />
                        <InfoBlock Icon={MapPin} label="Address" value={mockUserProfile.address} />
                    </div>
                </div>

                {/* Medical Information Section */}
                <div className="p-8 border-t border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">
                        Medical Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoBlock Icon={Heart} label="Blood Group" value={mockUserProfile.bloodGroup} />
                        <InfoBlock Icon={Heart} label="Allergies" value={mockUserProfile.allergies} />
                        <InfoBlock Icon={Heart} label="Primary Physician" value={mockUserProfile.primaryPhysician} />
                        <InfoBlock Icon={Calendar} label="Last Checkup" value={mockUserProfile.lastCheckup} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfileView;
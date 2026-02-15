// UserProfileView.jsx
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Pencil, Calendar, Mail, Phone, MapPin, Heart } from "lucide-react";
import profile_img from "./image/doctor4.jpeg";
import axios from "axios";

const InfoBlock = ({ Icon, label, value }) => (
  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
    <Icon className="text-[#059AA0] w-6 h-6 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">
        {value || "Not Provided"}
      </p>
    </div>
  </div>
);

function UserProfileView() {
  const [user, setUser] = useState(null);

  // 🔥 Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");

        if (!token) {
          console.error("No auth token found - redirecting to login");
          window.location.href = "/login";
          return;
        }

        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Patient Profile
        </h1>

        <Link to="/editProfile">
          <button className="flex items-center space-x-2 bg-[#059AA0] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#047D80] transition duration-300 shadow-md">
            <Pencil className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        </Link>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-[#059AA0] to-[#047D80] text-white flex items-center space-x-8">
          <img
            src={profile_img}
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
          <div>
            <h2 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-lg font-light mt-1">
              Patient ID: {user.patientId}
            </p>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoBlock Icon={Mail} label="Email Address" value={user.email} />
            <InfoBlock Icon={Phone} label="Phone Number" value={user.phone} />
            <InfoBlock Icon={Calendar} label="Date of Birth" value={user.dob} />
            <InfoBlock Icon={MapPin} label="Address" value={user.address} />
          </div>
        </div>

        <div className="p-8 border-t border-gray-100">
          <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">
            Medical Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoBlock Icon={Heart} label="Blood Group" value={user.bloodGroup} />
            <InfoBlock Icon={Heart} label="Allergies" value={user.allergies} />
            <InfoBlock
              Icon={Heart}
              label="Primary Physician"
              value={user.primaryPhysician}
            />
            <InfoBlock
              Icon={Calendar}
              label="Last Checkup"
              value={user.lastCheckup}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;

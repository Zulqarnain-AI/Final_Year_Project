// Editprofile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FormInput = ({
  label,
  name,
  type = "text",
  value,
  disabled = false,
  onChange,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      disabled={disabled}
      onChange={onChange}
      className="w-full px-4 py-2 border rounded-lg focus:border-[#059AA0] focus:ring-1 focus:ring-[#059AA0]"
    />
  </div>
);

function Editprofile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");

        if (!token) {
          console.error("No auth token found - redirecting to login");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ensure we always have an object so the UI can render fields
        const data = res.data || {};
        setFormData(data);
        setProfilePreview(data.profileImage || "");
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err);
        setFormData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfilePreview(base64);
      setFormData((prev) => ({
        ...prev,
        profileImage: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

      if (!token) {
        console.error("No auth token found - redirecting to login");
        navigate("/login");
        return;
      }

      const payload = { ...formData };
      if (typeof payload.languages === "string") {
        payload.languages = payload.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      await axios.put(
        "http://localhost:5000/api/users/profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Profile Updated Successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Update failed");
    }
  };

  if (!formData) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="bg-white p-10 rounded-xl shadow-2xl max-w-5xl mx-auto mt-10 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Edit Your Profile Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-[#059AA0] mb-4">Profile Photo</h3>
          <div className="flex items-center gap-6">
            <img
              src={profilePreview || "https://placehold.co/120x120?text=Profile"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-[#059AA0]"
            />
            <div>
              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="block" />
              <p className="text-sm text-gray-500 mt-2">Upload JPG/PNG profile picture</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#059AA0] mb-4">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            <FormInput label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
            <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
            <FormInput label="Patient ID" name="patientId" value={formData.patientId} disabled onChange={handleChange} />
            <FormInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} />
            <FormInput label="Age" name="age" value={formData.age} onChange={handleChange} />
            <FormInput label="Height" name="height" value={formData.height} onChange={handleChange} />
            <FormInput label="Weight" name="weight" value={formData.weight} onChange={handleChange} />
            <FormInput label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
            <FormInput label="Languages (comma separated)" name="languages" value={Array.isArray(formData.languages) ? formData.languages.join(", ") : formData.languages} onChange={handleChange} />
          </div>

          <div className="mt-6">
            <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#059AA0] mb-4">
            Medical Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Primary Physician"
              name="primaryPhysician"
              value={formData.primaryPhysician}
              onChange={handleChange}
            />
            <FormInput
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
            />
            <FormInput
              label="Allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
            />
            <FormInput
              label="Medical Conditions"
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#059AA0] text-white px-8 py-3 rounded-xl hover:bg-[#047D80]"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default Editprofile;

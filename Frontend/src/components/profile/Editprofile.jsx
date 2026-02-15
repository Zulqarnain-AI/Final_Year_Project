// Editprofile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Editprofile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
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
        setFormData(res.data || {});
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

      await axios.put(
        "http://localhost:5000/api/users/profile",
        formData,
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

  const FormInput = ({
    label,
    name,
    type = "text",
    value,
    disabled = false,
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
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:border-[#059AA0] focus:ring-1 focus:ring-[#059AA0]"
      />
    </div>
  );

  return (
    <div className="bg-white p-10 rounded-xl shadow-2xl max-w-4xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Edit Your Profile Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-[#059AA0] mb-4">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="First Name" name="firstName" value={formData.firstName} />
            <FormInput label="Last Name" name="lastName" value={formData.lastName} />
            <FormInput label="Email" name="email" type="email" value={formData.email} />
            <FormInput label="Phone" name="phone" value={formData.phone} />
            <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} />
            <FormInput label="Patient ID" name="patientId" value={formData.patientId} disabled />
          </div>

          <div className="mt-6">
            <FormInput label="Address" name="address" value={formData.address} />
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
            />
            <FormInput
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
            />
            <FormInput
              label="Allergies"
              name="allergies"
              value={formData.allergies}
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

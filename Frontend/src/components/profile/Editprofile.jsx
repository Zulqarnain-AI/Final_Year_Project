// Editprofile.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Sample data structure for the user (keep it consistent)
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
};

/**
 * Enhanced form component for editing user profile information.
 */
function Editprofile() {
    const navigate = useNavigate()
    // Use state to manage form data, initialized with mock data
    const [formData, setFormData] = useState(mockUserProfile);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        alert("Profile Updated Successfully! ");
        navigate('/profile')
    };

    /**
     * Renders a styled form input field.
     */
    const FormInput = ({ label, name, type = "text", value, onChange, disabled = false }) => (
        <div className="space-y-2">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:border-[#059AA0] focus:ring-1 focus:ring-[#059AA0] transition duration-150 ease-in-out ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900 border-gray-300'}`}
            />
        </div>
    );

    return (
        <div className="bg-white p-10 rounded-xl shadow-2xl max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Edit Your Profile Information</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Personal Information Section */}
                <div>
                    <h3 className="text-xl font-semibold text-[#059AA0] border-b pb-2 mb-4">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                        <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                        <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                        <FormInput label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                        <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                        <FormInput label="Patient ID" name="patientId" value={formData.patientId} disabled={true} />
                    </div>
                    <div className="mt-6">
                        <FormInput label="Full Address" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                </div>

                {/* Medical Information Section */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xl font-semibold text-[#059AA0] border-b pb-2 mb-4">Medical Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="Primary Physician" name="primaryPhysician" value={formData.primaryPhysician} onChange={handleChange} />
                        <FormInput label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
                        <div className="md:col-span-2">
                            <FormInput label="Known Allergies (comma separated)" name="allergies" value={formData.allergies} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="submit"
                        className="bg-[#059AA0] text-white font-semibold py-3 px-8 rounded-xl hover:bg-[#047D80] transition duration-300 shadow-lg"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Editprofile;
import React from 'react';
import doctor1 from "./images/doctor1.png";
import doctor2 from "./images/doctor2.png";
import doctor3 from "./images/doctor3.png";
import { useNavigate } from 'react-router-dom';

// --- Mock Data (Replace with your actual API fetch) ---
const mockDoctors = [
  {
    id: 101,
    name: "Dr. Eleanor Vance",
    specialization: "Cardiology",
    image: `${doctor1}`, // Placeholder
    details: "Experienced cardiologist specializing in non-invasive procedures and preventative care.",
  },
  {
    id: 102,
    name: "Dr. Marcus Chen",
    specialization: "Pediatrics",
    image: `${doctor2}`, // Placeholder
    details: "Passionate pediatrician focused on early childhood development and vaccinations.",
  },
  {
    id: 103,
    name: "Dr. Sophia Reyes",
    specialization: "Dermatology",
    image: `${doctor3}`, // Placeholder
    details: "Leading dermatologist with expertise in cosmetic treatments and complex skin conditions.",
  },
  {
    id: 104,
    name: "Dr. Sophia Reyes",
    specialization: "Dermatology",
    image: `${doctor3}`, // Placeholder
    details: "Leading dermatologist with expertise in cosmetic treatments and complex skin conditions.",
  },
];
// --------------------------------------------------------

function DoctorList() {
  const navigate = useNavigate();

  // Handler to navigate to the doctor's profile
  const handleViewDetail = (doctorId) => {
    // Navigates to a dynamic route like /doctors/101
    navigate(`/doctors/${doctorId}`); 
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#059AA0] mb-8">
        Find Your Doctor
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDoctors.map((doctor) => (
          <div 
            
            className="bg-white rounded-xl shadow-3lg p-6 flex flex-col items-center text-center hover:shadow-xl transition duration-300"
          >
            {/* 1. Doctor Image */}
            <img 
              src={doctor.image} 
              alt={doctor.name} 
              className="w-24 h-24 object-cover rounded-full mb-4 border-4 border-[#059AA0]" 
            />
            
            {/* 2. Doctor Name */}
            <h2 className="text-xl font-semibold text-gray-800">{doctor.name}</h2>
            
            {/* 3. Specialization */}
            <p className="text-teal-600 font-medium mb-4">{doctor.specialization}</p>
            
            {/* 4. Detail Button */}
            <button
              onClick={() => handleViewDetail(doctor.id)}
              className="mt-auto bg-[#059AA0] text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-600 transition duration-200 shadow-md"
            >
              View Detail
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorList;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DoctorList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/doctors');
        if (mounted) setDoctors(res.data || []);
      } catch (err) {
        console.error('Error fetching doctors', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { mounted = false };
  }, []);

  const handleViewDetail = (doctorId) => {
    navigate(`/doctors/${doctorId}`);
  };

  if (loading) return <div className="p-8">Loading doctors...</div>;
  if (error) return <div className="p-8 text-red-600">Failed to load doctors</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#059AA0] mb-8">Find Your Doctor</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl p-6 flex flex-col items-center text-center hover:shadow-xl transition duration-300">
            <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-xl font-semibold text-gray-600">{(doctor.firstName||'D')[0]}</div>
            <h2 className="text-xl font-semibold text-gray-800">{doctor.fullName || `${doctor.firstName} ${doctor.lastName}`}</h2>
            <p className="text-teal-600 font-medium mb-4">{doctor.specialization}</p>
            <button onClick={() => handleViewDetail(doctor.id)} className="mt-auto bg-[#059AA0] text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-600 transition duration-200 shadow-md">View Detail</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorList;
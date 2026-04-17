import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const getDoctorName = (doctor) => {
  if (doctor.fullName && doctor.fullName.trim()) return doctor.fullName;
  return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';
};

const formatExperience = (experience) => {
  if (experience === null || experience === undefined || experience === '') return 'N/A';
  return `${experience} years`;
};

const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === '') return 'N/A';
  return Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : rating;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (String(value).trim() !== '') return value;
  }
  return '';
};

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
    <div className="p-8 max-w-7xl mx-auto bg-gradient-to-b from-[#f8feff] to-white min-h-screen">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#059AA0]">Find Your Doctor</h1>
          <p className="text-gray-600 mt-2">Browse doctors, request appointments, and track your appointment requests in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="self-start rounded-lg border border-[#059AA0] px-4 py-2 font-semibold text-[#059AA0] hover:bg-teal-50"
        >
          My Appointment Requests
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor, index) => (
          <div
            key={doctor.id || doctor.doctorId || `doctor-${index}`}
            className="bg-white rounded-2xl p-6 flex flex-col hover:shadow-xl transition duration-300 border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
              {doctor.profileImage ? (
                <img
                  src={doctor.profileImage}
                  alt={getDoctorName(doctor)}
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-100"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-semibold text-gray-600">
                  {(doctor.firstName || 'D')[0]}
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-800 leading-tight">{getDoctorName(doctor)}</h2>
                <p className="text-teal-600 font-medium">{doctor.specialization || 'General Physician'}</p>
                <p className="text-sm text-gray-500">Doctor ID: {doctor.doctorId || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700 mb-4">
              <p><span className="font-semibold">Experience:</span> {formatExperience(firstNonEmpty(doctor.experience, doctor.yearsOfExperience, doctor.experienceYears))}</p>
              <p><span className="font-semibold">Qualification:</span> {firstNonEmpty(doctor.qualification, doctor.qualifications, doctor.education) || 'N/A'}</p>
              <p><span className="font-semibold">Rating:</span> {formatRating(doctor.rating)} / 5</p>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[60px]">
              {doctor.bio || 'No profile description available.'}
            </p>

            <button
              onClick={() => handleViewDetail(doctor.id)}
              className="mt-auto bg-[#059AA0] text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-600 transition duration-200 shadow-md"
            >
              View Detail
            </button>
          </div>
        ))}
      </div>

      {doctors.length === 0 && (
        <div className="bg-white rounded-xl p-8 shadow text-center text-gray-600 mt-8">No doctors available at the moment.</div>
      )}
    </div>
  );
}

export default DoctorList;
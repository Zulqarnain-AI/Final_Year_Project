import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function DoctorProfileView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const res = await axios.get('http://localhost:5000/api/doctors/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) setProfile(res.data);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally { if (mounted) setLoading(false); }
    };
    fetchProfile();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !profile) return <div className="p-8 text-red-600">Failed to load profile</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Link to="/doctor/profile/edit" className="bg-[#059AA0] text-white px-4 py-2 rounded">Edit Profile</Link>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold">{profile.fullName || `${profile.firstName} ${profile.lastName}`}</h2>
        <p className="text-sm text-gray-600">{profile.specialization}</p>
        <p className="mt-4">{profile.bio}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><strong>Doctor ID:</strong> {profile.doctorId}</div>
          <div><strong>Experience:</strong> {profile.experience || 'N/A'}</div>
          <div><strong>Phone:</strong> {profile.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {profile.address || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfileView;

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
  }, [navigate]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !profile) return <div className="p-8 text-red-600">Failed to load profile</div>;

  const reviewCount = profile.reviewCount || profile.recentReviews?.length || 0;
  const recentReviews = Array.isArray(profile.recentReviews) ? profile.recentReviews : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Link to="/doctor/profile/edit" className="bg-[#059AA0] text-white px-4 py-2 rounded">Edit Profile</Link>
      </div>
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <img
            src={profile.profileImage || 'https://placehold.co/120x120?text=Doctor'}
            alt="Doctor"
            className="w-24 h-24 rounded-full object-cover border-2 border-[#059AA0]"
          />
          <div>
            <h2 className="text-2xl font-semibold">{profile.fullName || `${profile.firstName} ${profile.lastName}`}</h2>
            <p className="text-sm text-gray-600">{profile.specialization || 'Not Specified'}</p>
            <p className="text-sm text-gray-500 mt-1">Doctor ID: {profile.doctorId}</p>
          </div>
        </div>

        <p className="mt-6 text-gray-700">{profile.bio || 'No bio added yet.'}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
          <div><strong>Experience:</strong> {profile.experience || 'N/A'}</div>
          <div><strong>Qualification:</strong> {profile.qualification || 'N/A'}</div>
          <div><strong>Department:</strong> {profile.department || 'N/A'}</div>
          <div><strong>Rating:</strong> {profile.rating || 'N/A'}</div>
          <div><strong>Reviews:</strong> {reviewCount || 'N/A'}</div>
          <div><strong>Phone:</strong> {profile.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {profile.address || 'N/A'}</div>
          <div><strong>Clinics:</strong> {(profile.clinics || []).join(', ') || 'N/A'}</div>
          <div><strong>Hospitals:</strong> {(profile.hospitals || []).join(', ') || 'N/A'}</div>
          <div><strong>Languages:</strong> {(profile.languages || []).join(', ') || 'N/A'}</div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Reviews</h3>
          {recentReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{review.patientId || 'Anonymous patient'}</span>
                    <span className="text-yellow-600 font-semibold">⭐ {Number(review.rating || 0).toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{review.comment || 'No comment added.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No patient reviews available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorProfileView;

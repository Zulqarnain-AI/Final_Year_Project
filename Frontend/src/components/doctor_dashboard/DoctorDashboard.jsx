import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/appointments/doctor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mounted) setAppointments(res.data || []);
      } catch (err) {
        console.error('Error loading appointments', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-8">Loading appointments...</div>;
  if (error) return <div className="p-8 text-red-600">Failed to load appointments</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#059AA0]">Doctor Dashboard</h1>
        <div className="space-x-2">
          <button onClick={() => navigate('/doctor/profile')} className="bg-white border border-[#059AA0] text-[#059AA0] px-4 py-2 rounded">Profile</button>
          <button onClick={() => navigate('/doctor/profile/edit')} className="bg-[#059AA0] text-white px-4 py-2 rounded">Edit Profile</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {appointments.length === 0 && <p>No appointment requests yet.</p>}
        <ul className="space-y-4">
          {appointments.map((a) => (
            <li key={a.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{a.patientName} — {a.patientId}</div>
                <div className="text-sm text-gray-600">{a.date} @ {a.time} — Status: {a.status}</div>
              </div>
              <div className="space-x-2">
                <button onClick={() => navigate(`/doctor/appointments/${a.id}`)} className="bg-[#059AA0] text-white px-4 py-2 rounded">Details</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DoctorDashboard;

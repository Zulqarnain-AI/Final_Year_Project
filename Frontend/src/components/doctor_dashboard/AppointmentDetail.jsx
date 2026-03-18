import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAppt = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/appointments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) setAppt(res.data);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally { if (mounted) setLoading(false); }
    };
    fetchAppt();
    return () => { mounted = false };
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.put(`http://localhost:5000/appointments/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Updated');
      navigate('/doctor/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !appt) return <div className="p-8 text-red-600">Appointment not found</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Appointment Detail</h2>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Patient:</strong> {appt.patientName} ({appt.patientId})</p>
        <p><strong>Date:</strong> {appt.date} at {appt.time}</p>
        <p><strong>Notes:</strong> {appt.notes}</p>
        <p><strong>Status:</strong> {appt.status}</p>
        <div className="mt-4 space-x-2">
          <button onClick={() => updateStatus('accepted')} className="bg-green-600 text-white px-4 py-2 rounded">Accept</button>
          <button onClick={() => updateStatus('rejected')} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
          <button onClick={() => navigate('/doctor/dashboard')} className="bg-gray-200 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetail;

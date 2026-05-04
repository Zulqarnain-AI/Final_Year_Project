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

  const diagnosis = appt.diagnosis_summary || null;
  const confidencePercent = diagnosis?.final_confidence
    ? `${(Number(diagnosis.final_confidence) * 100).toFixed(1)}%`
    : 'N/A';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Appointment Detail</h2>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Patient:</strong> {appt.patientName} ({appt.patientId})</p>
        <p><strong>Age / Sex:</strong> {appt.patientAge || 'N/A'} / {appt.patientSex || 'N/A'}</p>
        <p><strong>Date:</strong> {appt.date} at {appt.time}</p>
        <p><strong>Status:</strong> {appt.status}</p>
        <p><strong>Notes:</strong> {appt.additionalInfo || 'N/A'}</p>

        <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 p-4">
          <h3 className="font-semibold text-cyan-800 mb-2">Latest AI Diagnosis Summary</h3>
          {diagnosis ? (
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>Condition:</strong> {diagnosis.final_prediction || 'N/A'}</p>
              <p><strong>Severity:</strong> {diagnosis.severity || 'N/A'}</p>
              <p><strong>Confidence:</strong> {confidencePercent}</p>
              <p><strong>Report Date:</strong> {diagnosis.created_at ? new Date(diagnosis.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Symptoms:</strong> {Array.isArray(diagnosis.symptoms) && diagnosis.symptoms.length > 0 ? diagnosis.symptoms.join(', ') : 'N/A'}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No recent diagnosis report available for this patient.</p>
          )}
        </div>

        <div className="mt-4 space-x-2">
          <button onClick={() => updateStatus('accepted')} className="bg-green-600 text-white px-4 py-2 rounded">Accept</button>
          <button onClick={() => updateStatus('rejected')} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
          <button onClick={() => updateStatus('completed')} className="bg-[#059AA0] text-white px-4 py-2 rounded">Mark Completed</button>
          <button onClick={() => navigate('/doctor/dashboard')} className="bg-gray-200 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetail;

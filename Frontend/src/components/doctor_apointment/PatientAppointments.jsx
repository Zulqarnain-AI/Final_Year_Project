import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const STATUS_META = {
  pending: { label: 'Pending', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Accepted', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  completed: { label: 'Completed', tone: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

const groupOrder = ['pending', 'accepted', 'rejected', 'completed'];

function formatDateTime(date, time) {
  if (!date) return 'N/A';
  const parsed = new Date(`${date}T${time || '00:00'}`);
  if (Number.isNaN(parsed.getTime())) return `${date}${time ? ` at ${time}` : ''}`;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + (time ? ` at ${time}` : '');
}

function getAppointmentKey(appt, index) {
  return appt.id || appt._id || `${appt.doctorId || 'doctor'}-${index}`;
}

function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewForm, setReviewForm] = useState({});
  const [submitState, setSubmitState] = useState({});

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await axios.get('http://localhost:5000/appointments/patient', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setError(err?.response?.data?.error || 'Failed to load your appointment requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const groupedAppointments = useMemo(() => {
    return groupOrder.reduce((acc, status) => {
      acc[status] = appointments.filter((appt) => appt.status === status);
      return acc;
    }, {});
  }, [appointments]);

  const handleReviewChange = (appointmentId, field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [appointmentId]: {
        ...(prev[appointmentId] || { rating: '5', comment: '' }),
        [field]: value,
      },
    }));
  };

  const submitReview = async (appointment) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const draft = reviewForm[appointment.id] || { rating: '5', comment: '' };

    try {
      setSubmitState((prev) => ({ ...prev, [appointment.id]: 'saving' }));
      await axios.post(
        `http://localhost:5000/appointments/${appointment.id}/review`,
        {
          rating: Number(draft.rating),
          comment: draft.comment || '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitState((prev) => ({ ...prev, [appointment.id]: 'saved' }));
      await loadAppointments();
    } catch (err) {
      console.error('Failed to save review', err);
      setSubmitState((prev) => ({ ...prev, [appointment.id]: 'error' }));
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-700">Loading your appointment requests...</div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">My Appointment Requests</h1>
          <p>{error}</p>
          <button
            type="button"
            onClick={loadAppointments}
            className="mt-4 rounded-lg bg-[#059AA0] px-4 py-2 text-white font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-[#f7feff] to-white">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#059AA0]">My Appointment Requests</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Track every request you sent to doctors. Pending requests are waiting for action, accepted ones are upcoming,
            rejected ones are marked clearly, and completed visits can be reviewed here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/DoctorList')}
          className="rounded-lg border border-[#059AA0] px-4 py-2 text-[#059AA0] font-semibold"
        >
          Find a Doctor
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {groupOrder.map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{STATUS_META[status].label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{groupedAppointments[status]?.length || 0}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {groupOrder.map((status) => {
          const items = groupedAppointments[status] || [];
          return (
            <section key={status} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{STATUS_META[status].label} Requests</h2>
                  <p className="text-sm text-slate-500">
                    {status === 'completed' && 'Past successful appointments that you can rate and review.'}
                    {status === 'pending' && 'Requests waiting for doctor response.'}
                    {status === 'accepted' && 'Approved visits that are scheduled or upcoming.'}
                    {status === 'rejected' && 'Requests that were declined by the doctor.'}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_META[status].tone}`}>
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                  No {status} requests yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {items.map((appointment, index) => {
                    const key = getAppointmentKey(appointment, index);
                    const draft = reviewForm[key] || { rating: String(appointment.review_rating || 5), comment: appointment.review_comment || '' };
                    const existingRating = appointment.review_rating || 0;
                    return (
                      <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-900">{appointment.doctorName || 'Doctor'}</h3>
                              <p className="text-sm text-slate-500">Doctor ID: {appointment.doctorId || 'N/A'}</p>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                              <span className="rounded-lg bg-slate-100 px-3 py-1">{formatDateTime(appointment.date, appointment.time)}</span>
                              <span className={`rounded-lg border px-3 py-1 font-semibold ${STATUS_META[appointment.status]?.tone || STATUS_META.pending.tone}`}>
                                {STATUS_META[appointment.status]?.label || appointment.status}
                              </span>
                            </div>

                            {appointment.notes ? (
                              <p className="text-sm text-slate-600">
                                <span className="font-semibold text-slate-700">Note:</span> {appointment.notes}
                              </p>
                            ) : null}
                          </div>

                          <div className="text-sm text-slate-500 lg:text-right">
                            {appointment.created_at ? (
                              <p>Requested on {new Date(appointment.created_at).toLocaleDateString()}</p>
                            ) : null}
                            {appointment.updated_at ? (
                              <p>Last updated {new Date(appointment.updated_at).toLocaleDateString()}</p>
                            ) : null}
                          </div>
                        </div>

                        {appointment.status === 'completed' && (
                          <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <h4 className="text-lg font-semibold text-slate-800">Rate and review this doctor</h4>
                                <p className="text-sm text-slate-600">
                                  Your review helps other patients and updates the doctor profile rating.
                                </p>
                              </div>
                              {existingRating ? (
                                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#059AA0] border border-cyan-200">
                                  Submitted: {Number(existingRating).toFixed(1)} / 5
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
                              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                                Rating
                                <select
                                  value={draft.rating}
                                  onChange={(e) => handleReviewChange(key, 'rating', e.target.value)}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                                >
                                  {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>
                                      {value} star{value > 1 ? 's' : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                                Review comment
                                <textarea
                                  value={draft.comment}
                                  onChange={(e) => handleReviewChange(key, 'comment', e.target.value)}
                                  rows={3}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                                  placeholder="Share your experience with the doctor..."
                                />
                              </label>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => submitReview({ ...appointment, id: key })}
                                className="rounded-lg bg-[#059AA0] px-4 py-2 text-white font-semibold disabled:opacity-60"
                                disabled={submitState[key] === 'saving'}
                              >
                                {existingRating ? 'Update Review' : 'Submit Review'}
                              </button>
                              {submitState[key] === 'saved' ? (
                                <span className="text-sm font-medium text-emerald-600">Review saved successfully.</span>
                              ) : null}
                              {submitState[key] === 'error' ? (
                                <span className="text-sm font-medium text-rose-600">Unable to save review right now.</span>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {appointment.status !== 'completed' && appointment.reviewed ? (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <span className="font-semibold">Your review:</span> {appointment.review_comment || 'No comment added.'}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default PatientAppointments;
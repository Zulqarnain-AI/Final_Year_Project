import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const STATUS_META = {
  pending: {
    label: 'Pending',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    card: 'border-amber-200',
    note: 'Requests waiting for your review.',
  },
  accepted: {
    label: 'Accepted',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    card: 'border-emerald-200',
    note: 'Appointments that you have already approved.',
  },
  rejected: {
    label: 'Rejected',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    card: 'border-rose-200',
    note: 'Requests declined by the doctor.',
  },
  completed: {
    label: 'Completed',
    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    card: 'border-cyan-200',
    note: 'Finished consultations and follow-up history.',
  },
};

const STATUS_ORDER = ['pending', 'accepted', 'rejected', 'completed'];

const formatDateTime = (date, time) => {
  if (!date) return 'Date not available';
  const parsed = new Date(`${date}T${time || '00:00'}`);
  if (Number.isNaN(parsed.getTime())) return `${date}${time ? ` at ${time}` : ''}`;
  return `${parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })}${time ? ` at ${time}` : ''}`;
};

const formatRequestedOn = (appointment) => {
  const rawValue = appointment?.created_at ?? appointment?.createdAt ?? appointment?.requestDate ?? appointment?.requestedAt ?? appointment?.requested_on;
  const candidates = [];

  if (rawValue instanceof Date) {
    candidates.push(rawValue.toISOString());
  } else if (rawValue !== null && rawValue !== undefined) {
    const raw = String(rawValue).trim();
    if (raw) {
      candidates.push(raw, raw.replace(' ', 'T'));
    }
  }

  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }

  const idValue = String(appointment?.id || appointment?._id || '').trim();
  if (idValue && idValue.length >= 8) {
    const hexTimestamp = idValue.slice(0, 8);
    const timestamp = Number.parseInt(hexTimestamp, 16);
    if (!Number.isNaN(timestamp)) {
      const parsed = new Date(timestamp * 1000);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }
  }

  return 'N/A';
};

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('pending');
  const navigate = useNavigate();

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error loading appointments', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const groupedAppointments = useMemo(
    () =>
      STATUS_ORDER.reduce((acc, status) => {
        acc[status] = appointments.filter((appt) => appt.status === status);
        return acc;
      }, {}),
    [appointments]
  );

  const stats = useMemo(
    () => ({
      total: appointments.length,
      pending: groupedAppointments.pending?.length || 0,
      accepted: groupedAppointments.accepted?.length || 0,
      rejected: groupedAppointments.rejected?.length || 0,
      completed: groupedAppointments.completed?.length || 0,
    }),
    [appointments.length, groupedAppointments]
  );

  if (loading) return <div className="p-8">Loading appointments...</div>;
  if (error) return <div className="p-8 text-red-600">Failed to load appointments</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-[#f5fcfd] via-white to-white">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#059AA0]">Doctor Panel</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="mt-3 text-slate-600 leading-7">
            Review appointment requests by status, open the request you want to work on, and keep the flow organized from
            pending review through completed visits.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadAppointments}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-[#059AA0] hover:text-[#059AA0]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor/profile')}
            className="rounded-xl border border-[#059AA0] bg-white px-4 py-3 font-semibold text-[#059AA0] transition hover:bg-cyan-50"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor/profile/edit')}
            className="rounded-xl bg-[#059AA0] px-4 py-3 font-semibold text-white transition hover:bg-[#047b80]"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Appointments</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{STATUS_META[status].label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{stats[status]}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`rounded-xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-[#059AA0] text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{STATUS_META[status].label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                    {stats[status]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {(() => {
        const items = groupedAppointments[activeStatus] || [];
        const meta = STATUS_META[activeStatus];

        return (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{meta.label} Appointments</h2>
                <p className="mt-1 text-sm text-slate-500">{meta.note}</p>
              </div>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold ${meta.chip}`}>
                {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-5">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 text-sm">
                  No {activeStatus} appointments yet.
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-xl border ${meta.card} bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm`}
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="font-semibold text-slate-900 text-lg truncate">
                          {a.patientName} <span className="text-slate-500 text-base">- {a.patientId}</span>
                        </div>
                        <div className="text-sm text-slate-600">{formatDateTime(a.date, a.time)}</div>
                        <div className="text-xs text-slate-500">
                          Requested on {formatRequestedOn(a)}
                        </div>
                        {a.additionalInfo ? <p className="text-sm text-slate-600">{a.additionalInfo}</p> : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.chip}`}>
                          {STATUS_META[a.status]?.label || a.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor/appointments/${a.id}`)}
                          className="rounded-lg bg-[#059AA0] px-4 py-2 font-semibold text-white transition hover:bg-[#047b80]"
                        >
                          View Details
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })()}
    </div>
  );
}

export default DoctorDashboard;

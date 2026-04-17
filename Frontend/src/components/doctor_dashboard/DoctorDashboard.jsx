import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const STATUS_META = {
  pending: {
    label: 'New Requests',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    card: 'border-amber-200',
    note: 'These requests are waiting for your decision.',
  },
  accepted: {
    label: 'Accepted Requests',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    card: 'border-emerald-200',
    note: 'Approved appointments that are scheduled.',
  },
  rejected: {
    label: 'Rejected Requests',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    card: 'border-rose-200',
    note: 'Requests you declined.',
  },
  completed: {
    label: 'Completed Appointments',
    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    card: 'border-cyan-200',
    note: 'Finished consultations and follow-up history.',
  },
};

const STATUS_ORDER = ['pending', 'accepted', 'rejected', 'completed'];
const STATUS_COLOR = {
  pending: '#f59e0b',
  accepted: '#10b981',
  rejected: '#f43f5e',
  completed: '#06b6d4',
};

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

  const groupedAppointments = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = appointments.filter((appt) => appt.status === status);
    return acc;
  }, {});

  const total = appointments.length;

  const statusChartData = STATUS_ORDER.map((status) => ({
    name: STATUS_META[status].label,
    key: status,
    value: groupedAppointments[status]?.length || 0,
  }));

  const trendMap = {};
  appointments.forEach((appt) => {
    const sourceDate = appt.created_at || appt.date;
    if (!sourceDate) return;
    const parsed = new Date(sourceDate);
    if (Number.isNaN(parsed.getTime())) return;
    const key = parsed.toISOString().slice(0, 10);

    if (!trendMap[key]) {
      trendMap[key] = {
        key,
        label: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        completed: 0,
      };
    }

    trendMap[key].total += 1;
    if (STATUS_ORDER.includes(appt.status)) {
      trendMap[key][appt.status] += 1;
    }
  });

  const trendChartData = Object.values(trendMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-7);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-[#f5fcfd] via-white to-white">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#059AA0]">Doctor Dashboard</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Review and manage patient appointment requests with clear status-based sections.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/doctor/profile')}
            className="bg-white border border-[#059AA0] text-[#059AA0] px-4 py-2 rounded-lg font-semibold"
          >
            Profile
          </button>
          <button
            onClick={() => navigate('/doctor/profile/edit')}
            className="bg-[#059AA0] text-white px-4 py-2 rounded-lg font-semibold"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{STATUS_META[status].label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{groupedAppointments[status]?.length || 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800">Status Distribution</h2>
            <p className="text-sm text-slate-500">Overview of current appointment pipeline by status.</p>
          </div>

          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 text-sm">
              No appointments available to render analytics yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLOR[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Appointments']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800">Recent Request Trend</h2>
            <p className="text-sm text-slate-500">Daily request volume for the last 7 recorded days.</p>
          </div>

          {trendChartData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 text-sm">
              Not enough date data to render trend analytics.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" name="New" fill={STATUS_COLOR.pending} radius={[6, 6, 0, 0]} />
                <Bar dataKey="accepted" name="Accepted" fill={STATUS_COLOR.accepted} radius={[6, 6, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill={STATUS_COLOR.rejected} radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill={STATUS_COLOR.completed} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div className="space-y-8">
        {STATUS_ORDER.map((status) => {
          const items = groupedAppointments[status] || [];
          const meta = STATUS_META[status];

          return (
            <section key={status} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{meta.label}</h2>
                  <p className="text-sm text-slate-500">{meta.note}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${meta.chip}`}>
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-5">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
                    No {meta.label.toLowerCase()} right now.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {items.map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-xl border ${meta.card} bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4`}
                      >
                        <div className="space-y-2">
                          <div className="font-semibold text-slate-900 text-lg">
                            {a.patientName} <span className="text-slate-500 text-base">- {a.patientId}</span>
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatDateTime(a.date, a.time)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Requested on {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.chip}`}>
                            {a.status}
                          </span>
                          <button
                            onClick={() => navigate(`/doctor/appointments/${a.id}`)}
                            className="bg-[#059AA0] text-white px-4 py-2 rounded-lg font-semibold"
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
        })}
      </div>
    </div>
  );
}

export default DoctorDashboard;

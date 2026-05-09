import React, { useEffect, useState } from "react"
import axios from "axios"
import { Users, User, Stethoscope, UserPlus, Loader2 } from "lucide-react"
import { API_BASE_URL } from "../../constant"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

const DEFAULT_STATS = {
  total_patients: 0,
  total_doctors: 0,
  overall_users: 0,
  patient_gender_counts: { male: 0, female: 0, other: 0 },
  doctor_gender_counts: { male: 0, female: 0, other: 0 },
}

const PIE_COLORS = ["#0d9488", "#51a4fd"]

function getToken() {
  const raw = localStorage.getItem("access_token") || localStorage.getItem("token") || ""
  const token = String(raw).trim()
  return token && token !== "undefined" && token !== "null" ? token : ""
}

export function OverviewStats() {
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const fetchDashboard = async () => {
      setLoading(true)
      setError("")

      try {
        const token = getToken()
        const response = await axios.get(`${API_BASE_URL}/dashboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!mounted) return

        setStats({
          ...DEFAULT_STATS,
          ...response.data,
          patient_gender_counts: {
            ...DEFAULT_STATS.patient_gender_counts,
            ...(response.data?.patient_gender_counts || {}),
          },
          doctor_gender_counts: {
            ...DEFAULT_STATS.doctor_gender_counts,
            ...(response.data?.doctor_gender_counts || {}),
          },
        })
      } catch (fetchError) {
        if (!mounted) return
        setError("Unable to load overview stats right now.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()
    return () => {
      mounted = false
    }
  }, [])

  const pieData = [
    { name: "Patients", value: stats.total_patients, fill: "#059AA0" },
    { name: "Doctors", value: stats.total_doctors, fill: "#0f766e" },
  ].filter((item) => item.value > 0)

  const metricCards = [
    { icon: Users, label: "Overall Users", value: stats.overall_users },
    { icon: User, label: "Patients", value: stats.total_patients },
    { icon: Stethoscope, label: "Doctors", value: stats.total_doctors },
    { icon: UserPlus, label: "Female Patients", value: stats.patient_gender_counts.female },
    { icon: UserPlus, label: "Male Patients", value: stats.patient_gender_counts.male },
  ]

  return (
    <div className="w-full py-3 overflow-x-hidden">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">BreatheWell Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Live user breakdown .</p>
        </div>
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-sm text-teal-700 border border-teal-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 w-full">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
          {metricCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">Live</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm min-w-0">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-gray-900">Overall users</h3>
            <p className="text-sm text-gray-500">Patients vs doctors</p>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              No user data available yet.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Users"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverviewStats

"use client"

import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"

const data = [
  { name: "Female", value: 30, fill: "#14b8a6" },
  { name: "Male", value: 40, fill: "#f97316" },
  { name: "Child", value: 25, fill: "#6366f1" },
]

export function GenderChart() {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Gender</h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="text-center mt-2">
        <p className="text-3xl font-bold text-gray-900">100%</p>
      </div>
    </div>
  )
}

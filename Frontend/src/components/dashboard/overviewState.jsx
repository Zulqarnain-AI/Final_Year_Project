import { Users, User, Stethoscope, UserPlus, LogOut } from "lucide-react"
import Graph from "./image/image.png"

const stats = [
  { icon: Users, value: "900", label: "Total Staff" },
  { icon: User, value: "1000", label: "Total patient" },
  { icon: Stethoscope, value: "100", label: "Daily Surgery" },
  { icon: UserPlus, value: "500", label: "New Patient" },
  { icon: LogOut, value: "200", label: "Daily Released" },
]

export function OverviewStats() {
  return (
    <div className="w-full py-3 ">
      <h2 className="text-lg font-bold text-gray-900 py-3 ">BreatheWell Overview</h2>

      <div className="flex flex-row  gap-6 overflow-x-auto overflow-hidden pb-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="min-w-[143px] h-[130px] flex-shrink-0 text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon className="w-6 h-6 text-teal-500 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          )
        })}

        <div className="flex-shrink-0 items-end ml-6">
          <img
            src={Graph}
            className="w-[300px] h-[180px] object-cover rounded-lg border border-gray-100"
            alt="Overview Graph"
          />
        </div>
      </div>
    </div>
  )
}

export default OverviewStats

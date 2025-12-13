import { FileText, AlertTriangle, BarChart3, Heart } from "lucide-react"
import { Link } from "react-router-dom"


const features = [
  {
    icon: FileText,
    title: "AI diagnosis",
    description: "Check your health status with intelligent analysis",
    link: "/Input"

  },
  {
    icon: AlertTriangle,
    title: "Environmental alerts",
    description: "Get notified about air quality risks",
    link: "/environmmental_alert"
  },
  {
    icon: BarChart3,
    title: "Report",
    description: "Summary of your recent checkups and test results.",
  },
  {
    icon: Heart,
    title: "Care plan",
    description: "Daily care plan focusing on wellness goals",
  },
]

export function FeatureCards() {
  return (
    <>
    <div className="w-[1168px]">
      <div className="flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="min-w-[300px] bg-white rounded-lg border shadow-md border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <Link to={feature.link}>
              <Icon className="w-8 h-8 text-teal-500 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
              </Link>
            </div>
          )
        })}
      </div>
      
    </div>

    </>
  )
}

export default FeatureCards

import React from 'react'
import Banner1 from './image/banner.jpg'

function Banner() {
  return (
     <>
      <div className="relative w-full mb-4">
        <img className="w-full h-[150px] object-cover" src={Banner1 || "/placeholder.svg"} alt="BreatheWell Banner" />
        {/* <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-white">BREATHEWELL</h1>
          <p className="text-white text-sm">Lung Disease Detection And Care Assistance</p>
        </div> */}
      </div>
    </>
  )
}

export default Banner

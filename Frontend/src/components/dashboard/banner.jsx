import React from 'react'
import Banner1 from './image/banner.jpg'

function Banner() {
  return (
     <>
      <div className="relative w-full mb-4">
        <img className="w-full h-[150px] object-cover" src={Banner1 || "/placeholder.svg"} alt="BreatheWell Banner" />
        
      </div>
    </>
  )
}

export default Banner

import React from 'react'
import Navbar from "./Navbar"
import Herosection from "./HeroSection"

function Landing() {
  return (
    <>
    <div className="px-[10px] py-[20px] hide-scrollbar  h-screen overflow-y-scroll">
     <Navbar />
     <Herosection />
    </div>
    </>
  )
}

export default Landing

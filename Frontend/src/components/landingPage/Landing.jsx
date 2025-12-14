import React from 'react'
import Navbar from "./Navbar"
import Herosection from "./HeroSection"
import About from './About'
import Contact from './Contact'
import Footer from './Footer'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

function Landing() {
  return (
    <>
    <div className="px-[10px] py-[20px] hide-scrollbar  h-screen overflow-y-scroll">
     <Navbar />
      <Herosection />
      <About />
      <Contact />
      <Footer />
    </div>
    </>
  )
}

export default Landing

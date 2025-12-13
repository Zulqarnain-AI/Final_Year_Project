import React from 'react'
import Logo from './image/lung logo.png'
import Profile from './image/user image.webp'

function Header() {
  return (
    <>
    <header className="flex justify-between shadow-md p-4" >
        
        <div className="flex items-center gap-3">
            <img className="h-5 w-5"
             src={Logo} alt="logo" />
             <h1 className="text-xl font-bold text-[#059AA0]">BreatheWell</h1>
        </div>

        <div className="flex items-center gap-2 ">
            <img className="h-7 w-7  rounded-full"
             src={Profile} alt="" />
             <h1 className="text-medium font-medium text-[#059AA0]">Profile</h1>
        </div>
        

    </header>
    </>
  )
}

export default Header

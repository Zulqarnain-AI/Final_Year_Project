import React from 'react'
import Header from './header'
import Banner from './banner'
import Card from './card'
import State from './overviewState'

function Dashboard() {
  return (
    <>
    <div className="px-[20px] py-[20px] hide-scrollbar  h-screen overflow-y-scroll">
        <Header />
        <Banner />
        <Card />
        <State />
        

    </div>
    </>
  )
}

export default Dashboard

import React from 'react'
import Banner from './banner'
import Card from './card'
import State from './overviewState'

function Dashboard() {
  return (
    <>
    <div className="px-4 sm:px-5 py-5 hide-scrollbar h-screen overflow-y-auto overflow-x-hidden">
        <Banner />
        <Card />
        <State />
        

    </div>
    </>
  )
}

export default Dashboard

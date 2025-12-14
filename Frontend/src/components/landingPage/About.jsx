import React from 'react'

function About() {
  return (
    <>
    {/* About Section */}
<section id="about" className="py-20 px-6 bg-[#DDF8F4]">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl font-bold text-[#059AA0] text-center mb-6">
      About Us
    </h2>
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
      <p className="text-xl text-gray-700 mb-6 leading-relaxed">
        We are dedicated to revolutionizing respiratory health monitoring through cutting-edge technology and innovative solutions. Our mission is to make lung health accessible and understandable for everyone.
      </p>
      <p className="text-lg text-gray-600 leading-relaxed">
        With years of experience in medical technology and a team of dedicated healthcare professionals, we provide state-of-the-art monitoring systems that help detect early signs of respiratory issues. Our goal is to empower individuals and healthcare providers with the tools they need for better lung health management.
      </p>
    </div>
  </div>
</section>
    </>
  )
}

export default About

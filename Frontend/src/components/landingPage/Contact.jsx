import React from 'react'

function Contact() {
  return (
    <>
    {/* Contact Section */}
<section id="contact" className="py-20 px-6 bg-white">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl font-bold text-[#059AA0] text-center mb-12">
      Contact Us
    </h2>
    <div className="grid md:grid-cols-3 gap-8">
      {/* Email Card */}
      <div className="bg-[#DDF8F4] rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[#059AA0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Email</h3>
        <p className="text-lg text-gray-600">info@lunghealth.com</p>
      </div>

      {/* Phone Card */}
      <div className="bg-[#DDF8F4] rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[#059AA0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Phone</h3>
        <p className="text-lg text-gray-600">+1 (555) 123-4567</p>
      </div>

      {/* Location Card */}
      <div className="bg-[#DDF8F4] rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[#059AA0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Location</h3>
        <p className="text-lg text-gray-600">123 Health Ave, Medical District</p>
      </div>
    </div>
  </div>
</section>
    </>
  )
}

export default Contact

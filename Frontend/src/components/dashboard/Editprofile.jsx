import React from 'react'

function Editprofile() {
  return (
    
    <>
     <section className="col-span-4 px-20 ">
            <div className="flex gap-[400px] items-center mb-10">
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <img
                src=""
                alt=""
                className="w-20 h-20 rounded-full bg-[#059AA0]"
              />
            </div>
            <form action="">
              <div className="flex flex-row gap-[30px]">
                <div>
                  <label className="text-lg font-medium">First Name</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Muhammad"
                    className="w-[405px] border border-gray-300 rounded-md p-2 mt-1 mb-5"
                  />
                </div>
                <div>
                  <label className="text-lg font-medium">Last Name</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Younus"
                    className="w-[405px] border border-gray-300 rounded-md p-2 mt-1 mb-5"
                  />
                </div>
              </div>

              <div>
                <label className="text-lg font-medium">Email</label>
                <br />
                <input
                  type="text"
                  placeholder="Muhammad"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 mb-5"
                />
                <label className="text-lg font-medium">Password</label>
                <br />
                <input
                  type="text"
                  placeholder="Muhammad"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 mb-5"
                />
                  <div className="flex flex-row gap-[30px]">
                <div>
                  <label className="text-lg font-medium">Contact Number</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Muhammad"
                    className="w-[405px] border border-gray-300 rounded-md p-2 mt-1 mb-5"
                  />
                </div>
                <div>
                  <label className="text-lg font-medium">Address</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Younus"
                    className="w-[410px] border border-gray-300 rounded-md p-2 mt-1 mb-5"
                  />
                </div>
              </div>
              <div className="">
                <button 
                className="bg-[#059AA0] px-4 py-2 text-white rounded-md mr-4 hover:bg-white hover:border hover:border-[#059AA0] hover:text-[#059AA0] transition duration-300"
                >Cancel</button>
                <button 
                className="bg-[#059AA0] px-4 py-2 text-white rounded-md mr-4 hover:bg-white hover:border hover:border-[#059AA0] hover:text-[#059AA0] transition duration-300"
                >Save</button>
                
              </div>
                
              </div>
            </form>
          </section>
    </>
  )
}

export default Editprofile

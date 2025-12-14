import React, { act, useState } from "react";
import Header from "./header.jsx";
import Logo from "./image/lung logo.png";
import { Pen, Pencil } from "lucide-react";
import { Bell } from "lucide-react";
import { Lock, Settings, HelpCircle } from "lucide-react";
import Editprofile from "./Editprofile.jsx";

function Setting() {
  const items = [
    {
      id: 1,
      name: "Edit Profile",
      icon: <Pen />,
    },
    {
      id: 2,
      name: "Notification",
      icon: <Lock />,
    },
    {
      id: 3,
      name: "Security",
      icon: <Bell />,
    },
    {
      id: 4,
      name: "Appearance",
      icon: <Settings />,
    },
    {
      id: 5,
      name: "Help",
      icon: <HelpCircle />,
    },
  ];
  const [active, setActive] = useState(true);
  return (
    <>
      <div className="px-[20px] py-[30px]  hide-scrollbar  h-screen overflow-y-scroll">
        <main className="w-full  grid fixed  grid-cols-5 h-screen">
          <section className="col-span-1  border-r border-[#059AA0] border-3">
            <div className="flex items-center gap-3 flex justify-center mb-[10px] ">
              <img className="h-5 w-5 " src={Logo} alt="logo" />
              <h1 className="text-xl font-bold text-[#059AA0]">BreatheWell</h1>
            </div>
            <div>
              <h3 className="text-[20px] font-bold mb-5 ml-[47px] ">Setting</h3>

              <ul className="  gap-3 flex ml-[50px] flex-col">
                <li
                  className={`text-[18px]  mb-3  cursor-pointer ${
                    active ? "text-black " : "text-[#059AA0]"
                  }`}
                  onClick={() => setActive(!active)}
                >
                  <Pencil className="inline-block mr-3 my-1 " size="18" />
                  Edit Profile
                </li>
                <li className="text-[18px]  mb-3 text-[#059AA0]">
                  <Bell className="inline-block mr-3 my-1 " size="18" />
                  Notification
                </li>
                <li className="text-[18px]  mb-3 text-[#059AA0] text-start">
                  <Lock className="inline-block mr-3 my-1 " size="18" />
                  Security
                </li>

                <li className="text-[18px]  mb-3 text-[#059AA0] text-start">
                  <Settings className="inline-block mr-3 my-1 " size="18" />
                  Appearance
                </li>
                <li className="text-[18px]  mb-3 text-[#059AA0] text-start">
                  <HelpCircle className="inline-block mr-3 my-1 " size="18" />
                  Help
                </li>
              </ul>
            </div>
          </section>

          {active && <Editprofile />}
        </main>
      </div>
    </>
  );
}

export default Setting;

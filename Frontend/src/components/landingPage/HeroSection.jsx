import Image from "./image/landpage-herosection-image.webp";
import { FaMicrophone ,FaClipboardList, FaGlobeAmericas} from "react-icons/fa";
import {FaUserDoctor} from "react-icons/fa6"

function Herosection() {
  return (
    <>
      <section
      className="container-sm mx-auto  p-10"
      >
        <div className="flex justify-between ">
          <div className="w-[500px]">
            <h1 className="text-4xl font-bold mb-5">
              AI-powered lung health monitor coughs, track symptoms, get care
            </h1>
            <p className="mt-8 text-xl">
              Record your coughs or breathing, get AI analysis, track progress
              and connect with a doctor
            </p>
          </div>

          <div className="">
            <img src={Image} />
          </div>
        </div>

        <section>
          <div>
            <h1 className="text-2xl font-bold">Features</h1>

            <div className="grid grid-cols-4 gap-6">

              <div className="bg-[#DDF8F4] p-4 shadow-xl py-4">
                <button
               
                >
                  <FaMicrophone size={20}  className="text-green-700"/>
                  
                </button>
                <h1 className="font-bold">Audo Analysis</h1>
                  <p>AI analyzes breathing and cough sounds</p>
                </div>

              <div className="bg-[#DDF8F4] p-4 shadow-xl">
                <button
               
                >
                 <FaClipboardList size={20}  className="text-green-700"/>
                  
                </button>
                <h1 className="font-bold">Audo Analysis</h1>
                  <p>AI analyzes breathing and cough sounds</p>
              </div>
              <div className="bg-[#DDF8F4] p-4 shadow-xl">
                <button
               
                >
                  <FaGlobeAmericas size={20}  className="text-green-700"/>
                  
                </button>
                <h1 className="font-bold">Audo Analysis</h1>
                  <p>AI analyzes breathing and cough sounds</p>
              </div>
              <div className="bg-[#DDF8F4] p-4 shadow-xl">
                <button
               
                >
                  <FaUserDoctor size={20}  className="text-green-700"/>
                  
                </button>
                <h1 className="font-bold">Audo Analysis</h1>
                  <p>AI analyzes breathing and cough sounds</p>
              </div>
              
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
export default Herosection;

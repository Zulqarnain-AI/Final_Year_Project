
import { FaMicrophone, FaClipboardList, FaGlobeAmericas } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import Image from "../login/image/mainimage.png"

function Herosection() {
  return (
    <>
      <section className="container-sm mx-auto mt-10 p-10">
        <div className="flex justify-between">
          {/* Left Content */}
          <div className="w-[500px]">
            <h1 className="text-4xl font-bold mb-5">
              AI-Powered Lung Health Monitoring for Asthma & Bronchitis
            </h1>

            <p className="mt-8 text-xl">
              Record cough and breathing sounds to detect asthma and bronchitis
              using artificial intelligence. Monitor symptoms over time and
              connect with healthcare professionals for early diagnosis and
              better respiratory care.
            </p>
          </div>

          {/* Right Image */}
          <div>
            <img  className="w-[500px] h-[350px]" src={Image} alt="Lung Health Monitoring" />
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16">
          <div>
            <h1 className="text-2xl font-bold mb-6">Features</h1>

            <div className="grid grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#DDF8F4] p-4 shadow-xl py-4 rounded">
                <FaMicrophone size={20} className="mb-2" color="#059AA0" />
                <h1 className="font-bold">Audio Analysis</h1>
                <p>
                  AI analyzes cough and breathing sounds to detect lung
                  abnormalities.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#DDF8F4] p-4 shadow-xl rounded">
                <FaClipboardList size={20} className="mb-2" color="#059AA0" />
                <h1 className="font-bold">Symptom Tracking</h1>
                <p>
                  Track asthma and bronchitis symptoms to monitor health
                  progress.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#DDF8F4] p-4 shadow-xl rounded">
                <FaGlobeAmericas size={20} className="mb-2" color="#059AA0" />
                <h1 className="font-bold">Anywhere Access</h1>
                <p>
                  Access your lung health reports securely from anywhere in the
                  world.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#DDF8F4] p-4 shadow-xl rounded">
                <FaUserDoctor size={20} className="mb-2" color="#059AA0" />
                <h1 className="font-bold">Doctor Consultation</h1>
                <p>
                  Share AI-generated reports with doctors for expert medical
                  advice.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

export default Herosection;

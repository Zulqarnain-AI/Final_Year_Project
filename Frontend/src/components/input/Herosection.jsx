import React, { useState } from "react";
import { Link } from "react-router-dom"

function Herosection() {
  // ✅ Initialize selected as an array for multi-select
  const [selected, setSelected] = useState([]);

  // ✅ Toggle function for multi-select
  const toggleSymptom = (symptom) => {
    if (selected.includes(symptom)) {
      // remove it
      setSelected(selected.filter((item) => item !== symptom));
    } else {
      // add it
      setSelected([...selected, symptom]);
    }
  };

  const symptoms = [
    "Fever",
    "Shortness of breath",
    "Headche",
    "Cough",
    "Fatigue",
    "Rapid Breathing",
    "Chest Tightness",
    "Wheezing",
    "Sore Throat",
  ];

  return (
    <section>
      <div className="flex justify-center items-center flex-col gap-3">
        <h1 className="font-bold font-poppins text-[40px]">Symptom</h1>
        <p className="font-poppins font-medium">
          Submit your symptoms and audio recordings for smart diagnosis
        </p>

        <div className="w-[1167px] h-[350px] shadow-xl border rounded p-3">
          <div className="grid grid-rows-3 grid-flow-col p-10 gap-4">
            {symptoms.map((symptom) => (
              <div
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`w-[280px] h-[67px] rounded flex justify-center items-center cursor-pointer
                  shadow-sm transition-transform duration-300 shadow-[#1FB8C0]
                  hover:scale-105 hover:text-[#1FB8C0] hover:shadow-none
                  ${selected.includes(symptom) ? "bg-[#1FB8C0] hover:text-white text-white" : ""}
                `}
              >
                {symptom}
              </div>
            ))}
          </div>

          <div className="relative bottom-[30px] w-[100px] left-[952px]">
            <Link to="/Uploadcough">
              <button className="px-4 py-2 bg-[#1FB8C0] hover:border-[#1FB8C0] hover:border-2 hover:bg-white hover:text-[#1FB8C0] text-white rounded-full">
                Next ➜
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Herosection;

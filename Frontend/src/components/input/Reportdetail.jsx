import React from "react";

function Reportdetail() {
  return (
    <>
      <section className="w-full">
        <h1 className="font-weight-700 font-bold text-[40px] text-center my-[20px] font bold style-poppins">
          Report
        </h1>

        <p className="font-weight-400  text-[30px]  font-bold style-poppins">
          Summary of Findings
        </p>
        <div className="flex gap-5 w-full">
          <div className="w-[800px] mt-[30px] border-1 p-2 border-[#000000] h-[119px] shadow-lg rounded-[10px]">
            <p className="font-weight-500 style-poppins text-[20px]">Suggested Condition:</p>
            <p className="font-weight-500 style-poppins text-[20px]">Possible Bronchitis:</p>
            <p className="font-weight-500 style-poppins text-[20px]">Severity Level Moderate:</p>
            
          </div>
          <div className="flex-1 h-[211px] border-1 border-[#000000]  shadow-lg rounded-[10px]">
            {/* Second div (narrower) */}
          </div>
        </div>
        <div>
            <p className="font-weight-400  text-[30px]  font-bold style-poppins">
          Input Data Review
        </p>
            <div 
            className="w-full mt-[10px] border-1 border-[#000000] h-[211px] shadow-lg rounded-[10px] p-3"
            >
            <div>
                <p className="font-weight-500 style-poppins text-[20px]">Sypmtom Submission</p>
            </div>

            <div></div>

            </div>
        </div>
      </section>
    </>
  );
}

export default Reportdetail;

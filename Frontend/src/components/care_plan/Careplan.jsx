import React, { useState } from 'react';
// Functional component for the circular progress bar
const CircularProgress = ({ percent }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  // Calculate the stroke offset based on the percentage
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Background track (Grey) */}
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        {/* Progress arc (Teal) */}
        <circle
          className="text-teal-500 transition-all duration-700 ease-out"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
      </svg>
      {/* Percentage text in the center */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{`${percent}%`}</span>
      </div>
    </div>
  );
};

// Functional component for a checklist item
const CheckboxItem = ({ label, isChecked, onChange }) => (
  <label className="flex items-center space-x-3 text-gray-700 cursor-pointer">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="form-checkbox h-5 w-5 text-teal-500 rounded-sm border-gray-300 focus:ring-teal-500"
      style={{
        // Custom styling to match the checkmark color in the image
        backgroundColor: isChecked ? '#14b8a6' : 'transparent',
        borderColor: isChecked ? '#14b8a6' : '#d1d5db',
        color: 'white',
      }}
    />
    <span className="text-lg">{label}</span>
  </label>
);

// Main Application Component
function CarePlanUI() {
  const [tasks, setTasks] = useState({
    // Home Remedies
    saltwaterGargle: true,
    honeyLemonTea: false,
    steamInhalation: false,
    // Exercise Recommendations
    lightWalks: true,
    trackTemperature: false,
  });

  // NEW STATE: To control the success message visibility
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTaskToggle = (taskName) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [taskName]: !prevTasks[taskName],
    }));
  };

  // NEW FUNCTION: Handles the update action and shows the message
  const handleUpdate = () => {
    // 1. (In a real app, you would send the 'tasks' state to an API here)
    console.log("Saving tasks:", tasks);


    // 2. Show the success message
    setShowSuccess(true);

    // 3. Hide the success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    
  };

  // Calculate percentage of completed tasks (5 tasks total)
  const completedCount = Object.values(tasks).filter(Boolean).length;
  const totalTasks = Object.keys(tasks).length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="w-full h-screen bg-gray-100 p-4 flex justify-center items-center overflow-auto">

      {/* Success Message Alert (Fixed Position) */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg transition-opacity duration-300 animate-fadeInOut">
          <p className="font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Successfully updated!
          </p>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] p-6 flex flex-col">

        {/* Header/Navigation */}
        <header className="flex justify-between items-center pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center text-xl font-bold text-teal-600">
            <span className="text-2xl font-extrabold mr-1"></span>
            BreatheWell
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span className="text-gray-700 text-sm">Profile</span>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">P</div>
          </div>
        </header>

        {/* Title Section */}
        <section className="flex items-center py-6 flex-shrink-0">
          
          <h1 className="text-3xl font-semibold text-gray-800">Care Plan</h1>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto py-2 pr-2">

          {/* Card 1: Home Remedies */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Home Remedies</h2>
            <div className="space-y-4">
              <CheckboxItem
                label="Warm Saltwater Gargle"
                isChecked={tasks.saltwaterGargle}
                onChange={() => handleTaskToggle('saltwaterGargle')}
              />
              <CheckboxItem
                label="Honey & Lemon Tea"
                isChecked={tasks.honeyLemonTea}
                onChange={() => handleTaskToggle('honeyLemonTea')}
              />
              <CheckboxItem
                label="Steam Inhalation"
                isChecked={tasks.steamInhalation}
                onChange={() => handleTaskToggle('steamInhalation')}
              />
            </div>
          </div>

          {/* Card 2: Progress */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Progress</h2>
            <div className="flex items-center space-x-6">
              <CircularProgress percent={progressPercent} />
              <div>
                <p className="text-lg font-medium text-gray-800">Progress towards health goals</p>
                <p className="text-sm text-gray-500 mt-1">Mot. Progress towards health goals</p>
              </div>
            </div>
          </div>

          {/* Card 3: Exercise Recommendations */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Exercise Recommendations</h2>
            <div className="space-y-4">
              <CheckboxItem
                label="Light Walks (15 min)"
                isChecked={tasks.lightWalks}
                onChange={() => handleTaskToggle('lightWalks')}
              />
              <CheckboxItem
                label="Track Temperature AM/PM"
                isChecked={tasks.trackTemperature}
                onChange={() => handleTaskToggle('trackTemperature')}
              />
            </div>
          </div>

          {/* Card 4: Notes */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Notes</h2>
            <p className="text-gray-700 text-lg">
              Remember to stay hydrated throughout the day
            </p>
          </div>

        </div>

        {/* Update Button */}
        <div className="mt-8 flex justify-center flex-shrink-0">
          <button
            onClick={handleUpdate} // Attach the new handler
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-12 rounded-lg shadow-md transition-colors text-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarePlanUI;
import React, { useState, useEffect } from 'react'; // 🌟 Import useState for slot selection
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper function to format date for display (e.g., 2025-12-16 -> Tue, Dec 16)
const formatDate = (dateString) => {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// will fetch doctor data from backend

function DoctorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchDoctor = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/doctors/${id}`);
                if (mounted) setDoctor(res.data);
            } catch (err) {
                console.error('Error fetching doctor', err);
                if (mounted) setError(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchDoctor();
        return () => { mounted = false };
    }, [id]);

    if (loading) return <div className="p-8">Loading doctor...</div>;
    if (error || !doctor) return <div className="p-8 text-center text-red-600">Doctor not found!</div>;

    const handleSendRequest = async () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select a date and time slot before sending a request.");
            return;
        }

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!token) {
                alert('You must be logged in as a patient to request an appointment.');
                navigate('/login');
                return;
            }

            const payload = {
                doctorId: doctor.id,
                date: selectedDate,
                time: selectedTime,
                notes: ''
            };

            const res = await axios.post('http://localhost:5000/appointments', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment request sent successfully.');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error sending appointment request', err);
            alert('Failed to send appointment request');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto bg-gray-50 shadow-2xl rounded-lg">
            <h1 className="text-3xl font-bold text-[#059AA0] mb-8 border-b pb-4">
                Doctor Public Profile
            </h1>

            {/* Main Layout: Two Columns (Details on Left, Calendar/Booking on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* 1. Left Column: Profile Card and Detailed Info (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    
                    {/* Profile Summary & Rating */}
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-white p-6 rounded-xl shadow-md border-t-4 border-teal-500">
                        <img 
                            src={doctor.image} 
                            alt={doctor.name} 
                            className="w-32 h-32 object-cover rounded-full border-4 border-gray-100 shadow-lg" 
                        />
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-bold text-gray-800">{doctor.name}</h2>
                            <p className="text-xl text-teal-600 font-semibold mb-2">{doctor.specialization}</p>
                            <p className="text-gray-600">
                                <span className="font-bold">{doctor.experience} Years</span> of Experience
                            </p>
                            <div className="text-lg text-yellow-500 flex items-center justify-center md:justify-start mt-2">
                                <span className="text-1xl mr-1">⭐</span> {doctor.rating} / 5.0
                            </div>
                        </div>
                    </div>

                    {/* 🌟 New Content: About & Experience/Hospitals */}
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                        <h3 className="text-2xl font-semibold text-gray-700 border-b pb-2">About the Doctor</h3>
                        <p className="text-gray-700 leading-relaxed italic">{doctor.details}</p>

                        <div className="pt-4 border-t">
                            <h3 className="text-2xl font-semibold text-gray-700 mb-3">Working Places</h3>
                            
                            {/* Personal Clinic */}
                            <p className="text-lg font-medium text-gray-700 flex items-center gap-2">
                                <span className="text-teal-500 text-xl">🏥</span> 
                                <span className="font-bold text-gray-800">Personal Clinic:</span> {doctor.clinic} ({doctor.location})
                            </p>

                            {/* Current/Past Hospitals */}
                            <p className="text-lg font-medium text-gray-700 mt-2">
                                <span className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-teal-500 text-xl">🏢</span> 
                                    Affiliated Hospitals:
                                </span>
                            </p>
                            <ul className="list-disc list-inside ml-4 text-gray-600">
                                {(doctor.hospitals || []).map((hospital, index) => (
                                    <li key={index}>{hospital}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 2. Right Column: Calendar and Booking (1/3 width) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-8 border-l border-teal-100">
                    <h3 className="text-2xl font-bold text-teal-600 mb-5">
                        <span className='mr-2'>🗓️</span> Book an Appointment
                    </h3>
                    
                    {/* 🌟 New Content: Availability Calendar */}
                    <div className="space-y-4">
                        <p className="font-semibold text-gray-700">Select Date:</p>
                        
                        {/* Date Tabs (mock calendar) */}
                        <div className="flex flex-wrap gap-2">
                            {doctor.availableSlots && doctor.availableSlots.map((slot) => (
                                <button
                                    key={slot.date}
                                    onClick={() => {
                                        setSelectedDate(slot.date);
                                        setSelectedTime(null); // Reset time when date changes
                                    }}
                                    className={`px-4 py-2 text-sm rounded-full transition duration-150 ${
                                        selectedDate === slot.date
                                            ? "bg-teal-500 text-white shadow-md font-bold"
                                            : "bg-gray-100 text-gray-700 hover:bg-teal-100"
                                    }`}
                                >
                                    {formatDate(slot.date)}
                                </button>
                            ))}
                            {!(doctor.availableSlots && doctor.availableSlots.length) && (
                                <p className='text-red-500 text-sm'>No upcoming slots available.</p>
                            )}
                        </div>

                        {/* Time Slots */}
                            {selectedDate && (
                            <div className="pt-4 border-t mt-4">
                                <p className="font-semibold text-gray-700 mb-3">
                                    Select Time for {formatDate(selectedDate)}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(doctor.availableSlots.find(s => s.date === selectedDate)?.times || []).map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`px-3 py-1 text-sm rounded transition duration-150 border ${
                                                selectedTime === time
                                                    ? "bg-teal-500 text-white border-teal-600 font-bold"
                                                    : "bg-white text-teal-600 border-teal-300 hover:bg-teal-50"
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Send Request Button */}
                    <button
                        onClick={handleSendRequest}
                        // Disable button if date or time is not selected
                        disabled={!selectedDate || !selectedTime}
                        className={`mt-8 w-full text-lg px-8 py-3 rounded-xl font-bold transition duration-300 shadow-lg ${
                            selectedDate && selectedTime 
                                ? "bg-teal-500 text-white hover:bg-teal-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        Send Appointment Request
                    </button>
                    
                    {/* Display Selected Slot */}
                    {(selectedDate && selectedTime) && (
                        <p className="text-center text-sm text-gray-600 mt-4 p-2 bg-teal-50 rounded">
                            Selected: **{formatDate(selectedDate)}** at **{selectedTime}**
                        </p>
                    )}

                </div>
            </div>
        </div>
    );
}

export default DoctorProfile;
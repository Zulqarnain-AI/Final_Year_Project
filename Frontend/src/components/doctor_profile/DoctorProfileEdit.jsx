import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Helper: format availableSlots array to textarea lines
const formatSlotsToText = (slots) => {
  if (!slots || !slots.length) return '';
  return slots.map(s => `${s.date} : ${ (s.times || []).join(',') }`).join('\n');
};

// Helper: parse textarea into slots array
const parseSlotsFromText = (text) => {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const slots = lines.map(line => {
    // expected formats: "YYYY-MM-DD:09:00,11:00" or "YYYY-MM-DD : 09:00,11:00"
    const parts = line.split(':');
    if (parts.length < 2) return null;
    const date = parts[0].trim();
    // join remaining parts and then split by comma
    const rest = parts.slice(1).join(':').replace(/^\s*[:\-\s]+/, '').trim();
    const times = rest.split(',').map(t => t.trim()).filter(Boolean);
    return { date, times };
  }).filter(Boolean);
  return slots;
};

function DoctorProfileEdit() {
  const [formData, setFormData] = useState({});
  const [profilePreview, setProfilePreview] = useState('');
  const [slotsText, setSlotsText] = useState('');
  const [clinicsText, setClinicsText] = useState('');
  const [hospitalsText, setHospitalsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const res = await axios.get('http://localhost:5000/api/doctors/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) {
          const data = res.data || {};
          setFormData(data);
          setProfilePreview(data.profileImage || '');
          setSlotsText(formatSlotsToText(data.availableSlots));
          setClinicsText((data.clinics || []).join(', '));
          // doctor UI used 'hospitals' - accept either
          setHospitalsText((data.hospitals || []).join(', '));
          setLanguagesText((data.languages || []).join(', '));
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally { if (mounted) setLoading(false); }
    };
    fetchProfile();
    return () => { mounted = false };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfilePreview(base64);
      setFormData(prev => ({ ...prev, profileImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const payload = { ...formData };
      // parse clinics/hospitals
      if (clinicsText !== undefined) payload.clinics = clinicsText.split(',').map(s => s.trim()).filter(Boolean);
      if (hospitalsText !== undefined) payload.hospitals = hospitalsText.split(',').map(s => s.trim()).filter(Boolean);
      if (languagesText !== undefined) payload.languages = languagesText.split(',').map(s => s.trim()).filter(Boolean);

      // parse slots
      const parsedSlots = parseSlotsFromText(slotsText);
      if (parsedSlots.length) payload.availableSlots = parsedSlots;

      // remove id fields not expected
      delete payload.id;
      delete payload.doctorId;

      await axios.put('http://localhost:5000/api/doctors/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Profile updated');
      navigate('/doctor/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Failed to load profile</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Doctor Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-[#059AA0] mb-4">Profile Photo</h3>
          <div className="flex items-center gap-6">
            <img
              src={profilePreview || 'https://placehold.co/120x120?text=Doctor'}
              alt="Doctor Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-[#059AA0]"
            />
            <div>
              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="block" />
              <p className="text-sm text-gray-500 mt-2">Upload JPG/PNG profile image</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="firstName" value={formData.firstName || ''} onChange={handleChange} placeholder="First name" className="px-4 py-2 border rounded" />
          <input name="lastName" value={formData.lastName || ''} onChange={handleChange} placeholder="Last name" className="px-4 py-2 border rounded" />
          <input name="fullName" value={formData.fullName || ''} onChange={handleChange} placeholder="Full name" className="px-4 py-2 border rounded" />
          <input name="specialization" value={formData.specialization || ''} onChange={handleChange} placeholder="Specialization" className="px-4 py-2 border rounded" />
          <input name="qualification" value={formData.qualification || ''} onChange={handleChange} placeholder="Qualification" className="px-4 py-2 border rounded" />
          <input name="department" value={formData.department || ''} onChange={handleChange} placeholder="Department" className="px-4 py-2 border rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="experience" value={formData.experience || ''} onChange={handleChange} placeholder="Experience (years)" className="px-4 py-2 border rounded" />
          <input name="rating" value={formData.rating || ''} onChange={handleChange} placeholder="Rating" className="px-4 py-2 border rounded" />
        </div>

        <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Short bio / details" className="w-full px-4 py-2 border rounded" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinics (comma separated)</label>
          <input value={clinicsText} onChange={e => setClinicsText(e.target.value)} placeholder="Clinic A, Clinic B" className="w-full px-4 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hospitals / Affiliations (comma separated)</label>
          <input value={hospitalsText} onChange={e => setHospitalsText(e.target.value)} placeholder="Hospital 1, Hospital 2" className="w-full px-4 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma separated)</label>
          <input value={languagesText} onChange={e => setLanguagesText(e.target.value)} placeholder="English, Urdu" className="w-full px-4 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Slots (one per line: YYYY-MM-DD:HH:MM,HH:MM)</label>
          <textarea value={slotsText} onChange={e => setSlotsText(e.target.value)} placeholder="2025-12-16:09:00,11:00" className="w-full px-4 py-2 border rounded h-28" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone" className="px-4 py-2 border rounded w-full" />
          <input name="address" value={formData.address || ''} onChange={handleChange} placeholder="Address" className="px-4 py-2 border rounded w-full" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-[#059AA0] text-white px-6 py-2 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

export default DoctorProfileEdit;

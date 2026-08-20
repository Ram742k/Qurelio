import React, { useState, useEffect } from 'react';

export default function PublicBooking() {
  const [subdomain, setSubdomain] = useState('demo');
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_gender: 'male',
    patient_age: '',
    reason: '',
  });

  useEffect(() => {
    // Extract subdomain from host or query param if available
    const urlParams = new URLSearchParams(window.location.search);
    const sub = urlParams.get('clinic') || 'demo';
    setSubdomain(sub);
    fetchClinicAndDoctors(sub);
  }, []);

  const fetchClinicAndDoctors = async (sub) => {
    try {
      setLoading(true);
      const resClinic = await fetch(`/api/public/v1/${sub}/clinic`);
      const dataClinic = await resClinic.json();
      if (dataClinic.success) setClinic(dataClinic.data);

      const resDoctors = await fetch(`/api/public/v1/${sub}/doctors`);
      const dataDoctors = await resDoctors.json();
      if (dataDoctors.success) {
        setDoctors(dataDoctors.data);
        if (dataDoctors.data.length > 0) {
          setSelectedDoctor(dataDoctors.data[0]);
          fetchSlots(sub, dataDoctors.data[0].id, selectedDate);
        }
      }
    } catch (err) {
      setError('Unable to load clinic details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (sub, doctorId, date) => {
    try {
      const res = await fetch(`/api/public/v1/${sub}/available-slots?doctor_id=${doctorId}&date=${date}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = (doc) => {
    setSelectedDoctor(doc);
    setSelectedTime(null);
    fetchSlots(subdomain, doc.id, selectedDate);
  };

  const handleDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    setSelectedTime(null);
    if (selectedDoctor) fetchSlots(subdomain, selectedDoctor.id, d);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedTime) {
      alert('Please select a doctor and time slot.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/v1/${subdomain}/book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          patient_name: form.patient_name,
          patient_phone: form.patient_phone,
          patient_gender: form.patient_gender,
          patient_age: form.patient_age ? parseInt(form.patient_age) : null,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          reason: form.reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data.data);
      } else {
        setError(data.message || 'Failed to book appointment.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Clinic Header */}
        <div className="bg-emerald-600 text-white p-6">
          <h1 className="text-2xl font-bold">{clinic?.name || 'Qurelio Small Clinic'}</h1>
          <p className="text-emerald-100 text-sm">{clinic?.address ? `${clinic.address}, ${clinic.city}` : 'Book Doctor Appointment Online'}</p>
          <div className="mt-2 text-xs bg-emerald-700/60 inline-block px-3 py-1 rounded-full">
            No Login Required • Instant Confirmation
          </div>
        </div>

        {bookingSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-800">Appointment Booked!</h2>
            <p className="text-slate-600 mt-2">
              Thank you, <strong>{bookingSuccess.patient_name}</strong>. Your slot with <strong>Dr. {selectedDoctor?.name}</strong> is confirmed for:
            </p>
            <div className="my-4 p-4 bg-slate-50 rounded-xl font-semibold text-emerald-700 text-lg">
              📅 {bookingSuccess.appointment_date} at ⏰ {selectedTime}
            </div>
            <button
              onClick={() => { setBookingSuccess(null); setSelectedTime(null); }}
              className="mt-2 bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Select Doctor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Doctor</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDoctorChange(doc)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedDoctor?.id === doc.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">Dr. {doc.name}</div>
                    <div className="text-xs text-slate-500">{doc.specialization} • ₹{doc.consultation_fee}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Select Time Slot */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Available Time Slots</label>
              {slots.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
                  No slots available on this date or clinic closed.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {slots.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className={`p-2 text-xs rounded-lg border font-medium transition ${
                        !s.available
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : selectedTime === s.time
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Details */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Patient Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={form.patient_name}
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={form.patient_phone}
                    onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                  <select
                    value={form.patient_gender}
                    onChange={(e) => setForm({ ...form, patient_gender: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={form.patient_age}
                    onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reason for Visit / Symptoms</label>
                <textarea
                  rows="2"
                  placeholder="Fever, cough, routine checkup..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedTime}
              className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Booking Appointment...' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

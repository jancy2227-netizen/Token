import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { User, Mail, Hash, DoorClosed, BookOpen, Phone, Utensils, Save, CheckCircle2 } from 'lucide-react';

const StudentProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    roomNumber: user?.roomNumber || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || '',
    mealPreference: user?.mealPreference || 'veg'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/auth/profile', formData);
      if (res.data?.success) {
        showToast('Profile updated successfully!', 'success');
        await refreshUser();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const stats = user?.stats || { totalBookings: 0, servedMeals: 0, cancelledMeals: 0 };
  const attendanceRate =
    stats.totalBookings > 0
      ? Number(((stats.servedMeals / stats.totalBookings) * 100).toFixed(1))
      : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-primary tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500">
          Manage your mess meal preferences and view your hostel dining statistics.
        </p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft text-center">
          <span className="text-2xl font-extrabold text-primary block">{stats.totalBookings}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase mt-1 block">
            Total Pre-Bookings
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft text-center">
          <span className="text-2xl font-extrabold text-success block">{stats.servedMeals}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase mt-1 block">
            Meals Collected
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft text-center">
          <span className="text-2xl font-extrabold text-danger block">{stats.cancelledMeals}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase mt-1 block">
            Cancellations
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft text-center">
          <span className="text-2xl font-extrabold text-secondary block">{attendanceRate}%</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase mt-1 block">
            Attendance Rate
          </span>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
              <input
                type="text"
                disabled
                value={user?.rollNumber || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-primary cursor-not-allowed uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hostel Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-secondary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-secondary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-secondary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Default Meal Preference
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-success/40">
                <input
                  type="radio"
                  name="mealPref"
                  checked={formData.mealPreference === 'veg'}
                  onChange={() => setFormData({ ...formData, mealPreference: 'veg' })}
                  className="text-success focus:ring-success"
                />
                <span className="text-success">Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-danger/40">
                <input
                  type="radio"
                  name="mealPref"
                  checked={formData.mealPreference === 'non-veg'}
                  onChange={() => setFormData({ ...formData, mealPreference: 'non-veg' })}
                  className="text-danger focus:ring-danger"
                />
                <span className="text-danger">Non-Vegetarian</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;

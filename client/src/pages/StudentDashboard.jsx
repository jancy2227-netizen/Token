import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CountdownTimer from '../components/CountdownTimer';
import DigitalTokenCard from '../components/DigitalTokenCard';
import MealSelector from '../components/MealSelector';
import confetti from 'canvas-confetti';
import {
  CalendarCheck,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, currentSession, refreshSession } = useAuth();
  const { showToast } = useToast();

  const [activeBooking, setActiveBooking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(user?.mealPreference || 'veg');
  const [historyFilter, setHistoryFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my');
      if (res.data?.success) {
        setActiveBooking(res.data.activeBooking || null);
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.warn('Failed to load student bookings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    refreshSession();
  }, [fetchBookings, refreshSession]);

  const handleBookMeal = async () => {
    if (!selectedMeal) {
      showToast('Please select either Veg or Non-Veg', 'warning');
      return;
    }

    try {
      setBookingLoading(true);
      const res = await api.post('/bookings', {
        mealType: selectedMeal,
        sessionId: currentSession?.session?._id
      });

      if (res.data?.success) {
        showToast(res.data.message, 'success');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        await fetchBookings();
        await refreshSession();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleChangeMeal = async () => {
    if (!activeBooking) return;
    const newMeal = activeBooking.mealType === 'veg' ? 'non-veg' : 'veg';

    try {
      setBookingLoading(true);
      const res = await api.put(`/bookings/${activeBooking._id}`, { mealType: newMeal });
      if (res.data?.success) {
        showToast(res.data.message, 'success');
        await fetchBookings();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    if (!window.confirm('Are you sure you want to cancel your Sunday meal booking?')) return;

    try {
      setBookingLoading(true);
      const res = await api.delete(`/bookings/${activeBooking._id}`);
      if (res.data?.success) {
        showToast(res.data.message, 'info');
        await fetchBookings();
        await refreshSession();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const isBookingAllowed = currentSession?.isBookingAllowed;
  const isDeadlinePassed = !isBookingAllowed;

  const filteredHistory = history.filter((b) => {
    if (historyFilter === 'veg') return b.mealType === 'veg';
    if (historyFilter === 'non-veg') return b.mealType === 'non-veg';
    if (historyFilter === 'served') return b.served === true;
    if (historyFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xl">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Hello, {user?.name || 'Student'}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Roll No: <span className="font-bold text-primary">{user?.rollNumber}</span> • Room:{' '}
              <span className="font-semibold text-slate-700">{user?.roomNumber}</span> •{' '}
              {user?.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right sm:text-right">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Mess Diet Preference
            </span>
            <span
              className={`text-xs font-bold uppercase ${
                user?.mealPreference === 'veg' ? 'text-success' : 'text-danger'
              }`}
            >
              Default: {user?.mealPreference}
            </span>
          </div>
        </div>
      </div>

      {/* Saturday Booking Window Countdown */}
      {currentSession?.session && (
        <CountdownTimer session={currentSession.session} onExpire={fetchBookings} />
      )}

      {/* Active Booking or Booking Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-800">
              {activeBooking ? 'Your Active Sunday Mess Pass' : 'Pre-Book Upcoming Sunday Meal'}
            </h2>
          </div>
          {activeBooking && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                activeBooking.served || activeBooking.status === 'used'
                  ? 'text-success-dark bg-success/15 border-success/30'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}
            >
              {activeBooking.served || activeBooking.status === 'used'
                ? 'Meal Served'
                : 'Booking Confirmed'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-sm border border-slate-200 shadow-soft">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading your meal pass...
          </div>
        ) : activeBooking ? (
          /* Digital Token Ticket */
          <DigitalTokenCard
            booking={activeBooking}
            student={user}
            session={activeBooking.sessionId || currentSession?.session}
            onCancel={handleCancelBooking}
            onChangeMeal={handleChangeMeal}
            isDeadlinePassed={isDeadlinePassed}
          />
        ) : (
          /* Meal Booking Form */
          <div>
            {!isBookingAllowed ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-soft space-y-3">
                <AlertCircle className="w-10 h-10 text-danger mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Saturday Booking Window is Closed</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  The advance booking cutoff for this Sunday has passed. Bookings open every Saturday at
                  6:00 PM and close at 9:00 PM to help kitchen staff prepare exact meal quantities without
                  food wastage.
                </p>
                {currentSession?.session?.isTestOverride && (
                  <p className="text-xs font-semibold text-accent mt-2">
                    Tip: Admin can toggle "Open Now (Demo Mode)" from the admin console.
                  </p>
                )}
              </div>
            ) : (
              <MealSelector
                selectedMeal={selectedMeal}
                onSelectMeal={setSelectedMeal}
                menuDetails={currentSession?.session?.menuDetails}
                onConfirm={handleBookMeal}
                loading={bookingLoading}
                disabled={!isBookingAllowed}
              />
            )}
          </div>
        )}
      </div>

      {/* Booking History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-secondary" />
            <h3 className="text-base font-bold text-slate-800">Your Booking History</h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {['all', 'veg', 'non-veg', 'served', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1 rounded-full font-semibold capitalize transition ${
                  historyFilter === f
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-3 px-2">Sunday Session</th>
                <th className="py-3 px-2">Meal Type</th>
                <th className="py-3 px-2">Token Number</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Served Status</th>
                <th className="py-3 px-2">Booking Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No booking records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-2 font-bold text-slate-800">
                      {b.sessionId?.title || 'Sunday Meal'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {b.sessionId?.sundayDate
                          ? new Date(b.sessionId.sundayDate).toLocaleDateString()
                          : 'Sunday'}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          b.mealType === 'veg'
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {b.mealType}
                      </span>
                    </td>

                    <td className="py-3 px-2 font-mono font-bold text-primary">{b.tokenNumber}</td>

                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          b.status === 'confirmed' || b.status === 'used'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      {b.served ? (
                        <span className="inline-flex items-center gap-1 text-success font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Served
                        </span>
                      ) : b.status === 'cancelled' ? (
                        <span className="text-slate-400 italic text-[11px]">Cancelled</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-slate-500">
                      {new Date(b.bookedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

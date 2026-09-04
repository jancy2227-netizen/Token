import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ScanLine,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Utensils,
  DoorClosed,
  Clock
} from 'lucide-react';

const TokenScannerModal = ({ onClose, onServedSuccess }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [serveLoading, setServeLoading] = useState(false);
  const { showToast } = useToast();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const token = tokenInput.trim().toUpperCase();
    if (!token) {
      showToast('Please enter a digital token number', 'warning');
      return;
    }

    try {
      setLoading(true);
      setBooking(null);
      const res = await api.get(`/bookings/token/${token}`);
      if (res.data?.success) {
        setBooking(res.data.booking);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkServed = async () => {
    if (!booking) return;

    try {
      setServeLoading(true);
      const res = await api.put(`/bookings/${booking._id}/serve`);
      if (res.data?.success) {
        showToast(res.data.message, 'success');
        setBooking(res.data.booking);
        if (onServedSuccess) onServedSuccess(res.data.booking);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setServeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Verify Mess Token</h3>
              <p className="text-xs text-slate-500">Scan QR or enter token number at the mess counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Input Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. SM-2026-000145"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-secondary uppercase placeholder:normal-case"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput}
              className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white font-semibold text-sm rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Lookup'}
            </button>
          </form>

          {/* Quick Demo Token Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
            <span className="font-medium text-slate-400">Quick test tokens:</span>
            {['SM-2026-000145', 'SM-2026-000146', 'SM-2026-000149'].map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => {
                  setTokenInput(tok);
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[11px] text-slate-700 transition"
              >
                {tok}
              </button>
            ))}
          </div>

          {/* Result Card */}
          {booking && (
            <div
              className={`p-5 rounded-2xl border-2 transition-all ${
                booking.served
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-emerald-50/50 border-emerald-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    booking.mealType === 'veg'
                      ? 'bg-success text-white'
                      : 'bg-danger text-white'
                  }`}
                >
                  {booking.mealType === 'veg' ? 'VEGETARIAN' : 'NON-VEGETARIAN'}
                </span>

                <span className="font-mono text-xs font-bold text-slate-600">
                  {booking.tokenNumber}
                </span>
              </div>

              {/* Student Information */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Student</span>
                  <p className="font-bold text-slate-900 text-sm">{booking.studentId?.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Roll Number</span>
                  <p className="font-bold text-primary text-sm font-mono">{booking.studentId?.rollNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Room Number</span>
                  <p className="font-semibold text-slate-700">{booking.studentId?.roomNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Department</span>
                  <p className="font-semibold text-slate-700 truncate">{booking.studentId?.department}</p>
                </div>
              </div>

              {/* Status and Action */}
              <div className="mt-5 pt-4 border-t border-slate-200/60">
                {booking.served ? (
                  <div className="flex items-center gap-2.5 text-danger font-semibold text-xs bg-danger/10 p-3 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-danger">MEAL ALREADY SERVED!</p>
                      <p className="text-[11px] text-danger-dark font-normal">
                        Served at:{' '}
                        {new Date(booking.servedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                        . Duplicate meal collection prevented.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleMarkServed}
                    disabled={serveLoading}
                    className="w-full py-3 bg-success hover:bg-success-dark text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {serveLoading ? (
                      <span>Verifying & Serving...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Mark Meal as Served</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenScannerModal;

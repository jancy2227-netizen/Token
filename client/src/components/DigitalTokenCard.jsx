import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Utensils,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  User,
  Hash,
  DoorClosed,
  AlertCircle
} from 'lucide-react';

const DigitalTokenCard = ({
  booking,
  student,
  session,
  onCancel,
  onChangeMeal,
  isDeadlinePassed
}) => {
  const ticketRef = useRef(null);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVeg = booking.mealType === 'veg';
  const isServed = booking.served;

  const sundayDateFormatted = session?.sundayDate
    ? new Date(session.sundayDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Upcoming Sunday';

  return (
    <div className="max-w-md mx-auto my-4 print:my-0">
      {/* Outer Card */}
      <div
        ref={ticketRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-ticket overflow-hidden relative transition-all"
      >
        {/* Top Header Strip */}
        <div
          className={`p-6 text-white ${
            isVeg
              ? 'bg-gradient-to-r from-[#2c6e49] to-[#4c956c]'
              : 'bg-gradient-to-r from-[#9A3324] to-[#c14936]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-white/90" />
              <span className="font-bold text-xs uppercase tracking-widest text-white/90">
                Official Hostel Mess Pass
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                isVeg ? 'bg-white text-[#2c6e49]' : 'bg-white text-[#9A3324]'
              }`}
            >
              {isVeg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-white/80 text-xs font-medium">Sunday Meal Session</p>
            <h2 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
              {session?.title || 'Grand Sunday Feast'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{sundayDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Middle Details Section */}
        <div className="p-6 space-y-4">
          {/* Student details grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Student Name
              </span>
              <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                {student?.name || booking.studentId?.name || 'Student'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Roll Number
              </span>
              <p className="text-sm font-bold text-primary font-mono mt-0.5">
                {student?.rollNumber || booking.studentId?.rollNumber || '22AD---'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Room No
              </span>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {student?.roomNumber || booking.studentId?.roomNumber || 'Room --'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Booked On
              </span>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {new Date(booking.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {new Date(booking.bookedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Ticket Divider with Notches */}
          <div className="relative flex items-center py-2">
            <div className="w-4 h-4 bg-[#F5F7FA] rounded-full -ml-8 border-r border-slate-200"></div>
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2"></div>
            <div className="w-4 h-4 bg-[#F5F7FA] rounded-full -mr-8 border-l border-slate-200"></div>
          </div>

          {/* QR Code and Token Number */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
              <QRCodeSVG
                value={booking.tokenNumber || 'SM-DEMO-TOKEN'}
                size={160}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#1E3A5F"
              />
            </div>

            <div className="text-center mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                DIGITAL MESS TOKEN ID
              </span>
              <span className="font-mono text-xl font-extrabold text-primary tracking-wider mt-0.5 block">
                {booking.tokenNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Show this QR or token code at the mess serving counter
              </p>
            </div>
          </div>

          {/* Status Badge Stamp */}
          <div className="pt-2">
            {isServed ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-success/15 border border-success/30 rounded-2xl text-success">
                <CheckCircle2 className="w-5 h-5" />
                <div className="text-center">
                  <span className="text-xs font-extrabold tracking-wider uppercase block">
                    MEAL SERVED & COLLECTED
                  </span>
                  <span className="text-[11px] text-success-dark">
                    Timestamp:{' '}
                    {booking.servedAt
                      ? new Date(booking.servedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Verified'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  CONFIRMED • READY FOR MESS COLLECTION
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Footer (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save
          </button>

          {!isServed && !isDeadlinePassed && (
            <div className="flex items-center gap-2">
              <button
                onClick={onChangeMeal}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:bg-secondary/10 transition"
              >
                Switch to {isVeg ? 'Non-Veg' : 'Veg'}
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10 transition"
              >
                Cancel Booking
              </button>
            </div>
          )}

          {isDeadlinePassed && !isServed && (
            <span className="text-[11px] text-slate-400 italic">
              Booking changes locked (9:00 PM cutoff passed)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalTokenCard;

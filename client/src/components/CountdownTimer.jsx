import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

const CountdownTimer = ({ session, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    statusText: '',
    progressPercent: 100
  });

  useEffect(() => {
    if (!session) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const openTime = new Date(session.bookingOpen).getTime();
      const closeTime = new Date(session.bookingClose).getTime();

      // If test override is enabled, simulate active booking window with 2 hours remaining
      if (session.isTestOverride) {
        // Calculate artificial countdown to demonstrate real-time clock
        const currentMinute = new Date().getMinutes();
        const currentSecond = new Date().getSeconds();
        const remMinutes = 59 - currentMinute;
        const remSeconds = 59 - currentSecond;

        setTimeLeft({
          hours: 1,
          minutes: remMinutes,
          seconds: remSeconds,
          isExpired: false,
          statusText: 'Saturday Booking Window Open (Demo Mode)',
          progressPercent: Math.round(((60 - remMinutes) / 60) * 100)
        });
        return;
      }

      if (now < openTime) {
        const diff = openTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          isExpired: true,
          statusText: 'Booking Opens Saturday 6:00 PM',
          progressPercent: 0
        });
      } else if (now >= openTime && now <= closeTime) {
        const totalDuration = closeTime - openTime;
        const diff = closeTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const progress = Math.max(0, Math.min(100, Math.round(((totalDuration - diff) / totalDuration) * 100)));

        setTimeLeft({
          hours,
          minutes,
          seconds,
          isExpired: false,
          statusText: 'Booking Window Open (Closes 9:00 PM)',
          progressPercent: progress
        });
      } else {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          statusText: 'Booking Window Closed',
          progressPercent: 100
        });
        if (onExpire) onExpire();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [session, onExpire]);

  const pad = (n) => String(n).padStart(2, '0');

  const isUrgent = !timeLeft.isExpired && timeLeft.hours === 0 && timeLeft.minutes < 30;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status label */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              timeLeft.isExpired
                ? 'bg-danger/10 text-danger'
                : isUrgent
                ? 'bg-warning/10 text-warning animate-bounce'
                : 'bg-success/10 text-success'
            }`}
          >
            {timeLeft.isExpired ? (
              <Lock className="w-5 h-5" />
            ) : isUrgent ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  timeLeft.isExpired
                    ? 'bg-danger/10 text-danger'
                    : isUrgent
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                }`}
              >
                {timeLeft.isExpired ? 'Window Closed' : 'Live Booking'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Saturday 6:00 PM – 9:00 PM Cutoff
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mt-0.5">{timeLeft.statusText}</h3>
          </div>
        </div>

        {/* Digital Counter Display */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary text-white font-mono text-xl font-bold flex items-center justify-center shadow-inner">
              {pad(timeLeft.hours)}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Hours</span>
          </div>

          <span className="text-xl font-bold text-slate-400 -mt-4">:</span>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary text-white font-mono text-xl font-bold flex items-center justify-center shadow-inner">
              {pad(timeLeft.minutes)}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Mins</span>
          </div>

          <span className="text-xl font-bold text-slate-400 -mt-4">:</span>

          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl font-mono text-xl font-bold flex items-center justify-center shadow-inner text-white ${
                isUrgent ? 'bg-danger animate-pulse' : 'bg-secondary'
              }`}
            >
              {pad(timeLeft.seconds)}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Secs</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft.isExpired
                ? 'bg-danger w-full'
                : isUrgent
                ? 'bg-warning'
                : 'bg-gradient-to-r from-secondary to-accent'
            }`}
            style={{ width: `${timeLeft.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>Opens Sat 6:00 PM</span>
          <span>Deadline Sat 9:00 PM (Strict)</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

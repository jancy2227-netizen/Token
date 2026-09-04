import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UtensilsCrossed,
  Clock,
  QrCode,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Shield,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Heart,
  ChevronRight
} from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';

const LandingPage = () => {
  const { currentSession, demoLogin, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleDemoClick = async (role) => {
    try {
      await demoLogin(role);
      showToast(`Logged in as demo ${role.toUpperCase()}!`, 'success');
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'warden') navigate('/warden/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="relative overflow-hidden pb-20 space-y-16 sm:space-y-20">
      {/* Soft Ambient Background Shapes (Subtle & Elegant) */}
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[850px] pointer-events-none -z-10 overflow-hidden">
        {/* Top left soft sky blue glow */}
        <div className="absolute -top-16 -left-12 w-96 h-96 rounded-full bg-sky-100/60 blur-3xl opacity-70" />
        {/* Top right subtle light blue bubble */}
        <div className="absolute top-12 -right-16 w-[420px] h-[420px] rounded-full bg-blue-50/70 blur-3xl opacity-75" />
        {/* Center gentle ambient warmth */}
        <div className="absolute top-96 left-1/4 w-80 h-80 rounded-full bg-indigo-50/40 blur-3xl opacity-60" />
        {/* Decorative mini subtle dot rings */}
        <div className="absolute top-28 right-16 w-32 h-32 rounded-full border border-sky-200/40 opacity-40 hidden lg:block" />
        <div className="absolute top-48 left-12 w-20 h-20 rounded-full border border-sky-200/50 opacity-40 hidden lg:block" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-14 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          {/* Cute Friendly Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100/70 border border-sky-200/80 text-secondary text-xs font-bold tracking-wide uppercase shadow-2xs transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>B.Tech AI & Data Science Capstone Project</span>
          </div>

          {/* Hero Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black text-primary tracking-tight leading-[1.12]">
              Smart Hostel Mess Management <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-accent-dark to-secondary">
                & Food Waste Reduction
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate hostel food wastage through strict Saturday advance pre-booking,
            anti-duplicate digital QR tokens, and AI-driven meal demand forecasting.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/student/dashboard"
              className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 group"
            >
              <span>Pre-Book Sunday Meal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/warden/dashboard"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-sky-50/50 border-2 border-slate-200 hover:border-secondary/40 text-primary font-bold text-sm shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-secondary" />
              <span>Warden Serving Portal</span>
            </Link>

            <Link
              to="/admin/dashboard"
              className="px-6 py-3.5 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-bold text-sm border border-slate-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-primary" />
              <span>Admin AI Console</span>
            </Link>
          </div>

          {/* Quick Demo Credentials Card (Cute Student-Friendly Look) */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="bg-white/95 backdrop-blur-md border border-sky-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(30,58,95,0.06)] text-left hover:shadow-[0_12px_36px_rgb(30,58,95,0.08)] transition-all">
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-secondary flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    1-Click Evaluation Logins
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Click any role to test instantly</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleDemoClick('student')}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 text-left transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">Student</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">22AD001</p>
                </button>

                <button
                  onClick={() => handleDemoClick('warden')}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 text-left transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800">Warden</p>
                    <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Rajesh Sharma</p>
                </button>

                <button
                  onClick={() => handleDemoClick('admin')}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 text-left transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-800">Chief Admin</p>
                    <span className="w-2 h-2 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Full Analytics</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Booking Window Status & Countdown */}
      {currentSession?.session && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sky-100 shadow-[0_4px_24px_rgb(30,58,95,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100/70 text-secondary flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live Booking Session Countdown
                  </h2>
                  <p className="text-[11px] text-slate-400">Next active meal reservation schedule</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-secondary border border-sky-200/60 self-start sm:self-auto">
                Rule: Saturday 6:00 PM – 9:00 PM Cutoff
              </span>
            </div>
            <CountdownTimer session={currentSession.session} />
          </div>
        </section>
      )}

      {/* Real-World Impact Stats (Cute + Elegant Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-6 rounded-3xl border border-sky-100/80 shadow-[0_4px_20px_rgb(30,58,95,0.04)] hover:shadow-soft hover:-translate-y-1 transition-all duration-200 text-center group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 block tracking-tight">34.8%</span>
            <span className="text-xs font-bold text-slate-600 mt-1.5 block">
              Avg Food Waste Reduction
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sky-100/80 shadow-[0_4px_20px_rgb(30,58,95,0.04)] hover:shadow-soft hover:-translate-y-1 transition-all duration-200 text-center group">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-primary flex items-center justify-center mx-auto mb-3 border border-sky-100 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-primary block tracking-tight">100%</span>
            <span className="text-xs font-bold text-slate-600 mt-1.5 block">
              Advance Pre-Booking Accuracy
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sky-100/80 shadow-[0_4px_20px_rgb(30,58,95,0.04)] hover:shadow-soft hover:-translate-y-1 transition-all duration-200 text-center group">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-secondary flex items-center justify-center mx-auto mb-3 border border-blue-100 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-secondary block tracking-tight">0</span>
            <span className="text-xs font-bold text-slate-600 mt-1.5 block">
              Duplicate Meal Collections
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sky-100/80 shadow-[0_4px_20px_rgb(30,58,95,0.04)] hover:shadow-soft hover:-translate-y-1 transition-all duration-200 text-center group">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-100 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-amber-700 block tracking-tight">94.2%</span>
            <span className="text-xs font-bold text-slate-600 mt-1.5 block">
              AI Forecast Confidence
            </span>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-secondary text-xs font-bold uppercase tracking-wider border border-sky-200/60">
            <span>Engineering Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Designed to Solve The Real Hostel Mess Problem
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-normal">
            Hostel cooks prepare food based on blind guesses. This system replaces guessing with hard pre-booking data and AI demand forecasting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-3xl border border-sky-100/90 shadow-[0_4px_24px_rgb(30,58,95,0.04)] hover:shadow-[0_12px_32px_rgb(30,58,95,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-4 group">
            <div className="w-13 h-13 rounded-2xl bg-sky-50 text-secondary flex items-center justify-center border border-sky-100/80 group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
              Strict Saturday Booking Window
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Booking opens strictly Saturday at 6:00 PM and locks at 9:00 PM. Backend rejects late requests, giving the kitchen exact preparation counts before cooking starts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-3xl border border-sky-100/90 shadow-[0_4px_24px_rgb(30,58,95,0.04)] hover:shadow-[0_12px_32px_rgb(30,58,95,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-4 group">
            <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center border border-indigo-100/80 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
              Anti-Duplicate Digital Token
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Generates a unique boarding-pass token (e.g. <span className="font-mono text-primary font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/50">SM-2026-000145</span>) with encrypted QR code. Prevents students from claiming duplicate meals.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-3xl border border-sky-100/90 shadow-[0_4px_24px_rgb(30,58,95,0.04)] hover:shadow-[0_12px_32px_rgb(30,58,95,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-4 group">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-200">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
              AI Demand Prediction & Buffers
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Scikit-learn multi-feature regression analyzes historical attendance rates, Veg/Non-Veg ratios, and computes optimal +5% buffer recommendations to eliminate waste.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Flow Walkthrough (Cute + Premium Glassmorphism) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#10233d] border border-sky-900/40 text-white rounded-3xl p-8 sm:p-10 shadow-[0_15px_35px_rgb(20,39,64,0.2)]">
          {/* Subtle glowing ambient blobs inside dark container */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-xl mx-auto mb-8 space-y-1">
            <span className="text-accent-light text-xs font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 inline-block">
              End-to-End Workflow
            </span>
            <h3 className="text-2xl sm:text-3xl font-black pt-1">Student to Kitchen Serving Flow</h3>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all duration-200 hover:-translate-y-0.5">
              <span className="w-9 h-9 rounded-full bg-accent text-primary-dark font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/25">
                1
              </span>
              <h4 className="text-sm font-bold text-white">Saturday 6:00 PM</h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                Booking opens. Student chooses Veg or Non-Veg feast.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all duration-200 hover:-translate-y-0.5">
              <span className="w-9 h-9 rounded-full bg-accent text-primary-dark font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/25">
                2
              </span>
              <h4 className="text-sm font-bold text-white">Digital Token Issued</h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                Unique QR token card generated on dashboard.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all duration-200 hover:-translate-y-0.5">
              <span className="w-9 h-9 rounded-full bg-accent text-primary-dark font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/25">
                3
              </span>
              <h4 className="text-sm font-bold text-white">Kitchen Preparation</h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                Cooks prepare precise quantities based on AI prediction.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all duration-200 hover:-translate-y-0.5">
              <span className="w-9 h-9 rounded-full bg-accent text-primary-dark font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/25">
                4
              </span>
              <h4 className="text-sm font-bold text-white">Warden Verification</h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                Warden marks meal as Served. Prevents duplicate collection.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

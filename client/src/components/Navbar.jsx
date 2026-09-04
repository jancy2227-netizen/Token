import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Bell,
  User,
  LogOut,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  CheckCircle,
  Clock,
  Menu,
  X
} from 'lucide-react';
import NotificationModal from './NotificationModal';

const Navbar = () => {
  const { user, logout, currentSession, unreadNotifications } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const isBookingActive = currentSession?.isBookingAllowed;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100/90 shadow-[0_2px_16px_rgb(30,58,95,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 group-hover:shadow-primary/30 transition-all">
              <UtensilsCrossed className="w-5 h-5 text-accent-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-primary tracking-tight leading-none">
                  SmartMess
                </span>
                <span className="bg-sky-100/80 text-secondary text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md tracking-wider border border-sky-200/50">
                  AI SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Hostel Meal & Waste Reduction</p>
            </div>
          </Link>

          {/* Session Status Pill */}
          {currentSession && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50/70 border border-sky-200/60 text-xs shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isBookingActive ? 'bg-emerald-500 animate-pulse' : 'bg-warning'}`}></span>
              <span className="text-slate-600 font-medium">Sunday Meal Session:</span>
              <span className="font-bold text-primary">
                {isBookingActive ? 'Booking Window OPEN' : 'Booking Closed'}
              </span>
              {currentSession.session?.isTestOverride && (
                <span className="bg-accent/20 text-secondary text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  DEMO MODE
                </span>
              )}
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {user?.role === 'student' && (
              <>
                <Link
                  to="/student/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive('/student/dashboard')
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-primary'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Pre-Book Meal
                </Link>
                <Link
                  to="/student/profile"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive('/student/profile')
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-primary'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
              </>
            )}

            {user?.role === 'warden' && (
              <>
                <Link
                  to="/warden/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive('/warden/dashboard')
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-primary'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Mess Counter & Serving
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive('/admin/dashboard')
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-primary'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Admin Console & AI
                </Link>
                <Link
                  to="/warden/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive('/warden/dashboard')
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-primary'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Warden View
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* Notifications Button */}
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 hover:text-primary hover:bg-sky-50 rounded-xl transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {/* User Info & Role Badge */}
                <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <span
                      className={`text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-md inline-block ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'warden'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-primary hover:text-secondary hover:bg-sky-50/60 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-dark shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Student Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-primary rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email} • {user.role}</p>
                </div>
              </div>

              {user.role === 'student' && (
                <>
                  <Link
                    to="/student/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Pre-Book Sunday Meal
                  </Link>
                  <Link
                    to="/student/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    My Student Profile
                  </Link>
                </>
              )}

              {user.role === 'warden' && (
                <Link
                  to="/warden/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
                >
                  Warden Serving Counter
                </Link>
              )}

              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Admin Dashboard & AI
                  </Link>
                  <Link
                    to="/warden/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Warden Serving Counter
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-base font-medium text-danger hover:bg-danger/10 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg border border-slate-300 text-primary font-medium"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg bg-primary text-white font-medium"
              >
                Register Student
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Notifications Slide-over Modal */}
      {notificationsOpen && (
        <NotificationModal onClose={() => setNotificationsOpen(false)} />
      )}
    </header>
  );
};

export default Navbar;

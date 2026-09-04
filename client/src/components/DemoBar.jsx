import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, UserCheck, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoBar = () => {
  const { user, demoLogin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSwitch = async (role) => {
    try {
      await demoLogin(role);
      showToast(`Switched to demo ${role.toUpperCase()} account!`, 'success');
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'warden') navigate('/warden/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="bg-primary-dark text-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-700/50">
      <div className="flex items-center gap-2 mb-1 sm:mb-0">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span className="font-semibold text-white tracking-wide uppercase">Demo Quick Switch:</span>
        <span className="text-slate-300 hidden md:inline">Instantly test the three system roles:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handleSwitch('student')}
          className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
            user?.role === 'student'
              ? 'bg-accent text-primary-dark font-bold shadow-sm'
              : 'bg-primary-light hover:bg-secondary text-slate-100'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          Student (22AD001)
        </button>

        <button
          onClick={() => handleSwitch('warden')}
          className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
            user?.role === 'warden'
              ? 'bg-accent text-primary-dark font-bold shadow-sm'
              : 'bg-primary-light hover:bg-secondary text-slate-100'
          }`}
        >
          <Shield className="w-3 h-3" />
          Warden (Rajesh)
        </button>

        <button
          onClick={() => handleSwitch('admin')}
          className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
            user?.role === 'admin'
              ? 'bg-accent text-primary-dark font-bold shadow-sm'
              : 'bg-primary-light hover:bg-secondary text-slate-100'
          }`}
        >
          <Award className="w-3 h-3" />
          Chief Admin
        </button>

        {user && (
          <button
            onClick={() => {
              logout();
              navigate('/');
              showToast('Logged out successfully', 'info');
            }}
            className="text-slate-400 hover:text-white px-2 py-0.5 ml-1 underline transition"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default DemoBar;

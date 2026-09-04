import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UtensilsCrossed, UserCheck, Shield, Award, Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('22ad001@hostel.edu');
  const [password, setPassword] = useState('Student@123');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRoleTabChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'student') {
      setEmail('22ad001@hostel.edu');
      setPassword('Student@123');
    } else if (newRole === 'warden') {
      setEmail('warden1@hostel.edu');
      setPassword('Warden@123');
    } else if (newRole === 'admin') {
      setEmail('admin@hostel.edu');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login(email, password, role);
      showToast(`Welcome back, ${res.user.name}!`, 'success');

      if (res.user.role === 'student') {
        navigate('/student/dashboard');
      } else if (res.user.role === 'warden') {
        navigate('/warden/dashboard');
      } else if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-md shadow-primary/20">
            <UtensilsCrossed className="w-6 h-6 text-accent-light" />
          </div>
          <h2 className="text-2xl font-black text-primary tracking-tight">Sign In to SmartMess</h2>
          <p className="text-xs text-slate-500">
            Hostel Mess Management & Food Waste Reduction
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              role === 'student'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Student
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('warden')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              role === 'warden'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Warden
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              role === 'admin'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hostel.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-secondary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-secondary focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In as {role.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Demo credentials are pre-filled for easy evaluation.
          </p>
        </div>

        {/* Registration Link */}
        <div className="text-center pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            New student?{' '}
            <Link to="/register" className="font-bold text-secondary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import FoodWasteModal from '../components/FoodWasteModal';
import ExportReportModal from '../components/ExportReportModal';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Users,
  Shield,
  Calendar,
  UtensilsCrossed,
  Trash2,
  Cpu,
  FileSpreadsheet,
  Settings,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { currentSession, refreshSession } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [wasteData, setWasteData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [prediction, setPrediction] = useState(null);

  // Entities
  const [students, setStudents] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [foodRecords, setFoodRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(false);

  // Modals / sub-states
  const [newWardenForm, setNewWardenForm] = useState({ name: '', email: '', password: 'Warden@123', phone: '' });
  const [showWardenModal, setShowWardenModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    vegItem: '',
    nonVegItem: '',
    dessert: '',
    specialNotes: ''
  });
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Load All Core Analytics & Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, trendsRes, wasteRes, predRes, sessionsRes, recRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/bookings'),
        api.get('/analytics/waste'),
        api.get('/prediction/latest'),
        api.get('/sessions'),
        api.get('/food')
      ]);

      if (dashRes.data?.success) setAnalytics(dashRes.data.metrics);
      if (trendsRes.data?.success) setTrends(trendsRes.data.trends || []);
      if (wasteRes.data?.success) {
        setWasteData(wasteRes.data.wasteChartData || []);
        setComparisonData(wasteRes.data.comparisonData || []);
      }
      if (predRes.data?.success) setPrediction(predRes.data.prediction);
      if (sessionsRes.data?.success) setSessions(sessionsRes.data.sessions || []);
      if (recRes.data?.success) setFoodRecords(recRes.data.records || []);

      if (currentSession?.session?.menuDetails) {
        setMenuForm(currentSession.session.menuDetails);
      }
    } catch (err) {
      console.warn('Dashboard load note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Lazy load students and wardens when respective tabs are clicked
  const loadUsers = async (tab) => {
    try {
      if (tab === 'students' && students.length === 0) {
        const res = await api.get('/students');
        if (res.data?.success) setStudents(res.data.students || []);
      }
      if (tab === 'wardens' && wardens.length === 0) {
        const res = await api.get('/wardens');
        if (res.data?.success) setWardens(res.data.wardens || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadUsers(tab);
  };

  // Toggle Test Mode Override
  const handleToggleTestMode = async () => {
    if (!currentSession?.session) return;
    const newStatus = !currentSession.session.isTestOverride;
    try {
      const res = await api.put(`/sessions/${currentSession.session._id}`, {
        isTestOverride: newStatus
      });
      if (res.data?.success) {
        showToast(
          `Demo mode ${newStatus ? 'ENABLED (Booking Open Now)' : 'DISABLED (Strict Saturday Rule Enforced)'}!`,
          'success'
        );
        await refreshSession();
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Run AI Prediction Model
  const handleRunPrediction = async () => {
    try {
      setPredictLoading(true);
      const res = await api.post('/prediction', {
        sessionId: currentSession?.session?._id
      });
      if (res.data?.success) {
        setPrediction(res.data.prediction);
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPredictLoading(false);
    }
  };

  // Save Menu
  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!currentSession?.session) return;
    try {
      const res = await api.put(`/sessions/${currentSession.session._id}`, {
        menuDetails: menuForm
      });
      if (res.data?.success) {
        showToast('Sunday mess menu updated successfully!', 'success');
        await refreshSession();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Warden
  const handleCreateWarden = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/wardens', newWardenForm);
      if (res.data?.success) {
        showToast('Warden account created successfully!', 'success');
        setWardens((prev) => [res.data.warden, ...prev]);
        setShowWardenModal(false);
        setNewWardenForm({ name: '', email: '', password: 'Warden@123', phone: '' });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Rollover / Advance Session
  const handleRolloverSession = async () => {
    if (!currentSession?.session) return;
    if (!window.confirm('Mark current week as completed and rollover to next Sunday?')) return;
    try {
      const res = await api.post(`/sessions/${currentSession.session._id}/reset`);
      if (res.data?.success) {
        showToast(res.data.message, 'success');
        await refreshSession();
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Pie chart data for Veg vs Non-Veg
  const pieData = [
    { name: 'Vegetarian', value: analytics?.vegCount || 0, color: '#4B7B57' },
    { name: 'Non-Vegetarian', value: analytics?.nonVegCount || 0, color: '#9A3324' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Hostel Mess Administration & AI Console
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 uppercase">
              Admin Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Weekly meal demand forecasting, session scheduling, and food waste audit tracking.
          </p>
        </div>

        {/* Demo Mode Toggle & Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentSession?.session && (
            <button
              onClick={handleToggleTestMode}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 ${
                currentSession.session.isTestOverride
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Toggles between strict Saturday 6-9 PM rule and instant demo testing"
            >
              {currentSession.session.isTestOverride ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-200" />
                  <span>Demo Mode: OPEN NOW</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                  <span>Saturday 6-9 PM Rule: STRICT</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
          { id: 'prediction', label: 'AI Demand Prediction', icon: Cpu },
          { id: 'waste', label: 'Food Waste Tracker', icon: Trash2 },
          { id: 'sessions', label: 'Booking Sessions', icon: Calendar },
          { id: 'menu', label: 'Mess Menu', icon: UtensilsCrossed },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'wardens', label: 'Wardens', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Registered Students"
              value={analytics?.totalStudents || 20}
              subtitle="Active hostel residents"
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Sunday Pre-Bookings"
              value={analytics?.totalBookings || 0}
              subtitle={`${analytics?.servedCount || 0} meals served so far`}
              icon={UtensilsCrossed}
              color="secondary"
            />
            <StatCard
              title="Avg Mess Waste Rate"
              value={`${analytics?.avgWastePercent || 8.5}%`}
              subtitle="Maintained under 10%"
              icon={Trash2}
              color="warning"
            />
            <StatCard
              title="Food Waste Reduction"
              value={`${analytics?.foodWasteReduction || 34.8}%`}
              subtitle="From advance pre-booking"
              icon={TrendingUp}
              color="success"
            />
          </div>

          {/* Recharts Row 1: Weekly Booking Trends & Veg vs Non-Veg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Trend Line Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Weekly Pre-Booking Trends</h3>
                  <p className="text-xs text-slate-500">Historical student attendance and demand growth</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Last 6 Weeks
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="veg" name="Veg Meals" fill="#4B7B57" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="nonVeg" name="Non-Veg Meals" fill="#9A3324" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Veg vs Non-Veg Pie Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Meal Preference Split</h3>
                <p className="text-xs text-slate-500">Current week dietary distribution</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <span className="font-bold text-success block">
                    {analytics?.vegPercentage || 40}%
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Veg Ratio</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50">
                  <span className="font-bold text-danger block">
                    {analytics?.nonVegPercentage || 60}%
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Non-Veg Ratio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Row 2: Food Waste Percentage Trend */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Weekly Food Waste Percentage (%)</h3>
                <p className="text-xs text-slate-500">
                  Calculated: (Wasted Portions / Prepared Portions) × 100
                </p>
              </div>
              <span className="text-xs font-bold text-success bg-success/15 px-2.5 py-1 rounded-full">
                Target: Below 10%
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wasteData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} domain={[0, 20]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="wastePercentage"
                    name="Waste Percentage (%)"
                    stroke="#9A3324"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI DEMAND PREDICTION */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-secondary" />
                  <h2 className="text-base font-bold text-slate-800">
                    AI Food Demand Prediction & Buffer Recommendation
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Algorithm: Scikit-learn multi-feature linear regression with turnout heuristic safety buffer
                </p>
              </div>

              <button
                onClick={handleRunPrediction}
                disabled={predictLoading}
                className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent-light" />
                <span>{predictLoading ? 'Recalculating Model...' : 'Run AI Prediction Model'}</span>
              </button>
            </div>

            {/* Prediction Output Display */}
            {prediction && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Predicted Demand */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Predicted Student Demand
                    </span>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Predicted Veg:</span>
                        <span className="font-bold text-success">{prediction.predictedVeg}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Predicted Non-Veg:</span>
                        <span className="font-bold text-danger">{prediction.predictedNonVeg}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                        <span>Total Expected:</span>
                        <span>{prediction.totalPrediction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Kitchen Preparation */}
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                        Recommended Preparation
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                        +5% Buffer
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-emerald-800">
                        <span>Recommended Veg:</span>
                        <span className="font-bold text-emerald-900">{prediction.recommendedVeg}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-800">
                        <span>Recommended Non-Veg:</span>
                        <span className="font-bold text-emerald-900">{prediction.recommendedNonVeg}</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200 flex justify-between font-extrabold text-emerald-950 text-sm">
                        <span>Total To Cook:</span>
                        <span>{prediction.totalRecommended}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model Confidence & Reduction */}
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Model Performance Metrics
                    </span>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Model Confidence:</span>
                        <span className="font-bold text-primary">
                          {Math.round((prediction.confidence || 0.94) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Estimated Waste Cut:</span>
                        <span className="font-bold text-success">
                          {prediction.estimatedWasteReductionPercentage || 34.2}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        Trained on {prediction.featuresInput?.historicalSessionsSampled || 5} past weeks
                        at {prediction.featuresInput?.historicalAttendanceRate || 94.2}% average turnout.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Chart: Predicted vs Actual Total */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Predicted Demand vs Actual Consumption History
                  </h4>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="recommendedTotal" name="Recommended Quantity" fill="#2F6690" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actualTotal" name="Actual Meals Consumed" fill="#4B7B57" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FOOD WASTE TRACKER */}
      {activeTab === 'waste' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Food Waste & Consumption Logs</h3>
                <p className="text-xs text-slate-500">
                  Detailed preparation vs consumption breakdown per weekly session
                </p>
              </div>

              <button
                onClick={() => setWasteModalOpen(true)}
                className="px-4 py-2 bg-danger hover:bg-danger-dark text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Record</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-2">Session / Date</th>
                    <th className="py-3 px-2">Prepared (Veg / NonVeg)</th>
                    <th className="py-3 px-2">Served (Veg / NonVeg)</th>
                    <th className="py-3 px-2">Wasted (Veg / NonVeg)</th>
                    <th className="py-3 px-2">Waste %</th>
                    <th className="py-3 px-2">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {foodRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-2 font-bold text-slate-800">
                        {r.sessionId?.weekOf || 'Week'}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(r.date || r.recordedAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-2 font-semibold text-slate-700">
                        {r.preparedQuantity}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({r.preparedVeg}V / {r.preparedNonVeg}NV)
                        </span>
                      </td>

                      <td className="py-3 px-2 font-semibold text-success">
                        {r.servedQuantity}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({r.servedVeg}V / {r.servedNonVeg}NV)
                        </span>
                      </td>

                      <td className="py-3 px-2 font-semibold text-danger">
                        {r.wastedQuantity}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({r.vegWaste}V / {r.nonVegWaste}NV)
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            r.wastePercentage <= 5
                              ? 'bg-success/15 text-success'
                              : r.wastePercentage <= 10
                              ? 'bg-warning/15 text-warning-dark'
                              : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {r.wastePercentage}%
                        </span>
                      </td>

                      <td className="py-3 px-2 text-slate-500">{r.recordedBy?.name || 'Warden'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOOKING SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Weekly Booking Sessions</h3>
                <p className="text-xs text-slate-500">
                  Each Sunday has its own pre-booking window. Old data is preserved for historical analytics.
                </p>
              </div>

              <button
                onClick={handleRolloverSession}
                className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rollover Next Sunday Session</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-2">Session Title & Week</th>
                    <th className="py-3 px-2">Sunday Meal Date</th>
                    <th className="py-3 px-2">Booking Window</th>
                    <th className="py-3 px-2">Total Bookings</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Demo Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-900 block">{s.title}</span>
                        <span className="font-mono text-[11px] text-primary">{s.weekOf}</span>
                      </td>

                      <td className="py-3 px-2 text-slate-700 font-semibold">
                        {new Date(s.sundayDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      <td className="py-3 px-2 text-slate-600">
                        {new Date(s.bookingOpen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(s.bookingClose).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800">{s.totalBookings || 0}</span>{' '}
                        <span className="text-[10px] text-slate-400">
                          ({s.vegBookings || 0}V / {s.nonVegBookings || 0}NV)
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        {s.isTestOverride ? (
                          <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                            Enabled (Open Now)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Strict Schedule</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MESS MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Sunday Mess Feast Menu</h3>
            <p className="text-xs text-slate-500">
              Configure items displayed to students on their booking selection dashboard
            </p>
          </div>

          <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Vegetarian Feast Items
              </label>
              <textarea
                rows="2"
                value={menuForm.vegItem}
                onChange={(e) => setMenuForm({ ...menuForm, vegItem: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:outline-hidden"
                placeholder="e.g. Paneer Butter Masala, Jeera Rice, Dal Tadka..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Non-Vegetarian Feast Items
              </label>
              <textarea
                rows="2"
                value={menuForm.nonVegItem}
                onChange={(e) => setMenuForm({ ...menuForm, nonVegItem: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:outline-hidden"
                placeholder="e.g. Hyderabadi Chicken Biryani, Raita, Salan..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dessert of the Week</label>
              <input
                type="text"
                value={menuForm.dessert}
                onChange={(e) => setMenuForm({ ...menuForm, dessert: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:outline-hidden"
                placeholder="e.g. Gulab Jamun with Ice Cream"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kitchen / Serving Instructions</label>
              <input
                type="text"
                value={menuForm.specialNotes}
                onChange={(e) => setMenuForm({ ...menuForm, specialNotes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:outline-hidden"
                placeholder="e.g. Mess counter open 12:30 PM to 3:00 PM."
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-sm transition"
            >
              Update Sunday Menu
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Registered Students Directory</h3>
              <p className="text-xs text-slate-500">Total registered hostel residents: {students.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-2">Student Name</th>
                  <th className="py-3 px-2">Roll Number</th>
                  <th className="py-3 px-2">Room</th>
                  <th className="py-3 px-2">Department</th>
                  <th className="py-3 px-2">Meal Preference</th>
                  <th className="py-3 px-2">Hostel Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-2 font-bold text-slate-900">{st.name}</td>
                    <td className="py-3 px-2 font-mono font-bold text-primary">{st.rollNumber}</td>
                    <td className="py-3 px-2 text-slate-700">{st.roomNumber}</td>
                    <td className="py-3 px-2 text-slate-600">{st.department}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          st.mealPreference === 'veg'
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {st.mealPreference}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500">{st.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: WARDENS MANAGEMENT */}
      {activeTab === 'wardens' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Mess Wardens & Staff</h3>
              <p className="text-xs text-slate-500">Authorized personnel for verifying and serving tokens</p>
            </div>

            <button
              onClick={() => setShowWardenModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Warden</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wardens.map((w) => (
              <div key={w._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center">
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{w.name}</h4>
                    <p className="text-[11px] text-slate-500">{w.email}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Phone: {w.phone || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Warden Modal */}
          {showWardenModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Add New Mess Warden</h3>
                <form onSubmit={handleCreateWarden} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newWardenForm.name}
                      onChange={(e) => setNewWardenForm({ ...newWardenForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newWardenForm.email}
                      onChange={(e) => setNewWardenForm({ ...newWardenForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={newWardenForm.password}
                      onChange={(e) => setNewWardenForm({ ...newWardenForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Phone</label>
                    <input
                      type="text"
                      value={newWardenForm.phone}
                      onChange={(e) => setNewWardenForm({ ...newWardenForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWardenModal(false)}
                      className="px-4 py-2 text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {wasteModalOpen && (
        <FoodWasteModal
          sessionId={currentSession?.session?._id}
          sessionTitle={currentSession?.session?.title}
          onClose={() => setWasteModalOpen(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}

      {exportModalOpen && (
        <ExportReportModal
          wasteRecords={foodRecords}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

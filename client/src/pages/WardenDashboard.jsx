import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import TokenScannerModal from '../components/TokenScannerModal';
import FoodWasteModal from '../components/FoodWasteModal';
import ExportReportModal from '../components/ExportReportModal';
import {
  LayoutDashboard,
  QrCode,
  ClipboardList,
  Utensils,
  FileSpreadsheet,
  User,
  LogOut,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCheck,
  RefreshCw,
  Download,
  Trash2,
  ScanLine,
  Leaf,
  Drumstick,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Calendar,
  Building2,
  Hash,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WardenDashboard = () => {
  const { user, logout, currentSession, refreshSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Sidebar navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Bookings and statistics
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBooked: 0,
    pendingCount: 0,
    verifiedCount: 0,
    usedCount: 0,
    cancelledCount: 0,
    servedCount: 0,
    vegCount: 0,
    nonVegCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Token Verification Workstation state
  const [tokenInput, setTokenInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [searchedToken, setSearchedToken] = useState('');

  // Confirmation Modal state for Marking Token as Used
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookingToServe, setBookingToServe] = useState(null);
  const [servingLoading, setServingLoading] = useState(false);

  // Table Filters, Search, Sorting, and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mealFilter, setMealFilter] = useState('all');
  const [sortField, setSortField] = useState('bookedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // External Modals
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Fetch all bookings & stats from backend
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (currentSession?.session?._id) params.sessionId = currentSession.session._id;
      if (search) params.search = search;
      if (mealFilter !== 'all') params.mealType = mealFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/bookings', { params });
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to load bookings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSession, search, mealFilter, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Token Verification lookup
  const handleVerifyToken = async (overrideToken = null) => {
    const rawToken = (overrideToken || tokenInput).trim();
    if (!rawToken) {
      showToast('Please enter a token number to verify.', 'warning');
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyError(null);
      setVerifiedBooking(null);
      setSearchedToken(rawToken);

      const res = await api.get(`/bookings/token/${encodeURIComponent(rawToken)}`);
      if (res.data?.success && res.data.booking) {
        setVerifiedBooking(res.data.booking);
      } else {
        setVerifyError({
          type: 'INVALID',
          message: `No valid booking found for token: ${rawToken}`
        });
      }
    } catch (err) {
      setVerifyError({
        type: 'INVALID',
        message: err.message || `No valid booking found for token: ${rawToken}`
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Determine Token Status
  const getTokenStatus = (booking) => {
    if (!booking) return null;

    if (booking.status === 'cancelled') {
      return {
        key: 'CANCELLED',
        badge: 'CANCELLED',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        cardClass: 'bg-rose-50/70 border-rose-300',
        title: '✕ Booking Cancelled',
        description: 'This booking was cancelled. Meal cannot be served.',
        canServe: false
      };
    }

    if (booking.served || booking.status === 'used') {
      return {
        key: 'USED',
        badge: 'USED',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        cardClass: 'bg-amber-50/80 border-amber-300',
        title: '! Token Already Used',
        description: 'This token has already been used.',
        canServe: false
      };
    }

    // Check if session is expired
    if (booking.sessionId) {
      const isPast =
        booking.sessionId.status === 'completed' ||
        (booking.sessionId.sundayDate &&
          new Date(booking.sessionId.sundayDate).getTime() <
            Date.now() - 48 * 60 * 60 * 1000);
      if (isPast && !booking.sessionId.isTestOverride) {
        return {
          key: 'EXPIRED',
          badge: 'EXPIRED',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          cardClass: 'bg-slate-50 border-slate-300',
          title: '! Token Expired',
          description: 'This meal booking session has expired.',
          canServe: false
        };
      }
    }

    return {
      key: 'VALID',
      badge: 'VALID',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cardClass: 'bg-emerald-50/70 border-emerald-400',
      title: '✓ Valid Token',
      description: 'Meal can be served.',
      canServe: true
    };
  };

  // Open confirmation modal for serving meal
  const openConfirmServe = (booking) => {
    setBookingToServe(booking);
    setConfirmModalOpen(true);
  };

  // Confirm and Mark as Used
  const handleConfirmMarkUsed = async () => {
    if (!bookingToServe?._id) return;

    try {
      setServingLoading(true);
      const res = await api.put(`/bookings/${bookingToServe._id}/serve`);
      if (res.data?.success) {
        showToast('Token verified successfully. Meal marked as served.', 'success');

        // Update local verified card if currently displayed
        if (verifiedBooking && verifiedBooking._id === bookingToServe._id) {
          setVerifiedBooking({
            ...verifiedBooking,
            served: true,
            status: 'used',
            servedAt: new Date().toISOString(),
            servedBy: { name: user?.name || 'Mess Warden' }
          });
        }

        setConfirmModalOpen(false);
        setBookingToServe(null);
        await fetchBookings();
        if (refreshSession) await refreshSession();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setServingLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast('Warden logged out safely.', 'info');
  };

  // Table Sorting and Filtering
  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    // Client-side search enhancement
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((b) => {
        const student = b.studentId || {};
        return (
          b.tokenNumber?.toLowerCase().includes(q) ||
          student.name?.toLowerCase().includes(q) ||
          student.rollNumber?.toLowerCase().includes(q) ||
          student.roomNumber?.toLowerCase().includes(q)
        );
      });
    }

    // Client-side meal filter
    if (mealFilter !== 'all') {
      result = result.filter((b) => b.mealType === mealFilter);
    }

    // Client-side status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'used' || statusFilter === 'served') {
        result = result.filter((b) => b.served || b.status === 'used');
      } else if (statusFilter === 'pending') {
        result = result.filter((b) => !b.served && b.status === 'confirmed');
      } else if (statusFilter === 'cancelled') {
        result = result.filter((b) => b.status === 'cancelled');
      } else if (statusFilter === 'booked') {
        result = result.filter((b) => b.status === 'confirmed');
      }
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'studentName') {
        valA = a.studentId?.name || '';
        valB = b.studentId?.name || '';
      } else if (sortField === 'roomNumber') {
        valA = a.studentId?.roomNumber || '';
        valB = b.studentId?.roomNumber || '';
      } else if (sortField === 'bookedAt') {
        valA = new Date(a.bookedAt).getTime();
        valB = new Date(b.bookedAt).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bookings, search, mealFilter, statusFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBookings.slice(start, start + itemsPerPage);
  }, [filteredAndSortedBookings, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sidebar Items Definition
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verification', label: 'Token Verification', icon: QrCode },
    { id: 'bookings', label: "Today's Bookings", icon: ClipboardList },
    { id: 'meal-summary', label: 'Meal Summary', icon: Utensils },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Helper badge component for table rows
  const renderStatusBadge = (b) => {
    if (b.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" />
          CANCELLED
        </span>
      );
    }
    if (b.served || b.status === 'used') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCheck className="w-3 h-3" />
          USED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        BOOKED
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-primary-dark text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Warden Command Center</h1>
            <p className="text-[11px] text-accent">Hostel Mess Serving Station</p>
          </div>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-200 hover:text-white rounded-lg hover:bg-primary"
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 2. WARDEN SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 z-30 h-screen w-64 bg-primary-dark text-slate-200 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Brand / Warden Profile Card */}
          <div className="p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-black text-base shadow-sm border border-accent/20">
                W
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-sm text-white truncate">
                  {user?.name || 'Mess Warden'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] text-slate-300 font-medium capitalize">
                    {user?.role || 'Warden'} • Counter 1
                  </span>
                </div>
              </div>
            </div>

            {/* Current Active Session Mini Banner */}
            <div className="mt-4 p-2.5 rounded-xl bg-primary/40 border border-slate-700/60 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>Active Session</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  LIVE
                </span>
              </div>
              <p className="font-bold text-slate-200 mt-1 truncate">
                {currentSession?.session?.title || 'Sunday Feast'}
              </p>
              <p className="text-[10px] text-accent mt-0.5">
                {currentSession?.session?.weekOf || 'Current Week'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition text-left ${
                    isActive
                      ? 'bg-secondary text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-primary/50 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-accent-light' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Action: Logout */}
          <div className="p-4 border-t border-slate-800/80">
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                Hostel Mess Warden Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary border border-secondary/20 uppercase tracking-wide">
                Live Service Counter
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify digital tokens, dispense meals in real-time, and monitor attendance metrics.
            </p>
          </div>

          {/* Quick Counter Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setActiveTab('verification');
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-accent" />
              <span>Verify Token</span>
            </button>

            <button
              onClick={() => setScannerModalOpen(true)}
              className="px-3.5 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              title="Open QR Scanner Camera"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            <button
              onClick={() => setWasteModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-rose-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              title="Record Food Waste Audit"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Food Waste</span>
            </button>

            <button
              onClick={fetchBookings}
              className="p-2.5 text-slate-500 hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. DASHBOARD STATISTICS (6 Attractive Summary Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Bookings Today"
            value={stats.totalBooked}
            subtitle="Confirmed meal bookings"
            icon={Utensils}
            color="primary"
          />

          <StatCard
            title="Pending Tokens"
            value={stats.pendingCount}
            subtitle="Awaiting pickup at counter"
            icon={Clock}
            color="warning"
          />

          <StatCard
            title="Verified Tokens"
            value={stats.verifiedCount}
            subtitle="Attended & processed"
            icon={ShieldCheck}
            color="secondary"
          />

          <StatCard
            title="Used Tokens"
            value={stats.usedCount}
            subtitle="Redeemed tokens"
            icon={CheckCircle2}
            color="success"
          />

          <StatCard
            title="Cancelled Tokens"
            value={stats.cancelledCount}
            subtitle="Cancelled by students"
            icon={XCircle}
            color="danger"
          />

          <StatCard
            title="Total Meals Served"
            value={stats.servedCount}
            subtitle="Dispensed at counter"
            icon={CheckCheck}
            color="success"
          />
        </div>

        {/* TAB 1: DASHBOARD (Overview with Integrated Verification + Recent Bookings) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Embedded Token Verification Section on Dashboard */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">
                      Counter Token Verification
                    </h2>
                    <p className="text-xs text-slate-500">
                      Enter student token number below for instantaneous verification
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('verification')}
                  className="text-xs font-bold text-secondary hover:text-secondary-dark flex items-center gap-1 transition"
                >
                  <span>Full Screen Workstation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Token Input & Verify Form */}
              <div className="max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyToken();
                      }}
                      placeholder="Enter Token Number (e.g. SAT-0248 or SM-2026-000145)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-secondary focus:bg-white focus:outline-hidden transition"
                    />
                  </div>

                  <button
                    onClick={() => handleVerifyToken()}
                    disabled={verifyLoading || !tokenInput.trim()}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verifyLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-accent" />
                    )}
                    <span>VERIFY</span>
                  </button>
                </div>

                {/* Quick Test Demo Token Chips */}
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span className="font-semibold text-slate-400 text-[11px]">Demo quick-tokens:</span>
                  {['SM-2026-000145', 'SM-2026-000148', 'SM-2026-000149'].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => {
                        setTokenInput(tok);
                        handleVerifyToken(tok);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md font-mono text-[11px] text-primary font-semibold border border-slate-200 transition"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Result Card if Searched */}
              {(verifiedBooking || verifyError) && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  {verifyError ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-sm">✕ Invalid Token</h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {verifyError.message || 'No valid booking found for this token number.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const tokenStatus = getTokenStatus(verifiedBooking);
                      return (
                        <div
                          className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${tokenStatus.cardClass}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${tokenStatus.badgeClass}`}
                              >
                                {tokenStatus.title}
                              </span>
                              <p className="text-xs font-semibold text-slate-600">
                                {tokenStatus.description}
                              </p>
                            </div>

                            {/* Mark As Used Button */}
                            {tokenStatus.canServe && (
                              <button
                                onClick={() => openConfirmServe(verifiedBooking)}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>MARK AS USED</span>
                              </button>
                            )}
                          </div>

                          {/* Student & Meal Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-slate-200/70">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Student Name
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {verifiedBooking.studentId?.name || 'N/A'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Student ID
                              </span>
                              <span className="font-mono font-bold text-primary text-xs">
                                {verifiedBooking.studentId?.rollNumber || 'N/A'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Room Number
                              </span>
                              <span className="font-bold text-slate-800">
                                {verifiedBooking.studentId?.roomNumber || 'Room --'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Token Number
                              </span>
                              <span className="font-mono font-black text-secondary text-sm">
                                {verifiedBooking.tokenNumber}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Meal Type
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-extrabold text-[11px] uppercase mt-0.5 px-2 py-0.5 rounded-full ${
                                  verifiedBooking.mealType === 'veg'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {verifiedBooking.mealType === 'veg' ? (
                                  <Leaf className="w-3 h-3" />
                                ) : (
                                  <Drumstick className="w-3 h-3" />
                                )}
                                {verifiedBooking.mealType}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Date
                              </span>
                              <span className="font-semibold text-slate-700">
                                {verifiedBooking.sessionId?.sundayDate
                                  ? new Date(verifiedBooking.sessionId.sundayDate).toLocaleDateString()
                                  : new Date(verifiedBooking.bookedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Booking Time
                              </span>
                              <span className="font-semibold text-slate-700">
                                {new Date(verifiedBooking.bookedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Booking Status
                              </span>
                              <div className="mt-0.5">{renderStatusBadge(verifiedBooking)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>

            {/* Today's Bookings Preview Table */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Live Bookings Stream
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing {paginatedBookings.length} of {filteredAndSortedBookings.length} entries for current session
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-primary font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <span>View All Bookings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Compact table view for dashboard */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                      <th className="py-2.5 px-3">Token Number</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3">Meal</th>
                      <th className="py-2.5 px-3">Booking Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading live bookings...
                        </td>
                      </tr>
                    ) : paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">
                          No bookings found for the current session.
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.slice(0, 5).map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-secondary">
                            {b.tokenNumber}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {b.studentId?.name || 'Student'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-primary font-semibold">
                            {b.studentId?.rollNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            {b.studentId?.roomNumber || '--'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                b.mealType === 'veg'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.mealType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(b.bookedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 px-3">{renderStatusBadge(b)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {!b.served && b.status === 'confirmed' ? (
                              <button
                                onClick={() => openConfirmServe(b)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Serve</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {b.served ? 'Served' : 'Closed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 4. TOKEN VERIFICATION (Dedicated Workstation) */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-soft">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-2">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Dedicated Token Verification Workstation
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Verify student credentials, authenticate meal reservations, and record meal
                    dispensing to prevent duplicate collections.
                  </p>
                </div>

                {/* Input + Action */}
                <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter Student Digital Token Number
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyToken();
                        }}
                        placeholder="e.g. SAT-0248 or SM-2026-000145"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-secondary focus:outline-hidden transition"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleVerifyToken()}
                      disabled={verifyLoading || !tokenInput.trim()}
                      className="px-7 py-3 bg-primary hover:bg-primary-light text-white font-bold text-sm rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {verifyLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-accent" />
                      )}
                      <span>VERIFY</span>
                    </button>
                  </div>

                  {/* Demo Tokens shortcut */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-400">Quick Test:</span>
                    {['SM-2026-000145', 'SM-2026-000148', 'SM-2026-000149'].map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => {
                          setTokenInput(tok);
                          handleVerifyToken(tok);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg font-mono text-[11px] text-primary font-bold border border-slate-200 shadow-2xs transition"
                      >
                        {tok}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. TOKEN STATUS CARDS */}
                {verifyError && (
                  <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-rose-600" />
                      <h3 className="font-black text-base">✕ Invalid Token</h3>
                    </div>
                    <p className="text-xs text-rose-800">
                      No valid booking found for "{searchedToken}". Please verify that the student has booked for the current active Sunday session.
                    </p>
                  </div>
                )}

                {verifiedBooking && (
                  (() => {
                    const tokenStatus = getTokenStatus(verifiedBooking);
                    return (
                      <div
                        className={`p-6 rounded-2xl border-2 space-y-6 transition-all ${tokenStatus.cardClass}`}
                      >
                        {/* Status Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${tokenStatus.badgeClass}`}
                              >
                                {tokenStatus.title}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 mt-1">
                              {tokenStatus.description}
                            </p>
                          </div>

                          {/* 6. MARK TOKEN AS USED BUTTON */}
                          {tokenStatus.canServe ? (
                            <button
                              onClick={() => openConfirmServe(verifiedBooking)}
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                            >
                              <CheckCheck className="w-4 h-4" />
                              <span>MARK AS USED</span>
                            </button>
                          ) : (
                            <div className="text-right text-xs text-slate-500">
                              {verifiedBooking.served && verifiedBooking.servedAt && (
                                <p className="font-medium text-amber-900 bg-amber-100/80 px-3 py-1 rounded-lg">
                                  Served at{' '}
                                  {new Date(verifiedBooking.servedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Student Details Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Student Name
                            </span>
                            <span className="font-black text-slate-900 text-sm">
                              {verifiedBooking.studentId?.name || 'Student'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Student ID
                            </span>
                            <span className="font-mono font-bold text-primary text-xs">
                              {verifiedBooking.studentId?.rollNumber || 'N/A'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Room Number
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {verifiedBooking.studentId?.roomNumber || 'Room --'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Token Number
                            </span>
                            <span className="font-mono font-black text-secondary text-sm">
                              {verifiedBooking.tokenNumber}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Date
                            </span>
                            <span className="font-semibold text-slate-700">
                              {verifiedBooking.sessionId?.sundayDate
                                ? new Date(verifiedBooking.sessionId.sundayDate).toLocaleDateString()
                                : new Date(verifiedBooking.bookedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Meal Type
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-black text-[11px] uppercase px-2.5 py-0.5 rounded-full ${
                                verifiedBooking.mealType === 'veg'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {verifiedBooking.mealType === 'veg' ? (
                                <Leaf className="w-3 h-3" />
                              ) : (
                                <Drumstick className="w-3 h-3" />
                              )}
                              {verifiedBooking.mealType}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Booking Time
                            </span>
                            <span className="font-semibold text-slate-700">
                              {new Date(verifiedBooking.bookedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                              Booking Status
                            </span>
                            <div className="mt-0.5">{renderStatusBadge(verifiedBooking)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 7. TODAY'S BOOKINGS (Comprehensive Table with Search, Filters, Sorting, Pagination) */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-soft space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Today's Student Bookings
                </h2>
                <p className="text-xs text-slate-500">
                  Manage, filter, and inspect all student meal allocations for this session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Controls Bar: Search & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by student name, roll number, room, or token..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-secondary focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Meal Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['all', 'veg', 'non-veg'].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMealFilter(m);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition ${
                        mealFilter === m ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'used', label: 'Used' },
                    { id: 'cancelled', label: 'Cancelled' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setStatusFilter(s.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg font-bold text-[10px] transition ${
                        statusFilter === s.id ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={fetchBookings}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-xl border border-slate-200"
                  title="Refresh Table"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Bookings Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-primary transition"
                      onClick={() => handleSort('tokenNumber')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Token Number</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-primary transition"
                      onClick={() => handleSort('studentName')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Student Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Student ID</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-primary transition"
                      onClick={() => handleSort('roomNumber')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Room</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Meal</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-primary transition"
                      onClick={() => handleSort('bookedAt')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Booking Time</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading student bookings...
                      </td>
                    </tr>
                  ) : paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No bookings found matching the current search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-secondary">
                          {b.tokenNumber}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {b.studentId?.name || 'Student'}
                        </td>
                        <td className="py-3 px-3 font-mono text-primary font-semibold">
                          {b.studentId?.rollNumber || '--'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {b.studentId?.roomNumber || 'Room --'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              b.mealType === 'veg'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.mealType === 'veg' ? (
                              <Leaf className="w-3 h-3" />
                            ) : (
                              <Drumstick className="w-3 h-3" />
                            )}
                            {b.mealType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(b.bookedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3">{renderStatusBadge(b)}</td>
                        <td className="py-3 px-3 text-right">
                          {!b.served && b.status === 'confirmed' ? (
                            <button
                              onClick={() => openConfirmServe(b)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Served</span>
                            </button>
                          ) : b.served ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Served{' '}
                              {b.servedAt
                                ? new Date(b.servedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)} of{' '}
                  {filteredAndSortedBookings.length} bookings
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                        currentPage === page
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 8. MEAL SUMMARY */}
        {activeTab === 'meal-summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Meal Preparation & Service Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Breakdown of vegetarian and non-vegetarian fulfillment rates for this session.
                </p>
              </div>

              {/* Progress Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Overall Counter Service Progress</span>
                  <span className="text-secondary font-black">
                    {stats.totalBooked > 0
                      ? Math.round((stats.servedCount / stats.totalBooked) * 100)
                      : 0}
                    % Completed
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-emerald-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${
                        stats.totalBooked > 0
                          ? Math.min(100, Math.round((stats.servedCount / stats.totalBooked) * 100))
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Served: {stats.servedCount} meals</span>
                  <span>Pending: {stats.pendingCount} meals</span>
                  <span>Total: {stats.totalBooked} confirmed</span>
                </div>
              </div>

              {/* Meal Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vegetarian Breakdown */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-950 text-sm">Vegetarian Meals</h4>
                        <p className="text-[11px] text-emerald-700">Standard Veg Prep</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-emerald-900">
                      {stats.vegCount}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800/80 space-y-1 pt-2 border-t border-emerald-200/60">
                    <p>
                      Share of Bookings:{' '}
                      <span className="font-bold">
                        {stats.totalBooked > 0
                          ? Math.round((stats.vegCount / stats.totalBooked) * 100)
                          : 0}
                        %
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      Menu: {currentSession?.session?.menuDetails?.vegItem || 'Paneer Butter Masala, Rice, Dal'}
                    </p>
                  </div>
                </div>

                {/* Non-Vegetarian Breakdown */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                        <Drumstick className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-rose-950 text-sm">Non-Vegetarian Meals</h4>
                        <p className="text-[11px] text-rose-700">Biryani & Chicken Prep</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-rose-900">
                      {stats.nonVegCount}
                    </span>
                  </div>
                  <div className="text-xs text-rose-800/80 space-y-1 pt-2 border-t border-rose-200/60">
                    <p>
                      Share of Bookings:{' '}
                      <span className="font-bold">
                        {stats.totalBooked > 0
                          ? Math.round((stats.nonVegCount / stats.totalBooked) * 100)
                          : 0}
                        %
                      </span>
                    </p>
                    <p className="text-[11px] text-rose-600">
                      Menu: {currentSession?.session?.menuDetails?.nonVegItem || 'Chicken Dum Biryani, Raita, Salan'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sunday Feast Menu Details */}
              {currentSession?.session?.menuDetails && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Active Session Menu Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Dessert
                      </span>
                      <span className="font-bold text-slate-800">
                        {currentSession.session.menuDetails.dessert || 'Chef Special Dessert'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 md:col-span-2">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Special Instructions & Service Hours
                      </span>
                      <span className="font-semibold text-slate-700">
                        {currentSession.session.menuDetails.specialNotes ||
                          'Mess serving window: Sunday 12:30 PM - 3:00 PM.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">Catering & Verification Reports</h2>
              <p className="text-xs text-slate-500">
                Download audit logs, export bookings to CSV, or record leftover kitchen food waste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Export Today's Bookings</h3>
                    <p className="text-xs text-slate-500">Download CSV of all student tokens</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Generate an Excel-ready CSV report containing student names, roll numbers, room
                  numbers, token IDs, meal selections, and serving timestamps.
                </p>
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate CSV Export</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Food Waste Audit</h3>
                    <p className="text-xs text-slate-500">Record post-meal leftover food quantity</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Log remaining meal portions after Sunday lunch counter closes. This data is
                  analyzed by the AI model to continuously optimize future food preparation.
                </p>
                <button
                  onClick={() => setWasteModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:border-rose-300 text-rose-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Log Food Waste Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">Warden Profile & Counter Assignment</h2>
              <p className="text-xs text-slate-500">
                Authorized credentials and active duty station info.
              </p>
            </div>

            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-sm">
                  {user?.name ? user.name[0] : 'W'}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{user?.name || 'Mess Warden'}</h3>
                  <p className="text-xs text-slate-500">{user?.email || 'warden@hostel.edu'}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-secondary/15 text-secondary">
                    Role: {user?.role || 'Warden'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Duty Station
                  </span>
                  <span className="font-bold text-slate-800">Main Mess Serving Counter 1</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Shift Time
                  </span>
                  <span className="font-bold text-slate-800">12:00 PM – 3:30 PM (Sunday)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Hostel Wing
                  </span>
                  <span className="font-bold text-slate-800">Hostel Block A & B</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Verification Auth
                  </span>
                  <span className="font-bold text-emerald-700">Digital QR & Token Read/Write</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRMATION MODAL: 6. MARK TOKEN AS USED */}
      {confirmModalOpen && bookingToServe && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900">Confirm Meal Dispense</h3>
              </div>
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setBookingToServe(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to mark this token as <strong className="text-slate-900">USED</strong> and dispense the meal?
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="font-bold text-slate-900">{bookingToServe.studentId?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roll Number:</span>
                  <span className="font-mono font-bold text-primary">
                    {bookingToServe.studentId?.rollNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Room Number:</span>
                  <span className="font-bold text-slate-800">
                    {bookingToServe.studentId?.roomNumber || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Token Number:</span>
                  <span className="font-mono font-black text-secondary">
                    {bookingToServe.tokenNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Meal Preference:</span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                      bookingToServe.mealType === 'veg'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {bookingToServe.mealType}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  This action marks the token as redeemed in MongoDB and prevents duplicate meals
                  from being issued.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setBookingToServe(null);
                  }}
                  disabled={servingLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkUsed}
                  disabled={servingLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-xs flex items-center gap-1.5"
                >
                  {servingLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span>Confirm & Mark Used</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LOGOUT MODAL */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to log out of the Mess Warden Console?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-black text-xs text-white transition flex-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER MODAL */}
      {scannerModalOpen && (
        <TokenScannerModal
          onClose={() => setScannerModalOpen(false)}
          onServedSuccess={() => {
            fetchBookings();
            if (refreshSession) refreshSession();
          }}
        />
      )}

      {/* FOOD WASTE MODAL */}
      {wasteModalOpen && (
        <FoodWasteModal
          sessionId={currentSession?.session?._id}
          sessionTitle={currentSession?.session?.title}
          onClose={() => setWasteModalOpen(false)}
          onSuccess={() => {
            fetchBookings();
          }}
        />
      )}

      {/* EXPORT REPORT MODAL */}
      {exportModalOpen && (
        <ExportReportModal
          bookings={bookings}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default WardenDashboard;

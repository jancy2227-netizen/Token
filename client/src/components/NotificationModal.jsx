import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, CheckCheck, X, Clock, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotificationModal = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <p className="text-xs text-slate-500">Important mess alerts and token status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-secondary hover:text-primary font-medium flex items-center gap-1 transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">You will receive updates when meals are booked or served.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-3.5 rounded-xl border transition-all ${
                  n.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-accent/10 border-accent/30 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        n.read ? 'bg-slate-300' : 'bg-secondary animate-pulse'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-semibold leading-tight">{n.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="text-slate-400 hover:text-secondary p-1 rounded"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Booking window notifications are sent every Saturday at 6:00 PM.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Trash2, Calculator, X, Save, AlertCircle } from 'lucide-react';

const FoodWasteModal = ({ sessionId, sessionTitle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    preparedVeg: 195,
    preparedNonVeg: 330,
    servedVeg: 188,
    servedNonVeg: 318,
    notes: 'Sunday lunch meal completion record.'
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const prepV = Number(formData.preparedVeg) || 0;
  const prepNV = Number(formData.preparedNonVeg) || 0;
  const srvV = Number(formData.servedVeg) || 0;
  const srvNV = Number(formData.servedNonVeg) || 0;

  const totalPrepared = prepV + prepNV;
  const totalServed = srvV + srvNV;
  const vegWaste = Math.max(0, prepV - srvV);
  const nonVegWaste = Math.max(0, prepNV - srvNV);
  const totalWasted = vegWaste + nonVegWaste;
  const wastePercentage =
    totalPrepared > 0 ? Number(((totalWasted / totalPrepared) * 100).toFixed(2)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      showToast('No active session selected', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/food', {
        sessionId,
        preparedVeg: prepV,
        preparedNonVeg: prepNV,
        servedVeg: srvV,
        servedNonVeg: srvNV,
        notes: formData.notes
      });

      if (res.data?.success) {
        showToast('Food waste record logged successfully!', 'success');
        if (onSuccess) onSuccess(res.data.foodRecord);
        onClose();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/10 rounded-xl text-danger">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Log Food Waste Record</h3>
              <p className="text-xs text-slate-500">
                {sessionTitle || 'Sunday Meal'} • Waste percentage calculator
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prepared Veg Meals
              </label>
              <input
                type="number"
                min="0"
                value={formData.preparedVeg}
                onChange={(e) => setFormData({ ...formData, preparedVeg: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-secondary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prepared Non-Veg Meals
              </label>
              <input
                type="number"
                min="0"
                value={formData.preparedNonVeg}
                onChange={(e) => setFormData({ ...formData, preparedNonVeg: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-secondary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Served Veg Meals
              </label>
              <input
                type="number"
                min="0"
                value={formData.servedVeg}
                onChange={(e) => setFormData({ ...formData, servedVeg: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-secondary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Served Non-Veg Meals
              </label>
              <input
                type="number"
                min="0"
                value={formData.servedNonVeg}
                onChange={(e) => setFormData({ ...formData, servedNonVeg: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-secondary focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Live Calculated Stats Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Prepared Meals:</span>
              <span className="font-bold text-slate-900">{totalPrepared}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Served Meals:</span>
              <span className="font-bold text-success">{totalServed}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Wasted Meals (Veg: {vegWaste}, Non-Veg: {nonVegWaste}):</span>
              <span className="font-bold text-danger">{totalWasted}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800">Calculated Food Waste %:</span>
              <span
                className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
                  wastePercentage <= 5
                    ? 'bg-success/15 text-success'
                    : wastePercentage <= 10
                    ? 'bg-warning/15 text-warning-dark'
                    : 'bg-danger/15 text-danger'
                }`}
              >
                {wastePercentage}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-secondary focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving...' : 'Save Waste Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodWasteModal;

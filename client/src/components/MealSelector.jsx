import React from 'react';
import { Leaf, Drumstick, Check, Sparkles, AlertCircle } from 'lucide-react';

const MealSelector = ({
  selectedMeal,
  onSelectMeal,
  menuDetails,
  onConfirm,
  loading,
  disabled
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Select Your Sunday Meal</h3>
          <p className="text-xs text-slate-500">
            Please choose your preference before the Saturday 9:00 PM cutoff.
          </p>
        </div>
        <span className="bg-accent/10 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Advance Pre-Booking
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vegetarian Option */}
        <div
          onClick={() => !disabled && onSelectMeal('veg')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedMeal === 'veg'
              ? 'border-success bg-success/5 shadow-md ring-1 ring-success'
              : 'border-slate-200 hover:border-success/40 bg-slate-50/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {selectedMeal === 'veg' && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-success/20 text-success-dark">
                100% Vegetarian
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-1">Special Veg Thali</h4>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            {menuDetails?.vegItem || 'Paneer Butter Masala, Dal Makhani, Jeera Rice, Butter Naan'}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Includes Dessert</span>
            <span className="font-semibold text-success">Chef Special Recipe</span>
          </div>
        </div>

        {/* Non-Vegetarian Option */}
        <div
          onClick={() => !disabled && onSelectMeal('non-veg')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedMeal === 'non-veg'
              ? 'border-danger bg-danger/5 shadow-md ring-1 ring-danger'
              : 'border-slate-200 hover:border-danger/40 bg-slate-50/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {selectedMeal === 'non-veg' && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-danger/15 text-danger flex items-center justify-center">
              <Drumstick className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-danger/20 text-danger-dark">
                Non-Vegetarian
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-1">Royal Biryani Feast</h4>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            {menuDetails?.nonVegItem || 'Hyderabadi Chicken Biryani, Mirchi Ka Salan, Onion Raita, Boiled Egg'}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Includes Dessert</span>
            <span className="font-semibold text-danger">Freshly Prepared</span>
          </div>
        </div>
      </div>

      {/* Dessert and Special Notes strip */}
      {(menuDetails?.dessert || menuDetails?.specialNotes) && (
        <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Dessert of the Week: </span>
            <span>{menuDetails?.dessert || 'Gulab Jamun with Ice Cream'}. </span>
            <span className="text-amber-800/80">{menuDetails?.specialNotes}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-secondary" />
          Each student receives a unique digital token & QR code after booking.
        </p>

        <button
          onClick={onConfirm}
          disabled={disabled || loading || !selectedMeal}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
            disabled || !selectedMeal
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-light text-white shadow-primary/20'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Confirming Booking...</span>
            </>
          ) : (
            <>
              <span>Confirm & Generate Digital Token</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MealSelector;

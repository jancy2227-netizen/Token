import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, badge, color = 'primary' }) => {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-success/15 text-success border-success/20',
    warning: 'bg-warning/15 text-warning border-warning/20',
    danger: 'bg-danger/15 text-danger border-danger/20',
    accent: 'bg-accent/20 text-primary border-accent/30',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
            {badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-2 truncate">{subtitle}</p>}
    </div>
  );
};

export default StatCard;

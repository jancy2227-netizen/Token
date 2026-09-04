import React, { useState } from 'react';
import { Download, FileText, Printer, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ExportReportModal = ({ bookings = [], wasteRecords = [], onClose }) => {
  const [reportType, setReportType] = useState('bookings');
  const { showToast } = useToast();

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`, 'success');
  };

  const handleExportCSV = () => {
    if (reportType === 'bookings') {
      if (!bookings || bookings.length === 0) {
        showToast('No booking records to export', 'warning');
        return;
      }
      const headers = [
        'Student Name',
        'Roll Number',
        'Room Number',
        'Department',
        'Meal Type',
        'Token Number',
        'Booking Status',
        'Served Status',
        'Booked At',
        'Served At'
      ];
      const rows = bookings.map((b) => [
        `"${b.studentId?.name || ''}"`,
        `"${b.studentId?.rollNumber || ''}"`,
        `"${b.studentId?.roomNumber || ''}"`,
        `"${b.studentId?.department || ''}"`,
        `"${(b.mealType || '').toUpperCase()}"`,
        `"${b.tokenNumber || ''}"`,
        `"${(b.status || '').toUpperCase()}"`,
        `"${b.served ? 'SERVED' : 'PENDING'}"`,
        `"${b.bookedAt ? new Date(b.bookedAt).toLocaleString() : ''}"`,
        `"${b.servedAt ? new Date(b.servedAt).toLocaleString() : ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadCSV(csvContent, `mess_bookings_report_${new Date().toISOString().split('T')[0]}.csv`);
    } else if (reportType === 'waste') {
      if (!wasteRecords || wasteRecords.length === 0) {
        showToast('No waste records to export', 'warning');
        return;
      }
      const headers = [
        'Session Week',
        'Date',
        'Prepared Veg',
        'Prepared NonVeg',
        'Total Prepared',
        'Served Veg',
        'Served NonVeg',
        'Total Served',
        'Wasted Total',
        'Waste Percentage (%)',
        'Remarks'
      ];
      const rows = wasteRecords.map((w) => [
        `"${w.sessionId?.weekOf || 'N/A'}"`,
        `"${new Date(w.date || w.recordedAt).toLocaleDateString()}"`,
        w.preparedVeg || 0,
        w.preparedNonVeg || 0,
        w.preparedQuantity || 0,
        w.servedVeg || 0,
        w.servedNonVeg || 0,
        w.servedQuantity || 0,
        w.wastedQuantity || 0,
        `"${w.wastePercentage || 0}%"`,
        `"${w.notes || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadCSV(csvContent, `food_waste_report_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Export Mess Reports</h3>
              <p className="text-xs text-slate-500">Download CSV spreadsheet or print document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700">Select Report Dataset</label>

          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                reportType === 'bookings'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="report"
                value="bookings"
                checked={reportType === 'bookings'}
                onChange={() => setReportType('bookings')}
                className="text-primary focus:ring-primary"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Student Booking & Token Report</p>
                <p className="text-[11px] text-slate-500">
                  Includes roll numbers, Veg/Non-Veg choices, token numbers, and served status.
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                reportType === 'waste'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="report"
                value="waste"
                checked={reportType === 'waste'}
                onChange={() => setReportType('waste')}
                className="text-primary focus:ring-primary"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Food Waste & Consumption Report</p>
                <p className="text-[11px] text-slate-500">
                  Includes prepared vs served portions, remaining quantities, and calculated waste %.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportCSV}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;

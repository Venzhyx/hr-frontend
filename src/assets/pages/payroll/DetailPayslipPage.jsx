import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineDocument,
} from 'react-icons/hi';
import usePayroll from '../../../redux/hooks/usePayroll';
import StatusBadge from '../../components/StatusBadge';

const formatRp = (val) => val == null ? 'Rp 0' : 'Rp ' + Number(val).toLocaleString('id-ID');

const Row = ({ label, value, bold }) => (
  <div className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${bold ? 'bg-gray-50 -mx-5 px-5 rounded-xl' : ''}`}>
    <span className={`text-sm ${bold ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{value}</span>
  </div>
);

const PayslipDetailPage = () => {
  const navigate = useNavigate();
  const { payslipId } = useParams();
  const { payslip, loading } = usePayroll();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (payslipId) payslip.fetchDetail(Number(payslipId));
    return () => payslip.clearDetail();
  }, [payslipId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const d = payslip.detail;
      await payslip.downloadPdf(d.id, `payslip-${d.employeeName}-${d.periodLabel}.pdf`);
    } finally { setDownloading(false); }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center text-gray-400 text-sm">Memuat...</div>
  );

  const d = payslip.detail;
  if (!d) return (
    <div className="p-6 text-center text-gray-400">
      <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>Payslip tidak ditemukan</p>
      <button onClick={() => navigate('/payroll/slips')}
        className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
        <HiOutlineArrowLeft className="w-4 h-4" /> Kembali
      </button>
    </div>
  );

  const earnings   = d.components?.filter(c => c.type === 'EARNING')   ?? [];
  const deductions = d.components?.filter(c => c.type === 'DEDUCTION') ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/payroll/slips')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                     hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <HiOutlineArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Payslip Detail</h1>
          <p className="text-sm text-gray-400">{d.periodLabel}</p>
        </div>
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50
                     text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          {downloading
            ? <HiOutlineClock className="w-4 h-4 animate-spin" />
            : <HiOutlineDocument className="w-4 h-4" />
          }
          Download PDF
        </button>
      </div>

      {/* Employee Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
            {d.employeeName?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{d.employeeName}</p>
            <p className="text-sm text-gray-400">ID #{d.employeeId} · Periode {d.periodLabel}</p>
          </div>
          <div className="ml-auto"><StatusBadge status="DRAFT" /></div>
        </div>

        {/* Attendance */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Absen',  value: `${d.totalAbsent} hari`,                       color: 'text-red-500' },
            { label: 'Telat',  value: `${d.totalLate} hari`,                         color: 'text-yellow-600' },
            { label: 'Lembur', value: `${d.totalOvertimeHours?.toFixed(1)} jam`,      color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings */}
      {earnings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">Earnings</p>
          <Row label="Gaji Pokok" value={formatRp(d.basicSalary)} />
          {earnings.map(c => <Row key={c.id} label={c.componentName} value={formatRp(c.amount)} />)}
          <Row label="Total Earning" value={formatRp(d.totalEarning)} bold />
        </div>
      )}

      {/* Deductions */}
      {deductions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Deductions</p>
          {deductions.map(c => <Row key={c.id} label={c.componentName} value={formatRp(c.amount)} />)}
          <Row label="Total Deduction" value={formatRp(d.totalDeduction)} bold />
        </div>
      )}

      {/* Net Salary */}
      <div className="bg-blue-600 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium">Net Salary</p>
          <p className="text-white text-xs mt-0.5">{d.periodLabel}</p>
        </div>
        <p className="text-white text-2xl font-bold">{formatRp(d.netSalary)}</p>
      </div>
    </div>
  );
};

export default PayslipDetailPage;

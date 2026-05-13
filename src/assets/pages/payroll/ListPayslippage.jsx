import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HiOutlineArrowLeft,
  HiOutlineCursorClick,
  HiOutlineDocumentText,
  HiOutlineTable,
  HiOutlineClock,
  HiOutlineDocument,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import usePayroll from '../../../redux/hooks/usePayroll';
import EmptyState from '../../components/EmptyState';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const formatRp = (val) => val == null ? 'Rp 0' : 'Rp ' + Number(val).toLocaleString('id-ID');

const PayslipListPage = () => {
  const navigate  = useNavigate();
  const { payslip, loading } = usePayroll();
  const employees = useSelector(s => s.employees?.employees ?? s.employees?.list ?? []);

  const [selectedEmp,   setSelectedEmp]   = useState(null);
  const [search,        setSearch]         = useState('');
  const [downloading,   setDownloading]    = useState(null);
  const [dlExcel,       setDlExcel]        = useState(false);
  const [excelMonth,    setExcelMonth]     = useState(new Date().getMonth() + 1);
  const [excelYear,     setExcelYear]      = useState(new Date().getFullYear());

  useEffect(() => { return () => payslip.clearList(); }, []);

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectEmployee = async (emp) => {
    setSelectedEmp(emp);
    payslip.clearList();
    await payslip.fetchByEmployee(emp.id);
  };

  const handleDownloadPdf = async (p) => {
    setDownloading(p.id);
    try {
      await payslip.downloadPdf(p.id, `payslip-${p.employeeName}-${p.periodLabel}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = async () => {
    setDlExcel(true);
    try { await payslip.downloadExcel(excelMonth, excelYear); }
    finally { setDlExcel(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/payroll')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
            <p className="text-sm text-gray-400 mt-0.5">Slip gaji karyawan per periode</p>
          </div>
        </div>

        {/* Download Excel */}
        <div className="flex items-center gap-2">
          <select value={excelMonth} onChange={e => setExcelMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={excelYear} onChange={e => setExcelYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleDownloadExcel} disabled={dlExcel}
            className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-50
                       text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
            {dlExcel
              ? <HiOutlineClock className="w-4 h-4 animate-spin" />
              : <HiOutlineTable className="w-4 h-4" />
            }
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            {filtered.map(emp => (
              <button key={emp.id} onClick={() => handleSelectEmployee(emp)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50
                            transition-colors border-b border-gray-50 last:border-0
                            ${selectedEmp?.id === emp.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center
                                justify-center text-sm font-bold flex-shrink-0">
                  {emp.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.jobTitle ?? emp.workEmail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payslip list */}
        <div className="lg:col-span-2">
          {!selectedEmp ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon={<HiOutlineCursorClick className="w-10 h-10 text-gray-300" />}
                title="Pilih karyawan"
                desc="untuk melihat payslip"
              />
            </div>
          ) : loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-400">
              Memuat...
            </div>
          ) : payslip.list.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon={<HiOutlineDocumentText className="w-10 h-10 text-gray-300" />}
                title="Belum ada payslip"
                desc="Jalankan payroll terlebih dahulu"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {payslip.list.map(p => (
                <div key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                             hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">{p.periodLabel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Absent: {p.totalAbsent}d · Late: {p.totalLate}d · OT: {p.totalOvertimeHours?.toFixed(1)}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatRp(p.netSalary)}</p>
                      <p className="text-xs text-gray-400">Net Salary</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Gaji Pokok',  value: formatRp(p.basicSalary),    color: 'text-gray-700' },
                      { label: 'Earning',     value: formatRp(p.totalEarning),   color: 'text-green-600' },
                      { label: 'Deduction',   value: formatRp(p.totalDeduction), color: 'text-red-500'  },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate(`/payroll/slips/${p.id}`)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5
                                 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors">
                      Detail
                      <HiOutlineChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDownloadPdf(p)} disabled={downloading === p.id}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5
                                 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50">
                      {downloading === p.id
                        ? <HiOutlineClock className="w-3.5 h-3.5 animate-spin" />
                        : <HiOutlineDocument className="w-3.5 h-3.5" />
                      }
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayslipListPage;

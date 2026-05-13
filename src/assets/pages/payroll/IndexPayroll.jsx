import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineMinusCircle,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineDocumentDownload,
  HiOutlinePlusCircle,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineRefresh,
  HiOutlineCollection,
  HiOutlineUserGroup,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineExclamation,
  HiOutlineCash,
} from 'react-icons/hi';
import usePayroll from '../../../redux/hooks/usePayroll';
import { payrollApi } from '../../../ApiService/payrollApi';
import { useEmployee } from '../../../redux/hooks/useEmployee';
import { useOvertime } from '../../../redux/hooks/useOvertime';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const YEARS = (() => {
  const y = [];
  const now = new Date().getFullYear();
  for (let i = now - 3; i <= now + 1; i++) y.push(i);
  return y;
})();

const formatRp = (val) => {
  if (val == null || val === '') return 'Rp 0';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};
const formatRpShort = (val) => {
  if (val == null) return 'Rp 0';
  const n = Number(val);
  if (n >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toFixed(1) + ' M';
  if (n >= 1_000_000)     return 'Rp ' + (n / 1_000_000).toFixed(1) + ' Jt';
  return 'Rp ' + n.toLocaleString('id-ID');
};

const AVATAR_PALETTE = [
  'bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500',
  'bg-amber-500','bg-cyan-500','bg-pink-500','bg-indigo-500',
  'bg-teal-500','bg-orange-500',
];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const getEmpPhoto = (emp) =>
  emp?.photo ?? emp?.photoUrl ?? emp?.profilePhoto ?? emp?.profilePicture ??
  emp?.avatarUrl ?? emp?.avatar ?? emp?.imageUrl ?? emp?.image ?? null;

const normalizeStatus = (status) => {
  if (!status) return 'DRAFT';
  return String(status).toUpperCase().trim();
};

const STATUS_CONFIG = {
  DRAFT:     { pill: 'bg-amber-50 text-amber-700 border-amber-200',         dot: 'bg-amber-400',   label: 'Draft'     },
  FINALIZED: { pill: 'bg-blue-50 text-blue-700 border-blue-200',            dot: 'bg-blue-400',    label: 'Finalized' },
  PAID:      { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-400', label: 'Paid'      },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_CONFIG[status] ?? { pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400', label: status ?? 'Unknown' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name = '', photo = null, size = 'sm' }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (photo && !imgError) {
    return (
      <img src={photo} alt={name} onError={() => setImgError(true)}
        className={`${sz} rounded-full object-cover flex-shrink-0`} />
    );
  }
  return (
    <div className={`${sz} rounded-full ${avatarColor(name)} text-white flex items-center justify-center font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
};

// ─── ConfirmModal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamation className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-semibold disabled:opacity-50 transition-colors ${confirmClass}`}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MonthYearPicker ──────────────────────────────────────────────────────────
// Dropdown yang menampilkan grid bulan + select tahun
const MonthYearPicker = ({ currentMonth, currentYear, onChange }) => {
  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(currentYear);
  const ref = useRef(null);

  // Tutup kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sinkron draftYear saat prop berubah
  useEffect(() => { setDraftYear(currentYear); }, [currentYear]);

  const handlePrev = () => {
    if (currentMonth === 0) onChange(11, currentYear - 1);
    else onChange(currentMonth - 1, currentYear);
  };
  const handleNext = () => {
    if (currentMonth === 11) onChange(0, currentYear + 1);
    else onChange(currentMonth + 1, currentYear);
  };
  const handleSelectMonth = (mIdx) => {
    onChange(mIdx, draftYear);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        {/* Prev */}
        <button
          onClick={handlePrev}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors"
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
        </button>

        {/* Label — klik buka dropdown */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-2 hover:text-indigo-600 transition-colors"
        >
          <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 min-w-[96px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <HiOutlineChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors"
        >
          <HiOutlineChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setDraftYear(y => y - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={draftYear}
              onChange={e => setDraftYear(Number(e.target.value))}
              className="text-sm font-bold text-gray-800 bg-transparent border-0 focus:outline-none cursor-pointer text-center"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setDraftYear(y => y + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => {
              const isActive = i === currentMonth && draftYear === currentYear;
              return (
                <button
                  key={m}
                  onClick={() => handleSelectMonth(i)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── QuickActionCards ─────────────────────────────────────────────────────────
const QuickActionCards = ({ onEmployeeSalary, onSalaryComponent }) => (
  <div className="grid grid-cols-2 gap-3">
    <button onClick={onEmployeeSalary}
      className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-left
                 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center
                        group-hover:bg-indigo-600 transition-colors duration-200">
          <HiOutlineUserGroup className="w-4.5 h-4.5 text-indigo-600 group-hover:text-white transition-colors duration-200" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 leading-tight">Employee Salary</p>
          <p className="text-[10px] text-gray-400">Atur gaji per karyawan</p>
        </div>
      </div>
      <p className="text-[10px] text-indigo-500 font-semibold group-hover:underline">Kelola gaji →</p>
    </button>
    <button onClick={onSalaryComponent}
      className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-left
                 hover:border-emerald-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center
                        group-hover:bg-emerald-600 transition-colors duration-200">
          <HiOutlineCollection className="w-4.5 h-4.5 text-emerald-600 group-hover:text-white transition-colors duration-200" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 leading-tight">Salary Component</p>
          <p className="text-[10px] text-gray-400">Tunjangan & potongan</p>
        </div>
      </div>
      <p className="text-[10px] text-emerald-500 font-semibold group-hover:underline">Kelola komponen →</p>
    </button>
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, subColor, compact }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm min-w-0 transition-all duration-300">
    <div className={`rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${iconBg} ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
      <Icon className={`transition-all duration-300 ${iconColor} ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-gray-400 font-medium truncate">{label}</p>
      <p className={`font-bold text-gray-900 truncate transition-all duration-300 ${compact ? 'text-sm' : 'text-lg'}`}>{value}</p>
      {sub && <p className={`text-[11px] mt-0.5 font-medium truncate ${subColor ?? 'text-gray-400'}`}>{sub}</p>}
    </div>
  </div>
);

// ─── DetailPanel ──────────────────────────────────────────────────────────────
// FIX: Tombol aksi sticky di bawah — gunakan flex flex-col h-full,
//      area konten flex-1 overflow-y-auto, footer flex-shrink-0
const DetailPanel = ({
  payslip, onClose, onDownload, empMap = {},
  onFinalize, onMarkAsPaid, onDelete,
  actionLoading, dlPayslip,
}) => {
  const earnings   = payslip?.components?.filter(c => c.type === 'EARNING')   ?? [];
  const deductions = payslip?.components?.filter(c => c.type === 'DEDUCTION') ?? [];
  const totalEarning   = Number(payslip?.totalEarning   ?? payslip?.basicSalary ?? 0);
  const totalDeduction = Number(payslip?.totalDeduction ?? 0);
  const emp   = empMap?.[String(payslip?.employeeId)];
  const photo = getEmpPhoto(emp);

  const status = normalizeStatus(payslip?.status);
  const isDraft     = status === 'DRAFT';
  const isFinalized = status === 'FINALIZED';
  const isPaid      = status === 'PAID';

  const canFinalize   = isDraft;
  const canMarkAsPaid = isFinalized;
  const canDelete     = isDraft;

  return (
    // style={{ height:'100%' }} memastikan panel mengisi fixed container sepenuhnya
    <div className="flex flex-col w-full bg-white overflow-hidden" style={{ height: '100%' }}>

      {/* ── Header (tidak scroll) ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">Detail Payslip</h3>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
          <HiOutlineX className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {/* Employee */}
        <div className="flex items-center gap-3">
          <Avatar name={payslip?.employeeName} photo={photo} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm truncate">{payslip?.employeeName ?? '-'}</p>
            <p className="text-xs text-gray-400 truncate">{payslip?.jobTitle ?? '-'}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Periode',     value: payslip?.periodLabel ?? '-' },
            { label: 'Employee ID', value: payslip?.employeeId ? `EMP${String(payslip.employeeId).padStart(3,'0')}` : '-' },
            { label: 'Join Date',   value: payslip?.joinDate ?? '-' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
              <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Attendance */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Absen',  value: payslip?.totalAbsent        ?? 0, unit: 'hari', color: 'text-rose-600',  bg: 'bg-rose-50'  },
            { label: 'Telat',  value: payslip?.totalLate          ?? 0, unit: 'kali', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Lembur', value: payslip?.totalOvertimeHours ?? 0, unit: 'jam',  color: 'text-blue-600',  bg: 'bg-blue-50'  },
          ].map(({ label, value, unit, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
              <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400">{unit}</p>
            </div>
          ))}
        </div>

        {/* Earnings */}
        <div>
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">Earnings</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Gaji Pokok</span>
              <span className="font-semibold text-gray-800">{formatRp(payslip?.basicSalary)}</span>
            </div>
            {earnings.map((c, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">{c.componentName}</span>
                <span className="font-semibold text-gray-800">{formatRp(c.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold border-t border-gray-100 pt-2">
              <span className="text-green-700">Total Earnings</span>
              <span className="text-green-600">{formatRp(totalEarning)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Deductions</p>
          <div className="space-y-1.5">
            {deductions.length === 0
              ? <p className="text-xs text-gray-400 italic">Tidak ada potongan</p>
              : deductions.map((c, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{c.componentName}</span>
                    <span className="font-semibold text-gray-800">{formatRp(c.amount)}</span>
                  </div>
                ))
            }
            <div className="flex justify-between text-xs font-bold border-t border-gray-100 pt-2">
              <span className="text-rose-600">Total Deductions</span>
              <span className="text-rose-500">{formatRp(totalDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-indigo-600 rounded-2xl p-4 text-center">
          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Net Salary</p>
          <p className="text-white text-2xl font-bold">{formatRp(payslip?.netSalary)}</p>
        </div>

        {/* Status info banner */}
        {isPaid && (
          <div className="rounded-xl p-3 text-xs flex items-center gap-2 bg-emerald-50 text-emerald-700">
            <HiOutlineCash className="w-4 h-4 flex-shrink-0" />
            <span>Payslip ini sudah dibayarkan dan tidak dapat diubah.</span>
          </div>
        )}
        {isFinalized && (
          <div className="rounded-xl p-3 text-xs flex items-center gap-2 bg-blue-50 text-blue-700">
            <HiOutlineCheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Payslip sudah difinalisasi. Tandai sebagai PAID setelah pembayaran dilakukan.</span>
          </div>
        )}
      </div>

      {/* ── Actions footer — SELALU di bawah, tidak ikut scroll ──────── */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2 bg-white">
        {/* Download — selalu tampil */}
        <button
          onClick={() => onDownload(payslip?.id, payslip?.employeeName)}
          disabled={dlPayslip}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {dlPayslip
            ? <HiOutlineRefresh className="w-4 h-4 animate-spin" />
            : <HiOutlineDocumentDownload className="w-4 h-4" />}
          {dlPayslip ? 'Mengunduh...' : 'Download Payslip PDF'}
        </button>

        {/* Finalize — hanya DRAFT */}
        {canFinalize && (
          <button onClick={() => onFinalize(payslip)} disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
            <HiOutlineCheckCircle className="w-4 h-4" />
            {actionLoading ? 'Memproses...' : 'Finalize Payslip'}
          </button>
        )}

        {/* Mark as Paid — hanya FINALIZED */}
        {canMarkAsPaid && (
          <button onClick={() => onMarkAsPaid(payslip)} disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                       text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
            <HiOutlineCash className="w-4 h-4" />
            {actionLoading ? 'Memproses...' : 'Mark as Paid'}
          </button>
        )}

        {/* Hapus — hanya DRAFT */}
        {canDelete && (
          <button onClick={() => onDelete(payslip)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100
                       text-red-600 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-red-200">
            <HiOutlineTrash className="w-4 h-4" />
            Hapus Payslip
          </button>
        )}
      </div>
    </div>
  );
};

// ─── PayrollIndex ─────────────────────────────────────────────────────────────
const PayrollIndex = () => {
  const navigate = useNavigate();
  const { run, loading, approve, markAsPaid, deletePayslip, actionLoading } = usePayroll();
  const { employees, fetchEmployees } = useEmployee();
  const { fetchOvertimes } = useOvertime({ role: 'admin' });

  const empMap = useMemo(() => {
    const m = {};
    (employees ?? []).forEach(e => { m[String(e.id)] = e; });
    return m;
  }, [employees]);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [page,         setPage]         = useState(1);
  const [perPage,      setPerPage]      = useState(10);

  const [panelData,    setPanelData]    = useState(null);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelIn,      setPanelIn]      = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false, type: null, payslip: null, loading: false,
  });

  const [finalizeAllLoading, setFinalizeAllLoading] = useState(false);
  const [finalizeAllModal,   setFinalizeAllModal]   = useState(false);

  const [dlPayslip, setDlPayslip] = useState(false);
  const [dlExcel,   setDlExcel]   = useState(false);
  const [dlPdf,     setDlPdf]     = useState(false);

  useEffect(() => {
    run.fetchAll();
    fetchEmployees();
    fetchOvertimes();
  }, []);

  const openPanel = useCallback((p) => {
    setPanelData(p);
    setPanelMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)));
  }, []);

  const closePanel = useCallback(() => {
    setPanelIn(false);
    setTimeout(() => { setPanelMounted(false); setPanelData(null); }, 320);
  }, []);

  const history = run.history ?? [];

  const currentRun = history.find(r => {
    const m = r.month ?? r.periodMonth ?? null;
    const y = r.year  ?? r.periodYear  ?? null;
    if (m != null && y != null) {
      return Number(m) === currentMonth + 1 && Number(y) === currentYear;
    }
    if (r.periodLabel) {
      const label = r.periodLabel.toLowerCase();
      return label.includes(MONTHS[currentMonth].toLowerCase()) && label.includes(String(currentYear));
    }
    return false;
  }) ?? history[0] ?? null;

  const lastRun = currentRun;

  const allSlips = (currentRun?.payslips ?? []).map(p => ({
    ...p,
    status: normalizeStatus(p.status),
  }));

  // Handler untuk MonthYearPicker
  const handleMonthYearChange = (month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    setPage(1);
  };

  const filtered = allSlips.filter(p => {
    const ms = !search || p.employeeName?.toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus === 'Semua Status' || p.status === filterStatus;
    return ms && mf;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const totalNet        = allSlips.reduce((s, p) => s + Number(p.netSalary      ?? 0), 0);
  const totalDeduction  = allSlips.reduce((s, p) => s + Number(p.totalDeduction ?? 0), 0);
  const draftCount      = allSlips.filter(p => p.status === 'DRAFT').length;
  const finalizedCount  = allSlips.filter(p => p.status === 'FINALIZED').length;

  const compact       = panelMounted;
  const statusOptions = ['Semua Status', 'DRAFT', 'FINALIZED', 'PAID'];

  // ── Finalize ─────────────────────────────────────────────────────────────────
  const handleFinalizeClick = (payslip) => {
    setConfirmModal({ open: true, type: 'finalize', payslip, loading: false });
  };

  const handleFinalizeConfirm = async () => {
    setConfirmModal(s => ({ ...s, loading: true }));
    try {
      await approve(confirmModal.payslip?.id);
      await run.fetchAll();
      if (panelData?.id === confirmModal.payslip?.id) {
        setPanelData(prev => ({ ...prev, status: 'FINALIZED' }));
      }
    } catch (err) {
      console.error('Finalize failed:', err);
    } finally {
      setConfirmModal({ open: false, type: null, payslip: null, loading: false });
    }
  };

  // ── Mark as Paid ─────────────────────────────────────────────────────────────
  const handleMarkAsPaidClick = (payslip) => {
    setConfirmModal({ open: true, type: 'paid', payslip, loading: false });
  };

  const handleMarkAsPaidConfirm = async () => {
    setConfirmModal(s => ({ ...s, loading: true }));
    try {
      await markAsPaid(confirmModal.payslip?.id);
      await run.fetchAll();
      if (panelData?.id === confirmModal.payslip?.id) {
        setPanelData(prev => ({ ...prev, status: 'PAID' }));
      }
    } catch (err) {
      console.error('Mark as paid failed:', err);
    } finally {
      setConfirmModal({ open: false, type: null, payslip: null, loading: false });
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDeleteClick = (payslip) => {
    setConfirmModal({ open: true, type: 'delete', payslip, loading: false });
  };
  const handleDeleteConfirm = async () => {
    setConfirmModal(s => ({ ...s, loading: true }));
    try {
      await deletePayslip(confirmModal.payslip?.id);
      await run.fetchAll();
      if (panelData?.id === confirmModal.payslip?.id) closePanel();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setConfirmModal({ open: false, type: null, payslip: null, loading: false });
    }
  };

  const confirmConfig = {
    finalize: {
      title:        `Finalisasi payslip ${confirmModal.payslip?.employeeName}?`,
      message:      'Setelah difinalisasi, payslip tidak dapat diedit kembali.',
      confirmLabel: 'Finalize',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
      onConfirm:    handleFinalizeConfirm,
    },
    paid: {
      title:        `Tandai lunas payslip ${confirmModal.payslip?.employeeName}?`,
      message:      'Status payslip akan berubah menjadi PAID. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Mark as Paid',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      onConfirm:    handleMarkAsPaidConfirm,
    },
    delete: {
      title:        `Hapus payslip ${confirmModal.payslip?.employeeName}?`,
      message:      'Payslip yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm:    handleDeleteConfirm,
    },
  };
  const activeConfirm = confirmConfig[confirmModal.type] ?? {};

  // ── Finalize All ─────────────────────────────────────────────────────────────
  const handleFinalizeAll = async () => {
    setFinalizeAllLoading(true);
    try {
      const drafts = allSlips.filter(p => p.status === 'DRAFT');
      for (const p of drafts) await approve(p.id);
      await run.fetchAll();
      closePanel();
    } catch (err) {
      console.error('Finalize all failed:', err);
    } finally {
      setFinalizeAllLoading(false);
      setFinalizeAllModal(false);
    }
  };

  // ── Download Payslip PDF ──────────────────────────────────────────────────────
  const handleDownloadPayslipPdf = useCallback(async (payslipId, employeeName) => {
    if (dlPayslip) return;
    setDlPayslip(true);
    try {
      const res  = await payrollApi.downloadPayslipPdf(payslipId);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `payslip-${employeeName ?? payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      alert(`Download payslip gagal: ${msg}`);
    } finally {
      setDlPayslip(false);
    }
  }, [dlPayslip]);

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    if (dlExcel) return;
    setDlExcel(true);
    try {
      const res  = await payrollApi.downloadPayrollExcel(currentMonth + 1, currentYear);
      const blob = res.data instanceof Blob ? res.data
        : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, `payroll-${MONTHS[currentMonth]}-${currentYear}.xlsx`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      alert(`Export Excel gagal: ${msg}`);
    } finally { setDlExcel(false); }
  };

  const handleDownloadPdf = async () => {
    if (dlPdf) return;
    setDlPdf(true);
    try {
      const res  = await payrollApi.downloadPayrollPdf(currentMonth + 1, currentYear);
      const blob = res.data instanceof Blob ? res.data
        : new Blob([res.data], { type: 'application/pdf' });
      triggerDownload(blob, `payroll-${MONTHS[currentMonth]}-${currentYear}.pdf`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      alert(`Download PDF gagal: ${msg}`);
    } finally { setDlPdf(false); }
  };

  const buildPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    return pages;
  };

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden">

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirmModal.open}
        loading={confirmModal.loading}
        title={activeConfirm.title}
        message={activeConfirm.message}
        confirmLabel={activeConfirm.confirmLabel}
        confirmClass={activeConfirm.confirmClass}
        onConfirm={activeConfirm.onConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null, payslip: null, loading: false })}
      />

      {/* ── Finalize All Modal ── */}
      <ConfirmModal
        open={finalizeAllModal}
        loading={finalizeAllLoading}
        title={`Finalisasi semua ${draftCount} payslip DRAFT?`}
        message="Semua payslip berstatus DRAFT akan diubah menjadi FINALIZED. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Finalize Semua"
        confirmClass="bg-blue-600 hover:bg-blue-700"
        onConfirm={handleFinalizeAll}
        onCancel={() => setFinalizeAllModal(false)}
      />

      <div
        className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ${panelMounted ? 'pr-80 xl:pr-96' : 'pr-0'}`}
      >

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payroll</h1>
              <p className="text-sm text-gray-400 mt-0.5">Kelola penggajian karyawan perusahaan Anda</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">

              {/* ── Month/Year Picker (dropdown) ── */}
              <MonthYearPicker
                currentMonth={currentMonth}
                currentYear={currentYear}
                onChange={handleMonthYearChange}
              />

              {/* Run status badge */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span className={`text-xs font-bold ${
                  normalizeStatus(lastRun?.status) === 'PAID'      ? 'text-emerald-600' :
                  normalizeStatus(lastRun?.status) === 'FINALIZED' ? 'text-blue-600'    :
                  'text-amber-600'
                }`}>{normalizeStatus(lastRun?.status) ?? 'DRAFT'}</span>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  normalizeStatus(lastRun?.status) === 'PAID'      ? 'bg-emerald-400' :
                  normalizeStatus(lastRun?.status) === 'FINALIZED' ? 'bg-blue-400'    :
                  'bg-amber-400'
                }`} />
              </div>

              {/* Finalize All */}
              {draftCount > 0 && (
                <button
                  onClick={() => setFinalizeAllModal(true)}
                  disabled={finalizeAllLoading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Finalize All ({draftCount})
                </button>
              )}

              <button onClick={handleExportExcel} disabled={dlExcel || allSlips.length === 0}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {dlExcel ? <HiOutlineRefresh className="w-4 h-4 text-green-600 animate-spin" /> : <HiOutlineDownload className="w-4 h-4 text-green-600" />}
                {dlExcel ? 'Mengunduh...' : 'Export Excel'}
              </button>
              <button onClick={handleDownloadPdf} disabled={dlPdf || allSlips.length === 0}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {dlPdf ? <HiOutlineRefresh className="w-4 h-4 text-gray-500 animate-spin" /> : <HiOutlineDocumentDownload className="w-4 h-4 text-gray-500" />}
                {dlPdf ? 'Mengunduh...' : 'Download PDF'}
              </button>
              <button onClick={() => navigate('/payroll/run')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
                <HiOutlinePlusCircle className="w-4 h-4" />
                Generate Payroll
              </button>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="px-6 pt-5 pb-3 flex-shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={HiOutlineUsers} iconBg="bg-indigo-100" iconColor="text-indigo-600"
              label="Total Karyawan"
              value={loading ? '…' : (lastRun?.totalEmployees ?? allSlips.length)}
              sub={`Aktif ${lastRun?.totalEmployees ?? allSlips.length} orang`}
              subColor="text-indigo-500" compact={compact}
            />
            <StatCard
              icon={HiOutlineCurrencyDollar} iconBg="bg-green-100" iconColor="text-green-600"
              label="Total Gaji"
              value={loading ? '…' : (compact ? formatRpShort(totalNet) : formatRp(totalNet))}
              sub={`Dari ${allSlips.length} karyawan`}
              subColor="text-green-500" compact={compact}
            />
            <StatCard
              icon={HiOutlineMinusCircle} iconBg="bg-orange-100" iconColor="text-orange-500"
              label="Total Potongan"
              value={loading ? '…' : (compact ? formatRpShort(totalDeduction) : formatRp(totalDeduction))}
              sub={totalNet ? `${((totalDeduction / totalNet) * 100).toFixed(2)}% dari total gaji` : '0%'}
              subColor="text-orange-400" compact={compact}
            />
            <StatCard
              icon={HiOutlineClock} iconBg="bg-purple-100" iconColor="text-purple-600"
              label="Pending (DRAFT)"
              value={loading ? '…' : draftCount}
              sub={draftCount > 0 ? 'Menunggu finalisasi' : 'Semua diproses'}
              subColor={draftCount > 0 ? 'text-amber-500' : 'text-gray-400'} compact={compact}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 pb-3 flex-shrink-0">
          <QuickActionCards
            onEmployeeSalary={() => navigate('/payroll/employee-salary')}
            onSalaryComponent={() => navigate('/payroll/components')}
          />
        </div>

        {/* Table */}
        <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Daftar Payroll</h2>
                {draftCount > 0 && (
                  <span className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                    {draftCount} DRAFT
                  </span>
                )}
                {finalizedCount > 0 && (
                  <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {finalizedCount} FINALIZED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" placeholder="Cari karyawan..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44"
                  />
                </div>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  className="pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer">
                  {statusOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {[
                      ['Karyawan',     'text-left' ],
                      ['Basic Salary', 'text-right'],
                      ['Allowance',    'text-right'],
                      ['Deduction',    'text-right'],
                      ['Net Salary',   'text-right'],
                      ['Status',       'text-center'],
                      ['Aksi',         'text-right'],
                    ].map(([h, a]) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider ${a}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <p className="font-semibold text-gray-400">
                          {history.length > 0 && allSlips.length === 0
                            ? `Tidak ada payroll untuk ${MONTHS[currentMonth]} ${currentYear}`
                            : 'Tidak ada data payroll'}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          {history.length > 0 && allSlips.length === 0
                            ? 'Pilih bulan lain atau generate payroll baru'
                            : 'Jalankan Generate Payroll terlebih dahulu'}
                        </p>
                      </td>
                    </tr>
                  ) : paginated.map((p) => {
                    const isSelected  = panelData?.id === p.id;
                    const emp         = empMap[String(p.employeeId)];
                    const photo       = getEmpPhoto(emp);
                    const dept        = emp?.departmentName ?? emp?.department ?? null;
                    const title       = emp?.jobTitle ?? emp?.position ?? p.jobTitle ?? '-';
                    const isDraft     = p.status === 'DRAFT';
                    const isFinalized = p.status === 'FINALIZED';

                    return (
                      <tr key={p.id}
                        onClick={() => isSelected ? closePanel() : openPanel(p)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors duration-100
                                    ${isSelected ? 'bg-indigo-50/80' : 'hover:bg-gray-50/80'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={p.employeeName} photo={photo} />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-xs leading-tight truncate">{p.employeeName ?? '-'}</p>
                              <p className="text-[11px] text-gray-400 truncate">{title}</p>
                              {dept && <p className="text-[10px] text-indigo-400 font-medium truncate">{dept}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{formatRp(p.basicSalary)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{formatRp(p.totalEarning)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{formatRp(p.totalDeduction)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">{formatRp(p.netSalary)}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => isSelected ? closePanel() : openPanel(p)}
                              title="Lihat detail"
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                                          ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                              <HiOutlineEye className="w-3.5 h-3.5" />
                            </button>
                            {isFinalized && (
                              <button
                                onClick={() => handleMarkAsPaidClick(p)}
                                title="Mark as Paid"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                <HiOutlineCash className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isDraft && (
                              <button
                                onClick={() => handleDeleteClick(p)}
                                title="Hapus"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-2 flex-shrink-0">
              <p className="text-xs text-gray-400">
                Menampilkan&nbsp;
                <span className="font-semibold text-gray-600">
                  {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}
                </span>
                &nbsp;dari&nbsp;<span className="font-semibold text-gray-600">{filtered.length}</span>&nbsp;karyawan
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <HiOutlineChevronLeft className="w-3.5 h-3.5" />
                </button>
                {buildPages().map((pg, i) =>
                  pg === '…' ? (
                    <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400">…</span>
                  ) : (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-7 h-7 text-xs rounded-lg border font-medium transition-colors
                                  ${page === pg ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {pg}
                    </button>
                  )
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <HiOutlineChevronRight className="w-3.5 h-3.5" />
                </button>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="ml-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none cursor-pointer">
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n} / halaman</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {/*
        Pakai position:fixed agar tinggi panel selalu = tinggi viewport,
        tidak bergantung pada h-full dari ancestor yang mungkin tidak
        punya height constraint. Ini memastikan footer tombol SELALU
        di bawah layar, tidak ikut scroll.
      */}
      {panelMounted && (
        <div
          className={`
            fixed top-0 right-0 bottom-0 z-30
            border-l border-gray-100 bg-white shadow-xl
            transition-all duration-300 ease-in-out
            ${panelIn ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            w-80 xl:w-96
          `}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <DetailPanel
            payslip={panelData}
            onClose={closePanel}
            onDownload={handleDownloadPayslipPdf}
            empMap={empMap}
            onFinalize={handleFinalizeClick}
            onMarkAsPaid={handleMarkAsPaidClick}
            onDelete={handleDeleteClick}
            actionLoading={actionLoading}
            dlPayslip={dlPayslip}
          />
        </div>
      )}
    </div>
  );
};

export default PayrollIndex;

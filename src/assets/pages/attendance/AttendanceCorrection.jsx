import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HiOutlinePencilAlt,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineExclamationCircle,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineAnnotation,
  HiOutlineShieldCheck,
  HiOutlineOfficeBuilding,
  HiOutlineLockClosed,
  HiOutlineDotsCircleHorizontal,
  HiOutlineTrash,
} from "react-icons/hi";
import { useAttendanceCorrection } from "../../../redux/hooks/useAttendanceCorrection";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useLocation } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  SUBMITTED: { label: "Submitted", className: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", Icon: HiOutlineClock },
  PENDING:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", Icon: HiOutlineClock },
  APPROVED:  { label: "Approved",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", Icon: HiOutlineCheckCircle },
  REJECTED:  { label: "Rejected",  className: "bg-red-50 text-red-600 border border-red-200", dot: "bg-red-400", Icon: HiOutlineXCircle },
};

const TYPE_LABELS = {
  CHECKIN:  "Check-in",
  CHECKOUT: "Check-out",
  BOTH:     "Check-in & Out",
};

const fmt = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "dd MMM yyyy, HH:mm", { locale: localeId }); }
  catch { return "—"; }
};
const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy", { locale: localeId }); }
  catch { return "—"; }
};
const fmtTime = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "HH:mm"); }
  catch { return "—"; }
};
const fmtDateTime = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "dd MMM yyyy, HH:mm", { locale: localeId }); }
  catch { return "—"; }
};

// ─── Photo Helper ─────────────────────────────────────────────────────────────
const getEmpPhoto = (emp) =>
  emp?.photo ?? emp?.photoUrl ?? emp?.profilePhoto ?? emp?.profilePicture ??
  emp?.avatarUrl ?? emp?.avatar ?? emp?.imageUrl ?? emp?.image ?? null;

const getDisplayStatus = (correction) => {
  if (correction.status === "REJECTED") return "REJECTED";
  if (correction.status === "APPROVED") return "APPROVED";
  
  const approvals = correction.approvals || [];
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const totalLevels = 3;
  
  if (approvedCount === 0) return "SUBMITTED";
  if (approvedCount > 0 && approvedCount < totalLevels) return "PENDING";
  if (approvedCount === totalLevels) return "APPROVED";
  
  return correction.status || "SUBMITTED";
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const DeleteModal = ({ item, onClose, onConfirm, isDeleting, deleteError, itemLabel = "koreksi kehadiran" }) => {
  if (!item) return null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 mr-2" />
            Konfirmasi Hapus
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <HiOutlineTrash className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-700">
              Yakin ingin menghapus {itemLabel} dari{" "}
              <span className="font-semibold text-gray-900">{item.employeeName}</span>?
            </p>
          </div>

          {deleteError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-start">
                <HiOutlineExclamationCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <span className="font-medium">Peringatan:</span> Tindakan ini tidak dapat dibatalkan.
              Data akan dihapus secara permanen.
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!!deleteError || isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <HiOutlineTrash className="w-4 h-4 mr-2" />
            )}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Employee Dropdown ────────────────────────────────────────────────────────

const EmployeeDropdown = ({ employees, loadingEmployees, selectedEmployee, onChange, error, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) => e.name?.toLowerCase().includes(q) || e.employeeIdentificationNumber?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border rounded-xl shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${
          error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 min-w-0">
          <HiOutlineUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedEmployee ? (
            <span className="truncate text-gray-800 font-medium">
              {selectedEmployee.name}
              <span className="ml-1.5 text-gray-400 font-normal font-mono text-xs">
                ({selectedEmployee.employeeIdentificationNumber})
              </span>
            </span>
          ) : (
            <span className="text-gray-400">
              {loadingEmployees ? "Memuat karyawan…" : "Pilih karyawan"}
            </span>
          )}
        </div>
        {!disabled && <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <HiOutlineSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Cari nama atau NIK…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {loadingEmployees ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Memuat…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan</li>
            ) : (
              filtered.map((emp) => {
                const isActive = emp.id === selectedEmployee?.id;
                return (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(emp); setOpen(false); setSearch(""); }}
                      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors ${isActive ? "bg-indigo-50" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {emp.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>{emp.name}</p>
                        <p className="text-xs text-gray-400 font-mono">
                          {emp.employeeIdentificationNumber}
                          {emp.departmentName && ` · ${emp.departmentName}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ correction }) => {
  const displayStatus = getDisplayStatus(correction);
  const cfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.SUBMITTED;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};

const StatCard = ({ label, value, Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
      active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {label}
  </button>
);

const Spinner = ({ cls = "w-4 h-4" }) => (
  <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
        <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 py-4 bg-white space-y-4">{children}</div>}
    </div>
  );
};

const InfoRowDetail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words">{value || "—"}</p>
    </div>
  </div>
);

const ApprovalTimeline = ({ approvals = [] }) => {
  const levels = [1, 2, 3].map((level) => {
    const record = approvals.find((a) => a.approvalOrder === level || a.level === level || a.sequence === level) || null;
    return { level, record };
  });

  const getLockState = (idx) => {
    if (idx === 0) return false;
    for (let i = 0; i < idx; i++) {
      const rec = levels[i].record;
      if (!rec || rec.status !== "APPROVED") return true;
    }
    return false;
  };

  return (
    <div className="space-y-0">
      {levels.map(({ level, record }, idx) => {
        const isLocked    = getLockState(idx);
        const isLast      = idx === levels.length - 1;
        const status      = record?.status || (isLocked ? "LOCKED" : "WAITING");
        const approverName = record?.approverName || record?.employeeName || null;
        const actionAt    = record?.approvedAt || record?.actionAt || null;
        const notes       = record?.notes || null;

        let iconEl, iconWrap, lineColor;
        if (status === "APPROVED") {
          iconEl    = <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />;
          iconWrap  = "bg-emerald-50 border-emerald-300";
          lineColor = "bg-emerald-200";
        } else if (status === "REJECTED") {
          iconEl    = <HiOutlineXCircle className="w-4 h-4 text-red-500" />;
          iconWrap  = "bg-red-50 border-red-300";
          lineColor = "bg-gray-200";
        } else if (status === "LOCKED") {
          iconEl    = <HiOutlineLockClosed className="w-4 h-4 text-gray-300" />;
          iconWrap  = "bg-gray-50 border-gray-200";
          lineColor = "bg-gray-100";
        } else {
          iconEl    = <HiOutlineDotsCircleHorizontal className="w-4 h-4 text-amber-500" />;
          iconWrap  = "bg-amber-50 border-amber-300";
          lineColor = "bg-gray-200";
        }

        return (
          <div key={level} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${iconWrap}`}>
                {iconEl}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${lineColor}`} />}
            </div>
            <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Level {level}</span>
                {status === "APPROVED" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>}
                {status === "REJECTED" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Rejected</span>}
                {status === "WAITING"  && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Menunggu</span>}
                {status === "LOCKED"   && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Terkunci</span>}
              </div>
              {approverName ? (
                <p className="text-sm font-semibold text-gray-800">{approverName}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {isLocked ? "Menunggu level sebelumnya" : "Belum ada approver"}
                </p>
              )}
              {actionAt && (
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <HiOutlineCalendar className="w-3 h-3" />{fmtDateTime(actionAt)}
                </p>
              )}
              {notes && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <HiOutlineAnnotation className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{notes}"</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ correction, onClose, onApprove, onReject, onEdit, onDelete, actionLoading, actionError, isAdmin, empPhoto }) => {
  if (!correction) return null;

  const displayStatus = getDisplayStatus(correction);
  const sCfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.SUBMITTED;
  const canAct = isAdmin && (displayStatus === "SUBMITTED" || displayStatus === "PENDING");
  const canEdit = displayStatus === "SUBMITTED";
  const canDelete = displayStatus === "SUBMITTED";
  const initials = correction.employeeName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const approvals = correction.approvals || [];

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleEdit = () => {
    if (onEdit) onEdit(correction);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) onDelete(correction);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sCfg.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sCfg.dot}`} />
                  {sCfg.label}
                </span>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[correction.type] || correction.type}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">Attendance Correction Request</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <HiOutlineClock className="w-3 h-3" /> Diajukan {fmtDateTime(correction.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button onClick={handleEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200 transition-colors flex-shrink-0"
                  title="Edit">
                  <HiOutlinePencilAlt className="w-4 h-4 text-amber-600" />
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 transition-colors flex-shrink-0"
                  title="Hapus">
                  <HiOutlineTrash className="w-4 h-4 text-red-500" />
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                <HiOutlineX className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Tanggal Koreksi</p>
                <p className="text-xl font-bold text-amber-700">{fmtDate(correction.date)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <HiOutlineCalendar className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>

          {correction.description && (
            <div className="mt-3 rounded-xl px-4 py-3 bg-blue-50 border border-blue-200 flex items-start gap-2">
              <HiOutlineAnnotation className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Alasan Pengajuan</p>
                <p className="text-xs text-blue-800 leading-relaxed italic">"{correction.description}"</p>
              </div>
            </div>
          )}

          {actionError && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
              {actionError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <Section title="Informasi Pengaju">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                {empPhoto ? (
                  <img src={empPhoto} alt={correction.employeeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-lg">{initials}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{correction.employeeName}</p>
                {correction.employeeCode && <p className="text-xs text-gray-500 mt-0.5">NIK: {correction.employeeCode}</p>}
                {correction.departmentName && (
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <HiOutlineOfficeBuilding className="w-3 h-3" /> {correction.departmentName}
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Detail Koreksi">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRowDetail icon={HiOutlineCalendar}    label="Tanggal"         value={fmtDate(correction.date)} />
              <InfoRowDetail icon={HiOutlineShieldCheck} label="Tipe Koreksi"    value={TYPE_LABELS[correction.type] || correction.type} />
              {correction.oldCheckIn && (
                <InfoRowDetail icon={HiOutlineClock}     label="Check-in Lama"   value={fmtTime(correction.oldCheckIn)} />
              )}
              {correction.newCheckIn && (
                <InfoRowDetail icon={HiOutlineCheck}     label="Check-in Baru"   value={fmtDateTime(correction.newCheckIn)} />
              )}
              {correction.oldCheckOut && (
                <InfoRowDetail icon={HiOutlineClock}     label="Check-out Lama"  value={fmtTime(correction.oldCheckOut)} />
              )}
              {correction.newCheckOut && (
                <InfoRowDetail icon={HiOutlineCheck}     label="Check-out Baru"  value={fmtDateTime(correction.newCheckOut)} />
              )}
            </div>
          </Section>

          <Section title="Alur Approval">
            <ApprovalTimeline approvals={approvals} />
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {canAct ? (
            <div className="flex gap-3">
              <button
                onClick={() => onReject(correction.id)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <Spinner /> : <HiOutlineX className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => onApprove(correction.id)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <Spinner /> : <HiOutlineCheck className="w-4 h-4" />}
                Approve
              </button>
            </div>
          ) : (
            <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${sCfg.className}`}>
              <span className={`w-2 h-2 rounded-full ${sCfg.dot}`} />
              Request sudah {sCfg.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

const CorrectionModal = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  isLoading,
  actionError,
  employees,
  loadingEmployees,
  selectedEmployee,
  onEmployeeChange,
  initialDate,
  initialCheckIn,
  initialCheckOut,
  initialType,
  onClearInitialData,
}) => {
  const [form, setForm] = useState({
    employeeId: selectedEmployee?.id ?? "",
    date: initialDate ?? "",
    type: initialType ?? "BOTH",
    newCheckIn: "",
    newCheckOut: "",
    description: "",
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const newCheckInValue = initialData.newCheckIn ? format(new Date(initialData.newCheckIn), "yyyy-MM-dd'T'HH:mm") : "";
      const newCheckOutValue = initialData.newCheckOut ? format(new Date(initialData.newCheckOut), "yyyy-MM-dd'T'HH:mm") : "";
      setForm({
        employeeId: initialData.employeeId,
        date: initialData.date,
        type: initialData.type || "BOTH",
        newCheckIn: newCheckInValue,
        newCheckOut: newCheckOutValue,
        description: initialData.description || "",
      });
      if (onEmployeeChange) {
        const emp = employees.find(e => e.id === initialData.employeeId);
        if (emp) onEmployeeChange(emp);
      }
    } else if (initialDate) {
      let formattedCheckIn = "";
      let formattedCheckOut = "";
      if (initialCheckIn && initialCheckIn !== "—") formattedCheckIn = `${initialDate}T${initialCheckIn}`;
      if (initialCheckOut && initialCheckOut !== "—") formattedCheckOut = `${initialDate}T${initialCheckOut}`;
      setForm((prev) => ({
        ...prev,
        date: initialDate,
        newCheckIn: formattedCheckIn,
        newCheckOut: formattedCheckOut,
        type: initialType ?? prev.type,
      }));
    }
  }, [initialDate, initialCheckIn, initialCheckOut, initialType, mode, initialData, employees, onEmployeeChange]);

  useEffect(() => {
    if (mode !== "edit") {
      setForm((prev) => ({ ...prev, employeeId: selectedEmployee?.id ?? "" }));
    }
  }, [selectedEmployee, mode]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return;
    const payload = {
      employeeId: Number(form.employeeId),
      date: form.date,
      type: form.type,
      description: form.description || null,
      newCheckIn: form.type === "CHECKIN" || form.type === "BOTH" ? form.newCheckIn || null : null,
      newCheckOut: form.type === "CHECKOUT" || form.type === "BOTH" ? form.newCheckOut || null : null,
    };
    try {
      await onSubmit(payload);
      if (onClearInitialData) onClearInitialData();
      onClose();
    } catch (_) {}
  };

  const needsCI = form.type === "CHECKIN" || form.type === "BOTH";
  const needsCO = form.type === "CHECKOUT" || form.type === "BOTH";
  const today = new Date().toISOString().split("T")[0];
  const hasEmployeeError = !form.employeeId && !selectedEmployee;
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Koreksi Kehadiran" : "Buat Koreksi Kehadiran"}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{isEdit ? "Ubah detail koreksi yang ingin diajukan" : "Isi detail koreksi yang ingin diajukan"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <HiOutlineX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(actionError || hasEmployeeError) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
              {hasEmployeeError ? "Silakan pilih karyawan terlebih dahulu" : actionError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Karyawan <span className="text-red-500">*</span>
            </label>
            <EmployeeDropdown
              employees={employees}
              loadingEmployees={loadingEmployees}
              selectedEmployee={selectedEmployee}
              onChange={onEmployeeChange}
              error={hasEmployeeError}
              disabled={isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date" required value={form.date} max={today}
              onChange={(e) => set("date", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Koreksi</label>
            <div className="relative">
              <select
                value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              >
                <option value="CHECKIN">Check-in saja</option>
                <option value="CHECKOUT">Check-out saja</option>
                <option value="BOTH">Check-in & Check-out</option>
              </select>
              <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {needsCI && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Waktu Check-in Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local" required value={form.newCheckIn}
                onChange={(e) => set("newCheckIn", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              {initialCheckIn && initialCheckIn !== "—" && !isEdit && (
                <p className="text-xs text-gray-400 mt-1">Data lama: {initialCheckIn}</p>
              )}
            </div>
          )}

          {needsCO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Waktu Check-out Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local" required value={form.newCheckOut}
                onChange={(e) => set("newCheckOut", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              {initialCheckOut && initialCheckOut !== "—" && !isEdit && (
                <p className="text-xs text-gray-400 mt-1">Data lama: {initialCheckOut}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alasan / Keterangan</label>
            <textarea
              rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Jelaskan alasan koreksi kehadiran..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isLoading || !form.employeeId}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isLoading ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Ajukan Koreksi")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmptyState = ({ onNew, isAdmin }) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
      <HiOutlinePencilAlt className="w-8 h-8 text-indigo-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-800 mb-1">Belum ada koreksi kehadiran</h3>
    <p className="text-sm text-gray-400 max-w-xs">
      {isAdmin ? "Belum ada pengajuan koreksi dari karyawan." : "Ajukan koreksi jika ada kesalahan data kehadiran kamu."}
    </p>
    {!isAdmin && (
      <button onClick={onNew}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
        <HiOutlinePlus className="w-4 h-4" />
        Buat Koreksi Pertama
      </button>
    )}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AttendanceCorrection = ({ role = "admin", employeeId = null, adminId }) => {
  const location = useLocation();
  const isAdmin = role === "admin";

  const { employees, loadingEmployees, fetchEmployees } = useEmployee();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingCorrection, setEditingCorrection] = useState(null);
  const [autoOpenModal, setAutoOpenModal] = useState(false);
  const [initialModalData, setInitialModalData] = useState({
    date: "", checkIn: "", checkOut: "", type: "BOTH",
  });

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const {
    corrections, loading, error, actionLoading, actionError,
    isModalOpen, isDetailModalOpen, selectedCorrection, filterStatus, filterType,
    openCreateModal, closeCreateModal, openDetailModal, closeDetailModal,
    setFilterStatus, setFilterType, handleCreate, handleApprove, handleReject, handleRefresh,
    handleUpdate, handleDelete,
  } = useAttendanceCorrection({ role, employeeId, adminId });

  // ─── empMap: lookup employee by id for photo ──────────────────────────────
  const empMap = useMemo(() => {
    const m = {};
    (employees ?? []).forEach((e) => { m[String(e.id)] = e; });
    return m;
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
    handleRefresh();
  }, [employeeId, role]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!employeeId && role !== "admin") return;
    handleRefresh();
  }, [role, employeeId]);

  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const { state } = location;
    if (state?.openModal && state?.action === "correction" && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      setAutoOpenModal(true);
      const selectedDate   = state.selectedDate || "";
      const attendanceData = state.attendanceData || {};
      const navEmployeeId  = state.employeeId;

      if (navEmployeeId && employees.length > 0) {
        const emp = employees.find((e) => e.id === Number(navEmployeeId));
        if (emp) setSelectedEmployee(emp);
      }

      let checkInTime = "", checkOutTime = "", correctionType = "BOTH";
      if (attendanceData.checkIn) {
        try { const d = new Date(attendanceData.checkIn); if (!isNaN(d)) checkInTime = format(d, "HH:mm"); } catch (_) {}
      }
      if (attendanceData.checkOut) {
        try { const d = new Date(attendanceData.checkOut); if (!isNaN(d)) checkOutTime = format(d, "HH:mm"); } catch (_) {}
      }
      if (checkInTime && !checkOutTime) correctionType = "CHECKIN";
      else if (!checkInTime && checkOutTime) correctionType = "CHECKOUT";
      else correctionType = "BOTH";

      setInitialModalData({ date: selectedDate, checkIn: checkInTime, checkOut: checkOutTime, type: correctionType });
      window.history.replaceState({}, document.title);
    }
  }, [location, employees]);

  useEffect(() => {
    if (!isModalOpen && !autoOpenModal) {
      hasProcessedRef.current = false;
    }
  }, [isModalOpen, autoOpenModal]);

  useEffect(() => {
    if (autoOpenModal && !isModalOpen) {
      openCreateModal();
      setAutoOpenModal(false);
    }
  }, [autoOpenModal, isModalOpen, openCreateModal]);

  const handleCloseModal = () => {
    closeCreateModal();
    setEditMode(false);
    setEditingCorrection(null);
    setInitialModalData({ date: "", checkIn: "", checkOut: "", type: "BOTH" });
  };

  const handleEdit = (correction) => {
    setEditingCorrection(correction);
    setSelectedEmployee(employees.find(e => e.id === correction.employeeId));
    setEditMode(true);
    openCreateModal();
  };

  const handleUpdateSubmit = async (payload) => {
    if (handleUpdate) {
      await handleUpdate(editingCorrection.id, payload);
    }
  };

  // Delete handlers
  const handleDeleteClick = (correction) => {
    setDeletingItem(correction);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeletingId(deletingItem.id);
    try {
      await handleDelete(deletingItem.id);
      handleRefresh();
      setShowDeleteModal(false);
      setDeletingItem(null);
      setDeleteError("");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Gagal menghapus.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingItem(null);
    setDeleteError("");
  };

  const displayStats = useMemo(() => {
    const counts = { total: 0, submitted: 0, pending: 0, approved: 0, rejected: 0 };
    (corrections || []).forEach((c) => {
      const status = getDisplayStatus(c);
      counts.total++;
      if (status === "SUBMITTED") counts.submitted++;
      if (status === "PENDING") counts.pending++;
      if (status === "APPROVED") counts.approved++;
      if (status === "REJECTED") counts.rejected++;
    });
    return counts;
  }, [corrections]);

  const filteredCorrections = useMemo(() => {
    let filtered = corrections || [];
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((c) => getDisplayStatus(c) === filterStatus);
    }
    if (filterType !== "ALL") {
      filtered = filtered.filter((c) => c.type === filterType);
    }
    return filtered;
  }, [corrections, filterStatus, filterType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Correction</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola koreksi data kehadiran karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="p-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
          {!isAdmin && (
            <button onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              <HiOutlinePlus className="w-4 h-4" /> Buat Koreksi
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total"     value={displayStats.total}     Icon={HiOutlinePencilAlt}  accent="bg-indigo-50 text-indigo-500" />
        <StatCard label="Submitted" value={displayStats.submitted} Icon={HiOutlineClock}       accent="bg-amber-50 text-amber-500" />
        <StatCard label="Pending"   value={displayStats.pending}   Icon={HiOutlineClock}       accent="bg-amber-50 text-amber-500" />
        <StatCard label="Approved"  value={displayStats.approved}  Icon={HiOutlineCheckCircle} accent="bg-emerald-50 text-emerald-500" />
        <StatCard label="Rejected"  value={displayStats.rejected}  Icon={HiOutlineXCircle}     accent="bg-red-50 text-red-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <HiOutlineFilter className="w-4 h-4 text-gray-400 shrink-0" />
            {["ALL", "SUBMITTED", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <FilterPill key={s} label={s === "ALL" ? "Semua" : STATUS_CONFIG[s]?.label ?? s}
                active={filterStatus === s} onClick={() => setFilterStatus(s)} />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["ALL", "CHECKIN", "CHECKOUT", "BOTH"].map((t) => (
              <FilterPill key={t} label={t === "ALL" ? "Semua Tipe" : TYPE_LABELS[t]}
                active={filterType === t} onClick={() => setFilterType(t)} />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : corrections.length === 0 ? (
          <EmptyState onNew={openCreateModal} isAdmin={isAdmin} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Karyawan", "Tanggal", "Tipe", "Check-in", "Check-out", "Status", "Diajukan", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCorrections.map((c) => {
                  const displayStatus = getDisplayStatus(c);
                  const canEditDelete = displayStatus === "SUBMITTED";
                  const emp = empMap[String(c.employeeId)];
                  const photo = getEmpPhoto(emp);

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-100">
                            {photo ? (
                              <img
                                src={photo}
                                alt={c.employeeName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full bg-indigo-100 items-center justify-center"
                              style={{ display: photo ? "none" : "flex" }}
                            >
                              <span className="text-xs font-bold text-indigo-600">{c.employeeName?.charAt(0)?.toUpperCase() ?? "?"}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{c.employeeName}</p>
                            <p className="text-xs text-gray-400">#{c.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                          <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-400" />{fmtDate(c.date)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                          {TYPE_LABELS[c.type] ?? c.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">{fmtTime(c.newCheckIn)}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">{fmtTime(c.newCheckOut)}</td>
                      <td className="px-5 py-3.5"><StatusBadge correction={c} /></td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{fmt(c.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetailModal(c)}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600" title="Lihat detail">
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          {canEditDelete && !isAdmin && (
                            <>
                              <button onClick={() => handleEdit(c)}
                                className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors text-gray-400 hover:text-amber-600" title="Edit">
                                <HiOutlinePencilAlt className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteClick(c)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600" title="Hapus">
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(isModalOpen || autoOpenModal) && (
        <CorrectionModal
          mode={editMode ? "edit" : "create"}
          initialData={editingCorrection}
          onClose={handleCloseModal}
          onSubmit={editMode ? handleUpdateSubmit : handleCreate}
          isLoading={actionLoading}
          actionError={actionError}
          employees={employees}
          loadingEmployees={loadingEmployees}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          initialDate={initialModalData.date}
          initialCheckIn={initialModalData.checkIn}
          initialCheckOut={initialModalData.checkOut}
          initialType={initialModalData.type}
          onClearInitialData={() => setInitialModalData({ date: "", checkIn: "", checkOut: "", type: "BOTH" })}
        />
      )}

      {isDetailModalOpen && (
        <DetailModal
          correction={selectedCorrection}
          onClose={closeDetailModal}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          actionLoading={actionLoading}
          actionError={actionError}
          isAdmin={isAdmin}
          empPhoto={selectedCorrection ? getEmpPhoto(empMap[String(selectedCorrection.employeeId)]) : null}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          item={deletingItem}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          isDeleting={deletingId === deletingItem?.id}
          deleteError={deleteError}
          itemLabel="koreksi kehadiran"
        />
      )}
    </div>
  );
};

export default AttendanceCorrection;

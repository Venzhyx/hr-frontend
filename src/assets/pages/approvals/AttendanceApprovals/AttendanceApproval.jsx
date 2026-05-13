import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineEye,
} from "react-icons/hi";
import { useAttendanceCorrection } from "../../../../redux/hooks/useAttendanceCorrection";
import { useEmployee } from "../../../../redux/hooks/useEmployee";
import AttendanceCorrectionDetailModal from "./AttendanceApprovalModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

// Semua status pakai warna kuning (amber)
const STATUS_CFG = {
  SUBMITTED: { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", label: "Submitted" },
  PENDING:   { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", label: "Pending" },
  APPROVED:  { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Approved" },
  REJECTED:  { cls: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-400", label: "Rejected" },
};

const TYPE_LABELS = {
  CHECKIN: "Check-in",
  CHECKOUT: "Check-out",
  BOTH: "Check-in & Out",
};

const ALL_STATUSES = ["SUBMITTED", "PENDING", "APPROVED", "REJECTED"];

// ── Helper: hitung status berdasarkan approvals ───────────────────────────────
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

// ── Sub Components ────────────────────────────────────────────────────────────
const Spinner = ({ cls = "w-4 h-4" }) => (
  <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Toast = ({ message, type = "success", onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
      ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
  >
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        type === "success" ? "bg-emerald-100" : "bg-red-100"
      }`}
    >
      {type === "success" ? (
        <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <HiOutlineX className="w-3.5 h-3.5 text-red-600" />
      )}
    </span>
    {message}
    <button onClick={onClose} className="ml-1 p-0.5 hover:opacity-60">
      <HiOutlineX className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ── Filter Dropdown ───────────────────────────────────────────────────────────
const FilterDropdown = ({ activeFilters, onChange, counts }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (s) => {
    if (activeFilters.includes(s)) {
      if (activeFilters.length === 1) return;
      onChange(activeFilters.filter((x) => x !== s));
    } else {
      onChange([...activeFilters, s]);
    }
  };
  const isAll = activeFilters.length === ALL_STATUSES.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
          !isAll
            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <HiOutlineFilter className="w-4 h-4" />
        <span className="font-medium">Status</span>
        <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter Status</span>
          </div>
          <div className="py-1.5">
            <button
              onClick={() => onChange(isAll ? ["SUBMITTED"] : [...ALL_STATUSES])}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 mb-1"
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${isAll ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                {isAll && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-700 font-medium">All</span>
              <span className="ml-auto text-xs text-gray-400">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
            </button>

            {ALL_STATUSES.map((status) => {
              const cfg = STATUS_CFG[status];
              const checked = activeFilters.includes(status);
              const isLast = activeFilters.length === 1 && checked;
              return (
                <button
                  key={status}
                  onClick={() => toggle(status)}
                  disabled={isLast}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    isLast ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-sm text-gray-700 font-medium">{cfg.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{counts[status] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ══ Main Page ═════════════════════════════════════════════════════════════════
const ApprovalAttendancePage = () => {
  const { corrections, loading, fetchAllCorrections } = useAttendanceCorrection({ role: "admin" });
  const { employees, fetchEmployees } = useEmployee();

  const empMap = React.useMemo(() => {
    const m = {};
    (employees || []).forEach((e) => {
      m[String(e.id)] = e;
    });
    return m;
  }, [employees]);

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState(["SUBMITTED", "PENDING"]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    if (fetchAllCorrections) await fetchAllCorrections();
  }, [fetchAllCorrections]);

  useEffect(() => {
    loadData();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selected && corrections) {
      const updated = corrections.find((c) => c.id === selected.id);
      if (updated && (updated.status !== selected.status || updated.updatedAt !== selected.updatedAt)) {
        setSelected(updated);
      }
    }
  }, [corrections, selected]);

  const stats = (corrections || []).reduce(
    (acc, c) => {
      const displayStatus = getDisplayStatus(c);
      acc.total++;
      if (displayStatus === "SUBMITTED") acc.submitted++;
      if (displayStatus === "PENDING") acc.pending++;
      if (displayStatus === "APPROVED") acc.approved++;
      if (displayStatus === "REJECTED") acc.rejected++;
      return acc;
    },
    { total: 0, submitted: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const counts = (corrections || []).reduce((acc, c) => {
    const displayStatus = getDisplayStatus(c);
    acc[displayStatus] = (acc[displayStatus] || 0) + 1;
    return acc;
  }, {});

  const sorted = [
    ...(corrections || []).filter((c) => getDisplayStatus(c) === "SUBMITTED"),
    ...(corrections || []).filter((c) => getDisplayStatus(c) === "PENDING"),
    ...(corrections || []).filter((c) => {
      const status = getDisplayStatus(c);
      return status !== "SUBMITTED" && status !== "PENDING";
    }),
  ];

  const filtered = sorted.filter((c) => {
    const displayStatus = getDisplayStatus(c);
    if (!activeFilters.includes(displayStatus)) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.employeeName?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleActionSuccess = () => {
    showToast("Request berhasil diproses.", "success");
    setSelected(null);
    loadData();
  };

  return (
    <div className="w-full px-4 md:px-6 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Approval Attendance Correction</h1>
        {(stats.submitted + stats.pending) > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {stats.submitted + stats.pending} perlu tindakan
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <HiOutlineClock className="w-3 h-3 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Status Overview</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 divide-x divide-gray-100">
          {[
            { label: "Total", value: stats.total, color: "text-gray-800" },
            { label: "Submitted", value: stats.submitted, color: "text-amber-600" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Approved", value: stats.approved, color: "text-emerald-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-500" },
          ].map((s, i) => (
            <div key={s.label} className={i > 0 ? "pl-6" : ""}>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama karyawan..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <FilterDropdown activeFilters={activeFilters} onChange={setActiveFilters} counts={counts} />
        <div className="flex-1" />
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          title="Refresh"
        >
          <HiOutlineRefresh className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner cls="w-6 h-6 text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
          <HiOutlineClock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Tidak ada data</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Employee", "Tanggal", "Tipe", "Check-in Baru", "Check-out Baru", "Status", "Aksi"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const displayStatus = getDisplayStatus(c);
                const sCfg = STATUS_CFG[displayStatus] || STATUS_CFG.SUBMITTED;
                const emp = empMap[String(c.employeeId)];
                const initials = c.employeeName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                const isActive = selected?.id === c.id;
                const canAct = displayStatus === "SUBMITTED" || displayStatus === "PENDING";

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`transition-colors cursor-pointer ${isActive ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                          {emp?.photo ? (
                            <img src={emp.photo} alt={c.employeeName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-[10px]">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 whitespace-nowrap">{c.employeeName}</p>
                          {emp?.departmentName && <p className="text-xs text-gray-400">{emp.departmentName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDateShort(c.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.newCheckIn ? fmtDateTime(c.newCheckIn) : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.newCheckOut ? fmtDateTime(c.newCheckOut) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} /> {sCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(c);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 whitespace-nowrap"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5" /> Detail
                        </button>
                        {canAct && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(c);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 whitespace-nowrap"
                            >
                              <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(c);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 whitespace-nowrap"
                            >
                              <HiOutlineX className="w-3.5 h-3.5" /> Reject
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

      {/* Detail Modal */}
      {selected && (
        <AttendanceCorrectionDetailModal
          correction={selected}
          emp={empMap[String(selected.employeeId)]}
          onClose={() => setSelected(null)}
          onSuccess={handleActionSuccess}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default ApprovalAttendancePage;
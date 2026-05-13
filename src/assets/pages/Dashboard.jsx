import React, { useEffect, useMemo, useState } from "react";
import {
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePencilAlt,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
} from "react-icons/hi";
import { useEmployee } from "../../redux/hooks/useEmployee";
import usePayroll from "../../redux/hooks/usePayroll";
import { useOvertime } from "../../redux/hooks/useOvertime";
import { useAttendanceCorrection } from "../../redux/hooks/useAttendanceCorrection";
import { useDepartment } from "../../redux/hooks/useDepartment";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getEmpPhoto = (emp) =>
  emp?.photo ?? emp?.photoUrl ?? emp?.profilePhoto ?? emp?.profilePicture ??
  emp?.avatarUrl ?? emp?.avatar ?? emp?.imageUrl ?? emp?.image ?? null;

const fmtCurrency = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Number(n).toLocaleString("id-ID")}`;
};

const today = new Date();

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon className="w-4 h-4 text-indigo-400" />}
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{children}</h2>
  </div>
);

const KpiCard = ({ label, value, sub, Icon, accent, iconAccent, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
      <Icon className={`w-5 h-5 ${iconAccent}`} />
    </div>
    <div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse mb-1.5" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{value ?? "—"}</p>
      )}
      <p className="text-sm font-medium text-gray-500 mt-1.5">{label}</p>
      {sub && !loading && (
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

const HBar = ({ label, value, max, color, sub }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-gray-700 truncate max-w-[140px]">{label}</span>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
        <span className="font-bold text-gray-900 tabular-nums">{value}</span>
      </div>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.round((value / max) * 100))}%` }}
      />
    </div>
  </div>
);

const StatusRow = ({ label, value, dot }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <p className="text-sm text-gray-600">{label}</p>
    </div>
    <p className="text-sm font-bold text-gray-900 tabular-nums">{value}</p>
  </div>
);

const EmpRow = ({ emp, rank }) => {
  const photo = getEmpPhoto(emp);
  const initial = emp.name?.charAt(0)?.toUpperCase() || "?";
  const palettes = [
    "bg-indigo-100 text-indigo-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-600",
    "bg-sky-100 text-sky-600",
  ];
  const palette = palettes[rank % palettes.length];

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-100">
        {photo ? (
          <img
            src={photo}
            alt={emp.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full ${palette} items-center justify-center text-xs font-bold`}
          style={{ display: photo ? "none" : "flex" }}
        >
          {initial}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {emp.departmentName ?? emp.department?.name ?? "—"}
        </p>
      </div>
      {emp.employeeIdentificationNumber && (
        <span className="text-[10px] font-mono text-gray-300 flex-shrink-0">
          {emp.employeeIdentificationNumber}
        </span>
      )}
    </div>
  );
};

const Skel = ({ cls = "h-4 w-full" }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${cls}`} />
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Hooks ──────────────────────────────────────────────────────────────────

  const {
    employees,
    loading: loadingEmployees,
    fetchEmployees,
  } = useEmployee();

  // default export, nested API: { run, payslip, loading, ... }
  const {
    run,
    payslip,
    loading: loadingPayroll,
  } = usePayroll();

  const {
    overtimes,
    loading: loadingOvertime,
    fetchOvertimes,
  } = useOvertime({ role: "admin" });

  const {
    corrections,
    loading: loadingCorrections,
    handleRefresh: fetchCorrections,
  } = useAttendanceCorrection({ role: "admin" });

  const {
    departments,
    loading: loadingDepartments,
    fetchDepartments,
  } = useDepartment();

  const [greeting, setGreeting] = useState("");

  // ── Fetch on mount ─────────────────────────────────────────────────────────

  const refresh = () => {
    fetchEmployees();
    fetchDepartments();
    run.fetchAll();       // fetchPayrollRuns dari usePayroll
    fetchOvertimes();
    fetchCorrections();
  };

  useEffect(() => {
    refresh();
    const h = new Date().getHours();
    if (h < 11)       setGreeting("Selamat Pagi");
    else if (h < 15)  setGreeting("Selamat Siang");
    else if (h < 18)  setGreeting("Selamat Sore");
    else              setGreeting("Selamat Malam");
  }, []);

  // ─── Derived: Employees ───────────────────────────────────────────────────

  const totalEmployees   = employees?.length ?? 0;
  const totalDepartments = departments?.length ?? 0;

  const deptStats = useMemo(() => {
    const m = {};
    (employees ?? []).forEach((e) => {
      const d = e.departmentName ?? e.department?.name ?? "Lainnya";
      m[d] = (m[d] ?? 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [employees]);

  const maxDeptCount = deptStats[0]?.[1] ?? 1;

  const deptBarColors = [
    "bg-indigo-500", "bg-emerald-500", "bg-amber-400",
    "bg-pink-400",   "bg-purple-500",  "bg-sky-400",
  ];

  // ─── Derived: Payroll ─────────────────────────────────────────────────────
  // run.history  → array PayrollRun  (total gross/net per run)
  // payslip.list → array Payslip     (per-karyawan)
  // Gunakan payslip.list untuk hitung gross/net/deductions agregat

  const payrollStats = useMemo(() => {
    const list = payslip?.list ?? [];
    const totalGross = list.reduce(
      (s, p) => s + (p.grossSalary ?? p.gross ?? p.totalSalary ?? p.amount ?? 0), 0
    );
    const totalNet = list.reduce(
      (s, p) => s + (p.netSalary ?? p.net ?? p.takeHomePay ?? 0), 0
    );
    const totalDeductions = list.reduce(
      (s, p) => s + (p.totalDeductions ?? p.deductions ?? 0), 0
    );
    return { totalGross, totalNet, totalDeductions, total: list.length };
  }, [payslip?.list]);

  // ─── Derived: Overtime ────────────────────────────────────────────────────

  const overtimeStats = useMemo(() => {
    const list = overtimes ?? [];
    const pending    = list.filter(o => ["SUBMITTED", "PENDING"].includes(o.status)).length;
    const approved   = list.filter(o => o.status === "APPROVED").length;
    const rejected   = list.filter(o => o.status === "REJECTED").length;
    const totalHours = list
      .filter(o => o.status === "APPROVED")
      .reduce((s, o) => s + (o.totalHours ?? 0), 0);
    const workday = list.filter(o => o.type === "WORKDAY").length;
    const holiday = list.filter(o => o.type === "HOLIDAY").length;
    return {
      pending, approved, rejected,
      totalHours: Math.round(totalHours),
      workday, holiday,
      total: list.length,
    };
  }, [overtimes]);

  // ─── Derived: Corrections ─────────────────────────────────────────────────

  const correctionStats = useMemo(() => {
    const list = corrections ?? [];
    const pending  = list.filter(c => ["SUBMITTED", "PENDING"].includes(c.status)).length;
    const approved = list.filter(c => c.status === "APPROVED").length;
    const rejected = list.filter(c => c.status === "REJECTED").length;
    return { pending, approved, rejected, total: list.length };
  }, [corrections]);

  const recentEmployees = useMemo(() => (employees ?? []).slice(0, 5), [employees]);

  const loadingDept = loadingEmployees || loadingDepartments;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-gray-50/60 min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-gray-400">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Dashboard HR</h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <HiOutlineCalendar className="w-3.5 h-3.5" />
            {format(today, "EEEE, dd MMMM yyyy", { locale: localeId })}
          </p>
        </div>
        <button
          onClick={refresh}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <HiOutlineRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Karyawan"
          value={totalEmployees}
          sub={`${totalDepartments} departemen aktif`}
          Icon={HiOutlineUsers}
          accent="bg-indigo-50"
          iconAccent="text-indigo-500"
          loading={loadingEmployees}
        />
        <KpiCard
          label="Total Departemen"
          value={totalDepartments}
          sub={deptStats[0] ? `Terbesar: ${deptStats[0][0]}` : undefined}
          Icon={HiOutlineOfficeBuilding}
          accent="bg-sky-50"
          iconAccent="text-sky-500"
          loading={loadingDepartments}
        />
        <KpiCard
          label="Company Payroll (Net)"
          value={fmtCurrency(payrollStats.totalNet)}
          sub={`${payrollStats.total} slip gaji`}
          Icon={HiOutlineCurrencyDollar}
          accent="bg-emerald-50"
          iconAccent="text-emerald-500"
          loading={loadingPayroll}
        />
        <KpiCard
          label="Total Jam Lembur"
          value={`${overtimeStats.totalHours} jam`}
          sub={`${overtimeStats.approved} pengajuan disetujui`}
          Icon={HiOutlineTrendingUp}
          accent="bg-amber-50"
          iconAccent="text-amber-500"
          loading={loadingOvertime}
        />
      </div>

      {/* ── Row 2: Dept bars + Payroll detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Dept bars — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={HiOutlineOfficeBuilding}>Sebaran Karyawan per Departemen</SectionTitle>
          {loadingDept ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skel key={i} cls="h-6 rounded" />)}
            </div>
          ) : deptStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Belum ada data</p>
          ) : (
            <div className="space-y-4">
              {deptStats.map(([name, count], i) => (
                <HBar
                  key={name}
                  label={name}
                  value={count}
                  max={maxDeptCount}
                  color={deptBarColors[i % deptBarColors.length]}
                  sub={`${Math.round((count / (totalEmployees || 1)) * 100)}%`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Payroll breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={HiOutlineCurrencyDollar}>Ringkasan Payroll</SectionTitle>
          {loadingPayroll ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skel key={i} />)}
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {[
                  { label: "Total Gross",          value: fmtCurrency(payrollStats.totalGross),      dot: "bg-emerald-400" },
                  { label: "Total Net (Take Home)", value: fmtCurrency(payrollStats.totalNet),        dot: "bg-indigo-400"  },
                  { label: "Total Potongan",        value: fmtCurrency(payrollStats.totalDeductions), dot: "bg-red-400"     },
                  { label: "Jumlah Slip",           value: `${payrollStats.total} slip`,              dot: "bg-amber-400"   },
                ].map(s => (
                  <StatusRow key={s.label} label={s.label} value={s.value} dot={s.dot} />
                ))}
              </div>

              {payrollStats.totalGross > 0 && (() => {
                const net = payrollStats.totalNet / payrollStats.totalGross;
                const ded = payrollStats.totalDeductions / payrollStats.totalGross;
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Komposisi Payroll</p>
                    <div className="flex rounded-full overflow-hidden h-2.5 gap-px">
                      <div className="bg-indigo-400 transition-all" style={{ width: `${net * 100}%` }} />
                      <div className="bg-red-300 transition-all"    style={{ width: `${ded * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <p className="text-[11px] text-gray-500">Net ({Math.round(net * 100)}%)</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-300" />
                        <p className="text-[11px] text-gray-500">Potongan ({Math.round(ded * 100)}%)</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Employees + Overtime + Correction ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Employees list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineUsers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Karyawan</h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">{totalEmployees} orang</span>
          </div>
          {loadingEmployees ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skel cls="h-3 w-3/4 rounded" />
                    <Skel cls="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentEmployees.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data karyawan</p>
          ) : (
            <>
              {recentEmployees.map((emp, i) => <EmpRow key={emp.id} emp={emp} rank={i} />)}
              {totalEmployees > 5 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  +{totalEmployees - 5} karyawan lainnya
                </p>
              )}
            </>
          )}
        </div>

        {/* Overtime */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={HiOutlineClipboardList}>Lembur (Overtime)</SectionTitle>
          {loadingOvertime ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} />)}</div>
          ) : (
            <>
              <div className="space-y-0">
                {[
                  { label: "Total Pengajuan",     value: overtimeStats.total,                    dot: "bg-gray-300"   },
                  { label: "Menunggu Approval",   value: overtimeStats.pending,                  dot: "bg-amber-400"  },
                  { label: "Disetujui",           value: overtimeStats.approved,                 dot: "bg-emerald-400"},
                  { label: "Ditolak",             value: overtimeStats.rejected,                 dot: "bg-red-400"    },
                  { label: "Total Jam Disetujui", value: `${overtimeStats.totalHours} jam`,      dot: "bg-purple-400" },
                ].map(s => (
                  <StatusRow key={s.label} label={s.label} value={s.value} dot={s.dot} />
                ))}
              </div>

              {overtimeStats.total > 0 && (() => {
                const total = overtimeStats.workday + overtimeStats.holiday || 1;
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Tipe Lembur</p>
                    <div className="flex rounded-full overflow-hidden h-2 gap-px">
                      <div className="bg-indigo-400 transition-all" style={{ width: `${(overtimeStats.workday / total) * 100}%` }} />
                      <div className="bg-orange-400 transition-all" style={{ width: `${(overtimeStats.holiday / total) * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <p className="text-[11px] text-gray-500">Hari Kerja ({overtimeStats.workday})</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <p className="text-[11px] text-gray-500">Hari Libur ({overtimeStats.holiday})</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Attendance Correction */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={HiOutlinePencilAlt}>Koreksi Kehadiran</SectionTitle>
          {loadingCorrections ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} />)}</div>
          ) : (
            <>
              <div className="space-y-0">
                {[
                  { label: "Total Pengajuan",   value: correctionStats.total,    dot: "bg-gray-300"    },
                  { label: "Menunggu Approval", value: correctionStats.pending,  dot: "bg-amber-400"   },
                  { label: "Disetujui",         value: correctionStats.approved, dot: "bg-emerald-400" },
                  { label: "Ditolak",           value: correctionStats.rejected, dot: "bg-red-400"     },
                ].map(s => (
                  <StatusRow key={s.label} label={s.label} value={s.value} dot={s.dot} />
                ))}
              </div>

              {correctionStats.total > 0 && (() => {
                const rate = Math.round((correctionStats.approved / correctionStats.total) * 100);
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Approval Rate</p>
                      <p className="text-xs font-bold text-emerald-600">{rate}%</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
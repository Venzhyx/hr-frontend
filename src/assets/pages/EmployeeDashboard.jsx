// assets/pages/user/MyDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar,
  HiOutlineMoon,
  HiOutlinePencilAlt,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineSun,
} from "react-icons/hi";
import { useTimeOff } from "../../redux/hooks/useTimeOff";
import API from "../../ApiService/api";

const getLoggedInUser = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("hr_user");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 11) return { text: "Selamat Pagi",  Icon: HiOutlineSun  };
  if (h < 15) return { text: "Selamat Siang", Icon: HiOutlineSun  };
  if (h < 18) return { text: "Selamat Sore",  Icon: HiOutlineSun  };
  return       { text: "Selamat Malam", Icon: HiOutlineMoon };
};

const todayStr = () =>
  new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const statusColor = (s) => {
  const m = {
    APPROVED:  "bg-emerald-100 text-emerald-700",
    REJECTED:  "bg-red-100 text-red-700",
    SUBMITTED: "bg-amber-100 text-amber-700",
    PENDING:   "bg-amber-100 text-amber-700",
    ACTIVE:    "bg-emerald-100 text-emerald-700",
  };
  return m[s?.toUpperCase?.()] ?? "bg-gray-100 text-gray-500";
};

const statusLabel = (s) => {
  const m = {
    APPROVED:  "Disetujui",
    REJECTED:  "Ditolak",
    SUBMITTED: "Menunggu",
    PENDING:   "Menunggu",
    ACTIVE:    "Aktif",
  };
  return m[s?.toUpperCase?.()] ?? s ?? "-";
};

const fmtRupiah = (n) =>
  n != null
    ? new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", maximumFractionDigits: 0,
      }).format(n)
    : "-";

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const StatCard = ({ Icon, label, value, sub, accent, loading }) => (
  <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-10 ${accent}`} />
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${accent} bg-opacity-10`}>
      <Icon className="text-xl" />
    </div>
    {loading ? (
      <>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </>
    ) : (
      <>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value ?? "—"}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </>
    )}
  </div>
);

const Section = ({ title, Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
      <Icon className="text-gray-400 text-base" />
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Empty = ({ msg }) => (
  <p className="text-sm text-gray-400 text-center py-4">{msg}</p>
);

const MyDashboard = () => {
  const navigate = useNavigate();

  const loggedInUser = useMemo(() => getLoggedInUser(), []);
  const selfEmployeeId = useMemo(
    () => loggedInUser?.employeeId ?? loggedInUser?.id ?? null,
    [loggedInUser]
  );

  const { timeOffRequests, fetchTimeOffRequests } = useTimeOff();

  const [employee,       setEmployee]       = useState(null);
  const [attendance,     setAttendance]     = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [overtime,       setOvertime]       = useState([]);
  const [corrections,    setCorrections]    = useState([]);
  const [loadingEmp,     setLoadingEmp]     = useState(true);
  const [loadingStats,   setLoadingStats]   = useState(true);

  useEffect(() => {
    fetchTimeOffRequests().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownTimeOffs = useMemo(() => {
    const all = timeOffRequests || [];
    if (!selfEmployeeId) return [];
    return all
      .filter(
        (r) =>
          String(r.employeeId) === String(selfEmployeeId) ||
          String(r.userId)     === String(selfEmployeeId)
      )
      .slice(0, 4);
  }, [timeOffRequests, selfEmployeeId]);

  useEffect(() => {
    if (!selfEmployeeId) return;
    API.get(`/employees/${selfEmployeeId}`)
      .then((res) => setEmployee(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoadingEmp(false));
  }, [selfEmployeeId]);

  useEffect(() => {
    if (!selfEmployeeId) return;

    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    Promise.allSettled([
      API.get(`/attendances`, {
        params: { employeeId: selfEmployeeId, month: `${year}-${month}`, limit: 100 },
      }),
      API.get(`/reimbursements`, { params: { employeeId: selfEmployeeId, limit: 5 } }),
      API.get(`/overtimes`,      { params: { employeeId: selfEmployeeId, limit: 5 } }),
      API.get(`/attendance-corrections`, { params: { employeeId: selfEmployeeId, limit: 5 } }),
    ]).then(([att, rei, ot, cor]) => {
      if (att.status === "fulfilled") {
        const rows = att.value.data?.data ?? att.value.data ?? [];
        const list = Array.isArray(rows) ? rows : [];
        setAttendance({
          total: list.length,
          hadir: list.filter((r) => r.status === "PRESENT" || r.checkIn).length,
          telat: list.filter((r) => r.isLate || r.status === "LATE").length,
        });
      }
      if (rei.status === "fulfilled") {
        const rows = rei.value.data?.data ?? rei.value.data ?? [];
        setReimbursements(Array.isArray(rows) ? rows.slice(0, 4) : []);
      }
      if (ot.status === "fulfilled") {
        const rows = ot.value.data?.data ?? ot.value.data ?? [];
        setOvertime(Array.isArray(rows) ? rows.slice(0, 3) : []);
      }
      if (cor.status === "fulfilled") {
        const rows = cor.value.data?.data ?? cor.value.data ?? [];
        setCorrections(Array.isArray(rows) ? rows.slice(0, 3) : []);
      }
    }).finally(() => setLoadingStats(false));
  }, [selfEmployeeId]);

  const employeeName =
    employee?.name ?? employee?.fullName ??
    loggedInUser?.name ?? loggedInUser?.fullName ??
    loggedInUser?.username ?? "Karyawan";

  const firstName = employeeName.split(" ")[0];
  const { text: greetingText, Icon: GreetingIcon } = getGreeting();

  const now       = new Date();
  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const loadingTimeOff = loadingStats && ownTimeOffs.length === 0;

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-6">

      {/* Hero greeting */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl px-6 py-6 text-white overflow-hidden shadow-lg">
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 right-16 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">{todayStr()}</p>
            {loadingEmp ? (
              <>
                <Skeleton className="h-7 w-48 mt-1 bg-white/20" />
                <Skeleton className="h-4 w-32 mt-2 bg-white/10" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
                  <GreetingIcon className="opacity-80 text-2xl" />
                  {greetingText}, {firstName}!
                </h1>
                <p className="text-indigo-200 text-sm mt-1">
                  {employee?.position || employee?.jobTitle || employee?.department?.name
                    ? `${employee?.position ?? employee?.jobTitle ?? ""} ${
                        employee?.department?.name ? `· ${employee.department.name}` : ""
                      }`
                    : "Selamat datang di portal karyawan"}
                </p>
              </>
            )}
          </div>

          <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/30 bg-white/20">
            {employee?.photo
              ? <img src={employee.photo} alt={firstName} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">{firstName[0]?.toUpperCase() ?? "?"}</div>
            }
          </div>
        </div>

        {!loadingEmp && employee && (
          <div className="relative flex flex-wrap gap-2 mt-4">
            {employee.employeeCode && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                ID: {employee.employeeCode}
              </span>
            )}
            {employee.email && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full truncate max-w-[200px]">
                {employee.email}
              </span>
            )}
            {employee.status && (
              <span className="text-xs bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full font-medium">
                {employee.status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Ringkasan {monthName}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            Icon={HiOutlineCheckCircle} label="Hari Hadir" accent="bg-emerald-500"
            value={attendance?.hadir ?? "—"}
            sub={`dari ${attendance?.total ?? "—"} hari kerja`}
            loading={loadingStats}
          />
          <StatCard
            Icon={HiOutlineClock} label="Terlambat" accent="bg-amber-500"
            value={attendance?.telat ?? "—"}
            sub="kali bulan ini"
            loading={loadingStats}
          />
          <StatCard
            Icon={HiOutlineClipboardCheck} label="Pengajuan Cuti" accent="bg-violet-500"
            value={ownTimeOffs.length > 0 ? ownTimeOffs.length : "—"}
            sub="request terbaru"
            loading={loadingTimeOff}
          />
          <StatCard
            Icon={HiOutlineCurrencyDollar} label="Reimbursement" accent="bg-blue-500"
            value={reimbursements.length > 0 ? reimbursements.length : "—"}
            sub="request terbaru"
            loading={loadingStats}
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Section title="Cuti Terbaru" Icon={HiOutlineCalendar}>
          {loadingTimeOff ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : ownTimeOffs.length === 0 ? (
            <Empty msg="Belum ada pengajuan cuti" />
          ) : (
            <div className="space-y-2">
              {ownTimeOffs.map((t, i) => (
                <div key={t.id ?? i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {t.timeOffTypeName ?? t.timeOffType?.name ?? t.type ?? "Cuti"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.startDate
                        ? new Date(t.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                        : ""}
                      {t.endDate && t.startDate !== t.endDate
                        ? ` – ${new Date(t.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                        : t.startDate ? `, ${new Date(t.startDate).getFullYear()}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusColor(t.status)}`}>
                    {statusLabel(t.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Reimbursement Terbaru" Icon={HiOutlineCash}>
          {loadingStats ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : reimbursements.length === 0 ? (
            <Empty msg="Belum ada pengajuan reimbursement" />
          ) : (
            <div className="space-y-2">
              {reimbursements.map((r, i) => (
                <div key={r.id ?? i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title ?? "Reimbursement"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.category ?? ""}
                      {r.total ? ` · ${fmtRupiah(r.total)}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusColor(r.status)}`}>
                    {statusLabel(r.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Lembur Terbaru" Icon={HiOutlineMoon}>
          {loadingStats ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : overtime.length === 0 ? (
            <Empty msg="Belum ada data lembur" />
          ) : (
            <div className="space-y-2">
              {overtime.map((o, i) => (
                <div key={o.id ?? i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {o.date
                        ? new Date(o.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })
                        : "Lembur"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.startTime && o.endTime ? `${o.startTime} – ${o.endTime}` : o.duration ? `${o.duration} jam` : ""}
                      {o.reason ? ` · ${o.reason}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusColor(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Koreksi Absensi Terbaru" Icon={HiOutlinePencilAlt}>
          {loadingStats ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : corrections.length === 0 ? (
            <Empty msg="Belum ada koreksi absensi" />
          ) : (
            <div className="space-y-2">
              {corrections.map((c, i) => (
                <div key={c.id ?? i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.date
                        ? new Date(c.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })
                        : "Koreksi"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.type ?? c.correctionType ?? ""}
                      {c.reason ? ` · ${c.reason}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusColor(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
};

export default MyDashboard;

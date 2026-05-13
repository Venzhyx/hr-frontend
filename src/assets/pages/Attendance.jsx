import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  HiOutlineXCircle, HiOutlineCalendar, HiOutlineUser, HiOutlineOfficeBuilding,
  HiOutlineSearch, HiOutlineChevronDown, HiOutlineRefresh,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineInformationCircle,
  HiOutlineDotsVertical, HiOutlineClipboardList, HiOutlineClock,
  HiOutlineFingerPrint, HiOutlineLogout,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useAttendance }         from "../../redux/hooks/useAttendance";
import { useOvertime }           from "../../redux/hooks/useOvertime";
import { useAttendanceSettings } from "../../redux/hooks/useAttendanceSettings";
import CheckInModal  from "./CheckInModal";
import CheckOutModal from "./CheckOutModal";

const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthFull   = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const weekDays    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const getDate   = (att) => att.date;
const getStatus = (att) => att.status?.toUpperCase();

const fmtTime = (t) => {
  if (!t) return "-";
  const d = new Date(t);
  if (isNaN(d)) return "-";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

// ─── Helper: apakah sekarang sudah melewati jam checkOutTime? ─────────────────
const parseHHmm = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hour: h, minute: m };
};

const isAfterCheckout = (checkOutTimeStr) => {
  const parsed = parseHHmm(checkOutTimeStr);
  if (!parsed) return false;
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(parsed.hour, parsed.minute, 0, 0);
  return now >= cutoff;
};

// ─── Status Icon ──────────────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === "PRESENT") return (
    <span className="inline-flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0">
      <svg width="6" height="6" sm:width="8" sm:height="8" viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  if (status === "ABSENT") return (
    <span className="inline-flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 flex-shrink-0">
      <svg width="6" height="6" sm:width="8" sm:height="8" viewBox="0 0 10 10" fill="none">
        <path d="M3 3l4 4M7 3l-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </span>
  );
  if (status === "LATE") return (
    <span className="inline-flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 flex-shrink-0">
      <svg width="6" height="6" sm:width="8" sm:height="8" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="white" strokeWidth="1.2"/>
        <path d="M5 3.5V5l1 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  return null;
};

const statusLabel = (status) => {
  if (status === "PRESENT") return "Attend";
  if (status === "ABSENT")  return "Non Present";
  if (status === "LATE")    return "Late";
  return "";
};

// ─── Employee Dropdown (Responsive) ───────────────────────────────────────────
const EmployeeDropdown = ({ employees, loadingEmployees, selectedEmployee, onChange }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); }
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
    <div className="relative w-full sm:w-64 md:w-72" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <HiOutlineUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedEmployee ? (
            <span className="truncate text-gray-800 font-medium text-xs sm:text-sm">
              {selectedEmployee.name}
              <span className="hidden sm:inline ml-1.5 text-gray-400 font-normal font-mono text-xs">
                ({selectedEmployee.employeeIdentificationNumber})
              </span>
            </span>
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm">
              {loadingEmployees ? "Memuat..." : "Pilih karyawan"}
            </span>
          )}
        </div>
        <HiOutlineChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-lg">
              <HiOutlineSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Cari nama atau NIK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-48 sm:max-h-56 overflow-y-auto">
            {loadingEmployees ? (
              <li className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 text-center">Memuat...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 text-center">Tidak ditemukan</li>
            ) : filtered.map((emp) => {
              const isActive = emp.id === selectedEmployee?.id;
              return (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(emp); setOpen(false); setSearch(""); }}
                    className={`w-full text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-indigo-50 transition-colors ${isActive ? "bg-indigo-50" : ""}`}
                  >
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {emp.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm font-medium truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>{emp.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 font-mono truncate">
                        {emp.employeeIdentificationNumber}
                        {emp.departmentName && ` · ${emp.departmentName}`}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Attendance Summary Card (Responsive) ─────────────────────────────────────
const AttendanceSummary = ({ present, absent, late }) => {
  const items = [
    {
      label: "Present",
      value: String(present).padStart(2, "0"),
      bg: "bg-green-600",
      icon: (
        <svg width="14" height="14" sm:width="18" sm:height="18" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="white" strokeWidth="1.5"/>
          <path d="M7 2v4M13 2v4M3 8h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6.5 12l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Absents",
      value: String(absent).padStart(2, "0"),
      bg: "bg-red-500",
      icon: (
        <svg width="14" height="14" sm:width="18" sm:height="18" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="white" strokeWidth="1.5"/>
          <path d="M7 2v4M13 2v4M3 8h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 12l6 4M13 12l-6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Lates",
      value: String(late).padStart(2, "0"),
      bg: "bg-amber-500",
      icon: (
        <svg width="14" height="14" sm:width="18" sm:height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="11" r="6" stroke="white" strokeWidth="1.5"/>
          <path d="M10 8v3l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 3h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-gray-100 flex items-center gap-2">
        <h2 className="text-xs sm:text-sm font-semibold text-gray-800">Attendance Summary</h2>
        <HiOutlineInformationCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-100 h-[calc(100%-41px)]">
        {items.map(({ label, value, bg, icon }) => (
          <div key={label} className="flex flex-col items-center justify-center py-3 sm:py-4 px-1 sm:px-2">
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${bg} flex items-center justify-center mb-1 sm:mb-2`}>
              {icon}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-base sm:text-xl font-bold text-gray-800 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Activity Heatmap (Responsive) ────────────────────────────────────────────
const ActivityHeatmap = ({ attendances, selectedYear, setSelectedYear, availableYears }) => {
  const statusMap = useMemo(() => {
    const map = {};
    attendances.forEach((att) => {
      const d = att.date;
      if (d) map[d] = att.status?.toUpperCase();
    });
    return map;
  }, [attendances]);

  const { weeks, monthPositions } = useMemo(() => {
    const cursor = new Date(selectedYear, 0, 1);
    const dow = cursor.getDay();
    cursor.setDate(cursor.getDate() + (dow === 0 ? -6 : 1 - dow));

    const endDate = new Date(selectedYear, 11, 31);
    const weeks = [];
    while (cursor <= endDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split("T")[0];
        const inRange = cursor.getFullYear() === selectedYear;
        week.push({ dateStr, status: inRange ? (statusMap[dateStr] || null) : null, inRange });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthPositions = {};
    weeks.forEach((wk, wi) => {
      wk.forEach((day) => {
        if (!day.inRange) return;
        const mm = parseInt(day.dateStr.split("-")[1]) - 1;
        if (monthPositions[mm] === undefined) monthPositions[mm] = wi;
      });
    });

    return { weeks, monthPositions };
  }, [statusMap, selectedYear]);

  const totalWeeks = weeks.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800">Activity</h2>
          <p className="hidden sm:block text-xs text-gray-400 mt-0.5">Hover untuk lihat tanggal & status</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
            {[
              { color: "bg-green-500",  label: "Hadir" },
              { color: "bg-yellow-400", label: "Terlambat" },
              { color: "bg-red-400",    label: "Absen" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm ${color}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(+e.target.value)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 border border-gray-300 rounded-lg text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4 overflow-x-auto">
        <div className="flex" style={{ paddingLeft: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`, gap: "2px sm:gap-3px", width: "100%", minWidth: `${totalWeeks * 10}px` }}>
            {weeks.map((_, wi) => {
              const entry = Object.entries(monthPositions).find(([, v]) => v === wi);
              return (
                <div key={wi} className="text-[8px] sm:text-xs text-gray-400 overflow-visible whitespace-nowrap">
                  {entry ? monthLabels[+entry[0]] : ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex" style={{ minWidth: `${totalWeeks * 10 + 24}px` }}>
          <div className="flex flex-col flex-shrink-0" style={{ width: "24px", gap: "2px", paddingTop: "2px" }}>
            {weekDays.map((d) => (
              <div key={d} className="text-gray-400 text-right pr-1 text-[8px] sm:text-[10px]" style={{ height: "11px", lineHeight: "11px", sm: { height: "14px", lineHeight: "14px" } }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`, gap: "2px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: "2px" }}>
                {week.map((day, di) => {
                  if (!day.inRange) return <div key={di} style={{ height: "11px" }} />;
                  const colorClass = day.status === "PRESENT"
                    ? "bg-green-500 hover:bg-green-600"
                    : day.status === "LATE"
                    ? "bg-yellow-400 hover:bg-yellow-500"
                    : day.status === "ABSENT"
                    ? "bg-red-400 hover:bg-red-500"
                    : "bg-gray-100 hover:bg-gray-200";

                  const sLabel = day.status === "PRESENT" ? "Hadir"
                    : day.status === "LATE" ? "Terlambat"
                    : day.status === "ABSENT" ? "Tidak Hadir"
                    : "Tidak ada data";

                  return (
                    <div key={di} className={`rounded-sm cursor-pointer group relative transition-colors ${colorClass}`} style={{ height: "11px" }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity text-[9px] sm:text-[11px]">
                        {day.dateStr} · {sLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Date Context Menu ────────────────────────────────────────────────────────
const DateContextMenu = ({ dateStr, attendanceData, selectedEmployee, onClose, onNavigate }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  const handleCorrection = () => {
    onClose();
    onNavigate("/attendance/correction", {
      state: { selectedDate: dateStr, attendanceData: attendanceData || null, employeeId: selectedEmployee?.id ?? null, employeeName: selectedEmployee?.name ?? null, openModal: true, action: "correction" },
    });
  };

  const handleOvertime = () => {
    onClose();
    onNavigate("/attendance/overtime", {
      state: { selectedDate: dateStr, attendanceData: attendanceData || null, employeeId: selectedEmployee?.id ?? null, employeeName: selectedEmployee?.name ?? null, openModal: true, action: "overtime" },
    });
  };

  return (
    <div ref={menuRef} className="absolute top-6 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden" style={{ minWidth: "160px sm:min-w-180px" }} onClick={(e) => e.stopPropagation()}>
      <button onClick={handleCorrection} className="w-full flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <HiOutlineClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
        Attendance correction
      </button>
      <div className="border-t border-gray-100" />
      <button onClick={handleOvertime} className="w-full flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <HiOutlineClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
        Overtime
      </button>
    </div>
  );
};

// ─── Check-in/out Popover ─────────────────────────────────────────────────────
const TimePopover = ({ att, status }) => {
  if (!att?.checkIn && !att?.checkOut) return null;
  return (
    <div className="absolute bottom-full left-0 mb-1 z-30 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg whitespace-nowrap opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-opacity shadow-xl text-[9px] sm:text-[11px]">
      <p className="font-semibold mb-0.5 text-[9px] sm:text-[11px]">
        {status === "PRESENT" ? "Attend" : status === "LATE" ? "Late" : status === "ABSENT" ? "Non Present" : ""}
      </p>
      {att?.checkIn  && <p className="text-gray-300">Masuk: {fmtTime(att.checkIn)}</p>}
      {att?.checkOut && <p className="text-gray-300">Keluar: {fmtTime(att.checkOut)}</p>}
    </div>
  );
};

// ─── Monthly Calendar (Responsive) ────────────────────────────────────────────
const MonthCalendar = ({ year, month, attendanceMap, overtimeMap, onNavigate, selectedEmployee }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const today       = new Date();
  const firstDay    = new Date(year, month, 1);
  const startDow    = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getDayAtt      = (day) => { if (!day) return null; const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return attendanceMap[ds] || null; };
  const getDayOvertime = (day) => { if (!day) return null; const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return overtimeMap?.[ds] || null; };
  const isToday        = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const isWeekend      = (idx) => idx % 7 === 5 || idx % 7 === 6;
  const getDateStr     = (day) => `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-xs sm:text-sm font-semibold text-gray-700">{monthFull[month]} {year}</p>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100 min-w-[280px]">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
          <div key={d} className={`text-left text-[10px] sm:text-xs font-semibold px-1 sm:px-3 py-1.5 sm:py-2 border-r border-gray-100 last:border-r-0 ${i >= 5 ? "text-orange-400" : "text-gray-500"}`}>{d}</div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className={`grid grid-cols-7 min-w-[280px] ${ri < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
          {row.map((day, ci) => {
            const att        = getDayAtt(day);
            const overtime   = getDayOvertime(day);
            const status     = att?.status?.toUpperCase();
            const today_     = isToday(day);
            const weekend    = isWeekend(ci);
            const dateStr    = day ? getDateStr(day) : null;
            const isMenuOpen = openMenu === dateStr;

            return (
              <div key={ci} className={`group/cell min-h-[56px] sm:min-h-[68px] px-1 sm:px-2 py-1.5 sm:py-2 border-r border-gray-100 last:border-r-0 relative ${!day ? "bg-gray-50/50" : ""} ${weekend && day ? "bg-orange-50/30" : ""}`}>
                {day && (
                  <>
                    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
                      <span className={`text-xs sm:text-sm font-medium inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 ${today_ ? "bg-indigo-600 text-white" : weekend ? "text-orange-400" : "text-gray-600"}`}>
                        {day}
                      </span>
                      {status ? (
                        <>
                          <StatusIcon status={status} />
                          <span className={`text-[9px] sm:text-xs font-medium ${status === "PRESENT" ? "text-green-700" : status === "ABSENT" ? "text-red-600" : "text-yellow-600"}`}>
                            {statusLabel(status)}
                          </span>
                        </>
                      ) : weekend ? (
                        <span className="text-[8px] sm:text-xs text-orange-300">Weekend</span>
                      ) : null}

                      {overtime && overtime.status === "APPROVED" && (
                        <div className="relative group flex items-center gap-0.5 sm:gap-1 ml-0.5 sm:ml-1">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full" />
                          <span className="text-[8px] sm:text-xs text-blue-600 font-medium">Overtime</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-900 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity text-[9px] sm:text-[11px]">
                            {overtime.startTime && overtime.endTime ? `${fmtTime(overtime.startTime)} - ${fmtTime(overtime.endTime)}` : `${overtime.duration || 0} jam`}
                          </div>
                        </div>
                      )}
                    </div>

                    {att && (att.checkIn || att.checkOut) && <TimePopover att={att} status={status} />}

                    <div className="absolute top-0.5 sm:top-1.5 right-0.5 sm:right-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(isMenuOpen ? null : dateStr); }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-md transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${isMenuOpen ? "bg-gray-100 text-gray-600" : ""}`}
                      >
                        <HiOutlineDotsVertical className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      </button>
                      {isMenuOpen && (
                        <DateContextMenu dateStr={dateStr} attendanceData={att} selectedEmployee={selectedEmployee} onClose={() => setOpenMenu(null)} onNavigate={onNavigate} />
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceDashboard = () => {
  const navigate = useNavigate();
  const {
    attendances, loading, error, employees, loadingEmployees,
    loadEmployees, loadAttendance, dismissError, resetAttendance,
  } = useAttendance();

  const { overtimes, fetchOvertimes }       = useOvertime({ role: "admin" });
  const { settings, fetchSettings }         = useAttendanceSettings();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedYear, setSelectedYear]         = useState(new Date().getFullYear());
  const [calPage, setCalPage]                   = useState(0);
  const [showCheckIn, setShowCheckIn]           = useState(false);
  const [showCheckOut, setShowCheckOut]         = useState(false);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { loadEmployees(); }, []);

  useEffect(() => {
    if (selectedEmployee?.id) {
      loadAttendance(selectedEmployee.id);
      fetchOvertimes();
    } else {
      resetAttendance();
    }
  }, [selectedEmployee]);

  useEffect(() => { setCalPage(0); }, [selectedEmployee]);

  const isCheckoutTime = useMemo(
    () => isAfterCheckout(settings?.checkOutTime ?? "17:00:00"),
    [settings?.checkOutTime, Math.floor(Date.now() / 60000)]
  );

  const checkInLabel  = (settings?.checkInTime  ?? "08:00:00").slice(0, 5);
  const checkOutLabel = (settings?.checkOutTime ?? "17:00:00").slice(0, 5);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendances.forEach((att) => { const d = getDate(att); if (d) map[d] = att; });
    return map;
  }, [attendances]);

  const overtimeMap = useMemo(() => {
    const map = {};
    (overtimes || []).forEach((ot) => { if (ot.status === "APPROVED" && ot.date) map[ot.date] = ot; });
    return map;
  }, [overtimes]);

  const availableMonths = useMemo(() => {
    if (!attendances.length) return [];
    const set = new Set();
    attendances.forEach((att) => { const d = getDate(att); if (d) set.add(d.slice(0, 7)); });
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [attendances]);

  const MONTHS_PER_PAGE = 1;
  const pagedMonths = useMemo(() => {
    const start = calPage * MONTHS_PER_PAGE;
    return availableMonths.slice(start, start + MONTHS_PER_PAGE);
  }, [availableMonths, calPage]);
  const totalPages = Math.ceil(availableMonths.length / MONTHS_PER_PAGE);

  const summary = useMemo(() => ({
    present: attendances.filter((a) => getStatus(a) === "PRESENT").length,
    late:    attendances.filter((a) => getStatus(a) === "LATE").length,
    absent:  attendances.filter((a) => getStatus(a) === "ABSENT").length,
  }), [attendances]);

  const availableYears = useMemo(() => {
    const years = attendances.map((a) => new Date(getDate(a)).getFullYear()).filter((y) => !isNaN(y));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [attendances]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 sm:h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">Memuat data absensi...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 sm:h-96">
      <div className="text-center max-w-xs sm:max-w-md px-4">
        <HiOutlineXCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-red-600 font-medium text-sm sm:text-base mb-2">{error}</p>
        <button onClick={dismissError} className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs sm:text-sm">Tutup</button>
      </div>
    </div>
  );

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 bg-gray-50 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              Dashboard Absensi
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              Jam kerja: {checkInLabel} – {checkOutLabel} (Senin – Jumat)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <EmployeeDropdown
              employees={employees}
              loadingEmployees={loadingEmployees}
              selectedEmployee={selectedEmployee}
              onChange={setSelectedEmployee}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => selectedEmployee?.id && loadAttendance(selectedEmployee.id)}
                disabled={!selectedEmployee}
                className="p-2 sm:p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-40 transition-colors flex-shrink-0"
                title="Refresh"
              >
                <HiOutlineRefresh className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {isCheckoutTime ? (
                <button
                  onClick={() => { if (selectedEmployee?.id) setShowCheckOut(true); }}
                  disabled={!selectedEmployee}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <HiOutlineLogout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Check-out</span>
                </button>
              ) : (
                <button
                  onClick={() => { if (selectedEmployee?.id) setShowCheckIn(true); }}
                  disabled={!selectedEmployee}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <HiOutlineFingerPrint className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Absen Hari Ini</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedEmployee && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 rounded-lg">
              <HiOutlineUser className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
              <span className="font-medium text-indigo-700 text-xs sm:text-sm">{selectedEmployee.name}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg text-gray-500 text-[10px] sm:text-xs">
              NIK: <span className="font-mono text-gray-700 ml-0.5 sm:ml-1">{selectedEmployee.employeeIdentificationNumber}</span>
            </div>
            {selectedEmployee.departmentName && (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg text-gray-700 text-[10px] sm:text-xs">
                <HiOutlineOfficeBuilding className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                {selectedEmployee.departmentName}
              </div>
            )}
            {selectedEmployee.jobTitle && (
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg text-gray-700 text-[10px] sm:text-xs">{selectedEmployee.jobTitle}</div>
            )}
          </div>
        )}

        {!selectedEmployee && (
          <p className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-400">
            Pilih karyawan dari dropdown untuk melihat data absensi.
          </p>
        )}
      </div>

      {attendances.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 items-stretch">
            <AttendanceSummary present={summary.present} absent={summary.absent} late={summary.late} />
            <ActivityHeatmap
              attendances={attendances}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              availableYears={availableYears}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">Absensi Bulanan</h2>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Klik titik tiga pada tanggal untuk koreksi atau lembur</p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalPage((p) => Math.min(p + 1, totalPages - 1))} disabled={calPage >= totalPages - 1} className="p-1 sm:p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                    <HiOutlineChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  </button>
                  <span className="text-[11px] sm:text-xs text-gray-500 min-w-[90px] sm:min-w-[100px] text-center">
                    {pagedMonths[0] ? (() => { const [y,m] = pagedMonths[0].split("-"); return `${monthFull[+m-1]} ${y}`; })() : ""}
                  </span>
                  <button onClick={() => setCalPage((p) => Math.max(p - 1, 0))} disabled={calPage <= 0} className="p-1 sm:p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                    <HiOutlineChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-6">
              {pagedMonths.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-xs sm:text-sm">Tidak ada data</p>
              ) : (
                <div className="space-y-4 sm:space-y-6 overflow-x-auto">
                  {pagedMonths.map((ym) => {
                    const [y, m] = ym.split("-").map(Number);
                    return <MonthCalendar key={ym} year={y} month={m - 1} attendanceMap={attendanceMap} overtimeMap={overtimeMap} onNavigate={navigate} selectedEmployee={selectedEmployee} />;
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {attendances.length === 0 && !loading && selectedEmployee && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <HiOutlineCalendar className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-1">Tidak Ada Data Absensi</h3>
          <p className="text-xs sm:text-sm text-gray-400">
            Belum ada catatan absensi untuk <span className="font-medium">{selectedEmployee.name}</span>.
          </p>
        </div>
      )}

      <p className="text-center text-[10px] sm:text-xs text-gray-400 pt-3 sm:pt-4 border-t border-gray-200">
        {selectedEmployee
          ? `Data absensi: ${selectedEmployee.name} (${selectedEmployee.employeeIdentificationNumber}) · Jam kerja: ${checkInLabel} – ${checkOutLabel}`
          : "Pilih karyawan dari dropdown untuk melihat data absensi"}
      </p>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CheckInModal
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        employee={selectedEmployee}
        onSuccess={() => {
          setShowCheckIn(false);
          if (selectedEmployee?.id) loadAttendance(selectedEmployee.id);
        }}
      />
      <CheckOutModal
        isOpen={showCheckOut}
        onClose={() => setShowCheckOut(false)}
        employee={selectedEmployee}
        onSuccess={() => {
          setShowCheckOut(false);
          if (selectedEmployee?.id) loadAttendance(selectedEmployee.id);
        }}
      />
    </div>
  );
};

export default AttendanceDashboard;
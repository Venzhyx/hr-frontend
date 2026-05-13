import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HiOutlineBell, HiOutlineMenu,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReimbursement } from '../../redux/hooks/useReimbursement';
import { useTimeOff } from '../../redux/hooks/useTimeOff';

// ─── Route Titles ─────────────────────────────────────────────────────────────

const ROUTE_TITLES = {
  '/':                        { title: 'Dashboard',              sub: 'Selamat datang kembali' },
  '/dashboard':               { title: 'Dashboard',              sub: 'Ringkasan aktivitas perusahaan' },
  '/settings':                { title: 'Settings',               sub: 'Pengaturan aplikasi' },
  '/profile':                 { title: 'My Profile',             sub: 'Informasi akun Anda' },
  '/help':                    { title: 'Help & Support',         sub: 'Pusat bantuan & dokumentasi' },
  '/account':                 { title: 'Account',                sub: 'Informasi akun & keuangan' },
  '/employees':               { title: 'Employees',              sub: 'Manajemen data karyawan' },
  '/employees/add':           { title: 'Add Employee',           sub: 'Tambah karyawan baru' },
  '/departments':             { title: 'Departments',            sub: 'Struktur departemen' },
  '/departments/add':         { title: 'Add Department',         sub: 'Buat departemen baru' },
  '/companies':               { title: 'Company',                sub: 'Data & profil perusahaan' },
  '/companies/add':           { title: 'Add Company',            sub: 'Daftarkan perusahaan baru' },
  '/attendance':              { title: 'Attendance',             sub: 'Rekap kehadiran karyawan' },
  '/attendance/correction':   { title: 'Attendance Correction',  sub: 'Koreksi data kehadiran karyawan' },
  '/attendance/overtime':     { title: 'Overtime',               sub: 'Manajemen lembur karyawan' },
  '/time-off':                { title: 'Time Off',               sub: 'Pengajuan & persetujuan cuti' },
  '/time-off/add':            { title: 'New Time Off',           sub: 'Ajukan permintaan cuti baru' },
  '/payroll':                 { title: 'Payroll',                sub: 'Penggajian & slip gaji' },
  '/reimbursements':          { title: 'Reimbursement',          sub: 'Klaim & penggantian biaya' },
  '/reimbursements/add':      { title: 'New Reimbursement',      sub: 'Ajukan klaim biaya baru' },
  '/approvals':               { title: 'Approvals',              sub: 'Manajemen persetujuan' },
  '/approvals/reimbursement': { title: 'Reimbursement Approval', sub: 'Review klaim biaya karyawan' },
  '/approvals/timeoff':       { title: 'Time Off Approval',      sub: 'Review pengajuan cuti karyawan' },
  '/approvals/attendance':    { title: 'Attendance Approval',    sub: 'Review koreksi kehadiran' },
};

const getRouteInfo = (pathname) => {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  if (/^\/employees\/[^/]+\/edit$/.test(pathname))          return { title: 'Edit Employee',          sub: 'Ubah data karyawan' };
  if (/^\/employees\/[^/]+$/.test(pathname))                return { title: 'Employee Detail',        sub: 'Detail informasi karyawan' };
  if (/^\/departments\/[^/]+\/edit$/.test(pathname))        return { title: 'Edit Department',        sub: 'Ubah data departemen' };
  if (/^\/departments\/[^/]+$/.test(pathname))              return { title: 'Department Detail',      sub: 'Detail informasi departemen' };
  if (/^\/companies\/[^/]+\/edit$/.test(pathname))          return { title: 'Edit Company',           sub: 'Ubah data perusahaan' };
  if (/^\/companies\/[^/]+$/.test(pathname))                return { title: 'Company Detail',         sub: 'Detail informasi perusahaan' };
  if (/^\/attendance\/correction\/[^/]+\/edit$/.test(pathname)) return { title: 'Edit Correction',   sub: 'Ubah data koreksi kehadiran' };
  if (/^\/attendance\/correction\/[^/]+$/.test(pathname))   return { title: 'Correction Detail',     sub: 'Detail koreksi kehadiran' };
  if (/^\/attendance\/overtime\/[^/]+\/edit$/.test(pathname))   return { title: 'Edit Overtime',     sub: 'Ubah data lembur' };
  if (/^\/attendance\/overtime\/[^/]+$/.test(pathname))     return { title: 'Overtime Detail',       sub: 'Detail lembur karyawan' };
  if (/^\/attendance\/[^/]+\/edit$/.test(pathname))         return { title: 'Edit Attendance',        sub: 'Koreksi data kehadiran' };
  if (/^\/attendance\/[^/]+$/.test(pathname))               return { title: 'Attendance Detail',      sub: 'Detail kehadiran karyawan' };
  if (/^\/time-off\/[^/]+\/edit$/.test(pathname))           return { title: 'Edit Time Off',          sub: 'Ubah pengajuan cuti' };
  if (/^\/time-off\/[^/]+$/.test(pathname))                 return { title: 'Time Off Detail',        sub: 'Detail pengajuan cuti' };
  if (/^\/payroll\/[^/]+\/edit$/.test(pathname))            return { title: 'Edit Payroll',           sub: 'Ubah data penggajian' };
  if (/^\/payroll\/[^/]+$/.test(pathname))                  return { title: 'Payroll Detail',         sub: 'Detail slip gaji karyawan' };
  if (/^\/reimbursements\/[^/]+\/edit$/.test(pathname))     return { title: 'Edit Reimbursement',     sub: 'Ubah klaim biaya' };
  if (/^\/reimbursements\/[^/]+$/.test(pathname))           return { title: 'Reimbursement Detail',   sub: 'Detail klaim biaya' };
  if (/^\/approvals\/reimbursement\/[^/]+$/.test(pathname)) return { title: 'Reimbursement Approval', sub: 'Review klaim biaya karyawan' };
  if (/^\/approvals\/timeoff\/[^/]+$/.test(pathname))       return { title: 'Time Off Approval',      sub: 'Review pengajuan cuti karyawan' };
  if (/^\/approvals\/attendance\/[^/]+$/.test(pathname))    return { title: 'Attendance Approval',    sub: 'Review koreksi kehadiran' };

  return { title: 'HR Management', sub: '' };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NEEDS_REVIEW_STATUSES = ['SUBMITTED', 'PENDING'];

const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const relativeTime = (isoString) => {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)    return 'Baru saja';
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapReimbursementToNotif = (item) => ({
  id:       `rb-${item.id}`,
  type:     'reimbursement',
  title:    'Pengajuan Reimbursement',
  message:  `${item.employeeName} mengajukan klaim Rp ${Number(item.total).toLocaleString('id-ID')} untuk ${item.category}${item.title ? ` — ${item.title}` : ''}.`,
  time:     item.createdAt ?? '',
  read:     false,
  _link:    `/approvals/reimbursement/${item.id}`,
  _rawDate: new Date(item.createdAt ?? 0).getTime(),
});

const mapTimeOffToNotif = (item) => ({
  id:       `to-${item.id}`,
  type:     'timeoff',
  title:    'Pengajuan Cuti',
  message:  `${item.employeeName} mengajukan ${item.timeOffTypeName} ${item.requested} hari mulai ${item.startDate}.`,
  time:     item.createdAt ?? '',
  read:     false,
  _link:    `/approvals/timeoff/${item.id}`,
  _rawDate: new Date(item.createdAt ?? 0).getTime(),
});

// ─── Icons ────────────────────────────────────────────────────────────────────

const TimeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ReimbursementIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const navigate  = useNavigate();

  const { reimbursements }  = useReimbursement();
  const { timeOffRequests } = useTimeOff();

  const [currentDate,       setCurrentDate]       = useState('');
  const [routeInfo,         setRouteInfo]         = useState({ title: '', sub: '' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled,        setIsScrolled]        = useState(false);
  const [animateTitle,      setAnimateTitle]      = useState(false);
  const [readIds,           setReadIds]           = useState(() => new Set());

  const notifRef  = useRef(null);
  const buttonRef = useRef(null);

  const notifications = useMemo(() => {
    const pending = [
      ...(reimbursements  || [])
        .filter(r => NEEDS_REVIEW_STATUSES.includes(r.status))
        .map(mapReimbursementToNotif),
      ...(timeOffRequests || [])
        .filter(t => NEEDS_REVIEW_STATUSES.includes(t.status))
        .map(mapTimeOffToNotif),
    ];

    pending.sort((a, b) => (b._rawDate ?? 0) - (a._rawDate ?? 0));

    return pending.map(n => ({ ...n, read: readIds.has(n.id) }));
  }, [reimbursements, timeOffRequests, readIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  useEffect(() => {
    setAnimateTitle(false);
    const t = setTimeout(() => {
      setRouteInfo(getRouteInfo(location.pathname));
      setAnimateTitle(true);
    }, 60);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        notifRef.current  && !notifRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    setReadIds(prev => new Set([...prev, notif.id]));
    if (notif._link) {
      setShowNotifications(false);
      navigate(notif._link);
    }
  };

  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));
  const clearAll    = () => setReadIds(new Set(notifications.map(n => n.id)));

  return (
    <>
      <nav className={`relative top-0 right-0 left-0  h-16 sm:h-20 z-30 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20'
          : 'bg-white border-b border-gray-200 shadow-sm'
      }`}>
        <div className="h-full px-3 sm:px-5 lg:px-8 flex items-center justify-between">

          {/* LEFT — title area */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <HiOutlineMenu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            {/* Title Section */}
            <div className={`transition-all duration-300 ${animateTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              {/* Title - selalu tampil */}
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">
                {routeInfo.title}
              </h2>
              
              {/* Subtitle & Date - Desktop (lg) */}
              <div className="hidden lg:flex items-center gap-2 mt-0.5">
                <HiOutlineOfficeBuilding className="w-3 h-3 text-indigo-400" />
                <p className="text-xs text-gray-400">{routeInfo.sub}</p>
                <span className="text-gray-300">·</span>
                <p className="text-xs text-gray-400">{currentDate}</p>
              </div>
              
              {/* Subtitle & Date - Mobile & Tablet (simplified) */}
              <div className="flex lg:hidden items-center gap-1 mt-0.5">
                <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                  {routeInfo.sub}
                </p>
                <span className="text-gray-300 text-[10px] sm:text-xs">·</span>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                  {currentDate.split(',')[0]}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Notifications Bell */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            <button
              ref={buttonRef}
              onClick={() => setShowNotifications(prev => !prev)}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${
                showNotifications
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              aria-label="Notifications"
            >
              <HiOutlineBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown - Responsive width */}
            {showNotifications && (
              <div
                ref={notifRef}
                className="absolute top-full right-0 mt-2 sm:mt-3 w-[85vw] max-w-[20rem] sm:w-[22rem] rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50 bg-white"
                style={{ animation: 'slideDown 0.2s ease' }}
              >
                {/* Header */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Notifikasi</h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                      Approval menunggu review
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-600 text-[9px] sm:text-[10px] font-semibold rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>

                {/* Bulk actions */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100">
                    <button 
                      onClick={markAllRead} 
                      className="text-[10px] sm:text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Tandai semua dibaca
                    </button>
                    <button 
                      onClick={clearAll} 
                      className="text-[10px] sm:text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Tutup semua
                    </button>
                  </div>
                )}

                {/* List */}
                <div className="max-h-[20rem] sm:max-h-[26rem] overflow-y-auto divide-y divide-gray-50">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                          !notif.read ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-sm ${
                          notif.type === 'timeoff' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {notif.type === 'timeoff' ? <TimeOffIcon /> : <ReimbursementIcon />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-[11px] sm:text-xs font-semibold leading-snug ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className={`flex-shrink-0 mt-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                notif.type === 'timeoff' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                            {relativeTime(notif.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 sm:py-12 flex flex-col items-center text-gray-400">
                      <HiOutlineBell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-200 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm font-medium">Tidak ada pengajuan</p>
                      <p className="text-[10px] sm:text-xs text-gray-300 mt-1">Semua approval sudah diproses</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                    <button
                      onClick={() => { navigate('/approvals'); setShowNotifications(false); }}
                      className="text-[11px] sm:text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Lihat semua approval →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .animate-bounce {
          animation: bounce 0.5s ease-in-out 2;
        }
      `}</style>
    </>
  );
};

export default Navbar;
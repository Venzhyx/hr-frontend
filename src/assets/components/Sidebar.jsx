import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptRefund,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineClipboardCheck,
  HiOutlineLibrary,
  HiOutlinePencilAlt,
  HiOutlineClipboard,
  HiOutlineX,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import companyLogo from '../images/ABE.png';
import { useReimbursement } from '../../redux/hooks/useReimbursement';
import { useTimeOff } from '../../redux/hooks/useTimeOff';
import { useAttendanceCorrection } from '../../redux/hooks/useAttendanceCorrection';
import { useOvertime } from '../../redux/hooks/useOvertime';
import API from '../../ApiService/api';

const NEEDS_REVIEW_STATUSES = ['submitted', 'pending'];

const Sidebar = ({ toggleSidebar }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();

  // ── Auth user dari Redux / localStorage ──────────────────────────────────
  const user         = useSelector((s) => s.auth.user)
                       || JSON.parse(localStorage.getItem('hr_user') || '{}');
  const userRole     = user?.role;
  const selfEmpId    = user?.employeeId ?? user?.id ?? null;

  // ── Data employee dari API ────────────────────────────────────────────────
  const [employee, setEmployee] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!selfEmpId) return;
    API.get(`/employees/${selfEmpId}`)
      .then((res) => {
        setEmployee(res.data?.data ?? res.data);
        setImgError(false);
      })
      .catch(() => {});
  }, [selfEmpId]);

  // Nama: utamakan dari data employee, fallback ke auth
  const displayName = employee?.name
    ?? employee?.fullName
    ?? user?.name
    ?? user?.fullName
    ?? user?.username
    ?? 'User';

  // Jabatan: posisi / jobTitle / nama departemen, fallback ke role auth
  const displayPosition = employee?.position
    ?? employee?.jobTitle
    ?? employee?.department?.name
    ?? userRole
    ?? '';

  // Foto profil dari data employee
  const photoUrl = employee?.photo ?? employee?.avatar ?? employee?.profilePicture ?? null;

  // Inisial fallback
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── State UI ──────────────────────────────────────────────────────────────
  const [isProfileMenuOpen,  setIsProfileMenuOpen]  = useState(false);
  const [isAttendanceOpen,   setIsAttendanceOpen]   = useState(false);

  // ── Badge approval (admin only) ───────────────────────────────────────────
  const { reimbursements,  fetchReimbursements  } = useReimbursement();
  const { timeOffRequests, fetchTimeOffRequests } = useTimeOff();
  const { corrections,     handleRefresh: fetchCorrections } = useAttendanceCorrection({ role: 'admin' });
  const { overtimes,       fetchOvertimes       } = useOvertime({ role: 'admin' });

  useEffect(() => {
    if (userRole === 'ADMIN') {
      fetchReimbursements();
      fetchTimeOffRequests();
      fetchCorrections();
      fetchOvertimes();
    }
  }, [userRole]);

  // Auto-expand Attendance submenu
  useEffect(() => {
    const attendancePaths = ['/attendance', '/attendance/correction', '/attendance/overtime'];
    if (attendancePaths.some((p) => location.pathname.startsWith(p))) {
      setIsAttendanceOpen(true);
    }
  }, [location.pathname]);

  const pendingReimbursements = (reimbursements || []).filter(
    (r) => NEEDS_REVIEW_STATUSES.includes(r.status?.toLowerCase())
  ).length;
  const pendingTimeOff  = (timeOffRequests || []).filter(
    (t) => NEEDS_REVIEW_STATUSES.includes(t.status?.toLowerCase())
  ).length;
  const pendingCorrections = (corrections || []).filter(
    (c) => NEEDS_REVIEW_STATUSES.includes(c.status?.toLowerCase())
  ).length;
  const pendingOvertimes = (overtimes || []).filter(
    (o) => NEEDS_REVIEW_STATUSES.includes(o.status?.toLowerCase())
  ).length;

  const totalApprovalPending =
    pendingReimbursements + pendingTimeOff + pendingCorrections + pendingOvertimes;

  // ── Menu definitions ──────────────────────────────────────────────────────
  const attendanceSubItems = [
    { name: 'Attendance Correction', icon: <HiOutlinePencilAlt className="w-4 h-4" />,   path: '/attendance/correction' },
    { name: 'Overtime',              icon: <HiOutlineClipboard className="w-4 h-4" />,    path: '/attendance/overtime'   },
    { name: 'Attendance List',       icon: <HiOutlineClipboardList className="w-4 h-4" />, path: '/attendance/list'      },
  ];

  const mainMenuItems = [
    { name: 'Dashboard',     icon: <HiOutlineHome className="w-5 h-5" />,             path: '/dashboard',    roles: ['ADMIN']            },
    { name: 'Dashboard',     icon: <HiOutlineHome className="w-5 h-5" />,             path: '/my-dashboard', roles: ['EMPLOYEE']         },
    { name: 'Employees',     icon: <HiOutlineUsers className="w-5 h-5" />,            path: '/employees',    roles: ['ADMIN']            },
    { name: 'Departments',   icon: <HiOutlineOfficeBuilding className="w-5 h-5" />,   path: '/departments',  roles: ['ADMIN']            },
    { name: 'Company',       icon: <HiOutlineOfficeBuilding className="w-5 h-5" />,   path: '/companies',    roles: ['ADMIN']            },
    { name: 'Payroll',       icon: <HiOutlineCurrencyDollar className="w-5 h-5" />,   path: '/payroll',      roles: ['ADMIN']            },
    { name: 'Approvals',     icon: <HiOutlineClipboardCheck className="w-5 h-5" />,   path: '/approvals',    badge: totalApprovalPending, roles: ['ADMIN'] },
    { name: 'Accounts',      icon: <HiOutlineLibrary className="w-5 h-5" />,          path: '/accounts',     roles: ['ADMIN']            },
    {
      name: 'Attendance',
      icon: <HiOutlineClock className="w-5 h-5" />,
      path: '/attendance',
      hasSubmenu: true,
      submenu: attendanceSubItems,
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    { name: 'Time Off',      icon: <HiOutlineBriefcase className="w-5 h-5" />,        path: '/time-off',      roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Reimbursement', icon: <HiOutlineReceiptRefund className="w-5 h-5" />,    path: '/reimbursements', roles: ['ADMIN', 'EMPLOYEE'] },
  ];

  const bottomMenuItems = [
    { name: 'Settings',       icon: <HiOutlineCog className="w-5 h-5" />,                path: '/settings', roles: ['ADMIN']             },
    { name: 'Help & Support', icon: <HiOutlineQuestionMarkCircle className="w-5 h-5" />, path: '/help',     roles: ['ADMIN', 'EMPLOYEE'] },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: <HiOutlineUser className="w-5 h-5" />,   path: '/profile'  },
    { name: 'Logout',  icon: <HiOutlineLogout className="w-5 h-5" />, action: 'logout'  },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    localStorage.removeItem('token');
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleProfileAction = (item) => {
    if (item.action === 'logout') handleLogout();
    else navigate(item.path);
    setIsProfileMenuOpen(false);
  };

  const isAttendanceActive = location.pathname.startsWith('/attendance');

  const filteredMenuItems       = mainMenuItems.filter((i) => !i.roles || i.roles.includes(userRole));
  const filteredBottomMenuItems = bottomMenuItems.filter((i) => !i.roles || i.roles.includes(userRole));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-none">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-110">
              <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            aria-label="Close sidebar"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 px-3 sm:px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredMenuItems.map((item) => {
            if (item.hasSubmenu) {
              return (
                <div key={item.name} className="mb-1">
                  <div className="relative flex items-center gap-1">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex-1 flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out ${
                          isActive && location.pathname === item.path
                            ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`transition-all duration-300 flex-shrink-0 ${isActive && location.pathname === item.path ? 'text-indigo-600 scale-110' : 'text-gray-500'}`}>
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium flex-1 text-left">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                    <button
                      onClick={() => setIsAttendanceOpen((prev) => !prev)}
                      className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                        isAttendanceActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'
                      }`}
                      aria-label="Toggle attendance submenu"
                    >
                      <span className={`transition-transform duration-300 ${isAttendanceOpen ? 'rotate-180' : 'rotate-0'}`}>
                        <HiOutlineChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAttendanceOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-6 pl-3 space-y-1 border-l-2 border-indigo-100">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {subItem.icon}
                              </span>
                              <span className="text-xs font-medium">{subItem.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative transition-all duration-300 flex-shrink-0 ${isActive ? 'text-indigo-600 scale-110' : 'text-gray-500'}`}>
                      {item.icon}
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
                      )}
                    </span>
                    <span className="text-sm font-medium flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-4">
          <nav className="px-3 sm:px-4 space-y-1">
            {filteredBottomMenuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-all duration-300 flex-shrink-0 ${isActive ? 'text-indigo-600 scale-110' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Profile Card ──────────────────────────────────────────────── */}
          <div className="px-3 sm:px-4 mt-4 pb-4 relative">
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">

                {/* Avatar: foto profil atau inisial */}
                <div className="relative w-9 h-9 flex-shrink-0">
                  {photoUrl && !imgError ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      onError={() => setImgError(true)}
                      className="w-9 h-9 rounded-full object-cover border-2 border-indigo-100 transition-all duration-300 group-hover:scale-110 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300 group-hover:scale-110 shadow-sm">
                      {initials}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>

                {/* Nama & Jabatan */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate group-hover:text-indigo-400 transition-colors duration-300 mt-0.5 leading-tight">
                    {displayPosition}
                  </p>
                </div>
              </div>

              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors duration-300 flex-shrink-0">
                {isProfileMenuOpen
                  ? <HiOutlineChevronUp className="w-4 h-4" />
                  : <HiOutlineChevronDown className="w-4 h-4" />
                }
              </span>
            </button>

            {/* Profile dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-slideUp">
                {profileMenuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleProfileAction(item)}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-indigo-50 transition-all duration-200 text-left group"
                  >
                    <span className={item.name === 'Logout' ? 'text-red-500 group-hover:text-red-600' : 'text-gray-500 group-hover:text-indigo-600'}>
                      {item.icon}
                    </span>
                    <span className={`text-sm font-medium ${item.name === 'Logout' ? 'text-red-600 group-hover:text-red-700' : 'text-gray-700 group-hover:text-indigo-600'}`}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </>
  );
};

export default Sidebar;

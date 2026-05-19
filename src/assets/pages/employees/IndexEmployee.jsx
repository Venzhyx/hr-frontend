import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineEye,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineRefresh 
} from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEmployee } from '../../../redux/hooks/useEmployee';
import API from '../../../ApiService/api';

const EmployeesList = () => {
  const { 
    employees,
    deleteEmployee,
    stats,
    growthData,
    filters,
    setSearchFilter,
    setDepartmentFilter,
    setStatusFilter,
  } = useEmployee();

  const location  = useLocation();
  const navigate  = useNavigate();

  // ── Pagination (client-side, sama seperti DepartmentsList) ──────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeIndex,    setActiveIndex]    = useState(0);
  const [hoveredBar,     setHoveredBar]     = useState(null);
  const [showDeleteModal,setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteError,    setDeleteError]    = useState('');
  const [sortConfig,     setSortConfig]     = useState({ field: 'name', direction: 'asc' });
  const [showFilterPanel,setShowFilterPanel] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Reset halaman kalau filter berubah
  useEffect(() => { setCurrentPage(1); }, [filters]);

  // Auto hide toast
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.filter-panel-container')) setShowFilterPanel(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Filter + Sort ────────────────────────────────────────────────────────
  const filteredEmployees = (employees ?? []).filter((emp) => {
    const ms = !filters.search ||
      emp.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.jobTitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.workEmail?.toLowerCase().includes(filters.search.toLowerCase());

    const md = !filters.department ||
      emp.departmentName === filters.department ||
      emp.departmentId?.toString() === filters.department;

    const mst = !filters.status || emp.status === filters.status;

    return ms && md && mst;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal = a[sortConfig.field] ?? '';
    let bVal = b[sortConfig.field] ?? '';
    if (sortConfig.field === 'joinDate') {
      aVal = a.joinDate ? new Date(a.joinDate).getTime() : 0;
      bVal = b.joinDate ? new Date(b.joinDate).getTime() : 0;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalElements = sortedEmployees.length;
  const totalPages    = Math.ceil(totalElements / itemsPerPage);
  const startIndex    = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = sortedEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ── Growth data ──────────────────────────────────────────────────────────
  const safeGrowth = {
    months: growthData?.months || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    joined: Array.isArray(growthData?.joined) ? growthData.joined : new Array(12).fill(0),
    leave:  Array.isArray(growthData?.leave)  ? growthData.leave  : new Array(12).fill(0),
  };
  const maxValue   = Math.max(...safeGrowth.joined, ...safeGrowth.leave, 5);
  const totalJoined = safeGrowth.joined.reduce((a, b) => a + b, 0);
  const totalLeave  = safeGrowth.leave.reduce((a, b) => a + b, 0);

  // ── Pie data ─────────────────────────────────────────────────────────────
  const pieData = [
    { name: 'Full-time', value: stats.fullTimePercentage || 0, color: '#4361EE' },
    { name: 'Part-time', value: stats.partTimePercentage || 0, color: '#F59E0B' },
    { name: 'Contract',  value: stats.contractPercentage || 0, color: '#10B981' },
  ];

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200 text-xs">
        <span className="font-medium text-gray-700">{payload[0].name}:</span>{' '}
        <span style={{ color: payload[0].payload.color }} className="font-semibold">
          {payload[0].value}%
        </span>
      </div>
    );
  };

  // ── Unique departments (dari semua employees, bukan hanya halaman ini) ──
  const uniqueDepartments = [...new Set(
    (employees ?? []).map(emp => emp.departmentName).filter(Boolean)
  )].sort();

  const isFilterActive = filters.department || filters.status;

  // ── Sort ─────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ field }) => {
    if (sortConfig.field !== field)
      return <HiOutlineSortAscending className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <HiOutlineSortAscending  className="w-3 h-3 ml-1 text-indigo-600" />
      : <HiOutlineSortDescending className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (emp) => {
    setSelectedEmployee(emp);
    setDeleteError('');
    setShowDeleteModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      setToast({ show: true, message: `Employee ${selectedEmployee.name} has been successfully deleted`, type: 'success' });
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      setDeleteError('');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Delete failed';
      let friendly = msg;
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('constraint')) {
        if (msg.toLowerCase().includes('manager'))      friendly = `${selectedEmployee.name} masih menjadi manager di departemen ini.`;
        else if (msg.toLowerCase().includes('related_user')) friendly = `${selectedEmployee.name} masih terhubung dengan employee lain sebagai related user.`;
        else if (msg.toLowerCase().includes('coach'))   friendly = `${selectedEmployee.name} masih menjadi coach untuk employee lain.`;
        else                                            friendly = `${selectedEmployee.name} masih memiliki relasi dengan data lain.`;
      }
      setDeleteError(friendly);
      setToast({ show: true, message: friendly, type: 'error' });
    } finally {
      document.body.style.overflow = 'unset';
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEmployee(null);
    setDeleteError('');
    document.body.style.overflow = 'unset';
  };

  const handleResetFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setShowFilterPanel(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-6">

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 animate-slideIn ${
            toast.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
          }`}
          style={{ minWidth: '320px' }}
        >
          <div className={`mr-3 flex-shrink-0 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {toast.type === 'success'
              ? <HiOutlineCheckCircle className="w-6 h-6" />
              : <HiOutlineXCircle    className="w-6 h-6" />}
          </div>
          <div className="flex-1 mr-2">
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {toast.message}
            </p>
          </div>
          <button onClick={() => setToast(p => ({ ...p, show: false }))}
            className={`flex-shrink-0 ${toast.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        {/* Team Overview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-[360px] flex flex-col">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Team Overview</h2>
          </div>
          <div className="p-6 flex-1 flex items-center">
            <div className="flex flex-col md:flex-row items-start gap-6 w-full">
              <div>
                <p className="text-gray-500 mb-2">Total team member</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-gray-800">{stats.total || 0}</span>
                  <span className="text-lg text-gray-400">orang</span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: 'Full-time', pct: stats.fullTimePercentage, color: 'bg-[#4361EE]' },
                    { label: 'Part-time', pct: stats.partTimePercentage, color: 'bg-amber-500'  },
                    { label: 'Contract',  pct: stats.contractPercentage, color: 'bg-emerald-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="flex items-center">
                        <span className={`w-4 h-4 ${color} rounded-full mr-3`} />
                        <span className="text-base text-gray-700">{label}</span>
                      </div>
                      <span className="text-base font-semibold text-gray-900">{pct || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-56 h-56 flex-shrink-0 ml-auto">
                {pieData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                        paddingAngle={2} dataKey="value"
                        onMouseEnter={(_, i) => setActiveIndex(i)}
                        isAnimationActive animationDuration={300}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} opacity={activeIndex === i ? 1 : 0.9}
                            stroke="#ffffff" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                        fill={pieData[activeIndex]?.color} className="text-2xl font-bold">
                        {pieData[activeIndex]?.value}%
                      </text>
                      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                        className="text-xs fill-gray-500">
                        {pieData[activeIndex]?.name}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full">
                    <span className="text-gray-400 text-sm">No data</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Growth Graph */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-[360px] flex flex-col">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Growth graph</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-end items-center gap-6 mb-4 flex-shrink-0">
              <div className="flex items-center"><span className="w-4 h-4 bg-[#4361EE] rounded-full mr-2"/><span className="text-sm text-gray-600">Joined</span></div>
              <div className="flex items-center"><span className="w-4 h-4 bg-rose-400 rounded-full mr-2"/><span className="text-sm text-gray-600">Leave</span></div>
            </div>
            <div className="flex-1 flex items-end justify-between gap-2 min-h-[180px]">
              {safeGrowth.months.map((month, i) => {
                const jH = Math.max(4, (safeGrowth.joined[i] / maxValue) * 130);
                const lH = Math.max(4, (safeGrowth.leave[i]  / maxValue) * 130);
                return (
                  <div key={month} className="flex-1 flex flex-col items-center group relative"
                    onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                    {hoveredBar === i && (
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1.5 whitespace-nowrap z-10 shadow-md">
                        <div>Joined: {safeGrowth.joined[i]}</div>
                        <div>Leave: {safeGrowth.leave[i]}</div>
                      </div>
                    )}
                    <div className="w-full flex justify-center gap-1 items-end">
                      <div className="w-3 bg-[#4361EE] rounded-t transition-all duration-200 group-hover:bg-[#3651d4]" style={{ height: `${jH}px` }} />
                      <div className="w-3 bg-rose-400 rounded-t transition-all duration-200 group-hover:bg-rose-500" style={{ height: `${lH}px` }} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 mt-2">{month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500 flex-shrink-0">
              <span>Total Joined: <span className="font-medium text-gray-700">{totalJoined}</span></span>
              <span>Total Leave:  <span className="font-medium text-gray-700">{totalLeave}</span></span>
              <span>Net Growth: <span className={`font-medium ${totalJoined - totalLeave >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalJoined - totalLeave >= 0 ? '+' : ''}{totalJoined - totalLeave}
              </span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 flex items-center shadow-sm">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employees by name, code, or title..."
            value={filters.search}
            onChange={(e) => { setSearchFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none text-base"
          />
        </div>
        <div className="flex items-center space-x-2 px-2">
          <div className="relative filter-panel-container">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className={`p-2 rounded-lg transition-colors ${isFilterActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <HiOutlineFilter className="w-5 h-5" />
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Filter Employees</h4>
                  <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Department</label>
                  <select value={filters.department} onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Departments</option>
                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select value={filters.status} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
                {isFilterActive ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button onClick={handleResetFilters}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <HiOutlineRefresh className="w-4 h-4" /><span>Reset All Filters</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Active filters: {[filters.department, filters.status].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">No active filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Employees List</h2>
            <p className="text-sm text-gray-500 mt-1">{totalElements} total employees</p>
          </div>
          <Link to="/employees/add"
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#4361EE] text-white rounded-lg hover:bg-[#3651d4] transition-colors text-base shadow-sm">
            <HiOutlinePlus className="w-5 h-5" /><span>Add Employee</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                {[
                  { label: 'NAME',       field: 'name'           },
                  { label: 'JOB TITLE',  field: 'jobTitle'       },
                  { label: 'JOIN DATE',  field: 'joinDate'       },
                  { label: 'DEPARTMENT', field: 'departmentName' },
                  { label: 'STATUS',     field: 'status'         },
                ].map(({ label, field }) => (
                  <th key={field}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                    onClick={() => handleSort(field)}>
                    <div className="flex items-center">{label}<SortIcon field={field} /></div>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                        {emp.photo
                          ? <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                          : <span className="text-indigo-700 font-semibold text-sm">
                              {emp.name?.split(' ').map(n => n[0]).join('')}
                            </span>}
                      </div>
                      <span className="ml-3 text-base font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{emp.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                    {emp.joinDate
                      ? new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{emp.departmentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-medium rounded-full ${
                      emp.status === 'ACTIVE'    ? 'bg-green-100 text-green-800' :
                      emp.status === 'RESIGNED'  ? 'bg-yellow-100 text-yellow-800' :
                                                   'bg-red-100 text-red-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Link to={`/employees/detail/${emp.id}`}
                        className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors">
                        <HiOutlineEye className="w-5 h-5" />
                      </Link>
                      <Link to={`/employees/edit/${emp.id}`}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors">
                        <HiOutlinePencil className="w-5 h-5" />
                      </Link>
                      <button onClick={() => handleDeleteClick(emp)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors">
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                      <HiOutlineSearch className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-base">No employees found</p>
                      <p className="text-sm text-gray-300 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — sama persis dengan DepartmentsList */}
        {totalElements > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, totalElements)}</span> of{' '}
              <span className="font-medium">{totalElements}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? 'bg-[#4361EE] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancelDelete}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <HiOutlineExclamation className="w-5 h-5 text-red-500 mr-2" />Confirm Delete
              </h3>
              <button onClick={handleCancelDelete} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <HiOutlineTrash className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-700">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900">{selectedEmployee.name}</span>?
                </p>
              </div>
              {deleteError ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-start">
                    <HiOutlineExclamation className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    {deleteError}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <span className="font-medium">Warning:</span> This action cannot be undone.
                </p>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={!!deleteError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center disabled:opacity-50">
                <HiOutlineTrash className="w-4 h-4 mr-2" />Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;

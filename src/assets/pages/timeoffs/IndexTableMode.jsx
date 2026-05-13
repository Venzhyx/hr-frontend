  import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
  import { useNavigate } from "react-router-dom";
  import {
    HiOutlinePlus,
    HiOutlineSearch,
    HiOutlineRefresh,
    HiOutlineFilter,
    HiOutlineChevronDown,
    HiOutlineClock,
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineX,
    HiOutlineExclamation,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
  } from "react-icons/hi";
  import { useTimeOff } from "../../../redux/hooks/useTimeOff";
  import { useEmployee } from "../../../redux/hooks/useEmployee";

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const STATUS_CFG = {
    SUBMITTED: {
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-400",
      label: "Submitted",
    },
    PENDING: {
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-400",
      label: "Pending",
    },
    APPROVED: {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dot: "bg-emerald-400",
      label: "Approved",
    },
    REJECTED: {
      cls: "bg-red-50 text-red-700 border border-red-200",
      dot: "bg-red-400",
      label: "Rejected",
    },
  };

  const ALL_STATUSES = ["SUBMITTED", "PENDING", "APPROVED", "REJECTED"];

  // ── Toast (EmployeesList style) ───────────────────────────────────────────────
  const Toast = ({ message, type = "success", onClose }) => (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 ${
        type === "success"
          ? "bg-green-50 border-green-500"
          : "bg-red-50 border-red-500"
      }`}
      style={{ minWidth: "320px" }}
    >
      <div
        className={`mr-3 flex-shrink-0 ${
          type === "success" ? "text-green-500" : "text-red-500"
        }`}
      >
        {type === "success" ? (
          <HiOutlineCheckCircle className="w-6 h-6" />
        ) : (
          <HiOutlineXCircle className="w-6 h-6" />
        )}
      </div>
      <div className="flex-1 mr-2">
        <p
          className={`text-sm font-medium ${
            type === "success" ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${
          type === "success"
            ? "text-green-600 hover:text-green-800"
            : "text-red-600 hover:text-red-800"
        }`}
      >
        <HiOutlineX className="w-5 h-5" />
      </button>
    </div>
  );

  // ── Stat Card ─────────────────────────────────────────────────────────────────
  const StatCard = ({ label, value }) => (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
    </div>
  );

  // ── Filter Dropdown ───────────────────────────────────────────────────────────
  const FilterDropdown = ({ activeFilters, onChange, counts }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (status) => {
      if (activeFilters.includes(status)) {
        if (activeFilters.length === 1) return;
        onChange(activeFilters.filter((s) => s !== status));
      } else {
        onChange([...activeFilters, status]);
      }
    };

    const isAll = activeFilters.length === ALL_STATUSES.length;

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
            !isAll
              ? "bg-indigo-100 border-indigo-300 text-indigo-600"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <HiOutlineFilter className="w-4 h-4" />
          <span className="font-medium">All Status</span>
          <HiOutlineChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Filter Status
              </span>
            </div>
            <div className="py-1.5">
              <button
                onClick={() => onChange(isAll ? ["SUBMITTED"] : [...ALL_STATUSES])}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 mb-1"
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                    isAll ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                  }`}
                >
                  {isAll && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700 font-medium">All</span>
                <span className="ml-auto text-xs text-gray-400">
                  {Object.values(counts).reduce((a, b) => a + b, 0)}
                </span>
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
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                        checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                      }`}
                    >
                      {checked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
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

  // ── Pagination ────────────────────────────────────────────────────────────────
  const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      let l;
      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= currentPage - delta && i <= currentPage + delta)
        ) {
          range.push(i);
        }
      }
      range.forEach((i) => {
        if (l) {
          if (i - l === 2) rangeWithDots.push(l + 1);
          else if (i - l !== 1) rangeWithDots.push("...");
        }
        rangeWithDots.push(i);
        l = i;
      });
      return rangeWithDots;
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <HiOutlineChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400 text-sm">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-[#4361EE] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 bg-white border border-gray-200"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ── Main Component ────────────────────────────────────────────────────────────
  const TimeOffTablePage = () => {
    const navigate = useNavigate();
    const { timeOffRequests, fetchTimeOffRequests, deleteTimeOffRequest } = useTimeOff();
    const { employees, fetchEmployees } = useEmployee();

    const photoMap = useMemo(() => {
      const map = {};
      (employees || []).forEach((e) => {
        map[e.id] = e.photo || null;
      });
      return map;
    }, [employees]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState([...ALL_STATUSES]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Auto-hide toast after 3s
    useEffect(() => {
      if (toast.show) {
        const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
        return () => clearTimeout(t);
      }
    }, [toast.show]);

    const showToast = (message, type = "success") =>
      setToast({ show: true, message, type });

    const load = useCallback(async () => {
      setLoading(true);
      try {
        await fetchTimeOffRequests();
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      load();
      fetchEmployees();
    }, [load]);

    // Reset to page 1 on filter/search change
    useEffect(() => {
      setCurrentPage(1);
    }, [search, activeFilters]);

    // Stats
    const stats = (timeOffRequests || []).reduce(
      (acc, r) => {
        acc.total++;
        if (r.status === "SUBMITTED") acc.submitted++;
        if (r.status === "PENDING") acc.pending++;
        if (r.status === "APPROVED") acc.approved++;
        if (r.status === "REJECTED") acc.rejected++;
        return acc;
      },
      { total: 0, submitted: 0, pending: 0, approved: 0, rejected: 0 }
    );

    const counts = (timeOffRequests || []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    // Filtered & paginated
    const filteredData = useMemo(
      () =>
        (timeOffRequests || []).filter((r) => {
          if (!activeFilters.includes(r.status)) return false;
          if (search) {
            const q = search.toLowerCase();
            return (
              r.employeeName?.toLowerCase().includes(q) ||
              r.timeOffTypeName?.toLowerCase().includes(q) ||
              r.reason?.toLowerCase().includes(q)
            );
          }
          return true;
        }),
      [timeOffRequests, activeFilters, search]
    );

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedData = filteredData.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

    // Delete handlers
    const handleDeleteClick = (request) => {
      setSelectedRequest(request);
      setDeleteError("");
      setShowDeleteModal(true);
      document.body.style.overflow = "hidden";
    };

    const handleConfirmDelete = async () => {
      if (!selectedRequest) return;
      setDeletingId(selectedRequest.id);
      try {
        await deleteTimeOffRequest(selectedRequest.id);
        await load();
        showToast(
          `Time off request dari ${selectedRequest.employeeName} berhasil dihapus.`
        );
        setShowDeleteModal(false);
        setSelectedRequest(null);
        setDeleteError("");
        if (paginatedData.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Gagal menghapus.";
        setDeleteError(msg);
        showToast(msg, "error");
      } finally {
        setDeletingId(null);
        document.body.style.overflow = "unset";
      }
    };

    const handleCancelDelete = () => {
      setShowDeleteModal(false);
      setSelectedRequest(null);
      setDeleteError("");
      document.body.style.overflow = "unset";
    };

    const handlePageSizeChange = (newSize) => {
      setPageSize(newSize);
      setCurrentPage(1);
    };

    return (
      <div className="w-full px-4 md:px-6 py-6 space-y-6">

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((p) => ({ ...p, show: false }))}
          />
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Time Off Request</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.total}
            </span>
          </div>
          <button
            onClick={() => navigate("/time-off/add")}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#4361EE] text-white rounded-lg hover:bg-[#3651d4] transition-colors text-base shadow-sm"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Add Time Off Request</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                <HiOutlineClock className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Approval Status</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 divide-x divide-gray-100">
              <StatCard label="Requested" value={stats.total} />
              <div className="pl-6">
                <StatCard label="Submitted" value={stats.submitted} />
              </div>
              <div className="pl-6">
                <StatCard label="Pending" value={stats.pending} />
              </div>
              <div className="pl-6">
                <StatCard label="Approved" value={stats.approved} />
              </div>
              <div className="pl-6">
                <StatCard label="Rejected" value={stats.rejected} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Card Header / Toolbar */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Time Off List</h2>
              <p className="text-sm text-gray-500 mt-1">{totalItems} total requests</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Time Off Request"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter */}
              <FilterDropdown
                activeFilters={activeFilters}
                onChange={setActiveFilters}
                counts={counts}
              />

              {/* Page size */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 hidden sm:inline">Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-gray-500 hidden sm:inline">data</span>
              </div>

              {/* Refresh */}
              <button
                onClick={load}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40 transition-colors"
                title="Refresh"
              >
                <HiOutlineRefresh
                  className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400 text-sm">Memuat data…</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16">
              <HiOutlineClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-base text-gray-400">Tidak ada data time off request</p>
              <p className="text-sm text-gray-300 mt-1">
                Coba sesuaikan pencarian atau filter
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {[
                        "Employee",
                        "Time Off Type",
                        "Start Date & End Date",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((r) => {
                      const sCfg = STATUS_CFG[r.status] || STATUS_CFG.SUBMITTED;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          {/* Employee */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                                {photoMap[r.employeeId] ? (
                                  <img
                                    src={photoMap[r.employeeId]}
                                    alt={r.employeeName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-indigo-700 font-semibold text-sm">
                                    {r.employeeName
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase() || "?"}
                                  </span>
                                )}
                              </div>
                              <span className="ml-3 text-base font-medium text-gray-900 whitespace-nowrap">
                                {r.employeeName || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {r.timeOffTypeName || "—"}
                          </td>

                          {/* Date range */}
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {fmtDate(r.startDate)}
                            <span className="text-gray-300 mx-1.5 text-sm">→</span>
                            {fmtDate(r.endDate)}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${sCfg.cls}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                              {sCfg.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/time-off/${r.id}`)}
                                className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors"
                                title="Detail"
                              >
                                <HiOutlineEye className="w-5 h-5" />
                              </button>
                              {r.status === "SUBMITTED" && (
                                <button
                                  onClick={() => navigate(`/time-off/edit/${r.id}`)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <HiOutlinePencil className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteClick(r)}
                                className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                                title="Hapus"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                />
              )}
            </>
          )}
        </div>

        {/* ── DELETE CONFIRMATION MODAL ── */}
        {showDeleteModal && selectedRequest && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelDelete}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <HiOutlineExclamation className="w-5 h-5 text-red-500 mr-2" />
                  Konfirmasi Hapus
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <HiOutlineTrash className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-gray-700">
                    Yakin ingin menghapus time off request dari{" "}
                    <span className="font-semibold text-gray-900">
                      {selectedRequest.employeeName}
                    </span>
                    ?
                  </p>
                </div>

                {/* Error message */}
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-start">
                      <HiOutlineExclamation className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{deleteError}</span>
                    </p>
                  </div>
                )}

                {/* Default warning — only shown when no error */}
                {!deleteError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <span className="font-medium">Peringatan:</span> Tindakan ini tidak dapat
                    dibatalkan. Data time off request akan dihapus secara permanen.
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!!deleteError || deletingId === selectedRequest.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId === selectedRequest.id ? (
                    <svg
                      className="animate-spin w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <HiOutlineTrash className="w-4 h-4 mr-2" />
                  )}
                  Hapus Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default TimeOffTablePage;

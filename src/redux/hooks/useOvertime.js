import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllOvertimes,
  fetchOvertimesByEmployee,
  createOvertime,
  approveOvertime,
  rejectOvertime,
  updateOvertime,        // TAMBAH
  deleteOvertime,        // TAMBAH
  openCreateModal,
  closeCreateModal,
  openDetailModal,
  closeDetailModal,
  setFilterStatus,
  setFilterType,
  clearActionError,
} from "../slices/overtimeSlice";

/**
 * useOvertime
 * @param {{ role: "admin" | "employee", employeeId?: number, adminId?: number }} options
 */
export const useOvertime = ({ role = "employee", employeeId, adminId } = {}) => {
  const dispatch = useDispatch();

  const {
    overtimes:        rawOvertimes,
    totalHours,
    loading,
    error,
    actionLoading,
    actionError,
    isModalOpen,
    isDetailModalOpen,
    selectedOvertime,
    filterStatus,
    filterType,
  } = useSelector((state) => state.overtime);

  const isAdmin = role === "admin";

  // ─── Fetch ────────────────────────────────────────────────────────────────────

  const fetchOvertimes = useCallback(() => {
    if (isAdmin) {
      dispatch(fetchAllOvertimes());
    } else if (employeeId) {
      dispatch(fetchOvertimesByEmployee(employeeId));
    }
  }, [dispatch, isAdmin, employeeId]);

  const handleRefresh = useCallback(() => fetchOvertimes(), [fetchOvertimes]);

  // ─── Filtered + Stats ─────────────────────────────────────────────────────────

  const overtimes = useMemo(() => {
    return (rawOvertimes || []).filter((o) => {
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      const matchType   = filterType   === "ALL" || o.type   === filterType;
      return matchStatus && matchType;
    });
  }, [rawOvertimes, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total:    (rawOvertimes || []).length,
    pending:  (rawOvertimes || []).filter((o) => o.status === "PENDING").length,
    approved: (rawOvertimes || []).filter((o) => o.status === "APPROVED").length,
    rejected: (rawOvertimes || []).filter((o) => o.status === "REJECTED").length,
  }), [rawOvertimes]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async (payload) => {
    const result = await dispatch(createOvertime(payload));
    if (createOvertime.rejected.match(result)) throw new Error(result.payload);
  }, [dispatch]);

  const handleApprove = useCallback(async (id, notes) => {
    const approverId = adminId ?? 1;
    console.log("HANDLE APPROVE", { id, approverId, notes });
    const result = await dispatch(approveOvertime({ id, approverId, notes }));
    if (approveOvertime.rejected.match(result)) {
      throw new Error(result.payload);
    }
  }, [dispatch, adminId]);

  const handleReject = useCallback(async (id, notes) => {
    const approverId = adminId ?? 1;
    const result = await dispatch(rejectOvertime({ id, approverId, notes }));
    if (rejectOvertime.rejected.match(result)) throw new Error(result.payload);
  }, [dispatch, adminId]);

  // TAMBAH: handleUpdate
  const handleUpdate = useCallback(async (id, payload) => {
    const result = await dispatch(updateOvertime({ id, data: payload }));
    if (updateOvertime.rejected.match(result)) {
      throw new Error(result.payload);
    }
  }, [dispatch]);

  // TAMBAH: handleDelete
  const handleDelete = useCallback(async (id) => {
    const result = await dispatch(deleteOvertime(id));
    if (deleteOvertime.rejected.match(result)) {
      throw new Error(result.payload);
    }
  }, [dispatch]);

  // ─── Modal Controls ───────────────────────────────────────────────────────────

  const handleOpenCreateModal  = useCallback(() => dispatch(openCreateModal()),         [dispatch]);
  const handleCloseCreateModal = useCallback(() => dispatch(closeCreateModal()),        [dispatch]);
  const handleOpenDetailModal  = useCallback((o) => dispatch(openDetailModal(o)),       [dispatch]);
  const handleCloseDetailModal = useCallback(() => dispatch(closeDetailModal()),        [dispatch]);
  const handleClearError       = useCallback(() => dispatch(clearActionError()),        [dispatch]);

  // ─── Filter Controls ──────────────────────────────────────────────────────────

  const handleSetFilterStatus  = useCallback((s) => dispatch(setFilterStatus(s)),      [dispatch]);
  const handleSetFilterType    = useCallback((t) => dispatch(setFilterType(t)),         [dispatch]);

  return {
    // Data
    overtimes,
    totalHours,
    stats,
    // State
    loading,
    error,
    actionLoading,
    actionError,
    // Modal
    isModalOpen,
    isDetailModalOpen,
    selectedOvertime,
    // Filter
    filterStatus,
    filterType,
    // Actions
    fetchOvertimes,
    handleRefresh,
    handleCreate,
    handleUpdate,      // TAMBAH
    handleDelete,      // TAMBAH
    handleApprove,
    handleReject,
    clearError: handleClearError,
    // Modal controls
    openCreateModal:  handleOpenCreateModal,
    closeCreateModal: handleCloseCreateModal,
    openDetailModal:  handleOpenDetailModal,
    closeDetailModal: handleCloseDetailModal,
    // Filter controls
    setFilterStatus:  handleSetFilterStatus,
    setFilterType:    handleSetFilterType,
  };
};
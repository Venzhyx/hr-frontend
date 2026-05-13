import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchAllCorrections,
  fetchCorrectionsByEmployee,
  createCorrection,
  updateCorrection,        // TAMBAH
  deleteCorrection,        // TAMBAH
  openCreateModal,
  closeCreateModal,
  openDetailModal,
  closeDetailModal,
  setFilterStatus,
  setFilterType,
  clearCorrectionError,
  selectCorrectionList,
  selectCorrectionLoading,
  selectCorrectionError,
  selectCorrectionActionLoading,
  selectCorrectionActionError,
  selectIsModalOpen,
  selectIsDetailModalOpen,
  selectSelectedCorrection,
  selectFilterStatus,
  selectFilterType,
} from "../slices/attendanceCorrectionSlice";
import {
  approveAttendanceCorrectionAPI,
  rejectAttendanceCorrectionAPI,
} from "../../ApiService/approvalApi";
import { useMemo } from "react";

// ── Core approval processor
const processAttendanceApproval = async (id, action, notes = null, dispatch) => {
  try {
    const approverId = 1;
    
    if (action === "APPROVED") {
      await approveAttendanceCorrectionAPI(id, approverId, notes);
    } else if (action === "REJECTED") {
      await rejectAttendanceCorrectionAPI(id, approverId, notes);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    if (dispatch) {
      try {
        await dispatch(fetchAllCorrections()).unwrap();
      } catch {
        // Silent fail
      }
    }
  } catch (err) {
    throw new Error(
      "Gagal memproses approval: " +
        (err?.response?.data?.message || err.message)
    );
  }
};

export const useAttendanceCorrection = ({ role = "employee", employeeId } = {}) => {
  const dispatch = useDispatch();

  const rawList       = useSelector(selectCorrectionList);
  const loading       = useSelector(selectCorrectionLoading);
  const error         = useSelector(selectCorrectionError);
  const actionLoading = useSelector(selectCorrectionActionLoading);
  const actionError   = useSelector(selectCorrectionActionError);

  const isModalOpen       = useSelector(selectIsModalOpen);
  const isDetailModalOpen = useSelector(selectIsDetailModalOpen);
  const selectedCorrection = useSelector(selectSelectedCorrection);
  const filterStatus      = useSelector(selectFilterStatus);
  const filterType        = useSelector(selectFilterType);

  // Filtered list
  const corrections = useMemo(() => {
    return rawList.filter((c) => {
      const statusMatch = filterStatus === "ALL" || c.status === filterStatus;
      const typeMatch   = filterType   === "ALL" || c.type   === filterType;
      return statusMatch && typeMatch;
    });
  }, [rawList, filterStatus, filterType]);

  // Stats
  const stats = useMemo(
    () => ({
      total:    rawList.length,
      pending:  rawList.filter((c) => c.status === "PENDING").length,
      approved: rawList.filter((c) => c.status === "APPROVED").length,
      rejected: rawList.filter((c) => c.status === "REJECTED").length,
    }),
    [rawList]
  );

  // ── Fetch helpers
  const fetchAllCorrectionsFn = useCallback(
    () => dispatch(fetchAllCorrections()).unwrap(),
    [dispatch]
  );

  const fetchCorrectionsByEmployeeFn = useCallback(
    (empId) => dispatch(fetchCorrectionsByEmployee(empId)).unwrap(),
    [dispatch]
  );

  // ── Action handlers
  const handleCreate = async (formData) => {
    return dispatch(createCorrection(formData)).unwrap();
  };

  // TAMBAH: handleUpdate
  const handleUpdate = async (id, formData) => {
    return dispatch(updateCorrection({ id, data: formData })).unwrap();
  };

  // TAMBAH: handleDelete
  const handleDelete = async (id) => {
    return dispatch(deleteCorrection(id)).unwrap();
  };

  const handleApprove = async (id, notes) =>
    processAttendanceApproval(id, "APPROVED", notes, dispatch);

  const handleReject = async (id, notes) =>
    processAttendanceApproval(id, "REJECTED", notes, dispatch);

  const handleRefresh = useCallback(() => {
    if (role === "admin") {
      dispatch(fetchAllCorrections());
    } else if (employeeId) {
      dispatch(fetchCorrectionsByEmployee(employeeId));
    }
  }, [dispatch, role, employeeId]);

  return {
    // Data
    corrections,
    stats,
    loading,
    error,
    actionLoading,
    actionError,

    // UI state
    isModalOpen,
    isDetailModalOpen,
    selectedCorrection,
    filterStatus,
    filterType,

    // Dispatchers
    openCreateModal:  ()  => dispatch(openCreateModal()),
    closeCreateModal: ()  => dispatch(closeCreateModal()),
    openDetailModal:  (c) => dispatch(openDetailModal(c)),
    closeDetailModal: ()  => dispatch(closeDetailModal()),
    setFilterStatus:  (v) => dispatch(setFilterStatus(v)),
    setFilterType:    (v) => dispatch(setFilterType(v)),
    clearError:       ()  => dispatch(clearCorrectionError()),

    // Async actions
    handleCreate,
    handleUpdate,      // TAMBAH
    handleDelete,      // TAMBAH
    handleApprove,
    handleReject,
    handleRefresh,
    fetchAllCorrections:        fetchAllCorrectionsFn,
    fetchCorrectionsByEmployee: fetchCorrectionsByEmployeeFn,
  };
};
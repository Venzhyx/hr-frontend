import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import {
  fetchAttendancesByEmployeeId,
  fetchAttendancesByDate,
  fetchAllEmployeesForDropdown,
  clearAttendanceError,
  clearAttendanceData,
  upsertAttendance,
  selectAttendances,
  selectAttendanceLoading,
  selectAttendanceError,
  selectEmployees,
  selectLoadingEmployees,
  selectLastFetchedEmployeeId,
} from "../slices/attendanceSlice";

// Timezone-safe local date string
const getLocalTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const useAttendance = () => {
  const dispatch = useDispatch();

  const attendances           = useSelector(selectAttendances);
  const loading               = useSelector(selectAttendanceLoading);
  const error                 = useSelector(selectAttendanceError);
  const employees             = useSelector(selectEmployees);
  const loadingEmployees      = useSelector(selectLoadingEmployees);
  const lastFetchedEmployeeId = useSelector(selectLastFetchedEmployeeId);

  // ── Derived: status absensi hari ini ─────────────────────────────────────
  const todayStr = useMemo(() => getLocalTodayStr(), []);

  const todayAttendance = useMemo(
    () => attendances.find((a) => a.date === todayStr) ?? null,
    [attendances, todayStr]
  );

  const hasCheckedInToday  = !!(todayAttendance?.checkIn);
  const hasCheckedOutToday = !!(todayAttendance?.checkOut);

  // ── Actions ───────────────────────────────────────────────────────────────
  const loadEmployees = useCallback(() => {
    dispatch(fetchAllEmployeesForDropdown());
  }, [dispatch]);

  const loadAttendance = useCallback(
    (employeeId, { force = false } = {}) => {
      if (!employeeId) return;
      if (!force && String(lastFetchedEmployeeId) === String(employeeId)) return;
      dispatch(fetchAttendancesByEmployeeId(employeeId));
    },
    [dispatch, lastFetchedEmployeeId]
  );

  const loadAttendanceByDate = useCallback((date) => {
    if (date) dispatch(fetchAttendancesByDate(date));
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearAttendanceError());
  }, [dispatch]);

  const resetAttendance = useCallback(() => {
    dispatch(clearAttendanceData());
  }, [dispatch]);

  const upsertAttendanceRecord = useCallback((record) => {
    dispatch(upsertAttendance(record));
  }, [dispatch]);

  return {
    attendances,
    employees,
    loading,
    error,
    loadingEmployees,
    lastFetchedEmployeeId,

    // today's status — siap pakai di komponen manapun
    todayStr,
    todayAttendance,
    hasCheckedInToday,
    hasCheckedOutToday,

    loadEmployees,
    loadAttendance,
    loadAttendanceByDate,
    dismissError,
    resetAttendance,
    upsertAttendanceRecord,
  };
};
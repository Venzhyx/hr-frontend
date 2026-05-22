// src/redux/hooks/useAttendance.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
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

export const useAttendance = () => {
  const dispatch = useDispatch();

  const attendances            = useSelector(selectAttendances);
  const loading                = useSelector(selectAttendanceLoading);
  const error                  = useSelector(selectAttendanceError);
  const employees              = useSelector(selectEmployees);
  const loadingEmployees       = useSelector(selectLoadingEmployees);
  const lastFetchedEmployeeId  = useSelector(selectLastFetchedEmployeeId);

  const loadEmployees = useCallback(() => {
    dispatch(fetchAllEmployeesForDropdown());
  }, [dispatch]);

  /**
   * Fetch attendance by employee ID.
   * - force=false (default): skip jika ID sama & data sudah ada → cegah double request
   * - force=true: selalu fetch ulang (dipakai tombol Refresh)
   */
  const loadAttendance = useCallback((employeeId, { force = false } = {}) => {
    if (!employeeId) return;
    if (!force && String(lastFetchedEmployeeId) === String(employeeId)) return;
    dispatch(fetchAttendancesByEmployeeId(employeeId));
  }, [dispatch, lastFetchedEmployeeId]);

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
    loadEmployees,
    loadAttendance,
    loadAttendanceByDate,
    dismissError,
    resetAttendance,
    upsertAttendanceRecord,
  };
};

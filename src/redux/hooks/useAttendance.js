// src/redux/hooks/useAttendance.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchAttendancesByEmployeeId,
  fetchAllEmployeesForDropdown,
  clearAttendanceError,
  clearAttendanceData,
  upsertAttendance, // ✅ IMPORT UPSERT
  selectAttendances,
  selectAttendanceLoading,
  selectAttendanceError,
  selectEmployees,
  selectLoadingEmployees,
} from "../slices/attendanceSlice";

export const useAttendance = () => {
  const dispatch = useDispatch();

  const attendances      = useSelector(selectAttendances);
  const loading          = useSelector(selectAttendanceLoading);
  const error            = useSelector(selectAttendanceError);
  const employees        = useSelector(selectEmployees);
  const loadingEmployees = useSelector(selectLoadingEmployees);

  const loadEmployees = useCallback(() => {
    dispatch(fetchAllEmployeesForDropdown());
  }, [dispatch]);

  const loadAttendance = useCallback((employeeId) => {
    if (employeeId) dispatch(fetchAttendancesByEmployeeId(employeeId));
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearAttendanceError());
  }, [dispatch]);

  const resetAttendance = useCallback(() => {
    dispatch(clearAttendanceData());
  }, [dispatch]);

  // ✅ TAMBAH FUNGSI INI
  const upsertAttendanceRecord = useCallback((record) => {
    dispatch(upsertAttendance(record));
  }, [dispatch]);

  return {
    attendances,
    employees,
    loading,
    error,
    loadingEmployees,
    loadEmployees,
    loadAttendance,
    dismissError,
    resetAttendance,
    upsertAttendanceRecord, // ✅ EXPOSE
  };
};
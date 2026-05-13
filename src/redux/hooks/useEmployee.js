import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  clearSelectedEmployee,
  clearError,
} from "../slices/employeeSlice";

export const useEmployee = () => {
  const dispatch = useDispatch();

  const {
    list = [],
    selectedEmployee = null,
    loading = false,
    error = null,
  } = useSelector((state) => state.employees || {});

  /* =========================
    FETCH DATA
  ========================== */
  /* =========================
    FILTER STATE
  ========================== */
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
  });

  const setSearchFilter = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const setDepartmentFilter = useCallback((value) => {
    setFilters((prev) => ({ ...prev, department: value }));
  }, []);

  const setStatusFilter = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  /* =========================
    PAGINATION STATE
  ========================== */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  /* =========================
    FILTER LOGIC
  ========================== */
  const filteredEmployees = useMemo(() => {
    return list.filter((emp) => {
      const matchesSearch =
        !filters.search ||
        emp.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.jobTitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.workEmail?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesDepartment = !filters.department || 
        emp.departmentName === filters.department ||
        emp.departmentId?.toString() === filters.department;

      const matchesStatus = !filters.status || 
        emp.status === filters.status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [list, filters]);

  /* =========================
    PAGINATION
  ========================== */
  const totalElements = filteredEmployees.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalElements);

  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, startIndex, endIndex]);

  const setPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const pagination = {
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    startIndex,
    endIndex,
  };

  /* =========================
    STATS
  ========================== */
  const stats = useMemo(() => {
    const total = list.length;
    const fullTime = list.filter((emp) => emp.employeeType === "FULL_TIME").length;
    const partTime = list.filter((emp) => emp.employeeType === "PART_TIME").length;
    const contract = list.filter((emp) => emp.employeeType === "CONTRACT").length;
    const active = list.filter((emp) => emp.status === "ACTIVE").length;
    const inactive = total - active;

    return {
      total,
      fullTime,
      partTime,
      contract,
      active,
      inactive,
      fullTimePercentage: total ? Math.round((fullTime / total) * 100) : 0,
      partTimePercentage: total ? Math.round((partTime / total) * 100) : 0,
      contractPercentage: total ? Math.round((contract / total) * 100) : 0,
      activePercentage: total ? Math.round((active / total) * 100) : 0,
    };
  }, [list]);

  /* =========================
    GROWTH DATA (12 MONTHS)
  ========================== */
  const growthData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const joined = new Array(12).fill(0);
    const leave = new Array(12).fill(0);

    list.forEach((emp) => {
      if (emp.joinDate) {
        const date = new Date(emp.joinDate);
        const month = date.getMonth();
        joined[month] += 1;
      }

      if (emp.status && emp.status !== "ACTIVE" && emp.updatedAt) {
        const leaveDate = new Date(emp.updatedAt);
        const leaveMonth = leaveDate.getMonth();
        leave[leaveMonth] += 1;
      }
    });

    return { months, joined, leave };
  }, [list]);

  /* =========================
    ACTIONS
  ========================== */
  const fetchEmployeeByIdAction = useCallback((id) => {
  dispatch(clearSelectedEmployee()); // reset dulu
  return dispatch(fetchEmployeeById(id)).unwrap();
}, [dispatch]);

  const createEmployeeAction = useCallback(async (employeeData) => {
    try {
      const result = await dispatch(createEmployee(employeeData)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const fetchEmployeesAction = useCallback(() => {
  return dispatch(fetchEmployees());
}, [dispatch]);

  const updateEmployeeAction = useCallback(async (id, data) => {
    try {
      const result = await dispatch(updateEmployee({ id, data })).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const deleteEmployeeAction = useCallback(async (id) => {
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      return true;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const clearSelectedEmployeeAction = useCallback(() => {
    dispatch(clearSelectedEmployee());
  }, [dispatch]);

  const clearErrorAction = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /* =========================
    RETURN
  ========================== */
  return {
    // Data
    employees: list,
    paginatedEmployees,
    selectedEmployee,
    stats,
    growthData,
    filters,
    pagination,
    loading,
    error,

    // Filter actions
    setSearchFilter,
    setDepartmentFilter,
    setStatusFilter,
    setPage,

    // CRUD Actions
    fetchEmployees: fetchEmployeesAction,
    fetchEmployeeById: fetchEmployeeByIdAction,
    createEmployee: createEmployeeAction,
    updateEmployee: updateEmployeeAction,
    deleteEmployee: deleteEmployeeAction,
    
    // Utility Actions
    clearSelectedEmployee: clearSelectedEmployeeAction,
    clearError: clearErrorAction,
  };
};
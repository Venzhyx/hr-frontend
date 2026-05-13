// src/redux/slices/attendanceSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../ApiService/api";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Fetch all employees for dropdown selection
 */
export const fetchAllEmployeesForDropdown = createAsyncThunk(
  "attendance/fetchAllEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/employees");
      const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      return parsed?.data ?? [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal memuat daftar karyawan.");
    }
  }
);

/**
 * Fetch attendance records by employee ID
 */
export const fetchAttendancesByEmployeeId = createAsyncThunk(
  "attendance/fetchByEmployeeId",
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/attendances/employee/${employeeId}`, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      let parsed;
      if (typeof res.data === "string") {
        try {
          parsed = JSON.parse(res.data);
        } catch (parseErr) {
          console.error("[Slice] JSON.parse gagal, kemungkinan response terpotong");
          console.error("[Slice] res.data.length:", res.data.length);
          console.error("[Slice] res.data (100 char terakhir):", res.data.slice(-100));
          return rejectWithValue("Response dari server tidak valid (terpotong).");
        }
      } else {
        parsed = res.data;
      }

      const list = Array.isArray(parsed?.data) ? parsed.data : [];
      return { attendances: list, employeeId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal memuat data absensi.");
    }
  }
);

/**
 * Alias for fetchAttendancesByEmployeeId
 */
export const fetchAttendanceByEmployee = createAsyncThunk(
  "attendance/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/attendances/employee/${employeeId}`, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      let parsed;
      if (typeof res.data === "string") {
        try {
          parsed = JSON.parse(res.data);
        } catch (parseErr) {
          console.error("[Slice] JSON.parse gagal");
          return rejectWithValue("Response dari server tidak valid (terpotong).");
        }
      } else {
        parsed = res.data;
      }

      const list = Array.isArray(parsed?.data) ? parsed.data : [];
      return { attendances: list, employeeId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal memuat data absensi.");
    }
  }
);

/**
 * Fetch single attendance by ID
 */
export const fetchAttendanceById = createAsyncThunk(
  "attendance/fetchById",
  async (attendanceId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/attendances/${attendanceId}`);
      let parsed;
      if (typeof res.data === "string") {
        parsed = JSON.parse(res.data);
      } else {
        parsed = res.data;
      }
      return parsed?.data ?? null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal memuat detail absensi.");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    attendances: [],
      loading: false,
      error: null,
      employees: [],
      loadingEmployees: false,
      lastFetchedEmployeeId: null,
      currentAttendance: null, // For single attendance detail
      checkInStatus: {
        loading: false,
        error: null,
        success: false,
      },
      checkOutStatus: {
        loading: false,
        error: null,
        success: false,
      },
  },
  reducers: {
    /**
     * Clear attendance error message
     */
    clearAttendanceError(state) {
      state.error = null;
    },

    /**
     * Clear all attendance data
     */
    clearAttendanceData(state) {
      state.attendances = [];
      state.error = null;
      state.lastFetchedEmployeeId = null;
      state.currentAttendance = null;
    },

    /**
     * Reset entire attendance state
     */
    resetAttendanceState(state) {
      state.attendances = [];
      state.loading = false;
      state.error = null;
      state.lastFetchedEmployeeId = null;
      state.currentAttendance = null;
      state.checkInStatus = { loading: false, error: null, success: false };
      state.checkOutStatus = { loading: false, error: null, success: false };
    },

    /**
     * UPSERT ATTENDANCE - update existing or add new record
     * This is key for real-time updates after check-in/out
     */
    upsertAttendance(state, action) {
      const updated = action.payload;
      if (!updated?.id) return;
      
      const idx = state.attendances.findIndex((a) => a.id === updated.id);
      if (idx !== -1) {
        // Update existing record
        state.attendances[idx] = { ...state.attendances[idx], ...updated };
      } else {
        // Add new record at the beginning (most recent first)
        state.attendances.unshift(updated);
      }
    },

    /**
     * Remove attendance record by ID
     */
    removeAttendance(state, action) {
      const id = action.payload;
      state.attendances = state.attendances.filter((a) => a.id !== id);
    },

    /**
     * Clear check-in status
     */
    clearCheckInStatus(state) {
      state.checkInStatus = { loading: false, error: null, success: false };
    },

    /**
     * Clear check-out status
     */
    clearCheckOutStatus(state) {
      state.checkOutStatus = { loading: false, error: null, success: false };
    },

    /**
     * Update check-in status manually
     */
    setCheckInStatus(state, action) {
      state.checkInStatus = { ...state.checkInStatus, ...action.payload };
    },

    /**
     * Update check-out status manually
     */
    setCheckOutStatus(state, action) {
      state.checkOutStatus = { ...state.checkOutStatus, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // ========== Fetch Employees for Dropdown ==========
    builder
      .addCase(fetchAllEmployeesForDropdown.pending, (state) => {
        state.loadingEmployees = true;
        state.error = null;
      })
      .addCase(fetchAllEmployeesForDropdown.fulfilled, (state, action) => {
        state.loadingEmployees = false;
        state.employees = action.payload;
      })
      .addCase(fetchAllEmployeesForDropdown.rejected, (state, action) => {
        state.loadingEmployees = false;
        state.error = action.payload;
      });

    // ========== Fetch Attendances by Employee ID ==========
    builder
      .addCase(fetchAttendancesByEmployeeId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendancesByEmployeeId.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances = action.payload.attendances;
        state.lastFetchedEmployeeId = action.payload.employeeId;
      })
      .addCase(fetchAttendancesByEmployeeId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ========== Fetch Attendance by Employee (Alias) ==========
    builder
      .addCase(fetchAttendanceByEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceByEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances = action.payload.attendances;
        state.lastFetchedEmployeeId = action.payload.employeeId;
      })
      .addCase(fetchAttendanceByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ========== Fetch Single Attendance by ID ==========
    builder
      .addCase(fetchAttendanceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(fetchAttendanceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ─── Exports ─────────────────────────────────────────────────────────────────
export const { 
  clearAttendanceError, 
  clearAttendanceData, 
  resetAttendanceState,
  upsertAttendance,
  removeAttendance,
  clearCheckInStatus,
  clearCheckOutStatus,
  setCheckInStatus,
  setCheckOutStatus,
} = attendanceSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Get all attendances from state
 */
export const selectAttendances = (state) => state.attendance.attendances;

/**
 * Get loading state for attendances
 */
export const selectAttendanceLoading = (state) => state.attendance.loading;

/**
 * Get error state for attendances
 */
export const selectAttendanceError = (state) => state.attendance.error;

/**
 * Get all employees from state
 */
export const selectEmployees = (state) => state.attendance.employees;

/**
 * Get loading state for employees
 */
export const selectLoadingEmployees = (state) => state.attendance.loadingEmployees;

/**
 * Get last fetched employee ID
 */
export const selectLastFetchedEmployeeId = (state) => state.attendance.lastFetchedEmployeeId;

/**
 * Get current single attendance
 */
export const selectCurrentAttendance = (state) => state.attendance.currentAttendance;

/**
 * Get check-in status
 */
export const selectCheckInStatus = (state) => state.attendance.checkInStatus;

/**
 * Get check-out status
 */
export const selectCheckOutStatus = (state) => state.attendance.checkOutStatus;

/**
 * Get attendance by ID (memoized selector alternative)
 */
export const selectAttendanceById = (state, id) => 
  state.attendance.attendances.find((att) => att.id === id);

/**
 * Get attendances filtered by date range
 */
export const selectAttendancesByDateRange = (state, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return state.attendance.attendances.filter((att) => {
    const attDate = new Date(att.date);
    return attDate >= start && attDate <= end;
  });
};

/**
 * Get attendances by status
 */
export const selectAttendancesByStatus = (state, status) => {
  if (!status) return state.attendance.attendances;
  return state.attendance.attendances.filter((att) => 
    att.status?.toUpperCase() === status.toUpperCase()
  );
};

/**
 * Get attendance statistics (summary)
 */
export const selectAttendanceStats = (state) => {
  const attendances = state.attendance.attendances;
  const total = attendances.length;
  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  
  return {
    total,
    present,
    late,
    absent,
    presentPercentage: total > 0 ? (present / total) * 100 : 0,
    latePercentage: total > 0 ? (late / total) * 100 : 0,
    absentPercentage: total > 0 ? (absent / total) * 100 : 0,
  };
};

/**
 * Check if employee has checked in today
 */
export const selectHasCheckedInToday = (state, employeeId) => {
  const today = new Date().toISOString().split("T")[0];
  return state.attendance.attendances.some(
    (att) => att.employeeId === employeeId && att.date === today && att.checkIn
  );
};

/**
 * Check if employee has checked out today
 */
export const selectHasCheckedOutToday = (state, employeeId) => {
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = state.attendance.attendances.find(
    (att) => att.employeeId === employeeId && att.date === today
  );
  return todayAttendance?.checkOut != null;
};

/**
 * Get today's attendance for an employee
 */
export const selectTodayAttendance = (state, employeeId) => {
  const today = new Date().toISOString().split("T")[0];
  return state.attendance.attendances.find(
    (att) => att.employeeId === employeeId && att.date === today
  );
};

export default attendanceSlice.reducer;
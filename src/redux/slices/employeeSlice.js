import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getEmployeesAPI,
  getEmployeeByIdAPI,
  createEmployeeAPI,
  updateEmployeeAPI,
  deleteEmployeeAPI,
} from "../../ApiService/employeeApi";

/* ================= FETCH ALL EMPLOYEES ================= */
export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getEmployeesAPI();
      return response.data; // { success, message, data: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= FETCH EMPLOYEE BY ID ================= */
export const fetchEmployeeById = createAsyncThunk(
  "employees/fetchEmployeeById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getEmployeeByIdAPI(id);
      return response.data; // { success, message, data: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= CREATE EMPLOYEE ================= */
export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await createEmployeeAPI(employeeData);
      return response.data; // { success, message, data: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= UPDATE EMPLOYEE ================= */
export const updateEmployee = createAsyncThunk(
  "employees/updateEmployee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateEmployeeAPI(id, data);
      return response.data; // { success, message, data: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= DELETE EMPLOYEE ================= */
export const deleteEmployee = createAsyncThunk(
  "employees/deleteEmployee",
  async (id, { rejectWithValue }) => {
    try {
      await deleteEmployeeAPI(id);
      return id; // Return ID for filtering
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= SLICE ================= */
const employeeSlice = createSlice({
  name: "employees",
  initialState: {
    list: [],
    selectedEmployee: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== FETCH ALL EMPLOYEES ===== */
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || [];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch employees";
      })

      /* ===== FETCH EMPLOYEE BY ID ===== */
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmployee = action.payload?.data || null;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch employee";
      })

      /* ===== CREATE EMPLOYEE ===== */
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          state.list.push(action.payload.data);
        }
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create employee";
      })

      /* ===== UPDATE EMPLOYEE ===== */
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data;
        if (!updated) return;

        // Update di list
        const index = state.list.findIndex((emp) => emp.id === updated.id);
        if (index !== -1) {
          state.list[index] = updated;
        }

        // Update selectedEmployee jika sedang dilihat
        if (state.selectedEmployee?.id === updated.id) {
          state.selectedEmployee = updated;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update employee";
      })

      /* ===== DELETE EMPLOYEE ===== */
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((emp) => emp.id !== action.payload);
        
        // Clear selectedEmployee jika yang dihapus sedang dilihat
        if (state.selectedEmployee?.id === action.payload) {
          state.selectedEmployee = null;
        }
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete employee";
      });
  },
});

export const { clearSelectedEmployee, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;
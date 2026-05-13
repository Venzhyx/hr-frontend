import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDepartmentsAPI,
  getDepartmentByIdAPI, 
  createDepartmentAPI,
  updateDepartmentAPI,
  deleteDepartmentAPI,
} from "../../ApiService/departmentApi";

/* ================= FETCH ================= */

export const fetchDepartments = createAsyncThunk(
  "departments/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDepartmentsAPI();
      return response.data; // { success, message, data }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= CREATE ================= */

export const createDepartment = createAsyncThunk(
  "departments/createDepartment",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createDepartmentAPI(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  "departments/fetchDepartmentById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getDepartmentByIdAPI(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= UPDATE ================= */

export const updateDepartment = createAsyncThunk(
  "departments/updateDepartment",
  async (department, { rejectWithValue }) => {
    try {
      const response = await updateDepartmentAPI(department.id, department);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= DELETE ================= */

export const deleteDepartment = createAsyncThunk(
  "departments/deleteDepartment",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDepartmentAPI(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= SLICE ================= */

const departmentSlice = createSlice({
  name: "departments",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.list.push(action.payload.data);
      })

      // UPDATE
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.list.findIndex(
          (dept) => dept.id === updated.id
        );
        if (index !== -1) {
          state.list[index] = updated;
        }
      })

      // FETCH BY ID
      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartmentById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (dept) => dept.id !== action.payload
        );
      });
  },
});

export default departmentSlice.reducer;
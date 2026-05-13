import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCompaniesAPI,
  createCompanyAPI,
  updateCompanyAPI,
  deleteCompanyAPI,
} from "../../ApiService/companyApi";

/* ================= FETCH ================= */

export const fetchCompanies = createAsyncThunk(
  "companies/fetchCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCompaniesAPI();
      return response.data; // { success, message, data }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= CREATE (MULTIPART) ================= */

export const createCompany = createAsyncThunk(
  "companies/createCompany",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createCompanyAPI(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= UPDATE (MULTIPART) ================= */

export const updateCompany = createAsyncThunk(
  "companies/updateCompany",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await updateCompanyAPI(id, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= DELETE ================= */

export const deleteCompany = createAsyncThunk(
  "companies/deleteCompany",
  async (id, { rejectWithValue }) => {
    try {
      await deleteCompanyAPI(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ================= SLICE ================= */

const companySlice = createSlice({
  name: "companies",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* ===== FETCH ===== */
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== CREATE ===== */
      .addCase(createCompany.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.list.push(action.payload.data);
        }
      })

      /* ===== UPDATE ===== */
      .addCase(updateCompany.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (!updated) return;

        const index = state.list.findIndex(
          (company) => company.id === updated.id
        );

        if (index !== -1) {
          state.list[index] = updated;
        }
      })

      /* ===== DELETE ===== */
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (company) => company.id !== action.payload
        );
      });
  },
});

export default companySlice.reducer;
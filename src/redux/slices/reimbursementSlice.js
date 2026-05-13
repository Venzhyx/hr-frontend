import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getReimbursementsAPI,
  getReimbursementByIdAPI,
  createReimbursementAPI,
  updateReimbursementAPI,
  deleteReimbursementAPI,
  approveReimbursementAPI,
  rejectReimbursementAPI,
} from "../../ApiService/reimbursementApi";

export const fetchReimbursements = createAsyncThunk(
  "reimbursements/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getReimbursementsAPI();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchReimbursementById = createAsyncThunk(
  "reimbursements/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getReimbursementByIdAPI(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createReimbursement = createAsyncThunk(
  "reimbursements/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createReimbursementAPI(payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateReimbursement = createAsyncThunk(
  "reimbursements/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await updateReimbursementAPI(id, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteReimbursement = createAsyncThunk(
  "reimbursements/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteReimbursementAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const approveReimbursement = createAsyncThunk(
  "reimbursements/approve",
  async ({ id, approverId, notes }, { rejectWithValue }) => {
    try {
      const res = await approveReimbursementAPI(id, { approverId, notes });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const rejectReimbursement = createAsyncThunk(
  "reimbursements/reject",
  async ({ id, approverId, notes }, { rejectWithValue }) => {
    try {
      const res = await rejectReimbursementAPI(id, { approverId, notes });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const reimbursementSlice = createSlice({
  name: "reimbursements",
  initialState: {
    list:    [],
    loading: false,
    error:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const pending  = (s)    => { s.loading = true;  s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };

    builder
      .addCase(fetchReimbursements.pending,   pending)
      .addCase(fetchReimbursements.fulfilled, (s, a) => { s.loading = false; s.list = a.payload || []; })
      .addCase(fetchReimbursements.rejected,  rejected)

      .addCase(fetchReimbursementById.pending,   pending)
      .addCase(fetchReimbursementById.fulfilled, (s) => { s.loading = false; })
      .addCase(fetchReimbursementById.rejected,  rejected)

      .addCase(createReimbursement.pending,   pending)
      .addCase(createReimbursement.fulfilled, (s, a) => { s.loading = false; if (a.payload) s.list.unshift(a.payload); })
      .addCase(createReimbursement.rejected,  rejected)

      .addCase(updateReimbursement.pending,   pending)
      .addCase(updateReimbursement.fulfilled, (s, a) => { s.loading = false; if (a.payload) s.list = s.list.map(r => r.id === a.payload.id ? a.payload : r); })
      .addCase(updateReimbursement.rejected,  rejected)

      .addCase(deleteReimbursement.pending,   pending)
      .addCase(deleteReimbursement.fulfilled, (s, a) => { s.loading = false; s.list = s.list.filter(r => r.id !== a.payload); })
      .addCase(deleteReimbursement.rejected,  rejected)

      .addCase(approveReimbursement.fulfilled, (s, a) => { if (a.payload) s.list = s.list.map(r => r.id === a.payload.id ? a.payload : r); })
      .addCase(rejectReimbursement.fulfilled,  (s, a) => { if (a.payload) s.list = s.list.map(r => r.id === a.payload.id ? a.payload : r); });
  },
});

export default reimbursementSlice.reducer;
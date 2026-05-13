import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getTimeOffTypesAPI,
  createTimeOffTypeAPI,
  updateTimeOffTypeAPI,
  deleteTimeOffTypeAPI,
} from '../../ApiService/settingsApi';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTimeOffTypes = createAsyncThunk(
  'timeOffTypes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getTimeOffTypesAPI();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createTimeOffType = createAsyncThunk(
  'timeOffTypes/create',
  async (payload, { rejectWithValue }) => {
    // payload: { name, type: 'LEAVE'|'PERMISSION', maxDaysPerSubmission, status: 'ACTIVE'|'INACTIVE' }
    try {
      const res = await createTimeOffTypeAPI(payload);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateTimeOffType = createAsyncThunk(
  'timeOffTypes/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await updateTimeOffTypeAPI(id, payload);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTimeOffType = createAsyncThunk(
  'timeOffTypes/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteTimeOffTypeAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const timeOffTypeSlice = createSlice({
  name: 'timeOffTypes',
  initialState: {
    types:   [],
    loading: false,
    saving:  false,
    error:   null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeOffTypes.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchTimeOffTypes.fulfilled, (state, { payload }) => { state.loading = false; state.types = payload; })
      .addCase(fetchTimeOffTypes.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; });

    builder
      .addCase(createTimeOffType.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(createTimeOffType.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload) state.types.push(payload);
      })
      .addCase(createTimeOffType.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });

    builder
      .addCase(updateTimeOffType.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(updateTimeOffType.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload) state.types = state.types.map(t => t.id === payload.id ? payload : t);
      })
      .addCase(updateTimeOffType.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });

    builder
      .addCase(deleteTimeOffType.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(deleteTimeOffType.fulfilled, (state, { payload: id }) => {
        state.saving = false;
        state.types  = state.types.filter(t => t.id !== id);
      })
      .addCase(deleteTimeOffType.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });
  },
});

export const { clearError } = timeOffTypeSlice.actions;
export default timeOffTypeSlice.reducer;

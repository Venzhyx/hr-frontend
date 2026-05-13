import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCalendarEventsAPI,
  createCalendarEventAPI,
  updateCalendarEventAPI,
  deleteCalendarEventAPI,
} from '../../ApiService/settingsApi';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCalendarEvents = createAsyncThunk(
  'calendarEvents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCalendarEventsAPI();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createCalendarEvent = createAsyncThunk(
  'calendarEvents/create',
  async (payload, { rejectWithValue }) => {
    // payload: { eventDate: 'YYYY-MM-DD', eventName: string, eventType: string }
    try {
      const res = await createCalendarEventAPI(payload);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCalendarEvent = createAsyncThunk(
  'calendarEvents/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await updateCalendarEventAPI(id, payload);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteCalendarEvent = createAsyncThunk(
  'calendarEvents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteCalendarEventAPI(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const calendarEventSlice = createSlice({
  name: 'calendarEvents',
  initialState: {
    events:  [],
    loading: false,
    saving:  false,
    error:   null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarEvents.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchCalendarEvents.fulfilled, (state, { payload }) => { state.loading = false; state.events = payload; })
      .addCase(fetchCalendarEvents.rejected,  (state, { payload }) => { state.loading = false; state.error  = payload; });

    builder
      .addCase(createCalendarEvent.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(createCalendarEvent.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload) state.events.push(payload);
      })
      .addCase(createCalendarEvent.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });

    builder
      .addCase(updateCalendarEvent.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(updateCalendarEvent.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload) state.events = state.events.map(e => e.id === payload.id ? payload : e);
      })
      .addCase(updateCalendarEvent.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });

    builder
      .addCase(deleteCalendarEvent.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(deleteCalendarEvent.fulfilled, (state, { payload: id }) => {
        state.saving = false;
        state.events = state.events.filter(e => e.id !== id);
      })
      .addCase(deleteCalendarEvent.rejected,  (state, { payload }) => { state.saving = false; state.error = payload; });
  },
});

export const { clearError } = calendarEventSlice.actions;
export default calendarEventSlice.reducer;

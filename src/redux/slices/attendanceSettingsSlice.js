import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAttendanceSettingsAPI, updateAttendanceSettingsAPI } from '../../ApiService/settingsApi';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchAttendanceSettings = createAsyncThunk(
  'attendanceSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAttendanceSettingsAPI();
      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAttendanceSettings = createAsyncThunk(
  'attendanceSettings/update',
  async (payload, { rejectWithValue }) => {
    try {
      // Konversi "HH:mm" → "HH:mm:ss" supaya backend (LocalTime) menerima dengan benar
      const normalized = {
        ...payload,
        checkInTime:  payload.checkInTime  ? toLocalTime(payload.checkInTime)  : undefined,
        checkOutTime: payload.checkOutTime ? toLocalTime(payload.checkOutTime) : undefined,
      };
      const res = await updateAttendanceSettingsAPI(normalized);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// "HH:mm" atau "HH:mm:ss" → "HH:mm:ss"
const toLocalTime = (t) => {
  if (!t) return undefined;
  return t.length === 5 ? `${t}:00` : t;
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  id:                             null,
  toleranceTimeInFavorOfEmployee: 0,
  extraHoursValidation:           'APPROVED_BY_MANAGER',
  checkInTime:                    '08:00:00',
  checkOutTime:                   '17:00:00',
  createdAt:                      null,
  updatedAt:                      null,
};

const attendanceSettingsSlice = createSlice({
  name: 'attendanceSettings',
  initialState: {
    data:    DEFAULT_SETTINGS,
    loading: false,
    saving:  false,
    error:   null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchAttendanceSettings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data    = payload ?? DEFAULT_SETTINGS;
      })
      .addCase(fetchAttendanceSettings.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    builder
      .addCase(updateAttendanceSettings.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(updateAttendanceSettings.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (payload) state.data = payload;
      })
      .addCase(updateAttendanceSettings.rejected,  (state, { payload }) => {
        state.saving = false;
        state.error  = payload;
      });
  },
});

export const { clearError } = attendanceSettingsSlice.actions;
export default attendanceSettingsSlice.reducer;

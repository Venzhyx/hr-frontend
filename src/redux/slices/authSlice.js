import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../ApiService/authApi';

// ─── Storage helpers ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'hr_token';
const USER_KEY  = 'hr_user';

const saveToStorage = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(user));
  } catch { /* ignore */ }
};

const clearStorage = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
};

const loadFromStorage = () => {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) ?? null,
      user:  JSON.parse(localStorage.getItem(USER_KEY)) ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res  = await authApi.login({ username, password });
      const data = res?.data ?? res;
      return data; // { token, role, userId, username, employeeId }
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message ?? e.message ?? 'Login gagal'
      );
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await authApi.register(payload);
      const data = res?.data ?? res;
      return data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message ?? e.message ?? 'Registrasi gagal'
      );
    }
  }
);

// ─── Initial state — rehydrate dari localStorage ──────────────────────────────
const stored = loadFromStorage();

const initialState = {
  token:           stored.token,
  user:            stored.user,   // { userId, username, role, employeeId }
  isAuthenticated: !!stored.token,
  loading:         false,
  error:           null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token           = null;
      state.user            = null;
      state.isAuthenticated = false;
      state.error           = null;
      clearStorage();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── LOGIN ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.token           = payload.token;
        state.isAuthenticated = true;
        state.user            = {
          userId:     payload.userId,
          username:   payload.username,
          role:       payload.role,       // 'ADMIN' | 'EMPLOYEE'
          employeeId: payload.employeeId, // null untuk ADMIN
        };
        saveToStorage(payload.token, state.user);
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      })

    // ── REGISTER ───────────────────────────────────────────────────────────
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        // Register tidak auto-login — admin yang register, user login sendiri
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

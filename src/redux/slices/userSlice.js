import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userApi } from "../../ApiService/userApi";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getAll();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal mengambil data users");
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await userApi.getById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal mengambil data user");
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await userApi.update(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal mengupdate user");
    }
  }
);

export const toggleUserActive = createAsyncThunk(
  "users/toggleActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await userApi.toggleActive(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal toggle status user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await userApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal menghapus user");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchById
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // update
    builder
      .addCase(updateUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selected = action.payload;
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // toggleActive
    builder
      .addCase(toggleUserActive.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(toggleUserActive.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // delete
    builder
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, clearError } = userSlice.actions;
export default userSlice.reducer;

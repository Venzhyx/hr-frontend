import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { overtimeApi } from "../../ApiService/overtimeApi";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchAllOvertimes = createAsyncThunk(
  "overtime/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.getAllOvertimes();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal memuat data lembur");
    }
  }
);

export const fetchOvertimesByEmployee = createAsyncThunk(
  "overtime/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.getOvertimesByEmployee(employeeId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal memuat data lembur");
    }
  }
);

export const fetchTotalOvertimeByEmployee = createAsyncThunk(
  "overtime/fetchTotal",
  async ({ employeeId, month, year }, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.getTotalOvertimeByEmployee(employeeId, month, year);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal memuat total lembur");
    }
  }
);

export const createOvertime = createAsyncThunk(
  "overtime/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.createOvertime(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal membuat pengajuan lembur");
    }
  }
);

export const approveOvertime = createAsyncThunk(
  "overtime/approve",
  async ({ id, approverId, notes }, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.approveOvertime(id, approverId, notes);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal menyetujui lembur");
    }
  }
);

export const rejectOvertime = createAsyncThunk(
  "overtime/reject",
  async ({ id, approverId, notes }, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.rejectOvertime(id, approverId, notes);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal menolak lembur");
    }
  }
);

// TAMBAH: Update Overtime
export const updateOvertime = createAsyncThunk(
  "overtime/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await overtimeApi.updateOvertime(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal mengupdate lembur");
    }
  }
);

// TAMBAH: Delete Overtime
export const deleteOvertime = createAsyncThunk(
  "overtime/delete",
  async (id, { rejectWithValue }) => {
    try {
      await overtimeApi.deleteOvertime(id);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Gagal menghapus lembur");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const overtimeSlice = createSlice({
  name: "overtime",
  initialState: {
    overtimes: [],
    totalHours: null,
    loading: false,
    error: null,
    actionLoading: false,
    actionError: null,
    isModalOpen: false,
    isDetailModalOpen: false,
    selectedOvertime: null,
    filterStatus: "ALL",
    filterType: "ALL",
  },
  reducers: {
    openCreateModal(state) {
      state.isModalOpen = true;
      state.actionError = null;
    },
    closeCreateModal(state) {
      state.isModalOpen = false;
      state.actionError = null;
    },
    openDetailModal(state, action) {
      state.selectedOvertime = action.payload;
      state.isDetailModalOpen = true;
      state.actionError = null;
    },
    closeDetailModal(state) {
      state.isDetailModalOpen = false;
      state.selectedOvertime = null;
      state.actionError = null;
    },
    setFilterStatus(state, action) {
      state.filterStatus = action.payload;
    },
    setFilterType(state, action) {
      state.filterType = action.payload;
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchAllOvertimes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOvertimes.fulfilled, (state, action) => {
        state.loading = false;
        state.overtimes = action.payload ?? [];
      })
      .addCase(fetchAllOvertimes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchByEmployee
    builder
      .addCase(fetchOvertimesByEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOvertimesByEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.overtimes = action.payload ?? [];
      })
      .addCase(fetchOvertimesByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchTotal
    builder.addCase(fetchTotalOvertimeByEmployee.fulfilled, (state, action) => {
      state.totalHours = action.payload ?? 0;
    });

    // create
    builder
      .addCase(createOvertime.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createOvertime.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) state.overtimes.unshift(action.payload);
        state.isModalOpen = false;
      })
      .addCase(createOvertime.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // approve
    builder
      .addCase(approveOvertime.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveOvertime.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const idx = state.overtimes.findIndex((o) => o.id === action.payload.id);
          if (idx !== -1) state.overtimes[idx] = action.payload;
        }
        state.isDetailModalOpen = false;
        state.selectedOvertime = null;
      })
      .addCase(approveOvertime.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // reject
    builder
      .addCase(rejectOvertime.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectOvertime.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const idx = state.overtimes.findIndex((o) => o.id === action.payload.id);
          if (idx !== -1) state.overtimes[idx] = action.payload;
        }
        state.isDetailModalOpen = false;
        state.selectedOvertime = null;
      })
      .addCase(rejectOvertime.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // TAMBAH: update
    builder
      .addCase(updateOvertime.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateOvertime.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const idx = state.overtimes.findIndex((o) => o.id === action.payload.id);
          if (idx !== -1) state.overtimes[idx] = action.payload;
        }
        state.isModalOpen = false;
        state.selectedOvertime = null;
        state.actionError = null;
      })
      .addCase(updateOvertime.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // TAMBAH: delete
    builder
      .addCase(deleteOvertime.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteOvertime.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.overtimes = state.overtimes.filter((o) => o.id !== action.payload.id);
        state.actionError = null;
      })
      .addCase(deleteOvertime.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  openCreateModal,
  closeCreateModal,
  openDetailModal,
  closeDetailModal,
  setFilterStatus,
  setFilterType,
  clearActionError,
} = overtimeSlice.actions;

export default overtimeSlice.reducer;
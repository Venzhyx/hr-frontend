import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createCorrectionAPI,
  getAllCorrectionsAPI,
  getMyCorrectionsByEmployeeAPI,
  approveCorrectionAPI,
  rejectCorrectionAPI,
  updateCorrectionAPI,      // TAMBAH
  deleteCorrectionAPI,      // TAMBAH
} from "../../ApiService/attendanceCorrection";

// Fetch all corrections (admin)
export const fetchAllCorrections = createAsyncThunk(
  "attendanceCorrection/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[fetchAllCorrections] Calling API...");
      const res = await getAllCorrectionsAPI();
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      const list = data?.data ?? data ?? [];
      console.log("[fetchAllCorrections] Got", list.length, "records");
      return list;
    } catch (err) {
      console.error("[fetchAllCorrections] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Gagal memuat data koreksi.");
    }
  }
);

export const fetchCorrectionsByEmployee = createAsyncThunk(
  "attendanceCorrection/fetchByEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await getMyCorrectionsByEmployeeAPI(employeeId);
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      const list = data?.data ?? data ?? [];
      return list;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal memuat data koreksi.");
    }
  }
);

export const createCorrection = createAsyncThunk(
  "attendanceCorrection/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createCorrectionAPI(data);
      let responseData = res.data;
      if (typeof responseData === "string") {
        responseData = JSON.parse(responseData);
      }
      return responseData?.data ?? responseData;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Gagal membuat koreksi.");
    }
  }
);

// Approve correction
export const approveCorrection = createAsyncThunk(
  "attendanceCorrection/approve",
  async ({ id, adminId }, { rejectWithValue }) => {
    try {
      console.log("[approveCorrection] Calling API with:", { id, adminId });
      const res = await approveCorrectionAPI(id, adminId);
      let responseData = res.data;
      if (typeof responseData === "string") {
        responseData = JSON.parse(responseData);
      }
      console.log("[approveCorrection] Response:", responseData);
      return responseData?.data ?? responseData;
    } catch (err) {
      console.error("[approveCorrection] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Gagal menyetujui koreksi.");
    }
  }
);

// Reject correction
export const rejectCorrection = createAsyncThunk(
  "attendanceCorrection/reject",
  async ({ id, adminId }, { rejectWithValue }) => {
    try {
      console.log("[rejectCorrection] Calling API with:", { id, adminId });
      const res = await rejectCorrectionAPI(id, adminId);
      let responseData = res.data;
      if (typeof responseData === "string") {
        responseData = JSON.parse(responseData);
      }
      console.log("[rejectCorrection] Response:", responseData);
      return responseData?.data ?? responseData;
    } catch (err) {
      console.error("[rejectCorrection] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Gagal menolak koreksi.");
    }
  }
);

// TAMBAH: Update Correction
export const updateCorrection = createAsyncThunk(
  "attendanceCorrection/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log("[updateCorrection] Calling API with:", { id, data });
      const res = await updateCorrectionAPI(id, data);
      let responseData = res.data;
      if (typeof responseData === "string") {
        responseData = JSON.parse(responseData);
      }
      console.log("[updateCorrection] Response:", responseData);
      return responseData?.data ?? responseData;
    } catch (err) {
      console.error("[updateCorrection] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Gagal mengupdate koreksi.");
    }
  }
);

// TAMBAH: Delete Correction
export const deleteCorrection = createAsyncThunk(
  "attendanceCorrection/delete",
  async (id, { rejectWithValue }) => {
    try {
      console.log("[deleteCorrection] Calling API for id:", id);
      const res = await deleteCorrectionAPI(id);
      console.log("[deleteCorrection] Response:", res.data);
      return { id, data: res.data };
    } catch (err) {
      console.error("[deleteCorrection] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Gagal menghapus koreksi.");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const attendanceCorrectionSlice = createSlice({
  name: "attendanceCorrection",
  initialState: {
    list: [],
    loading: false,
    error: null,
    actionLoading: false,
    actionError: null,
    isModalOpen: false,
    isDetailModalOpen: false,
    selectedCorrection: null,
    filterStatus: "ALL",
    filterType: "ALL",
  },
  reducers: {
    clearCorrectionError(state) {
      state.error = null;
      state.actionError = null;
    },
    clearCorrectionList(state) {
      state.list = [];
      state.error = null;
    },
    openCreateModal(state) {
      state.isModalOpen = true;
      state.selectedCorrection = null;
    },
    closeCreateModal(state) {
      state.isModalOpen = false;
    },
    openDetailModal(state, action) {
      state.isDetailModalOpen = true;
      state.selectedCorrection = action.payload;
    },
    closeDetailModal(state) {
      state.isDetailModalOpen = false;
      state.selectedCorrection = null;
    },
    setFilterStatus(state, action) {
      state.filterStatus = action.payload;
    },
    setFilterType(state, action) {
      state.filterType = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchAllCorrections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCorrections.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllCorrections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchByEmployee
    builder
      .addCase(fetchCorrectionsByEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCorrectionsByEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCorrectionsByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createCorrection.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createCorrection.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.list.unshift(action.payload);
        }
        state.isModalOpen = false;
      })
      .addCase(createCorrection.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // approve
    builder
      .addCase(approveCorrection.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveCorrection.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const index = state.list.findIndex((c) => c.id === action.payload.id);
          if (index !== -1) {
            state.list[index] = action.payload;
          }
        }
        state.isDetailModalOpen = false;
        state.selectedCorrection = null;
      })
      .addCase(approveCorrection.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // reject
    builder
      .addCase(rejectCorrection.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectCorrection.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const index = state.list.findIndex((c) => c.id === action.payload.id);
          if (index !== -1) {
            state.list[index] = action.payload;
          }
        }
        state.isDetailModalOpen = false;
        state.selectedCorrection = null;
      })
      .addCase(rejectCorrection.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // TAMBAH: update
    builder
      .addCase(updateCorrection.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateCorrection.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const index = state.list.findIndex((c) => c.id === action.payload.id);
          if (index !== -1) {
            state.list[index] = action.payload;
          }
        }
        state.isModalOpen = false;
        state.selectedCorrection = null;
        state.actionError = null;
      })
      .addCase(updateCorrection.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // TAMBAH: delete
    builder
      .addCase(deleteCorrection.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteCorrection.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.filter((c) => c.id !== action.payload.id);
        state.actionError = null;
      })
      .addCase(deleteCorrection.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearCorrectionError,
  clearCorrectionList,
  openCreateModal,
  closeCreateModal,
  openDetailModal,
  closeDetailModal,
  setFilterStatus,
  setFilterType,
} = attendanceCorrectionSlice.actions;

// Selectors
export const selectCorrectionList = (state) => state.attendanceCorrection.list;
export const selectCorrectionLoading = (state) => state.attendanceCorrection.loading;
export const selectCorrectionError = (state) => state.attendanceCorrection.error;
export const selectCorrectionActionLoading = (state) => state.attendanceCorrection.actionLoading;
export const selectCorrectionActionError = (state) => state.attendanceCorrection.actionError;
export const selectIsModalOpen = (state) => state.attendanceCorrection.isModalOpen;
export const selectIsDetailModalOpen = (state) => state.attendanceCorrection.isDetailModalOpen;
export const selectSelectedCorrection = (state) => state.attendanceCorrection.selectedCorrection;
export const selectFilterStatus = (state) => state.attendanceCorrection.filterStatus;
export const selectFilterType = (state) => state.attendanceCorrection.filterType;

export default attendanceCorrectionSlice.reducer;
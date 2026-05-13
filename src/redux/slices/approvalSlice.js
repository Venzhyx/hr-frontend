import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getApprovalApproversAPI,
  createApprovalApproverAPI,
  deleteApprovalApproverAPI,
} from "../../ApiService/approvalApi";

// Helper: create thunks untuk setiap module dengan type parameter
const createModuleThunks = (moduleType) => {
  const fetchThunk = createAsyncThunk(
    `approval/${moduleType}/fetch`,
    async (_, { rejectWithValue }) => {
      try {
        const res = await getApprovalApproversAPI(moduleType);
        return { module: moduleType, data: res.data.data };
      } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
      }
    }
  );

  const createThunk = createAsyncThunk(
    `approval/${moduleType}/create`,
    async (data, { rejectWithValue }) => {
      try {
        const payload = { ...data, type: moduleType };
        const res = await createApprovalApproverAPI(payload);
        return { module: moduleType, data: res.data.data };
      } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
      }
    }
  );

  const deleteThunk = createAsyncThunk(
    `approval/${moduleType}/delete`,
    async (id, { rejectWithValue }) => {
      try {
        await deleteApprovalApproverAPI(id);
        return { module: moduleType, id };
      } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
      }
    }
  );

  return { fetch: fetchThunk, create: createThunk, delete: deleteThunk };
};

// Create thunks untuk semua module
export const reimbursementThunks = createModuleThunks("reimbursement");
export const timeoffThunks = createModuleThunks("timeoff");
export const attendanceThunks = createModuleThunks("attendance");
export const overtimeThunks = createModuleThunks("overtime");

// Backward compatibility
export const fetchApprovalApprovers = reimbursementThunks.fetch;
export const createApprovalApprover = reimbursementThunks.create;
export const deleteApprovalApprover = reimbursementThunks.delete;

const initialState = {
  reimbursement: { approvers: [], loading: false, error: null },
  timeoff: { approvers: [], loading: false, error: null },
  attendance: { approvers: [], loading: false, error: null },
  overtime: { approvers: [], loading: false, error: null },
};

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    clearModuleError: (state, action) => {
      const { module } = action.payload;
      if (state[module]) state[module].error = null;
    },
  },
  extraReducers: (builder) => {
    const addModuleCases = (thunks, moduleName) => {
      builder
        .addCase(thunks.fetch.pending, (state) => {
          state[moduleName].loading = true;
          state[moduleName].error = null;
        })
        .addCase(thunks.fetch.fulfilled, (state, action) => {
          state[moduleName].loading = false;
          state[moduleName].approvers = action.payload.data || [];
        })
        .addCase(thunks.fetch.rejected, (state, action) => {
          state[moduleName].loading = false;
          state[moduleName].error = action.payload;
        })
        .addCase(thunks.create.pending, (state) => {
          state[moduleName].loading = true;
          state[moduleName].error = null;
        })
        .addCase(thunks.create.fulfilled, (state, action) => {
          state[moduleName].loading = false;
          if (action.payload.data) {
            state[moduleName].approvers.push(action.payload.data);
          }
        })
        .addCase(thunks.create.rejected, (state, action) => {
          state[moduleName].loading = false;
          state[moduleName].error = action.payload;
        })
        .addCase(thunks.delete.pending, (state) => {
          state[moduleName].loading = true;
          state[moduleName].error = null;
        })
        .addCase(thunks.delete.fulfilled, (state, action) => {
          state[moduleName].loading = false;
          state[moduleName].approvers = state[moduleName].approvers.filter(
            (x) => x.id !== action.payload.id
          );
        })
        .addCase(thunks.delete.rejected, (state, action) => {
          state[moduleName].loading = false;
          state[moduleName].error = action.payload;
        });
    };

    addModuleCases(reimbursementThunks, "reimbursement");
    addModuleCases(timeoffThunks, "timeoff");
    addModuleCases(attendanceThunks, "attendance");
    addModuleCases(overtimeThunks, "overtime");
  },
});

export const { clearModuleError } = approvalSlice.actions;
export default approvalSlice.reducer;
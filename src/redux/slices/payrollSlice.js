import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payrollApi as api } from '../../ApiService/payrollApi';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
const unwrap = (res) => {
  if (res && !Array.isArray(res) && typeof res === 'object' && 'data' in res) {
    return res.data;
  }
  return res;
};

const unwrapArray = (res) => {
  const val = unwrap(res);
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && 'content' in val) return val.content;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// THUNKS — SALARY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const fetchComponents = createAsyncThunk(
  'payroll/fetchComponents',
  async (activeOnly = false, { rejectWithValue }) => {
    try { return await api.getSalaryComponents(activeOnly); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat komponen gaji'); }
  }
);

export const createComponent = createAsyncThunk(
  'payroll/createComponent',
  async (data, { rejectWithValue }) => {
    try { return await api.createSalaryComponent(data); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal membuat komponen gaji'); }
  }
);

export const updateComponent = createAsyncThunk(
  'payroll/updateComponent',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await api.updateSalaryComponent(id, data); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal mengupdate komponen'); }
  }
);

export const deleteComponent = createAsyncThunk(
  'payroll/deleteComponent',
  async (id, { rejectWithValue }) => {
    try { await api.deleteSalaryComponent(id); return id; }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal menonaktifkan komponen'); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// THUNKS — EMPLOYEE SALARY
// ─────────────────────────────────────────────────────────────────────────────

export const fetchEmployeeSalary = createAsyncThunk(
  'payroll/fetchEmployeeSalary',
  async (employeeId, { rejectWithValue }) => {
    try { return await api.getEmployeeSalary(employeeId); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat gaji karyawan'); }
  }
);

export const fetchEmployeeSalaryHistory = createAsyncThunk(
  'payroll/fetchEmployeeSalaryHistory',
  async (employeeId, { rejectWithValue }) => {
    try { return await api.getEmployeeSalaryHistory(employeeId); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat riwayat gaji'); }
  }
);

export const saveEmployeeSalary = createAsyncThunk(
  'payroll/saveEmployeeSalary',
  async (data, { rejectWithValue }) => {
    try { return await api.setEmployeeSalary(data); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal menyimpan gaji karyawan'); }
  }
);

export const addSalaryComponent = createAsyncThunk(
  'payroll/addSalaryComponent',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await api.addEmployeeSalaryComponent(id, data); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal menambah komponen'); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// THUNKS — PAYROLL RUN
// ─────────────────────────────────────────────────────────────────────────────

export const runPayroll = createAsyncThunk(
  'payroll/run',
  async (data, { rejectWithValue }) => {
    try { return await api.runPayroll(data); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal menjalankan payroll'); }
  }
);

export const fetchPayrollRuns = createAsyncThunk(
  'payroll/fetchPayrollRuns',
  async (_, { rejectWithValue }) => {
    try { return await api.getPayrollRuns(); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat riwayat payroll'); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// THUNKS — PAYSLIP
// ─────────────────────────────────────────────────────────────────────────────

export const fetchPayslipsByEmployee = createAsyncThunk(
  'payroll/fetchPayslipsByEmployee',
  async (employeeId, { rejectWithValue }) => {
    try { return await api.getPayslipsByEmployee(employeeId); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat payslip'); }
  }
);

export const fetchPayslipDetail = createAsyncThunk(
  'payroll/fetchPayslipDetail',
  async (payslipId, { rejectWithValue }) => {
    try { return await api.getPayslipDetail(payslipId); }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal memuat detail payslip'); }
  }
);

// ─── APPROVE PAYSLIP ──────────────────────────────────────────────────────────
// ─── FIX: sertakan payslipId sebagai meta agar bisa dipakai di fulfilled
//     jika API tidak mengembalikan body (204 No Content)
export const approvePayslip = createAsyncThunk(
  'payroll/approvePayslip',
  async (payslipId, { rejectWithValue }) => {
    try {
      // payrollApi sudah return response.data langsung (bukan axios response)
      // jadi tidak perlu res?.data lagi — langsung spread saja
      const data = await api.approvePayslip(payslipId);
      // Selalu sertakan payslipId agar reducer tidak bergantung pada response body
      // (aman untuk API yang return 204 No Content)
      return { payslipId, ...(data != null && typeof data === 'object' ? data : {}) };
    }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal approve payslip'); }
  }
);

// ─── MARK AS PAID ─────────────────────────────────────────────────────────────
export const markPayslipAsPaid = createAsyncThunk(
  'payroll/markPayslipAsPaid',
  async (payslipId, { rejectWithValue }) => {
    try {
      const data = await api.markAsPaid(payslipId);
      return { payslipId, ...(data != null && typeof data === 'object' ? data : {}) };
    }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal mark as paid'); }
  }
);

// ─── DELETE PAYSLIP ───────────────────────────────────────────────────────────
export const deletePayslip = createAsyncThunk(
  'payroll/deletePayslip',
  async (payslipId, { rejectWithValue }) => {
    try { await api.deletePayslip(payslipId); return payslipId; }
    catch (e) { return rejectWithValue(e.response?.data?.message ?? 'Gagal menghapus payslip'); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'payroll_run_history';
const loadRunHistory = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
};
const saveRunHistory = (history) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }
  catch { /* ignore */ }
};

const initialState = {
  components:           [],
  employeeSalaryDetail: null,
  salaryHistory:        [],
  runResult:            null,
  runHistory:           loadRunHistory(),
  payslips:             [],
  payslipDetail:        null,
  loading:              false,
  actionLoading:        false,
  error:                null,
  actionError:          null,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — update satu payslip di dalam runHistory by ID
// ─────────────────────────────────────────────────────────────────────────────
const patchPayslipInHistory = (runHistory, targetId, patch) =>
  runHistory.map(run => ({
    ...run,
    payslips: (run.payslips ?? []).map(p =>
      // Bandingkan sebagai string agar tidak ada mismatch number vs string
      String(p.id) === String(targetId) ? { ...p, ...patch } : p
    ),
  }));

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearRunResult:      (s) => { s.runResult = null; },
    clearPayslipDetail:  (s) => { s.payslipDetail = null; },
    clearEmployeeSalary: (s) => { s.employeeSalaryDetail = null; s.salaryHistory = []; },
    clearPayslips:       (s) => { s.payslips = []; },
    clearError:          (s) => { s.error = null; s.actionError = null; },
  },
  extraReducers: (builder) => {

    const onFetchPending   = (s)    => { s.loading = true;       s.error = null; };
    const onActionPending  = (s)    => { s.actionLoading = true; s.actionError = null; };
    const onFetchRejected  = (s, a) => { s.loading = false;       s.error = a.payload; };
    const onActionRejected = (s, a) => { s.actionLoading = false; s.actionError = a.payload; };

    builder
      // ── SALARY COMPONENT ───────────────────────────────────────────────────
      .addCase(fetchComponents.pending,   onFetchPending)
      .addCase(fetchComponents.fulfilled, (s, a) => {
        s.loading = false;
        const raw = a.payload;
        if (Array.isArray(raw))               s.components = raw;
        else if (Array.isArray(raw?.data))    s.components = raw.data;
        else if (Array.isArray(raw?.content)) s.components = raw.content;
        else                                  s.components = [];
      })
      .addCase(fetchComponents.rejected,  onFetchRejected)

      .addCase(createComponent.pending,   onActionPending)
      .addCase(createComponent.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.data ?? a.payload;
        if (item) s.components.push(item);
      })
      .addCase(createComponent.rejected,  onActionRejected)

      .addCase(updateComponent.pending,   onActionPending)
      .addCase(updateComponent.fulfilled, (s, a) => {
        s.actionLoading = false;
        const item = a.payload?.data ?? a.payload;
        const idx = s.components.findIndex(c => c.id === item?.id);
        if (idx !== -1) s.components[idx] = item;
      })
      .addCase(updateComponent.rejected,  onActionRejected)

      .addCase(deleteComponent.pending,   onActionPending)
      .addCase(deleteComponent.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.components.findIndex(c => c.id === a.payload);
        if (idx !== -1) s.components[idx] = { ...s.components[idx], isActive: false };
      })
      .addCase(deleteComponent.rejected,  onActionRejected)

      // ── EMPLOYEE SALARY ────────────────────────────────────────────────────
      .addCase(fetchEmployeeSalary.pending,   onFetchPending)
      .addCase(fetchEmployeeSalary.fulfilled, (s, a) => {
        s.loading = false;
        s.employeeSalaryDetail = a.payload?.data ?? a.payload;
      })
      .addCase(fetchEmployeeSalary.rejected,  onFetchRejected)

      .addCase(fetchEmployeeSalaryHistory.pending,   onFetchPending)
      .addCase(fetchEmployeeSalaryHistory.fulfilled, (s, a) => {
        s.loading = false;
        const raw = a.payload;
        if (Array.isArray(raw))               s.salaryHistory = raw;
        else if (Array.isArray(raw?.data))    s.salaryHistory = raw.data;
        else if (Array.isArray(raw?.content)) s.salaryHistory = raw.content;
        else                                  s.salaryHistory = [];
      })
      .addCase(fetchEmployeeSalaryHistory.rejected,  onFetchRejected)

      .addCase(saveEmployeeSalary.pending,   onActionPending)
      .addCase(saveEmployeeSalary.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.employeeSalaryDetail = a.payload?.data ?? a.payload;
      })
      .addCase(saveEmployeeSalary.rejected,  onActionRejected)

      .addCase(addSalaryComponent.pending,   onActionPending)
      .addCase(addSalaryComponent.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.employeeSalaryDetail = a.payload?.data ?? a.payload;
      })
      .addCase(addSalaryComponent.rejected,  onActionRejected)

      // ── RUN PAYROLL ────────────────────────────────────────────────────────
      .addCase(runPayroll.pending,   onActionPending)
      .addCase(runPayroll.fulfilled, (s, a) => {
        s.actionLoading = false;
        const result = a.payload?.data ?? a.payload;
        s.runResult = result;
        if (result) {
          const exists = s.runHistory.some(r => r.id === result.id);
          if (!exists) s.runHistory.unshift(result);
          saveRunHistory(s.runHistory);
        }
      })
      .addCase(runPayroll.rejected,  onActionRejected)

      // ── PAYROLL RUNS LIST ──────────────────────────────────────────────────
      .addCase(fetchPayrollRuns.pending,   onFetchPending)
      .addCase(fetchPayrollRuns.fulfilled, (s, a) => {
        s.loading = false;
        const raw = a.payload;
        const list = Array.isArray(raw)        ? raw
          : Array.isArray(raw?.data)           ? raw.data
          : Array.isArray(raw?.content)        ? raw.content
          : [];
        s.runHistory = list;
        saveRunHistory(list);
      })
      .addCase(fetchPayrollRuns.rejected, (s) => {
        s.loading = false;
        // fallback ke localStorage jika endpoint belum ada
      })

      // ── PAYSLIP ────────────────────────────────────────────────────────────
      .addCase(fetchPayslipsByEmployee.pending,   onFetchPending)
      .addCase(fetchPayslipsByEmployee.fulfilled, (s, a) => {
        s.loading = false;
        const raw = a.payload;
        if (Array.isArray(raw))               s.payslips = raw;
        else if (Array.isArray(raw?.data))    s.payslips = raw.data;
        else if (Array.isArray(raw?.content)) s.payslips = raw.content;
        else                                  s.payslips = [];
      })
      .addCase(fetchPayslipsByEmployee.rejected,  onFetchRejected)

      .addCase(fetchPayslipDetail.pending,   onFetchPending)
      .addCase(fetchPayslipDetail.fulfilled, (s, a) => {
        s.loading = false;
        s.payslipDetail = a.payload?.data ?? a.payload;
      })
      .addCase(fetchPayslipDetail.rejected,  onFetchRejected)

      // ── APPROVE PAYSLIP ────────────────────────────────────────────────────
      .addCase(approvePayslip.pending,   onActionPending)
      .addCase(approvePayslip.fulfilled, (s, a) => {
        s.actionLoading = false;

        // ─── FIX 1: pakai payslipId yang dikirim dari thunk (selalu ada)
        //            bukan id dari response API (bisa null jika 204)
        const { payslipId, ...rest } = a.payload ?? {};
        const targetId = payslipId ?? rest?.id;

        if (!targetId) return; // tidak ada ID sama sekali — skip

        // ─── FIX 2: status harus 'FINALIZED', bukan 'APPROVED'
        s.runHistory = patchPayslipInHistory(s.runHistory, targetId, {
          ...rest,
          status: 'FINALIZED',
        });
        saveRunHistory(s.runHistory);
      })
      .addCase(approvePayslip.rejected,  onActionRejected)

      // ── MARK AS PAID ───────────────────────────────────────────────────────
      .addCase(markPayslipAsPaid.pending,   onActionPending)
      .addCase(markPayslipAsPaid.fulfilled, (s, a) => {
        s.actionLoading = false;

        // ─── FIX 1: pakai payslipId yang dikirim dari thunk
        const { payslipId, ...rest } = a.payload ?? {};
        const targetId = payslipId ?? rest?.id;

        if (!targetId) return;

        s.runHistory = patchPayslipInHistory(s.runHistory, targetId, {
          ...rest,
          status: 'PAID',
        });
        saveRunHistory(s.runHistory);
      })
      .addCase(markPayslipAsPaid.rejected,  onActionRejected)

      // ── DELETE PAYSLIP ─────────────────────────────────────────────────────
      .addCase(deletePayslip.pending,   onActionPending)
      .addCase(deletePayslip.fulfilled, (s, a) => {
        s.actionLoading = false;
        const deletedId = a.payload;
        s.runHistory = s.runHistory.map(run => ({
          ...run,
          payslips: (run.payslips ?? []).filter(p =>
            String(p.id) !== String(deletedId)
          ),
        }));
        saveRunHistory(s.runHistory);
      })
      .addCase(deletePayslip.rejected,  onActionRejected)
  },
});

export const {
  clearRunResult,
  clearPayslipDetail,
  clearEmployeeSalary,
  clearPayslips,
  clearError,
} = payrollSlice.actions;

export default payrollSlice.reducer;

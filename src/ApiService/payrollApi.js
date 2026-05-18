import API from "./api";

const BASE = "/payroll";

export const payrollApi = {

  // ─── Salary Component ──────────────────────────────────────────────────────

  getSalaryComponents: async (activeOnly = false) => {
    const response = await API.get(`${BASE}/components`, { params: { activeOnly } });
    return response.data;
  },

  createSalaryComponent: async (data) => {
    const response = await API.post(`${BASE}/components`, data);
    return response.data;
  },

  updateSalaryComponent: async (id, data) => {
    const response = await API.put(`${BASE}/components/${id}`, data);
    return response.data;
  },

  deleteSalaryComponent: async (id) => {
    const response = await API.delete(`${BASE}/components/${id}`);
    return response.data;
  },

  // ─── Employee Salary ──────────────────────────────────────────────────────

  setEmployeeSalary: async (data) => {
    const response = await API.post(`${BASE}/employee-salary`, data);
    return response.data;
  },

  addEmployeeSalaryComponent: async (id, data) => {
    const response = await API.post(`${BASE}/employee-salary/${id}/components`, data);
    return response.data;
  },

  getEmployeeSalary: async (employeeId) => {
    const response = await API.get(`${BASE}/employee-salary/${employeeId}`);
    return response.data;
  },

  getEmployeeSalaryHistory: async (employeeId) => {
    const response = await API.get(`${BASE}/employee-salary/${employeeId}/history`);
    return response.data;
  },

  // ─── Payroll Run ──────────────────────────────────────────────────────────

  runPayroll: async (data) => {
    const response = await API.post(`${BASE}/run`, data);
    return response.data;
  },

  getPayrollRuns: async () => {
    const response = await API.get(`${BASE}/runs`);
    return response.data;
  },

  getPayrollRunDetail: async (periodId) => {
    const response = await API.get(`${BASE}/runs/${periodId}`);
    return response.data;
  },

  /**
   * Hapus payroll period beserta semua payslip-nya.
   * Hanya boleh jika status period masih DRAFT.
   * Dipakai untuk generate ulang payroll di periode yang sama.
   */
  deletePayrollRun: async (month, year) => {
    const response = await API.delete(`${BASE}/runs`, { params: { month, year } });
    return response.data;
  },

  // ─── Payslip ─────────────────────────────────────────────────────────────

  getPayslipsByEmployee: async (employeeId) => {
    const response = await API.get(`${BASE}/payslips/${employeeId}`);
    return response.data;
  },

  getPayslipDetail: async (payslipId) => {
    const response = await API.get(`${BASE}/payslips/detail/${payslipId}`);
    return response.data;
  },

  downloadPayslipPdf: async (payslipId) => {
    const response = await API.get(`${BASE}/payslips/${payslipId}/pdf`, {
      responseType: "blob",
    });
    return response;
  },

  approvePayslip: async (payslipId) => {
    const response = await API.patch(`${BASE}/payslips/${payslipId}/approve`);
    return response.data;
  },

  markAsPaid: async (payslipId) => {
    const response = await API.patch(`${BASE}/payslips/${payslipId}/paid`);
    return response.data;
  },

  deletePayslip: async (payslipId) => {
    const response = await API.delete(`${BASE}/payslips/${payslipId}`);
    return response.data;
  },

  // ─── Report ───────────────────────────────────────────────────────────────

  downloadPayrollPdf: async (month, year) => {
    const response = await API.get(`${BASE}/reports/pdf`, {
      params: { month, year },
      responseType: "blob",
    });
    return response;
  },

  downloadPayrollExcel: async (month, year) => {
    const response = await API.get(`${BASE}/reports/excel`, {
      params: { month, year },
      responseType: "blob",
    });
    return response;
  },

  // ─── Payroll Settings ─────────────────────────────────────────────────────

  /**
   * GET /api/payroll/settings
   * Ambil nilai absent & late deduction per day.
   */
  getPayrollSettings: async () => {
    const response = await API.get(`${BASE}/settings`);
    return response.data;
  },

  /**
   * PUT /api/payroll/settings
   * Update nilai absent & late deduction per day.
   * @param {{ absentDeductionPerDay: number, lateDeductionPerDay: number }} data
   */
  updatePayrollSettings: async (data) => {
    const response = await API.put(`${BASE}/settings`, data);
    return response.data;
  },
};

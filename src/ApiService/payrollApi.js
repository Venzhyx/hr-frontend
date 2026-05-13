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

  // PATCH /payroll/payslips/{payslipId}/approve
  approvePayslip: async (payslipId) => {
    const response = await API.patch(`${BASE}/payslips/${payslipId}/approve`);
    return response.data;
  },

  // PATCH /payroll/payslips/{payslipId}/paid  ← NEW
  markAsPaid: async (payslipId) => {
    const response = await API.patch(`${BASE}/payslips/${payslipId}/paid`);
    return response.data;
  },

  // DELETE /payroll/payslips/{payslipId}
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
};

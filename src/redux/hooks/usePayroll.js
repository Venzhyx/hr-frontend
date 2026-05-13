import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { payrollApi as api } from '../../ApiService/payrollApi';

import {
  fetchComponents, createComponent, updateComponent, deleteComponent,
  fetchEmployeeSalary, fetchEmployeeSalaryHistory, saveEmployeeSalary, addSalaryComponent,
  runPayroll,
  fetchPayslipsByEmployee, fetchPayslipDetail,
  fetchPayrollRuns,
  approvePayslip,
  markPayslipAsPaid,  // ← NEW
  deletePayslip,
  clearRunResult, clearPayslipDetail, clearEmployeeSalary, clearPayslips, clearError,
} from '../slices/payrollSlice';

const usePayroll = () => {
  const dispatch = useDispatch();
  const s = useSelector((state) => state.payroll);

  // ─── SALARY COMPONENT ──────────────────────────────────────────────────────
  const component = {
    list:       s.components,
    earnings:   s.components.filter(c => c.type === 'EARNING'),
    deductions: s.components.filter(c => c.type === 'DEDUCTION'),

    fetchAll:   useCallback((activeOnly = false) => dispatch(fetchComponents(activeOnly)), [dispatch]),
    create:     useCallback((data)               => dispatch(createComponent(data)),       [dispatch]),
    update:     useCallback((id, data)           => dispatch(updateComponent({ id, data })), [dispatch]),
    deactivate: useCallback((id)                 => dispatch(deleteComponent(id)),         [dispatch]),
  };

  // ─── EMPLOYEE SALARY ───────────────────────────────────────────────────────
  const employeeSalary = {
    detail:  s.employeeSalaryDetail,
    history: s.salaryHistory,

    fetch:        useCallback((employeeId) => dispatch(fetchEmployeeSalary(employeeId)),        [dispatch]),
    fetchHistory: useCallback((employeeId) => dispatch(fetchEmployeeSalaryHistory(employeeId)), [dispatch]),
    save:         useCallback((data)       => dispatch(saveEmployeeSalary(data)),               [dispatch]),
    addComponent: useCallback((id, data)   => dispatch(addSalaryComponent({ id, data })),      [dispatch]),
    clear:        useCallback(()           => dispatch(clearEmployeeSalary()),                  [dispatch]),
  };

  // ─── PAYROLL RUN ───────────────────────────────────────────────────────────
  const run = {
    result:   s.runResult,
    history:  s.runHistory,
    fetchAll: useCallback(()            => dispatch(fetchPayrollRuns()),           [dispatch]),
    execute:  useCallback((month, year) => dispatch(runPayroll({ month, year })), [dispatch]),
    clear:    useCallback(()            => dispatch(clearRunResult()),             [dispatch]),
  };

  // ─── PAYSLIP ───────────────────────────────────────────────────────────────
  const payslip = {
    list:   s.payslips,
    detail: s.payslipDetail,

    fetchByEmployee: useCallback((employeeId) => dispatch(fetchPayslipsByEmployee(employeeId)), [dispatch]),
    fetchDetail:     useCallback((payslipId)  => dispatch(fetchPayslipDetail(payslipId)),       [dispatch]),

    downloadPdf: useCallback(async (payslipId, filename) => {
      const res = await api.downloadPayslipPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url;
      a.download = filename ?? `payslip-${payslipId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, []),

    downloadExcel: useCallback(async (month, year) => {
      const res = await api.downloadPayrollExcel(month, year);
      const url = window.URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-report-${String(month).padStart(2,'0')}-${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, []),

    clearDetail: useCallback(() => dispatch(clearPayslipDetail()), [dispatch]),
    clearList:   useCallback(() => dispatch(clearPayslips()),      [dispatch]),
  };

  // ─── SHARED ────────────────────────────────────────────────────────────────
  return {
    component,
    employeeSalary,
    run,
    payslip,
    loading:       s.loading,
    actionLoading: s.actionLoading,
    error:         s.error,
    actionError:   s.actionError,
    clearError:    useCallback(() => dispatch(clearError()), [dispatch]),

    // ── Payslip actions ───────────────────────────────────────────────────
    approve:       useCallback((payslipId) => dispatch(approvePayslip(payslipId)),    [dispatch]),
    markAsPaid:    useCallback((payslipId) => dispatch(markPayslipAsPaid(payslipId)), [dispatch]),  // ← NEW
    deletePayslip: useCallback((payslipId) => dispatch(deletePayslip(payslipId)),     [dispatch]),
  };
};

export default usePayroll;

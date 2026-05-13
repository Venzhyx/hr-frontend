import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Dashboard from '../pages/Dashboard';

// Employees
import EmployeesList   from '../pages/employees/IndexEmployee';
import AddEmployee     from '../pages/employees/AddEmployee';
import EditEmployee    from '../pages/employees/EditEmployee';
import EmployeeDetail  from '../pages/employees/DetailEmployee';

// Attendances
import Attendance           from '../pages/Attendance';
import AttendanceCorrection from '../pages/attendance/AttendanceCorrection';
import Overtime             from '../pages/attendance/Overtime';
import AttendanceList       from '../pages/attendance/AttendanceList';

// Departments
import DepartmentsList       from '../pages/departments/IndexDepartments';
import AddDepartment         from '../pages/departments/AddDepartments';
import EditDepartment        from '../pages/departments/EditDepartments';
import DepartmentDetailModal from '../pages/departments/DetailDepartments';

// Companies
import CompanyList   from '../pages/companies/IndexCompany';
import AddCompany    from '../pages/companies/AddCompany';
import EditCompany   from '../pages/companies/EditCompany';
import CompanyDetail from '../pages/companies/DetailCompany';

// Reimbursements
import ReimbursementIndex  from '../pages/reimbursements/IndexReimbursement';
import CreateReimbursement from '../pages/reimbursements/AddReimbursement';
import EditReimbursement   from '../pages/reimbursements/EditReimbursement';
import ReimbursementDetail from '../pages/reimbursements/DetailReimbursement';

// Approvals
import ApprovalPage              from '../pages/approvals/ApprovalsIndex';
import ApprovalReimbursementPage from '../pages/approvals/ReimbursementApprovals/ReimbursementApproval';
import ApprovalTimeOffPage       from '../pages/approvals/TimeoffApprovals/TimeoffApproval';
import ApprovalAttendancePage    from '../pages/approvals/AttendanceApprovals/AttendanceApproval';
import ApprovalOvertimePage      from '../pages/approvals/OvertimeApprovals/OvertimeApproval';

// Time Off
import TimeOffIndex  from '../pages/timeoffs/IndexPages';
import TimeOffAdd    from '../pages/timeoffs/AddTimeoff';
import TimeOffDetail from '../pages/timeoffs/DetailTimeoff';
import TimeOffEdit   from '../pages/timeoffs/EditTimeoff';

// Payroll
import PayrollPage        from '../pages/payroll/IndexPayroll';
import RunPayrollPage     from '../pages/payroll/RunPayrollPage';
import PayslipListPage    from '../pages/payroll/ListPayslippage';
import PayslipDetailPage  from '../pages/payroll/DetailPayslipPage';
import SalaryComponentPage from '../pages/payroll/SalaryComponentPage';
import EmployeeSalaryPage  from '../pages/payroll/EmployeeSalaryPage';

import Settings from '../pages/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Employees */}
        <Route path="employees"            element={<EmployeesList />} />
        <Route path="employees/add"        element={<AddEmployee />} />
        <Route path="employees/edit/:id"   element={<EditEmployee />} />
        <Route path="employees/detail/:id" element={<EmployeeDetail />} />

        {/* Departments */}
        <Route path="departments"            element={<DepartmentsList />} />
        <Route path="departments/add"        element={<AddDepartment />} />
        <Route path="departments/edit/:id"   element={<EditDepartment />} />
        <Route path="departments/detail/:id" element={<DepartmentDetailModal />} />

        {/* Companies */}
        <Route path="companies"            element={<CompanyList />} />
        <Route path="companies/add"        element={<AddCompany />} />
        <Route path="companies/edit/:id"   element={<EditCompany />} />
        <Route path="companies/detail/:id" element={<CompanyDetail />} />

        {/* Reimbursements */}
        <Route path="reimbursements"            element={<ReimbursementIndex />} />
        <Route path="reimbursements/add"        element={<CreateReimbursement />} />
        <Route path="reimbursements/edit/:id"   element={<EditReimbursement />} />
        <Route path="reimbursements/detail/:id" element={<ReimbursementDetail />} />

        {/* Approvals */}
        <Route path="approvals"               element={<ApprovalPage />} />
        <Route path="approvals/reimbursement" element={<ApprovalReimbursementPage />} />
        <Route path="approvals/timeoff"       element={<ApprovalTimeOffPage />} />
        <Route path="approvals/attendance"    element={<ApprovalAttendancePage />} />
        <Route path="approvals/overtime"      element={<ApprovalOvertimePage />} />

        {/* Time Off */}
        <Route path="time-off"          element={<TimeOffIndex />} />
        <Route path="time-off/add"      element={<TimeOffAdd />} />
        <Route path="time-off/edit/:id" element={<TimeOffEdit />} />
        <Route path="time-off/:id"      element={<TimeOffDetail />} />

        {/* Attendance */}
        <Route path="attendance"            element={<Attendance />} />
        <Route path="attendance/correction" element={<AttendanceCorrection />} />
        <Route path="attendance/overtime"   element={<Overtime />} />
        <Route path="attendance/list"       element={<AttendanceList />} />

        {/* Payroll */}
        <Route path="payroll"                  element={<PayrollPage />} />
        <Route path="payroll/run"              element={<RunPayrollPage />} />
        <Route path="payroll/slips"            element={<PayslipListPage />} />
        <Route path="payroll/slips/:payslipId" element={<PayslipDetailPage />} />
        <Route path="payroll/components"       element={<SalaryComponentPage />} />
        <Route path="payroll/employee-salary"  element={<EmployeeSalaryPage />} />

        {/* Other */}
        <Route path="settings" element={<Settings />} />
        <Route path="profile"  element={<div className="p-6">Profile Page</div>} />
        <Route path="help"     element={<div className="p-6">Help & Support</div>} />
        <Route path="logout"   element={<div className="p-6">Logging out...</div>} />
        <Route path="account"  element={<div className="p-6">Account Page</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
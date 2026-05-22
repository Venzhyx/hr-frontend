import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute  from './assets/components/PrivateRoute';
import AppLayout     from './assets/layouts/AppLayout';
import LoginPage     from './assets/pages/auth/LoginPage';
import ForbiddenPage from './assets/pages/auth/ForbiddenPage';

import Dashboard     from './assets/pages/Dashboard';
import Settings      from './assets/pages/Settings';
import ProfilePage from './assets/pages/ProfilePage';

// Employees
import EmployeesList  from './assets/pages/employees/IndexEmployee';
import AddEmployee    from './assets/pages/employees/AddEmployee';
import EditEmployee   from './assets/pages/employees/EditEmployee';
import EmployeeDetail from './assets/pages/employees/DetailEmployee';

// Attendances
import EmployeeAttendanceDashboard from './assets/pages/attendance/EmployeeAttendanceDashboard';
import AdminAttendanceDashboard     from './assets/pages/attendance/AdminAttendanceDashboard';
import AdminAttendanceCorrection    from './assets/pages/attendance/AdminAttendanceCorrection';
import EmployeeAttendanceCorrection from './assets/pages/attendance/EmployeeAttendanceCorrection';
import AdminOvertime                from './assets/pages/attendance/AdminOvertime';
import EmployeeOvertime             from './assets/pages/attendance/EmployeeOvertime';
import AttendanceList               from './assets/pages/attendance/AttendanceList';

// Departments
import DepartmentsList       from './assets/pages/departments/IndexDepartments';
import AddDepartment         from './assets/pages/departments/AddDepartments';
import EditDepartment        from './assets/pages/departments/EditDepartments';
import DepartmentDetailModal from './assets/pages/departments/DetailDepartments';

// Companies
import CompanyList   from './assets/pages/companies/IndexCompany';
import AddCompany    from './assets/pages/companies/AddCompany';
import EditCompany   from './assets/pages/companies/EditCompany';
import CompanyDetail from './assets/pages/companies/DetailCompany';

// Reimbursements
import ReimbursementIndex  from './assets/pages/reimbursements/IndexReimbursement';
import CreateReimbursement from './assets/pages/reimbursements/AddReimbursement';
import EditReimbursement   from './assets/pages/reimbursements/EditReimbursement';
import ReimbursementDetail from './assets/pages/reimbursements/DetailReimbursement';

// Approvals
import ApprovalPage              from './assets/pages/approvals/ApprovalsIndex';
import ApprovalReimbursementPage from './assets/pages/approvals/ReimbursementApprovals/ReimbursementApproval';
import ApprovalTimeOffPage       from './assets/pages/approvals/TimeoffApprovals/TimeoffApproval';
import ApprovalAttendancePage    from './assets/pages/approvals/AttendanceApprovals/AttendanceApproval';
import ApprovalOvertimePage      from './assets/pages/approvals/OvertimeApprovals/OvertimeApproval';

// Time Off
import TimeOffIndex  from './assets/pages/timeoffs/IndexPages';
import TimeOffAdd    from './assets/pages/timeoffs/AddTimeoff';
import TimeOffDetail from './assets/pages/timeoffs/DetailTimeoff';
import TimeOffEdit   from './assets/pages/timeoffs/EditTimeoff';

// Payroll
import PayrollPage         from './assets/pages/payroll/IndexPayroll';
import RunPayrollPage      from './assets/pages/payroll/RunPayrollPage';
import PayslipListPage     from './assets/pages/payroll/ListPayslippage';
import PayslipDetailPage   from './assets/pages/payroll/DetailPayslipPage';
import SalaryComponentPage from './assets/pages/payroll/SalaryComponentPage';
import EmployeeSalaryPage  from './assets/pages/payroll/EmployeeSalaryPage';

// Accounts
import IndexAccount  from './assets/pages/accounts/IndexAccount';
import AddAccount    from './assets/pages/accounts/AddAccount';
import DetailAccount from './assets/pages/accounts/DetailAccount';

// Employee pages
import MyDashboard from './assets/pages/EmployeeDashboard';
import TimeOff     from './assets/pages/TimeOff';

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const getLoggedInUser = () => {
  try {
    const userStr = localStorage.getItem("user") || localStorage.getItem("hr_user");
    if (userStr) return JSON.parse(userStr);
  } catch (e) {}
  return null;
};

// ─── Dynamic routers ─────────────────────────────────────────────────────────
const DashboardRouter = () => {
  const user = getLoggedInUser();
  return user?.role === "ADMIN" ? <Dashboard /> : <MyDashboard />;
};

const AttendanceRouter = () => {
  const user = getLoggedInUser();
  return user?.role === "ADMIN" ? <AdminAttendanceDashboard /> : <EmployeeAttendanceDashboard />;
};

const AttendanceCorrectionRouter = () => {
  const user = getLoggedInUser();
  return user?.role === "ADMIN" ? <AdminAttendanceCorrection /> : <EmployeeAttendanceCorrection />;
};

const OvertimeRouter = () => {
  const user = getLoggedInUser();
  return user?.role === "ADMIN" ? <AdminOvertime /> : <EmployeeOvertime />;
};

// ─── Guard: EMPLOYEE hanya bisa akses edit untuk ID miliknya sendiri ─────────
// Kalau ADMIN, lewat saja. Kalau EMPLOYEE dan ID bukan miliknya, redirect ke profile.
const EditEmployeeGuard = () => {
  const user = getLoggedInUser();
  if (user?.role === 'ADMIN') return <EditEmployee />;

  // EMPLOYEE: pastikan ID di URL = ID miliknya sendiri
  // (cek dilakukan di sini sebelum render, bukan di EditEmployee)
  // EditEmployee sendiri juga sudah pakai selfOnly dari location.state,
  // tapi guard ini sebagai lapisan keamanan URL.
  const selfEmployeeId = user?.employeeId ?? user?.id;
  const urlId = window.location.pathname.split('/').pop();
  if (String(selfEmployeeId) !== String(urlId)) {
    return <Navigate to="/profile" replace />;
  }
  return <EditEmployee />;
};

const App = () => (
  <BrowserRouter>
    <React.Suspense fallback={<Loader />}>
      <Routes>

        {/* ── Public ── */}
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/"          element={<Navigate to="/login" replace />} />

        {/* ── ADMIN ONLY routes ── */}
        <Route element={<PrivateRoute roles={['ADMIN']} />}>
          <Route element={<AppLayout />}>
            <Route path="/settings"   element={<Settings />} />

            {/* Employees */}
            <Route path="/employees"            element={<EmployeesList />} />
            <Route path="/employees/add"        element={<AddEmployee />} />
            <Route path="/employees/detail/:id" element={<EmployeeDetail />} />

            {/* Departments */}
            <Route path="/departments"            element={<DepartmentsList />} />
            <Route path="/departments/add"        element={<AddDepartment />} />
            <Route path="/departments/edit/:id"   element={<EditDepartment />} />
            <Route path="/departments/detail/:id" element={<DepartmentDetailModal />} />

            {/* Companies */}
            <Route path="/companies"            element={<CompanyList />} />
            <Route path="/companies/add"        element={<AddCompany />} />
            <Route path="/companies/edit/:id"   element={<EditCompany />} />
            <Route path="/companies/detail/:id" element={<CompanyDetail />} />

            {/* Approvals */}
            <Route path="/approvals"               element={<ApprovalPage />} />
            <Route path="/approvals/reimbursement" element={<ApprovalReimbursementPage />} />
            <Route path="/approvals/timeoff"       element={<ApprovalTimeOffPage />} />
            <Route path="/approvals/attendance"    element={<ApprovalAttendancePage />} />
            <Route path="/approvals/overtime"      element={<ApprovalOvertimePage />} />

            {/* Payroll */}
            <Route path="/payroll"                  element={<PayrollPage />} />
            <Route path="/payroll/run"              element={<RunPayrollPage />} />
            <Route path="/payroll/slips"            element={<PayslipListPage />} />
            <Route path="/payroll/slips/:payslipId" element={<PayslipDetailPage />} />
            <Route path="/payroll/components"       element={<SalaryComponentPage />} />
            <Route path="/payroll/employee-salary"  element={<EmployeeSalaryPage />} />

            {/* Accounts */}
            <Route path="/accounts"     element={<IndexAccount />} />
            <Route path="/accounts/add" element={<AddAccount />} />
            <Route path="/accounts/:id" element={<DetailAccount />} />
          </Route>
        </Route>

        {/* ── SHARED (ADMIN & EMPLOYEE) routes ── */}
        <Route element={<PrivateRoute roles={['ADMIN', 'EMPLOYEE']} />}>
          <Route element={<AppLayout />}>
            {/* Dynamic routing */}
            <Route path="/dashboard"  element={<DashboardRouter />} />
            <Route path="/attendance" element={<AttendanceRouter />} />
            <Route path="/attendance/correction" element={<AttendanceCorrectionRouter />} />
            <Route path="/attendance/overtime"   element={<OvertimeRouter />} />
            <Route path="/attendance/list"       element={<AttendanceList />} />

            {/* Edit employee — ADMIN bisa semua ID, EMPLOYEE hanya ID miliknya */}
            <Route path="/employees/edit/:id" element={<EditEmployeeGuard />} />

            {/* Reimbursements */}
            <Route path="/reimbursements"            element={<ReimbursementIndex />} />
            <Route path="/reimbursements/add"        element={<CreateReimbursement />} />
            <Route path="/reimbursements/edit/:id"   element={<EditReimbursement />} />
            <Route path="/reimbursements/detail/:id" element={<ReimbursementDetail />} />

            {/* Time Off */}
            <Route path="/time-off"          element={<TimeOffIndex />} />
            <Route path="/time-off/add"      element={<TimeOffAdd />} />
            <Route path="/time-off/edit/:id" element={<TimeOffEdit />} />
            <Route path="/time-off/:id"      element={<TimeOffDetail />} />

            {/* Profile & Help */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/help"    element={<div className="p-6">Help & Support</div>} />
          </Route>
        </Route>

        {/* ── EMPLOYEE ONLY routes ── */}
        <Route element={<PrivateRoute roles={['EMPLOYEE']} />}>
          <Route element={<AppLayout />}>
            <Route path="/my-dashboard" element={<MyDashboard />} />
            <Route path="/timeoff"      element={<TimeOff />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </React.Suspense>
  </BrowserRouter>
);

export default App;

import API from "./api";


// ============================================
// APPROVERS MANAGEMENT (Single unified endpoint)
// ============================================
export const getApprovalApproversAPI = (type) => 
  API.get(`/approval-approvers?type=${type}`);

export const createApprovalApproverAPI = (data) => 
  API.post("/approval-approvers", data);

export const deleteApprovalApproverAPI = (id) => 
  API.delete(`/approval-approvers/${id}`);

// ============================================
// ATTENDANCE CORRECTIONS (FIXED)
// ============================================

export const createAttendanceCorrectionAPI = (data) =>
  API.post("/attendance-corrections", data);

export const getAllAttendanceCorrectionsAPI = () =>
  API.get("/attendance-corrections");

export const getAttendanceApprovalsAPI = (id) =>
  API.get(`/attendance-corrections/${id}`);

export const getMyAttendanceCorrectionsAPI = (employeeId) =>
  API.get(`/attendance-corrections/my/${employeeId}`);

export const approveAttendanceCorrectionAPI = (id, approverId, notes) =>
  API.put(
    `/attendance-corrections/${id}/approve?approverId=${approverId}`,
    { notes } // kirim ke backend
  );

export const rejectAttendanceCorrectionAPI = (id, approverId, notes) =>
  API.put(
    `/attendance-corrections/${id}/reject?approverId=${approverId}`,
    { notes }
  );

// ============================================
// REIMBURSEMENT APPROVALS
// ============================================
export const getReimbursementApprovalsAPI = (reimbursementId) =>
  API.get(`/reimbursement-approvals/reimbursement/${reimbursementId}`);

export const updateReimbursementApprovalAPI = (approvalId, data) =>
  API.patch(`/reimbursement-approvals/${approvalId}`, data);

// ============================================
// TIMEOFF APPROVALS
// ============================================
export const getTimeOffApprovalsAPI = (requestId) =>
  API.get(`/time-off-approvals/request/${requestId}`);

export const updateTimeOffApprovalAPI = (approvalId, data) =>
  API.patch(`/time-off-approvals/${approvalId}`, data);

// ============================================
// OVERTIME APPROVALS
// ============================================
// ============================================
// OVERTIME APPROVALS (FIXED)
// ============================================

export const approveOvertimeAPI = (id, approverId, notes) =>
  API.put(
    `/overtimes/${id}/approve?approverId=${approverId}`,
    { notes }
  );

export const rejectOvertimeAPI = (id, approverId, notes) =>
  API.put(
    `/overtimes/${id}/reject?approverId=${approverId}`,
    { notes }
  );
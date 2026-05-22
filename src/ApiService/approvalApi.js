import API from "./api";

// ============================================
// APPROVERS MANAGEMENT (Single unified endpoint)
// ============================================
export const getApprovalApproversAPI = () =>
  API.get(`/approval-approvers`);

export const createApprovalApproverAPI = (data) =>
  API.post("/approval-approvers", data);

export const deleteApprovalApproverAPI = (id) =>
  API.delete(`/approval-approvers/${id}`);

// ============================================
// ATTENDANCE CORRECTIONS
// ============================================
export const createAttendanceCorrectionAPI = (data) =>
  API.post("/attendance-corrections", data);

export const getAllAttendanceCorrectionsAPI = () =>
  API.get("/attendance-corrections");

export const getAttendanceApprovalsAPI = (id) =>
  API.get(`/attendance-corrections/${id}`);

export const getMyAttendanceCorrectionsAPI = (employeeId) =>
  API.get(`/attendance-corrections/my/${employeeId}`);

// approverId tidak dikirim dari frontend — backend resolve dari JWT
export const approveAttendanceCorrectionAPI = (id, notes) =>
  API.put(`/attendance-corrections/${id}/approve`, { notes });

export const rejectAttendanceCorrectionAPI = (id, notes) =>
  API.put(`/attendance-corrections/${id}/reject`, { notes });

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

// approverId tidak dikirim dari frontend — backend resolve dari JWT
export const approveOvertimeAPI = (id, notes) =>
  API.put(`/overtimes/${id}/approve`, { notes });

export const rejectOvertimeAPI = (id, notes) =>
  API.put(`/overtimes/${id}/reject`, { notes });

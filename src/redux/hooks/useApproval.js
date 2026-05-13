import { useDispatch, useSelector } from "react-redux";
import {
  reimbursementThunks,
  timeoffThunks,
  attendanceThunks,
  overtimeThunks,
} from "../slices/approvalSlice";
import {
  getReimbursementApprovalsAPI,
  updateReimbursementApprovalAPI,
  getTimeOffApprovalsAPI,
  updateTimeOffApprovalAPI,
  // HAPUS INI (sudah tidak dipakai)
  // getOvertimeApprovalsAPI,
  // updateOvertimeApprovalAPI,
  approveAttendanceCorrectionAPI,
  rejectAttendanceCorrectionAPI,
  // TAMBAH INI
  approveOvertimeAPI,
  rejectOvertimeAPI,
} from "../../ApiService/approvalApi";

const THUNKS_MAP = {
  reimbursement: reimbursementThunks,
  timeoff: timeoffThunks,
  attendance: attendanceThunks,
  overtime: overtimeThunks,
};

const APPROVAL_APIS = {
  reimbursement: { 
    get: getReimbursementApprovalsAPI, 
    update: updateReimbursementApprovalAPI 
  },
  timeoff: { 
    get: getTimeOffApprovalsAPI, 
    update: updateTimeOffApprovalAPI 
  },
  // FIXED Overtime - pakai system baru seperti Attendance
  overtime: {
    get: null, // Tidak perlu get lagi, approvals sudah di response
    update: async (overtimeId, { action, notes }) => {
      // TODO: Ambil approverId dari auth context/state nanti
      const approverId = 1; // Sementara hardcode
      
      if (action === "APPROVED") {
        return approveOvertimeAPI(overtimeId, approverId, notes);
      } else if (action === "REJECTED") {
        return rejectOvertimeAPI(overtimeId, approverId, notes);
      }
      
      throw new Error(`Invalid action for overtime: ${action}`);
    },
  },
  // Attendance langsung action-based, tidak pakai approval table
  attendance: {
    get: null,
    update: async (correctionId, { action, notes }) => {
      const approverId = 1; // Sementara hardcode
      
      if (action === "APPROVED") {
        return approveAttendanceCorrectionAPI(correctionId, approverId, notes);
      } else if (action === "REJECTED") {
        return rejectAttendanceCorrectionAPI(correctionId, approverId, notes);
      }
      
      throw new Error(`Invalid action for attendance: ${action}`);
    },
  },
};

/**
 * Helper: normalise approval list from various response shapes.
 * Backend AttendanceCorrectionApproval returns: { id, approverId, sequence, status, notes, approvedAt, createdAt }
 */
const parseList = (res) => {
  const payload = res?.data;
  if (!payload) return [];
  if (Array.isArray(payload?.data))    return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload))          return payload;
  const firstArr = Object.values(payload).find((v) => Array.isArray(v));
  return firstArr ?? [];
};

export const useApproval = ({ type = "reimbursement" } = {}) => {
  const dispatch = useDispatch();
  const thunks = THUNKS_MAP[type];
  const apis = APPROVAL_APIS[type];

  const { approvers = [], loading = false, error = null } = useSelector(
    (state) => state.approval?.[type] || { approvers: [], loading: false, error: null }
  );

  /**
   * Single-level approval: finds first PENDING record and updates it.
   * SPECIAL CASE: Attendance & Overtime - langsung panggil approve/reject endpoint
   */
  const processApproval = async (requestId, action, notes = null) => {
    // SPECIAL HANDLING UNTUK ATTENDANCE & OVERTIME
    if (type === "attendance" || type === "overtime") {
      await apis.update(requestId, { action, notes });
      return;
    }

    // Normal flow untuk reimbursement, timeoff
    const res = await apis.get(requestId);
    const list = parseList(res);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(`No approval records found for ${type}`);
    }

    const pending = list.find((a) => a.status === "PENDING");
    if (!pending) throw new Error("All approvals have been processed");

    await apis.update(pending.id, { action, notes: notes?.trim() || null });
  };

  /**
   * Multi-level approval: finds record by `sequence` (backend field).
   * Backend model: AttendanceCorrectionApproval.sequence (Integer)
   * Previously used `approvalOrder` — now corrected to `sequence`.
   * 
   * NOTE: Attendance & Overtime tidak support multi-level manual dari frontend
   */
  const processApprovalByLevel = async (requestId, level, action, notes = null) => {
    // Attendance & Overtime tidak support multi-level
    if (type === "attendance" || type === "overtime") {
      throw new Error(`${type} does not support manual multi-level approval from frontend`);
    }

    const res = await apis.get(requestId);
    const list = parseList(res);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(`No approval records found for ${type}`);
    }

    // Match by `sequence` — the backend field name
    const target = list.find((a) => a.sequence === level);
    if (!target) {
      throw new Error(`Approval record for sequence ${level} not found`);
    }

    if (target.status !== "PENDING") {
      throw new Error(`Level ${level} is already ${target.status}`);
    }

    await apis.update(target.id, { action, notes: notes?.trim() || null });
  };

  return {
    // State
    approvers,
    loading,
    error,

    // Approver management
    fetchApprovers: () => dispatch(thunks.fetch()),
    createApprover: (data) => dispatch(thunks.create(data)).unwrap(),
    deleteApprover: (id) => dispatch(thunks.delete(id)).unwrap(),

    // Single-level approval (auto-find first PENDING)
    processApproval,
    approve: (id, notes) => processApproval(id, "APPROVED", notes),
    reject: (id, notes) => processApproval(id, "REJECTED", notes),

    // Multi-level approval (by sequence)
    processApprovalByLevel,
    approveLevel: (id, level, notes) => processApprovalByLevel(id, level, "APPROVED", notes),
    rejectLevel: (id, level, notes) => processApprovalByLevel(id, level, "REJECTED", notes),

    // Backward compatibility
    fetchApprovalApprovers: () => dispatch(thunks.fetch()),
    createApprovalApprover: (data) => dispatch(thunks.create(data)).unwrap(),
    deleteApprovalApprover: (id) => dispatch(thunks.delete(id)).unwrap(),
    approveReimbursement: (id, notes) => processApproval(id, "APPROVED", notes),
    rejectReimbursement: (id, notes) => processApproval(id, "REJECTED", notes),
  };
};
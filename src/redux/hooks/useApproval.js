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
  approveAttendanceCorrectionAPI,
  rejectAttendanceCorrectionAPI,
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
    update: updateReimbursementApprovalAPI,
  },
  timeoff: {
    get: getTimeOffApprovalsAPI,
    update: updateTimeOffApprovalAPI,
  },
  overtime: {
    get: null,
    update: async (overtimeId, { action, notes }) => {
      if (action === "APPROVED") return approveOvertimeAPI(overtimeId, notes);
      if (action === "REJECTED") return rejectOvertimeAPI(overtimeId, notes);
      throw new Error(`Invalid action for overtime: ${action}`);
    },
  },
  attendance: {
    get: null,
    update: async (correctionId, { action, notes }) => {
      if (action === "APPROVED") return approveAttendanceCorrectionAPI(correctionId, notes);
      if (action === "REJECTED") return rejectAttendanceCorrectionAPI(correctionId, notes);
      throw new Error(`Invalid action for attendance: ${action}`);
    },
  },
};

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

  const currentUser = useSelector((state) => state.auth?.user || null);

  const isMyTurn = (approvalRecords = []) => {
    if (!currentUser?.employeeId) {
      console.warn("[isMyTurn] currentUser.employeeId kosong:", currentUser);
      return false;
    }

    const sorted = approvalRecords
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    const pendingApproval = sorted.find((a) => a.status === "PENDING");

    if (!pendingApproval) return false;
    return Number(pendingApproval.approverId) === Number(currentUser.employeeId);
  };

  const getMyPendingApproval = (approvalList = []) => {
    if (!currentUser?.employeeId) {
      console.warn("[getMyPendingApproval] currentUser.employeeId kosong:", currentUser);
      return null;
    }

    const result = approvalList.find(
      (a) => Number(a.approverId) === Number(currentUser.employeeId) && a.status === "PENDING"
    ) || null;

    return result;
  };

  const processApproval = async (requestId, action, notes = null) => {
    console.log("[processApproval] start:", { type, requestId, action, notes });

    if (type === "attendance" || type === "overtime") {
      await apis.update(requestId, { action, notes });
      return;
    }

    const res = await apis.get(requestId);
    console.log("[processApproval] raw API response:", res);

    const list = parseList(res);
    console.log("[processApproval] parsed list:", list);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(`No approval records found for ${type}`);
    }

    const myPending = list.find(
      (a) => Number(a.approverId) === Number(currentUser.employeeId) && a.status === "PENDING"
    );

    if (!myPending) {
      throw new Error("Anda tidak memiliki approval yang perlu diproses, atau sudah diproses sebelumnya");
    }

    await apis.update(myPending.id, { action, notes: notes?.trim() || null });
  };

  return {
    approvers,
    loading,
    error,
    currentUser,
    isMyTurn,
    getMyPendingApproval,
    fetchApprovers: () => dispatch(thunks.fetch()),
    createApprover: (data) => dispatch(thunks.create(data)).unwrap(),
    deleteApprover: (id) => dispatch(thunks.delete(id)).unwrap(),
    processApproval,
    approve: (id, notes) => processApproval(id, "APPROVED", notes),
    reject: (id, notes) => processApproval(id, "REJECTED", notes),
    fetchApprovalApprovers: () => dispatch(thunks.fetch()),
    createApprovalApprover: (data) => dispatch(thunks.create(data)).unwrap(),
    deleteApprovalApprover: (id) => dispatch(thunks.delete(id)).unwrap(),
    approveReimbursement: (id, notes) => processApproval(id, "APPROVED", notes),
    rejectReimbursement: (id, notes) => processApproval(id, "REJECTED", notes),
  };
};
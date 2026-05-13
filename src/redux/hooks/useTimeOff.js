import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchTimeOffRequests,
  fetchTimeOffRequestById,
  createTimeOffRequest,
  updateTimeOffRequest,
  deleteTimeOffRequest,
} from "../slices/timeoffSlice";
import {
  getTimeOffApprovalsAPI,
  updateTimeOffApprovalAPI,
} from "../../ApiService/approvalApi";

export const useTimeOff = () => {
  const dispatch = useDispatch();

  const { list = [], loading = false, error = null } =
    useSelector((state) => state.timeOff || {});

  const processTimeOffApproval = async (id, action, notes = null) => {
    let res;
    try {
      res = await getTimeOffApprovalsAPI(id);
    } catch (apiErr) {
      throw new Error(
        "Gagal mengambil approval records: " +
        (apiErr?.response?.data?.message || apiErr.message)
      );
    }

    const payload = res?.data;
    let records = [];
    if      (Array.isArray(payload?.data))      records = payload.data;
    else if (Array.isArray(payload))            records = payload;
    else if (Array.isArray(payload?.content))   records = payload.content;
    else if (Array.isArray(payload?.approvals)) records = payload.approvals;
    else {
      const firstArr = payload
        ? Object.values(payload).find((v) => Array.isArray(v))
        : null;
      if (firstArr) records = firstArr;
    }

    if (records.length === 0) {
      throw new Error(
        "Tidak ada approval record untuk request ini. " +
        "Pastikan approver sudah dikonfigurasi sebelum request dibuat."
      );
    }

    const pending = records.find((a) =>
      ["PENDING", "SUBMITTED", "WAITING"].includes(a.status?.toUpperCase())
    );

    if (!pending) {
      throw new Error("Semua approval record sudah diproses.");
    }

    await updateTimeOffApprovalAPI(pending.id, {
      action,
      notes: notes?.trim() || null,
    });

    try {
      await dispatch(fetchTimeOffRequestById(id)).unwrap();
    } catch {
      // tidak fatal
    }
  };

  // ── useCallback agar referensi stabil, tidak trigger infinite loop ──
  const getTimeOffApprovals = useCallback(
    (id) => getTimeOffApprovalsAPI(id),
    [] // tidak ada dependency → referensi tidak pernah berubah
  );

  return {
    timeOffRequests: list,
    loading,
    error,

    fetchTimeOffRequests:  ()         => dispatch(fetchTimeOffRequests()).unwrap(),
    getTimeOffRequestById: (id)       => dispatch(fetchTimeOffRequestById(id)).unwrap(),
    createTimeOffRequest:  (data)     => dispatch(createTimeOffRequest(data)).unwrap(),
    updateTimeOffRequest:  (id, data) => dispatch(updateTimeOffRequest({ id, data })).unwrap(),
    deleteTimeOffRequest:  (id)       => dispatch(deleteTimeOffRequest(id)).unwrap(),

    approveTimeOffRequest: (id, notes) => processTimeOffApproval(id, "APPROVED", notes),
    rejectTimeOffRequest:  (id, notes) => processTimeOffApproval(id, "REJECTED", notes),

    getTimeOffApprovals, // stable reference karena useCallback
  };
};
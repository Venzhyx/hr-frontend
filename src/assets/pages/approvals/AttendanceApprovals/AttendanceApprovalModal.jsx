import React, { useState, useEffect } from "react";
import {
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineAnnotation,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
} from "react-icons/hi";
import { useAttendanceCorrection } from "../../../../redux/hooks/useAttendanceCorrection";
import { useApproval } from "../../../../redux/hooks/useApproval";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDateShort = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const fmtTime = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// Semua status SUBMITTED dan PENDING pakai warna kuning (amber)
const STATUS_CFG = {
  SUBMITTED: { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", label: "Submitted" },
  PENDING:   { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400", label: "Pending" },
  APPROVED:  { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Approved" },
  REJECTED:  { cls: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-400", label: "Rejected" },
};

const TYPE_LABELS = {
  CHECKIN:  "Check-in",
  CHECKOUT: "Check-out",
  BOTH:     "Check-in & Out",
};

// Helper untuk mendapatkan display status berdasarkan approvals
const getDisplayStatus = (correction) => {
  if (correction.status === "REJECTED") return "REJECTED";
  if (correction.status === "APPROVED") return "APPROVED";
  
  const approvals = correction.approvals || [];
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const totalLevels = 3;
  
  if (approvedCount === 0) return "SUBMITTED";
  if (approvedCount > 0 && approvedCount < totalLevels) return "PENDING";
  if (approvedCount === totalLevels) return "APPROVED";
  
  return correction.status || "SUBMITTED";
};

// ── Sub Components ────────────────────────────────────────────────────────────
const Spinner = ({ cls = "w-4 h-4" }) => (
  <svg className={`animate-spin ${cls}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Badge = ({ cfg }) =>
  cfg ? (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  ) : null;

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words">{value || "—"}</p>
    </div>
  </div>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
        <HiOutlineChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 py-4 bg-white space-y-4">{children}</div>}
    </div>
  );
};

const ApprovalStep = ({ ar, isLast, approverMap }) => {
  const cfg = STATUS_CFG[ar.status] || {
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
    dot: "bg-gray-400",
    label: ar.status,
  };

  const approverName =
    ar.approverName ||
    approverMap?.[String(ar.approverId)] ||
    `Approver #${ar.sequence ?? ar.id}`;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
            ar.status === "APPROVED"
              ? "bg-emerald-50 border-emerald-300"
              : ar.status === "REJECTED"
              ? "bg-red-50 border-red-300"
              : "bg-amber-50 border-amber-300"
          }`}
        >
          {ar.status === "APPROVED" ? (
            <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : ar.status === "REJECTED" ? (
            <HiOutlineX className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <HiOutlineClock className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
      </div>

      <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-gray-800">{approverName}</span>
          {ar.sequence != null && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              Level {ar.sequence}
            </span>
          )}
          <Badge cfg={cfg} />
          {ar.approvedAt && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <HiOutlineCalendar className="w-3 h-3" />
              {fmtDateShort(ar.approvedAt)}
            </span>
          )}
        </div>
        {ar.notes && (
          <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <HiOutlineAnnotation className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed italic">"{ar.notes}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Action Modal ───────────────────────────────────────────────────
const ActionModal = ({ correction, action, onClose, onSuccess }) => {
  const { handleApprove, handleReject } = useAttendanceCorrection({ role: "admin" });
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const isApprove = action === "APPROVED";
  const btnCls    = isApprove ? "bg-green-600 hover:bg-green-700"       : "bg-red-500 hover:bg-red-600";
  const iconBgCls = isApprove ? "bg-green-100"                          : "bg-red-100";
  const iconCls   = isApprove ? "text-green-600"                        : "text-red-500";
  const ringCls   = isApprove ? "focus:ring-green-400 border-green-300" : "focus:ring-red-400 border-red-300";
  const wrapCls   = isApprove ? "bg-green-50 border-green-200"          : "bg-red-50 border-red-200";

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isApprove) await handleApprove(correction.id, notes);
      else           await handleReject(correction.id, notes);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Gagal memproses approval.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-6 py-5 border-b ${wrapCls}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgCls}`}>
              {isApprove
                ? <HiOutlineCheck className={`w-5 h-5 ${iconCls}`} />
                : <HiOutlineX     className={`w-5 h-5 ${iconCls}`} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800">
                {isApprove ? "Approve Attendance Correction" : "Reject Attendance Correction"}
              </h3>
              {correction?.employeeName && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {correction.employeeName} · {TYPE_LABELS[correction.type] || correction.type} · {fmtDateShort(correction.date)}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-lg">
              <HiOutlineX className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg leading-relaxed">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineAnnotation className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">
              Komentar
              {!isApprove
                ? <span className="text-red-500 ml-0.5">*</span>
                : <span className="text-gray-400 font-normal ml-1">(opsional)</span>}
            </label>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder={
              isApprove
                ? "Contoh: Koreksi disetujui. Data sudah diverifikasi."
                : "Contoh: Mohon ajukan ulang dengan melampirkan bukti pendukung."
            }
            className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 transition-colors resize-none disabled:opacity-60 ${ringCls}`}
          />
          {!isApprove && !notes.trim() && (
            <p className="mt-1.5 text-xs text-red-500">Alasan penolakan wajib diisi.</p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!isApprove && !notes.trim())}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnCls}`}
          >
            {loading ? (
              <><Spinner /> Memproses…</>
            ) : isApprove ? (
              <><HiOutlineCheck className="w-4 h-4" /> Konfirmasi Approve</>
            ) : (
              <><HiOutlineX className="w-4 h-4" /> Konfirmasi Reject</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Export: AttendanceCorrectionDetailModal ──────────────────────────────
const AttendanceCorrectionDetailModal = ({ correction, emp, onClose, onSuccess }) => {
  const displayStatus = getDisplayStatus(correction);
  const sCfg = STATUS_CFG[displayStatus] || STATUS_CFG.SUBMITTED;
  
  // Bisa approve jika SUBMITTED atau PENDING
  const canAct = displayStatus === "SUBMITTED" || displayStatus === "PENDING";
  
  const initials = correction.employeeName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const [approvalRecords,  setApprovalRecords]  = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [actionModal,      setActionModal]      = useState(null);

  const { approvers } = useApproval({ type: "attendance" });

  const approverMap = Object.fromEntries(
    (approvers || []).map((a) => [String(a.employeeId), a.employeeName])
  );

  const loadApprovals = () => {
    setLoadingApprovals(true);
    try {
      const list = [...(correction?.approvals || [])];
      list.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      setApprovalRecords(list);
    } catch {
      setApprovalRecords([]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [correction.id, correction?.approvals]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const processedRecord = approvalRecords.find(
    (ar) => ar.status === "APPROVED" || ar.status === "REJECTED"
  );

  const handleActionSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge cfg={sCfg} />
                  {correction.type && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[correction.type] || correction.type}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">Detail Attendance Correction</h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <HiOutlineClock className="w-3 h-3" /> Diajukan {fmtDateShort(correction.createdAt)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <HiOutlineX className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Date hero */}
            <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Tanggal Koreksi</p>
                <p className="text-2xl font-bold text-indigo-700">{fmtDateShort(correction.date)}</p>
                <p className="text-xs text-indigo-400 mt-1">
                  {correction.newCheckIn  && <>Check-in: {fmtTime(correction.newCheckIn)}</>}
                  {correction.newCheckIn && correction.newCheckOut && <span className="mx-1">·</span>}
                  {correction.newCheckOut && <>Check-out: {fmtTime(correction.newCheckOut)}</>}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <HiOutlineCalendar className="w-6 h-6 text-indigo-500" />
              </div>
            </div>

            {/* Notes banner */}
            {loadingApprovals ? (
              <div className="mt-3 flex items-center gap-2 px-1 py-1">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin flex-shrink-0" />
                <p className="text-xs text-gray-400">Memuat catatan approval…</p>
              </div>
            ) : processedRecord?.notes ? (
              <div
                className={`mt-3 rounded-xl px-4 py-3 flex items-start gap-2 border ${
                  processedRecord.status === "APPROVED"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <HiOutlineAnnotation
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"
                  }`}
                />
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                      processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"
                    }`}
                  >
                    {processedRecord.status === "APPROVED" ? "Komentar Approver" : "Alasan Penolakan"}
                  </p>
                  <p
                    className={`text-xs leading-relaxed italic ${
                      processedRecord.status === "APPROVED" ? "text-emerald-800" : "text-red-800"
                    }`}
                  >
                    "{processedRecord.notes}"
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {/* Employee info */}
            <Section title="Informasi Karyawan">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                  {emp?.photo ? (
                    <img src={emp.photo} alt={correction.employeeName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{correction.employeeName}</p>
                  {correction.employeeCode && (
                    <p className="text-xs text-gray-500 mt-0.5">NIK: {correction.employeeCode}</p>
                  )}
                  {(emp?.jobTitle || emp?.position) && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <HiOutlineBriefcase className="w-3 h-3" /> {emp.jobTitle || emp.position}
                    </p>
                  )}
                  {emp?.departmentName && (
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <HiOutlineOfficeBuilding className="w-3 h-3" /> {emp.departmentName}
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* Correction detail */}
            <Section title="Detail Koreksi">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={HiOutlineCalendar} label="Tanggal"          value={fmtDateShort(correction.date)} />
                <InfoRow icon={HiOutlineClock}    label="Tipe Koreksi"     value={TYPE_LABELS[correction.type] || correction.type} />
                {correction.oldCheckIn  && <InfoRow icon={HiOutlineClock}  label="Check-in Lama"  value={fmtTime(correction.oldCheckIn)} />}
                {correction.newCheckIn  && <InfoRow icon={HiOutlineCheck}  label="Check-in Baru"  value={fmtDateTime(correction.newCheckIn)} />}
                {correction.oldCheckOut && <InfoRow icon={HiOutlineClock}  label="Check-out Lama" value={fmtTime(correction.oldCheckOut)} />}
                {correction.newCheckOut && <InfoRow icon={HiOutlineCheck}  label="Check-out Baru" value={fmtDateTime(correction.newCheckOut)} />}
              </div>
            </Section>

            {/* Description */}
            {correction.description && (
              <Section title="Alasan Pengajuan">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HiOutlineAnnotation className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {correction.description}
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* Approval history */}
            <Section title="Riwayat Approval">
              {loadingApprovals ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                  <p className="text-sm text-gray-400">Memuat riwayat approval…</p>
                </div>
              ) : approvalRecords.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <HiOutlineDocumentText className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Belum ada approval record</p>
                  <p className="text-xs text-gray-300 mt-1">Pastikan approver sudah dikonfigurasi</p>
                </div>
              ) : (
                <div className="pt-1">
                  {approvalRecords.map((ar, idx) => (
                    <ApprovalStep
                      key={ar.id ?? idx}
                      ar={ar}
                      approverMap={approverMap}
                      isLast={idx === approvalRecords.length - 1}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {canAct ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setActionModal("REJECTED")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <HiOutlineX className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => setActionModal("APPROVED")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <HiOutlineCheck className="w-4 h-4" /> Approve
                </button>
              </div>
            ) : (
              <div
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${sCfg.cls}`}
              >
                <span className={`w-2 h-2 rounded-full ${sCfg.dot}`} />
                Request sudah {sCfg.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          correction={correction}
          action={actionModal}
          onClose={() => setActionModal(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
};

export default AttendanceCorrectionDetailModal;
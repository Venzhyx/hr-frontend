import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash,
  HiOutlineCurrencyDollar, HiOutlineDocumentText,
  HiOutlineCheck, HiOutlineX, HiOutlineClock,
  HiOutlineZoomIn, HiOutlineAnnotation, HiOutlineCalendar,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { useReimbursement } from "../../../redux/hooks/useReimbursement";
import { getReimbursementApprovalsAPI } from "../../../ApiService/approvalApi";

// ==================== HELPERS ====================
const fmt = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_CFG = {
  SUBMITTED: { label: "Submitted", cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400",   Icon: HiOutlineClock  },
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400",   Icon: HiOutlineClock  },
  APPROVED:  { label: "Approved",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", Icon: HiOutlineCheck  },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-400",     Icon: HiOutlineX      },
};

const AR_STATUS = {
  PENDING:  { cls: "bg-amber-50 text-amber-700 border border-amber-200",       dot: "bg-amber-400",   label: "Pending"  },
  APPROVED: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Approved" },
  REJECTED: { cls: "bg-red-50 text-red-700 border border-red-200",             dot: "bg-red-400",     label: "Rejected" },
};

// ==================== DERIVE STATUS ====================
/**
 * Rules:
 *  - Tidak ada record / semua PENDING           → "SUBMITTED"
 *  - Ada ≥1 APPROVED tapi belum semua selesai   → "PENDING"
 *  - Ada yang REJECTED (kapanpun)               → "REJECTED"
 *  - Semua APPROVED                             → "APPROVED"
 */
const deriveStatus = (records, fallback) => {
  if (!records || records.length === 0) return fallback || "SUBMITTED";

  const total    = records.length;
  const approved = records.filter((r) => r.status === "APPROVED").length;
  const rejected = records.filter((r) => r.status === "REJECTED").length;

  // Belum ada yang action sama sekali
  if (approved === 0 && rejected === 0) return "SUBMITTED";

  // Langsung REJECTED kalau ada yang reject
  if (rejected > 0) return "REJECTED";

  // Sebagian sudah approve, belum semua
  if (approved > 0 && approved < total) return "PENDING";

  // Semua sudah approve
  if (approved === total) return "APPROVED";

  return fallback || "SUBMITTED";
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
  </div>
);

const Badge = ({ cfg }) =>
  cfg ? (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  ) : null;

// ==================== COLLAPSIBLE SECTION ====================
const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-100"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
};

// ==================== RECEIPT MODAL ====================
const ReceiptModal = ({ url, onClose }) => {
  const isImage = url && (/\.(jpg|jpeg|png)(\?|$)/i.test(url) || url.startsWith("blob:"));

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Receipt Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <HiOutlineZoomIn className="w-3.5 h-3.5" /> Open full size
            </a>
            <button type="button" onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 min-h-0">
          {isImage
            ? <img src={url} alt="Receipt" className="max-w-full max-h-full object-contain rounded-lg shadow" />
            : <iframe src={url} title="Receipt PDF" className="w-full rounded-lg border border-gray-200 bg-white" style={{ height: "65vh" }} />
          }
        </div>
      </div>
    </div>
  );
};

// ==================== APPROVAL STEP (timeline) ====================
const ApprovalStep = ({ ar, isLast }) => {
  const cfg = AR_STATUS[ar.status] || {
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
    dot: "bg-gray-400",
    label: ar.status,
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
          ar.status === "APPROVED" ? "bg-emerald-50 border-emerald-300"
          : ar.status === "REJECTED" ? "bg-red-50 border-red-300"
          : "bg-amber-50 border-amber-300"
        }`}>
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
          <span className="text-sm font-semibold text-gray-800">{ar.approverName || "—"}</span>
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

// ==================== PARSE APPROVAL LIST ====================
const parseApprovalList = (res) => {
  const payload = res?.data;
  if (!payload) return [];
  if (Array.isArray(payload?.data))      return payload.data;
  if (Array.isArray(payload?.content))   return payload.content;
  if (Array.isArray(payload))            return payload;
  if (Array.isArray(payload?.approvals)) return payload.approvals;
  const firstArr = Object.values(payload).find((v) => Array.isArray(v));
  if (firstArr) return firstArr;
  return [];
};

// ==================== MAIN COMPONENT ====================
const ReimbursementDetail = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const { getReimbursementById, deleteReimbursement } = useReimbursement();

  const [data,             setData]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [deleting,         setDeleting]         = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [approvalRecords,  setApprovalRecords]  = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  // ── Fetch main data ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await getReimbursementById(id);
        const item = res?.data ?? res;
        if (!item?.id) throw new Error("Not found");
        setData(item);
      } catch (e) {
        console.error("[ReimbursementDetail] fetch error:", e);
        setError("Failed to load reimbursement.");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // ── Fetch approval records ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const loadApprovals = async () => {
      setLoadingApprovals(true);
      try {
        const res  = await getReimbursementApprovalsAPI(id);
        const list = parseApprovalList(res);
        setApprovalRecords(list);
      } catch (e) {
        console.warn("[ReimbursementDetail] gagal fetch approvals:", e);
        setApprovalRecords([]);
      } finally {
        setLoadingApprovals(false);
      }
    };
    loadApprovals();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this reimbursement?")) return;
    setDeleting(true);
    try {
      await deleteReimbursement(id);
      navigate("/reimbursements", {
        state: { toast: { show: true, message: "Reimbursement deleted.", type: "success" } }
      });
    } catch {
      alert("Failed to delete.");
      setDeleting(false);
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) return (
    <div className="w-full px-4 md:px-6 py-6 flex justify-center items-center h-64">
      <div className="text-gray-400">Loading…</div>
    </div>
  );

  if (error || !data) return (
    <div className="w-full px-4 md:px-6 py-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate("/reimbursements")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Reimbursement Detail</h1>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
    </div>
  );

  // ── Derived values ───────────────────────────────────────────────────────
  const derivedStatus = deriveStatus(approvalRecords, data.status);
  const statusCfg = STATUS_CFG[derivedStatus] || {
    label: derivedStatus,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    Icon: HiOutlineClock,
  };

  const receipt = data.receiptFile;
  const isImage = receipt && /\.(jpg|jpeg|png)(\?|$)/i.test(receipt);

  const processedRecord = approvalRecords.find(
    (ar) => ar.status === "APPROVED" || ar.status === "REJECTED"
  );

  return (
    <>
      {showReceiptModal && receipt && (
        <ReceiptModal url={receipt} onClose={() => setShowReceiptModal(false)} />
      )}

      <div className="w-full px-4 md:px-6 py-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate("/reimbursements")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reimbursement Detail</h1>
              <p className="text-sm text-gray-500 mt-0.5">ID: {id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.status === "SUBMITTED" && (
              <button onClick={() => navigate(`/reimbursements/edit/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                <HiOutlinePencil className="w-4 h-4" /> Edit
              </button>
            )}
            <button onClick={handleDelete} disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors text-sm disabled:opacity-50">
              <HiOutlineTrash className="w-4 h-4" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        <div className="space-y-4">

          {/* ── Main card ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b border-gray-100">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <HiOutlineCurrencyDollar className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{data.title}</h2>
                  <Badge cfg={statusCfg} />
                </div>
                <p className="text-sm text-gray-500">{data.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-indigo-600">{fmt(data.total)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Amount</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6">
              <Field label="Expense Date" value={fmtDate(data.expenseDate)} />
              <Field label="Employee"     value={data.employeeName} />
              <Field label="Paid By"      value={data.paidBy === "EMPLOYEE" ? "Employee (reimbursed)" : "Company"} />
              <Field label="Category"     value={data.category} />
              {data.companyName && <Field label="Company"    value={data.companyName} />}
              <Field label="Submitted"    value={fmtDate(data.createdAt)} />
              <Field label="Last Updated" value={fmtDate(data.updatedAt)} />
            </div>

            {data.notes && (
              <div className="px-6 pb-6">
                <p className="text-xs text-gray-400 font-medium mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>

          {/* ── Approval notes banner ────────────────────────────────────── */}
          {loadingApprovals ? (
            <div className="flex items-center gap-3 py-2 px-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-400">Memuat catatan approval…</p>
            </div>
          ) : processedRecord?.notes ? (
            <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${
              processedRecord.status === "APPROVED"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}>
              <HiOutlineAnnotation className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"
              }`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                  processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"
                }`}>
                  {processedRecord.status === "APPROVED" ? "Catatan Approver" : "Alasan Penolakan"}
                </p>
                <p className={`text-sm leading-relaxed italic ${
                  processedRecord.status === "APPROVED" ? "text-emerald-800" : "text-red-800"
                }`}>
                  "{processedRecord.notes}"
                </p>
                {(processedRecord.approverName || processedRecord.approvedAt) && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    {processedRecord.approverName && (
                      <span className="font-medium">{processedRecord.approverName}</span>
                    )}
                    {processedRecord.approverName && processedRecord.approvedAt && (
                      <span>·</span>
                    )}
                    {processedRecord.approvedAt && (
                      <span className="flex items-center gap-1">
                        <HiOutlineCalendar className="w-3 h-3" />
                        {fmtDateShort(processedRecord.approvedAt)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* ── Receipt ─────────────────────────────────────────────────── */}
          {receipt && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Attached Receipt</p>
              {isImage ? (
                <button type="button" onClick={() => setShowReceiptModal(true)}
                  className="block focus:outline-none group relative">
                  <img src={receipt} alt="receipt"
                    className="max-h-72 rounded-xl border border-gray-200 object-contain transition-opacity group-hover:opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <HiOutlineZoomIn className="w-4 h-4" /> Click to preview
                    </span>
                  </div>
                </button>
              ) : (
                <button type="button" onClick={() => setShowReceiptModal(true)}
                  className="inline-flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors w-full text-left">
                  <HiOutlineDocumentText className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">View Receipt</p>
                    <p className="text-xs text-gray-400 mt-0.5">Click to preview PDF</p>
                  </div>
                  <HiOutlineZoomIn className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              )}
            </div>
          )}

          {/* ── Riwayat Approval ─────────────────────────────────────────── */}
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
                    key={ar.id}
                    ar={ar}
                    isLast={idx === approvalRecords.length - 1}
                  />
                ))}
              </div>
            )}
          </Section>

        </div>
      </div>
    </>
  );
};

export default ReimbursementDetail;

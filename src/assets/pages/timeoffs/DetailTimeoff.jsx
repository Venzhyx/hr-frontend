import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash,
  HiOutlineDocumentText, HiOutlineCheck, HiOutlineX,
  HiOutlineClock, HiOutlineZoomIn, HiOutlineOfficeBuilding,
  HiOutlineBriefcase, HiOutlineAnnotation, HiOutlineCalendar,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { useTimeOff } from "../../../redux/hooks/useTimeOff";
import { useEmployee } from "../../../redux/hooks/useEmployee";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_CFG = {
  SUBMITTED: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",   label: "Submitted",       Icon: HiOutlineClock  },
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",   label: "Pending", Icon: HiOutlineClock  },
  APPROVED:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Approved",         Icon: HiOutlineCheck  },
  REJECTED:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400",     label: "Rejected",         Icon: HiOutlineX      },
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

const Badge = ({ cfg }) =>
  cfg ? (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls ?? `${cfg.bg} ${cfg.text} ${cfg.border}`}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  ) : null;

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
  </div>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
};

const AttachmentModal = ({ url, isImage, onClose }) => {
  const handleBackdrop = useCallback((e) => { if (e.target === e.currentTarget) onClose(); }, [onClose]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handleBackdrop}>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Attachment Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              onClick={e => e.stopPropagation()}>
              <HiOutlineZoomIn className="w-3.5 h-3.5" /> Open full size
            </a>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 min-h-0">
          {isImage
            ? <img src={url} alt="attachment" className="max-w-full max-h-full object-contain rounded-lg shadow" />
            : <iframe src={url} title="Attachment PDF" className="w-full rounded-lg border border-gray-200 bg-white" style={{ height: "65vh" }} />}
        </div>
      </div>
    </div>
  );
};

const ApprovalStep = ({ ar, isLast }) => {
  const cfg = AR_STATUS[ar.status] || { cls: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-400", label: ar.status };
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
          ar.status === "APPROVED" ? "bg-emerald-50 border-emerald-300"
          : ar.status === "REJECTED" ? "bg-red-50 border-red-300"
          : "bg-amber-50 border-amber-300"}`}>
          {ar.status === "APPROVED" ? <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
          : ar.status === "REJECTED" ? <HiOutlineX className="w-3.5 h-3.5 text-red-500" />
          : <HiOutlineClock className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
      </div>
      <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-gray-800">{ar.approverName || "—"}</span>
          <Badge cfg={cfg} />
          {ar.approvedAt && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <HiOutlineCalendar className="w-3 h-3" />{fmtDateShort(ar.approvedAt)}
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

const parseApprovalList = (res) => {
  const payload = res?.data;
  if (!payload) return [];
  if (Array.isArray(payload?.data))      return payload.data;
  if (Array.isArray(payload?.content))   return payload.content;
  if (Array.isArray(payload))            return payload;
  if (Array.isArray(payload?.approvals)) return payload.approvals;
  const firstArr = Object.values(payload).find(v => Array.isArray(v));
  return firstArr ?? [];
};

const TimeOffDetailPage = () => {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { getTimeOffRequestById, deleteTimeOffRequest, getTimeOffApprovals } = useTimeOff();
  const { employees, fetchEmployees } = useEmployee();

  const [data,             setData]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [deleting,         setDeleting]         = useState(false);
  const [showPreview,      setShowPreview]      = useState(false);
  const [approvalRecords,  setApprovalRecords]  = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  useEffect(() => {
    fetchEmployees();
    const load = async () => {
      try {
        const res  = await getTimeOffRequestById(id);
        const item = res?.data ?? res;
        if (!item?.id) throw new Error("Not found");
        setData(item);
      } catch { setError("Gagal memuat data."); }
      finally  { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (!id || typeof getTimeOffApprovals !== "function") return;
    const loadApprovals = async () => {
      setLoadingApprovals(true);
      try {
        const res  = await getTimeOffApprovals(id);
        const list = parseApprovalList(res);
        setApprovalRecords(list);
      } catch { setApprovalRecords([]); }
      finally  { setLoadingApprovals(false); }
    };
    loadApprovals();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Hapus time off request ini?")) return;
    setDeleting(true);
    try {
      await deleteTimeOffRequest(id);
      navigate("/time-off", { state: { toast: { show: true, message: "Request dihapus.", type: "success" } } });
    } catch { alert("Gagal menghapus."); setDeleting(false); }
  };

  if (loading) return (
    <div className="w-full px-4 md:px-6 py-6 flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Memuat data…</div>
    </div>
  );
  if (error || !data) return (
    <div className="w-full px-4 md:px-6 py-6">
      <button onClick={() => navigate("/time-off")} className="p-2 hover:bg-gray-100 rounded-lg mb-4">
        <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
    </div>
  );

  // ── Derived ──
  const derivedStatus = deriveStatus(approvalRecords, data.status);
  const sCfg          = STATUS_CFG[derivedStatus] || STATUS_CFG.SUBMITTED;
  const emp           = employees.find(e => e.id === data.employeeId || String(e.id) === String(data.employeeId));
  const initials      = data.employeeName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const attachmentUrl = data.attachmentUrl;
  const isImage       = attachmentUrl && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(attachmentUrl);

  const processedRecord = approvalRecords.find(ar => ar.status === "APPROVED" || ar.status === "REJECTED");

  const sBadgeCfg = { cls: `${sCfg.bg} ${sCfg.text} border ${sCfg.border}`, dot: sCfg.dot, label: sCfg.label };

  return (
    <>
      {showPreview && attachmentUrl && (
        <AttachmentModal url={attachmentUrl} isImage={isImage} onClose={() => setShowPreview(false)} />
      )}

      <div className="w-full px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate("/time-off")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <p className="text-xs text-gray-400 font-medium">
                Time Off <span className="text-gray-300 mx-1">/</span><span className="text-gray-600">Detail</span>
              </p>
              <h1 className="text-2xl font-bold text-gray-800">Time Off Detail</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.status === "SUBMITTED" && (
              <button onClick={() => navigate(`/time-off/edit/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                <HiOutlinePencil className="w-4 h-4" /> Edit
              </button>
            )}
            <button onClick={handleDelete} disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 shadow-sm disabled:opacity-50 transition-all">
              <HiOutlineTrash className="w-4 h-4" />
              {deleting ? "Menghapus…" : "Hapus"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b border-gray-100">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-gray-100">
                {emp?.photo
                  ? <img src={emp.photo} alt={data.employeeName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">{initials}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{data.employeeName || "—"}</h2>
                  <Badge cfg={sBadgeCfg} />
                </div>
                {(emp?.jobTitle || emp?.position) && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <HiOutlineBriefcase className="w-3.5 h-3.5 flex-shrink-0" />{emp.jobTitle || emp.position}
                  </p>
                )}
                {emp?.departmentName && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <HiOutlineOfficeBuilding className="w-3.5 h-3.5 flex-shrink-0" />{emp.departmentName}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-indigo-600">{data.requested ?? "—"}</p>
                <p className="text-xs text-gray-400 mt-0.5">Hari Cuti</p>
                <p className="text-xs text-gray-400 mt-1">Diajukan {fmtDateShort(data.createdAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
              <Field label="Start Date" value={fmtDate(data.startDate)} />
              <Field label="End Date"   value={fmtDate(data.endDate)} />
              <Field label="Tipe Cuti"  value={data.timeOffTypeName} />
              <Field label="Durasi"     value={data.requested ? `${data.requested} hari` : "—"} />
            </div>
          </div>

          {/* Approval Notes Banner */}
          {loadingApprovals ? (
            <div className="flex items-center gap-3 py-2 px-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-400">Memuat catatan approval…</p>
            </div>
          ) : processedRecord?.notes ? (
            <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${
              processedRecord.status === "APPROVED" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <HiOutlineAnnotation className={`w-4 h-4 flex-shrink-0 mt-0.5 ${processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"}`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${processedRecord.status === "APPROVED" ? "text-emerald-500" : "text-red-400"}`}>
                  {processedRecord.status === "APPROVED" ? "Catatan Approver" : "Alasan Penolakan"}
                </p>
                <p className={`text-sm leading-relaxed italic ${processedRecord.status === "APPROVED" ? "text-emerald-800" : "text-red-800"}`}>
                  "{processedRecord.notes}"
                </p>
                {(processedRecord.approverName || processedRecord.approvedAt) && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    {processedRecord.approverName && <span className="font-medium">{processedRecord.approverName}</span>}
                    {processedRecord.approverName && processedRecord.approvedAt && <span>·</span>}
                    {processedRecord.approvedAt && (
                      <span className="flex items-center gap-1"><HiOutlineCalendar className="w-3 h-3" />{fmtDateShort(processedRecord.approvedAt)}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Alasan */}
          {data.reason && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Alasan</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{data.reason}</p>
            </div>
          )}

          {/* Attachment */}
          {attachmentUrl && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Attachment</p>
              {isImage ? (
                <button type="button" onClick={() => setShowPreview(true)} className="block focus:outline-none group relative">
                  <img src={attachmentUrl} alt="attachment" className="max-h-72 rounded-xl border border-gray-200 object-contain transition-opacity group-hover:opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <HiOutlineZoomIn className="w-4 h-4" /> Click to preview
                    </span>
                  </div>
                </button>
              ) : (
                <button type="button" onClick={() => setShowPreview(true)}
                  className="inline-flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors w-full text-left">
                  <HiOutlineDocumentText className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{data.attachmentName || "Lihat File"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Klik untuk preview PDF</p>
                  </div>
                  <HiOutlineZoomIn className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              )}
            </div>
          )}

          {/* Riwayat Approval */}
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
                  <ApprovalStep key={ar.id} ar={ar} isLast={idx === approvalRecords.length - 1} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
};

export default TimeOffDetailPage;

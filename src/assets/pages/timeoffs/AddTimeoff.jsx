import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineDocumentText,
  HiOutlineAnnotation, HiOutlinePaperClip, HiOutlineX,
  HiOutlineCheck, HiOutlineUser, HiOutlineChevronDown,
  HiOutlineExclamation, HiOutlineCloudUpload, HiOutlineZoomIn,
} from "react-icons/hi";
import { useTimeOff } from "../../../redux/hooks/useTimeOff";
import { getTimeOffTypesAPI } from "../../../ApiService/settingsApi";
import { getEmployeesAPI } from "../../../ApiService/employeeApi";
import { uploadAttachmentAPI } from "../../../ApiService/timeoffApi";

const inputCls    = "w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
const inputErrCls = "w-full px-3.5 py-2.5 text-sm bg-amber-50 border border-amber-300 rounded-xl focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all";
const selectCls   = inputCls + " appearance-none pr-10";
const labelCls    = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

const AddTimeOffPage = () => {
  const navigate = useNavigate();
  const { createTimeOffRequest } = useTimeOff();

  const [timeOffTypes,   setTimeOffTypes]   = useState([]);
  const [employees,      setEmployees]      = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [uploadingFile,  setUploadingFile]  = useState(false);
  const [error,          setError]          = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [showPreview,    setShowPreview]    = useState(false);

  const [form, setForm] = useState({
    employeeId: "", timeOffTypeId: "",
    startDate: "", endDate: "",
    reason: "", attachmentUrl: "", attachmentName: "",
  });

  useEffect(() => {
    getTimeOffTypesAPI()
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        setTimeOffTypes(Array.isArray(list) ? list.filter(t => !t.status || t.status === "ACTIVE") : []);
      }).catch(() => setTimeOffTypes([]));

    getEmployeesAPI()
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        setEmployees(Array.isArray(list) ? list : []);
      }).catch(() => setEmployees([]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const requestedDays = (() => {
    if (!form.startDate || !form.endDate) return null;
    const d = Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1;
    return d > 0 ? d : null;
  })();

  const selectedType     = timeOffTypes.find(x => String(x.id) === String(form.timeOffTypeId));
  const selectedEmployee = employees.find(e => String(e.id) === String(form.employeeId));
  const maxDays          = selectedType?.maxDaysPerSubmission ?? null;
  const exceedsMax       = maxDays !== null && requestedDays !== null && requestedDays > maxDays;

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachmentFile(file);
    set("attachmentUrl", URL.createObjectURL(file));
    set("attachmentName", file.name);
  };

  const removeFile = () => {
    setAttachmentFile(null);
    set("attachmentUrl", "");
    set("attachmentName", "");
  };

  const handleSubmit = async () => {
    if (!form.employeeId || !form.timeOffTypeId || !form.startDate || !form.endDate) {
      setError("Employee, Time Off Type, Start Date, dan End Date wajib diisi.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date tidak boleh sebelum start date.");
      return;
    }
    // exceedsMax: hanya warning, tidak memblokir submit
    setLoading(true); setError(null);
    try {
      // Upload attachment dulu kalau ada file baru
      let finalAttachmentUrl  = form.attachmentUrl  || null;
      let finalAttachmentName = form.attachmentName || null;
      if (attachmentFile) {
        setUploadingFile(true);
        const uploadRes = await uploadAttachmentAPI(attachmentFile);
        setUploadingFile(false);
        finalAttachmentUrl  = uploadRes.data?.data ?? uploadRes.data ?? null;
        finalAttachmentName = attachmentFile.name;
      }

      await createTimeOffRequest({
        employeeId:     Number(form.employeeId),
        timeOffTypeId:  Number(form.timeOffTypeId),
        startDate:      form.startDate,
        endDate:        form.endDate,
        reason:         form.reason        || null,
        attachmentUrl:  finalAttachmentUrl,
        attachmentName: finalAttachmentName,
      });
      navigate("/time-off", {
        state: { toast: { show: true, message: "Time off request berhasil dibuat.", type: "success" } },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Gagal membuat request.");
    } finally {
      setLoading(false);
    }
  };

  const isImage = form.attachmentUrl && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(form.attachmentUrl);

  return (
    <>
      {/* ── Preview Modal ── */}
      {showPreview && form.attachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                {attachmentFile?.name || "Preview"}
              </span>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-50">
              {isImage
                ? <img src={form.attachmentUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-xl shadow" />
                : <iframe src={form.attachmentUrl} title="PDF" className="w-full rounded-lg border border-gray-200" style={{ height: "65vh" }} />
              }
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 md:px-6 py-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/time-off")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <p className="text-xs text-gray-400 font-medium">
            Time Off <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-600">Add Request</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-800">Add Time Off Request</h1>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <HiOutlineExclamation className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-4">

        {/* ══ Section 1: Employee + Time Off Type (2 col) ══ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Informasi Karyawan</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Employee */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineUser className="w-3.5 h-3.5" /> Employee <span className="text-red-400">*</span>
                </span>
              </label>
              <div className="relative">
                <select value={form.employeeId} onChange={e => set("employeeId", e.target.value)} className={selectCls}>
                  <option value="">— Pilih karyawan —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName ?? emp.name ?? `Employee #${emp.id}`}
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {selectedEmployee && (
                <p className="mt-1.5 text-xs text-gray-400">
                  {selectedEmployee.jobTitle || selectedEmployee.position || ""}
                  {selectedEmployee.departmentName ? ` · ${selectedEmployee.departmentName}` : ""}
                </p>
              )}
            </div>

            {/* Time Off Type */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineDocumentText className="w-3.5 h-3.5" /> Time Off Type <span className="text-red-400">*</span>
                </span>
              </label>
              <div className="relative">
                <select value={form.timeOffTypeId} onChange={e => set("timeOffTypeId", e.target.value)} className={selectCls}>
                  <option value="">— Pilih tipe cuti —</option>
                  {timeOffTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.maxDaysPerSubmission ? ` (maks. ${t.maxDaysPerSubmission} hari)` : ""}
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {maxDays && (
                <p className="mt-1.5 text-xs text-indigo-500 font-medium">
                  Maks. {maxDays} hari per pengajuan
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ══ Section 2: Tanggal (2 col) + days badge ══ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Tanggal Cuti</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Start Date */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineCalendar className="w-3.5 h-3.5" /> Start Date <span className="text-red-400">*</span>
                </span>
              </label>
              <input type="date" value={form.startDate}
                onChange={e => set("startDate", e.target.value)}
                className={inputCls} />
            </div>

            {/* End Date */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineCalendar className="w-3.5 h-3.5" /> End Date <span className="text-red-400">*</span>
                </span>
              </label>
              <input type="date" value={form.endDate} min={form.startDate}
                onChange={e => set("endDate", e.target.value)}
                className={exceedsMax ? inputErrCls : inputCls} />
            </div>
          </div>

          {/* Days indicator */}
          {requestedDays && (
            <div className="mt-4 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                exceedsMax
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {exceedsMax
                  ? <HiOutlineExclamation className="w-3.5 h-3.5" />
                  : <HiOutlineCheck className="w-3.5 h-3.5" />
                }
                {requestedDays} hari
                {exceedsMax ? ` — melebihi batas ${maxDays} hari` : maxDays ? ` dari maks. ${maxDays}` : " requested"}
              </span>
              {!exceedsMax && maxDays && (
                <span className="text-xs text-gray-400">{maxDays - requestedDays} hari tersisa</span>
              )}
            </div>
          )}

          {/* Exceeds warning — kuning, bisa tetap submit */}
          {exceedsMax && (
            <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <HiOutlineExclamation className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{selectedType.name}</span> memiliki batas maks.{" "}
                <span className="font-semibold">{maxDays} hari</span>, kamu memilih{" "}
                <span className="font-semibold">{requestedDays} hari</span>. Request tetap bisa diajukan namun perlu persetujuan khusus.
              </p>
            </div>
          )}
        </div>

        {/* ══ Section 3: Reason + Attachment (2 col) ══ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Keterangan Tambahan</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Reason */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineAnnotation className="w-3.5 h-3.5" /> Reason
                  <span className="text-gray-400 font-normal normal-case tracking-normal">(opsional)</span>
                </span>
              </label>
              <textarea
                value={form.reason}
                onChange={e => set("reason", e.target.value)}
                rows={4}
                placeholder="Tuliskan alasan pengajuan cuti…"
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Attachment */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <HiOutlinePaperClip className="w-3.5 h-3.5" /> Attachment
                  <span className="text-gray-400 font-normal normal-case tracking-normal">(opsional)</span>
                </span>
              </label>
              {!attachmentFile ? (
                <label className="group flex flex-col items-center justify-center w-full h-[104px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
                  <HiOutlineCloudUpload className="w-6 h-6 text-gray-300 group-hover:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">Klik untuk upload</span>
                  <span className="text-xs text-gray-300 mt-0.5">JPG, PNG, PDF — maks 10 MB</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                </label>
              ) : isImage ? (
                /* Image — thumbnail + hover overlay */
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-[104px]">
                  <img src={form.attachmentUrl} alt="attachment" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1.5 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-gray-50">
                      <HiOutlineZoomIn className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button type="button" onClick={removeFile}
                      className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-red-600">
                      <HiOutlineX className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ) : (
                /* PDF / non-image */
                <div className="flex items-center gap-3 px-4 py-3 h-[104px] bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <HiOutlinePaperClip className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-700 truncate">{attachmentFile.name}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
                    <button type="button" onClick={() => setShowPreview(true)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      <HiOutlineZoomIn className="w-3 h-3" /> Preview
                    </button>
                  </div>
                  <button onClick={removeFile} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-200 transition-colors flex-shrink-0">
                    <HiOutlineX className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => navigate("/time-off")}
            disabled={loading}
            className="flex-1 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm disabled:opacity-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {uploadingFile ? "Mengupload file…" : "Menyimpan…"}
              </>
            ) : (
              <><HiOutlineCheck className="w-4 h-4" /> Submit Request</>
            )}
          </button>
        </div>

      </div>
    </div>
    </>
  );
};

export default AddTimeOffPage;

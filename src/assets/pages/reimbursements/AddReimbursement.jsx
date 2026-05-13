import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlineCurrencyDollar, HiOutlinePaperClip,
  HiOutlineX, HiOutlineDocumentText, HiOutlineZoomIn
} from "react-icons/hi";
import { useReimbursement } from "../../../redux/hooks/useReimbursement";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import API from "../../../ApiService/api";

const chevronBg   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;
const selectStyle = { backgroundImage: chevronBg, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' };

const CATEGORIES = ["Transport", "Meals", "Accommodation", "Office Supplies", "Medical", "Training", "Entertainment", "Other"];
const ALLOWED    = ["image/jpeg", "image/png", "application/pdf"];
const MAX_MB     = 10;

const fmtRupiah = (val) => {
  const num = String(val).replace(/\D/g, "");
  return num ? new Intl.NumberFormat("id-ID").format(parseInt(num)) : "";
};

const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await API.post("/files/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data?.fileUrl || res.data.data?.url || res.data.data;
};

const fieldValidators = {
  title:       (v) => !v.trim() ? "Title is required" : v.trim().length < 3 ? "Minimum 3 characters" : null,
  expenseDate: (v) => !v ? "Expense date is required" : null,
  category:    (v) => !v ? "Category is required" : null,
  total:       (v) => !v ? "Total is required" : parseInt(v.replace(/\D/g, "")) <= 0 ? "Total must be greater than 0" : null,
  employeeId:  (v) => !v ? "Employee is required" : null,
};

// ==================== RECEIPT MODAL ====================
const ReceiptModal = ({ url, onClose }) => {
  const isImage = url && /\.(jpg|jpeg|png)(\?|$)/i.test(url);

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

  // For local object URLs (images), isImage check won't match the blob: prefix,
  // so we also check if url starts with "blob:"
  const showAsImage = isImage || (url && url.startsWith("blob:"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Receipt Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 min-h-0">
          {showAsImage ? (
            <img
              src={url}
              alt="Receipt"
              className="max-w-full max-h-full object-contain rounded-lg shadow"
            />
          ) : (
            <iframe
              src={url}
              title="Receipt PDF"
              className="w-full rounded-lg border border-gray-200 bg-white"
              style={{ height: "65vh" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const CreateReimbursement = () => {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const { createReimbursement }       = useReimbursement();
  const { employees, fetchEmployees } = useEmployee();

  const [formData, setFormData] = useState({
    title: "", expenseDate: "", category: "", total: "",
    employeeId: "", paidBy: "EMPLOYEE", notes: "",
  });
  const [errors,          setErrors]          = useState({});
  const [touched,         setTouched]         = useState({});
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [file,            setFile]            = useState(null);
  const [filePreview,     setFilePreview]     = useState(null);
  const [fileError,       setFileError]       = useState(null);
  const [dragOver,        setDragOver]        = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const validateField = (name, value) => fieldValidators[name]?.(value) ?? null;
  const validateAll   = () => {
    const errs = {};
    Object.keys(fieldValidators).forEach(name => {
      const err = validateField(name, formData[name]);
      if (err) errs[name] = err;
    });
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = name === "total" ? fmtRupiah(value) : value;
    setFormData(p => ({ ...p, [name]: next }));
    if (touched[name]) {
      const err = validateField(name, next);
      setErrors(p => ({ ...p, [name]: err || undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const err = validateField(name, value);
    setErrors(p => ({ ...p, [name]: err || undefined }));
  };

  // ── File ──────────────────────────────────────────────────────────────────
  const processFile = (f) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type))     { setFileError("Only JPG, PNG, or PDF allowed."); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(`Max file size is ${MAX_MB}MB.`);  return; }
    setFileError(null);
    setFile(f);
    // For images: object URL; for PDF: also create object URL so modal can iframe it
    setFilePreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null); setFilePreview(null); setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(fieldValidators).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    const errs = validateAll();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      let receiptFile = null;
      if (file) {
        setUploading(true);
        receiptFile = await uploadFile(file);
        setUploading(false);
      }

      await createReimbursement({
        title:       formData.title.trim(),
        expenseDate: formData.expenseDate,
        category:    formData.category,
        total:       parseInt(formData.total.replace(/\D/g, "")),
        employeeId:  parseInt(formData.employeeId),
        paidBy:      formData.paidBy,
        notes:       formData.notes.trim() || null,
        receiptFile: receiptFile,
      });

      navigate("/reimbursements", {
        state: { toast: { show: true, message: "Reimbursement submitted successfully.", type: "success" } }
      });
    } catch (err) {
      console.error(err);
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to submit reimbursement." });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  const busy            = isSubmitting || uploading;
  const isFilePdf       = file && file.type === "application/pdf";
  const activeEmployees = employees?.filter(e => e.status === "ACTIVE") || [];
  const inputCls  = (f) => `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors[f] ? "border-red-300 bg-red-50" : "border-gray-300"}`;
  const selectCls = (f) => `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white transition-colors ${errors[f] ? "border-red-300 bg-red-50" : "border-gray-300"}`;
  const ErrorMsg  = ({ field }) => errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;

  return (
    <>
      {showReceiptModal && filePreview && (
        <ReceiptModal url={filePreview} onClose={() => setShowReceiptModal(false)} />
      )}

      <div className="w-full px-4 md:px-6 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <button type="button" onClick={() => navigate("/reimbursements")} disabled={busy}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">New Reimbursement</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Status will be set to <span className="font-medium text-yellow-600">Submitted</span> automatically
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input type="text" name="title" value={formData.title}
                onChange={handleChange} onBlur={handleBlur} disabled={busy}
                placeholder="e.g., Business Trip to Surabaya"
                className={inputCls("title")} />
              <ErrorMsg field="title" />
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input type="date" name="expenseDate" value={formData.expenseDate}
                onChange={handleChange} onBlur={handleBlur} disabled={busy}
                className={inputCls("expenseDate")} />
              <ErrorMsg field="expenseDate" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select name="category" value={formData.category}
                onChange={handleChange} onBlur={handleBlur} disabled={busy}
                className={selectCls("category")} style={selectStyle}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ErrorMsg field="category" />
            </div>

            {/* Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total (IDR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                <input type="text" name="total" value={formData.total}
                  onChange={handleChange} onBlur={handleBlur} disabled={busy}
                  placeholder="0" className={`${inputCls("total")} pl-9`} />
              </div>
              <ErrorMsg field="total" />
            </div>

            {/* Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select name="employeeId" value={formData.employeeId}
                onChange={handleChange} onBlur={handleBlur} disabled={busy}
                className={selectCls("employeeId")} style={selectStyle}>
                <option value="">Select Employee</option>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}{e.employeeCode ? ` (${e.employeeCode})` : ""}</option>
                ))}
              </select>
              <ErrorMsg field="employeeId" />
            </div>

            {/* Paid By */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
              <div className="flex gap-3">
                {[
                  { value: "EMPLOYEE", label: "Employee", desc: "Employee paid first, to be reimbursed" },
                  { value: "COMPANY",  label: "Company",  desc: "Company paid directly" },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex-1 flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.paidBy === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input type="radio" name="paidBy" value={opt.value}
                      checked={formData.paidBy === opt.value} onChange={handleChange}
                      className="mt-0.5 accent-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange}
                disabled={busy} rows={3} placeholder="Additional notes or description…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none" />
            </div>

            {/* Receipt Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Receipt
                <span className="ml-1 text-xs text-gray-400 font-normal">(JPG, PNG, PDF · max 10MB)</span>
              </label>

              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver   ? "border-indigo-400 bg-indigo-50" :
                    fileError  ? "border-red-300 bg-red-50"       :
                                 "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}>
                  <HiOutlinePaperClip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Drop file here or <span className="text-indigo-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF up to 10MB</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Image thumbnail with preview click */}
                  {!isFilePdf && filePreview && (
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(true)}
                      className="block w-full relative group focus:outline-none"
                    >
                      <img
                        src={filePreview}
                        alt="preview"
                        className="w-full max-h-48 object-contain bg-gray-50 transition-opacity group-hover:opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <HiOutlineZoomIn className="w-4 h-4" /> Click to preview
                        </span>
                      </div>
                    </button>
                  )}

                  <div className="p-4 flex items-center gap-4 bg-gray-50">
                    {isFilePdf && (
                      <div className="w-16 h-16 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center flex-shrink-0">
                        <HiOutlineDocumentText className="w-8 h-8 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex items-center gap-3 mt-1">
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="text-xs text-indigo-600 hover:underline">Replace file</button>
                        {isFilePdf && (
                          <button type="button" onClick={() => setShowReceiptModal(true)}
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            <HiOutlineZoomIn className="w-3 h-3" /> Preview PDF
                          </button>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={removeFile}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                onChange={e => processFile(e.target.files[0])} />
              {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
            </div>

            {/* Status banner */}
            <div className="md:col-span-2 bg-yellow-50 rounded-lg px-4 py-3 border border-yellow-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                This reimbursement will be submitted with status{" "}
                <span className="font-semibold">Submitted</span> and will go through the approval workflow.
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => navigate("/reimbursements")} disabled={busy}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[160px] justify-center">
              {busy ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {uploading ? "Uploading…" : "Submitting…"}
                </>
              ) : "Submit Reimbursement"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateReimbursement;

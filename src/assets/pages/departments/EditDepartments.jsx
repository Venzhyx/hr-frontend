import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineOfficeBuilding, HiOutlineUser } from "react-icons/hi";
import { useDepartment } from "../../../redux/hooks/useDepartment";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import { useCompany } from "../../../redux/hooks/useCompany";

// ==================== HELPERS ====================
const baseCls     = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";
const errCls      = "border-red-300 bg-red-50";
const okCls       = "border-gray-300";
const chevronBg   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;
const selectStyle = { backgroundImage: chevronBg, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' };
const ErrorMsg    = ({ msg }) => msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

// Field-level validators
const fieldValidators = {
  departmentName: (value) => {
    if (!value.trim())           return "Department name is required";
    if (value.trim().length < 2) return "Minimum 2 characters";
    return null;
  },
  companyId: (value) => {
    if (!value) return "Company is required";
    return null;
  },
};

// ==================== COMPONENT ====================
const EditDepartment = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const { departments, updateDepartment, fetchDepartments, getDepartmentById } = useDepartment();
  const { employees, fetchEmployees } = useEmployee();
  const { companies, fetchCompanies } = useCompany();

  const [formData,     setFormData]     = useState({ departmentName: "", managerId: "", parentDepartmentId: "", companyId: "" });
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState({});
  const [touched,      setTouched]      = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!id) {
        setErrors({ submit: "Invalid department ID" });
        setLoading(false);
        return;
      }
      try {
        const res  = await getDepartmentById(id);
        const dept = res?.data ?? res;

        if (!dept?.departmentName) {
          console.error("Unexpected dept shape:", res);
          setErrors({ submit: "Department data could not be read. Check console." });
          return;
        }

        setFormData({
          departmentName:     dept.departmentName             || "",
          managerId:          dept.managerId          ? String(dept.managerId)          : "",
          parentDepartmentId: dept.parentDepartmentId ? String(dept.parentDepartmentId) : "",
          companyId:          dept.companyId          ? String(dept.companyId)          : "",
        });

        fetchEmployees();
        fetchDepartments();
        fetchCompanies();
      } catch (err) {
        console.error("Failed to load department:", err);
        setErrors({ submit: "Failed to load department data." });
      } finally {
        setLoading(false);
      }
    };

    if (id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateField = (name, value) => {
    const validator = fieldValidators[name];
    return validator ? validator(value) : null;
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(fieldValidators).forEach(name => {
      const err = validateField(name, formData[name]);
      if (err) newErrors[name] = err;
    });
    return newErrors;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  // onChange: validasi live hanya jika field sudah pernah di-touch/blur
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(p => ({ ...p, [name]: err || undefined }));
    }
  };

  // onBlur: tandai touched, langsung validasi
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err || undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tandai semua field agar error muncul kalau langsung submit tanpa touch
    const allTouched = Object.keys(fieldValidators).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const errs = validateAll();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      await updateDepartment({
        id:                 parseInt(id),
        departmentName:     formData.departmentName.trim(),
        managerId:          formData.managerId          ? parseInt(formData.managerId)          : null,
        parentDepartmentId: formData.parentDepartmentId ? parseInt(formData.parentDepartmentId) : null,
        companyId:          parseInt(formData.companyId),
      });
      await fetchDepartments();
      navigate("/departments", {
        state: { toast: { show: true, message: "Department updated successfully", type: "success" } }
      });
    } catch (err) {
      console.error("Update failed:", err);
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to update department." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeEmployees      = employees?.filter(e => e.status === "ACTIVE") || [];
  const availableParentDepts = departments?.filter(d => d.id !== parseInt(id)) || [];
  const selectedManager      = activeEmployees.find(e => e.id === parseInt(formData.managerId));
  const selectedCompany      = companies?.find(c => c.id === parseInt(formData.companyId));

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full px-4 md:px-6 py-6 flex justify-center items-center h-64">
        <div className="text-gray-400">Loading department data…</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 md:px-6 py-6">
      <div className="flex items-center space-x-4 mb-6">
        <button type="button" onClick={() => navigate("/departments")} disabled={isSubmitting}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Department</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Icon + title */}
          <div className="md:col-span-2 flex items-center space-x-4 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
              <HiOutlineOfficeBuilding className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Editing Department</p>
              <p className="text-lg font-semibold text-gray-800">{formData.departmentName || "—"}</p>
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <select name="companyId" value={formData.companyId}
              onChange={handleChange} onBlur={handleBlur}
              disabled={isSubmitting}
              className={`${baseCls} appearance-none bg-white ${errors.companyId ? errCls : okCls}`} style={selectStyle}>
              <option value="">Select Company</option>
              {companies?.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
            <ErrorMsg msg={errors.companyId} />
          </div>

          {/* Parent Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Department</label>
            <select name="parentDepartmentId" value={formData.parentDepartmentId}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`${baseCls} appearance-none bg-white ${okCls}`} style={selectStyle}>
              <option value="">None (Top Level)</option>
              {availableParentDepts.map(d => {
                const co = companies?.find(c => c.id === d.companyId);
                return <option key={d.id} value={d.id}>{d.departmentName}{co ? ` — ${co.companyName}` : ""}</option>;
              })}
            </select>
            <p className="mt-1 text-xs text-gray-400">Leave empty if top-level department</p>
          </div>

          {/* Department Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input type="text" name="departmentName" value={formData.departmentName}
              onChange={handleChange} onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="e.g., Marketing, Engineering, HR"
              className={`${baseCls} ${errors.departmentName ? errCls : okCls}`} />
            <ErrorMsg msg={errors.departmentName} />
          </div>

          {/* Manager */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Manager</label>
            <select name="managerId" value={formData.managerId}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`${baseCls} appearance-none bg-white ${okCls}`} style={selectStyle}>
              <option value="">No Manager (Optional)</option>
              {activeEmployees.length > 0
                ? activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}{e.jobTitle ? ` · ${e.jobTitle}` : ""}{e.employeeCode ? ` (${e.employeeCode})` : ""}
                    </option>
                  ))
                : <option value="" disabled>No active employees</option>
              }
            </select>
            <p className="mt-1 text-xs text-gray-400">Only active employees are listed</p>
          </div>

          {/* Company info card */}
          {selectedCompany && (
            <div className="md:col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                <HiOutlineOfficeBuilding className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Selected Company</p>
                <p className="text-sm font-semibold text-blue-900">{selectedCompany.companyName}</p>
              </div>
            </div>
          )}

          {/* Manager info card */}
          {selectedManager && (
            <div className="md:col-span-2 bg-green-50 rounded-lg p-4 border border-green-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                <HiOutlineUser className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-green-500 font-medium">Selected Manager</p>
                <p className="text-sm font-semibold text-green-900">{selectedManager.name}</p>
                <div className="flex gap-2 mt-1">
                  {selectedManager.jobTitle && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{selectedManager.jobTitle}</span>
                  )}
                  {selectedManager.employeeCode && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">ID: {selectedManager.employeeCode}</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button type="button" onClick={() => navigate("/departments")} disabled={isSubmitting}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[140px] justify-center">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating…
              </>
            ) : "Update Department"}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400 text-right">Department ID: {id}</p>
      </form>
    </div>
  );
};

export default EditDepartment;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useDepartment } from "../../../redux/hooks/useDepartment";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import { useCompany } from "../../../redux/hooks/useCompany";

const chevronBg   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;
const selectStyle = { backgroundImage: chevronBg, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' };

// Field-level validators
const fieldValidators = {
  departmentName: (value) => {
    if (!value.trim())           return "Department name is required";
    if (value.trim().length < 2) return "Department name must be at least 2 characters";
    return null;
  },
  companyId: (value) => {
    if (!value) return "Company is required";
    return null;
  },
};

const AddDepartment = () => {
  const navigate = useNavigate();
  const { createDepartment, departments, fetchDepartments } = useDepartment();
  const { employees, fetchEmployees } = useEmployee();
  const { companies, fetchCompanies } = useCompany();

  const [formData, setFormData] = useState({
    departmentName: "",
    managerId: "",
    parentDepartmentId: "",
    companyId: ""
  });

  const [errors,       setErrors]       = useState({});
  const [touched,      setTouched]      = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // onChange: validasi live hanya jika field sudah pernah di-touch/blur
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err || undefined }));
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
    // Tandai semua field agar error muncul
    const allTouched = Object.keys(fieldValidators).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createDepartment({
        departmentName:     formData.departmentName.trim(),
        managerId:          formData.managerId          ? parseInt(formData.managerId)          : null,
        parentDepartmentId: formData.parentDepartmentId ? parseInt(formData.parentDepartmentId) : null,
        companyId:          parseInt(formData.companyId),
      });
      navigate("/departments");
    } catch (error) {
      console.error("Failed to create department:", error);
      setErrors({ submit: error.response?.data?.message || "Failed to create department. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeEmployees = employees?.filter(emp => emp.status === "ACTIVE") || [];

  const inputCls  = (field) => `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors[field] ? "border-red-300 bg-red-50" : "border-gray-300"}`;
  const selectCls = (field) => `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white ${errors[field] ? "border-red-300 bg-red-50" : "border-gray-300"}`;
  const ErrorMsg  = ({ field }) => errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <div className="flex items-center space-x-4 mb-6">
        <button type="button" onClick={() => navigate("/departments")} disabled={isSubmitting}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add New Department</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <select name="companyId" value={formData.companyId}
              onChange={handleChange} onBlur={handleBlur}
              disabled={isSubmitting}
              className={selectCls("companyId")} style={selectStyle}>
              <option value="">Select Company</option>
              {companies?.map(company => (
                <option key={company.id} value={company.id}>
                  {company.companyName} (ID: {company.companyId})
                </option>
              ))}
            </select>
            <ErrorMsg field="companyId" />
          </div>

          {/* Parent Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Department
            </label>
            <select name="parentDepartmentId" value={formData.parentDepartmentId}
              onChange={handleChange}
              disabled={isSubmitting}
              className={selectCls("parentDepartmentId")} style={selectStyle}>
              <option value="">None (Top Level Department)</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}{dept.companyName ? ` - ${dept.companyName}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Select parent department if this is a sub-department</p>
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
              className={inputCls("departmentName")} />
            <ErrorMsg field="departmentName" />
          </div>

          {/* Manager */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select name="managerId" value={formData.managerId}
              onChange={handleChange}
              disabled={isSubmitting}
              className={selectCls("managerId")} style={selectStyle}>
              <option value="">Select Manager (Optional)</option>
              {activeEmployees.length > 0
                ? activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}{emp.jobTitle ? ` (${emp.jobTitle})` : ""}{emp.employeeCode ? ` - ${emp.employeeCode}` : ""}
                    </option>
                  ))
                : <option value="" disabled>No active employees</option>
              }
            </select>
            <p className="mt-1 text-xs text-gray-500">Select an employee to be the department manager</p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button type="button" onClick={() => navigate("/departments")} disabled={isSubmitting}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[160px] justify-center">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDepartment;

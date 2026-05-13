import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineArrowLeft, 
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
  HiOutlineBuildingOffice,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineHome,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLink,
  HiOutlineIdentification,
  HiOutlineCreditCard
} from 'react-icons/hi2';
import API from "../../../ApiService/api";
import LocationPicker from '../../components/LocationPicker'; // ← komponen baru

// ==================== FIELD VALIDATORS ====================
const fieldValidators = {
  companyName:      (v) => !v.trim() ? 'Company name is required' : null,
  formattedAddress: (v) => !v || !v.trim() ? 'Address is required (pick from map)' : null,
  country:          (v) => !v.trim() ? 'Country is required' : null,
  city:             (v) => !v.trim() ? 'City is required' : null,
  zip:              (v) => !v.trim() ? 'ZIP code is required' : null,
  companyId:        (v) => !v.trim() ? 'Company ID is required' : null,
  phone:            (v) => !v.trim() ? 'Phone number is required' : null,
  email:            (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(v)) return 'Email is invalid';
    return null;
  },
};

// ==================== SUB COMPONENTS ====================
const Toast = ({ toast, onClose }) => {
  if (!toast.show) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 animate-slideIn ${
        toast.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
      }`}
      style={{ minWidth: '320px' }}
    >
      <div className={`mr-3 flex-shrink-0 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
        {toast.type === 'success' ? <HiOutlineCheckCircle className="w-6 h-6" /> : <HiOutlineXCircle className="w-6 h-6" />}
      </div>
      <div className="flex-1 mr-2">
        <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</p>
      </div>
      <button onClick={onClose} className={`flex-shrink-0 ${toast.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
        <HiOutlineXMark className="w-5 h-5" />
      </button>
    </div>
  );
};

const CompanyInfoCard = ({ formData, handleChange, handleBlur, logoPreview, handleLogoChange, errors }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Company Name *"
            className={`text-2xl font-bold text-gray-800 w-full mb-1 px-2 py-1 border-b focus:outline-none ${
              errors.companyName ? 'border-red-400' : 'border-transparent focus:border-indigo-300'
            }`}
          />
          {errors.companyName && <p className="text-red-500 text-xs ml-2 mt-0.5">{errors.companyName}</p>}
        </div>
        <div className="flex-shrink-0 ml-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-4 border-indigo-100 shadow-md bg-gray-50">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HiOutlineBuildingOffice className="w-10 h-10 text-indigo-300" />
                </div>
              )}
            </div>
            <label htmlFor="logo-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-all">
              <HiOutlineArrowUpTray className="w-3 h-3" />
            </label>
            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Logo (max 2MB)</p>
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const AddCompany = () => {
  const navigate = useNavigate();

  const [logo,         setLogo]         = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading,  setIsUploading]  = useState(false);
  const [errors,       setErrors]       = useState({});
  const [touched,      setTouched]      = useState({});
  const [toast,        setToast]        = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    companyName:      '',
    formattedAddress: '', // dari LocationPicker
    latitude:         null,
    longitude:        null,
    country:          '',
    city:             '',
    zip:              '',
    companyId:        '',
    phone:            '',
    email:            '',
    website:          ''
  });

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateField = (name, value) => fieldValidators[name]?.(value) ?? null;

  const validateAll = () => {
    const errs = {};
    Object.keys(fieldValidators).forEach(name => {
      const err = validateField(name, formData[name] ?? '');
      if (err) errs[name] = err;
    });
    return errs;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err || undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err || undefined }));
  };

  // ── LocationPicker callback ───────────────────────────────────────────────
  const handleLocationChange = (loc) => {
    setFormData(prev => ({
      ...prev,
      formattedAddress: loc.formattedAddress || '',
      latitude:         loc.latitude,
      longitude:        loc.longitude,
      // auto-fill city, country, zip kalau kosong
      city:    prev.city    || loc.city    || '',
      country: prev.country || loc.country || '',
      zip:     prev.zip     || loc.zip     || '',
    }));
    // clear address error
    if (loc.formattedAddress) {
      setErrors(prev => ({ ...prev, formattedAddress: undefined }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setToast({ show: true, message: 'Logo size must be less than 2MB', type: 'error' }); return; }
    if (!file.type.startsWith('image/')) { setToast({ show: true, message: 'File must be an image', type: 'error' }); return; }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await API.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data.data?.fileUrl || res.data.data;
    } catch (err) { console.error("File upload failed:", err); throw err; }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(fieldValidators).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setToast({ show: true, message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const logoUrl = logo ? await uploadFile(logo) : null;
      const payload = {
        companyName:      formData.companyName,
        formattedAddress: formData.formattedAddress,
        latitude:         formData.latitude,
        longitude:        formData.longitude,
        country:          formData.country,
        city:             formData.city,
        zip:              formData.zip,
        companyId:        formData.companyId,
        phone:            formData.phone,
        email:            formData.email,
        website:          formData.website || null,
        logo:             logoUrl
      };
      await API.post("/companies", payload);
      setToast({ show: true, message: `Company ${formData.companyName} has been successfully created`, type: 'success' });
      setTimeout(() => navigate('/companies'), 1500);
    } catch (error) {
      console.error('Create company failed:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setToast({ show: true, message: error.response.data.message || 'Validation error', type: 'error' });
      } else {
        setToast({ show: true, message: error.response?.data?.message || 'Failed to create company', type: 'error' });
      }
    } finally { setIsSubmitting(false); }
  };

  const closeToast = () => setToast(prev => ({ ...prev, show: false }));

  const fieldBorderCls = (name) => errors[name] ? 'border-red-400' : 'border-gray-300';
  const FieldError = ({ name }) => errors[name] ? <p className="mt-1 text-xs text-red-500">{errors[name]}</p> : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full px-4 md:px-6 py-6 bg-gray-50 min-h-screen">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button type="button" onClick={() => navigate('/companies')} disabled={isSubmitting || isUploading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white shadow-sm">
          <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add New Company</h1>
      </div>

      {/* Company Name + Logo */}
      <CompanyInfoCard
        formData={formData} handleChange={handleChange} handleBlur={handleBlur}
        logoPreview={logoPreview} handleLogoChange={handleLogoChange} errors={errors}
      />

      {/* General Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <div className="flex space-x-6">
            <div className="py-3 px-1 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600">General Information</div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-md font-medium text-gray-700 mb-4 pb-1 border-b border-gray-200 flex items-center">
            <HiOutlineHome className="w-5 h-5 mr-2 text-indigo-500" />
            General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Location Picker (ganti textarea address) ── */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / Location *
              </label>
              <LocationPicker
                value={{
                  latitude:         formData.latitude,
                  longitude:        formData.longitude,
                  formattedAddress: formData.formattedAddress,
                }}
                onChange={handleLocationChange}
                error={errors.formattedAddress}
              />
            </div>

            {/* Country — auto-filled dari map, bisa di-edit manual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('country')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineGlobeAlt className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="country" value={formData.country} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., Indonesia" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="country" />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('city')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineMapPin className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., Bandung" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="city" />
            </div>

            {/* ZIP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('zip')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineIdentification className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="zip" value={formData.zip} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., 40123" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="zip" />
            </div>

            {/* Company ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company ID *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('companyId')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineCreditCard className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="companyId" value={formData.companyId} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., VC-001" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="companyId" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('phone')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlinePhone className="w-5 h-5 text-gray-400" /></div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., 021-1234567" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="phone" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden ${fieldBorderCls('email')}`}>
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineEnvelope className="w-5 h-5 text-gray-400" /></div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g., info@company.com" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
              <FieldError name="email" />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden">
                <div className="px-3 bg-gray-50 py-2 border-r border-gray-300"><HiOutlineLink className="w-5 h-5 text-gray-400" /></div>
                <input type="url" name="website" value={formData.website} onChange={handleChange}
                  placeholder="e.g., https://company.com" className="flex-1 px-3 py-2 focus:outline-none" />
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/companies')} disabled={isSubmitting || isUploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || isUploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {isSubmitting || isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isUploading ? 'Uploading...' : 'Creating...'}
              </>
            ) : 'Create Company'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddCompany;

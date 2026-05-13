import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLink,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePhoto,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineClock
} from 'react-icons/hi2';
import API from "../../../ApiService/api";

// ==================== SUB COMPONENTS ====================
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
    <p className="text-sm text-gray-500">Loading company details...</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="bg-red-100 rounded-full p-3 mb-4">
      <HiOutlineExclamationCircle className="w-8 h-8 text-red-600" />
    </div>
    <p className="text-sm text-gray-700 mb-2">{message || 'Failed to load company data'}</p>
    <button 
      onClick={onRetry}
      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
    >
      Try again
    </button>
  </div>
);

const InfoRow = ({ label, value, icon: Icon, colSpan = 1 }) => (
  <div className={`${colSpan > 1 ? `sm:col-span-${colSpan}` : ''}`}>
    <div className="flex items-start space-x-3">
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value || '-'}</p>
      </div>
    </div>
  </div>
);

const DetailSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        {Icon && <Icon className="w-5 h-5 mr-2 text-indigo-600" />}
        {title}
      </h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const CompanyDetailModal = ({ isOpen, onClose, companyId }) => {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch company data when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      fetchCompanyDetail();
    }
  }, [isOpen, companyId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCompany(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchCompanyDetail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await API.get(`/companies/${companyId}`);
      
      if (response.data.success) {
        setCompany(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load company data');
      }
    } catch (err) {
      console.error('Fetch company detail failed:', err);
      setError(err.response?.data?.message || 'Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle edit navigation
  const handleEdit = () => {
    onClose();
    navigate(`/companies/edit/${companyId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto py-10"
      onClick={handleOverlayClick}
    >
      {/* Modal Content */}
      <div 
        className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 rounded-lg p-2">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Company Details</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <HiOutlinePencil className="w-5 h-5" />
              <span>Edit</span>
            </button>
            <button 
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchCompanyDetail} />
          ) : company ? (
            <div className="space-y-6">
              {/* Left Column - Logo & Quick Info */}
              <div className="grid grid-cols-12 gap-6">
                {/* Logo Section */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                    <div className="flex flex-col items-center">
                      {/* Logo */}
                      <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-indigo-100 shadow-md bg-white mb-4">
                        {company.logo ? (
                          <img 
                            src={company.logo} 
                            alt={company.companyName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full bg-indigo-50 flex items-center justify-center">
                                  <svg class="w-16 h-16 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                  </svg>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                            <HiOutlineBuildingOffice2 className="w-16 h-16 text-indigo-300" />
                          </div>
                        )}
                      </div>

                      {/* Company Name */}
                      <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                        {company.companyName}
                      </h2>
                      <p className="text-sm text-gray-500">ID: {company.companyId || '-'}</p>

                      {/* Quick Stats */}
                      <div className="w-full mt-6 pt-6 border-t border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-600">
                            <HiOutlineEnvelope className="w-5 h-5 mr-3 text-gray-400" />
                            <span className="text-sm truncate">{company.email || '-'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <HiOutlinePhone className="w-5 h-5 mr-3 text-gray-400" />
                            <span className="text-sm">{company.phone || '-'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <HiOutlineMapPin className="w-5 h-5 mr-3 text-gray-400" />
                            <span className="text-sm truncate">{company.city || company.country || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  {/* Basic Information */}
                  <DetailSection title="Basic Information" icon={HiOutlineBuildingOffice2}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InfoRow 
                        label="Company ID" 
                        value={company.companyId} 
                        icon={HiOutlineTag}
                      />
                      <InfoRow 
                        label="Company Name" 
                        value={company.companyName} 
                        icon={HiOutlineBuildingOffice2}
                      />
                      <InfoRow 
                        label="Email" 
                        value={company.email} 
                        icon={HiOutlineEnvelope}
                      />
                      <InfoRow 
                        label="Phone" 
                        value={company.phone} 
                        icon={HiOutlinePhone}
                      />
                      <InfoRow 
                        label="Website" 
                        value={company.website} 
                        icon={HiOutlineLink}
                        colSpan={2}
                      />
                    </div>
                  </DetailSection>

                  {/* Address Information */}
                  <DetailSection title="Address Information" icon={HiOutlineMapPin}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <InfoRow 
                          label="Street Address" 
                          value={company.address} 
                          icon={HiOutlineMapPin}
                        />
                      </div>
                      <InfoRow 
                        label="City" 
                        value={company.city} 
                        icon={HiOutlineBuildingOffice2}
                      />
                      <InfoRow 
                        label="ZIP Code" 
                        value={company.zip} 
                        icon={HiOutlineTag}
                      />
                      <InfoRow 
                        label="Country" 
                        value={company.country} 
                        icon={HiOutlineGlobeAlt}
                      />
                    </div>
                  </DetailSection>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailModal;
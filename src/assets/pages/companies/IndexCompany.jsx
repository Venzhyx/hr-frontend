import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineEye,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMapPin
} from 'react-icons/hi2';
import {
  HiOutlineSortAscending,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineExclamation,
  HiOutlineFilter,
  HiOutlineSortDescending
} from "react-icons/hi";
import { useCompany } from '../../../redux/hooks/useCompany';
import CompanyDetailModal from './DetailCompany';

const CompaniesList = () => {
  const navigate = useNavigate();
  const { companies, loading, deleteCompany, fetchCompanies } = useCompany();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [sortConfig,       setSortConfig]        = useState({ field: 'companyName', direction: 'asc' });
  const [showFilterPanel,  setShowFilterPanel]   = useState(false);
  const [currentPage,      setCurrentPage]       = useState(1);
  const itemsPerPage = 10;

  const [showDeleteModal,  setShowDeleteModal]   = useState(false);
  const [selectedCompany,  setSelectedCompany]   = useState(null);
  const [deleteError,      setDeleteError]       = useState('');
  const [isDeleting,       setIsDeleting]        = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showDetailModal,   setShowDetailModal]   = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchCompanies(); }, []);

  // Auto hide toast
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  // Click outside filter panel
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.filter-panel-container')) setShowFilterPanel(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Filter + Sort (useMemo, konsisten dengan EmployeesList & DepartmentsList) ──
  const sortedCompanies = useMemo(() => {
    let filtered = (companies ?? []).filter(c => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        c.companyName?.toLowerCase().includes(s) ||
        (c.formattedAddress || c.address)?.toLowerCase().includes(s)
      );
    });

    return [...filtered].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sortConfig.field === 'companyName') {
        aVal = (a.companyName || '').toLowerCase();
        bVal = (b.companyName || '').toLowerCase();
      } else if (sortConfig.field === 'address') {
        aVal = (a.formattedAddress || a.address || '').toLowerCase();
        bVal = (b.formattedAddress || b.address || '').toLowerCase();
      } else {
        aVal = (a[sortConfig.field] || '').toLowerCase();
        bVal = (b[sortConfig.field] || '').toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [companies, searchTerm, sortConfig]);

  // Reset ke halaman 1 kalau filter/sort berubah
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalElements   = sortedCompanies.length;
  const totalPages      = Math.ceil(totalElements / itemsPerPage);
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const currentCompanies = sortedCompanies.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (field === 'logo') return;
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ field }) => {
    if (field === 'logo') return null;
    if (sortConfig.field !== field)
      return <HiOutlineSortAscending className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <HiOutlineSortAscending  className="w-3 h-3 ml-1 text-indigo-600" />
      : <HiOutlineSortDescending className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (company) => {
    setSelectedCompany(company);
    setDeleteError('');
    setShowDeleteModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleConfirmDelete = async () => {
    if (!selectedCompany) return;
    setIsDeleting(true);
    try {
      await deleteCompany(selectedCompany.id).unwrap();
      setToast({ show: true, message: `Company ${selectedCompany.companyName} has been successfully deleted`, type: 'success' });
      setShowDeleteModal(false);
      setSelectedCompany(null);
      setDeleteError('');
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Delete failed';
      setDeleteError(msg);
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setIsDeleting(false);
      document.body.style.overflow = 'unset';
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedCompany(null);
    setDeleteError('');
    document.body.style.overflow = 'unset';
  };

  const isFilterActive = searchTerm !== '';

  if (loading) {
    return (
      <div className="w-full px-4 md:px-6 py-6 flex justify-center items-center h-64">
        <div className="text-gray-400">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-6">

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 animate-slideIn ${
            toast.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
          }`}
          style={{ minWidth: '320px' }}
        >
          <div className={`mr-3 flex-shrink-0 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {toast.type === 'success'
              ? <HiOutlineCheckCircle className="w-6 h-6" />
              : <HiOutlineXCircle    className="w-6 h-6" />}
          </div>
          <div className="flex-1 mr-2">
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {toast.message}
            </p>
          </div>
          <button onClick={() => setToast(p => ({ ...p, show: false }))}
            className={`flex-shrink-0 ${toast.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Companies</h1>
          <p className="text-gray-500 mt-1">Manage your companies and branches</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 flex items-center shadow-sm">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none text-base"
          />
        </div>
        <div className="flex items-center space-x-2 px-2">
          <div className="relative filter-panel-container">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className={`p-2 rounded-lg transition-colors ${isFilterActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <HiOutlineFilter className="w-5 h-5" />
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Filter Companies</h4>
                  <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Active Search</label>
                  {isFilterActive
                    ? <div className="p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">"{searchTerm}"</div>
                    : <p className="text-xs text-gray-400">No active search</p>}
                </div>
                {isFilterActive && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { setSearchTerm(''); setShowFilterPanel(false); }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <HiOutlineRefresh className="w-4 h-4" /><span>Clear Search</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Companies List</h2>
            <p className="text-sm text-gray-500 mt-1">{totalElements} total companies</p>
          </div>
          <Link to="/companies/add"
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#4361EE] text-white rounded-lg hover:bg-[#3651d4] transition-colors text-base shadow-sm">
            <HiOutlinePlus className="w-5 h-5" /><span>Add Company</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  LOGO
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center">COMPANY NAME<SortIcon field="companyName" /></div>
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort('address')}
                >
                  <div className="flex items-center">ADDRESS<SortIcon field="address" /></div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                      {company.logo ? (
                        <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                      ) : (
                        <HiOutlineOfficeBuilding className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-base font-medium text-gray-900">{company.companyName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start text-base text-gray-600">
                      <HiOutlineMapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{company.formattedAddress || company.address || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setSelectedCompanyId(company.id); setShowDetailModal(true); }}
                        className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors">
                        <HiOutlineEye className="w-5 h-5" />
                      </button>
                      <button onClick={() => navigate(`/companies/edit/${company.id}`)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors">
                        <HiOutlinePencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteClick(company)} disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-40">
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {currentCompanies.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                      <HiOutlineOfficeBuilding className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-base">No companies found</p>
                      <p className="text-sm text-gray-300 mt-1">Try adjusting your search or add a new company</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — sama persis dengan EmployeesList & DepartmentsList */}
        {totalElements > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, totalElements)}</span> of{' '}
              <span className="font-medium">{totalElements}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? 'bg-[#4361EE] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancelDelete}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <HiOutlineExclamation className="w-5 h-5 text-red-500 mr-2" />Confirm Delete
              </h3>
              <button onClick={handleCancelDelete} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <HiOutlineTrash className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-700">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900">{selectedCompany.companyName}</span>?
                </p>
              </div>
              {deleteError ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-start">
                    <HiOutlineExclamation className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />{deleteError}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <span className="font-medium">Warning:</span> This action cannot be undone. All data related to this company will be permanently removed.
                </p>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={handleCancelDelete} disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={isDeleting || !!deleteError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <><HiOutlineTrash className="w-4 h-4 mr-2" />Delete Company</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      <CompanyDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        companyId={selectedCompanyId}
      />
    </div>
  );
};

export default CompaniesList;

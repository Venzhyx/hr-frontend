import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  HiOutlineXMark,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import { useDepartment } from '../../../redux/hooks/useDepartment';
import { useEmployee } from '../../../redux/hooks/useEmployee';
import { useCompany } from '../../../redux/hooks/useCompany';

// ==================== ORG TREE ====================
// Exact Odoo style: plain text rows, L-shape connector, count badge right
// parent (normal) → self (bold) → children (normal, indented)

const OrgTreeRow = ({ name, isSelf, indent, isLastChild, hasChildren, memberCount, onClick }) => {
  // indent=0: no connector, indent=1: one L, indent=2: two levels
  return (
    <div
      onClick={!isSelf ? onClick : undefined}
      className={`flex items-center justify-between py-[5px] ${!isSelf ? 'cursor-pointer group' : ''}`}
    >
      <div className="flex items-center min-w-0 flex-1">
        {/* Level 1 connector (for self when has parent, or for children) */}
        {indent >= 1 && (
          <div className="relative flex-shrink-0 mr-0" style={{ width: 16, alignSelf: 'stretch' }}>
            {/* vertical line — full height except last child cuts at mid */}
            <div
              className="absolute left-0 w-px bg-gray-300"
              style={{
                top: 0,
                bottom: isLastChild ? '50%' : 0,
              }}
            />
            {/* horizontal stub */}
            <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300" />
          </div>
        )}

        {/* Level 2 connector (for children when parent exists) */}
        {indent >= 2 && (
          <div className="relative flex-shrink-0" style={{ width: 16, alignSelf: 'stretch' }}>
            <div
              className="absolute left-0 w-px bg-gray-300"
              style={{
                top: 0,
                bottom: isLastChild ? '50%' : 0,
              }}
            />
            <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300" />
          </div>
        )}

        <span
          className={`text-sm truncate ${
            isSelf
              ? 'font-bold text-gray-900'
              : 'text-gray-600 group-hover:text-indigo-600 transition-colors'
          }`}
        >
          {name}
        </span>
      </div>

      {/* Badge */}
      <span className="ml-3 flex-shrink-0 min-w-[1.4rem] h-5 px-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center">
        {memberCount}
      </span>
    </div>
  );
};

const SimpleOrgTree = ({ dept, allDepts, employees, onNavigate }) => {
  if (!dept) return null;

  const parent   = allDepts.find(d => d.id === dept.parentDepartmentId) ?? null;
  const children = allDepts.filter(d => d.parentDepartmentId === dept.id);
  const count    = (dId) => employees?.filter(e => e.departmentId === dId)?.length ?? 0;

  return (
    <div>
      {/* Parent row — indent 0, no connector */}
      {parent && (
        <OrgTreeRow
          name={parent.departmentName}
          isSelf={false}
          indent={0}
          isLastChild={false}
          memberCount={count(parent.id)}
          onClick={() => onNavigate(parent.id)}
        />
      )}

      {/* Self row — indent 1 if has parent, else 0 */}
      <OrgTreeRow
        name={dept.departmentName}
        isSelf={true}
        indent={parent ? 1 : 0}
        isLastChild={children.length === 0}
        hasChildren={children.length > 0}
        memberCount={count(dept.id)}
        onClick={null}
      />

      {/* Children rows — indent 2 if has parent, else 1 */}
      {children.map((child, i) => (
        <OrgTreeRow
          key={child.id}
          name={child.departmentName}
          isSelf={false}
          indent={parent ? 2 : 1}
          isLastChild={i === children.length - 1}
          memberCount={count(child.id)}
          onClick={() => onNavigate(child.id)}
        />
      ))}
    </div>
  );
};

// ==================== MAIN MODAL ====================

const DepartmentDetailModal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { deleteDepartment, departments } = useDepartment();
  const { employees, fetchEmployees } = useEmployee();
  const { companies, fetchCompanies } = useCompany();
  
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeesInDepartment, setEmployeesInDepartment] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || departments.length === 0) return;
    const dept = departments.find(d => d.id === Number(id));
    setDepartment(dept);
    setLoading(false);
  }, [id, departments]);

  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (department?.id && employees.length > 0) {
      const filtered = employees.filter(emp => emp.departmentId === department.id);
      setEmployeesInDepartment(filtered);
    }
  }, [department, employees]);

  const handleClose = () => navigate('/departments');
  const handleEdit  = () => navigate(`/departments/edit/${id}`);
  const handleNavTo = (targetId) => navigate(`/departments/detail/${targetId}`);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteDepartment(department.id).unwrap();
      setShowDeleteModal(false);
      document.body.style.overflow = 'unset';
      navigate('/departments');
    } catch (error) {
      console.error('Error deleting department:', error);
      setShowDeleteModal(false);
      document.body.style.overflow = 'unset';
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    document.body.style.overflow = 'unset';
  };

  const getManager = () => {
    if (!department?.managerId) return null;
    return employees.find(emp => emp.id === department.managerId);
  };

  const getCompany = () => {
    if (!department?.companyId) return null;
    return companies.find(comp => comp.id === department.companyId);
  };

  const getParentDepartment = () => {
    if (!department?.parentDepartmentId) return null;
    return departments.find(dept => dept.id === department.parentDepartmentId);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl max-w-md w-full mx-4 p-8 shadow-2xl text-center">
          <HiOutlineBuildingOffice2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Department Not Found</h3>
          <p className="text-gray-600 mb-6">The department you're looking for doesn't exist or has been deleted.</p>
          <button onClick={handleClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  const activeEmployees  = employeesInDepartment.filter(emp => emp.status === 'ACTIVE').length;
  const manager          = getManager();
  const company          = getCompany();
  const parentDepartment = getParentDepartment();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto py-10"
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center space-x-3">
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Department Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={deleting}
              >
                <HiOutlinePencil className="w-5 h-5" />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDeleteClick}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={deleting}
              >
                <HiOutlineTrash className="w-5 h-5" />
                <span>Delete</span>
              </button>
              <button onClick={handleClose} className="ml-2 text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">

            {/* Title + Org Tree */}
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{department.departmentName}</h1>
                <p className="text-sm text-gray-500 mt-1">Department ID: {department.id}</p>
              </div>

              {/* Org Tree panel */}
              <div className="flex-shrink-0 w-64 bg-gray-50 rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Department Organization
                </p>
                <SimpleOrgTree
                  dept={department}
                  allDepts={departments || []}
                  employees={employees || []}
                  onNavigate={handleNavTo}
                />
              </div>
            </div>

            {/* Company & Parent Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-7 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Company</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {company?.companyName || 'No Company Assigned'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center">
                    <HiOutlineBuildingOffice2 className="w-7 h-7 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-7 border border-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">Parent Department</p>
                    <p className="text-lg font-semibold text-amber-900">
                      {parentDepartment?.departmentName || department.parentDepartmentName || '-'}
                    </p>
                    {parentDepartment && (
                      <p className="text-xs text-amber-500 mt-1">
                        {parentDepartment.jobTitle || 'Department'}
                      </p>
                    )}
                  </div>
                  <div className="w-14 h-14 bg-amber-200 rounded-xl flex items-center justify-center">
                    <HiOutlineBuildingOffice2 className="w-7 h-7 text-amber-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Manager & Total Members Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-indigo-50 rounded-xl p-7 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Manager</p>
                    <div className="flex items-center mt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-200 mr-3">
                        {manager?.photo ? (
                          <img src={manager.photo} alt={manager.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                            {manager?.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-indigo-900">
                          {manager?.name || 'No Manager Assigned'}
                        </p>
                        {manager && (
                          <p className="text-xs text-indigo-500">{manager.jobTitle || 'Employee'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiOutlineUser className="w-7 h-7 text-indigo-700" />
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-7 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Members</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{employeesInDepartment.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center">
                    <HiOutlineUsers className="w-7 h-7 text-purple-700" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-purple-500">
                  {activeEmployees} active, {employeesInDepartment.length - activeEmployees} inactive
                </p>
              </div>
            </div>

            {/* Employees List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <HiOutlineUsers className="w-5 h-5 mr-2 text-indigo-600" />
                  Department Members
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {employeesInDepartment.length} employees in this department
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeesInDepartment.length > 0 ? (
                      employeesInDepartment.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm mr-3">
                                {emp.photo ? (
                                  <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                                    {emp.name?.split(' ').map(n => n[0]).join('') || 'NA'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                                {emp.employeeCode && (
                                  <p className="text-xs text-gray-500">{emp.employeeCode}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                            {emp.jobTitle || '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {emp.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                            {emp.workEmail || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-gray-400">
                          <HiOutlineUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-base">No employees in this department</p>
                          <p className="text-sm text-gray-300 mt-1">
                            Add employees to this department to see them here
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <HiOutlineTrash className="w-6 h-6 text-red-500 mr-2" />
              Delete Department
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{department.departmentName}</span>? 
              This action cannot be undone.
            </p>
            {employeesInDepartment.length > 0 && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700 flex items-center">
                  <HiOutlineExclamationCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  This department has <span className="font-semibold">{employeesInDepartment.length}</span> employee(s). 
                  Deleting this department will affect them.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:bg-red-400 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                <HiOutlineTrash className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DepartmentDetailModal;

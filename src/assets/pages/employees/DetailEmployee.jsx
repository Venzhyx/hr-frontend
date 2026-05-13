import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineX, HiOutlinePencil, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar,
  HiOutlineUser, HiOutlineBriefcase, HiOutlineIdentification, HiOutlineHome,
  HiOutlineHeart, HiOutlineDocument, HiOutlineOfficeBuilding, HiOutlineGlobe,
  HiOutlineAcademicCap, HiOutlineUsers, HiOutlineShieldCheck, HiOutlineUserGroup,
  HiOutlinePhotograph, HiOutlineEye,
} from 'react-icons/hi';
import { useEmployee } from '../../../redux/hooks/useEmployee';
import { useDepartment } from '../../../redux/hooks/useDepartment';
import { useCompany } from '../../../redux/hooks/useCompany';
import { DetailDocCard, DetailMultiDocGrid, FilePreviewModal } from '../../components/FileComponents';

const EmployeeDetailModal = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const { fetchEmployeeById, selectedEmployee, loading, employees } = useEmployee();
  const { departments, fetchDepartments } = useDepartment();
  const { companies,   fetchCompanies   } = useCompany();

  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => { if (id) fetchEmployeeById(parseInt(id)); }, [id]);
  useEffect(() => { fetchDepartments(); fetchCompanies(); }, []);
  useEffect(() => { document.body.style.overflow='hidden'; return () => { document.body.style.overflow='unset'; }; }, []);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}) : 'N/A';
  const fmtCurrency = v => v!=null ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(v) : 'N/A';
  const getCompany  = id => companies?.find(c=>c.id===id)?.companyName    || 'N/A';
  const getDept     = id => departments?.find(d=>d.id===id)?.departmentName || 'N/A';
  const getEmpName  = id => employees?.find(e=>e.id===id)?.name             || 'N/A';

  if (loading || !selectedEmployee || selectedEmployee.id !== parseInt(id)) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"/>
          <p className="text-gray-600">Loading employee details…</p>
        </div>
      </div>
    );
  }

  const e = selectedEmployee;
  const initials = e.name?.split(' ').map(n=>n[0]).join('').slice(0,2) || '??';

  // ── Info row helper ──────────────────────────────────────────────────────────
  const Row = ({ label, value }) => (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || 'N/A'}</p>
    </div>
  );

  // ── Section card ─────────────────────────────────────────────────────────────
  const Section = ({ icon: Icon, title, color='text-indigo-600', children }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
        <Icon className={`w-5 h-5 mr-2 ${color}`}/> {title}
      </h3>
      {children}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto py-10"
        onClick={() => navigate('/employees')}>
        <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl relative"
          onClick={ev => ev.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
            <div className="flex items-center space-x-2">
              <button onClick={() => navigate(`/employees/edit/${e.id}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                <HiOutlinePencil className="w-4 h-4"/><span>Edit</span>
              </button>
              <button onClick={() => navigate('/employees')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <HiOutlineX className="w-5 h-5"/>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">

              {/* ── Left sidebar ── */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                  {/* Avatar */}
                  <div className="flex justify-center mb-5">
                    <div className="relative">
                      {e.photo ? (
                        <div className="relative group cursor-pointer"
                          onClick={() => setPhotoPreview({ url:e.photo, name:'Profile Photo', label:'Profile Photo' })}>
                          <img src={e.photo} alt={e.name} className="w-36 h-36 rounded-full object-cover border-4 border-indigo-100 shadow-md group-hover:opacity-90"/>
                          <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <HiOutlineEye className="w-7 h-7 text-white"/>
                          </div>
                        </div>
                      ) : (
                        <div className="w-36 h-36 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-indigo-200 shadow-md">
                          <span className="text-4xl font-bold text-indigo-600">{initials}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"/>
                    </div>
                  </div>

                  {/* Name & title */}
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-gray-800">{e.name}</h2>
                    <p className="text-indigo-600 text-sm font-medium">{e.jobTitle}</p>
                  </div>

                  {/* Status badges */}
                  <div className="flex justify-center space-x-2 mb-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.employeeType==='FULL_TIME' ? 'bg-blue-100 text-blue-800'
                      : e.employeeType==='PART_TIME' ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'}`}>
                      {(e.employeeType||'').replace('_',' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.status==='ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {e.status}
                    </span>
                  </div>

                  {/* Quick info */}
                  <div className="space-y-2.5 border-t border-gray-200 pt-4">
                    {[
                      { icon: HiOutlineMail,           val: e.workEmail                  },
                      { icon: HiOutlinePhone,          val: e.workPhone || e.workMobile  },
                      { icon: HiOutlineCalendar,       val: `Join: ${fmtDate(e.joinDate)}` },
                      { icon: HiOutlineOfficeBuilding, val: getCompany(e.companyId)       },
                      { icon: HiOutlineBriefcase,      val: getDept(e.departmentId)       },
                    ].map(({ icon: Icon, val }) => (
                      <div key={val} className="flex items-center text-gray-600 space-x-2">
                        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                        <span className="text-sm truncate">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right content ── */}
              <div className="col-span-12 lg:col-span-8 space-y-5">

                {/* Basic */}
                <Section icon={HiOutlineUser} title="Basic Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Full Name"   value={e.name}/>
                    <Row label="Job Title"   value={e.jobTitle}/>
                    <Row label="Company"     value={getCompany(e.companyId)}/>
                    <Row label="Department"  value={getDept(e.departmentId)}/>
                    <Row label="Join Date"   value={fmtDate(e.joinDate)}/>
                    <Row label="Manager"     value={getEmpName(e.managerId)}/>
                    <Row label="Coach"       value={getEmpName(e.coachId)}/>
                  </div>
                </Section>

                {/* Settings */}
                <Section icon={HiOutlineUserGroup} title="Settings">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Related User"                     value={e.relatedUserName||e.relatedUser}/>
                    <Row label="Employee Identification Number"   value={e.employeeIdentificationNumber}/>
                    <Row label="Monthly Cost"                     value={fmtCurrency(e.monthlyCost)}/>
                  </div>
                </Section>

                {/* Contact */}
                <Section icon={HiOutlinePhone} title="Contact">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Work Email"  value={e.workEmail}/>
                    <Row label="Work Phone"  value={e.workPhone}/>
                    <Row label="Work Mobile" value={e.workMobile}/>
                  </div>
                </Section>

                {/* Private */}
                <Section icon={HiOutlineHome} title="Private Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Row label="Private Address" value={e.privateAddress}/></div>
                    <Row label="Private Email" value={e.privateEmail}/>
                    <Row label="Private Phone" value={e.privatePhone}/>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Banks</p>
                      {e.banks?.length ? e.banks.map((b,i) => (
                        <div key={i} className="text-sm text-gray-800 mb-1">
                          <span className="font-medium">{b.bankName}</span>
                          <span className="text-gray-500 text-xs ml-2">{b.accountNumber} · {b.accountHolder}</span>
                        </div>
                      )) : <p className="text-sm text-gray-500">N/A</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Insurance</p>
                      {e.insurances?.length ? e.insurances.map((ins,i) => (
                        <div key={i} className="text-sm text-gray-800 mb-1">
                          <span className="font-medium">{ins.provider}</span>
                          <span className="text-gray-500 text-xs ml-2">{ins.type} · {ins.policyNumber}</span>
                        </div>
                      )) : <p className="text-sm text-gray-500">N/A</p>}
                    </div>
                    <Row label="NPWP ID"                value={e.npwpId}/>
                    <Row label="Home-Work Distance"     value={e.homeToWorkDistance ? `${e.homeToWorkDistance} km` : null}/>
                  </div>
                </Section>

                {/* Citizenship */}
                <Section icon={HiOutlineGlobe} title="Citizenship">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Nationality"       value={e.nationality}/>
                    <Row label="ID Number"          value={e.identificationNumber}/>
                    <Row label="Passport"           value={e.passportNumber}/>
                    <Row label="Gender"             value={e.gender}/>
                    <Row label="Date of Birth"      value={fmtDate(e.dateOfBirth)}/>
                    <Row label="Place of Birth"     value={e.placeOfBirth}/>
                    <Row label="Country of Birth"   value={e.countryOfBirth}/>
                  </div>
                </Section>

                {/* Emergency */}
                <Section icon={HiOutlineHeart} title="Emergency Contact" color="text-red-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Contact Name"  value={e.emergencyContactName}/>
                    <Row label="Contact Phone" value={e.emergencyContactPhone}/>
                  </div>
                </Section>

                {/* Education */}
                <Section icon={HiOutlineAcademicCap} title="Education" color="text-purple-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Row label="Certificate Level" value={e.certificateLevel}/>
                    <Row label="Field of Study"    value={e.fieldOfStudy}/>
                    <Row label="School"            value={e.school}/>
                  </div>
                </Section>

                {/* Family */}
                <Section icon={HiOutlineUsers} title="Family Status" color="text-green-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Row label="Marital Status"       value={e.maritalStatus}/>
                    <Row label="Dependent Children"   value={e.numberOfDependentChildren?.toString()}/>
                  </div>
                </Section>

                {/* Documents — Google Drive style grid */}
                <Section icon={HiOutlineDocument} title="Documents">
                  {!e.idCardCopy && !e.familyCardCopy && !e.npwpCardCopy && !e.drivingLicenseCopy && !e.assuranceCardCopy ? (
                    <p className="text-sm text-gray-400 text-center py-6">Tidak ada dokumen yang tersimpan</p>
                  ) : (
                    <div className="space-y-5">
                      {/* Single docs */}
                      {(e.idCardCopy || e.familyCardCopy || e.npwpCardCopy) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {e.idCardCopy   && <DetailDocCard label="ID Card / KTP" url={e.idCardCopy}/>}
                          {e.familyCardCopy && <DetailDocCard label="Family Card"  url={e.familyCardCopy}/>}
                          {e.npwpCardCopy && <DetailDocCard label="NPWP Card"    url={e.npwpCardCopy}/>}
                        </div>
                      )}
                      {/* Multi docs */}
                      {e.drivingLicenseCopy && <DetailMultiDocGrid label="Driving License" urlStr={e.drivingLicenseCopy}/>}
                      {e.assuranceCardCopy  && <DetailMultiDocGrid label="Insurance Copy"  urlStr={e.assuranceCardCopy}/>}
                    </div>
                  )}
                </Section>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile photo preview */}
      {photoPreview && <FilePreviewModal file={photoPreview} onClose={() => setPhotoPreview(null)}/>}
    </>
  );
};

export default EmployeeDetailModal;

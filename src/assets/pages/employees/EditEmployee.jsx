  import React, { useState, useEffect, useCallback } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import {
    HiOutlineArrowLeft, HiOutlinePhotograph, HiOutlineUpload, HiOutlineTrash,
    HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineX, HiOutlineMail,
    HiOutlinePhone, HiOutlineCalendar, HiOutlineUser, HiOutlineOfficeBuilding,
    HiOutlinePlus, HiOutlineGlobe, HiOutlineUserGroup, HiOutlineAcademicCap,
    HiOutlineHome, HiOutlineUsers, HiOutlineDocument, HiOutlineIdentification,
    HiOutlineShieldCheck,
  } from 'react-icons/hi';
  import { useEmployee } from '../../../redux/hooks/useEmployee';
  import { useDepartment } from '../../../redux/hooks/useDepartment';
  import { useCompany } from '../../../redux/hooks/useCompany';
  import API from '../../../ApiService/api';
  import { SingleFileUpload, MultiFileUpload } from '../../components/FileComponents';
  import LocationPicker from '../../components/LocationPicker';

  // ── Constants ─────────────────────────────────────────────────────────────────
  const EMPLOYEE_TYPE_OPTIONS = [
    { label:'Full Time', value:'FULL_TIME' },
    { label:'Part Time', value:'PART_TIME' },
    { label:'Contract',  value:'CONTRACT'  },
  ];
  const STATUS_OPTIONS = [
    { label:'Active',     value:'ACTIVE'     },
    { label:'Resigned',   value:'RESIGNED'   },
    { label:'Terminated', value:'TERMINATED' },
  ];
  const GENDER_OPTIONS = [
    { label:'Male', value:'MALE' }, { label:'Female', value:'FEMALE' },
  ];
  const MARITAL_OPTIONS = [
    { label:'Single',   value:'SINGLE'   }, { label:'Married',  value:'MARRIED'  },
    { label:'Divorced', value:'DIVORCED' }, { label:'Widowed',  value:'WIDOWED'  },
  ];
  const CERTIFICATE_OPTIONS = [
    { label:'High School', value:'HIGH_SCHOOL' }, { label:'Diploma',   value:'DIPLOMA'   },
    { label:'Bachelor',    value:'BACHELOR'    }, { label:'Master',    value:'MASTER'    },
    { label:'Doctorate',   value:'DOCTORATE'   },
  ];
  const BANK_OPTIONS = [
    {id:1,name:'BCA'},{id:2,name:'Mandiri'},{id:3,name:'BNI'},
    {id:4,name:'BRI'},{id:5,name:'CIMB Niaga'},{id:6,name:'Danamon'},{id:7,name:'Permata'},
  ];
  const NATIONALITY_OPTIONS = [
    'Indonesia','Malaysia','Singapore','Thailand','Vietnam','Philippines',
    'India','China','Japan','Korea','USA','UK','Australia',
  ];
  const INSURANCE_TYPE_OPTIONS = [
    { label:'Health Insurance',   value:'HEALTH'   },
    { label:'Life Insurance',     value:'LIFE'     },
    { label:'Vehicle Insurance',  value:'VEHICLE'  },
    { label:'Property Insurance', value:'PROPERTY' },
    { label:'Travel Insurance',   value:'TRAVEL'   },
    { label:'Other',              value:'OTHER'    },
  ];
  const FIELD_LABELS = {
    name:'Name', jobTitle:'Job Title', workEmail:'Work Email',
    workPhone:'Work Phone', companyId:'Company', departmentId:'Department',
    joinDate:'Join Date', status:'Status', employeeType:'Employee Type',
  };
  const REQUIRED_FIELDS = Object.keys(FIELD_LABELS);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const onlyNumber      = v => v.replace(/[^0-9]/g,'');
  const onlyText        = v => v.replace(/[^a-zA-Z\s]/g,'');
  const pasteNumberOnly = e => { if (!/^\d+$/.test(e.clipboardData.getData('text'))) e.preventDefault(); };
  const pasteTextOnly   = e => { if (!/^[a-zA-Z\s]+$/.test(e.clipboardData.getData('text'))) e.preventDefault(); };

  const parseMultiUrl = urlStr => {
    if (!urlStr) return [];
    return urlStr.split(',').filter(Boolean).map(u => {
      const url = u.trim();
      const name = decodeURIComponent(url.split('?')[0].split('/').pop()) || 'File';
      return { file:null, name, url, isLocal:false };
    });
  };

  // ── Tiny UI helpers ───────────────────────────────────────────────────────────
  const Toast = ({ toast, onClose }) => {
    if (!toast.show) return null;
    const ok = toast.type === 'success';
    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 ${ok?'bg-green-50 border-green-500':'bg-red-50 border-red-500'}`} style={{minWidth:320}}>
        <div className={`mr-3 flex-shrink-0 ${ok?'text-green-500':'text-red-500'}`}>
          {ok ? <HiOutlineCheckCircle className="w-6 h-6"/> : <HiOutlineXCircle className="w-6 h-6"/>}
        </div>
        <p className={`flex-1 mr-2 text-sm font-medium ${ok?'text-green-800':'text-red-800'}`}>{toast.message}</p>
        <button onClick={onClose}><HiOutlineX className="w-5 h-5"/></button>
      </div>
    );
  };
  const Lbl = ({children}) => <label className="block text-sm font-medium text-gray-700 mb-2">{children} <span className="text-red-500">*</span></label>;
  const Err = ({e}) => e ? <p className="text-red-500 text-xs mt-1">{e}</p> : null;
  const wrap  = err => `flex items-center border rounded-lg focus-within:ring-2 overflow-hidden ${err?'border-red-500 focus-within:ring-red-400':'border-gray-300 focus-within:ring-indigo-500'}`;
  const inner = (err,x='') => `flex-1 px-3 py-3 focus:outline-none text-base ${x} ${err?'bg-red-50':''}`;
  const selStd = err => `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${err?'border-red-500 focus:ring-red-400 bg-red-50':'border-gray-300 focus:ring-indigo-500'}`;
  const base  = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  // ── EditEmployee ──────────────────────────────────────────────────────────────
  const EditEmployee = () => {
    const navigate = useNavigate();
    const { id }   = useParams();

    const { updateEmployee, employees, fetchEmployeeById, loading: empLoading } = useEmployee();
    const { departments, fetchDepartments, loading: deptLoading } = useDepartment();
    const { companies,   fetchCompanies,   loading: compLoading  } = useCompany();

    const [photo,        setPhoto]        = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [tab,          setTab]          = useState('private');
    const [submitting,   setSubmitting]   = useState(false);
    const [pageLoading,  setPageLoading]  = useState(true);
    const [empData,      setEmpData]      = useState(null);
    const [errors,       setErrors]       = useState({});
    const [toast,        setToast]        = useState({ show:false, message:'', type:'success' });

    useEffect(() => {
      fetchCompanies(); fetchDepartments();
      if (!id) { setPageLoading(false); return; }
      fetchEmployeeById(parseInt(id))
        .then(res => { setEmpData(res.data); setPhotoPreview(res.data.photo||null); })
        .catch(err => console.error(err))
        .finally(() => setPageLoading(false));
    }, []);

    // ── form state ──────────────────────────────────────────────────────────────
    const [fd, setFd] = useState({
      name:'', jobTitle:'', workEmail:'', workPhone:'', workMobile:'',
      companyId:'', departmentId:'', joinDate:'', managerId:'', coachId:'',
      employeeCode:'', status:'ACTIVE',
    });
    const [priv, setPriv]   = useState({ address:'', email:'', phone:'' });
    const [wfhLocation, setWfhLocation] = useState({
      homeAddress: '',
      homeLatitude: null,
      homeLongitude: null,
    });
    const [banks, setBanks] = useState([{ bankName:'', accountNumber:'', accountHolder:'' }]);
    const [ins,   setIns]   = useState([{ type:'', provider:'', policyNumber:'' }]);
    const [tax,   setTax]   = useState({ npwp:'', workDistance:0 });
    const [emg,   setEmg]   = useState({ name:'', phone:'' });
    const [fam,   setFam]   = useState({ maritalStatus:'', numberOfChildren:0 });
    const [cit,   setCit]   = useState({ nationality:'', countryOfBirth:'', idNumber:'', passportNumber:'', gender:'', dateOfBirth:'', placeOfBirth:'', familyCardNumber:'' });
    const [edu,   setEdu]   = useState({ certificateLevel:'', fieldOfStudy:'', school:'' });
    const [docs,  setDocs]  = useState({
      idCard:null, familyCard:null,
      drivingLicense:[], insuranceCopies:[],
      npwpCard:null,
    });
    const [sett, setSett] = useState({ employeeType:'', relatedUserId:'', monthlyCost:'', employeeIdentificationNumber:'' });

    const active = employees?.filter(e => e.status==='ACTIVE' && e.id!==parseInt(id)) || [];

    // ── populate from API ───────────────────────────────────────────────────────
    useEffect(() => {
      if (!empData) return;
      setFd({
        name:         empData.name                || '',
        jobTitle:     empData.jobTitle             || '',
        workEmail:    empData.workEmail            || '',
        workPhone:    empData.workPhone            || '',
        workMobile:   empData.workMobile           || '',
        companyId:    empData.companyId?.toString()    || '',
        departmentId: empData.departmentId?.toString() || '',
        joinDate:     empData.joinDate             || '',
        managerId:    empData.managerId?.toString()    || '',
        coachId:      empData.coachId?.toString()      || '',
        employeeCode: empData.employeeCode         || '',
        status:       empData.status               || 'ACTIVE',
      });
      setPriv({ address: empData.privateAddress||'', email: empData.privateEmail||'', phone: empData.privatePhone||'' });
      // ── populate WFH location ──
      setWfhLocation({
        homeAddress:   empData.homeAddress   || '',
        homeLatitude:  empData.homeLatitude  || null,
        homeLongitude: empData.homeLongitude || null,
      });
      if (empData.banks?.length) setBanks(empData.banks);
      if (empData.insurances?.length)
        setIns(empData.insurances.map(({type='',provider='',policyNumber=''})=>({type,provider,policyNumber})));
      setTax({ npwp: empData.npwpId||'', workDistance: empData.homeToWorkDistance||0 });
      setEmg({ name: empData.emergencyContactName||'', phone: empData.emergencyContactPhone||'' });
      setFam({ maritalStatus: empData.maritalStatus||'', numberOfChildren: empData.numberOfDependentChildren||0 });
      setCit({
        nationality:      empData.nationality          || '',
        countryOfBirth:   empData.countryOfBirth        || '',
        idNumber:         empData.identificationNumber  || '',
        passportNumber:   empData.passportNumber         || '',
        familyCardNumber: empData.familyCardDocument     || '',
        gender:           empData.gender                || '',
        dateOfBirth:      empData.dateOfBirth            || '',
        placeOfBirth:     empData.placeOfBirth           || '',
      });
      setEdu({ certificateLevel: empData.certificateLevel||'', fieldOfStudy: empData.fieldOfStudy||'', school: empData.school||'' });
      setSett({
        employeeType:                 empData.employeeType               || '',
        relatedUserId:                empData.relatedUser                || '',
        monthlyCost:                  empData.monthlyCost                || '',
        employeeIdentificationNumber: empData.employeeIdentificationNumber || '',
      });
      setDocs({
        idCard:null, familyCard:null, npwpCard:null,
        drivingLicense:  parseMultiUrl(empData.drivingLicenseCopy),
        insuranceCopies: parseMultiUrl(empData.assuranceCardCopy),
      });
    }, [empData]);

    const autoManager = useCallback(deptId => {
      if (!deptId) { setFd(p=>({...p,managerId:''})); return; }
      const d = departments?.find(d=>String(d.id)===String(deptId));
      setFd(p=>({...p,managerId:d?.managerId?String(d.managerId):''}));
    },[departments]);

    const chgFd = useCallback(e => {
      const {name,value} = e.target;
      let v = value;
      if (['workPhone','workMobile'].includes(name)) v=onlyNumber(v);
      if (['name','jobTitle'].includes(name))         v=onlyText(v);
      setFd(p=>({...p,[name]:v}));
      if (REQUIRED_FIELDS.includes(name)) {
        if (!v.trim()) setErrors(p=>({...p,[name]:`${FIELD_LABELS[name]} is required`}));
        else if (name==='workEmail'&&!/\S+@\S+\.\S+/.test(v)) setErrors(p=>({...p,[name]:'Email is invalid'}));
        else setErrors(p=>{const n={...p};delete n[name];return n;});
      }
    },[]);

    const setDoc   = (key,file) => file && setDocs(p=>({...p,[key]:{file,name:file.name,url:URL.createObjectURL(file),isLocal:true}}));
    const clearDoc = key => setDocs(p=>({...p,[key]:null}));

    const uploadOne = async file => {
      const f2 = new FormData(); f2.append('file',file);
      const r = await API.post('/files/upload',f2,{headers:{'Content-Type':'multipart/form-data'}});
      return r.data.data?.fileUrl||r.data.data;
    };
    const uploadMany = async arr => {
      if (!arr.length) return null;
      const urls = await Promise.all(arr.map(f=>f.isLocal?uploadOne(f.file):Promise.resolve(f.url)));
      return urls.filter(Boolean).join(',');
    };

    const validate = () => {
      const e = {};
      if (!fd.name.trim())      e.name      = 'Name is required';
      if (!fd.jobTitle.trim())  e.jobTitle  = 'Job Title is required';
      if (!fd.workEmail.trim()) e.workEmail = 'Work Email is required';
      else if (!/\S+@\S+\.\S+/.test(fd.workEmail)) e.workEmail = 'Email is invalid';
      if (!fd.workPhone.trim()) e.workPhone    = 'Work Phone is required';
      if (!fd.companyId)        e.companyId    = 'Company is required';
      if (!fd.departmentId)     e.departmentId = 'Department is required';
      if (!fd.joinDate)         e.joinDate     = 'Join Date is required';
      if (!fd.status)           e.status       = 'Status is required';
      if (!sett.employeeType)   e.employeeType = 'Employee Type is required';
      return e;
    };

    // Di dalam handleSubmit function, sebelum updateEmployee, tambahkan:

  const handleSubmit = async e => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrors(ve);
      setToast({show:true,message:'Please fill in all required fields',type:'error'});
      const first = Object.keys(ve)[0];
      if (['employeeType','status'].includes(first)) { setTab('settings'); setTimeout(()=>document.querySelector(`[name="${first}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),100); }
      else document.querySelector(`[name="${first}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if (banks.some(b=>b.bankName&&(!b.accountNumber||!b.accountHolder))) {
      setToast({show:true,message:'Please complete all bank account information',type:'error'});
      setTab('private'); return;
    }
    setSubmitting(true);
    
    // === DEBUG: Log WFH data yang akan dikirim ===
    console.log('=== WFH DATA TO BE SENT ===');
    console.log('homeAddress:', wfhLocation.homeAddress);
    console.log('homeLatitude:', wfhLocation.homeLatitude);
    console.log('homeLongitude:', wfhLocation.homeLongitude);
    console.log('Full wfhLocation object:', wfhLocation);
    
    try {
      const photoUrl = photo           ? await uploadOne(photo)                : empData?.photo||null;
      const idUrl    = docs.idCard     ? await uploadOne(docs.idCard.file)     : empData?.idCardCopy||null;
      const famUrl   = docs.familyCard ? await uploadOne(docs.familyCard.file) : empData?.familyCardCopy||null;
      const npwpUrl  = docs.npwpCard   ? await uploadOne(docs.npwpCard.file)   : empData?.npwpCardCopy||null;
      const driveUrl = await uploadMany(docs.drivingLicense);
      const insUrl   = await uploadMany(docs.insuranceCopies);

      const updateData = {
        name:fd.name, jobTitle:fd.jobTitle,
        workEmail:fd.workEmail, workPhone:fd.workPhone, workMobile:fd.workMobile||null,
        joinDate:fd.joinDate||null, photo:photoUrl,
        companyId:    parseInt(fd.companyId,    10),
        departmentId: parseInt(fd.departmentId, 10),
        managerId: fd.managerId ? parseInt(fd.managerId,  10) : null,
        coachId:   fd.coachId   ? parseInt(fd.coachId,    10) : null,
        // WFH Location - pastikan nilai dikirim dengan benar
        homeAddress:   wfhLocation.homeAddress || null,
        homeLatitude:  wfhLocation.homeLatitude ? parseFloat(wfhLocation.homeLatitude) : null,
        homeLongitude: wfhLocation.homeLongitude ? parseFloat(wfhLocation.homeLongitude) : null,
        privateAddress:priv.address||null, privateEmail:priv.email||null, privatePhone:priv.phone||null,
        banks: banks.filter(b=>b.bankName&&b.accountNumber&&b.accountHolder),
        insurances: ins.filter(i=>i.type&&i.provider&&i.policyNumber).map(({type,provider,policyNumber})=>({type,provider,policyNumber})),
        npwpId:tax.npwp||null,
        homeToWorkDistance:tax.workDistance?Number(tax.workDistance):null,
        nationality:cit.nationality||null, identificationNumber:cit.idNumber||null,
        passportNumber:cit.passportNumber||null, gender:cit.gender||null,
        dateOfBirth:cit.dateOfBirth||null, placeOfBirth:cit.placeOfBirth||null,
        countryOfBirth:cit.countryOfBirth||null, familyCardDocument:cit.familyCardNumber||null,
        emergencyContactName:emg.name||null, emergencyContactPhone:emg.phone||null,
        certificateLevel:edu.certificateLevel||null, fieldOfStudy:edu.fieldOfStudy||null, school:edu.school||null,
        maritalStatus:fam.maritalStatus||null,
        numberOfDependentChildren:fam.numberOfChildren?parseInt(fam.numberOfChildren,10):null,
        status:fd.status||'ACTIVE', employeeType:sett.employeeType,
        relatedUser:sett.relatedUserId?String(sett.relatedUserId):null,
        monthlyCost:sett.monthlyCost!==''?parseFloat(sett.monthlyCost):null,
        employeeIdentificationNumber:sett.employeeIdentificationNumber||null,
        idCardCopy:idUrl, familyCardCopy:famUrl,
        drivingLicenseCopy:driveUrl, assuranceCardCopy:insUrl, npwpCardCopy:npwpUrl,
      };
      
      // === DEBUG: Log data yang akan dikirim ke API ===
      console.log('=== FULL UPDATE DATA ===');
      console.log('updateData:', updateData);
      console.log('WFH fields in updateData:', {
        homeAddress: updateData.homeAddress,
        homeLatitude: updateData.homeLatitude,
        homeLongitude: updateData.homeLongitude,
      });
      
      await updateEmployee(parseInt(id), updateData);
      navigate('/employees',{state:{toast:{show:true,message:`Employee ${fd.name} successfully updated`,type:'success'}}});
    } catch(err) {
      console.error('Update error:', err);
      console.error('Error response:', err.response?.data);
      setToast({show:true,message:err.response?.data?.message||err.message||'Failed to update employee',type:'error'});
    } finally { setSubmitting(false); }
  };

    if (pageLoading||empLoading) return (
      <div className="w-full px-4 py-6 flex justify-center items-center h-64">
        <div className="text-gray-400">Loading employee data…</div>
      </div>
    );

    return (
      <form onSubmit={handleSubmit} noValidate className="w-full px-4 md:px-6 py-6 bg-gray-50 min-h-screen">
        <Toast toast={toast} onClose={()=>setToast(p=>({...p,show:false}))}/>

        <div className="flex items-center space-x-4 mb-8">
          <button type="button" onClick={()=>navigate('/employees')} disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm">
            <HiOutlineArrowLeft className="w-5 h-5 text-gray-600"/>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Employee</h1>
        </div>

        {/* ── Profile card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 p-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className={`border-b-2 pb-2 mb-4 ${errors.name?'border-red-400':'border-indigo-200'}`}>
                <input name="name" value={fd.name} onChange={chgFd} onPaste={pasteTextOnly}
                  placeholder="Employee's Name *"
                  className={`text-3xl font-bold text-gray-800 w-full px-2 py-1 bg-transparent focus:outline-none ${errors.name?'placeholder-red-300':''}`}/>
                <Err e={errors.name}/>
              </div>
              <div className={`border-b pb-1 mb-2 ${errors.jobTitle?'border-red-400':'border-gray-200'}`}>
                <input name="jobTitle" value={fd.jobTitle} onChange={chgFd} onPaste={pasteTextOnly}
                  placeholder="Job Title *"
                  className={`text-base text-gray-600 w-full px-2 py-1 bg-transparent focus:outline-none ${errors.jobTitle?'placeholder-red-300':''}`}/>
                <Err e={errors.jobTitle}/>
              </div>
              {fd.employeeCode && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Code: {fd.employeeCode}</span>}
            </div>
            <div className="flex-shrink-0 ml-6 relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-100 shadow-md">
                {photoPreview
                  ? <img src={photoPreview} alt="photo" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-indigo-50 flex items-center justify-center"><HiOutlinePhotograph className="w-10 h-10 text-indigo-300"/></div>}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg">
                <HiOutlineUpload className="w-4 h-4"/>
                <input type="file" className="hidden" accept="image/*"
                  onChange={e=>{const f=e.target.files[0];if(f){setPhoto(f);setPhotoPreview(URL.createObjectURL(f));}}}/>
              </label>
            </div>
          </div>
        </div>

        {/* ── Work info ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Work Information</h2>
          {compLoading||deptLoading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <Lbl>Work Email</Lbl>
                <div className={wrap(!!errors.workEmail)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineMail className="w-5 h-5 text-gray-400"/></div>
                  <input type="email" name="workEmail" value={fd.workEmail} onChange={chgFd} placeholder="john@company.com" className={inner(!!errors.workEmail)}/>
                </div><Err e={errors.workEmail}/>
              </div>
              <div>
                <Lbl>Work Phone</Lbl>
                <div className={wrap(!!errors.workPhone)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlinePhone className="w-5 h-5 text-gray-400"/></div>
                  <input type="tel" inputMode="numeric" name="workPhone" value={fd.workPhone} onChange={chgFd} onPaste={pasteNumberOnly} placeholder="0211234567" className={inner(!!errors.workPhone)}/>
                </div><Err e={errors.workPhone}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Mobile</label>
                <div className={wrap(false)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlinePhone className="w-5 h-5 text-gray-400"/></div>
                  <input type="tel" inputMode="numeric" name="workMobile" value={fd.workMobile} onChange={chgFd} onPaste={pasteNumberOnly} className={inner(false)}/>
                </div>
              </div>
              <div>
                <Lbl>Company</Lbl>
                <div className={wrap(!!errors.companyId)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400"/></div>
                  <select name="companyId" value={fd.companyId} onChange={chgFd} className={inner(!!errors.companyId,'bg-transparent')}>
                    <option value="">Select Company</option>
                    {companies?.map(c=><option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div><Err e={errors.companyId}/>
              </div>
              <div>
                <Lbl>Department</Lbl>
                <div className={wrap(!!errors.departmentId)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400"/></div>
                  <select name="departmentId" value={fd.departmentId}
                    onChange={e=>{chgFd(e);autoManager(e.target.value);}}
                    className={inner(!!errors.departmentId,'bg-transparent')}>
                    <option value="">Select Department</option>
                    {departments?.map(d=><option key={d.id} value={d.id}>{d.departmentName}</option>)}
                  </select>
                </div><Err e={errors.departmentId}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                <div className={wrap(false)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineUser className="w-5 h-5 text-gray-400"/></div>
                  <select name="managerId" value={fd.managerId} onChange={chgFd} className={inner(false,'bg-transparent')}>
                    <option value="">Select Manager</option>
                    {active.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coach</label>
                <div className={wrap(false)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineUserGroup className="w-5 h-5 text-gray-400"/></div>
                  <select name="coachId" value={fd.coachId} onChange={chgFd} className={inner(false,'bg-transparent')}>
                    <option value="">Select Coach</option>
                    {active.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Lbl>Join Date</Lbl>
                <div className={wrap(!!errors.joinDate)}>
                  <div className="px-3 bg-gray-50 py-3 border-r border-gray-300"><HiOutlineCalendar className="w-5 h-5 text-gray-400"/></div>
                  <input type="date" name="joinDate" value={fd.joinDate} onChange={chgFd} className={inner(!!errors.joinDate)}/>
                </div><Err e={errors.joinDate}/>
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 flex space-x-6">
            {[{k:'private',l:'Private Information'},{k:'documents',l:'Documents'},{k:'settings',l:'Settings'}].map(({k,l})=>(
              <button key={k} type="button" onClick={()=>setTab(k)}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab===k?'border-indigo-600 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* ──── PRIVATE ──── */}
            {tab==='private' && (
              <div className="space-y-8">

                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlineHome className="w-5 h-5 mr-2 text-indigo-500"/> 2.1 Private Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Private Address</label>
                      <textarea value={priv.address} onChange={e=>setPriv(p=>({...p,address:e.target.value}))}
                        rows={3} placeholder="Street, City, Province" className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Private Email</label>
                      <input type="email" value={priv.email} onChange={e=>setPriv(p=>({...p,email:e.target.value}))} placeholder="personal@email.com" className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Private Phone</label>
                      <input type="tel" inputMode="numeric" value={priv.phone}
                        onChange={e=>setPriv(p=>({...p,phone:onlyNumber(e.target.value)}))}
                        onPaste={pasteNumberOnly} className={base}/>
                    </div>
                  </div>
                </section>

                {/* WFH Location */}
                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlineHome className="w-5 h-5 mr-2 text-green-500"/> 2.2 WFH / Home Location
                  </h3>
                  <LocationPicker
                    value={{
                      latitude:         wfhLocation.homeLatitude,
                      longitude:        wfhLocation.homeLongitude,
                      formattedAddress: wfhLocation.homeAddress,
                    }}
                    onChange={(loc) => setWfhLocation({
                      homeAddress:   loc.formattedAddress || '',
                      homeLatitude:  loc.latitude,
                      homeLongitude: loc.longitude,
                    })}
                  />
                </section>

                {/* banks */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-md font-medium text-gray-700">Bank Accounts</span>
                    {banks.length<3&&<button type="button" onClick={()=>setBanks(p=>[...p,{bankName:'',accountNumber:'',accountHolder:''}])} className="flex items-center space-x-1 text-indigo-600 text-sm"><HiOutlinePlus className="w-4 h-4"/><span>Add Bank</span></button>}
                  </div>
                  {banks.map((b,i)=>(
                    <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 relative mb-3">
                      {banks.length>1&&<button type="button" onClick={()=>setBanks(p=>p.filter((_,j)=>j!==i))} className="absolute top-2 right-2 text-red-500"><HiOutlineTrash className="w-4 h-4"/></button>}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                          <select value={b.bankName} onChange={e=>setBanks(p=>{const n=[...p];n[i].bankName=e.target.value;return n;})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                            <option value="">Select Bank</option>
                            {BANK_OPTIONS.map(o=><option key={o.id} value={o.name}>{o.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Account Number</label>
                          <input type="text" inputMode="numeric" value={b.accountNumber}
                            onChange={e=>setBanks(p=>{const n=[...p];n[i].accountNumber=onlyNumber(e.target.value);return n;})}
                            onPaste={pasteNumberOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"/>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Account Holder</label>
                          <input type="text" value={b.accountHolder}
                            onChange={e=>setBanks(p=>{const n=[...p];n[i].accountHolder=onlyText(e.target.value);return n;})}
                            onPaste={pasteTextOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                {/* insurance */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-md font-medium text-gray-700">Insurance</span>
                    {ins.length<3&&<button type="button" onClick={()=>setIns(p=>[...p,{type:'',provider:'',policyNumber:''}])} className="flex items-center space-x-1 text-indigo-600 text-sm"><HiOutlinePlus className="w-4 h-4"/><span>Add Insurance</span></button>}
                  </div>
                  {ins.map((v,i)=>(
                    <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 relative mb-3">
                      {ins.length>1&&<button type="button" onClick={()=>setIns(p=>p.filter((_,j)=>j!==i))} className="absolute top-2 right-2 text-red-500"><HiOutlineTrash className="w-4 h-4"/></button>}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select value={v.type} onChange={e=>setIns(p=>{const n=[...p];n[i].type=e.target.value;return n;})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                            <option value="">Select Type</option>
                            {INSURANCE_TYPE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Provider</label>
                          <input type="text" value={v.provider} onChange={e=>setIns(p=>{const n=[...p];n[i].provider=e.target.value;return n;})}
                            placeholder="e.g., BPJS"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"/>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Policy Number</label>
                          <input type="text" value={v.policyNumber} onChange={e=>setIns(p=>{const n=[...p];n[i].policyNumber=e.target.value;return n;})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                {/* tax */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">NPWP ID</label>
                      <input type="text" inputMode="numeric" value={tax.npwp}
                        onChange={e=>setTax(p=>({...p,npwp:onlyNumber(e.target.value)}))}
                        onPaste={pasteNumberOnly} placeholder="Numbers only" className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Home-Work Distance (KM)</label>
                      <div className="relative">
                        <input type="text" inputMode="numeric" value={tax.workDistance}
                          onChange={e=>setTax(p=>({...p,workDistance:onlyNumber(e.target.value)}))}
                          onPaste={pasteNumberOnly} placeholder="0"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KM</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* emergency */}
                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlinePhone className="w-5 h-5 mr-2 text-red-500"/> 2.3 Emergency
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                      <input type="text" value={emg.name} onChange={e=>setEmg(p=>({...p,name:onlyText(e.target.value)}))} onPaste={pasteTextOnly} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input type="tel" inputMode="numeric" value={emg.phone} onChange={e=>setEmg(p=>({...p,phone:onlyNumber(e.target.value)}))} onPaste={pasteNumberOnly} className={base}/>
                    </div>
                  </div>
                </section>

                {/* family */}
                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlineUsers className="w-5 h-5 mr-2 text-green-500"/> 2.4 Family Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                      <select value={fam.maritalStatus} onChange={e=>setFam(p=>({...p,maritalStatus:e.target.value}))} className={base}>
                        <option value="">Select Status</option>
                        {MARITAL_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dependent Children</label>
                      <input type="number" min="0" value={fam.numberOfChildren} onChange={e=>setFam(p=>({...p,numberOfChildren:e.target.value}))} className={base}/>
                    </div>
                  </div>
                </section>

                {/* citizenship */}
                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlineGlobe className="w-5 h-5 mr-2 text-blue-500"/> 2.5 Citizenship
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship</label>
                      <select value={cit.nationality} onChange={e=>setCit(p=>({...p,nationality:e.target.value}))} className={base}>
                        <option value="">Select</option>
                        {NATIONALITY_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country of Birth</label>
                      <input type="text" value={cit.countryOfBirth} onChange={e=>setCit(p=>({...p,countryOfBirth:e.target.value}))} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Identification No</label>
                      <input type="text" value={cit.idNumber} onChange={e=>setCit(p=>({...p,idNumber:e.target.value}))} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passport No</label>
                      <input type="text" value={cit.passportNumber} onChange={e=>setCit(p=>({...p,passportNumber:e.target.value}))} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select value={cit.gender} onChange={e=>setCit(p=>({...p,gender:e.target.value}))} className={base}>
                        <option value="">Select Gender</option>
                        {GENDER_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input type="date" value={cit.dateOfBirth} onChange={e=>setCit(p=>({...p,dateOfBirth:e.target.value}))} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth</label>
                      <input type="text" value={cit.placeOfBirth} onChange={e=>setCit(p=>({...p,placeOfBirth:onlyText(e.target.value)}))} onPaste={pasteTextOnly} className={base}/>
                    </div>
                  </div>
                </section>

                {/* education */}
                <section>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <HiOutlineAcademicCap className="w-5 h-5 mr-2 text-purple-500"/> 2.6 Education
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Level</label>
                      <select value={edu.certificateLevel} onChange={e=>setEdu(p=>({...p,certificateLevel:e.target.value}))} className={base}>
                        <option value="">Select Level</option>
                        {CERTIFICATE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                      <input type="text" value={edu.fieldOfStudy} onChange={e=>setEdu(p=>({...p,fieldOfStudy:e.target.value}))} onPaste={pasteTextOnly} className={base}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School / University</label>
                      <input type="text" value={edu.school} onChange={e=>setEdu(p=>({...p,school:e.target.value}))} onPaste={pasteTextOnly} className={base}/>
                    </div>
                  </div>
                </section>

              </div>
            )}

            {/* ──── DOCUMENTS ──── */}
            {tab==='documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700">Required Documents</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    Klik kartu untuk preview • Driving License & Insurance max 3 file
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SingleFileUpload label="ID Card / KTP" icon={HiOutlineIdentification}
                    fileObj={docs.idCard} existingUrl={empData?.idCardCopy}
                    onChange={f=>setDoc('idCard',f)} onRemove={()=>clearDoc('idCard')}/>
                  <SingleFileUpload label="Family Card" icon={HiOutlineUsers}
                    fileObj={docs.familyCard} existingUrl={empData?.familyCardCopy}
                    onChange={f=>setDoc('familyCard',f)} onRemove={()=>clearDoc('familyCard')}/>
                  <SingleFileUpload label="NPWP Card" icon={HiOutlineDocument}
                    fileObj={docs.npwpCard} existingUrl={empData?.npwpCardCopy}
                    onChange={f=>setDoc('npwpCard',f)} onRemove={()=>clearDoc('npwpCard')}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MultiFileUpload label="Driving License Copy" icon={HiOutlineDocument} maxFiles={3}
                    files={docs.drivingLicense} onChange={arr=>setDocs(p=>({...p,drivingLicense:arr}))}/>
                  <MultiFileUpload label="Insurance Copy" icon={HiOutlineShieldCheck} maxFiles={3}
                    files={docs.insuranceCopies} onChange={arr=>setDocs(p=>({...p,insuranceCopies:arr}))}/>
                </div>
              </div>
            )}

            {/* ──── SETTINGS ──── */}
            {tab==='settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-700">Employee Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Type <span className="text-red-500">*</span>
                      {errors.employeeType&&<span className="text-red-500 text-xs ml-2">{errors.employeeType}</span>}
                    </label>
                    <select name="employeeType" value={sett.employeeType}
                      onChange={e=>{setSett(p=>({...p,employeeType:e.target.value}));if(!e.target.value)setErrors(p=>({...p,employeeType:'Employee Type is required'}));else setErrors(p=>{const n={...p};delete n.employeeType;return n;});}}
                      className={selStd(!!errors.employeeType)}>
                      <option value="">Select Type</option>
                      {EMPLOYEE_TYPE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                      {errors.status&&<span className="text-red-500 text-xs ml-2">{errors.status}</span>}
                    </label>
                    <select name="status" value={fd.status} onChange={chgFd} className={selStd(!!errors.status)}>
                      <option value="">Select Status</option>
                      {STATUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related User</label>
                    <select value={sett.relatedUserId} onChange={e=>setSett(p=>({...p,relatedUserId:e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Select Related User</option>
                      {active.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Cost</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                      <input type="number" min="0" value={sett.monthlyCost} onChange={e=>setSett(p=>({...p,monthlyCost:e.target.value}))}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Identification Number</label>
                    <input type="text" inputMode="numeric" value={sett.employeeIdentificationNumber}
                      onChange={e=>setSett(p=>({...p,employeeIdentificationNumber:onlyNumber(e.target.value)}))}
                      onPaste={pasteNumberOnly}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
            <button type="button" onClick={()=>navigate('/employees')} disabled={submitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center">
              {submitting
                ? <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</>
                : 'Update Employee'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  export default EditEmployee;

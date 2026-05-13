// src/pages/attendance/AttendanceList.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  HiOutlineSearch, HiOutlineClock, HiOutlineCalendar, HiOutlineUser,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationCircle,
  HiOutlineRefresh, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineChevronDown, HiOutlineOfficeBuilding, HiOutlineEye,
  HiOutlineLocationMarker, HiOutlineCamera, HiOutlineX, HiOutlineArrowLeft, HiOutlineArrowRight,
} from 'react-icons/hi';
import { useAttendance } from '../../../redux/hooks/useAttendance';
import { useEmployee } from '../../../redux/hooks/useEmployee';

const PER_PAGE = 10;

// ✅ Base URL backend
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080')
  .replace(/\/api(\/v\d+)?\/?$/, '');

const buildPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('//')) return `https:${path}`;
  return `${BASE_URL}${path}`;
};

// ✅ Fallback image Base64 (no external request)
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EFoto Tidak Tersedia%3C/text%3E%3C/svg%3E";

// ✅ Helper ambil foto employee — sama persis dengan AttendanceCorrection
const getEmpPhoto = (emp) =>
  emp?.photo ?? emp?.photoUrl ?? emp?.profilePhoto ?? emp?.profilePicture ??
  emp?.avatarUrl ?? emp?.avatar ?? emp?.imageUrl ?? emp?.image ?? null;

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', color: 'bg-green-100 text-green-700',   icon: <HiOutlineCheckCircle className="w-3.5 h-3.5" /> },
  LATE:    { label: 'Late',    color: 'bg-yellow-100 text-yellow-700', icon: <HiOutlineExclamationCircle className="w-3.5 h-3.5" /> },
  ABSENT:  { label: 'Absent',  color: 'bg-red-100 text-red-700',       icon: <HiOutlineXCircle className="w-3.5 h-3.5" /> },
};

const WORK_TYPE_CONFIG = {
  WFO: { label: 'WFO', color: 'bg-blue-100 text-blue-700' },
  WFH: { label: 'WFH', color: 'bg-purple-100 text-purple-700' },
  WFA: { label: 'WFA', color: 'bg-orange-100 text-orange-700' },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status?.toUpperCase()] ?? { label: status ?? '-', color: 'bg-gray-100 text-gray-600', icon: null };

const getWorkTypeConfig = (type) =>
  WORK_TYPE_CONFIG[type?.toUpperCase()] ?? { label: type ?? '-', color: 'bg-gray-100 text-gray-600' };

const formatTime = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d) ? '-' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calcDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-';
  const diff = (new Date(checkOut) - new Date(checkIn)) / 60000;
  if (diff <= 0) return '-';
  return `${Math.floor(diff / 60)}j ${Math.round(diff % 60)}m`;
};

const formatCoord = (val) => {
  if (val == null || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n.toFixed(6);
};

const StatusBadge = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const WorkTypeBadge = ({ type }) => {
  const cfg = getWorkTypeConfig(type);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ─── Photo Preview Modal (Lightbox) ───────────────────────────────────────────
const PhotoPreviewModal = ({ isOpen, onClose, photos, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || !photos.length) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <HiOutlineX className="w-6 h-6" />
        </button>

        {/* Image counter */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Main image */}
        <img
          src={currentPhoto.url}
          alt={currentPhoto.alt}
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />

        {/* Caption */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2 px-4 mx-auto w-fit rounded-full">
          {currentPhoto.caption}
        </div>

        {/* Navigation buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <HiOutlineChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <HiOutlineChevronRight className="w-8 h-8" />
            </button>

            {/* Thumbnails */}
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 flex-wrap px-4">
              {photos.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-50'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Photo Carousel Component ─────────────────────────────────────────────────
const PhotoCarousel = ({ checkInPhoto, checkOutPhoto, checkInTime, checkOutTime }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const photos = [];
  if (checkInPhoto) {
    photos.push({
      url: checkInPhoto,
      type: "Check In",
      time: checkInTime,
      label: "Foto Check In",
      caption: `Check In - ${formatDateTime(checkInTime)}`,
      alt: "Foto Check In",
    });
  }
  if (checkOutPhoto) {
    photos.push({
      url: checkOutPhoto,
      type: "Check Out",
      time: checkOutTime,
      label: "Foto Check Out",
      caption: `Check Out - ${formatDateTime(checkOutTime)}`,
      alt: "Foto Check Out",
    });
  }

  const openPreview = () => setPreviewOpen(true);

  if (photos.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl flex items-center justify-center py-12">
        <div className="text-center">
          <HiOutlineCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Tidak ada foto</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <>
      <div className="space-y-3">
        <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img
            src={currentPhoto.url}
            alt={currentPhoto.alt}
            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
            onClick={openPreview}
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />

          {/* Overlay badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              currentPhoto.type === "Check In"
                ? "bg-indigo-600 text-white"
                : "bg-emerald-600 text-white"
            }`}>
              {currentPhoto.type}
            </span>
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 right-3">
            <button
              onClick={(e) => { e.stopPropagation(); openPreview(); }}
              className="px-2 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white text-xs flex items-center gap-1 transition-colors"
            >
              <HiOutlineEye className="w-3 h-3" />
              Preview
            </button>
          </div>

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10"
              >
                <HiOutlineArrowLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10"
              >
                <HiOutlineArrowRight className="w-5 h-5 text-white" />
              </button>

              {/* Indicator dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Caption and actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            {currentPhoto.label} · {formatDateTime(currentPhoto.time)}
          </p>
          <button
            onClick={openPreview}
            className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <HiOutlineEye className="w-3.5 h-3.5" />
            Lihat besar
          </button>
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                }`}
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PhotoPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        photos={photos}
        initialIndex={currentIndex}
      />
    </>
  );
};

// ─── Detail Modal Component ───────────────────────────────────────────────────
// ✅ Tambah prop empPhoto — ikut pola AttendanceCorrection
const DetailModal = ({ item, onClose, empPhoto }) => {
  if (!item) return null;

  const empName  = item.employee?.name ?? item.employeeName ?? '-';
  const deptName = item.employee?.departmentName ?? item.departmentName ?? item.employee?.department?.name ?? '';
  const workType = item.attendanceType ?? null;

  // Build photo URLs
  const photoIn  = buildPhotoUrl(item.photoPath ?? null);
  const photoOut = buildPhotoUrl(item.checkOutPhotoPath ?? null);

  const lat    = item.latitude  ?? null;
  const lng    = item.longitude ?? null;
  const latOut = item.checkOutLatitude  ?? null;
  const lngOut = item.checkOutLongitude ?? null;

  const mapsUrl    = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const mapsUrlOut = latOut && lngOut ? `https://www.google.com/maps?q=${latOut},${lngOut}` : null;

  const initials = empName !== '-' ? empName.charAt(0).toUpperCase() : '?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* ✅ Avatar dengan foto employee — sama persis pola AttendanceCorrection */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
              {empPhoto ? (
                <img
                  src={empPhoto}
                  alt={empName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-full h-full bg-indigo-100 items-center justify-center text-indigo-600 font-bold text-sm"
                style={{ display: empPhoto ? 'none' : 'flex' }}
              >
                {initials}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800">{empName}</p>
              {deptName && <p className="text-xs text-gray-400">{deptName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Tanggal',   value: formatDate(item.date) },
              { label: 'Status',    value: <StatusBadge status={item.status} /> },
              { label: 'Check In',  value: formatTime(item.checkIn) },
              { label: 'Check Out', value: formatTime(item.checkOut) },
              { label: 'Durasi',    value: calcDuration(item.checkIn, item.checkOut) },
              { label: 'Tipe Kerja',value: workType ? <WorkTypeBadge type={workType} /> : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <div className="text-sm font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Location Check In */}
          {(lat || lng) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <HiOutlineLocationMarker className="w-3.5 h-3.5" /> Lokasi Check In
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-mono text-gray-700">
                  {formatCoord(lat)}, {formatCoord(lng)}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Buka Maps ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Location Check Out */}
          {(latOut || lngOut) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <HiOutlineLocationMarker className="w-3.5 h-3.5" /> Lokasi Check Out
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-mono text-gray-700">
                  {formatCoord(latOut)}, {formatCoord(lngOut)}
                </p>
                {mapsUrlOut && (
                  <a
                    href={mapsUrlOut}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Buka Maps ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Photos with Carousel */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineCamera className="w-4 h-4 text-indigo-500" />
              Dokumentasi Foto
            </p>
            <PhotoCarousel
              checkInPhoto={photoIn}
              checkOutPhoto={photoOut}
              checkInTime={item.checkIn}
              checkOutTime={item.checkOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-full" /></td>
    ))}
  </tr>
);

// ─── Employee Dropdown ────────────────────────────────────────────────────────
const EmployeeDropdown = ({ employees, loadingEmployees, selectedEmployee, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredEmps = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) => e.name?.toLowerCase().includes(q) || e.employeeIdentificationNumber?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const selectedObj = employees.find((e) => String(e.id) === String(selectedEmployee));

  return (
    <div className="relative w-full sm:w-72" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <HiOutlineUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedObj ? (
            <span className="truncate text-gray-800 font-medium text-sm">
              {selectedObj.name}
              {selectedObj.employeeIdentificationNumber && (
                <span className="ml-1.5 text-gray-400 font-normal font-mono text-xs">
                  ({selectedObj.employeeIdentificationNumber})
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">{loadingEmployees ? 'Memuat...' : '— Pilih Karyawan —'}</span>
          )}
        </div>
        <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <HiOutlineSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus type="text" placeholder="Cari nama atau NIK..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {loadingEmployees ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Memuat...</li>
            ) : filteredEmps.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan</li>
            ) : (
              filteredEmps.map((emp) => {
                const isActive = String(emp.id) === String(selectedEmployee);
                return (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(emp.id); setOpen(false); setSearch(''); }}
                      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors ${isActive ? 'bg-indigo-50' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{emp.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {emp.employeeIdentificationNumber}{emp.departmentName && ` · ${emp.departmentName}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Main AttendanceList Component ───────────────────────────────────────────
const AttendanceList = () => {
  const {
    attendances,
    employees: attendanceEmployees, // ✅ rename agar tidak bentrok
    loading,
    loadingEmployees,
    error,
    loadEmployees,
    loadAttendance,
    resetAttendance,
  } = useAttendance();

  // ✅ Ambil semua data employee untuk keperluan foto — sama persis pola AttendanceCorrection
  const { employees: allEmployees, fetchEmployees } = useEmployee();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);

  // ✅ Build empMap dari allEmployees — sama persis pola AttendanceCorrection
  const empMap = useMemo(() => {
    const m = {};
    (allEmployees ?? []).forEach((e) => { m[String(e.id)] = e; });
    return m;
  }, [allEmployees]);

  useEffect(() => {
    loadEmployees();
    fetchEmployees(); // ✅ fetch untuk data foto
    return () => resetAttendance();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      setPage(1);
      loadAttendance(selectedEmployee);
    } else {
      resetAttendance();
    }
  }, [selectedEmployee]);

  const filtered = useMemo(() => {
    const sorted = [...attendances].sort((a, b) => {
      const da = new Date(a.date ?? a.checkIn ?? 0);
      const db = new Date(b.date ?? b.checkIn ?? 0);
      return db - da;
    });
    return sorted.filter((item) => {
      const empName = (item.employee?.name ?? item.employeeName ?? '').toLowerCase();
      const matchSearch = !search || empName.includes(search.toLowerCase());
      const matchStatus = !filterStatus || item.status?.toUpperCase() === filterStatus;
      const matchDate = !filterDate || (item.date ?? '').startsWith(filterDate);
      return matchSearch && matchStatus && matchDate;
    });
  }, [attendances, search, filterStatus, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectedObj = attendanceEmployees.find((e) => String(e.id) === String(selectedEmployee));

  const handleReset = useCallback(() => {
    setSelectedEmployee(''); setFilterStatus(''); setFilterDate(''); setSearch(''); setPage(1);
  }, []);

  const hasFilter = selectedEmployee || filterStatus || filterDate || search;
  const COLUMNS = ['No', 'Karyawan', 'Tanggal', 'Check In', 'Check Out', 'Durasi', 'Tipe', 'Lokasi', 'Status', 'Aksi'];

  return (
    <div className="space-y-5 px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance List</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat absensi karyawan — terbaru di atas</p>
        </div>
        <button
          onClick={() => selectedEmployee && loadAttendance(selectedEmployee)}
          disabled={!selectedEmployee || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start sm:self-auto"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <EmployeeDropdown
            employees={attendanceEmployees}
            loadingEmployees={loadingEmployees}
            selectedEmployee={selectedEmployee}
            onChange={setSelectedEmployee}
          />
          <div className="relative flex-1 min-w-[160px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
            <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {hasFilter && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>

        {/* Selected employee info */}
        {selectedObj && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-lg">
              <HiOutlineUser className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">{selectedObj.name}</span>
            </div>
            {selectedObj.employeeIdentificationNumber && (
              <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono">
                NIK: {selectedObj.employeeIdentificationNumber}
              </div>
            )}
            {selectedObj.departmentName && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg">
                <HiOutlineOfficeBuilding className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">{selectedObj.departmentName}</span>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-500">
                {filtered.length} record
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">
            <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" />
            {typeof error === 'string' ? error : 'Gagal memuat data. Coba refresh.'}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {COLUMNS.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !selectedEmployee ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                    <HiOutlineUser className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Pilih karyawan untuk melihat riwayat absensi</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                    <HiOutlineClock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data absensi</p>
                    {(filterStatus || filterDate || search) && (
                      <button
                        onClick={() => { setFilterStatus(''); setFilterDate(''); setSearch(''); }}
                        className="mt-2 text-xs text-indigo-600 hover:underline block mx-auto"
                      >
                        Hapus filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const empName  = item.employee?.name ?? item.employeeName ?? '-';
                  const deptName = item.employee?.departmentName ?? item.departmentName ?? item.employee?.department?.name ?? '';
                  const initial  = empName !== '-' ? empName.charAt(0).toUpperCase() : '?';
                  const lat      = item.latitude ?? null;
                  const lng      = item.longitude ?? null;
                  const workType = item.attendanceType ?? null;
                  const lngFmt   = formatCoord(lng);
                  const mapsUrl  = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

                  // ✅ Ambil foto dari empMap — sama persis pola AttendanceCorrection
                  const empId    = item.employee?.id ?? item.employeeId ?? null;
                  const empData  = empId ? empMap[String(empId)] : null;
                  const empPhoto = getEmpPhoto(empData);

                  return (
                    <tr key={item.id ?? idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 tabular-nums text-xs">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {/* ✅ Avatar foto di table row — sama persis pola AttendanceCorrection */}
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-100">
                            {empPhoto ? (
                              <img
                                src={empPhoto}
                                alt={empName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full bg-indigo-100 items-center justify-center text-indigo-600 font-semibold text-xs"
                              style={{ display: empPhoto ? 'none' : 'flex' }}
                            >
                              {initial}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight text-sm">{empName}</p>
                            {deptName && <p className="text-xs text-gray-400">{deptName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-sm">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap tabular-nums text-sm">
                        {formatTime(item.checkIn)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap tabular-nums text-sm">
                        {formatTime(item.checkOut)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-sm">
                        {calcDuration(item.checkIn, item.checkOut)}
                      </td>
                      <td className="px-4 py-3.5">
                        {workType ? <WorkTypeBadge type={workType} /> : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {lngFmt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs text-gray-600">{lngFmt}</span>
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
                              >
                                <HiOutlineLocationMarker className="w-3 h-3" />Maps
                              </a>
                            )}
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5" />Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && paginated.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan <span className="font-medium text-gray-700">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span>
              {' '}dari <span className="font-medium text-gray-700">{filtered.length}</span> data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${p === page ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Detail Modal — pass empPhoto dari empMap, sama persis pola AttendanceCorrection */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          empPhoto={getEmpPhoto(
            empMap[String(detailItem.employee?.id ?? detailItem.employeeId ?? '')]
          )}
        />
      )}
    </div>
  );
};

export default AttendanceList;

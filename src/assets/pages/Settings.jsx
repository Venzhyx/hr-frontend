import React, { useState, useEffect } from 'react';
import {
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineLocationMarker,
  HiOutlineHome,
} from 'react-icons/hi';
import { useAttendanceSettings } from '../../redux/hooks/useAttendanceSettings';
import { useCalendarEvent }      from '../../redux/hooks/useCalendarEvent';
import { useTimeOffType }        from '../../redux/hooks/useTimeOffType';

// ─── Enums ────────────────────────────────────────────────────────────────────
const EXTRA_HOURS_OPTIONS = [
  { value: 'AUTOMATICALLY_APPROVED', label: 'Automatically Approved' },
  { value: 'APPROVED_BY_MANAGER',    label: 'By Manager' },
];
const EVENT_TYPE_OPTIONS = [
  { value: 'NATIONAL_HOLIDAY',     label: 'National Holiday' },
  { value: 'COLLECTIVE_LEAVE_DAY', label: 'Collective Leave Day' },
];
const TIME_OFF_TYPE_OPTIONS = [
  { value: 'LEAVE',      label: 'Leave' },
  { value: 'PERMISSION', label: 'Permission' },
];
const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Radius preset options (meter)
const RADIUS_PRESETS = [50, 100, 200, 500, 1000];

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
  </button>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.25rem',
};

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
  }`}>
    {type === 'success'
      ? <HiOutlineCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
      : <HiOutlineExclamation className="w-5 h-5 text-red-600 flex-shrink-0" />}
    {message}
    <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600"><HiOutlineX className="w-4 h-4" /></button>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <p className="text-sm text-red-500">{message}</p>
    {onRetry && (
      <button onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
        <HiOutlineRefresh className="w-4 h-4" /> Retry
      </button>
    )}
  </div>
);

const DeleteConfirm = ({ name, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <HiOutlineTrash className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
      </div>
      <p className="text-sm text-gray-600 mb-5">Delete <span className="font-semibold">{name}</span>? This cannot be undone.</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm">Delete</button>
      </div>
    </div>
  </div>
);

const TimeSelect = ({ value, onChange }) => {
  const parts  = (value || '00:00').split(':');
  const hour   = parts[0] ?? '00';
  const minute = parts[1] ?? '00';
  return (
    <div className="flex items-center gap-2">
      <select value={hour} onChange={e => onChange(`${e.target.value}:${minute}`)}
        className={`${inputCls} w-24 appearance-none`} style={selectStyle}>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-500 font-semibold">:</span>
      <select value={minute} onChange={e => onChange(`${hour}:${e.target.value}`)}
        className={`${inputCls} w-24 appearance-none`} style={selectStyle}>
        {['00', '15', '30', '45'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <span className="text-sm text-gray-500 font-medium">WIB</span>
    </div>
  );
};

// ─── Attendance Settings ───────────────────────────────────────────────────────
const AttendanceSettings = ({ showToast }) => {
  const { settings, loading, saving, error, fetchSettings, updateSettings } = useAttendanceSettings();

  const [form, setForm] = useState({
    toleranceTimeInFavorOfEmployee: 0,
    extraHoursValidation:           'APPROVED_BY_MANAGER',
    checkInTime:                    '08:00',
    checkOutTime:                   '17:00',
    wfoRadius:                      100,
    wfhRadius:                      100,   // ← WFH Radius
  });

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => {
    if (settings) {
      setForm({
        toleranceTimeInFavorOfEmployee: settings.toleranceTimeInFavorOfEmployee ?? 0,
        extraHoursValidation:           settings.extraHoursValidation ?? 'APPROVED_BY_MANAGER',
        checkInTime:  (settings.checkInTime  ?? '08:00:00').slice(0, 5),
        checkOutTime: (settings.checkOutTime ?? '17:00:00').slice(0, 5),
        wfoRadius:    settings.wfoRadius ?? 100,
        wfhRadius:    settings.wfhRadius ?? 100,   // ← WFH Radius
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const result = await updateSettings({
      toleranceTimeInFavorOfEmployee: Number(form.toleranceTimeInFavorOfEmployee),
      extraHoursValidation:           form.extraHoursValidation,
      checkInTime:                    form.checkInTime,
      checkOutTime:                   form.checkOutTime,
      wfoRadius:                      Number(form.wfoRadius),
      wfhRadius:                      Number(form.wfhRadius),   // ← WFH Radius
    });
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Attendance settings saved', 'success');
    } else {
      showToast(result.payload || 'Failed to save', 'error');
    }
  };

  if (loading) return <SectionCard title="Attendance Settings"><Spinner /></SectionCard>;
  if (error)   return <SectionCard title="Attendance Settings"><ErrorBox message={error} onRetry={fetchSettings} /></SectionCard>;

  // Visual radius ring preview (scale: max 500m → 120px)
  const wfoPreviewPx = Math.min(Math.max((form.wfoRadius / 500) * 120, 20), 120);
  const wfhPreviewPx = Math.min(Math.max((form.wfhRadius / 500) * 120, 20), 120);

  return (
    <div className="space-y-6">

      {/* ── Extra Hours ── */}
      <SectionCard title="Extra Hours">
        <div className="space-y-5 max-w-lg">
          <div>
            <label className={labelCls}>
              Tolerance Time in Favor of Employee
              <span className="ml-1 text-gray-400 font-normal">(minutes)</span>
            </label>
            <input type="number" min={0} max={120}
              value={form.toleranceTimeInFavorOfEmployee}
              onChange={e => setForm(f => ({ ...f, toleranceTimeInFavorOfEmployee: e.target.value }))}
              className={`${inputCls} w-40`} />
            <p className="mt-1 text-xs text-gray-400">Grace period before overtime is counted against the employee.</p>
          </div>
          <div>
            <label className={labelCls}>Extra Hours Validation</label>
            <select value={form.extraHoursValidation}
              onChange={e => setForm(f => ({ ...f, extraHoursValidation: e.target.value }))}
              className={`${inputCls} w-64 appearance-none`} style={selectStyle}>
              {EXTRA_HOURS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              {form.extraHoursValidation === 'AUTOMATICALLY_APPROVED'
                ? 'Extra hours are approved automatically without manager review.'
                : 'Extra hours require manager approval before being counted.'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Work Hours ── */}
      <SectionCard title="Work Hours">
        <div className="space-y-6 max-w-lg">
          <div>
            <label className={labelCls}>Default Check-in Time</label>
            <TimeSelect value={form.checkInTime} onChange={v => setForm(f => ({ ...f, checkInTime: v }))} />
            <p className="mt-1 text-xs text-gray-400">
              Setelah jam ini, tombol absen akan tampil sebagai <span className="font-medium text-gray-600">Check-in</span>.
            </p>
          </div>
          <div>
            <label className={labelCls}>Default Check-out Time</label>
            <TimeSelect value={form.checkOutTime} onChange={v => setForm(f => ({ ...f, checkOutTime: v }))} />
            <p className="mt-1 text-xs text-gray-400">
              Setelah jam ini, tombol absen akan berubah menjadi <span className="font-medium text-gray-600">Check-out</span>.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── WFO Radius ── */}
      <SectionCard title="WFO Location Radius">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: controls */}
          <div className="flex-1 space-y-5 max-w-sm">
            <div>
              <label className={labelCls}>
                Radius Check-in WFO
                <span className="ml-1 text-gray-400 font-normal">(meter)</span>
              </label>

              {/* Number input */}
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={form.wfoRadius}
                  onChange={e => setForm(f => ({ ...f, wfoRadius: e.target.value }))}
                  className={`${inputCls} w-40`}
                />
                <span className="text-sm text-gray-500">meter</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={form.wfoRadius}
                onChange={e => setForm(f => ({ ...f, wfoRadius: Number(e.target.value) }))}
                className="w-full mt-3 accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>10 m</span>
                <span>2000 m</span>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {RADIUS_PRESETS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, wfoRadius: r }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      Number(form.wfoRadius) === r
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Karyawan yang check-in WFO dengan jarak lebih dari{' '}
                <span className="font-semibold text-gray-600">
                  {form.wfoRadius >= 1000 ? `${form.wfoRadius / 1000} km` : `${form.wfoRadius} m`}
                </span>{' '}
                dari lokasi kantor akan mendapat peringatan.
              </p>
            </div>
          </div>

          {/* Right: visual ring preview */}
          <div className="flex flex-col items-center justify-center gap-3 min-w-[180px]">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preview</p>
            <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
              <div
                className="absolute rounded-full border-2 border-dashed border-indigo-300 bg-indigo-50/40 transition-all duration-300"
                style={{ width: wfoPreviewPx * 2, height: wfoPreviewPx * 2 }}
              />
              <div className="relative z-10 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <HiOutlineLocationMarker className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Radius: <span className="font-semibold text-indigo-600">
                {form.wfoRadius >= 1000 ? `${form.wfoRadius / 1000} km` : `${form.wfoRadius} m`}
              </span>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── WFH Radius ── */}
      <SectionCard title="WFH Location Radius">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: controls */}
          <div className="flex-1 space-y-5 max-w-sm">
            <div>
              <label className={labelCls}>
                Radius Check-in WFH
                <span className="ml-1 text-gray-400 font-normal">(meter)</span>
              </label>

              {/* Number input */}
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={form.wfhRadius}
                  onChange={e => setForm(f => ({ ...f, wfhRadius: e.target.value }))}
                  className={`${inputCls} w-40`}
                />
                <span className="text-sm text-gray-500">meter</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={form.wfhRadius}
                onChange={e => setForm(f => ({ ...f, wfhRadius: Number(e.target.value) }))}
                className="w-full mt-3 accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>10 m</span>
                <span>2000 m</span>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {RADIUS_PRESETS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, wfhRadius: r }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      Number(form.wfhRadius) === r
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Karyawan yang check-in WFH dengan jarak lebih dari{' '}
                <span className="font-semibold text-gray-600">
                  {form.wfhRadius >= 1000 ? `${form.wfhRadius / 1000} km` : `${form.wfhRadius} m`}
                </span>{' '}
                dari alamat rumah akan mendapat peringatan.
              </p>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <HiOutlineHome className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold">Catatan:</strong> Pastikan setiap karyawan telah mengisi 
                    alamat rumah (homeAddress) pada profile mereka. Jika belum diisi, validasi WFH akan dilewati.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: visual ring preview */}
          <div className="flex flex-col items-center justify-center gap-3 min-w-[180px]">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preview</p>
            <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
              <div
                className="absolute rounded-full border-2 border-dashed border-green-300 bg-green-50/40 transition-all duration-300"
                style={{ width: wfhPreviewPx * 2, height: wfhPreviewPx * 2 }}
              />
              <div className="relative z-10 w-9 h-9 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                <HiOutlineHome className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Radius: <span className="font-semibold text-green-600">
                {form.wfhRadius >= 1000 ? `${form.wfhRadius / 1000} km` : `${form.wfhRadius} m`}
              </span>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Save ── */}
      <div className="flex justify-start">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Calendar Settings ────────────────────────────────────────────────────────
const CalendarSettings = ({ showToast }) => {
  const { events, loading, saving, error, fetchEvents, createEvent, updateEvent, deleteEvent } = useCalendarEvent();
  const [showModal, setShowModal]       = useState(false);
  const [editEvent, setEditEvent]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ eventDate: '', eventName: '', eventType: 'NATIONAL_HOLIDAY' });

  useEffect(() => { fetchEvents(); }, []);

  const openAdd  = () => { setEditEvent(null); setForm({ eventDate: '', eventName: '', eventType: 'NATIONAL_HOLIDAY' }); setShowModal(true); };
  const openEdit = (ev) => { setEditEvent(ev); setForm({ eventDate: ev.eventDate ?? '', eventName: ev.eventName ?? '', eventType: ev.eventType ?? 'NATIONAL_HOLIDAY' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.eventDate || !form.eventName.trim()) return;
    const result = editEvent ? await updateEvent(editEvent.id, form) : await createEvent(form);
    if (result.meta.requestStatus === 'fulfilled') { showToast(editEvent ? 'Event updated' : 'Event added', 'success'); setShowModal(false); }
    else showToast(result.payload || 'Failed to save', 'error');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteEvent(deleteTarget.id);
    if (result.meta.requestStatus === 'fulfilled') { showToast('Event deleted', 'success'); setDeleteTarget(null); }
    else showToast(result.payload || 'Failed to delete', 'error');
  };

  const TYPE_BADGE = { NATIONAL_HOLIDAY: 'bg-red-100 text-red-700', COLLECTIVE_LEAVE_DAY: 'bg-blue-100 text-blue-700' };
  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <>
      <SectionCard title="Calendar Events">
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={fetchEvents} /> : (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <HiOutlinePlus className="w-4 h-4" /> Add Event
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date','Event Name','Type','Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.length === 0
                    ? <tr><td colSpan={4} className="py-10 text-center text-gray-400">No events. Click "Add Event" to get started.</td></tr>
                    : events.map(ev => (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap text-gray-700 font-medium">{formatDate(ev.eventDate)}</td>
                        <td className="px-5 py-3 text-gray-800">{ev.eventName}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[ev.eventType] || 'bg-gray-100 text-gray-600'}`}>
                            {EVENT_TYPE_OPTIONS.find(o => o.value === ev.eventType)?.label || ev.eventType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(ev)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(ev)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{editEvent ? 'Edit Event' : 'Add Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelCls}>Date</label><input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Event Name</label><input type="text" placeholder="e.g. Independence Day" value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} className={`${inputCls} appearance-none`} style={selectStyle}>
                  {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={!form.eventDate || !form.eventName.trim() || saving} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                {saving ? 'Saving…' : editEvent ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && <DeleteConfirm name={deleteTarget.eventName} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
};

// ─── Time Off Settings ────────────────────────────────────────────────────────
const TimeOffSettings = ({ showToast }) => {
  const { types, loading, saving, error, fetchTypes, createType, updateType, deleteType } = useTimeOffType();
  const [showModal, setShowModal]       = useState(false);
  const [editType, setEditType]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'LEAVE', maxDaysPerSubmission: 1, status: 'ACTIVE' });

  useEffect(() => { fetchTypes(); }, []);

  const openAdd  = () => { setEditType(null); setForm({ name: '', type: 'LEAVE', maxDaysPerSubmission: 1, status: 'ACTIVE' }); setShowModal(true); };
  const openEdit = (t) => { setEditType(t); setForm({ name: t.name ?? '', type: t.type ?? 'LEAVE', maxDaysPerSubmission: t.maxDaysPerSubmission ?? 1, status: t.status ?? 'ACTIVE' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), type: form.type, maxDaysPerSubmission: Number(form.maxDaysPerSubmission), status: form.status };
    const result  = editType ? await updateType(editType.id, payload) : await createType(payload);
    if (result.meta.requestStatus === 'fulfilled') { showToast(editType ? 'Time off type updated' : 'Time off type added', 'success'); setShowModal(false); }
    else showToast(result.payload || 'Failed to save', 'error');
  };

  const handleToggleStatus = async (t) => {
    const newStatus = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const result = await updateType(t.id, { name: t.name, type: t.type, maxDaysPerSubmission: t.maxDaysPerSubmission, status: newStatus });
    if (result.meta.requestStatus === 'rejected') showToast(result.payload || 'Failed to update status', 'error');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteType(deleteTarget.id);
    if (result.meta.requestStatus === 'fulfilled') { showToast('Time off type deleted', 'success'); setDeleteTarget(null); }
    else showToast(result.payload || 'Failed to delete', 'error');
  };

  return (
    <>
      <SectionCard title="Time Off Types">
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={fetchTypes} /> : (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <HiOutlinePlus className="w-4 h-4" /> Add Type
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Time Off Type','Type','Max Days','Status','Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {types.length === 0
                    ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">No time off types. Click "Add Type" to get started.</td></tr>
                    : types.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{t.name}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.type === 'LEAVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                            {TIME_OFF_TYPE_OPTIONS.find(o => o.value === t.type)?.label || t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{t.maxDaysPerSubmission} days</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle checked={t.status === 'ACTIVE'} onChange={() => handleToggleStatus(t)} />
                            <span className={`text-xs font-medium ${t.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`}>
                              {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(t)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{editType ? 'Edit Time Off Type' : 'Add Time Off Type'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelCls}>Time Off Type Name</label><input type="text" placeholder="e.g. Annual Leave" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`${inputCls} appearance-none`} style={selectStyle}>
                  {TIME_OFF_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Max Days / Submission</label><input type="number" min={1} max={365} value={form.maxDaysPerSubmission} onChange={e => setForm(f => ({ ...f, maxDaysPerSubmission: e.target.value }))} className={`${inputCls} w-40`} /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={`${inputCls} w-40 appearance-none`} style={selectStyle}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim() || saving} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                {saving ? 'Saving…' : editType ? 'Save Changes' : 'Add Type'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────
const MENU = [
  { key: 'attendance', label: 'Attendance', icon: <HiOutlineClock className="w-5 h-5" /> },
  { key: 'calendar',   label: 'Calendar',   icon: <HiOutlineCalendar className="w-5 h-5" /> },
  { key: 'timeoff',    label: 'Time Off',   icon: <HiOutlineBriefcase className="w-5 h-5" /> },
];
const TITLES = {
  attendance: 'Attendance Settings',
  calendar:   'Calendar Settings',
  timeoff:    'Time Off Settings',
};

export default function Settings() {
  const [active, setActive] = useState('attendance');
  const [toast,  setToast]  = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 pt-6">
        <p className="px-5 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settings</p>
        <nav className="px-3 space-y-0.5">
          {MENU.map(item => (
            <button key={item.key} onClick={() => setActive(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active === item.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}>
              <span className={active === item.key ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{TITLES[active]}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure {TITLES[active].toLowerCase()} preferences</p>
        </div>
        {active === 'attendance' && <AttendanceSettings showToast={showToast} />}
        {active === 'calendar'   && <CalendarSettings  showToast={showToast} />}
        {active === 'timeoff'    && <TimeOffSettings   showToast={showToast} />}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
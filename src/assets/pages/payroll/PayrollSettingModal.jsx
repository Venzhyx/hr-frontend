import React, { useEffect, useState, useCallback } from 'react';
import { HiOutlineCog, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import PayrollModal from '../../components/PayrollModal';
import { payrollApi } from '../../../ApiService/payrollApi';

/**
 * Modal untuk membaca & mengupdate PayrollSetting
 * (absentDeductionPerDay & lateDeductionPerDay).
 *
 * Props:
 *   open     : boolean  – tampilkan modal
 *   onClose  : () => void
 */
const PayrollSettingModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    absentDeductionPerDay: '',
    lateDeductionPerDay: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ─── Fetch saat modal dibuka ───────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await payrollApi.getPayrollSettings();
      const data = res?.data ?? res;
      setForm({
        absentDeductionPerDay: data.absentDeductionPerDay ?? '',
        lateDeductionPerDay:   data.lateDeductionPerDay   ?? '',
      });
      setLastUpdated(data.updatedAt ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Gagal memuat pengaturan payroll.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchSettings();
  }, [open, fetchSettings]);

  // ─── Handler ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Hanya angka positif
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const absent = parseFloat(form.absentDeductionPerDay);
    const late   = parseFloat(form.lateDeductionPerDay);

    if (!absent || absent <= 0) {
      setError('Potongan absen harus lebih dari 0.'); return;
    }
    if (!late || late <= 0) {
      setError('Potongan terlambat harus lebih dari 0.'); return;
    }

    setSaving(true);
    try {
      const res = await payrollApi.updatePayrollSettings({
        absentDeductionPerDay: absent,
        lateDeductionPerDay:   late,
      });
      const data = res?.data ?? res;
      setLastUpdated(data.updatedAt ?? null);
      setSuccess(true);
      // Auto-tutup setelah 1.2 detik
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Format tanggal ───────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ─── Format IDR preview ───────────────────────────────────────────────────
  const toIDR = (val) => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return '—';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <PayrollModal open={open} onClose={onClose} title="Pengaturan Payroll" size="md">
      {/* Subtitle */}
      <p className="text-xs text-gray-400 -mt-1 mb-5">
        Nilai potongan ini diterapkan secara otomatis saat payroll run dijalankan.
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
                            text-red-700 text-sm px-4 py-3 rounded-xl">
              <HiOutlineExclamationCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200
                            text-green-700 text-sm px-4 py-3 rounded-xl">
              <HiOutlineCheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}

          {/* Field: Absent */}
          <SettingField
            label="Potongan Absen per Hari"
            name="absentDeductionPerDay"
            value={form.absentDeductionPerDay}
            onChange={handleChange}
            preview={toIDR(form.absentDeductionPerDay)}
            hint="Dipotong dari gaji karyawan setiap hari berstatus ABSENT"
          />

          {/* Field: Late */}
          <SettingField
            label="Potongan Terlambat per Hari"
            name="lateDeductionPerDay"
            value={form.lateDeductionPerDay}
            onChange={handleChange}
            preview={toIDR(form.lateDeductionPerDay)}
            hint="Dipotong dari gaji karyawan setiap hari berstatus LATE"
          />

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-xs text-gray-400 text-right">
              Terakhir diperbarui: {formatDate(lastUpdated)}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 font-medium border border-gray-200
                         rounded-xl hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700
                         text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white
                                   rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : success ? (
                <>
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Tersimpan
                </>
              ) : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      )}
    </PayrollModal>
  );
};

// ─── Sub-komponen: satu baris input + preview IDR ─────────────────────────────
const SettingField = ({ label, name, value, onChange, preview, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium
                       pointer-events-none select-none">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder="0"
        className="w-full border border-gray-200 rounded-xl pl-9 pr-28 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      {/* IDR preview chip */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400
                       bg-gray-100 px-2 py-0.5 rounded-lg font-mono tabular-nums truncate max-w-[6.5rem]">
        {preview}
      </span>
    </div>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export default PayrollSettingModal;

// src/components/attendance/WfhRadiusWarning.jsx
import React, { useEffect, useState } from 'react';
import {
  HiOutlineCheckCircle, HiOutlineExclamation,
  HiOutlineRefresh, HiOutlineHome, HiOutlineShieldExclamation,
} from 'react-icons/hi';
import useWFHRadiusCheck, { formatDistance } from '../../redux/hooks/useWFHRadiusCheck';

const WfhRadiusWarning = ({ onResult, allowOutside = true }) => {
  const {
    checkLocation, reset, status, distance, errorMsg,
    wfhRadius, homeLocation, gpsForensics,
    isChecking, isInside, isOutside, isError, noHomeCoords,
  } = useWFHRadiusCheck();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    handleCheck();
    return () => reset();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheck = async () => {
    setChecked(false);
    const result = await checkLocation();
    setChecked(true);
    onResult?.(result);
  };

  // ── Loading / Checking ────────────────────────────────────────────────────
  if (!checked || isChecking) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div>
          <p className="font-medium">Memverifikasi lokasi...</p>
          <p className="text-xs text-blue-500 mt-0.5">Mengambil 3 sample GPS untuk validasi</p>
        </div>
      </div>
    );
  }

  // ── Koordinat rumah belum diisi ───────────────────────────────────────────
  if (noHomeCoords) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
        <HiOutlineHome className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
        <div className="flex-1">
          <p className="font-medium">Koordinat rumah belum diatur</p>
          <p className="text-yellow-600 mt-0.5 text-xs">
            Silakan update profile Anda dengan mengisi alamat rumah lengkap.
          </p>
        </div>
        <button onClick={handleCheck} className="text-yellow-500 hover:text-yellow-700 flex-shrink-0">
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── GPS error ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
        <HiOutlineExclamation className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
        <div className="flex-1 text-sm text-orange-700">
          <p className="font-medium">GPS tidak tersedia</p>
          <p className="text-orange-500 mt-0.5 text-xs">
            {errorMsg} — Validasi lokasi dilewati, check-in tetap bisa dilakukan.
          </p>
        </div>
        <button onClick={handleCheck} className="text-orange-500 hover:text-orange-700 flex-shrink-0">
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Fake GPS terdeteksi ───────────────────────────────────────────────────
  // Tampilkan pesan berbeda dari "di luar radius" biasa
  if (isOutside && gpsForensics?.isSuspicious) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-300 rounded-xl">
          <HiOutlineExclamation className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Lokasi tidak dapat diverifikasi</p>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              Sistem mendeteksi anomali pada data GPS. Pastikan tidak ada aplikasi
              pemalsuan lokasi yang aktif di perangkat Anda.
            </p>
            {/* Tampilkan indikator teknis tapi dalam bahasa sederhana */}
            <div className="mt-2 flex flex-wrap gap-1">
              {gpsForensics.reasons.includes('coordinates_perfectly_static') && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Sinyal GPS tidak bergerak
                </span>
              )}
              {gpsForensics.reasons.some(r => r.startsWith('accuracy_too_perfect')) && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Akurasi tidak wajar
                </span>
              )}
              {gpsForensics.reasons.includes('no_altitude_with_high_accuracy') && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Data GPS tidak lengkap
                </span>
              )}
            </div>
          </div>
          <button onClick={handleCheck} className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5" title="Cek ulang">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 px-1">
          ⚠ Nonaktifkan aplikasi fake GPS, lalu tekan refresh untuk mencoba lagi.
        </p>
      </div>
    );
  }

  // ── Di dalam radius (GPS valid) ───────────────────────────────────────────
  if (isInside) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
        <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
        <div className="flex-1 text-sm text-green-700">
          <p className="font-medium">Kamu berada di sekitar rumah ✓</p>
          <p className="text-green-500 mt-0.5">
            Jarak ke rumah: <span className="font-semibold">{formatDistance(distance)}</span>
            {' · '}Radius WFH: <span className="font-semibold">{formatDistance(wfhRadius)}</span>
          </p>
          {gpsForensics && (
            <p className="text-green-400 text-xs mt-0.5">
              Akurasi GPS: ±{gpsForensics.avgAccuracy?.toFixed(0)}m
            </p>
          )}
        </div>
        <button onClick={handleCheck} className="text-green-500 hover:text-green-700 flex-shrink-0">
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Di luar radius (GPS valid, bukan fake) ────────────────────────────────
  if (isOutside) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl">
          <HiOutlineExclamation className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Kamu berada di luar radius WFH</p>
            <p className="text-xs text-amber-600 mt-1 leading-relaxed">
              Jarakmu ke rumah adalah{' '}
              <span className="font-bold text-amber-800">{formatDistance(distance)}</span>, sedangkan
              radius WFH yang diizinkan hanya{' '}
              <span className="font-bold text-amber-800">{formatDistance(wfhRadius)}</span>.
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-amber-600 mb-1">
                <span>Rumah</span>
                <span>{formatDistance(distance)}</span>
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((wfhRadius / distance) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <button onClick={handleCheck} className="text-amber-500 hover:text-amber-700 flex-shrink-0 mt-0.5">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
        {allowOutside && (
          <p className="text-xs text-gray-400 px-1">
            ⚠ Check-in WFH tetap bisa dilakukan, namun akan tercatat sebagai{' '}
            <span className="font-medium text-gray-600">di luar radius WFH</span>.
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default WfhRadiusWarning;
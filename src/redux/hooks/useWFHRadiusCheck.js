// src/redux/hooks/useWFHRadiusCheck.js
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return '-';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

// ── Fake GPS detection ────────────────────────────────────────────────────────
const analyzeSamplesForFakeGPS = (samples) => {
  const reasons = [];

  // 1. Semua koordinat identik sempurna di semua sample
  //    GPS asli selalu ada noise kecil, tidak pernah pixel-perfect sama
  const allLatIdentical = samples.every(s => s.lat === samples[0].lat);
  const allLngIdentical = samples.every(s => s.lng === samples[0].lng);
  if (allLatIdentical && allLngIdentical && samples.length >= 2) {
    reasons.push('coordinates_perfectly_static');
    console.warn('🚨 [FakeGPS] Koordinat identik di semua sample — kemungkinan fake GPS app');
  }

  // 2. Accuracy terlalu sempurna
  //    GPS asli di HP: outdoor 5–20m, indoor 20–100m
  //    Fake GPS app biasanya set 1m atau 0m
  const avgAccuracy = samples.reduce((s, x) => s + x.accuracy, 0) / samples.length;
  if (avgAccuracy < 5) {
    reasons.push(`accuracy_too_perfect:${avgAccuracy.toFixed(1)}m`);
    console.warn('🚨 [FakeGPS] Accuracy terlalu sempurna:', avgAccuracy.toFixed(1), 'm');
  }

  // 3. Tidak ada altitude tapi accuracy sangat tinggi
  //    Ciri khas emulator Android dan beberapa fake GPS app
  const noAltitude = samples.every(s => s.altitude === null || s.altitude === undefined);
  if (noAltitude && avgAccuracy < 10) {
    reasons.push('no_altitude_with_high_accuracy');
    console.warn('🚨 [FakeGPS] Altitude null tapi accuracy < 10m — ciri emulator/fake GPS');
  }

  // Butuh minimal 2 indikator untuk dianggap suspicious
  // Supaya tidak false positive pada kondisi edge case GPS biasa
  const isSuspicious = reasons.length >= 2;

  console.group('📊 [WFH] GPS Forensics Analysis');
  console.log('Total samples  :', samples.length);
  console.log('All lat same   :', allLatIdentical);
  console.log('All lng same   :', allLngIdentical);
  console.log('Avg accuracy   :', avgAccuracy.toFixed(1), 'm');
  console.log('No altitude    :', noAltitude);
  console.log('Reasons found  :', reasons.length > 0 ? reasons : 'none');
  console.log('Is suspicious  :', isSuspicious ? '🚨 YES — likely fake GPS' : '✅ NO — looks real');
  console.table(samples.map((s, i) => ({
    sample:   i + 1,
    lat:      s.lat,
    lng:      s.lng,
    accuracy: s.accuracy + 'm',
    altitude: s.altitude ?? 'null',
  })));
  console.groupEnd();

  return { isSuspicious, reasons, avgAccuracy };
};

// ── Ambil N sample GPS berurutan ──────────────────────────────────────────────
const collectGPSSamples = (count = 3, delayMs = 700) => {
  return new Promise((resolve, reject) => {
    const samples = [];
    console.log(`🛰️ [WFH] Mengambil ${count} sample GPS (jeda ${delayMs}ms)...`);

    const takeSample = (attempt) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const sample = {
            lat:      position.coords.latitude,
            lng:      position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed:    position.coords.speed,
            ts:       Date.now(),
          };
          samples.push(sample);
          console.log(`📍 [WFH] Sample ${attempt + 1}/${count}:`, {
            lat:      sample.lat.toFixed(7),
            lng:      sample.lng.toFixed(7),
            accuracy: sample.accuracy + 'm',
            altitude: sample.altitude ?? 'null',
          });

          if (samples.length < count) {
            setTimeout(() => takeSample(attempt + 1), delayMs);
          } else {
            resolve(samples);
          }
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    };

    takeSample(0);
  });
};

const useWFHRadiusCheck = () => {
  const [status,      setStatus]      = useState('idle');
  const [distance,    setDistance]    = useState(null);
  const [userPos,     setUserPos]     = useState(null);
  const [errorMsg,    setErrorMsg]    = useState(null);
  const [gpsForensics, setGpsForensics] = useState(null);

  const wfhRadius         = useSelector(s => s.attendanceSettings?.data?.wfhRadius ?? 100);
  const authEmployee      = useSelector(s => s.auth?.employee);
  const employeesEmployee = useSelector(s => s.employees?.selectedEmployee);
  const employee          = authEmployee || employeesEmployee;

  const homeLocation = (() => {
    if (employee?.homeLatitude && employee?.homeLongitude) {
      return {
        lat:     employee.homeLatitude,
        lng:     employee.homeLongitude,
        name:    'Rumah',
        address: employee.homeAddress || 'Alamat rumah',
      };
    }
    return null;
  })();

  const checkLocation = useCallback(() => {
    return new Promise(async (resolve) => {

      // ── Tidak ada koordinat rumah → skip, jangan blokir ──────────────────
      if (!homeLocation) {
        setStatus('no_home_coords');
        setErrorMsg('Koordinat rumah belum diatur. Silakan update profile Anda.');
        console.log('[WFH] Skip radius check — koordinat rumah belum diatur');
        resolve({ valid: true, skipped: true, reason: 'no_home_coordinates' });
        return;
      }

      // ── Browser tidak support GPS → skip ─────────────────────────────────
      if (!navigator.geolocation) {
        setStatus('error');
        setErrorMsg('Browser tidak mendukung GPS.');
        console.log('[WFH] Skip radius check — browser tidak support geolocation');
        resolve({ valid: true, skipped: true, reason: 'no_geolocation' });
        return;
      }

      setStatus('checking');
      setErrorMsg(null);

      try {
        // ── Ambil 3 sample GPS ────────────────────────────────────────────
        const samples = await collectGPSSamples(3, 700);

        // ── Analisis apakah fake GPS ──────────────────────────────────────
        const forensics = analyzeSamplesForFakeGPS(samples);
        setGpsForensics(forensics);

        const userLat = samples[0].lat;
        const userLng = samples[0].lng;
        const dist    = haversineDistance(userLat, userLng, homeLocation.lat, homeLocation.lng);

        setUserPos({ lat: userLat, lng: userLng });
        setDistance(dist);

        console.group('🏠 [WFH] Radius Check Result');
        console.log('User  :', { lat: userLat.toFixed(7), lng: userLng.toFixed(7) });
        console.log('Home  :', { lat: homeLocation.lat, lng: homeLocation.lng });
        console.log('Dist  :', dist.toFixed(1), 'm');
        console.log('Radius:', wfhRadius, 'm');
        console.log('Result:', dist <= wfhRadius ? '✅ INSIDE' : '❌ OUTSIDE');
        if (forensics.isSuspicious) {
          console.warn('🚨 FAKE GPS DETECTED — overriding result to OUTSIDE');
        }
        console.groupEnd();

        // ── Fake GPS → paksa outside meski koordinat "dalam radius" ──────
        if (forensics.isSuspicious) {
          setStatus('outside');
          resolve({
            valid:             false,
            withinRadius:      false,
            suspicious:        true,
            suspiciousReasons: forensics.reasons,
            distance:          dist,
            userLat,
            userLng,
            gpsForensics:      forensics,
            gpsSamples:        samples,
          });
          return;
        }

        // ── Normal flow ───────────────────────────────────────────────────
        if (dist <= wfhRadius) {
          setStatus('inside');
          resolve({
            valid:        true,
            withinRadius: true,
            suspicious:   false,
            distance:     dist,
            userLat,
            userLng,
            homeLocation,
            gpsForensics: forensics,
            gpsSamples:   samples,
          });
        } else {
          setStatus('outside');
          resolve({
            valid:        false,
            withinRadius: false,
            suspicious:   false,
            distance:     dist,
            userLat,
            userLng,
            radiusLimit:  wfhRadius,
            homeLocation,
            gpsForensics: forensics,
            gpsSamples:   samples,
          });
        }

      } catch (err) {
        // ── GPS error → skip, jangan blokir check-in ─────────────────────
        console.error('❌ [WFH] GPS error:', err.code, err.message);
        setStatus('error');
        const msg =
          err.code === 1 ? 'Akses lokasi ditolak. Izinkan akses GPS di browser.' :
          err.code === 2 ? 'Lokasi tidak tersedia saat ini.' :
          err.code === 3 ? 'Timeout: gagal mendapatkan lokasi.' :
                           'Gagal mendapatkan lokasi.';
        setErrorMsg(msg);
        // valid: true + skipped: true → tidak blokir tombol submit
        resolve({ valid: true, skipped: true, reason: 'gps_error', message: msg });
      }
    });
  }, [homeLocation, wfhRadius]);

  const reset = useCallback(() => {
    setStatus('idle');
    setDistance(null);
    setUserPos(null);
    setErrorMsg(null);
    setGpsForensics(null);
  }, []);

  return {
    checkLocation,
    reset,
    status,
    distance,
    userPos,
    errorMsg,
    wfhRadius,
    homeLocation,
    gpsForensics,
    isChecking:   status === 'checking',
    isInside:     status === 'inside',
    isOutside:    status === 'outside',
    isError:      status === 'error',
    noHomeCoords: status === 'no_home_coords',
  };
};

export default useWFHRadiusCheck;
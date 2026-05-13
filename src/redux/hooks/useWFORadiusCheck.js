// src/redux/hooks/useWFORadiusCheck.js
import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCompanies } from '../slices/companySlice'; // ✅ sesuaikan path jika perlu

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

const useWfoRadiusCheck = () => {
  const dispatch = useDispatch();

  const [status,   setStatus]   = useState('idle');
  const [distance, setDistance] = useState(null);
  const [userPos,  setUserPos]  = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const wfoRadius      = useSelector(s => s.attendanceSettings?.data?.wfoRadius ?? 100);
  const companies      = useSelector(s => s.companies?.list ?? []);
  const companyLoading = useSelector(s => s.companies?.loading ?? false);

  // ✅ Auto-fetch companies kalau list masih kosong saat hook pertama kali dipakai
  // Ini fix utama: sebelumnya companies hanya ter-load kalau user buka halaman Company
  useEffect(() => {
    if (companies.length === 0 && !companyLoading) {
      dispatch(fetchCompanies());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const officeLocation = (() => {
    const company = companies.find(c => c.latitude && c.longitude);
    if (!company) return null;
    return { lat: company.latitude, lng: company.longitude, name: company.companyName };
  })();

  const checkLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!officeLocation) {
        setStatus('idle');
        setErrorMsg('Koordinat kantor belum diatur. Hubungi admin.');
        resolve({ valid: true, skipped: true, reason: 'no_office_location' });
        return;
      }
      if (!navigator.geolocation) {
        setStatus('error');
        setErrorMsg('Browser tidak mendukung GPS.');
        resolve({ valid: false, reason: 'no_geolocation' });
        return;
      }

      setStatus('checking');
      setErrorMsg(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: userLat, longitude: userLng } = position.coords;
          const dist = haversineDistance(userLat, userLng, officeLocation.lat, officeLocation.lng);
          setUserPos({ lat: userLat, lng: userLng });
          setDistance(dist);
          if (dist <= wfoRadius) {
            setStatus('inside');
            resolve({ valid: true, distance: dist, userLat, userLng, withinRadius: true });
          } else {
            setStatus('outside');
            resolve({ valid: false, distance: dist, userLat, userLng, withinRadius: false, radiusLimit: wfoRadius, officeName: officeLocation.name });
          }
        },
        (err) => {
          setStatus('error');
          const msg =
            err.code === err.PERMISSION_DENIED    ? 'Akses lokasi ditolak. Izinkan akses GPS di browser.' :
            err.code === err.POSITION_UNAVAILABLE ? 'Lokasi tidak tersedia saat ini.' :
            err.code === err.TIMEOUT              ? 'Timeout: gagal mendapatkan lokasi.' :
                                                    'Gagal mendapatkan lokasi.';
          setErrorMsg(msg);
          resolve({ valid: false, reason: 'gps_error', message: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [officeLocation, wfoRadius]);

  const reset = useCallback(() => {
    setStatus('idle');
    setDistance(null);
    setUserPos(null);
    setErrorMsg(null);
  }, []);

  return {
    checkLocation,
    reset,
    status,
    distance,
    userPos,
    errorMsg,
    wfoRadius,
    officeLocation,
    companyLoading,
    isChecking:  status === 'checking',
    isInside:    status === 'inside',
    isOutside:   status === 'outside',
    isError:     status === 'error',
  };
};

export default useWfoRadiusCheck;
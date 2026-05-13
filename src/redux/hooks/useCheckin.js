// src/redux/hooks/useCheckIn.js
import { useState, useCallback } from "react";
import API from "../../ApiService/api";

export const useCheckIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult]   = useState(null);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung browser ini."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        }),
        (err) => reject(new Error(`Gagal mendapatkan lokasi: ${err.message}`)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const submitCheckIn = useCallback(async ({
    employeeId,
    photoBlob,
    location,
    capturedAt,
    workType,
    // ✅ Data forensik dari radius check — opsional
    gpsForensics = null,
    gpsSamples   = null,
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("employeeId",    employeeId);
      formData.append("photo",         photoBlob, `checkin_${employeeId}_${Date.now()}.jpg`);
      formData.append("checkInTime",   (capturedAt || new Date()).toISOString());
      formData.append("timezone",      Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (workType) formData.append("attendanceType", workType);

      // GPS koordinat
      if (location?.latitude  != null) formData.append("latitude",  String(location.latitude));
      if (location?.longitude != null) formData.append("longitude", String(location.longitude));
      if (location?.accuracy  != null) formData.append("accuracy",  String(location.accuracy));

      // ✅ Device info untuk audit
      formData.append("deviceInfo", JSON.stringify({
        userAgent:  navigator.userAgent,
        platform:   navigator.platform,
        language:   navigator.language,
        timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenRes:  `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
      }));

      // ✅ GPS forensics untuk deteksi fake GPS di backend
      if (gpsForensics) {
        formData.append("isSuspiciousGPS",    String(gpsForensics.isSuspicious));
        formData.append("suspiciousReasons",  JSON.stringify(gpsForensics.reasons ?? []));
        formData.append("gpsAvgAccuracy",     String(gpsForensics.avgAccuracy ?? 0));
      }

      // ✅ Raw samples untuk audit trail di backend
      if (gpsSamples) {
        formData.append("gpsSamples", JSON.stringify(gpsSamples));
      }

      console.group('[CheckIn] Submit');
      console.log('employeeId:', employeeId);
      console.log('GPS:', location ?? 'tidak ada');
      console.log('attendanceType:', workType);
      console.log('isSuspiciousGPS:', gpsForensics?.isSuspicious ?? false);
      if (gpsForensics?.isSuspicious) {
        console.warn('🚨 Suspicious GPS dikirim ke backend:', gpsForensics.reasons);
      }
      console.groupEnd();

      const res = await API.post("/attendances/check-in", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[CheckIn] Response:", res.status, res.data);

      const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      setResult(parsed);
      setSuccess(true);
      return parsed;
    } catch (err) {
      console.error("[CheckIn] Error:", err.response?.status, err.response?.data ?? err.message);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Gagal melakukan absensi.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setResult(null);
  }, []);

  return { loading, error, success, result, getLocation, submitCheckIn, reset };
};
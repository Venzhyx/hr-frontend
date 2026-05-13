// src/components/attendance/CheckInModal.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  HiOutlineCamera, HiOutlineLocationMarker, HiOutlineClock,
  HiOutlineRefresh, HiOutlineX, HiOutlineCheckCircle,
  HiOutlineExclamationCircle, HiOutlineUser, HiOutlineOfficeBuilding,
  HiOutlineHome, HiOutlineGlobe, HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
} from "react-icons/hi";
import { useCheckIn } from "../../redux/hooks/useCheckin";
import { useAttendance } from "../../redux/hooks/useAttendance";
import WfoRadiusWarning from '../components/WfoRadiusWarning';
import WfhRadiusWarning from '../components/WfhRadiusWarning';

// ─────────────────────────────────────────────────────────────────────────────
//  GPS FORENSICS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6_371_000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getOneSample = (timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation API tidak tersedia"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });

const stddev = (arr) => {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
};

const analyzeGpsSamples = (samples) => {
  const flags = [];
  let riskScore = 0;

  if (samples.length < 2) {
    flags.push("INSUFFICIENT_SAMPLES");
    return {
      flags,
      riskScore: 30,
      isSuspicious: false,
      sampleCount: samples.length,
      details: {},
    };
  }

  const lats       = samples.map((s) => s.lat);
  const lngs       = samples.map((s) => s.lng);
  const accuracies = samples.map((s) => s.accuracy ?? 9999);
  const timestamps = samples.map((s) => s.timestamp);

  const minAccuracy = Math.min(...accuracies);
  if (minAccuracy < 5) {
    flags.push("SUSPICIOUSLY_HIGH_ACCURACY");
    riskScore += 25;
  }

  const hasAltitude = samples.some((s) => s.altitude !== null && s.altitude !== 0);
  if (!hasAltitude) {
    flags.push("NO_ALTITUDE_DATA");
    riskScore += 15;
  }

  const latStd = stddev(lats);
  const lngStd = stddev(lngs);
  if (latStd === 0 && lngStd === 0) {
    flags.push("LOCATION_TOO_STABLE");
    riskScore += 15;
  }

  const uniqueTs = new Set(timestamps).size;
  if (uniqueTs < samples.length) {
    flags.push("IDENTICAL_TIMESTAMPS");
    riskScore += 20;
  }

  const accStd = stddev(accuracies);
  if (accStd < 0.01 && samples.length >= 3) {
    flags.push("ACCURACY_NEVER_CHANGES");
    riskScore += 20;
  }

  const allSpeedNull = samples.every((s) => s.speed === null || s.speed === 0);
  if (allSpeedNull && minAccuracy < 10) {
    flags.push("SPEED_ZERO_WITH_HIGH_ACCURACY");
    riskScore += 15;
  }

  const latDecimalLen = lats[0]?.toString().split(".")[1]?.length ?? 0;
  const lngDecimalLen = lngs[0]?.toString().split(".")[1]?.length ?? 0;
  if (latDecimalLen < 4 || lngDecimalLen < 4) {
    flags.push("COORDINATE_TOO_ROUND");
    riskScore += 20;
  }

  const ua = navigator.userAgent.toLowerCase();
  const emulatorKeywords = ["android sdk", "emulator", "bluestacks", "nox", "memu", "ldplayer"];
  if (emulatorKeywords.some((k) => ua.includes(k))) {
    flags.push("BROWSER_MOCK_LOCATION_HINT");
    riskScore += 40;
  }

  let totalDrift = 0;
  for (let i = 1; i < samples.length; i++) {
    totalDrift += haversineMeters(
      samples[i - 1].lat, samples[i - 1].lng,
      samples[i].lat,     samples[i].lng
    );
  }

  const isSuspicious = riskScore >= 50;

  return {
    flags,
    riskScore: Math.min(riskScore, 100),
    isSuspicious,
    sampleCount: samples.length,
    details: {
      minAccuracy,
      hasAltitude,
      latStd,
      lngStd,
      accStd,
      totalDriftMeters: totalDrift,
      uniqueTimestamps: uniqueTs,
    },
  };
};

const useGpsForensics = () => {
  const [state, setState] = useState({
    status: "idle",
    progress: 0,
    samples: null,
    forensics: null,
    error: null,
  });

  const run = useCallback(async (sampleCount = 4, gapMs = 1500) => {
    setState({ status: "collecting", progress: 5, samples: null, forensics: null, error: null });

    try {
      const samples = [];
      for (let i = 0; i < sampleCount; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, gapMs));
        try {
          const pos = await getOneSample(8000);
          samples.push({
            lat:       pos.coords.latitude,
            lng:       pos.coords.longitude,
            accuracy:  pos.coords.accuracy,
            altitude:  pos.coords.altitude,
            speed:     pos.coords.speed,
            heading:   pos.coords.heading,
            timestamp: pos.timestamp,
          });
        } catch {
          // sample gagal: lewati
        }
        setState((prev) => ({
          ...prev,
          progress: Math.round(((i + 1) / sampleCount) * 90),
        }));
      }

      const forensics = analyzeGpsSamples(samples);
      setState({ status: "done", progress: 100, samples, forensics, error: null });
      return { samples, forensics };
    } catch (err) {
      setState((prev) => ({ ...prev, status: "error", error: err.message }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, samples: null, forensics: null, error: null });
  }, []);

  return { ...state, run, reset };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-komponen: GPS Forensics Badge
// ─────────────────────────────────────────────────────────────────────────────

const FLAG_LABELS = {
  SUSPICIOUSLY_HIGH_ACCURACY:    "Akurasi GPS terlalu sempurna",
  NO_ALTITUDE_DATA:              "Data ketinggian tidak ada",
  LOCATION_TOO_STABLE:           "Posisi tidak bergerak sama sekali",
  IDENTICAL_TIMESTAMPS:          "Timestamp GPS duplikat",
  ACCURACY_NEVER_CHANGES:        "Nilai akurasi tidak berubah",
  SPEED_ZERO_WITH_HIGH_ACCURACY: "Kecepatan 0 dengan akurasi tinggi",
  COORDINATE_TOO_ROUND:          "Koordinat terlalu bulat",
  BROWSER_MOCK_LOCATION_HINT:    "Browser/emulator mencurigakan",
  INSUFFICIENT_SAMPLES:          "Sample GPS tidak cukup",
};

const GpsForensicsBadge = ({ forensicsState }) => {
  const { status, progress, forensics, error } = forensicsState;

  if (status === "idle") return null;

  if (status === "collecting") {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex-shrink-0 relative w-5 h-5">
          <div className="absolute inset-0 rounded-full border-2 border-blue-300" />
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"
            style={{ animationDuration: "0.7s" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700">
            Memverifikasi keaslian GPS…
          </p>
          <div className="mt-1 h-1 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-blue-400 font-mono flex-shrink-0">{progress}%</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
        <HiOutlineExclamationCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-xs text-gray-500">Verifikasi GPS gagal · {error}</p>
      </div>
    );
  }

  if (status === "done" && forensics) {
    const suspicious = forensics.isSuspicious;
    const flagCount  = forensics.flags.length;

    if (!suspicious && flagCount === 0) {
      return (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700">GPS terverifikasi asli</p>
            <p className="text-[10px] text-emerald-500">
              {forensics.sampleCount} sample · akurasi ±{Math.round(forensics.details.minAccuracy)}m
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex-shrink-0">
            risk {forensics.riskScore}
          </span>
        </div>
      );
    }

    if (suspicious) {
      return (
        <div className="rounded-xl border border-red-300 bg-red-50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-100/60">
            <HiOutlineShieldExclamation className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-700">⛔ GPS Palsu Terdeteksi — Absen Diblokir</p>
              <p className="text-[10px] text-red-500">
                {flagCount} indikator · risk score {forensics.riskScore}/100
              </p>
            </div>
          </div>
          <div className="px-3.5 pb-2.5 pt-2 flex flex-wrap gap-1">
            {forensics.flags.map((f) => (
              <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium border border-red-200">
                {FLAG_LABELS[f] ?? f}
              </span>
            ))}
          </div>
          <div className="px-3.5 pb-3">
            <p className="text-[10px] text-red-400 leading-relaxed">
              Nonaktifkan aplikasi <em>mock location / fake GPS</em> di perangkat Anda, lalu muat ulang halaman ini.
            </p>
          </div>
        </div>
      );
    }

    // ada flag tapi belum suspicious threshold
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <HiOutlineShieldExclamation className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700">GPS perlu perhatian</p>
            <p className="text-[10px] text-amber-500">
              {flagCount} indikator · risk score {forensics.riskScore}/100
            </p>
          </div>
        </div>
        <div className="px-3.5 pb-2.5 flex flex-wrap gap-1">
          {forensics.flags.map((f) => (
            <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-medium">
              {FLAG_LABELS[f] ?? f}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtDateTime = (d) =>
  d.toLocaleString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
const fmtCoord = (n) => (typeof n === "number" ? n.toFixed(6) : "-");

const STEP = {
  CAMERA: "camera", WORK_TYPE: "work_type",
  SUBMITTING: "submitting", SUCCESS: "success", ERROR: "error",
};

const WORK_TYPES = [
  { value: "WFO", label: "Work from Office",   short: "WFO", icon: HiOutlineOfficeBuilding, color: "indigo", desc: "Hadir di kantor" },
  { value: "WFH", label: "Work from Home",     short: "WFH", icon: HiOutlineHome,           color: "green",  desc: "Bekerja dari rumah" },
  { value: "WFA", label: "Work from Anywhere", short: "WFA", icon: HiOutlineGlobe,          color: "amber",  desc: "Bekerja dari mana saja" },
];

const COLOR_MAP = {
  indigo: { ring: "ring-indigo-500", bg: "bg-indigo-50", border: "border-indigo-400", icon: "text-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700" },
  green:  { ring: "ring-green-500",  bg: "bg-green-50",  border: "border-green-400",  icon: "text-green-600",  btn: "bg-green-600 hover:bg-green-700" },
  amber:  { ring: "ring-amber-500",  bg: "bg-amber-50",  border: "border-amber-400",  icon: "text-amber-600",  btn: "bg-amber-500 hover:bg-amber-600" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CheckInModal = ({ isOpen, onClose, employee, onSuccess }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const clockRef  = useRef(null);

  const [step, setStep]             = useState(STEP.CAMERA);
  const [photoBlob, setPhotoBlob]   = useState(null);
  const [photoUrl, setPhotoUrl]     = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);
  const [workType, setWorkType]     = useState(null);
  const [location, setLocation]     = useState(null);
  const [locError, setLocError]     = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [now, setNow]               = useState(new Date());
  const [facingMode, setFacingMode] = useState("user");
  const [cameraError, setCameraError] = useState(null);

  // ── Radius state ──────────────────────────────────────────────────────────
  const [wfoRadiusDone,      setWfoRadiusDone]      = useState(false);
  const [wfhRadiusDone,      setWfhRadiusDone]      = useState(false);
  const [isOutsideWFORadius, setIsOutsideWFORadius] = useState(false);
  const [isOutsideWFHRadius, setIsOutsideWFHRadius] = useState(false);

  // ── GPS forensics dari WfoRadiusWarning / WfhRadiusWarning ───────────────
  const [wfhForensics, setWfhForensics] = useState(null);
  const [wfhSamples,   setWfhSamples]   = useState(null);
  const [wfoForensics, setWfoForensics] = useState(null);
  const [wfoSamples,   setWfoSamples]   = useState(null);

  // ── GPS Forensics engine ──────────────────────────────────────────────────
  const gpsForensics = useGpsForensics();

  const { error: submitError, submitCheckIn, getLocation, reset: resetHook } = useCheckIn();
  const { upsertAttendanceRecord } = useAttendance();

  // ── Derived: apakah GPS mencurigakan? ────────────────────────────────────
  const isGpsSuspicious = gpsForensics.forensics?.isSuspicious === true;

  // ── GPS dengan auto-retry ─────────────────────────────────────────────────
  const fetchGPS = useCallback((retryCount = 0) => {
    setLocLoading(true);
    setLocError(null);
    getLocation()
      .then((loc) => { setLocation(loc); setLocLoading(false); })
      .catch((err) => {
        if (retryCount < 2) {
          console.warn(`[CheckIn] GPS gagal (attempt ${retryCount + 1}), retry...`);
          setTimeout(() => fetchGPS(retryCount + 1), 1500);
        } else {
          console.warn("[CheckIn] GPS gagal setelah 3 attempt:", err.message);
          setLocError(err.message);
          setLocLoading(false);
        }
      });
  }, [getLocation]);

  // ── Jalankan GPS forensics otomatis saat workType dipilih ────────────────
  useEffect(() => {
    if (!workType || step !== STEP.WORK_TYPE) return;
    const sampleCount = workType === "WFA" ? 2 : 4;
    const gapMs       = workType === "WFA" ? 1000 : 1500;
    gpsForensics.run(sampleCount, gapMs).catch(() => {});
  }, [workType]); // eslint-disable-line

  // Live clock
  useEffect(() => {
    if (!isOpen) return;
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, [isOpen]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode) => {
    setCameraError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError("Kamera tidak dapat diakses. Izinkan akses kamera di browser Anda.");
    }
  }, [stopStream]);

  // ── Open/close lifecycle ──────────────────────────────────────────────────
  const resetAllState = useCallback(() => {
    setStep(STEP.CAMERA);
    setPhotoBlob(null);
    setPhotoUrl(null);
    setLocation(null);
    setLocError(null);
    setLocLoading(false);
    setCapturedAt(null);
    setWorkType(null);
    setWfoRadiusDone(false);
    setWfhRadiusDone(false);
    setIsOutsideWFORadius(false);
    setIsOutsideWFHRadius(false);
    setWfhForensics(null);
    setWfhSamples(null);
    setWfoForensics(null);
    setWfoSamples(null);
    gpsForensics.reset();
    resetHook();
  }, [resetHook, gpsForensics.reset]); // eslint-disable-line

  useEffect(() => {
    if (isOpen) {
      resetAllState();
      startCamera("user");
      fetchGPS(0);
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [isOpen]); // eslint-disable-line

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);

    const ts = new Date();
    setCapturedAt(ts);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(8, canvas.height - 34, 330, 26);
    ctx.fillStyle = "white";
    ctx.fillText(fmtDateTime(ts), 12, canvas.height - 16);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      stopStream();
      setStep(STEP.WORK_TYPE);
    }, "image/jpeg", 0.92);
  }, [facingMode, stopStream]);

  const retake = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
    setCapturedAt(null);
    setWorkType(null);
    setWfoRadiusDone(false);
    setWfhRadiusDone(false);
    setIsOutsideWFORadius(false);
    setIsOutsideWFHRadius(false);
    setWfhForensics(null);
    setWfhSamples(null);
    setWfoForensics(null);
    setWfoSamples(null);
    gpsForensics.reset();
    setStep(STEP.CAMERA);
    startCamera(facingMode);
  }, [facingMode, photoUrl, startCamera, gpsForensics.reset]); // eslint-disable-line

  const resetWorkTypeState = useCallback(() => {
    setWfoRadiusDone(false);
    setWfhRadiusDone(false);
    setIsOutsideWFORadius(false);
    setIsOutsideWFHRadius(false);
    setWfhForensics(null);
    setWfhSamples(null);
    setWfoForensics(null);
    setWfoSamples(null);
    gpsForensics.reset();
  }, [gpsForensics.reset]); // eslint-disable-line

  const handleSubmit = useCallback(async () => {
    if (!photoBlob || !employee?.id || !workType) return;

    // ── Guard: radius ─────────────────────────────────────────────────────
    if (workType === "WFO" && isOutsideWFORadius) { setStep(STEP.ERROR); return; }
    if (workType === "WFH" && isOutsideWFHRadius) { setStep(STEP.ERROR); return; }

    // ── Guard: GPS mencurigakan → BLOKIR ─────────────────────────────────
    if (isGpsSuspicious) { setStep(STEP.ERROR); return; }

    // Forensics masih berjalan → tunggu
    if (gpsForensics.status === "collecting") return;

    setStep(STEP.SUBMITTING);
    try {
      const loc = location || { latitude: null, longitude: null, accuracy: null };

      const activeRadiusForensics = workType === "WFH" ? wfhForensics : workType === "WFO" ? wfoForensics : null;
      const activeRadiusSamples   = workType === "WFH" ? wfhSamples   : workType === "WFO" ? wfoSamples   : null;

      const browserForensics = gpsForensics.forensics;
      const browserSamples   = gpsForensics.samples;

      const mergedFlags = [
        ...(activeRadiusForensics?.flags ?? []),
        ...(browserForensics?.flags ?? []),
      ].filter((v, i, a) => a.indexOf(v) === i);

      const mergedForensics = {
        ...(browserForensics ?? {}),
        flags:        mergedFlags,
        riskScore:    Math.max(
          activeRadiusForensics?.riskScore ?? 0,
          browserForensics?.riskScore ?? 0,
        ),
        isSuspicious: (activeRadiusForensics?.isSuspicious ?? false) || (browserForensics?.isSuspicious ?? false),
        sources:      ["browser_engine", activeRadiusForensics ? "radius_check" : null].filter(Boolean),
      };

      console.group("[CheckIn] Submit");
      console.log("workType        :", workType);
      console.log("GPS             :", loc);
      console.log("browserForensics:", browserForensics);
      console.log("radiusForensics :", activeRadiusForensics);
      console.log("mergedForensics :", mergedForensics);
      console.log("isSuspicious    :", mergedForensics.isSuspicious);
      console.groupEnd();

      const res = await submitCheckIn({
        employeeId:   employee.id,
        photoBlob,
        location:     loc,
        capturedAt:   capturedAt || new Date(),
        workType,
        gpsForensics: mergedForensics,
        gpsSamples:   [...(activeRadiusSamples ?? []), ...(browserSamples ?? [])],
      });

      const record = res?.data ?? res;
      if (record?.id) upsertAttendanceRecord(record);
      setStep(STEP.SUCCESS);
      onSuccess?.(res);
    } catch (err) {
      console.error("[CheckIn] Submit error:", err);
      setStep(STEP.ERROR);
    }
  }, [
    photoBlob, location, employee, capturedAt, workType,
    submitCheckIn, onSuccess, upsertAttendanceRecord,
    isOutsideWFORadius, isOutsideWFHRadius,
    wfhForensics, wfhSamples, wfoForensics, wfoSamples,
    gpsForensics,
    isGpsSuspicious,
  ]);

  const handleClose = useCallback(() => {
    stopStream();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    onClose?.();
  }, [stopStream, photoUrl, onClose]);

  if (!isOpen) return null;

  const selectedType  = WORK_TYPES.find((t) => t.value === workType);
  const selectedColor = selectedType ? COLOR_MAP[selectedType.color] : null;

  const isRadiusLoading =
    (workType === "WFO" && !wfoRadiusDone) ||
    (workType === "WFH" && !wfhRadiusDone);

  const isForensicsLoading = gpsForensics.status === "collecting";

  const isDisabled =
    !workType ||
    locLoading ||
    isRadiusLoading ||
    isForensicsLoading ||
    isGpsSuspicious ||
    (workType === "WFO" && isOutsideWFORadius) ||
    (workType === "WFH" && isOutsideWFHRadius);

  const submitLabel = (() => {
    if (!workType)                                  return "Pilih tipe kehadiran dulu";
    if (locLoading)                                 return "Menunggu GPS…";
    if (isRadiusLoading)                            return `Memverifikasi lokasi ${workType}…`;
    if (isForensicsLoading)                         return `Memeriksa keaslian GPS… ${gpsForensics.progress}%`;
    if (isGpsSuspicious)                            return "GPS mencurigakan — absen diblokir";
    if (workType === "WFO" && isOutsideWFORadius)   return "Di luar radius WFO";
    if (workType === "WFH" && isOutsideWFHRadius)   return "Di luar radius WFH";
    return `Kirim Absen · ${workType}`;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">Absen Hari Ini</h2>
            <p className="text-indigo-200 text-xs mt-0.5">{fmtDateTime(now)}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <HiOutlineX className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Employee info */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <HiOutlineUser className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{employee?.name ?? "—"}</p>
            <p className="text-xs text-gray-400 font-mono">
              {employee?.employeeIdentificationNumber}
              {employee?.departmentName && ` · ${employee.departmentName}`}
            </p>
          </div>
          <div className="flex-shrink-0">
            {locLoading ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-400 text-xs">
                <div className="w-2.5 h-2.5 rounded-full border border-gray-400 border-t-transparent animate-spin" />
                GPS…
              </span>
            ) : location ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs">
                <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                GPS OK
              </span>
            ) : (
              <span
                onClick={() => fetchGPS(0)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 text-xs cursor-pointer hover:bg-red-100"
                title="Klik untuk retry GPS"
              >
                <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                No GPS ↺
              </span>
            )}
          </div>
        </div>

        {/* ── STEP: CAMERA ── */}
        {step === STEP.CAMERA && (
          <div className="flex flex-col">
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <HiOutlineExclamationCircle className="w-12 h-12 text-red-400" />
                  <p className="text-red-400 text-sm">{cameraError}</p>
                  <button onClick={() => startCamera(facingMode)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
                    style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-48 rounded-full border-2 border-white/50" />
                  </div>
                  <button onClick={flipCamera} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
                    <HiOutlineRefresh className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
            <div className="px-5 py-4 flex flex-col items-center gap-3">
              <button onClick={capturePhoto} disabled={!!cameraError}
                className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center shadow-lg transition-all active:scale-95">
                <HiOutlineCamera className="w-8 h-8 text-white" />
              </button>
              <p className="text-xs text-gray-400">Tekan untuk mengambil foto</p>
            </div>
          </div>
        )}

        {/* ── STEP: WORK TYPE ── */}
        {step === STEP.WORK_TYPE && (
          <div className="flex flex-col">
            {photoUrl && (
              <div className="relative" style={{ aspectRatio: "16/7" }}>
                <img src={photoUrl} alt="Foto absen" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <HiOutlineClock className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">
                    {capturedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="text-white/70 text-xs">
                    · {capturedAt?.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button onClick={retake} className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg text-xs transition-colors">
                  <HiOutlineRefresh className="w-3.5 h-3.5" />
                  Foto Ulang
                </button>
              </div>
            )}

            <div className="px-5 py-4 space-y-3">

              {/* GPS info */}
              <div className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border ${
                location ? "bg-green-50 border-green-200" :
                locLoading ? "bg-gray-50 border-gray-200" : "bg-orange-50 border-orange-200"
              }`}>
                <HiOutlineLocationMarker className={`w-5 h-5 flex-shrink-0 ${
                  location ? "text-green-500" : locLoading ? "text-gray-400" : "text-orange-400"
                }`} />
                <div className="flex-1 min-w-0">
                  {locLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      <span className="text-sm text-gray-500">Mengambil lokasi GPS…</span>
                    </div>
                  ) : location ? (
                    <>
                      <p className="text-xs font-semibold text-green-700">Lokasi berhasil diperoleh</p>
                      <p className="text-xs text-green-600 font-mono">
                        {fmtCoord(location.latitude)}, {fmtCoord(location.longitude)}
                        <span className="ml-1 text-green-400">±{Math.round(location.accuracy ?? 0)}m</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-orange-600">Lokasi tidak tersedia</p>
                      <p className="text-xs text-orange-500">
                        Absen tetap bisa dilanjutkan ·{" "}
                        <button onClick={() => fetchGPS(0)} className="underline font-medium">Coba lagi</button>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* GPS Forensics Badge */}
              {workType && (
                <GpsForensicsBadge forensicsState={gpsForensics} />
              )}

              {/* Radius warnings */}
              {workType === "WFO" && (
                <WfoRadiusWarning
                  allowOutside={true}
                  onResult={(result) => {
                    const outside = result.skipped ? false : !result.withinRadius;
                    setIsOutsideWFORadius(outside);
                    setWfoRadiusDone(true);
                    if (result.gpsForensics) setWfoForensics(result.gpsForensics);
                    if (result.gpsSamples)   setWfoSamples(result.gpsSamples);
                  }}
                />
              )}
              {workType === "WFH" && (
                <WfhRadiusWarning
                  allowOutside={true}
                  onResult={(result) => {
                    const outside = result.skipped ? false : !result.withinRadius;
                    setIsOutsideWFHRadius(outside);
                    setWfhRadiusDone(true);
                    if (result.gpsForensics) setWfhForensics(result.gpsForensics);
                    if (result.gpsSamples)   setWfhSamples(result.gpsSamples);
                  }}
                />
              )}

              {/* Pilih tipe kerja */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">Pilih Tipe Kehadiran</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {WORK_TYPES.map(({ value, short, desc, icon: Icon, color }) => {
                    const c = COLOR_MAP[color];
                    const isSelected = workType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          resetWorkTypeState();
                          setWorkType(value);
                        }}
                        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all
                          ${isSelected
                            ? `${c.bg} ${c.border} ring-2 ${c.ring} ring-offset-1 shadow-sm`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isSelected ? c.bg : "bg-gray-100"}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? c.icon : "text-gray-400"}`} />
                        </div>
                        <p className={`text-sm font-bold ${isSelected ? c.icon : "text-gray-600"}`}>{short}</p>
                        <p className={`text-[10px] text-center leading-tight ${isSelected ? c.icon : "text-gray-400"}`}>{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol kirim */}
              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm
                  ${isDisabled
                    ? isGpsSuspicious
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-gray-300 cursor-not-allowed"
                    : selectedColor ? selectedColor.btn : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {isForensicsLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    {submitLabel}
                  </>
                ) : isGpsSuspicious ? (
                  <>
                    <HiOutlineShieldExclamation className="w-4 h-4" />
                    {submitLabel}
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    {submitLabel}
                  </>
                )}
              </button>

            </div>
          </div>
        )}

        {/* ── STEP: SUBMITTING ── */}
        {step === STEP.SUBMITTING && (
          <div className="flex flex-col items-center justify-center py-14 px-5 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <HiOutlineCamera className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Mengirim Data Absensi…</p>
              <p className="text-sm text-gray-400 mt-1">Mohon tunggu sebentar</p>
            </div>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === STEP.SUCCESS && (
          <div className="flex flex-col items-center justify-center py-12 px-5 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600 mb-1">Absen Berhasil!</p>
              <p className="text-sm text-gray-500">
                {employee?.name} berhasil absen pada{" "}
                <span className="font-medium text-gray-700">
                  {capturedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>
            {workType && (
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                workType === "WFO" ? "bg-indigo-100 text-indigo-700" :
                workType === "WFH" ? "bg-green-100 text-green-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {workType} · {WORK_TYPES.find((t) => t.value === workType)?.label}
              </span>
            )}
            {location && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <HiOutlineLocationMarker className="w-3.5 h-3.5 text-green-400" />
                {fmtCoord(location.latitude)}, {fmtCoord(location.longitude)}
              </p>
            )}
            {gpsForensics.forensics && (
              <div className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                gpsForensics.forensics.isSuspicious
                  ? "bg-red-50 text-red-600"
                  : gpsForensics.forensics.flags.length > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}>
                <HiOutlineShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  GPS risk score: {gpsForensics.forensics.riskScore}/100 ·{" "}
                  {gpsForensics.forensics.isSuspicious ? "mencurigakan" : "aman"} ·{" "}
                  {gpsForensics.forensics.sampleCount} sample
                </span>
              </div>
            )}
            <button onClick={handleClose} className="mt-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              Selesai
            </button>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === STEP.ERROR && (
          <div className="flex flex-col items-center justify-center py-10 px-5 gap-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              {isGpsSuspicious
                ? <HiOutlineShieldExclamation className="w-12 h-12 text-red-500" />
                : <HiOutlineExclamationCircle className="w-12 h-12 text-red-500" />
              }
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600 mb-1">
                {isGpsSuspicious ? "GPS Palsu Terdeteksi" : "Absen Gagal"}
              </p>
              <p className="text-sm text-gray-500 mb-1">
                {isGpsSuspicious
                  ? `Sistem mendeteksi GPS tidak asli (risk score ${gpsForensics.forensics?.riskScore ?? "?"}/100). Nonaktifkan aplikasi mock location dan coba lagi.`
                  : isOutsideWFORadius && workType === "WFO"
                  ? "Anda berada di luar radius kantor. Silakan pilih WFH atau WFA."
                  : isOutsideWFHRadius && workType === "WFH"
                  ? "Anda berada di luar radius rumah. Silakan pilih WFO atau WFA."
                  : submitError || "Terjadi kesalahan. Silakan coba lagi."}
              </p>
            </div>

            {/* Detail flag GPS jika suspicious */}
            {isGpsSuspicious && gpsForensics.forensics?.flags?.length > 0 && (
              <div className="w-full px-3.5 py-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-600 mb-2">Indikator terdeteksi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {gpsForensics.forensics.flags.map((f) => (
                    <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium border border-red-200">
                      {FLAG_LABELS[f] ?? f}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-red-400 mt-2 leading-relaxed">
                  Pastikan tidak ada aplikasi <em>Fake GPS / Mock Location</em> yang aktif, lalu coba ulangi absen.
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button onClick={retake} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                <HiOutlineRefresh className="w-4 h-4" />
                Foto Ulang
              </button>
              <button
                onClick={() => {
                  resetWorkTypeState();
                  setStep(STEP.WORK_TYPE);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CheckInModal;

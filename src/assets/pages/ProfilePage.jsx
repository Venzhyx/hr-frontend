// assets/pages/ProfilePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineX,
  HiOutlineKey,
  HiOutlineClipboard,
  HiOutlineClipboardCheck,
  HiOutlineRefresh,
  HiOutlineShieldExclamation,
  HiOutlinePencilAlt,
  HiOutlineLockClosed,
  HiOutlineHome,
  HiOutlineIdentification,
} from "react-icons/hi";
import API from "../../ApiService/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getLoggedInUser = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("hr_user");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

/**
 * Hapus semua data sesi dari storage.
 * Sesuaikan key-nya dengan yang dipakai di login.
 */
const clearSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("hr_user");
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.clear();
};

/**
 * Copy to clipboard — modern API dengan fallback execCommand untuk HTTP / older browser.
 */
const copyToClipboard = (text) => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
};

const fallbackCopy = (text) => {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch (_) {
    return false;
  }
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  if (!toast.show) return null;
  const ok = toast.type === "success";
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-xl border-l-4 transition-all ${
        ok ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
      }`}
      style={{ minWidth: 320 }}
    >
      <div className={`mr-3 flex-shrink-0 ${ok ? "text-green-500" : "text-red-500"}`}>
        {ok ? <HiOutlineCheckCircle className="w-6 h-6" /> : <HiOutlineXCircle className="w-6 h-6" />}
      </div>
      <p className={`flex-1 mr-2 text-sm font-medium ${ok ? "text-green-800" : "text-red-800"}`}>
        {toast.message}
      </p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <HiOutlineX className="w-5 h-5" />
      </button>
    </div>
  );
};

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-indigo-500" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const ProfilePage = () => {
  const navigate     = useNavigate();
  const loggedInUser = useMemo(() => getLoggedInUser(), []);
  const selfEmployeeId = useMemo(
    () => loggedInUser?.employeeId ?? loggedInUser?.id ?? null,
    [loggedInUser]
  );

  const [employee, setEmployee] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ show: false, message: "", type: "success" });

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [newPassword,    setNewPassword]    = useState("");
  const [copied,         setCopied]         = useState(false);
  const [resetDone,      setResetDone]      = useState(false);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!selfEmployeeId) { setLoading(false); return; }
    try {
      const res = await API.get(`/employees/${selfEmployeeId}`);
      setEmployee(res.data?.data ?? res.data);
    } catch (_) {
      showToast("Gagal memuat data profil", "error");
    } finally {
      setLoading(false);
    }
  }, [selfEmployeeId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3500);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") =>
    setToast({ show: true, message, type });

  // ── Navigasi ke Edit Employee ─────────────────────────────────────────────
  const goToEdit = () => {
    if (!selfEmployeeId) return;
    navigate(`/employees/edit/${selfEmployeeId}`, {
      state: { selfOnly: true, from: "/profile" },
    });
  };

  // ── Reset password ────────────────────────────────────────────────────────
  // BE yang generate password — FE tidak perlu generate sendiri lagi
  const handleResetPassword = async () => {
    setResetting(true);
    try {
      // POST /auth/reset-password
      // userId diambil dari JWT di BE, tidak perlu kirim body apa-apa
      const res = await API.post("/auth/reset-password");
      // BE membungkus dengan ApiResponse<PasswordResetResponse>
      // → struktur: { success, message, data: { success, message, newPassword } }
      const plain = res.data?.data?.newPassword ?? res.data?.newPassword;

      if (!plain) throw new Error("Respons tidak valid dari server");

      setNewPassword(plain);
      setResetDone(true);
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal reset password", "error");
      setShowResetModal(false);
    } finally {
      setResetting(false);
    }
  };

  const handleCopy = () => {
    copyToClipboard(newPassword).then((ok) => {
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  /**
   * Selesai: salin sudah → hapus sesi → redirect ke /login
   * Modal tidak bisa di-close dengan klik backdrop setelah reset berhasil
   * sampai user klik tombol Selesai — agar password sempat disalin.
   */
  const handleDone = () => {
    clearSession();
    // Pakai window.location.href bukan navigate() agar full page reload —
    // semua in-memory React state (termasuk PrivateRoute auth check) di-reset.
    // Kalau pakai navigate(), PrivateRoute masih baca state lama & redirect balik ke dashboard.
    window.location.href = "/login";
  };

  const closeResetModal = () => {
    // Kalau reset sudah selesai, paksa lewat handleDone agar sesi dihapus
    if (resetDone) { handleDone(); return; }
    setShowResetModal(false);
    setResetDone(false);
    setNewPassword("");
    setCopied(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full px-4 md:px-6 py-6 flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Memuat profil…</div>
      </div>
    );
  }

  const fullName    = employee?.name || employee?.fullName || loggedInUser?.name || "—";
  const initials    = fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const jobTitle    = employee?.jobTitle || "—";
  const department  = employee?.department?.name || employee?.departmentName || "—";
  const companyName = employee?.company?.companyName || employee?.companyName || "—";

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast((p) => ({ ...p, show: false }))} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lihat dan kelola informasi akun Anda</p>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <HiOutlineKey className="w-4 h-4" />
          Reset Password
        </button>
      </div>

      {/* ── Profile hero card ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 right-20 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg bg-white/20 flex-shrink-0">
            {employee?.photo ? (
              <img src={employee.photo} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{fullName}</h2>
            <p className="text-indigo-200 text-sm mt-0.5">{jobTitle}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {employee?.employeeCode && (
                <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                  {employee.employeeCode}
                </span>
              )}
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full flex items-center gap-1">
                <HiOutlineOfficeBuilding className="w-3 h-3" /> {department}
              </span>
              {employee?.status && (
                <span className="text-xs bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full font-medium">
                  {employee.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={goToEdit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
            >
              <HiOutlinePencilAlt className="w-4 h-4" />
              Edit Profil
            </button>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
            <HiOutlineOfficeBuilding className="text-indigo-400 w-4 h-4" />
            <h3 className="text-sm font-semibold text-gray-700">Informasi Pekerjaan</h3>
          </div>
          <InfoRow icon={HiOutlineMail}          label="Email Kerja"   value={employee?.workEmail} />
          <InfoRow icon={HiOutlinePhone}          label="Telepon Kerja" value={employee?.workPhone} />
          <InfoRow icon={HiOutlineOfficeBuilding} label="Perusahaan"    value={companyName} />
          <InfoRow icon={HiOutlineCalendar}       label="Tanggal Masuk" value={fmtDate(employee?.joinDate)} />
          <InfoRow icon={HiOutlineIdentification} label="Tipe Karyawan" value={employee?.employeeType} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
            <HiOutlineUser className="text-indigo-400 w-4 h-4" />
            <h3 className="text-sm font-semibold text-gray-700">Kontak Pribadi</h3>
          </div>
          <InfoRow icon={HiOutlinePhone} label="Telepon Pribadi" value={employee?.privatePhone} />
          <InfoRow icon={HiOutlineMail}  label="Email Pribadi"   value={employee?.privateEmail} />
          <InfoRow icon={HiOutlineHome}  label="Alamat"          value={employee?.privateAddress} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
            <HiOutlineLockClosed className="text-indigo-400 w-4 h-4" />
            <h3 className="text-sm font-semibold text-gray-700">Informasi Akun</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoRow icon={HiOutlineUser}           label="Username"   value={loggedInUser?.username || loggedInUser?.name} />
            <InfoRow icon={HiOutlineMail}           label="Email Akun" value={loggedInUser?.email} />
            <InfoRow icon={HiOutlineIdentification} label="Role"       value={loggedInUser?.role} />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">Password terakhir diubah: tidak diketahui</p>
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              <HiOutlineKey className="w-4 h-4" />
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {/* ══ RESET PASSWORD MODAL ══════════════════════════════════════════════ */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          // backdrop klik hanya aktif sebelum reset selesai
          onClick={!resetDone ? closeResetModal : undefined}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <HiOutlineKey className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Reset Password</h3>
              </div>
              {/* X hanya tampil sebelum reset selesai */}
              {!resetDone && (
                <button onClick={closeResetModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6">
              {!resetDone ? (
                /* ── Step 1: Konfirmasi ── */
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <HiOutlineShieldExclamation className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Anda yakin ingin mereset password?
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Password lama akan langsung tidak berlaku. Sistem akan menghasilkan
                        password sementara 6 karakter. Setelah menekan <strong>Selesai</strong> Anda
                        akan otomatis logout dan perlu login ulang dengan password baru.
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-700 font-medium">
                      Pastikan Anda menyalin password sebelum menutup modal ini.
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Step 2: Tampilkan password baru ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Password berhasil direset!</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Salin password di bawah, lalu klik <strong>Selesai</strong> untuk login ulang.
                      </p>
                    </div>
                  </div>

                  {/* Password display + copy */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Password Sementara</p>
                      <p className="text-2xl font-mono font-bold tracking-[0.3em] text-gray-800 select-all">
                        {newPassword}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                        copied
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                      }`}
                    >
                      {copied ? (
                        <><HiOutlineClipboardCheck className="w-4 h-4" />Tersalin!</>
                      ) : (
                        <><HiOutlineClipboard className="w-4 h-4" />Salin</>
                      )}
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700">
                      Klik <strong>Selesai</strong> — Anda akan otomatis logout. Gunakan password di atas untuk login kembali.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {!resetDone ? (
                <>
                  <button
                    onClick={closeResetModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
                  >
                    {resetting ? (
                      <><HiOutlineRefresh className="w-4 h-4 animate-spin" />Mereset…</>
                    ) : (
                      <><HiOutlineKey className="w-4 h-4" />Ya, Reset Password</>
                    )}
                  </button>
                </>
              ) : (
                /* Selesai → logout → /login */
                <button
                  onClick={handleDone}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Selesai &amp; Login Ulang
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

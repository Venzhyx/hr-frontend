import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import {
  HiOutlineChevronLeft,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
} from "react-icons/hi";

// Menggunakan VITE_API_URL agar konsisten dengan API lainnya
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Field({ label, children, hint, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

const inputClass = (hasError) => `w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-1 transition-all text-gray-800 ${
  hasError
    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
    : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
}`;

export default function AddAccount() {
  const navigate = useNavigate();
  const { employees, fetchEmployees } = useEmployee();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
    employeeId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (fetchEmployees) {
      fetchEmployees();
    }
  }, []);

  const sortedEmployees = useMemo(() => {
    return [...(employees ?? [])].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [employees]);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username wajib diisi";
    else if (form.username.length < 3) e.username = "Minimal 3 karakter";

    if (!form.password) e.password = "Password wajib diisi";
    else if (form.password.length < 6) e.password = "Minimal 6 karakter";

    if (!form.confirmPassword) e.confirmPassword = "Konfirmasi password wajib diisi";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Password tidak cocok";

    if (form.role === "EMPLOYEE" && !form.employeeId)
      e.employeeId = "Karyawan wajib dipilih untuk role Employee";

    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem("hr_token");
      await axios.post(
        `${BASE_URL}/auth/register`,
        {
          username: form.username,
          password: form.password,
          role: form.role,
          employeeId: form.employeeId ? Number(form.employeeId) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/accounts", { state: { toast: "Akun berhasil dibuat" } });
    } catch (err) {
      setApiError(err.response?.data?.message || "Gagal membuat akun. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/accounts")}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>

        {/* Header Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 md:p-8 text-white flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <HiOutlineUser className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Tambah Akun Baru
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Buat akun untuk Admin atau Employee
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5">
          {apiError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              <HiOutlineExclamation className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Username */}
          <Field label="Username" error={errors.username}>
            <input
              type="text"
              value={form.username}
              onChange={handleChange("username")}
              placeholder="contoh: john.doe"
              className={inputClass(!!errors.username)}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password} hint="Minimal 6 karakter">
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="••••••••"
              className={inputClass(!!errors.password)}
            />
          </Field>

          {/* Confirm Password */}
          <Field label="Konfirmasi Password" error={errors.confirmPassword}>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="••••••••"
              className={inputClass(!!errors.confirmPassword)}
            />
          </Field>

          {/* Role Choice */}
          <Field label="Role" error={errors.role}>
            <div className="flex gap-3">
              {[
                { key: "ADMIN", label: "Admin", icon: HiOutlineShieldCheck },
                { key: "EMPLOYEE", label: "Employee", icon: HiOutlineUser },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = form.role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ 
                        ...f, 
                        role: r.key,
                        employeeId: r.key === "ADMIN" ? "" : f.employeeId 
                      }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Employee Dropdown Selection */}
          <Field
            label="Karyawan (Employee)"
            error={errors.employeeId}
            hint={form.role === "EMPLOYEE" ? "Wajib diisi untuk role Employee" : "Opsional untuk Admin"}
          >
            <select
              value={form.employeeId}
              onChange={handleChange("employeeId")}
              className={inputClass(!!errors.employeeId)}
            >
              <option value="">-- Pilih Karyawan --</option>
              {sortedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </option>
              ))}
            </select>
          </Field>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate("/accounts")}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-4.5 h-4.5" />
                  Buat Akun
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
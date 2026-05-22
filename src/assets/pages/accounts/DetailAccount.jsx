import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../redux/hooks/useUser";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import {
  HiOutlineChevronLeft,
  HiOutlineUsers,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineShieldCheck,
} from "react-icons/hi";

const AVATAR_PALETTE = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  "bg-teal-500", "bg-orange-500",
];

const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

const Avatar = ({ name = "", photo = null, size = "sm" }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === "lg" ? "w-14 h-14 text-lg" : "w-8 h-8 text-xs";

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sz} rounded-2xl object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sz} rounded-2xl ${avatarColor(name)} text-white flex items-center justify-center font-extrabold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
};

const ROLE_CONFIG = {
  ADMIN:    { pill: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400",   label: "Admin"    },
  EMPLOYEE: { pill: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",    label: "Employee" },
};

const RoleBadge = ({ role }) => {
  const r = ROLE_CONFIG[role] ?? { pill: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400", label: role };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${r.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.dot}`} />
      {r.label}
    </span>
  );
};

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono text-gray-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

const ConfirmModal = ({ open, title, username, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamation className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Akun <strong className="text-gray-900">{username}</strong> akan dihapus secara permanen.
            </p>
            <p className="text-xs text-red-500 font-medium mt-1">
              Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DetailAccount() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selected, loading, actionLoading, error, fetchUserById, updateUser, toggleUserActive, deleteUser, clearSelected } =
    useUser();
  const { employees, fetchEmployees } = useEmployee();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ role: "", employeeId: "" });
  const [formError, setFormError] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserById(Number(id));
    if (fetchEmployees) {
      fetchEmployees();
    }
    return () => clearSelected();
  }, [id]);

  useEffect(() => {
    if (selected) {
      setForm({
        role: selected.role,
        employeeId: selected.employeeId !== null && selected.employeeId !== undefined ? String(selected.employeeId) : "",
      });
    }
  }, [selected]);

  const empMap = useMemo(() => {
    const map = {};
    (employees ?? []).forEach((emp) => {
      map[String(emp.id)] = emp;
    });
    return map;
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    return [...(employees ?? [])].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [employees]);

  const selectedEmp = selected && selected.employeeId ? empMap[String(selected.employeeId)] : null;
  const selectedPhoto = selectedEmp?.photo || selectedEmp?.photoUrl || selectedEmp?.profilePhoto || null;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    const e = {};
    if (!form.role) e.role = "Role wajib dipilih";
    if (form.role === "EMPLOYEE" && !form.employeeId) e.employeeId = "Karyawan wajib dipilih untuk role Employee";
    if (Object.keys(e).length > 0) { setFormError(e); return; }

    const result = await updateUser(Number(id), {
      role: form.role,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
    });

    if (!result.error) {
      setEditMode(false);
      showToast("Akun berhasil diperbarui");
    } else {
      showToast(result.payload || "Gagal memperbarui akun", "error");
    }
  };

  const handleToggle = async () => {
    const result = await toggleUserActive(Number(id));
    if (!result.error) showToast("Status akun berhasil diubah");
    else showToast(result.payload || "Gagal mengubah status", "error");
  };

  const handleDelete = async () => {
    const result = await deleteUser(Number(id));
    if (!result.error) navigate("/accounts", { state: { toast: "Akun berhasil dihapus" } });
    else showToast(result.payload || "Gagal menghapus akun", "error");
    setDeleteConfirm(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <HiOutlineRefresh className="w-10 h-10 animate-spin mx-auto mb-3 text-indigo-500" />
          <p className="text-sm font-semibold">Memuat data akun...</p>
        </div>
      </div>
    );

  if (error || !selected)
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <HiOutlineExclamation className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 font-semibold mb-4">{error || "Akun tidak ditemukan"}</p>
          <button
            onClick={() => navigate("/accounts")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 mx-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg duration-200 animate-slide-in ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <HiOutlineBan className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteConfirm}
        title="Hapus Akun?"
        username={selected.username}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        loading={actionLoading}
      />

      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/accounts")}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>

        {/* Profile Header Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 md:p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <Avatar name={selected.username} photo={selectedPhoto} size="lg" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {selected.username}
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                ID #{selected.id}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap self-start sm:self-auto ${
            selected.isActive 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
              : "bg-gray-500/10 text-gray-400 border-gray-500/25"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected.isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
            {selected.isActive ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Informasi Akun
          </h3>
          <div className="divide-y divide-gray-50">
            <InfoRow label="Username" value={selected.username} />
            <InfoRow
              label="Role"
              value={<RoleBadge role={selected.role} />}
            />
            <InfoRow label="Employee" value={selectedEmp ? selectedEmp.name : "—"} />
            <InfoRow
              label="Dibuat"
              value={new Date(selected.createdAt).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              mono
            />
            <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Diperbarui
              </span>
              <span className="text-sm font-semibold text-gray-800 font-mono">
                {new Date(selected.updatedAt).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Edit Role & Employee
            </h3>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs font-bold rounded-xl transition-all"
              >
                <HiOutlinePencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {editMode && (
            <div className="space-y-4 pt-2">
              {/* Role Select Options */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Role
                </label>
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
                          setFormError((e) => ({ ...e, role: undefined }));
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
                {formError.role && <p className="text-xs font-medium text-red-500">{formError.role}</p>}
              </div>

              {/* Employee Dropdown Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Karyawan (Employee) {form.role === "EMPLOYEE" && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, employeeId: e.target.value }));
                    setFormError((err) => ({ ...err, employeeId: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-1 transition-all text-gray-800 ${
                    formError.employeeId
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  }`}
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {sortedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                    </option>
                  ))}
                </select>
                {formError.employeeId && <p className="text-xs font-medium text-red-500">{formError.employeeId}</p>}
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEditMode(false); setFormError({}); setForm({ role: selected.role, employeeId: selected.employeeId ? String(selected.employeeId) : "" }); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? "Menyimpan..." : (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleToggle}
            disabled={actionLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
              selected.isActive
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {selected.isActive ? (
              <>
                <HiOutlineBan className="w-4.5 h-4.5" />
                Nonaktifkan Akun
              </>
            ) : (
              <>
                <HiOutlineCheckCircle className="w-4.5 h-4.5" />
                Aktifkan Akun
              </>
            )}
          </button>
          
          <button
            onClick={() => setDeleteConfirm(true)}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-sm font-bold rounded-xl transition-all"
          >
            <HiOutlineTrash className="w-4.5 h-4.5" />
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../redux/hooks/useUser";
import { useEmployee } from "../../../redux/hooks/useEmployee";
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineExclamation,
  HiOutlineRefresh,
} from "react-icons/hi";

const ROLE_OPTIONS = ["ALL", "ADMIN", "EMPLOYEE"];

const ROLE_CONFIG = {
  ADMIN:    { pill: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400",  label: "Admin"    },
  EMPLOYEE: { pill: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-400",   label: "Employee" },
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

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
    active
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-gray-50 text-gray-500 border-gray-200"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-emerald-400" : "bg-gray-300"}`} />
    {active ? "Aktif" : "Nonaktif"}
  </span>
);

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
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const Avatar = ({ name = "", photo = null, size = "sm" }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sz} rounded-full ${avatarColor(name)} text-white flex items-center justify-center font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
};

const ConfirmModal = ({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) => {
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
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-semibold disabled:opacity-50 transition-colors ${confirmClass}`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function IndexAccount() {
  const navigate = useNavigate();
  const {
    list, loading, error,
    fetchUsers, deleteUser, toggleUserActive,
    actionLoading, currentUser,
  } = useUser();
  const { employees, fetchEmployees } = useEmployee();

  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    fetchUsers();
    if (fetchEmployees) fetchEmployees();
  }, []);

  const empMap = useMemo(() => {
    const map = {};
    (employees ?? []).forEach((emp) => { map[String(emp.id)] = emp; });
    return map;
  }, [employees]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return list.filter((u) => {
      const emp = u.employeeId ? empMap[String(u.employeeId)] : null;
      const empName = emp?.name || "";
      const matchSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        String(u.id).includes(search) ||
        empName.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [list, search, roleFilter, empMap]);

  const handleToggle = async (id) => {
    const result = await toggleUserActive(id);
    if (!result.error) showToast("Status user berhasil diubah");
    else showToast(result.payload || "Gagal mengubah status", "error");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteUser(deleteConfirm);
    setDeleteConfirm(null);
    if (!result.error) showToast("User berhasil dihapus");
    else showToast(result.payload || "Gagal menghapus user", "error");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg duration-200 animate-slide-in ${
          toast.type === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {toast.type === "error" ? (
            <HiOutlineBan className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!deleteConfirm}
        title="Hapus User?"
        message="Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, Hapus"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={actionLoading}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HiOutlineUsers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manajemen Akun</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {list.length} akun terdaftar · {list.filter((u) => u.isActive).length} aktif
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/accounts/add")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Tambah Akun
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari username, ID, atau nama karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-800"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                  roleFilter === r
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r === "ALL" ? "Semua" : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <HiOutlineRefresh className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
              <p className="text-sm font-semibold">Memuat data...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500">
              <HiOutlineExclamation className="w-8 h-8 mx-auto mb-3 text-red-500" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <HiOutlineSearch className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Tidak ada data yang cocok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["ID", "Username", "Role", "Employee", "Status", "Dibuat", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((user) => {
                    const emp    = user.employeeId ? empMap[String(user.employeeId)] : null;
                    const photo  = emp?.photo || emp?.photoUrl || emp?.profilePhoto || null;
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-gray-400">#{user.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.username} photo={photo} size="sm" />
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{user.username}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-500 border border-indigo-100">
                                  Kamu
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-gray-600">
                            {emp ? emp.name : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge active={user.isActive} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2 justify-end">
                            {/* Edit */}
                            <button
                              onClick={() => navigate(`/accounts/${user.id}`)}
                              title="Edit"
                              className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-950 rounded-xl transition-all"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>

                            {/* Toggle Active */}
                            <button
                              onClick={() => handleToggle(user.id)}
                              title={
                                isSelf
                                  ? "Tidak bisa menonaktifkan akun sendiri"
                                  : user.isActive ? "Nonaktifkan" : "Aktifkan"
                              }
                              disabled={actionLoading || isSelf}
                              className={`p-2 rounded-xl transition-all ${
                                isSelf
                                  ? "opacity-30 cursor-not-allowed bg-gray-50 text-gray-400"
                                  : user.isActive
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                              }`}
                            >
                              {user.isActive ? (
                                <HiOutlineBan className="w-4 h-4" />
                              ) : (
                                <HiOutlineCheckCircle className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete — disembunyikan kalau akun sendiri */}
                            {!isSelf && (
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                title="Hapus"
                                disabled={actionLoading}
                                className="p-2 rounded-xl transition-all bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
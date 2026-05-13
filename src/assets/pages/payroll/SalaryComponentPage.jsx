import React, { useEffect, useState } from 'react';
import { HiOutlineArchive } from 'react-icons/hi';
import usePayroll from '../../../redux/hooks/usePayroll';
import StatusBadge from '../../components/StatusBadge';
import PayrollModal from '../../components/PayrollModal';
import EmptyState from '../../components/EmptyState';

const EMPTY_FORM = {
  code: '', name: '', description: '',
  type: 'EARNING', calculationType: 'FIXED', isActive: true,
};

const SalaryComponentPage = () => {
  const { component, actionLoading, actionError, clearError } = usePayroll();
  const [showModal,    setShowModal]    = useState(false);
  const [editData,     setEditData]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [filterType,   setFilterType]   = useState('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [confirmId,    setConfirmId]    = useState(null);

  useEffect(() => { component.fetchAll(); }, []);

  const filtered = component.list.filter(c => {
    if (!showInactive && !c.isActive) return false;
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    return true;
  });

  const openCreate = () => { setEditData(null); setForm(EMPTY_FORM); clearError(); setShowModal(true); };
  const openEdit   = (item) => {
    setEditData(item);
    setForm({ code: item.code, name: item.name, description: item.description ?? '',
              type: item.type, calculationType: item.calculationType, isActive: item.isActive });
    clearError();
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditData(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = editData
      ? await component.update(editData.id, form)
      : await component.create(form);
    if (res?.meta?.requestStatus === 'fulfilled') closeModal();
  };

  const handleDeactivate = async (id) => {
    await component.deactivate(id);
    setConfirmId(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
          <p className="text-sm text-gray-400 mt-0.5">Komponen earning &amp; deduction untuk payroll</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          + Tambah Komponen
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        {['ALL','EARNING','DEDUCTION'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`text-sm px-4 py-1.5 rounded-xl font-medium border transition-colors
              ${filterType === t ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
            {t === 'ALL' ? 'Semua' : t}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-500 ml-auto cursor-pointer">
          <input type="checkbox" checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Tampilkan nonaktif
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HiOutlineArchive className="w-10 h-10 text-gray-300" />}
            title="Belum ada komponen gaji"
            desc='Klik "+ Tambah Komponen" untuk mulai'
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Kode','Nama','Tipe','Kalkulasi','Status',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isActive ? 'opacity-50':''}`}>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.type} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.calculationType} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      {item.isActive && (
                        <button onClick={() => setConfirmId(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <PayrollModal open={showModal} onClose={closeModal}
        title={editData ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {actionError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl border border-red-200">{actionError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kode *</label>
              <input name="code" value={form.code} onChange={handleChange} required
                placeholder="MEAL_ALLOWANCE"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Huruf kapital, angka, underscore</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Tunjangan Makan"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Opsional"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe *</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EARNING">EARNING</option>
                <option value="DEDUCTION">DEDUCTION</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kalkulasi *</label>
              <select name="calculationType" value={form.calculationType} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="FIXED">FIXED</option>
                <option value="PERCENTAGE">PERCENTAGE</option>
              </select>
            </div>
          </div>
          {editData && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded" />
              Aktif
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-500 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? 'Menyimpan...' : editData ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </PayrollModal>

      {/* Confirm Deactivate */}
      <PayrollModal open={!!confirmId} onClose={() => setConfirmId(null)} title="Nonaktifkan Komponen?" size="sm">
        <p className="text-sm text-gray-600 mb-6">Komponen yang dinonaktifkan tidak akan muncul di payroll run berikutnya.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmId(null)}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            Batal
          </button>
          <button onClick={() => handleDeactivate(confirmId)} disabled={actionLoading}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50">
            {actionLoading ? 'Memproses...' : 'Ya, Nonaktifkan'}
          </button>
        </div>
      </PayrollModal>
    </div>
  );
};

export default SalaryComponentPage;

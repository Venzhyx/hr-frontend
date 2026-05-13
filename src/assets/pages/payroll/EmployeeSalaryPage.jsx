import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HiOutlineUser,
  HiOutlineInbox,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import usePayroll from '../../../redux/hooks/usePayroll';
import StatusBadge from '../../components/StatusBadge';
import PayrollModal from '../../components/PayrollModal';
import EmptyState from '../../components/EmptyState';

const formatRp = (val) => val == null ? 'Rp 0' : 'Rp ' + Number(val).toLocaleString('id-ID');

const EmployeeSalaryPage = () => {
  const { employeeSalary, component, actionLoading, actionError, loading, clearError } = usePayroll();
  const employees = useSelector(s => s.employees?.employees ?? s.employees?.list ?? []);

  const [search,      setSearch]      = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showSalaryModal,    setShowSalaryModal]    = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showHistory,  setShowHistory]  = useState(false);

  // FIX: today dideklarasikan sekali, stabil
  const today = new Date().toISOString().slice(0, 10);

  const [salaryForm,   setSalaryForm]   = useState({ basicSalary: '', effectiveDate: today });
  const [compForm,     setCompForm]     = useState({ salaryComponentId: '', amount: '' });

  useEffect(() => { component.fetchAll(true); }, []);

  const filteredEmp = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.workEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectEmployee = async (emp) => {
    if (selectedEmp?.id === emp.id) return; // sudah selected, skip
    setSelectedEmp(emp);
    employeeSalary.clear(); // FIX: clear dulu supaya data karyawan lama tidak tampil
    await employeeSalary.fetch(emp.id);
    await employeeSalary.fetchHistory(emp.id);
  };

  const openSalaryModal = () => {
    // FIX: reset form dengan effectiveDate yang pasti terisi
    setSalaryForm({
      basicSalary:   employeeSalary.detail?.basicSalary ?? '',
      effectiveDate: today,
    });
    clearError();
    setShowSalaryModal(true);
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();

    // FIX: guard — pastikan effectiveDate tidak kosong sebelum kirim
    if (!salaryForm.effectiveDate) {
      console.error('effectiveDate kosong!');
      return;
    }

    const payload = {
      employeeId:    selectedEmp.id,
      basicSalary:   Number(salaryForm.basicSalary),
      effectiveDate: salaryForm.effectiveDate, // format: YYYY-MM-DD
    };

    // DEBUG: hapus baris ini setelah masalah teratasi
    console.log('>>> Payload dikirim ke backend:', payload);

    const res = await employeeSalary.save(payload);
    if (res?.meta?.requestStatus === 'fulfilled') {
      setShowSalaryModal(false);
      employeeSalary.fetchHistory(selectedEmp.id);
    }
  };

  const handleAddComponent = async (e) => {
    e.preventDefault();
    if (!employeeSalary.detail?.id) return;
    const res = await employeeSalary.addComponent(employeeSalary.detail.id, {
      salaryComponentId: Number(compForm.salaryComponentId),
      amount: Number(compForm.amount),
    });
    if (res?.meta?.requestStatus === 'fulfilled') {
      setShowComponentModal(false);
      setCompForm({ salaryComponentId: '', amount: '' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Salary</h1>
        <p className="text-sm text-gray-400 mt-0.5">Set gaji pokok dan komponen per karyawan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Employee List ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            {filteredEmp.length === 0 ? (
              <EmptyState icon={<HiOutlineUser className="w-10 h-10 text-gray-300" />} title="Tidak ada karyawan" />
            ) : (
              filteredEmp.map(emp => (
                <button key={emp.id} onClick={() => handleSelectEmployee(emp)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50
                              transition-colors border-b border-gray-50 last:border-0
                              ${selectedEmp?.id === emp.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center
                                  justify-center text-sm font-bold flex-shrink-0">
                    {emp.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.jobTitle ?? emp.workEmail}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Salary Detail ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedEmp ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon={<HiOutlineInbox className="w-10 h-10 text-gray-300" />}
                title="Pilih karyawan"
                desc="Klik nama karyawan di sebelah kiri"
              />
            </div>
          ) : (
            <>
              {/* Employee header card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center
                                  justify-center text-lg font-bold">
                    {selectedEmp.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedEmp.name}</p>
                    <p className="text-sm text-gray-400">{selectedEmp.jobTitle} · {selectedEmp.departmentName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={openSalaryModal}
                    className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white
                               px-4 py-2 rounded-xl transition-colors">
                    {employeeSalary.detail ? 'Update Gaji' : 'Set Gaji'}
                  </button>
                  {employeeSalary.detail && (
                    <button onClick={() => { clearError(); setShowComponentModal(true); }}
                      className="text-sm font-semibold border border-blue-600 text-blue-600
                                 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                      + Komponen
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
                  Memuat...
                </div>
              ) : !employeeSalary.detail ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <EmptyState
                    icon={<HiOutlineCurrencyDollar className="w-10 h-10 text-gray-300" />}
                    title="Belum ada salary"
                    desc='Klik "Set Gaji" untuk mulai'
                  />
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Gaji Pokok',      value: formatRp(employeeSalary.detail.basicSalary),    color: 'text-blue-600' },
                      { label: 'Total Earnings',   value: formatRp(employeeSalary.detail.totalEarning),  color: 'text-green-600' },
                      { label: 'Total Deductions', value: formatRp(employeeSalary.detail.totalDeduction), color: 'text-red-500' },
                      { label: 'Net Salary Est.', value: formatRp(employeeSalary.detail.netSalaryEstimate), color: 'text-purple-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Components table */}
                  {employeeSalary.detail.components?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Komponen</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Nama</th>
                            <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Tipe</th>
                            <th className="text-right px-5 py-2.5 text-xs text-gray-400 font-medium">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {employeeSalary.detail.components.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-800">{c.componentName ?? c.name}</td>
                              <td className="px-5 py-3"><StatusBadge status={c.componentType} /></td>
                              <td className="px-5 py-3 text-right font-semibold text-gray-800">{formatRp(c.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Salary History toggle */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => setShowHistory(h => !h)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-medium
                                 text-gray-700 hover:bg-gray-50 transition-colors">
                      <span>Riwayat Perubahan Gaji ({employeeSalary.history.length})</span>
                      <span>{showHistory ? '▲' : '▼'}</span>
                    </button>
                    {showHistory && employeeSalary.history.length > 0 && (
                      <table className="w-full text-sm border-t border-gray-100">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Gaji Pokok</th>
                            <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Efektif</th>
                            <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {employeeSalary.history.map(h => (
                            <tr key={h.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-semibold text-gray-800">{formatRp(h.basicSalary)}</td>
                              <td className="px-5 py-3 text-gray-500 text-xs">
                                {h.effectiveDate?.slice(0,10) ?? h.createdAt?.slice(0,10) ?? '-'}
                              </td>
                              <td className="px-5 py-3"><StatusBadge status={h.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Set Salary Modal */}
      <PayrollModal open={showSalaryModal} onClose={() => setShowSalaryModal(false)}
        title={employeeSalary.detail ? 'Update Gaji Pokok' : 'Set Gaji Pokok'} size="sm">
        <form onSubmit={handleSaveSalary} className="space-y-4">
          {actionError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl border border-red-200">{actionError}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Gaji Pokok (Rp) *</label>
            <input type="number" value={salaryForm.basicSalary}
              onChange={e => setSalaryForm(f => ({ ...f, basicSalary: e.target.value }))} required min={0}
              placeholder="5000000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Efektif *</label>
            <input type="date" value={salaryForm.effectiveDate}
              onChange={e => setSalaryForm(f => ({ ...f, effectiveDate: e.target.value }))} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            Karyawan: <strong>{selectedEmp?.name}</strong>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowSalaryModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
              Batal
            </button>
            <button type="submit" disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50">
              {actionLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </PayrollModal>

      {/* Add Component Modal */}
      <PayrollModal open={showComponentModal} onClose={() => setShowComponentModal(false)}
        title="Tambah Komponen ke Karyawan" size="sm">
        <form onSubmit={handleAddComponent} className="space-y-4">
          {actionError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl border border-red-200">{actionError}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Komponen *</label>
            <select value={compForm.salaryComponentId}
              onChange={e => setCompForm(f => ({ ...f, salaryComponentId: e.target.value }))} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih komponen...</option>
              {component.list.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>[{c.type}] {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah (Rp) *</label>
            <input type="number" value={compForm.amount}
              onChange={e => setCompForm(f => ({ ...f, amount: e.target.value }))} required min={0}
              placeholder="500000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowComponentModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
              Batal
            </button>
            <button type="submit" disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50">
              {actionLoading ? 'Menambah...' : 'Tambah'}
            </button>
          </div>
        </form>
      </PayrollModal>
    </div>
  );
};

export default EmployeeSalaryPage;

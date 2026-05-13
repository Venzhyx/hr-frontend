import React from 'react';

const MAP = {
  EARNING:   'bg-green-50 text-green-700 border border-green-200',
  DEDUCTION: 'bg-red-50 text-red-700 border border-red-200',
  DRAFT:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  FINALIZED: 'bg-blue-50 text-blue-700 border border-blue-200',
  APPROVED:  'bg-green-50 text-green-700 border border-green-200',  // ← tambah ini
  PAID:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ACTIVE:    'bg-green-50 text-green-700 border border-green-200',
  INACTIVE:  'bg-gray-100 text-gray-500 border border-gray-200',
  FIXED:     'bg-blue-50 text-blue-700 border border-blue-200',
  PERCENTAGE:'bg-purple-50 text-purple-700 border border-purple-200',
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MAP[status] ?? 'bg-gray-100 text-gray-500'}`}>
    {status}
  </span>
);

export default StatusBadge;
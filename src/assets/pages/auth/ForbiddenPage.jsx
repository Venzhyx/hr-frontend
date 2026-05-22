import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShieldExclamation } from 'react-icons/hi';
import useAuth from '../../../redux/hooks/useAuth';

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <HiOutlineShieldExclamation className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak</h1>
        <p className="text-sm text-gray-500">
          Kamu tidak memiliki izin untuk mengakses halaman ini.
          {user?.role && (
            <span className="block mt-1">
              Role kamu: <strong>{user.role}</strong>
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                       rounded-xl hover:bg-gray-100 transition-colors">
            Kembali
          </button>
          <button
            onClick={() => navigate(isAdmin ? '/dashboard' : '/my-dashboard')}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600
                       hover:bg-indigo-700 rounded-xl transition-colors">
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;

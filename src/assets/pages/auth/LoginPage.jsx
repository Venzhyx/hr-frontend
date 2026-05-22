import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../redux/hooks/useAuth';
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineUser,
} from 'react-icons/hi';

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, loading, error, isAuthenticated, user, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Kalau sudah login, redirect sesuai role
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === 'ADMIN' ? '/dashboard' : '/my-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user]);

  // Clear error saat user mulai mengetik
  useEffect(() => {
    if (error) clearError();
  }, [username, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-lg shadow-indigo-200">
            <HiOutlineLockClosed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HR Management System</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm
                            px-4 py-3 rounded-xl flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Username
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2
                                          w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Masukkan username"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2
                                                w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 transition-colors">
                  {showPass
                    ? <HiOutlineEyeOff className="w-4 h-4" />
                    : <HiOutlineEye    className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold py-2.5 rounded-xl
                         transition-colors shadow-sm flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Masuk...
                </>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} HR Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

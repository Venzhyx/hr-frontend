import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginThunk,
  registerThunk,
  logout,
  clearAuthError,
} from '../slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth     = useSelector((state) => state.auth);

  // ─── Role helpers ─────────────────────────────────────────────────────────
  const role       = auth.user?.role ?? null;
  const isAdmin    = role === 'ADMIN';
  const isEmployee = role === 'EMPLOYEE';

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const res = await dispatch(loginThunk({ username, password }));
    if (res.meta.requestStatus === 'fulfilled') {
      const userRole = res.payload?.role;
      // Redirect berdasarkan role
      if (userRole === 'ADMIN') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/my-dashboard', { replace: true });
      }
    }
    return res;
  }, [dispatch, navigate]);

  // ─── Register (dipanggil oleh admin) ─────────────────────────────────────
  const register = useCallback((payload) =>
    dispatch(registerThunk(payload)), [dispatch]);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logoutUser = useCallback(() => {
    dispatch(logout());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const clearError = useCallback(() =>
    dispatch(clearAuthError()), [dispatch]);

  return {
    // State
    isAuthenticated: auth.isAuthenticated,
    loading:         auth.loading,
    error:           auth.error,
    user:            auth.user,
    token:           auth.token,

    // Role
    role,
    isAdmin,
    isEmployee,

    // Actions
    login,
    register,
    logout: logoutUser,
    clearError,
  };
};

export default useAuth;

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * PrivateRoute — middleware untuk melindungi route.
 *
 * Props:
 *   roles?: string[]  — role yang diizinkan. Kosong = semua role yang sudah login.
 *
 * Contoh penggunaan di router:
 *
 *   // Semua yang sudah login
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   // Hanya ADMIN
 *   <Route element={<PrivateRoute roles={['ADMIN']} />}>
 *     <Route path="/payroll" element={<Payroll />} />
 *   </Route>
 *
 *   // Hanya EMPLOYEE
 *   <Route element={<PrivateRoute roles={['EMPLOYEE']} />}>
 *     <Route path="/my-dashboard" element={<MyDashboard />} />
 *   </Route>
 */
const PrivateRoute = ({ roles = [] }) => {
  const location        = useLocation();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const userRole        = useSelector((s) => s.auth.user?.role ?? null);

  // Belum login → redirect ke /login, simpan lokasi asal
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — kalau roles kosong berarti cukup login saja
  if (roles.length > 0 && !roles.includes(userRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

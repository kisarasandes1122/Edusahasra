// frontend/src/components/Common/Auth/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const adminInfoString = localStorage.getItem('adminInfo');
  let isAuthenticated = false;

  if (adminInfoString) {
    try {
      const adminInfo = JSON.parse(adminInfoString);
      if (adminInfo && adminInfo.token) {
        isAuthenticated = true;
      } else {
        localStorage.removeItem('adminInfo');
      }
    } catch (e) {
      console.error("Error parsing adminInfo from localStorage:", e);
      localStorage.removeItem('adminInfo');
    }
  }

  console.log("AdminRoute check: isAuthenticated =", isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin-login" replace />;
};

export default AdminRoute;
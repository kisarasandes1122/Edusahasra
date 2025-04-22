// frontend/src/components/Common/Auth/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  // Check if admin information exists in localStorage
  const adminInfoString = localStorage.getItem('adminInfo'); // Assuming you store admin info here
  let isAuthenticated = false;

  if (adminInfoString) {
    try {
      const adminInfo = JSON.parse(adminInfoString);
      // Basic check: Does the info exist and contain a token?
      // You might also check for a specific role here if needed, but usually just token is enough for access
      if (adminInfo && adminInfo.token) {
        isAuthenticated = true;
      } else {
        // Clear invalid/incomplete info
        localStorage.removeItem('adminInfo');
      }
    } catch (e) {
      console.error("Error parsing adminInfo from localStorage:", e);
      // Clear corrupted data
      localStorage.removeItem('adminInfo');
    }
  }

  console.log("AdminRoute check: isAuthenticated =", isAuthenticated); // For debugging

  // If authenticated, render the child route element (<Outlet />)
  // Otherwise, redirect to the admin login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin-login" replace />;
};

export default AdminRoute;
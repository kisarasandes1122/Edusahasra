import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const SchoolRoute = () => {
  const schoolInfoString = localStorage.getItem('schoolInfo');
  let isAuthenticated = false;

  if (schoolInfoString) {
    try {
      const schoolInfo = JSON.parse(schoolInfoString);
      if (schoolInfo && schoolInfo.token) {
        isAuthenticated = true;
      } else {
        localStorage.removeItem('schoolInfo');
      }
    } catch (e) {
      console.error("Error parsing schoolInfo from localStorage:", e);
      localStorage.removeItem('schoolInfo');
    }
  }

  console.log("SchoolRoute check: isAuthenticated =", isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/school-login" replace />;
};

export default SchoolRoute;
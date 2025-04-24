// frontend/src/components/Admin/AdminNavigation/AdminNavigation.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldCheck, Package, BarChart, Settings, Book } from 'lucide-react'; // Import icons
import logoImage from '../../../assets/images/EduSahasra.png'; // Assuming the path is correct

import './AdminNavigation.css'; // Import the CSS file

const AdminNavigation = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Get current location to highlight active link

  // --- Logout Handler ---
  const handleLogout = () => {
    // Optional: Confirm logout
    if (window.confirm('Are you sure you want to log out?')) {
      // Clear admin info from localStorage
      localStorage.removeItem('adminInfo');

      // Redirect to the admin login page
      navigate('/admin-login', { replace: true }); // Use replace: true to prevent going back
    }
  };

  // --- Helper to determine if a link is active ---
  // This helper checks if the current location starts with the link's path.
  // This is useful for highlighting parent links when on nested routes (e.g., highlighting /admin/impact-stories when on /admin/impact-stories/:id)
  const isActive = (pathname) => {
      // Special case for the root dashboard path to ensure it only matches exactly /admin
       if (pathname === '/admin') {
           return location.pathname === '/admin';
       }
       // For other paths, check if the current path starts with the link's path
       // We add a '/' or end-of-string check to avoid false positives like matching '/admin/settings' with a link to '/admin/school'
       const regex = new RegExp(`^${pathname}(\/|$)`);
       return regex.test(location.pathname);
  };


  return (
    <div className="edusahasra-navigation"> {/* Use the main container class from CSS */}
      <div className="edusahasra-logo-container"> {/* Use logo container class */}
        <img src={logoImage} alt="EduSahasra Logo" className="edusahasra-logo" /> {/* Use logo class */}
        {/* Assuming the brand name text is not part of this component based on CSS */}
        {/* <span className="edusahasra-brand-name">EduSahasra Admin</span> */}
      </div>

      <ul className="edusahasra-nav-items"> {/* Use nav items list class */}

        {/* --- Navigation Links --- */}

        <li className="edusahasra-nav-item"> {/* Use nav item class */}
            <Link
              to="/admin"
              // FIX: Added space before the comment here and on similar lines below
              className={`edusahasra-nav-link ${isActive('/admin') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon"> {/* Use icon container class */}
                 <LayoutDashboard className="edusahasra-nav-icon-element" size={18} /> {/* Use icon element class */}
              </div>
              <span className="edusahasra-nav-label">Dashboard</span> {/* Use label class */}
            </Link>
          </li>

          <li className="edusahasra-nav-item">
            <Link
              to="/admin/school-verification"
              className={`edusahasra-nav-link ${isActive('/admin/school-verification') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon">
                <ShieldCheck className="edusahasra-nav-icon-element" size={18} />
              </div>
              <span className="edusahasra-nav-label">School Verification</span>
            </Link>
          </li>

           <li className="edusahasra-nav-item">
            {/* Assuming donation management path */}
            <Link
               to="/admin/donation-management"
               className={`edusahasra-nav-link ${isActive('/admin/donation-management') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon">
                <Package className="edusahasra-nav-icon-element" size={18} />
              </div>
              <span className="edusahasra-nav-label">Donation Management</span>
            </Link>
          </li>

           <li className="edusahasra-nav-item">
            {/* Link to Admin Impact Stories Page */}
            <Link
               to="/admin/impact-stories"
               className={`edusahasra-nav-link ${isActive('/admin/impact-stories') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon">
                <Book className="edusahasra-nav-icon-element" size={18} /> {/* Or appropriate icon */}
              </div>
              <span className="edusahasra-nav-label">Impact Stories</span>
            </Link>
          </li>

           <li className="edusahasra-nav-item">
            {/* Assuming analytics path */}
            <Link
               to="/admin/analytics-reports"
               className={`edusahasra-nav-link ${isActive('/admin/analytics-reports') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon">
                <BarChart className="edusahasra-nav-icon-element" size={18} />
              </div>
              <span className="edusahasra-nav-label">Analytics & Reports</span>
            </Link>
          </li>

          <li className="edusahasra-nav-item">
             {/* Assuming settings path */}
            <Link
               to="/admin/settings"
               className={`edusahasra-nav-link ${isActive('/admin/settings') ? 'edusahasra-nav-link-active' : ''}`} /* Use nav link and active classes */
            >
              <div className="edusahasra-nav-icon">
                <Settings className="edusahasra-nav-icon-element" size={18} />
              </div>
              <span className="edusahasra-nav-label">Settings</span>
            </Link>
          </li>

          {/* --- Logout Button --- */}
          {/* Placed at the end or in a dedicated footer area */}
          <li className="edusahasra-nav-item"> {/* Use nav item class */}
            <button
              onClick={handleLogout}
              className="edusahasra-nav-link logout-button" /* Use nav link and logout button classes */
            >
              <div className="edusahasra-nav-icon"> {/* Use icon container class */}
                <LogOut className="edusahasra-nav-icon-element" size={18} /> {/* Use icon element class */}
              </div>
              <span className="edusahasra-nav-label">Logout</span> {/* Use label class */}
            </button>
          </li>
        </ul>

        {/* You might add admin user info here below the ul */}
        {/* <div className="admin-user-info">...</div> */}

    </div>
  );
};

export default AdminNavigation;
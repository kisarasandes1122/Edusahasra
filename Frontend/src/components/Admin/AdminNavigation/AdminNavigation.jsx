// frontend/src/components/Admin/AdminNavigation/AdminNavigation.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldCheck, Package, BarChart, Settings, Book } from 'lucide-react';
import logoImage from '../../../assets/images/EduSahasra.png';
import './AdminNavigation.css';

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('adminInfo');
      navigate('/admin-login', { replace: true });
    }
  };

  const isActive = (pathname) => {
    if (pathname === '/admin') {
      return location.pathname === '/admin';
    }
    const regex = new RegExp(`^${pathname}(\/|$)`);
    return regex.test(location.pathname);
  };

  return (
    <div className="edusahasra-navigation">
      <div className="edusahasra-logo-container">
        <img src={logoImage} alt="EduSahasra Logo" className="edusahasra-logo" />
      </div>

      <ul className="edusahasra-nav-items">
        <li className="edusahasra-nav-item">
          <Link
            to="/admin"
            className={`edusahasra-nav-link ${isActive('/admin') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <LayoutDashboard className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Dashboard</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <Link
            to="/admin/school-verification"
            className={`edusahasra-nav-link ${isActive('/admin/school-verification') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <ShieldCheck className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">School Verification</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <Link
            to="/admin/donation-management"
            className={`edusahasra-nav-link ${isActive('/admin/donation-management') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <Package className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Donation Management</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <Link
            to="/admin/impact-stories"
            className={`edusahasra-nav-link ${isActive('/admin/impact-stories') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <Book className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Impact Stories</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <Link
            to="/admin/analytics-reports"
            className={`edusahasra-nav-link ${isActive('/admin/analytics-reports') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <BarChart className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Analytics & Reports</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <Link
            to="/admin/settings"
            className={`edusahasra-nav-link ${isActive('/admin/settings') ? 'edusahasra-nav-link-active' : ''}`}
          >
            <div className="edusahasra-nav-icon">
              <Settings className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Settings</span>
          </Link>
        </li>

        <li className="edusahasra-nav-item">
          <button
            onClick={handleLogout}
            className="edusahasra-nav-link logout-button"
          >
            <div className="edusahasra-nav-icon">
              <LogOut className="edusahasra-nav-icon-element" size={18} />
            </div>
            <span className="edusahasra-nav-label">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AdminNavigation;
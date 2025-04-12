import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiCheckboxCircleLine,
  RiMoneyDollarCircleLine,
  RiBarChartBoxLine,
  RiSettings3Line
} from 'react-icons/ri';
import './AdminNavigation.css';
import logoImage from '../../../assets/images/EduSahasra.png';

const AdminNavigation = () => {
  const navItems = [
    {
      id: 1,
      icon: <RiDashboardLine className="edusahasra-nav-icon-element" />,
      label: 'Dashboard',
      path: '/admin',
      end: true // <-- Add this flag for exact matching
    },
    {
      id: 2,
      icon: <RiCheckboxCircleLine className="edusahasra-nav-icon-element" />,
      label: 'School Verification',
      path: '/admin/school-verification'
      // No 'end' needed here, default partial matching is usually fine for nested routes
    },
    {
      id: 3,
      icon: <RiMoneyDollarCircleLine className="edusahasra-nav-icon-element" />,
      label: 'Donation Management',
      path: '/admin/donation-management'
    },
    {
      id: 4,
      icon: <RiBarChartBoxLine className="edusahasra-nav-icon-element" />,
      label: 'Analytics & Reports',
      path: '/admin/analytics-reports'
    },
    {
      id: 5,
      icon: <RiSettings3Line className="edusahasra-nav-icon-element" />,
      label: 'Settings',
      path: '/admin/settings'
    },
  ];

  return (
    <nav className="edusahasra-navigation">
      <div className="edusahasra-logo-container">
        <img src={logoImage} alt="EduSahasra Logo" className="edusahasra-logo" />
      </div>

      <ul className="edusahasra-nav-items">
        {navItems.map(item => (
          <li key={item.id} className="edusahasra-nav-item">
            <NavLink
              to={item.path}
              // Pass the 'end' prop from the item object to NavLink
              // It will be true for Dashboard, undefined (falsy) for others
              end={item.end}
              className={({ isActive }) =>
                isActive ? "edusahasra-nav-link edusahasra-nav-link-active" : "edusahasra-nav-link"
              }
            >
              <span className="edusahasra-nav-icon">{item.icon}</span>
              <span className="edusahasra-nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNavigation;
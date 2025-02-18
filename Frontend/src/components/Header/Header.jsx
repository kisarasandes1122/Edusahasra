import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import logo from '../../assets/images/Edusahasra.png';
import { IoCalendarOutline } from 'react-icons/io5';
import { FiTool } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

console.log('Dropdown state:', isDropdownOpen);


  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src={logo} alt="EdukaShare Logo" />
        </div>
        <nav className="nav">
          <ul>
            <li className="dropdown-container" ref={dropdownRef}>
              <button 
                className="dropdown-trigger"
                onClick={toggleDropdown}
              >
                Donors <IoIosArrowDown className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <h3 className="dropdown-title">For Donors</h3><hr />
                  <div className="dropdown-items">
                    <a href="#browse" className="dropdown-item">
                      <IoCalendarOutline className="dropdown-icon" />
                      <div className="dropdown-content">
                        <span className="dropdown-item-title">Browse Needs</span>
                        <span className="dropdown-item-description">Filter Requests by location, needs, or urgency</span>
                      </div>
                    </a>
                    <a href="#how-it-works" className="dropdown-item">
                      <FiTool className="dropdown-icon" />
                      <div className="dropdown-content">
                        <span className="dropdown-item-title">How It Works</span>
                        <span className="dropdown-item-description">Step-by-step donation process</span>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </li>
            <li><a href="#about">About</a></li>
            <li><a href="#impact">Impact</a></li>
          </ul>
        </nav>
        <div className="header-buttons">
          <button className="btn btn-secondary">Start Donate</button>
          <button className="btn btn-primary">Request Donation</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
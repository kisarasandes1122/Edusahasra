import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import './DonationModal.css';
import logo from '../../../assets/images/Edusahasra.png';
import { IoCalendarOutline } from 'react-icons/io5';
import { FiTool } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { IoChatbox } from "react-icons/io5";


const DonationModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-content">
          <h2 className="modal-title">Get Started with Your Donation</h2>
          <p className="modal-subtitle">Create a account or Log in to Donate and manage donations</p>
          
          <div className="registration-section">
            <h3 className="section-title">Donor Registration</h3>
            <p className="section-description">New Here? Sign up start making an impact.</p>
            <a href="/donor-register"><button className="modal-button register-button">Register Now</button></a>
          </div>
          
          <div className="login-section">
            <h3 className="section-title">Donor Login</h3>
            <p className="section-description">Already have an account? Log in to continue Donating</p>
            <a href="/donor-login"><button className="modal-button login-button">Login Now</button></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-content">
          <h2 className="modal-title">Get Started with Your Education Support</h2>
          <p className="modal-subtitle">Create an account or log in to access learning resources and assistance.</p>
          
          <div className="registration-section">
            <h3 className="section-title">School/Teacher Registration</h3>
            <p className="section-description">New Here? Sign up to get the support you need.</p>
            <a href="/school-register"><button className="modal-button register-button">Register Now</button></a>
          </div>
          
          <div className="login-section">
            <h3 className="section-title">School/Teacher Login</h3>
            <p className="section-description">Already have an account? Log in to continue request.</p>
            <a href="/school-login"><button className="modal-button login-button">Login Now</button></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ isAuthenticated, user }) => {
  const [isDonorsDropdownOpen, setIsDonorsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const donorsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (donorsDropdownRef.current && !donorsDropdownRef.current.contains(event.target)) {
        setIsDonorsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDonorsDropdown = (e) => {
    e.stopPropagation();
    setIsDonorsDropdownOpen(!isDonorsDropdownOpen);
  };

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleStartDonate = () => {
    setIsDonationModalOpen(true);
  };

  const handleRequestDonation = () => {
    setIsRequestModalOpen(true);
  };

  const handleLogout = () => {
    // Add logout logic here
    // e.g., clear JWT token, update auth context, redirect
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <a href="/"><img src={logo} alt="EdukaShare Logo" /></a>
          </div>
          
          <nav className="nav">
            <ul>
              <li className="dropdown-container" ref={donorsDropdownRef}>
                <button 
                  className="dropdown-trigger"
                  onClick={toggleDonorsDropdown}
                >
                  Donors <IoIosArrowDown className={`dropdown-arrow ${isDonorsDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isDonorsDropdownOpen && (
                  <div className="dropdown-menu">
                    <h3 className="dropdown-title">For Donors</h3><hr />
                    <div className="dropdown-items">
                      <a href="/needs" className="dropdown-item">
                        <IoCalendarOutline className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">Browse Needs</span>
                          <span className="dropdown-item-description">Filter Requests by location, needs, or urgency</span>
                        </div>
                      </a>
                      <a href="/howitworks" className="dropdown-item">
                        <FiTool className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">How It Works</span>
                          <span className="dropdown-item-description">Step-by-step donation process</span>
                        </div>
                      </a>
                      <a href="/feedbacks" className="dropdown-item">
                        <IoChatbox  className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">Feebacks</span>
                          <span className="dropdown-item-description">See what others say about their experience</span>
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

          <div className="header-user">
            {isAuthenticated ? (
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button 
                  className="user-dropdown-trigger"
                  onClick={toggleUserDropdown}
                >
                  <span className="user-name">{user?.name || 'User'}</span>
                  <IoIosArrowDown className={`dropdown-arrow ${isUserDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <h3 className="user-dropdown-title">{user?.name || 'User'}</h3>
                    </div>
                    <div className="user-dropdown-items">
                      <a href="/donations" className="user-dropdown-item">
                        <div className="icon-wrapper">
                          <span className="icon">📊</span>
                        </div>
                        <div className="dropdown-content">
                          <span className="item-title">My Donations</span>
                          <span className="item-description">Track past donations.</span>
                        </div>
                      </a>
                      <a href="/messages" className="user-dropdown-item">
                        <div className="icon-wrapper">
                          <span className="icon">💬</span>
                        </div>
                        <div className="dropdown-content">
                          <span className="item-title">Messages</span>
                          <span className="item-description">View messages from schools.</span>
                        </div>
                      </a>
                      <a href="/profile" className="user-dropdown-item">
                        <div className="icon-wrapper">
                          <span className="icon">👤</span>
                        </div>
                        <div className="dropdown-content">
                          <span className="item-title">Edit Profile</span>
                          <span className="item-description">Manage account & preferences</span>
                        </div>
                      </a>
                      <button onClick={handleLogout} className="user-dropdown-item">
                        <div className="icon-wrapper">
                          <span className="icon">🚪</span>
                        </div>
                        <div className="dropdown-content">
                          <span className="item-title">Log out</span>
                          <span className="item-description">Securely exit your account</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-buttons">
                <button className="btn btn-secondary" onClick={handleStartDonate}>
                  Start Donate
                </button>
                <button className="btn btn-primary" onClick={handleRequestDonation}>
                  Request Donation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />
      <RequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </>
  );
};

export default Header;
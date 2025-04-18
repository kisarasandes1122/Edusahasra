import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Header.css';
import './DonationModal.css';
import logo from '../../../assets/images/Edusahasra.png'; // Ensure this path is correct
import { IoCalendarOutline } from 'react-icons/io5';
import { FiTool } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { IoChatbox } from "react-icons/io5";

// --- DonationModal Component (keep as is) ---
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
          <p className="modal-subtitle">Create an account or Log in to Donate and manage donations</p>
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

// --- RequestModal Component (keep as is) ---
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


// --- Updated Header Component ---
const Header = () => { // Removed isAuthenticated, user props
  const [isDonorsDropdownOpen, setIsDonorsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State for auth status
  const [currentUser, setCurrentUser] = useState(null); // State for user info

  const donorsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate(); // Hook for navigation

  // Check login status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUserInfo = localStorage.getItem('donorInfo');
      if (storedUserInfo) {
        try {
          const userData = JSON.parse(storedUserInfo);
          // You might want to add a check for token validity/expiry here later
          if (userData && userData.token) {
            setCurrentUser(userData);
            setIsLoggedIn(true);
          } else {
            // Invalid data structure, clear it
            localStorage.removeItem('donorInfo');
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error("Failed to parse donorInfo from localStorage", error);
          localStorage.removeItem('donorInfo'); // Clear corrupted data
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for storage changes (e.g., logout in another tab)
    window.addEventListener('storage', checkAuthStatus);

    // Listen for custom login/logout events (optional, but good for immediate UI updates)
    // Example: window.addEventListener('authChange', checkAuthStatus);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      // Example: window.removeEventListener('authChange', checkAuthStatus);
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount


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
    setIsUserDropdownOpen(false); // Close user dropdown if open
  };

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsDonorsDropdownOpen(false); // Close donors dropdown if open
  };

  const handleStartDonate = () => {
    setIsDonationModalOpen(true);
  };

  const handleRequestDonation = () => {
    setIsRequestModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('donorInfo');

    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false); 
    navigate('/'); 
    window.location.reload(); 
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
              <li><a href="/">Home</a></li>
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
                      {/* Add other donor links here if needed */}
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
                          <span className="dropdown-item-title">Feedbacks</span>
                          <span className="dropdown-item-description">See what others say about their experience</span>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </li>
              <li><a href="/aboutus">About</a></li>
              <li><a href="#impact">Impact</a></li> {/* Make sure you have an element with id="impact" or change href */}
            </ul>
          </nav>

          <div className="header-user">
            {/* Use internal isLoggedIn state for conditional rendering */}
            {isLoggedIn && currentUser ? (
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button
                  className="user-dropdown-trigger"
                  onClick={toggleUserDropdown}
                >
                  {/* Use fullName from stored user data */}
                  <span className="user-name">{currentUser.fullName || 'User'}</span>
                  <IoIosArrowDown className={`dropdown-arrow ${isUserDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                       {/* Use fullName from stored user data */}
                      <h3 className="user-dropdown-title">{currentUser.fullName || 'User'}</h3>
                      {/* Optionally display email */}
                      {/* <p className="user-dropdown-email">{currentUser.email}</p> */}
                    </div>
                    <div className="user-dropdown-items">
                      <a href="/my-donations" className="user-dropdown-item">
                        <div className="icon-wrapper"><span className="icon">📊</span></div>
                        <div className="dropdown-content">
                          <span className="item-title">My Donations</span>
                          <span className="item-description">Track donations.</span>
                        </div>
                      </a>
                      <a href="/messages" className="user-dropdown-item">
                        <div className="icon-wrapper"><span className="icon">💬</span></div>
                        <div className="dropdown-content">
                          <span className="item-title">Messages</span>
                          <span className="item-description">View messages from schools.</span>
                        </div>
                      </a>
                      <a href="/profile" className="user-dropdown-item">
                        <div className="icon-wrapper"><span className="icon">👤</span></div>
                        <div className="dropdown-content">
                          <span className="item-title">Edit Profile</span>
                          <span className="item-description">Manage account & preferences</span>
                        </div>
                      </a>
                      {/* Logout Button */}
                      <button onClick={handleLogout} className="user-dropdown-item logout-button">
                        <div className="icon-wrapper"><span className="icon">🚪</span></div>
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
              // Show these buttons if not logged in
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

      {/* Modals remain the same */}
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
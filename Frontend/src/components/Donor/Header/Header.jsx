import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import './DonationModal.css';
import logo from '../../../assets/images/Edusahasra.png';
import { IoCalendarOutline, IoLeafOutline } from 'react-icons/io5';
import { FiTool, FiHeart, FiChevronDown, FiMenu, FiX } from 'react-icons/fi';
import { IoChatbox, IoSchoolOutline } from "react-icons/io5";

// --- DonationModal Component (unchanged) ---
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

// --- RequestModal Component (unchanged) ---
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


// --- Updated Header Component with Modern Look and Green Theme ---
const Header = () => {
  const [isDonorsDropdownOpen, setIsDonorsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const donorsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Toggle body class when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  // Check login status on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUserInfo = localStorage.getItem('donorInfo');
      if (storedUserInfo) {
        try {
          const userData = JSON.parse(storedUserInfo);
          if (userData && userData.token) {
            setCurrentUser(userData);
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('donorInfo');
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error("Failed to parse donorInfo from localStorage", error);
          localStorage.removeItem('donorInfo');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Handle clicks outside dropdowns and mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle dropdowns
      if (donorsDropdownRef.current && !donorsDropdownRef.current.contains(event.target)) {
        setIsDonorsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      
      // Handle mobile menu - close menu when clicking outside
      // But don't close it if we click the menu toggle button
      if (mobileMenuOpen && 
          mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Close mobile menu when window is resized beyond mobile breakpoint
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  const toggleDonorsDropdown = (e) => {
    e.stopPropagation();
    setIsDonorsDropdownOpen(!isDonorsDropdownOpen);
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsDonorsDropdownOpen(false);
  };

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleStartDonate = () => {
    setIsDonationModalOpen(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleRequestDonation = () => {
    setIsRequestModalOpen(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleLogout = () => {
    localStorage.removeItem('donorInfo');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    setMobileMenuOpen(false); // Close mobile menu if open
    navigate('/');
    window.location.reload();
  };

  // Close mobile menu when clicking nav links
  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-res">
            <div className="logo">
              <a href="/"><img src={logo} alt="EduSahasra Logo" /></a>
            </div>

            {/* Mobile menu toggle button */}
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* Mobile menu overlay - improves UX */}
          <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

          {/* Main navigation */}
          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
            <ul>
              <li><a href="/" onClick={handleNavLinkClick}>Home</a></li>
              <li className="dropdown-container" ref={donorsDropdownRef}>
                <button
                  className="dropdown-trigger"
                  onClick={toggleDonorsDropdown}
                >
                  Donors <FiChevronDown className={`dropdown-arrow ${isDonorsDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isDonorsDropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-items">
                      <a href="/needs" className="dropdown-item" onClick={handleNavLinkClick}>
                        <IoCalendarOutline className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">Browse Needs</span>
                          <span className="dropdown-item-description">Filter Requests by location, needs, or urgency</span>
                        </div>
                      </a>
                      <a href="/how-it-works" className="dropdown-item" onClick={handleNavLinkClick}>
                        <FiTool className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">How It Works</span>
                          <span className="dropdown-item-description">Step-by-step donation process</span>
                        </div>
                      </a>
                      <a href="/feedbacks" className="dropdown-item" onClick={handleNavLinkClick}>
                        <IoChatbox className="dropdown-icon" />
                        <div className="dropdown-content">
                          <span className="dropdown-item-title">Feedbacks</span>
                          <span className="dropdown-item-description">See what others say about their experience</span>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </li>
              <li><a href="/about-us" onClick={handleNavLinkClick}>About</a></li>
              <li><a href="/impact-stories" onClick={handleNavLinkClick}>Impact</a></li>
              
              {/* Mobile-only buttons (visible in mobile menu) */}
              {!isLoggedIn && (
                <li className="mobile-only-buttons">
                  <div className="header-buttons">
                    <button className="btn btn-secondary" onClick={handleStartDonate}>
                      <FiHeart style={{ marginRight: '6px' }} /> Start Donate
                    </button>
                    <button className="btn btn-primary" onClick={handleRequestDonation}>
                      <IoSchoolOutline style={{ marginRight: '6px' }} /> Request Donation
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </nav>

          <div className="header-user">
            {isLoggedIn && currentUser ? (
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button
                  className="user-dropdown-trigger"
                  onClick={toggleUserDropdown}
                >
                  <span className="user-name">{currentUser.fullName || 'User'}</span>
                  <FiChevronDown className={`dropdown-arrow ${isUserDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <h3 className="user-dropdown-title">{currentUser.fullName || 'User'}</h3>
                    </div>
                    <div className="user-dropdown-items">
                      <a href="/my-donations" className="user-dropdown-item">
                        <div className="icon-wrapper"><IoLeafOutline /></div>
                        <div className="dropdown-content">
                          <span className="item-title">My Donations</span>
                          <span className="item-description">Track your contributions</span>
                        </div>
                      </a>
                      <a href="/messages" className="user-dropdown-item">
                        <div className="icon-wrapper"><IoChatbox /></div>
                        <div className="dropdown-content">
                          <span className="item-title">Messages</span>
                          <span className="item-description">View messages from schools</span>
                        </div>
                      </a>
                      <a href="/profile" className="user-dropdown-item">
                        <div className="icon-wrapper"><FiHeart /></div>
                        <div className="dropdown-content">
                          <span className="item-title">Edit Profile</span>
                          <span className="item-description">Manage account & preferences</span>
                        </div>
                      </a>
                      <button onClick={handleLogout} className="user-dropdown-item logout-button">
                        <div className="icon-wrapper"><FiX /></div>
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
              // Show these buttons only on desktop
              <div className="header-buttons desktop-only-buttons">
                <button className="btn btn-secondary" onClick={handleStartDonate}>
                  <FiHeart style={{ marginRight: '6px' }} /> Start Donate
                </button>
                <button className="btn btn-primary" onClick={handleRequestDonation}>
                  <IoSchoolOutline style={{ marginRight: '6px' }} /> Request Donation
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
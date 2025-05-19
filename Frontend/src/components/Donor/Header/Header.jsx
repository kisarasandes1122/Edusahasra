import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import './DonationModal.css';
import logo from '../../../assets/images/Edusahasra.png';
import { IoCalendarOutline, IoLeafOutline } from 'react-icons/io5';
import { FiTool, FiHeart, FiChevronDown, FiMenu, FiX, FiChevronRight } from 'react-icons/fi';
import { IoChatbox, IoSchoolOutline } from "react-icons/io5";

// --- Updated DonationModal Component with unique class names ---
const DonationModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="edu-modal-overlay">
      <div className="edu-modal-container" ref={modalRef}>
        <button className="edu-modal-close" onClick={onClose} aria-label="Close modal">
          <FiX />
        </button>
        <div className="edu-modal-content">
          <h2 className="edu-modal-title">Get Started with Your Donation</h2>
          <p className="edu-modal-subtitle">Create an account or log in to donate and track your impact</p>
          
          <div className="edu-registration-section">
            <div className="edu-section-heading-container">
              <h3 className="edu-section-title">Donor Registration</h3>
              <div className="edu-section-divider">
                <div className="edu-section-divider-accent"></div>
              </div>
            </div>
            <p className="edu-section-description">New here? Sign up to start making an impact.</p>
            <a href="/donor-register">
              <button className="edu-modal-button edu-register-button">
                Register Now <FiChevronRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
            </a>
          </div>
          
          <div className="edu-login-section">
            <div className="edu-section-heading-container">
              <h3 className="edu-section-title">Donor Login</h3>
              <div className="edu-section-divider">
                <div className="edu-section-divider-accent"></div>
              </div>
            </div>
            <p className="edu-section-description">Already have an account? Log in to continue donating.</p>
            <a href="/donor-login">
              <button className="edu-modal-button edu-login-button">
                Login Now <FiChevronRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Updated RequestModal Component with unique class names ---
const RequestModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="edu-modal-overlay">
      <div className="edu-modal-container" ref={modalRef}>
        <button className="edu-modal-close" onClick={onClose} aria-label="Close modal">
          <FiX />
        </button>
        <div className="edu-modal-content">
          <h2 className="edu-modal-title">Get Started with Your Education Support</h2>
          <p className="edu-modal-subtitle">Create an account or log in to access learning resources and assistance</p>
          
          <div className="edu-registration-section">
            <div className="edu-section-heading-container">
              <h3 className="edu-section-title">School/Teacher Registration</h3>
              <div className="edu-section-divider">
                <div className="edu-section-divider-accent"></div>
              </div>
            </div>
            <p className="edu-section-description">New here? Sign up to get the support you need.</p>
            <a href="/school-register">
              <button className="edu-modal-button edu-register-button">
                Register Now <FiChevronRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
            </a>
          </div>
          
          <div className="edu-login-section">
            <div className="edu-section-heading-container">
              <h3 className="edu-section-title">School/Teacher Login</h3>
              <div className="edu-section-divider">
                <div className="edu-section-divider-accent"></div>
              </div>
            </div>
            <p className="edu-section-description">Already have an account? Log in to continue request.</p>
            <a href="/school-login">
              <button className="edu-modal-button edu-login-button">
                Login Now <FiChevronRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Updated Header Component with unique class names ---
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
      document.body.classList.add('edu-menu-open');
    } else {
      document.body.classList.remove('edu-menu-open');
    }
    
    return () => {
      document.body.classList.remove('edu-menu-open');
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
          !event.target.closest('.edu-mobile-menu-toggle')) {
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
      <header className="edu-header">
        <div className="edu-header-content">
          <div className="edu-header-res">
            <div className="edu-logo">
              <a href="/"><img src={logo} alt="EduSahasra Logo" /></a>
            </div>

            {/* Mobile menu toggle button */}
            <button 
              className="edu-mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* Mobile menu overlay - improves UX */}
          <div className={`edu-mobile-menu-overlay ${mobileMenuOpen ? 'edu-active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

          {/* Main navigation */}
          <nav className={`edu-nav ${mobileMenuOpen ? 'edu-open' : ''}`} ref={mobileMenuRef}>
            <ul className="edu-nav-list">
              <li className="edu-nav-item"><a className="edu-nav-link" href="/" onClick={handleNavLinkClick}>Home</a></li>
              <li className="edu-nav-item edu-dropdown-container" ref={donorsDropdownRef}>
                <button
                  className="edu-dropdown-trigger"
                  onClick={toggleDonorsDropdown}
                >
                  Donors <FiChevronDown className={`edu-dropdown-arrow ${isDonorsDropdownOpen ? 'edu-rotated' : ''}`} />
                </button>
                {isDonorsDropdownOpen && (
                  <div className="edu-dropdown-menu">
                    <div className="edu-dropdown-items">
                      <a href="/needs" className="edu-dropdown-item" onClick={handleNavLinkClick}>
                        <IoCalendarOutline className="edu-dropdown-icon" />
                        <div className="edu-dropdown-content">
                          <span className="edu-dropdown-item-title">Browse Needs</span>
                          <span className="edu-dropdown-item-description">Filter Requests by location, needs, or urgency</span>
                        </div>
                      </a>
                      <a href="/how-it-works" className="edu-dropdown-item" onClick={handleNavLinkClick}>
                        <FiTool className="edu-dropdown-icon" />
                        <div className="edu-dropdown-content">
                          <span className="edu-dropdown-item-title">How It Works</span>
                          <span className="edu-dropdown-item-description">Step-by-step donation process</span>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </li>
              <li className="edu-nav-item"><a className="edu-nav-link" href="/about-us" onClick={handleNavLinkClick}>About</a></li>
              <li className="edu-nav-item"><a className="edu-nav-link" href="/impact-stories" onClick={handleNavLinkClick}>Impact</a></li>
              
              {/* Mobile-only buttons (visible in mobile menu) */}
              {!isLoggedIn && (
                <li className="edu-mobile-only-buttons">
                  <div className="edu-header-buttons">
                    <button className="edu-btn edu-btn-secondary" onClick={handleStartDonate}>
                      <FiHeart style={{ marginRight: '6px' }} /> Start Donate
                    </button>
                    <button className="edu-btn edu-btn-primary" onClick={handleRequestDonation}>
                      <IoSchoolOutline style={{ marginRight: '6px' }} /> Request Donation
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </nav>

          <div className="edu-header-user">
            {isLoggedIn && currentUser ? (
              <div className="edu-user-dropdown-container" ref={userDropdownRef}>
                <button
                  className="edu-user-dropdown-trigger"
                  onClick={toggleUserDropdown}
                >
                  <span className="edu-user-name">{currentUser.fullName || 'User'}</span>
                  <FiChevronDown className={`edu-dropdown-arrow ${isUserDropdownOpen ? 'edu-rotated' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="edu-user-dropdown-menu">
                    <div className="edu-user-dropdown-header">
                      <h3 className="edu-user-dropdown-title">{currentUser.fullName || 'User'}</h3>
                    </div>
                    <div className="edu-user-dropdown-items">
                      <a href="/my-donations" className="edu-user-dropdown-item">
                        <div className="edu-icon-wrapper"><IoLeafOutline /></div>
                        <div className="edu-dropdown-content">
                          <span className="edu-item-title">My Donations</span>
                          <span className="edu-item-description">Track your contributions</span>
                        </div>
                      </a>
                      <a href="/messages" className="edu-user-dropdown-item">
                        <div className="edu-icon-wrapper"><IoChatbox /></div>
                        <div className="edu-dropdown-content">
                          <span className="edu-item-title">Messages</span>
                          <span className="edu-item-description">View messages from schools</span>
                        </div>
                      </a>
                      <a href="/profile" className="edu-user-dropdown-item">
                        <div className="edu-icon-wrapper"><FiHeart /></div>
                        <div className="edu-dropdown-content">
                          <span className="edu-item-title">Edit Profile</span>
                          <span className="edu-item-description">Manage account & preferences</span>
                        </div>
                      </a>
                      <button onClick={handleLogout} className="edu-user-dropdown-item edu-logout-button">
                        <div className="edu-icon-wrapper"><FiX /></div>
                        <div className="edu-dropdown-content">
                          <span className="edu-item-title">Log out</span>
                          <span className="edu-item-description">Securely exit your account</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Show these buttons only on desktop
              <div className="edu-header-buttons edu-desktop-only-buttons">
                <button className="edu-btn edu-btn-secondary" onClick={handleStartDonate}>
                  <FiHeart style={{ marginRight: '6px' }} /> Start Donate
                </button>
                <button className="edu-btn edu-btn-primary" onClick={handleRequestDonation}>
                  <IoSchoolOutline style={{ marginRight: '6px' }} /> Request Donation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Updated Modals */}
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
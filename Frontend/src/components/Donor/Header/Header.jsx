import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './Header.css';
import './DonationModal.css';
import logo from '../../../assets/images/Edusahasra.png';
import { IoCalendarOutline, IoChatbox } from 'react-icons/io5';
import { FiTool } from 'react-icons/fi';
import { IoIosArrowDown, IoIosMenu, IoIosClose } from 'react-icons/io'; // Add menu/close icons

// --- DonationModal Component (keep as is) ---
const DonationModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
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
            {/* Use Link for internal navigation */}
            <Link to="/donor-register" className="modal-button register-button" onClick={onClose}>Register Now</Link>
          </div>
          <div className="login-section">
            <h3 className="section-title">Donor Login</h3>
            <p className="section-description">Already have an account? Log in to continue Donating</p>
            <Link to="/donor-login" className="modal-button login-button" onClick={onClose}>Login Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- RequestModal Component (keep as is, maybe add Link) ---
const RequestModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

    useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
     const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
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
             {/* Use Link for internal navigation */}
            <Link to="/school-register" className="modal-button register-button" onClick={onClose}>Register Now</Link>
          </div>
          <div className="login-section">
            <h3 className="section-title">School/Teacher Login</h3>
            <p className="section-description">Already have an account? Log in to continue request.</p>
            <Link to="/school-login" className="modal-button login-button" onClick={onClose}>Login Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Updated Header Component ---
const Header = () => {
  const [isDonorsDropdownOpen, setIsDonorsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const [isMobileDonorsDropdownOpen, setIsMobileDonorsDropdownOpen] = useState(false); // State for mobile dropdown

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const donorsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileDonorsDropdownRef = useRef(null); // Ref for mobile dropdown if needed for clicks
  const headerRef = useRef(null); // Ref for the header element

  const navigate = useNavigate();

  // --- Authentication Check Effect ---
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUserInfo = localStorage.getItem('donorInfo');
      if (storedUserInfo) {
        try {
          const userData = JSON.parse(storedUserInfo);
          if (userData && userData.token) { // Basic check
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
    // Add custom event listener if needed: window.addEventListener('authChange', checkAuthStatus);
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      // window.removeEventListener('authChange', checkAuthStatus);
    };
  }, []);

  // --- Click Outside Handler Effect ---
  useEffect(() => {
    const handleClickOutside = (event) => {
       // Close desktop dropdowns
      if (donorsDropdownRef.current && !donorsDropdownRef.current.contains(event.target)) {
        setIsDonorsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
       // Close mobile menu if click is outside the header entirely
       if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target)) {
         closeMobileMenu();
       }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]); // Re-run if mobile menu state changes

  // --- Window Resize Handler Effect ---
   useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                closeMobileMenu(); // Close mobile menu on resize to desktop
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array, runs once

  // --- Toggle Functions ---
  const toggleDonorsDropdown = (e) => {
    e.stopPropagation();
    setIsDonorsDropdownOpen(prev => !prev);
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setIsUserDropdownOpen(prev => !prev);
    setIsDonorsDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    // Close dropdowns when toggling main mobile menu
    setIsMobileDonorsDropdownOpen(false);
  };

  const toggleMobileDonorsDropdown = (e) => {
     e.stopPropagation(); // Prevent closing the main mobile menu
     setIsMobileDonorsDropdownOpen(prev => !prev);
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileDonorsDropdownOpen(false);
  }

  // --- Modal Handlers ---
  const handleStartDonate = () => {
    setIsDonationModalOpen(true);
    closeMobileMenu();
  };

  const handleRequestDonation = () => {
    setIsRequestModalOpen(true);
    closeMobileMenu();
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('donorInfo');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    closeMobileMenu();
    navigate('/');
    // Consider if reload is truly necessary - state updates should handle UI changes
    // window.location.reload();
  };

  // --- Navigation Handlers (to close mobile menu) ---
  const handleNavLinkClick = () => {
    closeMobileMenu();
  };
  const handleMobileDropdownItemClick = () => {
      // Don't close the whole mobile menu, just the sub-dropdown if needed
      // For now, clicking an item implies navigation, so close the whole menu
       closeMobileMenu();
  }


  // --- Render Dropdown Items ---
  const renderDonorsDropdownItems = (isMobile = false) => (
     <div className="dropdown-items">
        <Link
            to="/needs"
            className="dropdown-item"
            onClick={isMobile ? handleMobileDropdownItemClick : handleNavLinkClick}
        >
          <IoCalendarOutline className="dropdown-icon" />
          <div className="dropdown-content">
            <span className="dropdown-item-title">Browse Needs</span>
            <span className="dropdown-item-description">Filter Requests by location, needs, or urgency</span>
          </div>
        </Link>
        <Link
            to="/howitworks"
            className="dropdown-item"
             onClick={isMobile ? handleMobileDropdownItemClick : handleNavLinkClick}
        >
          <FiTool className="dropdown-icon" />
          <div className="dropdown-content">
            <span className="dropdown-item-title">How It Works</span>
            <span className="dropdown-item-description">Step-by-step donation process</span>
          </div>
        </Link>
         <Link
            to="/feedbacks"
            className="dropdown-item"
             onClick={isMobile ? handleMobileDropdownItemClick : handleNavLinkClick}
        >
          <IoChatbox  className="dropdown-icon" />
          <div className="dropdown-content">
            <span className="dropdown-item-title">Feedbacks</span>
            <span className="dropdown-item-description">See what others say about their experience</span>
          </div>
        </Link>
      </div>
  );

  return (
    <>
      <header className="header" ref={headerRef}>
        <div className="header-content">
          <div className="logo">
            <Link to="/" onClick={handleNavLinkClick}><img src={logo} alt="EdukaShare Logo" /></Link>
          </div>

          {/* --- Desktop Navigation --- */}
          <nav className="nav">
            <ul>
              <li><Link to="/">Home</Link></li>
              <li className="dropdown-container" ref={donorsDropdownRef}>
                <button
                  className="dropdown-trigger"
                  onClick={toggleDonorsDropdown}
                  aria-haspopup="true"
                  aria-expanded={isDonorsDropdownOpen}
                >
                  Donors <IoIosArrowDown className={`dropdown-arrow ${isDonorsDropdownOpen ? 'rotated' : ''}`} />
                </button>
                <div className={`dropdown-menu ${isDonorsDropdownOpen ? 'open' : ''}`}>
                   <h3 className="dropdown-title">For Donors</h3><hr />
                   {renderDonorsDropdownItems()}
                </div>
              </li>
              <li><Link to="/aboutus">About</Link></li>
              <li><a href="/#impact">Impact</a></li> {/* Use Link if it's a route, keep # if it's an anchor */}
            </ul>
          </nav>

          {/* --- User Area / Buttons --- */}
          <div className="header-user">
            {isLoggedIn && currentUser ? (
              <div className="user-dropdown-container" ref={userDropdownRef}>
                <button
                  className="user-dropdown-trigger"
                  onClick={toggleUserDropdown}
                  aria-haspopup="true"
                  aria-expanded={isUserDropdownOpen}
                >
                  <span className="user-name">{currentUser.fullName || 'User'}</span>
                  <IoIosArrowDown className={`dropdown-arrow ${isUserDropdownOpen ? 'rotated' : ''}`} />
                </button>
                <div className={`user-dropdown-menu ${isUserDropdownOpen ? 'open' : ''}`}>
                  <div className="user-dropdown-header">
                    <h3 className="user-dropdown-title">{currentUser.fullName || 'User'}</h3>
                    {/* Optional: <p className="user-dropdown-email">{currentUser.email}</p> */}
                  </div>
                  <div className="user-dropdown-items">
                    <Link to="/my-donations" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <div className="icon-wrapper"><span className="icon" role="img" aria-label="Donations">📊</span></div>
                      <div className="dropdown-content">
                        <span className="item-title">My Donations</span>
                        <span className="item-description">Track donations.</span>
                      </div>
                    </Link>
                    <Link to="/messages" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <div className="icon-wrapper"><span className="icon" role="img" aria-label="Messages">💬</span></div>
                      <div className="dropdown-content">
                        <span className="item-title">Messages</span>
                        <span className="item-description">View messages from schools.</span>
                      </div>
                    </Link>
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <div className="icon-wrapper"><span className="icon" role="img" aria-label="Profile">👤</span></div>
                      <div className="dropdown-content">
                        <span className="item-title">Edit Profile</span>
                        <span className="item-description">Manage account & preferences</span>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="user-dropdown-item logout-button">
                      <div className="icon-wrapper"><span className="icon" role="img" aria-label="Logout">🚪</span></div>
                      <div className="dropdown-content">
                        <span className="item-title">Log out</span>
                        <span className="item-description">Securely exit your account</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Show these buttons if not logged in (Desktop)
              <div className="header-buttons">
                <button className="btn btn-secondary" onClick={handleStartDonate}>
                  Start Donate
                </button>
                <button className="btn btn-primary" onClick={handleRequestDonation}>
                  Request Donation
                </button>
              </div>
            )}

            {/* --- Mobile Menu Toggle Button --- */}
            <button
                className="menu-toggle"
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? <IoIosClose /> : <IoIosMenu />}
            </button>
          </div>
        </div>

         {/* --- Mobile Navigation Menu --- */}
         <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`} aria-hidden={!isMobileMenuOpen}>
            <ul>
                <li><Link to="/" onClick={handleNavLinkClick}>Home</Link></li>
                <li ref={mobileDonorsDropdownRef}> {/* Attach ref if needed */}
                   <button
                        className="dropdown-trigger"
                        onClick={toggleMobileDonorsDropdown}
                        aria-haspopup="true"
                        aria-expanded={isMobileDonorsDropdownOpen}
                    >
                        Donors <IoIosArrowDown className={`dropdown-arrow ${isMobileDonorsDropdownOpen ? 'rotated' : ''}`} />
                    </button>
                    {/* Mobile Dropdown Content */}
                    <div className={`dropdown-menu ${isMobileDonorsDropdownOpen ? 'open' : ''}`}>
                        {renderDonorsDropdownItems(true)}
                    </div>
                </li>
                <li><Link to="/aboutus" onClick={handleNavLinkClick}>About</Link></li>
                <li><a href="/#impact" onClick={handleNavLinkClick}>Impact</a></li>
                 {/* Show login/register buttons in mobile menu if not logged in */}
                 {!isLoggedIn && (
                     <>
                        <li style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px' }}>
                            <button className="btn btn-secondary" style={{ width: 'calc(100% - 40px)', margin: '0 20px 10px 20px' }} onClick={handleStartDonate}>
                                Start Donate
                            </button>
                        </li>
                         <li>
                            <button className="btn btn-primary" style={{ width: 'calc(100% - 40px)', margin: '0 20px 10px 20px' }} onClick={handleRequestDonation}>
                                Request Donation
                            </button>
                        </li>
                     </>
                 )}
            </ul>
         </nav>

      </header>

      {/* Modals */}
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
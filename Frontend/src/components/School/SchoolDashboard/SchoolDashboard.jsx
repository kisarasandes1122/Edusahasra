import React, { useState, useEffect, useCallback } from 'react'; // Import hooks
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { FaSignOutAlt, FaEye, FaHandHoldingHeart, FaThumbsUp, FaUserCircle, FaSpinner } from 'react-icons/fa';
import { BookOpen, PenSquare, Award } from 'lucide-react'; // Import lucide icons for variety
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import './SchoolDashboard.css';

const SchoolDashboard = () => {
  const { translations } = useLanguage();
  const navigate = useNavigate();

  // --- State for Recent Donations ---
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('schoolInfo');
    navigate('/');
  };

  // --- Helper Functions ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  const getItemSummary = (items) => {
    if (!items || items.length === 0) return translations.no_items_specified || "No items specified";
    const totalQuantity = items.reduce((sum, item) => sum + item.quantityDonated, 0);
    const distinctItems = new Set(items.map(item => item.categoryNameEnglish)).size;
    return `${totalQuantity} ${translations.items || 'items'} (${distinctItems} ${translations.types || 'types'})`;
  };

  // --- Fetch Recent Donations ---
  const fetchRecentDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/donations/school-donations');
      const allSchoolDonations = response.data || [];
      const confirmedDonations = allSchoolDonations.filter(
        donation => donation.schoolConfirmation === true || donation.trackingStatus === 'Received by School'
      );
      const sortedDonations = confirmedDonations.sort((a, b) => {
         const dateA = new Date(a.schoolConfirmationAt || a.createdAt);
         const dateB = new Date(b.schoolConfirmationAt || b.createdAt);
         return dateB - dateA; // Newest first
       });
      const latestDonations = sortedDonations.slice(0, 5);
      setRecentDonations(latestDonations);

    } catch (err) {
      console.error("Dashboard: Error fetching recent donations:", err);
      setError(translations.error_fetching_recent_donations || 'Failed to load recent donations.');
       if (err.response) {
           console.error("Error response:", err.response.data);
       }
    } finally {
      setLoading(false);
    }
  }, [translations.error_fetching_recent_donations, translations.no_items_specified, translations.items, translations.types]);

  // --- Fetch data on mount ---
  useEffect(() => {
    fetchRecentDonations();
  }, [fetchRecentDonations]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>{translations.dashboard || 'Dashboard'}</h1>
        </div>
        <button
          className="dashboard-logout"
          onClick={handleLogout}
          aria-label={translations.logout || 'Logout'}
        >
          <FaSignOutAlt className="dashboard-logout-icon" />
          <span>{translations.logout || 'Logout'}</span>
        </button>
      </header>

      <div className="dashboard-welcome">
        <p>{translations.welcome_message || 'Welcome to your school dashboard.'}</p> {/* Updated message */}
      </div>

      <div className="dashboard-grid">
        {/* Use Link component for internal navigation */}
        <Link to="/view-donations" className="dashboard-card action-card">
          <FaEye className="card-icon" />
          <div className="card-content">
            <h3>{translations.view_donations || 'View Donations'}</h3>
          </div>
        </Link>

        <Link to="/request-donations" className="dashboard-card action-card">
          <FaHandHoldingHeart className="card-icon" />
          <div className="card-content">
            <h3>{translations.request_donations || 'Request Donations'}</h3>
          </div>
        </Link>

        <Link to="/send-thanks" className="dashboard-card action-card">
           <FaThumbsUp className="card-icon" /> {/* Using FaThumbsUp icon */}
           <div className="card-content">
               <h3>{translations.send_thanks || 'Send Thanks'}</h3> {/* Use existing translation */}
           </div>
        </Link>

        {/* --- ADD NEW CARD FOR IMPACT STORIES --- */}
        <Link to="/write-impact-story" className="dashboard-card action-card">
            <PenSquare className="card-icon" /> {/* Using PenSquare from lucide-react */}
             <div className="card-content">
                {/* Add translation key */}
                <h3>{translations.write_impact_story || 'Write Impact Story'}</h3>
            </div>
        </Link>
        {/* --- END NEW CARD --- */}

         {/* Optional: Add card to view submitted stories */}
        {/* <Link to="/my-impact-stories" className="dashboard-card action-card">
            <Award className="card-icon" />
            <div className="card-content">
                <h3>{translations.my_impact_stories || 'My Impact Stories'}</h3>
            </div>
        </Link> */}


        <Link to="/edit-profile" className="dashboard-card action-card">
          <FaUserCircle className="card-icon" />
          <div className="card-content">
            <h3>{translations.edit_profile || 'Edit Profile'}</h3>
          </div>
        </Link>
      </div>

      {/* --- Recent Donations Section --- */}
      <div className="dashboard-section recent-donations">
        <h3 className="section-title">
          {translations.dash_recent_donations || 'Recent Donations Received'}
        </h3>

        {loading && (
          <div className="loading-message">
            <FaSpinner className="fa-spin" /> {translations.loading_recent_donations || 'Loading recent donations...'}
          </div>
        )}

        {error && !loading && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="donation-list">
            {recentDonations.length > 0 ? (
              recentDonations.map(donation => (
                <div className="donation-item" key={donation._id}>
                   <span className="donation-summary">{getItemSummary(donation.itemsDonated)}</span>
                   <span className="donation-date">
                     {translations.received_on || 'Received on'} {formatDate(donation.schoolConfirmationAt || donation.createdAt)}
                   </span>
                </div>
              ))
            ) : (
              <p>{translations.no_recent_donations_received || 'No recent donations have been confirmed yet.'}</p>
            )}
          </div>
        )}
      </div>

      {/* --- Contact Section --- */}
      <div className="dashboard-section contact">
        <p>
          {translations.need_help_contact_us || 'Need help? Contact us:'}
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default SchoolDashboard;
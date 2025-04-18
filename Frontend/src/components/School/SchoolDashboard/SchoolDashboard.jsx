import React, { useState, useEffect, useCallback } from 'react'; // Import hooks
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaEye, FaHandHoldingHeart, FaThumbsUp, FaUserCircle, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api'; // Adjust path as needed
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

  // --- Helper Functions (similar to ViewDonations) ---
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
    // Create a concise summary, maybe just the first item or total count?
    // Example: Show first item's details concisely
    // const firstItem = items[0];
    // return `${firstItem.quantityDonated} ${firstItem.categoryNameEnglish}${items.length > 1 ? ' (+ more)' : ''}`;
    // Or a simpler count approach:
    const totalQuantity = items.reduce((sum, item) => sum + item.quantityDonated, 0);
    const distinctItems = new Set(items.map(item => item.categoryNameEnglish)).size;
    return `${totalQuantity} ${translations.items || 'items'} (${distinctItems} ${translations.types || 'types'})`;
  };

  // --- Fetch Recent Donations ---
  const fetchRecentDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Dashboard: Fetching recent donations...");

    try {
      const response = await api.get('/api/donations/school-donations');
      const allSchoolDonations = response.data || [];
      console.log("Dashboard: Raw donations fetched:", allSchoolDonations);


      // Filter for confirmed donations
      const confirmedDonations = allSchoolDonations.filter(
        donation => donation.schoolConfirmation === true || donation.trackingStatus === 'Received by School'
      );
      console.log("Dashboard: Confirmed donations:", confirmedDonations);


      // Sort by confirmation date (descending), fallback to creation date
      const sortedDonations = confirmedDonations.sort((a, b) => {
         const dateA = new Date(a.schoolConfirmationAt || a.createdAt);
         const dateB = new Date(b.schoolConfirmationAt || b.createdAt);
         return dateB - dateA; // Newest first
       });
       console.log("Dashboard: Sorted donations:", sortedDonations);


      // Get the top 5
      const latestDonations = sortedDonations.slice(0, 5);
      console.log("Dashboard: Latest 5 donations:", latestDonations);


      setRecentDonations(latestDonations);

    } catch (err) {
      console.error("Dashboard: Error fetching recent donations:", err);
      setError(translations.error_fetching_recent_donations || 'Failed to load recent donations.');
       if (err.response) {
           console.error("Error response:", err.response.data);
       }
    } finally {
      setLoading(false);
      console.log("Dashboard: Fetching complete.");
    }
  }, [translations.error_fetching_recent_donations, translations.no_items_specified, translations.items, translations.types]); // Add translation keys

  // --- Fetch data on mount ---
  useEffect(() => {
    fetchRecentDonations();
  }, [fetchRecentDonations]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          {/* Use h1 semantically, styled by CSS */}
          <h1>{translations.dashboard || 'Dashboard'}</h1>
        </div>
        <button
          className="dashboard-logout"
          onClick={handleLogout}
          aria-label={translations.logout || 'Logout'} // Accessibility
        >
          <FaSignOutAlt className="dashboard-logout-icon" />
          <span>{translations.logout || 'Logout'}</span>
        </button>
      </header>

      <div className="dashboard-welcome">
        {/* Use paragraph element */}
        <p>{translations.welcome_message || 'New here? Click for guidance'}</p>
      </div>

      <div className="dashboard-grid">
        {/* Use Link component from react-router-dom for internal navigation */}
        {/* For simplicity, using <a> tags as provided, but <Link to="..."> is better */}
        <a href="/view-donations" className="dashboard-card action-card">
          <FaEye className="card-icon" />
          <div className="card-content">
            {/* Use h3 for card titles */}
            <h3>{translations.view_donations || 'View Donations'}</h3>
          </div>
        </a>

        <a href="/request-donations" className="dashboard-card action-card">
          <FaHandHoldingHeart className="card-icon" />
          <div className="card-content">
            <h3>{translations.request_donations || 'Request Donations'}</h3>
          </div>
        </a>

        <a href="/send-thanks" className="dashboard-card action-card">
          <FaThumbsUp className="card-icon" />
          <div className="card-content">
            <h3>{translations.send_thanks || 'Send Thanks'}</h3>
          </div>
        </a>

        <a href="/edit-profile" className="dashboard-card action-card">
          <FaUserCircle className="card-icon" />
          <div className="card-content">
            <h3>{translations.edit_profile || 'Edit Profile'}</h3>
          </div>
        </a>
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
                   {/* Display a summary and date */}
                   <span className="donation-summary">{getItemSummary(donation.itemsDonated)}</span>
                   <span className="donation-date">
                     {/* Added translation key */}
                     {translations.received_on || 'Received on'} {formatDate(donation.schoolConfirmationAt || donation.createdAt)}
                   </span>
                   {/* Optional: Add Donor Name if available and desired */}
                   {/* <span className="donation-donor">From: {donation.donor?.fullName || 'Anonymous'}</span> */}
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
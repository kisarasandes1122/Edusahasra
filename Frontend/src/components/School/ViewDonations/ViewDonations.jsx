import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaSpinner, FaBox, FaClipboardCheck, FaTruck, FaBoxOpen, FaRegSadTear } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import './ViewDonations.css';

const ViewDonations = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();

  // State for different donation categories
  const [upcomingDonations, setUpcomingDonations] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [donationRequestsSummary, setDonationRequestsSummary] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  // --- Fetch Data Function ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching donation data...");

    try {
      // Fetch both school donations and the school's donation requests
      const [donationsResponse, requestsResponse] = await Promise.all([
        api.get('/api/donations/school-donations'),
        api.get('/api/requests/my-requests')
      ]);

      console.log("Donations Response:", donationsResponse.data);
      console.log("Requests Response:", requestsResponse.data);

      const allSchoolDonations = donationsResponse.data || [];
      const schoolRequests = requestsResponse.data || [];

      // --- Process Donations ---
      const upcoming = [];
      const pending = [];

      allSchoolDonations.forEach(donation => {
        // If already confirmed by school, skip (it will be reflected in requests summary)
        if (donation.schoolConfirmation || donation.trackingStatus === 'Received by School') {
          return;
        }

        // Consider donations 'Delivered' or 'In Transit' / 'Preparing' as needing action/viewing
        if (['Delivered', 'In Transit', 'Preparing', 'Pending Confirmation'].includes(donation.trackingStatus)) {
          // If status is 'Delivered', it's pending confirmation
          // If 'In Transit' or 'Preparing', it's upcoming
          if (donation.trackingStatus === 'Delivered' || donation.trackingStatus === 'Pending Confirmation') {
            pending.push(donation);
          } else if (['In Transit', 'Preparing'].includes(donation.trackingStatus)) {
            upcoming.push(donation);
          }
        }
      });

      setUpcomingDonations(upcoming);
      setPendingConfirmations(pending);

      // --- Process Requests for Summary ---
      // Flatten the requested items from all requests for easier display
      const summaryItems = schoolRequests.flatMap(request =>
        request.requestedItems.map(item => ({
          id: `${request._id}-${item.categoryId}`,
          requestId: request._id,
          categoryId: item.categoryId,
          type: item.categoryNameEnglish,
          requested: item.quantity,
          received: item.quantityReceived,
          status: request.status
        }))
      );

      // Group by categoryId if multiple requests asked for the same item
      const groupedSummary = summaryItems.reduce((acc, item) => {
        if (!acc[item.categoryId]) {
          acc[item.categoryId] = { ...item, requestIds: [item.requestId] };
        } else {
          acc[item.categoryId].requested += item.requested;
          acc[item.categoryId].received += item.received;
          acc[item.categoryId].requestIds.push(item.requestId);
        }
        return acc;
      }, {});

      setDonationRequestsSummary(Object.values(groupedSummary));

      console.log("Processed Upcoming:", upcoming);
      console.log("Processed Pending:", pending);
      console.log("Processed Summary:", Object.values(groupedSummary));

    } catch (err) {
      console.error("Error fetching donation data:", err);
      setError(translations.error_fetching_data || 'Failed to load donation information. Please try again.');
      if (err.response) {
        console.error("Error response:", err.response.data);
        setError(`${translations.error_fetching_data} ${err.response.data.message || ''}`);
      }
    } finally {
      setLoading(false);
      console.log("Fetching complete.");
    }
  }, [translations.error_fetching_data]);

  // --- Fetch data on component mount ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handle Back Navigation ---
  const handleBack = () => {
    navigate('/Dashboard');
  };

  // --- Handle Donation Confirmation ---
  const handleConfirmDonation = async (donationId) => {
    setConfirmingId(donationId);
    setError(null);
    console.log(`Confirming donation ID: ${donationId}`);

    try {
      const response = await api.put(`/api/donations/${donationId}/confirm-receipt`);
      console.log("Confirmation Response:", response.data);

      // Show success message (optional)
      alert(translations.donation_confirmed_successfully || 'Donation confirmed successfully!');

      // Re-fetch data to update all lists
      await fetchData();

    } catch (err) {
      console.error(`Error confirming donation ${donationId}:`, err);
      const errorMsg = err.response?.data?.message || translations.error_confirming_donation || 'Failed to confirm donation. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setConfirmingId(null);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  // Helper to generate item summary string
  const getItemSummary = (items) => {
    if (!items || items.length === 0) return translations.no_items_specified || "No items specified";
    return items.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`).join(', ');
  };

  // Helper function to get status class name
  const getStatusClass = (status) => {
    switch (status) {
      case 'In Transit': return 'status-transit';
      case 'Preparing': return 'status-preparing';
      case 'Delivered': return 'status-delivered';
      case 'Pending Confirmation': return 'status-pending';
      default: return '';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Transit': return <FaTruck />;
      case 'Preparing': return <FaBox />;
      case 'Delivered': return <FaBoxOpen />;
      case 'Pending Confirmation': return <FaClipboardCheck />;
      default: return null;
    }
  };

  // Calculate progress percentage for donation requests
  const calculateProgress = (received, requested) => {
    if (requested === 0) return 0;
    const percentage = (received / requested) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  return (
    <div className="view-donations-container">
      <header className="view-donations-header">
        <div className="view-donations-title">
          <h1>{translations.view_donations || 'View Donations'}</h1>
        </div>
      </header>

      <div className="view-donations-back-btn-container">
        <button className="view-donations-back-btn" onClick={handleBack}>
          <FaArrowLeft className="view-donations-back-icon" />
          <span>{translations.back || 'Back'}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-message">
          <FaSpinner className="loading-spinner" />
          <span>{translations.loading || 'Loading donations...'}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Content Sections - Render only when not loading and no critical error */}
      {!loading && (
        <>
          {/* --- Upcoming Donations --- */}
          <div className="view-donations-section">
            <h3 className="view-donations-section-title">
              {translations.upcoming_donations || 'Upcoming Donations'}
            </h3>
            <div className="view-donations-list">
              {upcomingDonations.length > 0 ? (
                upcomingDonations.map(donation => (
                  <div className="view-donations-item" key={donation._id}>
                    <div className="view-donations-details">
                      <div className="view-donations-item-info">
                        <span className="view-donations-item-summary">
                          {getItemSummary(donation.itemsDonated)}
                        </span>
                      </div>
                      <div className="view-donations-date">
                        {translations.donation_initiated || 'Initiated'}: {formatDate(donation.createdAt)}
                      </div>
                    </div>
                    <div className={`view-donations-status ${getStatusClass(donation.trackingStatus)}`}>
                      {getStatusIcon(donation.trackingStatus)}
                      <span>{translations[donation.trackingStatus.toLowerCase().replace(/ /g, '_')] || donation.trackingStatus}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaRegSadTear className="empty-state-icon" />
                  <p className="empty-state-text">{translations.no_upcoming_donations || 'No upcoming donations at the moment.'}</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Confirm Donations --- */}
          {pendingConfirmations.length > 0 && (
            <div className="view-donations-section">
              <h3 className="view-donations-section-title">
                {translations.confirm_donations || 'Confirm Received Donations'}
              </h3>
              <div className="view-donations-list">
                {pendingConfirmations.map(donation => (
                  <div className="view-donations-item" key={donation._id}>
                    <div className="view-donations-details">
                      <div className="view-donations-item-info">
                        <span className="view-donations-item-summary">
                          {getItemSummary(donation.itemsDonated)}
                        </span>
                      </div>
                      <div className="view-donations-date">
                        {translations.status_updated || 'Status Updated'}: {formatDate(donation.statusLastUpdatedAt || donation.createdAt)}
                      </div>
                    </div>
                    <button
                      className="view-donations-confirm-btn"
                      onClick={() => handleConfirmDonation(donation._id)}
                      disabled={confirmingId === donation._id}
                    >
                      {confirmingId === donation._id ? (
                        <>
                          <FaSpinner className="fa-spin" />
                          <span>{translations.confirming || 'Confirming...'}</span>
                        </>
                      ) : (
                        <span>{translations.confirm || 'Confirm Receipt'}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- All Donations Summary (Based on Requests) --- */}
          <div className="view-donations-section">
            <h3 className="view-donations-section-title">
              {translations.all_donations || 'All Donation Requests Summary'}
            </h3>
            <div className="view-donations-list">
              {donationRequestsSummary.length > 0 ? (
                donationRequestsSummary.map(item => (
                  <div className="view-donations-item view-donations-all-item" key={item.id}>
                    <div className="view-donations-all-header">
                      <div className="view-donations-all-type">
                        <span className="view-donations-name">{item.type}</span>
                      </div>
                    </div>
                    <div className="view-donations-counts">
                      <div className="donations-count-item">
                        <span className="count-label">{translations.requested_amount || 'Requested'}:</span>
                        <span className="count-value">{item.requested}</span>
                      </div>
                      <div className="donations-count-item">
                        <span className="count-label">{translations.received_amount || 'Received'}:</span>
                        <span className="count-value">{item.received}</span>
                      </div>
                    </div>
                    <div className="donation-progress-container">
                      <div className="donation-progress-bar">
                        <div 
                          className="donation-progress-value" 
                          style={{ width: `${calculateProgress(item.received, item.requested)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaRegSadTear className="empty-state-icon" />
                  <p className="empty-state-text">{translations.no_donation_requests_found || 'No donation requests found.'}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contact Section */}
      <div className="view-donations-contact">
        <p>
          <span>{translations.need_help_contact_us || 'Need help? Contact us:'}</span>
          <span className="view-donations-contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default ViewDonations;
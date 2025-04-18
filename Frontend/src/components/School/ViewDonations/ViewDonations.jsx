import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api'; // Adjust path as needed
import './ViewDonations.css';

const ViewDonations = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();

  // State for different donation categories
  const [upcomingDonations, setUpcomingDonations] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [donationRequestsSummary, setDonationRequestsSummary] = useState([]); // For "All Donations"

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null); // Track which donation is being confirmed

  // --- Fetch Data Function ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching donation data..."); // Debug log

    try {
      // Fetch both school donations and the school's donation requests
      const [donationsResponse, requestsResponse] = await Promise.all([
        api.get('/api/donations/school-donations'), // Endpoint for donations received by school
        api.get('/api/requests/my-requests')       // Endpoint for requests made by school
      ]);

      console.log("Donations Response:", donationsResponse.data); // Debug log
      console.log("Requests Response:", requestsResponse.data); // Debug log

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
             if (donation.trackingStatus === 'Delivered' || donation.trackingStatus === 'Pending Confirmation') { // Allow confirming 'Pending Confirmation' if needed by workflow
                 pending.push(donation);
             } else if (['In Transit', 'Preparing'].includes(donation.trackingStatus)){
                 upcoming.push(donation);
             }
            // Add other statuses to 'upcoming' if desired
        }
      });

      setUpcomingDonations(upcoming);
      setPendingConfirmations(pending);

      // --- Process Requests for Summary ---
      // Flatten the requested items from all requests for easier display
        const summaryItems = schoolRequests.flatMap(request =>
            request.requestedItems.map(item => ({
                id: `${request._id}-${item.categoryId}`, // Create a unique key
                requestId: request._id,
                categoryId: item.categoryId,
                type: item.categoryNameEnglish, // Use English name as identifier
                requested: item.quantity,
                received: item.quantityReceived,
                status: request.status // Include request status if needed
            }))
        );

        // Optional: Group by categoryId if multiple requests asked for the same item
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


      console.log("Processed Upcoming:", upcoming); // Debug log
      console.log("Processed Pending:", pending); // Debug log
      console.log("Processed Summary:", Object.values(groupedSummary)); // Debug log

    } catch (err) {
      console.error("Error fetching donation data:", err);
      setError(translations.error_fetching_data || 'Failed to load donation information. Please try again.'); // Provide a translated error
       if (err.response) {
           console.error("Error response:", err.response.data); // Log specific backend error
            setError(`${translations.error_fetching_data} ${err.response.data.message || ''}`);
       }
    } finally {
      setLoading(false);
      console.log("Fetching complete."); // Debug log
    }
  }, [translations.error_fetching_data]); // Add translation key dependency

  // --- Fetch data on component mount ---
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency array includes fetchData

  // --- Handle Back Navigation ---
  const handleBack = () => {
    navigate('/Dashboard'); // Ensure this path is correct
  };

  // --- Handle Donation Confirmation ---
  const handleConfirmDonation = async (donationId) => {
    setConfirmingId(donationId); // Set loading state for this specific button
    setError(null); // Clear previous errors
    console.log(`Confirming donation ID: ${donationId}`); // Debug log

    try {
      // API endpoint requires donation ID in the URL
      const response = await api.put(`/api/donations/${donationId}/confirm-receipt`);
      console.log("Confirmation Response:", response.data); // Debug log

      // Show success message (optional)
      alert(translations.donation_confirmed_successfully || 'Donation confirmed successfully!');

      // Re-fetch data to update all lists (Upcoming, Pending, Summary)
      await fetchData();

    } catch (err) {
      console.error(`Error confirming donation ${donationId}:`, err);
       const errorMsg = err.response?.data?.message || translations.error_confirming_donation || 'Failed to confirm donation. Please try again.';
       setError(errorMsg); // Display specific or generic error
       alert(errorMsg); // Also show in an alert for immediate feedback
    } finally {
      setConfirmingId(null); // Reset loading state for the button
    }
  };

   // Helper to format date
   const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
     try {
         // Basic formatting, consider using a library like date-fns for more robust formatting
         const options = { year: 'numeric', month: 'long', day: 'numeric' };
         return new Date(dateString).toLocaleDateString(undefined, options);
     } catch (e) {
         return dateString; // Return original string if parsing fails
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
              <FaSpinner className="fa-spin" /> {translations.loading || 'Loading donations...'}
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
                        {/* Display summary of items */}
                        <span className="view-donations-item-summary">
                           {getItemSummary(donation.itemsDonated)}
                        </span>
                      </div>
                      <div className="view-donations-date">
                        {/* Display expected date if available, otherwise created date? */}
                        {/* Backend doesn't seem to have explicit 'expected date', use creation date? */}
                         {translations.donation_initiated || 'Initiated'}: {formatDate(donation.createdAt)}
                      </div>
                       {/* Display donor name if available and needed */}
                      {/* <div className="view-donations-donor">From: {donation.donor?.fullName || 'Anonymous'}</div> */}
                    </div>
                    <div className={`view-donations-status ${getStatusClass(donation.trackingStatus)}`}>
                      {/* Translate the status */}
                      <span>{translations[donation.trackingStatus.toLowerCase().replace(/ /g, '_')] || donation.trackingStatus}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>{translations.no_upcoming_donations || 'No upcoming donations at the moment.'}</p>
              )}
            </div>
          </div>

          {/* --- Confirm Donations --- */}
          {/* Only show section if there are items needing confirmation */}
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
                          {/* Show date it was marked delivered or created */}
                           {translations.status_updated || 'Status Updated'}: {formatDate(donation.statusLastUpdatedAt || donation.createdAt)}
                       </div>
                        {/* <div className="view-donations-donor">From: {donation.donor?.fullName || 'Anonymous'}</div> */}
                     </div>
                     <button
                       className="view-donations-confirm-btn"
                       onClick={() => handleConfirmDonation(donation._id)}
                       disabled={confirmingId === donation._id} // Disable button while confirming this specific item
                     >
                       {confirmingId === donation._id ? (
                         <FaSpinner className="fa-spin" /> // Show spinner
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
                    <div className="view-donations-all-details">
                      <div className="view-donations-all-type">
                        {/* Display English name from the summary data */}
                        <span className="view-donations-name">{item.type}</span>
                      </div>
                      <div className="view-donations-counts">
                        <span>{translations.requested_amount || 'Requested'}: {item.requested} | </span>
                        <span>{translations.received_amount || 'Received'}: {item.received}</span>
                         {/* Optionally display request status */}
                         {/* <span> ({translations.status || 'Status'}: {translations[item.status?.toLowerCase()]} || item.status)</span> */}
                      </div>
                    </div>
                    {/* Progress Bar (Optional) */}
                    {/* <progress value={item.received} max={item.requested}></progress> */}
                  </div>
                ))
              ) : (
                <p>{translations.no_donation_requests_found || 'No donation requests found.'}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contact Section */}
      <div className="view-donations-contact">
        <p>
          <span>{translations.need_help_contact_us || 'Need help? Contact us: '} </span>
          <span className="view-donations-contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default ViewDonations;
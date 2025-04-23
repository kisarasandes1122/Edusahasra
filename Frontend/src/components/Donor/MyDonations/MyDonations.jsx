// frontend/src/components/Donor/MyDonations/MyDonations.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Adjust the import path based on your project structure
import './MyDonations.css';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null); // Add error state

  // --- New State for Location Modal ---
  const [viewingSchoolLocation, setViewingSchoolLocation] = useState(null);
  // --- End New State ---


  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        // Real API call using the configured api instance
        // Backend change now populates school with more details
        const response = await api.get('/api/donations/my-donations');
        // Map backend data to frontend structure
        const formattedDonations = response.data.map(donation => ({
          id: donation._id, // Use _id from MongoDB
          schoolName: donation.school?.schoolName || 'Unknown School', // Safely access school name
          // *** Access new populated school fields ***
          schoolDetails: donation.school ? { // Pass the whole school object if populated
              _id: donation.school._id,
              schoolName: donation.school.schoolName,
              streetAddress: donation.school.streetAddress,
              city: donation.school.city,
              district: donation.school.district,
              province: donation.school.province,
              postalCode: donation.school.postalCode,
              location: donation.school.location, // GeoJSON object { type, coordinates: [lon, lat] }
          } : null,
          // *** End new fields ***
          date: donation.createdAt, // Use createdAt timestamp
          // Map itemsDonated array to simple string array for display
          items: donation.itemsDonated.map(item => `${item.quantityDonated}x ${item.categoryNameEnglish || 'Item'}`),
          status: donation.trackingStatus.toLowerCase().replace(/\s+/g, '-'), // Convert 'In Transit' to 'in-transit', etc.
          amount: donation.shippingCostEstimate ? `Est. Shipping: Rs. ${donation.shippingCostEstimate}` : 'N/A', // Placeholder for value, using estimate if available
          impact: donation.donorRemarks || 'N/A', // Using donor remarks as a proxy for impact/notes for now
          deliveryType: donation.deliveryMethod === 'Self-Delivery' ? 'self' : 'courier',
          // Keep original backend status and deliveryMethod for logic
          originalStatus: donation.trackingStatus,
          originalDeliveryMethod: donation.deliveryMethod,
          // Include tracking ID from admin if available (for Courier)
          adminTrackingId: donation.adminTrackingId || null,
        }));
        setDonations(formattedDonations);
      } catch (err) {
        console.error("Error fetching donations:", err);
        // Handle specific error messages if available
        const message = err.response?.data?.message || err.message || 'Failed to fetch donations.';
        setError(message);
        setDonations([]); // Clear donations on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []); // Empty dependency array means this runs once on mount

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    if (filter === 'self' || filter === 'courier') return donation.deliveryType === filter;
    // Filter by status (needs conversion from 'in-transit' back to 'In Transit' etc if backend uses different format)
    // Our mapping converts backend status like 'In Transit' to 'in-transit' for CSS classes and filter value comparison
    // We need to compare against the original status for filtering
    // Map filter value back to backend format for comparison if necessary, or adjust filter values
    // Let's adjust the filter values to match the *mapped* status (e.g. 'in-transit')
    return donation.status === filter;
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Get the status text with proper formatting from original backend status
  const getStatusText = (originalStatus) => {
    // Simple formatting, adjust if backend uses different casing or terms
     if (!originalStatus) return 'Unknown';
     // Handle 'Received by School' specifically if needed, otherwise title case works
     if (originalStatus === 'Received by School') return 'Received by School';
     if (originalStatus === 'Pending Confirmation') return 'Pending Confirmation';
     if (originalStatus === 'Cancelled') return 'Cancelled';
     // Convert other statuses like 'in-transit' back to 'In Transit'
     return originalStatus
       .toLowerCase() // Ensure consistent lower case first
       .split(' ')
       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
       .join(' ');
  };


  // Update status for self-delivery donations VIA API
  const updateDonationStatus = async (donationId, newStatusBackendFormat) => {
    // Find the donation to ensure we only update if it's 'Self-Delivery'
    const donationToUpdate = donations.find(d => d.id === donationId);
    if (!donationToUpdate || donationToUpdate.deliveryType !== 'self') {
        console.warn("Attempted to update status for non-self-delivery or non-existent donation.");
        alert("Status can only be updated for Self-Delivery donations.");
        return;
    }

    // Prevent updates if the donation has reached a final state (Received by School, Cancelled)
    const finalStatuses = ['Received by School', 'Cancelled'];
    if (finalStatuses.includes(donationToUpdate.originalStatus)) {
        alert(`Cannot update status for a donation that is already "${getStatusText(donationToUpdate.originalStatus)}".`);
        return;
    }
     // Prevent updating to a status lower than current status (e.g. Delivered -> In Transit)
    const statusOrder = ['Preparing', 'In Transit', 'Delivered', 'Received by School', 'Cancelled'];
    const currentIndex = statusOrder.indexOf(donationToUpdate.originalStatus);
    const newIndex = statusOrder.indexOf(newStatusBackendFormat);
    if (newIndex < currentIndex && newStatusBackendFormat !== 'Cancelled') {
         // Allow cancelling from any status
         alert(`Cannot change status from "${getStatusText(donationToUpdate.originalStatus)}" to "${getStatusText(newStatusBackendFormat)}".`);
         return;
    }


    // Optimistic UI update
    const originalDonations = [...donations];
    setDonations(prevDonations =>
      prevDonations.map(donation =>
        donation.id === donationId
        ? {
            ...donation,
            status: newStatusBackendFormat.toLowerCase().replace(/\s+/g, '-'), // Update mapped status
            originalStatus: newStatusBackendFormat // Update original status
          }
        : donation
      )
    );

    try {
      // API call to update status
      await api.put(`/api/donations/${donationId}/status`, { newStatus: newStatusBackendFormat });
      // Success message (optional)
      console.log(`Donation ${donationId} status updated to ${newStatusBackendFormat}`);

    } catch (err) {
      console.error("Error updating donation status:", err);
      const message = err.response?.data?.message || err.message || 'Failed to update status.';
      // Show error to user
      setError(`Update failed for Donation ${donationId}: ${message}`);
      // Revert optimistic update on failure
      setDonations(originalDonations);
      alert(`Failed to update status: ${message}`);
    }
  };

  // --- Location Modal Handlers ---
  const handleViewLocationDetails = (schoolDetails) => {
    setViewingSchoolLocation(schoolDetails);
  };

  const handleCloseLocationDetails = () => {
    setViewingSchoolLocation(null);
  };
  // --- End Location Modal Handlers ---


  return (
    <div className="donations-page-container">
      <div className="donations-header">
        <h1>My Donations</h1>
        <p className="subtitle">Track and manage your contributions to schools across Sri Lanka</p>
      </div>

      {/* Filter Component */}
      <div className="donations-filter">
        <div className="filter-tabs">
           {/* Add keys for list items */}
          {/* Use mapped status values for filter buttons */}
          {['all', 'self', 'courier', 'pending-confirmation', 'preparing', 'in-transit', 'delivered', 'received-by-school', 'cancelled'].map(f => (
             <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
             >
                {/* Format filter names for display */}
                {f === 'all' ? 'All' :
                 f === 'self' ? 'Self Delivery' :
                 f === 'courier' ? 'Courier Service' :
                 getStatusText(f.replace('-', ' '))} {/* Convert 'in-transit' back to 'In Transit' etc. */}
            </button>
          ))}
        </div>
      </div>

        {/* Display Error Message */}
        {error && (
            <div style={{ color: 'red', backgroundColor: '#ffebee', border: '1px solid red', padding: '10px', borderRadius: '8px', marginBottom: '20px', wordBreak: 'break-word' }}>
                <strong>Error:</strong> {error}
            </div>
        )}

      <div className="donations-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your donations...</p>
          </div>
        ) : filteredDonations.length > 0 ? (
          filteredDonations.map(donation => (
            <div key={donation.id} className="donation-card">
              <div className="donation-header">
                <div>
                  <h3>{donation.schoolName}</h3>
                  <span className="delivery-type-label">
                    {donation.deliveryType === 'self' ? '🚗 Self Delivery' : '📦 Courier Service'}
                  </span>
                </div>
                {/* Conditional rendering for status: Dropdown for self, Badge for courier */}
                {donation.deliveryType === 'self' ? (
                  <div className="status-dropdown">
                     {/* Ensure the select value matches the backend status format like 'In Transit' */}
                    <select
                      value={donation.originalStatus} // Use originalStatus for value
                      onChange={(e) => updateDonationStatus(donation.id, e.target.value)}
                      // Disable if donation is received or cancelled
                      disabled={donation.originalStatus === 'Received by School' || donation.originalStatus === 'Cancelled'}
                      className={`status-selector ${donation.status}`} // Use mapped status for class
                    >
                      {/* Use backend status values that Donor can set */}
                      <option value="Preparing">Preparing</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                       {/* Keep Received/Cancelled options disabled if they match the current status */}
                       {donation.originalStatus === 'Received by School' && <option value="Received by School" disabled>Received by School</option>}
                       {donation.originalStatus === 'Cancelled' && <option value="Cancelled" disabled>Cancelled</option>}
                       {/* Donors might be allowed to cancel */}
                       {donation.originalStatus !== 'Received by School' && donation.originalStatus !== 'Cancelled' && (
                            <option value="Cancelled">Cancel Donation</option>
                       )}
                    </select>
                  </div>
                ) : (
                   // Use donation.status for the class name (e.g., 'in-transit')
                   // Use getStatusText(donation.originalStatus) for the displayed text (e.g., 'In Transit')
                  <span className={`status-badge ${donation.status}`}>
                    {getStatusText(donation.originalStatus)}
                  </span>
                )}
              </div>

              <div className="donation-details">
                <div className="donation-detail">
                  <span className="detail-label">Date Donated</span>
                  {/* Format the date */}
                  <span className="detail-value">{new Date(donation.date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                <div className="donation-detail">
                  <span className="detail-label">Donated Items</span>
                  {/* Join the formatted item strings */}
                  <span className="detail-value">{donation.items.join(", ")}</span>
                </div>

                <div className="donation-detail">
                  <span className="detail-label">Estimated Value/Cost</span>
                  <span className="detail-value">{donation.amount}</span>
                </div>

                <div className="donation-detail">
                  <span className="detail-label">Remarks</span>
                  <span className="detail-value">{donation.impact || 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="donation-actions">
                {/* Show View Details only for Self Delivery */}
                {donation.deliveryType === 'self' && donation.schoolDetails && (
                    <button
                        className="btn-secondary" // Using secondary for details, primary for actions like View Thank You
                        onClick={() => handleViewLocationDetails(donation.schoolDetails)}
                    >
                        View School Location
                    </button>
                )}

                 {/* Example: Tracking button if it's courier and has an adminTrackingId */}
                {donation.deliveryType === 'courier' && donation.adminTrackingId && (
                    <button className="btn-secondary">Track Package ({donation.adminTrackingId})</button> // Display tracking ID if available
                )}

                 {/* View Thank You button (only if received by school) */}
                {donation.originalStatus === 'Received by School' && ( // Check original backend status
                  // You might need a link or button that navigates to a specific thank you page/modal
                  // For now, it's a placeholder button
                  <button className="btn-primary">View Thank You</button>
                )}

                 {/* Example: Cancel button for pending donations (Self-delivery handled by dropdown) */}
                 {/* {donation.deliveryType === 'courier' && donation.originalStatus === 'Preparing' && (
                     <button className="btn-secondary">Cancel Donation</button> // Implement cancellation logic
                 )} */}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No donations found</h3>
            <p>You haven't made any donations yet{filter !== 'all' ? ` matching the filter "${getStatusText(filter.replace('-', ' '))}"` : ''}.</p> {/* Use formatted filter name */}
            <a href="/needs" className="btn-primary">Browse School Needs</a>
          </div>
        )}
      </div>

      {/* --- Location Details Modal --- */}
      {viewingSchoolLocation && (
        <div className="location-modal-overlay" onClick={handleCloseLocationDetails}>
          <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={handleCloseLocationDetails}>×</button>
            <h3>{viewingSchoolLocation.schoolName} Location</h3>
            <div className="location-details-body">
                <p><strong>Address:</strong></p>
                <p>{viewingSchoolLocation.streetAddress}</p>
                <p>{viewingSchoolLocation.city}, {viewingSchoolLocation.postalCode}</p>
                <p>{viewingSchoolLocation.district}, {viewingSchoolLocation.province}</p>

                {viewingSchoolLocation.location?.coordinates && (
                    <>
                        <p><strong>Coordinates:</strong></p>
                        <p>Lat: {viewingSchoolLocation.location.coordinates[1].toFixed(6)}, Lon: {viewingSchoolLocation.location.coordinates[0].toFixed(6)}</p>
                        <p className="view-on-map-link">
                             <a
                                 href={`https://maps.google.com/?q=${viewingSchoolLocation.location.coordinates[1]},${viewingSchoolLocation.location.coordinates[0]}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                             >
                                 View on Google Maps
                             </a>
                        </p>
                    </>
                )}
            </div>
          </div>
        </div>
      )}
      {/* --- End Location Details Modal --- */}

    </div>
  );
};

export default MyDonations;
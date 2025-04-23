import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Adjust the import path based on your project structure
import './MyDonations.css';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        // Real API call using the configured api instance
        const response = await api.get('/api/donations/my-donations');
        // Map backend data to frontend structure
        const formattedDonations = response.data.map(donation => ({
          id: donation._id, // Use _id from MongoDB
          schoolName: donation.school?.schoolName || 'Unknown School', // Safely access school name
          date: donation.createdAt, // Use createdAt timestamp
          // Map itemsDonated array to simple string array for display
          items: donation.itemsDonated.map(item => `${item.quantityDonated}x ${item.categoryNameEnglish || 'Item'}`),
          status: donation.trackingStatus.toLowerCase().replace(/\s+/g, '-'), // Convert 'In Transit' to 'in-transit', etc.
          amount: donation.shippingCostEstimate ? `Est. Shipping: Rs. ${donation.shippingCostEstimate}` : 'N/A', // Placeholder for value, using estimate if available
          impact: donation.donorRemarks || '', // Using donor remarks as a proxy for impact/notes for now
          deliveryType: donation.deliveryMethod === 'Self-Delivery' ? 'self' : 'courier',
          // Keep original backend status and deliveryMethod for logic
          originalStatus: donation.trackingStatus,
          originalDeliveryMethod: donation.deliveryMethod,
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
    return donation.status === filter;
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Get the status text with proper formatting from original backend status
  const getStatusText = (originalStatus) => {
    // Simple formatting, adjust if backend uses different casing or terms
     if (!originalStatus) return 'Unknown';
     return originalStatus
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
        // Optionally show an error message to the user
        alert("Status can only be updated for Self-Delivery donations.");
        return;
    }

    // Optimistic UI update (optional, but improves perceived performance)
    const originalDonations = [...donations];
    setDonations(prevDonations =>
      prevDonations.map(donation =>
        donation.id === donationId
        ? {
            ...donation,
            status: newStatusBackendFormat.toLowerCase().replace(/\s+/g, '-'),
            originalStatus: newStatusBackendFormat // Update original status as well
          }
        : donation
      )
    );

    try {
      // API call to update status
      await api.put(`/api/donations/${donationId}/status`, { newStatus: newStatusBackendFormat });
      // If successful, the optimistic update is kept. Maybe show a success toast.
      console.log(`Donation ${donationId} status updated to ${newStatusBackendFormat}`);
      // No need to refetch, UI is already updated optimistically.
      // If not using optimistic update, you'd update state here:
      // setDonations(prevDonations => prevDonations.map(d => d.id === donationId ? {...d, status: newStatusBackendFormat.toLowerCase()...} : d));

    } catch (err) {
      console.error("Error updating donation status:", err);
      const message = err.response?.data?.message || err.message || 'Failed to update status.';
      setError(`Update failed: ${message}`); // Show error to user
      // Revert optimistic update on failure
      setDonations(originalDonations);
      alert(`Failed to update status: ${message}`); // Simple alert for feedback
    }
  };

  return (
    <div className="donations-page-container">
      <div className="donations-header">
        <h1>My Donations</h1>
        <p className="subtitle">Track and manage your contributions to schools across Sri Lanka</p>
      </div>

      {/* Filter Component remains the same */}
      <div className="donations-filter">
        <div className="filter-tabs">
           {/* Add keys for list items */}
          {['all', 'self', 'courier', 'pending', 'in-transit', 'delivered', 'received-by-school', 'cancelled'].map(f => (
             <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
             >
                {/* Format filter names for display */}
                {f === 'self' ? 'Self Delivery' :
                 f === 'courier' ? 'Courier Service' :
                 getStatusText(f.replace('-', ' '))}
            </button>
          ))}
        </div>
      </div>

        {/* Display Error Message */}
        {error && (
            <div style={{ color: 'red', backgroundColor: '#ffebee', border: '1px solid red', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
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
                      {/* Use backend status values */}
                      <option value="Preparing">Preparing</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      {/* Add other relevant statuses if the backend allows donor to set them,
                          but keep Received by School/Cancelled disabled */}
                      {donation.originalStatus === 'Received by School' && <option value="Received by School" disabled>Received by School</option>}
                      {donation.originalStatus === 'Cancelled' && <option value="Cancelled" disabled>Cancelled</option>}
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

              {/* Actions remain largely the same, adjust conditions based on originalStatus */}
              <div className="donation-actions">
                <button className="btn-primary">View Details</button>
                {donation.originalStatus === 'Received by School' && ( // Check original backend status
                  <button className="btn-secondary">View Thank You</button> // Changed text slightly
                )}
                 {/* Example: Tracking button if it's courier and has an adminTrackingId */}
                {donation.deliveryType === 'courier' && donation.originalStatus === 'In Transit' && donation.adminTrackingId && (
                    <button className="btn-secondary">Track Package ({donation.adminTrackingId})</button> // Display tracking ID if available
                )}
                {/* Add other conditional buttons if needed */}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No donations found</h3>
            <p>You haven't made any donations yet{filter !== 'all' ? ` matching the filter "${filter}"` : ''}.</p>
            <a href="/needs" className="btn-primary">Browse School Needs</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDonations;
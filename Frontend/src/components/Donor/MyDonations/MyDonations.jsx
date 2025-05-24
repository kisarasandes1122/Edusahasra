import React, { useState, useEffect } from 'react';
import api from '../../../api';
import './MyDonations.css';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const [viewingSchoolLocation, setViewingSchoolLocation] = useState(null);


  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/donations/my-donations');
        const formattedDonations = response.data.map(donation => ({
          id: donation._id,
          schoolName: donation.school?.schoolName || 'Unknown School',
          schoolDetails: donation.school ? {
              _id: donation.school._id,
              schoolName: donation.school.schoolName,
              streetAddress: donation.school.streetAddress,
              city: donation.school.city,
              district: donation.school.district,
              province: donation.school.province,
              postalCode: donation.school.postalCode,
              location: donation.school.location,
          } : null,
          date: donation.createdAt,
          items: donation.itemsDonated.map(item => `${item.quantityDonated}x ${item.categoryNameEnglish || 'Item'}`),
          status: donation.trackingStatus.toLowerCase().replace(/\s+/g, '-'),
          amount: donation.shippingCostEstimate ? `Est. Shipping: Rs. ${donation.shippingCostEstimate}` : 'N/A',
          impact: donation.donorRemarks || 'N/A',
          deliveryType: donation.deliveryMethod === 'Self-Delivery' ? 'self' : 'courier',
          originalStatus: donation.trackingStatus,
          originalDeliveryMethod: donation.deliveryMethod,
          adminTrackingId: donation.adminTrackingId || null,
        }));
        setDonations(formattedDonations);
      } catch (err) {
        console.error("Error fetching donations:", err);
        const message = err.response?.data?.message || err.message || 'Failed to fetch donations.';
        setError(message);
        setDonations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    if (filter === 'self' || filter === 'courier') return donation.deliveryType === filter;
    return donation.status === filter;
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const getStatusText = (originalStatus) => {
     if (!originalStatus) return 'Unknown';
     if (originalStatus === 'Received by School') return 'Received by School';
     if (originalStatus === 'Pending Confirmation') return 'Pending Confirmation';
     if (originalStatus === 'Cancelled') return 'Cancelled';
     return originalStatus
       .toLowerCase()
       .split(' ')
       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
       .join(' ');
  };


  const updateDonationStatus = async (donationId, newStatusBackendFormat) => {
    const donationToUpdate = donations.find(d => d.id === donationId);
    if (!donationToUpdate || donationToUpdate.deliveryType !== 'self') {
        console.warn("Attempted to update status for non-self-delivery or non-existent donation.");
        alert("Status can only be updated for Self-Delivery donations.");
        return;
    }

    const finalStatuses = ['Received by School', 'Cancelled'];
    if (finalStatuses.includes(donationToUpdate.originalStatus)) {
        alert(`Cannot update status for a donation that is already "${getStatusText(donationToUpdate.originalStatus)}".`);
        return;
    }
    const statusOrder = ['Preparing', 'In Transit', 'Delivered', 'Received by School', 'Cancelled'];
    const currentIndex = statusOrder.indexOf(donationToUpdate.originalStatus);
    const newIndex = statusOrder.indexOf(newStatusBackendFormat);
    if (newIndex < currentIndex && newStatusBackendFormat !== 'Cancelled') {
         alert(`Cannot change status from "${getStatusText(donationToUpdate.originalStatus)}" to "${getStatusText(newStatusBackendFormat)}".`);
         return;
    }


    const originalDonations = [...donations];
    setDonations(prevDonations =>
      prevDonations.map(donation =>
        donation.id === donationId
        ? {
            ...donation,
            status: newStatusBackendFormat.toLowerCase().replace(/\s+/g, '-'),
            originalStatus: newStatusBackendFormat
          }
        : donation
      )
    );

    try {
      await api.put(`/api/donations/${donationId}/status`, { newStatus: newStatusBackendFormat });
      console.log(`Donation ${donationId} status updated to ${newStatusBackendFormat}`);

    } catch (err) {
      console.error("Error updating donation status:", err);
      const message = err.response?.data?.message || err.message || 'Failed to update status.';
      setError(`Update failed for Donation ${donationId}: ${message}`);
      setDonations(originalDonations);
      alert(`Failed to update status: ${message}`);
    }
  };

  const handleViewLocationDetails = (schoolDetails) => {
    setViewingSchoolLocation(schoolDetails);
  };

  const handleCloseLocationDetails = () => {
    setViewingSchoolLocation(null);
  };


  return (
    <div className="donations-page-container">
      <div className="donations-header">
        <h1>My Donations</h1>
        <p className="subtitle">Track and manage your contributions to schools across Sri Lanka</p>
      </div>

      <div className="donations-filter">
        <div className="filter-tabs">
          {['all', 'self', 'courier', 'pending-confirmation', 'preparing', 'in-transit', 'delivered', 'received-by-school', 'cancelled'].map(f => (
             <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
             >
                {f === 'all' ? 'All' :
                 f === 'self' ? 'Self Delivery' :
                 f === 'courier' ? 'Courier Service' :
                 getStatusText(f.replace('-', ' '))}
            </button>
          ))}
        </div>
      </div>

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
                {donation.deliveryType === 'self' ? (
                  <div className="status-dropdown">
                    <select
                      value={donation.originalStatus}
                      onChange={(e) => updateDonationStatus(donation.id, e.target.value)}
                      disabled={donation.originalStatus === 'Received by School' || donation.originalStatus === 'Cancelled'}
                      className={`status-selector ${donation.status}`}
                    >
                      <option value="Preparing">Preparing</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                       {donation.originalStatus === 'Received by School' && <option value="Received by School" disabled>Received by School</option>}
                       {donation.originalStatus === 'Cancelled' && <option value="Cancelled" disabled>Cancelled</option>}
                       {donation.originalStatus !== 'Received by School' && donation.originalStatus !== 'Cancelled' && (
                            <option value="Cancelled">Cancel Donation</option>
                       )}
                    </select>
                  </div>
                ) : (
                  <span className={`status-badge ${donation.status}`}>
                    {getStatusText(donation.originalStatus)}
                  </span>
                )}
              </div>

              <div className="donation-details">
                <div className="donation-detail">
                  <span className="detail-label">Date Donated</span>
                  <span className="detail-value">{new Date(donation.date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                <div className="donation-detail">
                  <span className="detail-label">Donated Items</span>
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

              <div className="donation-actions">
                {donation.deliveryType === 'self' && donation.schoolDetails && (
                    <button
                        className="btn-secondary"
                        onClick={() => handleViewLocationDetails(donation.schoolDetails)}
                    >
                        View School Location
                    </button>
                )}

                {donation.deliveryType === 'courier' && donation.adminTrackingId && (
                    <button className="btn-secondary">Track Package ({donation.adminTrackingId})</button>
                )}

                {donation.originalStatus === 'Received by School' && (
                  <button className="btn-primary">View Thank You</button>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No donations found</h3>
            <p>You haven't made any donations yet{filter !== 'all' ? ` matching the filter "${getStatusText(filter.replace('-', ' '))}"` : ''}.</p>
            <a href="/needs" className="btn-primary">Browse School Needs</a>
          </div>
        )}
      </div>

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

    </div>
  );
};

export default MyDonations;
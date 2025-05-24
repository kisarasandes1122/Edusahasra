import React, { useState } from 'react';
import {
    RiArrowLeftLine,
    RiTruckLine,
    RiHomeGearLine, 
    RiCalendarLine,
    RiTimeLine, 
    RiCheckboxCircleLine,
    RiMailLine, 
    RiPhoneLine, 
    RiMapPinLine, 
    RiEditLine, 
    RiCloseCircleLine, 
    RiRefreshLine 
} from 'react-icons/ri';
import './DonationDetails.css';
import api from '../../../api';
import Message from '../../Common/Message/Message';

const DonationDetails = ({ donation, onBack }) => {
    const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
    const [newStatus, setNewStatus] = useState(donation.trackingStatus);
    const [adminTrackingId, setAdminTrackingId] = useState(donation.adminTrackingId || '');
    const [adminRemarks, setAdminRemarks] = useState(donation.adminRemarks || '');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(null);

    const isEligibleForAdminUpdate = donation.deliveryMethod === 'Courier' &&
                                     !['Received by School', 'Cancelled'].includes(donation.trackingStatus);

     const allowedAdminUpdateStatuses = [
         'Pending Confirmation',
         'Preparing',
         'In Transit',
         'Delivered',
         'Cancelled'
     ].filter(status => status !== 'Received by School');

    const handleStatusUpdate = async () => {
        setUpdateLoading(true);
        setUpdateError(null);
        setUpdateSuccess(null);

        if (!newStatus || newStatus === donation.trackingStatus) {
            setUpdateError('Please select a new status.');
            setUpdateLoading(false);
            return;
        }

        try {
            const updatePayload = {
                newStatus: newStatus,
                adminTrackingId: adminTrackingId === '' ? null : adminTrackingId,
                adminRemarks: adminRemarks === '' ? null : adminRemarks,
            };
            const { data } = await api.put(`/api/donations/${donation._id}/admin-status`, updatePayload);

            setUpdateSuccess(data.message);
             if (onBack) {
                 onBack(data.donation);
             }

        } catch (err) {
            console.error("Error updating donation status:", err);
            setUpdateError(err.response?.data?.message || 'Failed to update status.');
        } finally {
             setUpdateLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    };

    const getDeliveryIcon = (method) => {
      if (method === 'Courier') {
        return <RiTruckLine className="edusahasra-delivery-icon" />;
      } else {
        return <RiHomeGearLine className="edusahasra-delivery-icon" />;
      }
    };

    const getStatusClass = (status) => {
      switch(status) {
        case 'Received by School': return 'edusahasra-status-delivered';
        case 'Delivered': return 'edusahasra-status-delivered';
        case 'In Transit': return 'edusahasra-status-transit';
        case 'Pending Confirmation': return 'edusahasra-status-pending';
        case 'Preparing': return 'edusahasra-status-processing';
        case 'Cancelled': return 'edusahasra-status-cancelled';
        default: return '';
      }
    };

  return (
    <div className="edusahasra-donation-management">
      <div className="edusahasra-donation-details-header">
        <button onClick={() => onBack(donation)} className="edusahasra-back-button">
          <RiArrowLeftLine />
          <span>Back to Donations List</span>
        </button>
      </div>

      <div className="edusahasra-donation-container">
        <div className="edusahasra-donation-details-summary">
          <div className="edusahasra-details-heading">
            <h2>Donation Details (ID: {donation._id})</h2>
            <span className={`edusahasra-status-badge ${getStatusClass(donation.trackingStatus)}`}>
              {donation.trackingStatus}
            </span>
          </div>

          <div className="edusahasra-details-sections">
            <div className="edusahasra-details-section">
              <div className="edusahasra-donor-details">
                <h3>Donor Information ({donation.donor?.fullName || 'N/A'})</h3>
                <p><RiMailLine /> Email: {donation.donor?.email || 'N/A'}</p>
                <p><RiPhoneLine /> Phone: {donation.donor?.phoneNumber || 'N/A'}</p>
                <p><RiMapPinLine /> Address: {donation.donor?.address || 'N/A'}</p>
                 {typeof donation.donor?.latitude === 'number' && typeof donation.donor?.longitude === 'number' && (
                     <p><RiMapPinLine /> Location: {donation.donor.latitude.toFixed(4)}, {donation.donor.longitude.toFixed(4)}</p>
                 )}
              </div>
            </div>

            <div className="edusahasra-details-section">
              <div className="edusahasra-school-details">
                <h3>School Information ({donation.school?.schoolName || 'N/A'})</h3>
                 <p><RiMapPinLine /> Address: {donation.school?.fullAddress || `${donation.school?.streetAddress || ''}, ${donation.school?.city || ''}, ${donation.school?.district || ''}, ${donation.school?.province || ''}, ${donation.school?.postalCode || ''}`.trim().replace(/^, +|, +$/g, '').replace(/, +,/g, ', ') || 'Address N/A'}</p>
                  {typeof donation.school?.latitude === 'number' && typeof donation.school?.longitude === 'number' && (
                     <p><RiMapPinLine /> Location: {donation.school.latitude.toFixed(4)}, {donation.school.longitude.toFixed(4)}</p>
                  )}
                 <p>Delivery Method: {getDeliveryIcon(donation.deliveryMethod)} {donation.deliveryMethod || 'N/A'}</p>
                 {donation.deliveryMethod === 'Courier' && donation.donorAddress && (
                      <p>Donor Pickup Address: {donation.donorAddress}</p>
                 )}
                 {donation.donorRemarks && (
                      <p>Donor Remarks: {donation.donorRemarks}</p>
                 )}
              </div>
            </div>
          </div>
        </div>

        <div className="edusahasra-donation-items-section">
          <h3>Donated Items</h3>
          <div className="edusahasra-donation-items-list">
            {Array.isArray(donation.itemsDonated) && donation.itemsDonated.length > 0 ? (
                donation.itemsDonated.map((item, index) => (
                <div key={index} className="edusahasra-donation-item">
                  <div className="edusahasra-item-icon">
                    <span>📦</span>
                  </div>
                  <div className="edusahasra-item-details">
                    <span className="edusahasra-item-name">{item.categoryNameEnglish || 'Unknown Item'}</span>
                    <span className="edusahasra-item-quantity">{item.quantityDonated} units</span>
                  </div>
                </div>
              ))
            ) : (
                <p>No items listed for this donation.</p>
            )}
          </div>
        </div>

        <div className="edusahasra-tracking-section">
          <h3>Tracking Information</h3>
           <div className="edusahasra-tracking-timeline">
              <div className="edusahasra-tracking-event">
                  <div className="edusahasra-tracking-status">
                      <div className="edusahasra-tracking-icon">
                            {donation.trackingStatus === 'Received by School' ? <RiCheckboxCircleLine /> : getDeliveryIcon(donation.deliveryMethod)}
                      </div>
                      <div className="edusahasra-tracking-status-info">
                          <h4>{donation.trackingStatus || 'Status not available'}</h4>
                          <div className="edusahasra-tracking-time">
                              <RiCalendarLine /> <RiTimeLine style={{marginLeft: '4px'}}/>
                              <span>Last Updated: {formatDateTime(donation.statusLastUpdatedAt || donation.createdAt)}</span>
                          </div>
                           {donation.adminTrackingId && (
                               <p className="edusahasra-tracking-description">Admin Tracking ID: {donation.adminTrackingId}</p>
                           )}
                           {donation.adminRemarks && (
                               <p className="edusahasra-tracking-description">Admin Remarks: {donation.adminRemarks}</p>
                           )}
                           {donation.schoolConfirmation && (
                                <p className="edusahasra-tracking-description">Confirmed by School: {formatDateTime(donation.schoolConfirmationAt)}</p>
                           )}
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {isEligibleForAdminUpdate && (
             <div className="edusahasra-status-update-section">
                 <h3>Update Status (Admin)</h3>
                  {updateError && <Message variant="danger">{updateError}</Message>}
                  {updateSuccess && <Message variant="success">{updateSuccess}</Message>}

                 {!showStatusUpdateForm ? (
                     <button
                        className="edusahasra-btn edusahasra-filter-btn"
                        onClick={() => {
                           setShowStatusUpdateForm(true);
                           setNewStatus(donation.trackingStatus);
                           setAdminTrackingId(donation.adminTrackingId || '');
                           setAdminRemarks(donation.adminRemarks || '');
                           setUpdateError(null);
                           setUpdateSuccess(null);
                        }}
                        disabled={updateLoading}
                     >
                         <RiEditLine className="edusahasra-btn-icon" />
                         Update Tracking Status
                     </button>
                 ) : (
                     <div className="edusahasra-status-update-form">
                         <div className="edusahasra-form-group">
                             <label htmlFor="newStatus">New Status:</label>
                             <select
                                 id="newStatus"
                                 className="edusahasra-select"
                                 value={newStatus}
                                 onChange={(e) => setNewStatus(e.target.value)}
                                 disabled={updateLoading}
                             >
                                 <option value="">Select Status</option>
                                 {allowedAdminUpdateStatuses.map(status => (
                                      (status !== donation.trackingStatus || newStatus === donation.trackingStatus) && (
                                         <option key={status} value={status}>
                                             {status} {status === donation.trackingStatus ? '(Current)' : ''}
                                         </option>
                                     )
                                 ))}
                             </select>
                         </div>
                         <div className="edusahasra-form-group">
                             <label htmlFor="adminTrackingId">Tracking ID (Optional):</label>
                             <input
                                 type="text"
                                 id="adminTrackingId"
                                 className="edusahasra-search-input"
                                 value={adminTrackingId}
                                 onChange={(e) => setAdminTrackingId(e.target.value)}
                                 placeholder="Enter courier tracking ID"
                                 disabled={updateLoading}
                             />
                         </div>
                          <div className="edusahasra-form-group">
                              <label htmlFor="adminRemarks">Admin Remarks (Optional):</label>
                              <textarea
                                  id="adminRemarks"
                                  className="edusahasra-text-area"
                                  value={adminRemarks}
                                  onChange={(e) => setAdminRemarks(e.target.value)}
                                  placeholder="Add any administrative remarks..."
                                  rows="3"
                                  disabled={updateLoading}
                              ></textarea>
                          </div>
                         <div className="edusahasra-form-actions">
                             <button
                                 className="edusahasra-btn edusahasra-filter-btn"
                                 onClick={handleStatusUpdate}
                                 disabled={updateLoading || !newStatus || newStatus === donation.trackingStatus}
                             >
                                 {updateLoading ? <RiRefreshLine className="edusahasra-btn-icon edusahasra-spinner" /> : 'Save Status'}
                             </button>
                             <button
                                 className="edusahasra-btn edusahasra-export-btn"
                                 onClick={() => setShowStatusUpdateForm(false)}
                                 disabled={updateLoading}
                             >
                                 Cancel
                             </button>
                         </div>
                     </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};

export default DonationDetails;
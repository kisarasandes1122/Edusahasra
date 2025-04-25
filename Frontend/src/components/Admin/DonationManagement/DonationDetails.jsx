import React, { useState } from 'react';
import {
    RiArrowLeftLine,
    RiTruckLine,
    RiHomeGearLine, // Added HomeGear icon for Self-Delivery
    RiCalendarLine,
    RiTimeLine, // Added Time icon
    RiCheckboxCircleLine,
    RiMailLine, // Added Mail icon
    RiPhoneLine, // Added Phone icon
    RiMapPinLine, // Added MapPin icon
    RiEditLine, // Added Edit icon for status update
    RiCloseCircleLine, // Added for Cancelled status
    RiRefreshLine // Added for update spinner
} from 'react-icons/ri';
import './DonationDetails.css';
import api from '../../../api';
import Message from '../../Common/Message/Message';
// Loader is not used directly in DonationDetails as per the previous logic,
// loadingDetails is handled by the parent (DonationManagement)
// import Loader from '../../Common/Loader';


// Define the component, accepting 'donation' and 'onBack' props
const DonationDetails = ({ donation, onBack }) => {

    // State for status update form
    const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
    // Initialize state from the donation prop
    const [newStatus, setNewStatus] = useState(donation.trackingStatus);
    const [adminTrackingId, setAdminTrackingId] = useState(donation.adminTrackingId || ''); // Use || '' for inputs
    const [adminRemarks, setAdminRemarks] = useState(donation.adminRemarks || '');       // Use || '' for textareas
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(null);

    // Check if the donation is eligible for admin status update
    // Admin can update Courier deliveries UNLESS they are already Received by School or Cancelled
    const isEligibleForAdminUpdate = donation.deliveryMethod === 'Courier' &&
                                     !['Received by School', 'Cancelled'].includes(donation.trackingStatus);

     // Determine allowed statuses for the dropdown in the admin update form
     const allowedAdminUpdateStatuses = [
        // Only allow setting statuses up to Delivered for Courier via admin
         'Pending Confirmation',
         'Preparing',
         'In Transit',
         'Delivered',
         'Cancelled' // Allow admin to cancel Courier deliveries
     ].filter(status => status !== 'Received by School'); // Admin cannot set Received by School


    // --- Handle Status Update Submission ---
    const handleStatusUpdate = async () => {
        setUpdateLoading(true);
        setUpdateError(null);
        setUpdateSuccess(null);

        // Basic validation
        if (!newStatus || newStatus === donation.trackingStatus) {
            setUpdateError('Please select a new status.');
            setUpdateLoading(false);
            return;
        }
         // You could add frontend validation here if needed, e.g., check status transitions
         // based on `allowedAdminUpdateStatuses`.

        try {
            const updatePayload = {
                newStatus: newStatus,
                // Send null or empty string if input is empty
                // Sending null is better as it explicitly clears the field in DB if it existed
                adminTrackingId: adminTrackingId === '' ? null : adminTrackingId,
                adminRemarks: adminRemarks === '' ? null : adminRemarks,
            };
            const { data } = await api.put(`/api/donations/${donation._id}/admin-status`, updatePayload);

            setUpdateSuccess(data.message);
            // Pass the updated donation data back to the parent
             if (onBack) {
                 // Pass the updated donation data back. The parent (DonationManagement)
                 // will receive this and can update its list state.
                 onBack(data.donation);
             }
             // No need to hide the form immediately, success message is shown
             // setShowStatusUpdateForm(false); // Hide form on success - decide UX

        } catch (err) {
            console.error("Error updating donation status:", err);
            setUpdateError(err.response?.data?.message || 'Failed to update status.');
        } finally {
             setUpdateLoading(false);
        }
    };


    // Helper function to format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString; // Return original if formatting fails
        }
    };

     // Get delivery method icon
    const getDeliveryIcon = (method) => {
      if (method === 'Courier') {
        return <RiTruckLine className="edusahasra-delivery-icon" />;
      } else { // Assuming 'Self-Delivery'
        return <RiHomeGearLine className="edusahasra-delivery-icon" />;
      }
    };

    // Get status class based on status value
    const getStatusClass = (status) => {
      switch(status) { // Use backend status values directly
        case 'Received by School': return 'edusahasra-status-delivered'; // Map to 'Delivered' style
        case 'Delivered': return 'edusahasra-status-delivered'; // Map to 'Delivered' style
        case 'In Transit': return 'edusahasra-status-transit';
        case 'Pending Confirmation': return 'edusahasra-status-pending';
        case 'Preparing': return 'edusahasra-status-processing';
        case 'Cancelled': return 'edusahasra-status-cancelled'; // Add a cancelled status style in CSS
        default: return '';
      }
    };


  return (
    <div className="edusahasra-donation-management"> {/* Keep the same container class */}
      <div className="edusahasra-donation-details-header">
         {/* Call onBack directly with the current donation data before any update happened */}
        <button onClick={() => onBack(donation)} className="edusahasra-back-button">
          <RiArrowLeftLine />
          <span>Back to Donations List</span>
        </button>
      </div>

      <div className="edusahasra-donation-container"> {/* Keep the same container class */}
        <div className="edusahasra-donation-details-summary">
          <div className="edusahasra-details-heading">
            <h2>Donation Details (ID: {donation._id})</h2> {/* Use _id */}
            <span className={`edusahasra-status-badge ${getStatusClass(donation.trackingStatus)}`}>
              {donation.trackingStatus} {/* Use trackingStatus */}
            </span>
          </div>

          <div className="edusahasra-details-sections">
            <div className="edusahasra-details-section">
              <div className="edusahasra-donor-details">
                <h3>Donor Information ({donation.donor?.fullName || 'N/A'})</h3> {/* Include name in heading */}
                {/* Use real donor data */}
                <p><RiMailLine /> Email: {donation.donor?.email || 'N/A'}</p>
                <p><RiPhoneLine /> Phone: {donation.donor?.phoneNumber || 'N/A'}</p>
                <p><RiMapPinLine /> Address: {donation.donor?.address || 'N/A'}</p>
                {/* Add location coords if available and are numbers */}
                 {typeof donation.donor?.latitude === 'number' && typeof donation.donor?.longitude === 'number' && (
                     <p><RiMapPinLine /> Location: {donation.donor.latitude.toFixed(4)}, {donation.donor.longitude.toFixed(4)}</p>
                 )}
              </div>
            </div>

            <div className="edusahasra-details-section">
              <div className="edusahasra-school-details">
                <h3>School Information ({donation.school?.schoolName || 'N/A'})</h3> {/* Include name in heading */}
                 {/* Use combined address from backend or construct it */}
                 <p><RiMapPinLine /> Address: {donation.school?.fullAddress || `${donation.school?.streetAddress || ''}, ${donation.school?.city || ''}, ${donation.school?.district || ''}, ${donation.school?.province || ''}, ${donation.school?.postalCode || ''}`.trim().replace(/^, +|, +$/g, '').replace(/, +,/g, ', ') || 'Address N/A'}</p>
                 {/* Add location coords if available and are numbers */}
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
             {/* Map over real itemsDonated array */}
            {Array.isArray(donation.itemsDonated) && donation.itemsDonated.length > 0 ? (
                donation.itemsDonated.map((item, index) => (
                <div key={index} className="edusahasra-donation-item">
                  <div className="edusahasra-item-icon">
                     {/* Use generic icon or add logic based on categoryId/Name */}
                    <span>📦</span> {/* Generic box icon */}
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
          {/* This section will show the current status and relevant details */}
           <div className="edusahasra-tracking-timeline">
              <div className="edusahasra-tracking-event">
                  <div className="edusahasra-tracking-status">
                      <div className="edusahasra-tracking-icon">
                           {/* Icon based on current status */}
                            {donation.trackingStatus === 'Received by School' ? <RiCheckboxCircleLine /> : getDeliveryIcon(donation.deliveryMethod)}
                      </div>
                      <div className="edusahasra-tracking-status-info">
                           {/* Display current status and last update time */}
                          <h4>{donation.trackingStatus || 'Status not available'}</h4>
                          <div className="edusahasra-tracking-time">
                              <RiCalendarLine /> <RiTimeLine style={{marginLeft: '4px'}}/>
                              <span>Last Updated: {formatDateTime(donation.statusLastUpdatedAt || donation.createdAt)}</span>
                          </div>
                           {/* Display Admin tracking ID if available */}
                           {donation.adminTrackingId && (
                               <p className="edusahasra-tracking-description">Admin Tracking ID: {donation.adminTrackingId}</p>
                           )}
                           {/* Display Admin Remarks if available */}
                           {donation.adminRemarks && (
                               <p className="edusahasra-tracking-description">Admin Remarks: {donation.adminRemarks}</p>
                           )}
                           {/* Display School Confirmation status */}
                           {donation.schoolConfirmation && (
                                <p className="edusahasra-tracking-description">Confirmed by School: {formatDateTime(donation.schoolConfirmationAt)}</p>
                           )}
                      </div>
                  </div>
              </div>
              {/* No historical timeline from the model for now */}
           </div>
        </div>

         {/* --- Admin Status Update Section (Conditional) --- */}
        {isEligibleForAdminUpdate && (
             <div className="edusahasra-status-update-section">
                 <h3>Update Status (Admin)</h3>
                  {/* Show messages within this section */}
                  {updateError && <Message variant="danger">{updateError}</Message>}
                  {updateSuccess && <Message variant="success">{updateSuccess}</Message>}


                 {!showStatusUpdateForm ? (
                     <button
                        className="edusahasra-btn edusahasra-filter-btn" // Reusing button style
                        onClick={() => {
                           setShowStatusUpdateForm(true);
                           // Reset form fields to current donation values when opening
                           setNewStatus(donation.trackingStatus);
                           setAdminTrackingId(donation.adminTrackingId || '');
                           setAdminRemarks(donation.adminRemarks || '');
                           setUpdateError(null); // Clear previous error
                           setUpdateSuccess(null); // Clear previous success
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
                                 className="edusahasra-select" // Reusing select style
                                 value={newStatus}
                                 onChange={(e) => setNewStatus(e.target.value)}
                                 disabled={updateLoading}
                             >
                                 <option value="">Select Status</option>
                                 {/* Map through allowed statuses for admin update */}
                                 {allowedAdminUpdateStatuses.map(status => (
                                     // Only show statuses that are different from the current one
                                     // and are in the allowed list.
                                     // Also, handle the current status being shown correctly.
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
                                 className="edusahasra-search-input" // Reusing input style
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
                                  className="edusahasra-text-area" // Need to add style for textarea
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
                                 // Disable save if loading, no new status selected, or new status is the same as current
                                 disabled={updateLoading || !newStatus || newStatus === donation.trackingStatus}
                             >
                                 {updateLoading ? <RiRefreshLine className="edusahasra-btn-icon edusahasra-spinner" /> : 'Save Status'}
                             </button>
                             <button
                                 className="edusahasra-btn edusahasra-export-btn" // Reusing style
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
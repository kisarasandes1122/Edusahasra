import React, { useState, useMemo, useEffect } from 'react';
import {
  RiSearchLine,
  RiFilterLine,
  RiDownload2Line,
  RiTruckLine,
  RiHomeGearLine,
  RiCalendarLine,
  RiRefreshLine // Added refresh icon
} from 'react-icons/ri';
import './DonationManagement.css';
import DonationDetails from './DonationDetails';
import api from '../../../api'; // Import the configured Axios instance
import Loader from '../../Common/LoadingSpinner/LoadingSpinner'; // Assuming you have a Loader component
import Message from '../../Common/Message/Message'; // <-- Import the Message component


const DonationManagement = () => {
  const [donations, setDonations] = useState([]); // Use state for fetched data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(''); // Assuming YYYY-MM-DD format
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10; // Increased per page count for better admin view

  // State for detail view
  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);


  // --- Fetch Donations Hook ---
  const fetchDonations = async () => {
    setLoading(true);
    setError(null); // Clear previous error
    try {
      const { data } = await api.get('/api/donations/admin-view');
      setDonations(data); // Set fetched data to state
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin donations:", err);
      setError(err.response?.data?.message || 'Failed to fetch donations.');
      setLoading(false);
    }
  };

  // Fetch donations on component mount
  useEffect(() => {
    fetchDonations();
  }, []); // Empty dependency array means run once on mount


  // --- Handle Filter and Pagination ---
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Filter donations using the fetched data (Client-side filtering)
  const filteredDonations = useMemo(() => {
      // Ensure 'donations' is an array before filtering
    if (!Array.isArray(donations)) {
        console.warn("Donations data is not an array:", donations);
        return [];
    }

    return donations.filter(donation => {
      // Add more robust checks for the structure before accessing nested properties
      if (!donation) {
          return false; // Skip null/undefined donation objects
      }

      const searchLower = searchQuery.toLowerCase();

      // Use optional chaining and nullish coalescing for safe access
      const donorName = donation.donor?.fullName ?? '';
      const schoolName = donation.school?.schoolName ?? '';
      const schoolCity = donation.school?.city ?? '';

      const matchesSearch = donorName.toLowerCase().includes(searchLower) ||
                           schoolName.toLowerCase().includes(searchLower) ||
                           schoolCity.toLowerCase().includes(searchLower) ||
                           (Array.isArray(donation.itemsDonated) && donation.itemsDonated.some(item => {
                               const categoryName = item?.categoryNameEnglish ?? ''; // Check item and name
                               return categoryName.toLowerCase().includes(searchLower);
                           }));

      const trackingStatus = donation.trackingStatus ?? ''; // Safely get trackingStatus
      const matchesStatus = selectedStatus === 'all' ||
                            trackingStatus.toLowerCase() === selectedStatus.toLowerCase();

      const deliveryMethod = donation.deliveryMethod ?? ''; // Safely get deliveryMethod
      const matchesMethod = selectedDeliveryMethod === 'all' ||
                            deliveryMethod.toLowerCase() === selectedDeliveryMethod.toLowerCase();

      // Date matching logic (assuming donation.createdAt is a valid date string/object)
      const matchesDate = !selectedDate ||
                          (donation.createdAt && new Date(donation.createdAt).toISOString().split('T')[0] === selectedDate); // Check if createdAt exists

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  }, [donations, searchQuery, selectedStatus, selectedDate, selectedDeliveryMethod]); // Re-run when these dependencies change


  // Calculate pagination info based on filtered data
  const totalEntries = filteredDonations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startEntryIndex = (currentPage - 1) * entriesPerPage;
  const endEntryIndex = Math.min(startEntryIndex + entriesPerPage, totalEntries);
  const startEntryNumber = totalEntries === 0 ? 0 : startEntryIndex + 1; // Display 1-based index
  const endEntryNumber = totalEntries === 0 ? 0 : endEntryIndex;

  // Get the donations for the current page
  const currentDonations = filteredDonations.slice(startEntryIndex, endEntryIndex);


  // Handle page changes
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for pagination control (simple range for now)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Limit number of page buttons shown
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if we are at the end
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
  }


  // --- Handle View Details ---
  const handleViewDetails = async (donationId) => {
    setLoadingDetails(true);
    setErrorDetails(null); // Clear previous detail error
    try {
      // Fetch full donation details using the specific GET /api/donations/admin/:id route
      const { data } = await api.get(`/api/donations/admin/${donationId}`);
      setSelectedDonation(data);
      setViewingDetails(true);
      setLoadingDetails(false);
    } catch (err) {
      console.error("Error fetching donation details:", err);
      setErrorDetails(err.response?.data?.message || 'Failed to fetch donation details.');
      setLoadingDetails(false);
       // Stay on list view and show error message if details fetch fails
       setViewingDetails(false);
       setSelectedDonation(null);
    }
  };

  // Handle back button click from details view
  // This function now receives the potentially updated donation data from DonationDetails
  const handleBackToList = (updatedDonation) => {
     // If updatedDonation is provided (e.g., after a status update), update the list state
     if (updatedDonation && updatedDonation._id) {
         setDonations(prevDonations =>
             prevDonations.map(d => d._id === updatedDonation._id ? updatedDonation : d)
         );
         // The useMemo hook will automatically re-filter and re-paginate based on the updated data
     }
    setViewingDetails(false);
    setSelectedDonation(null);
    setErrorDetails(null); // Clear detail error on back
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

   // Get delivery method icon
  const getDeliveryIcon = (method) => {
    if (method === 'Courier') {
      return <RiTruckLine className="edusahasra-delivery-icon" />;
    } else { // Assuming 'Self-Delivery'
      return <RiHomeGearLine className="edusahasra-delivery-icon" />;
    }
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString; // Return original if formatting fails
    }
  };


  // Render details view or list view based on state
  if (viewingDetails && selectedDonation) {
    // Pass handleBackToList (which now accepts updated donation)
    return <DonationDetails donation={selectedDonation} onBack={handleBackToList} />;
  }


    // Render loading state for detail fetch attempts (if they happen while list is visible)
    if (loadingDetails) {
        // Could overlay a spinner or show a message
         return <Loader />; // Or a smaller loader specific to details fetch
    }


  return (
    <div className="edusahasra-donation-management">
      <div className="edusahasra-donation-header">
        <h1>Donation Management</h1>
         {/* Replace static text with dynamic user info if available */}
        <div className="edusahasra-user-info">Admin User</div> {/* You might replace this with actual admin name */}
      </div>

      <div className="edusahasra-donation-container">
        <div className="edusahasra-donation-top-section">
          <div className="edusahasra-donation-title">
            <h2>Donations List</h2>
            <p className="edusahasra-donation-subtitle">Track and manage all donations</p>
          </div>

          <div className="edusahasra-donation-actions">
             {/* Refresh Button */}
            <button className="edusahasra-btn edusahasra-export-btn" onClick={fetchDonations} disabled={loading}>
               <RiRefreshLine className={`edusahasra-btn-icon ${loading ? 'edusahasra-spinner' : ''}`} />
               {loading ? 'Loading...' : 'Refresh'}
             </button>
            <button className="edusahasra-btn edusahasra-export-btn">
              <RiDownload2Line className="edusahasra-btn-icon" />
              Export
            </button>
          </div>
        </div>

         {/* Display list error message */}
         {error && <Message variant="danger">{error}</Message>}
         {/* Display detail fetch error message if it occurred */}
         {errorDetails && <Message variant="danger">{errorDetails}</Message>}


        <div className="edusahasra-donation-filters">
          <div className="edusahasra-search-container">
            <RiSearchLine className="edusahasra-search-icon" />
            <input
              type="text"
              className="edusahasra-search-input"
              placeholder="Search donor, school, city, or item..."
              value={searchQuery}
              onChange={handleFilterChange(setSearchQuery)}
            />
          </div>

          <div className="edusahasra-filter-container">
            <select
              className="edusahasra-select"
              value={selectedStatus}
              onChange={handleFilterChange(setSelectedStatus)}
            >
              <option value="all">All Statuses</option>
              {/* Use actual backend statuses */}
              <option value="Pending Confirmation">Pending Confirmation</option>
              <option value="Preparing">Preparing</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Received by School">Received by School</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="edusahasra-date-container">
            <div className="edusahasra-date-wrapper">
              <input
                type="date"
                className="edusahasra-date-input"
                value={selectedDate}
                onChange={handleFilterChange(setSelectedDate)}
              />
              {/* <RiCalendarLine className="edusahasra-calendar-icon" /> Icon might overlap with date picker */}
            </div>
          </div>

          <div className="edusahasra-filter-container">
            <select
              className="edusahasra-select"
              value={selectedDeliveryMethod}
              onChange={handleFilterChange(setSelectedDeliveryMethod)}
            >
              <option value="all">All Methods</option>
              {/* Use actual backend delivery methods */}
              <option value="Courier">Courier Delivery</option>
              <option value="Self-Delivery">Self-Delivery</option>
            </select>
          </div>
        </div>

        <div className="edusahasra-donation-table">
          <div className="edusahasra-table-header">
            <div className="edusahasra-header-cell edusahasra-donor-column">DONOR</div>
            <div className="edusahasra-header-cell edusahasra-school-column">SCHOOL</div>
            <div className="edusahasra-header-cell edusahasra-items-column">ITEMS</div>
            <div className="edusahasra-header-cell edusahasra-method-column">DELIVERY METHOD</div>
            <div className="edusahasra-header-cell edusahasra-status-column">STATUS</div>
            <div className="edusahasra-header-cell edusahasra-date-column">CREATED DATE</div> {/* Use createdAt */}
            <div className="edusahasra-header-cell edusahasra-actions-column">ACTIONS</div>
          </div>

          {currentDonations.map(donation => (
            <div key={donation._id} className="edusahasra-table-row"> {/* Use _id */}
              <div className="edusahasra-cell edusahasra-donor-column">
                <div className="edusahasra-donor-info">
                  <span className="edusahasra-donor-name">{donation.donor?.fullName || 'N/A'}</span> {/* Use ?. for safety */}
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-school-column">
                <div className="edusahasra-school-info">
                  <div className="edusahasra-school-name">{donation.school?.schoolName || 'N/A'}</div> {/* Use ?. */}
                  <div className="edusahasra-school-location">{`${donation.school?.city || ''}, ${donation.school?.district || ''}`}</div> {/* Use ?. */}
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-items-column">
                <div className="edusahasra-items-column-wrapper">
                  {Array.isArray(donation.itemsDonated) 
                    ? donation.itemsDonated.map((item, index) => (
                        <span key={index} className="edusahasra-item-pill">
                          {item.categoryNameEnglish || 'N/A'}
                          <span className="edusahasra-item-quantity">({item.quantityDonated || 'N/A'})</span>
                        </span>
                      ))
                    : 'N/A'}
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-method-column">
                <div className="edusahasra-delivery-method">
                  {getDeliveryIcon(donation.deliveryMethod)}
                  <span>{donation.deliveryMethod || 'N/A'}</span> {/* Safely access method */}
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-status-column">
                <span className={`edusahasra-status-badge ${getStatusClass(donation.trackingStatus)}`}> {/* Use trackingStatus */}
                  {donation.trackingStatus || 'N/A'} {/* Safely access status */}
                </span>
              </div>

              <div className="edusahasra-cell edusahasra-date-column">
                {formatDateTime(donation.createdAt)} {/* Use createdAt */}
              </div>

              <div className="edusahasra-cell edusahasra-actions-column">
                <button
                  className="edusahasra-btn edusahasra-details-btn"
                  onClick={() => handleViewDetails(donation._id)} // Pass _id
                  disabled={loadingDetails} // Disable while fetching details
                >
                   {loadingDetails && selectedDonation?._id === donation._id ? 'Loading...' : 'View'}
                </button>
              </div>
            </div>
          ))}

           {filteredDonations.length === 0 && !loading && !error && (
             <div className="edusahasra-table-row">
                <div style={{ textAlign: 'center', padding: '20px', color: '#718096', width: '100%' }}>
                    No donations found matching your criteria.
                </div>
             </div>
           )}
        </div>

        {totalEntries > 0 && (
          <div className="edusahasra-pagination">
            <div className="edusahasra-pagination-info">
              Showing {startEntryNumber} to {endEntryNumber} of {totalEntries} entries
            </div>
            <div className="edusahasra-pagination-controls">
              <button
                className="edusahasra-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                Previous
              </button>

              <div className="edusahasra-pagination-pages">
                 {getPageNumbers().map(pageNumber => (
                    <button
                      key={pageNumber}
                      className={`edusahasra-page-btn ${currentPage === pageNumber ? 'edusahasra-page-active' : ''}`}
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                 ))}
              </div>

              <button
                className="edusahasra-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationManagement;
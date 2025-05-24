import React, { useState, useMemo, useEffect } from 'react';
import {
  RiSearchLine,
  RiFilterLine,
  RiDownload2Line,
  RiTruckLine,
  RiHomeGearLine,
  RiCalendarLine,
  RiRefreshLine
} from 'react-icons/ri';
import './DonationManagement.css';
import DonationDetails from './DonationDetails';
import api from '../../../api';
import Loader from '../../Common/LoadingSpinner/LoadingSpinner';
import Message from '../../Common/Message/Message';


const DonationManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);


  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/donations/admin-view');
      setDonations(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin donations:", err);
      setError(err.response?.data?.message || 'Failed to fetch donations.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);


  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const filteredDonations = useMemo(() => {
    if (!Array.isArray(donations)) {
        console.warn("Donations data is not an array:", donations);
        return [];
    }

    return donations.filter(donation => {
      if (!donation) {
          return false;
      }

      const searchLower = searchQuery.toLowerCase();

      const donorName = donation.donor?.fullName ?? '';
      const schoolName = donation.school?.schoolName ?? '';
      const schoolCity = donation.school?.city ?? '';

      const matchesSearch = donorName.toLowerCase().includes(searchLower) ||
                           schoolName.toLowerCase().includes(searchLower) ||
                           schoolCity.toLowerCase().includes(searchLower) ||
                           (Array.isArray(donation.itemsDonated) && donation.itemsDonated.some(item => {
                               const categoryName = item?.categoryNameEnglish ?? '';
                               return categoryName.toLowerCase().includes(searchLower);
                           }));

      const trackingStatus = donation.trackingStatus ?? '';
      const matchesStatus = selectedStatus === 'all' ||
                            trackingStatus.toLowerCase() === selectedStatus.toLowerCase();

      const deliveryMethod = donation.deliveryMethod ?? '';
      const matchesMethod = selectedDeliveryMethod === 'all' ||
                            deliveryMethod.toLowerCase() === selectedDeliveryMethod.toLowerCase();

      const matchesDate = !selectedDate ||
                          (donation.createdAt && new Date(donation.createdAt).toISOString().split('T')[0] === selectedDate);

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  }, [donations, searchQuery, selectedStatus, selectedDate, selectedDeliveryMethod]);


  const totalEntries = filteredDonations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startEntryIndex = (currentPage - 1) * entriesPerPage;
  const endEntryIndex = Math.min(startEntryIndex + entriesPerPage, totalEntries);
  const startEntryNumber = totalEntries === 0 ? 0 : startEntryIndex + 1;
  const endEntryNumber = totalEntries === 0 ? 0 : endEntryIndex;

  const currentDonations = filteredDonations.slice(startEntryIndex, endEntryIndex);


  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
  }


  const handleViewDetails = async (donationId) => {
    setLoadingDetails(true);
    setErrorDetails(null);
    try {
      const { data } = await api.get(`/api/donations/admin/${donationId}`);
      setSelectedDonation(data);
      setViewingDetails(true);
      setLoadingDetails(false);
    } catch (err) {
      console.error("Error fetching donation details:", err);
      setErrorDetails(err.response?.data?.message || 'Failed to fetch donation details.');
      setLoadingDetails(false);
       setViewingDetails(false);
       setSelectedDonation(null);
    }
  };

  const handleBackToList = (updatedDonation) => {
     if (updatedDonation && updatedDonation._id) {
         setDonations(prevDonations =>
             prevDonations.map(d => d._id === updatedDonation._id ? updatedDonation : d)
         );
     }
    setViewingDetails(false);
    setSelectedDonation(null);
    setErrorDetails(null);
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

  const getDeliveryIcon = (method) => {
    if (method === 'Courier') {
      return <RiTruckLine className="edusahasra-delivery-icon" />;
    } else {
      return <RiHomeGearLine className="edusahasra-delivery-icon" />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  };


  if (viewingDetails && selectedDonation) {
    return <DonationDetails donation={selectedDonation} onBack={handleBackToList} />;
  }


    if (loadingDetails) {
         return <Loader />;
    }


  return (
    <div className="edusahasra-donation-management">
      <div className="edusahasra-donation-header">
        <h1>Donation Management</h1>
        <div className="edusahasra-user-info">Admin User</div>
      </div>

      <div className="edusahasra-donation-container">
        <div className="edusahasra-donation-top-section">
          <div className="edusahasra-donation-title">
            <h2>Donations List</h2>
            <p className="edusahasra-donation-subtitle">Track and manage all donations</p>
          </div>

          <div className="edusahasra-donation-actions">
            <button className="edusahasra-btn edusahasra-export-btn" onClick={fetchDonations} disabled={loading}>
               <RiRefreshLine className={`edusahasra-btn-icon ${loading ? 'edusahasra-spinner' : ''}`} />
               {loading ? 'Loading...' : 'Refresh'}
             </button>
          </div>
        </div>

         {error && <Message variant="danger">{error}</Message>}
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
            </div>
          </div>

          <div className="edusahasra-filter-container">
            <select
              className="edusahasra-select"
              value={selectedDeliveryMethod}
              onChange={handleFilterChange(setSelectedDeliveryMethod)}
            >
              <option value="all">All Methods</option>
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
            <div className="edusahasra-header-cell edusahasra-date-column">CREATED DATE</div>
            <div className="edusahasra-header-cell edusahasra-actions-column">ACTIONS</div>
          </div>

          {currentDonations.map(donation => (
            <div key={donation._id} className="edusahasra-table-row">
              <div className="edusahasra-cell edusahasra-donor-column">
                <div className="edusahasra-donor-info">
                  <span className="edusahasra-donor-name">{donation.donor?.fullName || 'N/A'}</span>
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-school-column">
                <div className="edusahasra-school-info">
                  <div className="edusahasra-school-name">{donation.school?.schoolName || 'N/A'}</div>
                  <div className="edusahasra-school-location">{`${donation.school?.city || ''}, ${donation.school?.district || ''}`}</div>
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
                  <span>{donation.deliveryMethod || 'N/A'}</span>
                </div>
              </div>

              <div className="edusahasra-cell edusahasra-status-column">
                <span className={`edusahasra-status-badge ${getStatusClass(donation.trackingStatus)}`}>
                  {donation.trackingStatus || 'N/A'}
                </span>
              </div>

              <div className="edusahasra-cell edusahasra-date-column">
                {formatDateTime(donation.createdAt)}
              </div>

              <div className="edusahasra-cell edusahasra-actions-column">
                <button
                  className="edusahasra-btn edusahasra-details-btn"
                  onClick={() => handleViewDetails(donation._id)}
                  disabled={loadingDetails}
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
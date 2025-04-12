import React, { useState, useMemo } from 'react';
import { 
  RiSearchLine, 
  RiFilterLine, 
  RiDownload2Line,
  RiTruckLine,
  RiHomeGearLine,
  RiCalendarLine
} from 'react-icons/ri';
import './DonationManagement.css';
import DonationDetails from './DonationDetails'; 

const allDonations = [
  {
    id: 1,
    donor: { 
      name: 'Nimal Perera',
      email: 'nimal.perera@email.com',
      phone: '(555) 123-4567'
    },
    school: { name: 'Royal College', location: 'Colombo 07' },
    items: [
      { type: 'Textbooks', quantity: 30 },
      { type: 'Pens', quantity: 100 }
    ],
    deliveryMethod: 'Logistic Delivery',
    deliveryValue: 'logistic', 
    status: 'In Transit',
    date: '2025-01-15',
    tracking: [
      {
        status: 'Picked Up',
        date: 'Jan 15, 2025',
        time: '8:30 AM',
        description: 'Package picked up from donor location'
      },
      {
        status: 'In Transit',
        date: 'Jan 15, 2025',
        time: '2:45 PM',
        description: 'Package en route to destination'
      }
    ]
  },
  {
    id: 2,
    donor: { 
      name: 'Samanthi Silva',
      email: 'samanthi.silva@email.com',
      phone: '(555) 234-5678'
    },
    school: { name: 'Mahamaya Girls College', location: 'Kandy' },
    items: [
      { type: 'Stationery Packs', quantity: 25 }
    ],
    deliveryMethod: 'Self-Delivery',
    deliveryValue: 'self',
    status: 'Delivered',
    date: '2025-01-14',
    tracking: [
      {
        status: 'Picked Up',
        date: 'Jan 14, 2025',
        time: '9:15 AM',
        description: 'Package picked up from donor location'
      },
      {
        status: 'Delivered',
        date: 'Jan 14, 2025',
        time: '11:30 AM',
        description: 'Package delivered to school'
      }
    ]
  },
  // ... rest of the donation data with tracking information added
  // (other donations remain unchanged for brevity)
];

const DonationManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  
  // New state for detail view
  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Handle view details click
  const handleViewDetails = (donation) => {
    setSelectedDonation(donation);
    setViewingDetails(true);
  };

  // Handle back button click
  const handleBackToList = () => {
    setViewingDetails(false);
    setSelectedDonation(null);
  };

  // Same filtering logic as before
  const filteredDonations = useMemo(() => {
    return allDonations.filter(donation => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = donation.donor.name.toLowerCase().includes(searchLower) ||
                           donation.school.name.toLowerCase().includes(searchLower);

      const matchesStatus = selectedStatus === 'all' || 
                            donation.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesMethod = selectedDeliveryMethod === 'all' || 
                            donation.deliveryValue === selectedDeliveryMethod;

      const matchesDate = !selectedDate || donation.date === selectedDate; 

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  }, [searchQuery, selectedStatus, selectedDate, selectedDeliveryMethod]);

  // Calculate pagination info based on filtered data
  const totalEntries = filteredDonations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(startEntry + entriesPerPage - 1, totalEntries);

  // Get the donations for the current page
  const currentDonations = filteredDonations.slice(startEntry - 1, endEntry);

  // Reset to page 1 whenever filters change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1); 
  };

  // Handle page changes
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Generate page numbers for pagination control
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }
    return pages; 
  }

  // Get status class based on status value
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return 'edusahasra-status-delivered';
      case 'in transit': return 'edusahasra-status-transit';
      case 'pending': return 'edusahasra-status-pending';
      case 'processing': return 'edusahasra-status-processing';
      default: return '';
    }
  };

  // Get delivery method icon
  const getDeliveryIcon = (methodValue) => {
    if (methodValue === 'logistic') {
      return <RiTruckLine className="edusahasra-delivery-icon" />;
    } else {
      return <RiHomeGearLine className="edusahasra-delivery-icon" />;
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Render details view or list view based on state
  if (viewingDetails) {
    return <DonationDetails donation={selectedDonation} onBack={handleBackToList} />;
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
            <button className="edusahasra-btn edusahasra-export-btn">
              <RiDownload2Line className="edusahasra-btn-icon" />
              Export
            </button>
          </div>
        </div>

        <div className="edusahasra-donation-filters">
          <div className="edusahasra-search-container">
            <RiSearchLine className="edusahasra-search-icon" />
            <input
              type="text"
              className="edusahasra-search-input"
              placeholder="Search by donor or school..."
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
              <option value="delivered">Delivered</option>
              <option value="in transit">In Transit</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
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
              <option value="logistic">Logistic Delivery</option>
              <option value="self">Self-Delivery</option>
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
            <div className="edusahasra-header-cell edusahasra-date-column">DATE</div>
            <div className="edusahasra-header-cell edusahasra-actions-column">ACTIONS</div>
          </div>

          {currentDonations.map(donation => (
            <div key={donation.id} className="edusahasra-table-row">
              <div className="edusahasra-cell edusahasra-donor-column">
                <div className="edusahasra-donor-info">
                  <span className="edusahasra-donor-name">{donation.donor.name}</span>
                </div>
              </div>
              
              <div className="edusahasra-cell edusahasra-school-column">
                <div className="edusahasra-school-info">
                  <div className="edusahasra-school-name">{donation.school.name}</div>
                  <div className="edusahasra-school-location">{donation.school.location}</div>
                </div>
              </div>
              
              <div className="edusahasra-cell edusahasra-items-column">
                {Array.isArray(donation.items) 
                  ? donation.items.map(item => `${item.type} (${item.quantity})`).join(', ')
                  : donation.items.description}
              </div>
              
              <div className="edusahasra-cell edusahasra-method-column">
                <div className="edusahasra-delivery-method">
                  {getDeliveryIcon(donation.deliveryValue)}
                  <span>{donation.deliveryMethod}</span>
                </div>
              </div>
              
              <div className="edusahasra-cell edusahasra-status-column">
                <span className={`edusahasra-status-badge ${getStatusClass(donation.status)}`}>
                  {donation.status}
                </span>
              </div>
              
              <div className="edusahasra-cell edusahasra-date-column">
                {formatDateForDisplay(donation.date)}
              </div>
              
              <div className="edusahasra-cell edusahasra-actions-column">
                <button 
                  className="edusahasra-btn edusahasra-details-btn"
                  onClick={() => handleViewDetails(donation)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
           
           {filteredDonations.length === 0 && (
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
              Showing {startEntry} to {endEntry} of {totalEntries} entries
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
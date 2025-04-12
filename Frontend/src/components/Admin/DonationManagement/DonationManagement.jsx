import React, { useState, useMemo } from 'react'; // Added useMemo
import { 
  RiSearchLine, 
  RiFilterLine, 
  RiDownload2Line,
  RiTruckLine,
  RiHomeGearLine,
  RiCalendarLine
} from 'react-icons/ri';
import './DonationManagement.css';

const allDonations = [
  {
    id: 1,
    donor: { name: 'Nimal Perera' },
    school: { name: 'Royal College', location: 'Colombo 07' },
    items: { description: 'Used Textbooks (30), Pens (100)' },
    deliveryMethod: 'Logistic Delivery', // Keep descriptive for display
    deliveryValue: 'logistic', 
    status: 'In Transit',
    date: '2025-01-15'
  },
  {
    id: 2,
    donor: { name: 'Samanthi Silva' },
    school: { name: 'Mahamaya Girls College', location: 'Kandy' },
    items: { description: 'Stationery Packs (25)' },
    deliveryMethod: 'Self-Delivery',
    deliveryValue: 'self',
    status: 'Delivered',
    date: '2025-01-14'
  },
  {
    id: 3,
    donor: { name: 'Kasun Jayasuriya' },
    school: { name: 'Ananda College', location: 'Colombo 10' },
    items: { description: 'Used Laptops (5), Mice (5)' },
    deliveryMethod: 'Logistic Delivery',
    deliveryValue: 'logistic',
    status: 'Pending',
    date: '2025-01-20'
  },
  {
    id: 4,
    donor: { name: 'Fathima Rizwan' },
    school: { name: 'Galle Central College', location: 'Galle' },
    items: { description: 'Art Supplies (Bulk), Story Books (50)' },
    deliveryMethod: 'Self-Delivery',
    deliveryValue: 'self',
    status: 'Delivered',
    date: '2025-01-10'
  },
  {
    id: 5,
    donor: { name: 'Ravi Fernando' },
    school: { name: 'Trinity College', location: 'Kandy' },
    items: { description: 'Sports Equipment (Cricket Bats 3, Balls 10)' },
    deliveryMethod: 'Logistic Delivery',
    deliveryValue: 'logistic',
    status: 'Processing',
    date: '2025-01-18'
  },
  // Add more entries if needed for pagination testing
  {
    id: 6,
    donor: { name: 'Chandana Bandara' },
    school: { name: 'Vidyartha College', location: 'Kandy' },
    items: { description: 'Whiteboards (2), Markers (20)' },
    deliveryMethod: 'Self-Delivery',
    deliveryValue: 'self',
    status: 'Pending',
    date: '2025-01-22'
  },
   {
    id: 7,
    donor: { name: 'Anusha Kumari' },
    school: { name: 'Musaeus College', location: 'Colombo 07' },
    items: { description: 'Musical Instruments (Recorders 15)' },
    deliveryMethod: 'Logistic Delivery',
    deliveryValue: 'logistic',
    status: 'Delivered',
    date: '2025-01-05'
  },
];

const DonationManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // Default to 'all'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('all'); // Default to 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5; // Show 5 entries per page

  // Memoize filtered donations to avoid recalculating on every render
  const filteredDonations = useMemo(() => {
    return allDonations.filter(donation => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = donation.donor.name.toLowerCase().includes(searchLower) ||
                           donation.school.name.toLowerCase().includes(searchLower);

      const matchesStatus = selectedStatus === 'all' || 
                            donation.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesMethod = selectedDeliveryMethod === 'all' || 
                            donation.deliveryValue === selectedDeliveryMethod; // Use deliveryValue

      // Ensure date comparison works correctly (exact match for this implementation)
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
    // Logic to potentially show fewer page numbers if there are many pages (e.g., ..., 5, 6, 7, ...)
    // For simplicity here, show all pages up to totalPages
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }
    // Basic example: show first, current +/- 1, last (if many pages)
    // Let's just show all for now as totalPages is small
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

  // Helper function to format date for display (optional)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00'); // Ensure correct parsing
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // Fallback if parsing fails
    }
  };


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
            {/* Filter button might be redundant if filters are always visible */}
            {/* <button className="edusahasra-btn edusahasra-filter-btn">
              <RiFilterLine className="edusahasra-btn-icon" />
              Filter 
            </button> */}
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
              onChange={handleFilterChange(setSearchQuery)} // Use reusable handler
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
                  {/* Avatar Removed */}
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
                {donation.items.description}
              </div>
              
              <div className="edusahasra-cell edusahasra-method-column">
                <div className="edusahasra-delivery-method">
                  {getDeliveryIcon(donation.deliveryValue)}
                  <span>{donation.deliveryMethod}</span> {/* Display descriptive text */}
                </div>
              </div>
              
              <div className="edusahasra-cell edusahasra-status-column">
                <span className={`edusahasra-status-badge ${getStatusClass(donation.status)}`}>
                  {donation.status}
                </span>
              </div>
              
              <div className="edusahasra-cell edusahasra-date-column">
                {formatDateForDisplay(donation.date)} {/* Format date for display */}
              </div>
              
              <div className="edusahasra-cell edusahasra-actions-column">
                <button className="edusahasra-btn edusahasra-details-btn">
                  View
                </button>
              </div>
            </div>
          ))}
           {/* Show message if no results found after filtering */}
           {filteredDonations.length === 0 && (
             <div className="edusahasra-table-row">
                <div style={{ textAlign: 'center', padding: '20px', color: '#718096', width: '100%' }}>
                    No donations found matching your criteria.
                </div>
             </div>
           )}
        </div>

        {/* Only show pagination if there are entries */}
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
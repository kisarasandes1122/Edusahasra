import React, { useState, useMemo } from 'react';
import { FiSearch, FiChevronDown, FiMenu, FiBell, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './SchoolVerification.css';
import SchoolVerificationReview from './SchoolVerificationReview'; // Assuming this component exists

// List of Sri Lankan Districts
const sriLankanDistricts = [
  "All Districts", "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy",
  "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara",
  "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam",
  "Ratnapura", "Trincomalee", "Vavuniya"
];

const SchoolVerification = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingSchool, setReviewingSchool] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(sriLankanDistricts[0]); // Default to "All Districts"
  const [selectedSortOrder, setSelectedSortOrder] = useState('desc'); // 'desc' for descending (newest first), 'asc' for ascending
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);


  // Sample data for the verification requests
  const [schools, setSchools] = useState([
    {
      id: 1,
      name: "Galle Central College",
      location: "Galle, Southern Province",
      district: "Galle", // Added district for filtering
      submissionDate: "2025-01-15",
      status: "pending",
      contactPerson: "Mahesh Perera",
      email: "admin@galle-central.edu",
      phone: "+94 78 123-4567"
    },
    {
      id: 2,
      name: "Kandy Girls' High School",
      location: "Kandy, Central Province",
      district: "Kandy", // Added district for filtering
      submissionDate: "2025-01-14",
      status: "pending",
      contactPerson: "Priya Sharma",
      email: "admin@kandygirls.edu",
      phone: "+94 77 234-5678"
    },
    {
      id: 3,
      name: "Colombo Royal College",
      location: "Colombo, Western Province",
      district: "Colombo", // Added district for filtering
      submissionDate: "2025-01-13",
      status: "approved",
      contactPerson: "Ashan Fernando",
      email: "admin@colomboroyal.edu",
      phone: "+94 76 345-6789"
    },
    {
      id: 4,
      name: "Jaffna Hindu College",
      location: "Jaffna, Northern Province",
      district: "Jaffna", // Added district for filtering
      submissionDate: "2025-01-12",
      status: "rejected",
      contactPerson: "Vijay Kumar",
      email: "admin@jaffnahindu.edu",
      phone: "+94 75 456-7890"
    },
    {
      id: 5,
      name: "Anuradhapura Central College",
      location: "Anuradhapura, North Central Province",
      district: "Anuradhapura", // Added district for filtering
      submissionDate: "2025-01-16",
      status: "pending",
      contactPerson: "Nimal Silva",
      email: "admin@acc.edu",
      phone: "+94 71 567-8901"
    },
  ]);

  // Filter and sort schools based on active tab, search query, location, and sort order
  const filteredAndSortedSchools = useMemo(() => {
    return schools
      .filter(school => {
        const matchesTab = activeTab === 'all' || school.status === activeTab;
        const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             school.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = selectedLocation === "All Districts" || school.district === selectedLocation;
        return matchesTab && matchesSearch && matchesLocation;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submissionDate);
        const dateB = new Date(b.submissionDate);
        if (selectedSortOrder === 'asc') {
          return dateA - dateB; // Ascending
        } else {
          return dateB - dateA; // Descending (default)
        }
      });
  }, [schools, activeTab, searchQuery, selectedLocation, selectedSortOrder]);

  // Count schools by status (based on original unfiltered list)
  const pendingCount = schools.filter(s => s.status === 'pending').length;
  const approvedCount = schools.filter(s => s.status === 'approved').length;
  const rejectedCount = schools.filter(s => s.status === 'rejected').length;

  // Handle opening review modal
  const handleReview = (school) => {
    setReviewingSchool(school);
  };

  // Handle closing review modal
  const handleCloseReview = () => {
    setReviewingSchool(null);
  };

  // Handle status change
  const handleApprove = (schoolId, notes) => {
    setSchools(schools.map(school =>
      school.id === schoolId ? {...school, status: 'approved', notes} : school
    ));
  };

  const handleReject = (schoolId, notes) => {
    setSchools(schools.map(school =>
      school.id === schoolId ? {...school, status: 'rejected', notes} : school
    ));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
  };

  const handleSortSelect = (order) => {
    setSelectedSortOrder(order);
    setIsSortDropdownOpen(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };


  return (
    <div className="sv-container">
      <div className="sv-header">
        <div className="sv-header-left">
          <h1 className="sv-title">School Verification</h1>
        </div>
        <div className="sv-header-right">
          <div className="sv-user-profile">
            <span className="sv-username">John Admin</span>
          </div>
        </div>
      </div>

      <div className="sv-content">
        <div className="sv-page-header">
          <h2 className="sv-page-title">School Verification Requests</h2>
          <p className="sv-page-subtitle">Manage and review school verification applications</p>
        </div>

        <div className="sv-filters">
          <div className="sv-search-box">
            <FiSearch className="sv-search-icon" />
            <input
              type="text"
              placeholder="Search schools..."
              className="sv-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sv-dropdowns">
             {/* Location Dropdown */}
            <div className="sv-dropdown sv-dropdown-location">
              <button
                className="sv-dropdown-button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              >
                <span>{selectedLocation}</span>
                <FiChevronDown className={isLocationDropdownOpen ? 'sv-chevron-up' : ''} />
              </button>
              {isLocationDropdownOpen && (
                <ul className="sv-dropdown-menu sv-dropdown-menu-location">
                  {sriLankanDistricts.map(district => (
                    <li
                      key={district}
                      className={`sv-dropdown-item ${selectedLocation === district ? 'sv-dropdown-item-active' : ''}`}
                      onClick={() => handleLocationSelect(district)}
                    >
                      {district}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sort By Dropdown */}
            <div className="sv-dropdown sv-dropdown-sort">
              <button
                className="sv-dropdown-button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
               >
                <span>
                  Sort By: {selectedSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </span>
                 <FiChevronDown className={isSortDropdownOpen ? 'sv-chevron-up' : ''}/>
              </button>
              {isSortDropdownOpen && (
                 <ul className="sv-dropdown-menu sv-dropdown-menu-sort">
                    <li
                      className={`sv-dropdown-item ${selectedSortOrder === 'desc' ? 'sv-dropdown-item-active' : ''}`}
                       onClick={() => handleSortSelect('desc')}
                    >
                      Submission Date (Newest First)
                    </li>
                    <li
                       className={`sv-dropdown-item ${selectedSortOrder === 'asc' ? 'sv-dropdown-item-active' : ''}`}
                       onClick={() => handleSortSelect('asc')}
                     >
                       Submission Date (Oldest First)
                    </li>
                 </ul>
              )}
            </div>
          </div>
        </div>

        <div className="sv-tabs">
          <button
            className={`sv-tab ${activeTab === 'pending' ? 'sv-tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`sv-tab ${activeTab === 'approved' ? 'sv-tab-active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`sv-tab ${activeTab === 'rejected' ? 'sv-tab-active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <div className="sv-table-container">
          <table className="sv-table">
            <thead className="sv-table-head">
              <tr>
                <th>SCHOOL</th>
                <th>LOCATION</th>
                <th>SUBMISSION DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="sv-table-body">
              {filteredAndSortedSchools.length > 0 ? (
                  filteredAndSortedSchools.map(school => (
                  <tr key={school.id} className="sv-table-row">
                    <td className="sv-school-name">{school.name}</td>
                    <td className="sv-school-location">{school.location}</td>
                    {/* Format the date for display */}
                    <td className="sv-submission-date">{formatDate(school.submissionDate)}</td>
                    <td>
                      <span className={`sv-status sv-status-${school.status}`}>
                        {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {school.status === 'pending' || school.status === 'under-review' ? (
                        <button
                          className="sv-action-button"
                          onClick={() => handleReview(school)}
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          className="sv-action-button sv-action-button-view" // Optional different style for view
                          onClick={() => handleReview(school)} // Assuming view also uses the review modal
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
               ) : (
                  <tr>
                      <td colSpan="5" className="sv-no-results">No matching school requests found.</td>
                  </tr>
               )}
            </tbody>
          </table>
          {/* --- Basic Pagination Example (Needs more logic for actual page changes) --- */}
          <div className="sv-pagination">
            <div className="sv-pagination-info">
              Showing 1 to {filteredAndSortedSchools.length} of {filteredAndSortedSchools.length} entries {/* Update this if implementing real pagination */}
            </div>
            <div className="sv-pagination-controls">
              <button className="sv-pagination-button sv-prev-button" disabled> {/* Disable if on first page */}
                <span>Previous</span>
              </button>
              {/* Example page numbers - replace with dynamic generation */}
              <button className="sv-pagination-button sv-page-number sv-page-active">1</button>
              {/* <button className="sv-pagination-button sv-page-number">2</button> */}
              {/* <button className="sv-pagination-button sv-page-number">3</button> */}
              <button className="sv-pagination-button sv-next-button" disabled> {/* Disable if on last page */}
                <span>Next</span>
              </button>
            </div>
          </div>
          {/* --- End Pagination --- */}
        </div>
      </div>

      {/* Render review modal when a school is selected */}
      {reviewingSchool && (
        <SchoolVerificationReview
          school={reviewingSchool}
          onClose={handleCloseReview}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default SchoolVerification;
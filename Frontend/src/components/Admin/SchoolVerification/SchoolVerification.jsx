import React, { useState, useMemo } from 'react';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './SchoolVerification.css';
import SchoolVerificationReview from './SchoolVerificationReview';

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
  const [selectedLocation, setSelectedLocation] = useState(sriLankanDistricts[0]);
  const [selectedSortOrder, setSelectedSortOrder] = useState('desc');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [schools, setSchools] = useState([
    { id: 5, name: "Anuradhapura Central College", location: "Anuradhapura, North Central Province", district: "Anuradhapura", submissionDate: "2025-01-16", status: "pending", contactPerson: "Nimal Silva", email: "admin@acc.edu", phone: "+94 71 567-8901" },
    { id: 1, name: "Galle Central College", location: "Galle, Southern Province", district: "Galle", submissionDate: "2025-01-15", status: "pending", contactPerson: "Mahesh Perera", email: "admin@galle-central.edu", phone: "+94 78 123-4567" },
    { id: 2, name: "Kandy Girls' High School", location: "Kandy, Central Province", district: "Kandy", submissionDate: "2025-01-14", status: "pending", contactPerson: "Priya Sharma", email: "admin@kandygirls.edu", phone: "+94 77 234-5678" },
    { id: 3, name: "Colombo Royal College", location: "Colombo, Western Province", district: "Colombo", submissionDate: "2025-01-13", status: "approved", contactPerson: "Ashan Fernando", email: "admin@colomboroyal.edu", phone: "+94 76 345-6789" },
    { id: 4, name: "Jaffna Hindu College", location: "Jaffna, Northern Province", district: "Jaffna", submissionDate: "2025-01-12", status: "rejected", contactPerson: "Vijay Kumar", email: "admin@jaffnahindu.edu", phone: "+94 75 456-7890" },
  ]);

  const filteredAndSortedSchools = useMemo(() => {
    let filtered = schools.filter(school => {
      const matchesTab = activeTab === 'all' || school.status === activeTab;
      const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           school.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === "All Districts" || school.district === selectedLocation;
      return matchesTab && matchesSearch && matchesLocation;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.submissionDate);
      const dateB = new Date(b.submissionDate);
      return selectedSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [schools, activeTab, searchQuery, selectedLocation, selectedSortOrder]);

  const pendingCount = useMemo(() => schools.filter(s => s.status === 'pending').length, [schools]);
  const approvedCount = useMemo(() => schools.filter(s => s.status === 'approved').length, [schools]);
  const rejectedCount = useMemo(() => schools.filter(s => s.status === 'rejected').length, [schools]);

  const handleReview = (school) => setReviewingSchool(school);
  const handleCloseReview = () => setReviewingSchool(null);

  const handleApprove = (schoolId, notes) => {
    setSchools(schools.map(school =>
      school.id === schoolId ? { ...school, status: 'approved', notes } : school
    ));
    handleCloseReview();
  };

  const handleReject = (schoolId, notes) => {
    setSchools(schools.map(school =>
      school.id === schoolId ? { ...school, status: 'rejected', notes } : school
    ));
    handleCloseReview();
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
  };

  const handleSortSelect = (order) => {
    setSelectedSortOrder(order);
    setIsSortDropdownOpen(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const currentPage = 1;
  const totalEntries = filteredAndSortedSchools.length;
  const entriesToShow = filteredAndSortedSchools.length;

  return (
    <div className="sv-container">
      <div className="sv-header">
        <h1>School Verification</h1>
        <div className="sv-header-user-info">John Admin</div>
      </div>

      <div className="sv-content">
        <div className="sv-content-card">
          <div className="sv-page-header">
            <div className="sv-page-title-row">
              <h2 className="sv-page-title">School Verification Requests</h2>
            </div>
            <p className="sv-page-subtitle">Manage and review school verification applications</p>
          </div>

          <div className="sv-filters">
            <div className="sv-search-box">
              <FiSearch className="sv-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search by school or location..."
                className="sv-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sv-filter-controls">
              <div className="sv-dropdown sv-dropdown-location">
                <button
                  className="sv-dropdown-button"
                  onClick={() => { setIsLocationDropdownOpen(!isLocationDropdownOpen); setIsSortDropdownOpen(false); }}
                >
                  <span>{selectedLocation}</span>
                  <FiChevronDown size={16} className={isLocationDropdownOpen ? 'sv-chevron-up' : ''} />
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

              <div className="sv-date-input">
                <input type="date" className="sv-date-picker" />
              </div>

              <div className="sv-dropdown sv-dropdown-sort">
                <button
                  className="sv-dropdown-button"
                  onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsLocationDropdownOpen(false); }}
                 >
                  <span>
                    {selectedSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </span>
                   <FiChevronDown size={16} className={isSortDropdownOpen ? 'sv-chevron-up' : ''}/>
                </button>
                {isSortDropdownOpen && (
                   <ul className="sv-dropdown-menu sv-dropdown-menu-sort">
                      <li
                        className={`sv-dropdown-item ${selectedSortOrder === 'desc' ? 'sv-dropdown-item-active' : ''}`}
                         onClick={() => handleSortSelect('desc')}
                      >
                        Newest First
                      </li>
                      <li
                         className={`sv-dropdown-item ${selectedSortOrder === 'asc' ? 'sv-dropdown-item-active' : ''}`}
                         onClick={() => handleSortSelect('asc')}
                       >
                         Oldest First
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
                      <td>
                        <div className="sv-school-name">{school.name}</div>
                      </td>
                      <td className="sv-school-location">{school.location}</td>
                      <td className="sv-submission-date">{formatDate(school.submissionDate)}</td>
                      <td>
                        <span className={`sv-status sv-status-${school.status}`}>
                          {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sv-action-button sv-action-button-view"
                          onClick={() => handleReview(school)}
                        >
                          {school.status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))
                 ) : (
                    <tr>
                      <td colSpan="5" className="sv-no-results">
                        No matching school requests found.
                      </td>
                    </tr>
                 )}
              </tbody>
            </table>
          </div>

          {totalEntries > 0 && (
              <div className="sv-pagination">
                <div className="sv-pagination-info">
                  Showing 1 to {entriesToShow} of {totalEntries} entries
                </div>
                <div className="sv-pagination-controls">
                  <button
                    className="sv-pagination-button sv-prev-button"
                    disabled={currentPage === 1}
                  >
                     <FiChevronLeft size={16} />
                  </button>
                  <button className="sv-pagination-button sv-page-number sv-page-active">1</button>
                  {totalEntries > 5 && (
                    <button className="sv-pagination-button sv-page-number">2</button>
                  )}
                  <button
                    className="sv-pagination-button sv-next-button"
                    disabled={totalEntries <= 5}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>

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
import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './SchoolVerification.css';
import SchoolVerificationReview from './SchoolVerificationReview';
import api from '../../../api';

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

  const [allSchools, setAllSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        district: selectedLocation === 'All Districts' ? undefined : selectedLocation,
        sortBy: selectedSortOrder === 'desc' ? 'dateDesc' : 'dateAsc',
      };

      const { data } = await api.get('/api/admin/schools', { params });
      setAllSchools(data.schools);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError('Failed to fetch schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchSchools();
  }, [activeTab, searchQuery, selectedLocation, selectedSortOrder]);

  const filteredAndSortedSchools = useMemo(() => {
    const filteredByStatus = allSchools.filter(school => {
      if (activeTab === 'all') return true;
      return school.status === activeTab;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSchools = filteredByStatus.slice(indexOfFirstItem, indexOfLastItem);

    return currentSchools;
  }, [allSchools, activeTab, currentPage, itemsPerPage]);

  const pendingCount = useMemo(() => allSchools.filter(s => s.status === 'pending').length, [allSchools]);
  const approvedCount = useMemo(() => allSchools.filter(s => s.status === 'approved').length, [allSchools]);
  const rejectedCount = useMemo(() => allSchools.filter(s => s.status === 'rejected').length, [allSchools]);
  
  const statusFilteredSchools = useMemo(() => {
    if (activeTab === 'all') return allSchools;
    return allSchools.filter(school => school.status === activeTab);
  }, [allSchools, activeTab]);
  
  const totalRequests = statusFilteredSchools.length;
  const totalPages = Math.ceil(totalRequests / itemsPerPage);

  const handleReview = (school) => {
    setReviewingSchool(school);
  };
  const handleCloseReview = () => setReviewingSchool(null);

  const handleStatusUpdateSuccess = () => {
      handleCloseReview();
      fetchSchools();
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
  };

  const handleSortSelect = (order) => {
    setSelectedSortOrder(order);
    setIsSortDropdownOpen(false);
  };

   const handlePageChange = (pageNumber) => {
       if (pageNumber >= 1 && pageNumber <= totalPages) {
           setCurrentPage(pageNumber);
       }
   };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
  };

  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (isLocationDropdownOpen && !event.target.closest('.sv-dropdown-location')) {
              setIsLocationDropdownOpen(false);
          }
          if (isSortDropdownOpen && !event.target.closest('.sv-dropdown-sort')) {
              setIsSortDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isLocationDropdownOpen, isSortDropdownOpen]);

  return (
    <div className="sv-container">
      <div className="sv-header">
        <h1>School Verification</h1>
        <div className="sv-header-user-info">Admin User</div>
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

              <div className="sv-date-input" style={{ display: 'none' }}>
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
                        Newest First (Submission Date)
                      </li>
                      <li
                         className={`sv-dropdown-item ${selectedSortOrder === 'asc' ? 'sv-dropdown-item-active' : ''}`}
                         onClick={() => handleSortSelect('asc')}
                       >
                         Oldest First (Submission Date)
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
              {loading ? (
                  <div className="sv-no-results">Loading schools...</div>
              ) : error ? (
                  <div className="sv-no-results" style={{ color: 'red' }}>{error}</div>
              ) : (
                  <table className="sv-table">
                    <thead className="sv-table-head">
                      <tr>
                        <th>SCHOOL NAME</th>
                        <th>LOCATION</th>
                        <th>SUBMISSION DATE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="sv-table-body">
                      {filteredAndSortedSchools.length > 0 ? (
                          filteredAndSortedSchools.map(school => (
                          <tr key={school._id} className="sv-table-row">
                            <td>
                              <div className="sv-school-name">{school.schoolName}</div>
                            </td>
                            <td className="sv-school-location">{`${school.city}, ${school.province}`}</td>
                            <td className="sv-submission-date">{formatDate(school.registeredAt)}</td>
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
                                {school.status === 'pending' ? 'Review' : 'View Details'}
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
              )}
          </div>

          {totalRequests > 0 && (
              <div className="sv-pagination">
                <div className="sv-pagination-info">
                   Showing {Math.min(filteredAndSortedSchools.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(currentPage * itemsPerPage, totalRequests)} of {totalRequests} entries
                </div>
                <div className="sv-pagination-controls">
                  <button
                    className="sv-pagination-button sv-prev-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                     <FiChevronLeft size={16} />
                  </button>
                   {[...Array(totalPages).keys()].map(page => (
                       <button
                           key={page + 1}
                           className={`sv-pagination-button sv-page-number ${currentPage === page + 1 ? 'sv-page-active' : ''}`}
                           onClick={() => handlePageChange(page + 1)}
                       >
                           {page + 1}
                       </button>
                   ))}
                  <button
                    className="sv-pagination-button sv-next-button"
                     onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
          onStatusUpdateSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default SchoolVerification;
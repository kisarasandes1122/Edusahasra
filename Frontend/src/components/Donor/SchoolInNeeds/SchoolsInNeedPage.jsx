import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import { FaSchool, FaMapMarkerAlt, FaUsers, FaListUl, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../../../api'; // <-- Import axios instance
import './SchoolsInNeedPage.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner'; // Assuming you have a spinner component

const SchoolsInNeedPage = () => {
  const navigate = useNavigate(); // <-- Get navigate function

  // --- State for Filters ---
  const [location, setLocation] = useState('');
  const [itemCategories, setItemCategories] = useState({
    books: false,
    stationery: false,
    uniform: false,
    equipment: false,
    sportsGear: false,
    other: false,
  });
  const [sortBy, setSortBy] = useState('highest'); // 'highest' or 'lowest' progress

  // --- State for Data and Pagination ---
  const [donationRequests, setDonationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestsPerPage] = useState(6); // Keep this consistent with backend limit if possible

  // --- Fetch Data Effect ---
  useEffect(() => {
    const fetchDonationRequests = async () => {
      setLoading(true);
      setError(null);

      // Prepare query parameters
      const activeCategories = Object.entries(itemCategories)
        .filter(([_, isChecked]) => isChecked)
        .map(([category]) => category)
        .join(','); // Join active categories into a comma-separated string

      const params = {
        page: currentPage,
        limit: requestsPerPage,
        sortBy: sortBy,
        ...(location && { location: location }), // Add location if selected
        ...(activeCategories && { categories: activeCategories }), // Add categories if selected
      };

      try {
        console.log('Fetching donation requests with params:', params); // Debug log
        const response = await api.get('/api/requests', { params });
        console.log('API Response:', response.data); // Debug log

        setDonationRequests(response.data.requests || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalRequests(response.data.totalRequests || 0);

      } catch (err) {
        console.error("Error fetching donation requests:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch donation requests.');
        setDonationRequests([]); // Clear data on error
        setTotalPages(1);
        setTotalRequests(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDonationRequests();
  }, [location, itemCategories, sortBy, currentPage, requestsPerPage]); // Re-fetch when filters or page change

  // --- Filter Handlers ---
  const handleCategoryChange = (category) => {
    setItemCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    setCurrentPage(1); // Reset to first page
  }

  const handleSortChange = (e) => {
      setSortBy(e.target.value);
      setCurrentPage(1); // Reset to first page
  }

  const resetFilters = () => {
    setLocation('');
    setItemCategories({
      books: false,
      stationery: false,
      uniform: false,
      equipment: false,
      sportsGear: false,
      other: false,
    });
    setSortBy('highest');
    setCurrentPage(1);
  };

  // --- Pagination Handlers ---
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate display range for summary
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;


  // --- Helper to format location ---
  const formatLocation = (school) => {
      const parts = [school.city, school.district, school.province].filter(Boolean); // Filter out null/empty values
      return parts.join(', ');
  }

  // --- Render Logic ---
  return (
    <div className="sin-container">
      <header className="sin-header">
        <h1 className="sin-title">Find Schools in Need</h1>
        <p className="sin-subtitle">
          Connect with schools across Sri Lanka and help them acquire essential educational
          resource they need most through active donation requests.
        </p>
      </header>

      <div className="sin-content">
        <aside className="sin-sidebar">
          {/* --- Filters --- */}
          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Location</h2>
            {/* Improve Location Filter - maybe use distinct locations from data? For now, manual */}
            <select
              className="sin-select"
              value={location}
              onChange={handleLocationChange} // Use specific handler
            >
              <option value="">All Locations</option>
              {/* Add more locations as needed or fetch dynamically */}
              <option value="Galle">Galle</option>
              <option value="Kandy">Kandy</option>
              <option value="Jaffna">Jaffna</option>
              <option value="Matara">Matara</option>
              <option value="Matale">Matale</option>
              <option value="Anuradhapura">Anuradhapura</option>
              <option value="Badulla">Badulla</option>
              <option value="Trincomalee">Trincomalee</option>
              <option value="Negombo">Negombo</option>
              <option value="Ratnapura">Ratnapura</option>
              <option value="Kurunegala">Kurunegala</option>
            </select>
          </div>

          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Item Category</h2>
            <div className="sin-checkbox-group">
              {/* Checkbox labels remain the same */}
              <label className="sin-checkbox-label">
                <input type="checkbox" checked={itemCategories.books} onChange={() => handleCategoryChange('books')} className="sin-checkbox"/> Books
              </label>
              <label className="sin-checkbox-label">
                <input type="checkbox" checked={itemCategories.stationery} onChange={() => handleCategoryChange('stationery')} className="sin-checkbox"/> Stationery
              </label>
              <label className="sin-checkbox-label">
                 <input type="checkbox" checked={itemCategories.uniform} onChange={() => handleCategoryChange('uniform')} className="sin-checkbox" /> Uniform/ Clothes
              </label>
              <label className="sin-checkbox-label">
                 <input type="checkbox" checked={itemCategories.equipment} onChange={() => handleCategoryChange('equipment')} className="sin-checkbox" /> Equipment
              </label>
               <label className="sin-checkbox-label">
                 <input type="checkbox" checked={itemCategories.sportsGear} onChange={() => handleCategoryChange('sportsGear')} className="sin-checkbox" /> Sports Gear
              </label>
               <label className="sin-checkbox-label">
                 <input type="checkbox" checked={itemCategories.other} onChange={() => handleCategoryChange('other')} className="sin-checkbox" /> Other
               </label>
            </div>
          </div>

          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Sort By Progress</h2>
            <select
              className="sin-select"
              value={sortBy}
              onChange={handleSortChange} // Use specific handler
            >
              <option value="highest">Highest Progress First</option>
              <option value="lowest">Lowest Progress First</option>
            </select>
          </div>

          <button className="sin-reset-button" onClick={resetFilters}>
            Reset Filters
          </button>
        </aside>

        <main className="sin-main-content">
          {loading ? (
             <LoadingSpinner /> // Display loading spinner
          ) : error ? (
            <div className="sin-error-message">Error: {error}</div> // Display error
          ) : donationRequests.length > 0 ? (
            <div className="sin-school-grid">
              {donationRequests.map((request) => (
                <div className="sin-school-card" key={request._id}> {/* Use request._id */}
                  <div className="sin-school-header">
                    <FaSchool className="sin-school-icon" />
                     {/* Display school name from populated data */}
                    <h3 className="sin-school-name">{request.schoolInfo?.schoolName || 'School Name Unavailable'}</h3>
                  </div>

                  <div className="sin-school-location">
                    <FaMapMarkerAlt className="sin-location-icon" />
                    {/* Display formatted location */}
                    <span className="sin-location-text">{formatLocation(request.schoolInfo)}</span>
                  </div>

                  {/* Removed student count as it's not in the base request/school model */}
                  {/* <div className="sin-school-students">
                    <FaUsers className="sin-students-icon" />
                    <span className="sin-students-text">{request.schoolInfo?.studentCount || 'N/A'} Students potentially benefit</span>
                  </div> */}

                  <div className="sin-school-needs">
                    <FaListUl className="sin-needs-icon" />
                    <div className="sin-needs-container">
                      <span className="sin-needs-label">Needs Summary:</span>
                       {/* Display summarized requested items */}
                      <span className="sin-needs-text">
                        {request.requestedItems
                            .map(item => `${item.quantity} ${item.categoryNameEnglish}`)
                            .slice(0, 3) // Show first 3 items for brevity
                            .join(', ')}
                        {request.requestedItems.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="sin-progress-section">
                    <div className="sin-progress-text">
                      <span>Progress</span>
                      {/* Display calculated progress */}
                      <span>{Math.round(request.progress || 0)}% Done</span>
                    </div>
                    <div className="sin-progress-bar">
                      <div
                        className="sin-progress-fill"
                        style={{ width: `${request.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Update Button Navigation */}
                  <button
                    className="sin-donate-button"
                    onClick={() => navigate(`/requests/${request._id}`)} // Navigate to request detail page
                  >
                    View Details & Donate
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="sin-no-results">
              <p>No donation requests match your current filters.</p>
            </div>
          )}

          {/* Pagination - Use totalPages from state */}
          {totalRequests > 0 && !loading && (
            <div className="sin-pagination">
              <button
                className="sin-pagination-button"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>

              <div className="sin-pagination-numbers">
                 {/* Generate page numbers based on totalPages */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`sin-page-number ${currentPage === i + 1 ? 'sin-active-page' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="sin-pagination-button"
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          )}

          {/* Results summary - Use totalRequests from state */}
          {!loading && (
             <div className="sin-results-summary">
                {totalRequests > 0
                  ? `Showing ${indexOfFirstRequest + 1}-${Math.min(indexOfLastRequest, totalRequests)} of ${totalRequests} requests`
                  : 'No requests found'
                }
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SchoolsInNeedPage;
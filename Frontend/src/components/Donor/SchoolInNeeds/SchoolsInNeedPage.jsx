import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSchool, FaMapMarkerAlt, FaUsers, FaListUl, FaChevronLeft, FaChevronRight, 
  FaFilter, FaMapMarkedAlt, FaTags, FaSort, FaTimes, FaSyncAlt, FaEye, 
  FaChevronDown, FaSearch, FaGift, FaTimesCircle
} from 'react-icons/fa';
import api from '../../../api';
import './SchoolsInNeedPage.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';

const SchoolsInNeedPage = () => {
  const navigate = useNavigate();

  // --- State for Filters ---
  const [location, setLocation] = useState('');
  const [itemCategories, setItemCategories] = useState({
    stationery: false,      // Pens, pencils, notebooks, erasers, etc.
    textbooks: false,       // Textbooks and educational books
    readingMaterials: false, // Library books, story books
    artSupplies: false,     // Art paper, color boxes, posters
    mathTools: false,       // Geometry sets, rulers, calculators
    techEquipment: false,   // Computers, tablets, projectors
    sportsEquipment: false, // Sports gear and equipment
    teachingAids: false,    // Educational games, teacher guides, maps
  });
  const [sortBy, setSortBy] = useState('highest'); // 'highest' or 'lowest' progress

  // --- State for UI Interactions ---
  const [expandedFilters, setExpandedFilters] = useState({
    location: true,
    category: true,
    sort: true
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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
      stationery: false,
      textbooks: false,
      readingMaterials: false,
      artSupplies: false,
      mathTools: false,
      techEquipment: false,
      sportsEquipment: false,
      teachingAids: false,
    });
    setSortBy('highest');
    setCurrentPage(1);
  };

  // Toggle filter sections
  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
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

  // Helper to get active filter count
  const getActiveFilterCount = () => {
    const categoryCount = Object.values(itemCategories).filter(Boolean).length;
    return (location ? 1 : 0) + categoryCount;
  };

  // Helper to get category label and tag class
  const getCategoryInfo = (category) => {
    const categoryMap = {
      stationery: { label: 'Stationery', tagClass: 'tag-stationery' },
      textbooks: { label: 'Textbooks', tagClass: 'tag-textbooks' },
      readingMaterials: { label: 'Reading Materials', tagClass: 'tag-reading' },
      artSupplies: { label: 'Art Supplies', tagClass: 'tag-art' },
      mathTools: { label: 'Math Tools', tagClass: 'tag-math' },
      techEquipment: { label: 'Technology Equipment', tagClass: 'tag-tech' },
      sportsEquipment: { label: 'Sports Equipment', tagClass: 'tag-sports' },
      teachingAids: { label: 'Teaching Aids', tagClass: 'tag-teaching' },
    };
    
    return categoryMap[category] || { label: category, tagClass: '' };
  };

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
        {/* Enhanced Sidebar with Collapsible Sections */}
        <aside className="sin-sidebar">
          <div className="sin-sidebar-header">
            <h2 className="sin-sidebar-title">
              <FaFilter className="sin-sidebar-icon" />
              Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </h2>
            <button className="sin-mobile-toggle" onClick={toggleSidebar}>
              <FaChevronDown 
                className={`sin-filter-chevron ${sidebarExpanded ? 'expanded' : ''}`} 
              />
            </button>
          </div>

          <div className={`sin-filter-container ${sidebarExpanded ? 'expanded' : ''}`}>
            {/* Display Active Filters as Pills */}
            {getActiveFilterCount() > 0 && (
              <div className="sin-active-filters">
                {location && (
                  <div className="sin-filter-pill sin-pill-location">
                    <span>{location}</span>
                    <button 
                      className="sin-pill-remove" 
                      onClick={() => setLocation('')}
                      aria-label="Remove location filter"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {Object.entries(itemCategories)
                  .filter(([_, isChecked]) => isChecked)
                  .map(([category]) => {
                    const { label } = getCategoryInfo(category);
                    return (
                      <div className="sin-filter-pill sin-pill-category" key={category}>
                        <span>{label}</span>
                        <button 
                          className="sin-pill-remove" 
                          onClick={() => handleCategoryChange(category)}
                          aria-label={`Remove ${label} filter`}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* Location Filter */}
            <div className="sin-filter-section">
              <div 
                className="sin-filter-header" 
                onClick={() => toggleFilterSection('location')}
              >
                <h2 className="sin-filter-title">
                  <FaMapMarkedAlt className="sin-filter-icon" />
                  Location
                </h2>
                <FaChevronDown 
                  className={`sin-filter-chevron ${expandedFilters.location ? 'expanded' : ''}`} 
                />
              </div>
              
              <div className={`sin-filter-content ${expandedFilters.location ? 'expanded' : ''}`}>
                <div className="sin-select-container">
                  <select
                    className="sin-select"
                    value={location}
                    onChange={handleLocationChange}
                  >
                    <option value="">All Locations</option>
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
                  <FaChevronDown className="sin-select-icon" />
                </div>
              </div>
            </div>

            {/* Item Category Filter */}
            <div className="sin-filter-section">
              <div 
                className="sin-filter-header" 
                onClick={() => toggleFilterSection('category')}
              >
                <h2 className="sin-filter-title">
                  <FaTags className="sin-filter-icon" />
                  Item Category
                </h2>
                <FaChevronDown 
                  className={`sin-filter-chevron ${expandedFilters.category ? 'expanded' : ''}`} 
                />
              </div>
              
              <div className={`sin-filter-content ${expandedFilters.category ? 'expanded' : ''}`}>
                <div className="sin-checkbox-group">
                  {/* Enhanced checkbox styling with color tags */}
                  {Object.entries(itemCategories).map(([category, isChecked]) => {
                    const { label, tagClass } = getCategoryInfo(category);
                    return (
                      <label className="sin-checkbox-label" key={category}>
                        <div className="sin-checkbox-container">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCategoryChange(category)}
                            className="sin-checkbox"
                          />
                          <span className="sin-checkbox-custom"></span>
                        </div>
                        <span className={`sin-category-tag ${tagClass}`}></span>
                        <span className="sin-checkbox-text">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sort By Filter */}
            <div className="sin-filter-section">
              <div 
                className="sin-filter-header" 
                onClick={() => toggleFilterSection('sort')}
              >
                <h2 className="sin-filter-title">
                  <FaSort className="sin-filter-icon" />
                  Sort By Progress
                </h2>
                <FaChevronDown 
                  className={`sin-filter-chevron ${expandedFilters.sort ? 'expanded' : ''}`} 
                />
              </div>
              
              <div className={`sin-filter-content ${expandedFilters.sort ? 'expanded' : ''}`}>
                <div className="sin-select-container">
                  <select
                    className="sin-select"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="highest">Highest Progress First</option>
                    <option value="lowest">Lowest Progress First</option>
                  </select>
                  <FaChevronDown className="sin-select-icon" />
                </div>
              </div>
            </div>

            {/* Reset Button with Icon */}
            <button className="sin-reset-button" onClick={resetFilters}>
              <FaSyncAlt className="sin-reset-icon" />
              Reset All Filters
            </button>
          </div>
        </aside>

        <main className="sin-main-content">
          {loading ? (
            <div className="sin-loading-spinner">
              <div className="sin-spinner"></div>
            </div>
          ) : error ? (
            <div className="sin-no-results">
              <FaTimesCircle className="sin-no-results-icon" />
              <p>Error: {error}</p>
            </div>
          ) : donationRequests.length > 0 ? (
            <div className="sin-school-grid sin-fade-in">
              {donationRequests.map((request) => (
                <div className="sin-school-card" key={request._id}>
                  <div className="sin-school-header">
                    <FaSchool className="sin-school-icon" />
                    <h3 className="sin-school-name">{request.schoolInfo?.schoolName || 'School Name Unavailable'}</h3>
                  </div>

                  <div className="sin-school-body">
                    <div className="sin-school-location">
                      <FaMapMarkerAlt className="sin-location-icon" />
                      <span className="sin-location-text">{formatLocation(request.schoolInfo)}</span>
                    </div>

                    <div className="sin-school-needs">
                      <FaListUl className="sin-needs-icon" />
                      <div className="sin-needs-container">
                        <span className="sin-needs-label">Needs Summary:</span>
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
                        <span className="sin-progress-percentage">{Math.round(request.progress || 0)}% Done</span>
                      </div>
                      <div className="sin-progress-bar">
                        <div
                          className="sin-progress-fill"
                          style={{ width: `${request.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      className="sin-donate-button"
                      onClick={() => navigate(`/requests/${request._id}`)}
                    >
                      <FaEye className="sin-button-icon" />
                      View Details & Donate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sin-no-results">
              <FaSearch className="sin-no-results-icon" />
              <p>No donation requests match your current filters.</p>
              <button className="sin-reset-button" onClick={resetFilters}>
                <FaSyncAlt className="sin-reset-icon" />
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
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

          {/* Results summary */}
          {!loading && totalRequests > 0 && (
            <div className="sin-results-summary">
              Showing {indexOfFirstRequest + 1}-{Math.min(indexOfLastRequest, totalRequests)} of {totalRequests} requests
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SchoolsInNeedPage;
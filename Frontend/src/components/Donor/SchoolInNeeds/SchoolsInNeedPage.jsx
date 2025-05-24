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

  const availableItemCategories = [
       { id: 1,  nameSinhala: 'සටහන් පොත්',           nameEnglish: 'Notebooks' },
       { id: 2,  nameSinhala: 'පෑන්/පැන්සල්',         nameEnglish: 'Pens/Pencils' },
       { id: 3,  nameSinhala: 'පාට පෙට්ටි',           nameEnglish: 'Color Boxes (Crayons)' },
       { id: 4,  nameSinhala: 'අභ්‍යාස පොත්',         nameEnglish: 'Exercise Books' },
       { id: 5,  nameSinhala: 'මකනය',               nameEnglish: 'Erasers' },
       { id: 6,  nameSinhala: 'කඩාකරු',             nameEnglish: 'Pencil Sharpeners' },
       { id: 7,  nameSinhala: 'කතුර',               nameEnglish: 'Scissors' },
       { id: 8,  nameSinhala: 'ගලුව',               nameEnglish: 'Glue Sticks' },
       { id: 9,  nameSinhala: 'රූලර්',                nameEnglish: 'Rulers' },
       { id: 10, nameSinhala: 'ජ්‍යෝමැට්‍රි කට්ටලය',  nameEnglish: 'Geometry Sets' },
       { id: 11, nameSinhala: 'ප්‍රොට්රැක්ටරය',       nameEnglish: 'Protractors' },
       { id: 12, nameSinhala: 'සම්බියා (කොම්පස්)',    nameEnglish: 'Compasses' },
       { id: 13, nameSinhala: 'ගණිත උපකරණ',       nameEnglish: 'Counting Cubes/Abacus' },
       { id: 14, nameSinhala: 'චෝක්',                nameEnglish: 'Chalk' },
       { id: 15, nameSinhala: 'චෝක් බ්‍රෂ්',         nameEnglish: 'Chalkboard Brush' },
       { id: 16, nameSinhala: 'සුදුපුවරු',           nameEnglish: 'Whiteboard' },
       { id: 17, nameSinhala: 'සුදුපුවරු ලේඛක',     nameEnglish: 'Whiteboard Markers' },
       { id: 18, nameSinhala: 'පෝස්ටර්',             nameEnglish: 'Posters' },
       { id: 19, nameSinhala: 'සිතියම්',             nameEnglish: 'Maps' },
       { id: 20, nameSinhala: 'බ්‍රිස්ටල් කඩදාසි',   nameEnglish: 'Art Paper (Bristol Paper)' },
       { id: 21, nameSinhala: 'කථා පොත්',           nameEnglish: 'Story Books' },
       { id: 22, nameSinhala: 'පාඨ පොත්',           nameEnglish: 'Textbooks' },
       { id: 23, nameSinhala: 'පුස්තකාල පොත්',     nameEnglish: 'Library Books' },
       { id: 24, nameSinhala: 'අධ්‍යාපනමය ක්‍රීඩා', nameEnglish: 'Educational Games/Puzzles' },
       { id: 25, nameSinhala: 'උගත්කරු මාර්ගෝපදේශ', nameEnglish: 'Teacher’s Guides/Manuals' },
       { id: 26, nameSinhala: 'පරිගණක/ටැබ්ලට්',    nameEnglish: 'Computers/Tablets' },
       { id: 27, nameSinhala: 'ප්‍රින්ටර්',          nameEnglish: 'Printers' },
       { id: 28, nameSinhala: 'ප්‍රොජෙක්ටර්',       nameEnglish: 'Projectors' },
       { id: 29, nameSinhala: 'රවුටර්/අන්තර්ජාල උපාංග', nameEnglish: 'Routers/Internet Devices' },
       { id: 30, nameSinhala: 'සූර්ය ආලෝක යන්ත්‍ර',  nameEnglish: 'Solar Study Lamps' }
   ];

   const filterCategoryMapping = {
       stationery: { label: 'Stationery & Basic Supplies', itemIds: [1, 2, 4, 5, 6, 7, 8, 9], tagClass: 'tag-stationery' },
       books: { label: 'Books & Reading Materials', itemIds: [21, 22, 23], tagClass: 'tag-reading' },
       art: { label: 'Art & Craft Supplies', itemIds: [3, 20], tagClass: 'tag-art' },
       tech: { label: 'Technology & Equipment', itemIds: [26, 27, 28, 29, 30], tagClass: 'tag-tech' },
       classroom: { label: 'Classroom & Teaching Aids', itemIds: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 24, 25], tagClass: 'tag-teaching' },
   };


  const [location, setLocation] = useState('');
  const [selectedFilterCategories, setSelectedFilterCategories] = useState({
    stationery: false,
    books: false,
    art: false,
    tech: false,
    classroom: false,
  });
  const [sortBy, setSortBy] = useState('highest');

  const [expandedFilters, setExpandedFilters] = useState({
    location: true,
    category: true,
    sort: true
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [donationRequests, setDonationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestsPerPage] = useState(6);

  useEffect(() => {
    const fetchDonationRequests = async () => {
      setLoading(true);
      setError(null);

      const activeFilterCategories = Object.entries(selectedFilterCategories)
        .filter(([_, isChecked]) => isChecked)
        .map(([categoryKey]) => categoryKey);

      const itemCategoryIdsToFilter = activeFilterCategories.flatMap(
        categoryKey => filterCategoryMapping[categoryKey].itemIds
      );

      const params = {
        page: currentPage,
        limit: requestsPerPage,
        sortBy: sortBy,
        ...(location && { location: location }),
        ...(itemCategoryIdsToFilter.length > 0 && { categoryIds: itemCategoryIdsToFilter.join(',') }),
      };

      try {
        console.log('Fetching donation requests with params:', params);
        const response = await api.get('/api/requests', { params });
        console.log('API Response:', response.data);

        setDonationRequests(response.data.requests || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalRequests(response.data.totalRequests || 0);

      } catch (err) {
        console.error("Error fetching donation requests:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch donation requests.');
        setDonationRequests([]);
        setTotalPages(1);
        setTotalRequests(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDonationRequests();
  }, [location, selectedFilterCategories, sortBy, currentPage, requestsPerPage]);

  const handleFilterCategoryChange = (categoryKey) => {
    setSelectedFilterCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
    setCurrentPage(1);
  };


  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    setCurrentPage(1);
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  }

  const resetFilters = () => {
    setLocation('');
    setSelectedFilterCategories({
      stationery: false,
      books: false,
      art: false,
      tech: false,
      classroom: false,
    });
    setSortBy('highest');
    setCurrentPage(1);
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

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

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;

  const formatLocation = (school) => {
    const parts = [school.city, school.district, school.province].filter(Boolean);
    return parts.join(', ');
  }

  const getActiveFilterCount = () => {
    const categoryCount = Object.values(selectedFilterCategories).filter(Boolean).length;
    return (location ? 1 : 0) + categoryCount;
  };

  const getFilterCategoryInfo = (categoryKey) => {
       return filterCategoryMapping[categoryKey];
  };

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

                {Object.entries(selectedFilterCategories)
                  .filter(([_, isChecked]) => isChecked)
                  .map(([categoryKey]) => {
                    const { label, tagClass } = getFilterCategoryInfo(categoryKey);
                    return (
                      <div className={`sin-filter-pill sin-pill-category ${tagClass}`} key={categoryKey}>
                        <span>{label}</span>
                        <button
                          className="sin-pill-remove"
                          onClick={() => handleFilterCategoryChange(categoryKey)}
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
                  {Object.entries(filterCategoryMapping).map(([categoryKey, { label, tagClass }]) => (
                      <label className="sin-checkbox-label" key={categoryKey}>
                        <div className="sin-checkbox-container">
                          <input
                            type="checkbox"
                            checked={selectedFilterCategories[categoryKey]}
                            onChange={() => handleFilterCategoryChange(categoryKey)}
                            className="sin-checkbox"
                          />
                          <span className="sin-checkbox-custom"></span>
                        </div>
                        <span className={`sin-category-tag ${tagClass}`}></span>
                        <span className="sin-checkbox-text">{label}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

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
                            .slice(0, 3)
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
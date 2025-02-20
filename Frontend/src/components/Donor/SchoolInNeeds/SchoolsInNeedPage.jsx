import React, { useState, useEffect } from 'react';
import { FaSchool, FaMapMarkerAlt, FaUsers, FaListUl } from 'react-icons/fa';
import './SchoolsInNeedPage.css';

const SchoolsInNeedPage = () => {
  // Mock school data with diverse locations  
const allSchools = [
  {
    id: 1,
    name: "Galle Central College",
    location: "Galle, Southern Province",
    students: 200,
    needs: ["Textbooks", "Pens", "Pencils", "Bags"],
    progress: 35
  },
  {
    id: 2,
    name: "Kandy Girls' High School",
    location: "Kandy, Central Province",
    students: 175,
    needs: ["Books", "Stationery", "Equipment"],
    progress: 60
  },
  {
    id: 3,
    name: "Jaffna Hindu College",
    location: "Jaffna, Northern Province",
    students: 220,
    needs: ["Books", "Uniform", "Sports Gear"],
    progress: 25
  },
  {
    id: 4,
    name: "Matara Rahula College",
    location: "Matara, Southern Province",
    students: 190,
    needs: ["Textbooks", "Equipment", "Other"],
    progress: 40
  },
  {
    id: 5,
    name: "Matale Girls' School",
    location: "Matale, Central Province",
    students: 165,
    needs: ["Books", "Stationery", "Uniform"],
    progress: 55
  },
  {
    id: 6,
    name: "Richmond College",
    location: "Galle, Southern Province",
    students: 210,
    needs: ["Books", "Sports Gear", "Equipment"],
    progress: 30
  },
  {
    id: 7,
    name: "Anuradhapura Central College",
    location: "Anuradhapura, North Central Province",
    students: 180,
    needs: ["Books", "Uniforms", "Sports Equipment"],
    progress: 45
  },
  {
    id: 8,
    name: "Badulla Mahinda College",
    location: "Badulla, Uva Province",
    students: 160,
    needs: ["Books", "Stationery", "Library Resources"],
    progress: 50
  },
  {
    id: 9,
    name: "Trincomalee Hindu College",
    location: "Trincomalee, Eastern Province",
    students: 230,
    needs: ["Books", "Computers", "Uniforms"],
    progress: 20
  },
  {
    id: 10,
    name: "Negombo St. Mary's College",
    location: "Negombo, Western Province",
    students: 195,
    needs: ["Textbooks", "Sports Gear", "Other"],
    progress: 38
  },
  {
    id: 11,
    name: "Ratnapura Royal College",
    location: "Ratnapura, Sabaragamuwa Province",
    students: 175,
    needs: ["Books", "Pencils", "Bags"],
    progress: 52
  },
  {
    id: 12,
    name: "Kurunegala Maliyadeva College",
    location: "Kurunegala, North Western Province",
    students: 215,
    needs: ["Stationery", "Computers", "Library Books"],
    progress: 33
  }
];


  const [location, setLocation] = useState('');
  const [itemCategories, setItemCategories] = useState({
    books: false,
    stationery: false,
    uniform: false,
    equipment: false,
    sportsGear: false,
    other: false
  });
  const [sortBy, setSortBy] = useState('highest');
  const [filteredSchools, setFilteredSchools] = useState(allSchools);

  // Effect to filter schools based on selected filters
  useEffect(() => {
    let result = [...allSchools];
    
    // Filter by location
    if (location) {
      const locationFilter = location.toLowerCase();
      result = result.filter(school => 
        school.location.toLowerCase().includes(locationFilter)
      );
    }
    
    // Filter by item categories
    const activeCategories = Object.entries(itemCategories)
      .filter(([_, isChecked]) => isChecked)
      .map(([category]) => category);
    
    if (activeCategories.length > 0) {
      result = result.filter(school => {
        return school.needs.some(need => {
          const needLower = need.toLowerCase();
          if (itemCategories.books && (needLower.includes('book') || needLower.includes('textbook'))) return true;
          if (itemCategories.stationery && (needLower.includes('stationery') || needLower.includes('pen') || needLower.includes('pencil'))) return true;
          if (itemCategories.uniform && needLower.includes('uniform')) return true;
          if (itemCategories.equipment && needLower.includes('equipment')) return true;
          if (itemCategories.sportsGear && (needLower.includes('sports') || needLower.includes('gear'))) return true;
          if (itemCategories.other && needLower.includes('other')) return true;
          return false;
        });
      });
    }
    
    // Sort by progress
    if (sortBy === 'highest') {
      result.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.progress - b.progress);
    }
    
    setFilteredSchools(result);
  }, [location, itemCategories, sortBy]);

  const handleCategoryChange = (category) => {
    setItemCategories({
      ...itemCategories,
      [category]: !itemCategories[category]
    });
  };

  const resetFilters = () => {
    setLocation('');
    setItemCategories({
      books: false,
      stationery: false,
      uniform: false,
      equipment: false,
      sportsGear: false,
      other: false
    });
    setSortBy('highest');
  };

  return (
    <div className="sin-container">
      <header className="sin-header">
        <h1 className="sin-title">Find Schools in Need</h1>
        <p className="sin-subtitle">
          Connect with schools across Sri Lanka and help them acquire essential educational 
          resource they need most
        </p>
      </header>

      <div className="sin-content">
        <aside className="sin-sidebar">
          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Location</h2>
            <select 
              className="sin-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="galle">Galle</option>
              <option value="kandy">Kandy</option>
              <option value="jaffna">Jaffna</option>
              <option value="matara">Matara</option>
              <option value="matale">Matale</option>
            </select>
          </div>

          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Item Category</h2>
            <div className="sin-checkbox-group">
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.books}
                  onChange={() => handleCategoryChange('books')}
                  className="sin-checkbox"
                />
                Books
              </label>
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.stationery}
                  onChange={() => handleCategoryChange('stationery')}
                  className="sin-checkbox"
                />
                Stationery
              </label>
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.uniform}
                  onChange={() => handleCategoryChange('uniform')}
                  className="sin-checkbox" 
                />
                Uniform/ Clothes
              </label>
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.equipment}
                  onChange={() => handleCategoryChange('equipment')}
                  className="sin-checkbox"
                />
                Equipment
              </label>
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.sportsGear}
                  onChange={() => handleCategoryChange('sportsGear')}
                  className="sin-checkbox"
                />
                Sports Gear
              </label>
              <label className="sin-checkbox-label">
                <input 
                  type="checkbox"
                  checked={itemCategories.other}
                  onChange={() => handleCategoryChange('other')}
                  className="sin-checkbox"
                />
                Other
              </label>
            </div>
          </div>

          <div className="sin-filter-section">
            <h2 className="sin-filter-title">Sort By Progress</h2>
            <select 
              className="sin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="highest">Highest Progress First</option>
              <option value="lowest">Lowest Progress First</option>
            </select>
          </div>

          <button className="sin-reset-button" onClick={resetFilters}>
            Reset Filters
          </button>
        </aside>

        <main className="sin-school-grid">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <div className="sin-school-card" key={school.id}>
                <div className="sin-school-header">
                  <FaSchool className="sin-school-icon" />
                  <h3 className="sin-school-name">{school.name}</h3>
                </div>
                
                <div className="sin-school-location">
                  <FaMapMarkerAlt className="sin-location-icon" />
                  <span className="sin-location-text">{school.location}</span>
                </div>
                
                <div className="sin-school-students">
                  <FaUsers className="sin-students-icon" />
                  <span className="sin-students-text">{school.students} Students in need</span>
                </div>
                
                <div className="sin-school-needs">
                  <FaListUl className="sin-needs-icon" />
                  <div className="sin-needs-container">
                    <span className="sin-needs-label">Needs:</span>
                    <span className="sin-needs-text">{school.needs.join(', ')}</span>
                  </div>
                </div>
                
                <div className="sin-progress-section">
                  <div className="sin-progress-text">
                    <span>Progress</span>
                    <span>{school.progress}% Done</span>
                  </div>
                  <div className="sin-progress-bar">
                    <div 
                      className="sin-progress-fill" 
                      style={{ width: `${school.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="sin-donate-button">Donate Now</button>
              </div>
            ))
          ) : (
            <div className="sin-no-results">
              <p>No schools match your current filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SchoolsInNeedPage;
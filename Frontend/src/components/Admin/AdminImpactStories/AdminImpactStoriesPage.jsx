// frontend/src/components/Admin/AdminImpactStories/AdminImpactStoriesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import { Eye } from 'lucide-react'; // Icon for view details
import './AdminImpactStories.css'; // Import CSS

// Helper function to format date/time
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};


const AdminImpactStoriesPage = () => {
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');


  const fetchImpactStories = useCallback(async (statusFilter = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/api/impact-stories/admin', { params });
      setStories(response.data);
    } catch (err) {
      console.error('Error fetching admin impact stories:', err);
      setError(err.response?.data?.message || 'Failed to load impact stories.'); // Use backend error if available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImpactStories(filterStatus);
  }, [fetchImpactStories, filterStatus]);

  const handleViewDetails = (storyId) => {
    navigate(`/admin/impact-stories/${storyId}`);
  };

  const handleFilterChange = (e) => {
      setFilterStatus(e.target.value);
  };


  return (
    <div className="admin-impact-stories-container"> {/* Main page container */}
      <h1 className="admin-page-title">Manage Impact Stories</h1>

      {error && <div className="alert error">{error}</div>}

      <div className="admin-impact-stories-content-card"> {/* Card wrapper for content */}
          <div className="filter-controls">
               <label htmlFor="statusFilter">Filter by Status:</label>
               <select id="statusFilter" value={filterStatus} onChange={handleFilterChange}>
                   <option value="">All Statuses</option>
                   <option value="Pending Approval">Pending Approval</option>
                   <option value="Approved">Approved</option>
                   <option value="Rejected">Rejected</option>
               </select>
           </div>


          {loading ? (
            <LoadingSpinner />
          ) : stories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No stories found</h3>
              {filterStatus ? <p>{`No stories found with status "${filterStatus}".`}</p> : <p>No impact stories have been submitted yet.</p>}
            </div>
          ) : (
            <div className="admin-impact-stories-table-container"> {/* Wrapper for responsiveness */}
               <table className="admin-impact-stories-table">
                 <thead>
                   {/* FIX: Remove whitespace between <th> tags */}
                   <tr>
                     <th>TITLE</th><th>SCHOOL</th><th>STATUS</th><th>SUBMITTED AT</th><th>ACTIONS</th>
                   </tr>
                 </thead>
                 <tbody>
                   {stories.map(story => (
                     <tr key={story._id}>
                       {/* FIX: Remove whitespace between <td> tags using comments */}
                       <td data-label="Title">{story.title}</td>{/*
                       */}<td data-label="School">{story.school?.schoolName || 'N/A'} ({story.school?.city || 'N/A'})</td>{/*
                       */}<td data-label="Status">
                            {/* Apply status badge class */}
                           <span className={`status-badge status-${story.status.toLowerCase().replace(/\s+/g, '-')}`}>{story.status}</span>
                        </td>{/*
                       */}<td data-label="Submitted At">{formatDate(story.submittedAt)}</td>{/*
                       */}<td data-label="Actions">
                         <button
                           className="btn btn-small btn-secondary"
                           onClick={() => handleViewDetails(story._id)}
                           title="View Details"
                         >
                            <Eye size={14} />
                           {/* Text hidden on small screens via CSS */}
                           {'View'}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
      </div> {/* End admin-impact-stories-content-card */}
       {/* Pagination would go here if implemented, outside the card but within the container */}
    </div>
  );
};

export default AdminImpactStoriesPage;
// frontend/src/components/Admin/AdminImpactStories/AdminImpactStoryDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getFullImageUrl } from '../../../api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import { ArrowLeft, CheckCircle, XCircle, Quote, School } from 'lucide-react'; // Icons
import './AdminImpactStoryDetail.css'; // Import CSS

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

const AdminImpactStoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [success, setSuccess] = useState(null);

  const fetchStoryDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.get(`/api/impact-stories/${storyId}`);
      setStory(response.data);
       if (response.data?.adminRemarks) {
           setAdminRemarks(response.data.adminRemarks);
       }
    } catch (err) {
      console.error('Error fetching impact story details:', err);
      setError(err.response?.data?.message || 'Failed to load story details.');
      setStory(null);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (storyId) {
      fetchStoryDetails();
    } else {
        setError('Invalid story ID.');
        setLoading(false);
    }
  }, [storyId, fetchStoryDetails]);


  const handleApprove = async () => {
      if (!story || story.status === 'Approved') return;
      setApproving(true);
      setError(null);
      setSuccess(null);
      try {
          const response = await api.put(`/api/impact-stories/${storyId}/approve`, { adminRemarks: adminRemarks.trim() || undefined });
          setSuccess(response.data.message || 'Story approved.');
          // Fetch full updated story to get potential new admin info/timestamp
          fetchStoryDetails();
          // setStory(response.data.impactStory); // Update state with minimal data from response if preferred
          // setAdminRemarks(response.data.impactStory.adminRemarks || ''); // Update remarks if they were saved
      } catch (err) {
          console.error('Error approving story:', err);
          setError(err.response?.data?.message || 'Failed to approve story.');
      } finally {
          setApproving(false);
      }
  };

  const handleReject = async () => {
      if (!story || story.status === 'Rejected') return;
      if (!adminRemarks.trim()) {
          setError('Admin remarks are required to reject a story.');
          return;
      }
      setRejecting(true);
      setError(null);
      setSuccess(null);
      try {
          const response = await api.put(`/api/impact-stories/${storyId}/reject`, { adminRemarks: adminRemarks.trim() });
          setSuccess(response.data.message || 'Story rejected.');
           // Fetch full updated story
          fetchStoryDetails();
          // setStory(response.data.impactStory); // Update state
          // adminRemarks state is already set by user input
      } catch (err) {
          console.error('Error rejecting story:', err);
          setError(err.response?.data?.message || 'Failed to reject story.');
      } finally {
          setRejecting(false);
      }
  };

   const handleImageError = (e) => {
       console.warn("Failed to load image:", e.target.src);
       e.target.style.display = 'none'; // Hide the broken image
    };


  if (loading) {
    return (
        <div className="admin-impact-story-detail-container">
            <LoadingSpinner />
        </div>
    );
  }

  if (error) {
    return (
        <div className="admin-impact-story-detail-container">
            <div className="alert error">{error}</div>
             <button className="btn btn-secondary" onClick={() => navigate('/admin/impact-stories')}>
                 <ArrowLeft size={16} style={{ marginRight: '8px' }}/>
                 Back to List
            </button>
        </div>
    );
  }

  if (!story) {
      return (
         <div className="admin-impact-story-detail-container">
             <div className="alert error">Story data not available.</div>
             <button className="btn btn-secondary" onClick={() => navigate('/admin/impact-stories')}>
                 <ArrowLeft size={16} style={{ marginRight: '8px' }}/>
                 Back to List
            </button>
         </div>
      );
  }

  return (
    <div className="admin-impact-story-detail-container">

        <div className="detail-header">
            <button className="btn btn-secondary" onClick={() => navigate('/admin/impact-stories')}>
                 <ArrowLeft size={16} style={{ marginRight: '8px' }}/>
                 Back to List
            </button>
             <h1 className="detail-title">{story.title}</h1>
        </div>


        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="detail-section">
            <h2 className="section-heading">Story Information</h2>
            <div className="info-grid">
                 <div className="info-item">
                    <strong>School:</strong> {story.school?.schoolName || 'N/A'}
                     {story.school?.city && story.school?.province && ` (${story.school.city}, ${story.school.province})`} {/* Show city, province */}
                     {story.school?.city && !story.school?.province && story.school?.district && ` (${story.school.city}, ${story.school.district})`} {/* Fallback to district */}
                     {story.school?.city && !story.school?.province && !story.school?.district && ` (${story.school.city})`} {/* Just city */}
                 </div>
                  <div className="info-item">
                      <strong>Status:</strong>
                       {/* Apply status badge class */}
                      <span className={`status-badge status-${story.status.toLowerCase().replace(/\s+/g, '-')}`}>{story.status}</span>
                  </div>
                 <div className="info-item">
                      <strong>Submitted At:</strong> {formatDate(story.submittedAt)}
                  </div>
                  {/* Show processed info only if processed */}
                  {(story.approvedAt || story.adminRemarks) && (
                      <div className="info-item">
                          <strong>{story.status === 'Approved' ? 'Approved' : story.status === 'Rejected' ? 'Rejected' : 'Processed'} At:</strong> {story.approvedAt ? formatDate(story.approvedAt) : 'N/A'}
                      </div>
                  )}
                  {story.approvedBy && story.approvedBy.name && ( // Check if approvedBy is populated and has a name
                      <div className="info-item">
                           <strong>{story.status === 'Approved' ? 'Approved By' : 'Rejected By'}:</strong> {story.approvedBy.name || 'Unknown Admin'} {/* Use admin name if available */}
                      </div>
                  )}
                   <div className="info-item full-width">
                       <strong>Associated Donation:</strong> Donation ID: {story.donation?.id || 'N/A'}
                        {story.donation?.summary && ` (${story.donation.summary})`}
                        {story.donation?.date && ` - on ${formatDate(story.donation.date)}`}
                   </div>
            </div>
        </div>

        <div className="detail-section">
            <h2 className="section-heading">Main Story</h2>
            <p className="story-text-display">{story.storyText}</p>
        </div>

        {story.quote && (
            <div className="detail-section">
                <h2 className="section-heading">Quote</h2>
                 <div className="quote-block-display">
                     <Quote size={24} className="quote-icon-display"/>
                     <p className="quote-text-display">{story.quote}</p>
                     {story.quoteAuthor && <p className="quote-author-display">— {story.quoteAuthor}</p>}
                 </div>
            </div>
        )}

         {story.images && story.images.length > 0 && (
             <div className="detail-section">
                  <h2 className="section-heading">Photos</h2>
                  <div className="gallery-grid-display">
                      {story.images.map((image, index) => (
                          <div key={index} className="gallery-item-display">
                              <img
                                  src={getFullImageUrl(image.url)} // Use the helper
                                  alt={`Impact Photo ${index + 1}`}
                                  className="gallery-photo-display"
                                  onError={handleImageError}
                              />
                          </div>
                      ))}
                  </div>
             </div>
         )}

         {/* Admin Actions Section */}
         <div className="detail-section admin-actions-section">
            <h2 className="section-heading">Admin Actions</h2>

             {/* Admin Remarks Input/Display */}
            {(story.status === 'Pending Approval' || story.status === 'Rejected') && (
                <div className="form-group">
                    <label htmlFor="adminRemarks">Admin Remarks</label>
                    <textarea
                      id="adminRemarks"
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Enter notes for approval or reason for rejection..."
                      rows="4"
                      disabled={approving || rejecting}
                    ></textarea>
                </div>
            )}
             {/* Display remarks if story is Approved */}
             {story.status === 'Approved' && story.adminRemarks && (
                  <div className="info-item full-width">
                      <strong>Admin Remarks:</strong> {story.adminRemarks}
                  </div>
             )}


             <div className="action-buttons">
                {/* Approve Button */}
                {story.status !== 'Approved' && (
                    <button
                        className="btn btn-success"
                        onClick={handleApprove}
                        disabled={approving || rejecting}
                    >
                        {approving ? <LoadingSpinner size="sm" /> : <CheckCircle size={18} />}
                        {approving ? 'Approving...' : 'Approve'}
                    </button>
                )}

                {/* Reject Button */}
                 {story.status !== 'Rejected' && (story.status === 'Pending Approval' || story.status === 'Approved') && ( // Allow rejecting Pending or Approved
                    <button
                        className="btn btn-danger"
                        onClick={handleReject}
                        disabled={approving || rejecting}
                    >
                         {rejecting ? <LoadingSpinner size="sm" /> : <XCircle size={18} />}
                        {rejecting ? 'Rejecting...' : 'Reject'}
                    </button>
                )}
             </div>

         </div>

    </div>
  );
};

export default AdminImpactStoryDetail;
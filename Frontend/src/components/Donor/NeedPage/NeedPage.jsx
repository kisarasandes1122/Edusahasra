// frontend/src/components/Donor/NeedPage/NeedPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoLocationOutline } from 'react-icons/io5';
import { FaRegCheckCircle } from 'react-icons/fa';
import api from '../../../api'; // Assuming api.js sets the base URL
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import './NeedPage.css';
// Fallback images (keep these)
import img1 from '../../../assets/images/Rural1.webp';
import img2 from '../../../assets/images/Rural2.webp';
import img3 from '../../../assets/images/Rural3.webp';

const NeedPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define base URL for images - ensure api.js sets the base URL correctly
  const IMAGE_BASE_URL = api.defaults.baseURL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching details for request ID: ${requestId}`);
        const response = await api.get(`/api/requests/${requestId}`);
        console.log('API Response for NeedPage:', response.data);
        if (!response.data?.school) {
             throw new Error("School details are missing in the API response.");
        }
        setRequest(response.data);
      } catch (err) {
        console.error("Error fetching request details:", err);
        const message = err.response?.data?.message || err.message || 'Failed to load request details.';
        setError(message);
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetails();
    } else {
      setError("Request ID is missing in the URL.");
      setLoading(false);
    }
  }, [requestId]);

  const formatLocation = (school) => {
    if (!school) return 'Location Unavailable';
    return [school.city, school.district, school.province]
      .filter(loc => loc && String(loc).trim() !== '')
      .join(', ');
  };

  const calculateItemStatus = (item) => {
    if (!item || typeof item.quantity === 'undefined' || typeof item.quantityReceived === 'undefined') return 'Unknown';
    const quantity = item.quantity || 0;
    const received = item.quantityReceived || 0;
    if (quantity <= 0) return 'N/A';
    if (received >= quantity) return 'Fulfilled';
    if (received > 0) return 'In Progress';
    return 'Pending';
  };

  const handleDonateClick = () => {
    navigate(`/donate/${requestId}`);
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="need-container"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="need-container"><p className="error-message" style={{color: 'red', textAlign: 'center'}}>Error: {error}</p></div>;
  }

  if (!request || !request.school) {
    return <div className="need-container"><p>Request details or school information could not be loaded.</p></div>;
  }

  const totalRequested = request.requestedItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const totalReceived = request.requestedItems?.reduce((sum, item) => sum + (item.quantityReceived || 0), 0) || 0;
  const overallProgress = totalRequested > 0 ? Math.min(100, Math.round((totalReceived / totalRequested) * 100)) : 0;

  const getFullImageUrl = (relativePath) => {
     if (!relativePath) return null;
     if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
         return relativePath;
     }
     const cleanBase = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
     const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
     return `${cleanBase}${cleanPath}`;
  };

  let displayImages = [img1, img2, img3];
  if (request.school?.images && request.school.images.length > 0) {
      const validImageUrls = request.school.images
        .map(imgPath => getFullImageUrl(imgPath))
        .filter(url => url !== null);

      if (validImageUrls.length > 0) {
          displayImages = validImageUrls.slice(0, 3);
          if (displayImages.length < 3) {
              const fallbacksNeeded = 3 - displayImages.length;
              displayImages = [...displayImages, ...[img1, img2, img3].slice(0, fallbacksNeeded)];
          }
      }
  }

  return (
    <div className="need-container">
      {/* Header Section */}
      <div className="need-header">
        <div className="need-title-section">
          <h1 className="need-title">{request.school.schoolName}</h1>
          <div className="need-location">
            <IoLocationOutline className="location-icon" />
            <span>{formatLocation(request.school)}</span>
          </div>
          {/* **** START CHANGE **** */}
          {/* Wrap description and notes */}
          <div className="need-description-wrapper">
            <p className="need-description">
              {request.school.description || `Supporting ${request.school.schoolName}. We appreciate your help!`}
            </p>
            {request.notes && (
              <p className="need-request-note">
                <strong>Request Note:</strong> {request.notes}
              </p>
            )}
          </div>
          {/* **** END CHANGE **** */}
        </div>
        <div className="donate-btn-wrapper">
          {request.status !== 'Fulfilled' && request.status !== 'Closed' && request.status !== 'Cancelled' && (
             <button className="donate-now-btn" onClick={handleDonateClick}>
                Donate Now
             </button>
          )}
           {(request.status === 'Fulfilled' || request.status === 'Closed') && (
                <p className="request-status-message fulfilled">This request has been fulfilled!</p>
           )}
           {request.status === 'Cancelled' && (
               <p className="request-status-message cancelled">This request has been cancelled.</p>
           )}
        </div>
      </div>

      {/* --- Progress Tracker --- */}
      <div className="progress-tracker">
        <div className="progress-header">
          <h3 className="progress-label">Overall Progress</h3>
          <span className="completion-status">{overallProgress}% Done</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-fill"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Request progress: ${overallProgress}%`}
          ></div>
        </div>
      </div>

      {/* --- Items Table --- */}
      <div className="items-table">
        <div className="table-header">
          <div className="table-cell">Item</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Requested</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Received</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Remaining</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Status</div>
        </div>
        {request.requestedItems && request.requestedItems.length > 0 ? (
          request.requestedItems.map((item, index) => {
            const quantity = item.quantity || 0;
            const received = item.quantityReceived || 0;
            const remaining = Math.max(0, quantity - received);
            const status = calculateItemStatus(item);
            return (
              <div className="table-row" key={item.categoryId || index}>
                <div className="table-cell">{item.categoryNameEnglish || 'N/A'}</div>
                <div className="table-cell" style={{ textAlign: 'center'}}>{quantity}</div>
                <div className="table-cell" style={{ textAlign: 'center'}}>{received}</div>
                <div className="table-cell" style={{ textAlign: 'center'}}>{remaining}</div>
                <div className="table-cell" style={{ textAlign: 'center'}}>
                  {status === 'Fulfilled' ? (
                    <span className="status-complete">
                      <FaRegCheckCircle className="check-icon" />
                      {status}
                    </span>
                  ) : (
                    <span className="status-pending">{status}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="table-row">
             <div className="table-cell" style={{ flex: 5, textAlign: 'center', fontStyle: 'italic', color: '#777' }}>
                No specific items listed for this request.
             </div>
          </div>
        )}
      </div>

      {/* --- Photo Gallery --- */}
       <h3 className="gallery-title">School Gallery</h3>
      <div className="photo-gallery">
        {displayImages.map((imgSrc, index) => (
            <div className="photo-item" key={index}>
            <img
                src={imgSrc}
                alt={`${request.school.schoolName} - Image ${index + 1}`}
                className="need-photo"
                onError={(e) => {
                    console.warn(`Failed to load image: ${imgSrc}. Replacing with fallback.`);
                    e.target.onerror = null;
                    if (e.target.src !== img1) {
                        e.target.src = img1;
                    } else {
                        e.target.style.display = 'none';
                    }
                }}
            />
            </div>
        ))}
      </div>

    </div>
  );
};

export default NeedPage;
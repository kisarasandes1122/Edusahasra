import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoLocationOutline } from 'react-icons/io5';
import { FaRegCheckCircle } from 'react-icons/fa';
import api from '../../../api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import './NeedPage.css';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import img1 from '../../../assets/images/Rural1.webp';
import img2 from '../../../assets/images/Rural2.webp';
import img3 from '../../../assets/images/Rural3.webp';


const NeedPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const IMAGE_BASE_URL = api.defaults.baseURL || 'http://localhost:5000';


  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`NeedPage: Fetching details for request ID: ${requestId}`);
        const response = await api.get(`/api/requests/${requestId}`);
        console.log('NeedPage: API Response for Request Details:', response.data);

        if (!response.data?.school) {
             throw new Error("School details are missing in the API response.");
        }
         if (!response.data?.requestedItems) {
             console.warn("Requested items array is missing or not an array in the API response. Assuming no items.");
             response.data.requestedItems = [];
         }
        setRequest(response.data);
      } catch (err) {
        console.error("NeedPage: Error fetching request details:", err);
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
      .join(', ') || 'Location details missing';
  };

  const calculateItemStatus = (item) => {
    if (!item || typeof item.quantity !== 'number' || typeof item.quantityReceived !== 'number') return 'Unknown';

    const quantity = item.quantity;
    const received = item.quantityReceived;

    if (quantity <= 0) return 'N/A';
    if (received >= quantity) return 'Fulfilled';
    if (received > 0) return 'In Progress';
    return 'Pending';
  };

  const handleDonateClick = () => {
    if (!requestId) {
        console.error("Cannot navigate: Request ID is missing.");
        setError("Cannot proceed with donation, request ID is missing.");
        return;
    }
    console.log(`NeedPage: Navigating to donate for request: ${requestId}`);
    navigate(`/donate/${requestId}`);
  };


const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
  }
  
  if (relativePath.startsWith('/uploads/')) {
    const cleanBase = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
    return `${cleanBase}${relativePath}`;
  }
  
  const cleanBase = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  const fullUrl = `${cleanBase}/uploads/${cleanPath}`;
  
  console.log(`NeedPage: Constructed Image URL: ${fullUrl}`);
  return fullUrl;
}; 


  if (loading) {
    return <div className="need-container"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="need-container"><p className="error-message" style={{color: 'red', textAlign: 'center'}}>Error: {error}</p></div>;
  }

  if (!request || !request.school) {
    return <div className="need-container"><p>Request details or school information could not be loaded.</p></div>;
  }

  const schoolLatitude = request.school.location?.coordinates?.[1];
  const schoolLongitude = request.school.location?.coordinates?.[0];
  const hasLocationData = schoolLatitude !== undefined && schoolLongitude !== undefined && schoolLatitude !== null && schoolLongitude !== null;


  const totalRequested = request.requestedItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const totalReceived = request.requestedItems?.reduce((sum, item) => sum + (item.quantityReceived || 0), 0) || 0;
  const overallProgress = totalRequested > 0 ? Math.min(100, Math.round((totalReceived / totalRequested) * 100)) : 0;


  let displayImages = [img1, img2, img3];
  if (request.school?.images && Array.isArray(request.school.images) && request.school.images.length > 0) {
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

  const canDonate = !['Fulfilled', 'Closed', 'Cancelled'].includes(request.status);

  return (
    <div className="need-container">
      <div className="need-header">
        <div className="need-title-section">
          <h1 className="need-title">{request.school.schoolName}</h1>
          <div className="need-location">
            <IoLocationOutline className="location-icon" />
            <span>{formatLocation(request.school)}</span>
          </div>

          <div className="content-containers">
             {request.school.description && (
                <div className="school-info-container">
                  <p className="need-description">
                    {request.school.description}
                  </p>
                </div>
              )}

            {request.notes && (
              <div className="request-notes-container">
                <p className="need-request-note">
                  <strong>Request Note:</strong> {request.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="donate-btn-wrapper">
          {canDonate ? (
             <button className="donate-now-btn" onClick={handleDonateClick}>
                Donate Now
             </button>
          ) : (
               <>
                 {(request.status === 'Fulfilled' || request.status === 'Closed') && (
                      <p className="request-status-message fulfilled">This request has been fulfilled!</p>
                 )}
                 {request.status === 'Cancelled' && (
                     <p className="request-status-message cancelled">This request has been cancelled.</p>
                 )}
                 {!['Fulfilled', 'Closed', 'Cancelled'].includes(request.status) && (
                      <p className="request-status-message">Status: {request.status}</p>
                 )}
               </>
          )}
        </div>
      </div>

      <div className="progress-tracker">
        <div className="progress-header">
          <h3 className="progress-label">Overall Progress</h3>
          <span className="completion-status">{overallProgress}% Complete</span>
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
            const categoryId = item.categoryId || `item-${index}`;

            return (
              <div className="table-row" key={categoryId}>
                <div className="table-cell" data-label="Item:">{item.categoryNameEnglish || 'N/A'} ({item.categoryNameSinhala || 'N/A'})</div>
                <div className="table-cell" data-label="Requested:" style={{ textAlign: 'center'}}>{quantity}</div>
                <div className="table-cell" data-label="Received:" style={{ textAlign: 'center'}}>{received}</div>
                <div className="table-cell" data-label="Remaining:" style={{ textAlign: 'center'}}>{remaining}</div>
                <div className="table-cell" data-label="Status:" style={{ textAlign: 'center'}}>
                  {status === 'Fulfilled' ? (
                    <span className="status-complete">
                      <FaRegCheckCircle className="check-icon" />
                      {status}
                    </span>
                  ) : (
                    <span className={`status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="table-row">
             <div className="table-cell" style={{ flex: 1, textAlign: 'center', fontStyle: 'italic', color: '#777', padding: '20px 0' }}>
                No specific items listed for this request. General support might be needed.
             </div>
          </div>
        )}
      </div>

      {hasLocationData && (
         <div className="school-location-map-section">
             <h3 className="map-title">School Location</h3>
             <div className="map-container">
                 <MapContainer
                    center={[schoolLatitude, schoolLongitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="need-map"
                 >
                     <TileLayer
                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     />
                     <Marker position={[schoolLatitude, schoolLongitude]}>
                         <Popup>
                             {request.school.schoolName} <br /> {request.school.streetAddress}
                         </Popup>
                     </Marker>
                 </MapContainer>
                 <p className="map-coords">
                    Coordinates: {schoolLatitude.toFixed(6)}, {schoolLongitude.toFixed(6)}
                     <a
                        href={`https://maps.google.com/?q=${schoolLatitude},${schoolLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: '10px', color: '#2A6F2B', textDecoration: 'underline' }}
                     >View on Google Maps</a>
                 </p>
             </div>
         </div>
       )}

       <h3 className="gallery-title">School Gallery</h3>
      <div className="photo-gallery">
        {displayImages.length > 0 ? (
             displayImages.map((imgSrc, index) => (
                <div className="photo-item" key={`gallery-${index}`}>
                    <img
                        src={imgSrc}
                        alt={`${request.school.schoolName} - Image ${index + 1}`}
                        className="need-photo"
                        onError={(e) => {
                            console.warn(`NeedPage: Failed to load image: ${imgSrc}. Replacing with fallback.`);
                            e.target.onerror = null;
                            if (e.target.src !== img1) {
                                e.target.src = img1;
                            } else {
                                e.target.style.display = 'none';
                            }
                        }}
                    />
                </div>
            ))
        ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#777' }}>No images available for this school.</p>
        )}

      </div>

    </div>
  );
};

export default NeedPage;
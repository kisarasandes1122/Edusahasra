// frontend/src/components/Donor/NeedPage/NeedPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoLocationOutline } from 'react-icons/io5';
import { FaRegCheckCircle } from 'react-icons/fa';
import api from '../../../api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import './NeedPage.css';

// --- Import React Leaflet Components ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// --- Fix for default marker icon (Webpack/Vite issue) ---
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

// Configure the default icon path
let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: shadow,
    iconSize: [25, 41], // Default size
    iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
    popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
    shadowSize: [41, 41] // Size of the shadow
});

// Apply the new icon configuration globally
L.Marker.prototype.options.icon = DefaultIcon;
// --- End Fix ---


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
  // Use axios default baseURL if available, otherwise fallback
  const IMAGE_BASE_URL = api.defaults.baseURL || 'http://localhost:5000';


  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`NeedPage: Fetching details for request ID: ${requestId}`);
        // Use the public route to get request details including school info
        const response = await api.get(`/api/requests/${requestId}`);
        console.log('NeedPage: API Response for Request Details:', response.data);

        // Validate the response structure
        if (!response.data?.school) {
             throw new Error("School details are missing in the API response.");
        }
         if (!response.data?.requestedItems) {
             // Handle case where items might be empty but the array should exist
             console.warn("Requested items array is missing or not an array in the API response. Assuming no items.");
             response.data.requestedItems = []; // Default to empty array if missing
         }
        setRequest(response.data);
      } catch (err) {
        console.error("NeedPage: Error fetching request details:", err);
        const message = err.response?.data?.message || err.message || 'Failed to load request details.';
        setError(message);
        setRequest(null); // Clear request data on error
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

  // Helper function to format location string
  const formatLocation = (school) => {
    if (!school) return 'Location Unavailable';
    // Filter out empty or null values before joining
    return [school.city, school.district, school.province]
      .filter(loc => loc && String(loc).trim() !== '')
      .join(', ') || 'Location details missing'; // Provide fallback if all are empty
  };

  // Helper function to calculate status for individual items
  const calculateItemStatus = (item) => {
    // Check if item and necessary properties exist
    if (!item || typeof item.quantity !== 'number' || typeof item.quantityReceived !== 'number') return 'Unknown';

    const quantity = item.quantity;
    const received = item.quantityReceived;

    // Handle edge case of zero quantity requested
    if (quantity <= 0) return 'N/A';
    // Check if fulfilled
    if (received >= quantity) return 'Fulfilled';
    // Check if in progress
    if (received > 0) return 'In Progress';
    // Otherwise, it's pending
    return 'Pending';
  };

  // Navigation handler for the Donate button
  const handleDonateClick = () => {
    if (!requestId) {
        console.error("Cannot navigate: Request ID is missing.");
        setError("Cannot proceed with donation, request ID is missing.");
        return;
    }
    console.log(`NeedPage: Navigating to donate for request: ${requestId}`);
    navigate(`/donate/${requestId}`); // Navigate to DonationPage with the requestId
  };

  // Helper function to construct full image URLs

const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // If it's already an absolute URL, return it
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
  }
  
  // If it already includes the /uploads path, we don't need to add it
  if (relativePath.startsWith('/uploads/')) {
    const cleanBase = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
    return `${cleanBase}${relativePath}`;
  }
  
  // Ensure base URL doesn't have trailing slash
  const cleanBase = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  
  // Normalize the path to ensure it doesn't start with a slash
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  // Construct the full URL with the /uploads prefix
  const fullUrl = `${cleanBase}/uploads/${cleanPath}`;
  
  console.log(`NeedPage: Constructed Image URL: ${fullUrl}`);
  return fullUrl;
}; 


  // --- Render Logic ---

  if (loading) {
    return <div className="need-container"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="need-container"><p className="error-message" style={{color: 'red', textAlign: 'center'}}>Error: {error}</p></div>;
  }

  // Ensure request and request.school exist before trying to access properties
  if (!request || !request.school) {
    return <div className="need-container"><p>Request details or school information could not be loaded.</p></div>;
  }

  // Safely access latitude and longitude from the populated school location
  // GeoJSON coordinates are [longitude, latitude]
  const schoolLatitude = request.school.location?.coordinates?.[1];
  const schoolLongitude = request.school.location?.coordinates?.[0];
  const hasLocationData = schoolLatitude !== undefined && schoolLongitude !== undefined && schoolLatitude !== null && schoolLongitude !== null;


  // Calculate overall progress safely, handling potential undefined or empty items
  const totalRequested = request.requestedItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const totalReceived = request.requestedItems?.reduce((sum, item) => sum + (item.quantityReceived || 0), 0) || 0;
  const overallProgress = totalRequested > 0 ? Math.min(100, Math.round((totalReceived / totalRequested) * 100)) : 0;


  // Determine images to display (from request or fallbacks)
  let displayImages = [img1, img2, img3]; // Default fallbacks
  if (request.school?.images && Array.isArray(request.school.images) && request.school.images.length > 0) {
      const validImageUrls = request.school.images
        .map(imgPath => getFullImageUrl(imgPath)) // Use helper to construct full URLs
        .filter(url => url !== null); // Filter out any null results from getFullImageUrl

      if (validImageUrls.length > 0) {
          // Take up to 3 valid URLs
          displayImages = validImageUrls.slice(0, 3);
          // If fewer than 3 valid URLs, fill the rest with fallbacks
          if (displayImages.length < 3) {
              const fallbacksNeeded = 3 - displayImages.length;
              // Use default fallbacks that haven't been used yet if possible, or just slice
              displayImages = [...displayImages, ...[img1, img2, img3].slice(0, fallbacksNeeded)];
          }
      }
  }

  // Check if the request is in a state where donation is possible
  const canDonate = !['Fulfilled', 'Closed', 'Cancelled'].includes(request.status);

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

          {/* Content Containers Wrapper */}
          <div className="content-containers">
            {/* School Info Container */}
             {request.school.description && ( // Only show if description exists
                <div className="school-info-container">
                  <p className="need-description">
                    {request.school.description}
                  </p>
                </div>
              )}

            {/* Request Notes Container - Only rendered if notes exist */}
            {request.notes && (
              <div className="request-notes-container">
                <p className="need-request-note">
                  <strong>Request Note:</strong> {request.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Donate Button / Status Message Section */}
        <div className="donate-btn-wrapper">
          {canDonate ? (
             <button className="donate-now-btn" onClick={handleDonateClick}>
                Donate Now
             </button>
          ) : (
              // Display status message if donation is not possible
               <>
                 {(request.status === 'Fulfilled' || request.status === 'Closed') && (
                      <p className="request-status-message fulfilled">This request has been fulfilled!</p>
                 )}
                 {request.status === 'Cancelled' && (
                     <p className="request-status-message cancelled">This request has been cancelled.</p>
                 )}
                 {/* Add a fallback message if status is unexpected */}
                 {!['Fulfilled', 'Closed', 'Cancelled'].includes(request.status) && (
                      <p className="request-status-message">Status: {request.status}</p>
                 )}
               </>
          )}
        </div>
      </div>

      {/* --- Progress Tracker --- */}
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


      {/* --- Items Table --- */}
      <div className="items-table">
        {/* Table Header */}
        <div className="table-header">
          <div className="table-cell">Item</div>
          {/* Ensure text alignment classes/styles are applied if needed */}
          <div className="table-cell" style={{ textAlign: 'center'}}>Requested</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Received</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Remaining</div>
          <div className="table-cell" style={{ textAlign: 'center'}}>Status</div>
        </div>
        {/* Table Body */}
        {request.requestedItems && request.requestedItems.length > 0 ? (
          request.requestedItems.map((item, index) => {
            // Calculate remaining quantity safely
            const quantity = item.quantity || 0;
            const received = item.quantityReceived || 0;
            const remaining = Math.max(0, quantity - received);
            const status = calculateItemStatus(item);
            const categoryId = item.categoryId || `item-${index}`; // Fallback key

            return (
              // Add data-label attributes for mobile view
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
                    <span className={`status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span> // e.g., status-in-progress
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // Row shown when no items are listed
          <div className="table-row">
             <div className="table-cell" style={{ flex: 1, textAlign: 'center', fontStyle: 'italic', color: '#777', padding: '20px 0' }}>
                No specific items listed for this request. General support might be needed.
             </div>
          </div>
        )}
      </div>

      {/* --- School Location Map --- */}
      {hasLocationData && (
         <div className="school-location-map-section">
             <h3 className="map-title">School Location</h3>
             <div className="map-container">
                 {/* Set center to [latitude, longitude] and initial zoom */}
                 <MapContainer
                    center={[schoolLatitude, schoolLongitude]}
                    zoom={14} // Adjust zoom level as needed (e.g., 13-16)
                    scrollWheelZoom={false} // Disable scroll wheel zooming to avoid accidental page scrolls
                    className="need-map" // Add class for styling
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
      {/* --- End School Location Map --- */}

      {/* --- Photo Gallery --- */}
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
                            // Attempt to replace with the first fallback if loading fails
                            console.warn(`NeedPage: Failed to load image: ${imgSrc}. Replacing with fallback.`);
                            e.target.onerror = null; // Prevent infinite loop if fallback also fails
                            // Only replace if it's not already the fallback to avoid loops
                            if (e.target.src !== img1) {
                                e.target.src = img1;
                            } else {
                                // If the primary fallback itself fails, hide the item or show placeholder text
                                e.target.style.display = 'none'; // Hide broken image element
                                // Optionally, you could add a placeholder text element here
                            }
                        }}
                    />
                </div>
            ))
        ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#777' }}>No images available for this school.</p>
        )}

      </div>

    </div> // End of need-container
  );
};

export default NeedPage;
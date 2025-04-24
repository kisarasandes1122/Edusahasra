// frontend/src/components/Admin/SchoolVerification/SchoolVerificationReview.jsx
import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import './SchoolVerificationReview.css';
import api from '../../../api'; // Import your API instance
// getFullImageUrl is not needed here as the backend serves the file directly via a protected endpoint
// import { getFullImageUrl } from '../../../api';


const SchoolVerificationReview = ({ school, onClose, onStatusUpdateSuccess }) => {
  // Use state to hold the *full* details fetched from the backend
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [notes, setNotes] = useState(''); // State for admin remarks

  // Determine if in view-only mode based on the initial school status
  // Note: The fetched schoolDetails status will override this once loaded
  const isInitialViewOnly = school?.status !== 'pending';


  // Fetch full school details when the modal opens (school prop changes)
  useEffect(() => {
    if (school && school._id) { // Ensure school object with ID is available
      const fetchDetails = async () => {
        setLoadingDetails(true);
        setErrorDetails(null);
        try {
          const { data } = await api.get(`/api/admin/schools/${school._id}`);
          setSchoolDetails(data);
           // Initialize notes with existing adminRemarks if available
          setNotes(data.adminRemarks || '');
        } catch (err) {
          console.error("Error fetching school details:", err);
          setErrorDetails('Failed to load school details.');
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [school]); // Effect runs when the school prop changes

  // --- API Calls for Approve/Reject ---
  const handleApprove = async () => {
    if (!schoolDetails) return; // Prevent action if details not loaded

    setLoadingDetails(true); // Show loading while updating - handled by overlay now
    setErrorDetails(null); // Clear previous errors
    try {
      // Send the approval request with notes (adminRemarks)
      await api.put(`/api/admin/schools/${schoolDetails._id}/approve`, {
         adminRemarks: notes
      });
       // Call the success callback provided by the parent (to refetch list and close modal)
      onStatusUpdateSuccess();
    } catch (err) {
      console.error("Error approving school:", err);
      // Display an error message to the user
      setErrorDetails(err.response?.data?.message || 'Failed to approve school. Please try again.');
      setLoadingDetails(false); // Stop loading - let the parent handle closing on success or re-enable on error
    }
  };

  const handleReject = async () => {
     if (!schoolDetails) return; // Prevent action if details not loaded
     if (!notes || notes.trim() === '') {
         alert('Please add notes explaining the reason for rejection.');
         return;
     }

     setLoadingDetails(true); // Show loading while updating - handled by overlay now
     setErrorDetails(null); // Clear previous errors
     try {
        // Send the rejection request with notes (adminRemarks)
       await api.put(`/api/admin/schools/${schoolDetails._id}/reject`, {
          adminRemarks: notes
       });
        // Call the success callback provided by the parent (to refetch list and close modal)
       onStatusUpdateSuccess();
     } catch (err) {
       console.error("Error rejecting school:", err);
        // Display an error message to the user
       setErrorDetails(err.response?.data?.message || 'Failed to reject school. Please try again.');
       setLoadingDetails(false); // Stop loading - let the parent handle closing on success or re-enable on error
     }
  };


  // --- Helper to get file extension for icon ---
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  // --- Helper to get document icon class ---
  const getDocumentIconClass = (filename, fileType) => {
    const extension = getFileExtension(filename);
    if (fileType.startsWith('image/')) return 'svr-image-icon';
    if (extension === 'pdf') return 'svr-pdf-icon';
    if (extension === 'doc' || extension === 'docx') return 'svr-doc-icon';
    if (extension === 'xls' || extension === 'xlsx') return 'svr-excel-icon';
     if (extension === 'txt') return 'svr-txt-icon'; // Example for text
     if (extension === 'zip' || extension === 'rar') return 'svr-zip-icon'; // Example for archive
    // Add more specific types as needed
    return 'svr-file-icon';
  };

  // --- Helper to get document icon text ---
   const getDocumentIconText = (filename, fileType) => {
       const extension = getFileExtension(filename);
       if (fileType.startsWith('image/')) return 'IMG';
       if (extension === 'pdf') return 'PDF';
       if (extension === 'doc' || extension === 'docx') return 'DOC';
       if (extension === 'xls' || extension === 'xlsx') return 'XLS';
       if (extension === 'txt') return 'TXT';
        if (extension === 'zip' || extension === 'rar') return 'ZIP';
       // Add more specific types as needed
       return extension.toUpperCase() || 'FILE';
   };


// --- Handle Document Download (MODIFIED) ---
const handleDownload = async (docItem) => {
  if (!schoolDetails || !docItem?._id) {
      console.error("Cannot download document: school details or document ID missing.");
      // Optional: Show user feedback
      return;
  }

  try {
    // Make the GET request using the api instance.
    // responseType: 'blob' is crucial for receiving binary data (like files).
    const response = await api.get(`/api/admin/schools/${schoolDetails._id}/documents/${docItem._id}`, {
      responseType: 'blob'
    });

    // Create a Blob from the response data
    const blob = new Blob([response.data], { type: response.headers['content-type'] });

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    const link = document.createElement('a'); // Now this refers to the global document object
    link.href = url;
    // Set the download attribute to the original filename
    link.setAttribute('download', docItem.fileName);

    // Append the link to the body, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the temporary URL
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(`Error downloading document ${docItem.fileName}:`, err);
    // Display error to user
     setErrorDetails(err.response?.data?.message || 'Failed to download document. Please try again.');
  }
};


  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
     try {
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date in modal:", dateString, e);
        return 'Invalid Date';
    }
  };

  // Use schoolDetails for rendering, fallback to initial school prop if details are loading
  const currentSchoolData = schoolDetails || school;

   // Determine the current status from fetched details or initial prop
  const currentStatus = schoolDetails?.status || school?.status || 'pending'; // Default to pending if somehow missing


  return (
    <div className="svr-overlay">
      <div className="svr-modal">
        <div className="svr-modal-header">
          <div>
            <h2 className="svr-modal-title">{currentSchoolData?.schoolName || 'Loading...'}</h2>
            <p className="svr-modal-subtitle">School Verification {currentStatus !== 'pending' ? 'Details' : 'Review'}</p> {/* Use currentStatus */}
          </div>
          <button className="svr-close-button" onClick={onClose} disabled={loadingDetails}>
            <FiX />
          </button>
        </div>

        {/* Add a loading overlay */}
        {(loadingDetails && !schoolDetails) && ( // Show loading unless details are already loaded
            <div className="svr-loading-overlay">
                 Loading school details...
            </div>
        )}
         {/* Add error message */}
         {errorDetails && (
             <div className="svr-modal-content" style={{ textAlign: 'center', padding: '20px', color: 'red', fontWeight: '500' }}>
                {errorDetails}
            </div>
         )}


        {/* Render content only when details are loaded or if initial school prop exists */}
        {currentSchoolData && (
            <div className="svr-modal-content">
              <div className="svr-content-columns">
                <div className="svr-info-column">
                  <h3 className="svr-section-title">School Information</h3>

                  <div className="svr-info-group">
                    <label className="svr-label">Location</label>
                    <p className="svr-value">{`${currentSchoolData?.streetAddress || 'N/A'}, ${currentSchoolData?.city || 'N/A'}, ${currentSchoolData?.district || 'N/A'}, ${currentSchoolData?.province || 'N/A'}, ${currentSchoolData?.postalCode || 'N/A'}`}</p>
                  </div>

                  <div className="svr-info-group">
                    <label className="svr-label">Principal Name</label>
                    <p className="svr-value">{currentSchoolData?.principalName || 'N/A'}</p>
                  </div>

                  <div className="svr-info-group">
                    <label className="svr-label">Principal Email</label>
                    <p className="svr-value">{currentSchoolData?.principalEmail || 'N/A'}</p>
                  </div>

                  <div className="svr-info-group">
                    <label className="svr-label">Phone Number</label>
                    <p className="svr-value">{currentSchoolData?.phoneNumber || 'N/A'}</p>
                  </div>

                  <div className="svr-info-group">
                    <label className="svr-label">Registered At</label> {/* Changed from Submission Date */}
                    <p className="svr-value">{formatDate(currentSchoolData?.registeredAt)}</p>
                  </div>

                  {/* Display Approval Status if available in fetched details */}
                  {schoolDetails && (
                     <div className="svr-info-group">
                       <label className="svr-label">Status</label>
                       <p className="svr-value">
                         <span className={`sv-status sv-status-${currentStatus}`}> {/* Use the derived currentStatus string */}
                           {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                         </span>
                       </p>
                     </div>
                   )}

                  {/* Display Approved/Rejected By and At info if available */}
                   {/* Display Approved/Rejected By and At info if available */}
                   {schoolDetails?.approvedAt && ( // Only show if processed time exists
                       <>
                           <div className="svr-info-group">
                               <label className="svr-label">{schoolDetails.isApproved ? 'Approved At' : 'Rejected At'}</label>
                               <p className="svr-value">{formatDate(schoolDetails.approvedAt)}</p>
                           </div>
                            {/* Note: To show Admin Name, the backend would need to populate approvedBy */}
                           {/* <div className="svr-info-group">
                                <label className="svr-label">{schoolDetails.isApproved ? 'Approved By' : 'Rejected By'}</label>
                                <p className="svr-value">{(schoolDetails.approvedBy?.name) || 'N/A'}</p>
                            </div> */}
                       </>
                   )}


                   {/* Display description if available */}
                    {currentSchoolData?.description && (
                        <div className="svr-info-group">
                            <label className="svr-label">Description</label>
                            <p className="svr-value">{currentSchoolData.description}</p>
                        </div>
                    )}
                </div>

                <div className="svr-docs-column">
                  <h3 className="svr-section-title">Verification Documents</h3>

                  <div className="svr-docs-list">
                     {schoolDetails?.documents && schoolDetails.documents.length > 0 ? (
                        schoolDetails.documents.map(doc => (
                          <div key={doc._id} className="svr-doc-item">
                            <div className="svr-doc-info">
                              <div className={`svr-doc-icon ${getDocumentIconClass(doc.fileName, doc.fileType)}`}>
                                   <span>{getDocumentIconText(doc.fileName, doc.fileType)}</span>
                              </div>
                              <div className="svr-doc-details">
                                <p className="svr-doc-name">{doc.fileName}</p>
                                 {/* Upload Date from backend document object */}
                                <p className="svr-doc-meta">Uploaded {formatDate(doc.uploadedAt)}</p>
                              </div>
                            </div>
                            <button
                              className="svr-download-button"
                              onClick={() => handleDownload(doc)}
                               disabled={loadingDetails} // Disable while processing
                            >
                              <FiDownload /> Download
                            </button>
                          </div>
                        ))
                     ) : (
                        <div className="svr-no-results">No documents uploaded.</div>
                     )}
                  </div>
                </div>
              </div>

              <div className="svr-notes-section">
                <h3 className="svr-notes-title">
                  Verification Notes {currentStatus === 'pending' && !loadingDetails && <FiPlus className="svr-notes-icon" />} {/* Only show icon if editable */}
                </h3>
                {currentStatus !== 'pending' ? ( // Use currentStatus to determine if notes are view-only
                  schoolDetails?.adminRemarks ? ( // Use adminRemarks from fetched data
                    <div className="svr-notes-display">
                      <p>{schoolDetails.adminRemarks}</p>
                    </div>
                  ) : (
                    <div className="svr-notes-display svr-notes-empty">
                      <p>No verification notes were added.</p>
                    </div>
                  )
                ) : (
                  <textarea
                    className="svr-notes-input"
                    placeholder="Add notes about this verification..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loadingDetails} // Disable while processing
                  ></textarea>
                )}
              </div>
            </div>
        )}


        <div className="svr-modal-footer">
          <div className="svr-action-buttons">
            {/* Only show Approve/Reject if status is 'pending' and details are loaded */}
            {currentStatus === 'pending' && !loadingDetails && (
              <>
                <button className="svr-approve-button" onClick={handleApprove}>
                  <FiCheck /> Approve School
                </button>
                <button className="svr-reject-button" onClick={handleReject}>
                  <FiX /> Reject School
                </button>
              </>
            )}
          </div>
           {/* Disable cancel/close button while processing */}
          <button className="svr-cancel-button" onClick={onClose} disabled={loadingDetails}>
            {currentStatus !== 'pending' ? "Close" : "Cancel"} {/* Use currentStatus for button text */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolVerificationReview;
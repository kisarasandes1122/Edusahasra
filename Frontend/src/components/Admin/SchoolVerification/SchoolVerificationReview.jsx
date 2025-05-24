import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import './SchoolVerificationReview.css';
import api from '../../../api';


const SchoolVerificationReview = ({ school, onClose, onStatusUpdateSuccess }) => {
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [notes, setNotes] = useState('');

  const isInitialViewOnly = school?.status !== 'pending';


  useEffect(() => {
    if (school && school._id) {
      const fetchDetails = async () => {
        setLoadingDetails(true);
        setErrorDetails(null);
        try {
          const { data } = await api.get(`/api/admin/schools/${school._id}`);
          setSchoolDetails(data);
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
  }, [school]);

  const handleApprove = async () => {
    if (!schoolDetails) return;

    setLoadingDetails(true);
    setErrorDetails(null);
    try {
      await api.put(`/api/admin/schools/${schoolDetails._id}/approve`, {
         adminRemarks: notes
      });
      onStatusUpdateSuccess();
    } catch (err) {
      console.error("Error approving school:", err);
      setErrorDetails(err.response?.data?.message || 'Failed to approve school. Please try again.');
      setLoadingDetails(false);
    }
  };

  const handleReject = async () => {
     if (!schoolDetails) return;
     if (!notes || notes.trim() === '') {
         alert('Please add notes explaining the reason for rejection.');
         return;
     }

     setLoadingDetails(true);
     setErrorDetails(null);
     try {
       await api.put(`/api/admin/schools/${schoolDetails._id}/reject`, {
          adminRemarks: notes
       });
       onStatusUpdateSuccess();
     } catch (err) {
       console.error("Error rejecting school:", err);
       setErrorDetails(err.response?.data?.message || 'Failed to reject school. Please try again.');
       setLoadingDetails(false);
     }
  };


  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getDocumentIconClass = (filename, fileType) => {
    const extension = getFileExtension(filename);
    if (fileType.startsWith('image/')) return 'svr-image-icon';
    if (extension === 'pdf') return 'svr-pdf-icon';
    if (extension === 'doc' || extension === 'docx') return 'svr-doc-icon';
    if (extension === 'xls' || extension === 'xlsx') return 'svr-excel-icon';
     if (extension === 'txt') return 'svr-txt-icon';
     if (extension === 'zip' || extension === 'rar') return 'svr-zip-icon';
    return 'svr-file-icon';
  };

   const getDocumentIconText = (filename, fileType) => {
       const extension = getFileExtension(filename);
       if (fileType.startsWith('image/')) return 'IMG';
       if (extension === 'pdf') return 'PDF';
       if (extension === 'doc' || extension === 'docx') return 'DOC';
       if (extension === 'xls' || extension === 'xlsx') return 'XLS';
       if (extension === 'txt') return 'TXT';
        if (extension === 'zip' || extension === 'rar') return 'ZIP';
       return extension.toUpperCase() || 'FILE';
   };


const handleDownload = async (docItem) => {
  if (!schoolDetails || !docItem?._id) {
      console.error("Cannot download document: school details or document ID missing.");
      return;
  }

  try {
    const response = await api.get(`/api/admin/schools/${schoolDetails._id}/documents/${docItem._id}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', docItem.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(`Error downloading document ${docItem.fileName}:`, err);
     setErrorDetails(err.response?.data?.message || 'Failed to download document. Please try again.');
  }
};


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

  const currentSchoolData = schoolDetails || school;
  const currentStatus = schoolDetails?.status || school?.status || 'pending';


  return (
    <div className="svr-overlay">
      <div className="svr-modal">
        <div className="svr-modal-header">
          <div>
            <h2 className="svr-modal-title">{currentSchoolData?.schoolName || 'Loading...'}</h2>
            <p className="svr-modal-subtitle">School Verification {currentStatus !== 'pending' ? 'Details' : 'Review'}</p>
          </div>
          <button className="svr-close-button" onClick={onClose} disabled={loadingDetails}>
            <FiX />
          </button>
        </div>

        {(loadingDetails && !schoolDetails) && (
            <div className="svr-loading-overlay">
                 Loading school details...
            </div>
        )}
         {errorDetails && (
             <div className="svr-modal-content" style={{ textAlign: 'center', padding: '20px', color: 'red', fontWeight: '500' }}>
                {errorDetails}
            </div>
         )}


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
                    <label className="svr-label">Registered At</label>
                    <p className="svr-value">{formatDate(currentSchoolData?.registeredAt)}</p>
                  </div>

                  {schoolDetails && (
                     <div className="svr-info-group">
                       <label className="svr-label">Status</label>
                       <p className="svr-value">
                         <span className={`sv-status sv-status-${currentStatus}`}>
                           {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                         </span>
                       </p>
                     </div>
                   )}

                   {schoolDetails?.approvedAt && (
                       <>
                           <div className="svr-info-group">
                               <label className="svr-label">{schoolDetails.isApproved ? 'Approved At' : 'Rejected At'}</label>
                               <p className="svr-value">{formatDate(schoolDetails.approvedAt)}</p>
                           </div>
                       </>
                   )}


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
                                <p className="svr-doc-meta">Uploaded {formatDate(doc.uploadedAt)}</p>
                              </div>
                            </div>
                            <button
                              className="svr-download-button"
                              onClick={() => handleDownload(doc)}
                               disabled={loadingDetails}
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
                  Verification Notes {currentStatus === 'pending' && !loadingDetails && <FiPlus className="svr-notes-icon" />}
                </h3>
                {currentStatus !== 'pending' ? (
                  schoolDetails?.adminRemarks ? (
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
                    disabled={loadingDetails}
                  ></textarea>
                )}
              </div>
            </div>
        )}


        <div className="svr-modal-footer">
          <div className="svr-action-buttons">
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
          <button className="svr-cancel-button" onClick={onClose} disabled={loadingDetails}>
            {currentStatus !== 'pending' ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolVerificationReview;
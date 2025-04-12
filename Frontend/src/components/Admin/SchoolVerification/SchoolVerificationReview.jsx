import React, { useState } from 'react';
import { FiDownload, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import './SchoolVerificationReview.css';

const SchoolVerificationReview = ({ school, onClose, onApprove, onReject }) => {
  const [notes, setNotes] = useState(school.notes || '');

  // Sample document data - in a real app, these would likely be fetched based on school ID
  const documents = [
    {
      id: 1,
      name: 'School Registration Certificate.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: 'Jan 15, 2025',
      url: '/documents/school-registration.pdf'
    },
    {
      id: 2,
      name: 'School Building Photos.jpg',
      type: 'image',
      size: '5.1 MB',
      uploadDate: 'Jan 15, 2025',
      url: '/documents/school-building.jpg'
    },
    {
      id: 3,
      name: 'Financial Records.xlsx',
      type: 'excel',
      size: '1.8 MB',
      uploadDate: 'Jan 15, 2025',
      url: '/documents/financial-records.xlsx'
    }
  ];

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <div className="svr-doc-icon svr-pdf-icon"></div>;
      case 'image':
        return <div className="svr-doc-icon svr-image-icon"></div>;
      case 'excel':
        return <div className="svr-doc-icon svr-excel-icon"></div>;
      default:
        return <div className="svr-doc-icon svr-file-icon"></div>;
    }
  };

  const handleApprove = () => {
    onApprove(school.id, notes);
    onClose();
  };

  const handleReject = () => {
    onReject(school.id, notes);
    onClose();
  };

  // For demonstration purposes - in a real app, this would trigger an actual download
  const handleDownload = (document) => {
    // In a real application, this would initiate a file download
    // Here we'll just log for demonstration
    console.log(`Downloading: ${document.name}`);
    
    // For demonstration - simulate browser download
    // In a real app, this would be replaced with actual file download logic
    alert(`Downloading ${document.name}`);
  };

  // Format date for better display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Determine if the modal is in view-only mode (for approved or rejected schools)
  const isViewOnly = school.status === 'approved' || school.status === 'rejected';

  return (
    <div className="svr-overlay">
      <div className="svr-modal">
        <div className="svr-modal-header">
          <div>
            <h2 className="svr-modal-title">{school.name}</h2>
            <p className="svr-modal-subtitle">School Verification {isViewOnly ? 'Details' : 'Review'}</p>
          </div>
          <button className="svr-close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="svr-modal-content">
          <div className="svr-content-columns">
            <div className="svr-info-column">
              <h3 className="svr-section-title">School Information</h3>
              
              <div className="svr-info-group">
                <label className="svr-label">Location</label>
                <p className="svr-value">{school.location}</p>
              </div>
              
              <div className="svr-info-group">
                <label className="svr-label">Contact Person</label>
                <p className="svr-value">{school.contactPerson}</p>
              </div>
              
              <div className="svr-info-group">
                <label className="svr-label">Email</label>
                <p className="svr-value">{school.email}</p>
              </div>
              
              <div className="svr-info-group">
                <label className="svr-label">Phone</label>
                <p className="svr-value">{school.phone}</p>
              </div>
              
              <div className="svr-info-group">
                <label className="svr-label">Submission Date</label>
                <p className="svr-value">{formatDate(school.submissionDate)}</p>
              </div>
              
              {isViewOnly && (
                <div className="svr-info-group">
                  <label className="svr-label">Status</label>
                  <p className="svr-value">
                    <span className={`sv-status sv-status-${school.status}`}>
                      {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="svr-docs-column">
              <h3 className="svr-section-title">Verification Documents</h3>
              
              <div className="svr-docs-list">
                {documents.map(doc => (
                  <div key={doc.id} className="svr-doc-item">
                    <div className="svr-doc-info">
                      {getDocumentIcon(doc.type)}
                      <div className="svr-doc-details">
                        <p className="svr-doc-name">{doc.name}</p>
                        <p className="svr-doc-meta">{doc.size} • Uploaded {doc.uploadDate}</p>
                      </div>
                    </div>
                    <button 
                      className="svr-download-button"
                      onClick={() => handleDownload(doc)}
                    >
                      <FiDownload /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="svr-notes-section">
            <h3 className="svr-notes-title">
              Verification Notes {!isViewOnly && <FiPlus className="svr-notes-icon" />}
            </h3>
            {isViewOnly ? (
              school.notes ? (
                <div className="svr-notes-display">
                  <p>{school.notes}</p>
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
              ></textarea>
            )}
          </div>
        </div>
        
        <div className="svr-modal-footer">
          <div className="svr-action-buttons">
            {school.status === 'pending' && (
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
          <button className="svr-cancel-button" onClick={onClose}>
            {isViewOnly ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolVerificationReview;
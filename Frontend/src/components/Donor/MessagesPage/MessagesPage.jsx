import React, { useState, useEffect } from 'react';
import './MessagesPage.css';
import api from '../../../api';
import { getFullImageUrl } from '../../../api';

const MessagesPage = () => {
  const [thankYouMessages, setThankYouMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalImageSrc, setModalImageSrc] = useState(null);


  useEffect(() => {
    const fetchThankYouMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/thankyous/my-thanks');

        console.log("Raw Thank You Data from Backend:", response.data);


        const formattedMessages = response.data.map(ty => ({
          id: ty._id,
          schoolName: ty.schoolName || 'Unknown School',
          schoolCity: ty.schoolCity || '',
          date: ty.sentAt,
          message: ty.message,
          images: ty.images.map(img => ({
             url: img.url,
             fileName: img.fileName
          })) || [],
          donationSummary: ty.donationSummary
        }));

        setThankYouMessages(formattedMessages);

        if (formattedMessages.length > 0) {
          setActiveMessage(formattedMessages[0]);
        } else {
          setActiveMessage(null);
        }

      } catch (err) {
        console.error("Error fetching thank you messages:", err);
        const message = err.response?.data?.message || err.message || 'Failed to load messages.';
        setError(message);
        setThankYouMessages([]);
        setActiveMessage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThankYouMessages();
  }, []);

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
          hour: 'numeric',
          minute: '2-digit',
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
  };

  const openModal = (imageUrl) => {
    setModalImageSrc(imageUrl);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalImageSrc(null);
    document.body.style.overflow = 'auto';
  };


  return (
    <div className="messages-page-container">
      <div className="messages-header">
        <h1>Thank You Messages</h1>
        <p>View appreciation messages from schools you've supported</p>
      </div>

       {error && !isLoading && (
            <div style={{ color: 'red', backgroundColor: '#ffebee', border: '1px solid red', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <strong>Error:</strong> {error}
            </div>
        )}

      <div className="messages-content">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Messages from Schools</h2>
          </div>
          <div className="conversations-list">
            {isLoading ? (
              <div className="loading-state-small">
                <div className="loading-spinner-small"></div>
                <p>Loading messages...</p>
              </div>
            ) : thankYouMessages.length > 0 ? (
              thankYouMessages.map(message => (
                <div
                  key={message.id}
                  className={`conversation-item ${activeMessage?.id === message.id ? 'active' : ''}`}
                  onClick={() => setActiveMessage(message)}
                >
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h3>{message.schoolName}</h3>
                      <span className="conversation-time">
                        {new Date(message.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="conversation-preview">{message.message}</p>
                  </div>
                </div>
              ))
            ) : !error ? (
                 <div className="empty-state-small">
                    <p>You haven't received any thank you messages yet.</p>
                 </div>
            ) : null }
          </div>
        </div>

        <div className="message-content">
            {isLoading && !activeMessage ? (
                <div className="loading-state">
                     <div className="loading-spinner"></div>
                </div>
            ) : !isLoading && activeMessage ? (
            <>
              <div className="message-header">
                <div className="message-header-info">
                  <h2>{activeMessage.schoolName}</h2>
                  {activeMessage.schoolCity && <span className="message-date" style={{marginBottom: '4px'}}>📍 {activeMessage.schoolCity}</span>}
                  <span className="message-date">Sent: {formatDate(activeMessage.date)}</span>
                   {activeMessage.donationSummary && <span className="message-date" style={{marginTop: '4px', fontSize: '12px'}}>Regarding: {activeMessage.donationSummary}</span>}
                </div>
              </div>

              <div className="message-body">
                <div className="thank-you-content">
                  <div className="thank-you-message">
                    <p>{activeMessage.message}</p>
                  </div>

                  {activeMessage.images && activeMessage.images.length > 0 && (
                    <div className="thank-you-images">
                      <h3>Photos from the School</h3>
                      <div className="images-grid">
                        {activeMessage.images.map((image, index) => (
                          <div key={index} className="image-container"
                             onClick={() => openModal(getFullImageUrl(image.url))}
                          >
                            <img src={getFullImageUrl(image.url)} alt={`Thank you from ${activeMessage.schoolName} - ${image.fileName || index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
            ) : !isLoading && !activeMessage && thankYouMessages.length > 0 ? (
                <div className="no-conversation-selected">
                <div className="empty-icon">💌</div>
                <h3>Select a message</h3>
                <p>Choose a thank you message from the list to view details.</p>
                </div>
            ) : null }
        </div>
      </div>

      {modalImageSrc && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeModal}>×</button>
            <img src={modalImageSrc} alt="Full view" />
          </div>
        </div>
      )}

    </div>
  );
};

export default MessagesPage;
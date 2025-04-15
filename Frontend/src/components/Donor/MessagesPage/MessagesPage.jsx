import React, { useState, useEffect } from 'react';
import './MessagesPage.css';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MessagesPage = () => {
  const navigate = useNavigate();
  const [thankYouMessages, setThankYouMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchThankYouMessages = async () => {
      setIsLoading(true);
      try {
        // Simulating API fetch with mock data
        setTimeout(() => {
          const mockMessages = [
            {
              id: 1,
              schoolName: "Ratnapura Central College",
              date: "2025-04-10T14:30:00",
              message: "Thank you for your donation! The books have arrived safely. Our students are thrilled to have new reading materials. Your contribution is making a real difference in our school library and we are all very grateful for your support.",
              images: [
                "/api/placeholder/400/300",
                "/api/placeholder/400/300"
              ]
            },
            {
              id: 2,
              schoolName: "Colombo Primary School",
              date: "2025-04-02T16:45:00",
              message: "We are incredibly grateful for the sports equipment you donated. Our students are already enjoying the new soccer balls and cricket set during PE classes. Your support helps our students stay active and healthy!",
              images: [
                "/api/placeholder/400/300",
                "/api/placeholder/400/300",
                "/api/placeholder/400/300"
              ]
            },
            {
              id: 3,
              schoolName: "Kandy Model School",
              date: "2025-03-28T09:15:00",
              message: "Thank you for donating the science lab equipment. It has enhanced our students' learning experience tremendously. They are now able to conduct practical experiments that were not possible before.",
              images: [
                "/api/placeholder/400/300"
              ]
            }
          ];
          setThankYouMessages(mockMessages);
          setActiveMessage(mockMessages[0]);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching thank you messages:", error);
        setIsLoading(false);
      }
    };

    fetchThankYouMessages();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  return (
    <div className="messages-page-container">
      <div className="messages-header">
        <h1>Thank You Messages</h1>
        <p>View appreciation messages from schools you've supported</p>
      </div>

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
                        {formatDate(message.date)}
                      </span>
                    </div>
                    <p className="conversation-preview">{message.message.substring(0, 80)}...</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-small">
                <p>No thank you messages yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="message-content">
          
          {activeMessage ? (
            <>
              <div className="message-header">
                <div className="message-header-info">
                  <h2>{activeMessage.schoolName}</h2>
                  <span className="message-date">{formatDate(activeMessage.date)}</span>
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
                          <div key={index} className="image-container">
                            <img src={image} alt={`Thank you from ${activeMessage.schoolName} ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-icon">💌</div>
              <h3>Select a message</h3>
              <p>Choose a thank you message from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
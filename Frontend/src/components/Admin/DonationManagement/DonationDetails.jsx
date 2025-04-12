import React from 'react';
import { RiArrowLeftLine, RiTruckLine, RiCalendarLine, RiCheckboxCircleLine } from 'react-icons/ri';
import './DonationDetails.css';

const DonationDetails = ({ donation, onBack }) => {
  // Default donation for demonstration if none is provided
  const donationData = donation || {
    id: 1,
    donor: { 
      name: 'Robert Smith', 
      email: 'robert.smith@email.com',
      phone: '(555) 123-4567'
    },
    school: { 
      name: 'Lincoln High School', 
      location: '123 Education Ave, New York, NY 10001' 
    },
    items: [
      { type: 'Textbooks', quantity: 25 },
      { type: 'Notebooks', quantity: 50 }
    ],
    deliveryMethod: 'Logistic Delivery',
    status: 'In Transit',
    tracking: [
      {
        status: 'Picked Up',
        date: 'Jan 15, 2025',
        time: '8:30 AM',
        description: 'Package picked up from donor location'
      },
      {
        status: 'In Transit',
        date: 'Jan 15, 2025',
        time: '2:45 PM',
        description: 'Package en route to destination'
      }
    ]
  };

  // Get status class based on status value
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return 'edusahasra-status-delivered';
      case 'in transit': return 'edusahasra-status-transit';
      case 'pending': return 'edusahasra-status-pending';
      case 'processing': return 'edusahasra-status-processing';
      default: return '';
    }
  };

  return (
    <div className="edusahasra-donation-management">
      <div className="edusahasra-donation-details-header">
        <button onClick={onBack} className="edusahasra-back-button">
          <RiArrowLeftLine />
          <span>Donation Details</span>
        </button>
      </div>

      <div className="edusahasra-donation-container">
        <div className="edusahasra-donation-details-summary">
          <div className="edusahasra-details-heading">
            <h2>Donation Summary</h2>
            <span className={`edusahasra-status-badge ${getStatusClass(donationData.status)}`}>
              {donationData.status}
            </span>
          </div>

          <div className="edusahasra-details-sections">
            <div className="edusahasra-details-section">
              <div className="edusahasra-donor-details">
                <h3>{donationData.donor.name}</h3>
                <p>{donationData.donor.email}</p>
                <p>{donationData.donor.phone}</p>
              </div>
            </div>

            <div className="edusahasra-details-section">
              <div className="edusahasra-school-details">
                <h3>{donationData.school.name}</h3>
                <p>{donationData.school.location}</p>
                <p>{donationData.deliveryMethod}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="edusahasra-donation-items-section">
          <h3>Donated Items</h3>
          <div className="edusahasra-donation-items-list">
            {donationData.items.map((item, index) => (
              <div key={index} className="edusahasra-donation-item">
                <div className="edusahasra-item-icon">
                  {item.type === 'Textbooks' ? 
                    <span className="edusahasra-icon-textbooks">📚</span> : 
                    <span className="edusahasra-icon-notebooks">📓</span>
                  }
                </div>
                <div className="edusahasra-item-details">
                  <span className="edusahasra-item-name">{item.type}</span>
                  <span className="edusahasra-item-quantity">{item.quantity} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="edusahasra-tracking-section">
          <h3>Tracking Information</h3>
          <div className="edusahasra-tracking-timeline">
            {donationData.tracking.map((event, index) => (
              <div key={index} className="edusahasra-tracking-event">
                <div className="edusahasra-tracking-status">
                  <div className="edusahasra-tracking-icon">
                    {event.status === 'Picked Up' ? 
                      <RiCheckboxCircleLine /> : 
                      <RiTruckLine />
                    }
                  </div>
                  <div className="edusahasra-tracking-status-info">
                    <h4>{event.status}</h4>
                    <div className="edusahasra-tracking-time">
                      <RiCalendarLine />
                      <span>{event.date} - {event.time}</span>
                    </div>
                    <p className="edusahasra-tracking-description">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
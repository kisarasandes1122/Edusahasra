import React, { useState, useEffect } from 'react';
import './MyDonations.css';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchDonations = async () => {
      setIsLoading(true);
      try {
        // Simulating API fetch with mock data
        setTimeout(() => {
          const mockDonations = [
            {
              id: 1,
              schoolName: "Ratnapura Central College",
              date: "2025-04-01",
              items: ["Books", "Stationery"],
              status: "delivered",
              amount: "Rs. 15,000",
              impact: "Helped 45 students"
            },
            {
              id: 2,
              schoolName: "Colombo Primary School",
              date: "2025-03-15",
              items: ["Sports Equipment"],
              status: "in-transit",
              amount: "Rs. 8,500",
              impact: "Will benefit 30 students"
            },
            {
              id: 3,
              schoolName: "Kandy Girls' High School",
              date: "2025-02-22",
              items: ["Science Equipment", "Lab Materials"],
              status: "pending",
              amount: "Rs. 25,000",
              impact: "Will equip the science lab"
            }
          ];
          setDonations(mockDonations);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching donations:", error);
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    return donation.status === filter;
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Get the status text with proper formatting
  const getStatusText = (status) => {
    switch(status) {
      case 'in-transit':
        return 'In Transit';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="donations-page-container">
      <div className="donations-header">
        <h1>My Donations</h1>
        <p className="subtitle">Track and manage your contributions to schools across Sri Lanka</p>
      </div>

      <div className="donations-filter">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Donations
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'in-transit' ? 'active' : ''}`}
            onClick={() => handleFilterChange('in-transit')}
          >
            In Transit
          </button>
          <button 
            className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => handleFilterChange('delivered')}
          >
            Delivered
          </button>
        </div>
      </div>

      <div className="donations-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your donations...</p>
          </div>
        ) : filteredDonations.length > 0 ? (
          filteredDonations.map(donation => (
            <div key={donation.id} className="donation-card">
              <div className="donation-header">
                <h3>{donation.schoolName}</h3>
                <span className={`status-badge ${donation.status}`}>
                  {getStatusText(donation.status)}
                </span>
              </div>
              
              <div className="donation-details">
                <div className="donation-detail">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{new Date(donation.date).toLocaleDateString()}</span>
                </div>
                
                <div className="donation-detail">
                  <span className="detail-label">Donated Items</span>
                  <span className="detail-value">{donation.items.join(", ")}</span>
                </div>
                
                <div className="donation-detail">
                  <span className="detail-label">Value</span>
                  <span className="detail-value">{donation.amount}</span>
                </div>
                
                <div className="donation-detail">
                  <span className="detail-label">Impact</span>
                  <span className="detail-value">{donation.impact}</span>
                </div>
              </div>
              
              <div className="donation-actions">
                <button className="btn-primary">View Details</button>
                {donation.status === 'delivered' && (
                  <button className="btn-secondary">Share Impact</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No donations found</h3>
            <p>You don't have any {filter !== 'all' ? filter : ''} donations yet.</p>
            <a href="/needs" className="btn-primary">Browse School Needs</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDonations;
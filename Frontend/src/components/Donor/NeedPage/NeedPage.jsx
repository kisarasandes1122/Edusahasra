import React from 'react';
import { IoLocationOutline } from 'react-icons/io5';
import { FaRegCheckCircle } from 'react-icons/fa';
import './NeedPage.css';
import img1 from '../../../assets/images/Rural1.webp';
import img2 from '../../../assets/images/Rural2.webp';
import img3 from '../../../assets/images/Rural3.webp';

const NeedPage = () => {
  // Sample data
  const donationItems = [
    { item: 'Notebooks', requested: 100, received: 60, remaining: 40, status: 'In Progress' },
    { item: 'Pen/Pencils', requested: 200, received: 80, remaining: 120, status: 'In Progress' },
    { item: 'School Bags', requested: 50, received: 50, remaining: 0, status: 'FullFilled' }
  ];

  const progressPercentage = 35;

  return (
    <div className="need-container">
      <div className="need-header">
        <div className="need-title-section">
          <h1 className="need-title">Galle Central College</h1>
          <div className="need-location">
            <IoLocationOutline className="location-icon" />
            <span>Galle, Southern Province</span>
          </div>
          <p className="need-description">
            Galle Central School serves over 500 students from diverse backgrounds. We're seeking essential supplies to support our STEM program and basic classroom needs.
          </p>
        </div>
        <div className="donate-btn-wrapper">
          <button className="donate-now-btn">Donate Now</button>
        </div>
      </div>

      <div className="photo-gallery">
        <div className="photo-item">
          <img
            src={img1}
            alt="Classroom with students"
            className="need-photo"
          />
        </div>
        <div className="photo-item">
          <img
            src={img2}
            alt="School yard with students"
            className="need-photo"
          />
        </div>
        <div className="photo-item">
          <img
            src={img3}
            alt="Outdoor classroom"
            className="need-photo"
          />
        </div>
      </div>

      <div className="progress-tracker">
        <div className="progress-header">
          <h3 className="progress-label">Progress</h3>
          <span className="completion-status">{progressPercentage}% Done</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="items-table">
        <div className="table-header">
          <div className="table-cell">Item</div>
          <div className="table-cell">Requested</div>
          <div className="table-cell">Received</div>
          <div className="table-cell">Remaining</div>
          <div className="table-cell">Status</div>
        </div>
        {donationItems.map((item, index) => (
          <div className="table-row" key={index}>
            <div className="table-cell">{item.item}</div>
            <div className="table-cell">{item.requested}</div>
            <div className="table-cell">{item.received}</div>
            <div className="table-cell">{item.remaining}</div>
            <div className="table-cell">
              {item.status === 'FullFilled' ? (
                <span className="status-complete">
                  <FaRegCheckCircle className="check-icon" />
                  {item.status}
                </span>
              ) : (
                <span className="status-pending">{item.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeedPage;
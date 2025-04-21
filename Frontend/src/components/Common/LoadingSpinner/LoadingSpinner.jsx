import React from 'react';
import './LoadingSpinner.css'; // We'll create this CSS file next

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-container"></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
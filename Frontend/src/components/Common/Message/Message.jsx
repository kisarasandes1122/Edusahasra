import React from 'react';
import './Message.css'; // We'll create this CSS file

const Message = ({ variant = 'info', children }) => {
  // variant can be 'info', 'success', 'warning', 'danger'
  return (
    <div className={`message ${variant}`}>
      {children}
    </div>
  );
};

export default Message;
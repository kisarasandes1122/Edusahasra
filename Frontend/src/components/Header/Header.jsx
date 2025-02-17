import React from 'react';
import './Header.css';
import logo from '../../assets/images/Edusahasra.png'; // Assuming you have a logo image in this path

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src={logo} alt="EdukaShare Logo" />
        </div>
        <nav className="nav">
          <ul>
            <li><a href="#donate">Donate</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#impact">Impact</a></li>
          </ul>
        </nav>
        <div className="header-buttons">
          <button className="btn btn-secondary">Start Donate</button>
          <button className="btn btn-primary">Request Donation</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { IoLocationSharp } from 'react-icons/io5';
import { FaShieldAlt, FaHeart, FaHandHolding, FaBook } from 'react-icons/fa';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { RiHandHeartFill } from 'react-icons/ri';
import './WhyTrustUs.css';

const WhyTrustUs = () => {
  const features = [
    {
      icon: <IoLocationSharp />,
      title: "100% Transparent Donations",
      description: "Every donation is tracked from start to finish."
    },
    {
      icon: <BsFillPatchCheckFill />,
      title: "Verified Schools, Real Impact",
      description: "All schools are vetted and verified through official documentation."
    },
    {
      icon: <FaShieldAlt />,
      title: "Your Data is Safe with Us",
      description: "Your privacy is our priority"
    },
    {
      icon: <FaHeart />,
      title: "Making a Real Difference",
      description: "Over 1,000 students empowered with resources"
    }
  ];

  const stats = [
    {
      icon: <FaBook />,
      number: "50+",
      label: "Schools Helped"
    },
    {
      icon: <FaHandHolding />,
      number: "100+",
      label: "Generous Donors"
    },
    {
      icon: <RiHandHeartFill />,
      number: "1000+",
      label: "Donations Delivered"
    }
  ];

  return (
    <div className="section">
        <div className="why-trust-us">
            <h2>Why Trust Us?</h2>
            
            <div className="features-grid">
                {features.map((feature, index) => (
                <div key={index} className="feature-card">
                    <div className="icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                </div>
                ))}
            </div>
        </div>
        
        <div className="stats-container">
            {stats.map((stat, index) => (
            <div key={index} className="stat-card">
                <div className="icon">{stat.icon}</div>
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
            </div>
            ))}
        </div>
        
    </div>
  );
};

export default WhyTrustUs;
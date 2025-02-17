import React from 'react';
import './HowitWorks.css';
import { BiDonateHeart } from 'react-icons/bi';
import { FaSchool } from 'react-icons/fa';

const HowItWorks = () => {
  const donorSteps = [
    {
      title: 'Register & Login',
      description: 'Create an account and Log into your Account'
    },
    {
      title: 'Browse Needs',
      description: 'Explore specific requests (e.g., textbooks, stationery)'
    },
    {
      title: 'Choose & Donate',
      description: 'Select items to donate and Logistic service will come to pick up the donations'
    },
    {
      title: 'Track Donations',
      description: 'Track the status of your donation'
    },
    {
      title: 'Celebrate Impact',
      description: 'Receive impact reports showing how your donation helped'
    }
  ];

  const schoolSteps = [
    {
      title: 'Register & Login',
      description: 'Submit school details and official documents and will take 24-48 hours to verify, active your account then Log into your account'
    },
    {
      title: 'Post Your Needs',
      description: 'List required items and set urgency level'
    },
    {
      title: 'Receive Donations',
      description: 'Get notified when donors support your requests'
    },
    {
      title: 'Track Donations',
      description: 'Track the incoming status of your donation'
    },
    {
      title: 'Share Updates',
      description: 'Post thank-you notes and success stories'
    }
  ];

  return (
    <div className="how-it-works">
      <h1>HOW IT WORKS</h1>
      <div className="workflow-container">
        <div className="workflow-card">
          <div className="card-header">
            <BiDonateHeart className="header-icon" />
            <h2>For Donors</h2>
          </div>
          <div className="steps">
            {donorSteps.map((step, index) => (
              <div className="step" key={index}>
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="action-button">Become a Donor</button>
        </div>

        <div className="workflow-card">
          <div className="card-header">
            <FaSchool className="header-icon" />
            <h2>For Schools/Teachers</h2>
          </div>
          <div className="steps">
            {schoolSteps.map((step, index) => (
              <div className="step" key={index}>
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="action-button">Register Your School</button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
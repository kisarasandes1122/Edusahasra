import React from 'react';
import { Building2, MapPin, Users, List, ArrowRight } from 'lucide-react';
import './SchoolRequests.css';

const SchoolRequests = () => {
  const schoolRequests = [
    {
      id: 1,
      name: 'Galle Central College',
      location: 'Galle, Southern Province',
      studentsInNeed: 200,
      needs: ['Textbooks', 'Pens', 'Pencils', 'Bags','Notebooks','Library Books'],
      progress: 35
    },
    {
      id: 2,
      name: 'Kandy Girls High School',
      location: 'Kandy, Central Province',
      studentsInNeed: 150,
      needs: ['Notebooks', 'Scientific Calculators', 'Art Supplies'],
      progress: 45
    },
    {
      id: 3,
      name: 'Jaffna Hindu College',
      location: 'Jaffna, Northern Province',
      studentsInNeed: 175,
      needs: ['Library Books', 'Sports Equipment', 'Lab Materials'],
      progress: 60
    }
  ];

  return (
    <div className="container">
      <h1 className="title">SCHOOL REQUESTS</h1>
      <p className="subtitle">
        Help these schools provide better education for their students. Every donation makes a difference in shaping young minds
      </p>

      <div className="school-grid">
        {schoolRequests.map((school) => (
          <div key={school.id} className="school-card">
            <div className="school-header">
              <Building2 className="school-card-icon school-card-icon-building" />
              <h2 className="school-name">{school.name}</h2>
            </div>

            <div className="school-info">
              <div className="info-row">
                <MapPin className="school-card-icon" />
                <p>{school.location}</p>
              </div>

              <div className="info-row">
                <Users className="school-card-icon" />
                <p>{school.studentsInNeed} Students in need</p>
              </div>

              <div className="info-row">
                <List className="school-card-icon" />
                <div className="needs-container">
                  <p className="needs-label">Needs:</p>
                  <p className="needs-items">{school.needs.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>Progress</span>
                <span>{school.progress}% Done</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${school.progress}%` }}
                ></div>
              </div>
            </div>

            <button className="donate-button">Donate Now</button>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-button">
          View All Requests
          <ArrowRight className="view-all-icon" />
        </button>
      </div>
    </div>
  );
};

export default SchoolRequests;
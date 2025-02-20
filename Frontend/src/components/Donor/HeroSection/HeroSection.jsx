import React from 'react';
import './HeroSection.css';
import image1 from '../../../assets/images/image1.jpg';
import image2 from '../../../assets/images/image2.webp';
import image3 from '../../../assets/images/image3.jpg';

const HeroSection = () => {
  return (
    <div className="heroSectionContainer">
      <div className="heroBackground"></div>
      <div className="donateButtonFrame"> <a href="/needs" className='donateButtonLink'>
        <div className="donateButtonText">Start Donate</div></a>
      </div>
      <img className="heroImageOne" src={image1} alt="Students 1" />
      <img className="heroImageTwo" src={image2} alt="Students 2" />
      <div className="heroTitleContainer">
        <span>
          <span className="heroTitlePartOne">
            Every Donation Builds a
            <br />
          </span>
          <span className="heroTitlePartTwo">
            Brighter Future for Students
          </span>
        </span>
      </div>
      <div
        className="heroDescription"
      >
        Join EduSahasra to bridge the education gap in rural Sri Lanka. Donate
        supplies or funds directly to schools in need, and track your impact in
        real-time. Together, we can create brighter futures for thousands of
        students.
      </div>
      <img className="heroImageThree" src={image3} alt="Students 3" />
      
    </div>
  );
};

export default HeroSection;
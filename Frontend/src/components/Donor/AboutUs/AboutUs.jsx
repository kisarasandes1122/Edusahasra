import React from 'react';
import './AboutUs.css';
import missionImage from '../../../assets/images/mission.jpg';
import teamImage from '../../../assets/images/team.jpg';

const AboutUs = () => {
  return (
    <div className="aboutUsContainer">
      <div className="aboutUsBackground"></div>
      
      <div className="aboutUsHeader">
        <h1 className="aboutUsTitle">
          <span className="aboutUsTitleLight">About</span>
          <span className="aboutUsTitleBold"> Edusahasra</span>
        </h1>
        <div className="aboutUsSubtitle">
          Connecting donors with schools to build brighter futures
        </div>
      </div>
      
      <section className="aboutUsSection missionSection">
        <div className="sectionContent">
          <h2 className="sectionTitle">Our Mission</h2>
          <p className="sectionText">
            At Edusahasra, we are committed to bridging the educational resource gap in rural Sri Lanka by creating 
            a transparent, efficient connection between generous donors and schools in need. Our name combines "Edu" 
            (education) and "Sahasra" (thousand), representing our goal of empowering thousands of students through 
            improved access to essential learning materials.
          </p>
        </div>
        <div className="sectionImageContainer">
          <img src={missionImage} alt="Students learning" className="sectionImage" />
        </div>
      </section>
      
      <section className="aboutUsSection problemSection">
        <div className="sectionImageContainer">
          <div className="problemCards">
            <div className="problemCard">
              <h3>Resource Scarcity</h3>
              <p>Rural schools lack essential learning materials affecting academic performance</p>
            </div>
            <div className="problemCard">
              <h3>Inefficient Processes</h3>
              <p>Random donations lead to duplication and missed needs</p>
            </div>
            <div className="problemCard">
              <h3>Limited Transparency</h3>
              <p>Donors unable to track impact, schools struggle to prove needs</p>
            </div>
            <div className="problemCard">
              <h3>Verification Issues</h3>
              <p>Lack of proper verification systems for authentic distribution</p>
            </div>
          </div>
        </div>
        <div className="sectionContent">
          <h2 className="sectionTitle">The Problem We're Solving</h2>
          <p className="sectionText">
            Despite Sri Lanka's strong cultural emphasis on education, many rural schools lack basic educational 
            resources. Traditional donation methods are often inefficient, lacking transparency and proper coordination, 
            resulting in wasted resources and unfulfilled needs.
          </p>
        </div>
      </section>
      
      <section className="aboutUsSection solutionSection">
        <div className="sectionContent">
          <h2 className="sectionTitle">Our Solution</h2>
          <p className="sectionText">
            Edusahasra provides a comprehensive platform that transforms the donation process through direct 
            connections, transparency, flexible delivery options, robust verification, and real-time tracking.
          </p>
          <ul className="solutionList">
            <li><span className="highlight">Direct Connection:</span> Schools register, verify identity, and communicate specific needs</li>
            <li><span className="highlight">Transparency:</span> Donors browse needs, select schools, and track donations</li>
            <li><span className="highlight">Flexible Delivery:</span> Options for both logistics-partner and self-delivery</li>
            <li><span className="highlight">Verification:</span> Robust school verification ensuring authenticity</li>
            <li><span className="highlight">Real-Time Tracking:</span> End-to-end visibility of donation status</li>
          </ul>
        </div>
        <div className="sectionImageContainer">
          <div className="processSteps">
            <div className="processStep">
              <div className="stepNumber">1</div>
              <div className="stepText">Schools register and list needs</div>
            </div>
            <div className="processStep">
              <div className="stepNumber">2</div>
              <div className="stepText">Donors browse and select donations</div>
            </div>
            <div className="processStep">
              <div className="stepNumber">3</div>
              <div className="stepText">Choose delivery method</div>
            </div>
            <div className="processStep">
              <div className="stepNumber">4</div>
              <div className="stepText">Track donation in real-time</div>
            </div>
            <div className="processStep">
              <div className="stepNumber">5</div>
              <div className="stepText">Verify delivery and see impact</div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="aboutUsSection teamSection">
        <div className="sectionImageContainer">
          <img src={teamImage} alt="Our team" className="sectionImage teamImage" />
        </div>
        <div className="sectionContent">
          <h2 className="sectionTitle">Our Team</h2>
          <p className="sectionText">
            Edusahasra was founded by Mahamarakkalage Perera, a software engineering student passionate about using 
            technology to address social challenges. Our team consists of dedicated developers, education advocates, 
            and community organizers who believe in the power of education to transform lives.
          </p>
        </div>
      </section>
      
      <section className="aboutUsSection impactSection">
        <h2 className="impactTitle">Impact Goals</h2>
        <div className="impactGoals">
          <div className="impactGoal">
            <div className="impactNumber">70+</div>
            <div className="impactText">Rural schools supported</div>
          </div>
          <div className="impactGoal">
            <div className="impactNumber">1000+</div>
            <div className="impactText">Learning materials distributed</div>
          </div>
          <div className="impactGoal">
            <div className="impactNumber">100%</div>
            <div className="impactText">Transparent donation tracking</div>
          </div>
        </div>
      </section>
      
      <section className="ctaSection">
        <h2 className="ctaTitle">Join Our Mission</h2>
        <p className="ctaText">
          Whether you're a potential donor, a school in need, or a logistics partner, your participation makes our 
          vision possible. Together, we can create brighter futures for thousands of students across rural Sri Lanka.
        </p>
        <div className="ctaButtons">
          <a href="/donate" className="ctaButton donateButton">Start Donating</a>
          <a href="/register" className="ctaButton registerButton">Register School</a>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
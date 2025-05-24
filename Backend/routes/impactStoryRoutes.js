const express = require('express');
const router = express.Router();
const {
  getEligibleDonationsForStories,
  createImpactStory,
  getSchoolImpactStories,
  getAdminImpactStories,
  getImpactStoryById,
  getPublicImpactStories,
  approveImpactStory,
  rejectImpactStory,
  uploadImpactStoryImages
} = require('../controllers/impactStoryController');
const { protectSchool, protectAdmin, attemptAuth } = require('../middleware/authMiddleware');


// === GET Routes (Order matters! Static paths before dynamic ones) ===

// Public list
router.get('/public', getPublicImpactStories);

// School's list
router.get('/my-stories', protectSchool, getSchoolImpactStories);

// School's eligible donations list (PUT THIS BEFORE /:id)
router.get('/eligible-donations', protectSchool, getEligibleDonationsForStories); 

// Admin list
router.get('/admin', protectAdmin, getAdminImpactStories);


router.get('/:id', attemptAuth, getImpactStoryById); 


// === POST/PUT/DELETE Routes ===

// School creates a new impact story (POST) - Requires school authentication
router.post('/', protectSchool, uploadImpactStoryImages, createImpactStory); 

// Admin actions by ID (PUT) - These require ADMIN protection specifically
router.put('/:id/approve', protectAdmin, approveImpactStory);
router.put('/:id/reject', protectAdmin, rejectImpactStory);


module.exports = router;
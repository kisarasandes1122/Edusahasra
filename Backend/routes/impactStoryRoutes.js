// backend/routes/impactStoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getEligibleDonationsForStories,
  createImpactStory,
  getSchoolImpactStories, // Assuming this is a GET route
  getAdminImpactStories,
  getImpactStoryById,
  getPublicImpactStories,
  approveImpactStory,
  rejectImpactStory,
  uploadImpactStoryImages
} = require('../controllers/impactStoryController');
// Import the new attemptAuth middleware
const { protectSchool, protectAdmin, attemptAuth } = require('../middleware/authMiddleware');


// === GET Routes (Order matters! Specific routes before dynamic ones) ===

// Public list
router.get('/public', getPublicImpactStories);

// School's list (Assuming GET)
router.get('/my-stories', protectSchool, getSchoolImpactStories);

// Admin list
router.get('/admin', protectAdmin, getAdminImpactStories);

// Dynamic ID route - Apply attemptAuth middleware
// This route can be accessed by potentially unauthenticated users (for 'Approved' stories),
// or by authenticated Donor, School, or Admin users.
// The controller will check which user type is present (if any) AND the story status
// after attemptAuth has potentially populated req.donor, req.school, or req.admin.
router.get('/:id', attemptAuth, getImpactStoryById); // <<< Apply attemptAuth HERE


// === POST/PUT/DELETE Routes (Order generally matters less if paths are distinct) ===

// School creates a new impact story (POST) - Requires school authentication
router.post('/', protectSchool, uploadImpactStoryImages, createImpactStory); // Add multer here if not in server.js

// Admin actions by ID (PUT) - These require ADMIN protection specifically
router.put('/:id/approve', protectAdmin, approveImpactStory);
router.put('/:id/reject', protectAdmin, rejectImpactStory);


module.exports = router;
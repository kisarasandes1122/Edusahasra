// backend/routes/impactStoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getEligibleDonationsForStories, // Import this controller function
  createImpactStory,
  getSchoolImpactStories,
  getAdminImpactStories,
  getImpactStoryById,
  getPublicImpactStories,
  approveImpactStory,
  rejectImpactStory,
  uploadImpactStoryImages
} = require('../controllers/impactStoryController');
// Import the necessary auth middleware
const { protectSchool, protectAdmin, attemptAuth } = require('../middleware/authMiddleware');


// === GET Routes (Order matters! Static paths before dynamic ones) ===

// Public list
router.get('/public', getPublicImpactStories);

// School's list
router.get('/my-stories', protectSchool, getSchoolImpactStories);

// School's eligible donations list (PUT THIS BEFORE /:id)
router.get('/eligible-donations', protectSchool, getEligibleDonationsForStories); // <<< ADDED & PLACED BEFORE /:id

// Admin list
router.get('/admin', protectAdmin, getAdminImpactStories);

// Dynamic ID route - Apply attemptAuth middleware (PUT THIS AFTER STATIC GET ROUTES)
// This route can be accessed by potentially unauthenticated users (for 'Approved' stories),
// or by authenticated Donor, School, or Admin users.
// The controller will check which user type is present (if any) AND the story status
// after attemptAuth has potentially populated req.donor, req.school, or req.admin.
router.get('/:id', attemptAuth, getImpactStoryById); // <<< Dynamic route placed later


// === POST/PUT/DELETE Routes ===

// School creates a new impact story (POST) - Requires school authentication
router.post('/', protectSchool, uploadImpactStoryImages, createImpactStory); // Add multer here

// Admin actions by ID (PUT) - These require ADMIN protection specifically
router.put('/:id/approve', protectAdmin, approveImpactStory);
router.put('/:id/reject', protectAdmin, rejectImpactStory);

// Optional: Delete route (e.g., by Admin or School)
// router.delete('/:id', protectAdmin, deleteImpactStory); // Example delete route


module.exports = router;
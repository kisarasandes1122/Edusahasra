const express = require('express');
const cors = require('cors');
const path = require('path'); // Added for potential static file serving if needed later
const { connectDB } = require('./config/db');
const donorRoutes = require('./routes/donorRoutes');
const schoolRoutes = require('./routes/schoolRoutes'); // Import school routes
const adminRoutes = require('./routes/adminRoutes');   // Import admin routes
const { errorHandler } = require('./middleware/errorMiddleware');
const { PORT } = require('./config/config');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Routes ---

// Donor Routes
app.use('/api/donors', donorRoutes);

// School Routes
app.use('/api/schools', schoolRoutes); // Add school routes

// Admin Routes
app.use('/api/admin', adminRoutes);   // Add admin routes (using /api/admin as base path based on adminRoutes.js)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running and healthy!' });
});

// Error handler middleware (should be the last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;

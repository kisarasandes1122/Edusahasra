const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const donorRoutes = require('./routes/donorRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const donationRoutes = require('./routes/donationRoutes'); // <<< Import new donation routes
const { errorHandler } = require('./middleware/errorMiddleware');
const { PORT } = require('./config/config');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api/donors', donorRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', donationRequestRoutes); // Routes for *requesting* donations
app.use('/api/donations', donationRoutes); // <<< Add routes for *making/tracking* donations

// Serve uploaded files (ensure 'uploads' directory exists)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running and healthy!' });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
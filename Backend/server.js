// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { PORT, NODE_ENV } = require('./config/config');

// --- Import Routes ---
const donorRoutes = require('./routes/donorRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const donationRoutes = require('./routes/donationRoutes');
const thankYouRoutes = require('./routes/thankYouRoutes');
const impactStoryRoutes = require('./routes/impactStoryRoutes');

// --- Initialize App & DB ---
const app = express();
connectDB();

// --- Core Middlewares ---
app.use(cors()); // Allow cross-origin requests

// --- Body Parsing Middlewares ---
// !! IMPORTANT: These should be placed before routes that need req.body !!
app.use(express.json({ limit: '10mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For parsing application/x-www-form-urlencoded

// --- Static File Serving ---
// Can be placed here or after body parsers
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Mount All API Routes ---
// Now all these routers will have access to parsed req.body for JSON/URL-encoded requests
app.use('/api/donors', donorRoutes);
app.use('/api/schools', schoolRoutes); // This router now gets the parsed body for its JSON routes (like /login)
app.use('/api/admin', adminRoutes);
app.use('/api/requests', donationRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/thankyous', thankYouRoutes);
app.use('/api/impact-stories', impactStoryRoutes);


// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running and healthy!' });
});

// --- Global Error Handler (Should be last middleware) ---
app.use(errorHandler);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
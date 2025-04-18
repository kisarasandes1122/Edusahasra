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

// --- Initialize App & DB ---
const app = express();
connectDB();

// --- Core Middlewares ---
app.use(cors());

// --- Static File Serving ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers that handle multipart/form-data BEFORE global body parsers
app.use('/api/schools', schoolRoutes);

// --- Global Body Parsing Middlewares ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Other API Routes ---
app.use('/api/donors', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', donationRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/thankyous', thankYouRoutes);

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
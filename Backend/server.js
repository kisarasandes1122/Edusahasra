const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const donorRoutes = require('./routes/donorRoutes');
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

// Routes
app.use('/api/donors', donorRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { PORT, NODE_ENV } = require('./config/config');

const donorRoutes = require('./routes/donorRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const donationRoutes = require('./routes/donationRoutes');
const thankYouRoutes = require('./routes/thankYouRoutes');
const impactStoryRoutes = require('./routes/impactStoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes'); 

const app = express();
connectDB();

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin/analytics', analyticsRoutes); 
app.use('/api/admin', adminRoutes); 
app.use('/api/donors', donorRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/requests', donationRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/thankyous', thankYouRoutes);
app.use('/api/impact-stories', impactStoryRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running and healthy!' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
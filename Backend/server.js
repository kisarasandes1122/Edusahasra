const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const donorRoutes = require('./routes/donorRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const donationRoutes = require('./routes/donationRoutes'); 
const thankYouRoutes = require('./routes/thankYouRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { PORT } = require('./config/config');


const app = express();


connectDB();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/donors', donorRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', donationRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/thankyous', thankYouRoutes); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running and healthy!' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
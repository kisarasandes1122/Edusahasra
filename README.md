# Edusahasra

Edusahasra is a comprehensive platform designed to connect schools in need with potential donors. The platform facilitates educational resource donations, allowing schools to request specific resources and donors to contribute directly to these needs. With features like impact stories, thank you notes, and detailed analytics, Edusahasra creates a transparent and meaningful donation experience.

## Project Overview

Edusahasra consists of a full-stack application with separate backend and frontend components:

- **Backend**: Node.js/Express API with MongoDB database
- **Frontend**: React application built with Vite

The platform supports multiple user roles (donors, schools, and administrators) and includes multilingual support (English and Sinhala), interactive maps for school locations, donation tracking, and impact measurement.

## Features

### For Schools
- School registration and profile management
- Donation request creation and management
- Thank you note sending to donors
- Impact story creation to showcase donation outcomes
- Donation tracking and history viewing

### For Donors
- Browse schools in need and their donation requests
- Make donations to specific school requests
- View donation history and impact
- Receive thank you notes and impact stories
- Interactive map to locate schools

### For Administrators
- User management (schools and donors)
- Donation request approval and monitoring
- Analytics dashboard with donation statistics
- Content moderation for impact stories and thank you notes

### Technical Features
- RESTful API architecture
- JWT authentication and authorization
- Multilingual support (i18n)
- Interactive maps using Leaflet
- Data visualization with Recharts
- Responsive design for all device types

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **File Handling**: Multer
- **Email**: Nodemailer
- **PDF Generation**: pdfmake
- **Validation**: validator

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Components**: Bootstrap, React Icons, Lucide React
- **Maps**: Leaflet, React Leaflet
- **Charts**: Recharts
- **Internationalization**: i18next, react-i18next
- **Animation**: Framer Motion

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local instance or Atlas account)

### Backend Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Edusahasra.git
   cd Edusahasra/Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the Backend directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=30d
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

4. Start the backend server:
   ```
   npm start
   ```
   The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the Frontend directory:
   ```
   cd ../Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the Frontend directory with the following variables:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm run dev
   ```
   The application will be available at http://localhost:5173

## Project Structure

### Backend Structure
```
Backend/
├── config/           # Configuration files and database connection
├── controllers/      # Route controllers for handling API requests
├── middleware/       # Custom middleware (auth, error handling, etc.)
├── models/           # Mongoose models for MongoDB
├── routes/           # API route definitions
├── uploads/          # Storage for uploaded files
├── utils/            # Utility functions
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
└── server.js         # Main application entry point
```

### Frontend Structure
```
Frontend/
├── public/           # Static files
├── src/
│   ├── assets/       # Images, fonts, and other static assets
│   ├── components/   # React components
│   │   ├── Admin/    # Admin-specific components
│   │   ├── Donor/    # Donor-specific components
│   │   ├── School/   # School-specific components
│   │   └── ...       # Shared components
│   ├── translations/ # i18n translation files
│   ├── App.jsx       # Main application component
│   ├── api.js        # API service functions
│   └── main.jsx      # Application entry point
├── .env              # Environment variables
├── index.html        # HTML template
├── package.json      # Project dependencies and scripts
└── vite.config.js    # Vite configuration
```

## API Endpoints

### Authentication
- `POST /api/donors/register` - Register a new donor
- `POST /api/donors/login` - Donor login
- `POST /api/schools/register` - Register a new school
- `POST /api/schools/login` - School login
- `POST /api/admin/login` - Admin login

### Schools
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school by ID
- `PUT /api/schools/:id` - Update school profile
- `DELETE /api/schools/:id` - Delete school account

### Donation Requests
- `POST /api/requests` - Create a donation request
- `GET /api/requests` - Get all donation requests
- `GET /api/requests/:id` - Get donation request by ID
- `PUT /api/requests/:id` - Update donation request
- `DELETE /api/requests/:id` - Delete donation request

### Donations
- `POST /api/donations` - Create a donation
- `GET /api/donations` - Get all donations
- `GET /api/donations/:id` - Get donation by ID

### Thank You Notes
- `POST /api/thankyous` - Send a thank you note
- `GET /api/thankyous` - Get all thank you notes

### Impact Stories
- `POST /api/impact-stories` - Create an impact story
- `GET /api/impact-stories` - Get all impact stories
- `GET /api/impact-stories/:id` - Get impact story by ID

### Analytics
- `GET /api/admin/analytics/donations` - Get donation analytics
- `GET /api/admin/analytics/schools` - Get school analytics
- `GET /api/admin/analytics/donors` - Get donor analytics

## Deployment

### Backend Deployment
1. Ensure your MongoDB connection string is set to your production database
2. Set NODE_ENV to 'production' in your .env file
3. Deploy to your preferred hosting service (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment
1. Build the production version:
   ```
   npm run build
   ```
2. Deploy the contents of the `dist` directory to your web hosting service

## Contributing

Contributions to Edusahasra are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All the schools and donors who participate in the platform
- The development team for their dedication to educational equity
- Open source libraries and frameworks that made this project possible

## Contact

For questions or support, please contact the Edusahasra team at support@edusahasra.lk

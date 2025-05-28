# 🎓 Edusahasra
### *Connecting Schools in Need with Generous Donors*

![Edusahasra](https://github.com/user-attachments/assets/295b2ab0-2937-464a-a728-e05ed8b7e4fa)


[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 📖 About Edusahasra

**Edusahasra** is a comprehensive platform designed to bridge the gap between schools in need and potential donors. Our mission is to facilitate educational resource donations, creating a transparent and meaningful donation experience that directly impacts students' learning opportunities.

The platform enables schools to request specific resources while allowing donors to contribute directly to these educational needs. With features like impact stories, thank you notes, and detailed analytics, Edusahasra ensures every donation creates visible, measurable change.

---

## ✨ Key Features

### 🏫 **For Schools**
- 📝 **School Registration & Profile Management** - Create comprehensive school profiles
- 📋 **Donation Request Management** - Submit detailed requests for educational resources
- 💌 **Thank You Note System** - Send personalized appreciation messages to donors
- 📊 **Impact Story Creation** - Showcase how donations have made a difference
- 📈 **Donation Tracking** - Monitor all received donations and their status

### 💝 **For Donors**
- 🔍 **Browse & Discover** - Explore schools and their specific resource needs
- 💳 **Secure Donations** - Make contributions to specific school requests
- 📊 **Impact Dashboard** - View donation history and real-time impact
- 🗺️ **Interactive School Map** - Locate schools geographically using Leaflet maps
- 📬 **Receive Updates** - Get thank you notes and impact stories from beneficiaries

### 👨‍💼 **For Administrators**
- 👥 **User Management** - Oversee schools and donors on the platform
- ✅ **Request Approval** - Monitor and approve donation requests
- 📊 **Analytics Dashboard** - Comprehensive donation statistics and insights
- 🛡️ **Content Moderation** - Review impact stories and thank you notes

### 🛠️ **Technical Features**
- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 🌍 **Multilingual Support** - English and Sinhala language options
- 📱 **Responsive Design** - Optimized for all device types
- 🗺️ **Interactive Maps** - Powered by Leaflet for location visualization
- 📊 **Data Visualization** - Charts and graphs using Recharts
- ⚡ **Real-time Updates** - Live donation and impact tracking

---

## 🏗️ Technology Stack

<table>
<tr>
<td>

### 🖥️ **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer
- **Email Service**: Nodemailer
- **PDF Generation**: pdfmake
- **Validation**: validator
- **CORS**: cors

</td>
<td>

### 🎨 **Frontend**
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Framework**: Bootstrap 5
- **Icons**: React Icons + Lucide React
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **Animation**: Framer Motion
- **i18n**: react-i18next

</td>
</tr>
</table>

---

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local instance or MongoDB Atlas)

### ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kisarasandes1122/Edusahasra.git
   cd Edusahasra
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 🔧 Environment Configuration

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

<details>
<summary><strong>📂 Backend Structure</strong></summary>

```
Backend/
├── 📁 config/           # Database configuration
├── 📁 controllers/      # API route controllers
├── 📁 middleware/       # Custom middleware (auth, validation, etc.)
├── 📁 models/           # Mongoose data models
├── 📁 routes/           # API route definitions
├── 📁 uploads/          # File storage directory
├── 📁 utils/            # Utility functions
├── 📁 fonts/            # PDF font files
├── 📄 server.js         # Application entry point
├── 📄 package.json      # Dependencies and scripts
└── 📄 .env              # Environment variables
```
</details>

<details>
<summary><strong>📂 Frontend Structure</strong></summary>

```
Frontend/
├── 📁 public/           # Static assets
├── 📁 src/
│   ├── 📁 assets/       # Images, fonts, static files
│   ├── 📁 components/   # React components
│   │   ├── 📁 Admin/    # Admin dashboard components
│   │   ├── 📁 Donor/    # Donor interface components
│   │   ├── 📁 School/   # School management components
│   │   ├── 📁 Common/   # Shared components
│   │   └── 📁 LanguageSelector/ # i18n components
│   ├── 📁 translations/ # Localization files
│   ├── 📄 App.jsx       # Main app component
│   ├── 📄 api.js        # API service layer
│   └── 📄 main.jsx      # React app entry point
├── 📄 index.html        # HTML template
├── 📄 package.json      # Dependencies and scripts
├── 📄 vite.config.js    # Vite configuration
└── 📄 .env              # Environment variables
```
</details>

---

## 🔌 API Documentation

<details>
<summary><strong>🔐 Authentication Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donors/register` | Register new donor |
| POST | `/api/donors/login` | Donor authentication |
| POST | `/api/schools/register` | Register new school |
| POST | `/api/schools/login` | School authentication |
| POST | `/api/admin/login` | Admin authentication |
</details>

<details>
<summary><strong>🏫 School Management</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schools` | Retrieve all schools |
| GET | `/api/schools/:id` | Get specific school |
| PUT | `/api/schools/:id` | Update school profile |
| DELETE | `/api/schools/:id` | Delete school account |
</details>

<details>
<summary><strong>📋 Donation Requests</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create donation request |
| GET | `/api/requests` | Get all requests |
| GET | `/api/requests/:id` | Get specific request |
| PUT | `/api/requests/:id` | Update request |
| DELETE | `/api/requests/:id` | Delete request |
</details>

<details>
<summary><strong>💝 Donations & Impact</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donations` | Process donation |
| GET | `/api/donations` | Get donation history |
| POST | `/api/thankyous` | Send thank you note |
| GET | `/api/thankyous` | Get all thank you notes |
| POST | `/api/impact-stories` | Create impact story |
| GET | `/api/impact-stories` | Get impact stories |
</details>

<details>
<summary><strong>📊 Analytics (Admin)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/donations` | Donation statistics |
| GET | `/api/admin/analytics/schools` | School analytics |
| GET | `/api/admin/analytics/donors` | Donor insights |
</details>

---

## 🎯 Usage Examples

### Creating a Donation Request (School)
```javascript
const donationRequest = {
  title: "Textbooks for Grade 10 Mathematics",
  description: "We need 30 mathematics textbooks for our students",
  amount: 15000,
  category: "Books",
  urgency: "High"
};

// API call
await api.post('/requests', donationRequest);
```

### Making a Donation (Donor)
```javascript
const donation = {
  requestId: "req_123456789",
  amount: 5000,
  message: "Happy to help with your educational needs!"
};

// API call
await api.post('/donations', donation);
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork** the repository
2. **🌟 Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **💾 Commit** your changes: `git commit -m 'Add amazing feature'`
4. **📤 Push** to the branch: `git push origin feature/amazing-feature`
5. **🔄 Open** a Pull Request

### 📝 Contribution Guidelines
- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design principles

---

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/kisarasandes1122/Edusahasra)
![GitHub last commit](https://img.shields.io/github/last-commit/kisarasandes1122/Edusahasra)
![GitHub issues](https://img.shields.io/github/issues/kisarasandes1122/Edusahasra)
![GitHub pull requests](https://img.shields.io/github/issues-pr/kisarasandes1122/Edusahasra)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- 🏫 **Schools and educators** who inspire this platform
- 💝 **Generous donors** who make education accessible
- 👨‍💻 **Development team** committed to educational equity
- 🌟 **Open source community** for amazing tools and libraries

---

## 📞 Contact & Support

- 📧 **Email**: donotreply.edusahasra@gmail.com

---

<div align="center">
  <p><strong>Made with ❤️ for educational equity in Sri Lanka</strong></p>
  <p><em>"Every donation creates a ripple of knowledge that transforms lives"</em></p>
</div>

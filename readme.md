# 🏛️ Municipal Complaint Management System

A comprehensive web application for managing municipal complaints with role-based access control, AI-powered categorization, and automated officer assignment.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### 👥 User Management
- **Multi-role System**: Citizen, Officer, and Admin roles
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-based Access Control**: Different permissions for each user type

### 📝 Complaint Management
- **Smart Submission**: Citizens can submit complaints with title, description, and location
- **AI-Powered Categorization**: Google Gemini AI automatically categorizes and prioritizes complaints
- **Auto-Assignment**: Complaints are automatically assigned to officers based on specialization and workload
- **Status Tracking**: Real-time status updates (Pending, In Progress, Resolved, Rejected)

### 🎯 Role-Specific Features

#### 👨‍💼 Citizens
- Register and login to the system
- Submit new complaints
- View their complaint history and status
- Track complaint progress

#### 👮 Officers
- View assigned complaints
- Update complaint status with remarks
- Manage complaint resolution process

#### 👑 Admins
- Full system administration
- Manage users (citizens and officers)
- Assign complaints manually
- View system-wide statistics

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Google Gemini AI** - Complaint categorization

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Development Tools
- **Nodemon** - Backend auto-restart
- **ESLint** - Code linting
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
municipal-complaint-portal/
├── backend/                    # Express.js backend
│   ├── config/
│   │   ├── db.js              # Database configuration
│   │   └── constants/
│   │       ├── roles.js       # Role definitions
│   │       └── statuses.js    # Status definitions
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── officerController.js
│   │   └── complaintController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── officerRoutes.js
│   │   └── complaintRoutes.js
│   ├── Server.js              # Main server file
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page components
│   │   ├── config/
│   │   │   └── api.js         # API configuration
│   │   ├── constants/         # Frontend constants
│   │   └── main.jsx           # App entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env                   # Frontend env vars
├── testing/                   # Test server
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd municipal-complaint-portal
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Install testing dependencies** (optional)
   ```bash
   cd ../testing
   npm install
   ```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=municipal_complaint_portal

# Server Configuration
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES=7d

# AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key-here
```

### Frontend Configuration

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 🗄️ Database Setup

1. **Create MySQL database**
   ```sql
   CREATE DATABASE municipal_complaint_portal;
   ```

2. **Run the database schema**
   ```sql
   -- Create users table
   CREATE TABLE users (
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     specialization VARCHAR(50) DEFAULT 'General',
     PRIMARY KEY (id)
   );

   -- Create roles table
   CREATE TABLE roles (
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL UNIQUE,
     PRIMARY KEY (id)
   );

   -- Create user_roles table
   CREATE TABLE user_roles (
     user_id INT NOT NULL,
     role_id INT NOT NULL,
     PRIMARY KEY (user_id, role_id),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
   );

   -- Create complaints table
   CREATE TABLE complaints (
     id INT NOT NULL AUTO_INCREMENT,
     user_id INT NOT NULL,
     title VARCHAR(255) NOT NULL,
     description TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     assigned_officer_id INT,
     category VARCHAR(100),
     priority VARCHAR(50),
     summary VARCHAR(500),
     location VARCHAR(255),
     status VARCHAR(100) DEFAULT 'pending',
     PRIMARY KEY (id),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL
   );
   ```

3. **Insert default roles**
   ```sql
   INSERT INTO roles (name) VALUES ('admin'), ('officer'), ('citizen');
   ```

## ▶️ Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   # or for development with auto-restart
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Complaint Endpoints

#### Submit Complaint (Citizens Only)
```http
POST /complaints/submit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Water Supply Issue",
  "description": "No water for 2 days",
  "location": "Main Street, Block A"
}
```

#### Get My Complaints (Citizens Only)
```http
GET /complaints/my
Authorization: Bearer <jwt_token>
```

#### Get Assigned Complaints (Officers Only)
```http
GET /officer/complaints
Authorization: Bearer <jwt_token>
```

#### Update Complaint Status (Officers Only)
```http
PUT /officer/complaints/:id/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "in-progress",
  "remarks": "Team dispatched to investigate"
}
```

### Admin Endpoints

#### Get All Users
```http
GET /admin/users
Authorization: Bearer <admin_jwt_token>
```

#### Assign Complaint to Officer
```http
PUT /admin/complaints/:id/assign
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "officerId": 2
}
```

## 🧪 Testing

### API Testing

1. **Start the test server**
   ```bash
   cd testing
   npm start
   ```

2. **Test endpoints using tools like:**
   - Postman
   - Insomnia
   - cURL commands
   - Thunder Client (VS Code extension)

### Sample Test Data

**Register a test user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

**Login and get token:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Submit a complaint:**
```bash
curl -X POST http://localhost:3000/complaints/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Street Light Issue","description":"Lights not working","location":"Oak Avenue"}'
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files using nginx or Apache
3. Configure API proxy for production API URL

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Akash** - *Initial work* - [Your GitHub Profile](https://github.com/akashakula327)

## 🙏 Acknowledgments

- Google Gemini AI for complaint categorization
- Material-UI for the beautiful UI components
- Express.js community for the robust framework
- All contributors and testers

---

**Note**: This is a comprehensive municipal complaint management system designed to streamline citizen-government communication and improve service delivery.
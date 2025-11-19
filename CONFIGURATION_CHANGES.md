# Configuration Changes - Removing Hardcoding

This document summarizes the changes made to remove hardcoded values from the project.

## Backend Changes

### 1. Environment Variables (`.env`)
- Created `backend/.env` file with:
  - Database configuration (host, user, password, database name)
  - Server port
  - JWT secret and expiration
  - API base URL
  - Gemini API key (optional)

### 2. Configuration Files
- **`backend/config/db.js`**: Now uses environment variables from `.env`
- **`backend/Server.js`**: Port now comes from `process.env.PORT`

### 3. Constants Files
- **`backend/constants/roles.js`**: Centralized role definitions (ADMIN, OFFICER, CITIZEN)
- **`backend/constants/statuses.js`**: Centralized status definitions (PENDING, IN_PROGRESS, RESOLVED, REJECTED)

### 4. Updated Controllers
- **`backend/controllers/adminController.js`**: Uses ROLES and STATUS constants
- **`backend/controllers/officerController.js`**: Uses STATUS constants
- **`backend/controllers/authController.js`**: Uses ROLES constants

## Frontend Changes

### 1. API Configuration
- **`frontend/src/config/api.js`**: Centralized API endpoints
  - Uses `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:3000`)
  - All endpoints defined in `API_ENDPOINTS` object

### 2. Constants Files
- **`frontend/src/constants/roles.js`**: Role constants (ADMIN, OFFICER, CITIZEN)
- **`frontend/src/constants/statuses.js`**: Status constants with backend mapping

### 3. Updated Components
- **`frontend/src/contexts/AuthContext.jsx`**: Uses `API_ENDPOINTS`
- **`frontend/src/contexts/ComplaintContext.jsx`**: Uses `API_ENDPOINTS`, `ROLES`, and `STATUS`
- **`frontend/src/pages/Dashboard.jsx`**: Uses `ROLES` and `STATUS`
- **`frontend/src/pages/ManageOfficers.jsx`**: Uses `API_ENDPOINTS` and `ROLES`
- **`frontend/src/pages/ManageCitizens.jsx`**: Uses `API_ENDPOINTS` and `ROLES`

## Environment Variables Setup

### Backend
Create a `.env` file in the `backend` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=municipal_complaint_portal
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES=7d
```

### Frontend
Create a `.env` file in the `frontend` directory (optional):
```env
VITE_API_BASE_URL=http://localhost:3000
```

## Benefits

1. **Easier Configuration**: Change API URLs, database settings, etc. without modifying code
2. **Environment-Specific**: Different settings for development, staging, and production
3. **Security**: Sensitive data (passwords, secrets) stored in environment variables
4. **Maintainability**: Centralized constants make it easier to update values
5. **Type Safety**: Constants prevent typos and ensure consistency

## Migration Notes

- All hardcoded API URLs replaced with `API_ENDPOINTS` references
- All hardcoded role strings replaced with `ROLES` constants
- All hardcoded status strings replaced with `STATUS` constants
- Database credentials moved to environment variables
- Server port configurable via environment variable


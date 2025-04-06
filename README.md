# ThiQaX - Trust-Based Recruitment Platform

![ThiQaX Logo](https://via.placeholder.com/200x60?text=ThiQaX)

A blockchain-powered recruitment platform building trust between Kenyan job seekers and Middle Eastern employers through transparent verification, secure payments, and digital identity authentication.

## 🌟 Overview

ThiQaX (pronounced "thika-x", from the Arabic word "thiqa" meaning "trust") addresses the trust deficit in Middle Eastern job recruitment by implementing:

- **Information Authentication**: Blockchain-verified document validation
- **Transparent Transactions**: Escrow-based payment system
- **Digital Identity Verification**: Secure KYC processes
- **User-Friendly Experience**: Mobile-first design for Kenyan Gen Z job seekers

## 🏗️ Architecture

The platform follows a modern architecture with:

- **RESTful API Backend**: Node.js with Express
- **React Frontend**: Component-based UI with Material-UI
- **MongoDB Database**: Document-oriented data storage
- **JWT Authentication**: Secure token-based authentication

## 💻 Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Winston for logging
- Express Validator for input validation
- Swagger for API documentation

### Frontend
- React.js
- Material-UI
- React Router
- Redux Toolkit for state management
- Formik & Yup for form validation
- Axios for API communication

## 📁 Project Structure

The project follows a monorepo structure:

```
ThiQaX/
├── src/                  <- Backend source code
│   ├── config/           <- Configuration files
│   ├── controllers/      <- API controllers
│   ├── middleware/       <- Express middleware
│   ├── models/           <- Mongoose data models
│   ├── routes/           <- API routes
│   ├── services/         <- Business logic services
│   ├── utils/            <- Utility functions
│   ├── integration/      <- System integration services 
│   ├── app.js            <- Express application
│   └── server.js         <- Server entry point
├── client/               <- Frontend source code
│   ├── src/              
│   │   ├── components/   <- Reusable UI components
│   │   ├── pages/        <- Page components
│   │   ├── services/     <- API service connectors
│   │   ├── store/        <- Redux state management
│   │   ├── utils/        <- Utility functions
│   │   ├── hooks/        <- Custom React hooks
│   │   ├── assets/       <- Static assets
│   │   ├── App.jsx       <- Main application component
│   │   └── index.js      <- Entry point
│   └── package.json      <- Frontend dependencies
├── tests/                <- Backend test files
├── uploads/              <- Document upload directory
├── logs/                 <- Application logs
├── package.json          <- Backend dependencies
└── README.md             <- This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.x or later)
- MongoDB (v4.4 or later)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mutawai/ThiQaX.git
   cd ThiQaX
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

5. **Start the development servers**
   ```bash
   # Start backend (from project root)
   npm run dev
   
   # Start frontend (in another terminal)
   cd client
   npm start
   ```

6. **Access the application**
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - Frontend: http://localhost:3000

## 🛠️ Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `development` - Integration branch for features
- `feature/[feature-name]` - Feature branches
- `bugfix/[bug-name]` - Bug fix branches

### Commit Message Format

We follow the conventional commits specification:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

### Pull Request Process

1. Create a branch from `development`
2. Implement your changes
3. Ensure code passes linting and tests
4. Submit a PR to the `development` branch
5. Request a review
6. Address feedback

## 🧪 Testing

The project implements comprehensive testing:

```bash
# Run all backend tests
npm test

# Run frontend tests
cd client
npm test
```

Test categories:
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and service interactions
- **E2E Tests**: Complete user flows

## 📜 API Documentation

API documentation is available via Swagger UI at `/api-docs` when the server is running.

Key API endpoints:
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/users` - User management
- `/api/v1/profiles` - Profile management
- `/api/v1/jobs` - Job listings
- `/api/v1/applications` - Job applications
- `/api/v1/documents` - Document verification

## 📋 Features

### Core Features
- User authentication and authorization
- Profile management with KYC verification
- Document upload and verification
- Job posting and application
- Application tracking
- Notification system

### Upcoming Features (Phase 2)
- Blockchain-based verification certificates
- Escrow payment system
- AI-powered document verification
- Mobile application
- Real-time messaging

## 🔑 Security Measures

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting for API endpoints
- CORS protection
- Secure file upload handling

## 📞 Contact

Have questions about ThiQaX? Reach out to us:

- **Phone**: +254100851004
- **Email**: scribemosaic@gmail.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Mutawai Team

---

© 2025 ThiQaX. All rights reserved.

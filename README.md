# ThiQaX Platform

ThiQaX is a trust-based recruitment platform designed to address the trust deficit in Middle Eastern job recruitment. The platform ensures transparency by authenticating information, securing financial transactions, and building trust among recruiters, job seekers, and sponsors through blockchain, AI, and digital identity verification.

## Project Overview

ThiQaX (derived from "thiqa" - Arabic for "trust") provides:

- **Verified Information**: Blockchain-based verification of documents and credentials
- **Secure Transactions**: Escrow-based payment system with transparent money flow
- **Digital Identity**: KYC-based identity verification for all platform users
- **Automated Resolution**: Smart dispute resolution to mediate conflicts
- **Mobile-First Experience**: Intuitive interface designed for Kenyan Gen Z job seekers

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT with refresh tokens
- **File Management**: Multer for document uploads
- **Documentation**: Swagger UI
- **Testing**: Jest, Supertest, MongoDB Memory Server

### Frontend
- **Framework**: React with React Router
- **State Management**: Redux with Redux Toolkit
- **UI Components**: Material UI
- **Form Handling**: Formik with Yup validation
- **API Integration**: Axios
- **Testing**: React Testing Library, Jest

## Features

### Core Platform Features
- **User Authentication**: Secure login, registration, email verification
- **Dashboard**: Role-specific interfaces for job seekers, agents, and admins
- **Document Management**: Upload, verification, and expiration tracking
- **Job Management**: Posting, search, and application tracking
- **Profile Management**: User profiles with verification status
- **Notification System**: Real-time updates for application status

### Phase 2 Features (Upcoming)
- **Payment & Escrow**: Secure financial transactions
- **Blockchain Verification**: Immutable verification records
- **AI Verification**: Automated document and fraud detection
- **Advanced Messaging**: Real-time communication between parties

## Getting Started

### Prerequisites
- Node.js (v16.x or later)
- MongoDB (v4.x or later)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/MutawaiTrust/thiqax.git
   cd thiqax
   ```

2. Install backend dependencies
   ```
   npm install
   ```

3. Install frontend dependencies
   ```
   cd client
   npm install
   cd ..
   ```

4. Set up environment variables
   ```
   cp .env.example .env
   cp client/.env.example client/.env
   ```
   Update the variables in both `.env` files with your configuration

5. Start development servers
   ```
   # In one terminal (backend)
   npm run dev
   
   # In another terminal (frontend)
   cd client
   npm start
   ```

6. Access the application
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:5000/api-docs

## Project Structure

```
thiqax/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets
│   └── src/                    # React source code
│       ├── components/         # Reusable UI components
│       ├── pages/              # Page components
│       ├── store/              # Redux store
│       ├── services/           # API services
│       └── utils/              # Utility functions
├── src/                        # Backend source code
│   ├── config/                 # Configuration files
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Express middleware
│   ├── models/                 # MongoDB models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   └── utils/                  # Utility functions
├── tests/                      # Test files
├── uploads/                    # File upload directory
└── logs/                       # Application logs
```

## Testing

Run backend tests:
```
npm test
```

Run frontend tests:
```
cd client
npm test
```

Generate test coverage:
```
npm run test:coverage
```

## Deployment

The application is designed for deployment on modern cloud platforms:

1. **Backend**: Deploy to Node.js supporting services like AWS Elastic Beanstalk, Heroku, or DigitalOcean
2. **Frontend**: Deploy to static hosting services like Netlify, Vercel, or AWS S3
3. **Database**: Use MongoDB Atlas for database hosting
4. **File Storage**: Use AWS S3 or similar for document storage

Detailed deployment instructions can be found in the `deployment` directory.

## Contributing

1. Create a feature branch
2. Commit your changes following conventional commits format
3. Push to your branch
4. Open a pull request

Please ensure your code passes all tests and linting checks before submitting a pull request.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Acknowledgments

- Mutawai Agencies Ltd. for project sponsorship and vision
- Project development team for their contributions

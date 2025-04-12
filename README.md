# ThiQaX Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-yellow)
![License](https://img.shields.io/badge/license-Proprietary-red)

> *Building trust in recruitment through blockchain, AI, and digital identity verification*

ThiQaX is a trust-based recruitment platform designed to address the trust deficit in Middle Eastern job recruitment. The platform ensures transparency by authenticating information, securing financial transactions, and building trust among recruiters, job seekers, and sponsors through blockchain, AI, and digital identity verification.

<p align="center">
  <img src="/api/placeholder/800/300" alt="ThiQaX Platform" />
</p>

## 📌 Project Overview

ThiQaX (derived from "thiqa" - Arabic for "trust") provides:

- **Verified Information**: Blockchain-based verification of documents and credentials
- **Secure Transactions**: Escrow-based payment system with transparent money flow
- **Digital Identity**: KYC-based identity verification for all platform users
- **Automated Resolution**: Smart dispute resolution to mediate conflicts
- **Mobile-First Experience**: Intuitive interface designed for Kenyan Gen Z job seekers

## 🌟 Key Features

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

## 🏗️ Architecture

ThiQaX follows a modern microservices architecture with separate frontend and backend components:

<p align="center">
  <img src="/api/placeholder/800/400" alt="ThiQaX Architecture" />
</p>

### Infrastructure Components

The platform infrastructure consists of 10 core components:

1. ✅ **Environment Configuration Management**: Environment variables and settings
2. ✅ **Database Management**: MongoDB setup, backup, and maintenance
3. ✅ **SSL Certificate Management**: HTTPS and security certificates
4. ✅ **ELK Stack Configuration**: Centralized logging with Elasticsearch, Logstash, and Kibana
5. ✅ **Deployment Automation**: CI/CD pipelines and deployment scripts
6. ✅ **Performance and Monitoring**: Prometheus, Grafana, and custom metrics
7. ✅ **Security Management**: Authentication, authorization, and security scans
8. ✅ **CI/CD Integration**: GitHub Actions workflows and Docker containerization
9. ✅ **Documentation**: Comprehensive project documentation and guides
10. ⏳ **Testing Framework**: Automated testing infrastructure (coming soon)

For detailed infrastructure documentation, refer to the [documentation section](#📚-documentation).

## 💻 Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT with refresh tokens
- **File Management**: Multer for document uploads
- **Documentation**: Swagger UI
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **Infrastructure**: Docker, Nginx, ELK Stack, Prometheus

### Frontend
- **Framework**: React with React Router
- **State Management**: Redux with Redux Toolkit
- **UI Components**: Material UI
- **Form Handling**: Formik with Yup validation
- **API Integration**: Axios
- **Testing**: React Testing Library, Jest

## 🚀 Quick Start

Get ThiQaX running in under 5 minutes:

```bash
# Clone the repository
git clone https://github.com/MutawaiTrust/thiqax.git

# Setup with the quick start script
cd thiqax
./scripts/quickstart.sh

# Access the application
# Backend API: http://localhost:5000
# Frontend: http://localhost:3000
# API Documentation: http://localhost:5000/api-docs
```

## 📋 Getting Started

### Prerequisites
- Node.js (v16.x or later)
- MongoDB (v4.x or later)
- npm or yarn
- Docker and Docker Compose (for infrastructure deployment)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MutawaiTrust/thiqax.git
   cd thiqax
   ```

2. Install backend dependencies
   ```bash
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd client
   npm install
   cd ..
   ```

4. Set up environment variables
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   ```
   Update the variables in both `.env` files with your configuration

5. Start development servers
   ```bash
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

### Environment Setup

The application requires the following environment variables:

#### Backend
- `NODE_ENV` - Environment (development, test, production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `SMTP_HOST` - SMTP server for emails
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `AWS_S3_BUCKET` - S3 bucket for file storage
- `AWS_ACCESS_KEY` - AWS access key
- `AWS_SECRET_KEY` - AWS secret key

#### Frontend
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_GOOGLE_MAPS_KEY` - Google Maps API key

## 📁 Project Structure

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
├── logs/                       # Application logs
├── docs/                       # Documentation files
├── scripts/                    # Utility scripts
└── infrastructure/             # Infrastructure components
    ├── docker/                 # Docker configurations
    ├── nginx/                  # Nginx configurations
    ├── elk/                    # ELK Stack configurations
    ├── monitoring/             # Prometheus and Grafana
    └── scripts/                # Infrastructure scripts
```

## 🧪 Testing

Run backend tests:
```bash
npm test
```

Run frontend tests:
```bash
cd client
npm test
```

Generate test coverage:
```bash
npm run test:coverage
```

### End-to-End Testing

Run Cypress E2E tests:
```bash
npm run test:e2e
```

## 📚 Documentation

ThiQaX includes comprehensive documentation for all aspects of the platform:

- [Installation Guide](./INSTALL.md) - Detailed installation instructions
- [Configuration Guide](./CONFIG.md) - Configuration reference
- [API Documentation](./API.md) - API endpoints reference
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Deployment Guide](./DEPLOYMENT.md) - Deployment procedures
- [Maintenance Guide](./MAINTENANCE.md) - Maintenance procedures

### API Endpoints

Key API endpoints include:

- **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- **Users**: `/api/users`, `/api/users/:id`
- **Documents**: `/api/documents`, `/api/documents/:id`
- **Jobs**: `/api/jobs`, `/api/jobs/:id`
- **Applications**: `/api/applications`, `/api/applications/:id`
- **Verification**: `/api/verify/document/:id`, `/api/verify/identity/:id`

For a complete API reference, visit `/api-docs` when running the application.

## 🚢 Deployment

The application is designed for deployment on modern cloud platforms:

1. **Backend**: Deploy to Node.js supporting services like AWS Elastic Beanstalk, Heroku, or DigitalOcean
2. **Frontend**: Deploy to static hosting services like Netlify, Vercel, or AWS S3
3. **Database**: Use MongoDB Atlas for database hosting
4. **File Storage**: Use AWS S3 or similar for document storage

For detailed deployment instructions, see the [Deployment Guide](./DEPLOYMENT.md).

### CI/CD Pipeline

ThiQaX uses GitHub Actions for continuous integration and deployment. The pipeline includes:

- Code linting and formatting
- Unit and integration testing
- Security scanning
- Docker image building
- Automated deployment to staging and production environments

## 🔒 Security

ThiQaX implements several security measures:

- JWT-based authentication with short-lived tokens
- HTTPS/TLS encryption for all communications
- Input validation and sanitization
- Rate limiting to prevent abuse
- Regular security audits and dependency updates
- Data encryption at rest and in transit

### Security Reporting

If you discover a security vulnerability, please send an email to security@thiqax.com rather than opening a public issue.

## 🤝 Contributing

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Commit your changes following conventional commits format
   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a pull request

### Development Guidelines

- Follow the established code style and patterns
- Write tests for new features and bug fixes
- Update documentation for significant changes
- Run linting before committing: `npm run lint`
- Ensure your code passes all tests: `npm test`

## 📈 Roadmap

- **Q2 2025**: Complete infrastructure and testing framework
- **Q3 2025**: Launch blockchain verification for documents
- **Q4 2025**: Implement AI-powered document verification
- **Q1 2026**: Release mobile applications for iOS and Android
- **Q2 2026**: Expand to additional Middle Eastern countries

## 📃 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 Mutawai Agencies Ltd. All rights reserved.

## 🙏 Acknowledgments

- Mutawai Agencies Ltd. for project sponsorship and vision
- Project development team for their contributions
- Open source community for tools and libraries

## 📞 Contact

For inquiries about the platform, please contact:

- **Email**: info@thiqax.com
- **Website**: https://thiqax.com
- **Support**: support@thiqax.com

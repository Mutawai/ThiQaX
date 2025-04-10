# ThiQaX API Testing Guide

This document provides comprehensive instructions for testing the ThiQaX platform, including both automated testing using Jest and manual API testing procedures.

## Testing Approaches

ThiQaX employs two complementary testing approaches:

1. **Automated Testing**: Using Jest for unit, integration, and end-to-end testing
2. **Manual API Testing**: Using Postman or similar tools for exploratory testing

## Automated Testing with Jest

### Prerequisites

Before running automated tests, ensure you have:

1. Node.js 16+ and npm installed
2. All dependencies installed: `npm install`
3. MongoDB is NOT required for automated tests (we use MongoDB Memory Server)

### Test Structure

Our tests are organized in the following structure:

```
src/
└── tests/
    ├── unit/            # Unit tests for individual components
    ├── integration/     # Integration tests between components
    │   ├── controllers/ # Tests for API controllers
    │   ├── routes/      # Tests for route configurations
    │   └── endToEnd/    # End-to-end application flow tests
    └── utils/           # Test utilities and helpers
```

### Running Tests

We provide several npm scripts for running different types of tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (helpful during development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:coverage
```

### Test Database

For integration tests, we use `mongodb-memory-server` which spins up an in-memory MongoDB instance. This allows tests to run without an external database dependency while still testing actual database operations.

The database is automatically set up at the beginning of tests and torn down after tests complete. See `src/tests/utils/testDatabase.js` for implementation details.

### Writing New Tests

#### Unit Tests

Unit tests should focus on testing individual functions and modules in isolation:

```javascript
// Example unit test for a utility function
describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });
});
```

#### Integration Tests

Integration tests verify that different parts of the application work correctly together. For API endpoints, use the `supertest` library to make requests:

```javascript
// Example integration test for an API endpoint
describe('GET /api/jobs', () => {
  it('should return a list of jobs', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.jobs)).toBe(true);
  });
});
```

#### End-to-End Tests

End-to-end tests verify complete user flows work correctly from start to finish:

```javascript
// Example E2E test for job application flow
test('User can apply for a job', async () => {
  // Create user
  // Authenticate
  // View job listings
  // Submit application
  // Verify application was created
});
```

### Test Coverage

We aim for a minimum of 80% test coverage across the codebase. Coverage reports can be generated with:

```bash
npm run test:coverage
```

The report will show coverage percentage for:
- Statements
- Branches
- Functions
- Lines

## Manual API Testing

### Prerequisites

Before starting manual API testing, ensure you have:

1. Node.js and npm installed
2. MongoDB running locally or a connection to a remote MongoDB instance
3. Postman or another API testing tool
4. The ThiQaX API running locally

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Start the server: `npm run dev`

### Authentication

Most API endpoints require authentication. You'll need to:

1. Create a user account (or use an existing one)
2. Obtain a JWT token by logging in
3. Include the token in your requests with the Authorization header:
   `Authorization: Bearer your_token_here`

## Test Cases for Job API

### 1. Create a Job (POST /api/jobs)

**Prerequisites:** You need to be logged in as a sponsor or agent.

```
POST /api/jobs
Content-Type: multipart/form-data
Authorization: Bearer <your_token>

Form fields:
- title: Software Engineer
- description: We are looking for a skilled software engineer...
- location[country]: United Arab Emirates
- location[city]: Dubai
- salary[amount]: 5000
- salary[currency]: USD
- salary[period]: monthly
- contractType: full-time
- expiresAt: 2025-06-01
- responsibilities[0]: Build scalable web applications
- responsibilities[1]: Collaborate with product team
- requirements[0]: 3+ years of experience
- requirements[1]: React.js and Node.js proficiency
- skills[0]: JavaScript
- skills[1]: React
- skills[2]: Node.js

Files:
- attachments: (upload PDF job description)
```

### 2. Get All Jobs (GET /api/jobs)

```
GET /api/jobs?page=1&limit=10&status=active&country=United%20Arab%20Emirates&minSalary=3000&contractType=full-time
```

### 3. Get Job by ID (GET /api/jobs/:id)

```
GET /api/jobs/[job_id]
```

### 4. Update a Job (PUT /api/jobs/:id)

```
PUT /api/jobs/[job_id]
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "title": "Senior Software Engineer",
  "salary": {
    "amount": 6000
  },
  "status": "active"
}
```

### 5. Delete a Job (DELETE /api/jobs/:id)

```
DELETE /api/jobs/[job_id]
Authorization: Bearer <your_token>
```

## Test Cases for Application API

### 1. Submit an Application (POST /api/applications)

**Prerequisites:** You need to be logged in as a job seeker.

```
POST /api/applications
Content-Type: multipart/form-data
Authorization: Bearer <your_token>

Form fields:
- job: [job_id]
- coverLetter: I am writing to apply for the Software Engineer position...
- expectedSalary[amount]: 5500
- expectedSalary[currency]: USD
- expectedSalary[negotiable]: true
- availableFromDate: 2025-05-15

Files:
- resume: (upload PDF resume)
- certificate: (upload PDF certificate)
- identification: (upload PNG or JPG identification)
```

### 2. Get All Applications (GET /api/applications)

```
GET /api/applications?page=1&limit=10&status=submitted
Authorization: Bearer <your_token>
```

### 3. Get Application by ID (GET /api/applications/:id)

```
GET /api/applications/[application_id]
Authorization: Bearer <your_token>
```

### 4. Update Application Status (PATCH /api/applications/:id/status)

**Prerequisites:** You need to be logged in as a sponsor or agent.

```
PATCH /api/applications/[application_id]/status
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "status": "under-review",
  "notes": "Application looks promising, will review further."
}
```

### 5. Verify Documents (PATCH /api/applications/:id/verify-documents)

**Prerequisites:** You need to be logged in as an admin or agent.

```
PATCH /api/applications/[application_id]/verify-documents
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "documentIds": ["doc_id_1", "doc_id_2"],
  "verified": true,
  "verificationNotes": "Documents verified and found authentic."
}
```

### 6. Schedule an Interview (POST /api/applications/:id/interviews)

**Prerequisites:** You need to be logged in as a sponsor or agent.

```
POST /api/applications/[application_id]/interviews
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "scheduledDate": "2025-05-20T10:00:00Z",
  "location": "Dubai Office - Meeting Room 3",
  "notes": "Technical interview with senior team members."
}
```

### 7. Make an Offer (PATCH /api/applications/:id/offer)

**Prerequisites:** You need to be logged in as a sponsor.

```
PATCH /api/applications/[application_id]/offer
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "offerDetails": {
    "salary": {
      "amount": 5800,
      "currency": "USD",
      "period": "monthly"
    },
    "benefits": ["Health Insurance", "Annual Bonus", "Relocation Assistance"],
    "startDate": "2025-06-15",
    "expiryDate": "2025-05-25"
  }
}
```

### 8. Respond to Offer (PATCH /api/applications/:id/respond-to-offer)

**Prerequisites:** You need to be logged in as a job seeker.

```
PATCH /api/applications/[application_id]/respond-to-offer
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "response": "accept"
}
```

## Expected Status Codes

- 200: Successful operation
- 201: Resource created successfully
- 400: Bad request (validation error)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 500: Server error

## Testing Role-Based Access Control

To thoroughly test the role-based access control, try accessing endpoints with users of different roles:

1. **Job Seeker:** Should be able to view active jobs, submit applications, and respond to offers.
2. **Agent:** Should be able to create/update jobs, review applications, and verify documents.
3. **Sponsor:** Should be able to create/update jobs, review applications, schedule interviews, and make offers.
4. **Admin:** Should have full access to all endpoints.

## Swagger Documentation

The API documentation is available at `/api-docs` when the server is running. This provides an interactive interface to explore and test all endpoints.

## Troubleshooting Tests

If you encounter issues with tests:

1. **Tests hanging**: Check for unhandled promises or missing async/await
2. **Database connection errors**: Verify the MongoDB memory server is working correctly
3. **Authentication failures**: Ensure the test is generating valid JWT tokens
4. **Timeout errors**: Increase the timeout in Jest configuration for complex tests

For further assistance, review the test logs or contact the development team.

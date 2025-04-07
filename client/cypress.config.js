// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    videoCompression: 15,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
    chromeWebSecurity: false
  },
  env: {
    apiUrl: 'http://localhost:5000/api/v1',
    adminEmail: 'admin@thiqax.com',
    adminPassword: 'Admin123!',
    jobSeekerEmail: 'jobseeker@example.com',
    jobSeekerPassword: 'Test123!',
    agentEmail: 'agent@example.com',
    agentPassword: 'Test123!',
    sponsorEmail: 'sponsor@example.com',
    sponsorPassword: 'Test123!'
  }
});

// cypress/e2e/authentication/login.cy.js
describe('Login Functionality', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login form', () => {
    cy.get('h1').should('contain', 'Login');
    cy.get('form').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist').and('contain', 'Login');
  });

  it('should display validation errors for empty form', () => {
    cy.get('button[type="submit"]').click();
    cy.get('form').contains('Email is required');
    cy.get('form').contains('Password is required');
  });

  it('should display error for invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('contain', 'Invalid credentials');
  });

  it('should login as job seeker successfully', () => {
    cy.get('input[name="email"]').type(Cypress.env('jobSeekerEmail'));
    cy.get('input[name="password"]').type(Cypress.env('jobSeekerPassword'));
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should display user name
    cy.get('header').should('contain', 'Welcome');
    
    // Verify local storage has token
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.exist;
    });
  });

  it('should navigate to forgot password page', () => {
    cy.contains('Forgot Password').click();
    cy.url().should('include', '/auth/forgot-password');
  });

  it('should navigate to register page', () => {
    cy.contains('Register').click();
    cy.url().should('include', '/auth/register');
  });
});

// cypress/e2e/authentication/register.cy.js
describe('Registration Functionality', () => {
  beforeEach(() => {
    cy.visit('/auth/register');
  });

  it('should display registration form', () => {
    cy.get('h1').should('contain', 'Register');
    cy.get('form').should('exist');
    cy.get('input[name="firstName"]').should('exist');
    cy.get('input[name="lastName"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('select[name="role"]').should('exist');
    cy.get('button[type="submit"]').should('exist').and('contain', 'Register');
  });

  it('should display validation errors for empty form', () => {
    cy.get('button[type="submit"]').click();
    cy.get('form').contains('First name is required');
    cy.get('form').contains('Last name is required');
    cy.get('form').contains('Email is required');
    cy.get('form').contains('Password is required');
  });

  it('should display validation error for weak password', () => {
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('weak');
    cy.get('button[type="submit"]').click();
    
    cy.get('form').contains('Password must be at least 8 characters');
  });

  it('should display error for existing email', () => {
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(Cypress.env('jobSeekerEmail'));
    cy.get('input[name="password"]').type('Test123!');
    cy.get('select[name="role"]').select('jobSeeker');
    cy.get('button[type="submit"]').click();
    
    cy.get('[role="alert"]').should('contain', 'Email already in use');
  });

  it('should register new user successfully', () => {
    const randomEmail = `test${Math.floor(Math.random() * 100000)}@example.com`;
    
    cy.get('input[name="firstName"]').type('New');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(randomEmail);
    cy.get('input[name="password"]').type('Test123!');
    cy.get('select[name="role"]').select('jobSeeker');
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should display user name
    cy.get('header').should('contain', 'Welcome');
    
    // Verify local storage has token
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.exist;
    });
  });
});

// cypress/e2e/user_flows/profile_completion.cy.js
describe('Profile Completion Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('jobSeekerEmail'), Cypress.env('jobSeekerPassword'));
    cy.visit('/profile');
  });

  it('should display profile completion sections', () => {
    cy.get('[data-testid="profile-tabs"]').should('exist');
    cy.get('[data-testid="profile-tabs"]').contains('Basic Information');
    cy.get('[data-testid="profile-tabs"]').contains('Contact Information');
    cy.get('[data-testid="profile-tabs"]').contains('Education');
    cy.get('[data-testid="profile-tabs"]').contains('Experience');
    cy.get('[data-testid="profile-tabs"]').contains('Skills');
    cy.get('[data-testid="profile-tabs"]').contains('Documents');
  });

  it('should allow updating basic information', () => {
    // Navigate to basic information tab if not already active
    cy.get('[data-testid="profile-tabs"]').contains('Basic Information').click();
    
    // Check if form is visible
    cy.get('form').should('exist');
    
    // Update bio field
    cy.get('textarea[name="bio"]').clear().type('This is my updated professional bio with specific test content.');
    
    // Save changes
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Profile updated successfully');
    
    // Reload page to verify changes persisted
    cy.reload();
    
    // Verify bio content was saved
    cy.get('textarea[name="bio"]').should('contain', 'This is my updated professional bio with specific test content.');
  });

  it('should allow adding education history', () => {
    // Navigate to education tab
    cy.get('[data-testid="profile-tabs"]').contains('Education').click();
    
    // Click add education button
    cy.get('[data-testid="add-education-button"]').click();
    
    // Fill education form
    cy.get('input[name="school"]').type('Test University');
    cy.get('input[name="degree"]').type('Bachelor of Science');
    cy.get('input[name="fieldOfStudy"]').type('Computer Science');
    cy.get('input[name="from"]').type('2018-01-01');
    cy.get('input[name="to"]').type('2022-01-01');
    cy.get('textarea[name="description"]').type('Graduated with honors');
    
    // Save education
    cy.get('[data-testid="save-education-button"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Education added');
    
    // Verify education item appears in list
    cy.get('[data-testid="education-list"]').should('contain', 'Test University');
    cy.get('[data-testid="education-list"]').should('contain', 'Bachelor of Science');
  });

  it('should allow adding work experience', () => {
    // Navigate to experience tab
    cy.get('[data-testid="profile-tabs"]').contains('Experience').click();
    
    // Click add experience button
    cy.get('[data-testid="add-experience-button"]').click();
    
    // Fill experience form
    cy.get('input[name="title"]').type('Software Developer');
    cy.get('input[name="company"]').type('Test Company');
    cy.get('input[name="location"]').type('Nairobi, Kenya');
    cy.get('input[name="from"]').type('2022-02-01');
    // Leave current job checkbox unchecked
    cy.get('input[name="to"]').type('2023-01-01');
    cy.get('textarea[name="description"]').type('Developed web applications using React');
    
    // Save experience
    cy.get('[data-testid="save-experience-button"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Experience added');
    
    // Verify experience item appears in list
    cy.get('[data-testid="experience-list"]').should('contain', 'Software Developer');
    cy.get('[data-testid="experience-list"]').should('contain', 'Test Company');
  });

  it('should allow adding skills', () => {
    // Navigate to skills tab
    cy.get('[data-testid="profile-tabs"]').contains('Skills').click();
    
    // Add a skill
    cy.get('input[name="skill"]').type('React');
    cy.get('[data-testid="add-skill-button"]').click();
    
    // Add another skill
    cy.get('input[name="skill"]').type('Node.js');
    cy.get('[data-testid="add-skill-button"]').click();
    
    // Verify skills appear in list
    cy.get('[data-testid="skills-list"]').should('contain', 'React');
    cy.get('[data-testid="skills-list"]').should('contain', 'Node.js');
    
    // Save skills
    cy.get('[data-testid="save-skills-button"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Skills updated');
  });
});

// cypress/e2e/user_flows/document_upload.cy.js
describe('Document Upload Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('jobSeekerEmail'), Cypress.env('jobSeekerPassword'));
    cy.visit('/profile/documents');
  });

  it('should display document upload section', () => {
    cy.get('h1').should('contain', 'Document Management');
    cy.get('[data-testid="document-upload-form"]').should('exist');
    cy.get('select[name="documentType"]').should('exist');
    cy.get('input[name="description"]').should('exist');
    cy.get('input[type="file"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should upload identity document', () => {
    // Select document type
    cy.get('select[name="documentType"]').select('IDENTITY');
    
    // Add description
    cy.get('input[name="description"]').type('National ID Card');
    
    // Upload file
    cy.get('input[type="file"]').attachFile('test-document.jpg');
    
    // Wait for file to be processed
    cy.get('[data-testid="file-preview"]').should('exist');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Document uploaded successfully');
    
    // Verify document appears in list
    cy.get('[data-testid="documents-list"]').should('contain', 'IDENTITY');
    cy.get('[data-testid="documents-list"]').should('contain', 'National ID Card');
    cy.get('[data-testid="documents-list"]').should('contain', 'PENDING');
  });

  it('should display document details when clicked', () => {
    // Assuming there's at least one document in the list
    cy.get('[data-testid="document-item"]').first().click();
    
    // Verify document details modal
    cy.get('[data-testid="document-details-modal"]').should('be.visible');
    cy.get('[data-testid="document-details-modal"]').should('contain', 'Document Details');
    
    // Check preview is visible
    cy.get('[data-testid="document-preview"]').should('exist');
    
    // Close modal
    cy.get('[data-testid="close-modal-button"]').click();
    cy.get('[data-testid="document-details-modal"]').should('not.exist');
  });

  it('should allow deleting a pending document', () => {
    // Find a pending document
    cy.get('[data-testid="document-item"]').contains('PENDING').parents('[data-testid="document-item"]').within(() => {
      // Click options menu
      cy.get('[data-testid="document-options-button"]').click();
    });
    
    // Click delete option
    cy.get('[data-testid="delete-document-option"]').click();
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Document deleted successfully');
  });
});

// cypress/e2e/user_flows/job_application.cy.js
describe('Job Application Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('jobSeekerEmail'), Cypress.env('jobSeekerPassword'));
    cy.visit('/jobs');
  });

  it('should display job search page', () => {
    cy.get('h1').should('contain', 'Find Jobs');
    cy.get('[data-testid="job-search-form"]').should('exist');
    cy.get('input[name="keyword"]').should('exist');
    cy.get('input[name="location"]').should('exist');
    cy.get('button[type="submit"]').should('exist').contains('Search');
  });

  it('should search for jobs', () => {
    // Enter search keyword
    cy.get('input[name="keyword"]').type('Developer');
    
    // Submit search
    cy.get('button[type="submit"]').click();
    
    // Verify search results appear
    cy.get('[data-testid="job-results-count"]').should('exist');
    cy.get('[data-testid="job-card"]').should('have.length.greaterThan', 0);
  });

  it('should view job details', () => {
    // Search for jobs
    cy.get('input[name="keyword"]').type('Developer');
    cy.get('button[type="submit"]').click();
    
    // Click on first job
    cy.get('[data-testid="job-card"]').first().click();
    
    // Verify job details page
    cy.url().should('include', '/jobs/');
    cy.get('[data-testid="job-details"]').should('exist');
    cy.get('[data-testid="apply-button"]').should('exist');
  });

  it('should apply for a job', () => {
    // Search for jobs
    cy.get('input[name="keyword"]').type('Developer');
    cy.get('button[type="submit"]').click();
    
    // Click on first job
    cy.get('[data-testid="job-card"]').first().click();
    
    // Click apply button
    cy.get('[data-testid="apply-button"]').click();
    
    // Verify application modal
    cy.get('[data-testid="application-modal"]').should('be.visible');
    
    // Fill application form - Step 1: Basic Information
    cy.get('textarea[name="coverLetter"]').type('I am writing to express my interest in this position. I have experience with the required technologies and am excited about the opportunity to contribute to your team.');
    cy.get('input[name="expectedSalary"]').type('2500');
    cy.get('input[name="availableFrom"]').type('2023-12-01');
    
    // Go to next step
    cy.get('[data-testid="next-button"]').click();
    
    // Step 2: Documents
    // Select documents (assuming there are verified documents available)
    cy.get('[data-testid="document-checkbox"]').first().check();
    
    // Go to next step
    cy.get('[data-testid="next-button"]').click();
    
    // Step 3: Review and Submit
    cy.get('[data-testid="submit-application-button"]').click();
    
    // Verify success message
    cy.get('[data-testid="application-success-message"]').should('be.visible');
    cy.get('[data-testid="application-success-message"]').should('contain', 'Application Submitted Successfully');
  });

  it('should view submitted applications', () => {
    // Navigate to applications page
    cy.visit('/applications');
    
    // Verify applications page
    cy.get('h1').should('contain', 'My Applications');
    
    // Verify applications list
    cy.get('[data-testid="applications-list"]').should('exist');
    cy.get('[data-testid="application-item"]').should('have.length.greaterThan', 0);
  });

  it('should view application details', () => {
    // Navigate to applications page
    cy.visit('/applications');
    
    // Click on first application
    cy.get('[data-testid="application-item"]').first().click();
    
    // Verify application details page
    cy.url().should('include', '/applications/');
    cy.get('[data-testid="application-details"]').should('exist');
    cy.get('[data-testid="application-status"]').should('exist');
    cy.get('[data-testid="job-title"]').should('exist');
  });
});

// cypress/e2e/admin/document_verification.cy.js
describe('Admin Document Verification Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
    cy.visit('/admin/verification');
  });

  it('should display document verification dashboard', () => {
    cy.get('h1').should('contain', 'Document Verification Dashboard');
    cy.get('[data-testid="verification-stats"]').should('exist');
    cy.get('[data-testid="verification-queue"]').should('exist');
    cy.get('[data-testid="document-preview"]').should('exist');
  });

  it('should display pending documents in queue', () => {
    // Ensure Pending tab is active
    cy.get('[data-testid="pending-tab"]').click();
    
    // Check pending documents
    cy.get('[data-testid="verification-queue"]').should('be.visible');
    
    // If there are pending documents, they should be displayed
    cy.get('[data-testid="verification-queue"]').then(($queue) => {
      if ($queue.find('[data-testid="document-item"]').length > 0) {
        cy.get('[data-testid="document-item"]').should('be.visible');
      } else {
        cy.get('[data-testid="empty-queue-message"]').should('be.visible');
      }
    });
  });

  it('should verify a document', () => {
    // Ensure Pending tab is active
    cy.get('[data-testid="pending-tab"]').click();
    
    // Check if there are pending documents
    cy.get('[data-testid="verification-queue"]').then(($queue) => {
      if ($queue.find('[data-testid="document-item"]').length > 0) {
        // Click on first document
        cy.get('[data-testid="document-item"]').first().click();
        
        // Verify document preview appears
        cy.get('[data-testid="document-details"]').should('be.visible');
        
        // Add verification notes
        cy.get('textarea[name="notes"]').type('Document looks valid and matches user profile information.');
        
        // Click verify button
        cy.get('[data-testid="verify-button"]').click();
        
        // Verify success message
        cy.get('[role="alert"]').should('contain', 'Document verified successfully');
      } else {
        cy.log('No pending documents to verify');
      }
    });
  });

  it('should reject a document', () => {
    // Ensure Pending tab is active
    cy.get('[data-testid="pending-tab"]').click();
    
    // Check if there are pending documents
    cy.get('[data-testid="verification-queue"]').then(($queue) => {
      if ($queue.find('[data-testid="document-item"]').length > 0) {
        // Click on first document
        cy.get('[data-testid="document-item"]').first().click();
        
        // Verify document preview appears
        cy.get('[data-testid="document-details"]').should('be.visible');
        
        // Select rejection reason
        cy.get('select[name="rejectionReason"]').select('DOCUMENT_UNCLEAR');
        
        // Add rejection notes
        cy.get('textarea[name="notes"]').type('The document image is too blurry to read the details properly.');
        
        // Click reject button
        cy.get('[data-testid="reject-button"]').click();
        
        // Verify success message
        cy.get('[role="alert"]').should('contain', 'Document rejected successfully');
      } else {
        cy.log('No pending documents to reject');
      }
    });
  });

  it('should view verification statistics', () => {
    // Check stats components exist
    cy.get('[data-testid="total-documents-stat"]').should('exist');
    cy.get('[data-testid="pending-documents-stat"]').should('exist');
    cy.get('[data-testid="verified-documents-stat"]').should('exist');
    cy.get('[data-testid="rejected-documents-stat"]').should('exist');
    
    // Check verification rate chart
    cy.get('[data-testid="verification-rate-chart"]').should('exist');
  });
});

// cypress/e2e/agent/job_management.cy.js
describe('Agent Job Management Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('agentEmail'), Cypress.env('agentPassword'));
    cy.visit('/jobs/manage');
  });

  it('should display job management page', () => {
    cy.get('h1').should('contain', 'Manage Jobs');
    cy.get('[data-testid="create-job-button"]').should('exist');
    cy.get('[data-testid="jobs-list"]').should('exist');
  });

  it('should create a new job', () => {
    // Click create job button
    cy.get('[data-testid="create-job-button"]').click();
    
    // Verify job form page
    cy.url().should('include', '/jobs/create');
    
    // Fill job form
    cy.get('input[name="title"]').type('Senior Software Developer');
    cy.get('textarea[name="description"]').type('We are looking for a senior software developer with experience in React and Node.js to join our team.');
    
    // Add responsibilities
    cy.get('input[name="responsibility"]').type('Develop and maintain web applications');
    cy.get('[data-testid="add-responsibility-button"]').click();
    
    // Add qualifications
    cy.get('input[name="qualification"]').type('3+ years of experience with React');
    cy.get('[data-testid="add-qualification-button"]').click();
    
    // Add basic job details
    cy.get('input[name="location"]').type('Nairobi, Kenya');
    cy.get('select[name="jobType"]').select('FULL_TIME');
    cy.get('input[name="salaryMin"]').type('2500');
    cy.get('input[name="salaryMax"]').type('4000');
    cy.get('input[name="vacancies"]').type('2');
    
    // Set deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    cy.get('input[name="deadline"]').type(formattedDate);
    
    // Add required documents
    cy.get('[data-testid="document-checkbox-IDENTITY"]').check();
    cy.get('[data-testid="document-checkbox-EDUCATIONAL"]').check();
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify success message
    cy.get('[role="alert"]').should('contain', 'Job created successfully');
    
    // Should redirect to job details
    cy.url().should('include', '/jobs/');
  });

  it('should view job applications', () => {
    // Find a job with applications
    cy.get('[data-testid="jobs-list"]').then(($list) => {
      if ($list.find('[data-testid="job-item"]').length > 0) {
        // Click on first job
        cy.get('[data-testid="job-item"]').first().within(() => {
          cy.get('[data-testid="view-applications-button"]').click();
        });
        
        // Verify applications page
        cy.url().should('include', '/applications/job/');
        cy.get('h1').should('contain', 'Applications');
        
        // If there are applications, they should be displayed
        cy.get('[data-testid="applications-list"]').then(($appList) => {
          if ($appList.find('[data-testid="application-item"]').length > 0) {
            cy.get('[data-testid="application-item"]').should('be.visible');
          } else {
            cy.get('[data-testid="no-applications-message"]').should('be.visible');
          }
        });
      } else {
        cy.log('No jobs available to test');
      }
    });
  });

  it('should update application status', () => {
    // Navigate to jobs
    cy.visit('/jobs/manage');
    
    // Find a job with applications
    cy.get('[data-testid="jobs-list"]').then(($list) => {
      if ($list.find('[data-testid="job-item"]').length > 0) {
        // Click on first job
        cy.get('[data-testid="job-item"]').first().within(() => {
          cy.get('[data-testid="view-applications-button"]').click();
        });
        
        // If there are applications, update status of first one
        cy.get('[data-testid="applications-list"]').then(($appList) => {
          if ($appList.find('[data-testid="application-item"]').length > 0) {
            cy.get('[data-testid="application-item"]').first().click();
            
            // Verify application details
            cy.get('[data-testid="application-details"]').should('be.visible');
            
            // Update status
            cy.get('[data-testid="status-select"]').select('UNDER_REVIEW');
            
            // Add notes
            cy.get('textarea[name="notes"]').type('Application looks promising, will review further.');
            
            // Save changes
            cy.get('[data-testid="update-status-button"]').click();
            
            // Verify success message
            cy.get('[role="alert"]').should('contain', 'Application status updated');
          } else {
            cy.log('No applications available to test');
          }
        });
      } else {
        cy.log('No jobs available to test');
      }
    });
  });
});

// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify we're logged in
    cy.window().its('localStorage.token').should('exist');
  });
});

// Add command to upload file
import 'cypress-file-upload';

// cypress/fixtures/test-document.jpg
// (This would be a binary file in your actual project)

// package.json modifications for Cypress
/*
"devDependencies": {
  "cypress": "^12.5.0",
  "cypress-file-upload": "^5.0.8"
}
*/

// jenkins-e2e.Jenkinsfile
pipeline {
    agent {
        docker {
            image 'cypress/browsers:node16.16.0-chrome105-ff104-edge'
            args '-v /var/jenkins_home/workspace:/workspace'
        }
    }
    
    environment {
        // Environment variables for testing
        CYPRESS_BASE_URL = 'https://staging.thiqax.com'
        CYPRESS_API_URL = 'https://api-staging.thiqax.com/api/v1'
    }
    
    stages {
        stage('Setup') {
            steps {
                // Checkout the code
                checkout scm
                
                // Install dependencies
                sh 'npm ci'
            }
        }
        
        stage('Run E2E Tests') {
            steps {
                // Run Cypress tests
                sh 'npx cypress run --browser chrome'
            }
            post {
                always {
                    // Archive test results and artifacts
                    archiveArtifacts artifacts: 'cypress/videos/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'cypress/screenshots/**/*', allowEmptyArchive: true
                }
            }
        }
    }
    
    post {
        success {
            echo 'E2E tests completed successfully!'
        }
        failure {
            echo 'E2E tests failed. Check the logs and artifacts for details.'
        }
    }
}

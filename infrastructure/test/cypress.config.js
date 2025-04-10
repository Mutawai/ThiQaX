// infrastructure/test/cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    video: true,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
    chromeWebSecurity: false,
    experimentalSessionAndOrigin: true,
    env: {
      apiUrl: 'http://localhost:5000'
    },
    setupNodeEvents(on, config) {
      // Register plugins
      require('@cypress/code-coverage/task')(on, config);
      
      // Environment overrides
      if (process.env.CI) {
        config.baseUrl = 'https://staging.thiqax.com';
        config.env.apiUrl = 'https://api.staging.thiqax.com';
      }
      
      // Customize config based on environment
      config.env.environment = process.env.NODE_ENV || 'development';
      
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});

// infrastructure/test/cypress/support/commands.js
// Custom Cypress commands

// Login command
Cypress.Commands.add('login', (email, password) => {
  const apiUrl = Cypress.env('apiUrl');
  
  // Clear any existing tokens
  cy.clearLocalStorage();
  
  // Authenticate via API to get tokens
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/api/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('token');
    expect(response.body).to.have.property('refreshToken');
    
    // Store tokens in localStorage
    localStorage.setItem('token', response.body.token);
    localStorage.setItem('refreshToken', response.body.refreshToken);
    
    // Store user data
    if (response.body.user) {
      localStorage.setItem('user', JSON.stringify(response.body.user));
    }
    
    // Return response for chaining
    return response;
  });
});

// Register command
Cypress.Commands.add('register', (userData) => {
  const apiUrl = Cypress.env('apiUrl');
  
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/api/auth/register`,
    body: userData,
  });
});

// Upload document command
Cypress.Commands.add('uploadDocument', (filePath, documentType) => {
  cy.get(`[data-testid="document-upload-${documentType}"]`).attachFile(filePath);
  cy.get(`[data-testid="upload-button-${documentType}"]`).click();
  cy.get(`[data-testid="document-status-${documentType}"]`).should('contain', 'Uploaded');
});

// Verify profile completion
Cypress.Commands.add('verifyProfileCompletion', (expectedPercentage) => {
  cy.get('[data-testid="profile-completion-indicator"]')
    .should('contain', `${expectedPercentage}%`);
});

// Apply for a job
Cypress.Commands.add('applyForJob', (jobId, coverLetter = 'Test cover letter') => {
  cy.visit(`/jobs/${jobId}`);
  cy.get('[data-testid="apply-button"]').click();
  cy.get('[data-testid="cover-letter"]').type(coverLetter);
  cy.get('[data-testid="submit-application"]').click();
  cy.get('[data-testid="application-success"]').should('be.visible');
});

// Check notification
Cypress.Commands.add('checkNotification', (text) => {
  cy.get('[data-testid="notification-panel"]').click();
  cy.get('[data-testid="notification-item"]').should('contain', text);
});

// infrastructure/test/cypress/support/e2e.js
// Import commands.js
import './commands';

// Add browser console log capturing
Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'log').as('consoleLog');
  cy.spy(win.console, 'error').as('consoleError');
  cy.spy(win.console, 'warn').as('consoleWarn');
});

// Import testing library commands
import '@testing-library/cypress/add-commands';

// Setup code coverage
import '@cypress/code-coverage/support';

// Add accessibility testing
import 'cypress-axe';

// infrastructure/test/cypress/e2e/auth/login.spec.js
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="password-error"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="login-error"]').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    // Using test account from seed data
    cy.get('[data-testid="email-input"]').type('jobseeker@thiqax.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="login-button"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-welcome"]').should('contain', 'Welcome');
  });

  it('should redirect to requested page after login', () => {
    // Navigate to protected page
    cy.visit('/jobs');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Login
    cy.get('[data-testid="email-input"]').type('jobseeker@thiqax.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="login-button"]').click();
    
    // Should redirect to original destination
    cy.url().should('include', '/jobs');
  });
});

// infrastructure/test/cypress/e2e/user/profile.spec.js
describe('User Profile', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('jobseeker@thiqax.com', 'Password123!');
    cy.visit('/profile');
  });

  it('should display user profile information', () => {
    cy.get('[data-testid="profile-name"]').should('be.visible');
    cy.get('[data-testid="profile-email"]').should('be.visible');
    cy.get('[data-testid="profile-role"]').should('be.visible');
    cy.get('[data-testid="profile-completion-indicator"]').should('be.visible');
  });

  it('should allow updating personal information', () => {
    cy.get('[data-testid="edit-personal-info-button"]').click();
    
    // Update fields
    cy.get('[data-testid="name-input"]').clear().type('Updated Name');
    cy.get('[data-testid="phone-input"]').clear().type('+1234567890');
    
    // Save changes
    cy.get('[data-testid="save-personal-info-button"]').click();
    
    // Verify success message
    cy.get('[data-testid="update-success-message"]').should('be.visible');
    
    // Verify updated information is displayed
    cy.get('[data-testid="profile-name"]').should('contain', 'Updated Name');
    cy.get('[data-testid="profile-phone"]').should('contain', '+1234567890');
  });

  it('should allow uploading a document', () => {
    cy.get('[data-testid="documents-tab"]').click();
    cy.get('[data-testid="upload-document-button"]').click();
    
    // Select document type
    cy.get('[data-testid="document-type-select"]').select('identity');
    
    // Upload file
    cy.fixture('test-document.pdf', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-testid="document-file-input"]').attachFile({
          fileContent,
          fileName: 'test-document.pdf',
          mimeType: 'application/pdf'
        });
      });
    
    // Submit upload
    cy.get('[data-testid="submit-document-button"]').click();
    
    // Verify success message
    cy.get('[data-testid="document-upload-success"]').should('be.visible');
    
    // Verify document appears in list
    cy.get('[data-testid="document-list-item"]').should('contain', 'test-document.pdf');
    cy.get('[data-testid="document-status-badge"]').should('contain', 'PENDING');
  });
});

// infrastructure/test/cypress/e2e/jobs/job-search.spec.js
describe('Job Search', () => {
  beforeEach(() => {
    // Login as job seeker
    cy.login('jobseeker@thiqax.com', 'Password123!');
    cy.visit('/jobs');
  });

  it('should display job listings', () => {
    cy.get('[data-testid="job-listing"]').should('have.length.at.least', 1);
  });

  it('should filter jobs by keyword', () => {
    // Get the first job title
    cy.get('[data-testid="job-title"]').first().invoke('text').then((title) => {
      // Use the first word of the title as search keyword
      const keyword = title.split(' ')[0];
      
      // Search for that keyword
      cy.get('[data-testid="search-input"]').type(keyword);
      cy.get('[data-testid="search-button"]').click();
      
      // Verify results contain the keyword
      cy.get('[data-testid="job-title"]').each(($el) => {
        cy.wrap($el).invoke('text').should('include', keyword);
      });
    });
  });

  it('should filter jobs by location', () => {
    // Open location filter
    cy.get('[data-testid="location-filter"]').click();
    
    // Select first location option
    cy.get('[data-testid="location-option"]').first().click();
    
    // Apply filter
    cy.get('[data-testid="apply-filters-button"]').click();
    
    // Get selected location
    cy.get('[data-testid="active-filter"]').invoke('text').then((selectedLocation) => {
      // Verify job listings match selected location
      cy.get('[data-testid="job-location"]').each(($el) => {
        cy.wrap($el).invoke('text').should('include', selectedLocation);
      });
    });
  });

  it('should display job details when clicking on a job', () => {
    // Click on first job
    cy.get('[data-testid="job-listing"]').first().click();
    
    // Verify job details page is displayed
    cy.url().should('include', '/jobs/');
    cy.get('[data-testid="job-detail-title"]').should('be.visible');
    cy.get('[data-testid="job-detail-description"]').should('be.visible');
    cy.get('[data-testid="job-detail-requirements"]').should('be.visible');
    cy.get('[data-testid="apply-button"]').should('be.visible');
  });
});

// infrastructure/test/cypress/e2e/jobs/job-application.spec.js
describe('Job Application Process', () => {
  beforeEach(() => {
    // Login as job seeker
    cy.login('jobseeker@thiqax.com', 'Password123!');
  });

  it('should allow applying for a job', () => {
    // Navigate to jobs page
    cy.visit('/jobs');
    
    // Click on first job with "OPEN" status
    cy.get('[data-testid="job-status-OPEN"]').parent('[data-testid="job-listing"]').first().click();
    
    // Verify job details page is displayed
    cy.get('[data-testid="job-detail-title"]').should('be.visible');
    
    // Click apply button
    cy.get('[data-testid="apply-button"]').click();
    
    // Fill application form
    cy.get('[data-testid="cover-letter"]').type('This is my cover letter explaining why I am a great fit for this position.');
    cy.get('[data-testid="expected-salary"]').type('3000');
    
    // Submit application
    cy.get('[data-testid="submit-application"]').click();
    
    // Verify success message
    cy.get('[data-testid="application-success"]').should('be.visible');
  });

  it('should show user their application in applications list', () => {
    // Navigate to applications page
    cy.visit('/applications');
    
    // Verify applications are listed
    cy.get('[data-testid="application-list-item"]').should('have.length.at.least', 1);
    
    // Click on first application
    cy.get('[data-testid="application-list-item"]').first().click();
    
    // Verify application details are displayed
    cy.get('[data-testid="application-detail-status"]').should('be.visible');
    cy.get('[data-testid="application-detail-job-title"]').should('be.visible');
    cy.get('[data-testid="application-detail-cover-letter"]').should('be.visible');
  });
});

// infrastructure/test/cypress/e2e/dashboard/dashboard.spec.js
describe('User Dashboard', () => {
  context('Job Seeker Dashboard', () => {
    beforeEach(() => {
      // Login as job seeker
      cy.login('jobseeker@thiqax.com', 'Password123!');
      cy.visit('/dashboard');
    });

    it('should display job seeker dashboard components', () => {
      cy.get('[data-testid="profile-completion-card"]').should('be.visible');
      cy.get('[data-testid="recent-jobs-card"]').should('be.visible');
      cy.get('[data-testid="application-status-card"]').should('be.visible');
      cy.get('[data-testid="notifications-card"]').should('be.visible');
    });

    it('should navigate to profile when clicking profile completion card', () => {
      cy.get('[data-testid="profile-completion-card"]').click();
      cy.url().should('include', '/profile');
    });

    it('should navigate to job details when clicking on a job', () => {
      cy.get('[data-testid="recent-job-item"]').first().click();
      cy.url().should('include', '/jobs/');
    });

    it('should navigate to applications when clicking view all applications', () => {
      cy.get('[data-testid="view-all-applications"]').click();
      cy.url().should('include', '/applications');
    });
  });

  context('Agent Dashboard', () => {
    beforeEach(() => {
      // Login as agent
      cy.login('agent@thiqax.com', 'Password123!');
      cy.visit('/dashboard');
    });

    it('should display agent dashboard components', () => {
      cy.get('[data-testid="job-listings-card"]').should('be.visible');
      cy.get('[data-testid="candidate-verification-card"]').should('be.visible');
      cy.get('[data-testid="financial-summary-card"]').should('be.visible');
    });
  });

  context('Sponsor Dashboard', () => {
    beforeEach(() => {
      // Login as sponsor
      cy.login('sponsor@thiqax.com', 'Password123!');
      cy.visit('/dashboard');
    });

    it('should display sponsor dashboard components', () => {
      cy.get('[data-testid="active-jobs-card"]').should('be.visible');
      cy.get('[data-testid="candidate-pipeline-card"]').should('be.visible');
      cy.get('[data-testid="financial-commitments-card"]').should('be.visible');
    });

    it('should allow posting a new job', () => {
      cy.get('[data-testid="post-job-button"]').click();
      cy.url().should('include', '/jobs/create');
    });
  });
});

// infrastructure/test/cypress/e2e/integration/end-to-end-flow.spec.js
describe('End to End User Flow', () => {
  const jobTitle = `Test Job ${Date.now().toString().slice(-6)}`;
  let jobId;

  it('Sponsor can create a new job listing', () => {
    // Login as sponsor
    cy.login('sponsor@thiqax.com', 'Password123!');
    
    // Navigate to job creation
    cy.visit('/jobs/create');
    
    // Fill job details
    cy.get('[data-testid="job-title-input"]').type(jobTitle);
    cy.get('[data-testid="job-description-input"]').type('This is a test job description');
    cy.get('[data-testid="job-location-input"]').type('Test Location');
    cy.get('[data-testid="job-type-select"]').select('FULL_TIME');
    cy.get('[data-testid="job-category-input"]').type('Test Category');
    cy.get('[data-testid="job-salary-amount-input"]').type('3000');
    cy.get('[data-testid="job-salary-currency-select"]').select('USD');
    cy.get('[data-testid="job-salary-period-select"]').select('MONTHLY');
    
    // Add requirements
    cy.get('[data-testid="add-requirement-button"]').click();
    cy.get('[data-testid="requirement-input-0"]').type('Test requirement 1');
    cy.get('[data-testid="add-requirement-button"]').click();
    cy.get('[data-testid="requirement-input-1"]').type('Test requirement 2');
    
    // Add skills
    cy.get('[data-testid="add-skill-button"]').click();
    cy.get('[data-testid="skill-input-0"]').type('Test skill 1');
    cy.get('[data-testid="add-skill-button"]').click();
    cy.get('[data-testid="skill-input-1"]').type('Test skill 2');
    
    // Set application deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    cy.get('[data-testid="application-deadline-input"]').type(tomorrow.toISOString().split('T')[0]);
    
    // Submit job
    cy.get('[data-testid="submit-job-button"]').click();
    
    // Verify success and get job ID
    cy.get('[data-testid="job-creation-success"]').should('be.visible');
    cy.url().then(url => {
      jobId = url.split('/').pop();
    });
  });

  it('Job seeker can view and apply to the newly created job', () => {
    // Login as job seeker
    cy.login('jobseeker@thiqax.com', 'Password123!');
    
    // Navigate to jobs page and search for the new job
    cy.visit('/jobs');
    cy.get('[data-testid="search-input"]').type(jobTitle);
    cy.get('[data-testid="search-button"]').click();
    
    // Click on the job listing
    cy.get('[data-testid="job-title"]').contains(jobTitle).click();
    
    // Apply for the job
    cy.get('[data-testid="apply-button"]').click();
    cy.get('[data-testid="cover-letter"]').type('I am very interested in this position and believe my skills are a great match.');
    cy.get('[data-testid="expected-salary"]').type('2800');
    cy.get('[data-testid="submit-application"]').click();
    
    // Verify application success
    cy.get('[data-testid="application-success"]').should('be.visible');
  });

  it('Sponsor can view and review the application', () => {
    // Login as sponsor
    cy.login('sponsor@thiqax.com', 'Password123!');
    
    // Navigate to job details
    cy.visit(`/jobs/${jobId}`);
    
    // Go to applications tab
    cy.get('[data-testid="applications-tab"]').click();
    
    // There should be at least one application
    cy.get('[data-testid="application-list-item"]').should('have.length.at.least', 1);
    
    // Click on the first application
    cy.get('[data-testid="application-list-item"]').first().click();
    
    // View application details
    cy.get('[data-testid="applicant-name"]').should('be.visible');
    cy.get('[data-testid="application-cover-letter"]').should('contain', 'I am very interested in this position');
    
    // Change application status
    cy.get('[data-testid="update-status-button"]').click();
    cy.get('[data-testid="status-select"]').select('SHORTLISTED');
    cy.get('[data-testid="confirm-status-update"]').click();
    
    // Verify status updated
    cy.get('[data-testid="application-status-badge"]').should('contain', 'SHORTLISTED');
  });

  it('Job seeker can view the updated application status', () => {
    // Login as job seeker
    cy.login('jobseeker@thiqax.com', 'Password123!');
    
    // Navigate to applications page
    cy.visit('/applications');
    
    // There should be at least one application
    cy.get('[data-testid="application-list-item"]').should('have.length.at.least', 1);
    
    // Find the application for our test job
    cy.get('[data-testid="application-job-title"]').contains(jobTitle).parent('[data-testid="application-list-item"]').click();
    
    // Verify status is updated
    cy.get('[data-testid="application-status"]').should('contain', 'SHORTLISTED');
    
    // Verify notification received
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="notification-list"]').should('contain', 'Application Status Updated');
  });
});

// cypress/e2e/job-application-flow.cy.js
describe('Job Application Flow', () => {
  beforeEach(() => {
    // Mock API responses to control test environment
    cy.intercept('GET', '/api/jobs/search*', { fixture: 'jobSearchResults.json' }).as('searchJobs');
    cy.intercept('GET', '/api/jobs/*', { fixture: 'jobDetails.json' }).as('getJobDetails');
    cy.intercept('GET', '/api/documents', { fixture: 'userDocuments.json' }).as('getUserDocs');
    cy.intercept('POST', '/api/applications', { 
      statusCode: 201, 
      body: { 
        success: true, 
        application: { id: '123456789', status: 'APPLIED' } 
      } 
    }).as('submitApplication');
    
    // Log in before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test.user@example.com');
    cy.get('input[name="password"]').type('Test@123');
    cy.get('button[type="submit"]').click();
    
    // Wait for dashboard to load
    cy.url().should('include', '/dashboard');
  });
  
  it('should complete the full job application journey', () => {
    // 1. Navigate to job listings
    cy.get('[data-testid="nav-jobs"]').click();
    cy.url().should('include', '/jobs');
    
    // 2. Search for jobs
    cy.get('[data-testid="search-location"]').type('Dubai');
    cy.get('[data-testid="search-job-type"]').select('FULL_TIME');
    cy.get('[data-testid="search-button"]').click();
    
    cy.wait('@searchJobs');
    
    // 3. Verify search results
    cy.get('[data-testid="job-card"]').should('have.length.at.least', 1);
    
    // 4. Click on a job
    cy.get('[data-testid="job-card"]').first().click();
    
    cy.wait('@getJobDetails');
    cy.url().should('include', '/jobs/');
    
    // 5. Start application process
    cy.get('[data-testid="apply-button"]').click();
    
    // 6. Check eligibility
    cy.get('[data-testid="eligibility-check"]').should('exist');
    cy.get('[data-testid="continue-application"]').click();
    
    // 7. Write cover letter
    cy.get('[data-testid="cover-letter"]')
      .type('I am excited to apply for this position and believe my skills and experience make me a good fit.');
    
    cy.get('[data-testid="next-step"]').click();
    
    // 8. Select documents
    cy.wait('@getUserDocs');
    
    cy.get('[data-testid="document-checkbox"]').should('have.length.at.least', 2);
    cy.get('[data-testid="document-checkbox"]').first().check();
    cy.get('[data-testid="document-checkbox"]').eq(1).check();
    
    cy.get('[data-testid="next-step"]').click();
    
    // 9. Review application
    cy.get('[data-testid="review-section"]').should('exist');
    cy.get('[data-testid="application-summary"]').should('exist');
    cy.get('[data-testid="selected-documents"]').should('exist');
    
    // 10. Submit application
    cy.get('[data-testid="submit-application"]').click();
    
    cy.wait('@submitApplication');
    
    // 11. Verification of success
    cy.get('[data-testid="success-message"]').should('exist');
    cy.get('[data-testid="application-id"]').should('contain', '123456789');
    
    // 12. Navigate to applications
    cy.get('[data-testid="view-applications"]').click();
    
    cy.url().should('include', '/applications');
    
    // 13. Verify application appears in list
    cy.get('[data-testid="application-card"]').should('have.length.at.least', 1);
  });
  
  it('should show appropriate messaging when user is not eligible', () => {
    // Override the eligibility check to return not eligible
    cy.intercept('GET', '/api/jobs/*/eligibility', {
      statusCode: 200,
      body: {
        eligible: false,
        reasons: ['Incomplete profile', 'Missing required documents'],
        missingRequirements: ['professionalInfo', 'Passport', 'Resume']
      }
    }).as('eligibilityCheck');
    
    // Navigate to job listings and select a job
    cy.get('[data-testid="nav-jobs"]').click();
    cy.get('[data-testid="job-card"]').first().click();
    
    cy.wait('@getJobDetails');
    
    // Start application process
    cy.get('[data-testid="apply-button"]').click();
    
    cy.wait('@eligibilityCheck');
    
    // Verify ineligibility message
    cy.get('[data-testid="eligibility-error"]').should('exist');
    cy.get('[data-testid="eligibility-reasons"]').should('contain', 'Incomplete profile');
    cy.get('[data-testid="eligibility-reasons"]').should('contain', 'Missing required documents');
    
    // Check for action buttons to fix issues
    cy.get('[data-testid="complete-profile-button"]').should('exist');
    cy.get('[data-testid="upload-documents-button"]').should('exist');
  });
  
  it('should handle document upload during application', () => {
    // Mock document upload endpoint
    cy.intercept('POST', '/api/documents', {
      statusCode: 201,
      body: {
        success: true,
        document: {
          id: 'new-doc-123',
          type: 'resume',
          title: 'My Resume',
          verificationStatus: 'PENDING'
        }
      }
    }).as('uploadDocument');
    
    // Navigate to job listings and select a job
    cy.get('[data-testid="nav-jobs"]').click();
    cy.get('[data-testid="job-card"]').first().click();
    cy.get('[data-testid="apply-button"]').click();
    cy.get('[data-testid="continue-application"]').click();
    cy.get('[data-testid="cover-letter"]').type('Sample cover letter text');
    cy.get('[data-testid="next-step"]').click();
    
    // Upload new document during application
    cy.get('[data-testid="upload-new-document"]').click();
    cy.get('[data-testid="document-type"]').select('resume');
    cy.get('[data-testid="document-title"]').type('My Latest Resume');
    cy.get('[data-testid="document-file-input"]').attachFile('resume.pdf');
    cy.get('[data-testid="upload-button"]').click();
    
    cy.wait('@uploadDocument');
    
    // Verify new document appears and is selected
    cy.get('[data-testid="document-checkbox"]').contains('My Latest Resume').should('exist');
    cy.get('[data-testid="document-checkbox"]').contains('My Latest Resume').check();
    
    // Continue with application
    cy.get('[data-testid="next-step"]').click();
    cy.get('[data-testid="submit-application"]').click();
    
    // Verify success
    cy.get('[data-testid="success-message"]').should('exist');
  });
  
  it('should track application status changes', () => {
    // Set up a mock for application details with status history
    cy.intercept('GET', '/api/applications/*', {
      statusCode: 200,
      body: {
        application: {
          id: 'app-123',
          status: 'REVIEWING',
          job: {
            id: 'job-456',
            title: 'Software Developer'
          },
          history: [
            {
              status: 'APPLIED',
              changedAt: '2023-04-01T10:30:00Z',
              note: 'Application submitted'
            },
            {
              status: 'REVIEWING',
              changedAt: '2023-04-03T14:15:00Z',
              note: 'Application under review'
            }
          ]
        }
      }
    }).as('getApplicationDetails');
    
    // Navigate to applications section
    cy.get('[data-testid="nav-applications"]').click();
    
    // Select an application to view details
    cy.get('[data-testid="application-card"]').first().click();
    
    cy.wait('@getApplicationDetails');
    
    // Verify status history is displayed
    cy.get('[data-testid="status-history"]').should('exist');
    cy.get('[data-testid="status-timeline"]').children().should('have.length', 2);
    
    // Verify current status
    cy.get('[data-testid="current-status"]').should('contain', 'REVIEWING');
    
    // Verify timeline entries
    cy.get('[data-testid="status-timeline"]').should('contain', 'APPLIED');
    cy.get('[data-testid="status-timeline"]').should('contain', 'Application submitted');
    cy.get('[data-testid="status-timeline"]').should('contain', 'REVIEWING');
    cy.get('[data-testid="status-timeline"]').should('contain', 'Application under review');
  });
});

// Documentation content for seeding the database

/**
 * Job Seeker User Guide
 */
const jobSeekerGuide = {
  type: 'userGuide',
  title: 'Getting Started as a Job Seeker',
  description: 'Complete guide to finding and applying for jobs on ThiQaX',
  category: 'Onboarding',
  roles: ['jobSeeker'],
  steps: [
    {
      title: 'Complete Your Profile',
      content: `
        <p>Before applying for jobs, complete your profile to increase your chances of getting hired:</p>
        <ol>
          <li>Navigate to <strong>Profile</strong> from the main menu</li>
          <li>Fill in your personal details, contact information, and professional summary</li>
          <li>Add your work experience, highlighting responsibilities and achievements</li>
          <li>List your education, certifications, and skills</li>
          <li>Upload a professional photo</li>
        </ol>
        <p>A complete profile is 70% more likely to be viewed by potential employers.</p>
      `,
      order: 1
    },
    {
      title: 'Verify Your Identity (KYC)',
      content: `
        <p>ThiQaX ensures trust through our verification process:</p>
        <ol>
          <li>Go to the <strong>Documents</strong> section of your profile</li>
          <li>Upload your identification documents (passport, national ID, or driver's license)</li>
          <li>Upload proof of address (utility bill, bank statement)</li>
          <li>Submit for verification</li>
          <li>Wait for the verification team to review your documents (usually within 24-48 hours)</li>
        </ol>
        <p><strong>Note:</strong> Only verified users can apply for jobs on ThiQaX.</p>
      `,
      order: 2
    },
    {
      title: 'Search for Jobs',
      content: `
        <p>Find the perfect job using our powerful search tools:</p>
        <ol>
          <li>Use the search bar to enter keywords, job titles, or companies</li>
          <li>Filter results by location, job type, and salary range</li>
          <li>Sort results by relevance, date posted, or salary</li>
          <li>Save interesting jobs to review later</li>
          <li>Set up job alerts to get notified about new opportunities</li>
        </ol>
        <p>Our verified job listings are marked with a blue checkmark, indicating they've been verified by our team.</p>
      `,
      order: 3
    },
    {
      title: 'Apply for Jobs',
      content: `
        <p>Submit professional, tailored applications:</p>
        <ol>
          <li>Click <strong>Apply Now</strong> on any job listing</li>
          <li>Write a personalized cover letter highlighting your relevant skills and experience</li>
          <li>Specify your salary expectations and availability</li>
          <li>Select relevant documents from your profile to attach</li>
          <li>Review your application before submitting</li>
        </ol>
        <p><strong>Pro tip:</strong> Customize each application to match the specific job requirements.</p>
      `,
      order: 4
    },
    {
      title: 'Track Your Applications',
      content: `
        <p>Stay on top of your job applications:</p>
        <ol>
          <li>Go to <strong>My Applications</strong> in your dashboard</li>
          <li>View the status of each application (Submitted, Under Review, Shortlisted, Rejected, Hired)</li>
          <li>Respond to any employer messages or requests for additional information</li>
          <li>Schedule interviews when invited</li>
          <li>Accept or decline job offers</li>
        </ol>
        <p>The ThiQaX platform keeps all communication and status updates in one place for transparency.</p>
      `,
      order: 5
    }
  ]
};

/**
 * Agent User Guide
 */
const agentGuide = {
  type: 'userGuide',
  title: 'Managing Recruitment as an Agent',
  description: 'Complete guide to posting jobs and managing candidates on ThiQaX',
  category: 'Onboarding',
  roles: ['agent'],
  steps: [
    {
      title: 'Complete Agency Profile',
      content: `
        <p>Build trust with sponsors and job seekers with a professional agency profile:</p>
        <ol>
          <li>Add your agency name, logo, and contact information</li>
          <li>Provide your business registration documents for verification</li>
          <li>Write a compelling agency description highlighting your experience and specialties</li>
          <li>List your recruitment license details and validity</li>
          <li>Add team members who will be managing the platform</li>
        </ol>
        <p>A verified agency profile increases your credibility with both job seekers and sponsors.</p>
      `,
      order: 1
    },
    {
      title: 'Connect with Sponsors',
      content: `
        <p>Build your network of employers and sponsors:</p>
        <ol>
          <li>Search for sponsors in your industry and region</li>
          <li>Send connection requests with a personalized message</li>
          <li>Review and accept sponsor invitations</li>
          <li>Establish service agreements through the platform</li>
          <li>Manage your sponsor relationships in the dashboard</li>
        </ol>
        <p>All agreements and terms are documented securely on the blockchain for transparency.</p>
      `,
      order: 2
    },
    {
      title: 'Post Job Opportunities',
      content: `
        <p>Create detailed, attractive job listings:</p>
        <ol>
          <li>Go to <strong>Jobs</strong> and click <strong>Post New Job</strong></li>
          <li>Select the sponsor this job is for</li>
          <li>Fill in all job details: title, description, requirements, benefits</li>
          <li>Specify salary range, location, and job type</li>
          <li>Add required documents and qualifications</li>
          <li>Set application deadlines and job duration</li>
        </ol>
        <p>Complete job listings receive 3x more qualified applications.</p>
      `,
      order: 3
    },
    {
      title: 'Review and Shortlist Candidates',
      content: `
        <p>Efficiently manage the candidate selection process:</p>
        <ol>
          <li>Access applications from your dashboard</li>
          <li>Review candidate profiles, documents, and cover letters</li>
          <li>Verify candidate information and qualification</li>
          <li>Add notes and ratings to each candidate</li>
          <li>Shortlist promising candidates for the sponsor's review</li>
          <li>Communicate with candidates through the secure messaging system</li>
        </ol>
        <p>All candidate interactions are documented for transparency and compliance.</p>
      `,
      order: 4
    },
    {
      title: 'Manage Placements and Payments',
      content: `
        <p>Track successful placements and secure payments:</p>
        <ol>
          <li>Update candidate status as they progress through the hiring process</li>
          <li>Generate employment contracts through the platform</li>
          <li>Use the escrow system for secure payment processing</li>
          <li>Track commission payments and release schedules</li>
          <li>Generate reports for your agency performance</li>
        </ol>
        <p>The ThiQaX escrow system ensures all parties fulfill their obligations before funds are released.</p>
      `,
      order: 5
    }
  ]
};

/**
 * Sponsor User Guide
 */
const sponsorGuide = {
  type: 'userGuide',
  title: 'Hiring Talent as a Sponsor',
  description: 'Complete guide to finding qualified candidates through ThiQaX',
  category: 'Onboarding',
  roles: ['sponsor'],
  steps: [
    {
      title: 'Complete Company Profile',
      content: `
        <p>Establish your company's presence on ThiQaX:</p>
        <ol>
          <li>Add your company name, logo, and contact information</li>
          <li>Upload company registration documents for verification</li>
          <li>Write a compelling company description and mission statement</li>
          <li>Specify your industry and company size</li>
          <li>Add team members who will manage recruitment</li>
        </ol>
        <p>A verified company profile attracts more qualified candidates.</p>
      `,
      order: 1
    },
    {
      title: 'Connect with Recruitment Agents',
      content: `
        <p>Build your network of trusted recruitment partners:</p>
        <ol>
          <li>Search for agents specializing in your industry</li>
          <li>Review agent profiles, ratings, and past placements</li>
          <li>Send connection requests with your specific recruitment needs</li>
          <li>Establish terms and conditions through service agreements</li>
          <li>Manage your agent relationships from your dashboard</li>
        </ol>
        <p>All agreements are securely recorded on the blockchain for transparency and accountability.</p>
      `,
      order: 2
    },
    {
      title: 'Create Job Requirements',
      content: `
        <p>Define your hiring needs in detail:</p>
        <ol>
          <li>Go to <strong>Jobs</strong> and click <strong>Create Requirement</strong></li>
          <li>Specify job titles, number of vacancies, and job descriptions</li>
          <li>Define required qualifications, experience, and skills</li>
          <li>Set salary ranges and employment terms</li>
          <li>Specify document requirements and verification needs</li>
          <li>Assign to specific agents or make available to all your connected agents</li>
        </ol>
        <p>Detailed requirements help agents find the right candidates more efficiently.</p>
      `,
      order: 3
    },
    {
      title: 'Review Candidate Profiles',
      content: `
        <p>Evaluate candidates submitted by your agents:</p>
        <ol>
          <li>Access candidate profiles from your dashboard</li>
          <li>Review work experience, qualifications, and skills</li>
          <li>Check verified documents and certifications</li>
          <li>View agent notes and recommendations</li>
          <li>Shortlist candidates for interviews</li>
        </ol>
        <p>All candidate information and documents are pre-verified for authenticity.</p>
      `,
      order: 4
    },
    {
      title: 'Secure Hiring and Payment Process',
      content: `
        <p>Complete the hiring process securely:</p>
        <ol>
          <li>Generate employment offers and contracts through the platform</li>
          <li>Use the escrow system to secure recruitment fees</li>
          <li>Release payments based on agreed milestones</li>
          <li>Rate and review your experience with the agent</li>
          <li>Track all placements and payments in your dashboard</li>
        </ol>
        <p>The escrow system ensures agents are paid only after successful placement and satisfaction with the candidate.</p>
      `,
      order: 5
    }
  ]
};

/**
 * Help Content for Registration Workflow
 */
const registrationHelp = [
  {
    type: 'help',
    title: 'Choosing the Right Account Type',
    content: `
      <p>ThiQaX offers three account types, each with specific features:</p>
      <ul>
        <li><strong>Job Seeker:</strong> For individuals looking for employment opportunities in the Middle East. This account type allows you to create a profile, upload documents, browse job listings, and apply for positions.</li>
        <li><strong>Agent:</strong> For recruitment agencies and independent recruiters who connect job seekers with employers. This account type enables posting jobs, managing candidate applications, and arranging placements.</li>
        <li><strong>Sponsor:</strong> For companies and individuals looking to hire talent. This account type allows posting job requirements, reviewing candidates, and completing the hiring process.</li>
      </ul>
      <p><strong>Note:</strong> Choose carefully as changing your account type later requires contacting support and additional verification.</p>
    `,
    workflow: 'registration'
  },
  {
    type: 'help',
    title: 'Account Verification Process',
    content: `
      <p>All accounts on ThiQaX undergo verification to ensure trust and security:</p>
      <ol>
        <li><strong>Email Verification:</strong> After registration, click the link in the verification email sent to your address.</li>
        <li><strong>Phone Verification:</strong> Add your phone number in your profile and verify via SMS code.</li>
        <li><strong>Identity Verification (KYC):</strong>
          <ul>
            <li>Job Seekers: Upload government-issued ID and proof of address</li>
            <li>Agents: Upload business registration, recruitment license, and personal ID</li>
            <li>Sponsors: Upload company registration, trade license, and authorized representative ID</li>
          </ul>
        </li>
        <li><strong>Verification Review:</strong> Our team will review your documents within 1-2 business days.</li>
      </ol>
      <p><strong>Important:</strong> You cannot apply for jobs, post listings, or access escrow services until verification is complete.</p>
    `,
    workflow: 'registration'
  },
  {
    type: 'help',
    title: 'Creating a Strong Password',
    content: `
      <p>For your security, ThiQaX requires strong passwords that meet these criteria:</p>
      <ul>
        <li>Minimum 8 characters in length</li>
        <li>At least one uppercase letter (A-Z)</li>
        <li>At least one lowercase letter (a-z)</li>
        <li>At least one number (0-9)</li>
        <li>At least one special character (@, $, !, %, *, ?, &)</li>
      </ul>
      <p><strong>Password Tips:</strong></p>
      <ul>
        <li>Don't reuse passwords from other sites</li>
        <li>Avoid using personal information like names or birthdays</li>
        <li>Consider using a password phrase made from the first letters of a memorable sentence</li>
        <li>Use a password manager to generate and store strong passwords</li>
      </ul>
    `,
    workflow: 'registration'
  }
];

/**
 * Help Content for Document Upload Workflow
 */
const documentUploadHelp = [
  {
    type: 'help',
    title: 'Required Documents Overview',
    content: `
      <p>Different account types require specific documents for verification:</p>
      
      <h4>Job Seekers:</h4>
      <ul>
        <li><strong>Identity Document:</strong> Passport, National ID, or Driver's License</li>
        <li><strong>Proof of Address:</strong> Utility bill, bank statement, or government letter (dated within last 3 months)</li>
        <li><strong>Educational Certificates:</strong> Degrees, diplomas, or professional certifications</li>
        <li><strong>Professional Documents:</strong> Work permits, licenses, or professional registrations</li>
      </ul>
      
      <h4>Agents:</h4>
      <ul>
        <li><strong>Business Registration:</strong> Certificate of incorporation or business registration</li>
        <li><strong>Recruitment License:</strong> Government-issued recruitment or manpower license</li>
        <li><strong>Tax Registration:</strong> VAT certificate or tax registration document</li>
        <li><strong>Director's ID:</strong> Passport or ID of the company director/owner</li>
      </ul>
      
      <h4>Sponsors:</h4>
      <ul>
        <li><strong>Company Registration:</strong> Certificate of incorporation or CR</li>
        <li><strong>Trade License:</strong> Business operation license</li>
        <li><strong>Authorization Letter:</strong> Letter authorizing the account holder to recruit on behalf of the company</li>
        <li><strong>Authorized Person's ID:</strong> Passport or ID of the authorized representative</li>
      </ul>
    `,
    workflow: 'document-upload'
  },
  {
    type: 'help',
    title: 'Document Verification Process',
    content: `
      <p>Understanding how document verification works on ThiQaX:</p>
      
      <ol>
        <li><strong>Document Upload:</strong> Upload your documents in the required format (JPEG, PNG, or PDF)</li>
        <li><strong>Initial Check:</strong> Our system performs an automated check for image quality and basic details</li>
        <li><strong>Manual Verification:</strong> Our verification team reviews each document for authenticity</li>
        <li><strong>Verification Status:</strong> Documents will be marked as:
          <ul>
            <li><strong>Pending:</strong> Awaiting review by our team</li>
            <li><strong>Verified:</strong> Document has been approved</li>
            <li><strong>Rejected:</strong> Document was found to have issues (with specific rejection reason)</li>
          </ul>
        </li>
        <li><strong>Notifications:</strong> You'll receive notifications about document status changes</li>
      </ol>
      
      <p><strong>Verification Timeframe:</strong> Most documents are verified within 24-48 hours.</p>
    `,
    workflow: 'document-upload'
  },
  {
    type: 'help',
    title: 'Document Upload Guidelines',
    content: `
      <p>Follow these guidelines to ensure quick verification of your documents:</p>
      
      <h4>File Requirements:</h4>
      <ul>
        <li><strong>Formats:</strong> JPEG, PNG, or PDF only</li>
        <li><strong>Size:</strong> Maximum 10MB per file</li>
        <li><strong>Quality:</strong> Clear, readable, and in color</li>
        <li><strong>Completeness:</strong> All corners and edges must be visible</li>
      </ul>
      
      <h4>Image Quality Tips:</h4>
      <ul>
        <li>Take photos in good lighting conditions</li>
        <li>Ensure all text is clearly readable</li>
        <li>Place documents against a dark, contrasting background</li>
        <li>Avoid glare or shadows on the document</li>
        <li>For multi-page documents, ensure all pages are included in the PDF</li>
      </ul>
      
      <h4>Common Rejection Reasons:</h4>
      <ul>
        <li>Blurry or unclear image</li>
        <li>Document is cropped or incomplete</li>
        <li>Document is expired</li>
        <li>Information doesn't match account details</li>
        <li>Document shows signs of alteration</li>
      </ul>
    `,
    workflow: 'document-upload'
  }
];

/**
 * Help Content for Job Application Workflow
 */
const jobApplicationHelp = [
  {
    type: 'help',
    title: 'Finding the Right Jobs',
    content: `
      <p>Tips for discovering the best job opportunities on ThiQaX:</p>
      
      <h4>Effective Search Strategies:</h4>
      <ul>
        <li><strong>Use Specific Keywords:</strong> Search for exact job titles, skills, or certifications</li>
        <li><strong>Filter by Location:</strong> Narrow down to specific cities or regions</li>
        <li><strong>Filter by Salary:</strong> Set minimum salary expectations</li>
        <li><strong>Filter by Job Type:</strong> Choose between full-time, part-time, or contract positions</li>
        <li><strong>Sort by Relevance:</strong> Find jobs that best match your profile</li>
      </ul>
      
      <h4>Verified vs. Unverified Listings:</h4>
      <p>Jobs with a <strong>blue verification checkmark</strong> have been verified by our team and are from trusted employers or agents. We recommend prioritizing verified listings for your safety.</p>
      
      <h4>Understanding Job Requirements:</h4>
      <p>Pay close attention to:</p>
      <ul>
        <li>Required experience and qualifications</li>
        <li>Document requirements for application</li>
        <li>Application deadlines</li>
        <li>Visa sponsorship details</li>
      </ul>
    `,
    workflow: 'job-application'
  },
  {
    type: 'help',
    title: 'Creating a Standout Application',
    content: `
      <p>How to make your application more competitive:</p>
      
      <h4>Cover Letter Tips:</h4>
      <ul>
        <li>Address the specific job requirements</li>
        <li>Highlight relevant experiences and achievements</li>
        <li>Explain why you're interested in this position</li>
        <li>Keep it concise (3-4 paragraphs)</li>
        <li>Proofread for grammar and spelling errors</li>
 

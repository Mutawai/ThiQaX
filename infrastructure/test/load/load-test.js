// infrastructure/test/load/load-test.js
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const successfulLogins = new Counter('successful_logins');
const successfulJobSearches = new Counter('successful_job_searches');
const successfulApplications = new Counter('successful_applications');
const apiLatency = new Trend('api_latency');
const queryLatency = new Trend('query_latency');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.staging.thiqax.com';
const JOB_SEEKER_RATIO = 0.7;
const AGENT_RATIO = 0.15;
const SPONSOR_RATIO = 0.15;

// Test users
const USERS = {
  JOB_SEEKERS: [
    { email: 'jobseeker1@thiqax.com', password: 'Password123!' },
    { email: 'jobseeker2@thiqax.com', password: 'Password123!' },
    { email: 'jobseeker3@thiqax.com', password: 'Password123!' },
    { email: 'jobseeker4@thiqax.com', password: 'Password123!' },
    { email: 'jobseeker5@thiqax.com', password: 'Password123!' }
  ],
  AGENTS: [
    { email: 'agent1@thiqax.com', password: 'Password123!' },
    { email: 'agent2@thiqax.com', password: 'Password123!' }
  ],
  SPONSORS: [
    { email: 'sponsor1@thiqax.com', password: 'Password123!' },
    { email: 'sponsor2@thiqax.com', password: 'Password123!' }
  ]
};

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export let options = {
  // Scenarios simulate different user types and behavior patterns
  scenarios: {
    // Job seekers scenario (browsing and applying)
    job_seekers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 VUs over 1 minute
        { duration: '3m', target: 10 },   // Stay at 10 VUs for 3 minutes
        { duration: '1m', target: 25 },   // Ramp up to 25 VUs over 1 minute
        { duration: '3m', target: 25 },   // Stay at 25 VUs for 3 minutes
        { duration: '1m', target: 0 }     // Ramp down to 0 VUs
      ],
      exec: 'jobSeekerFlow',
      env: { USER_TYPE: 'JOB_SEEKER' }
    },
    
    // Agents scenario (managing jobs and candidates)
    agents: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 3 },    // Ramp up to 3 VUs over 1 minute
        { duration: '5m', target: 3 },    // Stay at 3 VUs for 5 minutes
        { duration: '1m', target: 5 },    // Ramp up to 5 VUs over 1 minute
        { duration: '2m', target: 5 },    // Stay at 5 VUs for 2 minutes
        { duration: '1m', target: 0 }     // Ramp down to 0 VUs
      ],
      exec: 'agentFlow',
      env: { USER_TYPE: 'AGENT' }
    },
    
    // Sponsors scenario (posting jobs and reviewing applications)
    sponsors: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 3 },    // Ramp up to 3 VUs over 1 minute
        { duration: '5m', target: 3 },    // Stay at 3 VUs for 5 minutes
        { duration: '1m', target: 5 },    // Ramp up to 5 VUs over 1 minute
        { duration: '2m', target: 5 },    // Stay at 5 VUs for 2 minutes
        { duration: '1m', target: 0 }     // Ramp down to 0 VUs
      ],
      exec: 'sponsorFlow',
      env: { USER_TYPE: 'SPONSOR' }
    },
    
    // Spike test to simulate sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },   // Stay at 0 VUs for 10 seconds
        { duration: '30s', target: 50 },  // Ramp up to 50 VUs over 30 seconds
        { duration: '1m', target: 50 },   // Stay at 50 VUs for 1 minute
        { duration: '30s', target: 0 }    // Ramp down to 0 VUs
      ],
      exec: 'mixedFlow',
      env: { USER_TYPE: 'MIXED' }
    }
  },
  
  thresholds: {
    // API response time thresholds
    'http_req_duration': ['p(95)<1000', 'p(99)<1500'],  // 95% of requests should be below 1s, 99% below 1.5s
    'http_req_failed': ['rate<0.05'],                   // Error rate should be below 5%
    
    // Custom metrics thresholds
    'error_rate': ['rate<0.05'],                         // Overall error rate below 5%
    'api_latency': ['p(95)<800'],                        // API latency below 800ms for 95% of requests
    'query_latency': ['p(95)<600'],                      // Query latency below 600ms for 95% of requests
  },
};

// Setup function - runs once at the beginning of the test
export function setup() {
  // Verify API availability
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'API is available': (r) => r.status === 200
  });
  
  // Return test context that will be passed to the VUs
  return {
    baseUrl: BASE_URL
  };
}

// Job seeker user flow
export function jobSeekerFlow(testContext) {
  // Get base URL from context
  const baseUrl = testContext.baseUrl;
  let token = null;
  
  // 1. Login
  group('Job Seeker - Login', function() {
    // Select a random job seeker
    const user = USERS.JOB_SEEKERS[Math.floor(Math.random() * USERS.JOB_SEEKERS.length)];
    
    const loginResponse = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), { headers });
    
    // Check login success
    const loginSuccess = check(loginResponse, {
      'Login successful': (r) => r.status === 200 && r.json('token') !== undefined
    });
    
    if (loginSuccess) {
      successfulLogins.add(1);
      token = loginResponse.json('token');
      // Set token for subsequent requests
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      errorRate.add(1);
      console.error(`Login failed for ${user.email}: ${loginResponse.status} ${loginResponse.body}`);
    }
  });
  
  // Proceed only if login was successful
  if (token) {
    // 2. Search for jobs
    group('Job Seeker - Search Jobs', function() {
      // Search with different criteria
      const searchParams = [
        '', // No filter - get all jobs
        'location=Saudi Arabia',
        'location=UAE',
        'jobType=FULL_TIME',
        'keyword=engineer',
        'keyword=manager'
      ];
      
      // Select a random search parameter
      const searchParam = searchParams[Math.floor(Math.random() * searchParams.length)];
      
      const searchStart = new Date();
      const searchResponse = http.get(`${baseUrl}/api/jobs?${searchParam}`, { 
        headers,
        tags: { name: 'SearchJobs' }
      });
      const searchDuration = new Date() - searchStart;
      
      // Record query latency
      queryLatency.add(searchDuration);
      
      // Check search results
      const searchSuccess = check(searchResponse, {
        'Search successful': (r) => r.status === 200,
        'Search returns jobs': (r) => r.json('jobs') !== undefined && r.json('jobs').length > 0
      });
      
      if (searchSuccess) {
        successfulJobSearches.add(1);
        
        // Store job IDs for potential application
        let jobIds = searchResponse.json('jobs').map(job => job._id);
        
        // If jobs were found, select one randomly to view details
        if (jobIds.length > 0) {
          const selectedJobId = jobIds[Math.floor(Math.random() * jobIds.length)];
          
          // 3. View job details
          const jobDetailsResponse = http.get(`${baseUrl}/api/jobs/${selectedJobId}`, { 
            headers,
            tags: { name: 'GetJobDetails' }
          });
          
          check(jobDetailsResponse, {
            'Job details loaded': (r) => r.status === 200 && r.json('job') !== undefined,
            'Job details complete': (r) => 
              r.json('job.title') !== undefined && 
              r.json('job.description') !== undefined
          });
          
          // 4. Apply for job (25% of the time)
          if (Math.random() < 0.25

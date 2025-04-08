// performance/load-test.js
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomItem } from './helpers.js';

// Custom metrics
const apiCalls = new Counter('api_calls');
const errorRate = new Rate('error_rate');
const authFailures = new Counter('auth_failures');
const jobListingLatency = new Trend('job_listing_latency');

// Test configuration
export let options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 } // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'], // Less than 1% of requests should fail
    'job_listing_latency': ['p(95)<300'], // 95% of job listing requests should be below 300ms
    'error_rate': ['rate<0.05'] // Error rate should be less than 5%
  }
};

// Simulated user data
const jobSeekers = [
  { email: 'james.kamau@example.com', password: 'password123' },
  { email: 'mary.wangari@example.com', password: 'password123' },
  { email: 'john.ochieng@example.com', password: 'password123' },
  { email: 'jane.adhiambo@example.com', password: 'password123' }
];

// API base URL
const baseUrl = __ENV.API_URL || 'https://staging.thiqax.com/api';

// Main test function
export default function() {
  let token;
  
  group('Authentication', function() {
    // Login as random user
    const user = randomItem(jobSeekers);
    const loginRes = http.post(`${baseUrl}/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    apiCalls.add(1);
    
    // Check if login was successful
    const loginSuccess = check(loginRes, {
      'Status is 200': (r) => r.status === 200,
      'Has access token': (r) => r.json('token') !== undefined
    });
    
    if (!loginSuccess) {
      errorRate.add(true);
      authFailures.add(1);
      console.log(`Login failed for ${user.email}: ${loginRes.status} ${loginRes.body}`);
      return;
    }
    
    errorRate.add(false);
    token = loginRes.json('token');
  });
  
  // Skip subsequent requests if login failed
  if (!token) return;
  
  group('Job Listings', function() {
    // Get job listings with search parameters
    const params = {
      limit: 10,
      page: 1,
      location: randomItem(['Dubai', 'Riyadh', 'Doha', 'Abu Dhabi']),
      jobType: randomItem(['FULL_TIME', 'CONTRACT', 'TEMPORARY'])
    };
    
    const searchUrl = `${baseUrl}/jobs/search?` + new URLSearchParams(params).toString();
    
    const before = new Date();
    const jobListingsRes = http.get(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const after = new Date();
    
    jobListingLatency.add(after - before);
    apiCalls.add(1);
    
    check(jobListingsRes, {
      'Status is 200': (r) => r.status === 200,
      'Has jobs array': (r) => Array.isArray(r.json('jobs')),
      'Has pagination': (r) => r.json('pagination') !== undefined
    }) || errorRate.add(true);
    
    // View job details for a random job if there are results
    if (jobListingsRes.status === 200 && jobListingsRes.json('jobs').length > 0) {
      const jobs = jobListingsRes.json('jobs');
      const randomJob = randomItem(jobs);
      
      const jobDetailsRes = http.get(`${baseUrl}/jobs/${randomJob.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      apiCalls.add(1);
      
      check(jobDetailsRes, {
        'Status is 200': (r) => r.status === 200,
        'Job details match': (r) => r.json('id') === randomJob.id
      }) || errorRate.add(true);
    }
  });
  
  group('Profile Management', function() {
    // Get user profile
    const profileRes = http.get(`${baseUrl}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    apiCalls.add(1);
    
    check(profileRes, {
      'Status is 200': (r) => r.status === 200,
      'Has user info': (r) => r.json('personalInfo') !== undefined
    }) || errorRate.add(true);
    
    // Get user documents
    const documentsRes = http.get(`${baseUrl}/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    apiCalls.add(1);
    
    check(documentsRes, {
      'Status is 200': (r) => r.status === 200,
      'Has documents array': (r) => Array.isArray(r.json('documents'))
    }) || errorRate.add(true);
  });
  
  group('Applications', function() {
    // Get user applications
    const applicationsRes = http.get(`${baseUrl}/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    apiCalls.add(1);
    
    check(applicationsRes, {
      'Status is 200': (r) => r.status === 200,
      'Has applications array': (r) => Array.isArray(r.json('applications'))
    }) || errorRate.add(true);
    
    // If user has applications, view details of one
    if (applicationsRes.status === 200 && applicationsRes.json('applications').length > 0) {
      const applications = applicationsRes.json('applications');
      const randomApp = randomItem(applications);
      
      const appDetailsRes = http.get(`${baseUrl}/applications/${randomApp.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      apiCalls.add(1);
      
      check(appDetailsRes, {
        'Status is 200': (r) => r.status === 200,
        'Application details match': (r) => r.json('id') === randomApp.id
      }) || errorRate.add(true);
    }
  });
  
  group('Notifications', function() {
    // Get user notifications
    const notificationsRes = http.get(`${baseUrl}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10,
        page: 1
      }
    });
    
    apiCalls.add(1);
    
    check(notificationsRes, {
      'Status is 200': (r) => r.status === 200,
      'Has notifications array': (r) => Array.isArray(r.json('notifications'))
    }) || errorRate.add(true);
    
    // Mark notifications as read (if there are unread notifications)
    if (notificationsRes.status === 200) {
      const notifications = notificationsRes.json('notifications');
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      if (unreadNotifications.length > 0) {
        const randomNotification = randomItem(unreadNotifications);
        
        const markReadRes = http.put(`${baseUrl}/notifications/${randomNotification.id}/read`, null, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        apiCalls.add(1);
        
        check(markReadRes, {
          'Status is 200': (r) => r.status === 200,
          'Notification marked as read': (r) => r.json('isRead') === true
        }) || errorRate.add(true);
      }
    }
  });
  
  // Add some think time between iterations to simulate real user behavior
  sleep(Math.random() * 3 + 2); // Random sleep between 2-5 seconds
}

// Helper functions
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Define custom metrics
const errorRate = new Rate('error_rate');
const authSuccessRate = new Rate('auth_success_rate');
const documentUploadSuccessRate = new Rate('document_upload_success_rate');

// Create custom trends for detailed response time tracking
const authTrend = new Trend('auth_duration');
const getUserProfileTrend = new Trend('get_user_profile_duration');
const documentUploadTrend = new Trend('document_upload_duration');
const documentListTrend = new Trend('document_list_duration');
const documentVerificationTrend = new Trend('document_verification_duration');
const searchTrend = new Trend('search_duration');

// Configuration options for the test scenarios
export const options = {
  scenarios: {
    // Smoke test - light load to verify system functionality
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },
    // Load test - moderate load to assess system performance under normal conditions
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 users over 2 minutes
        { duration: '5m', target: 50 },  // Stay at 50 users for 5 minutes
        { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
      ],
      tags: { test_type: 'load' },
    },
    // Stress test - heavy load to identify breaking points
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 requests per second over 2 minutes
        { duration: '5m', target: 50 },   // Stay at 50 requests per second for 5 minutes
        { duration: '5m', target: 100 },  // Ramp up to 100 requests per second over 5 minutes
        { duration: '5m', target: 100 },  // Stay at 100 requests per second for 5 minutes
        { duration: '2m', target: 0 },    // Ramp down to 0 requests per second over 2 minutes
      ],
      tags: { test_type: 'stress' },
    },
    // Soak test - extended duration to identify resource leaks
    soak: {
      executor: 'constant-vus',
      vus: 30,
      duration: '30m',
      tags: { test_type: 'soak' },
    },
    // Spike test - sudden surge to assess system recovery
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 },  // Rapidly ramp up to 200 users
        { duration: '1m', target: 200 },   // Stay at 200 users for 1 minute
        { duration: '10s', target: 0 },    // Rapidly ramp down to 0 users
      ],
      tags: { test_type: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
    'http_req_duration{endpoint:login}': ['p(95)<400'], // Login should be faster
    'http_req_duration{endpoint:document_upload}': ['p(95)<800'], // Document upload can be slower
    'auth_success_rate': ['rate>0.95'], // Auth success rate should be above 95%
    'document_upload_success_rate': ['rate>0.95'], // Document upload success rate should be above 95%
    'error_rate': ['rate<0.05'], // Overall error rate should be below 5%
  },
};

// Environment configuration
const environments = {
  local: {
    baseUrl: 'http://localhost:5000',
  },
  staging: {
    baseUrl: 'https://staging.thiqax.com',
  },
  production: {
    baseUrl: 'https://thiqax.com',
  },
};

// Get environment from environment variable or default to local
const env = __ENV.ENVIRONMENT || 'local';
const config = environments[env];

// Setup: executed once per VU before the test scenarios
export function setup() {
  console.log(`Running performance test against ${config.baseUrl}`);
  
  // Create test users for the test
  const testUsers = [];
  
  // Create 20 test users with different profiles
  for (let i = 0; i < 20; i++) {
    const username = `perf_test_user_${i}_${Date.now()}`;
    const email = `${username}@example.com`;
    
    testUsers.push({
      username: username,
      email: email,
      password: 'TestPassword123!',
      profile: {
        firstName: `TestFirst${i}`,
        lastName: `TestLast${i}`,
        phoneNumber: `+1555123${i.toString().padStart(4, '0')}`,
      }
    });
  }
  
  // Create a sample document for upload tests
  const sampleDocument = {
    filename: 'sample_document.pdf',
    content: 'This is a sample document content for testing purposes.',
    mimeType: 'application/pdf',
  };
  
  return {
    testUsers: testUsers,
    sampleDocument: sampleDocument,
  };
}

// Default function that is executed for each VU
export default function(data) {
  // Select a random test user from the pool
  const userIndex = __VU % data.testUsers.length;
  const user = data.testUsers[userIndex];
  
  // Session object to store auth tokens
  const session = { token: null };

  group('Authentication Flow', function() {
    // User Registration
    if (__ITER === 0) { // Only register on first iteration for each VU
      const registerUrl = `${config.baseUrl}/api/v1/auth/register`;
      const registerPayload = JSON.stringify({
        username: user.username,
        email: user.email,
        password: user.password,
        profile: user.profile
      });
      
      const registerParams = {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'register' },
      };
      
      const registerResponse = http.post(registerUrl, registerPayload, registerParams);
      
      check(registerResponse, {
        'Registration successful': (r) => r.status === 201,
        'Registration response includes user data': (r) => r.json('data.user') !== null,
      });
      
      sleep(1);
    }
    
    // User Login
    const loginStart = new Date();
    const loginUrl = `${config.baseUrl}/api/v1/auth/login`;
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password
    });
    
    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'login' },
    };
    
    const loginResponse = http.post(loginUrl, loginPayload, loginParams);
    authTrend.add(new Date() - loginStart);
    
    const loginCheck = check(loginResponse, {
      'Login successful': (r) => r.status === 200,
      'Login response includes token': (r) => r.json('data.token') !== null,
    });
    
    authSuccessRate.add(loginCheck);
    errorRate.add(!loginCheck);
    
    if (loginCheck) {
      session.token = loginResponse.json('data.token');
    } else {
      console.error(`Login failed: ${loginResponse.status} ${loginResponse.body}`);
      return; // Skip the rest of the test if login fails
    }
    
    sleep(1);
  });
  
  // Only continue if authenticated
  if (!session.token) {
    return;
  }
  
  group('User Profile Operations', function() {
    // Get User Profile
    const profileStart = new Date();
    const profileUrl = `${config.baseUrl}/api/v1/users/profile`;
    const profileParams = {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      tags: { endpoint: 'get_profile' },
    };
    
    const profileResponse = http.get(profileUrl, profileParams);
    getUserProfileTrend.add(new Date() - profileStart);
    
    check(profileResponse, {
      'Get profile successful': (r) => r.status === 200,
      'Profile data is correct': (r) => {
        const profile = r.json('data.profile');
        return profile 
          && profile.firstName === user.profile.firstName
          && profile.lastName === user.profile.lastName;
      },
    });
    
    // Update User Profile (50% of the time)
    if (Math.random() > 0.5) {
      const updateProfileUrl = `${config.baseUrl}/api/v1/users/profile`;
      const updatedProfile = {
        ...user.profile,
        address: `${Math.floor(Math.random() * 1000)} Test St`,
        city: 'Test City',
        state: 'Test State',
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      };
      
      const updatePayload = JSON.stringify({
        profile: updatedProfile
      });
      
      const updateParams = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        tags: { endpoint: 'update_profile' },
      };
      
      const updateResponse = http.put(updateProfileUrl, updatePayload, updateParams);
      
      check(updateResponse, {
        'Update profile successful': (r) => r.status === 200,
        'Profile update confirmed': (r) => r.json('success') === true,
      });
    }
    
    sleep(Math.random() * 3);
  });
  
  group('Document Management', function() {
    // Upload Document
    const uploadStart = new Date();
    const uploadUrl = `${config.baseUrl}/api/v1/documents/upload`;
    
    // Create a FormData-like payload for document upload
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    let uploadPayload = '';
    
    // Add form fields
    uploadPayload += `--${boundary}\r\n`;
    uploadPayload += 'Content-Disposition: form-data; name="documentType"\r\n\r\n';
    uploadPayload += 'identification\r\n';
    
    uploadPayload += `--${boundary}\r\n`;
    uploadPayload += 'Content-Disposition: form-data; name="description"\r\n\r\n';
    uploadPayload += 'Test document upload\r\n';
    
    // Add file
    uploadPayload += `--${boundary}\r\n`;
    uploadPayload += `Content-Disposition: form-data; name="document"; filename="${data.sampleDocument.filename}"\r\n`;
    uploadPayload += `Content-Type: ${data.sampleDocument.mimeType}\r\n\r\n`;
    uploadPayload += `${data.sampleDocument.content}\r\n`;
    
    uploadPayload += `--${boundary}--\r\n`;
    
    const uploadParams = {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${session.token}`,
      },
      tags: { endpoint: 'document_upload' },
    };
    
    const uploadResponse = http.post(uploadUrl, uploadPayload, uploadParams);
    documentUploadTrend.add(new Date() - uploadStart);
    
    const uploadCheck = check(uploadResponse, {
      'Document upload successful': (r) => r.status === 201,
      'Upload response includes document ID': (r) => r.json('data.document.id') !== null,
    });
    
    documentUploadSuccessRate.add(uploadCheck);
    errorRate.add(!uploadCheck);
    
    let documentId = null;
    if (uploadCheck) {
      documentId = uploadResponse.json('data.document.id');
    }
    
    sleep(2); // Allow time for document processing
    
    // List Documents
    const listStart = new Date();
    const listUrl = `${config.baseUrl}/api/v1/documents`;
    const listParams = {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      tags: { endpoint: 'document_list' },
    };
    
    const listResponse = http.get(listUrl, listParams);
    documentListTrend.add(new Date() - listStart);
    
    check(listResponse, {
      'Document list successful': (r) => r.status === 200,
      'Document list is an array': (r) => Array.isArray(r.json('data.documents')),
    });
    
    // Document Verification Request (if we have a document ID)
    if (documentId) {
      const verifyStart = new Date();
      const verifyUrl = `${config.baseUrl}/api/v1/documents/${documentId}/verify`;
      const verifyPayload = JSON.stringify({
        verifyNow: true
      });
      
      const verifyParams = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        tags: { endpoint: 'document_verification' },
      };
      
      const verifyResponse = http.post(verifyUrl, verifyPayload, verifyParams);
      documentVerificationTrend.add(new Date() - verifyStart);
      
      check(verifyResponse, {
        'Verification request successful': (r) => r.status === 202,
        'Verification process initiated': (r) => r.json('data.status') === 'processing',
      });
    }
    
    sleep(Math.random() * 3);
  });
  
  group('Search Operations', function() {
    // Perform search with random term
    const searchTerms = [
      'passport',
      'driver license',
      'identity',
      'verification',
      'document',
      'certificate',
      'approval',
      'pending',
      'test'
    ];
    
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const searchStart = new Date();
    const searchUrl = `${config.baseUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}`;
    
    const searchParams = {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      tags: { endpoint: 'search' },
    };
    
    const searchResponse = http.get(searchUrl, searchParams);
    searchTrend.add(new Date() - searchStart);
    
    check(searchResponse, {
      'Search request successful': (r) => r.status === 200,
      'Search results returned': (r) => r.json('data.results') !== null,
    });
    
    sleep(Math.random() * 2);
  });
  
  // Logout (50% of the time)
  if (Math.random() > 0.5) {
    const logoutUrl = `${config.baseUrl}/api/v1/auth/logout`;
    const logoutParams = {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      tags: { endpoint: 'logout' },
    };
    
    const logoutResponse = http.post(logoutUrl, null, logoutParams);
    
    check(logoutResponse, {
      'Logout successful': (r) => r.status === 200,
    });
  }
  
  // Random sleep between 1-5 seconds between iterations
  sleep(Math.random() * 4 + 1);
}

// Teardown: executed once after all VUs complete
export function teardown(data) {
  console.log('Performance test completed');
  
  // Clean up test users (would be implemented in a real scenario)
  // This is a placeholder for actual cleanup code
  /*
  for (const user of data.testUsers) {
    http.delete(`${config.baseUrl}/api/v1/admin/users/${user.email}`, null, {
      headers: {
        'Authorization': 'Bearer ' + adminToken
      }
    });
  }
  */
}

// Generate human-readable HTML report
export function handleSummary(data) {
  return {
    'performance-test-report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

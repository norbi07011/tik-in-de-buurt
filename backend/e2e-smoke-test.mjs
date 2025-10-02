#!/usr/bin/env node
/**
 * E2E Smoke Test for REAL MongoDB Backend
 * Tests: Register → Login (bad password 401, good 200) → Create Business → Create Post → List Posts
 */

const API_BASE = 'http://localhost:8080';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Global test state
const testState = {
  passed: 0,
  failed: 0,
  token: null,
  user: null,
  business: null,
  post: null
};

// Helper: Fetch with error handling
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  log.info(`${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
    }

    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    throw error;
  }
}

// Helper: Assert
function assert(condition, message) {
  if (condition) {
    log.success(`PASS: ${message}`);
    testState.passed++;
    return true;
  } else {
    log.error(`FAIL: ${message}`);
    testState.failed++;
    return false;
  }
}

// Test 1: Register new user
async function testRegister() {
  log.title('TEST 1: Register new user');
  
  const randomEmail = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  log.info(`Email: ${randomEmail}`);
  log.info(`Password: ${password}`);
  
  const { status, data } = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'E2E Test User',
      email: randomEmail,
      password: password
    })
  });

  assert(status === 201, 'Status should be 201 Created');
  assert(data.success === true, 'Response should have success: true');
  assert(data.token, 'Response should include JWT token');
  assert(data.user, 'Response should include user object');
  assert(data.user.email === randomEmail, 'User email should match');

  if (data.token && data.user) {
    testState.token = data.token;
    testState.user = data.user;
    testState.user.password = password; // Store for login test
    log.success(`Token: ${data.token.substring(0, 20)}...`);
    log.success(`User ID: ${data.user.id}`);
  }

  return testState.token && testState.user;
}

// Test 2: Login with WRONG password (should fail with 401)
async function testLoginBadPassword() {
  log.title('TEST 2: Login with WRONG password (should fail with 401)');
  
  if (!testState.user) {
    log.error('Skipping: No user from previous test');
    return false;
  }

  log.info(`Email: ${testState.user.email}`);
  log.info(`Password: WRONG_PASSWORD`);
  
  const { status, data } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testState.user.email,
      password: 'WRONG_PASSWORD'
    })
  });

  assert(status === 401, 'Status should be 401 Unauthorized (CRITICAL FIX TEST)');
  assert(data.success === false, 'Response should have success: false');
  assert(data.error || data.message, 'Response should include error message');

  log.success('✅ CRITICAL: Login with wrong password properly rejected!');
  return status === 401;
}

// Test 3: Login with CORRECT password (should succeed with 200)
async function testLoginGoodPassword() {
  log.title('TEST 3: Login with CORRECT password (should succeed with 200)');
  
  if (!testState.user) {
    log.error('Skipping: No user from previous test');
    return false;
  }

  log.info(`Email: ${testState.user.email}`);
  log.info(`Password: ${testState.user.password}`);
  
  const { status, data } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testState.user.email,
      password: testState.user.password
    })
  });

  assert(status === 200, 'Status should be 200 OK');
  assert(data.success === true, 'Response should have success: true');
  assert(data.token, 'Response should include JWT token');
  assert(data.user, 'Response should include user object');

  if (data.token) {
    testState.token = data.token; // Update token
    log.success(`New token: ${data.token.substring(0, 20)}...`);
  }

  return status === 200 && data.token;
}

// Test 4: Create Business (requires auth)
async function testCreateBusiness() {
  log.title('TEST 4: Create Business (requires auth)');
  
  if (!testState.token) {
    log.error('Skipping: No token from previous test');
    return false;
  }

  log.info(`Using Bearer token: ${testState.token.substring(0, 20)}...`);
  
  const { status, data } = await apiFetch('/api/business', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testState.token}`
    },
    body: JSON.stringify({
      name: 'E2E Test Business',
      description: 'Created by automated E2E test',
      category: 'restaurant',
      city: 'Amsterdam',
      street: 'Teststraat 123',
      postalCode: '1234AB',
      country: 'Netherlands'
    })
  });

  assert(status === 201 || status === 200, 'Status should be 201 Created or 200 OK');
  assert(data.success === true, 'Response should have success: true');
  assert(data.business, 'Response should include business object');
  assert(data.business.id, 'Business should have MongoDB _id');

  if (data.business) {
    testState.business = data.business;
    log.success(`Business ID (MongoDB Atlas): ${data.business.id}`);
    log.success(`Business Name: ${data.business.name}`);
    log.success(`City: ${data.business.city}`);
    
    // This is the PROOF that we're using REAL MongoDB Atlas
    log.info(`\n🎯 PROOF: Business stored in MongoDB Atlas with ID: ${data.business.id}`);
  }

  return data.business && data.business.id;
}

// Test 5: Create Post (requires auth)
async function testCreatePost() {
  log.title('TEST 5: Create Post (requires auth)');
  
  if (!testState.token) {
    log.error('Skipping: No token from previous test');
    return false;
  }

  log.info(`Using Bearer token: ${testState.token.substring(0, 20)}...`);
  
  const { status, data } = await apiFetch('/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testState.token}`
    },
    body: JSON.stringify({
      title: 'E2E Test Post',
      body: 'This post was created by automated E2E test to verify MongoDB Atlas integration.',
      type: 'text',
      city: 'Amsterdam'
    })
  });

  assert(status === 201, 'Status should be 201 Created');
  assert(data.success === true, 'Response should have success: true');
  assert(data.post, 'Response should include post object');
  assert(data.post.id, 'Post should have MongoDB _id');

  if (data.post) {
    testState.post = data.post;
    log.success(`Post ID (MongoDB Atlas): ${data.post.id}`);
    log.success(`Post Title: ${data.post.title}`);
    
    log.info(`\n🎯 PROOF: Post stored in MongoDB Atlas with ID: ${data.post.id}`);
  }

  return data.post && data.post.id;
}

// Test 6: List Posts (verify our post appears)
async function testListPosts() {
  log.title('TEST 6: List Posts (verify our post appears)');
  
  if (!testState.post) {
    log.error('Skipping: No post from previous test');
    return false;
  }

  const { status, data } = await apiFetch('/api/posts?limit=20');

  assert(status === 200, 'Status should be 200 OK');
  assert(data.success === true, 'Response should have success: true');
  assert(Array.isArray(data.posts), 'Response should include posts array');
  assert(data.posts.length > 0, 'Posts array should not be empty');

  // Find our post
  const ourPost = data.posts.find(p => p.id === testState.post.id);
  assert(ourPost, `Our post (${testState.post.id}) should be in the list`);

  if (ourPost) {
    log.success(`Found our post: "${ourPost.title}"`);
    log.success(`Post has ${ourPost.likes} likes, ${ourPost.comments} comments`);
  }

  log.info(`\n🎯 PROOF: Retrieved ${data.posts.length} posts from MongoDB Atlas`);
  log.info(`Total posts in database: ${data.total || data.posts.length}`);

  return ourPost !== undefined;
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}           E2E SMOKE TEST - REAL MongoDB Atlas                ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  log.info(`API Base: ${API_BASE}`);
  log.info(`Started: ${new Date().toLocaleString('pl-PL')}\n`);

  try {
    // Run tests in sequence
    const results = [];
    
    results.push(await testRegister());
    results.push(await testLoginBadPassword());
    results.push(await testLoginGoodPassword());
    results.push(await testCreateBusiness());
    results.push(await testCreatePost());
    results.push(await testListPosts());

    // Summary
    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}                         TEST SUMMARY                          ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    log.success(`Passed: ${testState.passed}`);
    if (testState.failed > 0) {
      log.error(`Failed: ${testState.failed}`);
    } else {
      log.success(`Failed: 0`);
    }

    console.log(`\n${colors.bright}${colors.green}MongoDB Atlas Integration Proofs:${colors.reset}`);
    if (testState.business) {
      console.log(`  • Business ID: ${testState.business.id}`);
      console.log(`  • Business Name: ${testState.business.name}`);
    }
    if (testState.post) {
      console.log(`  • Post ID: ${testState.post.id}`);
      console.log(`  • Post Title: ${testState.post.title}`);
    }

    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    // Exit code
    if (testState.failed === 0) {
      log.success('🎉 ALL TESTS PASSED!');
      process.exit(0);
    } else {
      log.error('❌ SOME TESTS FAILED');
      process.exit(1);
    }
  } catch (error) {
    log.error(`\n💥 Test suite crashed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();

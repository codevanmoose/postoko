#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testDeployment() {
  console.log('🔍 Testing Postoko deployment...\n');

  const urls = [
    'https://postoko-htwk2zxkk-vanmooseprojects.vercel.app',
    'https://postoko-htwk2zxkk-vanmooseprojects.vercel.app/api/health',
    'https://postoko.vercel.app',
    'https://postoko-vanmooseprojects.vercel.app'
  ];

  for (const url of urls) {
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetchUrl(url);
      console.log(`✅ Status: ${response.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
      
      if (response.statusCode === 404) {
        console.log(`   ❌ 404 Not Found`);
      } else if (response.statusCode === 200) {
        console.log(`   ✅ Success!`);
        console.log(`   Body preview: ${response.body.substring(0, 200)}...`);
      } else if (response.statusCode >= 300 && response.statusCode < 400) {
        console.log(`   ↪️ Redirect to: ${response.headers.location}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test Vercel API to check deployments
  console.log('\n📊 Checking Vercel deployment status...');
  if (process.env.VERCEL_TOKEN) {
    try {
      const vercelResponse = await fetchUrl(
        'https://api.vercel.com/v9/projects/postoko/deployments?limit=5',
        {
          headers: {
            'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
          }
        }
      );
      
      const deployments = JSON.parse(vercelResponse.body);
      console.log('Recent deployments:');
      deployments.deployments?.slice(0, 3).forEach(dep => {
        console.log(`- ${dep.url} [${dep.state}] ${new Date(dep.created).toLocaleString()}`);
      });
    } catch (error) {
      console.log('Could not fetch Vercel deployments:', error.message);
    }
  } else {
    console.log('VERCEL_TOKEN not set - skipping Vercel API check');
  }

  // Check common deployment issues
  console.log('\n🔧 Common deployment issues to check:');
  console.log('1. Build output directory: Should be ".next" for Next.js');
  console.log('2. Root directory: Should be "apps/web" for monorepo');
  console.log('3. Environment variables: All required vars must be set');
  console.log('4. Build command: Should complete successfully');
  console.log('5. Framework preset: Should detect Next.js automatically');
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    }).on('error', reject);
  });
}

// Run the test
testDeployment().catch(console.error);
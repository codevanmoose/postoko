#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

async function testDeployment() {
  console.log('🔍 Testing Postoko Live Deployment...\n');
  
  // Define all URLs to test
  const urls = [
    { url: 'https://postoko.com', description: 'Main domain' },
    { url: 'https://www.postoko.com', description: 'WWW subdomain' },
    { url: 'https://postoko-beta.vercel.app', description: 'Vercel default domain' },
    { url: 'https://postoko.com/login', description: 'Login page' },
    { url: 'https://postoko.com/signup', description: 'Signup page' },
    { url: 'https://postoko.com/api/health', description: 'API health check' }
  ];

  console.log('='.repeat(80));
  
  for (const test of urls) {
    console.log(`\n📌 Testing: ${test.description}`);
    console.log(`URL: ${test.url}`);
    console.log('-'.repeat(60));
    
    try {
      const result = await followRedirects(test.url);
      
      console.log(`✅ Status: ${result.statusCode}`);
      console.log(`📍 Final URL: ${result.finalUrl}`);
      
      if (result.redirects.length > 0) {
        console.log(`↪️  Redirects: ${result.redirects.join(' → ')}`);
      }
      
      // Check content type
      if (result.headers['content-type']) {
        console.log(`📄 Content-Type: ${result.headers['content-type']}`);
      }
      
      // For HTML pages, check if we got actual content
      if (result.headers['content-type']?.includes('text/html')) {
        const hasContent = result.body.length > 100;
        const hasDoctype = result.body.toLowerCase().includes('<!doctype html>');
        console.log(`📝 HTML Content: ${hasContent ? 'Yes' : 'No'} (${result.body.length} bytes)`);
        console.log(`🏷️  Valid HTML: ${hasDoctype ? 'Yes' : 'No'}`);
        
        // Check for common error indicators
        const lowerBody = result.body.toLowerCase();
        if (lowerBody.includes('404') || lowerBody.includes('not found')) {
          console.log(`⚠️  Warning: Page contains '404' or 'not found'`);
        }
        if (lowerBody.includes('error') && !lowerBody.includes('errorboundary')) {
          console.log(`⚠️  Warning: Page contains 'error' text`);
        }
      }
      
      // For API endpoints
      if (test.url.includes('/api/')) {
        try {
          const json = JSON.parse(result.body);
          console.log(`📊 API Response: ${JSON.stringify(json, null, 2)}`);
        } catch {
          console.log(`📊 API Response: ${result.body.substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');
  
  // Test specific functionality
  console.log('🧪 Functionality Tests:\n');
  
  // 1. Check if main domain works
  const mainDomainWorks = await testUrl('https://postoko.com');
  console.log(`1. Main domain (postoko.com): ${mainDomainWorks ? '✅ Working' : '❌ Not working'}`);
  
  // 2. Check if www redirects properly
  const wwwRedirects = await checkRedirect('https://www.postoko.com', 'https://postoko.com');
  console.log(`2. WWW redirect: ${wwwRedirects ? '✅ Redirects to main domain' : '❌ Not redirecting properly'}`);
  
  // 3. Check if app pages load
  const loginPageWorks = await testUrl('https://postoko.com/login');
  console.log(`3. Login page: ${loginPageWorks ? '✅ Accessible' : '❌ Not accessible'}`);
  
  // 4. Check Vercel domain
  const vercelDomainWorks = await testUrl('https://postoko-beta.vercel.app');
  console.log(`4. Vercel domain: ${vercelDomainWorks ? '✅ Working' : '❌ Not working'}`);
  
  console.log('\n✨ Testing complete!\n');
}

async function followRedirects(startUrl, maxRedirects = 5) {
  const redirects = [];
  let currentUrl = startUrl;
  let finalResponse = null;
  
  for (let i = 0; i < maxRedirects; i++) {
    const response = await fetchUrl(currentUrl, false);
    
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      redirects.push(currentUrl);
      currentUrl = new URL(response.headers.location, currentUrl).href;
    } else {
      finalResponse = response;
      break;
    }
  }
  
  return {
    ...finalResponse,
    finalUrl: currentUrl,
    redirects
  };
}

async function fetchUrl(url, followRedirect = true) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      followRedirect 
    }, (res) => {
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

async function testUrl(url) {
  try {
    const result = await followRedirects(url);
    return result.statusCode === 200 && result.body.length > 100;
  } catch {
    return false;
  }
}

async function checkRedirect(fromUrl, toUrl) {
  try {
    const result = await followRedirects(fromUrl);
    return result.finalUrl === toUrl || result.finalUrl === toUrl + '/';
  } catch {
    return false;
  }
}

// Run the tests
testDeployment().catch(console.error);
#!/usr/bin/env node

const http = require('http');
const https = require('https');

async function testURL(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode} ${res.statusMessage}`);
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ ${description}: Timeout`);
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function testRouting() {
  console.log('🧪 Testing Compify Routing...\n');
  
  const tests = [
    {
      url: 'http://localhost:4322/',
      description: 'Static Site Home'
    },
    {
      url: 'http://localhost:4322/faq/',
      description: 'FAQ Page'
    },
    {
      url: 'http://localhost:4322/sandbox/',
      description: 'Sandbox (Static)'
    },
    {
      url: 'http://localhost:4322/shared/design-system/tokens.css',
      description: 'Design System CSS'
    },
    {
      url: 'http://localhost:8080/health',
      description: 'Backend Health Check'
    },
    {
      url: 'http://localhost:4322/login',
      description: 'Login Page (Proxied)'
    },
    {
      url: 'http://localhost:8080/login',
      description: 'Backend Login Direct'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testURL(test.url, test.description);
    if (result.success && result.status < 400) {
      passed++;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All routing tests passed!');
  } else {
    console.log('⚠️  Some routing tests failed. Check server logs for details.');
  }
  
  console.log('\n💡 Manual testing:');
  console.log('   • Open http://localhost:4321/ in your browser');
  console.log('   • Navigate to FAQ page and check if content loads');
  console.log('   • Click "Play Games" to test sandbox routing');
  console.log('   • Try auth links to test backend proxying');
}

testRouting().catch(console.error);
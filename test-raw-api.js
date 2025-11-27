// Test if ANY Shopify API works
const https = require('https');

const storeDomain = 'kindkandlesboutique.myshopify.com';
const storefrontToken = '907d080bd0b1937461f43bc1f29d01b7';

console.log('Testing Shopify API Access...\n');

// Test 1: Can we reach the store at all?
console.log('TEST 1: Basic store accessibility');
https.get(`https://${storeDomain}`, (res) => {
  console.log('✓ Store responds:', res.statusCode);
  console.log('✓ Headers:', JSON.stringify(res.headers, null, 2));
}).on('error', (e) => {
  console.log('✗ Store not accessible:', e.message);
});

// Test 2: Try Storefront API with minimal query
setTimeout(() => {
  console.log('\nTEST 2: Storefront API - Minimal Query');
  
  const query = JSON.stringify({
    query: '{ shop { name } }'
  });

  const options = {
    hostname: storeDomain,
    path: '/api/unstable/graphql.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Response:', data);
      
      if (res.statusCode === 404) {
        console.log('\n❌ 404 ERROR - Storefront API not available');
        console.log('\nPossible reasons:');
        console.log('1. Store is on Shopify Starter plan (no Storefront API)');
        console.log('2. Store is a development store that expired');
        console.log('3. Storefront API is disabled for this store');
        console.log('4. This is not a valid Shopify store domain');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(query);
  req.end();
}, 1000);

// Test 3: Check if this is even a Shopify store
setTimeout(() => {
  console.log('\nTEST 3: Verify Shopify Store');
  
  https.get(`https://${storeDomain}/admin`, (res) => {
    console.log('Admin page status:', res.statusCode);
    if (res.statusCode === 302 || res.statusCode === 301) {
      console.log('✓ Redirects to login - this IS a Shopify store');
    } else if (res.statusCode === 404) {
      console.log('✗ 404 - This might NOT be a valid Shopify store');
    }
  }).on('error', (e) => {
    console.log('✗ Error:', e.message);
  });
}, 2000);




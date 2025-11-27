// Comprehensive Shopify Diagnostic Script
// Run with: node diagnose-shopify.js

const https = require('https');

const storeDomain = 'kindkandlesboutique.myshopify.com';
const accessToken = '907d080bd0b1937461f43bc1f29d01b7';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║       SHOPIFY DIAGNOSTIC TOOL                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('Configuration:');
console.log('  Domain:', storeDomain);
console.log('  Token:', accessToken.substring(0, 8) + '...');
console.log('  Token Length:', accessToken.length, 'chars\n');

// Test 1: Check if store URL is accessible
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: Checking store accessibility...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

https.get(`https://${storeDomain}`, (res) => {
  console.log('✓ Store Status:', res.statusCode);
  console.log('✓ Store is reachable\n');
  
  // Test 2: Try different API versions
  const apiVersions = ['unstable', '2025-01', '2024-10', '2024-07'];
  let currentVersion = 0;
  
  function testNextVersion() {
    if (currentVersion >= apiVersions.length) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('DIAGNOSIS COMPLETE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('⚠️  ALL API VERSIONS FAILED');
      console.log('\nMost likely causes:');
      console.log('  1. Online Store sales channel is NOT enabled');
      console.log('  2. Store plan doesn\'t support Storefront API');
      console.log('  3. Token is for wrong store');
      console.log('\n🔧 TO FIX:');
      console.log('  1. Go to Shopify Admin → Settings → Sales channels');
      console.log('  2. Add "Online Store" sales channel');
      console.log('  3. Go to Products → Make products available to Online Store');
      console.log('  4. Reinstall your custom app');
      return;
    }
    
    const version = apiVersions[currentVersion];
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`TEST ${currentVersion + 2}: Testing API version ${version}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const query = JSON.stringify({
      query: `{
        shop {
          name
          primaryDomain { url }
        }
      }`
    });
    
    const options = {
      hostname: storeDomain,
      path: `/api/${version}/graphql.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
        'Content-Length': query.length
      }
    };
    
    const req = https.request(options, (apiRes) => {
      let data = '';
      
      console.log('  Endpoint:', `https://${storeDomain}/api/${version}/graphql.json`);
      console.log('  Status:', apiRes.statusCode);
      
      apiRes.on('data', (chunk) => { data += chunk; });
      
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (apiRes.statusCode === 200 && parsed.data && parsed.data.shop) {
            console.log('\n✅ SUCCESS WITH VERSION:', version);
            console.log('  Shop Name:', parsed.data.shop.name);
            console.log('  Shop URL:', parsed.data.shop.primaryDomain.url);
            console.log('\n🎉 CONNECTION WORKS!');
            console.log('\n📝 UPDATE YOUR CODE:');
            console.log(`  Change apiVersion in src/lib/shopify.ts to: '${version}'`);
            return;
          } else if (parsed.errors) {
            console.log('  ❌ GraphQL Errors:', JSON.stringify(parsed.errors, null, 2));
          } else {
            console.log('  ❌ Unexpected response:', data.substring(0, 200));
          }
        } catch (e) {
          console.log('  ❌ Response (not JSON):', data.substring(0, 200));
        }
        
        currentVersion++;
        setTimeout(testNextVersion, 500);
      });
    });
    
    req.on('error', (e) => {
      console.error('  ❌ Request failed:', e.message);
      currentVersion++;
      setTimeout(testNextVersion, 500);
    });
    
    req.write(query);
    req.end();
  }
  
  testNextVersion();
  
}).on('error', (e) => {
  console.error('❌ Store not accessible:', e.message);
  console.log('\n→ Check that the domain is correct');
});




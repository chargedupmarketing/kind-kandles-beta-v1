const CACHE_NAME = 'kind-kandles-v1';
const STATIC_CACHE_NAME = 'kind-kandles-static-v1';
const DYNAMIC_CACHE_NAME = 'kind-kandles-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/collections',
  '/about',
  '/customs',
  '/write-your-story',
  '/manifest.json'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for images
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip admin and API routes (except for specific API endpoints)
  if (url.pathname.startsWith('/restricted') || 
      (url.pathname.startsWith('/api') && !url.pathname.startsWith('/api/placeholder'))) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (url.hostname === 'images.unsplash.com' || 
             url.hostname === 'cdn.shopify.com' ||
             url.pathname.includes('/api/placeholder/')) {
    // Images - stale while revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  } else if (url.pathname.startsWith('/collections') || 
             url.pathname.startsWith('/products')) {
    // Product pages - network first with cache fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else {
    // Other pages - stale while revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  }
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, return cached version if available
      return cachedResponse;
    });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Background sync for form submissions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
      event.waitUntil(syncContactForms());
    } else if (event.tag === 'story-form-sync') {
      event.waitUntil(syncStoryForms());
    }
  });
}

// Sync contact forms when back online
async function syncContactForms() {
  try {
    const pendingForms = await getStoredForms('pendingContactForms');
    
    for (const form of pendingForms) {
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        
        // Remove from pending if successful
        await removeStoredForm('pendingContactForms', form.id);
      } catch (error) {
        console.error('Failed to sync contact form:', error);
      }
    }
  } catch (error) {
    console.error('Contact form sync failed:', error);
  }
}

// Sync story forms when back online
async function syncStoryForms() {
  try {
    const pendingForms = await getStoredForms('pendingStoryForms');
    
    for (const form of pendingForms) {
      try {
        await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        
        // Remove from pending if successful
        await removeStoredForm('pendingStoryForms', form.id);
      } catch (error) {
        console.error('Failed to sync story form:', error);
      }
    }
  } catch (error) {
    console.error('Story form sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getStoredForms(storeName) {
  // This would use IndexedDB in a real implementation
  // For now, return empty array
  return [];
}

async function removeStoredForm(storeName, formId) {
  // This would remove from IndexedDB in a real implementation
  console.log(`Removing form ${formId} from ${storeName}`);
}

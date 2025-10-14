// MindMate Service Worker
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'mindmate-v1.0.0';
const STATIC_CACHE = 'mindmate-static-v1.0.0';
const DYNAMIC_CACHE = 'mindmate-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/pages/Home.tsx',
  '/src/pages/VoiceSession.tsx',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/places',
  '/api/questions/daily',
  '/api/users/profile'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache dynamic content
      caches.open(DYNAMIC_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE &&
              cacheName.startsWith('mindmate-')
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API requests - network first, cache fallback
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
      // Static assets - cache first
      event.respondWith(handleStaticAsset(request));
    } else {
      // HTML pages - network first, cache fallback
      event.respondWith(handlePageRequest(request));
    }
  } else if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
    // Handle POST requests (voice entries, etc.)
    event.respondWith(handlePostRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses for cacheable endpoints
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Try cache fallback for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline. Please check your connection.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to load asset:', request.url);
    // Return a default offline asset or error response
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for page request, trying cache');
    
    // Try cache fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or main app shell
    const offlinePage = await caches.match('/');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort: basic offline message
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MindMate - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🧠 MindMate</h1>
            <p>You're currently offline. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle POST requests (for offline sync)
async function handlePostRequest(request) {
  try {
    // Try to send request immediately
    return await fetch(request);
  } catch (error) {
    // Store for background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await storeOfflineRequest(request);
      
      // Register background sync
      await self.registration.sync.register('background-sync');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your entry has been saved and will sync when you\'re back online.',
          offline: true
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // No background sync support
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Unable to save while offline. Please try again when connected.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Store offline requests for background sync
async function storeOfflineRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  // Use IndexedDB to store offline requests
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('mindmate-offline', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      store.add(requestData);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    dbRequest.onupgradeneeded = () => {
      const db = dbRequest.result;
      const store = db.createObjectStore('requests', { autoIncrement: true });
      store.createIndex('timestamp', 'timestamp');
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('mindmate-offline', 1);
    
    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const requests = getAllRequest.result;
        
        for (const requestData of requests) {
          try {
            await fetch(requestData.url, {
              method: requestData.method,
              headers: requestData.headers,
              body: requestData.body
            });
            
            // Remove synced request
            const deleteTransaction = db.transaction(['requests'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('requests');
            deleteStore.delete(requestData.id);
            
            console.log('[SW] Synced offline request:', requestData.url);
          } catch (error) {
            console.log('[SW] Failed to sync request:', requestData.url, error);
          }
        }
        
        resolve();
      };
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New message from MindMate',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Open MindMate',
          icon: '/icons/action-open.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/action-close.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'MindMate', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event for communication with main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('mindmate-'))
            .map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service worker script loaded');
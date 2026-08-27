// اسم مخزن الكاش - قم بتغيير الرقم عند كل تحديث للتطبيق حتى يتم تحديث النسخة المخزنة
const CACHE_NAME = 'detergent-handbook-cache-v1';

// الملفات الأساسية التي يتم تخزينها للعمل بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './detergent-manifest.json',
  './detergent-icon-192.png',
  './detergent-icon-512.png'
];

// عند تثبيت الـ Service Worker: نخزن الملفات الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// عند التفعيل: نحذف أي نسخ كاش قديمة لا تطابق النسخة الحالية
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// عند كل طلب: نحاول الشبكة أولاً، وإذا فشلت (بدون إنترنت) نستخدم النسخة المخزنة في الكاش
self.addEventListener('fetch', (event) => {
  // نتجاهل الطلبات التي ليست GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تحديث الكاش بأحدث نسخة من الملف عند نجاح الاتصال بالإنترنت
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // في حالة عدم توفر إنترنت، نرجع النسخة المخزنة سابقاً
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

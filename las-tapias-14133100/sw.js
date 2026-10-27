
"use strict";

const LOCALITY_FOLDER = "las-tapias-14133100";
const CACHE_NAME =
  "vidhwaan-argentina-" + LOCALITY_FOLDER + "-v2";

const OFFLINE_URL = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(OFFLINE_URL);
      } catch (error) {
        // Installation can continue if the page is unavailable.
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(
                  "vidhwaan-argentina-" + LOCALITY_FOLDER + "-"
                ) &&
                key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Always fetch the latest HTML from the network first.
  // Use the service-worker cache only when the network fails.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, {
            cache: "no-store"
          });

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          const cached =
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_URL));

          return (
            cached ||
            new Response(
              "No hay conexión a Internet. Intente nuevamente cuando vuelva la conexión.",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            )
          );
        }
      })()
    );

    return;
  }

  // Do not cache JSON data or API responses in the service worker.
  if (
    url.pathname.endsWith(".json") ||
    url.pathname.includes("/api/")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
    );

    return;
  }

  // Fetch CSS, JavaScript, images, icons and fonts from the network first.
  // Use a cached copy only when the network request fails.
  if (
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(
      url.pathname
    )
  ) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, {
            cache: "no-store"
          });

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          const cached = await caches.match(request);

          if (cached) {
            return cached;
          }

          return new Response("Resource unavailable offline.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          });
        }
      })()
    );
  }
});

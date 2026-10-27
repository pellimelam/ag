"use strict";

const LOCALITY_FOLDER = "amaicha-del-valle-90098010";
const CACHE_NAME = "vidhwaan-argentina-" + LOCALITY_FOLDER + "-v1";

const OFFLINE_URL = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.add(OFFLINE_URL);
      } catch (error) {
        // Installation can continue if the page is temporarily unavailable.
      }

      await self.skipWaiting();
    })
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

  // Always check the network first for navigation requests.
  // Fall back to the cached page when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
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
        })
    );

    return;
  }

  // Cache same-origin assets when available, refreshing them in the
  // background. Do not cache JSON data or API responses.
  if (
    url.pathname.endsWith(".json") ||
    url.pathname.includes("/api/")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkRequest = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }

            return response;
          });

        return cached || networkRequest;
      })
    );
  }
});

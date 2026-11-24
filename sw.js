/* BharatVerse Offline Cache Service Worker (PWA / Android WebView ready) */
const CACHE_NAME = "bharatverse-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/bharatverse.css",
  "./src/main.js",
  "./src/layer1_core/core_engine.js",
  "./src/layer1_core/sculpted_geometry.js",
  "./src/layer1_core/pbr_assets.js",
  "./src/layer1_core/shaders.js",
  "./src/layer1_core/input_manager.js",
  "./src/layer2_world/pan_india_data.js",
  "./src/layer2_world/landmark_builders.js",
  "./src/layer2_world/world_streamer.js",
  "./src/layer3_physics/physics_interaction.js",
  "./src/layer4_ai/npc_crowd_system.js",
  "./src/layer5_narrative/quest_story_system.js",
  "./src/layer6_ui/ui_manager.js",
  "./src/layer7_persistence/save_manager.js",
  "./src/audio/bharat_audio.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

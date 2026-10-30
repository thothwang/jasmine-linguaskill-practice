const VERSION = "__BUILD_VERSION__";
const base = self.registration.scope;
const asset = path => new URL(path,base).href;
const SHELL = ["./","./index.html","./styles.css","./js/app.js","./js/logic.js","./js/store.js","./content/demo-questions.json","./manifest.webmanifest","./icons/icon.svg"].map(asset);
self.addEventListener("install", event => { event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL.map(url => new Request(url,{cache:"reload"}))))); self.skipWaiting(); });
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION && key.startsWith("jlp-")).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  if (event.request.mode === "navigate") { event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(VERSION).then(cache=>cache.put(asset("./index.html"),copy)); return response; }).catch(() => caches.match(asset("./index.html")))); return; }
  const isAudio = event.request.destination === "audio";
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (response.ok) caches.open(VERSION).then(cache => cache.put(event.request,response.clone())); return response; }).catch(() => isAudio ? new Response("Audio unavailable offline",{status:503}) : Promise.reject(new Error("Offline")))));
});

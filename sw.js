/* Servis Listesi — çevrimdışı önbellek */
var CACHE = "servis-listesi-v1";
var SHELL = ["./", "./index.html", "./supabase.js", "./591.supabase.js", "./manifest.webmanifest"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  // Supabase ve diğer dış istekler önbelleğe alınmaz — hep ağdan
  if(new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;   // önce önbellek, arkada tazele
    })
  );
});

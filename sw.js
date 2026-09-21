/* Servis Listesi — çevrimdışı önbellek (v2) */
var CACHE = "servis-listesi-v2";
var SHELL = ["./", "./index.html", "./supabase.js", "./591.supabase.js", "./manifest.webmanifest"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
  }));
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
  if(new URL(req.url).origin !== self.location.origin) return;

  var isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);

  if(isPage){
    // sayfa: önce ağ (güncel sürüm), yoksa önbellek
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.status === 200){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(h){ return h || caches.match("./index.html"); });
      })
    );
    return;
  }

  // diğer dosyalar: önce önbellek, arkada tazele
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});

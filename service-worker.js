const CACHE = 'aurora-atlas-v1';
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./images/aurora_night_sky.jpg", "./images/day02_fika_coffee.jpg", "./images/day02_stockholm_city_hall.jpg", "./images/day03_lulea_harbor.jpg", "./images/day03_reindeer_farm.jpg", "./images/day03_seaside_glass_villas.jpg", "./images/day03_snowexperience365.jpg", "./images/day04_arktikum_museum.jpg", "./images/day04_rovaniemi_city_plan.jpg", "./images/day04_santa_claus_village.jpg", "./images/day06_king_crab.jpg", "./images/day06_kirkenes_wartime_history.jpg", "./images/day07_sami_culture.jpg", "./images/day08_alta_rock_art.jpg", "./images/day09_arctic_cathedral.jpg", "./images/day09_aurora_cruise.jpg", "./images/day09_tromso_city_mcdonalds.jpg", "./images/day10_aker_brygge_waterfront.jpg", "./images/day10_akershus_fortress.jpg", "./images/day10_munch_museum.jpg", "./images/day10_norwegian_food.jpg", "./images/day10_oslo_city_hall.jpg", "./images/day10_oslo_opera_house.jpg", "./images/day10_vigeland_park.jpg", "./images/food/day02_dala_horse.jpg", "./images/food/day02_swedish_meatballs.jpg", "./images/food/day03_fazer_blue.jpg", "./images/food/day03_reindeer_culture.jpg", "./images/food/day04_cloudberry_jam.jpg", "./images/food/day04_kuksa_cup.jpg", "./images/food/day04_salmon_soup.jpg", "./images/food/day06_crab_safari.jpg", "./images/food/day06_king_crab_dish.jpg", "./images/food/day07_reindeer_stew.jpg", "./images/food/day07_sami_bracelet.jpg", "./images/food/day09_brunost.jpg", "./images/food/day09_waffles.jpg", "./images/food/day10_brunost_waffles.jpg", "./images/food/day10_cheese_slicer.jpg", "./images/food/day10_farikol.jpg", "./images/food/day10_fiskesuppe.jpg", "./images/food/day10_polse_lompe.jpg", "./images/food/day10_skolebrod.jpg"];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))), self.clients.claim()]));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(resp => {
    if(resp.ok) { const copy=resp.clone(); event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy))); }
    return resp;
  }).catch(() => caches.match(req).then(r=>r || (req.mode==='navigate' ? caches.match('./index.html') : Response.error()))));
});

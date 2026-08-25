/**
 * public/js/api.js
 * Thin fetch wrapper for all backend API calls.
 */

window.API = window.API || {};
const API = window.API = {
  async _fetch(method, path, body) {
    const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get:  (path)       => API._fetch('GET',  path, null),
  post: (path, body) => API._fetch('POST', path, body),

  // Auth
  register: (name, email, password) => API.post('/api/auth/register', { name, email, password }),
  login:    (email, password)       => API.post('/api/auth/login', { email, password }),
  logout:   ()                      => API.post('/api/auth/logout'),
  me:       ()                      => API.get('/api/auth/me'),

  // Game
  gameData:    ()           => API.get('/api/gamedata'),
  state:       ()           => API.get('/api/game/state'),
  setFaction:  (faction)    => API.post('/api/game/faction', { faction }),
  explore:     (type)       => API.post('/api/game/explore', { type }),
  build:       (buildingId) => API.post('/api/game/build', { buildingId }),
  recruit:     (unitId, qty)=> API.post('/api/game/recruit', { unitId, quantity: qty }),
  battle:      (targetId)   => API.post('/api/game/battle', { targetId }),
  buyItem:     (itemId)     => API.post('/api/game/auction/buy', { itemId }),
  rankings:    ()           => API.get('/api/game/rankings'),
  targets:     ()           => API.get('/api/game/targets'),
};

// Real API calls to the Express backend
const BASE = '/api'

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// The player's local calendar day (browser-local time, not UTC) -- the
// server needs this to advance the login streak on the day the player
// actually experiences, not on whatever day it happens to be in UTC.
// Mirrors getTodayDate() in data/streak.js; duplicated here rather than
// imported so api.js stays a plain fetch wrapper with no app-data deps.
function localDateStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const api = {
  // Auth
  login:    (email, password) => req('POST', '/auth/login', { email, password, localDate: localDateStr() }),
  register: (name, email, password) => req('POST', '/auth/register', { name, email, password, localDate: localDateStr() }),
  logout:   () => req('POST', '/auth/logout'),
  me:       () => req('GET', `/auth/me?localDate=${encodeURIComponent(localDateStr())}`),

  // Faction
  setFaction: (faction) => req('POST', '/game/faction', { faction }),

  // Game state
  state:    () => req('GET', '/game/state'),
  gameData: () => req('GET', '/gamedata'),

  // Actions
  // type is an explicit explore-tier key (e.g. 'scout', 'peddler') --
  // several tiers share a turn cost now, so cost alone can't identify one.
  explore:  (type) => req('POST', '/game/explore', { type }),
  build:    (buildingId) => req('POST', '/game/build', { buildingId }),
  recruit:  (unitId, qty) => req('POST', '/game/recruit', { unitId, quantity: qty || 5 }),
  hireMerc: (unitId, factionId, qty, costPerUnit) => req('POST', '/game/merc/hire', { unitId, factionId, quantity: qty, costPerUnit }),
  battle:   (targetId, units, itemId) => req('POST', '/game/battle', { targetId, units, itemId }),

  // Auction
  buyItem:      (itemId) => req('POST', '/game/auction/buy', { itemId }),
  refreshAuction: (paid) => req('POST', '/game/auction/refresh', { paid }),

  // Streak
  claimStreak: () => req('POST', '/game/streak/claim'),

  // Rankings
  rankings: () => req('GET', '/game/rankings'),
  targets:  () => req('GET', '/game/targets'),
}

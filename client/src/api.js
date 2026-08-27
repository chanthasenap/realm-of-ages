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

export const api = {
  // Auth
  login:    (email, password) => req('POST', '/auth/login', { email, password }),
  register: (name, email, password) => req('POST', '/auth/register', { name, email, password }),
  logout:   () => req('POST', '/auth/logout'),
  me:       () => req('GET', '/auth/me'),

  // Faction
  setFaction: (faction) => req('POST', '/game/faction', { faction }),

  // Game state
  state:    () => req('GET', '/game/state'),
  gameData: () => req('GET', '/gamedata'),

  // Actions
  explore:  (turns) => {
    // Server keys explore actions by name, not turn cost — map cost -> type.
    const type = turns === 1 ? 'scout' : turns === 2 ? 'caravan' : turns === 3 ? 'expedition' : turns === 8 ? 'conquest' : null
    return req('POST', '/game/explore', { type })
  },
  build:    (buildingId) => req('POST', '/game/build', { buildingId }),
  recruit:  (unitId, qty) => req('POST', '/game/recruit', { unitId, quantity: qty || 5 }),
  battle:   (targetId, units, itemId) => req('POST', '/game/battle', { targetId, units, itemId }),

  // Auction
  buyItem:      (itemId) => req('POST', '/game/auction/buy', { itemId }),
  refreshAuction: (paid) => req('POST', '/game/auction/refresh', { paid }),

  // Streak
  claimStreak: () => req('POST', '/game/streak/claim'),

  // Rankings
  rankings: () => req('GET', '/game/rankings'),
}

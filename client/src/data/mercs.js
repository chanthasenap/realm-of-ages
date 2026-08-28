import { FACTIONS } from './factions.js'

export const MERC_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours

export const MERC_UNBOUND_PENALTY = 0.85

// Lore-friendly tiers for contract size
export const CONTRACT_TIERS = [
  { id: 'skirmisher', label: 'Skirmisher Contract', unitTiers: [1, 2], qtyRange: [1, 3], costMultiplier: 1.0 },
  { id: 'company',    label: 'Company Contract',    unitTiers: [2, 3], qtyRange: [3, 8], costMultiplier: 1.3 },
  { id: 'elite',      label: 'Elite Band',          unitTiers: [4, 5], qtyRange: [1, 3], costMultiplier: 2.0 },
]

const CONTRACT_COLORS = {
  skirmisher: '#6dccaa',
  company:    '#a89cf0',
  elite:      '#ffd700',
}

export function getContractColor(contractTierId) {
  return CONTRACT_COLORS[contractTierId] || 'var(--gold)'
}

// Pick a random int in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Pick a random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate up to 6 mercenary listings scaled to the player's power level.
 *
 * Was previously called as `generateMercListings(p.faction)` -- a plain
 * string, not the options object this function destructures. Destructuring
 * `{ playerFaction, ... }` off a string silently yields undefined for every
 * field, so every param fell back to its hardcoded default on EVERY call:
 * playerFaction always defaulted to 'flame' (so a player who wasn't
 * actually playing Flame never had their own faction excluded -- their own
 * units could and did show up as "mercenaries"), and playerHighestTier
 * always defaulted to 1 (so the Hall was permanently stuck offering only
 * the weakest skirmisher-tier contracts, regardless of how far the
 * player's army had actually progressed). Fixed at the call sites in
 * useGameStore.js; this function now also guarantees every listing is
 * strictly stronger than the player's own average unit (see minMercTier
 * below) instead of merely "not above whatever tier they'd already
 * reached" -- a merc slot should always read as a genuine upgrade, not a
 * worse (see MERC_UNBOUND_PENALTY) copy of something already recruitable
 * at home.
 *
 * @param {object} params
 * @param {number} params.playerGoldPerTurn  - gold/turn income
 * @param {number} params.playerAvgUnitTier  - qty-weighted average tier of the player's own native army (0 if no army yet)
 * @param {number} params.playerArmySize     - total units in army
 * @param {string} params.playerFaction      - player's faction id (excluded from the merc pool)
 */
export function generateMercListings({ playerGoldPerTurn = 50, playerAvgUnitTier = 0, playerArmySize = 6, playerFaction = 'flame' } = {}) {
  const allFactions = Object.entries(FACTIONS).map(([id, f]) => ({ ...f, id }))
  const otherFactions = allFactions.filter(f => f.id !== playerFaction)

  // Every merc must sit strictly above the army's own average tier -- so a
  // fresh army (avg 0) sees tier-1 offers same as before, but the pool
  // climbs automatically as the player's own units mature, instead of
  // sitting flat.
  const minMercTier = Math.max(1, Math.min(5, Math.floor(playerAvgUnitTier) + 1))

  // Flatten every (contract, tier) pairing that's both valid for that
  // contract's own band and at/above minMercTier, then sample uniformly
  // from that -- avoids the old pick-and-retry pattern, which would spin
  // forever (or silently starve) once minMercTier climbs high enough that
  // most contracts have no valid tier left at all.
  const validSlots = []
  for (const contract of CONTRACT_TIERS) {
    for (const t of contract.unitTiers) {
      if (t >= minMercTier) validSlots.push({ contract, tier: t })
    }
  }
  // A maxed-out army (avg tier 5, the ceiling) would otherwise leave
  // validSlots empty -- fall back to elite/tier-5 rather than showing
  // nothing.
  if (validSlots.length === 0) validSlots.push({ contract: CONTRACT_TIERS[CONTRACT_TIERS.length - 1], tier: 5 })

  // Base cost per unit: roughly 3x what the player earns per turn, scaled
  // further by tier below -- a richer economy sees pricier mercs, not
  // cheaper-feeling ones.
  const baseCostPerUnit = Math.max(200, Math.round(playerGoldPerTurn * 2.5))

  const listings = []
  const usedKeys = new Set()
  let attempts = 0

  // Bounded attempts, not a fixed count -- at high minMercTier the valid
  // (faction, unit, contract) combinations run out well before 6 (e.g.
  // only 4 other factions have a tier-5 unit each), so fewer than 6
  // listings is the correct outcome rather than looping forever.
  while (listings.length < 6 && attempts < 60) {
    attempts++
    const { contract, tier: unitTier } = pick(validSlots)
    const faction = pick(otherFactions)
    const units = faction.units?.filter(u => u.tier === unitTier) || []
    if (!units.length) continue

    const unit = pick(units)
    const qty = randInt(...contract.qtyRange)

    // Deduplicate (same unit + same faction shouldn't appear twice)
    const key = `${faction.id}-${unit.id}-${contract.id}`
    if (usedKeys.has(key)) continue
    usedKeys.add(key)

    const tierMult = [0, 1, 1.8, 3.2, 6, 12][unitTier] || 1
    const costPerUnit = Math.round(baseCostPerUnit * tierMult * contract.costMultiplier * (0.85 + Math.random() * 0.3))
    const totalCost = costPerUnit * qty

    listings.push({
      id: `merc-${Date.now()}-${listings.length}-${Math.random().toString(36).slice(2,6)}`,
      contractTierId: contract.id,
      contractLabel:  contract.label,
      factionId:      faction.id,
      factionName:    faction.name,
      factionColor:   faction.color,
      unitId:         unit.id,
      unitName:       unit.name,
      unitArtType:    unit.artType,
      unitTier:       unitTier,
      unitAtk:        unit.atk,
      unitDef:        unit.def,
      qty,
      costPerUnit,
      totalCost,
      hired: false,
    })
  }

  return listings
}

export function calcMercRefreshCost(goldPerTurn) {
  return Math.max(500, Math.round(goldPerTurn * 8))
}

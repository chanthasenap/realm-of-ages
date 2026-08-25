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
 * Generate 6 mercenary listings scaled to the player's power level.
 * @param {object} params
 * @param {number} params.playerGoldPerTurn  - gold/turn income
 * @param {number} params.playerHighestTier  - highest unit tier the player owns
 * @param {number} params.playerArmySize     - total units in army
 * @param {string} params.playerFaction      - player's faction id (to exclude from merc pool)
 */
export function generateMercListings({ playerGoldPerTurn = 50, playerHighestTier = 1, playerArmySize = 6, playerFaction = 'flame' }) {
  const allFactions = Object.entries(FACTIONS).map(([id, f]) => ({ ...f, id }))
  const otherFactions = allFactions.filter(f => f.id !== playerFaction)

  // Scale: cap available contract tiers based on player progress
  const maxContractTierIdx = Math.min(2, Math.floor(playerHighestTier / 2))
  const availableContracts = CONTRACT_TIERS.slice(0, maxContractTierIdx + 1)

  // Base cost per unit: roughly 3× what the player earns per turn, scaled by tier
  const baseCostPerUnit = Math.max(200, Math.round(playerGoldPerTurn * 2.5))

  const listings = []
  const usedKeys = new Set()

  for (let i = 0; i < 6; i++) {
    const contract = pick(availableContracts)
    const faction = pick(otherFactions)
    const unitTier = pick(contract.unitTiers.filter(t => t <= playerHighestTier + 1))
    const units = faction.units?.filter(u => u.tier === unitTier) || []
    if (!units.length) { i--; continue }

    const unit = pick(units)
    const qty = randInt(...contract.qtyRange)

    // Deduplicate (same unit + same faction shouldn't appear twice)
    const key = `${faction.id}-${unit.id}-${contract.id}`
    if (usedKeys.has(key)) { i--; continue }
    usedKeys.add(key)

    const tierMult = [0, 1, 1.8, 3.2, 6, 12][unitTier] || 1
    const costPerUnit = Math.round(baseCostPerUnit * tierMult * contract.costMultiplier * (0.85 + Math.random() * 0.3))
    const totalCost = costPerUnit * qty

    listings.push({
      id: `merc-${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`,
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

// client/src/data/heroes.js
// Client-side mirror of server/heroData.js -- same ids, numbers, and
// formulas (the same duplication pattern mercs.js/factions.js already have
// with their server-side counterparts in server/gameData.js). The server
// is authoritative; this copy exists so the UI can render hero cards,
// previews, and cost estimates without waiting on a round trip.
// Design rationale: claude/hero-feature-design.md (project doc).

// Every hero shares the same power budget (300) so no faction's hero is a
// strict upgrade over another's -- flavor lives in the str/con/int/spd
// split (which changes atk/def, via the same U() builder formulas used
// for every unit) and the unique ability, not the total.
//
// ── Aura (creature-type buff) ──────────────────────────────────────────────
// See server/heroData.js for the full rationale -- auraType is matched
// against a unit's own `type` field from FACTIONS (the same field the
// strongVs/weakVs matchup badges read), and the bonus only ever applies to
// the raid a hero is actively brought on (never a standing/passive buff).
export const HERO_AURA_BONUS_PCT = 0.20 // +20% effective power for matching-type units, that raid only

export const HEROES = {
  undead: {
    id: 'mordroth', name: 'Mordroth', title: 'the Deathless', factionId: 'undead',
    artType: 'knight', portraitId: 'mordroth',
    str: 90, con: 90, int: 60, spd: 60,
    atk: 90 + Math.floor(60 / 2),   // 120
    def: 90 + Math.floor(60 / 4),   // 105
    power: 300,
    abilityId: 'deathless_legion',
    abilityName: 'Deathless Legion',
    abilityDesc: 'While brought to battle, army-wide casualties on this raid are cut by 30%.',
    auraType: 'undead',
    auraLabel: 'Ranks of the Dead',
    auraDesc: 'Aura: while brought to battle, Undead units gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
    flavor: 'Bound to unlife nine times over, Mordroth leads the Legion’s bone regiments from the front -- he has already died enough times to stop fearing it.',
  },
  nature: {
    id: 'sylvaria', name: 'Sylvaria', title: 'Warden of the Deep Root', factionId: 'nature',
    artType: 'beast', portraitId: 'sylvaria',
    str: 70, con: 100, int: 50, spd: 80,
    atk: 70 + Math.floor(50 / 2),   // 95
    def: 100 + Math.floor(80 / 4), // 120
    power: 300,
    abilityId: 'verdant_reclamation',
    abilityName: 'Verdant Reclamation',
    abilityDesc: 'While brought to battle, a victory claims 40% more land.',
    auraType: 'plant',
    auraLabel: 'Root and Bough',
    auraDesc: 'Aura: while brought to battle, Plant units (the treant line) gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
    flavor: 'The World Tree’s oldest warden, Sylvaria grows into contested ground rather than merely taking it -- what she claims, the Circle keeps for good.',
  },
  tide: {
    id: 'nerezza', name: 'Nerezza', title: 'the Abyssal Sovereign', factionId: 'tide',
    artType: 'wraith', portraitId: 'nerezza',
    str: 80, con: 85, int: 65, spd: 70,
    atk: 80 + Math.floor(65 / 2),   // 112
    def: 85 + Math.floor(70 / 4),   // 102
    power: 300,
    abilityId: 'riptide_retreat',
    abilityName: 'Riptide Retreat',
    abilityDesc: 'While brought to battle, a defeat costs 50% less gold and mana.',
    auraType: 'aberration',
    auraLabel: 'Abyssal Communion',
    auraDesc: 'Aura: while brought to battle, Aberration units gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
    flavor: 'No Dominion fleet has ever been trapped with its back to the shore while Nerezza commands the withdrawal -- the sea always leaves her an exit.',
  },
  flame: {
    id: 'kaelthorn', name: 'Kaelthorn', title: 'the Ember Warlord', factionId: 'flame',
    artType: 'warrior', portraitId: 'kaelthorn',
    str: 110, con: 70, int: 80, spd: 40,
    atk: 110 + Math.floor(80 / 2),  // 150
    def: 70 + Math.floor(40 / 4),   // 80
    power: 300,
    abilityId: 'scorched_vengeance',
    abilityName: 'Scorched Vengeance',
    abilityDesc: 'While brought to battle, your win chance for this raid is increased by 10%.',
    auraType: 'elemental',
    auraLabel: 'Living Flame',
    auraDesc: 'Aura: while brought to battle, Elemental units gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
    flavor: 'The Ember Throne’s forges never cool, and neither does Kaelthorn -- every raid he leads is fought like the last one before the gold runs out.',
  },
  celestial: {
    id: 'auravel', name: 'Auravel', title: 'the Radiant Exarch', factionId: 'celestial',
    artType: 'mage', portraitId: 'auravel',
    str: 60, con: 70, int: 110, spd: 60,
    atk: 60 + Math.floor(110 / 2),  // 115
    def: 70 + Math.floor(60 / 4),   // 85
    power: 300,
    abilityId: 'radiant_ward',
    abilityName: 'Radiant Ward',
    abilityDesc: 'While brought to battle, 15% chance to force a Flawless result (zero casualties) this raid.',
    auraType: 'celestial',
    auraLabel: 'Choir Ascendant',
    auraDesc: 'Aura: while brought to battle, Celestial units gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
    flavor: 'Auravel reads the ley lines the way other commanders read a map -- and on her best days, bends a losing formation’s luck back in your favor entirely.',
  },
}

// ── Leveling (reuses the scaledStats "D&D CR stepping" convention from
// this same file's factions.js, stretched over a longer 1-10 arc) ─────────
export const HERO_MAX_LEVEL = 10
export const HERO_LEVEL_STAT_PCT = 0.08 // +8%/level off BASE stats, non-compounding
export const HERO_MAX_HP = 100

export function heroStatsAtLevel(heroDef, level) {
  const lvl = Math.max(1, Math.min(HERO_MAX_LEVEL, level || 1))
  const mult = 1 + (lvl - 1) * HERO_LEVEL_STAT_PCT
  return {
    atk: Math.round(heroDef.atk * mult),
    def: Math.round(heroDef.def * mult),
    power: Math.round(heroDef.power * mult),
  }
}

export const HERO_TITLES = [
  { min: 10, title: 'Mythic' },
  { min: 7, title: 'Legendary' },
  { min: 5, title: 'Renowned' },
  { min: 3, title: 'Blooded' },
  { min: 1, title: 'Untested' },
]
export function heroTitleForLevel(level) {
  return (HERO_TITLES.find(t => level >= t.min) || HERO_TITLES[HERO_TITLES.length - 1]).title
}
export function heroXpToNext(level) {
  return 100 * level
}

// ── Recruiting & resurrection -- the two big gold sinks ───────────────────
export const HERO_RECRUIT_COST = { gold: 35000, mana: 12000, turns: 25 }

export function heroResurrectCost(level) {
  return {
    gold: Math.round(14000 * (1 + level * 0.15)),
    mana: Math.round(4800 * (1 + level * 0.15)),
  }
}

export const HERO_SICKNESS_MS = 24 * 60 * 60 * 1000
export const HERO_SICKNESS_MULT = 0.7

// ── Health, regen, and the Last Stand save ─────────────────────────────────
export const HERO_HP_REGEN_PCT = 0.08
export const HERO_DOWNED_RECOVER_PCT = 0.20
export const HERO_DAMAGE_RANGE = { win: [0.05, 0.15], lose: [0.20, 0.40] }
export const HERO_LAST_STAND_BASE = 0.80
export const HERO_LAST_STAND_PER_LEVEL = 0.015
export const HERO_LAST_STAND_CAP = 0.93
export function heroLastStandChance(level) {
  return Math.min(HERO_LAST_STAND_CAP, HERO_LAST_STAND_BASE + Math.max(0, (level - 1)) * HERO_LAST_STAND_PER_LEVEL)
}

// Minutes until a hero fully heals from the given hp fraction, for UI
// "back to full in ~N min" copy -- mirrors the server's regen cron (+8% of
// max HP every 2-minute turn tick).
export function heroMinutesToFull(hp, maxHp) {
  if (hp >= maxHp) return 0
  const ticksNeeded = Math.ceil((maxHp - hp) / (maxHp * HERO_HP_REGEN_PCT))
  return ticksNeeded * 2
}
export function heroMinutesToRecoverThreshold(hp, maxHp) {
  const threshold = maxHp * HERO_DOWNED_RECOVER_PCT
  if (hp >= threshold) return 0
  const ticksNeeded = Math.ceil((threshold - hp) / (maxHp * HERO_HP_REGEN_PCT))
  return ticksNeeded * 2
}

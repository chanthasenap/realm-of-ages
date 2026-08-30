/**
 * server/heroData.js
 * Server-side mirror of client/src/data/heroes.js -- same ids, numbers, and
 * formulas, kept in sync manually (the same duplication pattern gameData.js
 * already uses for FACTIONS: client owns the display copy, server owns an
 * independent authoritative copy so nothing here is ever trusted from a
 * request). Full design rationale lives in claude/hero-feature-design.md
 * (project doc) -- this file is the numbers that document turned into.
 *
 * One hero per faction, template for "one now, more variety later" --
 * adding a second hero per faction is a data change to HEROES, not a
 * rearchitecture of any of the math below.
 */

// Every hero shares the same power budget (300) so no faction's hero is a
// strict upgrade over another's -- flavor lives in the str/con/int/spd
// split (which changes atk/def) and the unique ability, not the total.
// atk/def reuse the exact U() builder formulas from client/src/data/
// factions.js so hero stat blocks read consistently with every unit's.
//
// ── Aura (creature-type buff) ──────────────────────────────────────────────
// Each hero also carries an `auraType`, matched against a unit's own `type`
// field in client/src/data/factions.js (the same field the strongVs/weakVs
// matchup badges read). This is deliberately battle-only, same trigger as
// the per-hero abilityId effects above: it never touches the player's
// standing `power` column (calcPower) or economy, only the effective attack
// power computed for a raid the hero is actually brought on (server/routes/
// game.js POST /battle) -- so bringing a hero is still the whole risk/reward
// point, not a passive buff you get for free by parking them at home.
// HERO_AURA_BONUS_PCT is shared across all heroes so no faction's aura is a
// strict upgrade; auraType is what varies, chosen from each faction's own
// roster to reward building around the hero's theme:
//   - undead: every unit is already type 'undead' -- Mordroth's aura simply
//     empowers the whole legion, matching Deathless Legion being army-wide too.
//   - nature: only the treant line (treant/shambling_mound/ancient_treant,
//     tiers 3-5) is type 'plant' -- fits "Warden of the Deep Root".
//   - tide: sea_spawn/aboleth/kraken_spawn are type 'aberration' -- the
//     abyssal monstrosities, fitting "the Abyssal Sovereign".
//   - flame: magmin/fire_elemental/efreeti are type 'elemental' -- the
//     living-fire units, fitting "the Ember Warlord".
//   - celestial: couatl/deva/planetar/solar/empyrean (4 of 9, its biggest
//     late-game tiers) are type 'celestial' -- fitting "the Radiant Exarch".
const HERO_AURA_BONUS_PCT = 0.20; // +20% effective power for matching-type units, that raid only

const HEROES = {
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
    auraLabel: "Abyssal Communion",
    auraDesc: 'Aura: while brought to battle, Aberration units gain +20% effective power for this raid.',
    goldUpkeep: 15, manaUpkeep: 8,
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
  },
};

// ── Leveling (reuses the scaledStats "D&D CR stepping" convention from
// client/src/data/factions.js, stretched over a longer 1-10 arc) ──────────
const HERO_MAX_LEVEL = 10;
const HERO_LEVEL_STAT_PCT = 0.08; // +8%/level off BASE stats, non-compounding
const HERO_MAX_HP = 100;          // HP ceiling doesn't scale with level in v1 --
                                   // Last Stand odds + regen speed are the payoff

function heroStatsAtLevel(heroDef, level) {
  const lvl = Math.max(1, Math.min(HERO_MAX_LEVEL, level || 1));
  const mult = 1 + (lvl - 1) * HERO_LEVEL_STAT_PCT;
  return {
    atk: Math.round(heroDef.atk * mult),
    def: Math.round(heroDef.def * mult),
    power: Math.round(heroDef.power * mult),
  };
}

// Titles are flavor, not just numbers -- a narrative beat independent of
// the stat sheet, which is what actually reads as "leveling up a hero"
// rather than "a number went up."
const HERO_TITLES = [
  { min: 10, title: 'Mythic' },
  { min: 7, title: 'Legendary' },
  { min: 5, title: 'Renowned' },
  { min: 3, title: 'Blooded' },
  { min: 1, title: 'Untested' },
];
function heroTitleForLevel(level) {
  return (HERO_TITLES.find(t => level >= t.min) || HERO_TITLES[HERO_TITLES.length - 1]).title;
}
function heroXpToNext(level) {
  return 100 * level;
}

// ── Recruiting & resurrection -- the two big gold sinks ───────────────────
// 35k/12k/25 turns: more than a tier-5 hall (28k/8k/55t), less than
// GUILD_CREATION_COST (50k flat) -- the second big thing a player saves up
// for, not the first or the last.
const HERO_RECRUIT_COST = { gold: 35000, mana: 12000, turns: 25 };

// Cheaper than a fresh recruit, scaling with level so a Mythic hero's death
// carries real weight -- at level 10 a resurrection (35,000g) costs almost
// as much as recruiting a brand-new hero, intentionally.
function heroResurrectCost(level) {
  return {
    gold: Math.round(14000 * (1 + level * 0.15)),
    mana: Math.round(4800 * (1 + level * 0.15)),
  };
}

// Straight out of the D&D playbook this was compared to: reviving a hero
// doesn't restore them to full strength immediately -- stops "die -> pay ->
// immediately back to full strength" from making death feel consequence-free.
const HERO_SICKNESS_MS = 24 * 60 * 60 * 1000; // 24h real-time
const HERO_SICKNESS_MULT = 0.7;               // -30% atk/def/power while sick

// ── Health, regen, and the Last Stand save (why death should be rare) ─────
// Piggybacks on the existing turn-regen cron (server/jobs.js, */2 * * * *)
// rather than a second timer -- full heal from 0 in ~13 ticks (~26 min).
const HERO_HP_REGEN_PCT = 0.08;
// `downed` heroes are benched from battle selection (and calcPower) until
// healed back above this fraction of max HP.
const HERO_DOWNED_RECOVER_PCT = 0.20;

// Damage on battle mirrors the *shape* of the existing casualty roll
// (rollCasualtyRate in routes/game.js) rather than inventing new math the
// player has to learn separately.
const HERO_DAMAGE_RANGE = { win: [0.05, 0.15], lose: [0.20, 0.40] };

// The Last Stand save is what keeps death rare: losing the fight, taking a
// heavy hit, AND failing an 80%+ save all have to line up. Scales with
// level so a hard-earned Mythic hero is genuinely harder to permanently
// lose than a level-1 rookie.
const HERO_LAST_STAND_BASE = 0.80;
const HERO_LAST_STAND_PER_LEVEL = 0.015;
const HERO_LAST_STAND_CAP = 0.93;
function heroLastStandChance(level) {
  return Math.min(HERO_LAST_STAND_CAP, HERO_LAST_STAND_BASE + Math.max(0, (level - 1)) * HERO_LAST_STAND_PER_LEVEL);
}

// XP is only earned on battles the hero was actually brought to (a reason
// to risk them, not just bench them for safety), scaled by how hard-fought
// the battle was -- a stomp teaches a legend little.
function heroXpGain(evenness) {
  return Math.round(15 + 25 * evenness);
}

module.exports = {
  HEROES, HERO_AURA_BONUS_PCT,
  HERO_MAX_LEVEL, HERO_LEVEL_STAT_PCT, HERO_MAX_HP,
  heroStatsAtLevel, heroTitleForLevel, heroXpToNext,
  HERO_RECRUIT_COST, heroResurrectCost,
  HERO_SICKNESS_MS, HERO_SICKNESS_MULT,
  HERO_HP_REGEN_PCT, HERO_DOWNED_RECOVER_PCT,
  HERO_DAMAGE_RANGE, heroLastStandChance, heroXpGain,
};

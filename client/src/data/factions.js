// ── SVG Crest strings (dangerouslySetInnerHTML or img src) ──────────────────
export const CRESTS = {
  undead: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#1a0826"/><path d="M10 17 L10 10 L13.5 13.5 L17 8 L20 12 L23 8 L26.5 13.5 L30 10 L30 17Z" fill="#c878e8"/><ellipse cx="20" cy="24" rx="9.5" ry="8.5" fill="#d8c8e8"/><ellipse cx="15.5" cy="23" rx="2.8" ry="3.2" fill="#1a0826"/><ellipse cx="24.5" cy="23" rx="2.8" ry="3.2" fill="#1a0826"/><path d="M18.5 27 L20 29.5 L21.5 27" stroke="#1a0826" stroke-width="1.3" fill="none"/><rect x="13" y="30" width="2.5" height="3.5" rx=".6" fill="#1a0826"/><rect x="17.5" y="30" width="2.5" height="3.5" rx=".6" fill="#1a0826"/><rect x="22" y="30" width="2.5" height="3.5" rx=".6" fill="#1a0826"/><line x1="13" y1="30" x2="27" y2="30" stroke="#1a0826" stroke-width="1"/></svg>`,
  nature: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#081a06"/><rect x="18.5" y="25" width="3" height="10" rx="1.5" fill="#6a4420"/><path d="M18.5 35 L14 39 M21.5 35 L26 39" stroke="#6a4420" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="23" rx="11" ry="7.5" fill="#3a8818"/><ellipse cx="20" cy="17" rx="9" ry="6.5" fill="#4aac22"/><ellipse cx="20" cy="12" rx="7" ry="5.5" fill="#78d848"/><circle cx="13" cy="21" r="2.5" fill="#58c030"/><circle cx="27" cy="21" r="2.5" fill="#58c030"/><circle cx="11" cy="15" r="2" fill="#78d848"/><circle cx="29" cy="15" r="2" fill="#78d848"/><circle cx="20" cy="7" r="1.8" fill="#a0e868"/></svg>`,
  tide: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#04121e"/><rect x="19" y="11" width="2.5" height="22" rx="1.2" fill="#78b8e8"/><path d="M13 16 L13 9 L15.5 12 M20 9 L20 6 M27 16 L27 9 L24.5 12" stroke="#78b8e8" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M4 28 Q8 23 12 28 Q16 33 20 28 Q24 23 28 28 Q32 33 36 28" stroke="#78b8e8" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M4 33 Q8 28 12 33 Q16 38 20 33 Q24 28 28 33 Q32 38 36 33" stroke="#4898c8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.55"/></svg>`,
  flame: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#200800"/><path d="M20 38 C15 30 10 25 15 18 C14 23 17.5 24 17.5 21 C15 16 20 9 20 7 C20 10 22.5 15 21.5 18.5 C25 15 25 10 27 13 C25 19.5 27 24 25 22 C30 26 26 31 20 38Z" fill="#e87848"/><path d="M20 35 C17.5 28 15.5 23.5 17.5 19.5 C17 22 18.5 23 18.5 21 C17 17.5 20 12.5 20 11 C20 13.5 21.5 17.5 20.5 20 C22.5 17.5 22.5 13.5 23.5 16 C22 20.5 23 24.5 21 22.5 C23 26 21 30 20 35Z" fill="#ffa060"/><ellipse cx="20" cy="11" rx="2.5" ry="3.5" fill="#ffe0a0" opacity="0.8"/><path d="M11 26 C7 21 5 14 9 12 C9 16.5 11.5 19 14 21Z" fill="#e87848" opacity="0.7"/><path d="M29 26 C33 21 35 14 31 12 C31 16.5 28.5 19 26 21Z" fill="#e87848" opacity="0.7"/></svg>`,
  celestial: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#1a1600"/><circle cx="20" cy="20" r="15" fill="none" stroke="#e8d878" stroke-width="1" opacity="0.35"/><path d="M20 6 L22.5 15.5 L32 13 L25 20 L32 27 L22.5 24.5 L20 34 L17.5 24.5 L8 27 L15 20 L8 13 L17.5 15.5 Z" fill="#e8d878"/><circle cx="20" cy="20" r="4" fill="#fff8d0"/><circle cx="20" cy="7.5" r="2" fill="#e8d878" opacity="0.7"/><circle cx="20" cy="32.5" r="2" fill="#e8d878" opacity="0.7"/><circle cx="7.5" cy="15" r="2" fill="#e8d878" opacity="0.7"/><circle cx="32.5" cy="15" r="2" fill="#e8d878" opacity="0.7"/><circle cx="7.5" cy="25" r="2" fill="#e8d878" opacity="0.7"/><circle cx="32.5" cy="25" r="2" fill="#e8d878" opacity="0.7"/></svg>`,
}

// ── SVG unit portrait generators (c=faction color, b=faction bg hex) ─────────
export const UNIT_ART = {
  archer:  (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><circle cx="25" cy="11" r="5" fill="${c}"/><rect x="23" y="16" width="4" height="9" rx="2" fill="${c}"/><path d="M21 17 L14 26" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><path d="M30 14 Q38 18 36 28" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="36" y1="13" x2="33.5" y2="28" stroke="${c}" stroke-width="1.1"/><path d="M19 23 L35 18" stroke="${c}" stroke-width="1.4"/><circle cx="35" cy="18" r="1.5" fill="${c}"/><rect x="23" y="25" width="4" height="12" rx="2" fill="${c}"/></svg>`,
  brute:   (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><circle cx="25" cy="10" r="6" fill="${c}"/><rect x="17" y="16" width="16" height="13" rx="3" fill="${c}"/><rect x="11" y="16" width="7" height="10" rx="3.5" fill="${c}"/><rect x="32" y="16" width="7" height="10" rx="3.5" fill="${c}"/><path d="M8 24 L6 28 L10 27Z" fill="${c}"/><path d="M42 24 L44 28 L40 27Z" fill="${c}"/><rect x="18" y="29" width="6" height="13" rx="3" fill="${c}"/><rect x="26" y="29" width="6" height="13" rx="3" fill="${c}"/></svg>`,
  warrior: (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><path d="M18 10 Q19 5 25 5 Q31 5 32 10 L32 16 L18 16Z" fill="${c}"/><rect x="19" y="16" width="12" height="13" rx="1.5" fill="${c}"/><path d="M9 18 Q9 13 14 13 L14 29 Q9 29 9 18Z" fill="${c}"/><rect x="33" y="10" width="3.5" height="18" rx="1.5" fill="${c}"/><rect x="31" y="16" width="10" height="3" rx="1.5" fill="${c}"/><rect x="19" y="29" width="5" height="13" rx="2.5" fill="${c}"/><rect x="26" y="29" width="5" height="13" rx="2.5" fill="${c}"/></svg>`,
  beast:   (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><ellipse cx="23" cy="28" rx="14" ry="8" fill="${c}"/><ellipse cx="38" cy="22" rx="8" ry="6.5" fill="${c}"/><circle cx="42" cy="20" r="1.8" fill="${b}"/><path d="M46 22 L50 20 L49 25Z" fill="${c}"/><path d="M10 28 Q5 28 3 34" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="11" y="34" width="4" height="9" rx="2" fill="${c}"/><rect x="17" y="35" width="4" height="9" rx="2" fill="${c}"/><rect x="25" y="35" width="4" height="9" rx="2" fill="${c}"/><rect x="31" y="34" width="4" height="9" rx="2" fill="${c}"/></svg>`,
  stalker: (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><circle cx="25" cy="13" r="5" fill="${c}"/><ellipse cx="22" cy="13" rx="1.6" ry="1.1" fill="${b}"/><ellipse cx="28" cy="13" rx="1.6" ry="1.1" fill="${b}"/><path d="M13 19 Q18 12 25 13 Q32 12 37 19 L34 42 Q25 46 16 42Z" fill="${c}"/><path d="M13 30 L8 36 M11 27 L5 33" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M37 30 L42 36 M39 27 L45 33" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`,
  knight:  (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><rect x="18" y="5" width="14" height="13" rx="4" fill="${c}"/><rect x="20" y="9" width="7" height="3" rx="1" fill="${b}" opacity="0.4"/><ellipse cx="14" cy="20" rx="5.5" ry="4" fill="${c}"/><ellipse cx="36" cy="20" rx="5.5" ry="4" fill="${c}"/><rect x="17" y="18" width="16" height="13" rx="1.5" fill="${c}"/><rect x="38" y="5" width="3.5" height="20" rx="1.5" fill="${c}"/><rect x="34" y="13" width="12" height="3.5" rx="1.5" fill="${c}"/><rect x="18" y="31" width="6" height="13" rx="2" fill="${c}"/><rect x="26" y="31" width="6" height="13" rx="2" fill="${c}"/></svg>`,
  mage:    (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><path d="M25 2 L19 14 L31 14Z" fill="${c}"/><ellipse cx="25" cy="14" rx="7" ry="2.5" fill="${c}" opacity="0.7"/><ellipse cx="25" cy="18" rx="5" ry="5.5" fill="${c}" opacity="0.92"/><path d="M15 24 Q25 20 35 24 L37 46 Q25 49 13 46Z" fill="${c}"/><rect x="38" y="11" width="2.5" height="28" rx="1.2" fill="${c}"/><circle cx="39.5" cy="10" r="4.5" fill="${c}"/><circle cx="39.5" cy="10" r="2.5" fill="${b}" opacity="0.4"/><circle cx="39.5" cy="10" r="1.2" fill="${c}"/></svg>`,
  wraith:  (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><path d="M25 7 C32 7 39 13 39 23 C39 33 32 39 25 42 C18 39 11 33 11 23 C11 13 18 7 25 7Z" fill="${c}" opacity="0.72"/><path d="M13 40 Q12 47 17 44 Q18 49 25 46 Q32 49 33 44 Q38 47 37 40" fill="${c}" opacity="0.5"/><ellipse cx="20" cy="24" rx="3.5" ry="4" fill="${b}"/><ellipse cx="30" cy="24" rx="3.5" ry="4" fill="${b}"/><ellipse cx="20" cy="24" rx="1.8" ry="2.2" fill="${c}"/><ellipse cx="30" cy="24" rx="1.8" ry="2.2" fill="${c}"/></svg>`,
  dragon:  (c,b) => `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="25" fill="${b}"/><ellipse cx="20" cy="31" rx="15" ry="9" fill="${c}"/><ellipse cx="38" cy="19" rx="9" ry="8" fill="${c}"/><path d="M46 18 L50 15 L50 22 L48 20Z" fill="${c}"/><circle cx="41" cy="16" r="2.2" fill="${b}"/><circle cx="41" cy="16" r="1" fill="#ff0"/><path d="M18 22 Q11 10 5 7 Q12 14 15 22Z" fill="${c}" opacity="0.85"/><path d="M18 23 Q10 13 4 17 Q10 20 16 26Z" fill="${c}" opacity="0.5"/><path d="M6 32 Q1 35 1 41 Q5 37 6 41 Q9 37 6 32Z" fill="${c}"/><path d="M12 38 L9 48 M18 40 L15 50" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/></svg>`,
}

// ── Unit builder ──────────────────────────────────────────────────────────────
// req is auto-set to `${id}_hall` — each unit gets its own dedicated building
function U(id, name, artType, tier, str, con, int_, spd, gc, mc, gu, mu, adv, disadv, type, role, strongVs, weakVs) {
  return {
    id, name, artType, tier, str, con, int: int_, spd,
    atk: str + Math.floor(int_ / 2),
    def: con + Math.floor(spd / 4),
    power: str + con + int_ + spd,
    goldCost: gc, manaCost: mc,
    goldUpkeep: gu, manaUpkeep: mu,
    req: `${id}_hall`,
    adv, disadv,
    type, role, strongVs, weakVs,
    icon: 'ti-sword',
  }
}

// ── Unit hall buildings (auto-generated, one per unit) ────────────────────────
const UNIT_HALL_NAMES = {
  // undead
  skeleton:'Bone Ossuary', zombie:'Plague Pit', ghoul:'Feeding Den',
  wight:'Cursed Barrow', shadow:'Shadow Rift', specter:'Haunting Chamber',
  vampire_spawn:'Blood Crypt', death_knight:'Dark Armory', lich:'Phylactery Vault',
  // nature
  dire_wolf:'Wolf Den', giant_spider:'Webbed Hollow', dryad:'Spirit Oak',
  owlbear:'Owlbear Lair', werewolf:'Moon Shrine', green_hag:"Witch's Bog",
  treant:'Elder Grove', shambling_mound:'Fetid Marsh', ancient_treant:'World Root',
  // tide
  merfolk:'Reef Hall', sahuagin:'Blood Reef', sea_spawn:'Tidal Grotto',
  merrow:'Deepwater Den', water_elemental:'Tempest Font', aboleth:'Aboleth Lair',
  kraken_spawn:'Kraken Pit', marid:'Marid Cistern', storm_giant:'Storm Spire',
  // flame
  magmin:'Ember Pit', hobgoblin:'War Camp', hell_hound:'Kennel Pits',
  salamander:'Flame Barracks', azer:'Azer Foundry', fire_elemental:'Inferno Gate',
  efreeti:'Brass Portal', fire_giant:"Giant's Hearth", red_dragon:'Dragon Roost',
  // celestial
  sprite:'Moonlit Glade', pixie:'Fey Ring', hippogriff:'Aerie',
  pegasus:'Cloud Stable', couatl:'Sacred Pool', deva:'Prayer Hall',
  planetar:'Celestial Bastion', solar:'Radiant Sanctum', empyrean:'Astral Throne',
}

// Build cost scales with tier — upgrading to level 2/3 boosts unit ATK+DEF by 25/50%
// landCost: acres consumed when the building is constructed (permanent)
// Upgrade multipliers applied in store: lv1→2 costs 3× base, lv2→3 costs 7× base
const TIER_HALL = [
  { gc: 200,   mc: 55,   turns: 3,  gg: 4,  mg: 1,  lc: 8  }, // tier 1 —  8 acres
  { gc: 900,   mc: 280,  turns: 8,  gg: 6,  mg: 2,  lc: 14 }, // tier 2 — 14 acres
  { gc: 5000,  mc: 1400, turns: 20, gg: 9,  mg: 4,  lc: 22 }, // tier 3 — 22 acres
  { gc: 12000, mc: 3200, turns: 35, gg: 14, mg: 6,  lc: 35 }, // tier 4 — 35 acres
  { gc: 28000, mc: 8000, turns: 55, gg: 22, mg: 10, lc: 55 }, // tier 5 — 55 acres
]

const ART_ICON = {
  archer:'ti-target', brute:'ti-sword', warrior:'ti-shield',
  beast:'ti-paw', stalker:'ti-eye-off', knight:'ti-shield-check',
  mage:'ti-sparkles', wraith:'ti-ghost', dragon:'ti-flame',
}

function hallBuildings(units) {
  return units.map(u => {
    const c = TIER_HALL[u.tier - 1]
    return {
      id: `${u.id}_hall`,
      name: UNIT_HALL_NAMES[u.id] || `${u.name} Hall`,
      icon: ART_ICON[u.artType] || 'ti-sword',
      category: 'military',
      unitId: u.id,
      tier: u.tier,
      goldCost: c.gc, manaCost: c.mc, turns: c.turns,
      goldGen: c.gg, manaGen: c.mg,
      landCost: c.lc,
      desc: `Trains ${u.name}. Each upgrade boosts their ATK & DEF by 25% (D&D CR scaling).`,
    }
  })
}

// ── Factions ─────────────────────────────────────────────────────────────────
export const FACTIONS = {
  undead: {
    name: 'The Dread Legion', shortName: 'Legion',
    epithet: 'Lords of the Unliving',
    color: '#c878e8', bg: 'rgba(180,50,255,.08)',
    icon: 'ti-skull',
    identity: 'Black', identityColor: '#3a1a52',
    advF: ['celestial', 'tide'], disadvF: ['nature', 'flame'],
    goldBonus: 0.10, manaBonus: 0.25,
    lore: `From the cursed wastes of the Abyssal Marches, the Dread Legion rises — an empire built not on the living but on the endlessly recycled dead. Every soldier slain in battle returns stronger, fueled by necromantic ichor.\n\nThe Legion's mages unlocked the secrets of soul-binding centuries ago, weaving fallen enemies into their war machine. Their mana flows freely from the spirit economy of ghost-towns left in their wake.`,
    units: [
      U('skeleton',      'Skeleton',       'warrior', 1,  5,  3,  4,  8,  25,   8, 0.6, 0.1, 'celestial','flame',    'undead',    'warrior',    ['celestial','fey'],       ['beast','plant']),
      U('zombie',        'Zombie',         'brute',   1,  7, 10,  2,  2,  30,  10, 0.8, 0.1, 'tide',     'flame',    'undead',    'tank',       ['fey','plant'],          ['beast','elemental']),
      U('ghoul',         'Ghoul',          'beast',   1,  9,  6,  3,  8,  35,  12, 1.0, 0.2, 'celestial','nature',   'undead',    'striker',    ['humanoid','fey'],        ['celestial','plant']),
      U('wight',         'Wight',          'warrior', 2, 10,  8,  6,  6,  85,  40, 1.5, 0.4, 'tide',     'nature',   'undead',    'warrior',    ['humanoid','celestial'],  ['beast','plant']),
      U('shadow',        'Shadow',         'stalker', 2,  8,  6, 10, 14, 110,  55, 2.5, 1.2, 'celestial','flame',    'undead',    'skirmisher', ['fey','humanoid'],        ['celestial','elemental']),
      U('specter',       'Specter',        'wraith',  3,  6,  6, 14, 12, 500, 240, 4.0, 2.5, 'celestial','nature',   'undead',    'mage',       ['fey','celestial'],       ['beast','plant']),
      U('vampire_spawn', 'Vampire Spawn',  'stalker', 3, 14, 12, 12, 14, 720, 360, 5.5, 3.0, 'tide',     'flame',    'undead',    'skirmisher', ['humanoid','fey'],        ['celestial','plant']),
      U('death_knight',  'Death Knight',   'knight',  4, 22, 20,  8,  6,1800, 900, 9.0, 4.5, 'celestial','nature',   'undead',    'tank',       ['humanoid','celestial'],  ['plant','beast']),
      U('lich',          'Lich',           'mage',    5, 10, 12, 36, 10,6400,3240,24.0,14.0, 'tide',     'flame',    'undead',    'mage',       ['celestial','giant'],     ['beast','elemental']),
    ],
    buildings: [
      { id:'ossuary',    name:'Ossuary Vault',     icon:'ti-coin',     category:'resource', stackable:true, maxCount:8, desc:'Each vault loots grave goods and soul-bound relics, generating steady income. Construct more to amplify earnings.', goldCost:155, manaCost:15, turns:2, landCost:8, goldPerBld:15 },
      { id:'phylactery', name:"Lich's Phylactery", icon:'ti-sparkles', category:'resource', stackable:true, maxCount:8, desc:'Each phylactery draws raw necrotic energy from the dead, fueling your spellcasters. More anchors mean more mana.',   goldCost:140, manaCost:35, turns:3, landCost:8, manaPerBld:8 },
    ],
  },

  nature: {
    name: 'The Verdant Circle', shortName: 'Circle',
    epithet: 'Wardens of the Living World',
    color: '#78d848', bg: 'rgba(80,180,60,.08)',
    icon: 'ti-leaf',
    identity: 'Green', identityColor: '#0a2206',
    advF: ['undead', 'tide'], disadvF: ['flame', 'celestial'],
    goldBonus: 0.20, manaBonus: 0.15,
    lore: `Ancient druids bound their covenant to the World Tree millennia before the first kings raised their banners. The Verdant Circle does not conquer land — it grows into it, taking root slowly, permanently.\n\nTheir gold comes from bountiful harvests amplified by nature magic. Where other factions fight over ruins, the Circle leaves behind thriving groves that generate wealth for centuries.`,
    units: [
      U('dire_wolf',      'Dire Wolf',      'beast',   1,  8,  6,  2, 12,  22,   7, 0.6, 0.1, 'undead',   'celestial','beast',      'skirmisher', ['humanoid','undead'],     ['elemental','aberration']),
      U('giant_spider',   'Giant Spider',   'beast',   1,  6,  5,  4, 10,  26,   9, 0.7, 0.1, 'tide',     'flame',    'beast',      'striker',    ['humanoid','fey'],        ['elemental','undead']),
      U('dryad',          'Dryad',          'mage',    1,  4,  5, 10,  8,  30,  10, 0.6, 0.3, 'undead',   'celestial','fey',        'mage',       ['humanoid','elemental'],  ['undead','aberration']),
      U('owlbear',        'Owlbear',        'beast',   2, 14, 12,  3,  8,  85,  38, 1.8, 0.4, 'tide',     'flame',    'monstrosity','bruiser',    ['humanoid','beast'],      ['elemental','dragon']),
      U('werewolf',       'Werewolf',       'beast',   2, 14, 10,  6, 12, 110,  50, 2.2, 0.6, 'undead',   'celestial','monstrosity','skirmisher', ['humanoid','undead'],     ['celestial','elemental']),
      U('green_hag',      'Green Hag',      'mage',    3, 10, 12, 20,  8, 520, 240, 4.0, 2.5, 'tide',     'flame',    'fey',        'mage',       ['humanoid','undead'],     ['celestial','aberration']),
      U('treant',         'Treant',         'brute',   3, 28, 30,  8,  4, 760, 384, 5.5, 3.0, 'undead',   'flame',    'plant',      'tank',       ['undead','humanoid'],     ['elemental','beast']),
      U('shambling_mound','Shambling Mound','brute',   4, 20, 22,  6,  6,1920, 936,12.0, 5.0, 'tide',     'celestial','plant',      'bruiser',    ['undead','elemental'],    ['beast','dragon']),
      U('ancient_treant', 'Ancient Treant', 'dragon',  5, 50, 48, 18,  6,6200,3100,22.0,12.0, 'undead',   'flame',    'plant',      'tank',       ['undead','giant'],        ['elemental','dragon']),
    ],
    buildings: [
      { id:'herbarium',  name:'Druidic Herbarium', icon:'ti-coin',     category:'resource', stackable:true, maxCount:8, desc:'Each herbarium cultivates rare alchemical herbs sold to apothecaries. Additional plots multiply your harvest income.',  goldCost:155, manaCost:15, turns:2, landCost:8, goldPerBld:15 },
      { id:'ley_stone',  name:'Ley Stone Circle',  icon:'ti-sparkles', category:'resource', stackable:true, maxCount:8, desc:'Each standing stone circle funnels raw nature mana from deep ley lines. More circles draw from wider convergences.', goldCost:140, manaCost:35, turns:3, landCost:8, manaPerBld:8 },
    ],
  },

  tide: {
    name: 'The Tidal Dominion', shortName: 'Dominion',
    epithet: 'Masters of the Abyssal Deep',
    color: '#78b8e8', bg: 'rgba(50,130,220,.08)',
    icon: 'ti-droplet',
    identity: 'Blue', identityColor: '#041228',
    advF: ['flame', 'celestial'], disadvF: ['undead', 'nature'],
    goldBonus: 0.15, manaBonus: 0.20,
    lore: `Rising from the sunken kingdoms of the continental shelf, the Tidal Dominion commands the currents of both sea and commerce. Their harbors are unassailable and their merchant fleets untouchable.\n\nThe Dominion's hydromancers shape water into living weapons. Their greatest units are part soldier, part elemental force — tides given will and sword.`,
    units: [
      U('merfolk',        'Merfolk Warrior', 'warrior', 1,  6,  5,  8,  8,  25,  10, 0.6, 0.2, 'flame',    'undead',   'humanoid',   'warrior',    ['beast','aberration'],    ['elemental','undead']),
      U('sahuagin',       'Sahuagin',        'warrior', 1,  8,  7,  4,  8,  30,  10, 0.8, 0.2, 'celestial','nature',   'humanoid',   'striker',    ['beast','humanoid'],      ['undead','elemental']),
      U('sea_spawn',      'Sea Spawn',       'brute',   1,  7,  8,  3,  6,  32,  12, 0.9, 0.2, 'flame',    'undead',   'aberration', 'tank',       ['humanoid','fey'],        ['beast','celestial']),
      U('merrow',         'Merrow',          'warrior', 2, 12, 10,  6,  8,  85,  38, 1.6, 0.5, 'celestial','nature',   'humanoid',   'bruiser',    ['beast','undead'],        ['elemental','aberration']),
      U('water_elemental','Water Elemental', 'wraith',  2, 12, 14, 10, 10, 115,  55, 2.5, 1.0, 'flame',    'undead',   'elemental',  'tank',       ['beast','humanoid'],      ['plant','celestial']),
      U('aboleth',        'Aboleth',         'mage',    3, 10, 14, 28,  6, 540, 270, 4.5, 3.0, 'celestial','nature',   'aberration', 'mage',       ['humanoid','celestial'],  ['fey','beast']),
      U('kraken_spawn',   'Kraken Spawn',    'beast',   3, 28, 26, 10, 10, 780, 400, 6.0, 3.5, 'flame',    'undead',   'aberration', 'bruiser',    ['humanoid','giant'],      ['celestial','beast']),
      U('marid',          'Marid',           'mage',    4, 14, 18, 26, 12,2000,1020,12.0, 7.0, 'celestial','nature',   'elemental',  'mage',       ['beast','humanoid'],      ['plant','dragon']),
      U('storm_giant',    'Storm Giant',     'dragon',  5, 50, 42, 20, 16,6500,3300,25.0,14.0, 'flame',    'undead',   'giant',      'bruiser',    ['elemental','humanoid'],  ['dragon','aberration']),
    ],
    buildings: [
      { id:'coral_market',name:'Coral Market',   icon:'ti-coin',     category:'resource', stackable:true, maxCount:8, desc:'Each market trades pearls, barnacle gold, and shipwreck artifacts. Additional stalls compound your undersea commerce.',    goldCost:155, manaCost:15, turns:2, landCost:8, goldPerBld:15 },
      { id:'maelstrom',   name:'Maelstrom Pool', icon:'ti-sparkles', category:'resource', stackable:true, maxCount:8, desc:'Each pool contains a vortex of elemental water bleeding raw tidal mana. More pools tap deeper abyssal currents.', goldCost:140, manaCost:35, turns:3, landCost:8, manaPerBld:8 },
    ],
  },

  flame: {
    name: 'The Ember Throne', shortName: 'Throne',
    epithet: 'Conquerors of the Ashen Plains',
    color: '#e87848', bg: 'rgba(220,80,30,.08)',
    icon: 'ti-flame',
    identity: 'Red', identityColor: '#240800',
    advF: ['nature', 'undead'], disadvF: ['tide', 'celestial'],
    goldBonus: 0.25, manaBonus: 0.10,
    lore: `Where others negotiate, the Ember Throne burns. Born from the volcanic highlands where gold veins run molten, they turned geological bounty into military supremacy.\n\nTheir forges never cool. Their soldiers never rest. The Ember Throne produces the wealthiest commanders in the realm — and the most aggressive armies.`,
    units: [
      U('magmin',        'Magmin',           'brute',   1,  7,  8,  4,  6,  26,   8, 0.7, 0.1, 'nature',   'tide',     'elemental',  'striker',    ['plant','beast'],         ['humanoid','celestial']),
      U('hobgoblin',     'Hobgoblin',        'warrior', 1,  8,  6,  4,  8,  30,  10, 0.8, 0.1, 'undead',   'celestial','humanoid',   'warrior',    ['fey','beast'],           ['undead','giant']),
      U('hell_hound',    'Hell Hound',       'beast',   1, 10,  8,  4, 12,  36,  12, 1.0, 0.2, 'nature',   'tide',     'beast',      'skirmisher', ['humanoid','fey'],        ['undead','elemental']),
      U('salamander',    'Salamander',       'warrior', 2, 14, 12,  8,  8,  90,  40, 1.8, 0.5, 'undead',   'celestial','humanoid',   'warrior',    ['plant','beast'],         ['celestial','giant']),
      U('azer',          'Azer',             'warrior', 2, 12, 10,  6,  8, 110,  48, 2.0, 0.5, 'nature',   'tide',     'humanoid',   'warrior',    ['plant','fey'],           ['undead','elemental']),
      U('fire_elemental','Fire Elemental',   'wraith',  3, 14, 10, 10, 14, 540, 260, 4.0, 2.0, 'undead',   'celestial','elemental',  'striker',    ['plant','beast'],         ['celestial','giant']),
      U('efreeti',       'Efreeti',          'mage',    3, 18, 16, 28, 12, 860, 450, 7.0, 4.0, 'nature',   'tide',     'elemental',  'mage',       ['humanoid','plant'],      ['celestial','giant']),
      U('fire_giant',    'Fire Giant',       'brute',   4, 38, 32, 10,  8,2060,1060,14.0, 6.0, 'undead',   'celestial','giant',      'bruiser',    ['elemental','humanoid'],  ['dragon','aberration']),
      U('red_dragon',    'Adult Red Dragon', 'dragon',  5, 55, 45, 26, 22,6800,3400,30.0,15.0, 'nature',   'celestial','dragon',     'bruiser',    ['giant','humanoid'],      ['aberration','celestial']),
    ],
    buildings: [
      { id:'dwarf_foundry',name:'Dwarven Gold Foundry', icon:'ti-coin',     category:'resource', stackable:true, maxCount:8, desc:"Each foundry runs Dwarven smiths around the clock smelting ore veins. More furnaces mean greater throughput.",     goldCost:155, manaCost:15, turns:2, landCost:8, goldPerBld:15 },
      { id:'brass_vent',   name:'City of Brass Vent',  icon:'ti-sparkles', category:'resource', stackable:true, maxCount:8, desc:'Each vent is a portal fragment from the Efreeti City of Brass. More fragments bleed more raw elemental fire mana.', goldCost:140, manaCost:35, turns:3, landCost:8, manaPerBld:8 },
    ],
  },

  celestial: {
    name: 'The Starborn Covenant', shortName: 'Covenant',
    epithet: 'Architects of the Eternal Firmament',
    color: '#e8d878', bg: 'rgba(220,200,80,.08)',
    icon: 'ti-star',
    identity: 'White', identityColor: '#1c1a00',
    advF: ['nature', 'flame'], disadvF: ['undead', 'tide'],
    goldBonus: 0.12, manaBonus: 0.22,
    lore: `The Starborn Covenant does not wage war — it enacts cosmic inevitability. Their scholars mapped the ley lines of the realm centuries before the other factions knew magic existed.\n\nThey are patient, precise, and devastating in the late game. The Covenant's towers drink mana from the stars themselves, funding armies of celestial beings that make mortal steel irrelevant.`,
    units: [
      U('sprite',      'Sprite',           'archer',  1,  3,  3,  8, 14,  24,  10, 0.6, 0.3, 'nature',   'undead',   'fey',        'skirmisher', ['undead','humanoid'],     ['elemental','aberration']),
      U('pixie',       'Pixie',            'mage',    1,  2,  3, 10, 12,  28,  12, 0.8, 0.4, 'flame',    'tide',     'fey',        'mage',       ['undead','humanoid'],     ['beast','elemental']),
      U('hippogriff',  'Hippogriff',       'beast',   2, 14, 10,  6, 16,  85,  38, 1.8, 0.5, 'nature',   'undead',   'monstrosity','skirmisher', ['humanoid','fey'],        ['elemental','undead']),
      U('pegasus',     'Pegasus',          'beast',   2, 12, 10,  8, 16, 110,  55, 2.0, 0.6, 'flame',    'tide',     'beast',      'skirmisher', ['humanoid','elemental'],  ['undead','aberration']),
      U('couatl',      'Couatl',           'mage',    3, 10, 12, 22, 14, 560, 300, 4.5, 3.0, 'nature',   'undead',   'celestial',  'mage',       ['undead','elemental'],    ['aberration','giant']),
      U('deva',        'Deva',             'warrior', 3, 14, 16, 18, 14, 840, 460, 6.0, 4.5, 'flame',    'tide',     'celestial',  'warrior',    ['undead','humanoid'],     ['aberration','elemental']),
      U('planetar',    'Planetar',         'knight',  4, 26, 26, 26, 18,2040,1080,13.0, 8.0, 'nature',   'undead',   'celestial',  'tank',       ['undead','giant'],        ['aberration','elemental']),
      U('solar',       'Solar',            'mage',    4, 26, 28, 36, 20,2260,1220,14.0,10.0, 'flame',    'tide',     'celestial',  'mage',       ['undead','dragon'],       ['aberration','giant']),
      U('empyrean',    'Empyrean',         'dragon',  5, 48, 46, 34, 22,6600,3360,27.0,16.0, 'flame',    'tide',     'celestial',  'bruiser',    ['undead','dragon'],       ['aberration','elemental']),
    ],
    buildings: [
      { id:'divine_mint', name:'Divine Mint',  icon:'ti-coin',     category:'resource', stackable:true, maxCount:8, desc:'Each mint produces sacred coinage blessed by Bahamut — accepted as pure currency across all factions. More mints, more coin.', goldCost:155, manaCost:15, turns:2, landCost:8, goldPerBld:15 },
      { id:'astral_font', name:'Astral Font',  icon:'ti-sparkles', category:'resource', stackable:true, maxCount:8, desc:'Each font is a crystallised pool of starlight overflowing with divine mana. Additional fonts draw from more star-lines.',      goldCost:140, manaCost:35, turns:3, landCost:8, manaPerBld:8 },
    ],
  },
}

// ── Auction items ─────────────────────────────────────────────────────────────
export const AUCTION_ITEMS = [
  { id:'tome',   name:'Tome of Conquest',     icon:'ti-map',      rarity:'Rare',      desc:'Doubles gold earned from battle victories for 24 turns.',          goldPrice:800,  manaPrice:200  },
  { id:'talis',  name:"Warlord's Talisman",   icon:'ti-shield',   rarity:'Epic',      desc:'+20% attack power for all units permanently.',                     goldPrice:1500, manaPrice:500  },
  { id:'scroll', name:"Cartographer's Scroll",icon:'ti-map',      rarity:'Common',    desc:'Immediately grants 30 acres of unclaimed territory.',               goldPrice:300,  manaPrice:0    },
  { id:'crown',  name:'Crown of Dominion',    icon:'ti-star',     rarity:'Legendary', desc:'Your power score is multiplied by 1.5 for rankings.',               goldPrice:3000, manaPrice:1000 },
  { id:'potion', name:"Alchemist's Draft",    icon:'ti-sparkles', rarity:'Common',    desc:'Instantly regenerates 50 turns.',                                   goldPrice:450,  manaPrice:150  },
  { id:'orb',    name:'Arcane Confluence',    icon:'ti-sparkles', rarity:'Epic',      desc:'+30% mana generation from all buildings permanently.',              goldPrice:1200, manaPrice:600  },
]

// ── Inject one hall building per unit into each faction ───────────────────────
Object.values(FACTIONS).forEach(f => {
  const halls = hallBuildings(f.units)
  f.buildings = [...halls, ...f.buildings]
})

// ── Stat scaling helper (exported for UI use) ─────────────────────────────────
// D&D CR stepping: each building level ≈ +2 CR → +25% ATK, +20% DEF
export function scaledStats(unit, bldLevel) {
  const lvl = Math.max(0, bldLevel)
  return {
    atk:   Math.round(unit.atk   * (1 + lvl * 0.25)),
    def:   Math.round(unit.def   * (1 + lvl * 0.20)),
    power: Math.round(unit.power * (1 + lvl * 0.15)),
  }
}

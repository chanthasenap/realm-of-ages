// ── Rarity system ─────────────────────────────────────────────────────────────
export const RARITY_COLOR = {
  Common:      '#9090a8',
  Uncommon:    '#78d848',
  Rare:        '#78b8e8',
  'Very Rare': '#c878e8',
  Legendary:   '#c9a84c',
}

export const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary']

// ── Item SVG art (c = rarity accent, b = background) ─────────────────────────
export const ITEM_ART = {
  scroll: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="11" y="17" width="28" height="16" rx="2" fill="${c}" opacity="0.12"/>
    <ellipse cx="25" cy="17" rx="14" ry="5" fill="${c}" opacity="0.85"/>
    <ellipse cx="25" cy="33" rx="14" ry="5" fill="${c}" opacity="0.65"/>
    <rect x="11" y="17" width="28" height="16" fill="${c}" opacity="0.08"/>
    <line x1="16" y1="21.5" x2="34" y2="21.5" stroke="${c}" stroke-width="1" opacity="0.5"/>
    <line x1="16" y1="25" x2="34" y2="25" stroke="${c}" stroke-width="1" opacity="0.5"/>
    <line x1="16" y1="28.5" x2="34" y2="28.5" stroke="${c}" stroke-width="1" opacity="0.5"/>
    <circle cx="25" cy="25" r="4.5" fill="${b}"/>
    <circle cx="25" cy="25" r="3" fill="${c}" opacity="0.9"/>
    <circle cx="25" cy="25" r="1.2" fill="${b}"/>
  </svg>`,

  tome: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="9" y="9" width="5" height="32" rx="2.5" fill="${c}"/>
    <rect x="12" y="9" width="22" height="32" rx="2" fill="${c}" opacity="0.85"/>
    <rect x="32" y="9" width="3" height="32" rx="1" fill="${c}" opacity="0.35"/>
    <line x1="16" y1="16" x2="30" y2="16" stroke="${b}" stroke-width="1.2" opacity="0.35"/>
    <line x1="16" y1="20" x2="30" y2="20" stroke="${b}" stroke-width="1.2" opacity="0.35"/>
    <line x1="16" y1="24" x2="30" y2="24" stroke="${b}" stroke-width="1.2" opacity="0.35"/>
    <line x1="16" y1="28" x2="30" y2="28" stroke="${b}" stroke-width="1.2" opacity="0.35"/>
    <circle cx="22" cy="34" r="4" stroke="${b}" stroke-width="1.5" fill="none" opacity="0.5"/>
    <circle cx="22" cy="34" r="2" fill="${b}" opacity="0.4"/>
    <rect x="33" y="21" width="8" height="8" rx="1" fill="${c}" opacity="0.4"/>
    <rect x="34" y="22" width="6" height="6" rx="0.5" stroke="${b}" stroke-width="1" fill="none" opacity="0.5"/>
  </svg>`,

  crown: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <path d="M8 35 L8 21 L17 30 L25 13 L33 30 L42 21 L42 35 Z" fill="${c}" opacity="0.88"/>
    <rect x="8" y="34" width="34" height="5" rx="1.5" fill="${c}"/>
    <circle cx="25" cy="13" r="3.2" fill="${b}"/>
    <circle cx="25" cy="13" r="2" fill="${c}"/>
    <circle cx="8" cy="21" r="2.8" fill="${b}"/>
    <circle cx="8" cy="21" r="1.7" fill="${c}"/>
    <circle cx="42" cy="21" r="2.8" fill="${b}"/>
    <circle cx="42" cy="21" r="1.7" fill="${c}"/>
    <circle cx="17" cy="30" r="2.2" fill="${b}"/>
    <circle cx="17" cy="30" r="1.3" fill="${c}"/>
    <circle cx="33" cy="30" r="2.2" fill="${b}"/>
    <circle cx="33" cy="30" r="1.3" fill="${c}"/>
    <line x1="12" y1="35" x2="38" y2="35" stroke="${b}" stroke-width="0.8" opacity="0.4"/>
  </svg>`,

  potion: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="20" y="9" width="10" height="8" rx="2" fill="${c}" opacity="0.65"/>
    <line x1="18" y1="16.5" x2="32" y2="16.5" stroke="${c}" stroke-width="2.5" opacity="0.75"/>
    <path d="M19 17 Q13 22 13 30 Q13 41 25 41 Q37 41 37 30 Q37 22 31 17 Z" fill="${c}" opacity="0.18"/>
    <path d="M19 17 Q13 22 13 30 Q13 41 25 41 Q37 41 37 30 Q37 22 31 17 Z" stroke="${c}" stroke-width="1.5" fill="none"/>
    <ellipse cx="25" cy="33" rx="9.5" ry="6" fill="${c}" opacity="0.65"/>
    <ellipse cx="25" cy="30" rx="6" ry="3" fill="${c}" opacity="0.2"/>
    <ellipse cx="21" cy="25" rx="3.5" ry="5" fill="white" opacity="0.1"/>
    <circle cx="31" cy="22" r="1.5" fill="white" opacity="0.2"/>
  </svg>`,

  orb: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <circle cx="25" cy="23" r="15" fill="${c}" opacity="0.12"/>
    <circle cx="25" cy="23" r="15" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.5"/>
    <circle cx="25" cy="23" r="10" fill="${c}" opacity="0.22"/>
    <circle cx="25" cy="23" r="10" stroke="${c}" stroke-width="1" fill="none" opacity="0.6"/>
    <circle cx="25" cy="23" r="5.5" fill="${c}" opacity="0.8"/>
    <ellipse cx="21.5" cy="19.5" rx="3" ry="2" fill="white" opacity="0.22"/>
    <line x1="25" y1="8" x2="25" y2="38" stroke="${c}" stroke-width="0.6" opacity="0.2"/>
    <line x1="10" y1="23" x2="40" y2="23" stroke="${c}" stroke-width="0.6" opacity="0.2"/>
    <rect x="20" y="37" width="10" height="4" rx="2" fill="${c}" opacity="0.55"/>
    <rect x="16" y="40" width="18" height="3" rx="1.5" fill="${c}" opacity="0.4"/>
  </svg>`,

  ring: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <ellipse cx="25" cy="32" rx="13" ry="5.5" fill="none" stroke="${c}" stroke-width="5.5" opacity="0.88"/>
    <ellipse cx="25" cy="32" rx="13" ry="5.5" fill="none" stroke="${b}" stroke-width="2.5"/>
    <path d="M18.5 25 Q20 16 25 14 Q30 16 31.5 25" fill="${c}" opacity="0.88"/>
    <ellipse cx="25" cy="21" rx="5.5" ry="4.5" fill="${c}"/>
    <ellipse cx="25" cy="21" rx="3.5" ry="2.8" fill="${b}" opacity="0.55"/>
    <ellipse cx="25" cy="20.5" rx="2" ry="1.5" fill="${c}" opacity="0.95"/>
    <ellipse cx="23.5" cy="19.5" rx="0.9" ry="0.7" fill="white" opacity="0.3"/>
  </svg>`,

  amulet: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <path d="M25 9 Q30 9 32 11" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M25 9 Q20 9 18 11" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M18 11 Q13 16 15 23 Q17 30 25 34 Q33 30 35 23 Q37 16 32 11 Z" fill="${c}" opacity="0.18"/>
    <path d="M18 11 Q13 16 15 23 Q17 30 25 34 Q33 30 35 23 Q37 16 32 11 Z" stroke="${c}" stroke-width="2" fill="none"/>
    <circle cx="25" cy="23" r="6" fill="${c}" opacity="0.88"/>
    <circle cx="25" cy="23" r="4" fill="${b}" opacity="0.5"/>
    <circle cx="25" cy="23" r="2.2" fill="${c}"/>
    <path d="M25 17 L26.5 21.5 L31 21.5 L27.5 24.5 L29 29 L25 26 L21 29 L22.5 24.5 L19 21.5 L23.5 21.5 Z" fill="${c}" opacity="0.35"/>
  </svg>`,

  weapon: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="23.5" y="7" width="3" height="24" rx="1.5" fill="${c}" opacity="0.9"/>
    <path d="M23.5 7 L22 9 L25 5 L28 9 L26.5 7 Z" fill="${c}"/>
    <rect x="15" y="21" width="20" height="3" rx="1.5" fill="${c}" opacity="0.75"/>
    <rect x="23.5" y="31" width="3" height="12" rx="1.5" fill="${c}" opacity="0.6"/>
    <circle cx="25" cy="42" r="3.5" fill="${c}" opacity="0.7"/>
    <circle cx="25" cy="42" r="2" fill="${b}" opacity="0.4"/>
    <rect x="22" y="31" width="6" height="2" rx="1" fill="${c}" opacity="0.8"/>
  </svg>`,

  banner: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="21.5" y="8" width="3" height="36" rx="1.5" fill="${c}" opacity="0.7"/>
    <path d="M24.5 10 L41 17 L41 32 L24.5 39 Z" fill="${c}" opacity="0.88"/>
    <line x1="27" y1="18.5" x2="38" y2="21" stroke="${b}" stroke-width="1.2" opacity="0.45"/>
    <line x1="27" y1="23.5" x2="38" y2="23.5" stroke="${b}" stroke-width="1.2" opacity="0.45"/>
    <line x1="27" y1="28.5" x2="38" y2="26" stroke="${b}" stroke-width="1.2" opacity="0.45"/>
    <circle cx="24.5" cy="10" r="2.5" fill="${c}"/>
    <circle cx="24.5" cy="10" r="1.2" fill="${b}" opacity="0.5"/>
  </svg>`,

  rune: (c, b = '#0d0d12') => `<svg viewBox="0 0 50 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="25" fill="${b}"/>
    <rect x="12" y="10" width="26" height="30" rx="3" fill="${c}" opacity="0.12"/>
    <rect x="12" y="10" width="26" height="30" rx="3" stroke="${c}" stroke-width="2" fill="none" opacity="0.7"/>
    <line x1="25" y1="14" x2="25" y2="36" stroke="${c}" stroke-width="2.2" opacity="0.85"/>
    <line x1="25" y1="14" x2="16" y2="22" stroke="${c}" stroke-width="2.2" opacity="0.85"/>
    <line x1="25" y1="14" x2="34" y2="22" stroke="${c}" stroke-width="2.2" opacity="0.85"/>
    <line x1="16" y1="26" x2="34" y2="26" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
    <line x1="16" y1="29" x2="25" y2="36" stroke="${c}" stroke-width="2" opacity="0.8"/>
    <line x1="34" y1="29" x2="25" y2="36" stroke="${c}" stroke-width="2" opacity="0.8"/>
  </svg>`,
}

// ── Auction item pool ─────────────────────────────────────────────────────────
// instant: applied immediately on purchase { gold, mana, land, turns }
// passive: stored in inventory, affect ongoing calculations
export const AUCTION_POOL = [
  // ── Common ───────────────────────────────────────────────────────────────────
  {
    id: 'scouts_map', name: "Scout's Map",
    artType: 'scroll', rarity: 'Common',
    type: 'Wondrous Item',
    goldPrice: 200, manaPrice: 0,
    desc: "A tattered map drawn by the realm's finest pathfinders. Immediately reveals and claims unclaimed territory adjacent to your borders.",
    flavorText: '"Every march begins with knowing where to march."',
    instant: { land: 25 },
  },
  {
    id: 'alchemists_draft', name: "Alchemist's Draft",
    artType: 'potion', rarity: 'Common',
    type: 'Potion',
    goldPrice: 300, manaPrice: 100,
    desc: 'A shimmering draught of distilled time-root and phoenix ash. Restores significant turn energy to your command staff.',
    flavorText: '"Tastes of iron and tomorrow."',
    instant: { turns: 60 },
  },
  {
    id: 'war_rations', name: 'Iron War Rations',
    artType: 'rune', rarity: 'Common',
    type: 'Wondrous Item',
    goldPrice: 250, manaPrice: 0,
    desc: 'Crates of high-calorie field rations stamped with the Iron Legion seal. Converts directly to treasury gold upon resale to allied merchants.',
    flavorText: '"An army fights on its stomach. A treasury grows on what it sells."',
    instant: { gold: 300, mana: 0 },
  },
  // ── Uncommon ─────────────────────────────────────────────────────────────────
  {
    id: 'iron_whetstone', name: 'Starmetal Whetstone',
    artType: 'rune', rarity: 'Uncommon',
    type: 'Wondrous Item',
    goldPrice: 520, manaPrice: 50,
    desc: 'Forged from ore that fell from the night sky, this whetstone permanently hones your soldiers\' blades to supernatural sharpness.',
    flavorText: '"A dull blade is a dead soldier."',
    passive: { atkPct: 0.15 },
    passiveLabel: '+15% unit ATK',
  },
  {
    id: 'merchants_ledger', name: "Merchant's Ledger",
    artType: 'tome', rarity: 'Uncommon',
    type: 'Wondrous Item',
    goldPrice: 560, manaPrice: 0,
    desc: 'Ancient trade routes, tax loopholes, and guild contacts documented in meticulous, blood-quill detail. Your gold income is permanently amplified.',
    flavorText: '"Every coin has two sides; this ledger knows both."',
    passive: { goldPct: 0.15 },
    passiveLabel: '+15% gold generation',
  },
  {
    id: 'arcane_primer', name: 'Arcane Primer',
    artType: 'tome', rarity: 'Uncommon',
    type: 'Spellbook (requires attunement)',
    goldPrice: 420, manaPrice: 150,
    desc: 'First-year conjuration text from the Academy of High Sorcery. Resonates with nearby ley lines to draw more ambient mana into your towers.',
    flavorText: '"Begin at the beginning. The power follows."',
    passive: { manaPct: 0.15 },
    passiveLabel: '+15% mana generation',
  },
  {
    id: 'war_standard', name: 'War Standard',
    artType: 'banner', rarity: 'Uncommon',
    type: 'Wondrous Item',
    goldPrice: 600, manaPrice: 80,
    desc: 'A veteran battle banner soaked in the blood of a hundred victories. Your soldiers fight with renewed ferocity when it flies.',
    flavorText: '"Where it falls, blood follows. Where it flies, armies follow."',
    passive: { powerPct: 0.12 },
    passiveLabel: '+12% unit power',
  },
  // ── Rare ─────────────────────────────────────────────────────────────────────
  {
    id: 'tome_conquest', name: 'Tome of Conquest',
    artType: 'tome', rarity: 'Rare',
    type: 'Wondrous Item (requires attunement)',
    goldPrice: 950, manaPrice: 200,
    desc: 'Military doctrine compiled by the Warlords of the Iron Age. Your commanders extract greater tribute from every source of wealth.',
    flavorText: '"Victory is only worth what you take from it."',
    passive: { goldPct: 0.25 },
    passiveLabel: '+25% gold generation',
  },
  {
    id: 'cartographers_scroll', name: "Grand Cartographer's Scroll",
    artType: 'scroll', rarity: 'Rare',
    type: 'Scroll of Claiming',
    goldPrice: 720, manaPrice: 0,
    desc: 'A self-drawing map that marks unclaimed land and files realm deeds in triplicate. Immediately folds a vast swath of territory into your domain.',
    flavorText: '"The ink writes itself wherever no banner flies."',
    instant: { land: 70 },
  },
  {
    id: 'ring_hoarding', name: 'Ring of Hoarding',
    artType: 'ring', rarity: 'Rare',
    type: 'Ring (requires attunement)',
    goldPrice: 1050, manaPrice: 100,
    desc: "A dragon-touched ring that carries the faint warmth of ancient greed. Every gold coin that flows through your treasury seems to multiply.",
    flavorText: '"Wearing it feels like holding a grudge — persistent and warm."',
    passive: { goldPct: 0.20 },
    passiveLabel: '+20% gold generation',
  },
  {
    id: 'arcane_condenser', name: 'Arcane Condenser',
    artType: 'orb', rarity: 'Rare',
    type: 'Wondrous Item (requires attunement by a spellcaster)',
    goldPrice: 880, manaPrice: 300,
    desc: "A crystalline sphere that distills raw ambient magic into refined mana. Significantly amplifies all arcane income flowing to your towers.",
    flavorText: '"The Weave does not resist — it simply needed direction."',
    passive: { manaPct: 0.25 },
    passiveLabel: '+25% mana generation',
  },
  {
    id: 'banner_iron', name: 'Banner of the Iron Legion',
    artType: 'banner', rarity: 'Rare',
    type: 'Wondrous Item',
    goldPrice: 1100, manaPrice: 150,
    desc: 'Carried by a thousand victories and stained with the blood of ten thousand enemies. Inspires savage courage in every unit under your command.',
    flavorText: '"It does not inspire fear. It inspires the certainty of victory."',
    passive: { powerPct: 0.20 },
    passiveLabel: '+20% unit power',
  },
  // ── Very Rare ─────────────────────────────────────────────────────────────────
  {
    id: 'warlords_talisman', name: "Warlord's Talisman",
    artType: 'amulet', rarity: 'Very Rare',
    type: 'Wondrous Item (requires attunement)',
    goldPrice: 1650, manaPrice: 500,
    desc: "Forged in the heart of a dying star, this talisman binds the wearer's will to their soldiers. All units fight with divine, unbreakable ferocity.",
    flavorText: '"They do not fight for you. They fight because you are wearing that."',
    passive: { atkPct: 0.25 },
    passiveLabel: '+25% unit ATK',
  },
  {
    id: 'planeshifter', name: "Planeshifter's Compass",
    artType: 'orb', rarity: 'Very Rare',
    type: 'Wondrous Item',
    goldPrice: 1450, manaPrice: 300,
    desc: 'Points not north, but toward unclaimed land across planar boundaries. Immediately folds space to annexe a massive expanse of territory.',
    flavorText: '"The Astral Sea has more real estate than anyone realizes."',
    instant: { land: 150 },
  },
  {
    id: 'grimoire_command', name: 'Grimoire of Command',
    artType: 'tome', rarity: 'Very Rare',
    type: 'Wondrous Item (requires attunement)',
    goldPrice: 1850, manaPrice: 600,
    desc: "A general's field manual channeled with compulsion magic. Your recruitment orders compel more soldiers to answer the call simultaneously.",
    flavorText: '"Read it aloud and soldiers appear from the woodwork. Literally, in some factions."',
    passive: { extraRecruit: 3 },
    passiveLabel: '+3 units per recruitment',
  },
  {
    id: 'siege_engine', name: 'Siege Engine Blueprint',
    artType: 'scroll', rarity: 'Very Rare',
    type: 'Wondrous Item',
    goldPrice: 2050, manaPrice: 400,
    desc: "Engineering diagrams for a revolutionary siege apparatus that extracts land from defeated enemies with unprecedented efficiency.",
    flavorText: '"The wall doesn\'t fall. The land falls to you instead."',
    passive: { raidLandPct: 0.35 },
    passiveLabel: '+35% land from raids',
  },
  // ── Legendary ─────────────────────────────────────────────────────────────────
  {
    id: 'crown_dominion', name: 'Crown of Dominion',
    artType: 'crown', rarity: 'Legendary',
    type: 'Wondrous Item (requires attunement by a ruler)',
    goldPrice: 3200, manaPrice: 1000,
    desc: "Worn by the first Emperor of the Eternal Realm before the Sundering. Its presence multiplies the fear and respect your power commands across all rankings.",
    flavorText: '"You don\'t wear the crown. The crown reveals what was always there."',
    passive: { powerMult: 1.5 },
    passiveLabel: 'Power ×1.5 in rankings',
  },
  {
    id: 'philosophers_stone', name: "Philosopher's Stone",
    artType: 'orb', rarity: 'Legendary',
    type: 'Wondrous Item',
    goldPrice: 2900, manaPrice: 800,
    desc: "The singular artifact sought by alchemists for ten thousand years. Transmutes raw land and effort into gold with divine, inexhaustible efficiency.",
    flavorText: '"It turns everything to gold. Everything."',
    passive: { goldPct: 0.45 },
    passiveLabel: '+45% gold generation',
  },
  {
    id: 'mantle_archmage', name: 'Mantle of the Archmage',
    artType: 'amulet', rarity: 'Legendary',
    type: 'Wondrous Item (requires attunement by a spellcaster)',
    goldPrice: 2700, manaPrice: 1000,
    desc: "The ceremonial cloak of the last Archmage of the Shattered Tower. Resonates with every ley line in the realm, drawing mana from sources your towers cannot reach.",
    flavorText: '"The Tower fell. The mana did not."',
    passive: { manaPct: 0.45 },
    passiveLabel: '+45% mana generation',
  },
]

// ── Consumable item pool (one-time battle buffs, sold in bulk) ────────────────
// effect: applied once per battle when selected
//   atkBoost, defBoost   — flat % added to that side for the battle
//   casualtyReduction    — % fewer casualties regardless of outcome
//   winChanceBoost       — flat % added to win probability
//   unitTypeBonus        — { type, atkBoost } only affects matching unit archetype
export const CONSUMABLE_POOL = [
  // ── Common ──────────────────────────────────────────────────────────────────
  {
    id: 'sharpening_stone', name: 'Sharpening Stone',
    artType: 'rune', rarity: 'Common',
    type: 'Consumable — Battle',
    goldPrice: 300, manaPrice: 0, qty: 5,
    desc: 'A rough whetstone infused with quartz dust. Soldiers hone their weapons before the assault, improving cutting edges for one engagement.',
    flavorText: '"Sharp enough to shave a troll. Sharp enough to win."',
    effect: { atkBoost: 0.10 },
    effectLabel: '+10% ATK this battle',
  },
  {
    id: 'iron_shield_oil', name: 'Iron Shield Oil',
    artType: 'potion', rarity: 'Common',
    type: 'Consumable — Battle',
    goldPrice: 275, manaPrice: 0, qty: 5,
    desc: 'Thick oil applied to shields and armour before engagement. Blunts glancing blows and improves morale through the din of battle.',
    flavorText: '"A soldier who cannot be cut is a soldier who keeps fighting."',
    effect: { defBoost: 0.10 },
    effectLabel: '+10% DEF this battle',
  },
  {
    id: 'soldier_rations', name: "Soldier's Rations",
    artType: 'scroll', rarity: 'Common',
    type: 'Consumable — Battle',
    goldPrice: 240, manaPrice: 0, qty: 5,
    desc: 'High-nutrition field rations distributed before a raid. Well-fed troops sustain fewer casualties in the chaos of combat.',
    flavorText: '"Full stomachs. Steady hands."',
    effect: { casualtyReduction: 0.15 },
    effectLabel: '−15% casualties this battle',
  },
  // ── Uncommon ────────────────────────────────────────────────────────────────
  {
    id: 'battle_draught', name: 'Battle Draught',
    artType: 'potion', rarity: 'Uncommon',
    type: 'Consumable — Battle',
    goldPrice: 560, manaPrice: 120, qty: 3,
    desc: 'An alchemical brew of giant-root and adrenaline salts. Sends warriors into a controlled frenzy that amplifies combat power for one engagement.',
    flavorText: '"It burns going down. The enemy burns coming up."',
    effect: { atkBoost: 0.20, casualtyReduction: -0.05 },
    effectLabel: '+20% ATK · −5% casualties',
  },
  {
    id: 'tactical_scroll', name: 'Tactical Scroll',
    artType: 'scroll', rarity: 'Uncommon',
    type: 'Consumable — Battle',
    goldPrice: 630, manaPrice: 75, qty: 3,
    desc: "A freshly-inked battle plan drawn up by a veteran strategist. Improves coordination, target selection, and withdrawal timing in a single engagement.",
    flavorText: '"The difference between a raid and a massacre is usually paperwork."',
    effect: { winChanceBoost: 0.12 },
    effectLabel: '+12% win chance this battle',
  },
  {
    id: 'vanguard_elixir', name: 'Vanguard Elixir',
    artType: 'potion', rarity: 'Uncommon',
    type: 'Consumable — Battle',
    goldPrice: 510, manaPrice: 180, qty: 3,
    desc: 'Brewed from phoenix feather and trollblood, this tonic surges through frontline troops reducing casualties from the initial clash.',
    flavorText: '"The vanguard breaks on them so the rest do not have to."',
    effect: { casualtyReduction: 0.25 },
    effectLabel: '−25% casualties this battle',
  },
  {
    id: 'cavalry_spurs', name: 'Enchanted Cavalry Spurs',
    artType: 'weapon', rarity: 'Uncommon',
    type: 'Consumable — Battle (mounted units)',
    goldPrice: 690, manaPrice: 90, qty: 3,
    desc: 'Rune-etched spurs that supercharge mounted unit charge speed for one devastating engagement.',
    flavorText: '"The thunder of hooves preceded the silence of the battlefield."',
    effect: { unitTypeBonus: { type: 'cavalry', atkBoost: 0.30 } },
    effectLabel: '+30% ATK for cavalry units',
  },
  // ── Rare ────────────────────────────────────────────────────────────────────
  {
    id: 'warcry_horn', name: 'Warcry Horn',
    artType: 'rune', rarity: 'Rare',
    type: 'Consumable — Battle',
    goldPrice: 920, manaPrice: 180, qty: 2,
    desc: 'A dragonbone horn whose bellow shakes the enemy formation. Temporarily shatters enemy morale, dramatically boosting your win odds.',
    flavorText: '"They heard it from three miles away. Only half of them stayed to fight."',
    effect: { winChanceBoost: 0.20, atkBoost: 0.10 },
    effectLabel: '+20% win chance · +10% ATK',
  },
  {
    id: 'shadow_dust', name: 'Shadow Dust',
    artType: 'orb', rarity: 'Rare',
    type: 'Consumable — Battle',
    goldPrice: 1020, manaPrice: 240, qty: 2,
    desc: 'Powdered from the scales of a Shadow Drake. Thrown into the air before the assault, it blinds enemy sentries and reduces their combat efficiency.',
    flavorText: '"Darkness is the oldest weapon."',
    effect: { defBoost: 0.15, winChanceBoost: 0.10 },
    effectLabel: '+15% DEF · +10% win chance',
  },
  {
    id: 'berserker_brew', name: "Berserker's Brew",
    artType: 'potion', rarity: 'Rare',
    type: 'Consumable — Battle',
    goldPrice: 1100, manaPrice: 220, qty: 2,
    desc: 'A potent, unhinged concoction that drives infantry into a blood rage. Devastating attack power at the cost of tactical awareness.',
    flavorText: '"They stopped counting the enemies. They stopped counting the years."',
    effect: { atkBoost: 0.35, casualtyReduction: -0.10 },
    effectLabel: '+35% ATK · −10% casualties',
  },
  // ── Very Rare ────────────────────────────────────────────────────────────────
  {
    id: 'generals_standard', name: "General's Battle Standard",
    artType: 'banner', rarity: 'Very Rare',
    type: 'Consumable — Battle',
    goldPrice: 1600, manaPrice: 400, qty: 1,
    desc: 'Blessed by three war clerics and carried into a hundred victories. Unfurling it before battle fills troops with supernatural confidence.',
    flavorText: '"Under that banner, fear becomes impossible."',
    effect: { atkBoost: 0.20, defBoost: 0.20, winChanceBoost: 0.10 },
    effectLabel: '+20% ATK · +20% DEF · +10% win chance',
  },
  {
    id: 'true_strike_scroll', name: 'Scroll of True Strike',
    artType: 'scroll', rarity: 'Very Rare',
    type: 'Consumable — Battle',
    goldPrice: 1800, manaPrice: 500, qty: 1,
    desc: "An ancient divination scroll that reveals the exact weak points in the enemy's formation before the first blow is struck.",
    flavorText: '"Every sword found its mark."',
    effect: { winChanceBoost: 0.30, casualtyReduction: 0.15 },
    effectLabel: '+30% win chance · −15% casualties',
  },
]

// ── Artifact item pool (passive + risk of transfer on raid) ───────────────────
// transferChance: probability this artifact is stolen per raid loss (0–1)
export const ARTIFACT_POOL = [
  {
    id: 'bloodstone_amulet', name: 'Bloodstone Amulet',
    artType: 'amulet', rarity: 'Rare',
    type: 'Artifact (requires attunement)',
    goldPrice: 1200, manaPrice: 250,
    transferChance: 0.08,
    desc: 'A dark red gem set in elder-wrought iron. It pulses with ancient martial fury, empowering all units attuned to its bearer.',
    flavorText: '"It remembers every battle it has witnessed. There are many."',
    passive: { atkPct: 0.18 },
    passiveLabel: '+18% unit ATK · Artifact (8% transfer risk)',
  },
  {
    id: 'relic_crown', name: 'Relic Crown of the Fallen King',
    artType: 'crown', rarity: 'Very Rare',
    type: 'Artifact (requires attunement by a ruler)',
    goldPrice: 2200, manaPrice: 600,
    transferChance: 0.10,
    desc: 'The crown of a dynasty that fell three ages ago. It carries the echoes of absolute authority, multiplying the bearer\'s perceived power.',
    flavorText: '"He was already dead when they took it. They called it inheritance."',
    passive: { powerPct: 0.30 },
    passiveLabel: '+30% unit power · Artifact (10% transfer risk)',
  },
  {
    id: 'shard_of_eternity', name: 'Shard of Eternity',
    artType: 'orb', rarity: 'Very Rare',
    type: 'Artifact',
    goldPrice: 2400, manaPrice: 700,
    transferChance: 0.09,
    desc: 'A crystalline fragment from the original Sundering. It bleeds raw mana into the surrounding ley lines, dramatically amplifying magical income.',
    flavorText: '"The world broke. This is what was left."',
    passive: { manaPct: 0.35 },
    passiveLabel: '+35% mana generation · Artifact (9% transfer risk)',
  },
  {
    id: 'conquest_ring', name: 'Conquest Ring of Dominar',
    artType: 'ring', rarity: 'Legendary',
    type: 'Artifact (requires attunement)',
    goldPrice: 3500, manaPrice: 1200,
    transferChance: 0.12,
    desc: 'Forged from melted throne-gold of the first Dominar. It compels the economy itself to serve its wearer, flooding every income stream.',
    flavorText: '"The ring did not make him greedy. It simply agreed with him."',
    passive: { goldPct: 0.40, powerPct: 0.15 },
    passiveLabel: '+40% gold · +15% power · Artifact (12% transfer risk)',
  },
  {
    id: 'warsouls_tome', name: "Warsoul's Tome",
    artType: 'tome', rarity: 'Legendary',
    type: 'Artifact (requires attunement)',
    goldPrice: 3800, manaPrice: 1400,
    transferChance: 0.12,
    desc: 'A living grimoire that absorbs the soul of every commander who reads it. Each soul adds its tactical knowledge to your armies.',
    flavorText: '"How many authors? The tome does not say."',
    passive: { atkPct: 0.30, powerPct: 0.20 },
    passiveLabel: '+30% ATK · +20% power · Artifact (12% transfer risk)',
  },
]

// ── Auto-refresh config ───────────────────────────────────────────────────────
export const AUCTION_REFRESH_MS  = 10 * 60 * 1000  // 10 minutes real-time
export const AUCTION_RESTOCK_COST = 150             // gold cost for early restock

// ── Auction generator ─────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateAuction(gs) {
  const gold = Math.max(gs?.gold || 0, 500)
  const mana = Math.max(gs?.mana || 0, 200)
  const ownedIds = new Set((gs?.items || []).map(i => i.id))

  const passivePool    = AUCTION_POOL.filter(i => !ownedIds.has(i.id))
  const consumablePool = CONSUMABLE_POOL.filter(i => i.goldPrice <= gold * 2)
  const artifactPool   = ARTIFACT_POOL.filter(i => !ownedIds.has(i.id))

  const dedupe = (arr, seen) => arr.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true })
  const affordable = pool => pool.filter(i => i.goldPrice <= gold * 1.5 && (i.manaPrice || 0) <= mana * 2)
  const seen = new Set()

  // Slot distribution: 5–6 consumables · 1 passive · ~20% chance of 1 artifact (else another consumable)
  const consumables  = dedupe(shuffle(affordable(consumablePool)), seen).slice(0, 5)
  const passives     = dedupe(shuffle(affordable(passivePool).concat(shuffle(passivePool))), seen).slice(0, 1)
  const artifactRoll = artifactPool.length > 0 && Math.random() < 0.20
  const artifacts    = artifactRoll ? dedupe(shuffle(artifactPool), seen).slice(0, 1) : []
  const extra        = !artifactRoll ? dedupe(shuffle(affordable(consumablePool)), seen).slice(0, 1) : []

  const picked = [...consumables, ...passives, ...artifacts, ...extra]

  // Pad to 7 with anything affordable if short
  if (picked.length < 7) {
    const allAffordable = [
      ...affordable(consumablePool), ...affordable(passivePool), ...affordable(artifactPool),
    ]
    picked.push(...dedupe(shuffle(allAffordable), seen).slice(0, 7 - picked.length))
  }

  return picked.slice(0, 7)
}

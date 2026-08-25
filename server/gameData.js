/**
 * server/gameData.js
 * Single source of truth for all game constants.
 * Used by both the server (validation, calculations) and served to the client.
 */

const FACTIONS = {
  undead: {
    name: 'Vorath Dominion', icon: 'ti-skull', color: '#c878e8',
    epithet: 'The Undying Empire', lore: 'When the Great Plague swept their lands, archmage Mordikael struck a covenant with the void: eternal existence for eternal servitude. Vethras Prime became the first city of the dead — its citizens not mindless shambling corpses, but sentient undead, memories intact, loyalty absolute.', goldBonus: 0, manaBonus: 0.15,
    buildings: [
      { id:'crypt',       name:'Bone Crypt',         icon:'ti-building',          goldCost:80,   manaCost:20,  turns:2,  goldGen:8,  manaGen:5  },
      { id:'plagupit',    name:'Plague Pit',          icon:'ti-biohazard',         goldCost:120,  manaCost:35,  turns:3,  goldGen:12, manaGen:8  },
      { id:'wraithspire', name:'Wraith Spire',        icon:'ti-tower',             goldCost:200,  manaCost:60,  turns:4,  goldGen:10, manaGen:18 },
      { id:'dragonlair',  name:'Death Dragon Lair',   icon:'ti-dragon',            goldCost:500,  manaCost:150, turns:8,  goldGen:20, manaGen:25 },
      { id:'lichcitadel', name:'Lich Citadel',        icon:'ti-castle',            goldCost:1000, manaCost:300, turns:12, goldGen:40, manaGen:50 },
    ],
    units: [
      { id:'skeleton',    name:'Skeleton Warrior', icon:'ti-skull',       atk:4,  def:2,  power:3,   goldCost:15,  manaCost:2,   goldUpkeep:1,   manaUpkeep:0.3,  req:'crypt'       },
      { id:'zombie',      name:'Plague Zombie',    icon:'ti-user-x',      atk:6,  def:1,  power:4,   goldCost:20,  manaCost:3,   goldUpkeep:1.5, manaUpkeep:0.5,  req:'plagupit'    },
      { id:'wraith',      name:'Wraith',           icon:'ti-ghost-2',     atk:10, def:5,  power:10,  goldCost:60,  manaCost:20,  goldUpkeep:4,   manaUpkeep:2,    req:'wraithspire' },
      { id:'deathdragon', name:'Death Dragon',     icon:'ti-dragon',      atk:40, def:20, power:60,  goldCost:300, manaCost:100, goldUpkeep:20,  manaUpkeep:10,   req:'dragonlair'  },
      { id:'lichlord',    name:'Lich Lord',        icon:'ti-wand',        atk:30, def:15, power:50,  goldCost:250, manaCost:80,  goldUpkeep:15,  manaUpkeep:8,    req:'lichcitadel' },
    ],
  },
  nature: {
    name: 'Sylvaran Accord', icon: 'ti-leaf', color: '#78d848',
    epithet: 'The Living Covenant', lore: 'For ten thousand years the Sylvaran have guarded nature\'s balance. Their cities grow within living trees, their armies rise from the forest itself. The Accord was first spoken by druid-queen Sylvara Aethon — a covenant between elves, treants, and ancient spirits that has never been broken.', goldBonus: 0.1, manaBonus: 0.2,
    buildings: [
      { id:'grove',      name:'Ancient Grove',    icon:'ti-trees',             goldCost:80,  manaCost:20,  turns:2,  goldGen:10, manaGen:6  },
      { id:'heartwood',  name:'Heartwood Hall',   icon:'ti-tree',              goldCost:150, manaCost:40,  turns:3,  goldGen:14, manaGen:10 },
      { id:'moonshrine', name:'Moon Shrine',      icon:'ti-moon',              goldCost:200, manaCost:60,  turns:4,  goldGen:12, manaGen:22 },
      { id:'dragonroost',name:'Dragon Roost',     icon:'ti-feather',           goldCost:400, manaCost:120, turns:7,  goldGen:18, manaGen:20 },
      { id:'worldtree',  name:'World Tree Nexus', icon:'ti-plant',             goldCost:900, manaCost:280, turns:12, goldGen:35, manaGen:45 },
    ],
    units: [
      { id:'archer',       name:'Sylvan Archer',   icon:'ti-bow-arrow',   atk:5,  def:3,  power:4,   goldCost:18,  manaCost:2,   goldUpkeep:1.2, manaUpkeep:0.3,  req:'grove'      },
      { id:'treant',       name:'Treant',          icon:'ti-tree',        atk:8,  def:14, power:12,  goldCost:80,  manaCost:15,  goldUpkeep:5,   manaUpkeep:2,    req:'heartwood'  },
      { id:'moondruid',    name:'Moon Druid',      icon:'ti-moon-stars',  atk:12, def:6,  power:14,  goldCost:90,  manaCost:25,  goldUpkeep:6,   manaUpkeep:3,    req:'moonshrine' },
      { id:'fairydragon',  name:'Fairy Dragon',    icon:'ti-butterfly',   atk:20, def:10, power:30,  goldCost:200, manaCost:60,  goldUpkeep:12,  manaUpkeep:7,    req:'dragonroost'},
      { id:'earthelemental',name:'Earth Elemental',icon:'ti-mountain',    atk:16, def:22, power:28,  goldCost:180, manaCost:55,  goldUpkeep:10,  manaUpkeep:6,    req:'worldtree'  },
    ],
  },
  water: {
    name: 'Thalassian Depths', icon: 'ti-droplet', color: '#78b8e8',
    epithet: 'Sovereigns of the Deep', lore: 'Below the waves, time moves differently. The Abyssal Court has deliberated policy for three thousand years in a single session. When a coastal kingdom once tried to drain the Thalassian Shallows, three cities vanished beneath tidal waves overnight. The sea does not negotiate.', goldBonus: 0.05, manaBonus: 0.25,
    buildings: [
      { id:'tidalpool',    name:'Tidal Pool Barracks', icon:'ti-waves',    goldCost:80,  manaCost:20,  turns:2,  goldGen:9,  manaGen:8  },
      { id:'coralfort',    name:'Coral Fortress',      icon:'ti-shield',   goldCost:130, manaCost:40,  turns:3,  goldGen:13, manaGen:12 },
      { id:'stormspire',   name:'Storm Spire',         icon:'ti-storm',    goldCost:220, manaCost:65,  turns:4,  goldGen:11, manaGen:25 },
      { id:'krakenpit',    name:'Kraken Pit',          icon:'ti-anchor',   goldCost:450, manaCost:130, turns:7,  goldGen:22, manaGen:22 },
      { id:'abyssalcourt', name:'Abyssal Court',       icon:'ti-crown',    goldCost:950, manaCost:290, turns:12, goldGen:38, manaGen:55 },
    ],
    units: [
      { id:'sprite',    name:'Water Sprite',    icon:'ti-droplet',      atk:4,  def:4,  power:4,   goldCost:16,  manaCost:3,   goldUpkeep:1,   manaUpkeep:0.5,  req:'tidalpool'   },
      { id:'merfolk',   name:'Merfolk Guard',   icon:'ti-user-shield',  atk:7,  def:9,  power:9,   goldCost:55,  manaCost:14,  goldUpkeep:4,   manaUpkeep:2,    req:'coralfort'   },
      { id:'tidelord',  name:'Tidal Elemental', icon:'ti-waves',        atk:15, def:8,  power:16,  goldCost:100, manaCost:30,  goldUpkeep:7,   manaUpkeep:4,    req:'stormspire'  },
      { id:'kraken',    name:'Kraken',          icon:'ti-octahedron',   atk:28, def:14, power:35,  goldCost:220, manaCost:65,  goldUpkeep:14,  manaUpkeep:8,    req:'krakenpit'   },
      { id:'leviathan', name:'Deep Leviathan',  icon:'ti-anchor',       atk:50, def:30, power:80,  goldCost:400, manaCost:120, goldUpkeep:25,  manaUpkeep:14,   req:'abyssalcourt'},
    ],
  },
  fire: {
    name: 'Emberpeak Horde', icon: 'ti-flame', color: '#e87848',
    epithet: 'The Unbroken War-Tide', lore: 'Forged in the belly of the Emberpeak Caldera, the Horde knows only two truths: fire purifies, and war decides. Red Dragons have entered a mutually beneficial arrangement — the Horde points them at targets worth destroying, and the dragons get to destroy things, which they enjoy.', goldBonus: 0.2, manaBonus: 0,
    buildings: [
      { id:'warcamp',   name:'War Camp',         icon:'ti-campfire',  goldCost:70,   manaCost:10,  turns:2,  goldGen:12, manaGen:3  },
      { id:'forge',     name:'Volcanic Forge',   icon:'ti-hammer',    goldCost:140,  manaCost:30,  turns:3,  goldGen:18, manaGen:6  },
      { id:'firetemple',name:'Fire Temple',      icon:'ti-flame',     goldCost:200,  manaCost:50,  turns:4,  goldGen:15, manaGen:15 },
      { id:'dragonpit', name:'Red Dragon Pit',   icon:'ti-dragon',    goldCost:500,  manaCost:140, turns:8,  goldGen:28, manaGen:18 },
      { id:'caldera',   name:'Caldera Citadel',  icon:'ti-mountain',  goldCost:1000, manaCost:250, turns:12, goldGen:50, manaGen:30 },
    ],
    units: [
      { id:'goblin',       name:'War Goblin',     icon:'ti-axe',      atk:5,  def:2,  power:3,   goldCost:12,  manaCost:1,   goldUpkeep:0.8, manaUpkeep:0.1,  req:'warcamp'   },
      { id:'marauder',     name:'Raid Marauder',  icon:'ti-swords',   atk:9,  def:5,  power:8,   goldCost:50,  manaCost:10,  goldUpkeep:3.5, manaUpkeep:1,    req:'forge'     },
      { id:'fireelemental',name:'Fire Elemental', icon:'ti-flame',    atk:14, def:4,  power:14,  goldCost:85,  manaCost:25,  goldUpkeep:6,   manaUpkeep:3,    req:'firetemple'},
      { id:'reddragon',    name:'Red Dragon',     icon:'ti-dragon',   atk:42, def:18, power:60,  goldCost:320, manaCost:90,  goldUpkeep:22,  manaUpkeep:9,    req:'dragonpit' },
      { id:'magmagiant',   name:'Magma Giant',    icon:'ti-mountain', atk:22, def:26, power:38,  goldCost:240, manaCost:70,  goldUpkeep:14,  manaUpkeep:6,    req:'caldera'   },
    ],
  },
  holy: {
    name: 'Celestian Vanguard', icon: 'ti-star', color: '#e8d878',
    epithet: 'The Divine Shield', lore: 'The First Covenant was signed in light. When darkness pressed in from all sides, twelve mortal champions ascended to the Celestial Plane and returned with a divine mandate: hold the line. The Vanguard has held it for four thousand years. That line has never broken.', goldBonus: 0.1, manaBonus: 0.1,
    buildings: [
      { id:'chapel',      name:'Field Chapel',     icon:'ti-building-church',   goldCost:90,   manaCost:25,  turns:2,  goldGen:10, manaGen:10 },
      { id:'barracks',    name:'Holy Barracks',    icon:'ti-shield',            goldCost:130,  manaCost:35,  turns:3,  goldGen:14, manaGen:8  },
      { id:'paladinhall', name:'Paladin Hall',     icon:'ti-shield-star',       goldCost:220,  manaCost:65,  turns:4,  goldGen:16, manaGen:20 },
      { id:'angelspire',  name:'Angel Spire',      icon:'ti-antenna',           goldCost:480,  manaCost:140, turns:8,  goldGen:22, manaGen:30 },
      { id:'sanctum',     name:'Celestial Sanctum',icon:'ti-crown',             goldCost:1000, manaCost:300, turns:12, goldGen:40, manaGen:50 },
    ],
    units: [
      { id:'warpriest', name:'War Priest',  icon:'ti-cross',        atk:3,  def:5,  power:5,   goldCost:20,  manaCost:4,   goldUpkeep:1.5, manaUpkeep:0.8,  req:'chapel'     },
      { id:'knight',    name:'Holy Knight', icon:'ti-sword',        atk:8,  def:8,  power:9,   goldCost:55,  manaCost:12,  goldUpkeep:4,   manaUpkeep:2,    req:'barracks'   },
      { id:'paladin',   name:'Paladin',     icon:'ti-shield-check', atk:14, def:12, power:18,  goldCost:110, manaCost:30,  goldUpkeep:8,   manaUpkeep:4,    req:'paladinhall'},
      { id:'angel',     name:'Angel',       icon:'ti-feather',      atk:24, def:16, power:35,  goldCost:230, manaCost:70,  goldUpkeep:15,  manaUpkeep:8,    req:'angelspire' },
      { id:'seraphim',  name:'Seraphim',    icon:'ti-sparkles',     atk:60, def:40, power:100, goldCost:500, manaCost:160, goldUpkeep:32,  manaUpkeep:18,   req:'sanctum'    },
    ],
  },
};

const AUCTION_ITEMS = [
  { id:'sigil_lich',    name:'Sigil of the Lich King',   icon:'ti-circle-key',      rarity:'legendary', goldPrice:800, manaPrice:200, desc:'+20% mana from all sources for 48h.' },
  { id:'dragonscale',   name:'Dragonscale Armor',        icon:'ti-shield-bolt',     rarity:'epic',      goldPrice:450, manaPrice:100, desc:'+15% defense to all units.' },
  { id:'ruins_map',     name:'Forgotten Ruin Map',       icon:'ti-map',             rarity:'rare',      goldPrice:180, manaPrice:40,  desc:'+20% land from explore actions.' },
  { id:'war_horn',      name:'War Horn',                 icon:'ti-device-speaker',  rarity:'uncommon',  goldPrice:90,  manaPrice:0,   desc:'All warrior-type units +3 attack.' },
  { id:'iron_rations',  name:'Iron Rations',             icon:'ti-meat',            rarity:'common',    goldPrice:30,  manaPrice:0,   desc:'+5% gold income for 24 hours.' },
  { id:'cel_lantern',   name:'Celestial Lantern',        icon:'ti-candle',          rarity:'epic',      goldPrice:380, manaPrice:90,  desc:'Holy units immune to first attack.' },
  { id:'dark_tome',     name:'Tome of Dark Pacts',       icon:'ti-book-2',          rarity:'rare',      goldPrice:220, manaPrice:50,  desc:'Undead units cost 20% less mana.' },
  { id:'sea_chart',     name:'Ancient Sea Chart',        icon:'ti-map-2',           rarity:'uncommon',  goldPrice:75,  manaPrice:0,   desc:'Water faction explores +10 acres.' },
];

// Power formula weights
const POWER_WEIGHTS = {
  land: 2,
  buildingPerLevel: 50,
};

function calcPower(player, buildings, army, factionId) {
  const faction = FACTIONS[factionId];
  if (!faction) return 0;
  let power = (player.land || 0) * POWER_WEIGHTS.land;
  buildings.forEach(b => { power += b.level * POWER_WEIGHTS.buildingPerLevel; });
  army.forEach(a => {
    const unitDef = faction.units.find(u => u.id === a.unit_id);
    if (unitDef) power += a.quantity * unitDef.power;
  });
  return Math.round(power);
}

function calcEconomy(player, buildings, army, factionId) {
  const faction = FACTIONS[factionId];
  if (!faction) return { goldGen:0, manaGen:0, goldUpkeep:0, manaUpkeep:0, goldNet:0, manaNet:0 };
  const landGold = Math.floor((player.land || 0) * 1.5);
  const landMana = Math.floor((player.land || 0) * 0.8);
  let bldGold = 0, bldMana = 0;
  buildings.forEach(b => {
    const bDef = faction.buildings.find(x => x.id === b.building_id);
    if (bDef) { bldGold += bDef.goldGen * b.level; bldMana += bDef.manaGen * b.level; }
  });
  const goldGen = Math.round((landGold + bldGold) * (1 + faction.goldBonus));
  const manaGen = Math.round((landMana + bldMana) * (1 + faction.manaBonus));
  let goldUpkeep = 0, manaUpkeep = 0;
  army.forEach(a => {
    const uDef = faction.units.find(u => u.id === a.unit_id);
    if (uDef) { goldUpkeep += a.quantity * uDef.goldUpkeep; manaUpkeep += a.quantity * uDef.manaUpkeep; }
  });
  goldUpkeep = Math.round(goldUpkeep);
  manaUpkeep = Math.round(manaUpkeep);
  return { goldGen, manaGen, goldUpkeep, manaUpkeep, goldNet: goldGen - goldUpkeep, manaNet: manaGen - manaUpkeep };
}

module.exports = { FACTIONS, AUCTION_ITEMS, POWER_WEIGHTS, calcPower, calcEconomy };

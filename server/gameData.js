/**
 * server/gameData.js
 * Single source of truth for all game constants.
 * Generated from client/src/data/factions.js so faction/building/unit ids,
 * costs, and upkeep stay in sync between client display and server validation.
 * Regenerate by re-running the transform if client/src/data/factions.js changes.
 */

const FACTIONS = {
  "undead": {
    "name": "The Dread Legion",
    "icon": "ti-skull",
    "color": "#c878e8",
    "epithet": "Lords of the Unliving",
    "goldBonus": 0.1,
    "manaBonus": 0.25,
    "buildings": [
      {
        "id": "skeleton_hall",
        "name": "Bone Ossuary",
        "icon": "ti-shield",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "zombie_hall",
        "name": "Plague Pit",
        "icon": "ti-sword",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "ghoul_hall",
        "name": "Feeding Den",
        "icon": "ti-paw",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "wight_hall",
        "name": "Cursed Barrow",
        "icon": "ti-shield",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "shadow_hall",
        "name": "Shadow Rift",
        "icon": "ti-eye-off",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "specter_hall",
        "name": "Haunting Chamber",
        "icon": "ti-ghost",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "vampire_spawn_hall",
        "name": "Blood Crypt",
        "icon": "ti-eye-off",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "death_knight_hall",
        "name": "Dark Armory",
        "icon": "ti-shield-check",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "lich_hall",
        "name": "Phylactery Vault",
        "icon": "ti-sparkles",
        "goldCost": 28000,
        "manaCost": 8000,
        "turns": 55,
        "goldGen": 22,
        "manaGen": 10
      },
      {
        "id": "ossuary",
        "name": "Ossuary Vault",
        "icon": "ti-coin",
        "goldCost": 155,
        "manaCost": 15,
        "turns": 2,
        "goldGen": 15,
        "manaGen": 0
      },
      {
        "id": "phylactery",
        "name": "Lich's Phylactery",
        "icon": "ti-sparkles",
        "goldCost": 140,
        "manaCost": 35,
        "turns": 3,
        "goldGen": 0,
        "manaGen": 8
      }
    ],
    "units": [
      {
        "id": "skeleton",
        "name": "Skeleton",
        "icon": "ti-sword",
        "atk": 7,
        "def": 5,
        "power": 20,
        "goldCost": 25,
        "manaCost": 8,
        "goldUpkeep": 0.6,
        "manaUpkeep": 0.1,
        "req": "skeleton_hall"
      },
      {
        "id": "zombie",
        "name": "Zombie",
        "icon": "ti-sword",
        "atk": 8,
        "def": 10,
        "power": 21,
        "goldCost": 30,
        "manaCost": 10,
        "goldUpkeep": 0.8,
        "manaUpkeep": 0.1,
        "req": "zombie_hall"
      },
      {
        "id": "ghoul",
        "name": "Ghoul",
        "icon": "ti-sword",
        "atk": 10,
        "def": 8,
        "power": 26,
        "goldCost": 35,
        "manaCost": 12,
        "goldUpkeep": 1,
        "manaUpkeep": 0.2,
        "req": "ghoul_hall"
      },
      {
        "id": "wight",
        "name": "Wight",
        "icon": "ti-sword",
        "atk": 13,
        "def": 9,
        "power": 30,
        "goldCost": 85,
        "manaCost": 40,
        "goldUpkeep": 1.5,
        "manaUpkeep": 0.4,
        "req": "wight_hall"
      },
      {
        "id": "shadow",
        "name": "Shadow",
        "icon": "ti-sword",
        "atk": 13,
        "def": 9,
        "power": 38,
        "goldCost": 110,
        "manaCost": 55,
        "goldUpkeep": 2.5,
        "manaUpkeep": 1.2,
        "req": "shadow_hall"
      },
      {
        "id": "specter",
        "name": "Specter",
        "icon": "ti-sword",
        "atk": 13,
        "def": 9,
        "power": 38,
        "goldCost": 500,
        "manaCost": 240,
        "goldUpkeep": 4,
        "manaUpkeep": 2.5,
        "req": "specter_hall"
      },
      {
        "id": "vampire_spawn",
        "name": "Vampire Spawn",
        "icon": "ti-sword",
        "atk": 20,
        "def": 15,
        "power": 52,
        "goldCost": 720,
        "manaCost": 360,
        "goldUpkeep": 5.5,
        "manaUpkeep": 3,
        "req": "vampire_spawn_hall"
      },
      {
        "id": "death_knight",
        "name": "Death Knight",
        "icon": "ti-sword",
        "atk": 26,
        "def": 21,
        "power": 56,
        "goldCost": 1800,
        "manaCost": 900,
        "goldUpkeep": 9,
        "manaUpkeep": 4.5,
        "req": "death_knight_hall"
      },
      {
        "id": "lich",
        "name": "Lich",
        "icon": "ti-sword",
        "atk": 28,
        "def": 14,
        "power": 68,
        "goldCost": 6400,
        "manaCost": 3240,
        "goldUpkeep": 24,
        "manaUpkeep": 14,
        "req": "lich_hall"
      }
    ]
  },
  "nature": {
    "name": "The Verdant Circle",
    "icon": "ti-leaf",
    "color": "#78d848",
    "epithet": "Wardens of the Living World",
    "goldBonus": 0.2,
    "manaBonus": 0.15,
    "buildings": [
      {
        "id": "dire_wolf_hall",
        "name": "Wolf Den",
        "icon": "ti-paw",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "giant_spider_hall",
        "name": "Webbed Hollow",
        "icon": "ti-paw",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "dryad_hall",
        "name": "Spirit Oak",
        "icon": "ti-sparkles",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "owlbear_hall",
        "name": "Owlbear Lair",
        "icon": "ti-paw",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "werewolf_hall",
        "name": "Moon Shrine",
        "icon": "ti-paw",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "green_hag_hall",
        "name": "Witch's Bog",
        "icon": "ti-sparkles",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "treant_hall",
        "name": "Elder Grove",
        "icon": "ti-sword",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "shambling_mound_hall",
        "name": "Fetid Marsh",
        "icon": "ti-sword",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "ancient_treant_hall",
        "name": "World Root",
        "icon": "ti-flame",
        "goldCost": 28000,
        "manaCost": 8000,
        "turns": 55,
        "goldGen": 22,
        "manaGen": 10
      },
      {
        "id": "herbarium",
        "name": "Druidic Herbarium",
        "icon": "ti-coin",
        "goldCost": 155,
        "manaCost": 15,
        "turns": 2,
        "goldGen": 15,
        "manaGen": 0
      },
      {
        "id": "ley_stone",
        "name": "Ley Stone Circle",
        "icon": "ti-sparkles",
        "goldCost": 140,
        "manaCost": 35,
        "turns": 3,
        "goldGen": 0,
        "manaGen": 8
      }
    ],
    "units": [
      {
        "id": "dire_wolf",
        "name": "Dire Wolf",
        "icon": "ti-sword",
        "atk": 9,
        "def": 9,
        "power": 28,
        "goldCost": 22,
        "manaCost": 7,
        "goldUpkeep": 0.6,
        "manaUpkeep": 0.1,
        "req": "dire_wolf_hall"
      },
      {
        "id": "giant_spider",
        "name": "Giant Spider",
        "icon": "ti-sword",
        "atk": 8,
        "def": 7,
        "power": 25,
        "goldCost": 26,
        "manaCost": 9,
        "goldUpkeep": 0.7,
        "manaUpkeep": 0.1,
        "req": "giant_spider_hall"
      },
      {
        "id": "dryad",
        "name": "Dryad",
        "icon": "ti-sword",
        "atk": 9,
        "def": 7,
        "power": 27,
        "goldCost": 30,
        "manaCost": 10,
        "goldUpkeep": 0.6,
        "manaUpkeep": 0.3,
        "req": "dryad_hall"
      },
      {
        "id": "owlbear",
        "name": "Owlbear",
        "icon": "ti-sword",
        "atk": 15,
        "def": 14,
        "power": 37,
        "goldCost": 85,
        "manaCost": 38,
        "goldUpkeep": 1.8,
        "manaUpkeep": 0.4,
        "req": "owlbear_hall"
      },
      {
        "id": "werewolf",
        "name": "Werewolf",
        "icon": "ti-sword",
        "atk": 17,
        "def": 13,
        "power": 42,
        "goldCost": 110,
        "manaCost": 50,
        "goldUpkeep": 2.2,
        "manaUpkeep": 0.6,
        "req": "werewolf_hall"
      },
      {
        "id": "green_hag",
        "name": "Green Hag",
        "icon": "ti-sword",
        "atk": 20,
        "def": 14,
        "power": 50,
        "goldCost": 520,
        "manaCost": 240,
        "goldUpkeep": 4,
        "manaUpkeep": 2.5,
        "req": "green_hag_hall"
      },
      {
        "id": "treant",
        "name": "Treant",
        "icon": "ti-sword",
        "atk": 32,
        "def": 31,
        "power": 70,
        "goldCost": 760,
        "manaCost": 384,
        "goldUpkeep": 5.5,
        "manaUpkeep": 3,
        "req": "treant_hall"
      },
      {
        "id": "shambling_mound",
        "name": "Shambling Mound",
        "icon": "ti-sword",
        "atk": 23,
        "def": 23,
        "power": 54,
        "goldCost": 1920,
        "manaCost": 936,
        "goldUpkeep": 12,
        "manaUpkeep": 5,
        "req": "shambling_mound_hall"
      },
      {
        "id": "ancient_treant",
        "name": "Ancient Treant",
        "icon": "ti-sword",
        "atk": 59,
        "def": 49,
        "power": 122,
        "goldCost": 6200,
        "manaCost": 3100,
        "goldUpkeep": 22,
        "manaUpkeep": 12,
        "req": "ancient_treant_hall"
      }
    ]
  },
  "tide": {
    "name": "The Tidal Dominion",
    "icon": "ti-droplet",
    "color": "#78b8e8",
    "epithet": "Masters of the Abyssal Deep",
    "goldBonus": 0.15,
    "manaBonus": 0.2,
    "buildings": [
      {
        "id": "merfolk_hall",
        "name": "Reef Hall",
        "icon": "ti-shield",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "sahuagin_hall",
        "name": "Blood Reef",
        "icon": "ti-shield",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "sea_spawn_hall",
        "name": "Tidal Grotto",
        "icon": "ti-sword",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "merrow_hall",
        "name": "Deepwater Den",
        "icon": "ti-shield",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "water_elemental_hall",
        "name": "Tempest Font",
        "icon": "ti-ghost",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "aboleth_hall",
        "name": "Aboleth Lair",
        "icon": "ti-sparkles",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "kraken_spawn_hall",
        "name": "Kraken Pit",
        "icon": "ti-paw",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "marid_hall",
        "name": "Marid Cistern",
        "icon": "ti-sparkles",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "storm_giant_hall",
        "name": "Storm Spire",
        "icon": "ti-flame",
        "goldCost": 28000,
        "manaCost": 8000,
        "turns": 55,
        "goldGen": 22,
        "manaGen": 10
      },
      {
        "id": "coral_market",
        "name": "Coral Market",
        "icon": "ti-coin",
        "goldCost": 155,
        "manaCost": 15,
        "turns": 2,
        "goldGen": 15,
        "manaGen": 0
      },
      {
        "id": "maelstrom",
        "name": "Maelstrom Pool",
        "icon": "ti-sparkles",
        "goldCost": 140,
        "manaCost": 35,
        "turns": 3,
        "goldGen": 0,
        "manaGen": 8
      }
    ],
    "units": [
      {
        "id": "merfolk",
        "name": "Merfolk Warrior",
        "icon": "ti-sword",
        "atk": 10,
        "def": 7,
        "power": 27,
        "goldCost": 25,
        "manaCost": 10,
        "goldUpkeep": 0.6,
        "manaUpkeep": 0.2,
        "req": "merfolk_hall"
      },
      {
        "id": "sahuagin",
        "name": "Sahuagin",
        "icon": "ti-sword",
        "atk": 10,
        "def": 9,
        "power": 27,
        "goldCost": 30,
        "manaCost": 10,
        "goldUpkeep": 0.8,
        "manaUpkeep": 0.2,
        "req": "sahuagin_hall"
      },
      {
        "id": "sea_spawn",
        "name": "Sea Spawn",
        "icon": "ti-sword",
        "atk": 8,
        "def": 9,
        "power": 24,
        "goldCost": 32,
        "manaCost": 12,
        "goldUpkeep": 0.9,
        "manaUpkeep": 0.2,
        "req": "sea_spawn_hall"
      },
      {
        "id": "merrow",
        "name": "Merrow",
        "icon": "ti-sword",
        "atk": 15,
        "def": 12,
        "power": 36,
        "goldCost": 85,
        "manaCost": 38,
        "goldUpkeep": 1.6,
        "manaUpkeep": 0.5,
        "req": "merrow_hall"
      },
      {
        "id": "water_elemental",
        "name": "Water Elemental",
        "icon": "ti-sword",
        "atk": 17,
        "def": 16,
        "power": 46,
        "goldCost": 115,
        "manaCost": 55,
        "goldUpkeep": 2.5,
        "manaUpkeep": 1,
        "req": "water_elemental_hall"
      },
      {
        "id": "aboleth",
        "name": "Aboleth",
        "icon": "ti-sword",
        "atk": 24,
        "def": 15,
        "power": 58,
        "goldCost": 540,
        "manaCost": 270,
        "goldUpkeep": 4.5,
        "manaUpkeep": 3,
        "req": "aboleth_hall"
      },
      {
        "id": "kraken_spawn",
        "name": "Kraken Spawn",
        "icon": "ti-sword",
        "atk": 33,
        "def": 28,
        "power": 74,
        "goldCost": 780,
        "manaCost": 400,
        "goldUpkeep": 6,
        "manaUpkeep": 3.5,
        "req": "kraken_spawn_hall"
      },
      {
        "id": "marid",
        "name": "Marid",
        "icon": "ti-sword",
        "atk": 27,
        "def": 21,
        "power": 70,
        "goldCost": 2000,
        "manaCost": 1020,
        "goldUpkeep": 12,
        "manaUpkeep": 7,
        "req": "marid_hall"
      },
      {
        "id": "storm_giant",
        "name": "Storm Giant",
        "icon": "ti-sword",
        "atk": 60,
        "def": 46,
        "power": 128,
        "goldCost": 6500,
        "manaCost": 3300,
        "goldUpkeep": 25,
        "manaUpkeep": 14,
        "req": "storm_giant_hall"
      }
    ]
  },
  "flame": {
    "name": "The Ember Throne",
    "icon": "ti-flame",
    "color": "#e87848",
    "epithet": "Conquerors of the Ashen Plains",
    "goldBonus": 0.25,
    "manaBonus": 0.1,
    "buildings": [
      {
        "id": "magmin_hall",
        "name": "Ember Pit",
        "icon": "ti-sword",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "hobgoblin_hall",
        "name": "War Camp",
        "icon": "ti-shield",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "hell_hound_hall",
        "name": "Kennel Pits",
        "icon": "ti-paw",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "salamander_hall",
        "name": "Flame Barracks",
        "icon": "ti-shield",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "azer_hall",
        "name": "Azer Foundry",
        "icon": "ti-shield",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "fire_elemental_hall",
        "name": "Inferno Gate",
        "icon": "ti-ghost",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "efreeti_hall",
        "name": "Brass Portal",
        "icon": "ti-sparkles",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "fire_giant_hall",
        "name": "Giant's Hearth",
        "icon": "ti-sword",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "red_dragon_hall",
        "name": "Dragon Roost",
        "icon": "ti-flame",
        "goldCost": 28000,
        "manaCost": 8000,
        "turns": 55,
        "goldGen": 22,
        "manaGen": 10
      },
      {
        "id": "dwarf_foundry",
        "name": "Dwarven Gold Foundry",
        "icon": "ti-coin",
        "goldCost": 155,
        "manaCost": 15,
        "turns": 2,
        "goldGen": 15,
        "manaGen": 0
      },
      {
        "id": "brass_vent",
        "name": "City of Brass Vent",
        "icon": "ti-sparkles",
        "goldCost": 140,
        "manaCost": 35,
        "turns": 3,
        "goldGen": 0,
        "manaGen": 8
      }
    ],
    "units": [
      {
        "id": "magmin",
        "name": "Magmin",
        "icon": "ti-sword",
        "atk": 9,
        "def": 9,
        "power": 25,
        "goldCost": 26,
        "manaCost": 8,
        "goldUpkeep": 0.7,
        "manaUpkeep": 0.1,
        "req": "magmin_hall"
      },
      {
        "id": "hobgoblin",
        "name": "Hobgoblin",
        "icon": "ti-sword",
        "atk": 10,
        "def": 8,
        "power": 26,
        "goldCost": 30,
        "manaCost": 10,
        "goldUpkeep": 0.8,
        "manaUpkeep": 0.1,
        "req": "hobgoblin_hall"
      },
      {
        "id": "hell_hound",
        "name": "Hell Hound",
        "icon": "ti-sword",
        "atk": 12,
        "def": 11,
        "power": 34,
        "goldCost": 36,
        "manaCost": 12,
        "goldUpkeep": 1,
        "manaUpkeep": 0.2,
        "req": "hell_hound_hall"
      },
      {
        "id": "salamander",
        "name": "Salamander",
        "icon": "ti-sword",
        "atk": 18,
        "def": 14,
        "power": 42,
        "goldCost": 90,
        "manaCost": 40,
        "goldUpkeep": 1.8,
        "manaUpkeep": 0.5,
        "req": "salamander_hall"
      },
      {
        "id": "azer",
        "name": "Azer",
        "icon": "ti-sword",
        "atk": 15,
        "def": 12,
        "power": 36,
        "goldCost": 110,
        "manaCost": 48,
        "goldUpkeep": 2,
        "manaUpkeep": 0.5,
        "req": "azer_hall"
      },
      {
        "id": "fire_elemental",
        "name": "Fire Elemental",
        "icon": "ti-sword",
        "atk": 19,
        "def": 13,
        "power": 48,
        "goldCost": 540,
        "manaCost": 260,
        "goldUpkeep": 4,
        "manaUpkeep": 2,
        "req": "fire_elemental_hall"
      },
      {
        "id": "efreeti",
        "name": "Efreeti",
        "icon": "ti-sword",
        "atk": 32,
        "def": 19,
        "power": 74,
        "goldCost": 860,
        "manaCost": 450,
        "goldUpkeep": 7,
        "manaUpkeep": 4,
        "req": "efreeti_hall"
      },
      {
        "id": "fire_giant",
        "name": "Fire Giant",
        "icon": "ti-sword",
        "atk": 43,
        "def": 34,
        "power": 88,
        "goldCost": 2060,
        "manaCost": 1060,
        "goldUpkeep": 14,
        "manaUpkeep": 6,
        "req": "fire_giant_hall"
      },
      {
        "id": "red_dragon",
        "name": "Adult Red Dragon",
        "icon": "ti-sword",
        "atk": 68,
        "def": 50,
        "power": 148,
        "goldCost": 6800,
        "manaCost": 3400,
        "goldUpkeep": 30,
        "manaUpkeep": 15,
        "req": "red_dragon_hall"
      }
    ]
  },
  "celestial": {
    "name": "The Starborn Covenant",
    "icon": "ti-star",
    "color": "#e8d878",
    "epithet": "Architects of the Eternal Firmament",
    "goldBonus": 0.12,
    "manaBonus": 0.22,
    "buildings": [
      {
        "id": "sprite_hall",
        "name": "Moonlit Glade",
        "icon": "ti-target",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "pixie_hall",
        "name": "Fey Ring",
        "icon": "ti-sparkles",
        "goldCost": 200,
        "manaCost": 55,
        "turns": 3,
        "goldGen": 4,
        "manaGen": 1
      },
      {
        "id": "hippogriff_hall",
        "name": "Aerie",
        "icon": "ti-paw",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "pegasus_hall",
        "name": "Cloud Stable",
        "icon": "ti-paw",
        "goldCost": 900,
        "manaCost": 280,
        "turns": 8,
        "goldGen": 6,
        "manaGen": 2
      },
      {
        "id": "couatl_hall",
        "name": "Sacred Pool",
        "icon": "ti-sparkles",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "deva_hall",
        "name": "Prayer Hall",
        "icon": "ti-shield",
        "goldCost": 5000,
        "manaCost": 1400,
        "turns": 20,
        "goldGen": 9,
        "manaGen": 4
      },
      {
        "id": "planetar_hall",
        "name": "Celestial Bastion",
        "icon": "ti-shield-check",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "solar_hall",
        "name": "Radiant Sanctum",
        "icon": "ti-sparkles",
        "goldCost": 12000,
        "manaCost": 3200,
        "turns": 35,
        "goldGen": 14,
        "manaGen": 6
      },
      {
        "id": "empyrean_hall",
        "name": "Astral Throne",
        "icon": "ti-flame",
        "goldCost": 28000,
        "manaCost": 8000,
        "turns": 55,
        "goldGen": 22,
        "manaGen": 10
      },
      {
        "id": "divine_mint",
        "name": "Divine Mint",
        "icon": "ti-coin",
        "goldCost": 155,
        "manaCost": 15,
        "turns": 2,
        "goldGen": 15,
        "manaGen": 0
      },
      {
        "id": "astral_font",
        "name": "Astral Font",
        "icon": "ti-sparkles",
        "goldCost": 140,
        "manaCost": 35,
        "turns": 3,
        "goldGen": 0,
        "manaGen": 8
      }
    ],
    "units": [
      {
        "id": "sprite",
        "name": "Sprite",
        "icon": "ti-sword",
        "atk": 7,
        "def": 6,
        "power": 28,
        "goldCost": 24,
        "manaCost": 10,
        "goldUpkeep": 0.6,
        "manaUpkeep": 0.3,
        "req": "sprite_hall"
      },
      {
        "id": "pixie",
        "name": "Pixie",
        "icon": "ti-sword",
        "atk": 7,
        "def": 6,
        "power": 27,
        "goldCost": 28,
        "manaCost": 12,
        "goldUpkeep": 0.8,
        "manaUpkeep": 0.4,
        "req": "pixie_hall"
      },
      {
        "id": "hippogriff",
        "name": "Hippogriff",
        "icon": "ti-sword",
        "atk": 17,
        "def": 14,
        "power": 46,
        "goldCost": 85,
        "manaCost": 38,
        "goldUpkeep": 1.8,
        "manaUpkeep": 0.5,
        "req": "hippogriff_hall"
      },
      {
        "id": "pegasus",
        "name": "Pegasus",
        "icon": "ti-sword",
        "atk": 16,
        "def": 14,
        "power": 46,
        "goldCost": 110,
        "manaCost": 55,
        "goldUpkeep": 2,
        "manaUpkeep": 0.6,
        "req": "pegasus_hall"
      },
      {
        "id": "couatl",
        "name": "Couatl",
        "icon": "ti-sword",
        "atk": 21,
        "def": 15,
        "power": 58,
        "goldCost": 560,
        "manaCost": 300,
        "goldUpkeep": 4.5,
        "manaUpkeep": 3,
        "req": "couatl_hall"
      },
      {
        "id": "deva",
        "name": "Deva",
        "icon": "ti-sword",
        "atk": 23,
        "def": 19,
        "power": 62,
        "goldCost": 840,
        "manaCost": 460,
        "goldUpkeep": 6,
        "manaUpkeep": 4.5,
        "req": "deva_hall"
      },
      {
        "id": "planetar",
        "name": "Planetar",
        "icon": "ti-sword",
        "atk": 39,
        "def": 30,
        "power": 96,
        "goldCost": 2040,
        "manaCost": 1080,
        "goldUpkeep": 13,
        "manaUpkeep": 8,
        "req": "planetar_hall"
      },
      {
        "id": "solar",
        "name": "Solar",
        "icon": "ti-sword",
        "atk": 44,
        "def": 33,
        "power": 110,
        "goldCost": 2260,
        "manaCost": 1220,
        "goldUpkeep": 14,
        "manaUpkeep": 10,
        "req": "solar_hall"
      },
      {
        "id": "empyrean",
        "name": "Empyrean",
        "icon": "ti-sword",
        "atk": 65,
        "def": 51,
        "power": 150,
        "goldCost": 6600,
        "manaCost": 3360,
        "goldUpkeep": 27,
        "manaUpkeep": 16,
        "req": "empyrean_hall"
      }
    ]
  }
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

// ── Resource Exploration tiers (see server/routes/game.js '/explore') ──────
// Three "Fortune" tiers that mirror the turn costs of the existing
// "Territory" tiers (Scout Party / Expedition / Grand Conquest -- 1/3/8
// turns) but pay out gold+mana instead of land. Rewards are ROLLED within a
// range scaled to the player's own current income (perTurnGold/perTurnMana,
// from calcEconomy) rather than a flat number or a deterministic payout --
// floors keep a fresh, building-less player's first run worth taking; caps
// keep a maxed-out economy from making the top tier an auto-win every time.
// A single shared "luck" roll drives both gold and mana together (a good
// run reads as good on both, not gold-lucky-but-mana-unlucky), and pushes
// toward the top of the range as tier goes up -- so spending more turns
// buys better odds, not just a bigger number, which is what makes choosing
// a higher tier a real decision instead of pure arithmetic. Bonus item
// finds are rolled separately in server/routes/game.js, which also owns
// ITEM_CATALOG (this file intentionally has no item-catalog dependency).
const TURNS_PER_HOUR = 30; // 1 turn / 2 min, matches server/jobs.js

const RESOURCE_TIERS = {
  peddler: {
    name: "Peddler's Cart",
    turnCost: 1,
    incomeTurnsMin: 0.6, incomeTurnsMax: 1.4,
    minGold: 8,  maxGold: 180,
    minMana: 2,  maxMana: 60,
    itemChance: 0.04, // 1 in 25
    itemPoolEnd: 4,   // cheapest 4 consumables (see game.js consumablePool())
  },
  smuggler: {
    name: "Smuggler's Route",
    turnCost: 3,
    incomeTurnsMin: 2.2, incomeTurnsMax: 4.5,
    minGold: 30, maxGold: 650,
    minMana: 8,  maxMana: 220,
    itemChance: 0.10, // 1 in 10
    itemPoolEnd: 8,
  },
  caravan: {
    name: 'Grand Caravan',
    turnCost: 8,
    incomeTurnsMin: 6, incomeTurnsMax: 13,
    minGold: 90, maxGold: 1800,
    minMana: 25, maxMana: 600,
    itemChance: 0.18, // ~1 in 5.5
    itemPoolEnd: 12,  // full consumable list -- only the top tier reaches it
  },
};

function calcResourceTierReward(tierKey, player, buildings, army, factionId) {
  const tier = RESOURCE_TIERS[tierKey];
  if (!tier) return null;
  const eco = calcEconomy(player, buildings, army, factionId);
  const perTurnGold = Math.max(0, eco.goldNet) / TURNS_PER_HOUR;
  const perTurnMana = Math.max(0, eco.manaNet) / TURNS_PER_HOUR;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));
  const luck = Math.random();
  const mult = tier.incomeTurnsMin + luck * (tier.incomeTurnsMax - tier.incomeTurnsMin);
  return {
    goldBonus: clamp(perTurnGold * mult, tier.minGold, tier.maxGold),
    manaBonus: clamp(perTurnMana * mult, tier.minMana, tier.maxMana),
    turnCost: tier.turnCost,
    luck,
  };
}

// Preview ranges for every tier at once, for getFullState() -- lets the
// client show "roughly X-Y gold" on each card without exposing the luck
// roll itself. Recomputed from the player's live economy on every state
// fetch, so the preview drifts (intentionally) as their income grows.
function calcResourceTierPreviews(player, buildings, army, factionId) {
  const eco = calcEconomy(player, buildings, army, factionId);
  const perTurnGold = Math.max(0, eco.goldNet) / TURNS_PER_HOUR;
  const perTurnMana = Math.max(0, eco.manaNet) / TURNS_PER_HOUR;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));
  const out = {};
  for (const [key, tier] of Object.entries(RESOURCE_TIERS)) {
    out[key] = {
      turnCost: tier.turnCost,
      minGold: clamp(perTurnGold * tier.incomeTurnsMin, tier.minGold, tier.maxGold),
      maxGold: clamp(perTurnGold * tier.incomeTurnsMax, tier.minGold, tier.maxGold),
      minMana: clamp(perTurnMana * tier.incomeTurnsMin, tier.minMana, tier.maxMana),
      maxMana: clamp(perTurnMana * tier.incomeTurnsMax, tier.minMana, tier.maxMana),
      itemChance: tier.itemChance,
    };
  }
  return out;
}

module.exports = {
  FACTIONS, AUCTION_ITEMS, POWER_WEIGHTS, calcPower, calcEconomy,
  RESOURCE_TIERS, calcResourceTierReward, calcResourceTierPreviews,
};


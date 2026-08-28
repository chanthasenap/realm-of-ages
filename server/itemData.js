/**
 * server/itemData.js
 * Minimal, server-authoritative purchase catalog for the Auction House.
 *
 * The client (client/src/data/items.js) owns the full item definitions —
 * flavor text, descriptions, art, passive/effect details — and already has
 * them loaded for display. This file exists ONLY so the server never has
 * to trust a client-supplied price: it mirrors just id -> price/qty/what-
 * to-grant, generated directly from the client catalog so the two
 * can't silently drift on the fields that actually matter for a
 * transaction. Regenerate by hand if client/src/data/items.js changes
 * prices, consumable charge counts, or instant-grant amounts.
 *
 * itemCategory:
 *   'instant'    — one-time grant (land/gold/mana/turns), never stored
 *   'consumable' — stored with a qty of battle-use charges
 *   'artifact'   — stored, qty always 1, can be lost to raids client-side
 *   'passive'    — stored, qty always 1, ongoing bonus while owned
 *
 * Consumable entries also carry `effect` — mirrored by hand from the
 * `effect` field on CONSUMABLE_POOL in client/src/data/items.js. Needed
 * server-side so POST /game/battle can apply a selected item's bonus
 * itself rather than trusting a client-supplied effect value. Regenerate
 * alongside the rest of this file if the client's effects change.
 *   atkBoost, defBoost   — flat % applied to the attacker's own side for the battle
 *   casualtyReduction    — % fewer casualties regardless of outcome (negative = more)
 *   winChanceBoost       — flat % added to win probability
 *   unitTypeBonus        — { type, atkBoost }; no unit-archetype tagging exists
 *                           server-side yet, so this is applied as a flat atkBoost
 *                           instead of being restricted to the named unit type
 */

const ITEM_CATALOG = {
  "scouts_map": {
    "name": "Scout's Map",
    "goldPrice": 200,
    "manaPrice": 0,
    "itemCategory": "instant",
    "qty": 1,
    "instant": {
      "land": 25
    }
  },
  "alchemists_draft": {
    "name": "Alchemist's Draft",
    "goldPrice": 300,
    "manaPrice": 100,
    "itemCategory": "instant",
    "qty": 1,
    "instant": {
      "turns": 60
    }
  },
  "war_rations": {
    "name": "Iron War Rations",
    "goldPrice": 250,
    "manaPrice": 0,
    "itemCategory": "instant",
    "qty": 1,
    "instant": {
      "gold": 300,
      "mana": 0
    }
  },
  "iron_whetstone": {
    "name": "Starmetal Whetstone",
    "goldPrice": 520,
    "manaPrice": 50,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "merchants_ledger": {
    "name": "Merchant's Ledger",
    "goldPrice": 560,
    "manaPrice": 0,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "arcane_primer": {
    "name": "Arcane Primer",
    "goldPrice": 420,
    "manaPrice": 150,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "war_standard": {
    "name": "War Standard",
    "goldPrice": 600,
    "manaPrice": 80,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "tome_conquest": {
    "name": "Tome of Conquest",
    "goldPrice": 950,
    "manaPrice": 200,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "cartographers_scroll": {
    "name": "Grand Cartographer's Scroll",
    "goldPrice": 720,
    "manaPrice": 0,
    "itemCategory": "instant",
    "qty": 1,
    "instant": {
      "land": 70
    }
  },
  "ring_hoarding": {
    "name": "Ring of Hoarding",
    "goldPrice": 1050,
    "manaPrice": 100,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "arcane_condenser": {
    "name": "Arcane Condenser",
    "goldPrice": 880,
    "manaPrice": 300,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "banner_iron": {
    "name": "Banner of the Iron Legion",
    "goldPrice": 1100,
    "manaPrice": 150,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "warlords_talisman": {
    "name": "Warlord's Talisman",
    "goldPrice": 1650,
    "manaPrice": 500,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "planeshifter": {
    "name": "Planeshifter's Compass",
    "goldPrice": 1450,
    "manaPrice": 300,
    "itemCategory": "instant",
    "qty": 1,
    "instant": {
      "land": 150
    }
  },
  "grimoire_command": {
    "name": "Grimoire of Command",
    "goldPrice": 1850,
    "manaPrice": 600,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "siege_engine": {
    "name": "Siege Engine Blueprint",
    "goldPrice": 2050,
    "manaPrice": 400,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "crown_dominion": {
    "name": "Crown of Dominion",
    "goldPrice": 3200,
    "manaPrice": 1000,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "philosophers_stone": {
    "name": "Philosopher's Stone",
    "goldPrice": 2900,
    "manaPrice": 800,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "mantle_archmage": {
    "name": "Mantle of the Archmage",
    "goldPrice": 2700,
    "manaPrice": 1000,
    "itemCategory": "passive",
    "qty": 1,
    "instant": null
  },
  "sharpening_stone": {
    "name": "Sharpening Stone",
    "goldPrice": 300,
    "manaPrice": 0,
    "itemCategory": "consumable",
    "qty": 5,
    "instant": null,
    "effect": { "atkBoost": 0.10 }
  },
  "iron_shield_oil": {
    "name": "Iron Shield Oil",
    "goldPrice": 275,
    "manaPrice": 0,
    "itemCategory": "consumable",
    "qty": 5,
    "instant": null,
    "effect": { "defBoost": 0.10 }
  },
  "soldier_rations": {
    "name": "Soldier's Rations",
    "goldPrice": 240,
    "manaPrice": 0,
    "itemCategory": "consumable",
    "qty": 5,
    "instant": null,
    "effect": { "casualtyReduction": 0.15 }
  },
  "battle_draught": {
    "name": "Battle Draught",
    "goldPrice": 560,
    "manaPrice": 120,
    "itemCategory": "consumable",
    "qty": 3,
    "instant": null,
    "effect": { "atkBoost": 0.20, "casualtyReduction": -0.05 }
  },
  "tactical_scroll": {
    "name": "Tactical Scroll",
    "goldPrice": 630,
    "manaPrice": 75,
    "itemCategory": "consumable",
    "qty": 3,
    "instant": null,
    "effect": { "winChanceBoost": 0.12 }
  },
  "vanguard_elixir": {
    "name": "Vanguard Elixir",
    "goldPrice": 510,
    "manaPrice": 180,
    "itemCategory": "consumable",
    "qty": 3,
    "instant": null,
    "effect": { "casualtyReduction": 0.25 }
  },
  "cavalry_spurs": {
    "name": "Enchanted Cavalry Spurs",
    "goldPrice": 690,
    "manaPrice": 90,
    "itemCategory": "consumable",
    "qty": 3,
    "instant": null,
    "effect": { "unitTypeBonus": { "type": "cavalry", "atkBoost": 0.30 } }
  },
  "warcry_horn": {
    "name": "Warcry Horn",
    "goldPrice": 920,
    "manaPrice": 180,
    "itemCategory": "consumable",
    "qty": 2,
    "instant": null,
    "effect": { "winChanceBoost": 0.20, "atkBoost": 0.10 }
  },
  "shadow_dust": {
    "name": "Shadow Dust",
    "goldPrice": 1020,
    "manaPrice": 240,
    "itemCategory": "consumable",
    "qty": 2,
    "instant": null,
    "effect": { "defBoost": 0.15, "winChanceBoost": 0.10 }
  },
  "berserker_brew": {
    "name": "Berserker's Brew",
    "goldPrice": 1100,
    "manaPrice": 220,
    "itemCategory": "consumable",
    "qty": 2,
    "instant": null,
    "effect": { "atkBoost": 0.35, "casualtyReduction": -0.10 }
  },
  "generals_standard": {
    "name": "General's Battle Standard",
    "goldPrice": 1600,
    "manaPrice": 400,
    "itemCategory": "consumable",
    "qty": 1,
    "instant": null,
    "effect": { "atkBoost": 0.20, "defBoost": 0.20, "winChanceBoost": 0.10 }
  },
  "true_strike_scroll": {
    "name": "Scroll of True Strike",
    "goldPrice": 1800,
    "manaPrice": 500,
    "itemCategory": "consumable",
    "qty": 1,
    "instant": null,
    "effect": { "winChanceBoost": 0.30, "casualtyReduction": 0.15 }
  },
  "bloodstone_amulet": {
    "name": "Bloodstone Amulet",
    "goldPrice": 1200,
    "manaPrice": 250,
    "itemCategory": "artifact",
    "qty": 1,
    "instant": null
  },
  "relic_crown": {
    "name": "Relic Crown of the Fallen King",
    "goldPrice": 2200,
    "manaPrice": 600,
    "itemCategory": "artifact",
    "qty": 1,
    "instant": null
  },
  "shard_of_eternity": {
    "name": "Shard of Eternity",
    "goldPrice": 2400,
    "manaPrice": 700,
    "itemCategory": "artifact",
    "qty": 1,
    "instant": null
  },
  "conquest_ring": {
    "name": "Conquest Ring of Dominar",
    "goldPrice": 3500,
    "manaPrice": 1200,
    "itemCategory": "artifact",
    "qty": 1,
    "instant": null
  },
  "warsouls_tome": {
    "name": "Warsoul's Tome",
    "goldPrice": 3800,
    "manaPrice": 1400,
    "itemCategory": "artifact",
    "qty": 1,
    "instant": null
  }
};

module.exports = { ITEM_CATALOG };

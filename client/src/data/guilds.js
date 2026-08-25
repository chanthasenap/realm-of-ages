export const GUILD_CREATION_COST = 50_000
export const GUILD_MAX_MEMBERS   = 25

export const GUILD_PERKS = [
  { id: 'member_cap',   name: 'Expanded Roster',    icon: 'users',     costs: [50_000, 150_000, 400_000], effects: ['+5 member slots (+30 max)', '+10 member slots (+35 max)', '+15 member slots (+40 max)'], desc: 'Increase the maximum guild size, allowing more members to join and contribute.' },
  { id: 'xp_boost',    name: 'Experience Surge',    icon: 'trophy',    costs: [80_000, 220_000, 550_000], effects: ['+15% Guild XP from all sources', '+30% Guild XP', '+50% Guild XP'], desc: 'Accelerate guild leveling — all XP earned by members is amplified.' },
  { id: 'gold_share',  name: 'Tithe of Conquest',   icon: 'coin',      costs: [100_000, 280_000, 700_000], effects: ['Members earn +5% personal gold', 'Members earn +10% personal gold', 'Members earn +20% personal gold'], desc: 'A portion of conquest spoils flows to every member as a passive income bonus.' },
  { id: 'battle_edge', name: 'War Council',          icon: 'sword',     costs: [120_000, 350_000],         effects: ['+5% combat power for all members', '+12% combat power for all members'], desc: 'Guild war research unlocks tactical doctrine that boosts every member\'s combat power.' },
  { id: 'event_slots', name: 'Grand Campaign',       icon: 'calendar',  costs: [60_000, 180_000],          effects: ['Participate in 1 extra event simultaneously', 'Participate in 2 extra events simultaneously'], desc: 'Unlock additional event participation slots so the guild can pursue more opportunities at once.' },
  { id: 'treasury_int','name': 'Treasury Interest',  icon: 'pigmoney',  costs: [40_000, 120_000, 300_000], effects: ['Treasury earns 1% daily interest', '2% daily interest', '3% daily interest'], desc: 'The guild treasury grows passively — idle gold compounds every day.' },
]

export const GUILD_MILESTONES = [
  { id: 'ms1', name: 'First Steps',       desc: 'Reach Guild Level 5',              goal: 5,       type: 'level',    reward: '10,000 Treasury Gold',      color: '#c9a84c' },
  { id: 'ms2', name: 'Full Ranks',        desc: 'Recruit 15 members',               goal: 15,      type: 'members',  reward: '5,000 Guild XP',             color: '#b070ff' },
  { id: 'ms3', name: 'War Machine',       desc: 'Members win 50 battles combined',  goal: 50,      type: 'battles',  reward: '+10% Combat Perk (7 days)',   color: '#e87848' },
  { id: 'ms4', name: 'Deep Pockets',      desc: 'Treasury reaches 500,000 gold',    goal: 500_000, type: 'treasury', reward: 'Treasury Interest Perk I',    color: '#c9a84c' },
  { id: 'ms5', name: 'Event Veterans',    desc: 'Complete 10 guild events',          goal: 10,      type: 'events',   reward: 'Grand Campaign Perk I',       color: '#6dccaa' },
  { id: 'ms6', name: 'Legendary Guild',   desc: 'Reach Guild Level 10',             goal: 10,      type: 'level',    reward: 'Unique Guild Banner + Title', color: '#ffd700' },
]

export const MOCK_ACTIVITY_FEED = [
  { id: 'af1', type: 'battle_win',  icon: 'sword',    playerName: 'Aldric Ironblood',  msg: 'won a battle against Vael Frostmark',         ts: Date.now() - 25 * 60_000,   xp: 120 },
  { id: 'af2', type: 'deposit',     icon: 'coin',     playerName: 'Cassiel Moonweave', msg: 'deposited 5,000g into the treasury',          ts: Date.now() - 2 * 3600_000,  xp: 50  },
  { id: 'af3', type: 'recruit',     icon: 'sword',    playerName: 'Riven Emberfist',   msg: 'recruited a Death Knight for the army',       ts: Date.now() - 4 * 3600_000,  xp: 30  },
  { id: 'af4', type: 'event_join',  icon: 'calendar', playerName: 'Nyra Coldforge',    msg: 'registered for Realm Siege',                  ts: Date.now() - 6 * 3600_000,  xp: 10  },
  { id: 'af5', type: 'level_up',    icon: 'trophy',   playerName: null,                msg: 'Guild reached Level 4!',                      ts: Date.now() - 8 * 3600_000,  xp: 0   },
  { id: 'af6', type: 'member_join', icon: 'users',    playerName: 'Thorn Shadowmend',  msg: 'joined the guild',                            ts: Date.now() - 24 * 3600_000, xp: 0   },
  { id: 'af7', type: 'build',       icon: 'hammer',   playerName: 'Elara Stormhand',   msg: 'constructed a Dark Armory',                   ts: Date.now() - 36 * 3600_000, xp: 20  },
]

export const MOCK_GUILDS = [
  {
    id: 'mg1', name: 'Iron Vanguard',
    description: 'Elite warriors united under flame and steel. We conquer through superior firepower and unwavering discipline. Ranked #1 in realm power.',
    faction: 'flame', level: 7, xp: 8_400, xpNext: 35_000, members: 22, maxMembers: 25,
    treasury: 182_000, recruitmentStatus: 'invite_only',
    createdAt: Date.now() - 90 * 86400_000, ownerName: 'Kael Ironblood',
  },
  {
    id: 'mg2', name: "Nature's Wrath",
    description: 'Children of the ancient forest. We grow stronger as the land grows. Recruiting active players who prioritize economy over brute force.',
    faction: 'nature', level: 5, xp: 4_200, xpNext: 16_000, members: 15, maxMembers: 25,
    treasury: 95_000, recruitmentStatus: 'open',
    createdAt: Date.now() - 60 * 86400_000, ownerName: 'Sylvara Jadewing',
  },
  {
    id: 'mg3', name: 'Obsidian Pact',
    description: 'Shadow and celestial united. Strategic minds who topple empires through patience and precision. Applications currently closed.',
    faction: 'celestial', level: 9, xp: 11_200, xpNext: 70_000, members: 25, maxMembers: 25,
    treasury: 340_000, recruitmentStatus: 'closed',
    createdAt: Date.now() - 180 * 86400_000, ownerName: 'Cassiel Voidwalker',
  },
  {
    id: 'mg4', name: 'Tidecallers',
    description: 'Masters of the deep. Our tide washes away all opposition. We focus on coordinated raiding and deep-sea treasure accumulation.',
    faction: 'tide', level: 4, xp: 2_800, xpNext: 10_000, members: 11, maxMembers: 25,
    treasury: 62_000, recruitmentStatus: 'open',
    createdAt: Date.now() - 45 * 86400_000, ownerName: 'Wren Deepcurrent',
  },
  {
    id: 'mg5', name: 'Dusk Covenant',
    description: 'The undead never forget, never forgive. We rise from every defeat stronger than before. A guild for serious veteran players only.',
    faction: 'undead', level: 6, xp: 7_100, xpNext: 24_000, members: 19, maxMembers: 25,
    treasury: 128_000, recruitmentStatus: 'invite_only',
    createdAt: Date.now() - 75 * 86400_000, ownerName: 'Dusk Nightfall',
  },
  {
    id: 'mg6', name: 'Blazing Accord',
    description: 'Flame faction veterans forging alliances across the realm. Casual-friendly, all experience levels welcome. No pressure, just progress.',
    faction: 'flame', level: 3, xp: 1_500, xpNext: 6_000, members: 8, maxMembers: 25,
    treasury: 28_000, recruitmentStatus: 'open',
    createdAt: Date.now() - 20 * 86400_000, ownerName: 'Ember Pyrebrand',
  },
  {
    id: 'mg7', name: 'Crimson Tide',
    description: 'Warriors of the deep ocean. Relentless and unstoppable. Top PvP guild dominating the rankings since Season 1.',
    faction: 'tide', level: 8, xp: 9_800, xpNext: 50_000, members: 23, maxMembers: 25,
    treasury: 215_000, recruitmentStatus: 'invite_only',
    createdAt: Date.now() - 120 * 86400_000, ownerName: 'Kira Deepcurrent',
  },
  {
    id: 'mg8', name: 'Starwarden Alliance',
    description: 'Celestial guardians dedicated to protecting the realm from darkness. We prioritize cooperation and collective prosperity over individual glory.',
    faction: 'celestial', level: 5, xp: 5_600, xpNext: 16_000, members: 14, maxMembers: 25,
    treasury: 88_000, recruitmentStatus: 'open',
    createdAt: Date.now() - 55 * 86400_000, ownerName: 'Seraph Stardusk',
  },
]

export const GUILD_EVENTS = [
  {
    id: 'ev1', name: 'Realm Siege',
    description: 'Guild vs guild siege warfare. Capture the ancient citadel and hold it for 48 hours. Coordinate attacks and defense wisely.',
    type: 'siege', status: 'active',
    startDate: Date.now() - 12 * 3600_000,
    endDate: Date.now() + 36 * 3600_000,
    rewards: '5,000 Guild XP · 50,000 Treasury Gold',
    requirement: 'Min. 10 active members',
    participants: 14, maxParticipants: 25, registered: false,
  },
  {
    id: 'ev2', name: 'Mining Expedition',
    description: 'Cooperative resource gathering in the Obsidian Wastes. All participants receive bonus land and gold yields upon return.',
    type: 'expedition', status: 'upcoming',
    startDate: Date.now() + 2 * 86400_000,
    endDate: Date.now() + 5 * 86400_000,
    rewards: '+30% Land Yield · 2,000 Guild XP',
    requirement: 'Open to all members',
    participants: 0, maxParticipants: 25, registered: false,
  },
  {
    id: 'ev3', name: 'Territory Defense',
    description: "Defend your guild's claimed territory from a three-faction assault. Every member's power contributes to the total defense rating.",
    type: 'defense', status: 'upcoming',
    startDate: Date.now() + 5 * 86400_000,
    endDate: Date.now() + 6 * 86400_000,
    rewards: '3,000 Guild XP · Faction Crest Banner',
    requirement: 'Min. 5 members',
    participants: 0, maxParticipants: 25, registered: false,
  },
  {
    id: 'ev4', name: 'Ancient Dragon Hunt',
    description: 'A legendary creature awakened in the northern wastes. Guilds who participated shared in the Dragon Hoard and earned permanent bonuses.',
    type: 'boss', status: 'completed',
    startDate: Date.now() - 10 * 86400_000,
    endDate: Date.now() - 8 * 86400_000,
    rewards: '8,000 Guild XP · Dragon Hoard Loot',
    requirement: 'Min. 15 members',
    participants: 20, maxParticipants: 25, registered: true,
  },
  {
    id: 'ev5', name: 'Faction War',
    description: 'All-out war between the five factions. Your guild secured a dominant position granting 7 days of global territory bonus.',
    type: 'war', status: 'completed',
    startDate: Date.now() - 20 * 86400_000,
    endDate: Date.now() - 13 * 86400_000,
    rewards: '10,000 Guild XP · Global Territory Bonus',
    requirement: 'All members',
    participants: 18, maxParticipants: 25, registered: true,
  },
]

export const SEED_INVITES = [
  {
    id: 'inv_1',
    guildId: 'mg3', guildName: 'Obsidian Pact', guildFaction: 'celestial',
    guildLevel: 9, guildMembers: 24, guildMaxMembers: 25,
    invitedBy: 'Vael Moonweave',
    sentAt: Date.now() - 2 * 86400_000,
    expiresAt: Date.now() + 5 * 86400_000,
  },
  {
    id: 'inv_2',
    guildId: 'mg7', guildName: 'Crimson Tide', guildFaction: 'tide',
    guildLevel: 8, guildMembers: 22, guildMaxMembers: 25,
    invitedBy: 'Kira Deepcurrent',
    sentAt: Date.now() - 86400_000,
    expiresAt: Date.now() + 6 * 86400_000,
  },
]

const _MOCK_MEMBERS = [
  { id: 'gm1', name: 'Aldric Ironblood',  role: 'officer', daysAgo: 30, activeHoursAgo: 1,  power: 8400, xpContrib: 4200, goldContrib: 18000, battlesWon: 23 },
  { id: 'gm2', name: 'Cassiel Moonweave', role: 'officer', daysAgo: 28, activeHoursAgo: 3,  power: 7200, xpContrib: 3800, goldContrib: 12000, battlesWon: 19 },
  { id: 'gm3', name: 'Riven Emberfist',   role: 'member',  daysAgo: 21, activeHoursAgo: 6,  power: 5100, xpContrib: 2100, goldContrib:  5000, battlesWon: 11 },
  { id: 'gm4', name: 'Nyra Coldforge',    role: 'member',  daysAgo: 18, activeHoursAgo: 12, power: 3800, xpContrib: 1650, goldContrib:  3200, battlesWon:  8 },
  { id: 'gm5', name: 'Thorn Shadowmend',  role: 'member',  daysAgo: 15, activeHoursAgo: 24, power: 2200, xpContrib:  900, goldContrib:  1000, battlesWon:  4 },
  { id: 'gm6', name: 'Elara Stormhand',   role: 'member',  daysAgo: 10, activeHoursAgo: 36, power: 1400, xpContrib:  420, goldContrib:   500, battlesWon:  2 },
  { id: 'gm7', name: 'Vael Frostmark',    role: 'member',  daysAgo: 7,  activeHoursAgo: 48, power:  800, xpContrib:  180, goldContrib:     0, battlesWon:  1 },
]

export function makeInitialMembers(faction) {
  return _MOCK_MEMBERS.map(m => ({
    id: m.id, name: m.name, faction, role: m.role,
    joinedAt: Date.now() - m.daysAgo * 86400_000,
    lastActive: Date.now() - m.activeHoursAgo * 3600_000,
    power: m.power, xpContrib: m.xpContrib, goldContrib: m.goldContrib, battlesWon: m.battlesWon,
  }))
}

export function makeInitialChat() {
  return [
    { id: 'cm0', playerId: 'system', playerName: 'System', message: 'Guild founded. Welcome, champions.', ts: '—', tsMs: Date.now() - 30 * 86400_000, system: true },
    { id: 'cm1', playerId: 'gm1', playerName: 'Aldric Ironblood', faction: null, message: "Finally! Let's build something great together.", ts: '12:03 PM', tsMs: Date.now() - 29 * 86400_000, system: false },
    { id: 'cm2', playerId: 'gm2', playerName: 'Cassiel Moonweave', faction: null, message: "I've been waiting for this. Ready to conquer.", ts: '12:15 PM', tsMs: Date.now() - 29 * 86400_000, system: false },
    { id: 'cm3', playerId: 'gm4', playerName: 'Nyra Coldforge', faction: null, message: "When's our first guild event?", ts: '03:44 PM', tsMs: Date.now() - 3 * 86400_000, system: false },
    { id: 'cm4', playerId: 'gm1', playerName: 'Aldric Ironblood', faction: null, message: 'Realm Siege is live. Everyone register before it fills up!', ts: '04:20 PM', tsMs: Date.now() - 2 * 86400_000, system: false },
    { id: 'cm5', playerId: 'gm3', playerName: 'Riven Emberfist', faction: null, message: "I'm in. What time does it kick off?", ts: '04:35 PM', tsMs: Date.now() - 2 * 86400_000, system: false },
  ]
}

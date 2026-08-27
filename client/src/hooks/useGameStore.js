import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api.js'
import { FACTIONS } from '../data/factions.js'
import { generateAuction, AUCTION_REFRESH_MS, AUCTION_POOL, CONSUMABLE_POOL, ARTIFACT_POOL } from '../data/items.js'
import { generateMercListings, MERC_REFRESH_INTERVAL_MS, calcMercRefreshCost } from '../data/mercs.js'
import { MOCK_GUILDS, SEED_INVITES, GUILD_CREATION_COST, GUILD_PERKS, MOCK_ACTIVITY_FEED, makeInitialMembers, makeInitialChat } from '../data/guilds.js'

// Mock AI players for rankings/battle table
const _FIRST = ['Aeron','Aldric','Azura','Bastian','Caelum','Daenar','Elowen','Faeron','Galeth','Hadric','Ivar','Jareth','Kael','Laric','Malveth','Narek','Orin','Petra','Riven','Seraph','Thorn','Vael','Wren','Zira']
const _LAST  = ['Ironblood','Moonweave','Deepcurrent','Starwatcher','Ashveil','Brightmantle','Coldforge','Emberfist','Frostmark','Galeborn','Ironveil','Jadewing','Kindlecrest','Nightfall','Pyrebrand','Shadowmend','Tidecaller']
const _FACS  = ['flame','nature','tide','celestial','undead']
function _rng(seed) { let s=seed; return ()=>{ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff } }
const MOCK_PLAYERS = Array.from({length:500},(_,i)=>{
  const r=_rng(i*7919+31337)
  const faction=_FACS[Math.floor(r()*_FACS.length)]
  const tier=r()
  const power=tier<0.6?Math.floor(100+r()*2900):tier<0.9?Math.floor(3000+r()*12000):Math.floor(15000+r()*35000)
  return {_id:`mp${i}`,name:`${_FIRST[Math.floor(r()*_FIRST.length)]} ${_LAST[Math.floor(r()*_LAST.length)]}`,faction,power,isMock:true}
})

// Real players come back from the server with a SQL `id`, but the mock
// leaderboard filler (and every rankings/battle comparison in Game.jsx)
// keys off `_id` — normalize once here so the rest of the app never has
// to care which kind of player object it's looking at.
function normalizePlayer(p) {
  return p ? { ...p, _id: p.id ?? p._id } : p
}

// The server only stores {item_id, qty} plus a couple of denormalized
// display fields per owned item — it's deliberately NOT the source of
// truth for names/art/effects (see server/itemData.js). Merge each row
// back onto the full definition here, once, so every screen that reads
// gs.items (inventory, battle item picker, auction "already owned"
// check) can keep using item.artType/effect/passive/etc. as if the
// server had sent all of it.
const ITEM_CATALOG_BY_ID = Object.fromEntries(
  [...AUCTION_POOL, ...CONSUMABLE_POOL, ...ARTIFACT_POOL].map(i => [i.id, i])
)
function normalizeOwnedItem(row) {
  const def = ITEM_CATALOG_BY_ID[row.item_id]
  if (!def) {
    // Unknown/legacy row (item removed from the catalog, or predates the
    // item_id column) — fall back to whatever the row itself carries
    // rather than dropping it silently.
    return { id: row.item_id || `row${row.id}`, name: row.item_name || 'Unknown Item', rarity: row.item_rarity || 'Common', qty: row.qty || 1, rowId: row.id }
  }
  const itemCategory = def.effect ? 'consumable' : def.transferChance !== undefined ? 'artifact' : 'passive'
  return { ...def, itemCategory, qty: row.qty || 1, rowId: row.id, acquiredAt: row.acquired_at }
}

// The server only stores {unit_id, merc_faction, quantity} for a hired
// mercenary — the same "server sends the minimal authoritative row,
// client merges in its own richer local catalog" pattern as items above.
// A merc's unit definition lives in its ORIGIN faction's roster (it was
// hired from a foreign faction), not the player's own.
function normalizeMerc(row) {
  const mercFaction = FACTIONS[row.factionId]
  const uDef = mercFaction?.units?.find(u => u.id === row.unitId)
  if (!uDef) return { id: row.unitId, unitId: row.unitId, factionId: row.factionId, name: row.unitId, quantity: row.quantity || 0 }
  return { ...uDef, id: row.unitId, unitId: row.unitId, factionId: row.factionId, factionName: mercFaction.name, factionColor: mercFaction.color, quantity: row.quantity || 0 }
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      player: null, gameState: null, error: null,
      guild: null, guildInvites: SEED_INVITES,
      mercListings: [], mercRefreshAt: 0,

      login: async (email, password) => {
        const res = await api.login(email, password)
        set({ player: normalizePlayer(res.player || res) })
        await get().fetchGameState()
        return res
      },
      register: async (name, email, password) => {
        const res = await api.register(name, email, password)
        set({ player: normalizePlayer(res.player || res) })
        return res
      },
      logout: async () => { await api.logout().catch(()=>{}); set({ player: null, gameState: null }) },
      fetchPlayer: async () => {
        try { const res=await api.me(); if(res.ok) set({player:normalizePlayer(res.player||res)}); return res } catch { return {ok:false} }
      },
      setFaction: async (faction) => {
        const res = await api.setFaction(faction)
        set(s=>({player:{...s.player,faction}}))
        await get().fetchGameState()
        return res
      },

      fetchGameState: async () => {
        try {
          const data = await api.state()
          const player = get().player
          const f = player?.faction ? FACTIONS[player.faction] : null
          let auctionItems = data.auctionItems || []
          let auctionRefreshAt = data.auctionRefreshAt || 0
          if (auctionItems.length === 0 && f) {
            auctionItems = generateAuction(player.faction)
            auctionRefreshAt = Date.now() + AUCTION_REFRESH_MS
          }
          const items = (data.items || []).map(normalizeOwnedItem)
          const mercs = (data.mercs || []).map(normalizeMerc)
          set({ gameState: { ...data, items, mercs, auctionItems, auctionRefreshAt, log: data.log || get().gameState?.log || [], streak: data.streak || {days:0,chains:0,shield:false,lastDate:null} } })
        } catch(e) { console.error('fetchGameState failed:', e) }
      },

      explore:  async (type)   => { const r=await api.explore(type); await get().fetchGameState(); return r },
      build:    async (id)     => { const r=await api.build(id); await get().fetchGameState(); return r },
      recruit:  async (id)     => { const r=await api.recruit(id,5); await get().fetchGameState(); return r },
      battle:   async (tid,u,item) => { const r=await api.battle(tid,u,item); await get().fetchGameState(); return r },
      buyAuctionItem: async (id) => { const r=await api.buyItem(id); await get().fetchGameState(); return r },

      refreshAuction: async (paid) => {
        if (paid) { try { await api.refreshAuction(true) } catch {} }
        const player = get().player
        if (!player?.faction) return {success:false,message:'No faction'}
        const items = generateAuction(player.faction)
        set(s=>({gameState:{...s.gameState,auctionItems:items,auctionRefreshAt:Date.now()+AUCTION_REFRESH_MS}}))
        return {success:true}
      },

      fetchRankings: async () => {
        try {
          const res = await api.rankings()
          // api.rankings() resolves the whole {ok, rankings, myId} envelope —
          // the player rows live under res.rankings, not on the envelope itself.
          const real = (res.rankings || []).map(p => ({ ...p, _id: p.id }))
          // The server now seeds a baseline of real (attackable) AI-run
          // accounts alongside genuine signups, so the rankings list is
          // always populated without needing client-side filler on top —
          // MOCK_PLAYERS is kept only as an offline/network-failure fallback
          // below, not merged into a normal successful response.
          return real
        } catch { return MOCK_PLAYERS }
      },

      // Dedicated battle-matchmaking feed (opponents closest to our own
      // power) — see server/routes/game.js '/targets'. Unlike fetchRankings,
      // this is never empty just because our rank falls outside a capped
      // leaderboard slice, so the Battle tab uses this instead of deriving
      // opponents from the rankings list.
      fetchTargets: async () => {
        try {
          const res = await api.targets()
          return (res.targets || []).map(p => ({ ...p, _id: p.id }))
        } catch { return [] }
      },

      addLog: (entry) => {
        const ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
        set(s=>({gameState:{...s.gameState,log:[...(s.gameState?.log||[]),{...entry,ts,tsMs:Date.now()}].slice(-50)}}))
      },
      clearLog: () => set(s=>({gameState:{...s.gameState,log:[]}})),

      // Streak day/continuity is already advanced server-side at login; this just
      // credits today's reward once and re-pulls state so gold/mana/land/turns/streak
      // all reflect the server's numbers (source of truth), not a client guess.
      claimStreakReward: async () => {
        try {
          const r = await api.claimStreak()
          await get().fetchGameState()
          return { success: true, reward: r.reward }
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      initMercListings: () => {
        const p=get().player; if(!p?.faction) return
        set({mercListings:generateMercListings(p.faction),mercRefreshAt:Date.now()+MERC_REFRESH_INTERVAL_MS})
      },
      refreshMercListings: () => {
        const p=get().player; const gs=get().gameState; const cost=calcMercRefreshCost(gs?.goldPerTurn||50)
        if(!p?.faction||(gs?.gold||0)<cost) return {success:false,message:`Need ${cost}g`}
        set(s=>({mercListings:generateMercListings(p.faction),mercRefreshAt:Date.now()+MERC_REFRESH_INTERVAL_MS,gameState:{...s.gameState,gold:(s.gameState?.gold||0)-cost}}))
        return {success:true,cost}
      },
      // Used to just mutate local gameState directly and never told the
      // server anything -- so a hired merc looked like it joined your
      // army for a moment, then silently vanished the next time
      // fetchGameState() ran for ANY reason (it fully replaces gameState
      // with the server's response, which had never heard of the hire).
      // Now goes through a real endpoint that persists it.
      hireMerc: async (id) => {
        const l = get().mercListings.find(x => x.id === id)
        const gs = get().gameState
        if (!l) return { success: false, message: 'Not found' }
        if ((gs?.gold || 0) < l.totalCost) return { success: false, message: 'Not enough gold' }
        try {
          const r = await api.hireMerc(l.unitId, l.factionId, l.qty, l.costPerUnit)
          set(s => ({ mercListings: s.mercListings.map(x => x.id === id ? { ...x, hired: true } : x) }))
          await get().fetchGameState()
          return { success: true, reward: r }
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      // Guild (mock)
      createGuild: (name, desc) => {
        const gs=get().gameState; const p=get().player
        if((gs?.gold||0)<GUILD_CREATION_COST) return {success:false,message:'Not enough gold'}
        const g={id:'g_mine',name:name.trim(),description:desc,ownerId:'me',ownerName:p?.name||'You',level:1,xp:0,xpNext:1000,members:makeInitialMembers(p),chat:makeInitialChat(),treasury:0,treasuryTxns:[],purchasedPerks:{},activityFeed:MOCK_ACTIVITY_FEED,recruitmentStatus:'open',guidelines:'',pinnedAnnouncement:'',createdAt:Date.now()}
        set(s=>({guild:g,gameState:{...s.gameState,gold:(s.gameState?.gold||0)-GUILD_CREATION_COST}}))
        return {success:true}
      },
      searchGuilds: (q) => !q?.trim()?MOCK_GUILDS:MOCK_GUILDS.filter(g=>g.name.toLowerCase().includes(q.toLowerCase())||g.faction.toLowerCase().includes(q.toLowerCase())),
      acceptInvite: (id) => {
        const inv=get().guildInvites.find(i=>i.id===id); const p=get().player
        if(!inv) return
        const mg=MOCK_GUILDS.find(g=>g.id===inv.guildId)||MOCK_GUILDS[0]
        set(s=>({guild:{...mg,members:makeInitialMembers(p),chat:makeInitialChat(),purchasedPerks:{},activityFeed:MOCK_ACTIVITY_FEED,treasuryTxns:[]},guildInvites:s.guildInvites.filter(i=>i.id!==id)}))
      },
      declineInvite: (id) => set(s=>({guildInvites:s.guildInvites.filter(i=>i.id!==id)})),
      leaveGuild: () => set({guild:null}),
      disbandGuild: () => set({guild:null}),
      sendGuildChat: (msg) => {
        if(!msg?.trim()) return; const p=get().player
        const m={id:Date.now(),playerId:'me',playerName:p?.name||'You',faction:p?.faction,message:msg,ts:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),system:false}
        set(s=>({guild:s.guild?{...s.guild,chat:[...s.guild.chat,m]}:null}))
      },
      depositTreasury: (amount) => {
        const n=parseInt(amount); const gs=get().gameState
        if(!n||n<=0) return {success:false,message:'Invalid amount'}
        if((gs?.gold||0)<n) return {success:false,message:'Not enough gold'}
        const tx={id:Date.now(),playerName:get().player?.name||'You',amount:n,ts:new Date().toLocaleTimeString()}
        set(s=>({guild:s.guild?{...s.guild,treasury:s.guild.treasury+n,treasuryTxns:[tx,...s.guild.treasuryTxns]}:null,gameState:{...s.gameState,gold:(s.gameState?.gold||0)-n}}))
        return {success:true}
      },
      purchaseGuildPerk: (perkId) => {
        const guild=get().guild; const perk=GUILD_PERKS.find(p=>p.id===perkId)
        if(!guild||!perk) return {success:false,message:'Not found'}
        const lvl=guild.purchasedPerks?.[perkId]||0; const cost=perk.costs[lvl]
        if(!cost||guild.treasury<cost) return {success:false,message:'Not enough treasury gold'}
        set(s=>({guild:s.guild?{...s.guild,treasury:s.guild.treasury-cost,purchasedPerks:{...s.guild.purchasedPerks,[perkId]:lvl+1}}:null}))
        return {success:true}
      },
      promoteMember: (id) => set(s=>({guild:s.guild?{...s.guild,members:s.guild.members.map(m=>m.id===id?{...m,role:'officer'}:m)}:null})),
      demoteMember:  (id) => set(s=>({guild:s.guild?{...s.guild,members:s.guild.members.map(m=>m.id===id?{...m,role:'member'}:m)}:null})),
      kickMember:    (id) => set(s=>({guild:s.guild?{...s.guild,members:s.guild.members.filter(m=>m.id!==id)}:null})),
      transferOwnership: (id) => set(s=>({guild:s.guild?{...s.guild,ownerId:id,members:s.guild.members.map(m=>m.id===id?{...m,role:'owner'}:m.id==='me'?{...m,role:'member'}:m)}:null})),
      setPinnedAnnouncement: (t) => set(s=>({guild:s.guild?{...s.guild,pinnedAnnouncement:t}:null})),
      setGuildGuidelines: (t) => set(s=>({guild:s.guild?{...s.guild,guidelines:t}:null})),
      updateGuildSettings: ({name,description,recruitmentStatus}) => {
        if(!name?.trim()) return {success:false,message:'Name required'}
        set(s=>({guild:s.guild?{...s.guild,name:name.trim(),description,recruitmentStatus}:null}))
        return {success:true}
      },
      invitePlayer: (q) => !q?.trim()?[]:MOCK_PLAYERS.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())).slice(0,5),
      devRefillTurns: () => set(s=>({gameState:{...s.gameState,turns:200}})),
    }),
    { name:'rog-store', partialize:(s)=>({player:s.player}) }
  )
)

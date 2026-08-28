import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../hooks/useGameStore.js'
import { FACTIONS, scaledStats } from '../data/factions.js'
import { RARITY_COLOR, AUCTION_RESTOCK_COST, AUCTION_REFRESH_MS } from '../data/items.js'
import { calcMercRefreshCost } from '../data/mercs.js'
import { FactionImage, UnitPortrait, ResourceBuildingImg, ItemArt } from '../components/Portrait.jsx'
import { AnimatedIcon, AnimBtn } from '../components/AnimatedIcon.jsx'
import { WelcomeModal, OnboardingTour, DailyRewardModal } from '../components/WelcomeFlow.jsx'
import { generateStreakReward, getTodayDate } from '../data/streak.js'
import { useAnimatedClick } from '../hooks/useAnimatedClick.js'
import {
  IconHome, IconReportMoney, IconMapSearch, IconBuildingCastle,
  IconSword, IconShieldBolt, IconGavel, IconTrophy, IconBook,
  IconCoin, IconSparkles, IconMap, IconClock, IconBolt,
  IconBuildingFortress, IconAlertTriangle, IconCompass,
  IconWorld, IconTrendingDown,
  IconPlus, IconHammer, IconArrowUp, IconShield, IconSettings,
  IconLeaf, IconDroplet, IconFlame, IconStar, IconSkull,
  IconChevronDown, IconChevronUp, IconInfoCircle, IconSwords, IconCheck,
  IconUsers, IconUserPlus, IconMessageCircle, IconCalendarEvent,
  IconPigMoney, IconChevronLeft, IconChevronRight, IconSend, IconSearch, IconCrown, IconX,
  IconGift, IconTruck, IconBackpack, IconTrash, IconLogout,
} from '@tabler/icons-react'
import { GUILD_CREATION_COST, GUILD_MAX_MEMBERS, MOCK_GUILDS, GUILD_EVENTS, GUILD_PERKS, GUILD_MILESTONES } from '../data/guilds.js'
import s from './Game.module.css'

// Tabler icon fallback map for building icons
const ICON_MAP = {
  'ti-skull': IconSkull, 'ti-leaf': IconLeaf, 'ti-droplet': IconDroplet,
  'ti-flame': IconFlame, 'ti-star': IconStar, 'ti-sword': IconSword,
  'ti-shield': IconShield, 'ti-building': IconBuildingFortress,
  'ti-coin': IconCoin, 'ti-sparkles': IconSparkles, 'ti-map': IconMap,
  'ti-target': IconCompass, 'ti-paw': IconLeaf, 'ti-eye-off': IconSettings,
  'ti-shield-check': IconShieldBolt, 'ti-ghost': IconSkull, 'ti-shield-bolt': IconShieldBolt,
}
const FI = ({ name, size = 16, color }) => {
  const I = ICON_MAP[name] || IconStar
  return <I size={size} color={color} />
}

const TIER_LABEL = ['', 'T1 Common', 'T2 Uncommon', 'T3 Rare', 'T4 Epic', 'T5 Legendary']
const loresResLen = fdata => fdata.buildings.filter(b => b.category === 'resource').length

const ROLE_COLOR = {
  warrior: '#8899bb', tank: '#6699cc', striker: '#cc7755',
  skirmisher: '#88cc66', mage: '#aa77dd', bruiser: '#bb8844',
}
const TYPE_LABEL = {
  undead:'Undead', beast:'Beast', fey:'Fey', humanoid:'Humanoid',
  elemental:'Elemental', aberration:'Aberration', celestial:'Celestial',
  monstrosity:'Monstrosity', plant:'Plant', dragon:'Dragon', giant:'Giant',
}

function calcEconomy(gs, faction) {
  if (!faction || !gs) return { goldGen:0, manaGen:0, goldUpkeep:0, manaUpkeep:0, goldNet:0, manaNet:0, landGold:0, landMana:0, bldGold:0, bldMana:0, usedLand:0, freeLand:0 }
  const f = FACTIONS[faction]
  const land = gs.land || 0
  const landGold = land * 1.5
  const landMana  = land * 0.8
  let bldGold = 0, bldMana = 0, usedLand = 0
  f.buildings.forEach(b => {
    const count = gs.buildings?.[b.id] || 0
    if (!count) return
    usedLand += b.stackable ? count * (b.landCost || 0) : (b.landCost || 0)
    if (b.goldPerBld) bldGold += count * b.goldPerBld
    if (b.manaPerBld) bldMana += count * b.manaPerBld
    if (b.goldRate?.[1] > 0) bldGold += land * (b.goldRate[0] + b.goldRate[1]) / 2
    if (b.manaRate?.[1] > 0) bldMana += land * (b.manaRate[0] + b.manaRate[1]) / 2
  })
  const freeLand = Math.max(0, land - usedLand)
  let itemGoldPct = 0, itemManaPct = 0
  ;(gs.items || []).forEach(item => {
    if (item.passive?.goldPct) itemGoldPct += item.passive.goldPct
    if (item.passive?.manaPct) itemManaPct += item.passive.manaPct
  })
  const goldGen = Math.round((landGold + bldGold) * (1 + f.goldBonus) * (1 + itemGoldPct))
  const manaGen  = Math.round((landMana + bldMana)  * (1 + f.manaBonus) * (1 + itemManaPct))
  let gUp = 0, mUp = 0
  f.units.forEach(u => {
    const cnt = gs.army?.[u.id] || 0
    gUp += cnt * u.goldUpkeep
    mUp += cnt * u.manaUpkeep
  })
  gUp = Math.round(gUp); mUp = Math.round(mUp)
  return { goldGen, manaGen, goldUpkeep: gUp, manaUpkeep: mUp, goldNet: goldGen-gUp, manaNet: manaGen-mUp, landGold: Math.round(landGold), landMana: Math.round(landMana), bldGold: Math.round(bldGold), bldMana: Math.round(bldMana), usedLand, freeLand }
}

const STACK_MULTIPLIER = 1.5
function scaledCost(baseCost, n) {
  return Math.round(baseCost * Math.pow(STACK_MULTIPLIER, n))
}

// Unit-only combat power — excludes land & buildings so win% reflects soldiers sent
function calcCombatPower(faction, gs, unitSelection = null) {
  const f = FACTIONS[faction]
  if (!f || !gs) return 0
  const items = gs.items || []
  const passives = items.reduce((acc, it) => {
    if (!it.passive) return acc
    if (it.passive.atkPct)    acc.atkPct    = (acc.atkPct    || 0) + it.passive.atkPct
    if (it.passive.powerPct)  acc.powerPct  = (acc.powerPct  || 0) + it.passive.powerPct
    if (it.passive.powerMult) acc.powerMult = (acc.powerMult || 1) * it.passive.powerMult
    return acc
  }, {})
  const atkMult   = 1 + (passives.atkPct   || 0)
  const powerPct  = 1 + (passives.powerPct  || 0)
  const powerMult = passives.powerMult || 1
  let p = 0
  f.units.forEach(u => {
    const qty = unitSelection ? (unitSelection[u.id] || 0) : (gs.army?.[u.id] || 0)
    if (!qty) return
    const bldLvl = gs.buildings?.[`${u.id}_hall`] || 0
    const ss = scaledStats(u, bldLvl)
    p += qty * Math.round(ss.power * atkMult)
  })
  return Math.round(p * powerPct * powerMult)
}

export default function Game() {
  const { player, gameState, fetchGameState, explore, build, recruit, battle, buyAuctionItem, refreshAuction, fetchRankings, fetchTargets, logout, devRefillTurns, devResetAccount, addLog, clearLog, guild, guildInvites, createGuild, searchGuilds, acceptInvite, declineInvite, leaveGuild, disbandGuild, sendGuildChat, depositTreasury, promoteMember, demoteMember, kickMember, transferOwnership, updateGuildSettings, invitePlayer, claimStreakReward, purchaseGuildPerk, setPinnedAnnouncement, setGuildGuidelines, mercListings, mercRefreshAt, initMercListings, refreshMercListings, hireMerc } = useGameStore()
  const nav = useNavigate()
  const [panel, setPanel]         = useState('overview')
  const [rankings, setRankings]   = useState([])
  const [targets, setTargets]     = useState([])
  const [targetsLoaded, setTargetsLoaded] = useState(false)
  const [rkPage, setRkPage]       = useState(0)
  const [rkPageSize, setRkPageSize] = useState(50)
  const [btPage, setBtPage]       = useState(0)
  const [btPageSize, setBtPageSize] = useState(50)
  const btScrollRef = useRef(null)
  const btMyRowRef  = useRef(null)
  const [loading, setLoading]     = useState(false)
  const [now, setNow]             = useState(() => Date.now())
  const [exploreResult, setExploreResult] = useState(null)
  const [auctionTick, setAuctionTick]     = useState(0)
  const [toasts, setToasts]       = useState([])
  const [rpArmyOpen, setRpArmyOpen]   = useState(true)
  const [rpItemsOpen, setRpItemsOpen] = useState(true)
  const [ovEcoOpen, setOvEcoOpen]     = useState(true)
  const [battleConfig, setBattleConfig] = useState(null)  // { targetId } when modal open
  const [bcUnits, setBcUnits]     = useState({})   // { [unitId]: qty }
  const [bcItem, setBcItem]       = useState('')   // itemId of selected consumable/artifact
  const [bcItemOpen, setBcItemOpen] = useState(false)
  const [bcStep, setBcStep]         = useState(1)  // 1 = units, 2 = item
  const logRef      = useRef(null)
  const rkScrollRef = useRef(null)
  const myRowRef    = useRef(null)
  const [showStreak, setShowStreak]           = useState(false)
  const [streakRewardData, setStreakRewardData] = useState(null)
  const [streakBroke, setStreakBroke]         = useState(false)
  const [shieldUsed, setShieldUsed]           = useState(false)
  const streakTriggeredRef                    = useRef(false)
  const [loreFaction, setLoreFaction]         = useState(null)

  const showToast = useCallback((msg, sub, type = 'res', thumb = null) => {
    const id = Date.now() + Math.random()
    setToasts(t => {
      const next = [...t, { id, msg, sub, type, thumb, exiting: false }]
      return next.length > 4 ? next.slice(next.length - 4) : next
    })
    setTimeout(() => dismissToast(id), 2500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x))
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 380)
  }, [])

  const gs      = gameState
  const faction = player?.faction
  const f       = faction ? FACTIONS[faction] : null
  const log     = gs?.log || []

  useEffect(() => { fetchGameState() }, [])
  useEffect(() => { if (faction && !loreFaction) setLoreFaction(faction) }, [faction])
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [log])

  // Builds the reward-modal data for a given streak snapshot and opens it.
  // Shared by the automatic once-a-day popup below and the "Day N" badge's
  // click handler, so clicking the badge reopens the exact same view --
  // already-claimed included, in which case the modal just shows what was
  // claimed rather than offering to claim again (see alreadyClaimed prop).
  const openStreakModal = useCallback((streak) => {
    if (!streak) return
    const rewardData = generateStreakReward(streak.days, streak.chains)
    setStreakBroke(!!streak.justBroke)
    setShieldUsed(!!streak.justUsedShield)
    setStreakRewardData({ ...rewardData, _newDays: streak.days, _newChains: streak.chains, _usedShield: !!streak.justUsedShield })
    setShowStreak(true)
  }, [])

  // Streak trigger: the server advances the login-streak day count at login/session-
  // restore (see server/routes/auth.js touchLoginStreak) and reports it via gs.streak.
  // Show the reward modal once per session whenever today's reward hasn't been claimed yet.
  useEffect(() => {
    if (!gs?.streak || streakTriggeredRef.current) return
    const today = getTodayDate()
    const streak = gs.streak
    if (streak.lastDate !== today || streak.claimedToday) return
    streakTriggeredRef.current = true
    openStreakModal(streak)
  }, [gs?.streak?.lastDate, gs?.streak?.claimedToday])
  // The "+1 in M:S" ticker used to just count up from whenever the page
  // happened to load, completely disconnected from the server's actual
  // schedule (turns: server/jobs.js '*/2 * * * *', a fixed wall-clock
  // cron -- not "2 minutes after this tab opened"). It also never told
  // the game to check for new turns, so even when the countdown hit
  // zero, the displayed turn count just sat there until some other
  // action happened to refetch state. Reading straight off Date.now()
  // makes the countdown itself accurate, and a lightweight poll keeps
  // turns/gold/mana in sync automatically instead of only after the
  // player's next explore/build/recruit action.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const id = setInterval(() => { fetchGameState() }, 20000)
    return () => clearInterval(id)
  }, [])

  const eco     = calcEconomy(gs, faction)
  const turns   = gs?.turns ?? 0
  const gold    = gs?.gold  ?? 0
  const mana    = gs?.mana  ?? 0
  const power   = gs?.power ?? 0
  const land    = gs?.land  ?? 0
  const totalArmy = gs?.army ? Object.values(gs.army).reduce((a, b) => a + b, 0) : 0
  const totalBld  = gs?.buildings ? Object.values(gs.buildings).reduce((a, b) => a + (b || 0), 0) : 0

  // Turns land on even minutes server-side, wall-clock, regardless of
  // when this tab was opened -- so derive the countdown the same way
  // instead of from a page-load-relative counter.
  const nowSec  = Math.floor(now / 1000)
  const secLeft = (120 - (nowSec % 120)) % 120
  const mLeft   = Math.floor(secLeft / 60)
  const sLeft   = String(secLeft % 60).padStart(2, '0')

  const navItems = [
    { id: 'overview',  label: 'Overview',      Icon: IconHome },
    { id: 'explore',   label: 'Explore',        Icon: IconMapSearch },
    { id: 'build',     label: 'Build',          Icon: IconBuildingCastle },
    { id: 'recruit',   label: 'Recruit',        Icon: IconSword },
    { id: 'battle',    label: 'Battle',         Icon: IconShieldBolt },
    { id: 'mercs',     label: 'Merc Hall',      Icon: IconSwords },
    { id: 'auction',   label: 'Auction House',  Icon: IconGavel },
    { id: 'rankings',  label: 'Rankings',       Icon: IconTrophy },
    { id: 'lore',      label: 'Faction Lore',   Icon: IconBook },
  ]

  // ── Actions ──────────────────────────────────────────────────────────────
  // type is an explicit explore-tier key ('scout'..'conquest' for
  // Territory, 'peddler'..'caravan' for Fortune) -- label is only for the
  // toast/log copy, since several tiers now share a turn cost and can't be
  // told apart by cost alone.
  const doExplore = async (type, label) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await explore(type)
      setExploreResult(res)
      const bonusParts = []
      if (res.goldBonus) bonusParts.push(`+${res.goldBonus}g`)
      if (res.manaBonus > 0) bonusParts.push(`+${res.manaBonus}m`)
      if (res.foundItem) bonusParts.push(`found ${res.foundItem.name}!`)
      const sub = bonusParts.join(' · ') || 'Nothing found this time'
      // Fortune runs trade for coin, not territory — "0 acres claimed"
      // would read as a failure, so give resource-only runs their own
      // headline instead of always talking about acres.
      const headline = res.acres > 0 ? `Claimed ${res.acres} acres` : res.foundItem ? `${label} struck it lucky!` : `${label} returned safely`
      addLog({ cls: 'res', icon: 'explore', msg: headline, subtext: sub })
      showToast(headline, sub, 'explore',
        <div style={{width:'100%',height:'100%',background:'rgba(109,204,170,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><IconMap size={18} color="var(--green)"/></div>
      )
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Explore failed.' })
      showToast('Exploration failed', e.message, 'err')
    }
    setLoading(false)
  }

  const doBuild = async (buildingId) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await build(buildingId)
      const bDef = f?.buildings.find(b => b.id === buildingId)
      // The server only ever returns a level (buildings have no separate
      // "quantity" — level 1 is the first build, level 2+ is an upgrade),
      // so use that as the source of truth instead of a made-up qty field.
      const name = res.buildingName || bDef?.name || 'Building'
      const isFirstBuild = res.level === 1
      if (bDef?.stackable) {
        const isGold = !!bDef?.goldPerBld
        const bThumb = <ResourceBuildingImg isGold={isGold} accent={isGold ? '#c9a84c' : '#a89cf0'} size={36}/>
        const genRate = (isGold ? (bDef.goldPerBld || 0) : (bDef.manaPerBld || 0)) * res.level
        const genLabel = `+${genRate}${isGold ? 'g' : 'm'}/turn at Lv.${res.level}`
        addLog({ cls: 'res', icon: 'build', msg: `${isFirstBuild ? 'Built' : 'Upgraded'} ${name} (Lv.${res.level})`, subtext: genLabel })
        showToast(`${name} ${isFirstBuild ? 'constructed' : 'upgraded'}`, genLabel, 'build', bThumb)
      } else {
        const trainedUnit = bDef?.unitId ? f.units.find(u => u.id === bDef.unitId) : null
        const bThumb = trainedUnit
          ? <UnitPortrait unitId={trainedUnit.id} artType={trainedUnit.artType} factionColor={f.color} size={36}/>
          : null
        const sub = isFirstBuild
          ? `${trainedUnit?.name || 'Unit'} recruitment unlocked`
          : `Now at Level ${res.level} — unit stats increased`
        addLog({ cls: 'res', icon: 'build', msg: `${isFirstBuild ? 'Constructed' : 'Upgraded'} ${name} (Lv.${res.level})`, subtext: sub })
        showToast(`${name} ${isFirstBuild ? 'constructed' : 'upgraded'}`, sub, 'build', bThumb)
      }
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: e.message || 'Build failed.' })
      showToast('Construction failed', e.message, 'err')
    }
    setLoading(false)
  }

  const doRecruit = async (unitId) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await recruit(unitId)
      const uDef = f?.units.find(u => u.id === unitId)
      const rThumb = uDef ? <UnitPortrait unitId={uDef.id} artType={uDef.artType} factionColor={f.color} size={36}/> : null
      const qty = res.quantity
      const name = res.unitName || uDef?.name || 'Unit'
      addLog({ cls: 'res', icon: 'recruit', msg: `Recruited ${qty}× ${name}`, subtext: `New recruits joined your army` })
      showToast(`${qty}× ${name} recruited`, `Ranks strengthened`, 'recruit', rThumb)
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Recruit failed.' })
      showToast('Recruitment failed', e.message, 'err')
    }
    setLoading(false)
  }

  const doHireMerc = async (listing) => {
    if (loading) return
    setLoading(true)
    try {
      const r = await hireMerc(listing.id)
      if (r.success) {
        addLog({ cls: 'res', icon: 'recruit', msg: `Hired ${listing.qty}× ${listing.unitName}`, subtext: `Mercenary contract signed with the ${listing.factionName}` })
        showToast('Hired!', `${listing.qty}× ${listing.unitName} joins your army`, 'res', <FactionImage factionId={listing.factionId} size={36}/>)
      } else {
        addLog({ cls: 'err', icon: 'err', msg: r.message || 'Hire failed.' })
        showToast('Failed', r.message, 'err')
      }
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Hire failed.' })
      showToast('Failed', e.message, 'err')
    }
    setLoading(false)
  }

  const openBattleConfig = (targetId) => {
    const f = FACTIONS[gs?.faction || player?.faction]
    const initUnits = {}
    f?.units?.forEach(u => { initUnits[u.id] = gs?.army?.[u.id] || 0 })
    ;(gs?.mercs || []).forEach(m => { initUnits[m.unitId] = m.quantity || 0 })
    setBcUnits(initUnits)
    setBcItem('')
    setBcStep(1)
    setBcItemOpen(false)
    setBattleConfig({ targetId })
  }

  const doBattle = async () => {
    if (!battleConfig || loading) return
    const { targetId } = battleConfig
    const hasAnyUnit = Object.values(bcUnits).some(q => q > 0)
    const unitSelection = hasAnyUnit ? bcUnits : null
    setBattleConfig(null)
    setLoading(true)
    try {
      const res = await battle(targetId, unitSelection, bcItem || null)
      const msg = res.win ? `Victory vs ${res.targetName}` : `Defeat vs ${res.targetName}`
      addLog({ cls: res.win ? 'win' : 'lose', icon: res.win ? 'win' : 'lose', type: 'battle', msg, result: { ...res, playerFaction: player?.faction } })
      if (res.win) {
        showToast(`Victory — ${res.targetName} defeated`, `+${res.goldGain}g · +${res.manaGain}m · +${res.landGain} acres`, 'win')
      } else {
        showToast(`Defeat — ${res.targetName} prevailed`, `−${res.goldLoss}g · −${res.manaLoss}m · regroup and rebuild`, 'lose')
      }
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Battle failed.' })
      showToast('Battle failed', e.message, 'err')
    }
    setLoading(false)
  }

  const doBuyItem = async (item) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await buyAuctionItem(item.id)
      let sub
      if (res?.instant && Object.values(res.instant).some(v => v)) {
        sub = Object.entries(res.instant).filter(([,v])=>v).map(([k,v])=>`+${v} ${k}`).join(' · ')
      } else if (res?.itemCategory === 'consumable') {
        sub = `×${res.qty} added to inventory · ${item.effectLabel || ''}`
      } else if (res?.itemCategory === 'artifact') {
        sub = item.passiveLabel || 'Artifact stored — transfer risk on raid loss'
      } else if (item.passiveLabel) {
        sub = item.passiveLabel
      } else {
        sub = 'Passive bonus applied'
      }
      const verb = res?.itemCategory === 'consumable' ? 'Purchased' : res?.itemCategory === 'artifact' ? 'Artifact acquired' : 'Acquired'
      addLog({ cls: 'res', icon: 'purchase', msg: `${verb}: ${item.name}`, subtext: sub })
      showToast(`${item.name}`, sub, 'purchase')
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Purchase failed.' })
      showToast('Purchase failed', e.message, 'err')
    }
    setLoading(false)
  }

  const doRefreshAuction = async (paid) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await refreshAuction(paid)
      if (res?.success) {
        const msg = paid ? 'Auction restocked early' : 'Auction House refreshed'
        const sub = paid ? '−150g · New inventory available' : 'New items are now available'
        addLog({ cls: 'res', icon: 'purchase', msg, subtext: sub })
        showToast(msg, sub, 'purchase')
      } else {
        addLog({ cls: 'err', icon: 'err', msg: res?.message || 'Restock failed.' })
        showToast('Restock failed', res?.message, 'err')
      }
    } catch (e) {
      addLog({ cls: 'err', icon: 'err', msg: 'Restock failed.' })
      showToast('Restock failed', e.message, 'err')
    }
    setLoading(false)
  }

  // ── Guild panel ──────────────────────────────────────────────────────────
  const renderGuildPanel = () => {
    const fmtDate = (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    const fmtAgo  = (ts) => {
      const d = Date.now() - ts
      if (d < 3600_000)  return `${Math.floor(d/60_000)}m ago`
      if (d < 86400_000) return `${Math.floor(d/3600_000)}h ago`
      return `${Math.floor(d/86400_000)}d ago`
    }
    const fmtCountdown = (ts) => {
      const d = ts - Date.now()
      if (d <= 0) return 'Ended'
      const h = Math.floor(d / 3600_000)
      const m = Math.floor((d % 3600_000) / 60_000)
      return h > 24 ? `${Math.floor(h/24)}d ${h%24}h` : `${h}h ${m}m`
    }
    const recruitBadge = (status) => {
      if (status === 'open')         return <span className={s.gldBadgeOpen}>Open</span>
      if (status === 'invite_only')  return <span className={s.gldBadgeInvite}>Invite Only</span>
      return <span className={s.gldBadgeClosed}>Closed</span>
    }
    const roleBadge = (role) => {
      if (role === 'owner')   return <span className={s.gldRoleOwner}>Owner</span>
      if (role === 'officer') return <span className={s.gldRoleOfficer}>Officer</span>
      return <span className={s.gldRoleMember}>Member</span>
    }
    const myRole = guild?.members?.find(m => m.id === 'me')?.role || 'member'
    const isOwner   = guild?.ownerId === 'me'
    const isOfficer = myRole === 'officer'
    const canManage = isOwner || isOfficer

    // Feed icon/color helpers
    const feedColor = { battle_win:'var(--green)', deposit:'var(--gold)', recruit:'#e87848', event_join:'var(--mana2)', level_up:'var(--gold)', member_join:'var(--green)', build:'#c9a84c', perk:'var(--mana2)' }
    const FeedIcon  = ({ type }) => {
      const icons = { battle_win:<IconSword size={13}/>, deposit:<IconCoin size={13}/>, recruit:<IconSword size={13}/>, event_join:<IconCalendarEvent size={13}/>, level_up:<IconTrophy size={13}/>, member_join:<IconUserPlus size={13}/>, build:<IconHammer size={13}/>, perk:<IconTrophy size={13}/> }
      return icons[type] || <IconInfoCircle size={13}/>
    }

    // Event type -> faction-ish image tint color
    const evColor = { siege:'#e87848', expedition:'#6dccaa', defense:'#78b8e8', boss:'#c878e8', war:'#c9a84c' }

    // ── NOT IN GUILD ──────────────────────────────────────────────────────
    if (!guild) {
      // Create form
      if (guildView === 'create') {
        const doCreate = () => {
          const res = createGuild(gldCreateName, gldCreateDesc)
          if (!res.success) { setGldCreateErr(res.message); return }
          setGldCreateErr('')
          setGldCreateName('')
          setGldCreateDesc('')
          setGuildView('landing')
          showToast('Guild founded!', gldCreateName.trim(), 'res')
        }
        return (
          <div className={s.gldCreatePanel}>
            <button className={s.gldBackBtn} onClick={() => setGuildView('landing')}><IconChevronLeft size={14}/> Back</button>
            <div className={s.ph}><div className={s.ptitle}>Found a Guild</div><div className={s.pdesc}>Creating a guild costs <strong style={{color:'var(--gold)'}}>{GUILD_CREATION_COST.toLocaleString()} Gold</strong>. You will become the Guild Owner.</div></div>
            <div className={s.gldForm}>
              <div className={s.gldFieldGroup}>
                <div className={s.gldLabel}>Guild Name <span style={{color:'var(--muted)'}}>3–30 characters · letters, numbers, spaces, hyphens</span></div>
                <input className={s.gldInput} value={gldCreateName} onChange={e => setGldCreateName(e.target.value)} maxLength={30} placeholder="Enter guild name…" onKeyDown={e => e.key === 'Enter' && doCreate()} />
              </div>
              <div className={s.gldFieldGroup}>
                <div className={s.gldLabel}>Description <span style={{color:'var(--muted)'}}>up to 1000 characters</span></div>
                <textarea className={s.gldTextarea} value={gldCreateDesc} onChange={e => setGldCreateDesc(e.target.value)} maxLength={1000} placeholder="Describe your guild's purpose and goals…" rows={4} />
              </div>
              {gldCreateErr && <div style={{color:'var(--red)',fontSize:11}}>{gldCreateErr}</div>}
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(201,168,76,.15)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.3)',maxWidth:200}} onClick={doCreate}>
                  <IconUsers size={14}/> Found Guild — {GUILD_CREATION_COST.toLocaleString()}g
                </AnimBtn>
                <span style={{fontSize:10,color:'var(--muted)'}}>Your gold: {(gameState?.gold||0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )
      }

      // Guild search
      if (guildView === 'search') {
        const results = searchGuilds(gldSearch)
        return (
          <div>
            <button className={s.gldBackBtn} onClick={() => setGuildView('landing')}><IconChevronLeft size={14}/> Back</button>
            <div className={s.ph}><div className={s.ptitle}>Browse Guilds</div><div className={s.pdesc}>Find your faction — {MOCK_GUILDS.length} guilds active across all factions.</div></div>
            <div className={s.gldSearchBar}>
              <IconSearch size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}/>
              <input className={s.gldSearchInput} style={{paddingLeft:30}} value={gldSearch} onChange={e => setGldSearch(e.target.value)} placeholder="Search by name, faction, or keyword…" />
            </div>
            <div className={s.gldSearchGrid}>
              {results.map(g => {
                const gf = FACTIONS[g.faction]
                const xpPct = Math.min(100, Math.round(g.xp / g.xpNext * 100))
                const full = g.members >= g.maxMembers
                return (
                  <div key={g.id} className={s.gldSearchCard}>
                    <div className={s.gldSearchCardHero}>
                      <img src={`/images/factions/${g.faction}.jpg`} alt="" className={s.gldSearchCardHeroImg} onError={e=>e.target.style.display='none'}/>
                      <div className={s.gldSearchCardHeroGrad}/>
                      <div style={{position:'absolute',top:8,left:10,right:10,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6}}>
                        <span style={{fontSize:12.5,fontWeight:800,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.9)',lineHeight:1.2}}>{g.name}</span>
                        {recruitBadge(g.recruitmentStatus)}
                      </div>
                      <div style={{position:'absolute',bottom:8,left:10,display:'flex',alignItems:'center',gap:6}}>
                        <FactionImage factionId={g.faction} size={20}/>
                        <span style={{fontSize:10,color:gf?.color,fontWeight:600}}>{gf?.shortName}</span>
                        <span style={{fontSize:10,color:'var(--gold)',fontWeight:700,marginLeft:4}}>Lv.{g.level}</span>
                      </div>
                    </div>
                    <div className={s.gldSearchCardBody}>
                      <div style={{fontSize:10.5,color:'var(--muted)',lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{g.description}</div>
                      <div style={{display:'flex',gap:14,fontSize:10,color:'var(--muted)',flexWrap:'wrap'}}>
                        <span style={{color: full ? 'var(--red)' : 'var(--text)'}}><IconUsers size={10}/> {g.members}/{g.maxMembers}{full ? ' · Full' : ''}</span>
                        <span style={{color:'var(--gold)'}}>{g.treasury.toLocaleString()}g treasury</span>
                        <span>Founded {fmtDate(g.createdAt)}</span>
                      </div>
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--muted)',marginBottom:3}}>
                          <span>Guild XP</span><span>{xpPct}%</span>
                        </div>
                        <div className={s.gldXpBar}><div className={s.gldXpFill} style={{width:`${xpPct}%`}}/></div>
                      </div>
                      {g.recruitmentStatus === 'open' && !full
                        ? <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(109,204,170,.12)',color:'var(--green)',border:'1px solid rgba(109,204,170,.28)',fontSize:11,width:'100%',justifyContent:'center'}} onClick={() => showToast('Request sent', `Applied to join ${g.name}`, 'res')}><IconUserPlus size={12}/> Request to Join</AnimBtn>
                        : <span style={{fontSize:10,color:'var(--muted)'}}>{full ? 'Guild is full' : 'Not accepting applications'}</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      // Pending invites
      if (guildView === 'invites') {
        return (
          <div>
            <button className={s.gldBackBtn} onClick={() => setGuildView('landing')}><IconChevronLeft size={14}/> Back</button>
            <div className={s.ph}><div className={s.ptitle}>Pending Invites</div><div className={s.pdesc}>Invitations expire after 7 days.</div></div>
            {guildInvites.length === 0 && <div style={{color:'var(--muted)',fontSize:12,marginTop:20}}>No pending invites.</div>}
            {guildInvites.map(inv => {
              const gf = FACTIONS[inv.guildFaction]
              return (
                <div key={inv.id} className={s.gldInviteCard}>
                  <FactionImage factionId={inv.guildFaction} size={44} />
                  <div className={s.gldInviteInfo}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{inv.guildName}</div>
                    <div style={{fontSize:10,color:gf?.color||'var(--muted)',marginBottom:4}}>{gf?.name||inv.guildFaction} · Lv.{inv.guildLevel} · {inv.guildMembers}/{inv.guildMaxMembers} members</div>
                    <div style={{fontSize:10,color:'var(--muted)'}}>Invited by <strong style={{color:'var(--text)'}}>{inv.invitedBy}</strong> · Expires {fmtDate(inv.expiresAt)}</div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
                    <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(109,204,170,.15)',color:'var(--green)',border:'1px solid rgba(109,204,170,.3)',padding:'7px 14px',fontSize:11}} onClick={() => { acceptInvite(inv.id); showToast(`Joined ${inv.guildName}`, 'Welcome to the guild!', 'res') }}>
                      <IconCheck size={13}/> Accept
                    </AnimBtn>
                    <button className={s.gldActBtn} onClick={() => declineInvite(inv.id)}>Decline</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      // Landing (default)
      const heroFaction = faction || 'flame'
      return (
        <div>
          <div className={s.ph}>
            <div className={s.ptitle}>Guild Hall</div>
            <div className={s.pdesc}>Join forces with other players. Guilds unlock events, treasury perks, and shared progression unavailable to solo players.</div>
          </div>
          <div className={s.gldLanding}>
            {/* Create */}
            <div className={s.gldHeroCard} onClick={() => setGuildView('create')}>
              <img src={`/images/factions/${heroFaction}.jpg`} alt="" className={s.gldHeroCardImg} onError={e => e.target.style.display='none'}/>
              <div className={s.gldHeroCardGrad}/>
              <div className={s.gldHeroCardBody}>
                <div className={s.gldHeroCardIcon}><IconUsers size={34} color="var(--gold)"/></div>
                <div className={s.gldHeroCardName}>Found a Guild</div>
                <div className={s.gldHeroCardCost} style={{color:'var(--gold)'}}><IconCoin size={11}/> {GUILD_CREATION_COST.toLocaleString()} Gold</div>
                <div className={s.gldHeroCardDesc}>Establish your own guild, set the name and charter, and lead members to realm domination. You become the Guild Owner.</div>
              </div>
            </div>
            {/* Search */}
            <div className={s.gldHeroCard} onClick={() => setGuildView('search')}>
              <img src={`/images/factions/nature.jpg`} alt="" className={s.gldHeroCardImg} onError={e => e.target.style.display='none'}/>
              <div className={s.gldHeroCardGrad}/>
              <div className={s.gldHeroCardBody}>
                <div className={s.gldHeroCardIcon}><IconSearch size={34} color="var(--mana2)"/></div>
                <div className={s.gldHeroCardName}>Browse Guilds</div>
                <div className={s.gldHeroCardCost} style={{color:'var(--muted)'}}>{MOCK_GUILDS.length} active guilds across all factions</div>
                <div className={s.gldHeroCardDesc}>Explore guilds recruiting across every faction. Filter by status, level, and size. Request to join open guilds instantly.</div>
              </div>
            </div>
            {/* Invites */}
            <div className={s.gldHeroCard} onClick={() => setGuildView('invites')} style={{borderColor: guildInvites.length > 0 ? 'rgba(109,204,170,.35)' : undefined}}>
              <img src={`/images/factions/celestial.jpg`} alt="" className={s.gldHeroCardImg} onError={e => e.target.style.display='none'}/>
              <div className={s.gldHeroCardGrad}/>
              {guildInvites.length > 0 && (
                <div className={s.gldHeroCardBadge}>
                  <span style={{background:'var(--green)',color:'#000',fontSize:9,fontWeight:800,borderRadius:5,padding:'2px 8px'}}>{guildInvites.length} WAITING</span>
                </div>
              )}
              <div className={s.gldHeroCardBody}>
                <div className={s.gldHeroCardIcon}><IconUserPlus size={34} color={guildInvites.length > 0 ? 'var(--green)' : 'var(--muted)'}/></div>
                <div className={s.gldHeroCardName}>Pending Invites</div>
                <div className={s.gldHeroCardCost} style={{color: guildInvites.length > 0 ? 'var(--green)' : 'var(--muted)'}}>
                  {guildInvites.length > 0 ? `${guildInvites.length} invitation${guildInvites.length > 1 ? 's' : ''} awaiting response` : 'No pending invitations'}
                </div>
                <div className={s.gldHeroCardDesc}>Review guild invitations from leaders and officers. Accepted invites add you immediately as a member.</div>
              </div>
            </div>
          </div>

          {/* Mini guild browser preview */}
          <div className={s.sectionLabel} style={{marginTop:28}}>Active Guilds — Top Ranked</div>
          <div className={s.gldSearchGrid}>
            {MOCK_GUILDS.slice(0,4).map(g => {
              const gfac = FACTIONS[g.faction]
              const xpPct = Math.min(100, Math.round(g.xp / g.xpNext * 100))
              return (
                <div key={g.id} className={s.gldSearchCard}>
                  <div className={s.gldSearchCardHero}>
                    <img src={`/images/factions/${g.faction}.jpg`} alt="" className={s.gldSearchCardHeroImg} onError={e=>e.target.style.display='none'}/>
                    <div className={s.gldSearchCardHeroGrad}/>
                    <div style={{position:'absolute',top:8,left:10,right:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,fontWeight:800,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.8)'}}>{g.name}</span>
                      {recruitBadge(g.recruitmentStatus)}
                    </div>
                  </div>
                  <div className={s.gldSearchCardBody}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <FactionImage factionId={g.faction} size={22}/>
                      <span style={{fontSize:10.5,color:gfac?.color||'var(--muted)',fontWeight:600}}>{gfac?.name}</span>
                      <span style={{fontSize:10,color:'var(--gold)',marginLeft:'auto',fontWeight:700}}>Lv.{g.level}</span>
                    </div>
                    <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{g.description}</div>
                    <div style={{display:'flex',gap:12,fontSize:10,color:'var(--muted)'}}>
                      <span><IconUsers size={10}/> {g.members}/{g.maxMembers}</span>
                      <span style={{color:'var(--gold)'}}>{g.treasury.toLocaleString()}g treasury</span>
                    </div>
                    <div className={s.gldXpBar}><div className={s.gldXpFill} style={{width:`${xpPct}%`}}/></div>
                    <button className={s.gldActBtn} style={{width:'100%',justifyContent:'center'}} onClick={() => setGuildView('search')}>
                      {g.recruitmentStatus === 'open' ? 'Request to Join →' : 'View Guild →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // ── IN GUILD ──────────────────────────────────────────────────────────
    const myMember    = guild.members.find(m=>m.id==='me')
    const gf          = FACTIONS[myMember?.faction || faction || 'flame']
    const guildFaction= myMember?.faction || faction || 'flame'
    const xpPct       = Math.min(100, Math.round((guild.xp / guild.xpNext) * 100))
    const memberCount = guild.members.length
    const purchasedPerks = guild.purchasedPerks || {}
    const activityFeed   = guild.activityFeed   || []

    const tabItems = [
      { id: 'overview',  label: 'Overview',  Icon: IconHome },
      { id: 'members',   label: 'Members',   Icon: IconUsers },
      { id: 'chat',      label: 'Chat',      Icon: IconMessageCircle },
      { id: 'events',    label: 'Events',    Icon: IconCalendarEvent },
      { id: 'treasury',  label: 'Treasury',  Icon: IconPigMoney },
      { id: 'perks',     label: 'Perks',     Icon: IconTrophy },
      ...(isOwner ? [{ id: 'settings', label: 'Settings', Icon: IconSettings }] : []),
    ]

    const renderOverview = () => {
      const activeEvent = GUILD_EVENTS.find(e => e.status === 'active')
      const onlineCount = guild.members.filter(m => Date.now() - m.lastActive < 3600_000).length
      const totalBattles = guild.members.reduce((a, m) => a + (m.battlesWon || 0), 0)
      const maxMembers = 20 + (purchasedPerks['member_cap'] || 0) * 5
      const perksUnlocked = Object.values(purchasedPerks).reduce((a, v) => a + v, 0)
      const totalPerks = GUILD_PERKS.reduce((a, p) => a + p.costs.length, 0)
      const treasuryPct = Math.min(100, Math.round(guild.treasury / 1_000_000 * 100))

      const insightCards = [
        {
          key: 'level',
          color: 'var(--gold)',
          icon: <IconTrophy size={20}/>,
          val: `Lv.${guild.level}`,
          lbl: 'Guild Level',
          why: 'Higher levels unlock new perk tiers, larger member caps, and access to exclusive guild events.',
          progress: { pct: xpPct, label: `${guild.xp.toLocaleString()} / ${guild.xpNext.toLocaleString()} XP`, next: `Lv.${guild.level + 1}` },
          cta: { label: 'View Milestones', fn: () => { setGuildTab('overview'); setTimeout(() => document.getElementById('gld-milestones')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80) } },
        },
        {
          key: 'members',
          color: 'var(--green)',
          icon: <IconUsers size={20}/>,
          val: `${memberCount}/${maxMembers}`,
          lbl: 'Members',
          why: 'More active members means more treasury contributions, more battles won, and faster XP gains for the guild.',
          progress: { pct: Math.round(memberCount / maxMembers * 100), label: `${maxMembers - memberCount} slots available`, next: 'Full Roster' },
          cta: { label: 'Manage Members', fn: () => setGuildTab('members') },
        },
        {
          key: 'treasury',
          color: '#c9a84c',
          icon: <IconPigMoney size={20}/>,
          val: `${guild.treasury.toLocaleString()}g`,
          lbl: 'Treasury',
          why: 'Guild gold funds perks that benefit every member — XP boosts, treasury interest, expanded rosters, and combat advantages.',
          progress: { pct: treasuryPct, label: `${treasuryPct}% toward 1,000,000g milestone`, next: 'Deep Pockets' },
          cta: { label: 'Spend on Perks', fn: () => setGuildTab('perks') },
        },
        {
          key: 'perks',
          color: '#b070ff',
          icon: <IconStar size={20}/>,
          val: `${perksUnlocked}/${totalPerks}`,
          lbl: 'Perks Unlocked',
          why: 'Active perks provide permanent bonuses to all members — from XP boosts to gold sharing to extra event slots.',
          progress: { pct: Math.round(perksUnlocked / totalPerks * 100), label: `${totalPerks - perksUnlocked} upgrades remaining`, next: 'All Perks Max' },
          cta: { label: 'Browse Perks', fn: () => setGuildTab('perks') },
        },
      ]

      return (
        <div className={s.gldOverview}>
          {/* Pinned announcement */}
          {guild.pinnedAnnouncement && (
            <div className={s.gldPinned}>
              <div className={s.gldPinnedIcon}><IconInfoCircle size={16}/></div>
              <div className={s.gldPinnedText}>
                <div className={s.gldPinnedLabel}>📌 Guild Announcement</div>
                {guild.pinnedAnnouncement}
              </div>
            </div>
          )}

          {/* Active event hero banner */}
          {activeEvent && (
            <div className={s.gldEventBanner} onClick={() => setGuildTab('events')}>
              <div className={s.gldEventBannerGlow}/>
              <div className={s.gldEventBannerBadge}>LIVE EVENT</div>
              <div className={s.gldEventBannerTitle}>{activeEvent.name}</div>
              <div className={s.gldEventBannerDesc}>{activeEvent.description}</div>
              <div className={s.gldEventBannerFoot}>
                <span className={s.gldEventBannerReward}><IconTrophy size={12}/> {activeEvent.rewards}</span>
                <span className={s.gldEventBannerTimer}>Ends in {fmtCountdown(activeEvent.endDate)} →</span>
              </div>
            </div>
          )}

          {/* Insight stat cards */}
          <div className={s.gldInsightGrid}>
            {insightCards.map(card => (
              <div key={card.key} className={s.gldInsightCard} style={{'--ic': card.color}}>
                <div className={s.gldInsightHeader}>
                  <div className={s.gldInsightIcon}>{card.icon}</div>
                  <div>
                    <div className={s.gldInsightVal}>{card.val}</div>
                    <div className={s.gldInsightLbl}>{card.lbl}</div>
                  </div>
                </div>
                <p className={s.gldInsightWhy}>{card.why}</p>
                <div className={s.gldInsightProgressWrap}>
                  <div className={s.gldInsightBar}><div className={s.gldInsightFill} style={{width:`${card.progress.pct}%`}}/></div>
                  <div className={s.gldInsightProgressMeta}>
                    <span>{card.progress.label}</span>
                    <span style={{color:'var(--ic)',fontWeight:600}}>{card.progress.next}</span>
                  </div>
                </div>
                <button className={s.gldInsightCta} onClick={card.cta.fn}>{card.cta.label} →</button>
              </div>
            ))}
          </div>

          {/* Two-column: activity feed + recent chat */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            {/* Activity feed */}
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}><IconBolt size={12} style={{marginRight:5,verticalAlign:'middle',color:'var(--gold)'}}/> Activity Feed</span>
              </div>
              <div className={s.gldFeed}>
                {activityFeed.slice(0,7).map(item => (
                  <div key={item.id} className={s.gldFeedRow}>
                    <div className={s.gldFeedIcon} style={{background:`${feedColor[item.type]||'var(--muted)'}18`,color:feedColor[item.type]||'var(--muted)'}}>
                      <FeedIcon type={item.type}/>
                    </div>
                    <div className={s.gldFeedText}>
                      {item.playerName && <strong style={{color:'var(--text)'}}>{item.playerName} </strong>}
                      {item.msg}
                      {item.xp > 0 && <span style={{color:'var(--gold)',fontSize:10,marginLeft:4}}>+{item.xp} XP</span>}
                    </div>
                    <div className={s.gldFeedTs}>{fmtAgo(item.ts)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent chat */}
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}><IconMessageCircle size={12} style={{marginRight:5,verticalAlign:'middle',color:'var(--mana2)'}}/> Recent Chat</span>
                <button className={s.gldActBtn} onClick={() => setGuildTab('chat')}>Open →</button>
              </div>
              {guild.chat.filter(m => !m.system).slice(-6).map(msg => (
                <div key={msg.id} className={s.gldOverviewChatRow}>
                  <FactionImage factionId={msg.faction || player?.faction || 'flame'} size={22}/>
                  <span className={s.gldOverviewChatName} style={{color: msg.playerId === 'me' ? 'var(--gold)' : 'var(--silver)'}}>{msg.playerName}</span>
                  <span className={s.gldOverviewChatMsg}>{msg.message}</span>
                  <span className={s.gldOverviewChatTs}>{msg.ts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div id="gld-milestones">
            <div className={s.sectionLabel}>Guild Milestones</div>
            <div className={s.gldMilestones}>
              {GUILD_MILESTONES.map(ms => {
                let current = 0
                if (ms.type === 'level')    current = guild.level
                if (ms.type === 'members')  current = memberCount
                if (ms.type === 'battles')  current = totalBattles
                if (ms.type === 'treasury') current = guild.treasury
                if (ms.type === 'events')   current = GUILD_EVENTS.filter(e=>e.status==='completed').length
                const pct = Math.min(100, Math.round(current / ms.goal * 100))
                const done = current >= ms.goal
                return (
                  <div key={ms.id} className={s.gldMilestone} style={{borderColor: done ? `${ms.color}44` : undefined, opacity: done ? 0.7 : 1}}>
                    <div className={s.gldMilestoneIcon} style={{background:`${ms.color}18`,color:ms.color}}>
                      {done ? <IconCheck size={16}/> : <IconTrophy size={16}/>}
                    </div>
                    <div className={s.gldMilestoneInfo}>
                      <div className={s.gldMilestoneName}>{ms.name}{done && ' ✓'}</div>
                      <div className={s.gldMilestoneDesc}>{ms.desc}</div>
                      <div className={s.gldMilestoneReward}><IconTrophy size={10}/> {ms.reward}</div>
                      {!done && <div className={s.gldMilestoneBar}><div className={s.gldMilestoneBarFill} style={{width:`${pct}%`,background:ms.color}}/></div>}
                    </div>
                    <div style={{fontSize:11,color:'var(--muted)',flexShrink:0,textAlign:'right'}}>
                      <div style={{fontWeight:700,color:done?'var(--green)':ms.color}}>{done ? 'Complete' : `${pct}%`}</div>
                      {!done && <div style={{fontSize:9.5}}>{typeof current==='number'&&current.toLocaleString()} / {ms.goal.toLocaleString()}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    const renderMembers = () => {
      const doPlayerInvite = () => { const res = invitePlayer(gldInviteQuery); setGldInviteResults(res) }
      const sortedMembers = [...guild.members].sort((a, b) => {
        if (gldMemberSort === 'role')  { const ro = { owner:0, officer:1, member:2 }; return ro[a.role]-ro[b.role] }
        if (gldMemberSort === 'power') return (b.power||0) - (a.power||0)
        if (gldMemberSort === 'xp')    return (b.xpContrib||0) - (a.xpContrib||0)
        if (gldMemberSort === 'gold')  return (b.goldContrib||0) - (a.goldContrib||0)
        return 0
      })
      const maxXp   = Math.max(...guild.members.map(m => m.xpContrib || 0), 1)
      const maxGold = Math.max(...guild.members.map(m => m.goldContrib || 0), 1)
      return (
        <div>
          {canManage && (
            <div style={{marginBottom:20,padding:14,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10}}>
              <div className={s.gldLabel} style={{marginBottom:8}}>Invite Player</div>
              <div className={s.gldInviteBar}>
                <input className={s.gldInput} value={gldInviteQuery} onChange={e => setGldInviteQuery(e.target.value)} placeholder="Search by player name…" onKeyDown={e => e.key === 'Enter' && doPlayerInvite()} style={{flex:1}} />
                <button className={s.gldQuickBtn} onClick={doPlayerInvite}><IconSearch size={14}/> Search</button>
              </div>
              {gldInviteResults.length > 0 && (
                <div className={s.gldInviteResults}>
                  {gldInviteResults.map(p => {
                    const pf = FACTIONS[p.faction]
                    return (
                      <div key={p._id} className={s.gldInviteResult}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <FactionImage factionId={p.faction} size={24}/>
                          <div>
                            <div style={{fontWeight:600,fontSize:11}}>{p.name}</div>
                            <div style={{fontSize:9,color:pf?.color||'var(--muted)'}}>{pf?.name} · {p.power.toLocaleString()} power</div>
                          </div>
                        </div>
                        <AnimBtn className={s.gldActBtn} variant="strike" onClick={() => { setGldInviteResults([]); setGldInviteQuery(''); showToast('Invite sent', `${p.name} has been invited`, 'res') }}>
                          <IconUserPlus size={11}/> Invite
                        </AnimBtn>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sort bar */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>{memberCount}/{GUILD_MAX_MEMBERS} Members</span>
            <div style={{marginLeft:'auto',display:'flex',gap:4}}>
              {[['role','Role'],['power','Power'],['xp','XP'],['gold','Gold']].map(([v,l]) => (
                <button key={v} onClick={() => setGldMemberSort(v)} style={{padding:'3px 9px',fontSize:10,fontWeight:600,borderRadius:5,border:'1px solid',borderColor: gldMemberSort===v?'rgba(201,168,76,.5)':'var(--border)',color:gldMemberSort===v?'var(--gold)':'var(--muted)',background:gldMemberSort===v?'rgba(201,168,76,.08)':'transparent',cursor:'pointer'}}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {sortedMembers.map(m => {
              const isOnline    = Date.now() - m.lastActive < 3600_000
              const canPromote  = isOwner && m.id !== 'me' && m.role === 'member'
              const canDemote   = isOwner && m.id !== 'me' && m.role === 'officer'
              const canKick     = canManage && m.id !== 'me' && m.role !== 'owner'
              const canTransfer = isOwner && m.id !== 'me'
              return (
                <div key={m.id} className={s.gldMemberRowV2}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <FactionImage factionId={m.faction || 'flame'} size={36}/>
                    <div className={s.gldOnlineDot} style={{position:'absolute',bottom:-1,right:-1,background:isOnline?'var(--green)':'rgba(255,255,255,.2)',boxShadow:isOnline?'0 0 0 2px var(--bg2)':undefined}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                      {m.id === 'me' && <IconCrown size={11} color="var(--gold)"/>}
                      <span style={{fontSize:12,fontWeight:700,color:m.id==='me'?'var(--gold)':'var(--text)'}}>{m.name}</span>
                      {roleBadge(m.role)}
                      {m.power && <span style={{marginLeft:'auto',fontSize:10,color:'var(--muted)',fontWeight:600}}>{m.power.toLocaleString()} pwr</span>}
                    </div>
                    <div style={{display:'flex',gap:12,fontSize:9.5,color:'var(--muted)'}}>
                      <span>Joined {fmtDate(m.joinedAt)}</span>
                      <span style={{color:isOnline?'var(--green)':undefined}}>{isOnline ? '● Online' : `Last: ${fmtAgo(m.lastActive)}`}</span>
                    </div>
                    {/* Contribution bars */}
                    {(m.xpContrib || m.goldContrib) ? (
                      <div style={{display:'flex',gap:10,marginTop:5}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:8.5,color:'var(--muted)',marginBottom:2}}>
                            <span>XP Contributed</span><span style={{color:'var(--gold)'}}>{(m.xpContrib||0).toLocaleString()}</span>
                          </div>
                          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.round((m.xpContrib||0)/maxXp*100)}%`,background:'var(--gold)',borderRadius:2}}/>
                          </div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:8.5,color:'var(--muted)',marginBottom:2}}>
                            <span>Gold Donated</span><span style={{color:'var(--green)'}}>{(m.goldContrib||0).toLocaleString()}g</span>
                          </div>
                          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.round((m.goldContrib||0)/maxGold*100)}%`,background:'var(--green)',borderRadius:2}}/>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className={s.gldMemberActions}>
                    {canPromote   && <button className={s.gldActBtn} onClick={() => promoteMember(m.id)}><IconArrowUp size={11}/> Promote</button>}
                    {canDemote    && <button className={s.gldActBtn} onClick={() => demoteMember(m.id)}>Demote</button>}
                    {canTransfer  && <button className={s.gldActBtn} onClick={() => setGldConfirm({ title:'Transfer Ownership', desc:`Transfer guild ownership to ${m.name}? You will become a regular member.`, onConfirm: () => transferOwnership(m.id) })}>Transfer</button>}
                    {canKick      && <button className={`${s.gldActBtn} ${s.gldActBtnDanger}`} onClick={() => setGldConfirm({ title:'Remove Member', desc:`Remove ${m.name} from the guild?`, onConfirm: () => kickMember(m.id) })}>Remove</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const renderChat = () => (
      <div className={s.gldChatPanel}>
        <div className={s.gldChatScroll} ref={guildChatRef}>
          {guild.chat.map(msg => msg.system
            ? <div key={msg.id} className={s.gldChatSystem}>{msg.message}</div>
            : (
              <div key={msg.id} className={s.gldChatMsg}>
                <div className={s.gldChatAvatar}><FactionImage factionId={msg.faction || player?.faction || 'flame'} size={28}/></div>
                <div className={s.gldChatBody}>
                  <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                    <span className={s.gldChatName} style={{color: msg.playerId === 'me' ? 'var(--gold)' : 'var(--text)'}}>{msg.playerName}</span>
                    <span className={s.gldChatTs}>{msg.ts}</span>
                  </div>
                  <div className={s.gldChatText}>{msg.message}</div>
                </div>
              </div>
            )
          )}
        </div>
        <div className={s.gldChatInputRow}>
          <input
            className={s.gldChatInput}
            value={gldChatInput}
            onChange={e => setGldChatInput(e.target.value)}
            placeholder="Send a message to your guild…"
            maxLength={500}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { sendGuildChat(gldChatInput); setGldChatInput('') } }}
          />
          <AnimBtn className={s.gldQuickBtn} variant="strike" style={{background:'rgba(201,168,76,.1)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.2)'}} onClick={() => { sendGuildChat(gldChatInput); setGldChatInput('') }}>
            <IconSend size={14}/>
          </AnimBtn>
        </div>
      </div>
    )

    const renderEvents = () => {
      const active    = GUILD_EVENTS.filter(e => e.status === 'active')
      const upcoming  = GUILD_EVENTS.filter(e => e.status === 'upcoming')
      const completed = GUILD_EVENTS.filter(e => e.status === 'completed')
      const EventCard = ({ ev }) => {
        const registered = gldEventsState[ev.id]?.registered || ev.registered
        const pct = Math.round(ev.participants / ev.maxParticipants * 100)
        const ec = evColor[ev.type] || 'var(--gold)'
        const statusBadge =
          ev.status === 'active'    ? <span className={s.gldEventBadgeActive}>● Live</span> :
          ev.status === 'upcoming'  ? <span className={s.gldEventBadgeUpcoming}>Upcoming</span> :
                                      <span className={s.gldEventBadgeDone}>Completed</span>
        return (
          <div className={s.gldEventCardV2}>
            <div className={s.gldEventCardHero} style={{background:`${ec}12`}}>
              <img src={`/images/factions/${guildFaction}.jpg`} alt="" className={s.gldEventCardHeroImg} onError={e=>e.target.style.display='none'}/>
              <div className={s.gldEventCardHeroGrad} style={{background:`linear-gradient(to top, var(--bg3) 0%, ${ec}22 100%)`}}/>
              <div className={s.gldEventCardHeroBadges}>
                {statusBadge}
                <span style={{fontSize:9,fontWeight:700,color:ec,background:`${ec}18`,border:`1px solid ${ec}33`,borderRadius:4,padding:'1px 7px',textTransform:'uppercase',letterSpacing:'.08em'}}>{ev.type}</span>
              </div>
              <div style={{position:'absolute',bottom:8,left:12,fontSize:14,fontWeight:800,color:'#fff',textShadow:'0 1px 6px rgba(0,0,0,.8)'}}>{ev.name}</div>
            </div>
            <div className={s.gldEventCardBody}>
              <div style={{fontSize:10.5,color:'var(--muted)',lineHeight:1.55}}>{ev.description}</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>
                {ev.status === 'active'    && <span style={{color:'var(--red)',fontWeight:600}}>⏱ Ends in {fmtCountdown(ev.endDate)}</span>}
                {ev.status === 'upcoming'  && <span>Starts {fmtDate(ev.startDate)} · in {fmtCountdown(ev.startDate)}</span>}
                {ev.status === 'completed' && <span>Ended {fmtDate(ev.endDate)}</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:10}}>
                <span style={{color:'var(--green)'}}><IconTrophy size={10}/> {ev.rewards}</span>
              </div>
              <div style={{fontSize:9.5,color:'var(--muted)'}}>{ev.requirement}</div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--muted)',marginBottom:3}}>
                  <span>Participants</span><span>{ev.participants}/{ev.maxParticipants}</span>
                </div>
                <div className={s.gldEventProgress}><div className={s.gldEventProgressFill} style={{width:`${pct}%`,background:ec}}/></div>
              </div>
              {ev.status !== 'completed' && (
                registered
                  ? <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--green)',fontWeight:600}}><IconCheck size={13}/> Registered</div>
                  : <AnimBtn className={s.ucardBtn} variant="strike" style={{background:`${ec}14`,color:ec,border:`1px solid ${ec}33`,fontSize:11,width:'100%',justifyContent:'center'}} onClick={() => { setGldEventsState(p => ({...p, [ev.id]: {registered: true}})); showToast('Registered!', ev.name, 'res') }}><IconCalendarEvent size={12}/> Register for Event</AnimBtn>
              )}
            </div>
          </div>
        )
      }
      return (
        <div>
          {active.length > 0 && <><div className={s.sectionLabel}>Active Events</div><div className={s.gldEventsGrid} style={{marginBottom:24}}>{active.map(e => <EventCard key={e.id} ev={e}/>)}</div></>}
          {upcoming.length > 0 && <><div className={s.sectionLabel}>Upcoming Events</div><div className={s.gldEventsGrid} style={{marginBottom:24}}>{upcoming.map(e => <EventCard key={e.id} ev={e}/>)}</div></>}
          {completed.length > 0 && <><div className={s.sectionLabel}>Completed Events</div><div className={s.gldEventsGrid}>{completed.map(e => <EventCard key={e.id} ev={e}/>)}</div></>}
        </div>
      )
    }

    const renderTreasury = () => {
      const doDeposit = () => {
        const res = depositTreasury(gldDeposit)
        if (!res.success) { showToast('Deposit failed', res.message, 'err'); return }
        setGldDeposit('')
        showToast('Deposited!', `${parseInt(gldDeposit).toLocaleString()}g added to treasury`, 'res')
      }
      const fillPct = Math.min(100, Math.round(guild.treasury / 1_000_000 * 100))
      return (
        <div>
          {/* Hero: balance left, deposit controls right */}
          <div className={s.gldTreasuryHero}>
            <img src={`/images/factions/${guildFaction}.jpg`} alt="" className={s.gldTreasuryHeroImg} onError={e=>e.target.style.display='none'}/>
            <div className={s.gldTreasuryHeroGrad}/>
            <div className={s.gldTreasuryHeroContent} style={{display:'flex',alignItems:'center',gap:32,flexWrap:'wrap'}}>
              {/* Balance + progress */}
              <div style={{flex:1,minWidth:220}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.15em',color:'rgba(255,255,255,.6)',marginBottom:6}}>Guild Treasury</div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <IconCoin size={28} style={{color:'var(--gold)'}}/>
                  <span style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>{guild.treasury.toLocaleString()}<span style={{fontSize:14,color:'rgba(255,255,255,.5)',marginLeft:4}}>gold</span></span>
                </div>
                <div style={{marginTop:10,width:'100%',maxWidth:340}}>
                  <div style={{height:4,background:'rgba(255,255,255,.12)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${fillPct}%`,background:'var(--gold)',borderRadius:4,transition:'width .6s ease'}}/>
                  </div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:4}}>{fillPct}% of 1,000,000g milestone</div>
                </div>
              </div>

              {/* Deposit controls */}
              <div style={{flex:1,minWidth:240}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.12em',color:'rgba(255,255,255,.5)',marginBottom:8}}>Make a Deposit</div>
                <div className={s.gldDepositRow} style={{marginBottom:6}}>
                  <input type="number" className={s.gldDepositInput} style={{background:'rgba(255,255,255,.08)',borderColor:'rgba(255,255,255,.18)',color:'#fff'}} value={gldDeposit} onChange={e => setGldDeposit(e.target.value)} placeholder="Enter amount…" onKeyDown={e => e.key === 'Enter' && doDeposit()} />
                  <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(201,168,76,.25)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.5)',padding:'11px 22px',fontSize:12,borderRadius:8,justifyContent:'center',flexShrink:0}} onClick={doDeposit}>
                    Deposit
                  </AnimBtn>
                </div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>Your gold: <strong style={{color:'var(--gold)'}}>{(gameState?.gold||0).toLocaleString()}g</strong></div>
              </div>
            </div>
          </div>

          {/* Two columns: transaction history + quick stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
            <div>
              <div className={s.sectionLabel}>Transaction History</div>
              {guild.treasuryTxns.length === 0
                ? <div style={{color:'var(--muted)',fontSize:11,padding:'12px 0'}}>No transactions yet. Be the first to contribute!</div>
                : guild.treasuryTxns.map(tx => (
                  <div key={tx.id} className={s.gldTxnRow}>
                    <span style={{color:'var(--text)',fontWeight:500}}>{tx.playerName}</span>
                    <span style={{color:'var(--muted)',fontSize:10}}>{tx.ts}</span>
                    <span style={{color:'var(--green)',fontWeight:600}}>+{tx.amount.toLocaleString()}g</span>
                  </div>
                ))
              }
            </div>
            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:2}}>Quick Stats</div>
              <div style={{fontSize:11,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Total contributed</span><span style={{color:'var(--text)',fontWeight:600}}>{guild.treasuryTxns.reduce((a,t)=>a+t.amount,0).toLocaleString()}g</span></div>
              <div style={{fontSize:11,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Top contributor</span><span style={{color:'var(--gold)',fontWeight:600}}>{guild.treasuryTxns.reduce((top,t)=>t.amount>=(top?.amount||0)?t:top,null)?.playerName||'—'}</span></div>
              <div style={{fontSize:11,display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Transactions</span><span style={{color:'var(--text)',fontWeight:600}}>{guild.treasuryTxns.length}</span></div>
            </div>
          </div>
        </div>
      )
    }

    const renderPerks = () => {
      return (
        <div>
          <div style={{marginBottom:16,fontSize:11,color:'var(--muted)',lineHeight:1.6}}>
            Spend guild treasury gold to unlock permanent perks that benefit all members. Perks can be upgraded multiple times.
          </div>
          <div className={s.gldPerksGrid}>
            {GUILD_PERKS.map(perk => {
              const lvl = purchasedPerks[perk.id] || 0
              const maxLvl = perk.costs.length
              const isMaxed = lvl >= maxLvl
              const nextCost = isMaxed ? null : perk.costs[lvl]
              const canAfford = nextCost != null && guild.treasury >= nextCost
              const PerkIcon = perk.icon === 'users' ? IconUsers : perk.icon === 'trophy' ? IconTrophy : perk.icon === 'coin' ? IconCoin : perk.icon === 'sword' ? IconSword : perk.icon === 'calendar' ? IconCalendarEvent : IconCoin
              return (
                <div key={perk.id} className={`${s.gldPerkCard} ${isMaxed ? s.gldPerkCardMaxed : ''}`}>
                  <div className={s.gldPerkCardHeader}>
                    <div className={s.gldPerkIcon}><PerkIcon size={18}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{perk.name}</div>
                      <div style={{fontSize:9.5,color:'var(--muted)',marginTop:2}}>{perk.desc}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {isMaxed
                        ? <span style={{fontSize:9,fontWeight:700,color:'var(--gold)',background:'rgba(201,168,76,.15)',border:'1px solid rgba(201,168,76,.3)',borderRadius:4,padding:'2px 8px'}}>MAX</span>
                        : <span style={{fontSize:9,color:'var(--muted)'}}>Lv {lvl}/{maxLvl}</span>
                      }
                    </div>
                  </div>
                  <div style={{display:'flex',gap:4,marginBottom:8}}>
                    {perk.costs.map((_,i) => (
                      <div key={i} style={{height:3,flex:1,borderRadius:2,background: i < lvl ? 'var(--gold)' : 'var(--border)'}}/>
                    ))}
                  </div>
                  {!isMaxed && (
                    <div style={{fontSize:10,color:'var(--muted)',marginBottom:6}}>
                      Next: <strong style={{color:'var(--text)'}}>{perk.effects[lvl]}</strong>
                    </div>
                  )}
                  {isMaxed
                    ? <div style={{fontSize:10,color:'var(--green)',fontWeight:600}}>✓ Fully upgraded — {perk.effects[lvl-1]}</div>
                    : (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                        <span style={{fontSize:10,color: canAfford ? 'var(--gold)' : 'var(--muted)'}}><IconCoin size={10}/> {nextCost?.toLocaleString()}g</span>
                        {isOwner
                          ? <AnimBtn className={s.ucardBtn} variant="strike" style={{fontSize:10,padding:'5px 14px',background:canAfford?'rgba(201,168,76,.15)':'rgba(255,255,255,.04)',color:canAfford?'var(--gold)':'var(--muted)',border:`1px solid ${canAfford?'rgba(201,168,76,.3)':'var(--border)'}`,cursor:canAfford?'pointer':'not-allowed'}} onClick={() => { if(!canAfford)return; const r=purchaseGuildPerk(perk.id); if(r.success) showToast('Perk upgraded!', perk.name, 'res'); else showToast('Failed', r.message, 'err') }}>
                            {lvl === 0 ? 'Unlock' : 'Upgrade'}
                          </AnimBtn>
                          : <span style={{fontSize:9,color:'var(--muted)'}}>Owner only</span>
                        }
                      </div>
                    )
                  }
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const renderSettings = () => {
      const doSave = () => {
        const res = updateGuildSettings({ name: gldSettingsName, description: gldSettingsDesc, recruitmentStatus: gldSettingsRecruit })
        if (!res.success) { setGldSettingsErr(res.message); return }
        setGldSettingsErr('')
        showToast('Settings saved', guild.name, 'res')
      }
      return (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
          <div className={s.gldForm}>
            <div className={s.gldLabel} style={{fontSize:11,fontWeight:700,marginBottom:14,color:'var(--text)'}}>General Settings</div>
            <div className={s.gldFieldGroup}>
              <div className={s.gldLabel}>Guild Name</div>
              <input className={s.gldInput} value={gldSettingsName} onChange={e => setGldSettingsName(e.target.value)} maxLength={30} />
            </div>
            <div className={s.gldFieldGroup}>
              <div className={s.gldLabel}>Description</div>
              <textarea className={s.gldTextarea} value={gldSettingsDesc} onChange={e => setGldSettingsDesc(e.target.value)} maxLength={1000} rows={4} />
            </div>
            <div className={s.gldFieldGroup}>
              <div className={s.gldLabel}>Recruitment Status</div>
              <div className={s.gldRadioGroup}>
                {[['open','Open'],['invite_only','Invite Only'],['closed','Closed']].map(([val, lbl]) => (
                  <button key={val} className={`${s.gldRadioOpt} ${gldSettingsRecruit === val ? s.gldRadioOptActive : ''}`} onClick={() => setGldSettingsRecruit(val)}>{lbl}</button>
                ))}
              </div>
            </div>
            {gldSettingsErr && <div style={{color:'var(--red)',fontSize:11}}>{gldSettingsErr}</div>}
            <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(201,168,76,.15)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.3)',maxWidth:180}} onClick={doSave}>
              Save Changes
            </AnimBtn>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className={s.gldForm}>
              <div className={s.gldLabel} style={{fontSize:11,fontWeight:700,marginBottom:14,color:'var(--text)'}}>Pinned Announcement</div>
              <div style={{fontSize:10,color:'var(--muted)',marginBottom:10,lineHeight:1.55}}>Pin a message that appears at the top of the Overview tab for all members.</div>
              <textarea
                className={s.gldTextarea}
                value={gldPinDraft}
                onChange={e => setGldPinDraft(e.target.value)}
                placeholder={guild.pinnedAnnouncement || 'Write an announcement…'}
                maxLength={280}
                rows={4}
              />
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(201,168,76,.15)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.3)',fontSize:11}} onClick={() => { setPinnedAnnouncement(gldPinDraft); showToast('Announcement pinned', '', 'res') }}>
                  Pin Announcement
                </AnimBtn>
                {guild.pinnedAnnouncement && (
                  <AnimBtn className={s.ucardBtn} variant="strike" style={{background:'rgba(220,60,60,.1)',color:'var(--red)',border:'1px solid rgba(220,60,60,.25)',fontSize:11}} onClick={() => { setPinnedAnnouncement(''); setGldPinDraft(''); showToast('Announcement cleared', '', 'err') }}>
                    Clear
                  </AnimBtn>
                )}
              </div>
            </div>

            <div className={s.gldDangerZone}>
              <div className={s.gldDangerTitle}>Danger Zone</div>
              <div className={s.gldDangerRow}>
                <button className={s.gldDangerBtn} onClick={() => setGldConfirm({ title:'Disband Guild', desc:`Permanently disband "${guild.name}"? This cannot be undone. All members will be removed.`, onConfirm: () => { disbandGuild(); showToast('Guild disbanded', '', 'err') } })}>
                  Disband Guild
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Guild Charter modal */}
        {showCharter && (
          <div className={s.charterOverlay} onClick={() => setShowCharter(false)}>
            <div className={s.charterModal} onClick={e => e.stopPropagation()}>
              <div className={s.charterHero}>
                <img src={`/images/factions/${guildFaction}.jpg`} alt="" className={s.charterHeroImg} onError={e=>e.target.style.display='none'}/>
                <div className={s.charterHeroGrad}/>
                <div className={s.charterHeroContent}>
                  <FactionImage factionId={guildFaction} size={56}/>
                  <div>
                    <div style={{fontSize:22,fontWeight:900,color:'#fff',textShadow:'0 2px 10px rgba(0,0,0,.8)',lineHeight:1.1}}>{guild.name}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:4,display:'flex',gap:10,flexWrap:'wrap'}}>
                      <span>Est. {fmtDate(guild.createdAt)}</span>
                      <span>·</span>
                      <span>Led by <strong style={{color:'rgba(255,255,255,.75)'}}>{guild.ownerName}</strong></span>
                      <span>·</span>
                      {recruitBadge(guild.recruitmentStatus)}
                    </div>
                  </div>
                </div>
                <button className={s.charterClose} onClick={() => setShowCharter(false)}>✕</button>
              </div>

              <div className={s.charterBody}>
                <section className={s.charterSection}>
                  <div className={s.charterSectionTitle}><IconBook size={14}/> About This Guild</div>
                  <p className={s.charterText}>{guild.description || <em style={{color:'var(--muted)'}}>No description set.</em>}</p>
                </section>

                <div className={s.charterDivider}/>

                <section className={s.charterSection}>
                  <div className={s.charterSectionTitle}><IconShieldBolt size={14}/> Guild Rules & Guidelines</div>
                  {guild.guidelines
                    ? <div className={s.charterRules}>
                        {guild.guidelines.split('\n').filter(Boolean).map((line, i) => (
                          <div key={i} className={s.charterRule}>
                            <span className={s.charterRuleNum}>{i + 1}</span>
                            <span className={s.charterRuleText}>{line}</span>
                          </div>
                        ))}
                      </div>
                    : <div style={{color:'var(--muted)',fontSize:11,fontStyle:'italic'}}>No guidelines have been set by the guild owner yet.</div>
                  }
                </section>

                <div className={s.charterDivider}/>

                <section className={s.charterSection}>
                  <div className={s.charterSectionTitle}><IconTrophy size={14}/> Guild Stats</div>
                  <div className={s.charterStatsGrid}>
                    <div className={s.charterStat}><div className={s.charterStatVal}>Lv.{guild.level}</div><div className={s.charterStatLbl}>Guild Level</div></div>
                    <div className={s.charterStat}><div className={s.charterStatVal}>{memberCount}</div><div className={s.charterStatLbl}>Members</div></div>
                    <div className={s.charterStat}><div className={s.charterStatVal}>{guild.treasury.toLocaleString()}g</div><div className={s.charterStatLbl}>Treasury</div></div>
                    <div className={s.charterStat}><div className={s.charterStatVal}>{Object.values(purchasedPerks).reduce((a,v)=>a+v,0)}</div><div className={s.charterStatLbl}>Perks Unlocked</div></div>
                  </div>
                </section>

                {isOwner && (
                  <>
                    <div className={s.charterDivider}/>
                    <section className={s.charterSection}>
                      <div className={s.charterSectionTitle} style={{marginBottom:10}}>Edit Guidelines <span style={{fontSize:9,color:'var(--muted)',fontWeight:400}}>(owner only)</span></div>
                      <textarea
                        className={s.gldTextarea}
                        rows={6}
                        placeholder={'One rule per line, e.g.:\nBe respectful to all members\nDonate to treasury weekly\nParticipate in guild events'}
                        value={gldGuidesDraft || guild.guidelines}
                        onChange={e => setGldGuidesDraft(e.target.value)}
                      />
                      <AnimBtn className={s.ucardBtn} variant="strike" style={{marginTop:10,background:'rgba(201,168,76,.15)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.3)',fontSize:11}} onClick={() => { setGuildGuidelines(gldGuidesDraft || guild.guidelines); showToast('Guidelines saved', '', 'res') }}>
                        Save Guidelines
                      </AnimBtn>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm dialog */}
        {gldConfirm && (
          <div className={s.gldConfirmOverlay} onClick={() => setGldConfirm(null)}>
            <div className={s.gldConfirmBox} onClick={e => e.stopPropagation()}>
              <div className={s.gldConfirmTitle}>{gldConfirm.title}</div>
              <div className={s.gldConfirmDesc}>{gldConfirm.desc}</div>
              <div className={s.gldConfirmBtns}>
                <button className={s.gldDangerBtn} onClick={() => { gldConfirm.onConfirm(); setGldConfirm(null) }}>Confirm</button>
                <button className={s.gldActBtn} style={{padding:'8px 18px'}} onClick={() => setGldConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Guild header banner */}
        <div className={s.gldBanner}>
          {/* Scenic backdrop */}
          <img src={`/images/factions/${guildFaction}.jpg`} alt="" className={s.gldBannerImg} onError={e=>e.target.style.display='none'}/>
          <div className={s.gldBannerGrad}/>

          {/* Main content — sits over the backdrop */}
          <div className={s.gldBannerContent}>

            {/* Left: crest + identity */}
            <div className={s.gldBannerLeft}>
              <div className={s.gldBannerCrestWrap}>
                <FactionImage factionId={guildFaction} size={64}/>
              </div>
              <div className={s.gldBannerIdentity}>
                <div className={s.gldBannerName}>{guild.name}</div>
                <div className={s.gldBannerMeta}>
                  {recruitBadge(guild.recruitmentStatus)}
                  <span className={s.gldBannerMetaItem}><IconCrown size={10}/> {guild.ownerName}</span>
                  <span className={s.gldBannerMetaItem}><IconCalendarEvent size={10}/> {fmtDate(guild.createdAt)}</span>
                </div>
                {/* XP bar */}
                <div className={s.gldBannerXpRow}>
                  <div className={s.gldBannerXpTrack}>
                    <div className={s.gldBannerXpFill} style={{width:`${xpPct}%`}}/>
                    <span className={s.gldBannerXpLabel}>Lv.{guild.level}</span>
                  </div>
                  <span className={s.gldBannerXpNum}>{guild.xp.toLocaleString()} / {guild.xpNext.toLocaleString()} XP</span>
                </div>
              </div>
            </div>

            {/* Right: stat pills */}
            <div className={s.gldBannerStats}>
              {[
                { key:'members',  Icon:IconUsers,      val:memberCount,                                          lbl:'Members',  tip:'Active members contribute treasury gold, XP, and battle wins. More members = faster guild growth.' },
                { key:'treasury', Icon:IconPigMoney,   val:`${(guild.treasury/1000).toFixed(1)}k`,              lbl:'Treasury', tip:'Spend guild gold on perks that benefit every member — XP boosts, gold sharing, combat bonuses, and more.' },
                { key:'perks',    Icon:IconSparkles,   val:Object.values(purchasedPerks).reduce((a,v)=>a+v,0),  lbl:'Perks',    tip:'Each unlocked perk provides a permanent bonus to all guild members. Upgrade perks for stronger effects.' },
              ].map(bs => (
                <div key={bs.key} className={s.gldBannerStat}
                  onMouseEnter={() => setBannerTip(bs.key)}
                  onMouseLeave={() => setBannerTip(null)}>
                  <bs.Icon size={15} className={s.gldBannerStatIcon}/>
                  <div className={s.gldBannerStatVal}>{bs.val}</div>
                  <div className={s.gldBannerStatLbl}>{bs.lbl}</div>
                  {bannerTip === bs.key && (
                    <div className={s.bannerTip}>{bs.tip}</div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Tab bar */}
        <div className={s.gldTabs}>
          {tabItems.map(t => (
            <button key={t.id} className={`${s.gldTab} ${guildTab===t.id?s.gldTabActive:''}`} onClick={() => setGuildTab(t.id)}>
              <t.Icon size={13} style={{marginRight:5,verticalAlign:'middle'}}/>{t.label}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button className={s.gldCharterBtn} onClick={() => setShowCharter(true)}>
            <IconBook size={13}/> Guild Charter
          </button>
          {!isOwner && (
            <button className={`${s.gldTab}`} style={{color:'var(--red)'}} onClick={() => setGldConfirm({ title:'Leave Guild', desc:`Leave "${guild.name}"? You can rejoin later if there is space.`, onConfirm: () => { leaveGuild(); showToast('Left guild', '', 'err') } })}>
              Leave Guild
            </button>
          )}
        </div>

        {guildTab === 'overview'  && renderOverview()}
        {guildTab === 'members'   && renderMembers()}
        {guildTab === 'chat'      && renderChat()}
        {guildTab === 'events'    && renderEvents()}
        {guildTab === 'treasury'  && renderTreasury()}
        {guildTab === 'perks'     && renderPerks()}
        {guildTab === 'settings'  && isOwner && renderSettings()}
      </div>
    )
  }

  const [scrollToMe, setScrollToMe]   = useState(false)
  const [scrollToBt, setScrollToBt]   = useState(false)

  // ── Welcome flow state ───────────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(false)
  const [showTour,    setShowTour]    = useState(false)

  // Trigger welcome modal on first-ever faction selection
  useEffect(() => {
    if (!player?.email || !player?.faction || !gs) return
    const key = `rog-welcomed-${player.email}`
    if (!localStorage.getItem(key)) {
      setShowWelcome(true)
    }
  }, [player?.faction])

  const handleStartTour = () => {
    if (player?.email) localStorage.setItem(`rog-welcomed-${player.email}`, '1')
    setShowWelcome(false)
    setShowTour(true)
  }
  const handleSkipTour = () => {
    if (player?.email) localStorage.setItem(`rog-welcomed-${player.email}`, '1')
    setShowWelcome(false)
    setShowTour(false)
  }
  const handleTourComplete = () => setShowTour(false)

  // ── Guild local state ────────────────────────────────────────────────────
  const [guildView, setGuildView]         = useState('landing')   // landing|create|search|invites
  const [guildTab, setGuildTab]           = useState('overview')  // overview|members|chat|events|treasury|settings
  const [gldSearch, setGldSearch]         = useState('')
  const [gldChatInput, setGldChatInput]   = useState('')
  const [gldDeposit, setGldDeposit]       = useState('')
  const [gldCreateName, setGldCreateName] = useState('')
  const [gldCreateDesc, setGldCreateDesc] = useState('')
  const [gldCreateErr, setGldCreateErr]   = useState('')
  const [gldSettingsName, setGldSettingsName]         = useState('')
  const [gldSettingsDesc, setGldSettingsDesc]         = useState('')
  const [gldSettingsRecruit, setGldSettingsRecruit]   = useState('open')
  const [gldSettingsErr, setGldSettingsErr]           = useState('')
  const [gldInviteQuery, setGldInviteQuery]           = useState('')
  const [gldInviteResults, setGldInviteResults]       = useState([])
  const [gldEventsState, setGldEventsState]           = useState({})  // {[eventId]: {registered}}
  const [gldConfirm, setGldConfirm]                   = useState(null) // {title, desc, onConfirm}
  const [gldMemberSort, setGldMemberSort]             = useState('role') // role|power|xp|gold
  const [gldPinEdit, setGldPinEdit]                   = useState(false)
  const [gldPinDraft, setGldPinDraft]                 = useState('')
  const [showCharter, setShowCharter]                 = useState(false)
  const [gldGuidesDraft, setGldGuidesDraft]           = useState('')
  const [bannerTip, setBannerTip]                     = useState(null)
  const guildChatRef = useRef(null)

  const loadRankings = async (pageSize = rkPageSize) => {
    const [data, targetsData] = await Promise.all([fetchRankings(), fetchTargets()])
    setRankings(data)
    setTargets(targetsData)
    setTargetsLoaded(true)

    const sorted = [...data].sort((a,b)=>(b.power||0)-(a.power||0))
    const myAbsIdx = sorted.findIndex(r => r._id === player?._id)
    if (myAbsIdx >= 0) {
      const winStart = Math.max(0, myAbsIdx - 200)
      const posInWindow = myAbsIdx - winStart
      setRkPage(Math.floor(posInWindow / pageSize))
      setScrollToMe(true)
    }

    // Battle table draws from the dedicated proximity feed (fetchTargets),
    // which is centered on our own power by construction — so "my
    // neighbour position" just means where our power sits among the
    // opponents actually returned, no dependency on finding ourselves in
    // the (possibly capped) rankings list.
    const btSorted = [...targetsData].sort((a,b)=>(b.power||0)-(a.power||0))
    const myPower  = player?.power || 0
    const anchorIdx = btSorted.findIndex(r => (r.power||0) <= myPower)
    const anchor    = anchorIdx >= 0 ? anchorIdx : Math.floor(btSorted.length / 2)
    setBtPage(Math.floor(anchor / btPageSize))
    setScrollToBt(true)
  }

  useEffect(() => {
    if (panel === 'rankings' || panel === 'battle') loadRankings()
  }, [panel])

  // Scroll rankings player row to top
  useEffect(() => {
    if (!scrollToMe) return
    setScrollToMe(false)
    requestAnimationFrame(() => {
      if (!myRowRef.current || !rkScrollRef.current) return
      const rowRect = myRowRef.current.getBoundingClientRect()
      const containerRect = rkScrollRef.current.getBoundingClientRect()
      rkScrollRef.current.scrollTop += rowRect.top - containerRect.top
    })
  }, [scrollToMe])

  // Scroll battle table to nearest opponent
  useEffect(() => {
    if (!scrollToBt) return
    setScrollToBt(false)
    requestAnimationFrame(() => {
      if (!btMyRowRef.current || !btScrollRef.current) return
      const rowRect = btMyRowRef.current.getBoundingClientRect()
      const containerRect = btScrollRef.current.getBoundingClientRect()
      btScrollRef.current.scrollTop += rowRect.top - containerRect.top
    })
  }, [scrollToBt])

  // Auto-scroll guild chat to bottom on new message
  useEffect(() => {
    if (guildChatRef.current) guildChatRef.current.scrollTop = guildChatRef.current.scrollHeight
  }, [guild?.chat?.length])

  // Init settings form when tab opens
  useEffect(() => {
    if (guildTab === 'settings' && guild) {
      setGldSettingsName(guild.name)
      setGldSettingsDesc(guild.description)
      setGldSettingsRecruit(guild.recruitmentStatus)
      setGldSettingsErr('')
    }
  }, [guildTab])

  // Auction countdown ticker
  useEffect(() => {
    if (panel !== 'auction') return
    const id = setInterval(() => setAuctionTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [panel])

  // Auto-refresh auction when timer expires
  useEffect(() => {
    if (panel !== 'auction' || !gs) return
    if (gs.auctionRefreshAt > 0 && Date.now() >= gs.auctionRefreshAt) {
      refreshAuction(false)
    }
  }, [auctionTick, panel])

  // ── Panels ───────────────────────────────────────────────────────────────
  const renderPanel = () => {
    if (!f) return <div className={s.empty}><IconHome size={40} opacity={0.2} /><p>Loading…</p></div>

    if (panel === 'overview') {
      return (
        <div>
          <div className={s.ph}><div className={s.ptitle}>{f.name} Awakens</div><div className={s.pdesc}>Expand your domain, build your economy, and crush your rivals.</div></div>
          {eco.goldNet < 0 && <div className={s.alertBox}><IconAlertTriangle size={14} /><span>Gold deficit — your upkeep exceeds income. Build more structures or reduce army.</span></div>}
          {eco.manaNet < 0 && <div className={s.alertBox}><IconAlertTriangle size={14} /><span>Mana deficit — higher-tier units consume heavy mana.</span></div>}
          {eco.freeLand < 10 && land > 0 && <div className={s.alertBox}><IconAlertTriangle size={14} /><span>Low free land — only {eco.freeLand} acres available. Explore to claim more territory.</span></div>}

          <div className={s.ovColumns}>
            {/* Left: stat widgets + quick actions */}
            <div className={s.ovLeft}>
              <div className={s.ovStatGrid}>
                <Stat imageId="free-land"  icon={<IconMap/>}            label="Free Land"  value={eco.freeLand}          sub={`${eco.usedLand} built / ${land} total`} subColor={eco.freeLand < 10 ? 'var(--red)' : 'var(--muted)'} />
                <Stat imageId="gold"       icon={<IconCoin/>}           label="Gold"       value={gold.toLocaleString()} sub={`${eco.goldNet >= 0 ? '+' : ''}${eco.goldNet}/hr`} subColor={eco.goldNet >= 0 ? 'var(--green)' : 'var(--red)'} color="var(--gold)" />
                <Stat imageId="mana"       icon={<IconSparkles/>}       label="Mana"       value={mana.toLocaleString()} sub={`${eco.manaNet >= 0 ? '+' : ''}${eco.manaNet}/hr`} subColor={eco.manaNet >= 0 ? 'var(--green)' : 'var(--red)'} color="var(--mana2)" />
                <Stat imageId="buildings"  icon={<IconBuildingCastle/>} label="Buildings"  value={totalBld} />
                <Stat imageId="army"       icon={<IconSword/>}          label="Army"       value={totalArmy} sub="units" />
              </div>
              <div className={s.sectionLabel}>Quick Actions</div>
              <div className={s.acGridCompact} data-tour="quick-actions">
                <ActionCard icon={<IconCompass size={30}/>}        color="var(--green)"  imageId="explore"   name="Explore Land"   cost="1 turn · +5g bonus"   desc="Scout territory to gain land and a turn-spend gold bonus."   onClick={() => setPanel('explore')} />
                <ActionCard icon={<IconBuildingCastle size={30}/>} color="var(--gold)"   imageId="construct" name="Construct"       cost="2–12 turns"            desc="Build structures to generate gold/mana per hour."           onClick={() => setPanel('build')} />
                <ActionCard icon={<IconSword size={30}/>}          color="var(--silver)" imageId="recruit"   name="Recruit Units"  cost="1 turn · gold + mana"  desc="Grow your army. 9 unit types with D&D stat blocks."         onClick={() => setPanel('recruit')} />
                <ActionCard icon={<IconShieldBolt size={30}/>}     color="var(--red)"    imageId="raid"      name="Raid & Plunder" cost="3 turns"                desc="Attack rivals for 15% of their gold and 10% of their mana." onClick={() => setPanel('battle')} />
              </div>
            </div>

            {/* Right: activity log */}
            <div className={s.ovRight}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div className={s.sectionLabel} style={{margin:0}}>Activity Log</div>
                <button onClick={clearLog} style={{fontSize:9,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',borderRadius:4,letterSpacing:.5}} onMouseEnter={e=>e.target.style.color='var(--red)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>Clear log</button>
              </div>
              <div className={`${s.feedBox} ${s.feedBoxFill}`} ref={logRef} data-tour="activity-log">
                {[...log].reverse().map((entry, i) =>
                  entry.type === 'battle'
                    ? <BattleCard key={i} entry={entry} defaultExpanded={i === 0} compact />
                    : <FeedEntry key={i} entry={entry} />
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (panel === 'explore') return (
      <div>
        <div className={s.ph}><div className={s.ptitle}>Explore New Lands</div><div className={s.pdesc}>Spend turns to claim territory, or send out a trade run for gold and mana instead.</div></div>
        <div className={s.resRow}>
          <Stat imageId="land"  folder="explore" icon={<IconMap/>}   label="Land"  value={land}                  sub={`${eco.freeLand} free`} subColor={eco.freeLand < 10 ? 'var(--red)' : 'var(--muted)'} />
          <Stat imageId="turns" folder="explore" icon={<IconClock/>} label="Turns" value={turns}                 sub={`+1 in ${mLeft}:${sLeft}`} color="var(--green)" />
          <Stat imageId="gold"  folder="explore" icon={<IconCoin/>}  label="Gold"  value={gold.toLocaleString()} color="var(--gold)" />
        </div>

        <div className={s.exploreCategoryRow}>
          <div>
            <div className={s.sectionLabel} style={{marginTop:2}}>Territory — claim acres</div>
            <div className={s.ucardGrid}>
              <ExploreCard icon={<IconCompass size={52} color="var(--green)" opacity={0.65}/>}   heroBg="rgba(109,204,170,0.08)" fc="var(--green)" imageId="scout-party"    name="Scout Party"    turnCost={1} goldBonus={5}  manaBonus={0}  desc="Claim 5–15 acres with a light scouting force." blockMsg={turns < 1  ? `Need ${1  - turns} more turns` : null} onClick={() => doExplore('scout', 'Scout Party')} disabled={turns < 1  || loading} />
              <ExploreCard icon={<IconMapSearch size={52} color="var(--green)" opacity={0.65}/>} heroBg="rgba(109,204,170,0.13)" fc="var(--green)" imageId="expedition"      name="Expedition"     turnCost={3} goldBonus={20} manaBonus={0}  desc="Send a full expedition to claim 20–50 acres." blockMsg={turns < 3  ? `Need ${3  - turns} more turns` : null} onClick={() => doExplore('expedition', 'Expedition')} disabled={turns < 3  || loading} />
              <ExploreCard icon={<IconWorld size={52}   color="var(--gold)"  opacity={0.65}/>}   heroBg="rgba(201,168,76,0.08)"  fc="var(--gold)"  imageId="grand-conquest" name="Grand Conquest" turnCost={8} goldBonus={60} manaBonus={20} desc="A major campaign claiming 80–150 acres with gold and mana spoils." blockMsg={turns < 8 ? `Need ${8 - turns} more turns` : null} onClick={() => doExplore('conquest', 'Grand Conquest')} disabled={turns < 8 || loading} />
            </div>
          </div>

          <div>
            <div className={s.sectionLabel} style={{marginTop:2}}>Fortune — gold &amp; mana, no acres</div>
            <div className={s.ucardGrid}>
              <ResourceExploreCard tierKey="peddler"  icon={<IconBackpack size={52} color="var(--green)" opacity={0.65}/>} fc="var(--green)" imageId="peddlers-cart"   name="Peddler's Cart"   turnCost={1} preview={gs?.resourceTiers?.peddler}  desc="A quick, low-risk trade run — small but reliable gold and mana, with a rare chance of a stray item." onClick={() => doExplore('peddler', "Peddler's Cart")} disabled={turns < 1 || loading} blockMsg={turns < 1 ? `Need ${1 - turns} more turns` : null} />
              <ResourceExploreCard tierKey="smuggler" icon={<IconTruck size={52}    color="var(--gold)"  opacity={0.65}/>} fc="var(--gold)"  imageId="smugglers-route" name="Smuggler's Route" turnCost={3} preview={gs?.resourceTiers?.smuggler} desc="A riskier back-road run through bandit country — bigger hauls, and better odds of turning up a usable item." onClick={() => doExplore('smuggler', "Smuggler's Route")} disabled={turns < 3 || loading} blockMsg={turns < 3 ? `Need ${3 - turns} more turns` : null} />
              <ResourceExploreCard tierKey="caravan"  icon={<IconWorld size={52}   color="var(--gold)"  opacity={0.65}/>} fc="var(--gold)"  imageId="grand-caravan"   name="Grand Caravan"    turnCost={8} preview={gs?.resourceTiers?.caravan}  desc="A full merchant caravan with an armed escort — the biggest resource haul, and the best shot at finding a real item." onClick={() => doExplore('caravan', 'Grand Caravan')} disabled={turns < 8 || loading} blockMsg={turns < 8 ? `Need ${8 - turns} more turns` : null} />
            </div>
          </div>
        </div>

        {exploreResult && (
          <div className={s.exploreResult}>
            <div className={s.erHead}>
              {exploreResult.acres > 0
                ? <><IconCompass size={18} color="var(--green)"/><span>Scouts claimed {exploreResult.acres} acres!</span></>
                : <><IconTruck size={18} color="var(--gold)"/><span>Trade run complete!</span></>}
            </div>
            <div className={s.erSub}>
              {exploreResult.goldBonus ? `+${exploreResult.goldBonus} gold` : ''}
              {exploreResult.manaBonus > 0 ? `${exploreResult.goldBonus ? ', ' : ''}+${exploreResult.manaBonus} mana` : ''}
              {exploreResult.acres > 0 ? `. Land now generating +${Math.round(land*1.5)} gold/hr.` : '.'}
              {exploreResult.foundItem ? ` Found an item: ${exploreResult.foundItem.name}!` : ''}
            </div>
          </div>
        )}
      </div>
    )

    if (panel === 'build') {
      if (!land) return <div className={s.empty}><IconMap size={40} opacity={0.2}/><p className={s.emptyT}>No land claimed yet</p><p className={s.emptyS}>Explore land first before building.</p></div>
      const milBuildings  = f.buildings.filter(b => b.category === 'military')
      const resBuildings  = f.buildings.filter(b => b.category === 'resource')
      const renderBldCard = (b, accent) => {
        const count  = gs?.buildings?.[b.id] || 0
        const lvl    = count  // alias — military halls use this as upgrade level
        const trainedUnit = b.unitId ? f.units.find(u => u.id === b.unitId) : null
        const nextStats = trainedUnit ? scaledStats(trainedUnit, lvl + 1) : null
        const curStats  = trainedUnit ? scaledStats(trainedUnit, lvl)     : null

        if (b.stackable) {
          // ── Stackable resource building ────────────────────────────────────
          const isGold   = !!b.goldPerBld
          const perBld   = b.goldPerBld || b.manaPerBld || 0
          const resource = isGold ? 'gold' : 'mana'
          const resColor = isGold ? 'var(--gold)' : 'var(--mana2)'
          // Cost per batch action (2-5 structures; show estimated range)
          const batchMin = 2, batchMax = 5
          const landPer  = b.landCost || 0
          const minLandNeeded = batchMin * landPer
          // next building cost at current stack level
          const nextGold = scaledCost(b.goldCost, count)
          const nextMana = scaledCost(b.manaCost, count)
          // min batch cost = sum of next 2 buildings
          const minBatchGold = nextGold + scaledCost(b.goldCost, count + 1)
          const minBatchMana = nextMana + scaledCost(b.manaCost, count + 1)
          const canAff   = gold >= minBatchGold && mana >= minBatchMana
                        && turns >= b.turns && eco.freeLand >= minLandNeeded
          const bldBlock = eco.freeLand < minLandNeeded ? `Need ${minLandNeeded - eco.freeLand} more free acres`
            : gold  < minBatchGold                      ? `Need ${minBatchGold - gold}g more gold`
            : mana  < minBatchMana                      ? `Need ${minBatchMana - mana}m more mana`
            : turns < b.turns                           ? `Need ${b.turns - turns} more turns`
            : null
          return (
            <div key={b.id} className={s.ucard} style={{ '--fc': accent }}>
              <div className={s.ucardHero}>
                <ResourceBuildingImg isGold={isGold} accent={accent} size={120} />
                <div className={s.ucardHeroOverlay} style={{background:'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)'}} />
                <div className={s.ucardTopRow}>
                  <span className={s.ucardTier} style={count > 0 ? {background:accent+'22',color:accent,border:`1px solid ${accent}44`} : {}}>
                    {count} built
                  </span>
                </div>
                <div className={s.ucardNameRow}>
                  <span className={s.ucardName}>{b.name}</span>
                  <span className={s.ucardRole} style={{background:accent+'33',color:accent}}>Resource</span>
                </div>
              </div>
              <div className={s.ucardBody}>
                {/* Generation summary */}
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'rgba(255,255,255,.04)',borderRadius:5,marginBottom:8}}>
                  <span style={{fontSize:11,color:resColor,fontWeight:600}}>{count > 0 ? `+${count * perBld}` : '—'}</span>
                  <span style={{fontSize:9.5,color:'var(--muted)'}}>{resource}/turn from {count} structure{count !== 1 ? 's' : ''}</span>
                </div>
                <div className={s.ucardDescWrap}><div className={s.ucardDesc} style={{fontSize:10, color:'var(--muted)', lineHeight:1.5}}>{b.desc}</div><div className={s.ucardDescTooltip}>{b.desc}</div></div>
                <div className={s.ucardCost} style={{marginTop:6}}>
                  <span style={{color:'var(--gold)'}}><IconCoin size={10}/> {nextGold}g+</span>
                  <span style={{color:'var(--mana2)'}}><IconSparkles size={10}/> {nextMana}m+</span>
                  <span style={{color:'var(--green)'}}><IconClock size={10}/> {b.turns}t</span>
                  <span style={{color: eco.freeLand >= minLandNeeded ? 'var(--silver)' : 'var(--red)'}}><IconMap size={10}/> {landPer} ac/bld</span>
                </div>
              </div>
              <div className={s.ucardFoot}>
                {bldBlock && <div className={s.blockReason} style={{marginBottom:8}}>{bldBlock}</div>}
                <AnimBtn className={s.ucardBtn} variant="strike"
                  style={{background:accent+'18',color:accent,border:`1px solid ${accent}44`}}
                  onClick={() => doBuild(b.id)} disabled={!canAff || loading}>
                  <AnimatedIcon><IconHammer size={12}/></AnimatedIcon> Build Batch
                </AnimBtn>
              </div>
            </div>
          )
        }

        // ── Military hall (non-stackable, upgradeable) ───────────────────────
        const maxLvl = 3
        const needsLand = lvl === 0 && (b.landCost || 0) > 0
        const upgradeMult = lvl === 0 ? 1 : lvl === 1 ? 3 : 7
        const upgradeTurns = lvl === 0 ? 1 : lvl === 1 ? 2 : 3
        const actualGoldCost = Math.round(b.goldCost * upgradeMult)
        const actualManaCost = Math.round(b.manaCost * upgradeMult)
        const actualTurnCost = b.turns * upgradeTurns
        // Sequential gate: each hall requires the previous unit's hall in faction order
        const unitIdx = b.unitId ? f.units.findIndex(u => u.id === b.unitId) : -1
        const prereqUnit = unitIdx > 0 ? f.units[unitIdx - 1] : null
        const prereqHallId = prereqUnit ? `${prereqUnit.id}_hall` : null
        const prereqBld = prereqHallId ? f.buildings.find(x => x.id === prereqHallId) : null
        const prereqLevel = prereqHallId ? (gs?.buildings?.[prereqHallId] || 0) : 99
        const requiredLevel = unitIdx >= 4 ? 2 : 1
        const hasPrevTier = !prereqHallId || prereqLevel >= requiredLevel
        const prereqName = prereqBld?.name || (prereqUnit ? `${prereqUnit.name} Hall` : '')
        const prevTierGate = `Requires ${prereqName}${requiredLevel === 2 ? ' at Level 2' : ''} first`
        const isLocked = !hasPrevTier
        const canAff = hasPrevTier && gold >= actualGoldCost && mana >= actualManaCost && turns >= actualTurnCost && (!needsLand || eco.freeLand >= b.landCost)
        const bldBlock = lvl >= maxLvl ? null
          : !hasPrevTier ? prevTierGate
          : needsLand && eco.freeLand < b.landCost ? `Need ${b.landCost - eco.freeLand} more free acres`
          : gold  < actualGoldCost ? `Need ${actualGoldCost - gold}g more gold`
          : mana  < actualManaCost ? `Need ${actualManaCost - mana}m more mana`
          : turns < actualTurnCost ? `Need ${actualTurnCost - turns} more turns`
          : null
        const lvlLabel = lvl >= maxLvl ? 'Max Lv' : lvl > 0 ? `Lv ${lvl}/${maxLvl}` : 'Unbuilt'
        return (
          <div key={b.id} className={s.ucard} style={{ '--fc': accent, opacity: isLocked ? 0.42 : 1, filter: isLocked ? 'grayscale(0.55)' : 'none', transition: 'opacity .2s, filter .2s' }}>
            <div className={s.ucardHero}>
              {trainedUnit
                ? <UnitPortrait unitId={trainedUnit.id} artType={trainedUnit.artType} factionColor={accent} size={120} />
                : <div style={{width:'100%',height:'100%',background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <FI name={b.icon} size={44} color={accent}/>
                  </div>
              }
              <div className={s.ucardHeroOverlay} style={{background:'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)'}} />
              <div className={s.ucardTopRow}>
                <span className={s.ucardTier}>{lvlLabel}</span>
              </div>
              <div className={s.ucardNameRow}>
                <span className={s.ucardName}>{b.name}</span>
                <span className={s.ucardRole} style={{background: accent+'33', color: accent}}>Military</span>
              </div>
            </div>
            <div className={s.ucardBody}>
              {trainedUnit && (
                <div style={{fontSize:9.5, color:'var(--silver)'}}>
                  Trains: <span style={{color: accent}}>{trainedUnit.name}</span>
                  {lvl > 0 && nextStats && (
                    <span className={s.bstatboost}> · Lv.{lvl+1}: ATK {curStats.atk}→<strong>{nextStats.atk}</strong> · DEF {curStats.def}→<strong>{nextStats.def}</strong></span>
                  )}
                </div>
              )}
              <div className={s.ucardDescWrap}><div className={s.ucardDesc} style={{fontSize:10, color:'var(--muted)', lineHeight:1.55}}>{b.desc}</div><div className={s.ucardDescTooltip}>{b.desc}</div></div>
              <div className={s.ucardCost}>
                <span style={{color:'var(--gold)'}}><IconCoin size={10}/> {actualGoldCost.toLocaleString()}g</span>
                <span style={{color:'var(--mana2)'}}><IconSparkles size={10}/> {actualManaCost.toLocaleString()}m</span>
                <span style={{color:'var(--green)'}}><IconClock size={10}/> {actualTurnCost}t</span>
                {lvl === 0 && b.landCost && <span style={{color: eco.freeLand >= b.landCost ? 'var(--silver)' : 'var(--red)'}}><IconMap size={10}/> {b.landCost} ac</span>}
              </div>
            </div>
            <div className={s.ucardFoot}>
              {bldBlock && <div className={s.blockReason} style={{marginBottom:8}}>{bldBlock}</div>}
              <AnimBtn className={s.ucardBtn} variant={lvl > 0 ? 'slideUp' : 'strike'}
                style={{background: accent+'18', color: accent, border: `1px solid ${accent}44`}}
                onClick={() => doBuild(b.id)} disabled={!canAff || loading || lvl >= maxLvl}>
                {lvl >= maxLvl
                  ? '✓ Max Level'
                  : lvl > 0
                    ? <><AnimatedIcon><IconArrowUp size={12}/></AnimatedIcon> Upgrade (Lv.{lvl+1})</>
                    : <><AnimatedIcon><IconHammer size={12}/></AnimatedIcon> Construct</>}
              </AnimBtn>
            </div>
          </div>
        )
      }
      return (
        <div>
          <div className={s.ph} style={{marginBottom:10}}><div className={s.ptitle}>Construction</div><div className={s.pdesc}>Build military structures to unlock unit tiers, or raise resource structures to boost income.</div></div>
          <div className={s.bldSplit}>
            <div className={s.bldSplitMil}>
              <div className={s.sectionLabel} style={{marginTop:0}}>Military Buildings</div>
              <div className={s.bldMil5Grid}>
                {milBuildings.map(b => renderBldCard(b, f.color))}
              </div>
            </div>
            <div className={s.bldSplitRes}>
              <div className={s.sectionLabel} style={{marginTop:0}}>Resource Buildings</div>
              <div className={s.bldResCol}>
                {resBuildings.map(b => renderBldCard(b, (b.goldRate?.[1] || 0) > 0 ? '#c9a84c' : '#a89cf0'))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (panel === 'recruit') {
      const hasBuilding = gs?.buildings && Object.values(gs.buildings).some(v => v > 0)
      if (!hasBuilding) return <div className={s.empty}><IconBuildingCastle size={40} opacity={0.2}/><p className={s.emptyT}>No buildings yet</p><p className={s.emptyS}>Build a unit hall to unlock recruitment.</p></div>
      return (
        <div className={s.recruitPageWrap}>
          <div className={s.ph} style={{marginBottom:10}}><div className={s.ptitle}>Recruit Units</div><div className={s.pdesc}>Each unit requires its own hall. Upgrade the hall to boost ATK & DEF. Mix tiers for army synergy.</div></div>
          <div className={s.ucardGrid}>
            {f.units.map(u => {
              const bldLvl   = gs?.buildings?.[u.req] || 0
              const reqBuilt = bldLvl > 0
              const cnt      = gs?.army?.[u.id] || 0
              const ss       = scaledStats(u, bldLvl)
              const hallName = f.buildings.find(b => b.id === u.req)?.name || u.req
              const recruitBlock = !reqBuilt ? `Build ${hallName}`
                : gold  < u.goldCost * 5 ? `Need ${u.goldCost*5 - gold}g`
                : mana  < u.manaCost * 5 ? `Need ${u.manaCost*5 - mana}m`
                : turns < 1              ? 'No turns left'
                : null
              return (
                <div key={u.id} className={s.ucard} style={{ '--fc': f.color, opacity: reqBuilt ? 1 : 0.5 }}>

                  {/* ── Hero image ── */}
                  <div className={s.ucardHero}>
                    <UnitPortrait unitId={u.id} artType={u.artType} factionColor={f.color} size={120} />
                    <div className={s.ucardHeroOverlay} style={{ background: `linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)` }} />
                    {/* Top badges */}
                    <div className={s.ucardTopRow}>
                      <span className={s.ucardTier} style={{ background: f.color + '22', color: f.color, border: `1px solid ${f.color}44` }}>{TIER_LABEL[u.tier]}</span>
                      {cnt > 0 && <span className={s.ucardCount} style={{ color: f.color }}>×{cnt}</span>}
                    </div>
                    {/* Name overlay */}
                    <div className={s.ucardNameRow}>
                      <span className={s.ucardName}>{u.name}</span>
                      <span className={s.ucardRole} style={{ background: ROLE_COLOR[u.role]+'33', color: ROLE_COLOR[u.role] }}>{u.role}</span>
                    </div>
                  </div>

                  {/* ── Stats ── */}
                  <div className={s.ucardBody}>
                    <div className={s.ucardStatGrid}>
                      <div className={s.ucardStat}><span className={s.ucardStatVal} style={{color:'var(--red)'}}>{ss.atk}</span><span className={s.ucardStatLbl}>ATK</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal} style={{color:'var(--green)'}}>{ss.def}</span><span className={s.ucardStatLbl}>DEF</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal}>{ss.power}</span><span className={s.ucardStatLbl}>PWR</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal}>{u.spd}</span><span className={s.ucardStatLbl}>SPD</span></div>
                    </div>

                    {bldLvl > 0 && <div className={s.ucardHallBadge} style={{color: f.color}}>Hall Lv.{bldLvl} — stats boosted</div>}

                    {/* Matchups */}
                    {(u.strongVs?.length || u.weakVs?.length) && (
                      <div className={s.ucardMatchups}>
                        {u.strongVs?.map(t => <span key={t} className={s.advBadge}>⚔ {TYPE_LABEL[t]||t}</span>)}
                        {u.weakVs?.map(t  => <span key={t} className={s.disBadge}>↓ {TYPE_LABEL[t]||t}</span>)}
                      </div>
                    )}

                    {/* Cost row */}
                    <div className={s.ucardCost}>
                      <span style={{color:'var(--gold)'}}><IconCoin size={10}/> {u.goldCost}g</span>
                      <span style={{color:'var(--mana2)'}}><IconSparkles size={10}/> {u.manaCost}m</span>
                      <span style={{color:'var(--muted)'}}>per unit · 1 turn</span>
                    </div>
                  </div>

                  {/* ── Action bar ── */}
                  <div className={s.ucardFoot}>
                    {recruitBlock
                      ? <div className={s.ucardBlocked}>{recruitBlock}</div>
                      : <AnimBtn className={s.ucardBtn} variant="pop" style={{ background: f.color + '18', color: f.color, border: `1px solid ${f.color}44` }} onClick={() => doRecruit(u.id)} disabled={loading}>
                          <AnimatedIcon><IconPlus size={12}/></AnimatedIcon> Recruit
                        </AnimBtn>
                    }
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (panel === 'battle') {
      // Global rank numbers (and medal coloring) still come from the full
      // rankings list, so "#1/#2/#3" means what it says — but WHO shows up
      // to fight comes from a dedicated proximity feed (fetchTargets) that
      // always returns real, attackable opponents closest to our own
      // power, regardless of whether our own rank happens to fall inside
      // the (size-capped) rankings list.
      const rankAbsIdxMap = new Map([...rankings].sort((a,b)=>(b.power||0)-(a.power||0)).map((r, i) => [r._id, i]))
      const myPower       = player?.power || 0
      const btEligible     = [...targets].sort((a,b)=>(b.power||0)-(a.power||0))
      const btTotalPages  = Math.ceil(btEligible.length / btPageSize)
      const safeBtPage    = Math.min(btPage, Math.max(0, btTotalPages - 1))
      const btPageRows    = btEligible.slice(safeBtPage * btPageSize, (safeBtPage + 1) * btPageSize)
      const medalColors   = ['#ffd700','#c0c0c0','#cd7f32']
      // anchor scroll ref to the first row at-or-below player's power
      const nearestInPage = btPageRows.find(r => (r.power||0) <= myPower) || btPageRows[0]
      const btMyPageInWindow = (() => {
        const anchor = btEligible.findIndex(r => (r.power||0) <= myPower)
        return Math.floor(Math.max(0, anchor) / btPageSize)
      })()
      const battleEntries = [...log].reverse().filter(l => l.type === 'battle')
      return (
        <div className={s.btPanel}>
          {/* ── Opponent table (top half) ── */}
          <div className={s.btTableSection}>
            <div className={s.ph} style={{marginBottom:8}}>
              <div className={s.ptitle}>Raid &amp; Battle</div>
              <div className={s.pdesc}>Attack the opponents closest to your power to plunder their treasury. Costs 3 turns.</div>
            </div>
            {!targetsLoaded && <div className={s.muted} role="status">Loading opponents…</div>}
            {targetsLoaded && btEligible.length === 0 && (
              <div className={s.muted} role="status">No opponents available right now — check back in a moment.</div>
            )}
            <div className={s.rkStickyTop}>
              <div className={s.rkPsz}>
                Rows:
                {[25,50,100].map(n => (
                  <button key={n} className={`${s.rkPszBtn} ${btPageSize===n ? s.rkPszActive : ''}`}
                    aria-pressed={btPageSize===n} aria-label={`Show ${n} rows per page`}
                    onClick={() => { setBtPageSize(n); setBtPage(0) }}>{n}</button>
                ))}
              </div>
              <button className={s.rkJumpBtn} onClick={() => { setBtPage(btMyPageInWindow); setScrollToBt(true) }}>↡ My rank</button>
              <div className={s.rkNav}>
                <button className={s.rkNavBtn} aria-label="First page" disabled={safeBtPage===0} onClick={() => setBtPage(0)}>«</button>
                <button className={s.rkNavBtn} aria-label="Previous page" disabled={safeBtPage===0} onClick={() => setBtPage(p=>Math.max(0,p-1))}>‹</button>
                <span className={s.rkPageInfo} aria-live="polite">Page {safeBtPage+1} / {btTotalPages}</span>
                <button className={s.rkNavBtn} aria-label="Next page" disabled={safeBtPage>=btTotalPages-1} onClick={() => setBtPage(p=>p+1)}>›</button>
                <button className={s.rkNavBtn} aria-label="Last page" disabled={safeBtPage>=btTotalPages-1} onClick={() => setBtPage(btTotalPages-1)}>»</button>
              </div>
            </div>
            <div className={s.rkScroll} ref={btScrollRef}>
              <div className={s.rkHeader}>
                <div className={s.rkHRank}>#</div>
                <div className={s.rkHFaction}>Faction</div>
                <div className={s.rkHName}>Player</div>
                <div className={s.rkHPow}>Power</div>
                <div className={s.rkHOdds}>Win %</div>
                <div className={s.rkHAct}>Action</div>
              </div>
              <div className={s.rklist}>
                {btPageRows.map(r => {
                  const absIdx  = rankAbsIdxMap.get(r._id)
                  const rf      = FACTIONS[r.faction] || { color: 'var(--muted)', name: 'Unknown' }
                  const myPow   = calcCombatPower(player?.faction, gs)
                  const tPow    = r.power || 1
                  const ratio   = myPow > 0 ? myPow / (myPow + tPow) : 0
                  const rowPct  = myPow > 0 ? Math.round(Math.min(0.95, Math.max(0.05, ratio)) * 100) : 0
                  const favored = rowPct >= 50
                  return (
                    <div key={r._id} ref={r === nearestInPage ? btMyRowRef : null} className={s.rkrow}>
                      <div className={s.rknum} style={{ color: medalColors[absIdx] || 'var(--muted)' }}>{Number.isInteger(absIdx) ? absIdx + 1 : '—'}</div>
                      <div className={s.rkFactionCol}><FactionImage factionId={r.faction} size={28} /></div>
                      <div className={s.rkInfo}>
                        <div className={s.rkname}>{r.name}</div>
                        <div className={s.rkfac} style={{ color: rf.color }}>{rf.name}</div>
                      </div>
                      <div className={s.rkpow}>{(r.power||0).toLocaleString()}</div>
                      <div className={s.raidOdds} style={{ color: favored ? 'var(--green)' : 'var(--red)' }}>
                        {rowPct}%
                      </div>
                      <AnimBtn className={`${s.ubtn} ${s.rkRaidBtn}`} variant="slash"
                        onClick={() => openBattleConfig(r._id)}
                        disabled={turns < 3 || !power || loading}>
                        <AnimatedIcon><IconSwords size={11}/></AnimatedIcon> Raid
                      </AnimBtn>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Battle log (bottom half) ── */}
          <div className={s.btLogSection}>
            <div className={s.btLogHeader}>
              <div className={s.sectionLabel} style={{margin:0}}>Battle Reports</div>
              {battleEntries.length > 0 && (
                <button onClick={clearLog} style={{fontSize:9,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',borderRadius:4,letterSpacing:.5}} onMouseEnter={e=>e.target.style.color='var(--red)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>Clear all</button>
              )}
            </div>
            <div className={s.btLogScroll}>
              {battleEntries.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {battleEntries.map((entry, i) => (
                    <BattleCard key={i} entry={entry} defaultExpanded={i === 0} />
                  ))}
                </div>
              ) : (
                <div className={s.noBattles}>
                  <IconSwords size={32} opacity={0.15}/>
                  <p>No battles fought yet.</p>
                  <p style={{fontSize:10,marginTop:2}}>Battle reports are kept for 48 hours.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (panel === 'mercs') {
      // Init listings on first visit or after refresh
      if (mercListings.length === 0 || Date.now() > mercRefreshAt) initMercListings()

      const msLeft    = Math.max(0, mercRefreshAt - Date.now())
      const hrsLeft   = Math.floor(msLeft / 3600000)
      const minLeft   = Math.floor((msLeft % 3600000) / 60000)
      const refreshCost = calcMercRefreshCost(gs?.goldPerTurn || 50)

      const TIER_LABEL = ['','T1','T2','T3','T4','T5']
      const CONTRACT_COLOR = { skirmisher: '#6dccaa', company: '#a89cf0', elite: '#ffd700' }
      const CONTRACT_ICON  = { skirmisher: <IconSword size={11}/>, company: <IconSwords size={11}/>, elite: <IconShieldBolt size={11}/> }

      return (
        <div>
          {/* Header */}
          <div className={s.ph}>
            <div className={s.ptitle}>Mercenary Hall</div>
            <div className={s.pdesc}>Hire battle-hardened warriors from across all factions. Unbound by faction loyalty, mercenaries fight at 85% power — but they're yours until the last blade falls.</div>
          </div>

          {/* Unbound lore callout */}
          <div className={s.mercLoreBanner}>
            <div className={s.mercLoreIcon}><IconShieldBolt size={20}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:3}}>⚔ The Unbound Warrior's Code</div>
              <div style={{fontSize:10.5,color:'var(--muted)',lineHeight:1.6,marginBottom:14}}>
                Mercenaries carry no faction oath and channel no mystical bond. They fight with 85% of their native power — formidable steel in unfamiliar hands. Your own faction units carry the <strong style={{color:'var(--gold)'}}>Faction Bond ✦</strong>, granting them full combat strength. Mercs remain in your army roster until slain in battle.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  { color:'#6dccaa', label:'Skirmisher Contract', icon:<IconSword size={13}/>,    qty:'1–3 units', tiers:'T1–T2', desc:'Small bands of light fighters. Low cost, low risk — ideal for filling gaps in your roster.' },
                  { color:'#a89cf0', label:'Company Contract',    icon:<IconSwords size={13}/>,   qty:'3–8 units', tiers:'T2–T3', desc:'Mid-sized war companies. Stronger units in bulk — good value for active campaigners.' },
                  { color:'#ffd700', label:'Elite Band',          icon:<IconShieldBolt size={13}/>,qty:'1–3 units', tiers:'T4–T5', desc:'Rare legendary warriors. Extremely powerful but costly — for commanders who demand the best.' },
                ].map(ct => (
                  <div key={ct.label} style={{background:'rgba(255,255,255,.04)',border:`1px solid ${ct.color}33`,borderRadius:9,padding:'10px 12px',display:'flex',flexDirection:'column',gap:5}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{color:ct.color}}>{ct.icon}</span>
                      <span style={{fontSize:10,fontWeight:700,color:ct.color}}>{ct.label}</span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <span style={{fontSize:9,background:`${ct.color}20`,color:ct.color,borderRadius:4,padding:'1px 7px',fontWeight:600}}>{ct.qty}</span>
                      <span style={{fontSize:9,background:`${ct.color}20`,color:ct.color,borderRadius:4,padding:'1px 7px',fontWeight:600}}>{ct.tiers}</span>
                    </div>
                    <div style={{fontSize:9.5,color:'var(--muted)',lineHeight:1.55}}>{ct.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Refresh bar */}
          <div className={s.aucHeader}>
            <div className={s.aucTimer}>
              {msLeft <= 0
                ? <span style={{color:'var(--green)'}}>Refreshing…</span>
                : <><IconClock size={12}/> New contracts in {hrsLeft}h {minLeft}m</>}
            </div>
            <AnimBtn className={s.aucRestockBtn} variant="pop"
              onClick={() => { const r = refreshMercListings(); if (!r.success) showToast('Refresh failed', r.message, 'err'); else showToast('Contracts refreshed', `−${r.cost.toLocaleString()}g`, 'res') }}
              disabled={loading || gold < refreshCost}>
              <AnimatedIcon><IconSwords size={11}/></AnimatedIcon> Refresh contracts — {refreshCost.toLocaleString()}g
            </AnimBtn>
          </div>

          {/* Listing grid */}
          <div className={`${s.ucardGrid} ${s.mercGrid}`} data-tour="merc-hall">
            {mercListings.map(listing => {
              const cc       = CONTRACT_COLOR[listing.contractTierId] || 'var(--gold)'
              const canAfford = gold >= listing.totalCost
              const effAtk   = Math.round(listing.unitAtk * 0.85)
              const effDef   = Math.round(listing.unitDef * 0.85)
              const effPwr   = effAtk + effDef
              return (
                <div key={listing.id} className={s.ucard} style={{ '--fc': cc, opacity: listing.hired ? 0.65 : 1 }}>

                  {/* ── Hero image ── */}
                  <div className={s.ucardHero}>
                    <UnitPortrait unitId={listing.unitId} artType={listing.unitArtType} factionColor={listing.factionColor} size={120}/>
                    <div className={s.ucardHeroOverlay} style={{background:`linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)`}}/>

                    {/* Top badges */}
                    <div className={s.ucardTopRow}>
                      <span className={s.ucardTier} style={{background:cc+'22',color:cc,border:`1px solid ${cc}44`}}>{TIER_LABEL[listing.unitTier]}</span>
                      <span className={s.mercContractBadge} style={{background:cc,color:'#0a0916',border:`1px solid ${cc}`}}>
                        {CONTRACT_ICON[listing.contractTierId]} {listing.contractLabel}
                      </span>
                    </div>

                    {/* Name + faction origin row */}
                    <div className={s.ucardNameRow}>
                      <span className={s.ucardName}>{listing.unitName}</span>
                      <span style={{display:'flex',alignItems:'center',gap:4,background:'rgba(0,0,0,.5)',borderRadius:20,padding:'2px 7px 2px 4px',backdropFilter:'blur(4px)'}}>
                        <FactionImage factionId={listing.factionId} size={14}/>
                        <span style={{fontSize:8.5,color:'rgba(255,255,255,.65)'}}>{listing.factionName}</span>
                      </span>
                    </div>

                    {listing.hired && (
                      <div style={{position:'absolute',inset:0,background:'rgba(109,204,170,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'var(--green)',letterSpacing:'.06em'}}>
                        ✓ Contracted
                      </div>
                    )}
                  </div>

                  {/* ── Stats ── */}
                  <div className={s.ucardBody}>
                    <div className={s.ucardStatGrid}>
                      <div className={s.ucardStat}><span className={s.ucardStatVal} style={{color:'var(--red)'}}>{effAtk}</span><span className={s.ucardStatLbl}>ATK</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal} style={{color:'var(--green)'}}>{effDef}</span><span className={s.ucardStatLbl}>DEF</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal}>{effPwr}</span><span className={s.ucardStatLbl}>PWR</span></div>
                      <div className={s.ucardStat}><span className={s.ucardStatVal}>×{listing.qty}</span><span className={s.ucardStatLbl}>QTY</span></div>
                    </div>

                    <div className={s.mercUnboundBadge} style={{marginTop:2}}>⚔ Unbound — 85% power · no faction bond</div>

                    <div className={s.ucardCost}>
                      <span style={{color: canAfford ? 'var(--gold)' : 'var(--red)'}}><IconCoin size={10}/> {listing.totalCost.toLocaleString()}g total</span>
                      <span style={{color:'var(--muted)'}}>{listing.costPerUnit.toLocaleString()}g / unit</span>
                    </div>
                  </div>

                  {/* ── Action bar ── */}
                  <div className={s.ucardFoot}>
                    {listing.hired
                      ? <div className={s.ucardBlocked} style={{color:'var(--green)'}}>✓ Already in your army</div>
                      : !canAfford
                        ? <div className={s.ucardBlocked}>Need {(listing.totalCost - gold).toLocaleString()}g more</div>
                        : <AnimBtn className={s.ucardBtn} variant="strike" style={{background:cc+'18',color:cc,border:`1px solid ${cc}44`}}
                            disabled={loading}
                            onClick={() => doHireMerc(listing)}>
                            <AnimatedIcon><IconSwords size={12}/></AnimatedIcon> Hire Contract
                          </AnimBtn>
                    }
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (panel === 'auction') {
      const auctionItems = gs?.auctionItems || []
      const refreshAt    = gs?.auctionRefreshAt || 0
      const msLeft       = Math.max(0, refreshAt - Date.now())
      const minLeft      = Math.floor(msLeft / 60000)
      const secLeftAuc   = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0')
      const expired      = msLeft <= 0
      const ownedIds     = new Set((gs?.items || []).map(i => i.id))
      return (
        <div>
          <div className={s.ph}>
            <div className={s.ptitle}>Auction House</div>
            <div className={s.pdesc}>Passive relics, battle consumables, and powerful artifacts. Inventory refreshes automatically every 10 minutes.</div>
          </div>
          <div className={s.aucHeader}>
            <div className={s.aucTimer}>
              {expired
                ? <span style={{color:'var(--green)'}}>Refreshing…</span>
                : <><IconClock size={12}/> New stock in {minLeft}:{secLeftAuc}</>}
            </div>
            <AnimBtn className={s.aucRestockBtn} variant="pop"
              onClick={() => doRefreshAuction(true)}
              disabled={loading || gold < AUCTION_RESTOCK_COST}>
              <AnimatedIcon><IconGavel size={11}/></AnimatedIcon> Restock now — {AUCTION_RESTOCK_COST}g
            </AnimBtn>
          </div>
          {auctionItems.length === 0 && (
            <div className={s.empty}>
              <IconGavel size={40} opacity={0.2}/>
              <p className={s.emptyT}>No items available</p>
              <p className={s.emptyS}>Select a faction to populate the auction.</p>
            </div>
          )}
          <div className={s.ucardGrid}>
            {auctionItems.map(item => {
              const rc = RARITY_COLOR[item.rarity] || 'var(--muted)'
              const isConsumable = !!(item.effect || item.itemCategory === 'consumable')
              const isArtifact   = item.transferChance !== undefined || item.itemCategory === 'artifact'
              const isPassive    = !isConsumable && !isArtifact
              const typeColor    = isConsumable ? 'var(--green)' : isArtifact ? 'var(--mana2)' : rc
              const typeLabel    = isConsumable ? 'Consumable' : isArtifact ? 'Artifact' : 'Passive Relic'
              const ownedQty     = (gs?.items || []).filter(i => i.id === item.id).reduce((s, i) => s + (i.qty || 1), 0)
              const alreadyOwned  = isPassive && ownedIds.has(item.id)
              const canAffordGold = gold >= item.goldPrice
              const canAffordMana = mana >= (item.manaPrice || 0)
              const canAfford     = canAffordGold && canAffordMana
              const bulkRange     = isConsumable && item.qty ? `×${item.qty}` : null
              const buyBlock = alreadyOwned
                ? 'Already owned — passive relics can only be held once'
                : !canAffordGold
                  ? `Need ${(item.goldPrice - gold).toLocaleString()}g more gold`
                  : !canAffordMana
                    ? `Need ${((item.manaPrice||0) - mana).toLocaleString()}m more mana`
                    : null
              return (
                <div key={item.id} className={s.ucard} style={{ '--fc': rc, opacity: alreadyOwned ? 0.5 : 1 }}>
                  {/* Hero */}
                  <div className={s.ucardHero}>
                    <ItemArt id={item.id} artType={item.artType} rarity={item.rarity} size={120} />
                    <div className={s.ucardHeroOverlay} style={{background:'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)'}} />
                    <div className={s.ucardTopRow}>
                      <span className={s.ucardTier} style={{background:rc+'22',color:rc,border:`1px solid ${rc}44`}}>{item.rarity}</span>
                      {alreadyOwned && <span className={s.ucardCount} style={{color:'var(--green)'}}>✓</span>}
                      {ownedQty > 0 && !alreadyOwned && <span className={s.ucardCount} style={{color:'var(--green)'}}>×{ownedQty}</span>}
                    </div>
                    <div className={s.ucardNameRow}>
                      <span className={s.ucardName}>{item.name}</span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className={s.ucardBody}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <span style={{fontSize:9,padding:'2px 7px',borderRadius:3,background:typeColor+'22',color:typeColor,border:`1px solid ${typeColor}44`,fontWeight:600,letterSpacing:.5,textTransform:'uppercase'}}>{typeLabel}</span>
                      {bulkRange && <span style={{fontSize:9,color:'var(--muted)'}}>{bulkRange} per order</span>}
                    </div>
                    <div style={{fontSize:10,color:'var(--muted)',lineHeight:1.55,flex:1}}>{item.desc}</div>
                    {item.flavorText && <div style={{fontSize:9.5,color:'var(--silver)',fontStyle:'italic',lineHeight:1.5,marginTop:4,opacity:0.7}}>{item.flavorText}</div>}
                    {(item.passiveLabel || item.effectLabel || item.instant) && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                        {item.passiveLabel && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:rc+'18',color:rc,border:`1px solid ${rc}33`}}>{item.passiveLabel}</span>}
                        {item.effectLabel  && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(109,204,170,0.12)',color:'var(--green)',border:'1px solid rgba(109,204,170,0.25)'}}>{item.effectLabel}</span>}
                        {item.instant?.land  > 0 && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(109,204,170,0.12)',color:'var(--green)',border:'1px solid rgba(109,204,170,0.25)'}}>+{item.instant.land} acres</span>}
                        {item.instant?.gold  > 0 && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(201,168,76,0.12)',color:'var(--gold)',border:'1px solid rgba(201,168,76,0.25)'}}>+{item.instant.gold}g</span>}
                        {item.instant?.mana  > 0 && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(168,156,240,0.12)',color:'var(--mana2)',border:'1px solid rgba(168,156,240,0.25)'}}>+{item.instant.mana}m</span>}
                        {item.instant?.turns > 0 && <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(255,255,255,0.06)',color:'var(--silver)',border:'1px solid rgba(255,255,255,0.12)'}}>+{item.instant.turns} turns</span>}
                      </div>
                    )}
                    <div className={s.ucardCost} style={{marginTop:6}}>
                      <span style={{color: canAffordGold ? 'var(--gold)' : 'var(--red, #e87878)'}}><IconCoin size={10}/> {item.goldPrice.toLocaleString()}g</span>
                      {(item.manaPrice||0) > 0 && <span style={{color: canAffordMana ? 'var(--mana2)' : 'var(--red, #e87878)'}}><IconSparkles size={10}/> {item.manaPrice.toLocaleString()}m</span>}
                    </div>
                  </div>
                  {/* Footer */}
                  <div className={s.ucardFoot}>
                    {buyBlock && <div className={s.blockReason} style={{marginBottom:8}}>{buyBlock}</div>}
                    <AnimBtn className={s.ucardBtn} variant="strike"
                      style={{background:rc+'18',color:rc,border:`1px solid ${rc}44`}}
                      onClick={() => doBuyItem(item)}
                      disabled={!canAfford || alreadyOwned || loading}>
                      <AnimatedIcon><IconGavel size={12}/></AnimatedIcon>
                      {alreadyOwned ? 'Owned' : isConsumable ? `Buy ${bulkRange ?? ''}` : 'Acquire'}
                    </AnimBtn>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (panel === 'rankings') {
      const sorted = [...rankings].sort((a,b)=>(b.power||0)-(a.power||0))
      const medalColors = ['#ffd700','#c0c0c0','#cd7f32']
      const myAbsRank = sorted.findIndex(r => r._id === player?._id)
      // window ±200 rows around player
      const winStart = Math.max(0, myAbsRank - 200)
      const winEnd   = Math.min(sorted.length, myAbsRank + 201)
      const windowed = sorted.slice(winStart, winEnd)
      const totalPages = Math.ceil(windowed.length / rkPageSize)
      const pageStart  = rkPage * rkPageSize
      const pageRows   = windowed.slice(pageStart, pageStart + rkPageSize)
      const canFight = turns >= 3 && power > 0 && !loading
      const myPageInWindow = myAbsRank >= 0 ? Math.floor((myAbsRank - Math.max(0, myAbsRank - 200)) / rkPageSize) : 0
      return (
        <div className={s.rkPanel}>
          <div className={s.ph}>
            <div className={s.ptitle}>World Rankings</div>
            <div className={s.pdesc}>Showing ±200 players around your rank · {windowed.length} players · Rank #{(myAbsRank + 1) || '—'} of {sorted.length}</div>
          </div>
          <div className={s.rkStickyTop}>
            <div className={s.rkPsz}>
              Rows:
              {[25,50,100].map(n => (
                <button key={n} className={`${s.rkPszBtn} ${rkPageSize===n ? s.rkPszActive : ''}`}
                  aria-pressed={rkPageSize===n} aria-label={`Show ${n} rows per page`}
                  onClick={() => {
                    setRkPageSize(n)
                    if (myAbsRank >= 0) {
                      const ws = Math.max(0, myAbsRank - 200)
                      setRkPage(Math.floor((myAbsRank - ws) / n))
                    } else { setRkPage(0) }
                  }}>{n}</button>
              ))}
            </div>
            <button className={s.rkJumpBtn} onClick={() => { setRkPage(myPageInWindow); setScrollToMe(true) }}>↡ My rank</button>
            <div className={s.rkNav}>
              <button className={s.rkNavBtn} aria-label="First page" disabled={rkPage===0} onClick={() => setRkPage(0)}>«</button>
              <button className={s.rkNavBtn} aria-label="Previous page" disabled={rkPage===0} onClick={() => setRkPage(p=>p-1)}>‹</button>
              <span className={s.rkPageInfo} aria-live="polite">Page {rkPage+1} / {totalPages}</span>
              <button className={s.rkNavBtn} aria-label="Next page" disabled={rkPage>=totalPages-1} onClick={() => setRkPage(p=>p+1)}>›</button>
              <button className={s.rkNavBtn} aria-label="Last page" disabled={rkPage>=totalPages-1} onClick={() => setRkPage(totalPages-1)}>»</button>
            </div>
          </div>
          <div className={s.rkScroll} ref={rkScrollRef}>
            <div className={s.rkHeader}>
              <div className={s.rkHRank}>#</div>
              <div className={s.rkHFaction}>Faction</div>
              <div className={s.rkHName}>Player</div>
              <div className={s.rkHPow}>Power</div>
              <div className={s.rkHAct}>Action</div>
            </div>
            <div className={s.rklist}>
              {pageRows.map((r) => {
                const absIdx = sorted.indexOf(r)
                const rank = absIdx + 1
                const isMe = r._id === player?._id
                const rf   = FACTIONS[r.faction] || { color: 'var(--muted)', name: 'Unknown' }
                return (
                  <div key={r._id} ref={isMe ? myRowRef : null} className={`${s.rkrow} ${isMe ? s.rkMe : ''}`}>
                    <div className={s.rknum} style={{ color: medalColors[absIdx] || 'var(--muted)' }}>
                      {rank}
                    </div>
                    <div className={s.rkFactionCol}><FactionImage factionId={r.faction} size={28} /></div>
                    <div className={s.rkInfo}>
                      <div className={s.rkname}>{isMe ? '★ ' : ''}{r.name}</div>
                      <div className={s.rkfac} style={{ color: rf.color }}>{rf.name} · {rf.identity || ''}</div>
                    </div>
                    <div className={s.rkpow}>{(r.power||0).toLocaleString()}</div>
                    {!isMe && (
                      <button
                        className={s.rkAttack}
                        disabled={!canFight || r.isMock || Math.abs(absIdx - myAbsRank) > 100}
                        onClick={() => openBattleConfig(r._id)}
                        title={
                          r.isMock ? 'This commander has no active army to raid'
                            : Math.abs(absIdx - myAbsRank) > 100
                            ? 'Only players within ±100 ranks can be attacked'
                            : !canFight ? 'Need 3 turns and power to attack'
                            : `Attack ${r.name}`
                        }
                      >
                        ⚔ Attack
                      </button>
                    )}
                    {isMe && <div className={s.rkYou}>You</div>}
                  </div>
                )
              })}
            </div>
          </div>
          <div className={s.rkStickyBot}>
            <div className={s.rkNav}>
              <button className={s.rkNavBtn} aria-label="First page" disabled={rkPage===0} onClick={() => setRkPage(0)}>«</button>
              <button className={s.rkNavBtn} aria-label="Previous page" disabled={rkPage===0} onClick={() => setRkPage(p=>p-1)}>‹</button>
              <span className={s.rkPageInfo} aria-live="polite">Page {rkPage+1} / {totalPages} · {windowed.length} players</span>
              <button className={s.rkNavBtn} aria-label="Next page" disabled={rkPage>=totalPages-1} onClick={() => setRkPage(p=>p+1)}>›</button>
              <button className={s.rkNavBtn} aria-label="Last page" disabled={rkPage>=totalPages-1} onClick={() => setRkPage(totalPages-1)}>»</button>
            </div>
          </div>
        </div>
      )
    }

    if (panel === 'lore') {
      const FACTION_ORDER = ['undead','nature','tide','flame','celestial']
      const lf  = FACTIONS[loreFaction || faction]
      const lc  = lf.color
      const lResBuildings = lf.buildings.filter(b => b.category === 'resource')
      const lMilBuildings = lf.buildings.filter(b => b.category === 'military')

      // Shared table styles
      const tbl  = { width:'100%', borderCollapse:'collapse', fontSize:11.5, tableLayout:'auto' }
      const th   = { background:'rgba(255,255,255,0.05)', color:'var(--muted)', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', padding:'7px 10px', borderBottom:'1px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }
      const thC  = { ...th, textAlign:'center' }
      const td   = { padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle', color:'var(--text)' }
      const tdC  = { ...td, textAlign:'center' }
      const tdM  = { ...td, color:'var(--muted)', fontSize:11 }
      const sec  = { marginTop:32, scrollMarginTop:16 }
      const h2s  = { margin:'0 0 14px', fontSize:15, fontWeight:800, color:'#fff', borderBottom:`1px solid ${lc}33`, paddingBottom:8, display:'flex', alignItems:'center', gap:8 }
      const tierBadge = tier => ({
        display:'inline-block', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700,
        background: ['','rgba(255,255,255,0.08)','rgba(109,204,170,0.15)','rgba(120,120,220,0.18)','rgba(201,100,30,0.18)','rgba(201,168,76,0.20)'][tier],
        color: ['','var(--muted)','var(--green)','#a0a0e8','#e87848','var(--gold)'][tier],
      })
      const rolePill = role => ({
        display:'inline-block', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:600,
        background:`${ROLE_COLOR[role]||'#888'}22`, color: ROLE_COLOR[role]||'#888',
      })

      const TOC_SECTIONS = [
        { id:'lore-overview',   label:'Overview' },
        { id:'lore-economy',    label:'Economy' },
        { id:'lore-military',   label:'Military Halls' },
        { id:'lore-units',      label:'Units' },
        { id:'lore-affinities', label:'Combat Affinities' },
      ]

      const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })

      return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:0 }}>

          {/* ── Faction Tab Bar ── */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0, overflowX:'auto' }}>
            {FACTION_ORDER.map(fid => {
              const fd = FACTIONS[fid]
              const active = fid === (loreFaction || faction)
              const yours  = fid === faction
              return (
                <button key={fid} onClick={() => setLoreFaction(fid)} style={{
                  display:'flex', alignItems:'center', gap:7, padding:'10px 18px',
                  background: active ? `${fd.color}14` : 'transparent',
                  border:'none', borderBottom:`2px solid ${active ? fd.color : 'transparent'}`,
                  color: active ? fd.color : 'rgba(255,255,255,0.38)', cursor:'pointer',
                  fontSize:12, fontWeight: active ? 700 : 500, transition:'all .15s',
                  whiteSpace:'nowrap', flexShrink:0,
                }}>
                  <FactionImage factionId={fid} size={18}/>
                  {fd.shortName}
                  {yours && <span style={{ fontSize:8, background:fd.color, color:'#000', borderRadius:3, padding:'1px 5px', fontWeight:800, lineHeight:1.5 }}>YOURS</span>}
                </button>
              )
            })}
          </div>

          {/* ── Body: TOC + Article ── */}
          <div style={{ display:'flex', gap:0, alignItems:'flex-start', flex:1 }}>

            {/* Sticky TOC */}
            <div style={{ width:148, flexShrink:0, position:'sticky', top:0, padding:'20px 0 20px 2px' }}>
              <div style={{ fontSize:9.5, textTransform:'uppercase', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', fontWeight:700, marginBottom:10, paddingLeft:8 }}>Contents</div>
              {TOC_SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => scrollTo(sec.id)} style={{
                  display:'block', width:'100%', textAlign:'left', padding:'5px 10px',
                  background:'none', border:'none', borderLeft:'2px solid var(--border)',
                  color:'rgba(255,255,255,0.45)', fontSize:11, cursor:'pointer',
                  marginBottom:2, transition:'color .12s, border-color .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color=lc; e.currentTarget.style.borderLeftColor=lc }}
                  onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.45)'; e.currentTarget.style.borderLeftColor='var(--border)' }}
                >{sec.label}</button>
              ))}

              <div style={{ marginTop:24, borderTop:'1px solid var(--border)', paddingTop:14, paddingLeft:8 }}>
                <div style={{ fontSize:9.5, textTransform:'uppercase', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', fontWeight:700, marginBottom:10 }}>All Factions</div>
                {FACTION_ORDER.map(fid => {
                  const fd = FACTIONS[fid]
                  const active = fid === (loreFaction || faction)
                  return (
                    <button key={fid} onClick={() => setLoreFaction(fid)} style={{
                      display:'flex', alignItems:'center', gap:6, width:'100%', textAlign:'left',
                      padding:'4px 0', background:'none', border:'none', cursor:'pointer',
                      color: active ? fd.color : 'rgba(255,255,255,0.38)', fontSize:11,
                      fontWeight: active ? 700 : 400, marginBottom:3,
                    }}>
                      <FactionImage factionId={fid} size={14}/> {fd.shortName}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Article */}
            <div style={{ flex:1, minWidth:0, padding:'20px 8px 60px 24px' }}>

              {/* Title bar */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${lc}33` }}>
                <FactionImage factionId={loreFaction || faction} size={56} style={{ border:`1px solid ${lc}44`, borderRadius:8, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.1 }}>{lf.name}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontStyle:'italic', marginTop:3 }}>{lf.epithet}</div>
                  <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, background:lf.identityColor, color:lc, borderRadius:4, padding:'2px 8px', fontWeight:700 }}>{lf.identity} Identity</span>
                    <span style={{ fontSize:10, background:'rgba(109,204,170,0.12)', color:'var(--green)', borderRadius:4, padding:'2px 8px' }}>⚔ {lf.advF.map(x=>FACTIONS[x].shortName).join(' · ')}</span>
                    <span style={{ fontSize:10, background:'rgba(232,120,120,0.12)', color:'var(--red)', borderRadius:4, padding:'2px 8px' }}>↓ {lf.disadvF.map(x=>FACTIONS[x].shortName).join(' · ')}</span>
                  </div>
                </div>
              </div>

              {/* ── Overview ── */}
              <section style={sec} id="lore-overview">
                <div style={h2s}><IconBook size={15} color={lc}/> Overview</div>

                {/* Infobox */}
                <table style={{ float:'right', marginLeft:20, marginBottom:16, width:210, borderCollapse:'collapse', fontSize:11, background:'var(--bg3)', border:`1px solid ${lc}33`, borderRadius:8, overflow:'hidden' }}>
                  <thead>
                    <tr><th colSpan={2} style={{ background:`${lc}18`, color:lc, padding:'8px 12px', textAlign:'center', fontSize:12, fontWeight:800, letterSpacing:'.02em' }}>{lf.name}</th></tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={2} style={{ textAlign:'center', padding:10 }}><FactionImage factionId={loreFaction||faction} size={88}/></td></tr>
                    {[
                      ['Epithet', lf.epithet],
                      ['Identity', <span style={{ background:lf.identityColor, color:lc, padding:'1px 7px', borderRadius:4, fontWeight:700, fontSize:10 }}>{lf.identity}</span>],
                      ['Gold Bonus', <span style={{ color:'var(--gold)', fontWeight:600 }}>+{Math.round(lf.goldBonus*100)}%</span>],
                      ['Mana Bonus', <span style={{ color:'var(--mana2)', fontWeight:600 }}>+{Math.round(lf.manaBonus*100)}%</span>],
                      ['Strong vs', <span style={{ color:'var(--green)' }}>{lf.advF.map(x=>FACTIONS[x].shortName).join(', ')}</span>],
                      ['Weak vs',   <span style={{ color:'var(--red)' }}>{lf.disadvF.map(x=>FACTIONS[x].shortName).join(', ')}</span>],
                      ['Units', `${lf.units.length} types`],
                      ['Buildings', `${loresResLen(lf)} resource, ${lf.units.length} halls`],
                    ].map(([k,v],i) => (
                      <tr key={i} style={{ background: i%2===0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding:'5px 10px', color:'rgba(255,255,255,0.45)', fontWeight:600, whiteSpace:'nowrap' }}>{k}</td>
                        <td style={{ padding:'5px 10px', color:'var(--text)' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ lineHeight:1.75, color:'rgba(255,255,255,0.72)', fontSize:13 }}>
                  {lf.lore.split('\n\n').map((p,i) => <p key={i} style={{ margin:'0 0 14px' }}>{p}</p>)}
                </div>
                <div style={{ clear:'both' }}/>
              </section>

              {/* ── Economy ── */}
              <section style={sec} id="lore-economy">
                <div style={h2s}><IconCoin size={15} color={lc}/> Economy</div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'0 0 14px', lineHeight:1.6 }}>
                  Resource buildings generate passive gold and mana income each turn. They are stackable up to 8 per type and consume land permanently upon construction.
                </p>
                <div style={{ overflowX:'auto' }}>
                  <table style={tbl}>
                    <thead>
                      <tr>
                        {['Building','Description','Build Cost','Land / ea','Build Time','Gold / ea','Mana / ea','Max'].map((h,i) => (
                          <th key={i} style={i===0||i===1?th:thC}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lResBuildings.map((b,i) => (
                        <tr key={b.id} style={{ background: i%2===0?'rgba(255,255,255,0.015)':'transparent' }}>
                          <td style={{ ...td, fontWeight:700, whiteSpace:'nowrap', color:lc }}><FI name={b.icon} size={13} color={lc}/> {b.name}</td>
                          <td style={{ ...tdM, maxWidth:220, lineHeight:1.5 }}>{b.desc}</td>
                          <td style={tdC}><span style={{color:'var(--gold)'}}>{b.goldCost.toLocaleString()}g</span><br/><span style={{color:'var(--mana2)',fontSize:10}}>{b.manaCost}m</span></td>
                          <td style={tdC}>{b.landCost} ac</td>
                          <td style={tdC}>{b.turns}t</td>
                          <td style={{ ...tdC, color:'var(--gold)', fontWeight:600 }}>{b.goldPerBld ? `+${b.goldPerBld}` : '—'}</td>
                          <td style={{ ...tdC, color:'var(--mana2)', fontWeight:600 }}>{b.manaPerBld ? `+${b.manaPerBld}` : '—'}</td>
                          <td style={tdC}>{b.maxCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── Military Halls ── */}
              <section style={sec} id="lore-military">
                <div style={h2s}><IconBuildingCastle size={15} color={lc}/> Military Halls</div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'0 0 14px', lineHeight:1.6 }}>
                  Each hall unlocks one unit type and must be built in sequence — you cannot build a hall until the previous unit's hall exists (Tier 4–5 units require the previous hall at Level 2). Upgrading a hall boosts the unit's ATK & DEF by 25% per level.
                </p>
                <div style={{ overflowX:'auto' }}>
                  <table style={tbl}>
                    <thead>
                      <tr>
                        {['Hall','Trains','Tier','Build Cost','Land','Build Time','Gold Gen','Mana Gen'].map((h,i) => (
                          <th key={i} style={i<2?th:thC}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lMilBuildings.map((b,i) => {
                        const u = lf.units.find(u => u.id === b.unitId)
                        return (
                          <tr key={b.id} style={{ background: i%2===0?'rgba(255,255,255,0.015)':'transparent' }}>
                            <td style={{ ...td, fontWeight:700, whiteSpace:'nowrap' }}>{b.name}</td>
                            <td style={{ ...td, color:lc, whiteSpace:'nowrap' }}>{u?.name || '—'}</td>
                            <td style={tdC}>{u && <span style={tierBadge(u.tier)}>{TIER_LABEL[u.tier]}</span>}</td>
                            <td style={tdC}><span style={{color:'var(--gold)'}}>{b.goldCost.toLocaleString()}g</span><br/><span style={{color:'var(--mana2)',fontSize:10}}>{b.manaCost.toLocaleString()}m</span></td>
                            <td style={tdC}>{b.landCost} ac</td>
                            <td style={tdC}>{b.turns}t</td>
                            <td style={{ ...tdC, color:'var(--gold)', fontWeight:600 }}>+{b.goldGen}</td>
                            <td style={{ ...tdC, color:'var(--mana2)', fontWeight:600 }}>+{b.manaGen}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── Units ── */}
              <section style={sec} id="lore-units">
                <div style={h2s}><IconSword size={15} color={lc}/> Units</div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'0 0 14px', lineHeight:1.6 }}>
                  All stats are base values at Hall Level 0. Upgrading the corresponding hall to Level 1 increases ATK +25% / DEF +20%; Level 2 gives a further +25% / +20%. Power = STR + CON + INT + SPD.
                </p>
                <div style={{ overflowX:'auto' }}>
                  <table style={tbl}>
                    <thead>
                      <tr>
                        <th style={th}>Unit</th>
                        <th style={thC}>Tier</th>
                        <th style={thC}>Role</th>
                        <th style={thC}>Type</th>
                        <th style={thC}>STR</th>
                        <th style={thC}>CON</th>
                        <th style={thC}>INT</th>
                        <th style={thC}>SPD</th>
                        <th style={thC}>ATK</th>
                        <th style={thC}>DEF</th>
                        <th style={thC}>Power</th>
                        <th style={thC}>Recruit Cost</th>
                        <th style={thC}>Upkeep/hr</th>
                        <th style={th}>Strong vs</th>
                        <th style={th}>Weak vs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lf.units.map((u,i) => (
                        <tr key={u.id} style={{ background: i%2===0?'rgba(255,255,255,0.015)':'transparent' }}>
                          <td style={{ ...td, whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <UnitPortrait unitId={u.id} artType={u.artType} factionColor={lc} size={28}/>
                              <div>
                                <div style={{ fontWeight:700, color:'#fff', lineHeight:1.2 }}>{u.name}</div>
                                <div style={{ fontSize:9.5, color:'var(--muted)', textTransform:'capitalize' }}>{u.artType}</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdC}><span style={tierBadge(u.tier)}>{TIER_LABEL[u.tier]}</span></td>
                          <td style={tdC}><span style={rolePill(u.role)}>{u.role}</span></td>
                          <td style={{ ...tdC, textTransform:'capitalize', fontSize:11 }}>{u.type}</td>
                          <td style={{ ...tdC, color:'#e87878', fontWeight:600 }}>{u.str}</td>
                          <td style={{ ...tdC, color:'#78c8e8', fontWeight:600 }}>{u.con}</td>
                          <td style={{ ...tdC, color:'var(--mana2)', fontWeight:600 }}>{u.int}</td>
                          <td style={{ ...tdC, color:'var(--green)', fontWeight:600 }}>{u.spd}</td>
                          <td style={{ ...tdC, color:'var(--gold)', fontWeight:700 }}>{u.atk}</td>
                          <td style={{ ...tdC, color:'#78c8e8', fontWeight:700 }}>{u.def}</td>
                          <td style={{ ...tdC, fontWeight:700 }}>{u.power}</td>
                          <td style={tdC}>
                            <span style={{ color:'var(--gold)', fontSize:11 }}>{u.goldCost.toLocaleString()}g</span><br/>
                            <span style={{ color:'var(--mana2)', fontSize:10 }}>{u.manaCost.toLocaleString()}m</span>
                          </td>
                          <td style={tdC}>
                            <span style={{ color:'var(--gold)', fontSize:11 }}>{u.goldUpkeep}g</span><br/>
                            <span style={{ color:'var(--mana2)', fontSize:10 }}>{u.manaUpkeep}m</span>
                          </td>
                          <td style={{ ...tdM, textTransform:'capitalize' }}>{u.strongVs.join(', ')}</td>
                          <td style={{ ...tdM, textTransform:'capitalize' }}>{u.weakVs.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── Combat Affinities ── */}
              <section style={sec} id="lore-affinities">
                <div style={h2s}><IconShieldBolt size={15} color={lc}/> Combat Affinities</div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'0 0 16px', lineHeight:1.6 }}>
                  Faction matchups determine a flat combat modifier. Fighting an advantaged faction increases your effective power; fighting a disadvantaged one reduces it.
                </p>
                <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                  {[
                    { label:'Strong Against', fids:lf.advF, color:'var(--green)', icon:'⚔' },
                    { label:'Weak Against',   fids:lf.disadvF, color:'var(--red)', icon:'↓' },
                    { label:'Neutral',        fids: FACTION_ORDER.filter(x => !lf.advF.includes(x) && !lf.disadvF.includes(x) && x !== (loreFaction||faction)), color:'var(--muted)', icon:'≈' },
                  ].map(({ label, fids, color, icon }) => (
                    <div key={label} style={{ flex:1, minWidth:180, background:'var(--bg3)', border:`1px solid ${color}22`, borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color, fontWeight:700, marginBottom:10 }}>{icon} {label}</div>
                      {fids.map(fid => {
                        const fd = FACTIONS[fid]
                        return (
                          <div key={fid} onClick={() => setLoreFaction(fid)} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}>
                            <FactionImage factionId={fid} size={28}/>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:fd.color }}>{fd.name}</div>
                              <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)' }}>{fd.epithet}</div>
                            </div>
                          </div>
                        )
                      })}
                      {fids.length === 0 && <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>None</div>}
                    </div>
                  ))}
                </div>
              </section>

            </div>{/* /article */}
          </div>{/* /body */}
        </div>
      )
    }

    if (panel === 'guild') return renderGuildPanel()

    return null
  }

  const armyEntries = f ? f.units.filter(u => (gs?.army?.[u.id] || 0) > 0) : []
  const mercEntries  = (gs?.mercs || []).filter(m => (m.quantity || 0) > 0)

  return (
    <><div className={s.shell}>
      {/* Top Bar */}
      <div className={s.topbar}>
        <div className={s.logoS}>Realm of Ages</div>
        <div className={s.tbStats}>
          <TbStat imageId="gold"  Icon={IconCoin}     val={gold.toLocaleString()}  color="var(--gold)" />
          <TbStat imageId="mana"  Icon={IconSparkles} val={mana.toLocaleString()}  color="var(--mana2)" />
          <TbStat imageId="land"  Icon={IconMap}      val={land} />
          <TbStat imageId="army"  Icon={IconSword}    val={totalArmy} />
          <TbStat imageId="power" Icon={IconBolt}     val={power.toLocaleString()} color="var(--gold)" />
        </div>
        <div className={s.tbRight}>
          {f && (
            <span className={s.fbBanner} style={{ background: f.bg, color: f.color }}>
              <FactionImage factionId={faction} size={18} />
              {f.shortName}
            </span>
          )}
          <span className={s.ptag}>{player?.name}</span>
          <button className={s.btnSm} style={{color:'var(--green)',borderColor:'rgba(109,204,170,.3)'}} onClick={devRefillTurns} title="DEV: Refill turns"><IconClock size={14}/></button>
          {player?.email?.toLowerCase().trim() === 'chanthasena.peter@gmail.com' && (
            <button
              className={s.btnSm}
              style={{color:'var(--red)',borderColor:'rgba(232,120,120,.3)'}}
              title="DEV: wipe this test account and start over"
              onClick={async () => {
                if (!window.confirm('This permanently deletes this account and all its progress, so you can register again with the same email. Continue?')) return
                try {
                  await devResetAccount()
                  nav('/')
                } catch (e) {
                  alert('Reset failed: ' + e.message)
                }
              }}
            ><IconTrash size={14}/></button>
          )}
          <button className={s.btnSm} title="Log out" onClick={() => { logout(); nav('/') }}><IconLogout size={14}/></button>
        </div>
      </div>

      {/* Economy Bar */}
      <div className={s.econBar} data-tour="econ-bar">
        <EbItem imageId="turns" icon={<IconClock size={14} color="var(--muted)"/>}    label="Turns" value={`${turns}/200`}             rate={`+1 in ${mLeft}:${sLeft}`}                                  barWidth={turns/200*100}                           barCls={s.barTurns} valCls={s.valTurns} />
        <EbItem imageId="gold"  icon={<IconCoin size={14} color="var(--gold)"/>}       label="Gold"  value={gold.toLocaleString()}       rate={`${eco.goldNet>=0?'+':''}${eco.goldNet}/hr`} ratePos={eco.goldNet>=0}  barWidth={Math.min(100, gold/Math.max(gold,1000)*100)} barCls={s.barGold}  valCls={s.valGold} />
        <EbItem imageId="mana"  icon={<IconSparkles size={14} color="var(--mana)"/>}   label="Mana"  value={mana.toLocaleString()}       rate={`${eco.manaNet>=0?'+':''}${eco.manaNet}/hr`} ratePos={eco.manaNet>=0}  barWidth={Math.min(100, mana/500*100)}                barCls={s.barMana}  valCls={s.valMana} />
        {(gs?.streak?.days > 0) && (
          <button
            onClick={() => openStreakModal(gs.streak)}
            style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'4px 4px 4px 16px',borderLeft:'1px solid rgba(255,255,255,0.08)',borderTop:'none',borderRight:'none',borderBottom:'none',background:'none',cursor:'pointer',flexShrink:0,borderRadius:4}}
            title={`${gs.streak.days}-day streak${gs.streak.shield?' · Shield active':''} — click to view rewards`}
            aria-label={`Day ${gs.streak.days} login streak${gs.streak.claimedToday ? ', reward claimed' : ', reward available'} — open reward tracker`}
          >
            <IconFlame size={14} color="#ff8c42" style={{filter:'drop-shadow(0 0 4px #ff8c4288)'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#ff8c42'}}>Day {gs.streak.days}</span>
            {gs.streak.shield && <IconShield size={11} color="#ffd700" style={{marginLeft:1}}/>}
            {!gs.streak.claimedToday && <span style={{width:6,height:6,borderRadius:'50%',background:'#ff8c42',boxShadow:'0 0 5px #ff8c42',marginLeft:2}} aria-hidden="true"/>}
          </button>
        )}
      </div>

      {/* Main Layout */}
      <div className={s.layout}>
        {/* Sidebar */}
        <div className={s.sidebar} data-tour="nav-sidebar">
          <div className={s.nsec}>
            <div className={s.ntitle}>Command</div>
            {navItems.slice(0,7).map(n => (
              <div key={n.id} className={`${s.nitem} ${panel===n.id?s.nactive:''}`} onClick={() => setPanel(n.id)}>
                <NavIcon id={n.id} FallbackIcon={n.Icon} /> {n.label}
              </div>
            ))}
          </div>
          <div className={s.nsec}>
            <div className={s.ntitle}>World</div>
            {navItems.slice(7).map(n => (
              <div key={n.id} className={`${s.nitem} ${panel===n.id?s.nactive:''}`} onClick={() => setPanel(n.id)}>
                <NavIcon id={n.id} FallbackIcon={n.Icon} /> {n.label}
              </div>
            ))}
          </div>
          <div className={s.nsec}>
            <div className={s.ntitle}>Social</div>
            <div className={`${s.nitem} ${panel==='guild'?s.nactive:''}`} onClick={() => setPanel('guild')}>
              <NavIcon id="guild" FallbackIcon={IconUsers} />
              Guild
              {!guild && guildInvites.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--gold)', color: '#000', borderRadius: 8, padding: '1px 5px', fontWeight: 700 }}>{guildInvites.length}</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className={s.mainp}>{renderPanel()}</div>

        {/* Right Panel */}
        <div className={s.rightp}>
          <div className={s.rpSection}>
            <div className={s.powerCtr}>
              <RpStatIcon imageId="power" fallback={<IconTrophy size={40} color="var(--gold)"/>} size={40} />
              <div className={s.powerNum}>{power.toLocaleString()}</div>
              <div className={s.powerLbl}>Total Power</div>
              <div><span className={s.rkBadge}>Rank #{rankings.findIndex(r=>r._id===player?._id)+1 || '—'} of {rankings.length}</span></div>
            </div>
          </div>
          <div className={s.rpSection} data-tour="empire-stats">
            <div className={s.rpTitle}>Empire Stats</div>
            <RpStat imageId="land"         icon={<IconMap size={12}/>}            lbl="Land"        val={`${land} ac`} />
            <RpStat imageId="free-land"    icon={<IconMap size={12}/>}            lbl="Free Land"   val={`${eco.freeLand} ac`} valCls={eco.freeLand < 10 ? s.red : undefined} />
            <RpStat imageId="buildings"    icon={<IconBuildingCastle size={12}/>} lbl="Buildings"   val={totalBld} />
            <RpStat imageId="army"         icon={<IconSword size={12}/>}          lbl="Army"        val={`${totalArmy} units`} />
            <RpStat imageId="gold-gen"     icon={<IconCoin size={12}/>}           lbl="Gold/hr"     val={`+${eco.goldGen}`}    valCls={s.gold} />
            <RpStat imageId="mana-gen"     icon={<IconSparkles size={12}/>}       lbl="Mana/hr"     val={`+${eco.manaGen}`}    valCls={s.mana2} />
            <RpStat imageId="gold-upkeep"  icon={<IconCoin size={12}/>}           lbl="Gold upkeep" val={`-${eco.goldUpkeep}/hr`} valCls={s.red} />
            <RpStat imageId="mana-upkeep"  icon={<IconSparkles size={12}/>}       lbl="Mana upkeep" val={`-${eco.manaUpkeep}/hr`} valCls={s.red} />
          </div>
          <div className={s.rpSection} data-tour="army-roster">
            <button className={s.rpCollapseTrigger} onClick={() => setRpArmyOpen(o => !o)}>
              <span className={s.rpTitle} style={{margin:0}}>Army Roster</span>
              <IconChevronDown size={13} style={{ transition: 'transform .2s', transform: rpArmyOpen ? 'rotate(0deg)' : 'rotate(-90deg)', color: 'var(--muted)' }} />
            </button>
            <div className={`${s.rpCollapseBody} ${rpArmyOpen ? s.rpCollapseOpen : ''}`}>
              <div>
                {armyEntries.length === 0 && mercEntries.length === 0
                  ? <div className={s.muted}>No units recruited yet.</div>
                  : <div className={s.rpArmyGrid}>
                      {armyEntries.map(u => (
                        <div key={u.id} className={s.rpArmyCard} style={{'--fc': f.color}}>
                          <div className={s.rpArmyThumb}>
                            <UnitPortrait unitId={u.id} artType={u.artType} factionColor={f.color} size={72} />
                            <div className={s.rpArmyOverlay} />
                          </div>
                          <div className={s.rpArmyName}>{u.name}</div>
                          <div className={s.rpArmyCount}>{gs.army[u.id]}</div>
                        </div>
                      ))}
                      {mercEntries.map(m => (
                        <div key={`merc-${m.unitId}`} className={s.rpArmyCard} style={{'--fc': m.factionColor}} title={`Mercenary — hired from the ${m.factionName}, 85% power`}>
                          <div className={s.rpArmyThumb}>
                            <UnitPortrait unitId={m.unitId} artType={m.artType} factionColor={m.factionColor} size={72} />
                            <div className={s.rpArmyOverlay} />
                          </div>
                          <div className={s.rpArmyName}>{m.name} <span style={{fontSize:8,color:'var(--muted)',fontWeight:400}}>(Merc)</span></div>
                          <div className={s.rpArmyCount}>{m.quantity}</div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>
          {gs?.items?.length > 0 && (
            <div className={s.rpSection}>
              <button className={s.rpCollapseTrigger} onClick={() => setRpItemsOpen(o => !o)}>
                <span className={s.rpTitle} style={{margin:0}}>Items ({gs.items.length})</span>
                <IconChevronDown size={13} style={{ transition: 'transform .2s', transform: rpItemsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', color: 'var(--muted)' }} />
              </button>
              <div className={`${s.rpCollapseBody} ${rpItemsOpen ? s.rpCollapseOpen : ''}`}>
              <div>
                {gs.items.map((item, i) => {
                  const rc = RARITY_COLOR[item.rarity] || 'var(--gold)'
                  const catColor = item.itemCategory === 'consumable' ? 'var(--green)' : item.itemCategory === 'artifact' ? 'var(--mana2)' : rc
                  const label = item.itemCategory === 'consumable' ? item.effectLabel : item.passiveLabel
                  return (
                    <div key={i} style={{padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{fontSize:11,color:rc,fontWeight:500,flex:1}}>{item.name}</div>
                        {item.qty > 1 && <div style={{fontSize:10,color:catColor,fontWeight:700}}>×{item.qty}</div>}
                      </div>
                      {label && <div style={{fontSize:9,color:'var(--muted)',marginTop:1}}>{label}</div>}
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* ── Battle Wizard ── */}
    {battleConfig && (() => {
      // The Battle tab's rows now come from the proximity-matched targets
      // feed rather than the (size-capped) rankings list, so check both —
      // whichever one actually has this opponent.
      const target      = rankings.find(r => r._id === battleConfig.targetId) || targets.find(r => r._id === battleConfig.targetId) || { name: 'Unknown', power: 500, faction: 'flame' }
      const tf          = FACTIONS[target.faction] || { color: 'var(--red)' }
      const usableItems = Object.values(
        (gs?.items || [])
          .filter(i => i.itemCategory === 'consumable' || i.effect || i.itemCategory === 'artifact' || i.transferChance !== undefined)
          .reduce((acc, i) => {
            if (acc[i.id]) { acc[i.id] = { ...acc[i.id], qty: (acc[i.id].qty || 1) + (i.qty || 1) } }
            else acc[i.id] = { ...i }
            return acc
          }, {})
      )
      const selectedItem = usableItems.find(i => i.id === bcItem)

      const hasAnySelected = Object.values(bcUnits).some(q => q > 0)
      const myPow   = hasAnySelected
        ? calcCombatPower(player?.faction, gs, bcUnits)
        : 0
      const tPow    = target.power || 1
      const baseWinPct  = myPow > 0 ? Math.round(Math.min(0.95, Math.max(0.05, myPow / (myPow + tPow))) * 100) : 0
      const favored     = baseWinPct >= 50
      const itemBoostRaw = selectedItem?.effect?.winChanceBoost || 0
      const itemBoostPct = Math.round(itemBoostRaw * 100)
      const displayPct  = myPow > 0 ? Math.min(95, baseWinPct + itemBoostPct) : 0
      const winColor    = displayPct >= 50 ? 'var(--green)' : displayPct === 0 ? 'var(--muted)' : 'var(--red)'
      const winLabel    = myPow === 0
        ? 'Select units to raid'
        : `${displayPct}% win chance${itemBoostPct ? ` (+${itemBoostPct}% item)` : ''}`
      const totalSelected = Object.values(bcUnits).reduce((s, q) => s + q, 0)

      const STEPS = ['Select Units', 'Battle Item', 'Raid']

      return (
        <div className={s.bcOverlay} onClick={() => setBattleConfig(null)}>
          <div className={s.bcModal} style={{'--fc': f?.color || '#c94040'}} onClick={e => e.stopPropagation()}>
            {/* Wispy tendrils — inside modal, behind all content via z-index */}
            <div className={s.bcWisps} aria-hidden="true">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`${s.bcWisp} ${s['bcWisp'+i]}`} />)}
            </div>

            {/* ── Top bar: target info + close ── */}
            <div className={s.bcTopBar}>
              <div className={s.bcTargetChip} style={{ '--tc': tf.color }}>
                <NavIcon id="battle" FallbackIcon={IconShieldBolt} />
                <span>Raiding</span>
                <span className={s.bcTargetName}>{target.name}</span>
                <span className={s.bcWinBadge} style={{ color: winColor }}>{winLabel}</span>
              </div>
              <button className={s.bcClose} onClick={() => setBattleConfig(null)}><IconX size={15}/></button>
            </div>

            {/* ── Breadcrumb ── */}
            <div className={s.bcCrumb}>
              {STEPS.map((label, i) => {
                const stepNum  = i + 1
                const isActive = stepNum === bcStep
                const isDone   = stepNum < bcStep
                const isLast   = i === STEPS.length - 1
                return (
                  <React.Fragment key={label}>
                    <div
                      className={`${s.bcCrumbStep} ${isActive ? s.bcCrumbActive : ''} ${isDone ? s.bcCrumbDone : ''}`}
                      onClick={() => !isLast && stepNum <= bcStep && setBcStep(stepNum)}
                      style={{ cursor: !isLast && stepNum <= bcStep ? 'pointer' : 'default' }}
                    >
                      <div className={s.bcCrumbDot}>
                        {isDone ? <IconCheck size={10}/> : <span>{stepNum}</span>}
                      </div>
                      <span className={s.bcCrumbLabel}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`${s.bcCrumbLine} ${isDone ? s.bcCrumbLineDone : ''}`} />}
                  </React.Fragment>
                )
              })}
            </div>

            {/* ── Step body ── */}
            <div className={s.bcBody}>

              {/* STEP 1 — Select Units */}
              {bcStep === 1 && (
                <div className={s.bcStepPane}>
                  <div className={s.bcStepHint}>Choose which units to bring. Leave all at 0 to send your full army.</div>
                  <div className={s.bcUnitGrid}>
                    {f?.units?.map(u => {
                      const owned = gs?.army?.[u.id] || 0
                      if (!owned) return null
                      const qty = bcUnits[u.id] || 0
                      const pct = owned > 0 ? qty / owned : 0
                      return (
                        <div key={u.id} className={s.bcUnitCard}>
                          <div className={s.bcUnitThumb}>
                            <UnitPortrait unitId={u.id} artType={u.artType} factionColor={f.color} size={44} />
                          </div>
                          <div className={s.bcUnitInfo}>
                            <div className={s.bcUnitName}>{u.name}</div>
                            <div className={s.bcUnitBar}>
                              <div className={s.bcUnitBarFill} style={{ width: `${pct * 100}%`, background: f.color }} />
                            </div>
                            <div className={s.bcUnitOwned}>{qty.toLocaleString()} / {owned.toLocaleString()}</div>
                          </div>
                          <div className={s.bcUnitQty}>
                            <button className={s.bcQtyBtn} onClick={() => setBcUnits(p => ({ ...p, [u.id]: Math.max(0, (p[u.id]||0) - Math.max(1, Math.floor((p[u.id]||0) * 0.1))) }))}>−</button>
                            <input
                              type="number" min={0} max={owned} value={qty}
                              className={s.bcQtyInput}
                              onChange={e => setBcUnits(p => ({ ...p, [u.id]: Math.max(0, Math.min(owned, parseInt(e.target.value) || 0)) }))}
                            />
                            <button className={s.bcQtyBtn} onClick={() => setBcUnits(p => ({ ...p, [u.id]: Math.min(owned, (p[u.id]||0) + Math.max(1, Math.floor(owned * 0.1))) }))}>+</button>
                            <button className={s.bcQtyMax} onClick={() => setBcUnits(p => ({ ...p, [u.id]: owned }))}>Max</button>
                          </div>
                        </div>
                      )
                    })}
                    {(gs?.mercs || []).map(m => {
                      const owned = m.quantity || 0
                      if (!owned) return null
                      const qty = bcUnits[m.unitId] || 0
                      const pct = owned > 0 ? qty / owned : 0
                      return (
                        <div key={m.unitId} className={s.bcUnitCard}>
                          <div className={s.bcUnitThumb}>
                            <UnitPortrait unitId={m.unitId} artType={m.artType} factionColor={m.factionColor} size={44} />
                          </div>
                          <div className={s.bcUnitInfo}>
                            <div className={s.bcUnitName}>{m.name} <span style={{fontSize:8,color:'var(--muted)',fontWeight:400}}>(Merc)</span></div>
                            <div className={s.bcUnitBar}>
                              <div className={s.bcUnitBarFill} style={{ width: `${pct * 100}%`, background: m.factionColor }} />
                            </div>
                            <div className={s.bcUnitOwned}>{qty.toLocaleString()} / {owned.toLocaleString()}</div>
                          </div>
                          <div className={s.bcUnitQty}>
                            <button className={s.bcQtyBtn} onClick={() => setBcUnits(p => ({ ...p, [m.unitId]: Math.max(0, (p[m.unitId]||0) - Math.max(1, Math.floor((p[m.unitId]||0) * 0.1))) }))}>−</button>
                            <input
                              type="number" min={0} max={owned} value={qty}
                              className={s.bcQtyInput}
                              onChange={e => setBcUnits(p => ({ ...p, [m.unitId]: Math.max(0, Math.min(owned, parseInt(e.target.value) || 0)) }))}
                            />
                            <button className={s.bcQtyBtn} onClick={() => setBcUnits(p => ({ ...p, [m.unitId]: Math.min(owned, (p[m.unitId]||0) + Math.max(1, Math.floor(owned * 0.1))) }))}>+</button>
                            <button className={s.bcQtyMax} onClick={() => setBcUnits(p => ({ ...p, [m.unitId]: owned }))}>Max</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {totalSelected > 0 && (
                    <div className={s.bcTotalRow}><IconSword size={11}/> Sending {totalSelected.toLocaleString()} units</div>
                  )}
                  {totalSelected === 0 && (
                    <div className={s.bcTotalRow} style={{ color: 'var(--muted)' }}>Full army will be deployed</div>
                  )}
                </div>
              )}

              {/* STEP 2 — Battle Item */}
              {bcStep === 2 && (
                <div className={s.bcStepPane}>
                  <div className={s.bcStepHint}>Equip one consumable or artifact to gain an edge in battle. This is optional.</div>
                  {usableItems.length === 0 ? (
                    <div className={s.bcNoItems}>
                      <IconGavel size={28} opacity={0.2} />
                      <span>No items in inventory.</span>
                      <span style={{ color: 'var(--muted)', fontSize: 10 }}>Visit the Auction House to purchase consumables and artifacts.</span>
                    </div>
                  ) : (
                    <div className={s.bcItemGrid}>
                      {/* None row */}
                      <div className={`${s.bcItemTile} ${!bcItem ? s.bcItemTileSelected : ''}`} onClick={() => setBcItem('')}>
                        <div className={s.bcItemTileIcon}><IconX size={16} color="var(--muted)" /></div>
                        <div className={s.bcItemTileBody}>
                          <div className={s.bcItemTileName} style={{ color: 'var(--muted)' }}>No item</div>
                          <div className={s.bcItemTileEffect}>Go into battle unequipped</div>
                        </div>
                        {!bcItem && <div className={s.bcItemTileCheck}><IconCheck size={11} color="#fff"/></div>}
                      </div>
                      {usableItems.map(item => {
                        const rc       = RARITY_COLOR[item.rarity] || 'var(--gold)'
                        const catColor = item.itemCategory === 'artifact' ? 'var(--mana2)' : 'var(--green)'
                        const chosen   = bcItem === item.id
                        return (
                          <div key={item.id}
                            className={`${s.bcItemTile} ${chosen ? s.bcItemTileSelected : ''}`}
                            style={{ '--rc': rc }}
                            onClick={() => setBcItem(chosen ? '' : item.id)}>
                            <div className={s.bcItemTileIcon}>
                              <ItemArt id={item.id} artType={item.artType} rarity={item.rarity} size={40} />
                            </div>
                            <div className={s.bcItemTileBody}>
                              <div className={s.bcItemTileName} style={{ color: rc }}>{item.name}</div>
                              <div className={s.bcItemTileMeta}>
                                <span style={{ color: catColor }}>{item.itemCategory}</span>
                                {(item.effectLabel || item.passiveLabel) && (
                                  <span style={{ color: 'var(--muted)' }}>{item.effectLabel || item.passiveLabel}</span>
                                )}
                              </div>
                            </div>
                            {item.qty > 1 && <div className={s.bcItemTileQty} style={{ '--rc': rc }}>×{item.qty}</div>}
                            {chosen && <div className={s.bcItemTileCheck}><IconCheck size={11} color="#fff"/></div>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Summary card */}
                  {selectedItem && (() => {
                    const rc = RARITY_COLOR[selectedItem.rarity] || 'var(--gold)'
                    return (
                      <div className={s.bcSummaryCard} style={{ '--rc': rc }}>
                        <div className={s.bcSummaryIcon}><ItemArt id={selectedItem.id} artType={selectedItem.artType} rarity={selectedItem.rarity} size={32} /></div>
                        <div className={s.bcSummaryText}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: rc }}>{selectedItem.name} equipped</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{selectedItem.effectLabel || selectedItem.passiveLabel}</div>
                        </div>
                        <IconCheck size={14} color="var(--green)" style={{ flexShrink: 0 }} />
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={s.bcFooter}>
              <div className={s.bcCostNote}><IconClock size={12}/> 3 turns</div>
              {bcStep === 1 ? (
                <>
                  <button className={s.bcCancel} onClick={() => setBattleConfig(null)}>Cancel</button>
                  <AnimBtn className={`${s.ubtn} ${s.bcNextBtn}`} variant="pop" onClick={() => setBcStep(2)}>
                    Select Item <IconChevronRight size={13}/>
                  </AnimBtn>
                </>
              ) : (
                <>
                  <button className={s.bcCancel} onClick={() => setBcStep(1)}>
                    <IconChevronLeft size={13}/> Back
                  </button>
                  <AnimBtn className={`${s.ubtn} ${s.bcConfirmBtn}`} variant="slash"
                    disabled={loading || (gs?.turns || 0) < 3}
                    onClick={doBattle}>
                    <AnimatedIcon><IconSwords size={13}/></AnimatedIcon>
                    Launch Raid
                  </AnimBtn>
                </>
              )}
            </div>
          </div>
        </div>
      )
    })()}
    <ToastStack toasts={toasts} onDismiss={dismissToast} />

    {/* ── Welcome Modal ── */}
    {showWelcome && f && (
      <WelcomeModal
        faction={faction}
        factionData={f}
        t1UnitNames={f.units.filter(u => u.tier === 1).map(u => u.name)}
        goldBldName={f.buildings.find(b => b.goldPerBld)?.name}
        onStartTour={handleStartTour}
        onSkipTour={handleSkipTour}
      />
    )}

    {/* ── Onboarding Tour ── */}
    {showTour && <OnboardingTour onComplete={handleTourComplete} />}

    {/* ── Daily Streak Modal ── */}
    {showStreak && streakRewardData && f && (
      <DailyRewardModal
        rewardData={streakRewardData}
        factionData={f}
        faction={faction}
        streakBroke={streakBroke}
        shieldUsed={shieldUsed}
        alreadyClaimed={!!gs?.streak?.claimedToday}
        onClose={() => setShowStreak(false)}
        onClaim={async () => {
          // Actual gold/mana/land/turns are granted and verified server-side;
          // this just tells the backend "credit today's reward" and refreshes state.
          await claimStreakReward()
          setShowStreak(false)
        }}
      />
    )}
    </>
  )
}

// ── Small components ──────────────────────────────────────────────────────────
function StatIcon({ imageId, folder = 'overview', fallback, color }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div style={{color:color||'var(--muted)',opacity:0.75}}>{React.cloneElement(fallback,{size:18})}</div>
  return <img src={`/images/${folder}/${imageId}.png`} alt="" onError={() => setFailed(true)} style={{width:18,height:18,objectFit:'contain',flexShrink:0,opacity:.85}} />
}
function Stat({ icon, imageId, folder = 'overview', label, value, sub, color, subColor }) {
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--rad)',padding:'12px 16px',minWidth:88,display:'flex',flexDirection:'column',gap:2}}>
      {(imageId || icon) && (
        <div style={{marginBottom:4,display:'flex',alignItems:'center'}}>
          {imageId ? <StatIcon imageId={imageId} folder={folder} fallback={icon} color={color} /> : <div style={{color:color||'var(--muted)',opacity:0.75}}>{React.cloneElement(icon,{size:18})}</div>}
        </div>
      )}
      <div style={{fontSize:20,fontWeight:500,color:color||'var(--text)',lineHeight:1}}>{value}</div>
      <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',marginTop:1}}>{label}</div>
      {sub && <div style={{fontSize:10,color:subColor||'var(--muted)',marginTop:1}}>{sub}</div>}
    </div>
  )
}
function ExploreCard({ icon, heroBg, fc, name, imageId, turnCost, goldBonus, manaBonus, desc, blockMsg, onClick, disabled }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = imageId && !imgFailed
  return (
    <div className={s.ucard} style={{ '--fc': fc }}>
      <div className={s.ucardHero}>
        {showImg
          ? <img src={`/images/explore-cards/${imageId}.jpg`} alt={name} onError={() => setImgFailed(true)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
          : <div style={{width:'100%',height:'100%',background:heroBg,display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
        }
        <div className={s.ucardHeroOverlay} style={{background:'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)'}} />
        <div className={s.ucardTopRow}>
          <span className={s.ucardTier}>{turnCost} turn{turnCost > 1 ? 's' : ''}</span>
        </div>
        <div className={s.ucardNameRow}>
          <span className={s.ucardName}>{name}</span>
        </div>
      </div>
      <div className={s.ucardBody}>
        <div className={s.ucardDescWrap}><div className={s.ucardDesc} style={{fontSize:10, color:'var(--muted)', lineHeight:1.55}}>{desc}</div><div className={s.ucardDescTooltip}>{desc}</div></div>
        <div className={s.ucardCost}>
          <span style={{color:'var(--gold)'}}><IconCoin size={10}/> +{goldBonus}g bonus</span>
          {manaBonus > 0 && <span style={{color:'var(--mana2)'}}><IconSparkles size={10}/> +{manaBonus}m bonus</span>}
        </div>
      </div>
      <div className={s.ucardFoot}>
        {blockMsg && <div className={s.blockReason} style={{marginBottom:8}}>{blockMsg}</div>}
        <AnimBtn className={s.ucardBtn} variant="shake"
          style={{background: fc === 'var(--gold)' ? 'rgba(201,168,76,0.12)' : 'rgba(109,204,170,0.12)', color: fc, border: `1px solid ${fc === 'var(--gold)' ? 'rgba(201,168,76,0.3)' : 'rgba(109,204,170,0.3)'}`}}
          onClick={onClick} disabled={disabled}>
          <AnimatedIcon><IconCompass size={12}/></AnimatedIcon> Explore
        </AnimBtn>
      </div>
    </div>
  )
}
// Local fallback ranges, used only before the first /game/state response
// populates gs.resourceTiers (server/gameData.js RESOURCE_TIERS is the
// source of truth -- these mirror its floor/cap values so the card never
// shows something the server couldn't actually pay out).
const RESOURCE_TIER_FALLBACK = {
  peddler:  { minGold: 8,  maxGold: 180,  minMana: 2,  maxMana: 60,  itemChance: 0.04 },
  smuggler: { minGold: 30, maxGold: 650,  minMana: 8,  maxMana: 220, itemChance: 0.10 },
  caravan:  { minGold: 90, maxGold: 1800, minMana: 25, maxMana: 600, itemChance: 0.18 },
}
function ResourceExploreCard({ icon, fc, name, imageId, turnCost, tierKey, preview, desc, blockMsg, onClick, disabled }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = imageId && !imgFailed
  const p = preview || RESOURCE_TIER_FALLBACK[tierKey] || {}
  const pct = Math.round((p.itemChance || 0) * 100)
  return (
    <div className={s.ucard} style={{ '--fc': fc }}>
      <div className={s.ucardHero}>
        {showImg
          ? <img src={`/images/explore-cards/${imageId}.jpg`} alt={name} onError={() => setImgFailed(true)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
          : <div style={{width:'100%',height:'100%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
        }
        <div className={s.ucardHeroOverlay} style={{background:'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)'}} />
        <div className={s.ucardTopRow}>
          <span className={s.ucardTier}>{turnCost} turn{turnCost > 1 ? 's' : ''}</span>
        </div>
        <div className={s.ucardNameRow}>
          <span className={s.ucardName}>{name}</span>
        </div>
      </div>
      <div className={s.ucardBody}>
        <div className={s.ucardDescWrap}><div className={s.ucardDesc} style={{fontSize:10, color:'var(--muted)', lineHeight:1.55}}>{desc}</div><div className={s.ucardDescTooltip}>{desc}</div></div>
        <div className={s.ucardCost}>
          <span style={{color:'var(--gold)'}}><IconCoin size={10}/> {p.minGold}–{p.maxGold}g</span>
          <span style={{color:'var(--mana2)'}}><IconSparkles size={10}/> {p.minMana}–{p.maxMana}m</span>
        </div>
        {pct > 0 && (
          <div style={{fontSize:9,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
            <IconGift size={11} color="var(--silver)"/> {pct}% chance to find an item
          </div>
        )}
      </div>
      <div className={s.ucardFoot}>
        {blockMsg && <div className={s.blockReason} style={{marginBottom:8}}>{blockMsg}</div>}
        <AnimBtn className={s.ucardBtn} variant="shake"
          style={{background: 'rgba(201,168,76,0.12)', color: fc, border: '1px solid rgba(201,168,76,0.3)'}}
          onClick={onClick} disabled={disabled}>
          <AnimatedIcon><IconTruck size={12}/></AnimatedIcon> Trade
        </AnimBtn>
      </div>
    </div>
  )
}
function NavIcon({ id, FallbackIcon }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <FallbackIcon size={20} />
  return (
    <img
      src={`/images/nav/${id}.png`}
      alt=""
      onError={() => setFailed(true)}
      style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}

function ActionCard({ icon, name, cost, desc, onClick, disabled, color = 'var(--silver)', imageId, heroRatio = '16/9', stacked = false }) {
  const [animClass, trigger] = useAnimatedClick()
  const [imgFailed, setImgFailed] = useState(false)
  const handleClick = () => { if (!disabled) { trigger('shake'); onClick?.() } }
  const showImg = imageId && !imgFailed
  return (
    <div
      onClick={handleClick}
      className={`${s.ucard} ${animClass}`}
      style={{ '--fc': color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}
    >
      <div className={s.ucardHero} style={{ aspectRatio: heroRatio, background: showImg ? 'var(--bg2)' : `radial-gradient(ellipse at center, ${color}18 0%, var(--bg2) 70%)` }}>
        {showImg
          ? <img src={`/images/actions/${imageId}.jpg`} alt={name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          : <div style={{ color, opacity: 0.9 }}><AnimatedIcon>{icon}</AnimatedIcon></div>
        }
        <div className={s.ucardHeroOverlay} style={{ background: stacked ? 'linear-gradient(to top, var(--bg3) 0%, transparent 28%)' : 'linear-gradient(to top, color-mix(in srgb, var(--bg3) 80%, black) 15%, color-mix(in srgb, var(--bg3) 45%, transparent) 38%, transparent 68%)' }} />
        {!stacked && (
          <div className={s.ucardNameRow}>
            <span className={s.ucardName}>{name}</span>
            <span className={s.ucardRole} style={{ background: `${color}33`, color }}>{cost}</span>
          </div>
        )}
      </div>
      <div className={s.ucardBody}>
        {stacked && (
          <div style={{ marginBottom: 6 }}>
            <div className={s.ucardName} style={{ color: 'var(--text)', fontSize: 13, marginBottom: 4 }}>{name}</div>
            <span className={s.ucardRole} style={{ background: `${color}22`, color }}>{cost}</span>
          </div>
        )}
        <div className={s.ucardDescWrap}><div className={s.ucardDesc} style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div><div className={s.ucardDescTooltip}>{desc}</div></div>
      </div>
      <div className={s.ucardFoot}>
        <div className={s.ucardBtn} style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
          Open →
        </div>
      </div>
    </div>
  )
}
function LedgerCard({ title, color, icon, rows, total }) {
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--rad2)',padding:14}}>
      <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:6,color}}>{icon}{title}</div>
      {rows.map((r,i) => (
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:11}}>
          <span style={{color:'var(--muted)'}}>{r.lbl}</span>
          <span style={{color:r.pos?'var(--green)':'var(--red)'}}>{r.val}</span>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,fontSize:12,fontWeight:500}}>
        <span style={{color:'var(--muted)'}}>Net /hr</span>
        <span style={{color:total>=0?'var(--green)':'var(--red)'}}>{total>=0?'+':''}{total}</span>
      </div>
    </div>
  )
}
function Guide({ color, icon, title, items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--rad)',padding:12}}>
      <button onClick={() => setOpen(o => !o)} style={{all:'unset',cursor:'pointer',width:'100%',display:'flex',alignItems:'center',gap:5}}>
        <span style={{color,fontWeight:500,fontSize:11,display:'flex',alignItems:'center',gap:5,flex:1}}>{icon}{title}</span>
        <IconChevronDown size={11} style={{color:'var(--muted)',flexShrink:0,transition:'transform .18s',transform:open?'rotate(0deg)':'rotate(-90deg)'}} />
      </button>
      {open && <div style={{marginTop:6}}>
        {items.map((it,i) => <div key={i} style={{fontSize:10,color:'var(--muted)',lineHeight:1.7,marginTop:2}}>{it}</div>)}
      </div>}
    </div>
  )
}
function TbStatIcon({ imageId, Icon }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Icon size={14} color="var(--muted)" />
  return <img src={`/images/header/${imageId}.png`} alt="" onError={() => setFailed(true)} style={{width:14,height:14,objectFit:'contain',flexShrink:0,opacity:.8}} />
}
function TbStat({ Icon, imageId, val, color }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:5}}>
      <TbStatIcon imageId={imageId} Icon={Icon} />
      <span style={{fontSize:13,fontWeight:500,color:color||'var(--text)'}}>{val}</span>
    </div>
  )
}
function EbIcon({ imageId, fallback }) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return <img src={`/images/toolbar/${imageId}.png`} alt="" onError={() => setFailed(true)} style={{width:14,height:14,objectFit:'contain',flexShrink:0}} />
}
function EbItem({ icon, imageId, label, value, rate, ratePos, barWidth, barCls, valCls }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {imageId ? <EbIcon imageId={imageId} fallback={icon} /> : icon}
      <span style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)'}}>{label}</span>
      <div style={{width:100,height:4,background:'rgba(255,255,255,.07)',borderRadius:2,overflow:'hidden'}}>
        <div className={barCls} style={{height:'100%',width:`${barWidth}%`,borderRadius:2,transition:'width .4s'}}/>
      </div>
      <span className={valCls} style={{fontSize:12,fontWeight:500}}>{value}</span>
      <span style={{fontSize:10,color:ratePos===false?'var(--red)':ratePos?'var(--green)':'var(--muted)'}}>{rate}</span>
    </div>
  )
}
function RpStatIcon({ imageId, fallback, size = 12 }) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return <img src={`/images/stats/${imageId}.png`} alt="" onError={() => setFailed(true)} style={{width:size,height:size,objectFit:'contain',flexShrink:0,opacity:.85}} />
}
function RpStat({ icon, imageId, lbl, val, valCls }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.04)',fontSize:11}}>
      <span style={{color:'var(--muted)',display:'flex',alignItems:'center',gap:5}}>
        {imageId ? <RpStatIcon imageId={imageId} fallback={icon} /> : icon}
        {lbl}
      </span>
      <span className={valCls} style={{fontWeight:500}}>{val}</span>
    </div>
  )
}

// ── Feed icon / color maps ────────────────────────────────────────────────────
const FEED_ICON_MAP = {
  explore: IconCompass, build: IconHammer, recruit: IconSword,
  purchase: IconGavel,  win: IconTrophy,   lose: IconSkull,
  err: IconAlertTriangle, info: IconInfoCircle, res: IconCheck, ev: IconInfoCircle,
}
const FEED_COLOR_MAP = {
  explore: 'var(--green)', build: 'var(--gold)', recruit: '#e87848',
  purchase: 'var(--gold)', win: 'var(--green)',  lose: 'var(--red)',
  err: 'var(--red)', info: 'var(--muted)', res: 'var(--silver)', ev: 'var(--muted)',
}

function FeedEntryIcon({ type, IconComp, color }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{width:28,height:28,borderRadius:7,background:`${color === 'var(--muted)' ? 'rgba(255,255,255,.07)' : color + '18'}`,border:`1px solid ${color === 'var(--muted)' ? 'rgba(255,255,255,.08)' : color + '33'}`,display:'flex',alignItems:'center',justifyContent:'center',color,flexShrink:0,marginTop:1,overflow:'hidden'}}>
      {failed
        ? <IconComp size={13}/>
        : <img src={`/images/log/${type}.png`} alt="" onError={() => setFailed(true)} style={{width:16,height:16,objectFit:'contain'}} />
      }
    </div>
  )
}
function FeedEntry({ entry }) {
  const type     = entry.icon || entry.cls || 'info'
  const IconComp = FEED_ICON_MAP[type] || IconInfoCircle
  const color    = FEED_COLOR_MAP[type] || 'var(--muted)'
  return (
    <div style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)',alignItems:'flex-start'}}>
      <FeedEntryIcon type={type} IconComp={IconComp} color={color} />
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'var(--text)',lineHeight:1.4}}>{entry.msg}</div>
        {entry.subtext && <div style={{fontSize:9.5,color:'var(--muted)',marginTop:2,lineHeight:1.4}}>{entry.subtext}</div>}
      </div>
      <div style={{fontSize:9,color:'var(--muted)',flexShrink:0,paddingTop:2,whiteSpace:'nowrap'}}>{entry.ts}</div>
    </div>
  )
}

function BattleCard({ entry, defaultExpanded = false, compact = false }) {
  const [open, setOpen] = useState(defaultExpanded)
  const { result, ts } = entry
  const won      = result.win
  const accent   = won ? '#6dccaa' : '#e87878'
  const ratio    = result.powerRatio || 1
  const pctLabel = ratio >= 1.3 ? 'Uphill battle' : ratio <= 0.75 ? 'Dominant match' : 'Balanced fight'
  const winOdds  = result.winChance != null ? `${Math.round(result.winChance * 100)}%` : '—'
  // Per-unit casualty simulation isn't implemented server-side yet — battles
  // only move gold/mana/land, so this always renders as "no losses" for now.
  const casualties = Object.entries(result.casualties || {}).filter(([, c]) => c.lost > 0)

  return (
    <div className={`${s.bcCard} ${won ? s.bcCardWin : s.bcCardLose}`}
         style={{'--fc': won ? '#6dccaa' : '#e87878', border:`1px solid ${accent}33`, background:'var(--bg2)'}}>

      {/* ── Wisps ── */}
      <div className={s.bcCardWisps} aria-hidden="true">
        {[1,2,3,4,5,6].map(i => <div key={i} className={`${s.bcCardWisp} ${s['bcCardWisp'+i]}`}/>)}
      </div>

      {/* ── Hero banner ── */}
      <div className={s.bcHero} onClick={() => setOpen(o => !o)} style={{cursor:'pointer',userSelect:'none'}}>
        {/* Win/loss art, not faction art -- a triumphant siege scene for a
            win, a hellish battlefield for a loss, regardless of who the
            opponent was. */}
        <img className={s.bcHeroBg} src={won ? '/images/battle/victory-hero.jpg' : '/images/battle/defeat-hero.jpg'} alt="" aria-hidden="true"/>
        <div className={s.bcHeroGrad}/>
        <div className={s.bcHeroContent}>
          {/* Left: result badge */}
          <div className={`${s.bcResultBadge} ${won ? s.bcResultBadgeWin : s.bcResultBadgeLose}`}>
            <img src={won ? '/images/battle/victory.png' : '/images/battle/defeat.png'} alt="" aria-hidden="true" style={{width:42,height:42,objectFit:'contain',filter: won ? 'drop-shadow(0 0 8px rgba(109,204,170,.8))' : 'drop-shadow(0 0 8px rgba(232,120,120,.8))'}}/>
            <div>
              <div>{won ? 'Victory' : 'Defeat'}</div>
              <div style={{fontSize:9,fontWeight:400,letterSpacing:.04,textTransform:'none',color:'rgba(255,255,255,.5)',marginTop:1}}>{result.targetName}</div>
            </div>
          </div>

          {/* Center: chips */}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,flexWrap:'wrap',padding:'0 12px'}}>
            {won ? <>
              <Chip icon={<IconCoin size={9}/>}     color="#f0d980"  bg="rgba(0,0,0,.25)"  border="rgba(240,217,128,.45)"  label={`+${result.goldGain}g plundered`}/>
              <Chip icon={<IconSparkles size={9}/>} color="#b8aff5"  bg="rgba(0,0,0,.25)"  border="rgba(184,175,245,.45)"  label={`+${result.manaGain}m seized`}/>
              <Chip icon={<IconMap size={9}/>}      color="#7debb8"  bg="rgba(0,0,0,.25)"  border="rgba(125,235,184,.45)"  label={`+${result.landGain} acres`}/>
            </> : <>
              <Chip icon={<IconCoin size={9}/>}     color="#f09090"  bg="rgba(0,0,0,.25)"  border="rgba(240,144,144,.45)"  label={`−${result.goldLoss}g lost`}/>
              <Chip icon={<IconSparkles size={9}/>} color="#f09090"  bg="rgba(0,0,0,.25)"  border="rgba(240,144,144,.45)"  label={`−${result.manaLoss}m lost`}/>
            </>}
            {result.totalCasualties > 0 && (
              <Chip icon={<IconSkull size={9}/>} color="#f09090" bg="rgba(0,0,0,.25)" border="rgba(240,144,144,.45)" label={`${result.totalCasualties} unit${result.totalCasualties > 1?'s':''} lost`}/>
            )}
          </div>

          {/* Right: meta + chevron */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
            <span style={{color:'rgba(255,255,255,.9)',display:'flex'}}>{open ? <IconChevronUp size={13}/> : <IconChevronDown size={13}/>}</span>
            <span style={{fontSize:9,color:'rgba(255,255,255,.75)'}}>{ts}</span>
            <span style={{fontSize:9,color:'#fff',background:'rgba(0,0,0,.45)',border:'1px solid rgba(255,255,255,.25)',padding:'2px 5px',borderRadius:3,letterSpacing:.5}}>{pctLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {open && (() => {
        const f = FACTIONS[result.playerFaction] || {}
        const unitMap = {}
        ;(f.units || []).forEach(u => { unitMap[u.id] = u })
        const item = result.usedItem
        const itemEffects = item ? (() => {
          const e = item.effect || {}
          const arr = []
          if (e.winChanceBoost)    arr.push({ label: 'Win chance', value: `+${Math.round(e.winChanceBoost * 100)}%`, color: 'var(--green)' })
          if (e.atkBoost)          arr.push({ label: 'Attack',     value: `+${Math.round(e.atkBoost * 100)}%`,       color: 'var(--gold)' })
          if (e.defBoost)          arr.push({ label: 'Defense',    value: `+${Math.round(e.defBoost * 100)}%`,       color: 'var(--mana2)' })
          if (e.casualtyReduction) arr.push({ label: 'Casualties', value: `−${Math.round(e.casualtyReduction * 100)}%`, color: '#6dccaa' })
          return arr
        })() : []
        const consumed = item ? (item.qty || 1) <= 1 : false
        return (
          <div style={{padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:0,position:'relative',zIndex:1}}>

            {/* ── Casualties: icon strip ── */}
            <div style={{paddingRight:20,flexShrink:0}}>
              <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Casualties</div>
              {casualties.length === 0
                ? <div style={{fontSize:10,color:'var(--muted)',fontStyle:'italic',lineHeight:'38px'}}>Flawless</div>
                : <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {casualties.map(([uid, c]) => {
                      const u = unitMap[uid]
                      const pct = c.original ? Math.round((c.lost / c.original) * 100) : 50
                      return (
                        <div key={uid} title={`${c.name}: −${c.lost} (${pct}%)`}
                             style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <div style={{position:'relative'}}>
                            <UnitPortrait unitId={uid} artType={u?.artType} factionColor={f.color} size={36}/>
                            <div style={{position:'absolute',bottom:-3,right:-3,background:'#c0392b',border:'1.5px solid var(--bg2)',borderRadius:4,fontSize:8,fontWeight:700,color:'#fff',padding:'0 3px',lineHeight:'14px',minWidth:14,textAlign:'center'}}>
                              −{c.lost}
                            </div>
                          </div>
                          <div style={{fontSize:7.5,color:'var(--muted)',maxWidth:36,textAlign:'center',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>

            {/* divider */}
            <div style={{width:1,alignSelf:'stretch',background:'rgba(255,255,255,.07)',flexShrink:0,marginRight:20}}/>

            {/* ── Enemy losses ── */}
            <div style={{paddingRight:20,flexShrink:0}}>
              <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Enemy Losses</div>
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--gold)',marginBottom:4}}>
                <IconCoin size={10}/> ~{result.tgtGoldDestroyed}g
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--mana2)'}}>
                <IconSparkles size={10}/> ~{result.tgtManaDestroyed}m
              </div>
            </div>

            {/* divider */}
            <div style={{width:1,alignSelf:'stretch',background:'rgba(255,255,255,.07)',flexShrink:0,marginRight:14}}/>

            {/* ── Power intel ── */}
            <div style={{flexShrink:0,paddingRight: item ? 20 : 0}}>
              <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Power Intel</div>
              <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:3}}>{ratio.toFixed(1)}× — {pctLabel}</div>
              <div style={{fontSize:9,color:'var(--muted)',lineHeight:1.4}}>
                {won
                  ? ratio >= 1.2 ? `Overcame ${Math.round((ratio-1)*100)}% disadvantage` : 'Favored — delivered'
                  : ratio >= 1   ? 'Had the odds, fate intervened' : 'Outmatched — regroup'}
              </div>
            </div>

            {/* ── Item used (only if present) ── */}
            {item && <>
              <div style={{width:1,alignSelf:'stretch',background:'rgba(255,255,255,.07)',flexShrink:0,marginRight:14}}/>
              <div style={{flexShrink:0}}>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Item Used</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom: itemEffects.length ? 6 : 0}}>
                  <ItemArt id={item.id} artType={item.artType} rarity={item.rarity} size={24}/>
                  <div>
                    <div style={{fontSize:10,color:'var(--text)',fontWeight:600}}>{item.name}</div>
                    <div style={{fontSize:8,color: consumed ? 'var(--red)' : 'var(--muted)',marginTop:1}}>
                      {consumed ? 'Consumed' : `${(item.qty||1)-1} left`}
                    </div>
                  </div>
                </div>
                {itemEffects.length > 0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {itemEffects.map(ef => (
                      <span key={ef.label} style={{fontSize:8,color:ef.color,background:`${ef.color}18`,border:`1px solid ${ef.color}33`,padding:'1px 5px',borderRadius:3}}>
                        {ef.value} {ef.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>}

          </div>
        )
      })()}
    </div>
  )
}

function Chip({ icon, color, bg, border, label }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,color,background:bg,border:`1px solid ${border}`,padding:'3px 8px',borderRadius:4}}>
      {icon}{label}
    </span>
  )
}

const TOAST_COLOR = {
  build:    '#c9a84c', recruit:  '#e87848',  win:      '#6dccaa',
  lose:     '#e87878', err:      '#e87878',  res:      '#9090c8',
  explore:  'var(--green)', purchase: 'var(--gold)',
}
const TOAST_ICON = {
  build: IconHammer, recruit: IconSword,    win:      IconTrophy,
  lose:  IconSkull,  err:     IconAlertTriangle, res: IconCheck,
  explore: IconCompass, purchase: IconGavel,
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className={s.toastStack}>
      {toasts.map(t => {
        const color   = TOAST_COLOR[t.type] || 'var(--muted)'
        const IconComp = TOAST_ICON[t.type]  || IconInfoCircle
        return (
          <div key={t.id} className={`${s.toast} ${t.exiting ? s.toastExiting : ''}`}
            style={{ borderLeft: `3px solid ${color}` }}>
            {t.thumb
              ? <div className={s.toastThumb}>{t.thumb}</div>
              : <div className={s.toastIcon} style={{ background: color + '18' }}><IconComp size={13} color={color} /></div>
            }
            <div className={s.toastBody}>
              <div className={s.toastMsg}>{t.msg}</div>
              {t.sub && <div className={s.toastSub}>{t.sub}</div>}
            </div>
            <button className={s.toastClose} onClick={() => onDismiss(t.id)}>✕</button>
          </div>
        )
      })}
    </div>
  )
}

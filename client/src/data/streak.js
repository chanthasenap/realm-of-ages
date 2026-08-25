import { CONSUMABLE_POOL, AUCTION_POOL, RARITY_COLOR } from './items.js'

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

// Returns: 'continue' | 'reset' | 'shield_used' | 'already_claimed' | 'start'
export function checkStreakContinuity(lastDate, hasShield) {
  if (!lastDate) return 'start'
  const today = getTodayDate()
  if (lastDate === today) return 'already_claimed'
  const diffDays = Math.round((new Date(today) - new Date(lastDate)) / 86400000)
  if (diffDays === 1) return 'continue'
  if (diffDays > 1 && hasShield) return 'shield_used'
  return 'reset'
}

function pickStreakItem(streakDay, completedChains) {
  const effectiveDay = streakDay + completedChains * 5
  const rarity =
    effectiveDay >= 21 ? 'Legendary' :
    effectiveDay >= 15 ? 'Very Rare' :
    effectiveDay >= 10 ? 'Rare'      :
    effectiveDay >= 6  ? 'Uncommon'  : 'Common'

  const allItems = [...CONSUMABLE_POOL, ...AUCTION_POOL]
  const matching = allItems.filter(i => i.rarity === rarity)
  const pool = matching.length > 0 ? matching : allItems.filter(i => i.rarity === 'Common')
  if (!pool.length) return null
  // Deterministic: same streakDay+chain always resolves to the same item category
  return pool[((streakDay * 7) + completedChains * 3) % pool.length]
}

// Pure function — no state, runs forever with any day number
export function generateStreakReward(streakDay, completedChains = 0) {
  const chainBonus   = Math.min(2.0, 1 + completedChains * 0.20)
  const isMilestone  = streakDay % 10 === 0
  const isMini       = streakDay % 5 === 0 && !isMilestone
  const bonusMult    = isMilestone ? 3 : isMini ? 1.5 : 1
  const scale        = Math.pow(streakDay, 1.35) * chainBonus

  const baseGold = Math.round(100 * scale * bonusMult)
  const baseMana = Math.round(35  * scale * bonusMult)

  const rewards = [
    { type: 'gold',  amount: baseGold, label: `+${baseGold.toLocaleString()} Gold`,       color: '#c9a84c' },
    { type: 'mana',  amount: baseMana, label: `+${baseMana.toLocaleString()} Mana`,        color: '#b070ff' },
  ]

  if (streakDay % 3 === 0) {
    const item = pickStreakItem(streakDay, completedChains)
    if (item) rewards.push({
      type: 'item', item,
      label: item.name,
      sublabel: `${item.rarity} · ${item.effectLabel || item.passiveLabel || 'Special'}`,
      color: RARITY_COLOR[item.rarity] || '#9090a8',
    })
  }

  if (streakDay % 5 === 0) {
    const land = Math.round((2 + streakDay * 0.4) * chainBonus)
    rewards.push({ type: 'land',  amount: land,  label: `+${land} Acres`,        color: '#6dccaa' })
  }

  if (streakDay % 7 === 0) {
    const turns = Math.round((4 + streakDay * 0.25) * chainBonus)
    rewards.push({ type: 'turns', amount: turns, label: `+${turns} Turns`,        color: '#a0a0c8' })
  }

  // Shield: earned at day 5, then every 10 days after (day 15, 25, 35…)
  const awardShield = streakDay === 5 || (streakDay > 5 && (streakDay - 5) % 10 === 0)

  // Next-day preview
  const nd         = streakDay + 1
  const ndBonusMult = nd % 10 === 0 ? 3 : nd % 5 === 0 ? 1.5 : 1
  const nextDayGold = Math.round(100 * Math.pow(nd, 1.35) * chainBonus * ndBonusMult)
  const nextExtras  = [
    nd % 3 === 0 ? 'item' : null,
    nd % 5 === 0 ? 'land' : null,
    nd % 7 === 0 ? 'turns' : null,
  ].filter(Boolean)

  return { rewards, isMilestone, isMini, awardShield, streakDay, completedChains, chainBonus, nextDayGold, nextExtras }
}

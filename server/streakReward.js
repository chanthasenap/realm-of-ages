/**
 * server/streakReward.js
 * Server-side mirror of the core streak-continuity and reward math in
 * client/src/data/streak.js. Kept in sync deliberately — the client's
 * generateStreakReward() is used only for what to *display*; this file
 * is the source of truth for what actually gets credited to a player.
 * (Item-drop rewards are display-only for now; not yet granted server-side.)
 */

function todayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

// Returns: 'continue' | 'reset' | 'shield_used' | 'already_claimed' | 'start'
function checkStreakContinuity(lastDate, hasShield, today) {
  if (!lastDate) return 'start';
  if (lastDate === today) return 'already_claimed';
  const diffDays = Math.round((new Date(today) - new Date(lastDate)) / 86400000);
  if (diffDays === 1) return 'continue';
  if (diffDays > 1 && hasShield) return 'shield_used';
  return 'reset';
}

// Pure function mirroring client/src/data/streak.js's generateStreakReward
// (gold/mana/land/turns/shield portion only — no item drops here).
function computeStreakReward(streakDay, completedChains = 0) {
  const chainBonus  = Math.min(2.0, 1 + completedChains * 0.20);
  const isMilestone = streakDay % 10 === 0;
  const isMini      = streakDay % 5 === 0 && !isMilestone;
  const bonusMult   = isMilestone ? 3 : isMini ? 1.5 : 1;
  const scale       = Math.pow(streakDay, 1.35) * chainBonus;

  const goldAmt  = Math.round(100 * scale * bonusMult);
  const manaAmt  = Math.round(35 * scale * bonusMult);
  const landAmt  = streakDay % 5 === 0 ? Math.round((2 + streakDay * 0.4) * chainBonus) : 0;
  const turnsAmt = streakDay % 7 === 0 ? Math.round((4 + streakDay * 0.25) * chainBonus) : 0;

  const awardShield = streakDay === 5 || (streakDay > 5 && (streakDay - 5) % 10 === 0);

  return { goldAmt, manaAmt, landAmt, turnsAmt, awardShield, isMilestone, isMini };
}

module.exports = { todayStr, checkStreakContinuity, computeStreakReward };

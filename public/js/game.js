/**
 * public/js/game.js
 * Main game controller. Handles auth screens, state, turn timer, all actions.
 */

// Global state — loaded from server on login
window.GD = null;  // game data (factions, items)
window.GS = null;  // game state (player, buildings, army, economy)

let _toastTimer = null;
let _turnTimer  = null;
let _secToNext  = 120;
let _selectedFaction = null;
let _currentPanel = 'overview';

// ── Utilities ──────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn._originalHtml = btn._originalHtml || btn.innerHTML;
  btn.innerHTML = isLoading ? '<i class="ti ti-loader-2 spin"></i> Please wait…' : btn._originalHtml;
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) el.textContent = msg;
}

// ── Auth ───────────────────────────────────────────────────────────
async function initApp() {
  // Load game data first
  try {
    GD = await API.gameData();
    buildFactionBadges();
  } catch(e) {
    console.error('Could not load game data:', e);
  }

  // Check if already logged in
  try {
    const me = await API.me();
    if (me.ok) {
      if (me.needsFaction) {
        showScreen('faction');
        buildFactionGrid();
      } else {
        await enterGame();
      }
      return;
    }
  } catch(e) { /* not logged in */ }

  showScreen('landing');
}

function buildFactionBadges() {
  const el = document.getElementById('faction-preview-badges');
  if (!el || !GD) return;
  el.innerHTML = Object.entries(GD.FACTIONS).map(([id, f]) =>
    `<div class="fp-badge" style="border-color:${f.color}33;background:${f.color}11" title="${f.name}">
      <i class="ti ${f.icon}" style="color:${f.color};font-size:18px"></i>
    </div>`
  ).join('');
}

// Auth tabs
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('auth-login').style.display   = tab.dataset.tab === 'login'    ? 'block' : 'none';
    document.getElementById('auth-register').style.display = tab.dataset.tab === 'register' ? 'block' : 'none';
  });
});

document.getElementById('btn-login').addEventListener('click', async () => {
  const btn   = document.getElementById('btn-login');
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  showError('login-err', '');
  if (!email || !pass) { showError('login-err', 'Email and password required.'); return; }
  setLoading(btn, true);
  try {
    const res = await API.login(email, pass);
    if (res.needsFaction) { showScreen('faction'); buildFactionGrid(); }
    else await enterGame();
  } catch(e) {
    showError('login-err', e.message);
  } finally { setLoading(btn, false); }
});

document.getElementById('btn-register').addEventListener('click', async () => {
  const btn   = document.getElementById('btn-register');
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  showError('reg-err', '');
  setLoading(btn, true);
  try {
    await API.register(name, email, pass);
    showScreen('faction');
    buildFactionGrid();
  } catch(e) {
    showError('reg-err', e.message);
  } finally { setLoading(btn, false); }
});

// Enter on input fields
['login-email','login-pass'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  clearInterval(_turnTimer);
  await API.logout();
  GS = null; _selectedFaction = null;
  showScreen('landing');
});

// ── Faction select ─────────────────────────────────────────────────
function buildFactionGrid() {
  const grid = document.getElementById('factions-grid');
  if (!grid || !GD) return;
  grid.innerHTML = Object.entries(GD.FACTIONS).map(([fid, f]) => `
    <div class="faction-card" id="fc-${fid}" onclick="selectFaction('${fid}')">
      <div class="faction-emblem" style="background:${f.color}11;border-color:${f.color}33">
        <i class="ti ${f.icon}" style="color:${f.color}"></i>
      </div>
      <div class="faction-name" style="color:${f.color}">${f.name}</div>
      <div class="faction-epithet">${f.epithet}</div>
      <div class="faction-lore">${(f.lore||f.epithet||'').substring(0, 180)}…</div>
      <div class="unit-tags">${f.units.slice(0,4).map(u =>
        `<span class="unit-tag" style="background:${f.color}11;color:${f.color};border:1px solid ${f.color}22">
          <i class="ti ${u.icon}"></i>${u.name}
        </span>`
      ).join('')}</div>
    </div>`).join('');
}

function selectFaction(fid) {
  _selectedFaction = fid;
  document.querySelectorAll('.faction-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('fc-' + fid);
  const f = GD.FACTIONS[fid];
  card.classList.add('selected');
  card.style.borderColor = f.color;
  card.style.boxShadow = `0 0 20px ${f.color}20`;
  const btn = document.getElementById('btn-proceed');
  btn.disabled = false;
  btn.innerHTML = `<i class="ti ti-arrow-right"></i> March with the ${f.name}`;
}

document.getElementById('btn-proceed').addEventListener('click', async () => {
  if (!_selectedFaction) return;
  const btn = document.getElementById('btn-proceed');
  setLoading(btn, true);
  try {
    await API.setFaction(_selectedFaction);
    await enterGame();
  } catch(e) {
    toast('Error: ' + e.message);
    setLoading(btn, false);
  }
});

// ── Enter game ─────────────────────────────────────────────────────
async function enterGame() {
  showScreen('game');
  await refreshState();
  Game.showPanel('overview');
  startTurnTimer();
}

async function refreshState() {
  try {
    const data = await API.state();
    GS = data;
    updateTopBar();
    updateEconBar();
    updateRightPanel();
  } catch(e) {
    console.error('State refresh failed:', e);
  }
}

function updateTopBar() {
  const { player, economy } = GS;
  const f = GD.FACTIONS[player.faction] || {};
  document.getElementById('tb-gold').textContent  = player.gold.toLocaleString();
  document.getElementById('tb-mana').textContent  = player.mana.toLocaleString();
  document.getElementById('tb-land').textContent  = player.land;
  document.getElementById('tb-army').textContent  = GS.army.reduce((s, a) => s + a.quantity, 0);
  document.getElementById('tb-power').textContent = player.power.toLocaleString();
  document.getElementById('tb-name').textContent  = player.name;
  const banner = document.getElementById('faction-banner');
  banner.innerHTML = `<i class="ti ${f.icon||'ti-user'}"></i>${f.name||''}`;
  banner.style.background = (f.color || '#fff') + '18';
  banner.style.color = f.color || '#fff';
}

function updateEconBar() {
  const { player, economy } = GS;
  document.getElementById('turns-count').textContent = `${player.turns}/200`;
  document.getElementById('turns-fill').style.width  = `${player.turns / 200 * 100}%`;
  document.getElementById('eb-gold').textContent = player.gold.toLocaleString();
  document.getElementById('eb-mana').textContent = player.mana.toLocaleString();
  document.getElementById('gold-fill').style.width = `${Math.min(100, player.gold / Math.max(player.gold, 2000) * 100)}%`;
  document.getElementById('mana-fill').style.width = `${Math.min(100, player.mana / 500 * 100)}%`;
  const gr = document.getElementById('eb-gold-rate');
  gr.textContent = (economy.goldNet >= 0 ? '+' : '') + economy.goldNet + '/hr';
  gr.className = 'eb-rate ' + (economy.goldNet >= 0 ? 'pos' : 'neg');
  const mr = document.getElementById('eb-mana-rate');
  mr.textContent = (economy.manaNet >= 0 ? '+' : '') + economy.manaNet + '/hr';
  mr.className = 'eb-rate ' + (economy.manaNet >= 0 ? 'pos' : 'neg');
}

function updateRightPanel() {
  const { player, buildings, army, items, economy } = GS;
  document.getElementById('rp-power').textContent       = player.power.toLocaleString();
  document.getElementById('rp-land').textContent        = player.land + ' ac';
  document.getElementById('rp-bld').textContent         = buildings.length;
  document.getElementById('rp-army-count').textContent  = army.reduce((s, a) => s + a.quantity, 0) + ' units';
  document.getElementById('rp-gold-net').textContent    = (economy.goldNet >= 0 ? '+' : '') + economy.goldNet;
  document.getElementById('rp-mana-net').textContent    = (economy.manaNet >= 0 ? '+' : '') + economy.manaNet;
  document.getElementById('rp-victories').textContent   = player.victories;
  document.getElementById('rp-defeats').textContent     = player.defeats;

  // Rank (local estimate vs stored power)
  document.getElementById('rp-rank').textContent = `Power: ${player.power.toLocaleString()}`;

  // Army roster
  const f = GD.FACTIONS[player.faction];
  const armyHtml = army.filter(a => a.quantity > 0).map(a => {
    const uDef = f.units.find(u => u.id === a.unit_id);
    if (!uDef) return '';
    return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);font-size:11px">
      <span style="display:flex;align-items:center;gap:4px"><i class="ti ${uDef.icon}" style="font-size:11px;color:${f.color}"></i>${uDef.name}</span>
      <span style="color:${f.color}">${a.quantity}</span>
    </div>`;
  }).join('') || '<span class="rp-muted">No units yet.</span>';
  document.getElementById('rp-army-list').innerHTML = armyHtml;

  // Items
  const itemsHtml = items.slice(0, 6).map(i =>
    `<div style="display:flex;align-items:center;gap:5px;padding:2px 0;font-size:11px">
      <i class="ti ${i.item_icon || 'ti-package'}" style="font-size:12px;color:var(--gold)"></i>${i.item_name}
    </div>`
  ).join('') || '<span class="rp-muted">No items.</span>';
  document.getElementById('rp-items-list').innerHTML = itemsHtml;
}

// ── Turn timer (client-side countdown only) ─────────────────────────
function startTurnTimer() {
  clearInterval(_turnTimer);
  _secToNext = 120;
  _turnTimer = setInterval(() => {
    _secToNext--;
    if (_secToNext <= 0) {
      _secToNext = 120;
      if (GS && GS.player.turns < 200) {
        GS.player.turns = Math.min(200, GS.player.turns + 1);
        updateEconBar();
        toast(`+1 turn accrued (${GS.player.turns}/200)`);
      }
      // Full refresh every 2 minutes to sync with server
      refreshState();
    }
    const m = Math.floor(_secToNext / 60);
    const s = _secToNext % 60;
    const el = document.getElementById('turns-next');
    if (el) el.textContent = `+1 in ${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

// ── Game actions namespace ─────────────────────────────────────────
const Game = {
  async showPanel(name) {
    _currentPanel = name;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const ni = document.querySelector(`.nav-item[data-panel="${name}"]`);
    if (ni) ni.classList.add('active');
    const mp = document.getElementById('main-panel');
    mp.innerHTML = '<div class="loading-state"><i class="ti ti-loader-2 spin"></i> Loading…</div>';
    try {
      let html = '';
      if (typeof Panels[name] === 'function') {
        const result = Panels[name]();
        html = result instanceof Promise ? await result : result;
      }
      mp.innerHTML = html;
    } catch(e) {
      mp.innerHTML = `<div class="empty-state"><i class="ti ti-alert-circle"></i><div class="empty-title">Could not load panel</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  async doExplore(type) {
    try {
      const res = await API.explore(type);
      toast(`${res.message}`);
      await refreshState();
      // Update explore result UI if on explore panel
      const er = document.getElementById('explore-result');
      if (er) {
        er.classList.add('visible');
        document.getElementById('explore-text').textContent = `Claimed ${res.acres} acres of new territory!`;
        document.getElementById('explore-sub').textContent = `Turn bonus: +${res.goldBonus}g${res.manaBonus ? ', +'+res.manaBonus+'m' : ''}. Land now generates +${Math.floor(GS.player.land*1.5)}g/hr.`;
      }
      if (_currentPanel === 'overview') Game.showPanel('overview');
    } catch(e) {
      toast('⚠ ' + e.message);
    }
  },

  async doBuild(buildingId) {
    try {
      const res = await API.build(buildingId);
      toast(res.message);
      await refreshState();
      Game.showPanel('build');
    } catch(e) {
      toast('⚠ ' + e.message);
    }
  },

  async doRecruit(unitId, qty) {
    try {
      const res = await API.recruit(unitId, qty);
      toast(res.message);
      await refreshState();
      Game.showPanel('recruit');
    } catch(e) {
      toast('⚠ ' + e.message);
    }
  },

  async doBattle(targetId, targetName) {
    try {
      const res = await API.battle(targetId);
      const log = document.getElementById('battle-log');
      if (log) {
        const cls = res.win ? 'log-battle_win' : 'log-battle_loss';
        log.innerHTML += `<div class="${cls}">[${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}] ${res.message}</div>`;
        log.scrollTop = log.scrollHeight;
      }
      toast(res.message);
      await refreshState();
    } catch(e) {
      toast('⚠ ' + e.message);
    }
  },

  async doBuy(itemId) {
    try {
      const res = await API.buyItem(itemId);
      toast(res.item + ' acquired!');
      await refreshState();
      Game.showPanel('auction');
    } catch(e) {
      toast('⚠ ' + e.message);
    }
  },

  showPanel,
};

// Wire sidebar nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => Game.showPanel(item.dataset.panel));
});

// Boot
initApp();

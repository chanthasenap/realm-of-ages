/**
 * public/js/panels.js
 * Pure functions that return HTML strings for each game panel.
 * Relies on window.GD (gamedata) and window.GS (game state).
 */

const Panels = {

  overview() {
    const { player, buildings, army, items, events, economy } = GS;
    const f = GD.FACTIONS[player.faction];
    const totalArmy = army.reduce((s, a) => s + a.quantity, 0);
    const totalBld  = buildings.length;
    const alertsHtml = [
      economy.goldNet < 0 ? `<div class="alert"><i class="ti ti-alert-triangle"></i><span>Gold deficit: upkeep exceeds income. Build more or reduce your army.</span></div>` : '',
      economy.manaNet < 0 ? `<div class="alert"><i class="ti ti-alert-triangle"></i><span>Mana deficit: mana upkeep exceeds generation. Reduce high-cost units.</span></div>` : '',
    ].join('');

    const logHtml = events.slice(0, 20).map(e =>
      `<div class="log-${e.category}">[${new Date(e.occurred_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}] ${e.message}</div>`
    ).join('') || '<div class="log-info">[System] Your conquest begins. The realm watches.</div>';

    return `
      <div class="panel-header">
        <div class="panel-title">${f.name} — Day 1</div>
        <div class="panel-desc">Expand your domain, build your empire, grow your power.</div>
      </div>
      ${alertsHtml}
      <div class="res-row">
        <div class="res-card"><div class="res-num">${player.land}</div><div class="res-lbl"><i class="ti ti-map"></i>Land (acres)</div></div>
        <div class="res-card"><div class="res-num gold">${player.gold.toLocaleString()}</div><div class="res-lbl"><i class="ti ti-coin"></i>Gold</div></div>
        <div class="res-card"><div class="res-num mana">${player.mana.toLocaleString()}</div><div class="res-lbl"><i class="ti ti-sparkles"></i>Mana</div></div>
        <div class="res-card"><div class="res-num">${totalBld}</div><div class="res-lbl"><i class="ti ti-building"></i>Buildings</div></div>
        <div class="res-card"><div class="res-num">${totalArmy}</div><div class="res-lbl"><i class="ti ti-sword"></i>Units</div></div>
      </div>
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--textm);margin-bottom:10px">Quick Actions</div>
      <div class="action-grid">
        <div class="action-card" onclick="Game.doExplore('scout')">
          <div class="action-icon"><i class="ti ti-compass"></i></div>
          <div class="action-name">Explore Land</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>1 turn</span><span style="color:var(--gold)"><i class="ti ti-coin"></i>+5 gold bonus</span></div>
          <div class="action-desc">Scout new territory and earn resources.</div>
        </div>
        <div class="action-card" onclick="Game.showPanel('build')">
          <div class="action-icon"><i class="ti ti-building-castle"></i></div>
          <div class="action-name">Construct</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>2–12 turns</span></div>
          <div class="action-desc">Build structures to generate resources and unlock units.</div>
        </div>
        <div class="action-card" onclick="Game.showPanel('recruit')">
          <div class="action-icon"><i class="ti ti-sword"></i></div>
          <div class="action-name">Recruit Units</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>1 turn</span><span style="color:var(--gold)"><i class="ti ti-coin"></i>gold</span><span style="color:var(--mana2)"><i class="ti ti-sparkles"></i>mana</span></div>
          <div class="action-desc">Grow your army. Units have hourly upkeep costs.</div>
        </div>
        <div class="action-card" onclick="Game.showPanel('battle')">
          <div class="action-icon"><i class="ti ti-shield-bolt"></i></div>
          <div class="action-name">Raid & Plunder</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>3 turns</span></div>
          <div class="action-desc">Attack rivals for gold, mana, and glory.</div>
        </div>
      </div>
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--textm);margin-bottom:8px">Event Log</div>
      <div class="event-log">${logHtml}</div>`;
  },

  economy() {
    const { player, economy } = GS;
    const f = GD.FACTIONS[player.faction];
    const landGold = Math.floor(player.land * 1.5);
    const landMana = Math.floor(player.land * 0.8);
    const bldGold  = economy.goldGen - Math.round(landGold * (1 + f.goldBonus));
    const bldMana  = economy.manaGen - Math.round(landMana * (1 + f.manaBonus));

    return `
      <div class="panel-header">
        <div class="panel-title">Economy Overview</div>
        <div class="panel-desc">D&D-inspired resource model — land generates base income, buildings amplify it, units cost upkeep hourly.</div>
      </div>
      <div class="eco-grid">
        <div class="eco-card">
          <div class="eco-title" style="color:var(--gold)"><i class="ti ti-coin"></i>Gold Ledger (per hour)</div>
          <div class="eco-row"><span class="lbl">Land income (${player.land} ac × 1.5)</span><span class="val pos">+${landGold}</span></div>
          <div class="eco-row"><span class="lbl">Buildings income</span><span class="val pos">+${economy.goldGen - Math.round(landGold*(1+f.goldBonus)) > 0 ? economy.goldGen - Math.round(landGold*(1+f.goldBonus)) : economy.goldGen - landGold}</span></div>
          <div class="eco-row"><span class="lbl">Faction bonus (+${Math.round(f.goldBonus*100)}%)</span><span class="val pos">+${Math.round((economy.goldGen / (1+f.goldBonus)) * f.goldBonus)}</span></div>
          <div class="eco-row"><span class="lbl">Army upkeep</span><span class="val neg">-${economy.goldUpkeep}</span></div>
          <div class="eco-total"><span style="color:var(--textm)">Net gold/hr</span><span style="color:${economy.goldNet>=0?'var(--green)':'var(--red)'}">${economy.goldNet>=0?'+':''}${economy.goldNet}</span></div>
        </div>
        <div class="eco-card">
          <div class="eco-title" style="color:var(--mana2)"><i class="ti ti-sparkles"></i>Mana Ledger (per hour)</div>
          <div class="eco-row"><span class="lbl">Land income (${player.land} ac × 0.8)</span><span class="val pos">+${landMana}</span></div>
          <div class="eco-row"><span class="lbl">Buildings income</span><span class="val pos">+${Math.max(0, economy.manaGen - Math.round(landMana*(1+f.manaBonus)))}</span></div>
          <div class="eco-row"><span class="lbl">Faction bonus (+${Math.round(f.manaBonus*100)}%)</span><span class="val pos">+${Math.round((economy.manaGen / (1+f.manaBonus)) * f.manaBonus)}</span></div>
          <div class="eco-row"><span class="lbl">Army upkeep</span><span class="val neg">-${economy.manaUpkeep}</span></div>
          <div class="eco-total"><span style="color:var(--textm)">Net mana/hr</span><span style="color:${economy.manaNet>=0?'var(--green)':'var(--red)'}">${economy.manaNet>=0?'+':''}${economy.manaNet}</span></div>
        </div>
      </div>
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--textm);margin-bottom:10px">D&D Resource Guidelines</div>
      <div class="eco-rules">
        <div class="eco-rule-card"><div class="eco-rule-title" style="color:var(--gold)"><i class="ti ti-coin"></i>Gold Generation</div>1 acre = 1.5g/hr (D&D GP downtime rate). Buildings: 8–50g/hr. Victory: +15% enemy treasury.</div>
        <div class="eco-rule-card"><div class="eco-rule-title" style="color:var(--mana2)"><i class="ti ti-sparkles"></i>Mana Generation</div>1 acre = 0.8m/hr (ambient ley lines). Buildings: 3–55m/hr. Victory: +10% enemy mana.</div>
        <div class="eco-rule-card"><div class="eco-rule-title" style="color:var(--red)"><i class="ti ti-trending-down"></i>Gold Upkeep</div>Common troops: 0.8–1.5g/hr. Elite: 3–8g/hr. Dragons & titans: 14–32g/hr.</div>
        <div class="eco-rule-card"><div class="eco-rule-title" style="color:var(--red)"><i class="ti ti-trending-down"></i>Mana Upkeep</div>Common: 0.1–0.5m/hr. Summoned: 2–4m/hr. Dragons & Seraphim: 9–18m/hr.</div>
      </div>
      <div style="background:var(--bg3);border:1px solid rgba(201,168,76,.15);border-radius:var(--rad);padding:10px 12px;margin-top:10px;font-size:11px;color:var(--textm)">
        <span style="color:var(--gold)">Turn Spending Bonus:</span> Each turn spent exploring gives a direct gold bonus (1 turn = +5g, 3 turns = +20g, 8 turns = +60g +20m) on top of land gained.
      </div>`;
  },

  explore() {
    const { player } = GS;
    return `
      <div class="panel-header">
        <div class="panel-title">Explore New Lands</div>
        <div class="panel-desc">Scout territory to expand your domain. Turns spent exploring also yield direct gold (and mana on large expeditions).</div>
      </div>
      <div class="res-row">
        <div class="res-card"><div class="res-num">${player.land}</div><div class="res-lbl"><i class="ti ti-map"></i>Current Land</div></div>
        <div class="res-card"><div class="res-num green">${player.turns}</div><div class="res-lbl"><i class="ti ti-clock"></i>Turns Available</div></div>
        <div class="res-card"><div class="res-num gold">${player.gold.toLocaleString()}</div><div class="res-lbl"><i class="ti ti-coin"></i>Gold</div></div>
      </div>
      <div class="action-grid">
        <div class="action-card" onclick="Game.doExplore('scout')">
          <div class="action-icon"><i class="ti ti-compass"></i></div>
          <div class="action-name">Scout Party</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>1 turn</span><span style="color:var(--gold)"><i class="ti ti-coin"></i>+5 gold</span></div>
          <div class="action-desc">Gain 5–15 acres of territory.</div>
        </div>
        <div class="action-card" onclick="Game.doExplore('expedition')">
          <div class="action-icon"><i class="ti ti-map-search"></i></div>
          <div class="action-name">Expedition</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>3 turns</span><span style="color:var(--gold)"><i class="ti ti-coin"></i>+20 gold</span></div>
          <div class="action-desc">Gain 20–50 acres of territory.</div>
        </div>
        <div class="action-card" onclick="Game.doExplore('conquest')">
          <div class="action-icon"><i class="ti ti-world"></i></div>
          <div class="action-name">Grand Conquest</div>
          <div class="action-costs"><span style="color:var(--green)"><i class="ti ti-clock"></i>8 turns</span><span style="color:var(--gold)"><i class="ti ti-coin"></i>+60 gold</span><span style="color:var(--mana2)"><i class="ti ti-sparkles"></i>+20 mana</span></div>
          <div class="action-desc">Gain 80–150 acres plus major resource bonuses.</div>
        </div>
      </div>
      <div class="explore-result" id="explore-result">
        <div class="explore-head"><i class="ti ti-map-pin" id="explore-icon"></i><span id="explore-text"></span></div>
        <div class="explore-sub" id="explore-sub"></div>
      </div>`;
  },

  build() {
    const { player, buildings } = GS;
    const f = GD.FACTIONS[player.faction];
    if (!player.land) return `
      <div class="panel-header"><div class="panel-title">Construction</div></div>
      <div class="empty-state"><i class="ti ti-map"></i><div class="empty-title">No land claimed yet</div><div class="empty-sub">Explore land first before constructing buildings.</div></div>`;

    const bldHtml = f.buildings.map(b => {
      const existing = buildings.find(x => x.building_id === b.id);
      const lvl = existing ? existing.level : 0;
      const canAfford = player.gold >= b.goldCost && player.mana >= b.manaCost && player.turns >= b.turns;
      return `
        <div class="bld-card">
          <div class="bld-art"><i class="ti ${b.icon}"></i></div>
          <div class="bld-name">${b.name}</div>
          <div class="bld-level" style="color:${f.color}">${lvl > 0 ? 'Level ' + lvl : 'Not built'}</div>
          <div class="bld-desc">${b.desc || `Generates +${b.goldGen}g/hr, +${b.manaGen}m/hr per level.`}</div>
          <div class="bld-costs">
            <span class="bld-cost" style="color:var(--gold)"><i class="ti ti-coin"></i>${b.goldCost}g</span>
            <span class="bld-cost" style="color:var(--mana2)"><i class="ti ti-sparkles"></i>${b.manaCost}m</span>
            <span class="bld-cost" style="color:var(--green)"><i class="ti ti-clock"></i>${b.turns} turns</span>
          </div>
          <button class="bld-btn" onclick="Game.doBuild('${b.id}')" ${!canAfford ? 'disabled' : ''}>
            <i class="ti ${lvl > 0 ? 'ti-arrow-up' : 'ti-hammer'}"></i>${lvl > 0 ? 'Upgrade (Lv.' + (lvl+1) + ')' : 'Construct'}
          </button>
        </div>`;
    }).join('');

    return `
      <div class="panel-header">
        <div class="panel-title">Construction</div>
        <div class="panel-desc">Buildings generate gold and mana per hour and unlock faction units. Each level multiplies the output.</div>
      </div>
      <div class="bld-grid">${bldHtml}</div>`;
  },

  recruit() {
    const { player, buildings, army } = GS;
    const f = GD.FACTIONS[player.faction];
    const hasBuilding = buildings.length > 0;
    if (!hasBuilding) return `
      <div class="panel-header"><div class="panel-title">Recruit Units</div></div>
      <div class="empty-state"><i class="ti ti-building"></i><div class="empty-title">No buildings yet</div><div class="empty-sub">Construct faction buildings to unlock units.</div></div>`;

    const unitHtml = f.units.map(u => {
      const reqBuilt = buildings.find(b => b.building_id === u.req);
      const cnt = (army.find(a => a.unit_id === u.id) || {}).quantity || 0;
      return `
        <div class="unit-row ${!reqBuilt ? 'locked' : ''}">
          <div class="unit-art" style="border-color:${f.color}22;background:${f.color}11">
            <i class="ti ${u.icon}" style="color:${f.color}"></i>
          </div>
          <div class="unit-info">
            <div class="unit-name" style="color:${f.color}">${u.name}</div>
            <div class="unit-stats">
              <span><i class="ti ti-sword"></i>Atk ${u.atk}</span>
              <span><i class="ti ti-shield"></i>Def ${u.def}</span>
              <span><i class="ti ti-bolt"></i>Power ${u.power}</span>
              <span style="color:var(--gold)"><i class="ti ti-coin"></i>${u.goldCost}g</span>
              <span style="color:var(--mana2)"><i class="ti ti-sparkles"></i>${u.manaCost}m</span>
            </div>
            <div class="unit-stats" style="margin-top:2px">
              <span style="color:var(--red)"><i class="ti ti-trending-down"></i>Upkeep: ${u.goldUpkeep}g/${u.manaUpkeep}m per unit/hr</span>
              <span style="color:var(--textm)">${reqBuilt ? 'Unlocked' : 'Requires: ' + u.req}</span>
            </div>
          </div>
          <div class="unit-count" style="color:${f.color}">${cnt}</div>
          ${reqBuilt ? `<button class="unit-btn" onclick="Game.doRecruit('${u.id}', 5)"><i class="ti ti-plus"></i>×5</button>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="panel-header">
        <div class="panel-title">Recruit Units</div>
        <div class="panel-desc">Recruiting costs gold + mana + 1 turn. Units also consume gold and mana per hour as upkeep — manage your economy carefully.</div>
      </div>
      <div class="unit-list">${unitHtml}</div>`;
  },

  async battle() {
    let targets = [];
    try { targets = (await API.targets()).targets; } catch(e) {}
    const f = GD.FACTIONS;
    const targetsHtml = targets.length ? targets.map(t => {
      const tf = f[t.faction] || { icon:'ti-user', color:'var(--textm)', name:'Unknown' };
      return `
        <div class="rank-row">
          <div class="rank-info">
            <div class="rank-name">${t.name}</div>
            <div class="rank-faction" style="color:${tf.color}"><i class="ti ${tf.icon}"></i>${tf.name}</div>
          </div>
          <div class="rank-power">${t.power.toLocaleString()}</div>
          <button class="unit-btn" onclick="Game.doBattle(${t.id}, '${t.name}')"><i class="ti ti-sword"></i>Raid</button>
        </div>`;
    }).join('') : '<div class="rp-muted" style="padding:12px 0">No targets available yet.</div>';

    return `
      <div class="panel-header">
        <div class="panel-title">Raid & Battle</div>
        <div class="panel-desc">Attack rival commanders to plunder their treasury. Victory yields +15% of their gold, +10% of their mana, and land seizure. Costs 3 turns.</div>
      </div>
      <div style="background:rgba(109,204,170,.06);border:1px solid rgba(109,204,170,.15);border-radius:var(--rad);padding:8px 12px;font-size:11px;color:var(--green);display:flex;gap:8px;align-items:center;margin-bottom:14px">
        <i class="ti ti-trophy" style="font-size:14px"></i>
        Victory: +15% enemy gold treasury · +10% enemy mana · land seizure
      </div>
      <div class="rank-list">${targetsHtml}</div>
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--textm);margin-top:16px;margin-bottom:8px">Battle Log</div>
      <div class="battle-log" id="battle-log"><div class="log-info">[System] Battle history will appear here.</div></div>`;
  },

  async auction() {
    const items = GD.AUCTION_ITEMS;
    const html = items.map(item => `
      <div class="auc-card">
        <div class="auc-art"><i class="ti ${item.icon}"></i></div>
        <div class="auc-name">${item.name}</div>
        <div class="auc-rarity rarity-${item.rarity}">${item.rarity}</div>
        <div class="auc-desc">${item.desc}</div>
        <div class="auc-prices">
          <span style="color:var(--gold)"><i class="ti ti-coin"></i>${item.goldPrice}g</span>
          ${item.manaPrice > 0 ? `<span style="color:var(--mana2)"><i class="ti ti-sparkles"></i>${item.manaPrice}m</span>` : ''}
        </div>
        <button class="auc-btn" onclick="Game.doBuy('${item.id}')"><i class="ti ti-gavel"></i>Buy Now</button>
      </div>`).join('');
    return `
      <div class="panel-header">
        <div class="panel-title">Auction House</div>
        <div class="panel-desc">Acquire powerful items using gold and mana. Legendary items require significant mana investment.</div>
      </div>
      <div class="auc-grid">${html}</div>`;
  },

  async rankings() {
    let data = { rankings: [], myId: null };
    try { data = await API.rankings(); } catch(e) {}
    const factions = GD.FACTIONS;
    const rowsHtml = data.rankings.map((r, i) => {
      const tf = factions[r.faction] || { icon:'ti-user', color:'var(--textm)', name:'Unknown' };
      const isMe = r.id === data.myId;
      const medal = ['','ti-medal','ti-medal','ti-medal'][Math.min(i+1, 3)];
      const medalColor = ['','#ffd700','#c0c0c0','#cd7f32'][Math.min(i+1, 3)];
      return `
        <div class="rank-row ${isMe ? 'me' : ''}">
          <div class="rank-num" style="color:${medalColor||'var(--textm)'}">${i < 3 ? `<i class="ti ${medal}"></i>` : i+1}</div>
          <div class="rank-info">
            <div class="rank-name">${isMe ? '★ ' : ''}${r.name}</div>
            <div class="rank-faction" style="color:${tf.color}"><i class="ti ${tf.icon}"></i>${tf.name}</div>
          </div>
          <div class="rank-power">${r.power.toLocaleString()}</div>
        </div>`;
    }).join('') || '<div class="rp-muted" style="padding:12px 0">No rankings yet — be the first!</div>';

    return `
      <div class="panel-header">
        <div class="panel-title">World Rankings</div>
        <div class="panel-desc">Power = (land × 2) + (buildings × 50/level) + unit power totals. Updated in real time.</div>
      </div>
      <div class="rank-list">${rowsHtml}</div>`;
  },

  lore() {
    const f = GD.FACTIONS[GS.player.faction];
    const loreParas = (f.lore || f.epithet || '').split('\n\n').map(p => `<p>${p}</p>`).join('');
    return `
      <div class="panel-header">
        <div class="panel-title">${f.name}</div>
        <div class="panel-desc">${f.epithet}</div>
      </div>
      <div class="lore-body">${loreParas}</div>
      <div class="faction-bonuses">
        <span style="color:var(--gold)"><i class="ti ti-coin"></i>Gold bonus: +${Math.round(f.goldBonus*100)}%</span>
        <span style="color:var(--mana2)"><i class="ti ti-sparkles"></i>Mana bonus: +${Math.round(f.manaBonus*100)}%</span>
      </div>`;
  },
};

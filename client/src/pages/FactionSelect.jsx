import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../hooks/useGameStore.js'
import { FACTIONS, CRESTS } from '../data/factions.js'
import { IconArrowRight, IconCheck, IconCoin, IconSparkles, IconSwords } from '@tabler/icons-react'
import s from './FactionSelect.module.css'

const PARTICLES = [
  { size: 5, top: '6%',  left: '8%',  delay: 0,   dur: 3.2 },
  { size: 4, top: '14%', left: '85%', delay: 0.4, dur: 2.8 },
  { size: 6, top: '80%', left: '12%', delay: 0.8, dur: 3.6 },
  { size: 4, top: '70%', left: '90%', delay: 0.2, dur: 3.0 },
  { size: 5, top: '40%', left: '95%', delay: 1.1, dur: 3.4 },
]

export default function FactionSelect() {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const { setFaction } = useGameStore()
  const nav = useNavigate()

  const proceed = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await setFaction(selected)
      if (res.ok) nav('/game')
      else { alert(res.error || 'Could not set faction.'); setLoading(false) }
    } catch (err) {
      alert(err.message || 'Could not set faction.')
      setLoading(false)
    }
  }

  const selFaction = selected ? FACTIONS[selected] : null

  return (
    <div className={s.page}>
      <div className={s.bgGlow} style={selFaction ? { '--fc': selFaction.color, opacity: 1 } : {}} />

      <div className={s.eyebrow}>Choose Your Path</div>
      <h1 className={s.heading}>Select Your Faction</h1>
      <p className={s.sub}>Your faction determines your units, buildings, and resource bonuses. This choice is permanent.</p>

      <div className={`${s.grid} ${selected ? s.hasSelection : ''}`}>
        {Object.entries(FACTIONS).map(([fid, f]) => (
          <FactionCard
            key={fid}
            fid={fid}
            f={f}
            selected={selected === fid}
            anySelected={!!selected}
            onSelect={() => setSelected(fid)}
          />
        ))}
      </div>

      <button
        className={`${s.btnProc} ${selected ? s.rdy : ''}`}
        style={selFaction ? { '--fc': selFaction.color } : {}}
        disabled={!selected || loading}
        onClick={proceed}
      >
        <IconArrowRight size={16} />
        {loading ? 'Marching…' : selected ? `March with the ${selFaction.name}` : 'Select a faction to continue'}
      </button>
    </div>
  )
}

function FactionCard({ fid, f, selected, anySelected, onSelect }) {
  const [imgFailed, setImgFailed] = useState(false)
  const loreLine = f.lore ? f.lore.split('\n')[0] : ''
  const unitCount = selected ? 7 : 3

  return (
    <div
      className={`${s.card} ${selected ? s.sel : ''}`}
      style={{ '--fc': f.color }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${f.name} — ${f.epithet}${selected ? ' (selected)' : ''}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
    >
      <div className={s.hero}>
        {!imgFailed ? (
          <img
            src={`/images/factions/${fid}.jpg`}
            alt=""
            onError={() => setImgFailed(true)}
            className={s.heroImg}
          />
        ) : (
          <div
            className={s.heroFallback}
            style={{ background: f.bg }}
            dangerouslySetInnerHTML={{ __html: CRESTS[fid] || '' }}
          />
        )}
        <div className={s.heroOverlay} />
        <div className={s.heroGlow} />

        {selected && (
          <div className={s.particles} aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className={s.particle}
                style={{
                  width: p.size, height: p.size,
                  top: p.top, left: p.left,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.dur}s`,
                }}
              />
            ))}
          </div>
        )}

        {selected && (
          <div className={s.selBadge}>
            <IconCheck size={13} /> Chosen
          </div>
        )}

        <div className={s.heroText}>
          <div className={s.fname}>{f.name}</div>
          <div className={s.epithet}>{f.epithet}</div>
          {selected && loreLine && <div className={s.lore}>{loreLine}</div>}
        </div>
      </div>

      <div className={s.bodyWrap}>
        <div className={s.identity} style={{ background: f.identityColor, color: f.color }}>
          {f.identity}
        </div>

        <div className={s.bonuses}>
          <span className={s.bonusGold}><IconCoin size={13} /> Gold +{Math.round(f.goldBonus * 100)}%</span>
          <span className={s.bonusMana}><IconSparkles size={13} /> Mana +{Math.round(f.manaBonus * 100)}%</span>
        </div>

        <div className={s.matchup}>
          <span className={s.adv}><IconSwords size={11} /> Strong vs: {f.advF.map(x => FACTIONS[x].shortName).join(', ')}</span>
          <span className={s.disadv}>↓ Weak vs: {f.disadvF.map(x => FACTIONS[x].shortName).join(', ')}</span>
        </div>

        <div className={s.units}>
          {f.units.slice(0, unitCount).map(u => (
            <span key={u.id} className={s.ubadge}>{u.name}</span>
          ))}
          {f.units.length > unitCount && <span className={s.ubadgeMore}>+{f.units.length - unitCount} more</span>}
        </div>
      </div>
    </div>
  )
}

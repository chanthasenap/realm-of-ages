import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../hooks/useGameStore.js'
import { FACTIONS } from '../data/factions.js'
import { IconArrowRight } from '@tabler/icons-react'
import { FactionImage } from '../components/Portrait.jsx'
import s from './FactionSelect.module.css'

export default function FactionSelect() {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const { selectFaction } = useGameStore()
  const nav = useNavigate()

  const proceed = async () => {
    if (!selected) return
    setLoading(true)
    const res = await selectFaction(selected)
    if (res.success) nav('/game')
    else { alert(res.message); setLoading(false) }
  }

  return (
    <div className={s.page}>
      <div className={s.eyebrow}>Choose Your Path</div>
      <h1 className={s.heading}>Select Your Faction</h1>
      <p className={s.sub}>Your faction determines your units, buildings, and resource bonuses. This choice is permanent.</p>

      <div className={s.grid}>
        {Object.entries(FACTIONS).map(([fid, f]) => (
          <div
            key={fid}
            className={`${s.card} ${selected === fid ? s.sel : ''}`}
            style={selected === fid ? { borderColor: f.color, boxShadow: `0 0 24px ${f.color}22` } : {}}
            onClick={() => setSelected(fid)}
          >
            <div className={s.emblem} style={{ background: f.bg, borderColor: `${f.color}33` }}>
              <FactionImage factionId={fid} size={52} />
            </div>
            <div className={s.fname} style={{ color: f.color }}>{f.name}</div>
            <div className={s.epithet}>{f.epithet}</div>

            <div className={s.identity} style={{ background: f.identityColor, color: f.color }}>
              {f.identity}
            </div>

            <div className={s.matchup}>
              <span style={{ color: 'var(--green)' }}>⚔ Strong vs: {f.advF.map(x => FACTIONS[x].shortName).join(', ')}</span>
              <span style={{ color: 'var(--red)' }}>↓ Weak vs: {f.disadvF.map(x => FACTIONS[x].shortName).join(', ')}</span>
            </div>

            <div className={s.bonuses}>
              <span style={{ color: '#c9a84c' }}>Gold +{Math.round(f.goldBonus * 100)}%</span>
              <span style={{ color: '#a89cf0' }}>Mana +{Math.round(f.manaBonus * 100)}%</span>
            </div>

            <div className={s.units}>
              {f.units.slice(0, 4).map(u => (
                <span key={u.id} className={s.ubadge} style={{ background: f.bg, color: f.color, border: `1px solid ${f.color}33` }}>
                  {u.name}
                </span>
              ))}
              <span className={s.ubadge} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                +{f.units.length - 4} more
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`${s.btnProc} ${selected ? s.rdy : ''}`}
        disabled={!selected || loading}
        onClick={proceed}
      >
        <IconArrowRight size={16} />
        {loading ? 'Marching…' : selected ? `March with the ${FACTIONS[selected].name}` : 'Select a faction to continue'}
      </button>
    </div>
  )
}

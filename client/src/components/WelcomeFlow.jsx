import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IconX, IconChevronRight, IconChevronLeft, IconSparkles, IconCoin, IconSword, IconMap, IconBuildingCastle, IconShieldBolt, IconCompass, IconTrophy, IconCheck, IconClock, IconFlame, IconShield, IconPackage } from '@tabler/icons-react'

// ── Tour step definitions ────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    target: '[data-tour="econ-bar"]',
    title: 'Your Resources',
    body: 'Turns regenerate over time — they fuel every action. Gold and Mana power your buildings and armies. Keep an eye on your income rate shown below each value.',
    position: 'below',
  },
  {
    target: '[data-tour="nav-sidebar"]',
    title: 'Command Center',
    body: 'Navigate your empire here. Explore claims new land, Build constructs structures, Recruit trains units, Battle launches raids, and Auction lets you buy powerful items.',
    position: 'right',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    body: 'These shortcuts jump straight to each core activity. A typical session: explore a bit, build income, recruit troops, then raid a rival for gold.',
    position: 'below',
  },
  {
    target: '[data-tour="empire-stats"]',
    title: 'Empire Stats',
    body: 'Your live snapshot — total power, army size, gold and mana income, and upkeep costs. A negative income means your army is draining you faster than your buildings earn.',
    position: 'left',
  },
  {
    target: '[data-tour="army-roster"]',
    title: 'Army Roster',
    body: 'Your starter units are already here and ready to fight. Build military halls to unlock stronger tier units, then upgrade those halls to boost their stats.',
    position: 'left',
  },
  {
    target: '[data-tour="activity-log"]',
    title: 'Activity Log',
    body: 'Every explore, battle, and event shows up here. Battle cards expand to show casualties, loot, and intel on your enemies. Check back after raids!',
    position: 'left',
  },
  {
    target: '[data-tour="merc-hall"]',
    title: 'Mercenary Hall',
    body: 'Hire Unbound warriors from other factions to supplement your army. Mercs fight at 85% power without a faction bond — but they\'re yours until slain. New contracts refresh every 4 hours.',
    position: 'above',
  },
]

// ── Spotlight component ──────────────────────────────────────────────────────
function Spotlight({ rect, padding = 8 }) {
  if (!rect) return null
  const r = {
    top:    rect.top    - padding,
    left:   rect.left   - padding,
    width:  rect.width  + padding * 2,
    height: rect.height + padding * 2,
  }
  return (
    <div
      style={{
        position: 'fixed',
        top:    r.top,
        left:   r.left,
        width:  r.width,
        height: r.height,
        borderRadius: 10,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.76)',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1), width .35s cubic-bezier(.4,0,.2,1), height .35s cubic-bezier(.4,0,.2,1)',
        border: '1.5px solid rgba(255,255,255,0.18)',
      }}
    />
  )
}

// ── Tour Tooltip ─────────────────────────────────────────────────────────────
function TourTooltip({ step, stepIndex, total, rect, onNext, onPrev, onSkip, padding = 8 }) {
  if (!rect || !step) return null

  const TIP_W = 320, TIP_H_EST = 170
  const vw = window.innerWidth, vh = window.innerHeight

  const hlTop    = rect.top    - padding
  const hlLeft   = rect.left   - padding
  const hlRight  = rect.right  + padding
  const hlBottom = rect.bottom + padding

  let top, left

  if (step.position === 'below' && hlBottom + TIP_H_EST + 16 < vh) {
    top  = hlBottom + 16
    left = Math.max(12, Math.min(vw - TIP_W - 12, hlLeft + (rect.width - TIP_W) / 2))
  } else if (step.position === 'above' || hlBottom + TIP_H_EST + 16 >= vh) {
    top  = Math.max(12, hlTop - TIP_H_EST - 16)
    left = Math.max(12, Math.min(vw - TIP_W - 12, hlLeft + (rect.width - TIP_W) / 2))
  } else if (step.position === 'right' && hlRight + TIP_W + 16 < vw) {
    top  = Math.max(12, Math.min(vh - TIP_H_EST - 12, hlTop + (rect.height - TIP_H_EST) / 2))
    left = hlRight + 16
  } else {
    top  = Math.max(12, Math.min(vh - TIP_H_EST - 12, hlTop + (rect.height - TIP_H_EST) / 2))
    left = Math.max(12, hlLeft - TIP_W - 16)
  }

  return (
    <div
      style={{
        position:     'fixed',
        top, left,
        width:        TIP_W,
        zIndex:       9999,
        background:   'linear-gradient(145deg, #1e1a2e 0%, #18152a 100%)',
        border:       '1px solid rgba(180,140,255,0.25)',
        borderRadius: 14,
        padding:      '20px 22px',
        boxShadow:    '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(180,140,255,0.1)',
        animation:    'tourTipIn 0.25s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: i === stepIndex ? 18 : 6, height: 6,
            borderRadius: 3,
            background: i === stepIndex ? 'var(--mana2, #b070ff)' : 'rgba(255,255,255,0.18)',
            transition: 'width .3s, background .3s',
          }} />
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '.01em' }}>
        {step.title}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 18 }}>
        {step.body}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {stepIndex > 0 && (
          <button onClick={onPrev} style={btnStyle('ghost')}>
            <IconChevronLeft size={13} /> Prev
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onSkip} style={{ ...btnStyle('ghost'), opacity: 0.5, fontSize: 10 }}>
          Skip tour
        </button>
        <button onClick={onNext} style={btnStyle('primary')}>
          {stepIndex === total - 1 ? <><IconCheck size={13} /> Done</> : <>Next <IconChevronRight size={13} /></>}
        </button>
      </div>
    </div>
  )
}

function btnStyle(variant) {
  if (variant === 'primary') return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 16px', fontSize: 12, fontWeight: 600,
    background: 'linear-gradient(135deg, #7c4dff, #b070ff)',
    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
    letterSpacing: '.02em',
  }
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '7px 12px', fontSize: 12,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, cursor: 'pointer',
  }
}

// ── OnboardingTour ───────────────────────────────────────────────────────────
export function OnboardingTour({ onComplete }) {
  const [step, setStep]   = useState(0)
  const [rect, setRect]   = useState(null)
  const [ready, setReady] = useState(false)

  const measureTarget = useCallback((idx) => {
    const s = TOUR_STEPS[idx]
    if (!s) return
    const el = document.querySelector(s.target)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect(r)
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    setTimeout(() => { setReady(true); measureTarget(step) }, 80)
  }, [])

  useEffect(() => { if (ready) measureTarget(step) }, [step, ready])

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1)
    else onComplete()
  }
  const prev = () => setStep(s => Math.max(0, s - 1))

  if (!ready) return null

  return (
    <>
      <Spotlight rect={rect} />
      <TourTooltip
        step={TOUR_STEPS[step]}
        stepIndex={step}
        total={TOUR_STEPS.length}
        rect={rect}
        onNext={next}
        onPrev={prev}
        onSkip={onComplete}
      />
    </>
  )
}

// ── WelcomeModal ─────────────────────────────────────────────────────────────
const WISP_COLORS = ['#b070ff', '#7c4dff', '#c878e8', '#8870ff', '#9966dd', '#a855f7']

export function WelcomeModal({ faction, factionData, t1UnitNames, goldBldName, onStartTour, onSkipTour }) {
  const [phase, setPhase]         = useState('enter') // enter | visible | exit
  const [giftsVisible, setGifts]  = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 50)
    const t2 = setTimeout(() => setGifts(true), 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const dismiss = (startTour) => {
    setPhase('exit')
    setTimeout(() => startTour ? onStartTour() : onSkipTour(), 350)
  }

  const fc = factionData?.color || '#b070ff'
  const bgImg = `/images/factions/${faction}.jpg`

  const gifts = [
    { icon: <IconBuildingCastle size={22} color="var(--gold, #c9a84c)" />, color: 'var(--gold, #c9a84c)', label: '1× ' + (goldBldName || 'Resource Building'), sub: 'Already constructed — earning income now' },
    { icon: <IconSword size={22} color={fc} />,                            color: fc,                      label: `6× each Tier 1 unit`,                         sub: t1UnitNames?.join(', ') || 'Your starter army stands ready' },
    { icon: <IconCoin size={22} color="var(--gold, #c9a84c)" />,           color: 'var(--gold, #c9a84c)', label: '+200 Bonus Gold',                              sub: 'Extra starting wealth to fuel your first moves' },
    { icon: <IconMap size={22} color="var(--green, #6dccaa)" />,           color: 'var(--green, #6dccaa)', label: '+5 Bonus Land',                               sub: 'Extra territory to house your new building' },
  ]

  const visible = phase === 'visible'

  // Outer particles floating around the modal
  const PARTICLES = [
    { size:7,  top:'-6%',  left:'14%',  delay:0,   dur:3.2 },
    { size:5,  top:'-8%',  left:'58%',  delay:.6,  dur:2.8 },
    { size:9,  top:'12%',  left:'-4%',  delay:.3,  dur:3.6 },
    { size:6,  top:'78%',  left:'-3%',  delay:1.1, dur:3.0 },
    { size:8,  top:'96%',  left:'28%',  delay:.2,  dur:4.0 },
    { size:5,  top:'92%',  left:'74%',  delay:.8,  dur:2.6 },
    { size:7,  top:'18%',  left:'103%', delay:.4,  dur:3.4 },
    { size:10, top:'62%',  left:'104%', delay:1.3, dur:2.9 },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        background: `radial-gradient(ellipse at 50% 50%, ${fc}14 0%, rgba(0,0,0,0.58) 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity .35s ease',
        backdropFilter: 'blur(5px)',
      }}
      onClick={e => e.target === e.currentTarget && dismiss(false)}
    >
      {/* Floating particles (outside modal, no interference with content) */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: i % 2 === 0 ? fc : '#fff',
          boxShadow: `0 0 ${p.size * 3}px ${i % 2 === 0 ? fc : '#ffffff99'}`,
          top: p.top, left: p.left,
          opacity: visible ? 0.8 : 0,
          animation: `floatParticle ${p.dur}s ${p.delay}s ease-in-out infinite`,
          transition: `opacity 1s ${p.delay * 0.4}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Single modal — pulsing glow + border on this one element only */}
      <div style={{
        position: 'relative',
        width: 'min(880px, 96vw)',
        maxHeight: '92vh',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        background: '#111020',
        border: `1px solid ${fc}55`,
        animation: 'modalPulse 3s ease-in-out infinite',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(22px)',
        transition: 'transform .42s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Dismiss button */}
        <button
          onClick={() => dismiss(false)}
          style={{ position:'absolute', top:14, right:14, zIndex:10, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, color:'rgba(255,255,255,0.55)', cursor:'pointer', padding:'5px 9px', display:'flex', alignItems:'center' }}
        >
          <IconX size={14} />
        </button>

        {/* Left: Faction Hero */}
        <div style={{ position:'relative', width:270, flexShrink:0, overflow:'hidden' }}>
          <img
            src={bgImg}
            alt={factionData?.name}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }}
            onError={e => { e.target.style.display='none' }}
          />
          {/* Gradient fade at bottom only */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, #111020 0%, transparent 45%)` }} />

          {/* Wisps */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            {WISP_COLORS.map((c, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 6 + i * 2, height: 6 + i * 2,
                borderRadius: '50%',
                background: c,
                boxShadow: `0 0 ${14 + i*4}px ${c}`,
                left: `${14 + (i % 3) * 30}%`,
                top: `${18 + Math.floor(i / 3) * 30 + (i % 2) * 14}%`,
                animation: `wispA${(i % 3) + 1} ${3 + i * 0.5}s ease-in-out infinite`,
                opacity: 0.75,
              }} />
            ))}
          </div>

          {/* Faction badge at bottom */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'22px 20px' }}>
            <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.16em', color:fc, marginBottom:5, fontWeight:600 }}>Welcome to</div>
            <div style={{ fontSize:19, fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.8)' }}>{factionData?.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:5, textShadow:'0 1px 6px rgba(0,0,0,0.9)' }}>{factionData?.epithet}</div>
          </div>
        </div>

        {/* Right: Content — solid dark background for maximum legibility */}
        <div style={{ flex:1, padding:'26px 26px 22px', overflowY:'auto', display:'flex', flexDirection:'column', background:'#111020' }}>

          {/* Header */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
              <IconSparkles size={16} color={fc} />
              <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.16em', color:fc, fontWeight:700 }}>Starter Gift</span>
            </div>
            <h2 style={{ fontSize:21, fontWeight:800, color:'#ffffff', margin:0, lineHeight:1.25 }}>Your Empire Begins Now</h2>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)', margin:'7px 0 0', lineHeight:1.65 }}>
              We've given your faction a head start. Build on it, expand your territory, and crush your rivals.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:16 }} />

          {/* Gift boxes */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:9.5, textTransform:'uppercase', letterSpacing:'.13em', color:'rgba(255,255,255,0.4)', marginBottom:10, fontWeight:600 }}>Welcome Gifts</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {gifts.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'8px 4px',
                    opacity: giftsVisible ? 1 : 0,
                    transform: giftsVisible ? 'translateX(0)' : 'translateX(-14px)',
                    transition: `opacity .38s ${i * 0.09}s, transform .38s ${i * 0.09}s cubic-bezier(.34,1.56,.64,1)`,
                  }}
                >
                  <div style={{ width:28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {g.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff', lineHeight:1.3 }}>{g.label}</div>
                    <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{g.sub}</div>
                  </div>
                  <IconCheck size={13} color={g.color} style={{ flexShrink:0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:16 }} />

          {/* How to play tips */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:9.5, textTransform:'uppercase', letterSpacing:'.13em', color:'rgba(255,255,255,0.4)', marginBottom:10, fontWeight:600 }}>Getting Started</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:<IconCompass size={13}/>, color:'#6dccaa', text:'Explore land first — buildings and armies require free acres.' },
                { icon:<IconBuildingCastle size={13}/>, color:'#c9a84c', text:'Build resource structures to earn passive gold and mana every hour.' },
                { icon:<IconSword size={13}/>, color:fc, text:'Recruit units from military halls, then upgrade halls to boost their stats.' },
                { icon:<IconShieldBolt size={13}/>, color:'#e87878', text:'Raid rivals in Battle to plunder their gold and climb the rankings.' },
              ].map((tip, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:11.5, color:'rgba(255,255,255,0.72)', lineHeight:1.55 }}>
                  <div style={{ color:tip.color, flexShrink:0, marginTop:2 }}>{tip.icon}</div>
                  {tip.text}
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display:'flex', gap:9, marginTop:'auto' }}>
            <button
              onClick={() => dismiss(true)}
              style={{
                flex:1, padding:'13px 20px',
                background: `linear-gradient(135deg, ${fc}, ${fc}aa)`,
                border: 'none',
                borderRadius:10, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', letterSpacing:'.03em',
                boxShadow: `0 4px 22px ${fc}55`,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              <IconTrophy size={15}/> Begin Your Conquest
            </button>
            <button
              onClick={() => dismiss(false)}
              style={{
                padding:'13px 16px',
                background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:10, color:'rgba(255,255,255,0.5)', fontSize:12,
                cursor:'pointer', whiteSpace:'nowrap',
              }}
            >
              Skip intro
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wispA1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(6px,-12px) scale(1.2)} }
        @keyframes wispA2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-8px,10px) scale(0.85)} }
        @keyframes wispA3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10px,8px) scale(1.15)} }
        @keyframes tourTipIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalPulse {
          0%,100% { box-shadow: 0 0 28px ${fc}33, 0 0 60px ${fc}18, 0 28px 70px rgba(0,0,0,0.7); border-color: ${fc}44; }
          50%      { box-shadow: 0 0 52px ${fc}66, 0 0 110px ${fc}33, 0 28px 70px rgba(0,0,0,0.7); border-color: ${fc}88; }
        }
        @keyframes floatParticle {
          0%,100% { transform:translate(0,0) scale(1);         opacity:.7; }
          33%      { transform:translate(4px,-11px) scale(1.3); opacity:.95; }
          66%      { transform:translate(-5px,6px) scale(0.8);  opacity:.45; }
        }
      `}</style>
    </div>
  )
}

// ── DailyRewardModal ─────────────────────────────────────────────────────────
const REWARD_ICON = {
  gold:  <IconCoin size={18} />,
  mana:  <IconSparkles size={18} />,
  land:  <IconMap size={18} />,
  turns: <IconClock size={18} />,
  item:  <IconPackage size={18} />,
}

export function DailyRewardModal({ rewardData, factionData, faction, streakBroke, shieldUsed, onClaim }) {
  const [phase, setPhase]           = useState('enter')
  const [rewardsVis, setRewardsVis] = useState(false)
  const [claimed, setClaimed]       = useState(false)
  const [imgFailed, setImgFailed]   = useState(false)

  const { rewards, isMilestone, isMini, awardShield, streakDay, completedChains, nextDayGold, nextExtras } = rewardData
  const fc = factionData?.color || '#b070ff'
  const ac = isMilestone ? '#ffd700' : isMini ? '#c878e8' : fc
  const heroSrc = faction ? `/images/factions/${faction}.jpg` : null

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 50)
    const t2 = setTimeout(() => setRewardsVis(true), 480)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleClaim = () => { if (claimed) return; setClaimed(true); setTimeout(onClaim, 500) }
  const visible = phase === 'visible'

  const PARTICLES = [
    { size:6, top:'-5%',  left:'10%',  delay:0,   dur:3.1 },
    { size:4, top:'-7%',  left:'55%',  delay:0.5, dur:2.8 },
    { size:8, top:'10%',  left:'-3%',  delay:0.3, dur:3.5 },
    { size:5, top:'85%',  left:'-2%',  delay:1.0, dur:3.0 },
    { size:7, top:'95%',  left:'30%',  delay:0.2, dur:3.8 },
    { size:5, top:'90%',  left:'72%',  delay:0.7, dur:2.6 },
    { size:6, top:'20%',  left:'102%', delay:0.4, dur:3.3 },
    { size:9, top:'60%',  left:'103%', delay:1.2, dur:2.9 },
  ]

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9991,
      background:`radial-gradient(ellipse at 50% 40%, ${ac}1a 0%, rgba(0,0,0,0.68) 70%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: visible ? 1 : 0, transition:'opacity .35s ease',
      backdropFilter:'blur(6px)',
    }}>
      {PARTICLES.map((p,i) => (
        <div key={i} style={{
          position:'absolute', width:p.size, height:p.size, borderRadius:'50%',
          background: i%2===0 ? ac : '#fff',
          boxShadow:`0 0 ${p.size*3}px ${i%2===0?ac:'#ffffff88'}`,
          top:p.top, left:p.left,
          opacity: visible ? 0.75 : 0,
          animation:`floatParticle ${p.dur}s ${p.delay}s ease-in-out infinite`,
          transition:`opacity .8s ${p.delay*0.3}s`,
          pointerEvents:'none',
        }}/>
      ))}

      <div style={{
        position:'relative', width:'min(480px, 94vw)', borderRadius:20,
        background:'#0f0e1a', border:`1px solid ${ac}55`,
        animation:'streakModalPulse 3s ease-in-out infinite',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(22px)',
        transition:'transform .42s cubic-bezier(.34,1.56,.64,1)',
        overflow:'hidden',
      }}>
        {/* Hero */}
        <div style={{
          position:'relative', overflow:'hidden',
          minHeight:200, textAlign:'center',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Faction image background */}
          {heroSrc && !imgFailed && (
            <img
              src={heroSrc}
              alt=""
              onError={() => setImgFailed(true)}
              style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', objectPosition:'center top',
                opacity:0.38,
              }}
            />
          )}
          {/* Dark + accent gradient overlays */}
          <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom, rgba(10,9,22,0.35) 0%, rgba(10,9,22,0.72) 65%, #0f0e1a 100%)`}}/>
          <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 0%, ${ac}2a 0%, transparent 70%)`}}/>

          {/* Content sits above overlays */}
          <div style={{position:'relative',padding:'28px 24px 20px'}}>
            {isMilestone && <div style={{fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'#ffd700',fontWeight:700,marginBottom:8}}>✦ Milestone Reached ✦</div>}
            {streakBroke && <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'#e87878',fontWeight:700,marginBottom:8}}>Streak reset · New chain started</div>}
            {shieldUsed  && <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'#ffd700',fontWeight:700,marginBottom:8}}>🛡️ Streak shield used · Chain preserved</div>}

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:10}}>
              <div style={{color:ac,filter:`drop-shadow(0 0 22px ${ac}) drop-shadow(0 0 8px ${ac})`,display:'flex'}}><IconFlame size={52}/></div>
              <div>
                <div style={{fontSize:64,fontWeight:900,color:ac,lineHeight:1,textShadow:`0 0 40px ${ac}cc, 0 2px 0 rgba(0,0,0,0.6)`}}>{streakDay}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.14em'}}>Day Streak</div>
              </div>
            </div>

            <div style={{fontSize:isMilestone?20:17,fontWeight:800,color:'#fff',marginBottom:4,textShadow:'0 1px 8px rgba(0,0,0,0.8)'}}>
              {isMilestone ? `${streakDay}-Day Champion!` : isMini ? 'Weekly Milestone!' : 'Daily Reward'}
            </div>
            <div style={{fontSize:10.5,color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>
              {completedChains > 0 && <span style={{color:ac}}>⬡ Veteran Chain ×{completedChains} — +{Math.round(completedChains*20)}% bonus · </span>}
              {streakDay < 5 ? 'Reach Day 5 to earn a Streak Shield' : 'Rewards scale with your streak'}
            </div>
          </div>
        </div>

        {/* Rewards list */}
        <div style={{padding:'18px 22px 0'}}>
          <div style={{fontSize:8.5,textTransform:'uppercase',letterSpacing:'.16em',color:'rgba(255,255,255,0.3)',marginBottom:10,fontWeight:700}}>Today's Rewards</div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {rewards.map((r,i) => (
              <div key={i} style={{
                display:'flex',alignItems:'center',gap:11,
                padding:'9px 12px',
                background:`${r.color}0d`, border:`1px solid ${r.color}25`, borderLeft:`3px solid ${r.color}`,
                borderRadius:9,
                opacity: rewardsVis?1:0,
                transform: rewardsVis?'translateX(0)':'translateX(-14px)',
                transition:`opacity .34s ${i*0.09}s, transform .34s ${i*0.09}s cubic-bezier(.34,1.56,.64,1)`,
              }}>
                <div style={{color:r.color,flexShrink:0,display:'flex',alignItems:'center'}}>{REWARD_ICON[r.type]||REWARD_ICON.item}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:r.color}}>{r.label}</div>
                  {r.sublabel && <div style={{fontSize:9.5,color:'rgba(255,255,255,0.38)',marginTop:1}}>{r.sublabel}</div>}
                  {r.type==='item' && r.item?.desc && <div style={{fontSize:9,color:'rgba(255,255,255,0.32)',marginTop:2,lineHeight:1.4,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{r.item.desc}</div>}
                </div>
                <IconCheck size={13} color={r.color} style={{flexShrink:0}}/>
              </div>
            ))}

            {awardShield && (
              <div style={{
                display:'flex',alignItems:'center',gap:11,padding:'9px 12px',
                background:'rgba(255,215,0,0.06)',border:'1px solid rgba(255,215,0,0.2)',borderLeft:'3px solid #ffd700',
                borderRadius:9,
                opacity:rewardsVis?1:0, transform:rewardsVis?'translateX(0)':'translateX(-14px)',
                transition:`opacity .34s ${rewards.length*0.09}s, transform .34s ${rewards.length*0.09}s`,
              }}>
                <IconShield size={18} color="#ffd700" style={{flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#ffd700'}}>Streak Shield Earned</div>
                  <div style={{fontSize:9.5,color:'rgba(255,255,255,0.38)',marginTop:1}}>Protects your streak if you miss one day</div>
                </div>
                <IconCheck size={13} color="#ffd700"/>
              </div>
            )}
          </div>

          {/* Tomorrow preview */}
          <div style={{margin:'14px 0 18px',padding:'9px 13px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <IconFlame size={12} color={ac}/>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>Day {streakDay+1} preview</span>
            </div>
            <div style={{fontSize:10.5,color:'rgba(255,255,255,0.6)',fontWeight:600}}>
              +{nextDayGold.toLocaleString()}g
              {nextExtras?.includes('item')  && ' · item'}
              {nextExtras?.includes('land')  && ' · land'}
              {nextExtras?.includes('turns') && ' · turns'}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{padding:'0 22px 22px'}}>
          <button onClick={handleClaim} disabled={claimed} style={{
            width:'100%', padding:'13px 24px',
            background: claimed ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${ac}, ${ac}bb)`,
            border:'none', borderRadius:11, color:'#fff', fontWeight:700, fontSize:14,
            cursor: claimed?'default':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: claimed?'none':`0 4px 22px ${ac}55`,
            transition:'all .3s', letterSpacing:'.03em',
          }}>
            {claimed ? <><IconCheck size={16}/> Claimed!</> : <><IconTrophy size={15}/> Claim Rewards</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes streakModalPulse {
          0%,100% { box-shadow: 0 0 28px ${ac}33, 0 0 60px ${ac}18, 0 28px 70px rgba(0,0,0,0.7); border-color: ${ac}44; }
          50%      { box-shadow: 0 0 52px ${ac}66, 0 0 110px ${ac}33, 0 28px 70px rgba(0,0,0,0.7); border-color: ${ac}88; }
        }
      `}</style>
    </div>
  )
}

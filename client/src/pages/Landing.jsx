import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../hooks/useGameStore.js'
import { IconSword, IconShieldCheck, IconArrowRight } from '@tabler/icons-react'
import { FACTIONS } from '../data/factions.js'
import { FactionImage } from '../components/Portrait.jsx'
import s from './Landing.module.css'

const LAST_EMAIL_KEY = 'roa_last_email'

export default function Landing() {
  const [tab, setTab]       = useState('login')
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [msg, setMsg]       = useState('')
  const { login, register, logout, loading, player } = useGameStore()
  const nav = useNavigate()
  const emailRef = useRef(null)
  const regEmailRef = useRef(null)
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Auto-redirect if session is still active
  useEffect(() => {
    if (player?.faction) { nav('/game',    { replace: true }); return }
    if (player)          { nav('/faction', { replace: true }); return }
    // Pre-fill email from last login
    const last = localStorage.getItem(LAST_EMAIL_KEY)
    if (last) setForm(f => ({ ...f, email: last }))
  }, [])

  // Focus first relevant field when tab switches
  useEffect(() => { emailRef.current?.focus() }, [tab])

  const handleLogin = async () => {
    const email = (emailRef.current?.value ?? form.email).trim()
    if (!email.includes('@'))      { setMsg('Enter a valid email address.'); return }
    if (!form.password)            { setMsg('Password required.'); return }
    try {
      const res = await login(email, form.password)
      if (res.ok) {
        localStorage.setItem(LAST_EMAIL_KEY, email)
        if (!remember) {
          window.addEventListener('beforeunload', () => logout(), { once: true })
        }
        nav('/game')
      } else {
        setMsg(res.error || 'Login failed.')
      }
    } catch (err) {
      setMsg(err.message || 'Login failed.')
    }
  }

  const handleRegister = async () => {
    if (!form.name.trim())         { setMsg('Enter your commander name.'); return }
    const email = (regEmailRef.current?.value ?? form.email).trim()
    if (!email.includes('@'))      { setMsg('Enter a valid email address.'); return }
    if (form.password.length < 8)  { setMsg('Password must be at least 8 characters.'); return }
    try {
      const res = await register(form.name.trim(), email, form.password)
      if (res.ok) {
        localStorage.setItem(LAST_EMAIL_KEY, email)
        nav('/faction')
      } else {
        setMsg(res.error || 'Registration failed.')
      }
    } catch (err) {
      setMsg(err.message || 'Registration failed.')
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister()
  }

  const switchTab = t => { setTab(t); setMsg(''); setTimeout(() => emailRef.current?.focus(), 0) }

  return (
    <div className={s.page}>
      <div className={s.gtitle}>Realm of Ages</div>
      <div className={s.gsub}>The Eternal War</div>
      <div className={s.gtag}>Five factions. One world. Infinite conquest.</div>
      <div className={s.divhr} />

      <div className={s.box}>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === 'login'    ? s.active : ''}`} onClick={() => switchTab('login')}>
            Enter the Realm
          </button>
          <button className={`${s.tab} ${tab === 'register' ? s.active : ''}`} onClick={() => switchTab('register')}>
            Join the War
          </button>
        </div>

        {tab === 'login' ? (
          <div>
            <div className={s.fld}>
              <label htmlFor="le">Commander Email</label>
              <input id="le" ref={emailRef} type="email" value={form.email} onChange={upd('email')} onKeyDown={handleKey}
                placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className={s.fld}>
              <label htmlFor="lp">Password</label>
              <input id="lp" type="password" value={form.password} onChange={upd('password')} onKeyDown={handleKey}
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            <label className={s.remember}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Stay signed in
            </label>
            <button className={s.btnG} onClick={handleLogin} disabled={loading}>
              <IconSword size={15} /> {loading ? 'Entering…' : 'March to War'}
            </button>
          </div>
        ) : (
          <div>
            <div className={s.fld}>
              <label htmlFor="rn">Commander Name</label>
              <input id="rn" ref={emailRef} type="text" value={form.name} onChange={upd('name')} onKeyDown={handleKey}
                placeholder="How you'll be known" autoComplete="username" />
            </div>
            <div className={s.fld}>
              <label htmlFor="re">Email Address</label>
              <input id="re" ref={regEmailRef} type="email" value={form.email} onChange={upd('email')} onKeyDown={handleKey}
                placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className={s.fld}>
              <label htmlFor="rp">Password</label>
              <input id="rp" type="password" value={form.password} onChange={upd('password')} onKeyDown={handleKey}
                placeholder="Min. 8 characters" autoComplete="new-password" />
            </div>
            <label className={s.remember}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Stay signed in
            </label>
            <button className={s.btnG} onClick={handleRegister} disabled={loading}>
              <IconShieldCheck size={15} /> {loading ? 'Creating…' : 'Claim Your Destiny'}
            </button>
          </div>
        )}

        {msg && <div className={s.msg}>{msg}</div>}

        <div className={s.switchHint}>
          {tab === 'login'
            ? <>New commander? <button className={s.switchLink} onClick={() => switchTab('register')}>Create account <IconArrowRight size={11}/></button></>
            : <>Already have an account? <button className={s.switchLink} onClick={() => switchTab('login')}>Sign in <IconArrowRight size={11}/></button></>
          }
        </div>
      </div>

      <div className={s.factionPrev}>
        {Object.keys(FACTIONS).map(fid => (
          <span key={fid} className={s.fpb}>
            <FactionImage factionId={fid} size={44} />
          </span>
        ))}
      </div>
      <div className={s.tagline}>5 Factions · MTG Colour Identity · D&D Stat Blocks · Async Multiplayer</div>
    </div>
  )
}

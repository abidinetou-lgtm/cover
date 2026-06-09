import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import socket from '../services/socket'

const MODES = [
  {
    key: 'online',
    title: 'En ligne',
    sub: 'Chacun son telephone',
    img: '/images/ligne.png',
    color: '#DC143C',
    border: 'rgba(220,20,60,0.35)',
    bg: 'rgba(220,20,60,0.08)',
    hoverBorder: 'rgba(220,20,60,0.7)',
    hoverBg: 'rgba(220,20,60,0.14)',
  },
  {
    key: 'local',
    title: 'Soiree',
    sub: 'Un seul appareil',
    img: '/images/soire.png',
    color: '#D4AF37',
    border: 'rgba(212,175,55,0.3)',
    bg: 'rgba(212,175,55,0.06)',
    hoverBorder: 'rgba(212,175,55,0.6)',
    hoverBg: 'rgba(212,175,55,0.12)',
  },
  {
    key: 'werewolf',
    title: 'Loup-Garou',
    sub: 'Le village contre les loups',
    img: '/images/loup-home.png',
    color: '#A855F7',
    border: 'rgba(168,85,247,0.3)',
    bg: 'rgba(168,85,247,0.06)',
    hoverBorder: 'rgba(168,85,247,0.6)',
    hoverBg: 'rgba(168,85,247,0.12)',
  },
]

export default function Home() {
  const [pseudo, setPseudo] = useState('')
  const [code, setCode] = useState('')
  const [view, setView] = useState('home')
  const [hovered, setHovered] = useState(null)
  const navigate = useNavigate()

  function handleMode(key) {
    if (key === 'online') setView('online')
    else if (key === 'local') navigate('/local')
    else if (key === 'werewolf') navigate('/werewolf')
  }

  function handleCreateOnline() {
    if (!pseudo.trim()) return alert('Entre ton pseudo')
    socket.emit('create_room', { pseudo, mode: 'online' })
    socket.once('room_created', ({ code }) => navigate(`/lobby/${code}`))
  }

  function handleJoinOnline() {
    if (!pseudo.trim()) return alert('Entre ton pseudo')
    if (!code.trim()) return alert('Entre le code')
    socket.emit('join_room', { code, pseudo })
    socket.once('room_joined', ({ code }) => navigate(`/lobby/${code}`))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A1A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(16px, 4vw, 40px)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '50vw', height: '50vw', maxWidth: '600px', maxHeight: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,20,60,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '40vw', height: '40vw', maxWidth: '500px', maxHeight: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(212,175,55,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #D4AF37, #DC143C, #A855F7, #D4AF37, transparent)' }} />

      <AnimatePresence mode="wait">

        {view === 'home' && (
          <motion.div key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(20px, 4vw, 36px)', width: '100%', maxWidth: '560px' }}>

            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{ width: '100%', position: 'relative' }}>
              <img src="/images/home.png" alt="Cover"
                style={{ width: '100%', display: 'block', borderRadius: '20px', boxShadow: '0 0 60px rgba(220,20,60,0.12), 0 0 120px rgba(168,85,247,0.08)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, #0A0A1A, transparent)', borderRadius: '0 0 20px 20px' }} />
            </motion.div>

            {/* Tagline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '-8px' }}>
              <div style={{ height: '1px', width: '32px', background: 'rgba(212,175,55,0.3)' }} />
              <p style={{ color: 'rgba(212,175,55,0.65)', fontSize: 'clamp(9px, 1.5vw, 11px)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: '600' }}>Social bluffing game</p>
              <div style={{ height: '1px', width: '32px', background: 'rgba(212,175,55,0.3)' }} />
            </div>

            {/* Pseudo input */}
            <div style={{ width: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5"/>
                  <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Ton pseudo..."
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                maxLength={16}
                style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', fontSize: '15px', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Mode cards */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(8px, 2vw, 14px)' }}>
              {MODES.map(m => (
                <button key={m.key}
                  onClick={() => handleMode(m.key)}
                  onMouseEnter={() => setHovered(m.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    padding: 'clamp(12px, 2.5vw, 20px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: '16px',
                    background: hovered === m.key ? m.hoverBg : m.bg,
                    border: `1.5px solid ${hovered === m.key ? m.hoverBorder : m.border}`,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                    outline: hovered === m.key ? `2px solid ${m.color}30` : 'none',
                    outlineOffset: '2px',
                  }}>
                  <img src={m.img} alt={m.title}
                    style={{ width: 'clamp(48px, 8vw, 72px)', height: 'clamp(48px, 8vw, 72px)', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: '800', color: hovered === m.key ? m.color : '#FFF8F0', marginBottom: '3px', transition: 'color 0.2s' }}>{m.title}</div>
                    <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: 'rgba(255,248,240,0.38)', lineHeight: 1.4 }}>{m.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 3vw, 20px)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{ c: '#22C55E', t: 'Gratuit' }, { c: '#DC143C', t: '3 à 12 joueurs' }, { c: '#D4AF37', t: 'Sans inscription' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.c }} />
                  <span style={{ color: 'rgba(255,248,240,0.28)', fontSize: 'clamp(10px, 1.5vw, 12px)' }}>{item.t}</span>
                </div>
              ))}
            </div>

          </motion.div>
        )}

        {view === 'online' && (
          <motion.div key="online"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '440px' }}>

            <button onClick={() => setView('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,240,0.35)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'Inter,sans-serif', padding: 0, width: 'fit-content' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Retour
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/images/ligne.png" alt="En ligne" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em', lineHeight: 1 }}>En ligne</h2>
                <p style={{ color: 'rgba(255,248,240,0.35)', fontSize: '13px', marginTop: '4px' }}>Partage le code avec tes amis</p>
              </div>
            </div>

            <div style={{ width: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5"/>
                  <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input type="text" placeholder="Ton pseudo..."
                value={pseudo} onChange={e => setPseudo(e.target.value)} maxLength={16}
                style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', fontSize: '15px', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleCreateOnline}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #8B0000, #DC143C)', color: 'white', fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Creer une partie
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ color: 'rgba(255,248,240,0.2)', fontSize: '12px' }}>ou rejoindre</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Code de la partie..."
                  value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6}
                  style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', fontSize: '16px', outline: 'none', letterSpacing: '0.15em', fontWeight: '800', fontFamily: 'Inter,sans-serif', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button onClick={handleJoinOnline}
                  style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}>
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
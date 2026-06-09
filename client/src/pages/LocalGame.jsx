import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getRandomWord } from '../data/words'
import { getMaxUndercover, canAddRole, canAddUndercover, getRoleComposition, SPECIAL_ROLES } from '../utils/gameRules'

const ROLE_IMAGES = {
  fou: "/images/fou.png",
  deesse: "/images/deesse.png",
  mime: "/images/mime.png",
  vengeur: "/images/vengeur.png",
  ange: "/images/ange.png",
  espion: "/images/espion.png",
  juge: "/images/juge.png",
  traître: "/images/traitre.png",
  medium: "/images/medium.png",
  misterwhite: "/images/white.png",
  policier: "/images/policier.png",
}



const ROLES_INFO = {
  civilian: { label: 'Civil', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', description: 'Tu recois le mot principal. Trouve et elimine les imposteurs avant qu\'ils ne prennent le controle.' },
  undercover: { label: 'Undercover', color: '#DC143C', bg: 'rgba(220,20,60,0.12)', border: 'rgba(220,20,60,0.3)', description: 'Tu recois un mot similaire. Bluff, imite les civils et evite d\'etre elimine.' },
  misterwhite: { label: 'Mister White', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.3)', description: 'Aucun mot. Ecoute les autres, bluff et devine le mot civil si tu es elimine.' },
  policier: { label: 'Policier', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', description: 'Tu connais les deux mots et tu sais qui est l\'undercover. Protege les civils discretement.' },
}

const DIFF = [
  { key: 'easy', label: 'Facile', desc: 'Mots evidents', color: '#22C55E', border: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.08)' },
  { key: 'normal', label: 'Normal', desc: 'Mots proches', color: '#D4AF37', border: 'rgba(212,175,55,0.4)', bg: 'rgba(212,175,55,0.08)' },
  { key: 'hardcore', label: 'Chaos', desc: 'Quasi identiques', color: '#DC143C', border: 'rgba(220,20,60,0.4)', bg: 'rgba(220,20,60,0.08)' },
]

function assignRoles(pseudos, config, difficulty) {
  const shuffled = [...pseudos].sort(() => Math.random() - 0.5)
  const pair = getRandomWord(difficulty)
  let assigned = shuffled.map(pseudo => ({
    pseudo, role: 'civilian', word: pair.civilian, category: pair.category, eliminated: false, specialRole: null, specialRoleUsed: false,
  }))
  let available = assigned.map((_, i) => i)

  if (config.hasPolicier && available.length > 0) {
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
    assigned[idx].role = 'policier'
    assigned[idx].word = `${pair.civilian} / ${pair.undercover}`
    assigned[idx].civilWord = pair.civilian
    assigned[idx].undercoverWord = pair.undercover
  }
  if (config.hasMisterWhite && available.length > 0) {
    const nonFirst = available.filter(i => i !== 0)
    const pool = nonFirst.length > 0 ? nonFirst : available
    const idx = pool[Math.floor(Math.random() * pool.length)]
    available = available.filter(i => i !== idx)
    assigned[idx].role = 'misterwhite'
    assigned[idx].word = null
  }
  for (let i = 0; i < config.undercoverCount && available.length > 0; i++) {
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
    assigned[idx].role = 'undercover'
    assigned[idx].word = pair.undercover
  }
  if (config.hasSpecialRoles && assigned.length >= 4) {
    const roleKeys = Object.keys(SPECIAL_ROLES)
    const count = Math.min(Math.floor(assigned.length / 3) + 1, 3)
    const picked = [...roleKeys].sort(() => Math.random() - 0.5).slice(0, count)
    const eligible = [...assigned].sort(() => Math.random() - 0.5)
    picked.forEach((roleKey, i) => {
      if (eligible[i]) {
        const player = assigned.find(p => p.pseudo === eligible[i].pseudo)
        if (player) player.specialRole = roleKey
      }
    })
  }
  return assigned
}

function buildSpeakOrder(players) {
  const alive = players.filter(p => !p.eliminated)
  const whites = alive.filter(p => p.role === 'misterwhite')
  const others = alive.filter(p => p.role !== 'misterwhite').sort(() => Math.random() - 0.5)
  if (whites.length > 0 && others.length > 0) {
    const at = Math.floor(Math.random() * others.length) + 1
    whites.forEach((w, i) => others.splice(at + i, 0, w))
    return others
  }
  return [...others, ...whites]
}

function checkWin(players) {
  const alive = players.filter(p => !p.eliminated)
  const undercoverAlive = alive.filter(p => p.role === 'undercover').length
  const civilAlive = alive.filter(p => p.role === 'civilian' || p.role === 'policier').length
  if (undercoverAlive === 0) return 'civilians'
  if (undercoverAlive >= civilAlive) return 'undercover'
  return null
}

const T = {
  page: { minHeight: '100vh', background: '#0A0A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', fontFamily: 'Inter,sans-serif' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', width: '100%', position: 'relative' },
  goldCard: { background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px', padding: '24px', width: '100%', position: 'relative' },
  btn: (bg = 'linear-gradient(135deg,#8B0000,#DC143C)', color = '#FFF8F0') => ({
    width: '100%', padding: '15px', borderRadius: '12px', background: bg, color, fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'opacity 0.2s', letterSpacing: '-0.01em',
  }),
  input: { width: '100%', padding: '13px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', fontSize: '14px', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  label: { fontSize: '11px', fontWeight: '700', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '10px' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '18px 0' },
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,240,0.35)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'Inter,sans-serif', padding: 0 },
  badge: (color, bg, border) => ({ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: bg, color, fontWeight: '700', border: `1px solid ${border}`, display: 'inline-block' }),
}

const BgDeco = () => (
  <>
    <div style={{ position: 'absolute', top: '-25%', left: '-15%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,200,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(212,175,55,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #D4AF37, #DC143C, #D4AF37, transparent)' }} />
  </>
)

function RoleImage({ roleKey, size = 80 }) {
  const src = ROLE_IMAGES[roleKey]
  if (!src) return null
  return (
    <img src={src} alt={roleKey}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: '12px' }} />
  )
}

export default function LocalGame() {
  const navigate = useNavigate()
  const [step, setStep] = useState('setup')
  const [difficulty, setDifficulty] = useState('normal')
  const [playerCount, setPlayerCount] = useState(4)
  const [config, setConfig] = useState({ undercoverCount: 1, hasMisterWhite: false, hasPolicier: false, hasSpecialRoles: false })
  const [pseudos, setPseudos] = useState([])
  const [currentPseudo, setCurrentPseudo] = useState('')
  const [players, setPlayers] = useState([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(false)
  const [speakOrder, setSpeakOrder] = useState([])
  const [voteTarget, setVoteTarget] = useState(null)
  const [gameOver, setGameOver] = useState(null)
  const [showMWGuess, setShowMWGuess] = useState(false)
  const [misterWhiteGuess, setMisterWhiteGuess] = useState('')
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null)
  const [tourNumber, setTourNumber] = useState(1)
  const [showFouChoice, setShowFouChoice] = useState(false)
  const [judgeUsed, setJudgeUsed] = useState(false)
  const [angeUsed, setAngeUsed] = useState(false)
  const [showAngeChoice, setShowAngeChoice] = useState(false)
  const [notification, setNotification] = useState(null)

  const maxUnder = getMaxUndercover(playerCount)
  const composition = getRoleComposition(playerCount, config)

  function notify(msg, color = '#D4AF37') {
    setNotification({ msg, color })
    setTimeout(() => setNotification(null), 3500)
  }

  function addPseudo() {
    const t = currentPseudo.trim()
    if (!t || pseudos.length >= playerCount) return
    setPseudos(p => [...p, t])
    setCurrentPseudo('')
  }

  function startGame() {
    const assigned = assignRoles(pseudos, config, difficulty)
    setPlayers(assigned)
    setRevealIndex(0)
    setWordVisible(false)
    setTourNumber(1)
    setStep('reveal')
  }

  function nextReveal() {
    if (revealIndex + 1 >= players.length) {
      const publicSpecials = players.filter(p => p.specialRole && SPECIAL_ROLES[p.specialRole]?.public)
      if (publicSpecials.length > 0) {
        setStep('announce_specials')
      } else {
        setSpeakOrder(buildSpeakOrder(players))
        setStep('speak')
      }
    } else {
      setRevealIndex(i => i + 1)
      setWordVisible(false)
    }
  }

  function confirmElimination() {
    if (!voteTarget) return
    const target = players.find(p => p.pseudo === voteTarget)
    setEliminatedPlayer(target)
    if (target.specialRole === 'fou' && tourNumber === 1) { setShowFouChoice(true); return }
    if (target.role === 'misterwhite') { setShowMWGuess(true); return }
    const angePlayer = players.find(p => p.specialRole === 'ange' && !p.eliminated && !angeUsed)
    if (angePlayer && (target.role === 'civilian' || target.role === 'policier')) { setShowAngeChoice(true); return }
    applyElimination(target, players)
  }

  function applyFouChoice(victimPseudo) {
    setShowFouChoice(false)
    let updated = players.map(p => p.pseudo === eliminatedPlayer.pseudo ? { ...p, eliminated: true } : p)
    if (victimPseudo) {
      updated = updated.map(p => p.pseudo === victimPseudo ? { ...p, eliminated: true } : p)
      notify(`Le Fou emporte ${victimPseudo} avec lui !`, '#A78BFA')
    }
    if (eliminatedPlayer.role === 'misterwhite') { setPlayers(updated); setShowMWGuess(true); return }
    finalizeElimination(updated)
  }

  function applyAngeChoice(save) {
    setShowAngeChoice(false)
    if (save) {
      setAngeUsed(true)
      notify(`L'Ange sauve ${eliminatedPlayer.pseudo} !`, '#60A5FA')
      setEliminatedPlayer(null)
      setVoteTarget(null)
      setSpeakOrder(buildSpeakOrder(players))
      setStep('speak')
    } else {
      applyElimination(eliminatedPlayer, players)
    }
  }

  function applyElimination(target, currentPlayers) {
    const updated = currentPlayers.map(p => p.pseudo === target.pseudo ? { ...p, eliminated: true } : p)
    finalizeElimination(updated)
  }

  function finalizeElimination(updated) {
    setPlayers(updated)
    setShowMWGuess(false)
    setMisterWhiteGuess('')
    setEliminatedPlayer(null)
    setVoteTarget(null)
    const winner = checkWin(updated)
    if (winner) {
      setGameOver({ winner, players: updated, civilWord: updated.find(p => p.role === 'civilian')?.word })
      setStep('gameover')
      return
    }
    setTourNumber(t => t + 1)
    setSpeakOrder(buildSpeakOrder(updated))
    setStep('speak')
  }

  function useJuge() {
    if (judgeUsed) return
    setJudgeUsed(true)
    setVoteTarget(null)
    notify('Le Juge annule le vote ! Nouveau round sans elimination.', '#D4AF37')
    setSpeakOrder(buildSpeakOrder(players))
    setStep('speak')
  }

  function checkMWGuess() {
    const civilWord = players.find(p => p.role === 'civilian')?.word?.toLowerCase().trim()
    if (misterWhiteGuess.trim().toLowerCase() === civilWord) {
      setGameOver({ winner: 'misterwhite', players, civilWord })
      setStep('gameover')
    } else {
      applyElimination(eliminatedPlayer, players)
    }
  }

  function resetGame() {
    setStep('setup')
    setPseudos([])
    setConfig({ undercoverCount: 1, hasMisterWhite: false, hasPolicier: false, hasSpecialRoles: false })
    setPlayers([])
    setGameOver(null)
    setVoteTarget(null)
    setTourNumber(1)
    setJudgeUsed(false)
    setAngeUsed(false)
  }

  const currentPlayer = players[revealIndex]
  const hasJuge = players.some(p => p.specialRole === 'juge' && !p.eliminated)
  const publicSpecials = players.filter(p => p.specialRole && SPECIAL_ROLES[p.specialRole]?.public)

  return (
    <div style={T.page}>
      <BgDeco />

      {notification && (
        <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', top: '20px', left: '50%', background: 'rgba(10,10,26,0.95)', border: `1px solid ${notification.color}`, borderRadius: '12px', padding: '12px 20px', color: notification.color, fontWeight: '700', fontSize: '14px', zIndex: 100, maxWidth: '340px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          {notification.msg}
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <button onClick={() => navigate('/')} style={T.back}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Retour
            </button>

            <div style={T.card}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em', marginBottom: '4px' }}>Configuration</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '20px' }}>Mode Soiree — un seul appareil</p>

              <label style={T.label}>Joueurs</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                <button onClick={() => setPlayerCount(p => Math.max(3, p - 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '20px', color: '#FFF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#FFF8F0', minWidth: '60px', textAlign: 'center', letterSpacing: '-0.04em' }}>{playerCount}</span>
                <button onClick={() => setPlayerCount(p => Math.min(12, p + 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '20px', color: '#FFF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', background: i < playerCount ? '#DC143C' : 'rgba(255,255,255,0.06)', transition: 'background 0.2s' }} />
                  ))}
                </div>
              </div>

              <div style={T.divider} />

              <label style={T.label}>Difficulte</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                {DIFF.map(d => (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    style={{ padding: '12px 6px', borderRadius: '10px', border: `1.5px solid ${difficulty === d.key ? d.border : 'rgba(255,255,255,0.07)'}`, background: difficulty === d.key ? d.bg : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: difficulty === d.key ? d.color : 'rgba(255,248,240,0.5)', marginBottom: '2px' }}>{d.label}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,248,240,0.3)' }}>{d.desc}</div>
                  </button>
                ))}
              </div>

              <div style={T.divider} />

              <label style={T.label}>Undercover — max {maxUnder}</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                {Array.from({ length: maxUnder }, (_, i) => i + 1).map(n => {
                  const allowed = canAddUndercover(playerCount, config, n)
                  const selected = config.undercoverCount === n
                  return (
                    <button key={n} onClick={() => { if (allowed) setConfig(c => ({ ...c, undercoverCount: n })) }}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${selected ? 'rgba(220,20,60,0.5)' : 'rgba(255,255,255,0.07)'}`, background: selected ? 'rgba(220,20,60,0.12)' : 'rgba(255,255,255,0.02)', color: selected ? '#DC143C' : 'rgba(255,248,240,0.4)', fontWeight: '800', fontSize: '18px', cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.3 }}>
                      {n}
                    </button>
                  )
                })}
              </div>

              <div style={T.divider} />

              <label style={T.label}>Roles de base</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                {[
                { key: 'hasMisterWhite', role: 'misterwhite', label: 'Mister White', desc: 'Aucun mot — doit deviner', img: '/images/white.png' },
                  { key: 'hasPolicier', role: 'policier', label: 'Policier', desc: 'Connait les deux mots', img: '/images/policier.png' },
                ].map(({ key, role, label, desc, img }) => {
                  const active = config[key]
                  const allowed = active || canAddRole(playerCount, config, role)
                  const ri = ROLES_INFO[role]
                  return (
                    <button key={key} onClick={() => { if (allowed) setConfig(c => ({ ...c, [key]: !c[key] })) }} disabled={!allowed}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: `1.5px solid ${active ? ri.border : 'rgba(255,255,255,0.07)'}`, background: active ? ri.bg : 'rgba(255,255,255,0.02)', cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.4, textAlign: 'left', transition: 'all 0.15s' }}>
                      <img src={img} alt={label} style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: active ? ri.color : 'rgba(255,248,240,0.7)' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.3)', marginTop: '2px' }}>{desc}</div>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `1.5px solid ${active ? ri.color : 'rgba(255,255,255,0.15)'}`, background: active ? ri.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {active && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div style={T.divider} />

              <button onClick={() => setConfig(c => ({ ...c, hasSpecialRoles: !c.hasSpecialRoles }))}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '14px', border: `1.5px solid ${config.hasSpecialRoles ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`, background: config.hasSpecialRoles ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '14px', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', gap: '-8px' }}>
                  {[ROLE_IMAGES.fou, ROLE_IMAGES.deesse, ROLE_IMAGES.mime].map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', marginLeft: i > 0 ? '-8px' : 0, border: '2px solid rgba(10,10,26,0.8)' }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: config.hasSpecialRoles ? '#D4AF37' : 'rgba(255,248,240,0.6)', marginBottom: '2px' }}>Roles speciaux avances</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.3)', lineHeight: '1.4' }}>Fou, Deesse, Mime, Vengeur, Ange, Espion, Juge, Traitre, Medium — distribues aleatoirement</div>
                </div>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `1.5px solid ${config.hasSpecialRoles ? '#D4AF37' : 'rgba(255,255,255,0.15)'}`, background: config.hasSpecialRoles ? '#D4AF37' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {config.hasSpecialRoles && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </button>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: composition.valid ? 'rgba(34,197,94,0.06)' : 'rgba(220,20,60,0.06)', border: `1px solid ${composition.valid ? 'rgba(34,197,94,0.25)' : 'rgba(220,20,60,0.25)'}`, marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: composition.valid ? '#22C55E' : '#DC143C', marginBottom: '6px' }}>
                  {composition.valid ? 'Composition valide' : 'Pas assez de civils (min. 2)'}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={T.badge('#22C55E', 'rgba(34,197,94,0.1)', 'rgba(34,197,94,0.3)')}>{composition.civils} Civil{composition.civils > 1 ? 's' : ''}</span>
                  <span style={T.badge('#DC143C', 'rgba(220,20,60,0.1)', 'rgba(220,20,60,0.3)')}>{composition.undercover} Undercover</span>
                  {composition.misterwhite > 0 && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.1)', 'rgba(212,175,55,0.3)')}>1 Mister White</span>}
                  {composition.policier > 0 && <span style={T.badge('#60A5FA', 'rgba(96,165,250,0.1)', 'rgba(96,165,250,0.3)')}>1 Policier</span>}
                </div>
              </div>

              <button onClick={() => setStep('pseudos')} disabled={!composition.valid}
                style={{ ...T.btn(), opacity: composition.valid ? 1 : 0.4, cursor: composition.valid ? 'pointer' : 'not-allowed' }}>
                Entrer les pseudos →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PSEUDOS ── */}
        {step === 'pseudos' && (
          <motion.div key="pseudos" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button onClick={() => setStep('setup')} style={T.back}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Retour
            </button>
            <div style={T.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em' }}>Joueurs</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Entre les pseudos un par un</p>
                </div>
                <div>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: pseudos.length === playerCount ? '#22C55E' : '#FFF8F0', letterSpacing: '-0.04em' }}>{pseudos.length}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,248,240,0.25)', fontWeight: '600' }}>/{playerCount}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {pseudos.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,248,240,0.25)', fontWeight: '700', minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ fontSize: '14px', color: '#FFF8F0', fontWeight: '600', flex: 1 }}>{p}</span>
                    <button onClick={() => setPseudos(ps => ps.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(220,20,60,0.5)', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>×</button>
                  </motion.div>
                ))}
              </div>
              {pseudos.length < playerCount ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder={`Joueur ${pseudos.length + 1}...`}
                    value={currentPseudo}
                    onChange={e => setCurrentPseudo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPseudo()}
                    style={T.input}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button onClick={addPseudo}
                    style={{ padding: '13px 18px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontWeight: '800', fontSize: '16px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>+</button>
                </div>
              ) : (
                <button onClick={startGame} style={{ ...T.btn(), marginTop: '8px' }}>Lancer la partie →</button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── REVEAL ── */}
        {step === 'reveal' && currentPlayer && (
          <motion.div key={`reveal-${revealIndex}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,248,240,0.35)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tour de</p>
              <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em' }}>{currentPlayer.pseudo}</h2>
              <p style={{ color: 'rgba(255,248,240,0.2)', fontSize: '12px', marginTop: '4px' }}>{revealIndex + 1} sur {players.length}</p>
            </div>

            {!wordVisible ? (
              <motion.div whileTap={{ scale: 0.97 }} onClick={() => setWordVisible(true)}
                style={{ width: '100%', minHeight: '220px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(212,175,55,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(212,175,55,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <path d="M3 3l18 18" stroke="#DC143C" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{ color: 'rgba(255,248,240,0.4)', fontSize: '15px', fontWeight: '600' }}>Appuie pour voir ton role</p>
                <p style={{ color: 'rgba(255,248,240,0.15)', fontSize: '12px' }}>Assure-toi d'etre seul a regarder</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                <div style={{ ...T.card, textAlign: 'center', padding: '28px 24px', border: `1px solid ${ROLES_INFO[currentPlayer.role]?.border || 'rgba(212,175,55,0.2)'}`, background: ROLES_INFO[currentPlayer.role]?.bg || 'rgba(255,255,255,0.04)' }}>

                  {/* Image du role de base */}
                  {(currentPlayer.role === 'misterwhite' || currentPlayer.role === 'policier') && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <img src={ROLE_IMAGES[currentPlayer.role]} alt={currentPlayer.role}
                        style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                    </div>
                  )}

                  <p style={{ fontSize: '11px', color: 'rgba(255,248,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{currentPlayer.category || 'Ton role'}</p>

                  {currentPlayer.word ? (
                    <p style={{ fontSize: '46px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px', textShadow: `0 0 30px ${ROLES_INFO[currentPlayer.role]?.color || '#D4AF37'}50` }}>
                      {currentPlayer.word}
                    </p>
                  ) : (
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#D4AF37', marginBottom: '16px' }}>Aucun mot</p>
                  )}

                  <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${ROLES_INFO[currentPlayer.role]?.border || 'rgba(212,175,55,0.3)'}`, marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: ROLES_INFO[currentPlayer.role]?.color || '#D4AF37' }}>{ROLES_INFO[currentPlayer.role]?.label}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.4)', lineHeight: '1.6', maxWidth: '280px', margin: '0 auto' }}>{ROLES_INFO[currentPlayer.role]?.description}</p>

                  {/* Role special */}
                  {currentPlayer.specialRole && SPECIAL_ROLES[currentPlayer.specialRole] && (
                    <div style={{ marginTop: '18px', padding: '16px', borderRadius: '14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${SPECIAL_ROLES[currentPlayer.specialRole].border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <img src={ROLE_IMAGES[currentPlayer.specialRole]} alt={currentPlayer.specialRole}
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: SPECIAL_ROLES[currentPlayer.specialRole].color }}>
                            {SPECIAL_ROLES[currentPlayer.specialRole].label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.35)', marginTop: '2px' }}>
                            {SPECIAL_ROLES[currentPlayer.specialRole].public ? 'Role public' : 'Role secret'}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.45)', lineHeight: '1.5', textAlign: 'left' }}>
                        {SPECIAL_ROLES[currentPlayer.specialRole].description}
                      </p>
                    </div>
                  )}
                </div>

                <button onClick={nextReveal} style={{ ...T.btn(), marginTop: '14px' }}>
                  {revealIndex + 1 >= players.length ? "Voir les roles publics →" : 'Joueur suivant →'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── ANNOUNCE SPECIALS ── */}
        {step === 'announce_specials' && (
          <motion.div key="announce" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <p style={{ color: 'rgba(212,175,55,0.6)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Annonce publique</p>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em' }}>Roles speciaux actifs</h2>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {publicSpecials.map(p => {
                const sr = SPECIAL_ROLES[p.specialRole]
                return (
                  <motion.div key={p.pseudo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '16px', background: sr.bg, border: `1px solid ${sr.border}` }}>
                    <img src={ROLE_IMAGES[p.specialRole]} alt={p.specialRole}
                      style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: sr.color, marginBottom: '3px' }}>{sr.label}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,248,240,0.4)', lineHeight: '1.4' }}>{sr.description}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <button onClick={() => { setSpeakOrder(buildSpeakOrder(players)); setStep('speak') }} style={{ ...T.btn(), width: '100%', maxWidth: '440px' }}>
              Commencer le debat →
            </button>
          </motion.div>
        )}

        {/* ── SPEAK ── */}
        {step === 'speak' && (
          <motion.div key="speak" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px' }}>
            <div style={T.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.25)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC143C' }}>Tour {tourNumber}</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em' }}>Ordre de parole</h2>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.3)', marginBottom: '16px' }}>Chacun dit quelque chose en rapport avec son mot. Ne le mentionnez pas directement.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px' }}>
                {speakOrder.map((p, i) => {
                  const isMime = p.specialRole === 'mime'
                  return (
                    <motion.div key={p.pseudo} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: i === 0 ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: i === 0 ? '#D4AF37' : 'rgba(255,248,240,0.2)', minWidth: '24px' }}>{i + 1}.</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFF8F0', flex: 1 }}>{p.pseudo}</span>
                      {isMime && <span style={T.badge('#5EEAD4', 'rgba(94,234,212,0.1)', 'rgba(94,234,212,0.3)')}>MIME</span>}
                      {i === 0 && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.1)', 'rgba(212,175,55,0.3)')}>Commence</span>}
                    </motion.div>
                  )
                })}
              </div>
              <button onClick={() => { setVoteTarget(null); setStep('vote') }} style={T.btn()}>Passer au vote →</button>
            </div>
          </motion.div>
        )}

        {/* ── VOTE ── */}
        {step === 'vote' && (
          <motion.div key="vote" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px' }}>
            <div style={T.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em' }}>Vote</h2>
                {hasJuge && !judgeUsed && (
                  <button onClick={useJuge}
                    style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#D4AF37', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={ROLE_IMAGES.juge} alt="juge" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    Le Juge annule
                  </button>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.3)', marginBottom: '16px' }}>Les joueurs votent a voix haute. Le master selectionne l'elimine.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px' }}>
                {players.filter(p => !p.eliminated).map(p => (
                  <button key={p.pseudo} onClick={() => setVoteTarget(voteTarget === p.pseudo ? null : p.pseudo)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: voteTarget === p.pseudo ? 'rgba(220,20,60,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${voteTarget === p.pseudo ? 'rgba(220,20,60,0.4)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: voteTarget === p.pseudo ? 'rgba(220,20,60,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', color: voteTarget === p.pseudo ? '#DC143C' : 'rgba(255,248,240,0.4)', border: `1px solid ${voteTarget === p.pseudo ? 'rgba(220,20,60,0.3)' : 'rgba(255,255,255,0.07)'}`, flexShrink: 0 }}>
                      {p.pseudo[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: voteTarget === p.pseudo ? '#FFF8F0' : 'rgba(255,248,240,0.6)', flex: 1 }}>{p.pseudo}</span>
                    {p.specialRole && SPECIAL_ROLES[p.specialRole]?.public && ROLE_IMAGES[p.specialRole] && (
                      <img src={ROLE_IMAGES[p.specialRole]} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', opacity: 0.8 }} />
                    )}
                    {voteTarget === p.pseudo && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="#DC143C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={confirmElimination} disabled={!voteTarget}
                style={{ ...T.btn(voteTarget ? 'linear-gradient(135deg,#8B0000,#DC143C)' : 'rgba(255,255,255,0.04)', voteTarget ? '#FFF8F0' : 'rgba(255,248,240,0.2)'), cursor: voteTarget ? 'pointer' : 'not-allowed' }}>
                {voteTarget ? `Eliminer ${voteTarget}` : 'Selectionne un joueur'}
              </button>
            </div>

            {/* Popup MW */}
            {showMWGuess && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ ...T.card, maxWidth: '360px', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
<img src="/images/white.png" alt="mister white" style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', marginBottom: '6px' }}>Mister White elimine</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '16px', lineHeight: '1.6' }}>Derniere chance — devine le mot des civils pour gagner quand meme.</p>
                  <input type="text" placeholder="Le mot..." value={misterWhiteGuess}
                    onChange={e => setMisterWhiteGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && checkMWGuess()}
                    style={{ ...T.input, marginBottom: '12px', textAlign: 'center', fontSize: '16px' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button onClick={checkMWGuess} style={T.btn()}>Valider</button>
                </motion.div>
              </div>
            )}

            {/* Popup Fou */}
            {showFouChoice && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ ...T.card, maxWidth: '380px', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <img src={ROLE_IMAGES.fou} alt="fou" style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', marginBottom: '6px', textAlign: 'center' }}>Le Fou est elimine !</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '16px', lineHeight: '1.6', textAlign: 'center' }}>C'est le premier tour. Le Fou peut emporter quelqu'un avec lui.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                    {players.filter(p => !p.eliminated && p.pseudo !== eliminatedPlayer?.pseudo).map(p => (
                      <button key={p.pseudo} onClick={() => applyFouChoice(p.pseudo)}
                        style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', color: '#FFF8F0', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left' }}>
                        {p.pseudo}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => applyFouChoice(null)} style={T.btn('rgba(255,255,255,0.04)', 'rgba(255,248,240,0.35)')}>
                    Partir seul
                  </button>
                </motion.div>
              </div>
            )}

            {/* Popup Ange */}
            {showAngeChoice && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ ...T.card, maxWidth: '380px', border: '1px solid rgba(96,165,250,0.3)', textAlign: 'center' }}>
                  <img src={ROLE_IMAGES.ange} alt="ange" style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', marginBottom: '6px' }}>L'Ange peut intervenir</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '20px', lineHeight: '1.6' }}>
                    <strong style={{ color: '#60A5FA' }}>{eliminatedPlayer?.pseudo}</strong> est innocent. L'Ange peut le sauver une seule fois.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => applyAngeChoice(true)} style={{ ...T.btn('linear-gradient(135deg,#1D4ED8,#60A5FA)'), flex: 1 }}>Sauver</button>
                    <button onClick={() => applyAngeChoice(false)} style={{ ...T.btn('rgba(255,255,255,0.04)', 'rgba(255,248,240,0.35)'), flex: 1 }}>Laisser</button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── GAME OVER ── */}
        {step === 'gameover' && gameOver && (
          <motion.div key="gameover" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', maxWidth: '440px' }}>
            <div style={{ ...T.card, border: '1px solid rgba(212,175,55,0.2)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                {gameOver.winner === 'civilians' && (
                  <img src={ROLE_IMAGES.policier} alt="victoire" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                )}
                {gameOver.winner === 'undercover' && (
                  <img src={ROLE_IMAGES.espion} alt="undercover gagne" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                )}
                {gameOver.winner === 'misterwhite' && (
<img src="/images/white.png" alt="mister white" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                )}
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {gameOver.winner === 'civilians' && 'Les Civils gagnent !'}
                {gameOver.winner === 'undercover' && 'Les Undercover gagnent !'}
                {gameOver.winner === 'misterwhite' && 'Mister White a devine !'}
              </h2>
              {gameOver.civilWord && (
                <p style={{ fontSize: '14px', color: 'rgba(255,248,240,0.35)', marginBottom: '20px' }}>
                  Le mot etait <span style={{ color: '#D4AF37', fontWeight: '700' }}>"{gameOver.civilWord}"</span>
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px', textAlign: 'left' }}>
                {gameOver.players.map(p => {
                  const ri = ROLES_INFO[p.role]
                  const sr = p.specialRole ? SPECIAL_ROLES[p.specialRole] : null
                  return (
                    <div key={p.pseudo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: ri?.bg || 'rgba(255,255,255,0.03)', border: `1px solid ${ri?.border || 'rgba(255,255,255,0.06)'}`, opacity: p.eliminated ? 0.45 : 1 }}>
                      {ROLE_IMAGES[p.role] && (
                        <img src={ROLE_IMAGES[p.role]} alt={p.role} style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFF8F0', flex: 1 }}>{p.pseudo}</span>
                      <span style={T.badge(ri?.color, ri?.bg, ri?.border)}>{ri?.label}</span>
                      {sr && <span style={T.badge(sr.color, sr.bg, sr.border)}>{sr.label}</span>}
                      {p.word && <span style={{ fontSize: '11px', color: 'rgba(255,248,240,0.25)' }}>"{p.word}"</span>}
                      {p.eliminated && <span style={{ fontSize: '10px', color: '#DC143C', fontWeight: '700' }}>Out</span>}
                    </div>
                  )
                })}
              </div>
              <button onClick={resetGame} style={T.btn()}>Rejouer →</button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

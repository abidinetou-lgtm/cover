import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const THEME = {
  page: { minHeight: '100vh', background: '#08060F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,32px)', position: 'relative', overflow: 'hidden', fontFamily: 'Inter,sans-serif' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '20px', padding: 'clamp(16px,3vw,24px)', width: '100%', position: 'relative' },
  btn: (bg = 'linear-gradient(135deg,#4C1D95,#7C3AED)', color = '#FFF8F0') => ({ width: '100%', padding: '15px', borderRadius: '12px', background: bg, color, fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'opacity 0.2s', letterSpacing: '-0.01em' }),
  input: { width: '100%', padding: '13px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(168,85,247,0.2)', color: '#FFF8F0', fontSize: '14px', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  label: { fontSize: '11px', fontWeight: '700', color: 'rgba(168,85,247,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '10px' },
  divider: { height: '1px', background: 'rgba(168,85,247,0.1)', margin: '16px 0' },
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,240,0.35)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'Inter,sans-serif', padding: 0 },
  badge: (c, bg, b) => ({ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: bg, color: c, fontWeight: '700', border: `1px solid ${b}`, display: 'inline-block' }),
}

const ROLES_BASE = {
  villageois: {
    label: 'Villageois', img: '/images/villageaois.png', color: '#D97706',
    bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)', team: 'village',
    description: 'Tu es un simple villageois. Vote intelligemment pour eliminer les loups.',
  },
  loup: {
    label: 'Loup-Garou', img: '/images/loup.png', color: '#EF4444',
    bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', team: 'loups',
    description: 'Chaque nuit, tu te reveilles avec les autres loups pour designer une victime.',
  },
  alpha: {
    label: 'Loup Alpha', img: '/images/alpha.png', color: '#DC2626',
    bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.35)', team: 'loups',
    description: 'Chef des loups. Tu peux parfois transformer un villageois en loup.',
  },
  cupidon: {
    label: 'Cupidon', img: '/images/cupidon.png', color: '#EC4899',
    bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', team: 'village',
    description: 'La premiere nuit, tu designes deux joueurs qui tombent amoureux.',
  },
  sorciere: {
    label: 'La Sorciere', img: '/images/sorciere.png', color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', team: 'village',
    description: 'Tu possedes une potion de vie et une potion de mort, chacune utilisable une fois.',
  },
  fille: {
    label: 'La Petite Fille', img: '/images/fille.png', color: '#F472B6',
    bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)', team: 'village',
    description: 'Tu peux entrouvrir les yeux pendant la nuit des loups. Sois discrete.',
  },
  voyante: {
    label: 'La Voyante', img: '/images/voyante.png', color: '#60A5FA',
    bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', team: 'village',
    description: 'Chaque nuit, tu peux decouvrir le role d\'un joueur.',
  },
  chasseur: {
    label: 'Le Chasseur', img: '/images/chasseur.png', color: '#84CC16',
    bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.3)', team: 'village',
    description: 'Quand tu meurs, tu peux emporter un joueur avec toi.',
  },
  garde: {
    label: 'Le Garde', img: '/images/protecteur.png', color: '#94A3B8',
    bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', team: 'village',
    description: 'Chaque nuit, tu proteges un joueur. Pas deux fois la meme personne.',
  },
  bouc: {
    label: 'Le Bouc Emissaire', img: '/images/bouc.png', color: '#78716C',
    bg: 'rgba(120,113,108,0.1)', border: 'rgba(120,113,108,0.3)', team: 'village',
    description: 'En cas d\'egalite au vote, c\'est toi qui meurs.',
  },
  corbeau: {
    label: 'Le Corbeau', img: '/images/corbeau.png', color: '#6D28D9',
    bg: 'rgba(109,40,217,0.1)', border: 'rgba(109,40,217,0.3)', team: 'neutre',
    description: 'Chaque nuit tu designes un joueur qui commence avec +2 voix contre lui.',
  },
  fouVillage: {
    label: 'Fou du Village', img: '/images/fou-du-village.png', color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', team: 'solo',
    description: 'Tu gagnes si tu te fais eliminer par le village. Tu joues seul contre tous.',
  },
}

const SPECIAL_ROLE_KEYS = ['cupidon', 'sorciere', 'fille', 'voyante', 'chasseur', 'garde', 'bouc', 'corbeau', 'fouVillage']

function getMaxWolves(count) {
  if (count <= 5) return 1
  if (count <= 8) return 2
  if (count <= 12) return 3
  return 4
}

function getMaxSpecial(count) {
  if (count <= 5) return 0
  if (count <= 7) return 2
  if (count <= 10) return 4
  return 6
}

function assignWerewolfRoles(pseudos, config) {
  const shuffled = [...pseudos].sort(() => Math.random() - 0.5)
  let available = shuffled.map((_, i) => i)
  let assigned = shuffled.map(pseudo => ({
    pseudo, role: 'villageois', eliminated: false, protected: false, corbeauVotes: 0,
  }))

  if (config.hasAlpha && available.length > 0) {
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
    assigned[idx].role = 'alpha'
  }

  const normalWolves = config.wolfCount - (config.hasAlpha ? 1 : 0)
  for (let i = 0; i < normalWolves && available.length > 0; i++) {
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
    assigned[idx].role = 'loup'
  }

  config.roles.forEach(roleKey => {
    if (available.length > 0) {
      const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
      assigned[idx].role = roleKey
    }
  })

  return assigned
}

function buildNightOrder(players, config) {
  const order = []
  const roles = players.filter(p => !p.eliminated).map(p => p.role)
  if (roles.includes('cupidon') && config.isFirstNight) order.push('cupidon')
  if (roles.includes('loup') || roles.includes('alpha')) order.push('loups')
  if (roles.includes('sorciere')) order.push('sorciere')
  if (roles.includes('voyante')) order.push('voyante')
  if (roles.includes('fille')) order.push('fille')
  if (roles.includes('garde')) order.push('garde')
  if (roles.includes('corbeau')) order.push('corbeau')
  return order
}

function checkWinCondition(players) {
  const alive = players.filter(p => !p.eliminated)
  const wolves = alive.filter(p => p.role === 'loup' || p.role === 'alpha')
  const villagers = alive.filter(p => p.role !== 'loup' && p.role !== 'alpha' && p.role !== 'fouVillage')
  if (wolves.length === 0) return 'village'
  if (wolves.length >= villagers.length) return 'loups'
  return null
}

const BgDeco = () => (
  <>
    <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '40vw', height: '40vw', maxWidth: '400px', maxHeight: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '35vw', height: '35vw', maxWidth: '350px', maxHeight: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(168,85,247,0.025) 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #7C3AED, #DC2626, #7C3AED, transparent)' }} />
    <div style={{ position: 'absolute', bottom: '5%', right: '5%', opacity: 0.06, pointerEvents: 'none' }}>
      <img src="/images/loup.png" alt="" style={{ width: 'clamp(80px, 15vw, 160px)', filter: 'grayscale(1)' }} />
    </div>
  </>
)

export default function WerewolfGame() {
  const navigate = useNavigate()
  const [step, setStep] = useState('setup')
  const [playerCount, setPlayerCount] = useState(6)
  const [config, setConfig] = useState({ wolfCount: 2, hasAlpha: false, roles: [] })
  const [pseudos, setPseudos] = useState([])
  const [currentPseudo, setCurrentPseudo] = useState('')
  const [players, setPlayers] = useState([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [roleVisible, setRoleVisible] = useState(false)
  const [nightPhase, setNightPhase] = useState(0)
  const [nightActions, setNightActions] = useState({})
  const [dayVote, setDayVote] = useState(null)
  const [tourNumber, setTourNumber] = useState(1)
  const [gameOver, setGameOver] = useState(null)
  const [notification, setNotification] = useState(null)
  const [nightOrder, setNightOrder] = useState([])
  const [lastProtected, setLastProtected] = useState(null)
  const [witchUsedLife, setWitchUsedLife] = useState(false)
  const [witchUsedDeath, setWitchUsedDeath] = useState(false)
  const [nightVictim, setNightVictim] = useState(null)
  const [showWitchChoices, setShowWitchChoices] = useState(false)
  const [showHunterShot, setShowHunterShot] = useState(false)
  const [hunterTarget, setHunterTarget] = useState(null)
  const [eliminatedThisRound, setEliminatedThisRound] = useState(null)

  const maxWolves = getMaxWolves(playerCount)
  const maxSpecial = getMaxSpecial(playerCount)
  const totalRoles = config.wolfCount + config.roles.length
  const villagersCount = playerCount - totalRoles
  const compositionValid = villagersCount >= 2

  function notify(msg, color = '#A855F7') {
    setNotification({ msg, color })
    setTimeout(() => setNotification(null), 4000)
  }

  function toggleRole(key) {
    const current = config.roles
    if (current.includes(key)) {
      setConfig(c => ({ ...c, roles: c.roles.filter(r => r !== key) }))
    } else {
      if (current.length >= maxSpecial) return
      setConfig(c => ({ ...c, roles: [...c.roles, key] }))
    }
  }

  function addPseudo() {
    const t = currentPseudo.trim()
    if (!t) return
    if (pseudos.length >= playerCount) return
    if (pseudos.map(p => p.toLowerCase()).includes(t.toLowerCase())) {
      alert('Ce pseudo est deja pris')
      return
    }
    setPseudos(p => [...p, t])
    setCurrentPseudo('')
  }

  function startGame() {
    const assigned = assignWerewolfRoles(pseudos, config)
    setPlayers(assigned)
    setRevealIndex(0)
    setRoleVisible(false)
    setTourNumber(1)
    setStep('reveal')
  }

  function nextReveal() {
    if (revealIndex + 1 >= players.length) {
      const order = buildNightOrder(players, { ...config, isFirstNight: true })
      setNightOrder(order)
      setNightPhase(0)
      setStep('night')
    } else {
      setRevealIndex(i => i + 1)
      setRoleVisible(false)
    }
  }

  function nextNightPhase() {
    if (nightPhase + 1 >= nightOrder.length) {
      applyNightActions()
    } else {
      setNightPhase(i => i + 1)
    }
  }

  function applyNightActions() {
    let updated = players.map(p => ({ ...p }))
    let victim = nightActions.wolfVictim
    const protected_ = nightActions.gardeTarget

    if (victim && protected_ && victim === protected_) {
      victim = null
      notify('Le Garde a protege la victime des loups !', '#94A3B8')
    }

    if (nightActions.sorciereLife && victim) {
      victim = null
      notify('La Sorciere a utilise sa potion de vie !', '#8B5CF6')
    }

    if (nightActions.sorciereDeath) {
      const target = updated.find(p => p.pseudo === nightActions.sorciereDeath)
      if (target) {
        target.eliminated = true
        notify(`La Sorciere a empoisonne ${target.pseudo} !`, '#8B5CF6')
      }
    }

    let nightVictimPlayer = null
    if (victim) {
      const target = updated.find(p => p.pseudo === victim)
      if (target) {
        target.eliminated = true
        nightVictimPlayer = target
      }
    }

    if (nightActions.corbeauTarget) {
      const target = updated.find(p => p.pseudo === nightActions.corbeauTarget)
      if (target) target.corbeauVotes = (target.corbeauVotes || 0) + 2
    }

    setNightVictim(nightVictimPlayer)
    setPlayers(updated)
    setNightActions({})
    setLastProtected(nightActions.gardeTarget || null)

    const winner = checkWinCondition(updated)
    if (winner) {
      setGameOver({ winner, players: updated })
      setStep('gameover')
      return
    }

    setStep('day_announce')
  }

  function confirmDayElimination() {
    if (!dayVote) return
    const target = players.find(p => p.pseudo === dayVote)
    if (!target) return
    setEliminatedThisRound(target)

    if (target.role === 'chasseur') { setShowHunterShot(true); return }

    if (target.role === 'fouVillage') {
      setGameOver({ winner: 'fouVillage', players, eliminatedPseudo: target.pseudo })
      setStep('gameover')
      return
    }

    applyDayElimination(target, players)
  }

  function applyDayElimination(target, currentPlayers) {
    const updated = currentPlayers.map(p => p.pseudo === target.pseudo ? { ...p, eliminated: true } : p)
    setPlayers(updated)
    setDayVote(null)
    setEliminatedThisRound(null)
    setShowHunterShot(false)
    setHunterTarget(null)

    const winner = checkWinCondition(updated)
    if (winner) {
      setGameOver({ winner, players: updated })
      setStep('gameover')
      return
    }

    const order = buildNightOrder(updated, { ...config, isFirstNight: false })
    setNightOrder(order)
    setNightPhase(0)
    setNightActions({})
    setNightVictim(null)
    setTourNumber(t => t + 1)
    setStep('night')
  }

  function applyHunterShot() {
    if (!hunterTarget) return
    const updatedWithHunter = players.map(p =>
      p.pseudo === eliminatedThisRound.pseudo ? { ...p, eliminated: true } : p
    )
    const updatedWithShot = updatedWithHunter.map(p =>
      p.pseudo === hunterTarget ? { ...p, eliminated: true } : p
    )
    notify(`Le Chasseur emporte ${hunterTarget} avec lui !`, '#84CC16')
    setPlayers(updatedWithShot)
    setShowHunterShot(false)
    setHunterTarget(null)
    setEliminatedThisRound(null)
    setDayVote(null)

    const winner = checkWinCondition(updatedWithShot)
    if (winner) {
      setGameOver({ winner, players: updatedWithShot })
      setStep('gameover')
      return
    }

    const order = buildNightOrder(updatedWithShot, { ...config, isFirstNight: false })
    setNightOrder(order)
    setNightPhase(0)
    setNightActions({})
    setNightVictim(null)
    setTourNumber(t => t + 1)
    setStep('night')
  }

  const currentPlayer = players[revealIndex]
  const currentNightStep = nightOrder[nightPhase]
  const alivePlayers = players.filter(p => !p.eliminated)
  const aliveWolves = players.filter(p => !p.eliminated && (p.role === 'loup' || p.role === 'alpha'))

  return (
    <div style={THEME.page}>
      <BgDeco />

      {notification && (
        <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', top: '20px', left: '50%', background: 'rgba(8,6,15,0.96)', border: `1px solid ${notification.color}`, borderRadius: '12px', padding: '12px 20px', color: notification.color, fontWeight: '700', fontSize: '14px', zIndex: 100, maxWidth: '360px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          {notification.msg}
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <button onClick={() => navigate('/')} style={THEME.back}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Retour
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
              <img src="/images/loup-home.png" alt="Loup-Garou" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
              <div>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.02em' }}>Loup-Garou</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Le village contre les loups — Mode Soiree</p>
              </div>
            </div>

            <div style={THEME.card}>
              <label style={THEME.label}>Nombre de joueurs</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                <button onClick={() => setPlayerCount(p => Math.max(6, p - 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer', fontSize: '20px', color: '#FFF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: '40px', fontWeight: '900', color: '#FFF8F0', minWidth: '56px', textAlign: 'center', letterSpacing: '-0.04em' }}>{playerCount}</span>
                <button onClick={() => setPlayerCount(p => Math.min(20, p + 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer', fontSize: '20px', color: '#FFF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
                  {Array.from({ length: Math.min(playerCount, 20) }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', background: i < playerCount ? '#7C3AED' : 'rgba(255,255,255,0.06)', transition: 'background 0.2s' }} />
                  ))}
                </div>
              </div>

              <div style={THEME.divider} />

              <label style={THEME.label}>Loups-Garous — max {maxWolves}</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {Array.from({ length: maxWolves }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setConfig(c => ({ ...c, wolfCount: n }))}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1.5px solid ${config.wolfCount === n ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`, background: config.wolfCount === n ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)', color: config.wolfCount === n ? '#EF4444' : 'rgba(255,248,240,0.4)', fontWeight: '800', fontSize: '18px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {n}
                  </button>
                ))}
              </div>

              <button onClick={() => setConfig(c => ({ ...c, hasAlpha: !c.hasAlpha }))}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: `1.5px solid ${config.hasAlpha ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.07)'}`, background: config.hasAlpha ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '4px', transition: 'all 0.15s' }}>
                <img src="/images/alpha.png" alt="alpha" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: config.hasAlpha ? '#DC2626' : 'rgba(255,248,240,0.6)' }}>Loup Alpha</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.3)', marginTop: '2px' }}>Remplace un loup normal — peut transformer un villageois</div>
                </div>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `1.5px solid ${config.hasAlpha ? '#DC2626' : 'rgba(255,255,255,0.15)'}`, background: config.hasAlpha ? '#DC2626' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {config.hasAlpha && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </button>

              <div style={THEME.divider} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ ...THEME.label, marginBottom: 0 }}>Roles speciaux</label>
                <span style={{ fontSize: '11px', color: maxSpecial === 0 ? 'rgba(239,68,68,0.6)' : 'rgba(168,85,247,0.6)', fontWeight: '600' }}>
                  {maxSpecial === 0 ? 'Min. 6 joueurs' : `${config.roles.length}/${maxSpecial}`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', opacity: maxSpecial === 0 ? 0.4 : 1 }}>
                {SPECIAL_ROLE_KEYS.map(key => {
                  const role = ROLES_BASE[key]
                  const active = config.roles.includes(key)
                  const canAdd = active || (config.roles.length < maxSpecial && villagersCount - 1 >= 2)
                  return (
                    <button key={key} onClick={() => canAdd && toggleRole(key)} disabled={!canAdd && !active}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', border: `1.5px solid ${active ? role.border : 'rgba(255,255,255,0.06)'}`, background: active ? role.bg : 'rgba(255,255,255,0.02)', cursor: canAdd ? 'pointer' : 'not-allowed', opacity: canAdd ? 1 : 0.35, textAlign: 'left', transition: 'all 0.15s' }}>
                      <img src={role.img} alt={role.label} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: active ? role.color : 'rgba(255,248,240,0.6)' }}>{role.label}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,248,240,0.28)', marginTop: '1px', lineHeight: 1.4 }}>{role.description.slice(0, 65)}...</div>
                      </div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `1.5px solid ${active ? role.color : 'rgba(255,255,255,0.12)'}`, background: active ? role.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {active && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: compositionValid ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${compositionValid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: compositionValid ? '#22C55E' : '#EF4444', marginBottom: '6px' }}>
                  {compositionValid ? 'Composition valide' : 'Pas assez de villageois (min. 2)'}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={THEME.badge('#D97706', 'rgba(217,119,6,0.1)', 'rgba(217,119,6,0.3)')}>{villagersCount} Villageois</span>
                  <span style={THEME.badge('#EF4444', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.3)')}>{config.wolfCount} Loup{config.wolfCount > 1 ? 's' : ''}</span>
                  {config.hasAlpha && <span style={THEME.badge('#DC2626', 'rgba(220,38,38,0.1)', 'rgba(220,38,38,0.3)')}>1 Alpha</span>}
                  {config.roles.map(k => {
                    const r = ROLES_BASE[k]
                    return <span key={k} style={THEME.badge(r.color, r.bg, r.border)}>{r.label}</span>
                  })}
                </div>
              </div>

              <button onClick={() => setStep('pseudos')} disabled={!compositionValid}
                style={{ ...THEME.btn(), opacity: compositionValid ? 1 : 0.4, cursor: compositionValid ? 'pointer' : 'not-allowed' }}>
                Entrer les pseudos →
              </button>
            </div>
          </motion.div>
        )}

        {step === 'pseudos' && (
          <motion.div key="pseudos" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button onClick={() => setStep('setup')} style={THEME.back}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Retour
            </button>
            <div style={THEME.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF8F0' }}>Joueurs</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Entre les pseudos un par un</p>
                </div>
                <div>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: pseudos.length === playerCount ? '#22C55E' : '#FFF8F0', letterSpacing: '-0.04em' }}>{pseudos.length}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,248,240,0.25)' }}>/{playerCount}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {pseudos.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.1)' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(168,85,247,0.5)', fontWeight: '700', minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ fontSize: '14px', color: '#FFF8F0', fontWeight: '600', flex: 1 }}>{p}</span>
                    <button onClick={() => setPseudos(ps => ps.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', fontSize: '18px', lineHeight: 1 }}>×</button>
                  </motion.div>
                ))}
              </div>
              {pseudos.length < playerCount ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder={`Joueur ${pseudos.length + 1}...`}
                    value={currentPseudo} onChange={e => setCurrentPseudo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPseudo()}
                    style={THEME.input}
                    onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(168,85,247,0.2)'}
                  />
                  <button onClick={addPseudo}
                    style={{ padding: '13px 18px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', border: '1.5px solid rgba(168,85,247,0.3)', color: '#A855F7', fontWeight: '800', fontSize: '16px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>+</button>
                </div>
              ) : (
                <button onClick={startGame} style={{ ...THEME.btn(), marginTop: '8px' }}>Lancer la partie →</button>
              )}
            </div>
          </motion.div>
        )}

        {step === 'reveal' && currentPlayer && (
          <motion.div key={`reveal-${revealIndex}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,248,240,0.35)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tour de</p>
              <h2 style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em' }}>{currentPlayer.pseudo}</h2>
              <p style={{ color: 'rgba(255,248,240,0.2)', fontSize: '12px', marginTop: '4px' }}>{revealIndex + 1} sur {players.length}</p>
            </div>
            {!roleVisible ? (
              <motion.div whileTap={{ scale: 0.97 }} onClick={() => setRoleVisible(true)}
                style={{ width: '100%', minHeight: '220px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(168,85,247,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <path d="M3 3l18 18" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{ color: 'rgba(255,248,240,0.4)', fontSize: '15px', fontWeight: '600' }}>Appuie pour voir ton role</p>
                <p style={{ color: 'rgba(255,248,240,0.15)', fontSize: '12px' }}>Assure-toi d'etre seul a regarder</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                {(() => {
                  const baseRole = ROLES_BASE[currentPlayer.role]
                  if (!baseRole) return null
                  return (
                    <div style={{ ...THEME.card, textAlign: 'center', padding: '28px 24px', border: `1px solid ${baseRole.border}`, background: baseRole.bg }}>
                      <img src={baseRole.img} alt={baseRole.label} style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 16px' }} />
                      <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${baseRole.border}`, marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: baseRole.color }}>{baseRole.label}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.45)', lineHeight: '1.6', maxWidth: '280px', margin: '0 auto' }}>{baseRole.description}</p>
                    </div>
                  )
                })()}
                <button onClick={nextReveal} style={{ ...THEME.btn(), marginTop: '14px' }}>
                  {revealIndex + 1 >= players.length ? 'Commencer la nuit →' : 'Joueur suivant →'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 'night' && (
          <motion.div key={`night-${nightPhase}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#7C3AED' }}>Nuit {tourNumber}</span>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,248,240,0.4)' }}>{nightPhase + 1}/{nightOrder.length || 1}</span>
                </div>
              </div>
              <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '900', color: '#FFF8F0' }}>Le village s'endort...</h2>
              <p style={{ color: 'rgba(255,248,240,0.3)', fontSize: '13px', marginTop: '4px' }}>Le Master lit les instructions a voix haute</p>
            </div>

            <div style={THEME.card}>
              {currentNightStep === 'loups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/loup.png" alt="loups" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#EF4444' }}>Les Loups se reveillent</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Designez votre victime a voix basse</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.5)', padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', lineHeight: '1.6' }}>
                    Les loups ({aliveWolves.map(w => w.pseudo).join(', ')}) ouvrent les yeux et choisissent silencieusement une victime.
                  </p>
                  <label style={THEME.label}>Victime des loups</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alivePlayers.filter(p => p.role !== 'loup' && p.role !== 'alpha').map(p => (
                      <button key={p.pseudo} onClick={() => setNightActions(a => ({ ...a, wolfVictim: p.pseudo }))}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', background: nightActions.wolfVictim === p.pseudo ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${nightActions.wolfVictim === p.pseudo ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: nightActions.wolfVictim === p.pseudo ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: nightActions.wolfVictim === p.pseudo ? '#EF4444' : 'rgba(255,248,240,0.4)' }}>
                          {p.pseudo[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: nightActions.wolfVictim === p.pseudo ? '#FFF8F0' : 'rgba(255,248,240,0.6)', flex: 1 }}>{p.pseudo}</span>
                        {nightActions.wolfVictim === p.pseudo && <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                    ))}
                  </div>
                  <button onClick={nextNightPhase} disabled={!nightActions.wolfVictim}
                    style={{ ...THEME.btn('linear-gradient(135deg,#7F1D1D,#EF4444)'), opacity: nightActions.wolfVictim ? 1 : 0.4, cursor: nightActions.wolfVictim ? 'pointer' : 'not-allowed' }}>
                    Confirmer →
                  </button>
                </div>
              )}

              {currentNightStep === 'sorciere' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/sorciere.png" alt="sorciere" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#8B5CF6' }}>La Sorciere se reveille</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Montrez-lui la victime des loups</p>
                    </div>
                  </div>
                  {nightActions.wolfVictim && (
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.4)', marginBottom: '4px' }}>Victime cette nuit</p>
                      <p style={{ fontSize: '18px', fontWeight: '800', color: '#EF4444' }}>{nightActions.wolfVictim}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!witchUsedLife && nightActions.wolfVictim && (
                      <button onClick={() => { setNightActions(a => ({ ...a, sorciereLife: true })); setWitchUsedLife(true); notify('Potion de vie utilisee !', '#8B5CF6') }}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)', color: '#22C55E', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                        Potion de Vie
                      </button>
                    )}
                    {!witchUsedDeath && (
                      <button onClick={() => setShowWitchChoices(true)}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#EF4444', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                        Potion de Mort
                      </button>
                    )}
                  </div>
                  {showWitchChoices && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.4)', marginBottom: '4px' }}>Choisir une cible</p>
                      {alivePlayers.map(p => (
                        <button key={p.pseudo}
                          onClick={() => { setNightActions(a => ({ ...a, sorciereDeath: p.pseudo })); setWitchUsedDeath(true); setShowWitchChoices(false); notify(`Sorciere empoisonne ${p.pseudo} !`, '#8B5CF6') }}
                          style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(255,248,240,0.6)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left' }}>
                          {p.pseudo}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={nextNightPhase} style={THEME.btn()}>Passer →</button>
                </div>
              )}

              {currentNightStep === 'voyante' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/voyante.png" alt="voyante" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#60A5FA' }}>La Voyante se reveille</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Elle designe un joueur a inspecter</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alivePlayers.map(p => {
                      const baseRole = ROLES_BASE[p.role]
                      const isSelected = nightActions.voyanteTarget === p.pseudo
                      return (
                        <button key={p.pseudo} onClick={() => setNightActions(a => ({ ...a, voyanteTarget: p.pseudo }))}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: isSelected ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isSelected ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,248,240,0.7)', flex: 1 }}>{p.pseudo}</span>
                          {isSelected && (
                            <span style={{ fontSize: '12px', fontWeight: '700', color: baseRole?.color, padding: '2px 10px', borderRadius: '8px', background: baseRole?.bg, border: `1px solid ${baseRole?.border}` }}>
                              {baseRole?.label} {p.role === 'loup' || p.role === 'alpha' ? '🐺' : '✓'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={nextNightPhase} style={THEME.btn()}>Passer →</button>
                </div>
              )}

              {currentNightStep === 'garde' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/protecteur.png" alt="garde" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#94A3B8' }}>Le Garde se reveille</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Il designe un joueur a proteger</p>
                    </div>
                  </div>
                  {lastProtected && <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.3)', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>Ne peut pas re-proteger : <strong style={{ color: 'rgba(255,248,240,0.5)' }}>{lastProtected}</strong></p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alivePlayers.filter(p => p.pseudo !== lastProtected).map(p => (
                      <button key={p.pseudo} onClick={() => setNightActions(a => ({ ...a, gardeTarget: p.pseudo }))}
                        style={{ padding: '10px 14px', borderRadius: '10px', background: nightActions.gardeTarget === p.pseudo ? 'rgba(148,163,184,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${nightActions.gardeTarget === p.pseudo ? 'rgba(148,163,184,0.4)' : 'rgba(255,255,255,0.06)'}`, color: 'rgba(255,248,240,0.7)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all 0.15s' }}>
                        {p.pseudo}
                      </button>
                    ))}
                  </div>
                  <button onClick={nextNightPhase} disabled={!nightActions.gardeTarget}
                    style={{ ...THEME.btn(), opacity: nightActions.gardeTarget ? 1 : 0.4, cursor: nightActions.gardeTarget ? 'pointer' : 'not-allowed' }}>
                    Confirmer →
                  </button>
                </div>
              )}

              {currentNightStep === 'cupidon' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/cupidon.png" alt="cupidon" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#EC4899' }}>Cupidon se reveille</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Il designe les deux amoureux</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alivePlayers.map(p => {
                      const lovers = nightActions.cupidLovers || []
                      const isSelected = lovers.includes(p.pseudo)
                      return (
                        <button key={p.pseudo}
                          onClick={() => {
                            const current = nightActions.cupidLovers || []
                            if (isSelected) setNightActions(a => ({ ...a, cupidLovers: current.filter(l => l !== p.pseudo) }))
                            else if (current.length < 2) setNightActions(a => ({ ...a, cupidLovers: [...current, p.pseudo] }))
                          }}
                          style={{ padding: '10px 14px', borderRadius: '10px', background: isSelected ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isSelected ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.06)'}`, color: isSelected ? '#EC4899' : 'rgba(255,248,240,0.6)', fontWeight: isSelected ? '700' : '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all 0.15s' }}>
                          {p.pseudo} {isSelected ? '❤️' : ''}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={nextNightPhase} disabled={!nightActions.cupidLovers || nightActions.cupidLovers.length < 2}
                    style={{ ...THEME.btn('linear-gradient(135deg,#9D174D,#EC4899)'), opacity: nightActions.cupidLovers?.length === 2 ? 1 : 0.4, cursor: nightActions.cupidLovers?.length === 2 ? 'pointer' : 'not-allowed' }}>
                    Confirmer les amoureux →
                  </button>
                </div>
              )}

              {currentNightStep === 'corbeau' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/corbeau.png" alt="corbeau" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#6D28D9' }}>Le Corbeau se reveille</h3>
                      <p style={{ fontSize: '12px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Il designe sa cible (+2 voix demain)</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alivePlayers.map(p => (
                      <button key={p.pseudo} onClick={() => setNightActions(a => ({ ...a, corbeauTarget: p.pseudo }))}
                        style={{ padding: '10px 14px', borderRadius: '10px', background: nightActions.corbeauTarget === p.pseudo ? 'rgba(109,40,217,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${nightActions.corbeauTarget === p.pseudo ? 'rgba(109,40,217,0.4)' : 'rgba(255,255,255,0.06)'}`, color: 'rgba(255,248,240,0.6)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all 0.15s' }}>
                        {p.pseudo}
                      </button>
                    ))}
                  </div>
                  <button onClick={nextNightPhase} disabled={!nightActions.corbeauTarget}
                    style={{ ...THEME.btn(), opacity: nightActions.corbeauTarget ? 1 : 0.4, cursor: nightActions.corbeauTarget ? 'pointer' : 'not-allowed' }}>
                    Confirmer →
                  </button>
                </div>
              )}

              {currentNightStep === 'fille' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
                  <img src="/images/fille.png" alt="petite fille" style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F472B6' }}>La Petite Fille peut epier</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.4)', lineHeight: '1.6', padding: '10px 12px', borderRadius: '10px', background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.15)' }}>
                    La Petite Fille peut entrouvrir les yeux pendant que les loups choisissent. Si elle est repere, les loups peuvent la choisir.
                  </p>
                  <button onClick={nextNightPhase} style={THEME.btn('linear-gradient(135deg,#9D174D,#F472B6)')}>Continuer →</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'day_announce' && (
          <motion.div key="day_announce" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ padding: '5px 14px', borderRadius: '10px', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', display: 'inline-block', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#D97706' }}>Jour {tourNumber}</span>
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: '900', color: '#FFF8F0' }}>Le village se reveille</h2>
            </div>

            <div style={THEME.card}>
              {nightVictim ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={ROLES_BASE[nightVictim.role]?.img} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 12px', opacity: 0.7 }} />
                  <p style={{ fontSize: '14px', color: 'rgba(255,248,240,0.5)', marginBottom: '6px' }}>Cette nuit, les loups ont devore</p>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#EF4444', marginBottom: '8px' }}>{nightVictim.pseudo}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)' }}>Role : <span style={{ color: ROLES_BASE[nightVictim.role]?.color, fontWeight: '700' }}>{ROLES_BASE[nightVictim.role]?.label}</span></p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#22C55E', marginBottom: '8px' }}>Personne n'est mort !</p>
                  <p style={{ fontSize: '14px', color: 'rgba(255,248,240,0.35)' }}>Le village a ete protege cette nuit</p>
                </div>
              )}
            </div>

            <div style={THEME.card}>
              <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.4)', marginBottom: '14px', lineHeight: '1.6' }}>Les joueurs debattent et votent pour eliminer un suspect.</p>
              <label style={THEME.label}>Voter pour eliminer</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                {alivePlayers.map(p => {
                  const extraVotes = p.corbeauVotes || 0
                  return (
                    <button key={p.pseudo} onClick={() => setDayVote(dayVote === p.pseudo ? null : p.pseudo)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: dayVote === p.pseudo ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${dayVote === p.pseudo ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: dayVote === p.pseudo ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: dayVote === p.pseudo ? '#DC2626' : 'rgba(255,248,240,0.4)' }}>
                        {p.pseudo[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: dayVote === p.pseudo ? '#FFF8F0' : 'rgba(255,248,240,0.6)', flex: 1 }}>{p.pseudo}</span>
                      {extraVotes > 0 && <span style={{ fontSize: '11px', color: '#6D28D9', background: 'rgba(109,40,217,0.12)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(109,40,217,0.25)', fontWeight: '700' }}>+{extraVotes} voix</span>}
                      {dayVote === p.pseudo && <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  )
                })}
              </div>
              <button onClick={confirmDayElimination} disabled={!dayVote}
                style={{ ...THEME.btn(dayVote ? 'linear-gradient(135deg,#7F1D1D,#DC2626)' : 'rgba(255,255,255,0.04)', dayVote ? '#FFF8F0' : 'rgba(255,248,240,0.2)'), cursor: dayVote ? 'pointer' : 'not-allowed' }}>
                {dayVote ? `Eliminer ${dayVote}` : 'Selectionne un joueur'}
              </button>
            </div>

            {showHunterShot && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ ...THEME.card, maxWidth: '380px', border: '1px solid rgba(132,204,22,0.3)' }}>
                  <img src="/images/chasseur.png" alt="chasseur" style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFF8F0', marginBottom: '6px', textAlign: 'center' }}>Le Chasseur tire !</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '16px', textAlign: 'center', lineHeight: '1.6' }}>{eliminatedThisRound?.pseudo} etait le Chasseur. Choisissez sa cible.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                    {alivePlayers.filter(p => p.pseudo !== eliminatedThisRound?.pseudo).map(p => (
                      <button key={p.pseudo} onClick={() => setHunterTarget(p.pseudo)}
                        style={{ padding: '11px 14px', borderRadius: '10px', background: hunterTarget === p.pseudo ? 'rgba(132,204,22,0.1)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${hunterTarget === p.pseudo ? 'rgba(132,204,22,0.4)' : 'rgba(255,255,255,0.06)'}`, color: 'rgba(255,248,240,0.7)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all 0.15s' }}>
                        {p.pseudo}
                      </button>
                    ))}
                  </div>
                  <button onClick={applyHunterShot} disabled={!hunterTarget}
                    style={{ ...THEME.btn('linear-gradient(135deg,#365314,#84CC16)', '#FFF8F0'), opacity: hunterTarget ? 1 : 0.4, cursor: hunterTarget ? 'pointer' : 'not-allowed' }}>
                    Tirer sur {hunterTarget || '...'}
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'gameover' && gameOver && (
          <motion.div key="gameover" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', maxWidth: '440px' }}>
            <div style={{ ...THEME.card, border: '1px solid rgba(212,175,55,0.25)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                {gameOver.winner === 'village' && <img src="/images/villageaois.png" alt="" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />}
                {gameOver.winner === 'loups' && <img src="/images/alpha.png" alt="" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />}
                {gameOver.winner === 'fouVillage' && <img src="/images/fou-du-village.png" alt="" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />}
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: '900', color: '#FFF8F0', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {gameOver.winner === 'village' && 'Le Village gagne !'}
                {gameOver.winner === 'loups' && 'Les Loups gagnent !'}
                {gameOver.winner === 'fouVillage' && `${gameOver.eliminatedPseudo} gagne !`}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '20px' }}>
                {gameOver.winner === 'village' && 'Tous les loups ont ete elimines'}
                {gameOver.winner === 'loups' && 'Les loups ont pris le controle du village'}
                {gameOver.winner === 'fouVillage' && 'Le Fou du Village a gagne en se faisant eliminer'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px', textAlign: 'left' }}>
                {gameOver.players?.map(p => {
                  const ri = ROLES_BASE[p.role]
                  return (
                    <div key={p.pseudo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: ri?.bg || 'rgba(255,255,255,0.03)', border: `1px solid ${ri?.border || 'rgba(255,255,255,0.06)'}`, opacity: p.eliminated ? 0.45 : 1 }}>
                      {ri?.img && <img src={ri.img} alt={ri.label} style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />}
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFF8F0', flex: 1 }}>{p.pseudo}</span>
                      <span style={THEME.badge(ri?.color, ri?.bg, ri?.border)}>{ri?.label}</span>
                      {p.eliminated && <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '700' }}>Out</span>}
                    </div>
                  )
                })}
              </div>
              <button onClick={() => { setStep('setup'); setPlayers([]); setGameOver(null); setTourNumber(1); setWitchUsedLife(false); setWitchUsedDeath(false); setNightVictim(null); setLastProtected(null); setPseudos([]) }}
                style={THEME.btn()}>
                Rejouer →
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
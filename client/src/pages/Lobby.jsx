import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import socket from '../services/socket'
import { canAddRole, canAddUndercover, getMaxUndercover, getRoleComposition } from '../utils/gameRules'

const ROLE_INFO = {
  civilian: { label: 'Civil', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  undercover: { label: 'Undercover', color: '#DC143C', bg: 'rgba(220,20,60,0.12)', border: 'rgba(220,20,60,0.3)' },
  misterwhite: { label: 'Mister White', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.3)' },
  policier: { label: 'Policier', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
}

const DIFFICULTIES = [
  { key: 'easy', label: 'Facile' },
  { key: 'normal', label: 'Normal' },
  { key: 'hardcore', label: 'Chaos' },
]

const T = {
  page: { minHeight: '100vh', background: '#0A0A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,32px)', fontFamily: 'Inter,sans-serif', color: '#FFF8F0', position: 'relative', overflow: 'hidden' },
  shell: { width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: 'clamp(16px,3vw,24px)', width: '100%', boxSizing: 'border-box' },
  btn: (bg = 'linear-gradient(135deg,#8B0000,#DC143C)', color = '#FFF8F0') => ({ width: '100%', padding: '14px 16px', borderRadius: '12px', background: bg, color, fontWeight: '800', fontSize: '14px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }),
  ghost: { background: 'none', border: 'none', color: 'rgba(255,248,240,0.45)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700 },
  badge: (color, bg, border) => ({ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', color, background: bg, border: `1px solid ${border}`, fontWeight: 800 }),
}

function BgDeco() {
  return (
    <>
      <div style={{ position: 'absolute', top: '-22%', left: '-16%', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,20,60,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-22%', right: '-14%', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #D4AF37, #DC143C, #D4AF37, transparent)' }} />
    </>
  )
}

export default function Lobby() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [votes, setVotes] = useState({})
  const [voteTarget, setVoteTarget] = useState('')
  const [gameOver, setGameOver] = useState(null)
  const [misterWhiteGuess, setMisterWhiteGuess] = useState('')
  const [message, setMessage] = useState('')

  const players = room?.players || []
  const alivePlayers = players.filter(p => !p.eliminated)
  const isHost = room?.host === socket.id
  const config = room?.config || { undercoverCount: 1, hasMisterWhite: false, hasPolicier: false }
  const composition = getRoleComposition(players.length || 3, config)
  const maxUndercover = getMaxUndercover(players.length || 3)

  const voteSummary = useMemo(() => {
    return Object.values(votes).reduce((acc, pseudo) => {
      acc[pseudo] = (acc[pseudo] || 0) + 1
      return acc
    }, {})
  }, [votes])

  useEffect(() => {
    function handleRoomUpdated(nextRoom) {
      setRoom(nextRoom)
      setMessage('')
    }

    function handleRole(roleInfo) {
      setMyRole(roleInfo)
    }

    function handleGameStarted() {
      setVotes({})
      setVoteTarget('')
      setMessage('La partie commence. Ton role est affiche uniquement sur ton ecran.')
    }

    function handleVotesUpdated(nextVotes) {
      setVotes(nextVotes || {})
    }

    function handleGameOver(result) {
      setGameOver(result)
      setRoom(current => current ? { ...current, phase: 'gameover' } : current)
    }

    function handleMisterWhiteEliminated({ pseudo }) {
      setMessage(`${pseudo} est Mister White. Il doit deviner le mot civil.`)
    }

    function handleError(err) {
      setMessage(err?.message || 'Erreur de connexion a la partie.')
    }

    socket.emit('get_room', { code })
    socket.on('room_updated', handleRoomUpdated)
    socket.on('your_role', handleRole)
    socket.on('game_started', handleGameStarted)
    socket.on('votes_updated', handleVotesUpdated)
    socket.on('game_over', handleGameOver)
    socket.on('misterwhite_eliminated', handleMisterWhiteEliminated)
    socket.on('error', handleError)

    return () => {
      socket.off('room_updated', handleRoomUpdated)
      socket.off('your_role', handleRole)
      socket.off('game_started', handleGameStarted)
      socket.off('votes_updated', handleVotesUpdated)
      socket.off('game_over', handleGameOver)
      socket.off('misterwhite_eliminated', handleMisterWhiteEliminated)
      socket.off('error', handleError)
    }
  }, [code])

  function updateConfig(patch) {
    if (!room || !isHost) return
    socket.emit('update_config', { code, config: { ...config, ...patch } })
  }

  function updateDifficulty(difficulty) {
    if (!room || !isHost) return
    socket.emit('update_config', { code, difficulty })
  }

  function startGame() {
    if (!isHost || players.length < 3 || !composition.valid) return
    socket.emit('start_game', { code })
  }

  function castVote(pseudo) {
    setVoteTarget(pseudo)
    socket.emit('vote_cast', { code, targetPseudo: pseudo })
  }

  function confirmElimination(pseudo) {
    if (!isHost || !pseudo) return
    socket.emit('confirm_elimination', { code, targetPseudo: pseudo })
  }

  function submitMisterWhiteGuess() {
    if (!misterWhiteGuess.trim()) return
    socket.emit('misterwhite_guess', { code, guess: misterWhiteGuess })
    setMisterWhiteGuess('')
  }

  return (
    <div style={T.page}>
      <BgDeco />
      <div style={T.shell}>
        <button onClick={() => navigate('/')} style={{ ...T.ghost, width: 'fit-content', padding: 0 }}>Retour</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/images/ligne.png" alt="" style={{ width: '58px', height: '58px', objectFit: 'contain' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,248,240,0.35)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Partie en ligne</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px,7vw,42px)', lineHeight: 1, fontWeight: 900, letterSpacing: '-0.03em' }}>{code}</h1>
          </div>
          {isHost && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.12)', 'rgba(212,175,55,0.3)')}>Host</span>}
        </div>

        {message && (
          <div style={{ ...T.card, borderColor: 'rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: '13px', fontWeight: 700 }}>
            {message}
          </div>
        )}

        {!room && (
          <div style={T.card}>
            <p style={{ color: 'rgba(255,248,240,0.5)', margin: 0 }}>Connexion a la partie...</p>
          </div>
        )}

        {room && room.phase === 'lobby' && (
          <AnimatePresence mode="wait">
            <motion.div key="lobby" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={T.card}>
                <h2 style={{ margin: '0 0 14px', fontSize: '20px', fontWeight: 900 }}>Joueurs</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {players.map(player => (
                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: player.id === socket.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)', color: player.id === socket.id ? '#D4AF37' : 'rgba(255,248,240,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{player.pseudo[0]?.toUpperCase()}</div>
                      <span style={{ flex: 1, fontWeight: 700 }}>{player.pseudo}</span>
                      {player.id === room.host && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.1)', 'rgba(212,175,55,0.25)')}>Host</span>}
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <div style={T.card}>
                  <h2 style={{ margin: '0 0 14px', fontSize: '20px', fontWeight: 900 }}>Configuration</h2>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: 'rgba(255,248,240,0.35)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Difficulte</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {DIFFICULTIES.map(item => (
                        <button key={item.key} onClick={() => updateDifficulty(item.key)}
                          style={{ padding: '11px 8px', borderRadius: '10px', border: `1.5px solid ${room.difficulty === item.key ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`, background: room.difficulty === item.key ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)', color: room.difficulty === item.key ? '#D4AF37' : 'rgba(255,248,240,0.55)', fontWeight: 800, cursor: 'pointer' }}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: 'rgba(255,248,240,0.35)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Undercover</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Array.from({ length: maxUndercover }, (_, i) => i + 1).map(count => {
                        const allowed = canAddUndercover(players.length, config, count)
                        return (
                          <button key={count} onClick={() => allowed && updateConfig({ undercoverCount: count })}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${config.undercoverCount === count ? 'rgba(220,20,60,0.45)' : 'rgba(255,255,255,0.07)'}`, background: config.undercoverCount === count ? 'rgba(220,20,60,0.12)' : 'rgba(255,255,255,0.02)', color: config.undercoverCount === count ? '#DC143C' : 'rgba(255,248,240,0.55)', fontWeight: 900, opacity: allowed ? 1 : 0.35, cursor: allowed ? 'pointer' : 'not-allowed' }}>
                            {count}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { key: 'hasMisterWhite', label: 'Mister White', role: 'misterwhite' },
                      { key: 'hasPolicier', label: 'Policier', role: 'policier' },
                    ].map(item => {
                      const active = config[item.key]
                      const allowed = active || canAddRole(players.length, config, item.role)
                      return (
                        <button key={item.key} disabled={!allowed} onClick={() => allowed && updateConfig({ [item.key]: !active })}
                          style={{ padding: '12px', borderRadius: '10px', border: `1.5px solid ${active ? ROLE_INFO[item.role].border : 'rgba(255,255,255,0.07)'}`, background: active ? ROLE_INFO[item.role].bg : 'rgba(255,255,255,0.02)', color: active ? ROLE_INFO[item.role].color : 'rgba(255,248,240,0.55)', fontWeight: 800, opacity: allowed ? 1 : 0.35, cursor: allowed ? 'pointer' : 'not-allowed' }}>
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={T.badge('#22C55E', 'rgba(34,197,94,0.1)', 'rgba(34,197,94,0.3)')}>{composition.civils} civils</span>
                    <span style={T.badge('#DC143C', 'rgba(220,20,60,0.1)', 'rgba(220,20,60,0.3)')}>{composition.undercover} undercover</span>
                    {composition.misterwhite > 0 && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.1)', 'rgba(212,175,55,0.3)')}>Mister White</span>}
                    {composition.policier > 0 && <span style={T.badge('#60A5FA', 'rgba(96,165,250,0.1)', 'rgba(96,165,250,0.3)')}>Policier</span>}
                  </div>

                  <button onClick={startGame} disabled={players.length < 3 || !composition.valid}
                    style={{ ...T.btn(players.length >= 3 && composition.valid ? undefined : 'rgba(255,255,255,0.05)', players.length >= 3 && composition.valid ? '#FFF8F0' : 'rgba(255,248,240,0.25)'), cursor: players.length >= 3 && composition.valid ? 'pointer' : 'not-allowed' }}>
                    {players.length < 3 ? 'Minimum 3 joueurs' : 'Lancer la partie'}
                  </button>
                </div>
              )}

              {!isHost && (
                <div style={T.card}>
                  <p style={{ color: 'rgba(255,248,240,0.45)', margin: 0, lineHeight: 1.6 }}>En attente du lancement par le host. Partage le code a tes amis pour les faire rejoindre.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {room && room.phase !== 'lobby' && !gameOver && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ ...T.card, textAlign: 'center', borderColor: myRole ? ROLE_INFO[myRole.role]?.border : 'rgba(255,255,255,0.08)', background: myRole ? ROLE_INFO[myRole.role]?.bg : 'rgba(255,255,255,0.04)' }}>
              <div style={{ color: 'rgba(255,248,240,0.4)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>{myRole?.category || 'Ton role'}</div>
              {myRole?.word ? (
                <div style={{ fontSize: 'clamp(32px,10vw,50px)', fontWeight: 900, lineHeight: 1, marginBottom: '12px' }}>{myRole.word}</div>
              ) : (
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#D4AF37', marginBottom: '12px' }}>Aucun mot</div>
              )}
              {myRole && <span style={T.badge(ROLE_INFO[myRole.role]?.color, 'rgba(0,0,0,0.22)', ROLE_INFO[myRole.role]?.border)}>{ROLE_INFO[myRole.role]?.label}</span>}
              <p style={{ margin: '14px auto 0', maxWidth: '340px', color: 'rgba(255,248,240,0.42)', fontSize: '13px', lineHeight: 1.55 }}>Garde cet ecran pour toi. Quand tout le monde a son mot, lancez le debat dans l'ordre ci-dessous.</p>
            </div>

            <div style={T.card}>
              <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 900 }}>Ordre de parole</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {(room.speakOrder || alivePlayers).map((player, index) => (
                  <div key={player.id || player.pseudo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: index === 0 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${index === 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                    <span style={{ minWidth: '24px', color: index === 0 ? '#D4AF37' : 'rgba(255,248,240,0.25)', fontWeight: 900 }}>{index + 1}.</span>
                    <span style={{ flex: 1, fontWeight: 700 }}>{player.pseudo}</span>
                    {player.eliminated && <span style={T.badge('#DC143C', 'rgba(220,20,60,0.1)', 'rgba(220,20,60,0.3)')}>Out</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={T.card}>
              <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 900 }}>Vote</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                {alivePlayers.map(player => (
                  <button key={player.id} onClick={() => castVote(player.pseudo)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '10px', background: voteTarget === player.pseudo ? 'rgba(220,20,60,0.12)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${voteTarget === player.pseudo ? 'rgba(220,20,60,0.42)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', color: '#FFF8F0', textAlign: 'left', fontFamily: 'Inter,sans-serif' }}>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>{player.pseudo}</span>
                    {voteSummary[player.pseudo] > 0 && <span style={T.badge('#D4AF37', 'rgba(212,175,55,0.1)', 'rgba(212,175,55,0.25)')}>{voteSummary[player.pseudo]} vote{voteSummary[player.pseudo] > 1 ? 's' : ''}</span>}
                  </button>
                ))}
              </div>

              {isHost && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.keys(voteSummary).length === 0 && <p style={{ color: 'rgba(255,248,240,0.35)', fontSize: '13px', margin: 0 }}>Les votes apparaitront ici.</p>}
                  {Object.entries(voteSummary).map(([pseudo, count]) => (
                    <button key={pseudo} onClick={() => confirmElimination(pseudo)} style={T.btn('rgba(220,20,60,0.14)', '#FFF8F0')}>
                      Eliminer {pseudo} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message.includes('Mister White') && (
              <div style={{ ...T.card, borderColor: 'rgba(212,175,55,0.25)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 900 }}>Deviner le mot civil</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={misterWhiteGuess} onChange={e => setMisterWhiteGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitMisterWhiteGuess()} placeholder="Le mot..."
                    style={{ flex: 1, padding: '13px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', outline: 'none', fontFamily: 'Inter,sans-serif' }} />
                  <button onClick={submitMisterWhiteGuess} style={{ ...T.btn('rgba(212,175,55,0.12)', '#D4AF37'), width: 'auto' }}>OK</button>
                </div>
              </div>
            )}
          </div>
        )}

        {gameOver && (
          <div style={{ ...T.card, textAlign: 'center' }}>
            <img src={gameOver.winner === 'undercover' ? '/images/espion.png' : gameOver.winner === 'misterwhite' ? '/images/white.png' : '/images/policier.png'} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '12px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900 }}>
              {gameOver.winner === 'civilians' && 'Les Civils gagnent !'}
              {gameOver.winner === 'undercover' && 'Les Undercover gagnent !'}
              {gameOver.winner === 'misterwhite' && 'Mister White gagne !'}
            </h2>
            {gameOver.civilWord && <p style={{ color: 'rgba(255,248,240,0.45)', margin: '0 0 16px' }}>Mot civil : <strong style={{ color: '#D4AF37' }}>{gameOver.civilWord}</strong></p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', textAlign: 'left' }}>
              {gameOver.players?.map(player => {
                const info = ROLE_INFO[player.role] || ROLE_INFO.civilian
                return (
                  <div key={player.id || player.pseudo} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: info.bg, border: `1px solid ${info.border}`, opacity: player.eliminated ? 0.55 : 1 }}>
                    <span style={{ flex: 1, fontWeight: 700 }}>{player.pseudo}</span>
                    <span style={T.badge(info.color, 'rgba(0,0,0,0.18)', info.border)}>{info.label}</span>
                    {player.eliminated && <span style={T.badge('#DC143C', 'rgba(220,20,60,0.12)', 'rgba(220,20,60,0.3)')}>Out</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

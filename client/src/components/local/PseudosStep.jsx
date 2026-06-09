import { motion } from 'framer-motion'

const T = {
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(16px,3vw,24px)', width: '100%' },
  btn: (bg = 'linear-gradient(135deg,#8B0000,#DC143C)', color = '#FFF8F0') => ({ width: '100%', padding: '15px', borderRadius: '12px', background: bg, color, fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }),
  input: { width: '100%', padding: '13px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#FFF8F0', fontSize: '14px', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' },
}

export default function PseudosStep({ playerCount, pseudos, setPseudos, currentPseudo, setCurrentPseudo, onStart, onBack }) {

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

  return (
    <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,240,0.35)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'Inter,sans-serif', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Retour
      </button>
      <div style={T.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF8F0' }}>Joueurs</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginTop: '3px' }}>Entre les pseudos un par un</p>
          </div>
          <div>
            <span style={{ fontSize: '32px', fontWeight: '900', color: pseudos.length === playerCount ? '#22C55E' : '#FFF8F0' }}>{pseudos.length}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,248,240,0.25)' }}>/{playerCount}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {pseudos.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,248,240,0.25)', fontWeight: '700', minWidth: '20px' }}>{i + 1}.</span>
              <span style={{ fontSize: '14px', color: '#FFF8F0', fontWeight: '600', flex: 1 }}>{p}</span>
              <button onClick={() => setPseudos(ps => ps.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(220,20,60,0.5)', fontSize: '18px', lineHeight: 1 }}>×</button>
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
          <button onClick={onStart} style={{ ...T.btn(), marginTop: '8px' }}>Lancer la partie →</button>
        )}
      </div>
    </div>
  )
}
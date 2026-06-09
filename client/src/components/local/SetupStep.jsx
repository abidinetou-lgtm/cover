import { getMaxUndercover, canAddRole, canAddUndercover, getRoleComposition, SPECIAL_ROLES } from '../../utils/gameRules'

const DIFF = [
  { key: 'easy', label: 'Facile', desc: 'Mots evidents', color: '#22C55E', border: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.08)' },
  { key: 'normal', label: 'Normal', desc: 'Mots proches', color: '#D4AF37', border: 'rgba(212,175,55,0.4)', bg: 'rgba(212,175,55,0.08)' },
  { key: 'hardcore', label: 'Chaos', desc: 'Quasi identiques', color: '#DC143C', border: 'rgba(220,20,60,0.4)', bg: 'rgba(220,20,60,0.08)' },
]

const ROLES_INFO = {
  misterwhite: { label: 'Mister White', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.3)', desc: 'Aucun mot — doit deviner' },
  policier: { label: 'Policier', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', desc: 'Connait les deux mots' },
}

const T = {
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(16px,3vw,24px)', width: '100%' },
  btn: (bg = 'linear-gradient(135deg,#8B0000,#DC143C)', color = '#FFF8F0') => ({ width: '100%', padding: '15px', borderRadius: '12px', background: bg, color, fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'opacity 0.2s' }),
  label: { fontSize: '11px', fontWeight: '700', color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '10px' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' },
  badge: (c, bg, b) => ({ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: bg, color: c, fontWeight: '700', border: `1px solid ${b}`, display: 'inline-block' }),
}

export default function SetupStep({ playerCount, setPlayerCount, difficulty, setDifficulty, config, setConfig, onNext, onBack }) {
  const maxUnder = getMaxUndercover(playerCount)
  const composition = getRoleComposition(playerCount, config)

  function toggleRole(key) {
    const roleKey = key === 'hasMisterWhite' ? 'misterwhite' : 'policier'
    if (!config[key] && !canAddRole(playerCount, config, roleKey)) return
    setConfig(c => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,248,240,0.35)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'Inter,sans-serif', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Retour
      </button>

      <div style={T.card}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF8F0', marginBottom: '4px' }}>Configuration</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,248,240,0.35)', marginBottom: '20px' }}>Mode Soiree</p>

        <label style={T.label}>Joueurs</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
          <button onClick={() => setPlayerCount(p => Math.max(3, p - 1))}
            style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '20px', color: '#FFF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: '40px', fontWeight: '900', color: '#FFF8F0', minWidth: '56px', textAlign: 'center' }}>{playerCount}</span>
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
            { key: 'hasMisterWhite', role: 'misterwhite' },
            { key: 'hasPolicier', role: 'policier' },
          ].map(({ key, role }) => {
            const active = config[key]
            const allowed = active || canAddRole(playerCount, config, role)
            const ri = ROLES_INFO[role]
            return (
              <button key={key} onClick={() => toggleRole(key)} disabled={!allowed}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: `1.5px solid ${active ? ri.border : 'rgba(255,255,255,0.07)'}`, background: active ? ri.bg : 'rgba(255,255,255,0.02)', cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.4, textAlign: 'left', transition: 'all 0.15s' }}>
                <img src={`/images/${role === 'misterwhite' ? 'white' : 'policier'}.png`} alt={ri.label}
                  style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: active ? ri.color : 'rgba(255,248,240,0.7)' }}>{ri.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.3)', marginTop: '2px' }}>{ri.desc}</div>
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
          <div style={{ display: 'flex' }}>
            {['/images/fou.png', '/images/deesse.png', '/images/mime.png'].map((img, i) => (
              <img key={i} src={img} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', marginLeft: i > 0 ? '-8px' : 0, border: '2px solid rgba(10,10,26,0.8)' }} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: config.hasSpecialRoles ? '#D4AF37' : 'rgba(255,248,240,0.6)', marginBottom: '2px' }}>Roles speciaux avances</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,248,240,0.3)', lineHeight: '1.4' }}>Distribues aleatoirement parmi les joueurs</div>
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

        <button onClick={onNext} disabled={!composition.valid}
          style={{ ...T.btn(), opacity: composition.valid ? 1 : 0.4, cursor: composition.valid ? 'pointer' : 'not-allowed' }}>
          Entrer les pseudos →
        </button>
      </div>
    </div>
  )
}
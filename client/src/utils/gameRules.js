export function getMaxUndercover(playerCount) {
  if (playerCount <= 4) return 1
  if (playerCount <= 6) return 2
  return 3
}

export function canAddRole(playerCount, config, roleToAdd) {
  const current = {
    undercover: config.undercoverCount,
    misterwhite: config.hasMisterWhite ? 1 : 0,
    policier: config.hasPolicier ? 1 : 0,
  }
  if (roleToAdd === 'misterwhite') current.misterwhite = 1
  if (roleToAdd === 'policier') current.policier = 1
  const civils = playerCount - current.undercover - current.misterwhite - current.policier
  return civils >= 2
}

export function canAddUndercover(playerCount, config, newCount) {
  const mw = config.hasMisterWhite ? 1 : 0
  const pol = config.hasPolicier ? 1 : 0
  const civils = playerCount - newCount - mw - pol
  return civils >= 2
}

export function getRoleComposition(playerCount, config) {
  const mw = config.hasMisterWhite ? 1 : 0
  const pol = config.hasPolicier ? 1 : 0
  const civils = playerCount - config.undercoverCount - mw - pol
  return {
    civils,
    undercover: config.undercoverCount,
    misterwhite: mw,
    policier: pol,
    valid: civils >= 2,
  }
}

export const SPECIAL_ROLES = {
  fou: {
    key: 'fou',
    label: 'Le Fou',
    public: false,
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    description: 'Si tu es elimine au premier tour, tu choisis quelqu\'un pour partir avec toi.',
    illustration: 'fou',
  },
  deesse: {
    key: 'deesse',
    label: 'La Deesse',
    public: true,
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FCD34D',
    description: 'En cas d\'egalite de votes, tu decides qui est elimine.',
    illustration: 'deesse',
  },
  mime: {
    key: 'mime',
    label: 'Le Mime',
    public: true,
    color: '#0F766E',
    bg: '#CCFBF1',
    border: '#5EEAD4',
    description: 'Tu ne peux pas parler. Tu dois mimer uniquement ce qui est en rapport avec ton mot.',
    illustration: 'mime',
  },
  vengeur: {
    key: 'vengeur',
    label: 'Le Vengeur',
    public: false,
    color: '#9F1239',
    bg: '#FFE4E6',
    border: '#FDA4AF',
    description: 'Si tu es elimine a la majorite, chaque joueur qui a vote contre toi perd son vote au prochain tour.',
    illustration: 'vengeur',
  },
  ange: {
    key: 'ange',
    label: 'L\'Ange',
    public: true,
    color: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#93C5FD',
    description: 'Une seule fois dans la partie, tu peux ressusciter un Civil innocent elimine par erreur.',
    illustration: 'ange',
  },
  espion: {
    key: 'espion',
    label: 'L\'Espion',
    public: false,
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    description: 'Tu connais le mot Undercover en plus du tien. Tu sais qui est l\'ennemi — a toi de choisir ton camp.',
    illustration: 'espion',
  },
  juge: {
    key: 'juge',
    label: 'Le Juge',
    public: true,
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
    description: 'Une fois par partie, tu peux annuler le vote en cours et forcer un nouveau round sans elimination.',
    illustration: 'juge',
  },
}

export function assignSpecialRoles(players, specialRolesEnabled) {
  if (!specialRolesEnabled || players.length < 4) return players
  const eligible = players.filter(p => !p.eliminated)
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  const roleKeys = Object.keys(SPECIAL_ROLES)
  const maxSpecial = Math.min(Math.floor(players.length / 2), roleKeys.length)
  const count = Math.floor(Math.random() * Math.min(3, maxSpecial)) + 1
  const picked = roleKeys.sort(() => Math.random() - 0.5).slice(0, count)
  const updated = players.map(p => ({ ...p }))
  picked.forEach((roleKey, i) => {
    if (shuffled[i]) {
      const player = updated.find(p => p.pseudo === shuffled[i].pseudo)
      if (player) player.specialRole = roleKey
    }
  })
  return updated
}
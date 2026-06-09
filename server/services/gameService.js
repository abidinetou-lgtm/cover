const { getRandomWord } = require('./wordService')

function assignRoles(players, config, difficulty) {
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const pair = getRandomWord(difficulty)
  let assigned = shuffled.map(p => ({
    ...p,
    role: 'civilian',
    word: pair.civilian,
    category: pair.category,
    eliminated: false,
  }))
  let available = assigned.map((_, i) => i)
  if (config.hasPolicier && available.length > 0) {
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0]
    assigned[idx].role = 'policier'
    assigned[idx].word = `${pair.civilian} / ${pair.undercover}`
    assigned[idx].sideInfo = 'Tu defends les Civils'
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
  return assigned
}

module.exports = { assignRoles }
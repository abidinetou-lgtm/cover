const rooms = new Map()

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  if (rooms.has(code)) return generateCode()
  return code
}

function createRoom(hostId, pseudo, mode) {
  const code = generateCode()
  rooms.set(code, {
    code,
    mode,
    host: hostId,
    players: [{ id: hostId, pseudo, ready: false }],
    phase: 'lobby',
    config: { undercoverCount: 1, hasMisterWhite: false, hasPolicier: false },
    difficulty: 'normal',
    votes: {},
  })
  return code
}

function joinRoom(code, playerId, pseudo) {
  const normalizedCode = code?.trim().toUpperCase()
  const room = rooms.get(normalizedCode)
  if (!room) return null
  const exists = room.players.find(p => p.id === playerId)
  if (!exists) {
    room.players.push({ id: playerId, pseudo, ready: false })
  }
  return room
}

function getRoom(code) {
  return rooms.get(code?.trim().toUpperCase())
}

function removePlayer(code, playerId) {
  const room = rooms.get(code)
  if (!room) return
  room.players = room.players.filter(p => p.id !== playerId)
  if (room.players.length === 0) rooms.delete(code)
  return room
}

function findRoomByPlayer(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) return room
  }
  return null
}

module.exports = { createRoom, joinRoom, getRoom, removePlayer, findRoomByPlayer }

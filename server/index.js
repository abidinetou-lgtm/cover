const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { createRoom, joinRoom, getRoom, removePlayer, findRoomByPlayer } = require('./utils/roomManager')
const { assignRoles } = require('./services/gameService')

const app = express()
app.use(cors())
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('Connecte :', socket.id)

  socket.on('create_room', ({ pseudo, mode }) => {
    try {
      const code = createRoom(socket.id, pseudo, mode)
      socket.join(code)
      socket.emit('room_created', { code })
      emitRoom(code)
      console.log('Room creee :', code, 'par', pseudo)
    } catch (err) {
      console.error('Erreur create_room:', err)
      socket.emit('error', { message: 'Erreur creation room' })
    }
  })

  socket.on('join_room', ({ code, pseudo }) => {
    try {
      const room = joinRoom(code, socket.id, pseudo)
      if (!room) {
        socket.emit('error', { message: 'Room introuvable — verifie le code' })
        return
      }
      socket.join(code)
      socket.emit('room_joined', { code })
      emitRoom(code)
      console.log(pseudo, 'a rejoint la room', code)
    } catch (err) {
      console.error('Erreur join_room:', err)
      socket.emit('error', { message: 'Erreur connexion room' })
    }
  })

  socket.on('get_room', ({ code }) => {
    const room = getRoom(code)
    if (room) socket.emit('room_updated', sanitizeRoom(room))
  })

  socket.on('update_config', ({ code, config, difficulty }) => {
    const room = getRoom(code)
    if (!room || room.host !== socket.id) return
    if (config) room.config = config
    if (difficulty) room.difficulty = difficulty
    emitRoom(code)
  })

  socket.on('start_game', ({ code }) => {
    const room = getRoom(code)
    if (!room || room.host !== socket.id) return
    try {
      const players = assignRoles(
        room.players,
        room.config || { undercoverCount: 1, hasMisterWhite: false, hasPolicier: false },
        room.difficulty || 'normal'
      )
      room.players = players
      room.speakOrder = buildSpeakOrder(players)
      room.phase = 'speak'
      io.to(code).emit('game_started', { phase: 'speak', speakOrder: room.speakOrder })
      players.forEach(player => {
        io.to(player.id).emit('your_role', {
          role: player.role,
          word: player.word,
          category: player.category,
          sideInfo: player.sideInfo || null
        })
      })
      emitRoom(code)
    } catch (err) {
      console.error('Erreur start_game:', err)
    }
  })

  socket.on('vote_cast', ({ code, targetPseudo }) => {
    const room = getRoom(code)
    if (!room) return
    if (!room.votes) room.votes = {}
    room.votes[socket.id] = targetPseudo
    io.to(code).emit('votes_updated', room.votes)
  })

  socket.on('confirm_elimination', ({ code, targetPseudo }) => {
    const room = getRoom(code)
    if (!room || room.host !== socket.id) return
    const target = room.players.find(p => p.pseudo === targetPseudo)
    if (!target) return
    target.eliminated = true
    room.votes = {}

    const alive = room.players.filter(p => !p.eliminated)
    const undercoverAlive = alive.filter(p => p.role === 'undercover').length
    const civilAlive = alive.filter(p => p.role === 'civilian' || p.role === 'policier').length

    if (undercoverAlive === 0) {
      io.to(code).emit('game_over', {
        winner: 'civilians',
        players: room.players,
        civilWord: room.players.find(p => p.role === 'civilian')?.word
      })
      return
    }
    if (undercoverAlive >= civilAlive) {
      io.to(code).emit('game_over', {
        winner: 'undercover',
        players: room.players,
        civilWord: room.players.find(p => p.role === 'civilian')?.word
      })
      return
    }
    if (target.role === 'misterwhite') {
      io.to(code).emit('misterwhite_eliminated', { pseudo: target.pseudo })
      return
    }

    const order = buildSpeakOrder(room.players)
    room.speakOrder = order
    room.phase = 'speak'
    emitRoom(code)
    io.to(code).emit('phase_changed', { phase: 'speak', speakOrder: order })
  })

  socket.on('misterwhite_guess', ({ code, guess }) => {
    const room = getRoom(code)
    if (!room) return
    const civilWord = room.players.find(p => p.role === 'civilian')?.word?.toLowerCase().trim()
    if (guess.trim().toLowerCase() === civilWord) {
      io.to(code).emit('game_over', { winner: 'misterwhite', players: room.players, civilWord })
    } else {
      const mw = room.players.find(p => p.role === 'misterwhite' && !p.eliminated)
      if (mw) mw.eliminated = true
      const order = buildSpeakOrder(room.players)
      room.speakOrder = order
      room.phase = 'speak'
      emitRoom(code)
      io.to(code).emit('phase_changed', { phase: 'speak', speakOrder: order })
    }
  })

  socket.on('disconnect', () => {
    console.log('Deconnecte :', socket.id)
    const room = findRoomByPlayer(socket.id)
    if (!room) return
    const wasHost = room.host === socket.id
    const updated = removePlayer(room.code, socket.id)
    if (!updated) return
    if (updated.players.length > 0 && wasHost) {
      updated.host = updated.players[0].id
    }
    emitRoom(updated.code)
  })
})

function sanitizeRoom(room) {
  return {
    ...room,
    players: room.players.map(player => ({
      id: player.id,
      pseudo: player.pseudo,
      ready: player.ready,
      eliminated: Boolean(player.eliminated),
    })),
    speakOrder: room.speakOrder?.map(player => ({
      id: player.id,
      pseudo: player.pseudo,
      eliminated: Boolean(player.eliminated),
    })),
  }
}

function emitRoom(code) {
  const room = getRoom(code)
  if (room) io.to(room.code).emit('room_updated', sanitizeRoom(room))
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

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log('Serveur sur le port', PORT))

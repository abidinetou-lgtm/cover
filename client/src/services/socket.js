import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

socket.on('connect', () => {
  console.log('Socket connecte, id:', socket.id)
})

socket.on('connect_error', (err) => {
  console.error('Erreur socket:', err.message)
})

export default socket
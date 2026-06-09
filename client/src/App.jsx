import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import LocalGame from './pages/LocalGame'
import WerewolfGame from './pages/WerewolfGame'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/local" element={<LocalGame />} />
        <Route path="/werewolf" element={<WerewolfGame />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import FactionSelect from './pages/FactionSelect.jsx'
import Game from './pages/Game.jsx'
import { useGameStore } from './hooks/useGameStore.js'

function RequireAuth({ children }) {
  const player = useGameStore(s => s.player)
  if (!player) return <Navigate to="/" replace />
  return children
}

function RequireFaction({ children }) {
  const player = useGameStore(s => s.player)
  if (!player) return <Navigate to="/" replace />
  if (!player.faction) return <Navigate to="/faction" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/faction" element={<RequireAuth><FactionSelect /></RequireAuth>} />
      <Route path="/game" element={<RequireFaction><Game /></RequireFaction>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

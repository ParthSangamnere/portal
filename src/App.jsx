import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Room from './pages/Room'

export default function App() {
  return (
    <>
      <div className="bg-mesh" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </>
  )
}

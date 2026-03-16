import { EclusaScene } from './components/scene/EclusaScene'
import { HUD } from './components/hud/HUD'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <EclusaScene />
      <HUD />
    </div>
  )
}

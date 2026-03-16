import { useSimStore } from '../../store/simulation'

export function HUD() {
  const store = useSimStore()
  
  async function handleRun(dir: 'up' | 'dn') {
    if (store.isRunning || !store.runner) return
    store.setWaterLevel(dir === 'up' ? 0 : 1)
    store.setIsRunning(true)
    store.startOp()
    store.setStep(dir === 'up' ? 'Iniciando subida...' : 'Iniciando descida...')
    store.setProgress(0)
    try {
      await store.runner(dir)
    } finally {
      store.setIsRunning(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:10, fontFamily:"'Courier New', monospace" }}>
      {/* Title — top center */}
      <div style={{
        position:'absolute', top:18, left:'50%', transform:'translateX(-50%)',
        fontSize:'0.72rem', letterSpacing:'0.28em', color:'#3898c8',
        textTransform:'uppercase', whiteSpace:'nowrap',
        textShadow:'0 0 18px rgba(56,152,200,0.35)'
      }}>
        ECLUSA CRESTUMA-LEVER
      </div>

      {/* Bottom center — buttons or status */}
      <div style={{
        position:'absolute', bottom:22, left:'50%', transform:'translateX(-50%)',
        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
        pointerEvents:'all'
      }}>
        {store.isRunning ? (
          <div style={{
            background:'rgba(2,6,12,0.92)', border:'1px solid rgba(60,120,160,0.22)',
            color:'#3898c8', padding:'10px 28px', fontSize:'0.58rem',
            letterSpacing:'0.18em', textTransform:'uppercase', borderRadius:2,
            whiteSpace:'nowrap'
          }}>
            {store.stepText}
          </div>
        ) : (
          <div style={{ display:'flex', gap:10 }}>
            {(['up','dn'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => handleRun(dir)}
                disabled={store.isRunning}
                style={{
                  background:'rgba(2,6,12,0.92)',
                  border:'1px solid rgba(60,120,160,0.22)',
                  color:'#28d890',
                  fontFamily:"'Courier New', monospace",
                  fontSize:'0.68rem', letterSpacing:'0.18em',
                  textTransform:'uppercase', padding:'11px 30px',
                  cursor:'pointer', borderRadius:2,
                  boxShadow: dir === 'up' ? '0 0 14px rgba(40,216,144,0.25)' : undefined,
                  transition:'all 0.2s'
                }}
              >
                {dir === 'up' ? '↑ SUBIR' : '↓ DESCER'}
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(40,200,136,0.2);}50%{box-shadow:0 0 22px rgba(40,200,136,0.5);}}
      `}</style>
    </div>
  )
}

import gsap from 'gsap'
import { OA, VAG_CY, VAG_OY, DESNIVEL_REAL, COTA_JUS, LOW_Y, HIGH_Y, Z_JUS, Z_MON } from '../constants'
import type { Direction } from '../store/simulation'
import type { DownstreamGateHandle } from '../components/scene/DownstreamGate'
import type { UpstreamGateHandle } from '../components/scene/UpstreamGate'
import type { BoatHandle } from '../components/scene/Boat'

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function animateStore(from: number, to: number, durSec: number, onUpdate: (v: number) => void) {
  return new Promise<void>(res => {
    const obj = { value: from }
    gsap.to(obj, {
      value: to, duration: durSec, ease: 'none',
      onUpdate: () => onUpdate(obj.value),
      onComplete: () => res()
    })
  })
}

export interface SequenceRefs {
  downstream: React.RefObject<DownstreamGateHandle>
  upstream: React.RefObject<UpstreamGateHandle>
  boat: React.RefObject<BoatHandle>
}

export async function runSubida(refs: SequenceRefs, store: any) {
  // F1 — Open downstream gate
  store.setSemJus('yellow'); store.setSemMon('red')
  store.setStep('Activando mecanismo hidráulico...')
  store.setFase('Abertura Jusante')
  store.pushLog('[ HYD ] Cilindros de jusante pressurizados · 180 bar')
  store.setProgress(6)
  await refs.downstream.current!.open()
  store.setProgress(18); await sleep(400)

  // F2 — Boat enters from downstream
  store.setSemJus('green')
  store.setStep('Embarcação a entrar pela porta de jusante...')
  store.setFase('Entrada')
  store.setBst('Entrando')
  store.pushLog('[ NAV ] Embarcação a entrar · velocidade 1.5 nós')
  store.setProgress(24)
  await refs.boat.current!.moveTo(0)
  store.setProgress(36); await sleep(500)

  // F3 — Close downstream gate
  store.setSemJus('yellow')
  store.setStep('Fechando porta de jusante...')
  store.setFase('Isolamento')
  store.pushLog('[ HYD ] Batentes a encerrar · vedantes sob pressão')
  store.setProgress(42)
  await refs.downstream.current!.close()
  store.setProgress(50); await sleep(400)

  // F4 — Fill chamber
  store.setSemJus('red'); store.setSemMon('red')
  store.setStep(`Enchimento da câmara — Δh ${DESNIVEL_REAL.toFixed(0)}m...`)
  store.setFase('Enchimento')
  store.setBst('Na Câmara')
  store.pushLog('[ HYD ] Comportas de fundo abertas · caudal 450 m³/s')
  store.setProgress(54)
  await animateStore(0, 1, 5, v => store.setWaterLevel(v))
  store.setProgress(74); await sleep(500)
  store.pushLog(`[ HYD ] Nível equalizado · cota +${(COTA_JUS + DESNIVEL_REAL).toFixed(1)}m`)

  // F5 — Open upstream gate
  store.setSemMon('yellow')
  store.setStep('Vagão de montante a descer...')
  store.setFase('Abertura Montante')
  store.pushLog('[ WIN ] Guinchos elétricos activados · 120 kW')
  store.setProgress(78)
  await refs.upstream.current!.open()
  store.setProgress(86); await sleep(400)

  // F6 — Boat exits upstream
  store.setSemMon('green')
  store.setStep('Embarcação a sair para o reservatório...')
  store.setFase('Saída Montante')
  store.setBst('Saindo')
  store.pushLog('[ NAV ] Embarcação a sair · canal de montante livre')
  store.setProgress(90)
  await refs.boat.current!.moveTo(Z_MON - 11)
  store.setProgress(95); await sleep(400)

  // F7 — Close upstream gate
  store.setSemMon('yellow')
  store.setStep('Fechando porta de montante...')
  store.pushLog('[ WIN ] Vagão a subir · câmara a fechar')
  await refs.upstream.current!.close()
  store.setProgress(99); await sleep(300)

  await concluir(store, '↑ SUBIDA', 'Jusante → Montante · completado')
}

export async function runDescida(refs: SequenceRefs, store: any) {
  // F1 — Open upstream gate
  store.setSemMon('yellow'); store.setSemJus('red')
  store.setStep('Abrindo porta de montante...')
  store.setFase('Abertura Montante')
  store.pushLog('[ WIN ] Guinchos elétricos activados · 120 kW')
  store.setProgress(6)
  await refs.upstream.current!.open()
  store.setProgress(18); await sleep(400)

  // F2 — Boat enters from upstream
  store.setSemMon('green')
  store.setStep('Embarcação a entrar pela porta de montante...')
  store.setFase('Entrada')
  store.setBst('Entrando')
  store.pushLog('[ NAV ] Embarcação a entrar · velocidade 1.5 nós')
  store.setProgress(24)
  await refs.boat.current!.moveTo(0)
  store.setProgress(36); await sleep(500)

  // F3 — Close upstream gate
  store.setSemMon('yellow')
  store.setStep('Fechando porta de montante...')
  store.setFase('Isolamento')
  store.pushLog('[ WIN ] Vagão a subir · câmara isolada')
  store.setProgress(42)
  await refs.upstream.current!.close()
  store.setProgress(50); await sleep(400)

  // F4 — Drain chamber
  store.setSemJus('red'); store.setSemMon('red')
  store.setStep(`Esvaziamento da câmara — Δh ${DESNIVEL_REAL.toFixed(0)}m...`)
  store.setFase('Esvaziamento')
  store.setBst('Na Câmara')
  store.pushLog('[ HYD ] Comportas de fundo abertas · drenagem para jusante')
  store.setProgress(54)
  await animateStore(1, 0, 5, v => store.setWaterLevel(v))
  store.setProgress(74); await sleep(500)
  store.pushLog(`[ HYD ] Nível equalizado · cota +${COTA_JUS.toFixed(1)}m`)

  // F5 — Open downstream gate
  store.setSemJus('yellow')
  store.setStep('Abrindo porta de jusante...')
  store.setFase('Abertura Jusante')
  store.pushLog('[ HYD ] Cilindros de jusante pressurizados · 180 bar')
  store.setProgress(78)
  await refs.downstream.current!.open()
  store.setProgress(86); await sleep(400)

  // F6 — Boat exits downstream
  store.setSemJus('green')
  store.setStep('Embarcação a sair para o rio...')
  store.setFase('Saída Jusante')
  store.setBst('Saindo')
  store.pushLog('[ NAV ] Embarcação a sair · rio de jusante livre')
  store.setProgress(90)
  await refs.boat.current!.moveTo(Z_JUS + 11)
  store.setProgress(95); await sleep(400)

  // F7 — Close downstream gate
  store.setSemJus('yellow')
  store.setStep('Fechando porta de jusante...')
  store.pushLog('[ HYD ] Batentes a encerrar · vedantes sob pressão')
  await refs.downstream.current!.close()
  store.setProgress(99); await sleep(300)

  await concluir(store, '↓ DESCIDA', 'Montante → Jusante · completado')
}

async function concluir(store: any, titulo: string, subtitulo: string) {
  store.setSemJus('red'); store.setSemMon('red')
  store.setProgress(100)
  store.setStep('Eclusagem concluída!', true)
  store.setBst('Passou ✓')
  store.setFase('Concluído')
  store.pushLog(`[ SYS ] Op. concluída · Bom vento! ✓`)
  store.setIsRunning(false)
}

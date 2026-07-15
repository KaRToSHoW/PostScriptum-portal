// Звук уведомления через WebAudio — без ассета-файла, приятный двухнотный «дин-дон».
// Контекст создаётся и «разблокируется» по первому жесту пользователя (политика автоплея).

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try { ctx = new AC() } catch { return null }
  }
  return ctx
}

// Браузеры запускают AudioContext в состоянии suspended до жеста пользователя.
// Разблокируем один раз на первый клик/тач/клавишу — дальше звук играет из таймера опроса.
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ac = getCtx()
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, unlock, { once: false, passive: true })
  )
}

/** Короткий двухнотный сигнал (A5 → D6). Тихо и мягко гаснет. */
export function playNotificationSound() {
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  const now = ac.currentTime
  const notes = [{ f: 880, t: 0 }, { f: 1174.66, t: 0.12 }]   // A5, D6
  for (const { f, t } of notes) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    osc.connect(gain)
    gain.connect(ac.destination)
    const start = now + t
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
    osc.start(start)
    osc.stop(start + 0.4)
  }
}

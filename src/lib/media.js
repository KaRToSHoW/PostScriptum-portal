/*
  Захват камеры и микрофона для урока.
  Качество: камера 1280×720 при 30 к/с (раньше браузер по умолчанию отдавал 640×480),
  звук — с эхо- и шумоподавлением браузера (дополнительно RNNoise в конференции).
  Выбранные устройства запоминаются в браузере.
*/

const CAM_KEY = 'ps_cam_device'
const MIC_KEY = 'ps_mic_device'

export const AUDIO_PROCESSING = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }

function read(key) {
  try { return localStorage.getItem(key) || null } catch { return null }
}
function write(key, value) {
  try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key) } catch { /* приватный режим */ }
}

export const savedCamId = () => read(CAM_KEY)
export const savedMicId = () => read(MIC_KEY)
export const saveCamId  = id => write(CAM_KEY, id)
export const saveMicId  = id => write(MIC_KEY, id)

export function videoConstraints(deviceId) {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
    width:     { ideal: 1280 },
    height:    { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    aspectRatio: { ideal: 16 / 9 },
  }
}

export function audioConstraints(deviceId) {
  return { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), ...AUDIO_PROCESSING, channelCount: 1 }
}

/** Только камера; если сохранённое устройство пропало — любая доступная. */
export async function getCameraTrack(deviceId) {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: videoConstraints(deviceId) })
    return s.getVideoTracks()[0]
  } catch (e) {
    if (!deviceId) throw e
    const s = await navigator.mediaDevices.getUserMedia({ video: videoConstraints(null) })
    return s.getVideoTracks()[0]
  }
}

/** Только микрофон (как MediaStream — из него строится RNNoise). */
export async function getMicStream(deviceId) {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints(deviceId) })
  } catch (e) {
    if (!deviceId) throw e
    return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints(null) })
  }
}

/**
 * Камера и микрофон вместе. Если что-то занято или запрещено — берём что получится:
 * видео+звук → только звук → только видео. Возвращает { stream, error }.
 */
export async function getLessonMedia({ camId, micId, wantVideo = true, wantAudio = true } = {}) {
  const variants = []
  if (wantVideo && wantAudio) variants.push({ video: videoConstraints(camId), audio: audioConstraints(micId) })
  if (wantAudio) variants.push({ video: false, audio: audioConstraints(micId) })
  if (wantVideo) variants.push({ video: videoConstraints(camId), audio: false })
  // сохранённые устройства могли отключить — последняя попытка без deviceId
  variants.push({ video: wantVideo ? videoConstraints(null) : false, audio: wantAudio ? audioConstraints(null) : false })

  let lastError = null
  for (const c of variants) {
    if (!c.video && !c.audio) continue
    try {
      return { stream: await navigator.mediaDevices.getUserMedia(c), error: null }
    } catch (e) {
      lastError = e
    }
  }
  return { stream: null, error: lastError }
}

/** Понятное объяснение ошибки доступа к устройствам. */
export function mediaErrorText(err) {
  if (!err) return ''
  if (err.name === 'NotAllowedError') return 'Доступ к камере и микрофону запрещён. Разрешите его в настройках сайта (значок 🔒 в адресной строке).'
  if (err.name === 'NotFoundError') return 'Камера и микрофон не найдены. Проверьте, что они подключены.'
  if (err.name === 'NotReadableError') return 'Камера или микрофон заняты другой программой (Zoom, Teams, другой браузер).'
  return 'Не удалось получить доступ к камере и микрофону.'
}

/** Списки устройств (подписи появляются только после разрешения доступа). */
export async function listDevices() {
  try {
    const all = await navigator.mediaDevices.enumerateDevices()
    return {
      cams: all.filter(d => d.kind === 'videoinput' && d.deviceId),
      mics: all.filter(d => d.kind === 'audioinput' && d.deviceId),
      speakers: all.filter(d => d.kind === 'audiooutput' && d.deviceId),
    }
  } catch {
    return { cams: [], mics: [], speakers: [] }
  }
}

export function deviceLabel(d, i, kind) {
  return d.label || `${kind === 'cam' ? 'Камера' : 'Микрофон'} ${i + 1}`
}

/**
 * Индикатор громкости микрофона: вызывает onLevel(0..1) ~15 раз в секунду.
 * Возвращает функцию остановки.
 */
export function watchMicLevel(stream, onLevel) {
  const track = stream?.getAudioTracks?.()[0]
  if (!track) return () => {}
  let ctx
  try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { return () => {} }
  const src = ctx.createMediaStreamSource(new MediaStream([track]))
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  src.connect(analyser)
  const data = new Uint8Array(analyser.fftSize)
  const iv = setInterval(() => {
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (const v of data) { const x = (v - 128) / 128; sum += x * x }
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4))
  }, 66)
  return () => { clearInterval(iv); try { ctx.close() } catch { /* ignore */ } }
}

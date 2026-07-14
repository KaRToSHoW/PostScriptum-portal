import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor'
import rnnoiseWasmUrl     from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url'
import rnnoiseSimdWasmUrl from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url'
import rnnoiseWorkletUrl  from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url'

/**
 * Строит шумоподавленную аудиодорожку из потока микрофона через RNNoise (AudioWorklet + wasm).
 * Возвращает { track, context } либо null при любой ошибке — тогда используем сырой звук
 * (шумоподавление не критично, разрыв звонка недопустим).
 */
export async function createDenoisedTrack(micStream) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx || !micStream || micStream.getAudioTracks().length === 0) return null

    const context = new AudioCtx()
    if (context.state === 'suspended') { try { await context.resume() } catch { /* ignore */ } }

    const wasmBinary = await loadRnnoise({ url: rnnoiseWasmUrl, simdUrl: rnnoiseSimdWasmUrl })
    await context.audioWorklet.addModule(rnnoiseWorkletUrl)

    const source  = context.createMediaStreamSource(micStream)
    const rnnoise = new RnnoiseWorkletNode(context, { maxChannels: 1, wasmBinary })
    const dest    = context.createMediaStreamDestination()
    source.connect(rnnoise).connect(dest)

    const track = dest.stream.getAudioTracks()[0]
    if (!track) { try { context.close() } catch { /* ignore */ } return null }
    return { track, context }
  } catch (e) {
    console.warn('RNNoise недоступен — остаёмся на встроенном звуке:', e?.message || e)
    return null
  }
}

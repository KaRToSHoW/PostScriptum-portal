import { useState, useEffect, useRef } from 'react'
import CIcon from './CIcon'
import {
  getLessonMedia, getCameraTrack, getMicStream, listDevices, deviceLabel, mediaErrorText, watchMicLevel,
  savedCamId, savedMicId, saveCamId, saveMicId,
} from '../../lib/media'

/*
  Экран перед входом в урок (как в Meet/Zoom): предпросмотр камеры, уровень микрофона,
  выбор устройств, включить/выключить камеру и звук до входа.
  Нажатие «Войти» — ещё и жест пользователя, после которого браузер разрешает воспроизводить звук собеседников.
  onJoin({ stream, camOn, micOn, camId, micId }) — поток передаётся в комнату без повторного запроса доступа.
*/
export default function Lobby({ title, subtitle, userName, joining, joinError, onJoin, onBack }) {
  const [stream, setStream]   = useState(null)
  const [error, setError]     = useState(null)
  const [camOn, setCamOn]     = useState(true)
  const [micOn, setMicOn]     = useState(true)
  const [devices, setDevices] = useState({ cams: [], mics: [] })
  const [camId, setCamId]     = useState(savedCamId())
  const [micId, setMicId]     = useState(savedMicId())
  const [level, setLevel]     = useState(0)
  const streamRef = useRef(null)
  const handedOff = useRef(false)

  // первый запрос доступа
  useEffect(() => {
    let cancelled = false
    getLessonMedia({ camId, micId }).then(({ stream: s, error: e }) => {
      if (cancelled) { s?.getTracks().forEach(t => t.stop()); return }
      streamRef.current = s
      setStream(s)
      setError(e && !s ? mediaErrorText(e) : null)
      if (!s?.getVideoTracks().length) setCamOn(false)
      if (!s?.getAudioTracks().length) setMicOn(false)
      listDevices().then(setDevices)
    })
    const onDev = () => listDevices().then(setDevices)
    navigator.mediaDevices?.addEventListener?.('devicechange', onDev)
    return () => {
      cancelled = true
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDev)
      // если ушли со страницы, не войдя в урок, — освобождаем камеру
      if (!handedOff.current) streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // индикатор громкости
  useEffect(() => {
    if (!stream || !micOn) { setLevel(0); return }
    return watchMicLevel(stream, setLevel)
  }, [stream, micOn])

  function replaceInStream(kind, track) {
    const old = streamRef.current
    const keep = old ? old.getTracks().filter(t => t.kind !== kind) : []
    old?.getTracks().filter(t => t.kind === kind).forEach(t => t.stop())
    const next = new MediaStream([...keep, ...(track ? [track] : [])])
    streamRef.current = next
    setStream(next)
  }

  async function pickCam(id) {
    setCamId(id); saveCamId(id)
    try { replaceInStream('video', await getCameraTrack(id)); setCamOn(true) } catch (e) { setError(mediaErrorText(e)) }
  }

  async function pickMic(id) {
    setMicId(id); saveMicId(id)
    try { replaceInStream('audio', (await getMicStream(id)).getAudioTracks()[0]); setMicOn(true) } catch (e) { setError(mediaErrorText(e)) }
  }

  function toggleCam() {
    const t = stream?.getVideoTracks()[0]
    if (!t) { pickCam(camId); return }
    t.enabled = !camOn
    setCamOn(!camOn)
  }

  function toggleMic() {
    const t = stream?.getAudioTracks()[0]
    if (!t) { pickMic(micId); return }
    t.enabled = !micOn
    setMicOn(!micOn)
  }

  // onJoin возвращает true, если комната забрала поток; иначе (сервер не пустил) камера остаётся у лобби
  async function join() {
    handedOff.current = true
    const ok = await onJoin({ stream: streamRef.current, camOn, micOn, camId, micId })
    if (!ok) handedOff.current = false
  }

  const hasVideo = !!stream?.getVideoTracks().length
  const selectStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)',
    background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }
  const roundBtn = (on) => ({
    width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
    background: on ? 'rgba(255,255,255,.16)' : '#E5534B', color: '#fff', backdropFilter: 'blur(8px)',
  })

  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'clamp(12px, 4vw, 40px)' }}>
      <div className="ps-m-1col" style={{ width: '100%', maxWidth: 1080, display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', gap: 28, alignItems: 'center' }}>

        {/* предпросмотр */}
        <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 22, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #2A2550, #15122B)', boxShadow: '0 20px 60px rgba(0,0,0,.45)' }}>
          {hasVideo && (
            <video autoPlay playsInline muted
              ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', visibility: camOn ? 'visible' : 'hidden' }} />
          )}
          {(!hasVideo || !camOn) && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.7)', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: 20 }}>
              {stream === null && !error ? 'Подключаем камеру…' : hasVideo ? 'Камера выключена' : 'Камера недоступна'}
            </div>
          )}

          {/* уровень микрофона */}
          {micOn && stream?.getAudioTracks().length > 0 && (
            <div aria-hidden="true" style={{ position: 'absolute', left: 16, top: 16, display: 'flex', alignItems: 'flex-end', gap: 3, height: 22, padding: '4px 8px', borderRadius: 999, background: 'rgba(10,8,22,.55)' }}>
              {[0.15, 0.35, 0.55, 0.75, 0.9].map((th, i) => (
                <span key={i} style={{ width: 4, height: 6 + i * 3, borderRadius: 2, background: level > th ? '#7CE0A3' : 'rgba(255,255,255,.3)', transition: 'background .08s' }} />
              ))}
            </div>
          )}

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center', gap: 14 }}>
            <button type="button" onClick={toggleMic} style={roundBtn(micOn)} aria-pressed={!micOn} aria-label={micOn ? 'Выключить микрофон' : 'Включить микрофон'} title={micOn ? 'Выключить микрофон' : 'Включить микрофон'}>
              <CIcon name={micOn ? 'mic' : 'micOff'} size={22} />
            </button>
            <button type="button" onClick={toggleCam} style={roundBtn(camOn && hasVideo)} aria-pressed={!camOn} aria-label={camOn ? 'Выключить камеру' : 'Включить камеру'} title={camOn ? 'Выключить камеру' : 'Включить камеру'}>
              <CIcon name={camOn && hasVideo ? 'cam' : 'camOff'} size={22} />
            </button>
          </div>
          <span style={{ position: 'absolute', right: 16, bottom: 22, fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(10,8,22,.55)', padding: '4px 10px', borderRadius: 999 }}>{userName}</span>
        </div>

        {/* вход */}
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>готовы к уроку?</div>
            <h1 className="ps-display" style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: '6px 0 4px', color: '#fff' }}>{title || 'Урок'}</h1>
            {subtitle && <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{subtitle}</div>}
          </div>

          {(error || joinError) && (
            <div role="alert" style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(229,83,75,.16)', border: '1px solid rgba(229,83,75,.4)', fontSize: 13, lineHeight: 1.45 }}>
              {joinError || error}
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>
            Камера
            <select value={camId ?? ''} onChange={e => pickCam(e.target.value)} style={selectStyle} disabled={!devices.cams.length}>
              {!devices.cams.length && <option value="">Нет доступных камер</option>}
              {devices.cams.map((d, i) => <option key={d.deviceId} value={d.deviceId} style={{ color: '#000' }}>{deviceLabel(d, i, 'cam')}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>
            Микрофон
            <select value={micId ?? ''} onChange={e => pickMic(e.target.value)} style={selectStyle} disabled={!devices.mics.length}>
              {!devices.mics.length && <option value="">Нет доступных микрофонов</option>}
              {devices.mics.map((d, i) => <option key={d.deviceId} value={d.deviceId} style={{ color: '#000' }}>{deviceLabel(d, i, 'mic')}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="ps-btn ps-btn-primary" onClick={join} disabled={joining} style={{ flex: 1, justifyContent: 'center', padding: '14px 0', fontSize: 15 }}>
              {joining ? 'Подключаемся…' : 'Войти на урок'}
            </button>
            <button type="button" className="ps-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' }}>
              Назад
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
            Видео 720p. Если интернет слабый, качество снизится автоматически.
          </div>
        </div>
      </div>
    </div>
  )
}

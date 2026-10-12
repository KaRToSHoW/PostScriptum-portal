import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Room, RoomEvent, Track, DisconnectReason, ConnectionQuality,
  VideoPresets, ScreenSharePresets, AudioPresets,
} from 'livekit-client'
import CIcon, { SignalBars } from './CIcon'
import VideoTile from './VideoTile'
import Lobby from './Lobby'
import LessonMaterials from '../LessonMaterials'
import LessonHomework from './LessonHomework'
import { toast } from '../Toast'
import { confirmDialog } from '../ConfirmDialog'
import { useApp } from '../../context/AppContext'
import { conferenceApi } from '../../api/conference'
import { createDenoisedTrack } from '../../lib/noiseSuppression'
import { getCameraTrack, getMicStream, listDevices, deviceLabel, saveCamId, saveMicId } from '../../lib/media'
import { fmtTime, toZoned } from '../../lib/time'

const LANG_NAME = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

/*
  Качество видео.
  Камера: 720p / 30 к/с, до 1,7 Мбит/с, плюс два уменьшенных слоя (360p, 180p) — simulcast:
  каждому зрителю сервер отдаёт слой под размер плитки и его канал, поэтому слабый интернет
  одного ученика не портит картинку остальным.
  Экран: 1080p / 15 к/с с подсказкой «detail» — текст слайдов остаётся чётким.
  Звук: 48 кбит/с (вместо 24 у «речевого» пресета) — для урока языка важна разборчивость.
*/
const ROOM_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    videoEncoding: VideoPresets.h720.encoding,
    videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
    screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
    audioPreset: AudioPresets.music,
    dtx: true,
    red: true,
  },
}

const QUALITY_LEVEL = {
  [ConnectionQuality.Excellent]: 3,
  [ConnectionQuality.Good]: 2,
  [ConnectionQuality.Poor]: 1,
  [ConnectionQuality.Lost]: 0,
}

/** Синхронизирует набор дорожек в MediaStream, не пересоздавая его (иначе <video> мигает). */
function syncStream(stream, tracks) {
  const want = new Set(tracks)
  for (const t of stream.getTracks()) if (!want.has(t)) stream.removeTrack(t)
  for (const t of tracks) if (!stream.getTracks().includes(t)) stream.addTrack(t)
  return stream
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

/* ── Время урока: сколько прошло и сколько осталось (свой таймер, чтобы не перерисовывать видео) ── */
function LessonClock({ startAt, durMin }) {
  const [now, setNow] = useState(Date.now())
  const warned = useRef(false)
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])
  const endAt = startAt ? startAt + durMin * 60000 : 0
  useEffect(() => {
    if (startAt && !warned.current && now < endAt && endAt - now <= 5 * 60000 && now >= startAt) {
      warned.current = true
      toast('До конца урока 5 минут', 'info')
    }
  }, [now, startAt, endAt])

  if (!startAt) return null
  if (now < startAt) {
    return <span style={{ color: 'rgba(255,255,255,.7)' }}>начало в {fmtTime(startAt)}</span>
  }
  const el = Math.floor((now - startAt) / 1000)
  const mm = String(Math.floor(el / 60)).padStart(2, '0')
  const ss = String(el % 60).padStart(2, '0')
  const leftMin = Math.ceil((endAt - now) / 60000)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5A4E', boxShadow: '0 0 0 3px rgba(255,90,78,.25)' }} />
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>{mm}:{ss}</span>
      <span style={{ color: leftMin <= 5 ? '#F5C451' : 'rgba(255,255,255,.6)' }}>
        {leftMin > 0 ? `осталось ${leftMin} мин` : `+${-leftMin} мин сверх времени`}
      </span>
    </span>
  )
}

/* ── Кнопка нижней панели ── */
function CtrlButton({ icon, label, onClick, active = true, danger = false, accent = false, badge, pressed, wide }) {
  const bg = danger ? '#E5534B' : accent ? 'var(--orange)' : active ? 'rgba(255,255,255,.1)' : '#E5534B'
  return (
    <button
      type="button" onClick={onClick} title={label} aria-label={label} aria-pressed={pressed}
      className="ps-conf-btn"
      style={{
        position: 'relative', height: 48, minWidth: 48, padding: wide ? '0 18px' : 0, borderRadius: 999, border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0,
        background: bg, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'inherit', transition: 'background .15s, transform .1s',
      }}
    >
      <CIcon name={icon} size={20} />
      {wide && <span>{wide}</span>}
      {badge ? (
        <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 900, display: 'grid', placeItems: 'center', boxShadow: '0 0 0 2px #17142E' }}>
          {badge === true ? '' : badge}
        </span>
      ) : null}
    </button>
  )
}

/* ── Кнопка с выбором устройства (как в Meet: основная + стрелка) ── */
function DeviceButton({ kind, on, onToggle, devices, currentId, onPick, label }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState(null)   // координаты меню относительно окна
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    const onResize = () => setOpen(false)
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // Меню позиционируется от кнопки по окну (position: fixed): нижняя панель прокручивается
  // по горизонтали и обрезала бы выпадающий список, если бы он был внутри неё.
  function toggleMenu() {
    if (open) { setOpen(false); return }
    const r = ref.current.getBoundingClientRect()
    const width = Math.min(320, window.innerWidth - 16)
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), bottom: window.innerHeight - r.top + 10, width })
    setOpen(true)
  }
  const icon = kind === 'mic' ? (on ? 'mic' : 'micOff') : (on ? 'cam' : 'camOff')
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', borderRadius: 999, background: on ? 'rgba(255,255,255,.1)' : '#E5534B', flexShrink: 0 }}>
      <button type="button" onClick={onToggle} title={label} aria-label={label} aria-pressed={!on} className="ps-conf-btn"
        style={{ width: 48, height: 48, borderRadius: 999, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
        <CIcon name={icon} size={20} />
      </button>
      {devices.length > 0 && (
        <button type="button" onClick={toggleMenu} aria-label={kind === 'mic' ? 'Выбрать микрофон' : 'Выбрать камеру'} aria-expanded={open} className="ps-conf-btn"
          style={{ width: 28, height: 48, marginLeft: -6, borderRadius: 999, border: 'none', background: 'transparent', color: 'rgba(255,255,255,.75)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <CIcon name="chevUp" size={14} />
        </button>
      )}
      {open && pos && (
        <div role="menu" style={{ position: 'fixed', left: pos.left, bottom: pos.bottom, width: pos.width, maxHeight: '60vh', overflowY: 'auto', padding: 6, borderRadius: 14, background: '#25213F', boxShadow: '0 16px 40px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.1)', zIndex: 1000 }}>
          <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
            {kind === 'mic' ? 'Микрофон' : 'Камера'}
          </div>
          {devices.map((d, i) => (
            <button key={d.deviceId} type="button" role="menuitemradio" aria-checked={d.deviceId === currentId}
              onClick={() => { setOpen(false); onPick(d.deviceId) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, border: 'none', background: d.deviceId === currentId ? 'rgba(255,255,255,.08)' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span style={{ width: 16 }}>{d.deviceId === currentId && <CIcon name="check" size={15} />}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deviceLabel(d, i, kind)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConferenceRoom({ lessonId }) {
  const navigate = useNavigate()
  const { user } = useApp()

  const [phase, setPhase]         = useState('lobby')     // lobby | room | finished | disconnected
  const [dropReason, setDropReason] = useState(null)
  const [info, setInfo]           = useState(null)
  const [fatal, setFatal]         = useState(null)        // нет доступа к уроку
  const [joining, setJoining]     = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [me, setMe]               = useState(null)        // { userId, role, name }

  const [participants, setParticipants] = useState([])
  const [speaking, setSpeaking]   = useState(() => new Set())
  const [hands, setHands]         = useState({})          // identity -> true
  const [myHand, setMyHand]       = useState(false)
  const [quality, setQuality]     = useState(3)
  const [reconnecting, setReconnecting] = useState(false)
  const [needAudio, setNeedAudio] = useState(false)

  const [localStream, setLocalStream] = useState(null)
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const [noiseOn, setNoiseOn]     = useState(true)
  const [sharing, setSharing]     = useState(false)
  const [localShare, setLocalShare] = useState(null)
  const [devices, setDevices]     = useState({ cams: [], mics: [] })
  const [camId, setCamId]         = useState(null)
  const [micId, setMicId]         = useState(null)

  const [panel, setPanel]         = useState(() => (window.innerWidth >= 1200 ? 'chat' : null))
  const [chat, setChat]           = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unread, setUnread]       = useState(0)
  const [filesBadge, setFilesBadge] = useState(false)
  const [hwBadge, setHwBadge]     = useState(false)
  const [materialsKey, setMaterialsKey] = useState(0)
  const [swap, setSwap]           = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile]   = useState(() => window.matchMedia('(max-width: 900px)').matches)

  const roomRef        = useRef(null)
  const localStreamRef = useRef(null)
  const audioPubRef    = useRef(null)
  const videoPubRef    = useRef(null)
  const denoiseRef     = useRef(null)
  const streamsRef     = useRef({})
  const meRef          = useRef(null)
  const panelRef       = useRef(panel)
  const noiseOnRef     = useRef(true)
  const rootRef        = useRef(null)
  const chatEndRef     = useRef(null)
  const leavingRef     = useRef(false)

  useEffect(() => { panelRef.current = panel }, [panel])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat, panel])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const fn = e => setIsMobile(e.matches)
    mq.addEventListener('change', fn)
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => { mq.removeEventListener('change', fn); document.removeEventListener('fullscreenchange', onFs) }
  }, [])

  // информация об уроке (экран входа, участники, домашнее задание)
  useEffect(() => {
    conferenceApi.info(lessonId).then(setInfo).catch(e => setFatal(e.message || 'Нет доступа к уроку'))
  }, [lessonId])

  const reloadInfo = useCallback(() => {
    conferenceApi.info(lessonId).then(setInfo).catch(() => {})
  }, [lessonId])

  // выход со страницы — освобождаем камеру и комнату
  useEffect(() => () => {
    leavingRef.current = true
    roomRef.current?.disconnect()
    roomRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    try { denoiseRef.current?.context?.close() } catch { /* ignore */ }
  }, [])

  /** Пересобирает список удалённых участников и их потоков из состояния комнаты. */
  const refresh = useCallback(() => {
    const room = roomRef.current
    if (!room) return
    const list = []
    for (const p of room.remoteParticipants.values()) {
      const camTracks = []
      const screenTracks = []
      for (const pub of p.trackPublications.values()) {
        const mst = pub.track?.mediaStreamTrack
        if (!mst || !pub.isSubscribed) continue
        if (pub.source === Track.Source.ScreenShare || pub.source === Track.Source.ScreenShareAudio) screenTracks.push(mst)
        else camTracks.push(mst)   // камера и микрофон — в одну плитку, чтобы звук играл вместе с видео
      }
      const cached = streamsRef.current[p.identity] ?? { cam: new MediaStream(), screen: new MediaStream() }
      streamsRef.current[p.identity] = cached
      syncStream(cached.cam, camTracks)
      syncStream(cached.screen, screenTracks)
      const camPub = p.getTrackPublication(Track.Source.Camera)
      const micPub = p.getTrackPublication(Track.Source.Microphone)
      list.push({
        id: Number(p.identity),
        identity: p.identity,
        name: p.name || 'Участник',
        cam: cached.cam,
        screen: screenTracks.some(t => t.kind === 'video') ? cached.screen : null,
        camOff: !camPub || camPub.isMuted || !camPub.track,
        micOff: !micPub || micPub.isMuted,
      })
    }
    setParticipants(list)
  }, [])

  function publish(msg) {
    roomRef.current?.localParticipant
      .publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true })
      .catch(() => {})
  }

  function bindRoom(room) {
    room
      .on(RoomEvent.ParticipantConnected, p => { refresh(); toast(`${p.name || 'Участник'} подключился`, 'info') })
      .on(RoomEvent.ParticipantDisconnected, p => {
        setHands(h => { const n = { ...h }; delete n[p.identity]; return n })
        delete streamsRef.current[p.identity]
        refresh()
      })
      .on(RoomEvent.TrackSubscribed, refresh)
      .on(RoomEvent.TrackUnsubscribed, refresh)
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.TrackPublished, refresh)
      .on(RoomEvent.ActiveSpeakersChanged, speakers => setSpeaking(new Set(speakers.map(s => s.identity))))
      .on(RoomEvent.ConnectionQualityChanged, (q, p) => { if (p?.isLocal) setQuality(QUALITY_LEVEL[q] ?? 3) })
      .on(RoomEvent.Reconnecting, () => setReconnecting(true))
      .on(RoomEvent.Reconnected, () => setReconnecting(false))
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setNeedAudio(!room.canPlaybackAudio))
      .on(RoomEvent.MediaDevicesChanged, () => listDevices().then(setDevices))
      .on(RoomEvent.LocalTrackUnpublished, pub => {
        // «Остановить показ» в панели браузера
        if (pub.source === Track.Source.ScreenShare) { setSharing(false); setLocalShare(null) }
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        let msg
        try { msg = JSON.parse(new TextDecoder().decode(payload)) } catch { return }
        const name = participant?.name || 'Участник'
        if (msg.type === 'chat') {
          setChat(prev => [...prev, { from: Number(participant?.identity), name, text: String(msg.text).slice(0, 2000), ts: Date.now() }])
          if (panelRef.current !== 'chat') setUnread(n => n + 1)
        } else if (msg.type === 'hand') {
          setHands(h => ({ ...h, [participant?.identity]: !!msg.up }))
          if (msg.up) toast(`✋ ${name} поднимает руку`, 'info')
        } else if (msg.type === 'materials') {
          setMaterialsKey(k => k + 1)
          if (panelRef.current !== 'files') { setFilesBadge(true); toast(`${name}: новые материалы к уроку`, 'info') }
        } else if (msg.type === 'homework') {
          reloadInfo()
          if (panelRef.current !== 'hw') { setHwBadge(true); toast('Задано домашнее задание к уроку', 'info') }
        } else if (msg.type === 'finished') {
          setPhase('finished')
        }
      })
      .on(RoomEvent.Disconnected, reason => {
        if (leavingRef.current) return
        if (reason === DisconnectReason.ROOM_DELETED) { setPhase('finished'); return }
        if (reason === DisconnectReason.CLIENT_INITIATED) return
        // освобождаем камеру: урок продолжается в другом месте или соединение не восстановилось
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        setDropReason(reason === DisconnectReason.DUPLICATE_IDENTITY ? 'duplicate' : 'lost')
        setPhase('disconnected')
      })
  }

  /* ── вход из лобби ── */
  async function handleJoin({ stream, camOn: wantCam, micOn: wantMic, camId: cId, micId: mId }) {
    setJoining(true)
    setJoinError(null)
    let joined
    try {
      joined = await conferenceApi.join(lessonId)
    } catch (e) {
      setJoinError(e.message || 'Не удалось войти на урок')
      setJoining(false)
      return false
    }

    const room = new Room(ROOM_OPTIONS)
    roomRef.current = room
    bindRoom(room)
    try {
      await room.connect(joined.url, joined.token)
    } catch {
      room.disconnect()
      roomRef.current = null
      setJoinError('Не удалось подключиться к видеосерверу. Проверьте интернет и попробуйте ещё раз.')
      setJoining(false)
      return false
    }

    setMe(joined); meRef.current = joined
    setCamId(cId); setMicId(mId)
    localStreamRef.current = stream
    setLocalStream(stream)

    const video = stream?.getVideoTracks()[0] ?? null
    const rawAudio = stream?.getAudioTracks()[0] ?? null
    try {
      if (video) {
        video.enabled = true
        video.contentHint = 'motion'
        videoPubRef.current = await room.localParticipant.publishTrack(video, { source: Track.Source.Camera, simulcast: true })
        if (!wantCam) await videoPubRef.current.track.mute()
      }
      if (rawAudio) {
        rawAudio.enabled = true
        // собеседникам уходит шумоподавленный звук (RNNoise) или копия сырого микрофона
        let outgoing = rawAudio.clone()
        if (noiseOnRef.current) {
          const dn = await createDenoisedTrack(stream)
          if (dn) { denoiseRef.current = dn; outgoing = dn.track }
        }
        audioPubRef.current = await room.localParticipant.publishTrack(outgoing, { source: Track.Source.Microphone })
        if (!wantMic) await audioPubRef.current.track.mute()
      }
    } catch {
      toast('Не удалось передать камеру или микрофон — попробуйте переключить устройство', 'error')
    }
    setCamOn(!!video && wantCam)
    setMicOn(!!rawAudio && wantMic)
    if (!stream) toast('Камера и микрофон недоступны — вы будете видеть и слышать собеседников', 'warning')

    setNeedAudio(!room.canPlaybackAudio)
    listDevices().then(setDevices)
    setPhase('room')
    setJoining(false)
    refresh()
    return true
  }

  /* ── управление ── */
  async function toggleMic() {
    const track = audioPubRef.current?.track
    if (!track) { toast('Микрофон недоступен', 'error'); return }
    if (micOn) await track.mute(); else await track.unmute()
    setMicOn(!micOn)
  }

  async function toggleCam() {
    const pub = videoPubRef.current
    if (!pub?.track) {
      // камеры не было при входе — пробуем подключить
      await pickCam(camId)
      return
    }
    if (camOn) {
      await pub.track.mute()
      // гасим саму камеру, чтобы не горел индикатор
      pub.track.mediaStreamTrack.stop()
      setCamOn(false)
    } else {
      try {
        const t = await getCameraTrack(camId)
        await pub.track.replaceTrack(t, true)
        await pub.track.unmute()
        swapLocal('video', t)
        setCamOn(true)
      } catch {
        toast('Камера занята или недоступна', 'error')
      }
    }
  }

  /** Заменяет дорожку в локальном потоке (свой предпросмотр). */
  function swapLocal(kind, track) {
    const old = localStreamRef.current
    const keep = old ? old.getTracks().filter(t => t.kind !== kind) : []
    old?.getTracks().filter(t => t.kind === kind && t !== track).forEach(t => t.stop())
    const next = new MediaStream([...keep, track])
    localStreamRef.current = next
    setLocalStream(next)
  }

  async function pickCam(id) {
    const room = roomRef.current
    if (!room) return
    try {
      const t = await getCameraTrack(id)
      t.contentHint = 'motion'
      if (videoPubRef.current?.track) {
        await videoPubRef.current.track.replaceTrack(t, true)
        await videoPubRef.current.track.unmute()
      } else {
        videoPubRef.current = await room.localParticipant.publishTrack(t, { source: Track.Source.Camera, simulcast: true })
      }
      swapLocal('video', t)
      setCamOn(true)
      setCamId(id); saveCamId(id)
    } catch {
      toast('Не удалось переключить камеру', 'error')
    }
  }

  async function pickMic(id) {
    const pub = audioPubRef.current
    try {
      const s = await getMicStream(id)
      const raw = s.getAudioTracks()[0]
      let target = raw.clone()
      if (noiseOnRef.current) {
        try { denoiseRef.current?.context?.close() } catch { /* ignore */ }
        const dn = await createDenoisedTrack(s)
        if (dn) { denoiseRef.current = dn; target = dn.track }
      }
      if (pub?.track) {
        await pub.track.replaceTrack(target, true)
        if (!micOn) await pub.track.mute()
      } else if (roomRef.current) {
        audioPubRef.current = await roomRef.current.localParticipant.publishTrack(target, { source: Track.Source.Microphone })
        setMicOn(true)
      }
      swapLocal('audio', raw)
      setMicId(id); saveMicId(id)
    } catch {
      toast('Не удалось переключить микрофон', 'error')
    }
  }

  async function toggleNoise() {
    const raw = localStreamRef.current?.getAudioTracks()[0]
    const published = audioPubRef.current?.track
    if (!raw || !published) { toast('Микрофон недоступен', 'error'); return }
    const want = !noiseOn
    let target
    if (want) {
      try { denoiseRef.current?.context?.close() } catch { /* ignore */ }
      denoiseRef.current = await createDenoisedTrack(localStreamRef.current)
      target = denoiseRef.current?.track
      if (!target) { toast('Шумоподавление недоступно в этом браузере', 'error'); return }
    } else {
      target = raw.clone()
    }
    await published.replaceTrack(target, true)
    if (!micOn) await published.mute()
    noiseOnRef.current = want
    setNoiseOn(want)
    toast(want ? 'Шумоподавление включено' : 'Шумоподавление выключено', 'info')
  }

  async function toggleShare() {
    const room = roomRef.current
    if (!room) return
    try {
      if (sharing) {
        await room.localParticipant.setScreenShareEnabled(false)
        setSharing(false)
        setLocalShare(null)
      } else {
        const pub = await room.localParticipant.setScreenShareEnabled(
          true,
          { audio: true, contentHint: 'detail', resolution: ScreenSharePresets.h1080fps15.resolution },
          { screenShareEncoding: ScreenSharePresets.h1080fps15.encoding },
        )
        const mst = pub?.track?.mediaStreamTrack
        if (!mst) return
        setLocalShare(new MediaStream([mst]))
        setSharing(true)
      }
    } catch {
      /* пользователь отменил выбор окна */
    }
  }

  function toggleHand() {
    const up = !myHand
    setMyHand(up)
    publish({ type: 'hand', up })
  }

  function openPanel(id) {
    setPanel(id)
    if (id === 'chat') setUnread(0)
    if (id === 'files') setFilesBadge(false)
    if (id === 'hw') { setHwBadge(false); reloadInfo() }
  }

  function togglePanel(id) {
    if (panel === id) setPanel(null)
    else openPanel(id)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else rootRef.current?.requestFullscreen().catch(() => toast('Полный экран недоступен', 'error'))
  }

  function sendChat(e) {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    publish({ type: 'chat', text })
    setChat(prev => [...prev, { from: meRef.current?.userId, name: 'Вы', text, ts: Date.now() }])
    setChatInput('')
  }

  async function handleFinish() {
    const ok = await confirmDialog({
      title: 'Завершить урок для всех?',
      text: 'Конференция закроется у всех участников. Занятие спишется с абонементов учеников, '
          + 'которые были на уроке; отсутствовавшим — по правилам школы.',
      confirmLabel: 'Завершить урок',
      cancelLabel: 'Продолжить урок',
    })
    if (!ok) return
    try {
      publish({ type: 'finished' })
      const r = await conferenceApi.finish(lessonId)
      toast(r?.deducted > 0 ? 'Урок завершён, занятия списаны ✓' : 'Урок завершён ✓', 'success')
      setPhase('finished')
    } catch (e) {
      toast(e.message || 'Не удалось завершить урок', 'error')
    }
  }

  function leave() {
    navigate('/conference')
  }

  // горячие клавиши как в Meet: Ctrl/⌘+D — микрофон, Ctrl/⌘+E — камера
  useEffect(() => {
    if (phase !== 'room') return
    const onKey = e => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'd' || k === 'в') { e.preventDefault(); toggleMic() }
      if (k === 'e' || k === 'у') { e.preventDefault(); toggleCam() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── данные для отображения ── */
  const lesson = info?.lesson
  const role = me?.role ?? info?.myRole
  const isTeacher = role === 'TEACHER' || role === 'ADMIN' || role === 'MANAGER'
  const startAt = lesson?.scheduled_at ? new Date(lesson.scheduled_at).getTime() : null
  const durMin = lesson?.duration_min || 60
  const studentNames = (info?.students || []).map(s => s.name).join(', ')
  const title = lesson ? (LANG_NAME[lesson.lang] || lesson.language) : 'Урок'
  const withWhom = isTeacher ? studentNames : lesson?.teacher
  const lessonWhen = startAt ? (() => {
    const d = toZoned(startAt)
    const M = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    return `${d.getDate()} ${M[d.getMonth()]}, ${fmtTime(startAt)} · ${durMin} мин`
  })() : ''

  /* ── состояния вне комнаты ── */
  const shell = children => (
    <div ref={rootRef} style={{ height: '100dvh', background: 'linear-gradient(160deg, #1B1735 0%, #100E22 100%)', color: '#fff', overflow: 'auto' }}>
      {children}
    </div>
  )

  if (fatal) {
    return shell(
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 44 }}>🚪</div>
          <h2 className="ps-display" style={{ color: '#fff', margin: '10px 0 8px' }}>Не удалось открыть урок</h2>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginBottom: 18 }}>{fatal}</div>
          <button className="ps-btn ps-btn-primary" onClick={leave}>К списку уроков</button>
        </div>
      </div>
    )
  }

  if (phase === 'finished') {
    return shell(
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 460 }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h2 className="ps-display" style={{ color: '#fff', margin: '10px 0 8px' }}>Урок завершён</h2>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            {isTeacher ? 'Посещаемость сохранена. Не забудьте задать домашнее задание.' : 'Материалы урока остаются доступны в расписании.'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isTeacher && <button className="ps-btn ps-btn-primary" onClick={() => navigate(`/homework?lesson=${lessonId}`)}>Задать ДЗ</button>}
            <button className="ps-btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.16)' }} onClick={() => navigate('/dashboard')}>На главную</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'disconnected') {
    const dup = dropReason === 'duplicate'
    return shell(
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 44 }}>{dup ? '💻' : '📡'}</div>
          <h2 className="ps-display" style={{ color: '#fff', margin: '10px 0 8px' }}>
            {dup ? 'Вы вошли в урок в другом окне' : 'Соединение прервалось'}
          </h2>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            {dup
              ? 'Урок открыт на другом устройстве или в другой вкладке, поэтому здесь он закрыт. Можно вернуться сюда — тогда урок закроется там.'
              : 'Не удалось восстановить связь с уроком. Проверьте интернет и подключитесь снова.'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="ps-btn ps-btn-primary" onClick={() => window.location.reload()}>{dup ? 'Вернуться в урок здесь' : 'Подключиться снова'}</button>
            <button className="ps-btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.16)' }} onClick={leave}>К списку уроков</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'lobby') {
    return shell(
      <Lobby
        title={title}
        subtitle={[withWhom, lessonWhen].filter(Boolean).join(' · ')}
        userName={user?.name || 'Вы'}
        joining={joining}
        joinError={joinError}
        onJoin={handleJoin}
        onBack={leave}
      />
    )
  }

  /* ── раскладка сцены ── */
  const selfTile = {
    key: 'self', stream: localStream, label: 'Вы', avatarName: user?.name, self: true, mirror: true,
    camOff: !camOn || !localStream?.getVideoTracks().length, micOff: !micOn,
    speaking: speaking.has(String(me?.userId)), hand: myHand,
  }
  const remoteTiles = participants.map(p => ({
    key: `p-${p.identity}`, stream: p.cam, label: p.name, camOff: p.camOff, micOff: p.micOff,
    speaking: speaking.has(p.identity), hand: !!hands[p.identity],
  }))
  const sharingRemote = participants.find(p => p.screen)
  const spotlight = sharingRemote
    ? { key: `screen-${sharingRemote.identity}`, stream: sharingRemote.screen, label: `${sharingRemote.name} · экран`, screen: true }
    : sharing && localShare ? { key: 'self-screen', stream: localShare, label: 'Вы показываете экран', screen: true, self: true } : null

  let stage
  if (spotlight) {
    // демонстрация: экран на сцене, камеры — лентой
    const film = [selfTile, ...remoteTiles]
    stage = (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <VideoTile tile={spotlight} fit="contain" style={{ flex: 1, minWidth: 0, minHeight: 0 }} />
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 10, overflow: 'auto', flexShrink: 0, ...(isMobile ? { height: 90 } : { width: 220 }) }}>
          {film.map(t => <VideoTile key={t.key} tile={t} compact style={{ flexShrink: 0, aspectRatio: '16 / 9', ...(isMobile ? { height: '100%' } : { width: '100%' }) }} />)}
        </div>
      </div>
    )
  } else if (remoteTiles.length === 0) {
    // пока одни: своя камера и кого ждём
    stage = (
      <div style={{ position: 'absolute', inset: 0 }}>
        <VideoTile tile={selfTile} fit="cover" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100% - 32px)', padding: '10px 16px', borderRadius: 14, background: 'rgba(10,8,22,.66)', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{isTeacher ? 'Ожидаем учеников' : 'Ожидаем преподавателя'}</div>
          {withWhom && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{withWhom} — войдёт из своего расписания, ссылка не нужна</div>}
        </div>
      </div>
    )
  } else if (remoteTiles.length === 1) {
    // один на один: собеседник на весь экран, своя камера — мини-окном (клик меняет местами)
    const big = swap ? selfTile : remoteTiles[0]
    const small = swap ? remoteTiles[0] : selfTile
    stage = (
      <div style={{ position: 'absolute', inset: 0 }}>
        <VideoTile key={big.key} tile={big} fit="contain" style={{ position: 'absolute', inset: 0 }} />
        <VideoTile key={small.key} tile={small} compact fit="cover" onClick={() => setSwap(s => !s)}
          style={{ position: 'absolute', right: 14, bottom: 14, width: isMobile ? 120 : 'clamp(160px, 22%, 280px)', aspectRatio: '16 / 9', boxShadow: '0 10px 30px rgba(0,0,0,.5)', zIndex: 2 }} />
      </div>
    )
  } else {
    // группа: равная сетка
    const tiles = [selfTile, ...remoteTiles]
    const n = tiles.length
    const cols = isMobile ? (n <= 2 ? 1 : 2) : n <= 4 ? 2 : n <= 9 ? 3 : 4
    stage = (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gap: 10, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}>
        {tiles.map(t => <VideoTile key={t.key} tile={t} fit="cover" />)}
      </div>
    )
  }

  const people = info ? [
    { id: lesson?.teacher_id, name: lesson?.teacher, role: 'Преподаватель' },
    ...(info.students || []).map(s => ({ id: s.id, name: s.name, role: 'Ученик' })),
  ] : []
  const onlineIds = new Set([me?.userId, ...participants.map(p => p.id)])
  const onlineCount = participants.length + 1

  const panelEl = panel && (
    <aside aria-label="Боковая панель урока" style={{
      width: isMobile ? 'auto' : 360, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0,
      background: '#1D1938', borderRadius: 20, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden',
      ...(isMobile ? { position: 'absolute', inset: 8, zIndex: 40, boxShadow: '0 20px 60px rgba(0,0,0,.6)' } : {}),
    }}>
      <div role="tablist" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 8, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        {[{ id: 'chat', l: 'Чат' }, { id: 'files', l: 'Материалы' }, { id: 'hw', l: 'ДЗ' }, { id: 'people', l: `Люди · ${onlineCount}` }].map(t => (
          <button key={t.id} role="tab" aria-selected={panel === t.id} type="button" onClick={() => openPanel(t.id)}
            style={{ flex: 1, padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, background: panel === t.id ? 'rgba(255,255,255,.1)' : 'transparent', color: panel === t.id ? '#fff' : 'rgba(255,255,255,.55)' }}>
            {t.l}
          </button>
        ))}
        <button type="button" onClick={() => setPanel(null)} aria-label="Закрыть панель"
          style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <CIcon name="close" size={18} />
        </button>
      </div>

      {panel === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chat.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textAlign: 'center', padding: '24px 12px', lineHeight: 1.5 }}>
                Сообщения видны только участникам урока и не сохраняются после него. Удобно, чтобы написать слово или ссылку.
              </div>
            )}
            {chat.map((m, i) => {
              const mine = m.from === me?.userId
              return (
                <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {!mine && <div style={{ fontSize: 11, fontWeight: 800, color: '#A9A3F0', marginBottom: 3 }}>{m.name}</div>}
                  <div style={{ padding: '8px 12px', borderRadius: mine ? '14px 14px 4px 14px' : '4px 14px 14px 14px', background: mine ? 'var(--purple)' : 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{fmtTime(m.ts)}</div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Сообщение участникам…" aria-label="Сообщение в чат урока" maxLength={2000}
              style={{ flex: 1, minWidth: 0, border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.06)', color: '#fff', fontFamily: 'inherit' }} />
            <button type="submit" aria-label="Отправить" disabled={!chatInput.trim()}
              style={{ width: 42, borderRadius: 12, border: 'none', background: chatInput.trim() ? 'var(--orange)' : 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <CIcon name="send" size={17} />
            </button>
          </form>
        </>
      )}

      {panel === 'files' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <LessonMaterials lessonId={lessonId} dark refreshKey={materialsKey} onChange={() => publish({ type: 'materials' })} />
        </div>
      )}

      {panel === 'hw' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <LessonHomework
            lessonId={lessonId}
            lesson={lesson}
            students={info?.students ?? []}
            homework={info?.homework ?? []}
            isTeacher={isTeacher}
            onCreated={() => { reloadInfo(); publish({ type: 'homework' }) }}
          />
        </div>
      )}

      {panel === 'people' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {people.map(p => {
            const online = onlineIds.has(p.id)
            const identity = String(p.id)
            const hand = identity === String(me?.userId) ? myHand : !!hands[identity]
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 12 }}>
                <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {(p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
                  <span style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: '50%', border: '2px solid #1D1938', background: online ? '#7CE0A3' : 'rgba(255,255,255,.3)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}{identity === String(me?.userId) ? ' (вы)' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{p.role} · {online ? 'в уроке' : 'не подключился'}</div>
                </div>
                {hand && <span aria-label="поднял руку" style={{ fontSize: 18 }}>✋</span>}
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )

  return (
    <div ref={rootRef} style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#100E22', color: '#fff', overflow: 'hidden' }}>

      {/* ── шапка ── */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '10px 10px 6px' : '12px 18px', flexShrink: 0 }}>
        <button type="button" onClick={leave} aria-label="Выйти из урока" title="Выйти из урока"
          style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <CIcon name="back" size={18} />
        </button>
        {lesson?.lang && <span className={`ps-flag ps-flag-${lesson.lang}`} style={{ flexShrink: 0 }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}{withWhom ? <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.65)' }}> · {withWhom}</span> : null}
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}><LessonClock startAt={startAt} durMin={durMin} /></div>
        </div>
        <span title={['Нет связи', 'Слабая связь', 'Связь нормальная', 'Отличная связь'][quality]} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
          <SignalBars level={quality} />{!isMobile && (quality <= 1 ? 'слабая связь' : '')}
        </span>
        {!isMobile && (
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Выйти из полного экрана' : 'На весь экран'} title={isFullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
            style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <CIcon name={isFullscreen ? 'shrink' : 'expand'} size={17} />
          </button>
        )}
        {isTeacher && (
          <button type="button" className="ps-btn ps-btn-sm" onClick={handleFinish}
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', whiteSpace: 'nowrap' }}>
            <CIcon name="check" size={15} /> {isMobile ? 'Завершить' : 'Завершить урок'}
          </button>
        )}
      </header>

      {reconnecting && (
        <div role="status" style={{ margin: '0 18px 8px', padding: '8px 12px', borderRadius: 10, background: 'rgba(245,196,81,.15)', color: '#F5C451', fontSize: 13, fontWeight: 700 }}>
          Восстанавливаем соединение…
        </div>
      )}
      {needAudio && (
        <button type="button" onClick={() => roomRef.current?.startAudio().then(() => setNeedAudio(false))}
          style={{ margin: '0 18px 8px', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'var(--orange)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔊 Нажмите, чтобы включить звук собеседников
        </button>
      )}

      {/* ── сцена + панель ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, padding: isMobile ? '0 8px' : '0 18px', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>{stage}</div>
        {panelEl}
      </div>

      {/* ── панель управления ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '10px 8px calc(10px + env(safe-area-inset-bottom, 0px))' : '14px 18px', overflowX: 'auto' }}>
        {!isMobile && (
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CIcon name="people" size={16} /> {onlineCount} в уроке
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: isMobile ? '0 auto' : 0 }}>
          <DeviceButton kind="mic" on={micOn} onToggle={toggleMic} devices={devices.mics} currentId={micId} onPick={pickMic}
            label={`${micOn ? 'Выключить' : 'Включить'} микрофон (${MOD}+D)`} />
          <DeviceButton kind="cam" on={camOn} onToggle={toggleCam} devices={devices.cams} currentId={camId} onPick={pickCam}
            label={`${camOn ? 'Выключить' : 'Включить'} камеру (${MOD}+E)`} />
          {!isMobile && <CtrlButton icon="screen" label={sharing ? 'Остановить показ экрана' : 'Показать экран'} onClick={toggleShare} active accent={sharing} pressed={sharing} />}
          <CtrlButton icon={noiseOn ? 'noise' : 'noiseOff'} label={noiseOn ? 'Выключить шумоподавление' : 'Включить шумоподавление'} onClick={toggleNoise} active pressed={noiseOn} />
          <CtrlButton icon="hand" label={myHand ? 'Опустить руку' : 'Поднять руку'} onClick={toggleHand} active accent={myHand} pressed={myHand} />
          <CtrlButton icon="leave" label="Выйти из урока" onClick={leave} danger wide={isMobile ? undefined : 'Выйти'} />
        </div>
        <div style={{ flex: isMobile ? 'none' : 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <CtrlButton icon="chat" label="Чат" onClick={() => togglePanel('chat')} active pressed={panel === 'chat'} badge={unread || undefined} />
          <CtrlButton icon="files" label="Материалы урока" onClick={() => togglePanel('files')} active pressed={panel === 'files'} badge={filesBadge || undefined} />
          <CtrlButton icon="book" label="Домашнее задание" onClick={() => togglePanel('hw')} active pressed={panel === 'hw'} badge={hwBadge || undefined} />
          <CtrlButton icon="people" label="Участники" onClick={() => togglePanel('people')} active pressed={panel === 'people'} />
        </div>
      </div>
    </div>
  )
}

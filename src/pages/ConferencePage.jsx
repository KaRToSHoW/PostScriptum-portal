import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import ApiError from '../components/ApiError'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { conferenceApi } from '../api/conference'
import { createDenoisedTrack } from '../lib/noiseSuppression'

const LANG_NAME = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const POLL_MS = 1500

function fmtTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtLessonDate(raw) {
  const d = new Date(raw)
  const MONTHS = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ================================================================
   СПИСОК УРОКОВ — вкладка «Конференции»
   ================================================================ */
function ConferenceList() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    conferenceApi.lessons()
      .then(d => setLessons(Array.isArray(d) ? d : []))
      .catch(e => setApiError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const now = Date.now()

  return (
    <div className="ps-m-pad" style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {apiError && <ApiError message={apiError} />}

      <div>
        <span className="ps-eyebrow">видеоуроки без внешних ссылок</span>
        <h2 className="ps-display" style={{ fontSize: 26, margin: '4px 0 0' }}>
          {loading ? 'Загрузка...' : lessons.length > 0
            ? `${lessons.length} ${lessons.length === 1 ? 'урок' : lessons.length < 5 ? 'урока' : 'уроков'} на неделе`
            : 'Нет предстоящих уроков'}
        </h2>
      </div>

      <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {lessons.map(l => {
          const startAt = new Date(l.scheduled_at).getTime()
          const endAt   = startAt + (l.duration_min || 60) * 60000
          const live    = l.status === 'IN_PROGRESS' || (now >= startAt - 10 * 60000 && now <= endAt + 30 * 60000)
          return (
            <div key={l.id} className="ps-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className={`ps-flag ps-flag-${l.lang}`} style={{ fontSize: 22, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{l.language}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{l.with_whom}</div>
                </div>
                {l.status === 'IN_PROGRESS' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: 'var(--orange-deep)', background: 'var(--orange-soft)', padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} /> Идёт
                  </span>
                )}
              </div>
              <div className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple-deep)', fontFamily: 'var(--font-display)' }}>
                  {fmtLessonDate(l.scheduled_at)} · {l.duration_min || 60} мин
                </div>
                <button
                  className={`ps-btn ps-btn-sm ${live ? 'ps-btn-primary' : 'ps-btn-outline'}`}
                  disabled={!live}
                  style={!live ? { opacity: .5, cursor: 'default' } : {}}
                  onClick={() => live && navigate(`/conference/${l.id}`)}
                >
                  <Icon name="play" size={13} /> {live ? 'Войти на урок' : 'Ещё не началось'}
                </button>
              </div>
            </div>
          )
        })}
        {!loading && lessons.length === 0 && !apiError && (
          <div style={{ gridColumn: '1/-1', padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
            Когда появится запланированный урок, сюда можно будет войти без всяких внешних ссылок
          </div>
        )}
      </div>
    </div>
  )
}

/* Плитка с видео участника (в сетке или в ленте у демонстрации) */
function VideoTile({ tile, film }) {
  return (
    <div style={{
      position: 'relative', background: '#0F0D1F', overflow: 'hidden',
      ...(film
        ? { width: 172, aspectRatio: '16 / 9', borderRadius: 14, flexShrink: 0, border: '1.5px solid rgba(255,255,255,.16)', boxShadow: '0 8px 22px rgba(0,0,0,.4)' }
        : { minHeight: 0, borderRadius: 16, border: '1px solid rgba(255,255,255,.08)' }),
    }}>
      <video
        autoPlay playsInline muted={!!tile.self}
        ref={el => { if (el && el.srcObject !== tile.stream) el.srcObject = tile.stream }}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block', transform: tile.mirror ? 'scaleX(-1)' : 'none' }}
      />
      {tile.camOff && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#1F1B3A', color: 'rgba(255,255,255,.55)', fontSize: film ? 11 : 13, fontWeight: 700 }}>
          Камера выключена
        </div>
      )}
      <span style={{ position: 'absolute', left: film ? 8 : 12, bottom: film ? 8 : 12, fontSize: film ? 11 : 12, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.5)', padding: film ? '2px 8px' : '4px 10px', borderRadius: 999, maxWidth: '86%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tile.label}
      </span>
    </div>
  )
}

/* ================================================================
   КОМНАТА КОНФЕРЕНЦИИ
   ================================================================ */
function ConferenceRoom({ lessonId }) {
  const navigate = useNavigate()
  const [info, setInfo]         = useState(null)
  const [joinError, setJoinError] = useState(null)
  const [me, setMe]             = useState(null)          // { userId, role, name }
  const [remotes, setRemotes]   = useState({})            // peerId -> MediaStream
  const [online, setOnline]     = useState([])
  const [micOn, setMicOn]       = useState(true)
  const [camOn, setCamOn]       = useState(true)
  const [tab, setTab]           = useState('chat')
  const [chat, setChat]         = useState([])
  const [chatInput, setChatInput] = useState('')
  const [finished, setFinished] = useState(false)
  const [noiseOn, setNoiseOn]   = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sharing, setSharing]   = useState(false)
  const [uiVisible, setUiVisible] = useState(true)   // авто-скрытие панелей при простое мыши
  const videoAreaRef = useRef(null)
  const screenStreamRef = useRef(null)
  const hideTimerRef = useRef(null)

  // мобильный режим (≤900px): компактный нижний бар управления вместо плавающей панели
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const fn = e => setIsMobile(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  // Показать интерфейс и завести таймер на скрытие (вызывается при движении мыши)
  function pokeUI() {
    setUiVisible(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setUiVisible(false), 3500)
  }
  useEffect(() => { pokeUI(); return () => clearTimeout(hideTimerRef.current) }, [])

  const [localShare, setLocalShare] = useState(null)  // свой экран (виден даже одному)
  const [remoteSharing, setRemoteSharing] = useState({})  // peerId -> демонстрирует экран
  const localStreamRef = useRef(null)
  const rtcConfigRef = useRef(RTC_CONFIG)
  const peersRef = useRef({})   // peerId -> RTCPeerConnection
  const pollRef  = useRef(null)
  const meRef    = useRef(null)
  const chatEndRef = useRef(null)
  const shareRef = useRef(false)   // демонстрирую ли я экран (для poll / новых участников)

  const rawAudioTrackRef = useRef(null)   // сырой микрофон
  const outAudioTrackRef = useRef(null)   // что реально уходит собеседнику (RNNoise или сырой)
  const denoiseRef       = useRef(null)   // { track, context } RNNoise

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  // следим за выходом из полноэкранного режима (Esc и т.п.)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const sendSignal = useCallback((type, payload, to) => {
    conferenceApi.signal(lessonId, { type, payload, to }).catch(() => {})
  }, [lessonId])

  const createPeer = useCallback((peerId) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId]
    const pc = new RTCPeerConnection(rtcConfigRef.current)
    peersRef.current[peerId] = pc

    // исходящие треки: звук (RNNoise или сырой), видео — экран (если демонстрация) или камера
    const audioTrack = outAudioTrackRef.current ?? localStreamRef.current?.getAudioTracks()[0]
    const videoTrack = (shareRef.current && screenStreamRef.current?.getVideoTracks()[0])
                       || localStreamRef.current?.getVideoTracks()[0]
    if (audioTrack) pc.addTrack(audioTrack, localStreamRef.current)
    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current)

    // даже без своей камеры/микрофона должны принимать медиа собеседника
    if (!audioTrack) pc.addTransceiver('audio', { direction: 'recvonly' })
    if (!videoTrack) pc.addTransceiver('video', { direction: 'recvonly' })

    pc.onicecandidate = e => {
      if (e.candidate) sendSignal('ice', JSON.stringify(e.candidate), peerId)
    }
    // перезапуск согласования (например, включили демонстрацию экрана без камеры)
    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignal('offer', JSON.stringify(pc.localDescription), peerId)
      } catch { /* повторится при следующем изменении */ }
    }
    pc.ontrack = e => {
      const stream = (e.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track])
      setRemotes(prev => ({ ...prev, [peerId]: stream }))
    }
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        // при разрыве убираем peer — при следующем poll соединение поднимется заново
        if (pc.connectionState === 'failed') {
          pc.close()
          delete peersRef.current[peerId]
          setRemotes(prev => { const n = { ...prev }; delete n[peerId]; return n })
        }
      }
    }
    return pc
  }, [sendSignal])

  const handleSignal = useCallback(async (msg) => {
    const from = msg.from
    if (msg.type === 'chat') {
      setChat(prev => [...prev, { from, name: msg.fromName, text: msg.payload, ts: msg.ts }])
      return
    }
    if (msg.type === 'finished') {
      setFinished(true)
      return
    }
    if (msg.type === 'share') {
      const on = msg.payload === 'on'
      setRemoteSharing(prev => {
        if (!!prev[from] === on) return prev
        const n = { ...prev }
        if (on) n[from] = true; else delete n[from]
        return n
      })
      return
    }
    if (msg.type === 'leave') {
      const pc = peersRef.current[from]
      if (pc) { pc.close(); delete peersRef.current[from] }
      setRemotes(prev => { const n = { ...prev }; delete n[from]; return n })
      setRemoteSharing(prev => { const n = { ...prev }; delete n[from]; return n })
      return
    }
    if (msg.type === 'offer') {
      const pc = createPeer(from)
      await pc.setRemoteDescription(JSON.parse(msg.payload))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal('answer', JSON.stringify(pc.localDescription), from)
      // новый участник должен знать, что я уже показываю экран
      if (shareRef.current) sendSignal('share', 'on', from)
      return
    }
    if (msg.type === 'answer') {
      const pc = peersRef.current[from]
      if (pc && pc.signalingState === 'have-local-offer') await pc.setRemoteDescription(JSON.parse(msg.payload))
      return
    }
    if (msg.type === 'ice') {
      const pc = peersRef.current[from]
      if (pc) { try { await pc.addIceCandidate(JSON.parse(msg.payload)) } catch { /* ignore */ } }
    }
  }, [createPeer, sendSignal])

  // вход в комнату + медиа + поллинг сигналов
  useEffect(() => {
    let cancelled = false

    async function start() {
      let joined
      try {
        joined = await conferenceApi.join(lessonId)
      } catch (e) {
        if (!cancelled) setJoinError(e.message || 'Не удалось войти на урок')
        return
      }
      if (cancelled) return
      setMe(joined); meRef.current = joined

      // ICE-конфиг с сервера (STUN + TURN, если настроен) — до создания соединений
      try {
        const ice = await conferenceApi.ice()
        if (ice?.iceServers?.length) rtcConfigRef.current = ice
      } catch { /* остаёмся на STUN по умолчанию */ }

      conferenceApi.info(lessonId).then(d => { if (!cancelled) setInfo(d) }).catch(() => {})

      // пробуем видео+звук, потом только звук, потом только видео —
      // на одном компьютере камеру может занять другой браузер
      const AUDIO = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      let stream = null
      for (const constraints of [{ video: true, audio: AUDIO }, { video: false, audio: AUDIO }, { video: true, audio: false }]) {
        try { stream = await navigator.mediaDevices.getUserMedia(constraints); break } catch { /* следующий вариант */ }
      }
      if (cancelled) { stream?.getTracks().forEach(t => t.stop()); return }
      if (stream) {
        localStreamRef.current = stream
        const hasAudio = stream.getAudioTracks().length > 0
        const hasVideo = stream.getVideoTracks().length > 0
        setMicOn(hasAudio)
        setCamOn(hasVideo)
        if (!hasVideo) toast('Камера занята или недоступна — вы в эфире только со звуком', 'info')

        // Звук по умолчанию — сырой микрофон; поверх строим RNNoise (если получится)
        const rawAudio = stream.getAudioTracks()[0] ?? null
        rawAudioTrackRef.current = rawAudio
        outAudioTrackRef.current = rawAudio
        if (rawAudio && noiseOn) {
          const dn = await createDenoisedTrack(stream)
          if (!cancelled && dn) {
            denoiseRef.current = dn
            outAudioTrackRef.current = dn.track
          } else if (dn) {
            try { dn.context.close() } catch { /* ignore */ }
          }
        }
      } else {
        toast('Камера и микрофон недоступны — вы будете видеть и слышать собеседника', 'error')
      }

      pollRef.current = setInterval(async () => {
        try {
          const d = await conferenceApi.signals(lessonId)
          if (cancelled || !d) return
          setOnline(d.online || [])
          if (d.status === 'DONE') setFinished(true)
          for (const msg of (d.signals || [])) await handleSignal(msg)

          // инициатор соединения — участник с меньшим id (детерминированно)
          const myId = meRef.current?.userId
          for (const peerId of (d.online || [])) {
            if (peerId === myId) continue
            // мёртвое соединение (собеседник перезагрузил страницу) — пересоздаём
            const existing = peersRef.current[peerId]
            if (existing && ['failed', 'closed', 'disconnected'].includes(existing.connectionState)) {
              existing.close()
              delete peersRef.current[peerId]
              setRemotes(prev => { const n = { ...prev }; delete n[peerId]; return n })
              setRemoteSharing(prev => { const n = { ...prev }; delete n[peerId]; return n })
            }
            if (peersRef.current[peerId]) continue
            if (myId < peerId) {
              const pc = createPeer(peerId)
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal('offer', JSON.stringify(pc.localDescription), peerId)
              // новый участник должен знать, что я уже показываю экран
              if (shareRef.current) sendSignal('share', 'on', peerId)
            }
          }
        } catch { /* сеть мигнула — продолжаем поллинг */ }
      }, POLL_MS)
    }

    start()

    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
      Object.values(peersRef.current).forEach(pc => pc.close())
      peersRef.current = {}
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
      try { denoiseRef.current?.context?.close() } catch { /* ignore */ }
      denoiseRef.current = null
      conferenceApi.leave(lessonId).catch(() => {})
    }
  }, [lessonId, createPeer, handleSignal, sendSignal])

  function toggleMic() {
    const tr = localStreamRef.current?.getAudioTracks()
    tr?.forEach(t => { t.enabled = !micOn })
    setMicOn(!micOn)
  }
  function toggleCam() {
    const tr = localStreamRef.current?.getVideoTracks()
    tr?.forEach(t => { t.enabled = !camOn })
    setCamOn(!camOn)
  }
  async function replaceOutgoingAudio(track) {
    for (const pc of Object.values(peersRef.current)) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'audio')
      if (!sender) continue
      try { await sender.replaceTrack(track) } catch { /* пересоздастся */ }
    }
  }

  async function toggleNoise() {
    const raw = rawAudioTrackRef.current
    if (!raw) { toast('Микрофон недоступен', 'error'); return }
    const want = !noiseOn
    if (want && !denoiseRef.current) {
      const dn = await createDenoisedTrack(localStreamRef.current)
      if (dn) denoiseRef.current = dn
    }
    const denoised = denoiseRef.current?.track
    if (want && !denoised) { toast('Шумоподавление недоступно в этом браузере', 'error'); return }
    const target = want ? denoised : raw
    outAudioTrackRef.current = target
    await replaceOutgoingAudio(target)
    setNoiseOn(want)
    toast(want ? 'Шумоподавление RNNoise включено' : 'Шумоподавление выключено', 'info')
  }
  async function replaceOutgoingVideo(track) {
    // подменяем исходящее видео у всех соединений; если видео-sender'а нет — задействуем recvonly-трансивер
    for (const pc of Object.values(peersRef.current)) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        ?? pc.getTransceivers().find(t => t.receiver?.track?.kind === 'video')?.sender
      if (!sender) continue
      try {
        await sender.replaceTrack(track)
        const tx = pc.getTransceivers().find(t => t.sender === sender)
        if (tx && track && tx.direction === 'recvonly') tx.direction = 'sendrecv'
      } catch { /* соединение пересоздастся само */ }
    }
  }

  async function toggleShare() {
    if (sharing) { await stopShare(); return }
    let screen
    try {
      screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    } catch { return /* пользователь отменил выбор */ }
    screenStreamRef.current = screen
    screen.getVideoTracks()[0].onended = () => stopShare()   // «Остановить» в панели браузера
    // отправляем собеседнику чистый экран (без вебки), камера продолжает работать своим потоком
    await replaceOutgoingVideo(screen.getVideoTracks()[0])
    setLocalShare(screen)   // локальный предпросмотр — видно свой экран даже одному
    setSharing(true)
    shareRef.current = true
    sendSignal('share', 'on')   // всем: я показываю экран
  }

  async function stopShare() {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    setLocalShare(null)
    const camTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
    await replaceOutgoingVideo(camTrack)   // возвращаем камеру
    setSharing(false)
    shareRef.current = false
    sendSignal('share', 'off')
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      videoAreaRef.current?.requestFullscreen().catch(() => toast('Полный экран недоступен', 'error'))
    }
  }
  function sendChat() {
    const text = chatInput.trim()
    if (!text) return
    sendSignal('chat', text)
    setChat(prev => [...prev, { from: meRef.current?.userId, name: 'Вы', text, ts: Date.now() }])
    setChatInput('')
  }
  async function handleFinish() {
    try {
      const r = await conferenceApi.finish(lessonId)
      toast(r?.deducted > 0 ? 'Урок завершён, занятие списано с абонемента ✓' : 'Урок завершён ✓', 'success')
      setFinished(true)
    } catch (e) {
      toast(e.message || 'Ошибка', 'error')
    }
  }

  const lesson = info?.lesson
  const isTeacher = me?.role === 'TEACHER' || me?.role === 'ADMIN' || me?.role === 'MANAGER'
  const remoteEntries = Object.entries(remotes)

  const nameById = {}
  if (info) {
    nameById[info.lesson?.teacher_id] = info.lesson?.teacher
    for (const s of (info.students || [])) nameById[s.id] = s.name
  }

  // Как в Discord: если кто-то показывает экран — он большой на сцене, камеры уходят в ленту.
  const myShareActive = sharing && !!localShare
  const sharingRemote = remoteEntries.find(([pid]) => remoteSharing[pid])
  let spotlight = null
  if (sharingRemote) {
    spotlight = { key: sharingRemote[0], stream: sharingRemote[1], label: `${nameById[sharingRemote[0]] || 'Участник'} · демонстрация` }
  } else if (myShareActive) {
    spotlight = { key: 'self-share', stream: localShare, label: 'Вы · демонстрация', self: true }
  }

  // Плитки камер (лента при демонстрации, сетка — без неё). Свою вебку при своей демонстрации не показываем.
  const hasLocalVideo = !!localStreamRef.current?.getVideoTracks?.().length
  const camTiles = []
  if (localStreamRef.current && !myShareActive) {
    camTiles.push({ key: 'self-cam', stream: localStreamRef.current, label: 'Вы', self: true, mirror: true, camOff: !camOn || !hasLocalVideo })
  }
  for (const [peerId, stream] of remoteEntries) {
    if (spotlight && spotlight.key === peerId) continue   // этот участник уже на сцене
    camTiles.push({ key: peerId, stream, label: nameById[peerId] || 'Участник' })
  }
  const cols = camTiles.length <= 1 ? 1 : camTiles.length <= 4 ? 2 : 3

  if (joinError) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 28 }}>
        <div className="ps-card" style={{ padding: 32, textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚪</div>
          <h3 className="ps-display" style={{ fontSize: 20, margin: '0 0 8px' }}>Не удалось войти</h3>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 18 }}>{joinError}</div>
          <button className="ps-btn ps-btn-primary" onClick={() => navigate('/conference')}>К списку уроков</button>
        </div>
      </div>
    )
  }

  if (finished) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 28 }}>
        <div className="ps-card" style={{ padding: 32, textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
          <h3 className="ps-display" style={{ fontSize: 20, margin: '0 0 8px' }}>Урок завершён</h3>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 18 }}>
            Занятие зафиксировано{me?.role === 'STUDENT' ? ' и списано с абонемента' : ', посещаемость сохранена'}
          </div>
          <button className="ps-btn ps-btn-primary" onClick={() => navigate('/dashboard')}>На главную</button>
        </div>
      </div>
    )
  }

  return (
    <div onMouseMove={pokeUI} className="ps-m-col ps-m-pad" style={{ flex: 1, padding: 20, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Видео-зона ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <div ref={videoAreaRef} style={{ flex: 1, borderRadius: 20, position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center', minHeight: 0, background: '#1E1A38', cursor: uiVisible ? 'default' : 'none' }}>
          {spotlight ? (
            /* ── Демонстрация экрана: большая сцена + лента камер справа (как в Discord) ── */
            <>
              <video
                autoPlay playsInline muted={!!spotlight.self}
                ref={el => { if (el && el.srcObject !== spotlight.stream) el.srcObject = spotlight.stream }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
              <span style={{ position: 'absolute', left: 16, bottom: 16, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '5px 12px', borderRadius: 999 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)' }} /> {spotlight.label}
              </span>
              {camTiles.length > 0 && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '86%', overflowY: 'auto', padding: 2 }}>
                  {camTiles.map(t => <VideoTile key={t.key} tile={t} film />)}
                </div>
              )}
            </>
          ) : camTiles.length > 0 ? (
            /* ── Обычная сетка камер ── */
            <div style={{
              position: 'absolute', inset: 0, display: 'grid', gap: 10, padding: 10,
              gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: '1fr',
            }}>
              {camTiles.map(t => <VideoTile key={t.key} tile={t} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.75)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Ожидаем собеседника...</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Соединение установится автоматически</div>
            </div>
          )}

          {/* полный экран */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
            style={{ position: 'absolute', right: 16, top: 16, width: 38, height: 38, borderRadius: 11, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.35)', color: '#fff', zIndex: 5, opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none', transition: 'opacity .3s' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen
                ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
                : <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>}
            </svg>
          </button>

          {/* шапка урока */}
          {lesson && (
            <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.35)', padding: '8px 14px', borderRadius: 12, opacity: uiVisible ? 1 : 0, transition: 'opacity .3s', pointerEvents: 'none' }}>
              <span className={`ps-flag ps-flag-${lesson.lang}`} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{LANG_NAME[lesson.lang] || lesson.language}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{fmtLessonDate(lesson.scheduled_at)} · {lesson.duration_min || 60} мин</div>
              </div>
            </div>
          )}
        </div>

        {/* панель управления — плавающая на десктопе, компактный нижний бар на мобильном */}
        {(() => {
          const ctrl = isMobile
            ? { width: 44, height: 44, borderRadius: '50%' }
            : { width: 46, height: 46, borderRadius: 14 }
          const iconButtons = (
            <>
              <button
                onClick={toggleMic}
                title={micOn ? 'Выключить микрофон' : 'Включить микрофон'}
                style={{ ...ctrl, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, background: micOn ? 'var(--purple-soft)' : 'var(--danger)', color: micOn ? 'var(--purple-deep)' : '#fff' }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  {!micOn && <line x1="2" y1="2" x2="22" y2="22" />}
                </svg>
              </button>
              <button
                onClick={toggleCam}
                title={camOn ? 'Выключить камеру' : 'Включить камеру'}
                style={{ ...ctrl, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, background: camOn ? 'var(--purple-soft)' : 'var(--danger)', color: camOn ? 'var(--purple-deep)' : '#fff' }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  {!camOn && <line x1="2" y1="2" x2="22" y2="22" />}
                </svg>
              </button>
              <button
                onClick={toggleShare}
                title={sharing ? 'Остановить демонстрацию экрана' : 'Демонстрация экрана'}
                style={{ ...ctrl, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, background: sharing ? 'var(--orange)' : 'var(--purple-soft)', color: sharing ? '#fff' : 'var(--purple-deep)' }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  <path d="M12 12V7"/><path d="m9 9 3-3 3 3"/>
                </svg>
              </button>
              <button
                onClick={toggleNoise}
                title={noiseOn ? 'Выключить шумоподавление' : 'Включить шумоподавление'}
                style={{ ...ctrl, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, background: noiseOn ? 'var(--purple-soft)' : 'var(--bg-cream)', color: noiseOn ? 'var(--purple-deep)' : 'var(--ink-muted)' }}
              >
                {/* волна с гашением шума */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h2l2-7 3 14 3-10 2 5 2-2h6"/>
                  {!noiseOn && <line x1="2" y1="2" x2="22" y2="22" />}
                </svg>
              </button>
            </>
          )

          if (isMobile) {
            return (
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '8px 10px calc(8px + env(safe-area-inset-bottom, 0px))',
                borderRadius: '16px 16px 0 0', zIndex: 6,
                background: 'rgba(24,20,46,.72)', backdropFilter: 'blur(10px)',
                opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none',
                transform: `translateY(${uiVisible ? 0 : 12}px)`,
                transition: 'opacity .3s, transform .3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
                  {iconButtons}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigate('/conference')}
                    style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' }}
                  >
                    <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} /> Выйти
                  </button>
                  {isTeacher && (
                    <button
                      onClick={handleFinish}
                      style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--purple)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' }}
                    >
                      <Icon name="check" size={13} /> Завершить урок
                    </button>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div style={{
              position: 'absolute', bottom: 18, left: '50%',
              transform: `translateX(-50%) translateY(${uiVisible ? 0 : 20}px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 18, zIndex: 6,
              background: 'rgba(24,20,46,.72)', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-pop)',
              opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none',
              transition: 'opacity .3s, transform .3s',
            }}>
              {iconButtons}

              <div style={{ width: 1, height: 30, background: 'var(--border)', margin: '0 6px' }} />

              <button className="ps-btn" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => navigate('/conference')}>
                <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} /> Выйти
              </button>
              {isTeacher && (
                <button className="ps-btn ps-btn-primary" onClick={handleFinish}>
                  <Icon name="check" size={14} /> Завершить урок
                </button>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── Правая панель: чат / материалы / участники ── */}
      <div className="ps-card ps-m-full" style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          {[
            { id: 'chat',   l: 'Чат' },
            { id: 'people', l: 'Участники' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '13px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
              background: 'transparent',
              color: tab === t.id ? 'var(--purple-deep)' : 'var(--ink-muted)',
              borderBottom: tab === t.id ? '2.5px solid var(--purple)' : '2.5px solid transparent',
            }}>{t.l}</button>
          ))}
        </div>

        {/* Чат */}
        {tab === 'chat' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chat.length === 0 && (
                <div style={{ color: 'var(--ink-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
                  Сообщения видны только участникам урока
                </div>
              )}
              {chat.map((m, i) => {
                const mine = m.from === me?.userId
                return (
                  <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {!mine && <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple-deep)', marginBottom: 2 }}>{m.name}</div>}
                    <div style={{
                      padding: '8px 12px', borderRadius: mine ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                      background: mine ? 'var(--purple)' : 'var(--bg-cream)',
                      color: mine ? '#fff' : 'var(--ink)', fontSize: 13, lineHeight: 1.45,
                    }}>{m.text}</div>
                    <div style={{ fontSize: 9, color: 'var(--ink-muted)', marginTop: 2, textAlign: mine ? 'right' : 'left' }}>{fmtTime(m.ts)}</div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Сообщение..."
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', background: 'var(--bg-cream-soft)' }}
              />
              <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={sendChat} style={{ padding: '0 14px' }}>
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </>
        )}

        {/* Материалы */}
        {tab === 'materials' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(!info || info.materials?.length === 0) && (
              <div style={{ color: 'var(--ink-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
                К этому уроку пока нет материалов
              </div>
            )}
            {info?.materials?.map(m => (
              <div key={m.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--bg-cream-soft)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{m.title}</div>
                {m.description && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.5 }}>{m.description}</div>}
                {m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer" className="ps-btn ps-btn-sm ps-btn-outline" style={{ marginTop: 8, display: 'inline-flex' }}>
                    <Icon name="file" size={12} /> Открыть файл
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Участники */}
        {tab === 'people' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {info && [
              { id: info.lesson?.teacher_id, name: info.lesson?.teacher, initials: info.lesson?.teacher_initials, avatarUrl: info.lesson?.teacher_avatar, role: 'Преподаватель' },
              ...(info.students || []).map(s => ({ id: s.id, name: s.name, initials: s.initials, avatarUrl: s.avatarUrl, role: 'Ученик', attended: s.attended })),
            ].map(p => {
              const isOnline = online.includes(p.id)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', overflow: 'hidden', fontWeight: 800, fontSize: 13, color: 'var(--purple-deep)' }}>
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (p.initials || (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2))}
                    </div>
                    <span style={{ position: 'absolute', right: -2, bottom: -2, width: 11, height: 11, borderRadius: '50%', border: '2px solid #fff', background: isOnline ? 'var(--success)' : 'var(--border)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.role}{p.attended === true ? ' · присутствует' : ''}</div>
                  </div>
                  {isOnline && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--success)' }}>в эфире</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   СТРАНИЦА
   ================================================================ */
export default function ConferencePage() {
  const { sideRole } = useApp()
  const { lessonId } = useParams()

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-cream)', overflow: 'hidden' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={lessonId ? 'Урок · конференция' : 'Конференции'} />
        {lessonId ? <ConferenceRoom lessonId={lessonId} /> : <ConferenceList />}
      </main>
    </div>
  )
}

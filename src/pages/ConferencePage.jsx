import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import ApiError from '../components/ApiError'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { conferenceApi } from '../api/conference'

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
    <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {apiError && <ApiError message={apiError} />}

      <div>
        <span className="ps-eyebrow">видеоуроки без внешних ссылок</span>
        <h2 className="ps-display" style={{ fontSize: 26, margin: '4px 0 0' }}>
          {loading ? 'Загрузка...' : lessons.length > 0
            ? `${lessons.length} ${lessons.length === 1 ? 'урок' : lessons.length < 5 ? 'урока' : 'уроков'} на неделе`
            : 'Нет предстоящих уроков'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {lessons.map(l => {
          const startAt = new Date(l.scheduled_at).getTime()
          const endAt   = startAt + (l.duration_min || 60) * 60000
          const live    = l.status === 'IN_PROGRESS' || (now >= startAt - 15 * 60000 && now <= endAt + 30 * 60000)
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
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

  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peersRef = useRef({})   // peerId -> RTCPeerConnection
  const pollRef  = useRef(null)
  const meRef    = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const sendSignal = useCallback((type, payload, to) => {
    conferenceApi.signal(lessonId, { type, payload, to }).catch(() => {})
  }, [lessonId])

  const createPeer = useCallback((peerId) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId]
    const pc = new RTCPeerConnection(RTC_CONFIG)
    peersRef.current[peerId] = pc

    localStreamRef.current?.getTracks().forEach(tr => pc.addTrack(tr, localStreamRef.current))

    pc.onicecandidate = e => {
      if (e.candidate) sendSignal('ice', JSON.stringify(e.candidate), peerId)
    }
    pc.ontrack = e => {
      setRemotes(prev => ({ ...prev, [peerId]: e.streams[0] }))
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
    if (msg.type === 'leave') {
      const pc = peersRef.current[from]
      if (pc) { pc.close(); delete peersRef.current[from] }
      setRemotes(prev => { const n = { ...prev }; delete n[from]; return n })
      return
    }
    if (msg.type === 'offer') {
      const pc = createPeer(from)
      await pc.setRemoteDescription(JSON.parse(msg.payload))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal('answer', JSON.stringify(pc.localDescription), from)
      return
    }
    if (msg.type === 'answer') {
      const pc = peersRef.current[from]
      if (pc && !pc.currentRemoteDescription) await pc.setRemoteDescription(JSON.parse(msg.payload))
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

      conferenceApi.info(lessonId).then(d => { if (!cancelled) setInfo(d) }).catch(() => {})

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch {
        toast('Нет доступа к камере/микрофону', 'error')
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
            if (peerId === myId || peersRef.current[peerId]) continue
            if (myId < peerId) {
              const pc = createPeer(peerId)
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal('offer', JSON.stringify(pc.localDescription), peerId)
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
    <div style={{ flex: 1, padding: 20, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Видео-зона ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div className="ps-card-purple" style={{ flex: 1, borderRadius: 20, position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center', minHeight: 0 }}>
          {/* удалённые участники */}
          {remoteEntries.length > 0 ? (
            <div style={{
              position: 'absolute', inset: 0, display: 'grid', gap: 4,
              gridTemplateColumns: remoteEntries.length > 1 ? '1fr 1fr' : '1fr',
            }}>
              {remoteEntries.map(([peerId, stream]) => (
                <div key={peerId} style={{ position: 'relative', minHeight: 0 }}>
                  <video
                    autoPlay playsInline
                    ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 12, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.45)', padding: '4px 10px', borderRadius: 999 }}>
                    {nameById[peerId] || 'Участник'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.75)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Ожидаем собеседника...</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Соединение установится автоматически</div>
            </div>
          )}

          {/* своя камера */}
          <div style={{ position: 'absolute', right: 16, bottom: 16, width: 180, borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,.35)', background: '#1F1B3A', boxShadow: 'var(--shadow-pop)' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
            {!camOn && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#1F1B3A', color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700 }}>
                Камера выключена
              </div>
            )}
          </div>

          {/* шапка урока */}
          {lesson && (
            <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.35)', padding: '8px 14px', borderRadius: 12 }}>
              <span className={`ps-flag ps-flag-${lesson.lang}`} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{LANG_NAME[lesson.lang] || lesson.language}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{fmtLessonDate(lesson.scheduled_at)} · {lesson.duration_min || 60} мин</div>
              </div>
            </div>
          )}
        </div>

        {/* панель управления */}
        <div className="ps-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button
            onClick={toggleMic}
            title={micOn ? 'Выключить микрофон' : 'Включить микрофон'}
            style={{ width: 46, height: 46, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', background: micOn ? 'var(--purple-soft)' : 'var(--danger)', color: micOn ? 'var(--purple-deep)' : '#fff' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              {!micOn && <line x1="2" y1="2" x2="22" y2="22" />}
            </svg>
          </button>
          <button
            onClick={toggleCam}
            title={camOn ? 'Выключить камеру' : 'Включить камеру'}
            style={{ width: 46, height: 46, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', background: camOn ? 'var(--purple-soft)' : 'var(--danger)', color: camOn ? 'var(--purple-deep)' : '#fff' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              {!camOn && <line x1="2" y1="2" x2="22" y2="22" />}
            </svg>
          </button>

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
      </div>

      {/* ── Правая панель: чат / материалы / участники ── */}
      <div className="ps-card" style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          {[
            { id: 'chat',      l: 'Чат' },
            { id: 'materials', l: 'Материалы' },
            { id: 'people',    l: 'Участники' },
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
              { id: info.lesson?.teacher_id, name: info.lesson?.teacher, initials: info.lesson?.teacher_initials, role: 'Преподаватель' },
              ...(info.students || []).map(s => ({ id: s.id, name: s.name, initials: s.initials, role: 'Ученик', attended: s.attended })),
            ].map(p => {
              const isOnline = online.includes(p.id)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, color: 'var(--purple-deep)' }}>
                      {p.initials || (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
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

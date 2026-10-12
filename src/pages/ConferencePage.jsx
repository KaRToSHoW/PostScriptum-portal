import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import ApiError from '../components/ApiError'
import { useApp } from '../context/AppContext'
import ConferenceRoom from '../components/conference/ConferenceRoom'
import { conferenceApi } from '../api/conference'
import { toZoned } from '../lib/time'

function fmtLessonDate(raw) {
  const d = toZoned(raw)
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

/* ================================================================
   СТРАНИЦА: список уроков в каркасе портала, урок — на весь экран
   (без меню и шапки, как в Meet/Zoom: всё место под видео)
   ================================================================ */
export default function ConferencePage() {
  const { sideRole } = useApp()
  const { lessonId } = useParams()

  if (lessonId) return <ConferenceRoom key={lessonId} lessonId={lessonId} />

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-cream)', overflow: 'hidden' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Конференции" />
        <ConferenceList />
      </main>
    </div>
  )
}

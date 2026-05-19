import { useState } from 'react'
import Sidebar   from '../components/Sidebar'
import TopBar    from '../components/TopBar'
import Icon      from '../components/Icon'
import { useApp } from '../context/AppContext'

const ALL = [
  { id: 1, title: 'Эссе «Mes rêves» (200 слов)',       course: 'Французский B1', teacher: 'Софья Ф.',   lang: 'fr', due: '23.05',  dueLabel: 'до пт',    state: 'progress', grade: null,  comment: null },
  { id: 2, title: 'Listening · BBC News A2',            course: 'Английский A2+', teacher: 'Татьяна К.', lang: 'en', due: '21.05',  dueLabel: 'до ср',    state: 'new',      grade: null,  comment: null },
  { id: 3, title: 'Лексика модуля 4 — Quizlet',         course: 'Французский B1', teacher: 'Софья Ф.',   lang: 'fr', due: '19.05',  dueLabel: 'сегодня',  state: 'done',     grade: 9,     comment: 'Отлично! Все слова усвоены.' },
  { id: 4, title: 'Аудирование «Au café» + транскрипт', course: 'Французский B1', teacher: 'Софья Ф.',   lang: 'fr', due: '16.05',  dueLabel: 'пт',       state: 'done',     grade: 8,     comment: 'Хорошая работа, пара неточностей в транскрипте.' },
  { id: 5, title: 'Грамматика: Past Perfect (упр 1–20)',course: 'Английский A2+', teacher: 'Татьяна К.', lang: 'en', due: '14.05',  dueLabel: 'ср',       state: 'overdue',  grade: null,  comment: null },
  { id: 6, title: 'Перевод текста «La ville»',          course: 'Французский B1', teacher: 'Софья Ф.',   lang: 'fr', due: '12.05',  dueLabel: 'пн',       state: 'overdue',  grade: null,  comment: null },
  { id: 7, title: 'Диалог: знакомство (запись аудио)',   course: 'Английский A2+', teacher: 'Татьяна К.', lang: 'en', due: '09.05',  dueLabel: 'пт',       state: 'done',     grade: 10,    comment: 'Прекрасное произношение! Зачтено.' },
]

const TABS = [
  { id: 'all',      label: 'Все',       filter: () => true },
  { id: 'new',      label: 'Новые',     filter: h => h.state === 'new' },
  { id: 'progress', label: 'В работе',  filter: h => h.state === 'progress' },
  { id: 'done',     label: 'Сдано',     filter: h => h.state === 'done' },
  { id: 'overdue',  label: 'Просрочено',filter: h => h.state === 'overdue' },
]

const STATE_CFG = {
  new:      { label: 'Не начато',  chip: 'blue'   },
  progress: { label: 'В работе',   chip: 'orange' },
  done:     { label: 'Сдано',      chip: 'green'  },
  overdue:  { label: 'Просрочено', chip: 'red'    },
}

function GradeCircle({ grade }) {
  const color = grade >= 9 ? 'var(--success)' : grade >= 7 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${color}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color, flexShrink: 0 }}>
      {grade}
    </div>
  )
}

function HwRow({ hw, expanded, onToggle }) {
  const cfg = STATE_CFG[hw.state]
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--border-soft)', overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span className={`ps-flag ps-flag-${hw.lang}`} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{hw.title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{hw.course} · {hw.teacher}</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{hw.dueLabel}</span>
        <span className={`ps-chip ps-chip-${cfg.chip}`}>{cfg.label}</span>
        {hw.grade !== null && <GradeCircle grade={hw.grade} />}
        <Icon name={expanded ? 'chevron-up' : 'chevron'} size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 28, fontSize: 13 }}>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Срок сдачи: </span>{hw.due}</div>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Курс: </span>{hw.course}</div>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Преподаватель: </span>{hw.teacher}</div>
          </div>

          {hw.comment && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--success-soft)', fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>
              💬 {hw.comment}
            </div>
          )}

          {hw.state === 'overdue' && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--danger-soft)', fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>
              ⚠ Срок сдачи истёк — сдайте как можно скорее или напишите преподавателю
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {(hw.state === 'new' || hw.state === 'progress' || hw.state === 'overdue') && (
              <button className="ps-btn ps-btn-primary ps-btn-sm">
                <Icon name="upload" size={13} /> Сдать задание
              </button>
            )}
            {hw.state === 'done' && (
              <button className="ps-btn ps-btn-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)', border: 'none' }}>
                <Icon name="check" size={13} /> Просмотреть работу
              </button>
            )}
            <button className="ps-btn ps-btn-ghost ps-btn-sm">
              <Icon name="chat" size={13} /> Написать преподавателю
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomeworkPage() {
  const { sideRole } = useApp()
  const [tab, setTab]         = useState('all')
  const [expanded, setExpanded] = useState(null)

  const items = ALL.filter(TABS.find(t => t.id === tab).filter)

  const total   = ALL.length
  const done    = ALL.filter(h => h.state === 'done').length
  const overdue = ALL.filter(h => h.state === 'overdue').length
  const avgGrade = (ALL.filter(h => h.grade).reduce((s, h) => s + h.grade, 0) / ALL.filter(h => h.grade).length).toFixed(1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Домашние задания" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего заданий',   v: total,    d: 'за всё время',      icon: 'file',    color: 'var(--purple-deep)' },
              { l: 'Сдано',           v: done,     d: `${Math.round(done/total*100)}% выполнено`, icon: 'check',   color: 'var(--success)'    },
              { l: 'Просрочено',      v: overdue,  d: 'требует внимания',  icon: 'warning', color: 'var(--danger)'     },
              { l: 'Средняя оценка',  v: avgGrade, d: 'из 10',             icon: 'sparkle', color: 'var(--orange-deep)'},
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* Контент */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>

            {/* Список */}
            <div className="ps-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 className="ps-display" style={{ fontSize: 22, margin: 0 }}>Задания</h3>
                {/* Tabs */}
                <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
                  {TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                        border: 'none', cursor: 'pointer', transition: 'background .12s, color .12s',
                        background: tab === t.id ? 'var(--purple)' : 'transparent',
                        color:      tab === t.id ? '#fff' : 'var(--ink-muted)',
                      }}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                    Заданий в этой категории нет
                  </div>
                )}
                {items.map(hw => (
                  <HwRow
                    key={hw.id}
                    hw={hw}
                    expanded={expanded === hw.id}
                    onToggle={() => setExpanded(expanded === hw.id ? null : hw.id)}
                  />
                ))}
              </div>
            </div>

            {/* Правая колонка */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Прогресс */}
              <div className="ps-card-purple" style={{ padding: 22 }}>
                <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>прогресс</span>
                <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '6px 0 18px' }}>
                  {done} из {total} сдано
                </h3>
                <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${Math.round(done/total*100)}%`, background: 'var(--orange)', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>
                  {Math.round(done/total*100)}% выполнено
                </div>
              </div>

              {/* Ближайшие дедлайны */}
              <div className="ps-card" style={{ padding: 20 }}>
                <span className="ps-eyebrow">дедлайны</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '6px 0 14px' }}>Скоро сдавать</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ALL.filter(h => h.state !== 'done').slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`ps-flag ps-flag-${h.lang}`} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: h.state === 'overdue' ? 'var(--danger)' : 'var(--orange-deep)', flexShrink: 0 }}>{h.dueLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Оценки */}
              <div className="ps-card" style={{ padding: 20 }}>
                <span className="ps-eyebrow">оценки</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '6px 0 14px' }}>Последние</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ALL.filter(h => h.grade).slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GradeCircle grade={h.grade} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

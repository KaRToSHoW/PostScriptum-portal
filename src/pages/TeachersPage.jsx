import { useState } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'

const TEACHERS = [
  {
    id: 1, name: 'Софья Фролова', initials: 'СФ', color: 'var(--purple)',
    role: 'Преподаватель · основатель', flag: 'fr', native: false,
    langs: ['Французский B2+', 'Английский B1'],
    rating: 4.9, reviews: 47, students: 18, experience: '8 лет',
    bio: 'Специализируюсь на разговорном французском и подготовке к DELF/DALF. Люблю строить уроки вокруг реальных ситуаций — кафе, путешествия, переговоры.',
    next: 'Сегодня · 18:30',
    tags: ['Разговорный', 'DELF/DALF', 'Грамматика', 'Бизнес-французский'],
    myTeacher: true,
  },
  {
    id: 2, name: 'Татьяна Кравченко', initials: 'ТК', color: 'var(--orange)',
    role: 'Преподаватель', flag: 'en', native: false,
    langs: ['Английский C1', 'Французский A2'],
    rating: 4.8, reviews: 31, students: 14, experience: '6 лет',
    bio: 'Фокус на деловом английском и подготовке к IELTS/TOEFL. Работаю со взрослыми и подростками с уровня A2.',
    next: 'Чт · 19:00',
    tags: ['IELTS', 'Деловой', 'Произношение', 'Грамматика'],
    myTeacher: true,
  },
  {
    id: 3, name: 'Pierre Bouchard', initials: 'PB', color: 'var(--info)',
    role: 'Носитель языка · Французский', flag: 'fr', native: true,
    langs: ['Французский (родной)', 'Английский B2'],
    rating: 5.0, reviews: 22, students: 8, experience: '4 года',
    bio: 'Родился и вырос в Лионе. Веду разговорные клубы и помогаю поставить настоящий французский акцент. Уроки живые и неформальные.',
    next: 'Сб · 12:00',
    tags: ['Speaking Club', 'Произношение', 'Разговорный', 'Носитель'],
    myTeacher: false,
  },
  {
    id: 4, name: 'Лаура Мартин', initials: 'ЛМ', color: 'var(--success)',
    role: 'Преподаватель · Испанский', flag: 'es', native: false,
    langs: ['Испанский C2', 'Французский B1'],
    rating: 4.7, reviews: 19, students: 12, experience: '5 лет',
    bio: 'Специализируюсь на испанском — от нуля до уверенного разговора. Использую метод погружения и много практики.',
    next: null,
    tags: ['Испанский', 'Разговорный', 'Грамматика', 'DELE'],
    myTeacher: false,
  },
  {
    id: 5, name: 'Иван Шульц', initials: 'ИШ', color: 'var(--warning)',
    role: 'Преподаватель · Немецкий', flag: 'de', native: false,
    langs: ['Немецкий C1', 'Английский B2'],
    rating: 4.6, reviews: 15, students: 10, experience: '3 года',
    bio: 'Веду немецкий с нуля до B2. Объясняю грамматику простым языком, много практики через диалоги.',
    next: null,
    tags: ['Немецкий', 'Грамматика', 'TestDaF', 'Начинающие'],
    myTeacher: false,
  },
]

const LANG_FILTERS = [
  { id: 'all', l: 'Все' },
  { id: 'fr',  l: 'Французский' },
  { id: 'en',  l: 'Английский'  },
  { id: 'es',  l: 'Испанский'   },
  { id: 'de',  l: 'Немецкий'    },
]

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'var(--orange)' : 'var(--border)'} stroke="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginLeft: 4 }}>{rating}</span>
    </div>
  )
}

function TeacherCard({ t, onSelect }) {
  return (
    <div
      onClick={() => onSelect(t)}
      className="ps-card"
      style={{ padding: 22, cursor: 'pointer', transition: 'box-shadow .15s', position: 'relative' }}
    >
      {t.myTeacher && (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <span className="ps-chip ps-chip-purple">Мой преподаватель</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: t.color + '22', border: `2px solid ${t.color}44`,
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: t.color,
          }}>
            {t.initials}
          </div>
          {t.native && (
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: 'var(--orange)', display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>
              <span style={{ fontSize: 10 }}>★</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: t.myTeacher ? 120 : 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{t.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{t.role}</div>
          <div style={{ marginTop: 6 }}><Stars rating={t.rating} /></div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {t.bio}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {t.tags.map(tag => (
          <span key={tag} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg-cream)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)' }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ flex: 1, display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-muted)' }}>
          <span><b style={{ color: 'var(--ink)' }}>{t.reviews}</b> отзывов</span>
          <span><b style={{ color: 'var(--ink)' }}>{t.students}</b> учеников</span>
          <span><b style={{ color: 'var(--ink)' }}>{t.experience}</b></span>
        </div>
        {t.next && (
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--success)', background: 'var(--success-soft)', padding: '3px 10px', borderRadius: 999 }}>
            {t.next}
          </span>
        )}
      </div>
    </div>
  )
}

function TeacherDrawer({ t, onClose }) {
  if (!t) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(31,27,58,.35)', backdropFilter: 'blur(2px)' }} />
      <div style={{ width: 420, background: '#fff', overflow: 'auto', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-pop)' }}>

        {/* Шапка */}
        <div className="ps-card-purple" style={{ padding: 28, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff', flexShrink: 0 }}>
              {t.initials}
            </div>
            <div>
              <h2 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '0 0 4px' }}>{t.name}</h2>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{t.role}</div>
              {t.native && <span className="ps-chip ps-chip-orange" style={{ marginTop: 6 }}>Носитель языка</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
            {[
              { l: 'Рейтинг', v: t.rating },
              { l: 'Отзывы',  v: t.reviews },
              { l: 'Ученики', v: t.students },
              { l: 'Опыт',    v: t.experience },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>{s.v}</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 11 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* О преподавателе */}
          <div>
            <span className="ps-eyebrow">о преподавателе</span>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.65, marginTop: 8 }}>{t.bio}</p>
          </div>

          {/* Языки */}
          <div>
            <span className="ps-eyebrow">языки</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {t.langs.map(l => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-cream-soft)', border: '1px solid var(--border-soft)' }}>
                  <span className={`ps-flag ps-flag-${t.flag}`} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div>
            <span className="ps-eyebrow">специализация</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {t.tags.map(tag => (
                <span key={tag} style={{ padding: '6px 14px', borderRadius: 999, background: 'var(--purple-soft)', fontSize: 12, fontWeight: 800, color: 'var(--purple-deep)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Ближайший урок */}
          {t.next && (
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Следующий урок</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{t.next}</div>
              </div>
              <button className="ps-btn ps-btn-sm" style={{ background: 'var(--success)', color: '#fff', border: 'none' }}>
                <Icon name="play" size={13} /> Войти
              </button>
            </div>
          )}

          {/* Действия */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <button className="ps-btn ps-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }}>
              <Icon name="calendar" size={15} /> Записаться на урок
            </button>
            <button className="ps-btn ps-btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }}>
              <Icon name="chat" size={15} /> Написать сообщение
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const { sideRole } = useApp()
  const [langFilter, setLangFilter] = useState('all')
  const [selected, setSelected]     = useState(null)
  const [onlyMine, setOnlyMine]     = useState(false)

  const filtered = TEACHERS
    .filter(t => onlyMine ? t.myTeacher : true)
    .filter(t => langFilter === 'all' || t.flag === langFilter)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Преподаватели" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { l: 'Мои преподаватели', v: TEACHERS.filter(t=>t.myTeacher).length, d: 'активные курсы',  icon: 'users',   color: 'var(--purple-deep)' },
              { l: 'Носители языка',    v: TEACHERS.filter(t=>t.native).length,    d: 'в школе',         icon: 'sparkle', color: 'var(--orange-deep)' },
              { l: 'Средний рейтинг',   v: (TEACHERS.reduce((s,t)=>s+t.rating,0)/TEACHERS.length).toFixed(1), d: 'из 5', icon: 'star', color: 'var(--warning)' },
              { l: 'Преподавателей',    v: TEACHERS.length,                        d: 'всего в школе',   icon: 'grid',    color: 'var(--ink-muted)'   },
            ].map((k,i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display:'flex', gap:10, alignItems:'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* Фильтры */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
              {LANG_FILTERS.map(f => (
                <button key={f.id} onClick={() => setLangFilter(f.id)} style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                  border: 'none', cursor: 'pointer', transition: 'all .12s',
                  background: langFilter === f.id ? 'var(--purple)' : 'transparent',
                  color:      langFilter === f.id ? '#fff' : 'var(--ink-muted)',
                }}>{f.l}</button>
              ))}
            </div>
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: '1.5px solid',
                transition: 'all .12s',
                background:   onlyMine ? 'var(--purple)' : 'transparent',
                color:        onlyMine ? '#fff' : 'var(--purple)',
                borderColor:  'var(--purple)',
              }}
            >
              <Icon name="user" size={13} /> Только мои
            </button>
          </div>

          {/* Сетка */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
            {filtered.map(t => (
              <TeacherCard key={t.id} t={t} onSelect={setSelected} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                Преподавателей по этому фильтру не найдено
              </div>
            )}
          </div>
        </div>
      </main>

      <TeacherDrawer t={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

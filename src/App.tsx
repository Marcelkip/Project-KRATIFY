import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import CategoriePage from './CategoriePage'

type Status = 'open' | 'progress' | 'resolved' | 'expired'

const statusLabels: Record<Status, string> = {
  open: 'Open',
  progress: 'In behandeling',
  resolved: 'Opgelost',
  expired: 'Verlopen',
}

const tickets: { id: string; subject: string; status: Status; date: string }[] = [
  { id: 'TK-1042', subject: 'Fout bij inloggen op het portaal', status: 'open', date: '15 sep 2026' },
  { id: 'TK-1041', subject: 'Dubbele factuur in augustus', status: 'progress', date: '14 sep 2026' },
  { id: 'TK-1040', subject: 'Aanvraag nieuwe laptop', status: 'resolved', date: '12 sep 2026' },
  { id: 'TK-1039', subject: 'E-mails van extern domein komen niet aan', status: 'expired', date: '8 sep 2026' },
  { id: 'TK-1038', subject: 'Printer op de tweede verdieping storing', status: 'open', date: '16 sep 2026' },
  { id: 'TK-1037', subject: 'Toegang tot gedeelde map aanvragen', status: 'progress', date: '17 sep 2026' },
  { id: 'TK-1036', subject: 'Wachtwoord vergeten', status: 'resolved', date: '10 sep 2026' },
  { id: 'TK-1035', subject: 'VPN verbreekt steeds de verbinding', status: 'open', date: '18 sep 2026' },
  { id: 'TK-1034', subject: 'Nieuwe medewerker account aanmaken', status: 'progress', date: '19 sep 2026' },
  { id: 'TK-1033', subject: 'Monitor flikkert', status: 'resolved', date: '9 sep 2026' },
  { id: 'TK-1032', subject: 'Software-installatie Adobe', status: 'expired', date: '5 sep 2026' },
  { id: 'TK-1031', subject: 'Wifi traag in vergaderruimte', status: 'open', date: '20 sep 2026' },
]

const filters: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'open', label: 'Open' },
  { key: 'progress', label: 'In behandeling' },
  { key: 'resolved', label: 'Opgelost' },
  { key: 'expired', label: 'Verlopen' },
]

const PAGE_SIZE = 4

const API_URL = 'http://localhost:3000'

const stats: { label: string; status: Status; className: string }[] = [
  { label: 'OPEN', status: 'open', className: 'stat-open' },
  { label: 'IN BEHANDELING', status: 'progress', className: 'stat-progress' },
  { label: 'OPGELOST', status: 'resolved', className: 'stat-resolved' },
  { label: 'VERLOPEN', status: 'expired', className: 'stat-expired' },
]

function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [view, setView] = useState<'tickets' | 'categories'>('tickets')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [page, setPage] = useState(1)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })
      const data = await res.json()

      if (res.ok) {
        setLoggedInUser(data.name)
        setError('')
        setPassword('')
      } else {
        setError(data.error || 'Inloggen mislukt')
      }
    } catch {
      setError('Server niet bereikbaar')
    }
  }

  function handleLogout() {
    setLoggedInUser(null)
    setName('')
    setView('tickets')
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = filter === 'all' || ticket.status === filter
    const q = search.trim().toLowerCase()
    const matchesSearch =
      ticket.subject.toLowerCase().includes(q) ||
      ticket.id.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const visibleTickets = filteredTickets.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  function changeFilter(newFilter: 'all' | Status) {
    setFilter(newFilter)
    setPage(1)
  }
  function changeSearch(text: string) {
    setSearch(text)
    setPage(1)
  }

  if (!loggedInUser) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1 className="logo">
            KRAT<span>TY</span>
          </h1>
          <h2 className="page-title">Inloggen</h2>
          <input
            type="text"
            placeholder="Naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Inloggen</button>
        </form>
      </main>
    )
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <h1 className="logo">
              KRAT<span>TY</span>
            </h1>
            <nav className="nav-tabs">
              <button
                className={`nav-tab ${view === 'tickets' ? 'active' : ''}`}
                onClick={() => setView('tickets')}
              >
                Alle Tickets
              </button>
              <button
                className={`nav-tab ${view === 'categories' ? 'active' : ''}`}
                onClick={() => setView('categories')}
              >
                Categorieën
              </button>
            </nav>
          </div>

          <span className="user-label">
            <span className="user-name">{loggedInUser}</span>
            <span className="avatar">
              {loggedInUser.slice(0, 2).toUpperCase()}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Uitloggen
            </button>
          </span>
        </div>
      </header>

      {view === 'categories' ? (
        <CategoriePage onViewAll={() => setView('tickets')} />
      ) : (
        <main className="container">
          <h2 className="page-title">Ticketoverzicht</h2>

          <section className="stats">
            {stats.map((stat) => (
              <div key={stat.label} className={`stat-card ${stat.className}`}>
                <div className="stat-top">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-dot"></span>
                </div>
                <span className="stat-value">
                  {tickets.filter((t) => t.status === stat.status).length}
                </span>
              </div>
            ))}
          </section>

          <section className="tickets-card">
            <div className="tickets-header">
              <h3>
                Recente tickets{' '}
                <span className="tickets-count">
                  ({visibleTickets.length} van {filteredTickets.length})
                </span>
              </h3>

              <div className="tickets-controls">
                <input
                  type="text"
                  className="ticket-search"
                  placeholder="Ticket zoeken..."
                  value={search}
                  onChange={(e) => changeSearch(e.target.value)}
                />
                {filters.map((f) => (
                  <button
                    key={f.key}
                    className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                    onClick={() => changeFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ONDERWERP</th>
                  <th>STATUS</th>
                  <th>VERLOOPDATUM</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={ticket.status === 'expired' ? 'row-expired' : ''}
                  >
                    <td>
                      <div className="ticket-subject">{ticket.subject}</div>
                      <div className="ticket-id">{ticket.id}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.status}`}>
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td
                      className={
                        ticket.status === 'expired' ? 'date date-expired' : 'date'
                      }
                    >
                      {ticket.date}
                    </td>
                  </tr>
                ))}
                {visibleTickets.length === 0 && (
                  <tr>
                    <td colSpan={3} className="no-results">
                      Geen tickets gevonden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="tickets-footer">
              <span>
                Pagina {page} van {totalPages} — {filteredTickets.length} tickets
              </span>
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={p === page ? 'active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </section>
        </main>
      )}
    </>
  )
}

export default App
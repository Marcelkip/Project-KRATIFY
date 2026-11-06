import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import CategoriePage from './CategoriePage'

type Ticket = {
  id: number
  topdeskId: string
  categorie: string
  subcategorie?: string | null
  korteBeschrijving?: string | null
  korteBeschrijvingAI?: string | null
  status?: string | null
  prioriteit?: string | null
  aanmaakDatum: string
  geslotenOp?: string | null
  oproepDatum?: string | null
  melderNaam?: string | null
  melder?: string | null
  melderLocatie?: string | null
  melderAfdeling?: string | null
  [key: string]: unknown
}

type TicketResponse = {
  data: Ticket[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

type TicketStats = {
  total: number
  open: number
  progress: number
  resolved: number
  expired: number
}

const API_URL = 'http://localhost:3000'
const AUTH_TOKEN_KEY = 'kratty_auth_token'
const PAGE_SIZE = 100

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return 'Geen datum'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Geen datum'
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function statusInfo(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase()
  if (value.includes('opgelost') || value.includes('resolved') || value.includes('afgerond')) {
    return { label: 'Opgelost', className: 'resolved' }
  }
  if (value.includes('behandel') || value.includes('progress') || value.includes('in behandeling')) {
    return { label: 'In behandeling', className: 'progress' }
  }
  if (value.includes('verlopen') || value.includes('expired')) {
    return { label: 'Verlopen', className: 'expired' }
  }
  return { label: 'Open', className: 'open' }
}

function reporterName(ticket: Ticket) {
  return ticket.melderNaam?.trim() || ticket.melder?.trim() || 'Geen melder'
}

function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)))
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState<'tickets' | 'categories'>('tickets')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState<TicketResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [openActions, setOpenActions] = useState<number | null>(null)
  const [savingPriority, setSavingPriority] = useState(false)
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, progress: 0, resolved: 0, expired: 0 })

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setAuthLoading(false)
      return
    }
    fetch(`${API_URL}/api/me`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          return
        }
        const user = await res.json() as { name?: string }
        if (user.name) setLoggedInUser(user.name)
      })
      .catch(() => setError('Sessie kon niet worden gecontroleerd'))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!loggedInUser || view !== 'tickets') return
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    })
    if (search.trim()) params.set('search', search.trim())
    if (status) params.set('status', status)
    Promise.all([
      fetch(`${API_URL}/api/tickets?${params}`, { headers: authHeaders(), signal: controller.signal }),
      fetch(`${API_URL}/api/tickets/stats`, { headers: authHeaders(), signal: controller.signal }),
    ])
      .then(async ([ticketsRes, statsRes]) => {
        if (!ticketsRes.ok || !statsRes.ok) throw new Error('Tickets ophalen mislukt')
        return await Promise.all([
          ticketsRes.json() as Promise<TicketResponse>,
          statsRes.json() as Promise<TicketStats>,
        ])
      })
      .then(([result, resultStats]) => {
        setTickets(result.data)
        setPagination(result.pagination)
        setStats(resultStats)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError('Tickets konden niet worden geladen')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [loggedInUser, view, page, search, status])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Inloggen mislukt')
        return
      }
      if (typeof data.token !== 'string' || typeof data.name !== 'string') {
        setError('Ongeldige loginreactie van de server')
        return
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      setLoggedInUser(data.name)
      setPassword('')
    } catch {
      setError('Server niet bereikbaar')
    }
  }

  async function handleLogout() {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    }).catch(() => undefined)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setLoggedInUser(null)
    setView('tickets')
  }

  async function changePriority(ticket: Ticket, priority: 'Hoog' | 'Normaal') {
    setSavingPriority(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prioriteit: priority }),
      })
      if (!res.ok) throw new Error('Prioriteit opslaan mislukt')
      const updated = await res.json() as Ticket
      setTickets((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSelectedTicket((current) => current?.id === updated.id ? updated : current)
      setOpenActions(null)
    } catch {
      setError('Prioriteit kon niet worden opgeslagen')
    } finally {
      setSavingPriority(false)
    }
  }

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeStatus(value: string) {
    setStatus(value)
    setPage(1)
  }

  if (authLoading) return <main className="login-page" aria-busy="true" />
  if (!loggedInUser) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1 className="logo">KRAT<span>TY</span></h1>
          <h2 className="page-title">Inloggen</h2>
          <input type="text" placeholder="Naam" value={name} onChange={(event) => setName(event.target.value)} />
          <input type="password" placeholder="Wachtwoord" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Inloggen</button>
        </form>
      </main>
    )
  }

  const totalPages = pagination?.totalPages ?? 1
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <h1 className="logo">KRAT<span>TY</span></h1>
            <nav className="nav-tabs">
              <button className={`nav-tab ${view === 'tickets' ? 'active' : ''}`} onClick={() => setView('tickets')}>Alle Tickets</button>
              <button className={`nav-tab ${view === 'categories' ? 'active' : ''}`} onClick={() => setView('categories')}>Categorieën</button>
            </nav>
          </div>
          <span className="user-label">
            <span className="user-name">{loggedInUser}</span>
            <span className="avatar">{loggedInUser.slice(0, 2).toUpperCase()}</span>
            <button className="logout-btn" onClick={handleLogout}>Uitloggen</button>
          </span>
        </div>
      </header>

      {view === 'categories' ? <CategoriePage /> : (
        <main className="container">
          <h2 className="page-title">Ticketoverzicht</h2>
          {error && <p className="api-error">{error}</p>}
          <section className="stats">
            {[
              ['TOTAAL', stats.total, 'stat-total'],
              ['OPEN', stats.open, 'stat-open'],
              ['IN BEHANDELING', stats.progress, 'stat-progress'],
              ['OPGELOST', stats.resolved, 'stat-resolved'],
              ['VERLOPEN', stats.expired, 'stat-expired'],
            ].map(([label, count, className]) => (
              <div key={label} className={`stat-card ${className}`}>
                <div className="stat-top"><span className="stat-label">{label}</span>{className !== 'stat-total' && <span className="stat-dot" />}</div>
                <span className="stat-value">{count}</span>
              </div>
            ))}
          </section>
          <section className="tickets-card">
            <div className="tickets-header">
              <h3>Recente tickets <span className="tickets-count">({tickets.length} van {pagination?.total ?? 0})</span></h3>
              <div className="tickets-controls">
                <input className="ticket-search" type="search" placeholder="⌕  Ticket zoeken..." value={search} onChange={(event) => changeSearch(event.target.value)} />
                {[
                  ['', 'Alle'],
                  ['open', 'Open'],
                  ['in behandeling', 'In behandeling'],
                  ['opgelost', 'Opgelost'],
                  ['verlopen', 'Verlopen'],
                ].map(([value, label]) => <button key={value} className={`filter-btn ${status === value ? 'active' : ''}`} onClick={() => changeStatus(value)}>{label}</button>)}
              </div>
            </div>
            <div className="table-scroll">
              <table className="tickets-table">
                <thead><tr><th>ONDERWERP</th><th>CATEGORIE</th><th>STATUS</th><th>PRIORITEIT</th><th>VERLOOPDATUM</th><th>ACTIES</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="no-results">Tickets laden...</td></tr>}
                  {!loading && tickets.map((ticket) => {
                    const info = statusInfo(ticket.status)
                    return (
                      <tr key={ticket.id} className={info.className === 'expired' ? 'row-expired' : ''}>
                        <td><div className="ticket-subject">{ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'}</div><div className="ticket-id">{ticket.topdeskId}</div></td>
                        <td><span className="category-chip">{ticket.categorie || 'Geen categorie'}</span></td>
                        <td><span className={`badge badge-${info.className}`}>{info.label}</span></td>
                        <td><span className={`priority priority-${(ticket.prioriteit ?? 'Normaal').toLowerCase()}`}>{ticket.prioriteit || 'Normaal'}</span></td>
                        <td className="date">{formatDate(ticket.geslotenOp || ticket.oproepDatum)}</td>
                        <td className="actions-cell">
                          <button className="actions-button" aria-label="Acties openen" onClick={() => setOpenActions(openActions === ticket.id ? null : ticket.id)}>⋮</button>
                          {openActions === ticket.id && <div className="actions-menu"><button onClick={() => { setSelectedTicket(ticket); setOpenActions(null) }}>☷&nbsp; Details bekijken</button><button onClick={() => void changePriority(ticket, ticket.prioriteit?.toLowerCase() === 'hoog' ? 'Normaal' : 'Hoog')} disabled={savingPriority}>{savingPriority ? 'Opslaan...' : 'Prioriteit aanpassen'}</button></div>}
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && tickets.length === 0 && <tr><td colSpan={6} className="no-results">Geen tickets gevonden</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="tickets-footer">
              <span>Pagina {page} van {totalPages} — {pagination?.total ?? 0} tickets</span>
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                <button className="active">{page}</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </section>
        </main>
      )}
      {selectedTicket && <TicketDetails ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onPriorityChange={(priority) => void changePriority(selectedTicket, priority)} />}
    </>
  )
}

function TicketDetails({ ticket, onClose, onPriorityChange }: { ticket: Ticket; onClose: () => void; onPriorityChange: (priority: 'Hoog' | 'Normaal') => void }) {
  const info = statusInfo(ticket.status)
  const priority = ticket.prioriteit?.toLowerCase() === 'hoog' ? 'Hoog' : 'Normaal'
  return (
    <div className="details-overlay" role="presentation" onClick={onClose}>
      <aside className="details-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="details-heading"><div><div className="ticket-id">{ticket.topdeskId}</div><h2>{ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'}</h2></div><button className="details-close" onClick={onClose}>×</button></div>
        <div className="details-content">
          <p className="details-label">TICKETINFORMATIE</p>
          <div className="details-grid">
            <div><span>Status</span><strong><span className={`badge badge-${info.className}`}>{info.label}</span></strong></div>
            <div><span>Prioriteit</span><strong><select value={priority} onChange={(event) => onPriorityChange(event.target.value as 'Hoog' | 'Normaal')}><option>Hoog</option><option>Normaal</option></select></strong></div>
            <div><span>Melder</span><strong>{reporterName(ticket)}</strong></div>
            <div><span>Categorie</span><strong>{ticket.categorie || 'Geen categorie'}</strong></div>
            <div><span>Aangemaakt</span><strong>{formatDate(ticket.aanmaakDatum, true)}</strong></div>
            <div><span>Verloopdatum</span><strong>{formatDate(ticket.geslotenOp || ticket.oproepDatum)}</strong></div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default App

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
  aanmaakDatum: string
  geslotenOp?: string | null
  oproepDatum?: string | null
  melderNaam?: string | null
  melder?: string | null
  melderLocatie?: string | null
  melderAfdeling?: string | null
  melderRol?: string | null
  [key: string]: unknown
}

type TicketResponse = {
  data: Ticket[]
  pagination: { page: number; pageSize: number; total: number; totalOverall: number; totalPages: number }
}

const API_URL = 'http://localhost:3000'
const AUTH_TOKEN_KEY = 'kratty_auth_token'
const PAGE_SIZE = 100
type SortOption = 'newest' | 'oldest'

const categories = [
  'Hardware',
  'Account & Inloggen',
  'Facturatie',
  'Netwerk & E-mail',
  'Printer & Scannen',
  'Beveiliging',
]

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

function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)))
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState<'tickets' | 'categories'>('tickets')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState<TicketResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [openActions, setOpenActions] = useState<number | null>(null)

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
    params.set('sort', sort)
    if (category) params.set('categorie', category)
    fetch(`${API_URL}/api/tickets?${params}`, { headers: authHeaders(), signal: controller.signal })
      .then(async (ticketsRes) => {
        if (!ticketsRes.ok) throw new Error('Tickets ophalen mislukt')
        return await ticketsRes.json() as TicketResponse
      })
      .then((result) => {
        setTickets(result.data)
        setPagination(result.pagination)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError('Tickets konden niet worden geladen')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [loggedInUser, view, page, search, sort, category])

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

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeSort(value: SortOption) {
    setSort(value)
    setPage(1)
  }

  function changeCategory(value: string) {
    setCategory(value)
    setPage(1)
  }

  if (authLoading) return <main className="login-page" aria-busy="true" />
  if (!loggedInUser) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1 className="logo">KRA<span>TIFY</span></h1>
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
            <h1 className="logo">KRAT<span>IFY</span></h1>
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
            <div className="stat-card stat-total">
              <div className="stat-top"><span className="stat-label">ALLE TICKETS</span><span className="stat-icon">#</span></div>
              <span className="stat-value">{pagination?.totalOverall ?? 0}</span>
              <span className="stat-caption">Alle tickets uit de database</span>
            </div>
            <div className="stat-card stat-filtered">
              <div className="stat-top"><span className="stat-label">{category || 'HUIDIGE SELECTIE'}</span><span className="stat-icon">#</span></div>
              <span className="stat-value">{pagination?.total ?? 0}</span>
              <span className="stat-caption">{category ? `Tickets in ${category}` : 'Tickets die aan de zoekopdracht voldoen'}</span>
            </div>
          </section>
          <section className="tickets-card">
            <div className="tickets-header">
              <h3>Recente tickets <span className="tickets-count">({tickets.length} van {pagination?.total ?? 0})</span></h3>
              <div className="tickets-controls">
                <input className="ticket-search" type="search" placeholder="⌕  Ticket zoeken..." value={search} onChange={(event) => changeSearch(event.target.value)} />
                <label className="sort-control">
                  <span>Sorteer op</span>
                  <select value={sort} onChange={(event) => changeSort(event.target.value as SortOption)}>
                    <option value="newest">Nieuwste eerst</option>
                    <option value="oldest">Oudste eerst</option>
                  </select>
                </label>
                <label className="sort-control">
                  <span>Categorie</span>
                  <select value={category} onChange={(event) => changeCategory(event.target.value)}>
                    <option value="">Alle categorieën</option>
                    {categories.map((categoryName) => <option key={categoryName} value={categoryName}>{categoryName}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="table-scroll">
              <table className="tickets-table">
                <thead><tr><th>ONDERWERP</th><th>CATEGORIE</th><th>AANGMAAKDATUM</th><th>ACTIES</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={4} className="no-results">Tickets laden...</td></tr>}
                  {!loading && tickets.map((ticket) => {
                    return (
                      <tr key={ticket.id}>
                        <td><div className="ticket-subject">{ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'}</div><div className="ticket-id">{ticket.topdeskId}</div></td>
                        <td><span className="category-chip">{ticket.categorie || 'Geen categorie'}</span></td>
                        <td className="date">{formatDate(ticket.aanmaakDatum)}</td>
                        <td className="actions-cell">
                          <button className="actions-button" aria-label="Acties openen" onClick={() => setOpenActions(openActions === ticket.id ? null : ticket.id)}>⋮</button>
                          {openActions === ticket.id && <div className="actions-menu"><button onClick={() => { setSelectedTicket(ticket); setOpenActions(null) }}>☷&nbsp; Details bekijken</button></div>}
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && tickets.length === 0 && <tr><td colSpan={4} className="no-results">Geen tickets gevonden</td></tr>}
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
      {selectedTicket && <TicketDetails ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </>
  )
}

function TicketDetails({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const subject = ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'
  const reporter = ticket.melderNaam?.trim() || ticket.melder?.trim() || 'Geen melder'

  return (
    <div className="details-overlay" role="presentation" onClick={onClose}>
      <aside className="details-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="details-heading">
          <div><div className="ticket-id">{ticket.topdeskId}</div><h2>{subject}</h2></div>
          <button className="details-close" onClick={onClose} aria-label="Details sluiten">×</button>
        </div>
        <div className="details-content">
          <p className="details-label">TICKETINFORMATIE</p>
          <div className="details-grid">
            <div><span>Melder</span><strong>{reporter}</strong></div>
            <div><span>Afdeling</span><strong>{ticket.melderAfdeling || 'Onbekend'}</strong></div>
            <div><span>Locatie</span><strong>{ticket.melderLocatie || 'Onbekend'}</strong></div>
            <div><span>Rol</span><strong>{ticket.melderRol || 'Onbekend'}</strong></div>
            <div><span>Categorie</span><strong>{ticket.categorie || 'Geen categorie'}</strong></div>
            <div><span>Subcategorie</span><strong>{ticket.subcategorie || 'Geen subcategorie'}</strong></div>
            <div><span>Aangemaakt</span><strong>{formatDate(ticket.aanmaakDatum, true)}</strong></div>
            <div><span>Verloopdatum</span><strong>{formatDate(ticket.geslotenOp || ticket.oproepDatum)}</strong></div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default App

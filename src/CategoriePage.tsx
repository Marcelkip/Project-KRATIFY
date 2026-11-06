import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Status = 'open' | 'progress' | 'resolved' | 'expired'
type CategoryTicket = {
  id: number
  topdeskId: string
  korteBeschrijving?: string | null
  korteBeschrijvingAI?: string | null
  status?: string | null
  prioriteit?: string | null
  aanmaakDatum: string
}
type Category = { name: string; icon: ReactNode; total: number; tickets: CategoryTicket[] }
type CategoryResponse = { data: { name: string; total: number; tickets: CategoryTicket[] }[]; pagination: { total: number; totalPages: number } }

const API_URL = 'http://localhost:3000'
const AUTH_TOKEN_KEY = 'kratty_auth_token'
const iconProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const categoryDefinitions: Omit<Category, 'total' | 'tickets'>[] = [
  { name: 'Hardware', icon: <svg {...iconProps}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg> },
  { name: 'Account & Inloggen', icon: <svg {...iconProps}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg> },
  { name: 'Facturatie', icon: <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></svg> },
  { name: 'Netwerk & E-mail', icon: <svg {...iconProps}><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" /></svg> },
  { name: 'Printer & Scannen', icon: <svg {...iconProps}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg> },
  { name: 'Beveiliging', icon: <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
]

const statusLabels: Record<Status, string> = { open: 'Open', progress: 'In behandeling', resolved: 'Opgelost', expired: 'Verlopen' }
const summary: { label: string; status: Status; className: string }[] = [
  { label: 'Open', status: 'open', className: 'summary-open' },
  { label: 'In behandeling', status: 'progress', className: 'summary-progress' },
  { label: 'Opgelost', status: 'resolved', className: 'summary-resolved' },
  { label: 'Verlopen', status: 'expired', className: 'summary-expired' },
]

function headers(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function statusInfo(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase()
  if (value.includes('opgelost') || value.includes('resolved') || value.includes('afgerond')) return { label: 'Opgelost', className: 'resolved' as Status }
  if (value.includes('behandel') || value.includes('progress')) return { label: 'In behandeling', className: 'progress' as Status }
  if (value.includes('verlopen') || value.includes('expired')) return { label: 'Verlopen', className: 'expired' as Status }
  return { label: 'Open', className: 'open' as Status }
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Geen datum'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Geen datum'
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function CategoriePage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCategories, setTotalCategories] = useState(categoryDefinitions.length)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), pageSize: '6', names: categoryDefinitions.map((category) => category.name).join(',') })
    if (search.trim()) params.set('search', search.trim())
    setLoading(true)
    fetch(`${API_URL}/api/tickets/categories?${params}`, { headers: headers(), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Categorieën ophalen mislukt')
        return await response.json() as CategoryResponse
      })
      .then((result) => {
        const byName = new Map(result.data.map((category) => [category.name, category]))
        setCategories(categoryDefinitions.map((definition) => ({ ...definition, ...(byName.get(definition.name) ?? { total: 0, tickets: [] }) })))
        setTotalCategories(result.pagination.total)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setCategories(categoryDefinitions.map((definition) => ({ ...definition, total: 0, tickets: [] })))
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [page, search])

  const query = search.trim().toLowerCase()
  const visibleCategories = query
    ? categories.filter((category) =>
        category.name.toLowerCase().includes(query) ||
        category.tickets.some((ticket) =>
          [ticket.topdeskId, ticket.korteBeschrijving, ticket.korteBeschrijvingAI]
            .some((value) => value?.toLowerCase().includes(query)),
        ),
      )
    : categories
  const allTickets = categories.flatMap((category) => category.tickets)
  const totalPages = Math.max(1, Math.ceil(totalCategories / 6))
  const summaryCount = (status: Status) => allTickets.filter((ticket) => statusInfo(ticket.status).className === status).length

  return (
    <main className="container">
      <div className="page-head"><div><h2 className="page-title">Tickets per Categorie</h2><p className="page-subtitle">Overzicht op categorieën</p></div><div className="cat-search"><input type="search" placeholder="Zoek in categorieën..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div></div>
      <section className="summary">{summary.map((item) => <div key={item.label} className={`summary-card ${item.className}`}><span className="summary-dot" /><div><div className="summary-value">{summaryCount(item.status)}</div><div className="summary-label">{item.label}</div></div></div>)}</section>
      <section className="cat-grid">
        {loading && <p className="cat-empty">Categorieën laden...</p>}
        {!loading && visibleCategories.map((category) => (
          <article key={category.name} className="cat-card">
            <div className="cat-header"><div className="cat-title"><span className="cat-icon">{category.icon}</span><h3>{category.name}</h3></div><span className="cat-badge">{category.total} tickets</span></div>
            <div className="cat-ticket-scroll">
              {category.tickets.map((ticket) => { const info = statusInfo(ticket.status); return <div key={ticket.id} className="cat-ticket"><div><div className="cat-ticket-subject">{ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'}</div><div className="cat-ticket-meta">{ticket.topdeskId} · {formatDate(ticket.aanmaakDatum)}</div></div><span className={`badge badge-${info.className}`}>{statusLabels[info.className]}</span></div> })}
              {category.tickets.length === 0 && <p className="cat-empty">Geen tickets in deze categorie</p>}
            </div>
            <button className="cat-link" onClick={() => setSelectedCategory(category)}>Bekijk alle {category.name} tickets →</button>
          </article>
        ))}
      </section>
      <footer className="cat-footer"><span>Totaal <strong>{allTickets.length}</strong> geladen tickets over <strong>{totalCategories}</strong> categorieën</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button><button className="active">{page}</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button></div><span className="cat-copyright">© 2026 Kratty IT Support</span></footer>
      {selectedCategory && (
        <CategoryPanel category={selectedCategory} onClose={() => setSelectedCategory(null)} />
      )}
    </main>
  )
}

function CategoryPanel({ category, onClose }: { category: Category; onClose: () => void }) {
  return (
    <div className="category-panel-overlay" role="presentation" onClick={onClose}>
      <aside className="category-panel" role="dialog" aria-modal="true" aria-label={`${category.name} tickets`} onClick={(event) => event.stopPropagation()}>
        <div className="category-panel-header">
          <div>
            <p className="details-label">CATEGORIE</p>
            <h2>{category.name}</h2>
            <span>{category.total} tickets</span>
          </div>
          <button className="details-close" onClick={onClose} aria-label="Paneel sluiten">×</button>
        </div>
        <div className="category-panel-list">
          {category.tickets.length === 0 && <p className="cat-empty">Geen tickets in deze categorie</p>}
          {category.tickets.map((ticket) => {
            const info = statusInfo(ticket.status)
            return (
              <article key={ticket.id} className="category-panel-ticket">
                <div>
                  <strong>{ticket.korteBeschrijving || ticket.korteBeschrijvingAI || 'Geen onderwerp'}</strong>
                  <span>{ticket.topdeskId}</span>
                  <small>{formatDate(ticket.aanmaakDatum)}</small>
                </div>
                <div className="category-panel-ticket-badges">
                  <span className={`badge badge-${info.className}`}>{info.label}</span>
                  <span className={`priority priority-${(ticket.prioriteit ?? 'Normaal').toLowerCase()}`}>{ticket.prioriteit || 'Normaal'}</span>
                </div>
              </article>
            )
          })}
        </div>
      </aside>
    </div>
  )
}

export default CategoriePage

import { useState } from 'react'
import type { ReactNode } from 'react'

type Status = 'open' | 'progress' | 'resolved' | 'expired'

const statusLabels: Record<Status, string> = {
  open: 'Open',
  progress: 'In behandeling',
  resolved: 'Opgelost',
  expired: 'Verlopen',
}

type CategoryTicket = { id: string; subject: string; status: Status; date: string }
type Category = { name: string; icon: ReactNode; tickets: CategoryTicket[] }

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const categories: Category[] = [
  {
    name: 'Hardware',
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1040', subject: 'Aanvraag nieuwe laptop', status: 'open', date: '12 sep 2026' },
      { id: 'TK-1038', subject: 'Scherm flikkert bij opstarten', status: 'progress', date: '10 sep 2026' },
      { id: 'TK-1035', subject: 'Toetsenbord reageert niet', status: 'resolved', date: '08 sep 2026' },
      { id: 'TK-1031', subject: 'Docking station defect', status: 'expired', date: '05 sep 2026' },
    ],
  },
  {
    name: 'Account & Inloggen',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1042', subject: 'Wachtwoord vergeten - Office 365', status: 'open', date: '13 sep 2026' },
      { id: 'TK-1039', subject: 'VPN verbinding mislukt', status: 'progress', date: '11 sep 2026' },
      { id: 'TK-1036', subject: 'Twee-factor authenticatie instellen', status: 'open', date: '09 sep 2026' },
      { id: 'TK-1030', subject: 'Account geblokkeerd na vakantie', status: 'resolved', date: '04 sep 2026' },
    ],
  },
  {
    name: 'Facturatie',
    icon: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1044', subject: 'Factuur niet ontvangen - aug 2026', status: 'open', date: '14 sep 2026' },
      { id: 'TK-1041', subject: 'Onjuist bedrag in abonnement', status: 'progress', date: '12 sep 2026' },
      { id: 'TK-1033', subject: 'Creditnota aanvragen', status: 'resolved', date: '07 sep 2026' },
      { id: 'TK-1028', subject: 'BTW-nummer aanpassen', status: 'resolved', date: '02 sep 2026' },
    ],
  },
  {
    name: 'Netwerk & E-mail',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="2" />
        <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1045', subject: 'Wifi werkt niet op verdieping 3', status: 'open', date: '15 sep 2026' },
      { id: 'TK-1043', subject: 'E-mails komen niet aan', status: 'progress', date: '13 sep 2026' },
      { id: 'TK-1037', subject: 'Langzame internetverbinding', status: 'expired', date: '10 sep 2026' },
      { id: 'TK-1034', subject: 'Shared mailbox toegang aanvragen', status: 'open', date: '08 sep 2026' },
    ],
  },
  {
    name: 'Printer & Scannen',
    icon: (
      <svg {...iconProps}>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1046', subject: 'Printer offline na update', status: 'open', date: '15 sep 2026' },
      { id: 'TK-1032', subject: 'Scanner herkent documenten niet', status: 'progress', date: '06 sep 2026' },
      { id: 'TK-1029', subject: 'Toner vervangen', status: 'resolved', date: '03 sep 2026' },
      { id: 'TK-1027', subject: 'Printer papier vastgelopen', status: 'resolved', date: '01 sep 2026' },
    ],
  },
  {
    name: 'Beveiliging',
    icon: (
      <svg {...iconProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    tickets: [
      { id: 'TK-1047', subject: 'Verdachte inlogpoging gemeld', status: 'open', date: '16 sep 2026' },
      { id: 'TK-1040', subject: 'Antivirus verloopt binnenkort', status: 'progress', date: '12 sep 2026' },
      { id: 'TK-1026', subject: 'USB-beveiliging instellen', status: 'resolved', date: '30 aug 2026' },
      { id: 'TK-1022', subject: 'Data-lek rapport opgesteld', status: 'expired', date: '25 aug 2026' },
    ],
  },
]

const summary: { label: string; status: Status; className: string }[] = [
  { label: 'Open', status: 'open', className: 'summary-open' },
  { label: 'In behandeling', status: 'progress', className: 'summary-progress' },
  { label: 'Opgelost', status: 'resolved', className: 'summary-resolved' },
  { label: 'Verlopen', status: 'expired', className: 'summary-expired' },
]

const CATEGORIES_PER_PAGE = 6

function CategoriePage({ onViewAll }: { onViewAll: () => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const allTickets = categories.flatMap((c) => c.tickets)

  const q = search.trim().toLowerCase()
  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.tickets.some(
        (t) =>
          t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      )
  )

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE)
  )
  const visibleCategories = filteredCategories.slice(
    (page - 1) * CATEGORIES_PER_PAGE,
    page * CATEGORIES_PER_PAGE
  )

  function changeSearch(text: string) {
    setSearch(text)
    setPage(1)
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h2 className="page-title">Tickets per Categorie</h2>
          <p className="page-subtitle">
            Overzicht van alle supportverzoeken, gegroepeerd op categorie
          </p>
        </div>

        <div className="cat-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Zoek in categorieën..."
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="summary">
        {summary.map((s) => (
          <div key={s.label} className={`summary-card ${s.className}`}>
            <span className="summary-dot"></span>
            <div>
              <div className="summary-value">
                {allTickets.filter((t) => t.status === s.status).length}
              </div>
              <div className="summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="cat-grid">
        {visibleCategories.map((category) => (
          <article key={category.name} className="cat-card">
            <div className="cat-header">
              <div className="cat-title">
                <span className="cat-icon">{category.icon}</span>
                <h3>{category.name}</h3>
              </div>
              <span className="cat-badge">
                {
                  category.tickets.filter(
                    (t) => t.status === 'open' || t.status === 'progress'
                  ).length
                }{' '}
                actief
              </span>
            </div>

            {category.tickets.map((ticket) => (
              <div key={ticket.id} className="cat-ticket">
                <div>
                  <div className="cat-ticket-subject">{ticket.subject}</div>
                  <div className="cat-ticket-meta">
                    {ticket.id} · {ticket.date}
                  </div>
                </div>
                <span className={`badge badge-${ticket.status}`}>
                  {statusLabels[ticket.status]}
                </span>
              </div>
            ))}

            <button className="cat-link" onClick={onViewAll}>
              Bekijk alle {category.name} tickets →
            </button>
          </article>
        ))}

        {visibleCategories.length === 0 && (
          <p className="cat-empty">Geen categorieën gevonden</p>
        )}
      </section>

      <footer className="cat-footer">
        <span>
          Totaal <strong>{allTickets.length}</strong> tickets over{' '}
          <strong>{categories.length}</strong> categorieën
        </span>

        <div className="pagination">
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
            →
          </button>
        </div>

        <span className="cat-copyright">© 2026 Kratty IT Support</span>
      </footer>
    </main>
  )
}

export default CategoriePage
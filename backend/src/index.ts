import 'dotenv/config'
import crypto from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { PrismaClient, Prisma } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL ontbreekt. Maak backend/.env aan op basis van backend/.env.example.')
}

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT ?? 3000)
const sessionLifetimeMs = 8 * 60 * 60 * 1000
const sessions = new Map<string, { userId: string; expiresAt: number }>()
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

app.disable('x-powered-by')
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})

type AuthenticatedRequest = Request & { userId?: string }

function text(value: unknown, field: string, required = false): string | undefined {
  if (typeof value !== 'string') {
    if (required) throw new HttpError(400, `${field} is verplicht`)
    return undefined
  }
  const result = value.trim()
  if (required && result.length === 0) throw new HttpError(400, `${field} is verplicht`)
  return result || undefined
}

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'Ongeldig ticket-id')
  return id
}

function routeParam(value: string | string[]): string {
  if (Array.isArray(value)) throw new HttpError(400, 'Ongeldige routeparameter')
  return value
}

function queryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, saltHex, hashHex] = stored.split('$')
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false

  try {
    const expected = Buffer.from(hashHex, 'hex')
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function getToken(req: Request): string | undefined {
  const header = req.header('authorization')
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined
}

function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = getToken(req)
  const session = token ? sessions.get(token) : undefined

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token)
    return next(new HttpError(401, 'Authenticatie vereist'))
  }

  req.userId = session.userId
  next()
}

function allowLoginAttempt(key: string): boolean {
  const now = Date.now()
  const current = loginAttempts.get(key)
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (current.count >= 10) return false
  current.count += 1
  return true
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key)
}

app.get('/', (_req, res) => {
  res.json({ message: 'KRATTY backend werkt!' })
})

app.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'ok' })
  } catch (error) {
    next(error)
  }
})

app.post(['/api/auth/login', '/login'], async (req, res, next) => {
  try {
    const identifier = text(req.body?.name ?? req.body?.email, 'naam of e-mail', true)!.toLowerCase()
    const password = text(req.body?.password, 'wachtwoord', true)!
    const attemptKey = `${req.ip}:${identifier}`
    if (!allowLoginAttempt(attemptKey)) throw new HttpError(429, 'Te veel pogingen. Probeer later opnieuw.')

    const user = await prisma.gebruiker.findFirst({
      where: { OR: [{ emailadres: identifier }, { naam: { equals: identifier, mode: 'insensitive' } }] },
    })
    if (!user || !verifyPassword(password, user.wachtwoord)) {
      throw new HttpError(401, 'Onjuiste naam of wachtwoord')
    }

    clearLoginAttempts(attemptKey)
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionLifetimeMs })
    res.json({
      token,
      name: user.naam,
      user: { id: user.id, name: user.naam, email: user.emailadres },
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const token = getToken(req)
  if (token) sessions.delete(token)
  res.status(204).send()
})

app.get('/api/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.gebruiker.findUnique({
      where: { id: req.userId },
      select: { id: true, naam: true, emailadres: true },
    })
    if (!user) throw new HttpError(401, 'Gebruiker bestaat niet meer')
    res.json({ id: user.id, name: user.naam, email: user.emailadres })
  } catch (error) {
    next(error)
  }
})

app.get('/api/tickets', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 100)))
    if (!Number.isInteger(page) || !Number.isInteger(pageSize)) throw new HttpError(400, 'Ongeldige paginering')
    const search = text(queryValue(req.query.search), 'search')
    const status = text(queryValue(req.query.status), 'status')
    const category = text(queryValue(req.query.categorie), 'categorie')
    const sort = text(queryValue(req.query.sort), 'sort') ?? 'newest'
    const validSorts = new Set(['newest', 'oldest'])
    if (!validSorts.has(sort)) throw new HttpError(400, 'Ongeldige sortering')
    const where: Prisma.MeldingWhereInput = {
      ...(status && { status: { equals: status, mode: 'insensitive' } }),
      ...(category && { categorie: category }),
      ...(search && {
        OR: [
          { topdeskId: { contains: search, mode: 'insensitive' } },
          { korteBeschrijving: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
    const orderBy: Prisma.MeldingOrderByWithRelationInput =
      sort === 'oldest' ? { aanmaakDatum: 'asc' }
        : { aanmaakDatum: 'desc' }
    const [tickets, total, totalOverall] = await prisma.$transaction([
      prisma.melding.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.melding.count({ where }),
      prisma.melding.count(),
    ])
    res.json({ data: tickets, pagination: { page, pageSize, total, totalOverall, totalPages: Math.ceil(total / pageSize) } })
  } catch (error) {
    next(error)
  }
})

app.get('/api/tickets/categories', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(20, Math.max(1, Number(req.query.pageSize ?? 6)))
    const search = text(queryValue(req.query.search), 'search')?.toLowerCase()
    const namesValue = text(queryValue(req.query.names), 'names')
    const requestedNames = namesValue?.split(',').map((name) => name.trim()).filter(Boolean) ?? []
    if (!Number.isInteger(page) || !Number.isInteger(pageSize)) throw new HttpError(400, 'Ongeldige paginering')

    const categoryWhere: Prisma.CategorieWhereInput = search ? {
      OR: [
        { naam: { contains: search, mode: 'insensitive' } },
        { meldingen: { some: {
          OR: [
            { topdeskId: { contains: search, mode: 'insensitive' } },
            { korteBeschrijving: { contains: search, mode: 'insensitive' } },
            { korteBeschrijvingAI: { contains: search, mode: 'insensitive' } },
          ],
        } } },
      ],
    } : {}
    const grouped = await prisma.categorie.findMany({
      where: categoryWhere,
      orderBy: { naam: 'asc' },
      select: { id: true, naam: true },
    })
    const groupedNames = new Set(grouped.map((category) => category.naam))
    const categoryIds = new Map(grouped.map((category) => [category.naam, category.id]))
    const allNames = requestedNames.length > 0
      ? requestedNames.filter((name) => !search || groupedNames.has(name))
      : grouped.map((category) => category.naam)
    const total = allNames.length
    const selected = allNames.slice((page - 1) * pageSize, page * pageSize)
    const categories = await Promise.all(selected.map(async (name: string) => ({
      name,
      total: await prisma.melding.count({ where: {
        categorieId: categoryIds.get(name),
        ...(search && {
          OR: [
            { topdeskId: { contains: search, mode: 'insensitive' } },
            { korteBeschrijving: { contains: search, mode: 'insensitive' } },
            { korteBeschrijvingAI: { contains: search, mode: 'insensitive' } },
          ],
        }),
      } }),
      tickets: await prisma.melding.findMany({
        where: {
          categorieId: categoryIds.get(name),
          ...(search && {
            OR: [
              { topdeskId: { contains: search, mode: 'insensitive' } },
              { korteBeschrijving: { contains: search, mode: 'insensitive' } },
              { korteBeschrijvingAI: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: { aanmaakDatum: 'desc' },
        select: {
          id: true,
          topdeskId: true,
          korteBeschrijving: true,
          korteBeschrijvingAI: true,
          aanmaakDatum: true,
        },
      }),
    })))
    res.json({
      data: categories,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/tickets/:id', requireAuth, async (req, res, next) => {
  try {
    const ticket = await prisma.melding.findUnique({ where: { id: parseId(routeParam(req.params.id)) } })
    if (!ticket) throw new HttpError(404, 'Ticket niet gevonden')
    res.json(ticket)
  } catch (error) {
    next(error)
  }
})

app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint niet gevonden')))

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Record niet gevonden' })
      return
    }
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Dit record bestaat al' })
      return
    }
  }
  console.error(error)
  res.status(500).json({ error: 'Interne serverfout' })
})

const server = app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`)
})

async function shutdown(signal: string) {
  console.log(`${signal} ontvangen, server wordt afgesloten`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

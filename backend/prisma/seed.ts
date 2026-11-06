import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

async function main() {
  const name = process.env.ADMIN_NAME?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!name || !email || !password || password.length < 12) {
    throw new Error('Zet ADMIN_NAME, ADMIN_EMAIL en ADMIN_PASSWORD (minimaal 12 tekens) in voordat je seed draait.')
  }

  await prisma.gebruiker.upsert({
    where: { emailadres: email },
    update: { naam: name, wachtwoord: hashPassword(password) },
    create: { naam: name, emailadres: email, wachtwoord: hashPassword(password) },
  })

  await prisma.melding.deleteMany({
    where: {
      OR: [
        { topdeskId: { startsWith: 'DEMO-WIFI-' } },
        { topdeskId: { startsWith: 'DEMO-TICKET-' } },
      ],
    },
  })

  await prisma.melding.upsert({
    where: { topdeskId: 'DEMO-WIFI-001' },
    update: {
      categorie: 'Netwerk & E-mail',
      subcategorie: 'Draadloos netwerk',
      korteBeschrijvingAI: 'Wifi werkt niet in de vergaderruimte',
      korteBeschrijving: 'Wifi werkt niet in vergaderruimte B',
      melderNaam: 'Demo Medewerker',
      status: 'Open',
      prioriteit: 'Normaal',
    },
    create: {
      topdeskId: 'DEMO-WIFI-001',
      categorie: 'Netwerk & E-mail',
      subcategorie: 'Draadloos netwerk',
      systemen: ['Wifi'],
      probleemtypes: ['Verbinding'],
      korteBeschrijvingAI: 'Wifi werkt niet in de vergaderruimte',
      korteBeschrijving: 'Wifi werkt niet in vergaderruimte B',
      melderNaam: 'Demo Medewerker',
      melderLocatie: 'Hoofdkantoor, vergaderruimte B',
      melderAfdeling: 'Finance',
      melderRol: 'Medewerker',
      gesloten: false,
      afgerond: false,
      gereageerd: false,
      aanmaakDatum: new Date(),
      status: 'Open',
      invoertype: 'Incident',
      impact: 'Gemiddeld',
      urgentie: 'Gemiddeld',
      prioriteit: 'Normaal',
    },
  })

  const demoTickets = Array.from({ length: 99 }, (_, index) => {
    const number = index + 2
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - index)
    const categories = [
      'Hardware',
      'Account & Inloggen',
      'Facturatie',
      'Netwerk & E-mail',
      'Printer & Scannen',
      'Beveiliging',
    ]
    const statuses = ['Open', 'In behandeling', 'Opgelost', 'Verlopen']
    const category = categories[index % categories.length]
    const status = statuses[index % statuses.length]

    return {
      topdeskId: `DEMO-TICKET-${String(number).padStart(3, '0')}`,
      categorie: category,
      subcategorie: category === 'Netwerk & E-mail' ? 'Draadloos netwerk' : 'Algemene melding',
      systemen: [category],
      probleemtypes: ['Demo-test'],
      korteBeschrijvingAI: `${category}-melding voor demonstratie`,
      korteBeschrijving: `${category}: demo-ticket ${number}`,
      melderNaam: `Demo Medewerker ${number}`,
      melderLocatie: 'Hoofdkantoor',
      melderAfdeling: 'Finance',
      melderRol: 'Medewerker',
      gesloten: false,
      afgerond: false,
      gereageerd: false,
      aanmaakDatum: createdAt,
      status,
      invoertype: 'Incident',
      impact: 'Gemiddeld',
      urgentie: 'Gemiddeld',
      prioriteit: 'Normaal',
    }
  })

  await prisma.$transaction(
    demoTickets.map((ticket) => prisma.melding.upsert({
      where: { topdeskId: ticket.topdeskId },
      update: ticket,
      create: ticket,
    })),
  )

  console.log(`Gebruiker ${email} is aangemaakt of bijgewerkt.`)
  console.log('100 wifi-demo-tickets zijn aangemaakt of bestonden al.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

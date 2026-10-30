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

  console.log(`Gebruiker ${email} is aangemaakt of bijgewerkt.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

# KRATTY

KRATTY is een read-only ticketsysteem waarin medewerkers meldingen kunnen bekijken, zoals kapotte laptops, wifi-problemen en accountproblemen. De website wijzigt geen tickets; de data komt uit de bestaande database.

## Vereisten

Installeer eerst:

- [Node.js](https://nodejs.org/) 20 of nieuwer
- npm, meegeleverd met Node.js
- Git, als je de repository moet clonen

Controleer de installatie:

```bash
node --version
npm --version
```

## Projectstructuur

```text
Project-KRAT/
├── src/                 # React-frontend
├── backend/             # Express-backend voor onder andere login
├── backend/prisma/      # Prisma-schema, migraties en database-seed
├── index.html           # HTML-entrypoint van Vite
├── package.json         # Scripts en dependencies van de frontend
└── vite.config.ts       # Vite-configuratie
```

De database bevat naast `Melding` ook het model `Categorie`. De vaste categorieën zijn gekoppeld aan meldingen via `Melding.categorieId`; de categoriepagina toont per categorie alle gekoppelde tickets.

## Frontend lokaal starten met Vite

Open een terminal in de map `Project-KRAT`:

```bash
cd Project-KRAT
npm install
npm run dev
```

Vite toont daarna een lokaal adres, meestal:

```text
http://localhost:5173
```

Open dit adres in de browser. Stop de ontwikkelserver met `Ctrl+C`.

### Beschikbare frontend-commando's

```bash
npm run dev       # Start Vite met hot reload
npm run build     # Voert typecheck uit en maakt een productie-build
npm run lint      # Controleert de code met ESLint
npm run preview   # Serveert de gemaakte productie-build lokaal
```

## Backend lokaal starten

Open een tweede terminal en ga naar de backendmap:

```bash
cd Project-KRAT/backend
npm install
npm run dev
```

De backend draait op:

```text
http://localhost:3000
```

De frontend gebruikt dit adres voor de login. Start daarom de frontend en backend tegelijk in twee terminals.

Je kunt controleren of de backend draait door in de browser naar `http://localhost:3000` te gaan. Je hoort een JSON-bericht te zien dat de KRATTY-backend werkt.

## Database lokaal instellen

De backend gebruikt Prisma met PostgreSQL. De Prisma-configuratie staat in `backend/prisma/`.

Maak `backend/.env` op basis van [`backend/.env.example`](backend/.env.example):

```env
DATABASE_URL="postgresql://<gebruiker>:<wachtwoord>@localhost:5432/<database>?schema=public"
PORT=3000
FRONTEND_ORIGIN="http://localhost:5173"
```

Vul de waarden in met de gegevens van je lokale PostgreSQL-database. Commit dit bestand niet.

Na het instellen van de database voer je de Prisma-commando's uit vanuit `backend/`:

```bash
cd Project-KRAT/backend
npm install
npx prisma generate
npx prisma migrate dev
```

Maak daarna een lokale gebruiker aan. Gebruik hiervoor environment variables, zodat wachtwoorden niet in de code of Git terechtkomen:

Ubuntu/WSL:

```bash
export ADMIN_NAME="Developer"
export ADMIN_EMAIL="developer@example.com"
read -r -s ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run db:seed
```

Het wachtwoord moet minimaal 12 tekens lang zijn. Elke gebruiker in de `User`-tabel kan inloggen. Voeg een extra gebruiker toe door dezelfde seed opnieuw uit te voeren met een andere naam en e-mail:

```bash
read -r -p "Naam: " ADMIN_NAME
read -r -p "E-mail: " ADMIN_EMAIL
read -r -s -p "Wachtwoord: " ADMIN_PASSWORD
echo
export ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD
npm run db:seed
```

De seed maakt een gebruiker aan of werkt de gebruiker bij wanneer hetzelfde e-mailadres al bestaat. De frontend bewaart het login-token lokaal, zodat een gewone browser-refresh ingelogd blijft. Een token vervalt na acht uur of wanneer de backend opnieuw wordt gestart.

De backend biedt daarna onder andere `/api/auth/login`, `/api/tickets`, `/api/tickets/categories` en `/api/tickets/:id`. De URL-routes blijven technisch hetzelfde; de gegevensvelden en databasebenamingen zijn Nederlands. De frontend toont tickets gegroepeerd onder de vaste categorieën Hardware, Account & Inloggen, Facturatie, Netwerk & E-mail, Printer & Scannen en Beveiliging. Status en prioriteit worden niet als werkbare velden getoond.

## Aanbevolen lokale workflow

1. Start PostgreSQL wanneer je met databasegegevens werkt.
2. Start de backend in een aparte terminal.
3. Start de frontend vanuit de hoofdmap.
4. Open de URL die Vite toont, meestal `http://localhost:5173`.
5. Gebruik de Prisma-commando's alleen vanuit `backend/` wanneer je aan de database werkt.

## Problemen oplossen

### `npm` of `node` wordt niet gevonden

Installeer Node.js opnieuw en start daarna de terminal opnieuw. Controleer vervolgens opnieuw met `node --version` en `npm --version`.

### De frontend kan niet inloggen

Controleer of de backend op `http://localhost:3000` draait. Controleer ook de browserconsole en het terminalvenster van de backend.

### Een poort is al in gebruik

Stop het proces dat de poort gebruikt of start Vite op een andere poort:

```bash
npm run dev -- --port 5174
```

### Prisma kan geen databaseverbinding maken

Controleer of PostgreSQL draait, of `backend/.env` bestaat en of `DATABASE_URL` naar de juiste database verwijst.

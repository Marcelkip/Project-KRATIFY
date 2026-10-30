
const { PrismaClient, RapportStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Testrapport wordt aangemaakt...");

  const report = await prisma.rapport.create({
    data: {
      titel: "Databasetestrapport",
      datums: ["2026-09-18"],
      status: RapportStatus.in_afwachting,
    },
  });

  console.log("Rapport aangemaakt:", report.id);

  const ticket1 = await prisma.melding.create({
    data: {
      topdeskId: "TEST-001",
      categorie: "Hardware",
      subcategorie: "Laptop",

      systemen: ["Laptop"],
      probleemtypes: ["hardware"],
      korteBeschrijvingAI: "Testprobleem met laptop",

      melderLocatie: "Testlocatie",
      melderAfdeling: "IT",
      melderRol: "Medewerker",

      behandelaarNaam: "Testbehandelaar",
      behandelaarGroep: "IT-ondersteuning",

      gesloten: false,
      afgerond: false,
      gereageerd: true,

      aanmaakDatum: new Date(),
      oproepDatum: new Date(),

      status: "Open",
      invoertype: "zelfbediening",
      impact: "medium",
      urgentie: "medium",
      prioriteit: "medium",

      korteBeschrijving: "Testmelding",

      laatsteBijwerking: new Date(),
      laatstBijgewerktDoor: "Testbehandelaar",

      rapportId: report.id,
    },
  });

  const ticket2 = await prisma.melding.create({
    data: {
      topdeskId: "TEST-002",
      categorie: "Software",

      systemen: ["Windows"],
      probleemtypes: ["software"],
      korteBeschrijvingAI: "Testsoftwareprobleem",

      gesloten: true,
      afgerond: true,
      gereageerd: true,

      aanmaakDatum: new Date(),

      status: "Closed",
      invoertype: "e-mail",
      prioriteit: "laag",

      rapportId: report.id,
    },
  });

  console.log("Created tickets:", ticket1.id, ticket2.id);

  const result = await prisma.rapport.findUnique({
    where: {
      id: report.id,
    },
    include: {
      meldingen: true,
    },
  });

  console.log("\nRapport met meldingen:");
  console.dir(result, { depth: null });

  await prisma.melding.deleteMany({
    where: {
      rapportId: report.id,
    },
  });

  await prisma.rapport.delete({
    where: {
      id: report.id,
    },
  });

  console.log("\nTestgegevens verwijderd.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

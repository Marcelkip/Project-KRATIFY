const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const report = await prisma.rapport.create({
    data: {
      titel: "KRAT testrapport",
      datums: ["2026-09-21"],
      status: "in_afwachting",
    },
  });

  const ticket = await prisma.melding.create({
    data: {
      topdeskId: "KRAT-TEST-001",
      categorie: "Hardware",
      subcategorie: "Laptop",
      systemen: ["Laptop"],
      probleemtypes: ["hardware"],
      korteBeschrijvingAI: "Laptop start niet",
      melderAfdeling: "IT",
      melderRol: "Medewerker",
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
      korteBeschrijving: "Laptop start niet",
      laatsteBijwerking: new Date(),
      laatstBijgewerktDoor: "KRAT-test",
      rapportId: report.id,
    },
  });

  console.log("Rapport aangemaakt:", report.id);
  console.log("Melding aangemaakt:", ticket.id);
  console.log("TOPdesk-id:", ticket.topdeskId);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

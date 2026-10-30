ALTER TABLE "User" RENAME TO "Gebruiker";
ALTER TABLE "Report" RENAME TO "Rapport";
ALTER TABLE "ChartDescriptions" RENAME TO "GrafiekBeschrijving";
ALTER TABLE "ReportTrendsSummary" RENAME TO "RapportTrendSamenvatting";
ALTER TABLE "Ticket" RENAME TO "Melding";

ALTER TYPE "ReportStatusTypes" RENAME TO "RapportStatus";
ALTER TYPE "RapportStatus" RENAME VALUE 'pending' TO 'in_afwachting';
ALTER TYPE "RapportStatus" RENAME VALUE 'review_required' TO 'controle_nodig';
ALTER TYPE "RapportStatus" RENAME VALUE 'completed' TO 'voltooid';
ALTER TYPE "RapportStatus" RENAME VALUE 'failed' TO 'mislukt';

ALTER TABLE "Gebruiker" RENAME COLUMN "name" TO "naam";
ALTER TABLE "Gebruiker" RENAME COLUMN "email" TO "emailadres";
ALTER TABLE "Gebruiker" RENAME COLUMN "password" TO "wachtwoord";

ALTER TABLE "Rapport" RENAME COLUMN "title" TO "titel";
ALTER TABLE "Rapport" RENAME COLUMN "dates" TO "datums";
ALTER TABLE "Rapport" RENAME COLUMN "createdAt" TO "aangemaaktOp";

ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "chartType" TO "grafiekType";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "description" TO "beschrijving";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "trendType" TO "trendSoort";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "severity" TO "ernst";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "possibleActions" TO "mogelijkeActies";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "changeReason" TO "redenVoorWijziging";
ALTER TABLE "GrafiekBeschrijving" RENAME COLUMN "reportId" TO "rapportId";

ALTER TABLE "RapportTrendSamenvatting" RENAME COLUMN "summary" TO "samenvatting";
ALTER TABLE "RapportTrendSamenvatting" RENAME COLUMN "highlights" TO "hoogtepunten";
ALTER TABLE "RapportTrendSamenvatting" RENAME COLUMN "risks" TO "risico";
ALTER TABLE "RapportTrendSamenvatting" RENAME COLUMN "recommendedActions" TO "aanbevolenActies";
ALTER TABLE "RapportTrendSamenvatting" RENAME COLUMN "reportId" TO "rapportId";

ALTER TABLE "Melding" RENAME COLUMN "category" TO "categorie";
ALTER TABLE "Melding" RENAME COLUMN "subCategory" TO "subcategorie";
ALTER TABLE "Melding" RENAME COLUMN "systems" TO "systemen";
ALTER TABLE "Melding" RENAME COLUMN "issue_types" TO "probleemtypes";
ALTER TABLE "Melding" RENAME COLUMN "briefDescriptionAI" TO "korteBeschrijvingAI";
ALTER TABLE "Melding" RENAME COLUMN "callerLocation" TO "melderLocatie";
ALTER TABLE "Melding" RENAME COLUMN "callerDepartment" TO "melderAfdeling";
ALTER TABLE "Melding" RENAME COLUMN "callerRole" TO "melderRol";
ALTER TABLE "Melding" RENAME COLUMN "operatorName" TO "behandelaarNaam";
ALTER TABLE "Melding" RENAME COLUMN "operatorGroup" TO "behandelaarGroep";
ALTER TABLE "Melding" RENAME COLUMN "closed" TO "gesloten";
ALTER TABLE "Melding" RENAME COLUMN "closedDate" TO "geslotenOp";
ALTER TABLE "Melding" RENAME COLUMN "completed" TO "afgerond";
ALTER TABLE "Melding" RENAME COLUMN "completedDate" TO "afgerondOp";
ALTER TABLE "Melding" RENAME COLUMN "responded" TO "gereageerd";
ALTER TABLE "Melding" RENAME COLUMN "respondedDate" TO "gereageerdOp";
ALTER TABLE "Melding" RENAME COLUMN "creationDate" TO "aanmaakDatum";
ALTER TABLE "Melding" RENAME COLUMN "callDate" TO "oproepDatum";
ALTER TABLE "Melding" RENAME COLUMN "entryType" TO "invoertype";
ALTER TABLE "Melding" RENAME COLUMN "urgency" TO "urgentie";
ALTER TABLE "Melding" RENAME COLUMN "priority" TO "prioriteit";
ALTER TABLE "Melding" RENAME COLUMN "briefDescription" TO "korteBeschrijving";
ALTER TABLE "Melding" RENAME COLUMN "latestUpdate" TO "laatsteBijwerking";
ALTER TABLE "Melding" RENAME COLUMN "latestUpdateBy" TO "laatstBijgewerktDoor";
ALTER TABLE "Melding" RENAME COLUMN "reportId" TO "rapportId";

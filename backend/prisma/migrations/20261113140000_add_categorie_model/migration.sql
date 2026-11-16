CREATE TABLE "Categorie" (
    "id" SERIAL NOT NULL,
    "naam" TEXT NOT NULL,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Categorie_naam_key" ON "Categorie"("naam");

ALTER TABLE "Melding" ADD COLUMN "categorieId" INTEGER;

INSERT INTO "Categorie" ("naam") VALUES
    ('Hardware'),
    ('Account & Inloggen'),
    ('Facturatie'),
    ('Netwerk & E-mail'),
    ('Printer & Scannen'),
    ('Beveiliging')
ON CONFLICT ("naam") DO NOTHING;

UPDATE "Melding" AS melding
SET "categorieId" = categorie."id"
FROM "Categorie" AS categorie
WHERE melding."categorie" = categorie."naam";

CREATE INDEX "Melding_categorieId_idx" ON "Melding"("categorieId");

ALTER TABLE "Melding"
ADD CONSTRAINT "Melding_categorieId_fkey"
FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

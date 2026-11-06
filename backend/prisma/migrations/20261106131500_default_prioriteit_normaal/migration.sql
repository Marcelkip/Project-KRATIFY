UPDATE "Melding"
SET "prioriteit" = 'Normaal'
WHERE "prioriteit" IS NULL;

ALTER TABLE "Melding"
ALTER COLUMN "prioriteit" SET DEFAULT 'Normaal';

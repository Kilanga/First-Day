ALTER TABLE "Subject"
  ADD COLUMN "generationStatus" TEXT NOT NULL DEFAULT 'ready',
  ADD COLUMN "generationResponseId" TEXT,
  ADD COLUMN "generationInput" JSONB,
  ADD COLUMN "generationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "generationError" TEXT;

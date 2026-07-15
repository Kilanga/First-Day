ALTER TABLE "LearningSession"
  ADD COLUMN "agenda" JSONB,
  ADD COLUMN "agendaBonusAwarded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "journalEntry" TEXT,
  ADD COLUMN "mentorFeedback" TEXT;

ALTER TABLE "ConceptState"
  ADD COLUMN "notebookEntry" JSONB;

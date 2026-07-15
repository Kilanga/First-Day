ALTER TABLE "Subject"
  ADD COLUMN "shareCode" TEXT,
  ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Subject_shareCode_key" ON "Subject"("shareCode");

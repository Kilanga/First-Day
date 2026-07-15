CREATE INDEX "Subject_mentorId_createdAt_idx" ON "Subject"("mentorId", "createdAt");
CREATE INDEX "LearningSession_subjectId_startedAt_idx" ON "LearningSession"("subjectId", "startedAt");
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

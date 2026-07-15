# First Day — Project Context

First Day is a learning app that inverts the AI tutor: the AI plays "the new
hire", a junior employee on their first weeks, and the USER is the mentor.
Users consolidate knowledge by explaining it (protégé effect). The new hire
asks strategically naive questions that embody real domain misconceptions.
A hidden Examiner grades each explanation; good teaching earns the hire XP,
stats, and tier promotions (Week 1 → First Month → Confirmed).

## Stack
Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma + Postgres (Neon),
OpenAI SDK with model "gpt-5.6" for all calls. Deployed on Vercel. No auth:
anonymous mentor UUID stored in localStorage, sent with every API call.

## Non-negotiable rules
- All UI copy in English.
- The new hire NEVER reveals the trap map, verdicts, XP, or that it is
  evaluated. It never pretends to understand after a failed explanation.
- Verdict JSON is used by the backend and for UI animations only — never
  displayed verbatim to the user.
- Gamification must be expressed through the new hire's notebook, agenda,
  journal, and in-character feedback. Never expose verdict names, hidden
  concept states, scoring logic, or internal assessment language in the UI.
- Every OpenAI call goes through lib/openai.ts (strict JSON parsing where
  expected, one retry on malformed JSON, never crash on bad output).
- Keep scope minimal: no streaming, no multi-hire, no accounts in v1.

## Definition of done for each task
Code compiles, `pnpm build` passes, the feature is manually testable, and
you tell me exactly how to test it (curl command or UI steps).

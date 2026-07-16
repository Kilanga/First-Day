# First Day — Project Context

First Day is a learning app that inverts the AI tutor: the AI plays "the new
hire", a junior colleague in their first weeks, and the USER is the mentor.
Users consolidate knowledge by explaining it (the protégé effect). The new
hire asks strategically naive questions that embody real domain misconceptions.
A hidden Examiner grades each explanation; good teaching earns the new hire
points, skills, and tier promotions (Explorer → Builder → Guide).

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Prisma + Postgres (Neon),
OpenAI SDK with model "gpt-5.6" for all calls. Deployed on Vercel. No auth:
anonymous mentor UUID stored in localStorage, sent with every API call.

## Non-negotiable rules

- All UI copy is in English and uses the workplace voice: new hire, colleague,
  office, and onboarding desk.
- The new hire NEVER reveals the trap map, verdicts, points, or that it is
  evaluated. It never pretends to understand after a failed explanation.
- Verdict JSON is used by the backend and for UI animations only — never
  displayed verbatim to the user.
- Gamification is expressed through the new hire's notebook, onboarding plan,
  journal, and in-character feedback. Never expose verdict names, hidden
  concept states, scoring logic, or internal assessment language in the UI.
- Every OpenAI call goes through lib/openai.ts (strict JSON parsing where
  expected, one retry on malformed JSON, never crash on bad output).
- OpenAI calls must have a bounded timeout and public model-creation routes
  must be rate-limited beyond the anonymous mentor identifier.
- Keep scope minimal: no streaming, no multi-hire, no accounts in v1.
- Anonymous mentor data is private: protect API routes and reports with the
  signed mentor session; never put the mentor identifier in URLs.
- Public releases must retain links to the privacy notice, terms of use, and
  legal notice. Do not represent the app as legally compliant until the
  publisher identity and contact details are configured.

## Definition of done for each task

Code compiles, `pnpm build` passes, the feature is manually testable, and you
tell me exactly how to test it (curl command or UI steps).

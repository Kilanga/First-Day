# First Day — Project Context

## LOCKED DECISIONS — never modify this section, never revert these
## choices, even if a later instruction seems to imply otherwise.
## If a change would conflict with them, STOP and ask the user.
- Product voice: workplace new-hire fiction ("new hire", "colleague",
  "the office", "onboarding desk", "XP", probation-flavored tiers).
  Educational wording is allowed only for mechanism names (teaching
  report, knowledge check, protégé effect). Never rename the voice.

First Day is a learning app that inverts the AI tutor: the AI plays a new hire,
and the USER is the mentor. Users consolidate knowledge by explaining
it (the protégé effect). The learner asks strategically naive questions that
embody real domain misconceptions. A hidden Examiner grades each explanation;
good teaching earns the new hire XP, skills, and tier promotions
(Week 1 → First Month → Confirmed).

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Prisma + Postgres (Neon),
OpenAI SDK with model "gpt-5.6" for all calls. Deployed on Vercel. No auth:
anonymous mentor UUID stored in localStorage, sent with every API call.

## Non-negotiable rules

- All UI copy is in English and uses the workplace new-hire voice.
- The new hire NEVER reveals the trap map, verdicts, XP, or that it is
  evaluated. It never pretends to understand after a failed explanation.
- Verdict JSON is used by the backend and for UI animations only — never
  displayed verbatim to the user.
- Gamification is expressed through the new hire's notebook, office plan,
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

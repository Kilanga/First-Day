# First Day

First Day is a learning app that reverses the usual AI-tutor relationship. Instead of asking an AI for answers, a mentor teaches a curious junior colleague during their first weeks on the job. The colleague asks plausible, strategically naive questions; explaining clearly is the learning exercise.

The product is built around the protégé effect: people consolidate knowledge when they have to teach it. The goal is not to make the learner look clever. It is to make the mentor notice where an explanation is incomplete, vague, or missing a practical example.

## What the product does

- Creates a subject from a title and optional study notes.
- Accepts local Markdown, text, Word, PowerPoint, and text-based PDF documentation when creating a subject. When files are attached, the mentor must state a learning focus so the generated practice stays scoped to the relevant material; only extracted text is used and files are not retained.
- Builds a private concept and misconception map for that subject.
- Gives the subject a named junior colleague with a small, consistent personality.
- Runs a mentor/colleague conversation, with the colleague asking the next useful question.
- Tracks what the colleague has genuinely understood, without revealing the hidden assessment system in the conversation.
- Turns progress into in-character artifacts: a notebook, a session agenda, breakthrough moments, a journal entry, and a skills matrix.
- Produces an end-of-session teaching report and a short 360-style note from the colleague.
- Supports several subjects, resumable sessions, and a lightweight report history for one anonymous browser-based mentor.
- Lets a mentor share a learning through a public link. Recipients receive the same subject and colleague personality, but a fresh private chat, progress state, journal, and reports. Mentors can copy, renew, or disable a shared link.

The fixed demo trap map is deliberately deferred while the core product is being refined.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL on Neon
- OpenAI SDK using `gpt-5.6` for every model call
- Vercel deployment
- `pnpm`

There is intentionally no account system in v1. A mentor UUID is created in `localStorage` and is sent with each request.

## Architecture

The conversation loop is deliberately split into distinct responsibilities.

1. The subject route creates the mentor, subject, hire, and one `ConceptState` per generated concept. For uploaded documents, it treats the mentor's stated learning focus as the highest-priority instruction.
2. The Examiner evaluates the mentor's latest explanation privately and returns structured data for backend updates.
3. The orchestrator updates concept state, XP, tiers, skills, the session agenda, and breakthrough state.
4. The New Hire receives the private learning state and speaks only as the junior colleague. It never exposes the concept map, scores, verdicts, or evaluation process.
5. The report route turns private notes into mentor-facing strengths and concrete next steps. It also stores an in-character journal entry.

All OpenAI access goes through [`lib/openai.ts`](./lib/openai.ts). JSON calls request structured output, parse it strictly, retry once after malformed JSON, and fail safely through the API route rather than crashing the UI.

## Collaboration with Codex

This project was developed as an iterative collaboration between the product owner and Codex, not as a one-shot code generation exercise. The conversation moved from a bare Next.js scaffold to a deployable learning loop, with implementation decisions repeatedly checked against the actual product experience.

### Where Codex accelerated the work

Codex handled the high-leverage engineering work quickly:

- Scaffolded the Next.js, TypeScript, Tailwind, Prisma, and OpenAI structure with `pnpm`.
- Corrected the initial Prisma schema when one-sided relations were identified, then created and maintained migrations.
- Implemented the OpenAI JSON helper, prompt modules, chat orchestrator, XP logic, rate limiting, report generation, trial route, and Prisma data access.
- Built the landing page, onboarding reveal, office layout, chat window, colleague card, reports, subject tabs, resumable sessions, and the later character-driven gamification pass.
- Investigated real deployment failures: Prisma client generation on Vercel, a 404 caused by the original Vercel project setup, and surfaced the distinction between application compilation and a Neon/Prisma connection problem.
- Repeatedly ran schema validation, type checking, production builds, diff checks, and Git publishing steps.
- Added document extraction for local company material, then hardened the Vercel PDF runtime by tracing the PDF worker and limiting native PDF dependencies to PDF uploads only.
- Added shareable learning links that clone a reusable learning setup without exposing another mentor's messages or progression.

Codex also sped up debugging by tracing the entire request path rather than only the visible UI. For example, when chat history appeared to disappear, the client hydration logic was adjusted so a state refresh could not overwrite newly received local messages.

### Product decisions made by the human collaborator

The important product direction came from the human collaborator. Key decisions included:

- The colleague should be a believable new hire, not a conventional tutor or quiz bot.
- The AI must never reveal the hidden misconception map, judgement, XP logic, or evaluation language.
- UI copy should be English, even though product collaboration happened in French.
- The initial single-session model was insufficient: multiple subjects and resumable sessions were needed, represented as subject/hire tabs.
- “End session” must preserve learning rather than delete it; it should lead to a report and allow a future follow-up session.
- The live report should become the final report snapshot, avoiding an unnecessary second report-generation call.
- Gamification should feel like a colleague learning on the job rather than a dashboard. This drove the notebook, agenda, journal, breakthrough, and skills-matrix design.
- The colleague's real generated name must be used everywhere instead of hard-coding “Sam”.
- The static demo is intentionally postponed so it does not need to be rebuilt while the core interaction changes.
- Documentation uploads need a mandatory learning objective: a full company document is source material, not automatically the scope of a single learning session.
- Shared links should duplicate a learning setup while keeping each recipient's conversation and progress private.

Those decisions repeatedly changed the implementation priorities. Codex proposed technical options and implemented them, while the product owner chose the intended experience and corrected assumptions when the flow felt wrong.

### How GPT-5.6 contributed

`gpt-5.6` is used as a set of constrained roles rather than a single general chatbot:

- **Trap map generator:** turns a subject and notes into 5–8 concepts, dependencies, and real novice misconceptions.
- **Examiner/router:** privately judges whether an explanation establishes the target concept and supplies structured information for state updates.
- **New Hire:** produces short, in-character follow-up questions and reformulations, conditioned on learner state, personality, prior conversation, memory, and breakthrough context.
- **Report writer:** turns stored examiner notes into a friendly, actionable session report.
- **Journal and 360 feedback writer:** gives the hire a first-person voice for a session memory and concise mentor feedback.
- **Trial generator:** creates practical questions and then lets the hire answer only at the level demonstrated through the mentoring sessions.

The model is therefore used for language, misconception design, and character expression. Prisma, the orchestrator, concept states, XP, tiers, rate limits, and permissions remain deterministic application logic. This separation keeps the product reliable when a model response is malformed or unavailable.

## Main product milestones

1. **Foundation:** app scaffold, environment configuration, Prisma schema, Neon migration, and OpenAI helper.
2. **Core learning loop:** trap-map subject creation, examiner, new-hire prompts, orchestrator, XP/tier state, and chat persistence.
3. **Teaching experience:** office interface, colleague card, typing states, onboarding reveal, report page, trial page, and rate limits.
4. **Continuity:** landing dashboard, several concurrent subjects, subject/hire tabs, session resume, report snapshots, and follow-up sessions.
5. **Character-driven progression:** notebook entries, three-item agenda, breakthrough moments, journal, skills matrix, and mentor feedback.
6. **Production hardening:** Vercel build fixes, migration deployment, input-size limits, bounded state payloads, retry/error messaging, and build verification.
7. **Reusable learning:** local-document focus prompts and shareable learning links with isolated recipient state.

## Local development

Create `.env` from `.env.example` and provide:

```bash
OPENAI_API_KEY=...
DATABASE_URL=...
DAILY_MESSAGE_CAP=50
```

Then run:

```bash
corepack pnpm install
corepack pnpm exec prisma migrate dev --name init
corepack pnpm dev
```

For production, Vercel runs the `build` script, which deploys Prisma migrations, generates Prisma Client, and builds Next.js.

## Manual test flow

1. Create a subject and optional notes from `/onboarding`. If attaching documentation, add the required learning focus, for example: “Focus on the reality-shifting core loop and common design mistakes.”
2. Meet the generated colleague and enter the office.
3. Reply to a naive question; verify the next in-character response and the XP/tier animation.
4. Give an incomplete explanation, then improve it; verify the breakthrough moment and the notebook entry.
5. Cover the three agenda items; verify the checklist and closing message.
6. Open the notebook and hover skills-matrix cells for the colleague's notes.
7. End the session; verify the journal, report, and the feedback request.
8. Return to the dashboard: completed subjects open their latest report, while “Start a new session” begins a fresh conversation.
9. Open “Learning history” and verify each completed session links to its saved report.
10. Use “Share this learning”, open the copied link in a private window, and verify that the recipient gets the same subject and colleague but no prior messages or XP. Copy, renew, then disable the link and verify that the disabled link no longer opens.

## Current v1 boundaries

- No authentication or multi-user collaboration.
- No streaming responses.
- One hire per subject.
- The public demo remains a deferred static asset while the core loop evolves.
- No external documentation connectors in v1; company documentation is supplied locally during subject creation.
- Sharing is link-based and anonymous in v1; it is designed for reusable learning setups, not live multi-user collaboration.

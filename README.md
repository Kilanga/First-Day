# First Day

First Day is a learning app that reverses the usual AI-tutor relationship. Instead of asking an AI for answers, you teach a believable new hire. Your colleague asks strategically naive questions; explaining clearly is the exercise.

The product is built around the protégé effect: people consolidate knowledge when they have to teach it. The goal is not to make the new hire look clever. It is to make the mentor notice where an explanation is incomplete, vague, or missing a practical example.

## Why it stands out

Most learning products make the AI the expert and the person the recipient of an answer. First Day makes the person the mentor and gives the AI a deliberately incomplete mental model of the subject. That changes the interaction from answer retrieval to active explanation.

A private misconception map, a structured examiner, and deterministic application state turn each office conversation into visible evidence: the colleague's reformulations, field notes, office plan, knowledge checks, and teaching report.

## What the product does

- Creates an onboarding subject from a title and optional reference notes.
- Accepts local Markdown, text, Word, PowerPoint, and text-based PDF documentation. When files are attached, the mentor states the onboarding focus; only extracted text is used and files are not retained.
- Builds a private concept and misconception map, then gives it a named new hire with a consistent personality.
- Runs an office conversation where the colleague asks the next useful question.
- Tracks what the new hire has genuinely understood without revealing the hidden assessment system.
- Turns progress into in-character artifacts: field notes, an office plan, breakthrough moments, a journal entry, and a skills matrix.
- Produces an end-of-session teaching report and a short 360-style note from the colleague.
- Supports several subjects, resumable sessions, report history, and public links that create a fresh private onboarding copy for each recipient.
- Keeps the welcome screen, personal onboarding desk, and ephemeral demo deliberately separate. The demo has its own finished conversations and never reads or changes a visitor's private data.

The demo includes two fixed conversations: project-management foundations with Sam and a playful maths onboarding with Milo. Visitors can continue either conversation with a real, ephemeral GPT-5.6 reply; demo messages are never saved.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL on Neon
- OpenAI SDK using `gpt-5.6` for every model call
- Vercel deployment
- `pnpm`

There is intentionally no account system in v1. An anonymous mentor UUID is created in `localStorage` and is sent with each request.

## Architecture

1. `/` is a general welcome screen. Its primary demo CTA opens a filled, browser-only onboarding desk; `/desk` is the sole route for creating a custom subject.
2. The subject route creates the mentor, subject, new hire, and one `ConceptState` per generated concept.
3. The Examiner evaluates the mentor's latest explanation privately and returns structured data for backend updates.
4. The orchestrator updates concept state, XP, tiers, office plan, skills, and breakthrough state.
5. The new hire receives the private state and speaks only as a colleague. It never exposes the concept map, XP, verdicts, or evaluation process.
6. The report route turns private notes into mentor-facing strengths and concrete next steps, and stores an in-character journal entry.
7. `/demo` and its two conversation routes are static snapshots. Their chat calls a tightly scoped, IP-limited GPT-5.6 route but never writes a database record.

All OpenAI access goes through [`lib/openai.ts`](./lib/openai.ts). JSON calls request structured output, parse it strictly, retry once after malformed JSON, and fail safely through the API route rather than crashing the UI.

## Collaboration with Codex

This project was developed as an iterative collaboration between the product owner and Codex, not as one-shot code generation. The human collaborator set the product direction: AI as a believable new hire, English workplace fiction, hidden assessment, private onboarding copies, and character-first progression rather than a score dashboard.

Codex accelerated the implementation by scaffolding the Next.js/Prisma/OpenAI app, correcting Prisma relations, implementing prompt roles and the chat orchestrator, building the office, reports, knowledge check, rate limits, document extraction, session privacy, and Vercel hardening. It also traced real production failures across Prisma, Neon, Vercel, OpenAI JSON formatting, PDF extraction, and browser hydration.

`gpt-5.6` is used as constrained roles: a trap-map generator, a private Examiner/router, the in-character new hire, a teaching-report writer, a journal/360 writer, and a knowledge-check generator. Prisma and the orchestrator keep XP, tiers, permissions, quotas, and concept state deterministic.

## Local development

Create `.env` from `.env.example` and provide:

```bash
OPENAI_API_KEY=...
DATABASE_URL=...
DAILY_MESSAGE_CAP=50
DAILY_AI_CALL_CAP=100
IP_SUBJECT_HOURLY_CAP=10
IP_CLAIM_HOURLY_CAP=50
MENTOR_SESSION_SECRET=use-a-random-value-with-at-least-32-characters
NEXT_PUBLIC_LEGAL_PUBLISHER_NAME=Your legal name or company name
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=privacy@your-domain.example
NEXT_PUBLIC_LEGAL_HOST_NAME=Vercel Inc.
```

```bash
corepack pnpm install
corepack pnpm exec prisma migrate dev --name init
corepack pnpm dev
```

This project requires **pnpm 10 or newer** and **Node 22 or newer**. Vercel runs `pnpm build`, which runs `prisma migrate deploy`, generates Prisma Client, and builds Next.js; it therefore needs `DATABASE_URL`. Use `pnpm build:local` when you want the build without applying migrations locally.

For local end-to-end checks without using OpenAI credits, set `OPENAI_MOCK_MODE=true`. The app then uses deterministic local responses for subject mapping, chat, reports, feedback, and knowledge checks; no OpenAI request is created.

## Privacy and deployment safeguards

- Private onboarding data is protected by a signed, HTTP-only anonymous-session cookie. Use **Share this onboarding** rather than a report URL to share a reusable setup.
- Imported document text is transient: it is sent once to generate the trap map and is not retained.
- Shared onboarding links are bearer links: anyone with a link can open the template. Do not share confidential material.
- Set `MENTOR_SESSION_SECRET` to a unique random value of at least 32 characters in Vercel.
- OpenAI calls time out after 45 seconds. Public creation has per-mentor and hashed per-IP hourly limits; keep Vercel Firewall enabled.
- Operational logs exclude mentor IDs, prompts, messages, source filenames, document text, and model output.

## Manual test flow

1. Open `/desk`, then choose **Create a new subject**. If attaching documentation, state the required onboarding focus.
2. Meet the generated new hire and enter the office.
3. Reply to a naive question; verify the in-character response and the idea-landed, getting-there, or breakthrough moment.
4. Give an incomplete explanation, then improve it; verify the breakthrough moment and a field-notes entry.
5. Cover the office-plan items; verify the checklist and closing message.
6. End the session; verify the journal, teaching report, and feedback request.
7. Open the knowledge check and verify that the colleague only answers at the level you taught.
8. Use **Share this onboarding** in a private window; the recipient should receive the same subject and colleague but no prior messages or accumulated progress.
9. From `/`, choose **Try the demo subject**; open Sam or Milo's office, write a reply, and verify that an in-character GPT-5.6 follow-up appears without creating a subject in your onboarding desk.
10. Open `/demo`; switch between the two static conversations and verify that neither appears in your private onboarding desk.

## Current v1 boundaries

- No authentication or multi-user collaboration.
- No streaming responses.
- One new hire per subject.
- The demo has fixed starting content. Its chat is ephemeral: it uses GPT-5.6 but never becomes a user session or writes a message to the database.
- No external documentation connectors in v1.
- Sharing is anonymous and link-based; it is for reusable onboarding setups, not live collaboration.

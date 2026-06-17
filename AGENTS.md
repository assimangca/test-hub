# AGENTS.md

## What lives here
This is a React + Vite + TypeScript web application built with the **Google Gemini API** (`@google/genai`).
It is built and maintained with the help of AI coding agents and human oversight.

---

## Tech stack (read before writing code)

| Layer | Technology | Notes |
|---|---|---|
| UI framework | React 19 | Functional components + hooks only |
| Language | TypeScript ~5.8 | Strict mode enabled (`tsconfig.json`) |
| Bundler | Vite 6 | Config in `vite.config.ts` |
| Styling | TailwindCSS v4 | Via `@tailwindcss/vite` plugin — **no** separate `tailwind.config` file |
| Animations | Motion (Framer) | Import from `motion/react` |
| Icons | Lucide React | `lucide-react` package |
| AI SDK | `@google/genai` v2 | Gemini API — key stored in `.env.local` as `GEMINI_API_KEY` |
| Backend | Express 4 | Only for server-side API proxying; entry in `server.js` (built from `src/`) |
| Runtime | Node.js | Minimum version: 18 |

---

## Project layout

```
test-hub/
├── src/
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   ├── index.css        # Global styles + Tailwind base
│   ├── types.ts         # Shared TypeScript types/interfaces
│   ├── components/      # Reusable UI components
│   └── utils/           # Shared utilities and helpers
├── assets/              # Static assets
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and npm scripts
├── .env.example         # Example env vars (safe to commit)
├── .env.local           # Real secrets — NEVER commit this file
├── AGENTS.md            # This file
├── PROMPTS.md           # Prompt library (date, model, intent, quality rating)
└── TASKS.md             # Task backlog — pick top 3 each morning
```

---

## npm scripts

```bash
npm run dev      # Start Vite dev server on http://localhost:3000
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Type-check only (tsc --noEmit); fix errors before committing
npm run clean    # Remove dist/ and server.js
```

> Always run `npm run lint` before ending a coding session to catch type errors early.

---

## Environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `.env.local` | Gemini API authentication |

- Copy `.env.example` → `.env.local` and fill in values.
- **Never expose `GEMINI_API_KEY` on the client side.** Route all API calls through the Express backend if needed.
- Vite exposes vars prefixed with `VITE_` to the browser; all others stay server-side.

---

## Models in use

| Model | Provider | Purpose |
|---|---|---|
| Gemini 2.0 Flash / 2.5 Pro | Google Cloud | Primary AI tasks (generation, reasoning, summarisation) |
| Gemma 4 2B | Ollama / LM Studio (local) | Offline work, quick code review, low-latency tasks |
| Claude Sonnet | Anthropic (via IDE) | Agentic coding assistance, refactoring, pair programming |

---

## Coding conventions

1. **TypeScript**: All new files must be `.ts` or `.tsx`. No `any` unless you leave a `// TODO: type this` comment.
2. **Components**: One component per file. File name matches the exported component name (PascalCase).
3. **Imports**: Use absolute-style path aliases if configured; otherwise relative imports from the nearest common ancestor.
4. **Styling**: Use TailwindCSS v4 utility classes. Do **not** add a `tailwind.config.js` — the v4 plugin reads CSS directly.
5. **Gemini SDK**: Always handle streaming and error states. Never log API keys or full response objects.
6. **State management**: Prefer React built-ins (`useState`, `useReducer`, `useContext`). Add a library only if the team agrees.
7. **Animations**: Use `motion` components from `motion/react`. Keep animations subtle and purposeful.
8. **No secrets in code**: Credentials, tokens, and API keys go in `.env.local` only.

---

## Responsible AI rules

- Every model output is reviewed by a human before it is merged.
- No personal data, credentials, or proprietary code is sent to a public model.
- AI assistance is disclosed in PR descriptions and in the README footer.
- Known limitation: small local models may hallucinate citations — verify every citation against the source.
- High-risk changes (auth, payments, student records) require a **second human reviewer**.

---

## What agents MAY do autonomously

- Read any file in this repository.
- Create or edit files under `src/`, `assets/`, and root config files.
- Run `npm run lint` and `npm run dev` to verify changes.
- Update `TASKS.md` to mark items complete or add new tasks.
- Add entries to `PROMPTS.md` when a new prompt pattern is discovered.

## What agents MUST NOT do

- Commit or push to `main` without human approval.
- Modify `.env.local` or any file containing real secrets.
- Install new npm packages without noting them in the task/PR and getting human sign-off.
- Send user data or proprietary code to an external model endpoint.
- Skip the `npm run lint` check before declaring a task done.

---

## Escalation

If a model produces something that looks wrong, **stop and ask a human.**

Specifically escalate when:
- Type errors cannot be resolved without a structural refactor.
- A change touches authentication, payments, or student/user records.
- An external API returns unexpected data that changes your assumptions.
- The task requires adding or removing a major dependency.

---

## Working with TASKS.md

- Tasks live in `TASKS.md` with statuses: `[ ]` todo · `[/]` in-progress · `[x]` done.
- Pick the top 3 **Now** tasks each morning.
- When completing a task, move it to the **Done** section with the finish date.
- Log the prompt used (if AI-generated output) in `PROMPTS.md`.

---

## Quick-start checklist for a new agent session

- [ ] Read `TASKS.md` — identify the current active task.
- [ ] Read relevant source files before writing any code.
- [ ] Check `tsconfig.json` for compiler options that affect your work.
- [ ] Run `npm run lint` after making changes.
- [ ] Update `TASKS.md` when done.
- [ ] Leave a brief note in `PROMPTS.md` if you used a novel prompt pattern.

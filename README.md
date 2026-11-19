# Triage Lens for Jira

A Forge app (UI Kit 2) that adds a **Triage Lens** panel to every Jira issue.
It helps a developer picking up an issue answer, at a glance: *what is this
about, how urgent is it, is it a duplicate, and what should it be labelled?*

Built for **Codegeist 2026** (Devpost: codegeist2026.devpost.com),
category **Apps for Software Teams**.

> Status (19 Nov 2026, re-verified): code complete, unit tests 18/18 green
> (15 heuristik + 3 regresi JQL, lihat di bawah), lint client-side 0 errors /
> 0 warnings, Forge CLI 15.1.0 working. **Not yet deployed** — deployment needs
> an Atlassian account + API token + free Cloud Developer License (see
> [DEPLOY.md](DEPLOY.md) and [CIPOZ-STEPS.md](CIPOZ-STEPS.md)). The app id
> in `manifest.yml` is still the placeholder
> `00000000-0000-0000-0000-000000000000` until `forge register` /
> `forge deploy` runs. Public repo: https://github.com/taufik52/triage-lens
> (commit `6d5d153`, in sync).
>
> 13 Nov 2026 fix: the duplicate search double-encoded its JQL
> (`encodeURIComponent` + Forge `route` tag) so Jira would have rejected
> every search and the duplicate list would always come back empty. Fixed
> in `src/index.jsx` (raw JQL passed to `route`) + regression tests in
> `test/route.test.js` (18/18 green, re-verified 19 Nov 2026). Lint client-side
> re-verified 0 errors / 0 warnings on 19 Nov 2026 (run with the
> `LD_PRELOAD` shim, otherwise EPERM chown on this VM — see DEPLOY.md).
> Public GitHub repo live since 13 Nov 2026.

## What it does

When you open a Jira issue, the panel shows:

1. **Summary** — an extractive summary (up to 3 sentences) of the issue's
   summary + description. The description arrives from Jira as ADF
   (Atlassian Document Format); `src/adf.js` converts it to plain text
   first (paragraphs, headings, lists, mentions, tables, code blocks).
2. **Suggested priority** — a score-based suggestion (`Highest` / `High` /
   `Medium` / `Low` / `Lowest`) with the human-readable reasons behind it,
   e.g. "Mentions data loss or corruption (+50)", "Blocks release (+25)",
   "Cosmetic / copy issue (-15)". Signals include data loss, security
   vulnerabilities, production outages, crashes on launch, broken
   payment/checkout, regressions, release blockers, and urgent/critical
   labels. The issue type contributes a base score (Bug +15, Incident +30).
   A button **"Apply \<priority\> priority"** writes the suggestion back
   to the issue — only after you click it; nothing is changed automatically.
3. **Possible duplicates** — the 50 most recent issues in the same project
   are compared with Jaccard similarity over word tokens (stopwords
   removed). Matches at ≥ 20% similarity are listed, best first (max 5),
   with a similarity percentage and a link to each candidate issue.
4. **Suggested labels** — keyword-based labels the issue does not already
   have: `security`, `performance`, `frontend`, `backend`, `database`,
   `mobile`, `docs`, `accessibility`.

## Privacy by design

All triage logic is **local heuristics that run inside the Forge function
on the Atlassian side** — issue text never leaves your Atlassian site.

There is an **optional LLM slot** (`src/llm.js`) that can enhance the
summary with a 2–3 sentence LLM summary. It is **OFF by default**: it only
runs when a site admin sets `LLM_API_KEY` (plus optionally `LLM_API_BASE` /
`LLM_MODEL`) via `forge variables`. No key is hard-coded anywhere. If no
key is set, or the LLM call fails, the panel silently falls back to the
local summary. The LLM endpoint must be OpenAI-compatible
(`chat/completions`); default base `https://api.openai.com/v1`, default
model `gpt-4o-mini`. Only the issue summary + description (max 6000 chars)
are sent — nothing else.

## How it is built

- **Forge, Node.js 20 runtime** (`nodejs20.x`), UI Kit 2 (`@forge/react`).
- `manifest.yml` — one module: `jira:issuePanel` ("Triage Lens") backed by
  function `main` (`index.run`). Scopes: `read:jira-work` (read the issue +
  JQL search for duplicate candidates) and `write:jira-work` (apply the
  suggested priority, user-confirmed).
- `src/index.jsx` — UI Kit 2 panel + two backend resolvers:
  - `getTriage` — reads the issue, runs the heuristics, returns the triage.
  - `applyPriority` — `PUT /rest/api/3/issue/{key}` with the chosen priority.
- `src/heuristics.js` — pure functions, no Forge dependencies:
  `summarize`, `suggestPriority`, `findDuplicates`, `suggestLabels`,
  `tokenize`, `jaccardSimilarity`.
- `src/adf.js` — ADF → plain text.
- `src/llm.js` — optional LLM enhancement, fail-open to heuristics.
- `test/` — 18 unit tests (`node --test`, no
  dependencies needed).

## Run the tests

```bash
cd triage-lens
npm test        # node --test test/*.test.js — 18/18 pass
```

## Install dependencies / deploy

```bash
cd triage-lens
npm install --ignore-scripts   # sandbox workaround, see DEPLOY.md
```

Deployment, install link, and the demo video all need the Atlassian
account steps in [DEPLOY.md](DEPLOY.md) / [CIPOZ-STEPS.md](CIPOZ-STEPS.md).

## Project layout

```
~/workspace/codegeist/
├── README.md               (this file)
├── DEPLOY.md               (deploy + install steps, incl. sandbox quirks)
├── SUBMISSION.md           (Devpost submission text, ready to paste)
├── DEMO-SCRIPT.md          (demo video script, < 5 minutes)
├── CIPOZ-STEPS.md          (langkah Cipoz, Bahasa Indonesia)
├── PAUSE-NOTE.md           (progress log)
└── triage-lens/
    ├── manifest.yml
    ├── package.json
    ├── src/
    │   ├── index.jsx       (UI Kit 2 panel + resolvers getTriage/applyPriority)
    │   ├── heuristics.js   (summarize / priority / duplicates / labels)
    │   ├── adf.js          (ADF → plain text)
    │   └── llm.js          (optional LLM slot, OFF by default)
    └── test/
        ├── heuristics.test.js   (15 tests)
        └── route.test.js       (3 JQL route regression tests)
```

## Hackathon

- **Event:** Codegeist 2026 — "Build with context. Ship with confidence."
- **Submission deadline:** 22 Dec 2026, 12:00 PM PST (= 23 Dec 2026, 03:00 WIB).
- **What judges need:** an installation link + instructions, and a public
  YouTube demo video under 5 minutes. See [SUBMISSION.md](SUBMISSION.md).

# SUBMISSION.md — Codegeist 2026: Triage Lens for Jira

Devpost submission draft for **codegeist2026.devpost.com**.
**Do not submit yet** — the installation link and the demo video URL are
still TODO (both need the deployed app; see blockers at the bottom).

- **Event:** Codegeist 2026 — "Build with context. Ship with confidence."
- **Category:** Apps for Software Teams
- **Deadline:** 22 Dec 2026, 12:00 PM PST (= 23 Dec 2026, 03:00 WIB)
- **Bonus prizes entered:** none (the app uses no Rovo agent, no Teamwork
  Graph, no MCP server, and is not Marketplace-published — do not tick any
  bonus box unless that changes).

## Project title

**Triage Lens for Jira**

## Tagline

Instant triage for any Jira issue: a plain-language summary, a suggested
priority with reasons, possible duplicates, and label suggestions — right
inside the issue view.

## Description (paste into Devpost)

> Triage Lens is a Forge app (UI Kit 2) that adds a panel to every Jira
> issue. The moment you open an issue it shows:
>
> - **A short summary** — the most informative sentences of the issue's
>   summary and description, extracted locally. Jira descriptions are
>   stored as ADF (Atlassian Document Format); the app converts them to
>   plain text first.
> - **A suggested priority, with reasons** — a transparent score (e.g.
>   "Mentions data loss or corruption (+50)", "Blocks release (+25)",
>   "Cosmetic / copy issue (-15)") mapped to Highest / High / Medium /
>   Low / Lowest. A button applies the suggestion to the issue — only
>   after you click it. Nothing ever changes without your confirmation.
> - **Possible duplicates** — the 50 most recent issues in the same
>   project are compared by word-overlap similarity; the closest matches
>   are listed with a similarity percentage and a link, so you can spot
>   a duplicate before doing the work twice.
> - **Suggested labels** — keyword-based labels the issue doesn't already
>   have (security, performance, frontend, backend, database, mobile,
>   docs, accessibility).
>
> **Privacy by design:** all triage logic is local heuristics running
> inside the Forge function on the Atlassian side — issue text never
> leaves your Atlassian site. There is an optional LLM slot that can
> enhance the summary with a 2–3 sentence LLM summary, but it is OFF by
> default and only runs when a site admin sets an API key; without it,
> the panel is 100% functional on heuristics alone, and any LLM failure
> silently falls back to the local summary.
>
> **Built with:** Atlassian Forge (Node.js 20 runtime, UI Kit 2,
> `@forge/react`), Jira REST API (`/rest/api/3/issue`, JQL search),
> scopes `read:jira-work` + `write:jira-work`. The heuristic core is pure
> JavaScript with 18 unit tests.

## How it meets the requirements

- Built on **Atlassian Forge** with a `manifest.yml` and one Forge module
  (`jira:issuePanel` + backing function).
- Integrates with **Jira**: reads issue fields via the Jira REST API,
  searches the project with JQL, and writes back the priority (only on
  user confirmation).
- **Installation link + instructions:** TODO — fill in after deploy
  (see DEPLOY.md Step 5). Judges must be able to install the app in
  their test environment and see it behave exactly as in the video.

## Installation link (TODO)

```
TODO — paste the Forge installation link after `forge deploy` + `forge install`
```

**Installation instructions for judges:**

1. Open the installation link above and install Triage Lens on a Jira
   Cloud site (any project works).
2. Open any Jira issue (a Bug with a description works best for the demo).
3. Find the **Triage Lens** panel in the issue view.
4. Read the summary, the suggested priority and its reasons, the possible
   duplicates, and the suggested labels.
5. (Optional) Click **"Apply \<priority\> priority"** to write the
   suggested priority back to the issue.

No API keys, no extra configuration, and no paid plan are needed to try
the core features. The optional LLM summary needs `LLM_API_KEY` set via
`forge variables` and is not required for judging.

## Demo video (TODO)

- **URL:** TODO — public YouTube link, under 5 minutes (see DEMO-SCRIPT.md)
- **What it shows:** the panel on a real Jira issue, each feature in turn,
  and the Apply-priority confirmation flow.

## Repository

TODO — no public repo exists yet. The code lives in
`~/workspace/codegeist/triage-lens/` (manifest, `src/`, `test/`).
If a repo is published before submitting, paste its URL here and note
that the app was built during the Codegeist 2026 submission period
(27 Oct – 22 Dec 2026).

## What was verified before submitting (checklist)

- [x] Unit tests: 18/18 pass (`npm test` in `triage-lens/`, 13 Nov 2026 —
  15 heuristic tests + 3 JQL route regression tests; was 15/15 on 12 Nov)
- [x] JQL double-encoding bug fixed 13 Nov 2026 (`src/index.jsx`: raw JQL
  passed to Forge `route`, which encodes once; previously
  `encodeURIComponent` + `route` = `%2520`, Jira would reject every
  duplicate search and the list would always be empty)
- [x] Forge CLI 15.1.0 installed and working (`forge --version`)
- [x] `npm install` + `package-lock.json` committed (done 12 Nov 2026:
  554 packages, resolved @forge/api 5.3.0, @forge/bridge 5.17.0,
  @forge/react 11.17.0, @forge/resolver 1.8.0, react 18.3.1)
- [x] Lint client-side via `@forge/lint` (0 errors, 0 warnings — see DEPLOY.md)
- [ ] `forge lint` via CLI (needs login)
- [ ] `forge deploy` succeeds (needs login)
- [ ] App installed on the dev Jira site; panel visible on a real issue
- [ ] Demo video recorded (< 5 min) and uploaded as public YouTube
- [ ] Installation link pasted above and tested from a clean site
- [ ] Submission text + video + link reviewed once more on Devpost
      before the deadline (22 Dec 2026 12:00 PM PST / 23 Dec 03:00 WIB)

## Blockers (why this is still a draft)

1. **Atlassian account + API token + free Cloud Developer License** —
   only Cipoz can provide these. Without login, `forge lint` / `deploy` /
   `install` all fail at the auth precondition (proven 12 Nov 2026).
2. **Installation link and demo video** can only be produced after (1).
3. **No GitHub repo yet** — creating/pushing one is a Cipoz step
   (do not create it from the agent side without his go-ahead).

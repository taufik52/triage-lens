# DEMO-SCRIPT.md — Triage Lens for Jira (demo video, < 5 minutes)

Target: **one public YouTube video, under 5 minutes** (Codegeist 2026
requires < 5 min). Record after the app is deployed + installed on the
dev Jira site (DEPLOY.md Steps 2–4). All demo data below must be real
issues on that site — do not fake the panel with screenshots.

## Setup before recording (5–10 min, off-camera)

1. Dev Jira site open, logged in, one project with at least 3 issues:
   - **Issue A (the hero):** a Bug titled e.g. "Login fails with error 500
     after password reset" with a multi-sentence description mentioning
     the error, expected vs actual behaviour, and steps to reproduce.
     (Expected panel output: summary of 2–3 sentences, priority High or
     Highest with reasons, e.g. "Mentions a server error (+20)".)
   - **Issue B (near-duplicate of A):** e.g. "Cannot log in — 500 on
     submit" — so the duplicate list shows a real match with a similarity
     percentage.
   - **Issue C (low priority):** a Task e.g. "Fix typo in settings help
     text" — so the panel shows Lowest with the "Cosmetic / copy issue"
     reason. Good contrast shot.
2. Triage Lens installed and the panel visible on Issue A (open it once
   before recording to confirm it loads).
3. Browser zoom ~125%, Jira issue view full-screen, notifications off.
4. Optional LLM: leave OFF for the main recording (the panel is complete
   without it). If the LLM is enabled, say so on camera in one sentence.

## Script (total ≈ 3:30–4:00)

### 0:00–0:25 — Hook (25s)

> "Every morning, developers open Jira and face the same question: what
> is this issue, really — and how urgent is it? Triage Lens answers that
> inside the issue itself. This is a Forge app for Jira, built for
> Codegeist 2026."

Show: Jira issue list → click Issue A.

### 0:25–1:10 — Summary (45s)

> "The panel reads the issue and gives me a short summary — the most
> informative sentences, in order. The description is stored as ADF, so
> the app converts it to plain text first."

Show: scroll to the Triage Lens panel, point at the Summary section.
Read one summary sentence out loud.

### 1:10–2:10 — Suggested priority + Apply (60s)

> "Then it suggests a priority — and, importantly, it shows its work.
> Every reason has a score: server error, plus twenty; Bug, plus fifteen.
> That adds up to High. Nothing changes by itself — I decide. Watch:
> I click Apply High priority… and the issue's priority updates."

Show: the Suggested priority lozenge + reason bullets → click
"Apply High priority" → success message → the issue's priority field
now reads High.

### 2:10–3:00 — Duplicates (50s)

> "Next: possible duplicates. It compared this issue with the fifty most
> recent issues in the project and found this one — same login failure,
> eighty-something percent similar. One click and I'm looking at the
> original, instead of doing the work twice."

Show: the Possible duplicates list → click the duplicate link → the
other issue opens.

### 3:00–3:35 — Labels + privacy (35s)

> "It also suggests labels this issue doesn't have yet — backend,
> performance. And the privacy part: all of this is local heuristics
> running inside Forge. Your issue text never leaves your Atlassian site.
> There is an optional LLM summary, but it's off unless an admin sets a
> key — the panel works fully without it."

Show: Suggested labels line; point at the footer note in the panel.

### 3:35–4:00 — Close (25s)

> "Triage Lens: summary, priority with reasons, duplicates, and labels —
> on every Jira issue, with one click to apply. Built on Forge with UI Kit
> 2. Install it from the link in the submission. Thanks for watching."

Show: Issue C (typo task) for 3 seconds as a contrast — panel shows
Lowest — then end card with the app name.

## Recording checklist

- [ ] Under 5:00 total (aim ≤ 4:00; YouTube shows the duration — check
      before uploading).
- [ ] Public visibility (not Unlisted — judges need to watch it).
- [ ] Audio clear, no background music over the voice.
- [ ] Every feature shown is the real app on a real issue (no mockups).
- [ ] The Apply-priority click and its success message are visible.
- [ ] Title: "Triage Lens for Jira — Codegeist 2026 demo" (or similar).
- [ ] Paste the final YouTube URL into SUBMISSION.md and CIPOZ-STEPS.md.

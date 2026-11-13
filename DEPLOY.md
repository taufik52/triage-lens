# DEPLOY.md — Triage Lens for Jira

How to deploy the app, install it on a Jira Cloud dev site, and produce
the installation link the Codegeist judges need.

> **Current status (12 Nov 2026):** everything below step 3 is **not yet
> done** — it is blocked on an Atlassian account + API token + free Cloud
> Developer License, which only Cipoz can provide (agents must not create
> accounts). Steps 1–3 are already verified in this VM.

## Prerequisites

- Node.js 22+ (this VM: Node v24.22.1, npm 10.9.4 — verified 12 Nov 2026).
- Forge CLI 15.1.0 (installed at `~/workspace/.local/bin/forge` — verified
  12 Nov 2026: `forge --version` → `15.1.0`).
- An Atlassian account, an Atlassian API token, and a **free Atlassian
  Cloud Developer License** with a Jira Cloud dev site
  (https://developer.atlassian.com/cloud/ — free, no payment).

## Step 0 — Sandbox quirks (this VM only)

The sandbox blocks the `chown` syscall (`EPERM`). Two workarounds, both
already proven in this VM:

1. **npm install:** always pass `--ignore-scripts`. A normal install fails
   in the native `keytar` module (node-gyp). Keytar is not needed for
   lint/build/deploy.
   ```bash
   npm install --ignore-scripts
   ```
2. **Every `forge` command:** prefix with the LD_PRELOAD shim, otherwise
   Forge fails writing its config (`EPERM ... chown
   .../.config/@forge/cli-nodejs/config.json.tmp-...`).
   ```bash
   export PATH=~/workspace/.local/bin:$PATH
   LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge <command>
   ```
   The shim stubs `chown`/`fchown`/`lchown` to return 0. Since 13 Nov 2026
   it lives at `~/workspace/codegeist/tools/nochown.so` (source
   `tools/nochown.c` next to it) so it survives VM replacements — the old
   `/tmp/nochown.so` was lost when the VM was replaced; rebuild with
   `gcc -shared -fPIC -o ~/workspace/codegeist/tools/nochown.so ~/workspace/codegeist/tools/nochown.c`
   if the binary itself is ever lost.
   ```c
   #define _GNU_SOURCE
   #include <sys/types.h>
   #include <unistd.h>
   int chown(const char *p, uid_t o, gid_t g) { return 0; }
   int fchown(int fd, uid_t o, gid_t g) { return 0; }
   int lchown(const char *p, uid_t o, gid_t g) { return 0; }
   ```
   ```bash
   gcc -shared -fPIC -o ~/workspace/codegeist/tools/nochown.so /path/to/nochown.c
   ```
   Also run once (with the shim) to silence the interactive analytics
   prompt:
   ```bash
   LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge settings set usage-analytics false
   ```

## Step 1 — Verify the code (no login needed, already done 12 Nov 2026)

```bash
cd ~/workspace/codegeist/triage-lens
npm test
# node --test test/heuristics.test.js → 15 tests, 15 pass, 0 fail
npm install --ignore-scripts
# installs @forge/api, @forge/bridge, @forge/react, @forge/resolver, react
# and writes package-lock.json (locks the real resolved versions)
```

**Lint without login:** `forge lint` needs login, but the Forge linter can
be run directly from the CLI's bundled `@forge/lint` v6.4.0 in client-side
mode — no login, no network. A ready-made runner is committed at
`triage-lens/lint-client-side.cjs` (it stubs the Statsig service the
linter expects and needs the `LD_PRELOAD` shim from Step 0):

```bash
cd triage-lens
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so node lint-client-side.cjs
# → 0 errors, 0 warnings, 0 approvals (verified 12 Nov 2026)
# Note: run it from inside triage-lens/ — from elsewhere it reports a
# spurious "manifest-file-required" error.
```

Also verified without login: `src/index.jsx` parses as JSX (via the
CLI's bundled `@babel/parser`), and all 9 UI Kit 2 components it imports
(Box, Button, Heading, Link, Lozenge, SectionMessage, Spinner, Stack,
Text) exist in the installed `@forge/react` 11.17.0.

## Step 2 — Log in to Forge (needs Cipoz)

```bash
export PATH=~/workspace/.local/bin:$PATH
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge login
# …or non-interactively with an API token:
# FORGE_EMAIL=<email> FORGE_API_TOKEN=<token> forge login
```

Get the API token at https://id.atlassian.com/manage-profile/security/api-tokens
(log in with the Atlassian account, create a token, keep it secret — never
commit it, never paste it into chat).

**Proven blocker:** before login, *every* Forge command fails at the auth
precondition, e.g. `forge lint` (verified 12 Nov 2026):
```
Error: Not logged in. If a local keychain is available, run forge login,
otherwise set environment variables before trying again.
```

## Step 3 — Register, lint, deploy

```bash
cd ~/workspace/codegeist/triage-lens
export PATH=~/workspace/.local/bin:$PATH
export LD_PRELOAD=~/workspace/codegeist/tools/nochown.so   # or prefix each command

forge register          # replaces the placeholder app id in manifest.yml
forge lint              # Forge manifest + code checks
forge deploy            # deploys to the development environment
```

Notes:

- `manifest.yml` currently carries the placeholder app id
  `ari:cloud:ecosystem::app/00000000-0000-0000-0000-000000000000`.
  `forge register` replaces it with the real id — commit that change.
- Runtime is `nodejs20.x`; scopes are `read:jira-work` and
  `write:jira-work` (see `manifest.yml`).

## Step 4 — Install on the dev Jira site

```bash
forge install --site <your-dev-site>.atlassian.net --product jira
# or: forge install --environment development
```

Then open any Jira issue on that site: the **Triage Lens** panel should
appear in the issue view. If the panel does not show, check
`forge install --list` and that the app is enabled for the project.

## Step 5 — Create the installation link (for the judges)

```bash
forge install --list
# copy the installation link, or generate a shareable install URL from
# the Forge developer console for the app
```

The Devpost submission must include an installation link + instructions
so judges can install the app in their own test environment and verify it
runs as shown in the video. Paste the link and the steps from Step 4 into
[SUBMISSION.md](SUBMISSION.md) before submitting.

## Step 6 — Optional: enable the LLM slot (not required)

The panel is complete without it. To demo the LLM-enhanced summary:

```bash
forge variables set LLM_API_KEY <key> --environment production
# optional:
forge variables set LLM_API_BASE https://api.openai.com/v1 --environment production
forge variables set LLM_MODEL gpt-4o-mini --environment production
forge deploy
```

The key must be OpenAI-compatible (`chat/completions`). Never hard-code
the key; never commit it. Without the variable the panel uses local
heuristics only.

## Step 7 — Redeploy after any code change

```bash
forge deploy && forge install --upgrade   # if already installed
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Error: Not logged in...` | Run `forge login` (Step 2). No Forge command works without it. |
| `EPERM ... chown ... config.json.tmp` | Missing LD_PRELOAD shim — see Step 0. |
| `npm install` fails in `keytar` / node-gyp | Use `npm install --ignore-scripts` — see Step 0. |
| Panel missing on an issue | App not installed/enabled for that site/project; re-run Step 4 and check `forge install --list`. |
| `getTriage` fails to load | Check the Forge function logs: `forge logs` (needs login). The duplicate-search step is fail-open — a JQL failure returns an empty duplicate list, not an error. |
| LLM summary never appears | `LLM_API_KEY` not set (expected — OFF by default) or the LLM call failed (fail-open by design). Check `forge variables list`. |

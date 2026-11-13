# PAUSE NOTE — Codegeist 2026: "Triage Lens for Jira"

**Status: DI-PAUSE atas perintah Cipoz, 12 Nov 2026 ~11:30 WIB.**
Tidak ada pekerjaan baru yang dimulai setelah perintah pause. Tidak ada pendaftaran,
submit, pembayaran, atau login apa pun yang dilakukan.

## Apa yang sudah jadi

App Forge **"Triage Lens for Jira"** (track: Apps for Software Teams) — panel di issue
Jira yang meringkas deskripsi issue (ADF → teks), menyarankan prioritas (heuristik
skor + alasan), mendeteksi duplikasi potensial (Jaccard similarity vs 50 issue
terbaru di proyek yang sama), menyarankan label, dan tombol "Apply priority"
(butuh konfirmasi user di UI). Slot LLM opsional (llm.js) OFF secara default —
hanya jalan bila `forge variables set LLM_API_KEY ...`; tanpa key, panel 100%
heuristik lokal dan teks issue tidak keluar dari situs Atlassian. Tanpa key
apa pun yang di-hardcode.

**Bukti yang sudah terverifikasi:**
- Forge CLI 15.1.0 terpasang di `~/workspace/.local` (via `npm install
  --ignore-scripts @forge/cli`) dan jalan: `forge --version` → `15.1.0`.
- Unit test heuristik: **15/15 lolos** (`node --test test/heuristics.test.js`).
- Semua file sumber lengkap dan utuh (dicek setelah pause — tidak ada file
  setengah-tulis).

**Yang BELUM terverifikasi (terhenti oleh pause, bukan oleh error):**
- `npm install` di `triage-lens/` — DIBATALKAN oleh perintah pause; `node_modules/`
  dan `package-lock.json` belum ada. Dependensi di package.json masih versi
  perkiraan (`@forge/api ^5.3.0`, `@forge/react ^11.0.0`, dll.) — belum dikunci.
- `forge lint` via CLI — butuh login Atlassian (lihat Blocker). Rencana cadangan
  sudah disiapkan: paket `@forge/lint` v6.4.0 (di dalam CLI) mengekspor
  `LintClass`/`lint()` dengan mode `client-side` yang bisa dipanggil langsung
  via node tanpa login — BELUM dicoba.
- `forge build` / deploy / install — butuh login Atlassian.
- Dokumen README.md, DEPLOY.md, SUBMISSION.md, DEMO-SCRIPT.md — BELUM ditulis.

## Daftar file

```
~/workspace/codegeist/
├── PAUSE-NOTE.md                  (file ini)
└── triage-lens/
    ├── manifest.yml               (jira:issuePanel + function main; app id PLACEHOLDER 00000000-...)
    ├── package.json               (deps @forge/* + react; script test)
    ├── src/
    │   ├── index.jsx              (UI Kit 2 panel + resolver getTriage / applyPriority)
    │   ├── heuristics.js          (summarize, suggestPriority, findDuplicates, suggestLabels)
    │   ├── adf.js                 (ADF → plain text)
    │   └── llm.js                 (slot LLM opsional, fail-open ke heuristik)
    └── test/
        └── heuristics.test.js     (15 tes, semua lolos)
```

## Langkah berikut (saat sinyal lanjut datang)

1. `cd triage-lens && npm install --ignore-scripts` (kunci versi nyata di
   package-lock.json; perbaiki versi di package.json bila perlu).
2. Cek ekspor komponen `@forge/react` yang dipakai di index.jsx
   (Box, Button, Heading, Link, Lozenge, SectionMessage, Spinner, Stack, Text).
3. Parse-check `src/index.jsx` (JSX) via `@babel/core` yang sudah ada di
   dependensi CLI.
4. Jalankan linter Forge langsung via node (`@forge/lint`, mode client-side)
   sebagai pengganti `forge lint` yang butuh login; catat hasilnya.
5. Tulis README.md, DEPLOY.md, SUBMISSION.md (Bahasa Inggris), DEMO-SCRIPT.md
   (<5 menit) di `~/workspace/codegeist/`.
6. Serahkan ke Cipoz untuk langkah akun (lihat Blocker).

## Blocker (mentok tanpa akun Atlassian — sudah terbukti dengan output error)

1. **Semua perintah `forge` butuh login.** `forge create`, `forge lint`,
   `forge deploy`, `forge install` semuanya gagal di precondition auth:
   `Error: Not logged in. If a local keychain is available, run forge login,
   otherwise set environment variables...` (terbukti 12 Nov ~11:08–11:15 WIB).
   Butuh: akun Atlassian Cipoz + API token (`forge login` atau env
   `FORGE_EMAIL` + `FORGE_API_TOKEN`) + Atlassian Cloud Developer License
   gratis + site dev Jira. **Ini langkah Cipoz — agen tidak boleh membuat akun.**
2. **Sandbox VM memblokir syscall `chown`/`fchown`** (EPERM). Dampak:
   - `npm install @forge/cli` normal GAGAL di modul native `keytar`
     (node-gyp). Solusi yang dipakai: `--ignore-scripts` (berhasil; keytar
     tidak dibutuhkan untuk lint/build).
   - Setiap perintah `forge` gagal menulis config (`EPERM ... chown
     .../.config/@forge/cli-nodejs/config.json.tmp-...`). Solusi yang dipakai:
     shim LD_PRELOAD `/tmp/nochown.so` (stub chown/fchown/lchown → return 0)
     + `forge settings set usage-analytics false` (agar tidak muncul prompt
     analytics interaktif). **Catatan: `/tmp/nochown.so` hilang bila VM
     diganti** — simpan ulang bila perlu (source C 6 baris; atau rebuild dari
     `gcc -shared -fPIC -o /tmp/nochown.so` dengan source di bawah).
     Source shim (untuk rebuild):
     ```c
     #define _GNU_SOURCE
     #include <sys/types.h>
     #include <unistd.h>
     int chown(const char *p, uid_t o, gid_t g) { return 0; }
     int fchown(int fd, uid_t o, gid_t g) { return 0; }
     int lchown(const char *p, uid_t o, gid_t g) { return 0; }
     ```
   - Pakai prefix: `LD_PRELOAD=/tmp/nochown.so forge ...` dengan
     `PATH=~/workspace/.local/bin:$PATH`.
3. **App id di manifest.yml masih placeholder** (`.../00000000-...`) —
   diganti oleh `forge register`/`forge deploy` setelah login.

## Keputusan yang butuh Cipoz

1. **Buat akun Atlassian + Cloud Developer License gratis + site Jira dev**,
   lalu jalankan `forge login` (atau berikan API token via jalur aman) —
   tanpa ini tidak bisa deploy/install/demo live.
2. **Keputusan submit Devpost** (tenggat 22 Des 2026 12:00 PT = 23 Des 03:00 WIB):
   video demo <5 menit (YouTube publik) + installation link — keduanya butuh
   app yang sudah ter-deploy; jangan submit sebelum itu.
3. Opsional: **kunci LLM** bila mau demo fitur LLM di video (bila tidak, panel
   tetap lengkap dengan heuristik lokal saja).
4. Konfirmasi lanjut / tidak setelah World Is Flat selesai (program ini
   di-pause karena Cipoz memerintahkan "Gas WorldIsFlat sekarang, drop yang
   lain dulu" 12 Nov 11:28 WIB).

## Yang TIDAK dilakukan (sesuai brief)

Tidak daftar/submit Devpost, tidak buat akun Atlassian, tidak deploy ke cloud
Atlassian, tidak buat repo GitHub (repo lokal saja — dan belum ada repo lokal
yang di-init; baru folder kerja).

---

## RESUME — 12 Nov 2026 ~12:30 WIB (agen program, atas perintah "Gas semuanya yang bisa jalan")

### 1. Test + install + build segar (tanpa login Atlassian)

- **Unit test: 15/15 lolos, 0 fail** — dijalankan 2x segar
  (`node --test test/heuristics.test.js`, terakhir setelah `npm install`).
  Node v24.22.1, npm 10.9.4.
- **`npm install --ignore-scripts`: BERHASIL** (exit 0, ~12 menit, 554
  packages). `node_modules/` (146 entri) + `package-lock.json` sekarang ada.
  Versi nyata yang terkunci: `@forge/api 5.3.0`, `@forge/bridge 5.17.0`,
  `@forge/react 11.17.0`, `@forge/resolver 1.8.0`, `react 18.3.1`.
  Warning hanya peer-dependency lama + paket deprecated (tidak fatal).
- **Forge CLI 15.1.0 terkonfirmasi jalan** (`forge --version` → `15.1.0`,
  di `~/workspace/.local/bin/forge`, dengan shim `LD_PRELOAD=/tmp/nochown.so`).
- **`forge lint`: TETAP MENTOK di login** (bukti segar):
  `Error: Not logged in. If a local keychain is available, run forge login...`
- **`forge deploy`: TETAP MENTOK di login** (bukti segar, error yang sama).
- **Lint TANPA login — BERHASIL via `@forge/lint` v6.4.0 client-side:**
  runner `triage-lens/lint-client-side.cjs` (stub Statsig service +
  shim LD_PRELOAD, dijalankan dari dalam `triage-lens/`) →
  **0 errors, 0 warnings, 0 approvals**. Catatan: dari direktori lain
  muncul 1 error palsu `manifest-file-required` — artefak cwd, bukan
  masalah kode; dari dalam `triage-lens/` hasilnya bersih.
- **JSX parse-check: OK** — `src/index.jsx` ter-parse via `@babel/parser`
  bawaan CLI (15 top-level statements).
- **Komponen UI Kit 2: SEMUA ADA** — ke-9 komponen yang diimpor
  `index.jsx` (Box, Button, Heading, Link, Lozenge, SectionMessage,
  Spinner, Stack, Text) terverifikasi ada di `@forge/react` 11.17.0
  (`out/components/ui-kit-components.js`). Catatan: `require('@forge/react')`
  langsung di Node gagal dengan `BridgeAPIError` — itu ekspektasi, bukan
  bug: bridge Forge hanya hidup di dalam produk Atlassian.
- **Tidak ada script `build` terpisah** — Forge tidak punya `npm run build`;
  build terjadi di `forge deploy` (mentok login). Jadi tidak ada yang bisa
  di-build tanpa login selain cek-cek di atas.

### 2. Dokumen baru (dibuat 12 Nov 2026, isi dari kode yang sebenarnya)

Semua di `~/workspace/codegeist/` (Bahasa Inggris kecuali CIPOZ-STEPS):

- `README.md` — gambaran app, fitur, privasi, cara test/deploy.
- `DEPLOY.md` — langkah deploy + install + troubleshooting, termasuk
  shim chown, `--ignore-scripts`, dan cara lint tanpa login.
- `SUBMISSION.md` — draf submission Devpost (judul, tagline, deskripsi,
  cara memenuhi syarat, checklist). Installation link + URL video + URL
  repo masih TODO — ketiganya butuh langkah Cipoz.
- `DEMO-SCRIPT.md` — naskah video demo < 5 menit (±3:30–4:00), dengan
  setup 3 issue contoh (Bug 500, duplikatnya, typo task).
- `CIPOZ-STEPS.md` — (Bahasa Indonesia) 8 langkah bernomor untuk Cipoz:
  akun + Developer License → API token → login/deploy/install →
  installation link → video YouTube Public → (opsional LLM) → submit
  Devpost → (opsional repo GitHub). Estimasi total ±1,5–2 jam kerja Cipoz.
- `triage-lens/lint-client-side.cjs` — runner lint tanpa login (baru).

Aturan hadiah dicek ulang ke Devpost resmi 12 Nov 2026:
codegeist2026.devpost.com — submissions tutup 22 Des 2026 12:00 PM PST
(= 23 Des 2026 03:00 WIB), kategori hadiah $15K/$8K/$5K per kategori,
penilaian 20% masing-masing: technical implementation, design, potential
impact, originality, presentation. Submission butuh installation link +
instruksi + video YouTube publik < 5 menit. Bonus prizes: tidak ada yang
diikuti (app ini tanpa Rovo / Teamwork Graph / MCP / Marketplace).

### 3. Blocker tersisa (tidak berubah — butuh Cipoz)

1. **Akun Atlassian + API token + Cloud Developer License gratis + site
   Jira dev** — tanpa ini `forge lint` / `deploy` / `install` mustahil
   (terbukti segar 12 Nov 2026). Agen tidak boleh membuat akun/login.
2. **App id di manifest.yml masih placeholder** — diganti `forge register`
   setelah login.
3. **Installation link + video demo + submit Devpost** — semuanya
   menunggu (1); video butuh app ter-install di site dev.
4. **Repo GitHub belum ada** — jangan dibuat agen; keputusan Cipoz.

### 4. Yang TIDAK dilakukan (sesuai perintah)

Tidak keluar uang, tidak KYC, tidak login pakai akun Cipoz (Atlassian /
Devpost / GitHub), tidak buat repo GitHub, tidak submit apa pun, tidak
edit `~/MEMORY.md`, tidak edit artifact panel, tidak hardcode key/token.

---

## RESUME 2 — 13 Nov 2026 ~18:47 WIB (agen program, perintah "majukan sejauh mungkin tanpa Cipoz")

### 1. Verifikasi segar (tanpa login Atlassian)
- **Unit test: 18/18 lolos, 0 fail** (`npm test`, Node v24.22.1) — 15 lama + 3 baru.
- **Lint client-side: 0 errors, 0 warnings, 0 approvals** (runner
  `lint-client-side.cjs`, shim baru — lihat §2).
- **Forge CLI 15.1.0** terkonfirmasi jalan (`forge --version`).
- **Aturan Devpost dicek ulang ke web 13 Nov 2026:** tutup 22 Des 2026
  12:00 PM PST (= 23 Des 03:00 WIB), $120K total, $15K/$8K/$5K per
  kategori — tidak berubah.

### 2. Bug nyata ditemukan + diperbaiki: JQL double-encoding
- `src/index.jsx` membungkus JQL di `encodeURIComponent()`, padahal tag
  `route` dari `@forge/api` SUDAH meng-encode nilai interpolasi di mode
  query (terbukti dari `node_modules/@forge/api/out/safeUrl.js`,
  `escapeParameter` mode `'query'` → `encodeURIComponent`).
- Akibat: Jira menerima `project%2520%253D...`, menolak JQL, dan daftar
  duplikat SELALU kosong — fail-open, panel tetap tampil, jadi tidak
  terlihat. Perbaikan: JQL mentah diteruskan ke `route` + komentar
  penjelas di kode.
- Regresi: `test/route.test.js` (3 tes, memakai implementasi `route`
  asli) + `npm test` diubah ke `node --test test/*.test.js`.
  Catatan: `node --test test/` (direktori) TIDAK jalan di Node 24 —
  butuh glob eksplisit.

### 3. Shim nochown diselamatkan dari /tmp ke workspace
- `/tmp/nochown.so` HILANG (VM diganti). Dibangun ulang + disimpan
  permanen di `tools/nochown.c` + `tools/nochown.so` (di dalam workspace,
  selamat dari ganti VM). DEPLOY.md + CIPOZ-STEPS.md diperbarui ke path
  baru; DEPLOY.md juga dikoreksi (shim tidak lagi "hilang bila VM diganti").

### 4. Repo lokal siap push
- `git init` di `~/workspace/codegeist/`, `.gitignore` (node_modules/),
  commit awal berisi seluruh paket (kode + tes + dokumen + tools).
  TIDAK ada remote — push menunggu Cipoz membuat repo GitHub.

### 5. Dokumen diperbarui
- README.md (status 13 Nov, 18/18, catatan bug JQL), SUBMISSION.md
  (checklist 18/18 + bug JQL), DEPLOY.md + CIPOZ-STEPS.md (path shim).

### 6. Blocker tersisa — TIDAK BERUBAH, butuh Cipoz
Akun Atlassian + API token + Cloud Developer License + site Jira dev;
`forge register/deploy/install`; installation link; video demo YouTube
publik < 5 menit; submit Devpost; (opsional) repo GitHub. Lihat
CIPOZ-STEPS.md — estimasi tetap ±1,5–2 jam kerja Cipoz.

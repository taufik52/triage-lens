# RESUME STATUS — Codegeist 2026: Triage Lens for Jira

**Tanggal verifikasi:** 15 Nov 2026 ~11:17 WIB (04:17 UTC)
**Perintah:** Cipoz bilang GAS untuk resume (15 Nov 2026 ~11:15 WIB).
**Batasan yang dipatuhi:** TIDAK membaca `CIPOZ-STEPS.md` di mana pun.
Tidak membuat akun Atlassian, tidak login forge, tidak `forge register/deploy/install`,
tidak submit apa pun. Semua langkah login/Atlassian adalah Cipoz-only.

**Proyek:** Triage Lens for Jira — Forge app (UI Kit 2), panel di issue Jira:
ringkasan, saran prioritas + alasan, deteksi duplikat, saran label, tombol
Apply priority (konfirmasi user). Track: Apps for Software Teams.
**Tenggat submit Devpost:** 22 Des 2026 12:00 PM PST = **23 Des 2026 03:00 WIB**
(codegeist2026.devpost.com).

---

## 1. Status dokumen (dibaca 15 Nov 2026)

| File | Status |
|---|---|
| `PAUSE-NOTE.md` | Ada. Pause awal 12 Nov ~11:30 WIB; resume log 12 Nov ~12:30 WIB dan 13 Nov ~18:47 WIB. Berisi blocker + workaround shim chown + riwayat perbaikan bug JQL. |
| `README.md` | Ada, lengkap (fitur, privasi, cara test/deploy, layout). Status tertulis 13 Nov 2026: code complete, 18/18 hijau, belum deploy. |
| `DEPLOY.md` | Ada, lengkap (prasyarat, shim chown, lint tanpa login, login/register/deploy/install, installation link, LLM opsional, troubleshooting). |
| `SUBMISSION.md` | Ada, draf Devpost Bahasa Inggris siap tempel — TAPI dua TODO-nya sudah kedaluwarsa (lihat §5): installation link + video masih TODO (benar, menunggu deploy), sedangkan repo ditulis "belum ada" padahal repo sudah publik. |
| `DEMO-SCRIPT.md` | Ada, lengkap. Video < 5 menit, target ±3:30–4:00, setup 3 issue contoh (Bug 500, duplikatnya, typo task), naskah per segmen + checklist rekaman. |

**Yang sudah siap:** kode app lengkap, test hijau, lint client-side 0 error
(verifikasi 12–13 Nov), semua dokumen di atas, shim nochown tersimpan permanen
di `tools/nochown.c` + `tools/nochown.so` (selamat dari ganti VM).

**Yang kurang (semua menunggu Cipoz):** login Atlassian/forge, `forge register`
(app id), deploy, install di site dev, installation link, video demo, submit
Devpost. Detail di §6.

---

## 2. Forge CLI — KETEMU, tidak perlu install ulang

- **Lokasi persis:** `~/workspace/.local/bin/forge`
  → symlink ke `~/workspace/.local/node_modules/.bin/forge`
  (paket `@forge/cli` di `~/workspace/.local/node_modules/@forge/cli`, versi 15.1.0)
- **Versi (terverifikasi 15 Nov 2026):** `forge --version` → **15.1.0**
  - Tanpa shim: `15.1.0`, exit 0
  - Dengan shim: `LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge --version` → `15.1.0`, exit 0
- **Catatan PATH:** `forge` TIDAK ada di PATH default sesi ini (itu sebabnya
  `which forge` kosong). `~/.local/bin/forge` juga TIDAK ada — jangan dicari
  di sana. Yang benar: `export PATH=~/workspace/.local/bin:$PATH`.
  npm global (`/usr/lib/node_modules`) TIDAK berisi `@forge/cli`.
- **Shim chown:** `~/workspace/codegeist/tools/nochown.so` ada (15.168 byte,
  13 Nov 2026) + sumber `tools/nochown.c`. Tetap pakai prefix
  `LD_PRELOAD=~/workspace/codegeist/tools/nochown.so` untuk tiap perintah
  `forge` (VM memblokir syscall chown → EPERM saat forge menulis config).
- **Tidak dilakukan:** tidak ada install ulang, tidak ada login forge.

---

## 3. Test — 18/18 LOLOS (verifikasi segar 15 Nov 2026)

Perintah: `cd ~/workspace/codegeist/triage-lens && npm test`
(`npm test` = `node --test test/*.test.js`; Node v24.22.1, npm 10.9.4)

```
tests 18, pass 18, fail 0, cancelled 0, skipped 0, duration ~522 ms, EXIT 0
```

Rincian: 15 tes heuristik/ADF (`heuristics.test.js`: adfToText, summarize,
suggestPriority, jaccardSimilarity, findDuplicates, suggestLabels, tokenize)
+ 3 tes regresi JQL (`route.test.js`: raw JQL single-encoded, pre-encoding
double-encode, `index.jsx` tidak pre-encode JQL). Sesuai harapan pasca
perbaikan bug JQL double-encoding 13 Nov 2026 (JQL mentah ke tag `route`
`@forge/api`, bukan `encodeURIComponent` + `route`).

Dependensi terkunci: `@forge/api 5.3.0` (terverifikasi di
`triage-lens/node_modules/@forge/api/package.json`); `node_modules/` ada.

---

## 4. Manifest — app id MASIH PLACEHOLDER (terverifikasi)

File: `~/workspace/codegeist/triage-lens/manifest.yml`

```yaml
app:
  id: ari:cloud:ecosystem::app/00000000-0000-0000-0000-000000000000
  name: triage-lens
  runtime:
    name: nodejs20.x
```

Komentar di file: "PLACEHOLDER — replaced by `forge register` / `forge deploy`
once an Atlassian account is connected. Do not ship this id."
Modul: `jira:issuePanel` (key `triage-lens-panel`, function `main`, handler
`index.run`). Scopes: `read:jira-work` + `write:jira-work`.
**Tidak diubah** — diganti oleh `forge register` setelah login (langkah Cipoz).

---

## 5. Git — BERSIH, SINKRON, repo GitHub SUDAH PUBLIK

- Cabang lokal: `master`, commit `6d5d153` — "Triage Lens for Jira —
  Codegeist 2026: app lengkap, 18/18 tests, docs + submission draft"
- Status: **bersih** (`git status -sb` → `## master...origin/master`, tanpa
  file kotor; `git diff --stat HEAD` kosong).
- Remote: `origin https://github.com/taufik52/triage-lens.git` (fetch + push).
- `git ls-remote origin HEAD` → `6d5d153610128233507965b419b6a244bff0f9a6`
  (sama persis dengan HEAD lokal — sinkron).
- **Koreksi atas catatan lama:** repo GitHub **SUDAH ADA dan PUBLIK**
  (dicek 15 Nov 2026 via halaman repo: Visibility Public, default branch
  master, current commit `6d5d153…`, 1 commit, dibuat 2026-11-13T11:56:26Z).
  Jadi pernyataan di `SUBMISSION.md` ("no public repo exists yet") dan
  `PAUSE-NOTE.md` ("belum ada repo / push menunggu Cipoz membuat repo")
  sudah kedaluwarsa. URL repo untuk submission:
  **https://github.com/taufik52/triage-lens**
  (tinggal diisi ke `SUBMISSION.md` saat submit; tidak diedit di sini).

---

## 6. Checklist langkah Cipoz-only (berurutan)

Semua di bawah ini HANYA bisa Cipoz — agen tidak boleh membuat akun,
memakai kredensial Cipoz, atau login atas nama Cipoz.

1. **Buat akun Atlassian** (bila belum ada).
2. **Buat API token** di https://id.atlassian.com/manage-profile/security/api-tokens
   — simpan rahasia, jangan commit, jangan tempel di chat.
3. **Minta Cloud Developer License gratis + buat site Jira dev**
   (https://developer.atlassian.com/cloud/ — gratis, tanpa pembayaran).
   Catat alamat site: `<nama-site>.atlassian.net`.
4. **`forge login`** — dari VM, dengan PATH + shim:
   `export PATH=~/workspace/.local/bin:$PATH` lalu
   `LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge login`
   (atau non-interaktif `FORGE_EMAIL=<email> FORGE_API_TOKEN=<token>`).
   Estimasi total kerja Cipoz langkah 1–4 + 5–8: ±1,5–2 jam.
5. **`forge register`** di `~/workspace/codegeist/triage-lens/` — mengganti
   app id placeholder di `manifest.yml` dengan id asli; commit perubahan itu.
6. **`forge lint`** lalu **`forge deploy`** (environment development).
7. **`forge install --site <nama-site>.atlassian.net --product jira`** —
   lalu buka satu issue Jira di site dev dan pastikan panel Triage Lens
   muncul dan berfungsi.
8. **Buat installation link** (`forge install --list` / Forge developer
   console) — link ini wajib ada di submission agar juri bisa install.
9. **Rekam video demo < 5 menit** mengikuti `DEMO-SCRIPT.md` (±3:30–4:00),
   pakai issue asli di site dev (bukan mockup), upload ke YouTube sebagai
   **Public** (bukan Unlisted).
10. **Isi `SUBMISSION.md`**: tempel installation link + URL video YouTube +
    URL repo https://github.com/taufik52/triage-lens; review sekali lagi.
11. **Submit di Devpost** (codegeist2026.devpost.com, kategori Apps for
    Software Teams) **sebelum 23 Des 2026 03:00 WIB**.
12. (Opsional) Aktifkan slot LLM bila mau demo ringkasan LLM:
    `forge variables set LLM_API_KEY <key>` + `forge deploy` — panel tetap
    lengkap tanpa ini (heuristik lokal saja).

---

## 7. Addendum — verifikasi ulang 19 Nov 2026 (~14:10 WIB, perintah "Gas, lanjut Triage Lens sampai submit")

- **Test: 18/18 PASS, 0 fail** (`npm test`, ~286 ms) — terverifikasi segar.
- **Lint client-side: 0 errors, 0 warnings, 0 approvals** — terverifikasi
  segar, TAPI hanya bila dijalankan dengan shim: tanpa `LD_PRELOAD` skrip
  `lint-client-side.cjs` melempar `EPERM chown` pada VM ini (bukan error
  kode). Perintah benar: `LD_PRELOAD=~/workspace/codegeist/tools/nochown.so
  node lint-client-side.cjs` (sudah didokumentasikan di DEPLOY.md § lint).
- **Forge CLI 15.1.0** terverifikasi segar dengan shim (`forge --version`).
- **Git: sinkron** — HEAD lokal = origin HEAD = `6d5d153`; remote
  https://github.com/taufik52/triage-lens.git (publik).
- **Code review ringan `src/index.jsx` (19 Nov):** tidak ada masalah —
  JQL mentah ke `route` (bug double-encode sudah diperbaiki), duplicate
  search fail-open, Apply priority hanya setelah klik user, footer privasi
  benar. Tidak ada perubahan kode yang diperlukan.
- **Dokumen diperbarui 19 Nov:** `SUBMISSION.md` (stempel verifikasi tes/
  lint/forge 19 Nov + repo URL sudah diperbaiki 17 Nov), `README.md`
  (status 19 Nov + repo publik). Di-commit + push sebagai commit baru
  setelah `6d5d153` (lihat `git log`).
- **DEMO-SCRIPT.md:** sudah lengkap (±3:30–4:00, setup 3 issue contoh,
  naskah per segmen, checklist) — siap dipakai begitu app ter-deploy.
  Tidak diubah 19 Nov.
- **Status submission: BELUM SIAP KIRIM.** Yang masih mentok sama seperti
  §6 (semua Cipoz-only): akun Atlassian + API token + Cloud Developer
  License → `forge login` → `forge register` (ganti app id placeholder) →
  `forge deploy` → `forge install` di site dev → installation link →
  rekam video demo (< 5 mnt, YouTube Public) → isi link + video ke
  `SUBMISSION.md` → submit Devpost sebelum **23 Des 2026 03:00 WIB**.
  Tidak ada langkah agen yang tersisa sebelum langkah-langkah itu.

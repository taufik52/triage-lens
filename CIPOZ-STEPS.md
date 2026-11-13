# CIPOZ-STEPS — Codegeist: Triage Lens for Jira

Langkah-langkah yang **hanya Cipoz yang bisa lakukan** (agen tidak boleh:
membuat akun, login pakai akun Cipoz, submit, atau mengeluarkan uang).
Aplikasi sudah jadi dan dites 15/15 — yang tersisa adalah akun, deploy,
video, dan submit.

**Tenggat: 22 Des 2026 12:00 WIB siang waktu Pasifik = 23 Des 2026 03:00 WIB.**
Jangan submit di menit terakhir — targetkan selesai 21 Des 2026.

**Biaya: $0.** Semua langkah di bawah gratis (Developer License Atlassian
gratis, Forge gratis, Devpost gratis, YouTube gratis). Jangan bayar apa pun.

---

## Langkah 1 — Buat akun Atlassian + Developer License gratis (~15 mnt)

1. Buka https://developer.atlassian.com/cloud/ dan daftar / login dengan
   akun Atlassian Cipoz (buat akun baru bila belum ada — pakai email Cipoz
   sendiri).
2. Ikuti alur pembuatan **Cloud Developer License** gratis — ini memberi
   site Jira Cloud dev, misal `https://<nama>.atlassian.net`.
3. Catat alamat site-nya, contoh: `namasite.atlassian.net`.
4. Buka site itu, buat 1 project Jira (template Scrum atau Kanban, bebas)
   dan isi 3 issue contoh (supaya panel ada yang ditampilkan di video):
   - **Issue A:** Bug — judul "Login fails with error 500 after password
     reset", deskripsi beberapa kalimat (error, expected vs actual, steps
     to reproduce).
   - **Issue B:** Bug — judul "Cannot log in — 500 on submit"
     (duplikat dekat Issue A, untuk demo deteksi duplikat).
   - **Issue C:** Task — judul "Fix typo in settings help text"
     (untuk demo prioritas Lowest).

## Langkah 2 — Buat API token Atlassian (~5 mnt)

1. Buka https://id.atlassian.com/manage-profile/security/api-tokens
   (login dengan akun yang sama).
2. Klik **Create API token**, beri label misal `forge-codegeist`,
   lalu salin tokennya.
3. **Jangan kirim token lewat chat biasa dan jangan commit ke repo.**
   Token ini dipakai sekali untuk `forge login` di langkah 3 — agen akan
   memintanya lewat jalur aman bila diperlukan, atau Cipoz bisa
   menjalankannya sendiri di terminal (lihat langkah 3).

## Langkah 3 — Login Forge + deploy + install (~15 mnt)

Jalankan di terminal VM (atau minta agen melakukannya setelah token siap
— agen TIDAK boleh login sendiri tanpa token dari Cipoz):

```bash
export PATH=~/workspace/.local/bin:$PATH
cd ~/workspace/codegeist/triage-lens
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge login
# masukkan email Atlassian + API token dari Langkah 2 saat diminta

LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge register   # ganti app id placeholder
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge lint       # harus lolos
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge deploy     # deploy ke development
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge install --site <namasite>.atlassian.net --product jira
```

Verifikasi: buka Issue A di Jira — panel **Triage Lens** harus muncul
dengan Summary, Suggested priority, Possible duplicates, dan Suggested
labels. Bila panel tidak muncul, kabari agen (cek `forge install --list`).

## Langkah 4 — Ambil installation link (~5 mnt)

1. Jalankan `LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge install --list`
   (atau ambil link install dari Forge developer console).
2. Salin link installasi itu.
3. Tempel link + instruksi install ke file
   `~/workspace/codegeist/SUBMISSION.md` (bagian "Installation link") —
   atau kirim linknya ke agen untuk ditempelkan.

## Langkah 5 — Rekam video demo < 5 menit (~30–60 mnt)

1. Baca naskah di `~/workspace/codegeist/DEMO-SCRIPT.md`
   (durasi target 3,5–4 menit).
2. Rekam layar (screen recording) saat memakai panel di Issue A:
   ringkasan → prioritas + klik Apply → duplikat → label.
   Semua harus aplikasi asli di issue asli, bukan mockup.
3. Upload ke **YouTube sebagai Public** (bukan Unlisted),
   judul misal "Triage Lens for Jira — Codegeist 2026 demo".
4. Salin URL YouTube-nya, tempel ke `SUBMISSION.md`
   (bagian "Demo video") — atau kirim URL-nya ke agen.

## Langkah 6 — (Opsional, boleh skip) Kunci LLM

Panel sudah lengkap **tanpa** LLM. Langkah ini hanya bila Cipoz mau
demo ringkasan LLM di video:

```bash
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge variables set LLM_API_KEY <key> --environment production
LD_PRELOAD=~/workspace/codegeist/tools/nochown.so forge deploy
```

Key harus OpenAI-compatible. Tanpa key, panel tetap jalan penuh
dengan heuristik lokal. Jangan hardcode key di mana pun.

## Langkah 7 — Submit ke Devpost (~15 mnt)

1. Buka https://codegeist2026.devpost.com/ dan login/daftar dengan
   akun Cipoz.
2. Klik **Enter a Submission** / **Submit a project**.
3. Isi form dengan teks dari `~/workspace/codegeist/SUBMISSION.md`:
   judul "Triage Lens for Jira", deskripsi, kategori
   **Apps for Software Teams**, installation link (Langkah 4),
   URL video YouTube (Langkah 5).
4. **Bonus prizes: jangan centang apa pun** (app ini tidak pakai Rovo,
   Teamwork Graph, MCP, atau Marketplace).
5. Review sekali lagi, lalu submit **sebelum 23 Des 2026 03:00 WIB**.

## Langkah 8 — (Opsional) Repo GitHub publik

Bila Cipoz mau repo publik untuk submission:

1. Buat repo baru di GitHub (akun Cipoz) — agen tidak boleh membuat repo.
2. Push isi `~/workspace/codegeist/triage-lens/` (+ README/DEPLOY dari
   `~/workspace/codegeist/`).
3. Tempel URL repo ke `SUBMISSION.md`.

## Ringkasan yang butuh Cipoz

| # | Yang dibutuhkan | Perkiraan waktu |
|---|---|---|
| 1 | Akun Atlassian + Developer License + site dev + 3 issue contoh | ~15 mnt |
| 2 | API token Atlassian | ~5 mnt |
| 3 | `forge login` + register + deploy + install (token dari langkah 2) | ~15 mnt |
| 4 | Installation link | ~5 mnt |
| 5 | Video demo < 5 mnt, upload YouTube Public | ~30–60 mnt |
| 6 | (Opsional) Kunci LLM | ~5 mnt |
| 7 | Submit Devpost | ~15 mnt |
| 8 | (Opsional) Repo GitHub | ~10 mnt |

Total wajib: sekitar **1,5–2 jam** kerja Cipoz, tersebar — tidak bisa
dikerjakan agen karena semua langkah butuh akun/login Cipoz sendiri.

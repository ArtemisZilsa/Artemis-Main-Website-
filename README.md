# Website Artemis (v1, 3 Okt 2026)

Situs statis: HTML + ES modules + Three.js 0.186.1 (import map, jsDelivr). Tanpa build, tanpa node_modules.

Jalankan lokal (dari `AIS-OS/`): `node tools/serve.mjs artemis/website 3000` → http://localhost:3000
Lewati loader saat QA: `http://localhost:3000/?enter`

## Mau mengubah apa?
| Ingin mengubah | Edit file |
|---|---|
| Teks, harga, link CTA, urutan section | `content/id.json`, `content/en.json`, `content/ja.json` (buka `?lang=en` / `?lang=ja`). Ubah ketiganya. |
| Label tile automasi | `content/<bahasa>.json` → section `automation` → `nodes` |
| Menambah bahasa | buat `content/<kode>.json`, lalu tambah satu entri di `LANGS` (`src/main.js`) |
| Warna neon, font, intensitas glow | `styles/tokens.css` (HTML dan 3D ikut berubah) |
| Posisi objek 3D / sisi teks kiri-kanan | `src/camera-path.js` |
| Bentuk/animasi satu objek 3D | `src/stations/<nama>.js` |
| Kualitas grafis (HP vs desktop), bloom, kabut | `src/main.js` → `startWorld()` |

## Menambah section baru
1. Tambah entri di `content/id.json` → `sections` (id unik).
2. (Opsional) objek 3D: buat `src/stations/<id>.js` yang meng-export `create(theme)` → `{ group, update(time, { local, mouse }) }`, lalu daftarkan di `stations` dalam `src/main.js`.
3. Tambah baris `<id>: { at, dist, side }` di `src/camera-path.js`. Tanpa baris ini section tetap tampil (kamera di tengah).

## Teks menyala mengikuti animasi
Station boleh mengisi `activeItem` (index item). `main.js` otomatis memberi kelas `.active` ke `li` ke-n di section itu. Dipakai oleh `stations/automation.js` (5 langkah alur).

## Backsound (musik latar)
1. Unduh lagu cinematic bebas royalti (mis. Pixabay Music, lisensi boleh komersial).
2. Simpan sebagai `assets/audio/backsound.mp3` (nama harus persis). Idealnya 2–4 MB, 128–192 kbps, bisa di-loop.
3. Selesai. Loader otomatis menampilkan "Masuk dengan musik" / "Masuk tanpa suara", dan tombol equalizer muncul di nav.
Lagu sekarang: "Epic Cinematic" oleh The_Mountain (Pixabay Content License), https://pixabay.com/music/build-up-scenes-epic-cinematic-576567/ . Diproses: hening awal/akhir dipotong, -18 LUFS, fade 1,2 dtk / 2,5 dtk, 160 kbps.
Tanpa file itu, semua kontrol musik tersembunyi. Volume, filter, dan reaksi terhadap warp diatur di `src/audio.js` (`BASE`, `BOOST`, `CLOSED`, `OPEN`).

## Online (Netlify Drop)
1. Buka https://app.netlify.com/drop (login Netlify).
2. Seret folder `artemis/website` ke halaman itu. Tunggu ±1 menit, dapat URL `xxx.netlify.app`.
3. Di Site settings → ganti nama situs (mis. `artemis-ai`). Lalu ganti `og:image` di `index.html` ke URL absolut (`https://<nama>.netlify.app/assets/og.png`) dan seret ulang folder ke tab Deploys.
`_headers` dan `robots.txt` ikut terbaca otomatis.

## Catatan
- `cta.href` di ketiga file konten masih placeholder Instagram. Ganti ke akun Artemis.
- `assets/logo.svg` digambar ulang dari logo raster. Ganti dengan vektor resmi kalau ada.
- Tanpa WebGL / `prefers-reduced-motion`: otomatis tampilan statis, teks + CTA tetap lengkap.

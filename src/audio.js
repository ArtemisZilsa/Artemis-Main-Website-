// Backsound dramatis dari file mp3 (assets/audio/backsound.mp3) lewat Web Audio.
// - Browser hanya mengizinkan suara setelah klik pertama → dimulai dari tombol loader.
// - Volume dasar pelan; saat kamera meluncur (warp) volume naik dan filter terbuka.
// - Memudar saat tab ditinggalkan. Pilihan pengunjung diingat (localStorage).
// - Kalau file belum ada, semua kontrol musik disembunyikan.

const SRC = 'assets/audio/backsound.mp3';
const KEY = 'artemis-sound';
const BASE = 0.32;   // volume saat diam
const BOOST = 0.28;  // tambahan volume saat warp
const CLOSED = 1600; // Hz, filter saat diam (lebih redup)
const OPEN = 12000;  // Hz, filter saat warp (lebih terang)

export function createBacksound() {
  let ctx, gain, filter, el;
  let on = false;
  let available = false;
  let lastUpdate = 0;
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn({ on, available }));

  const save = (v) => { try { localStorage.setItem(KEY, v); } catch {} };
  const ramp = (param, value, seconds) => {
    param.cancelScheduledValues(ctx.currentTime);
    param.setTargetAtTime(value, ctx.currentTime, seconds / 3);
  };

  function init() {
    if (ctx) return;
    el = new Audio(SRC);
    el.loop = true;
    el.preload = 'auto';
    el.addEventListener('error', () => { available = false; on = false; notify(); });
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = CLOSED;
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(filter).connect(gain).connect(ctx.destination);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) {
      ramp(gain.gain, 0, 0.6);
    } else {
      ctx.resume();
      ramp(gain.gain, BASE, 1.5);
    }
  });

  return {
    subscribe(fn) { listeners.add(fn); fn({ on, available }); },
    // Cek apakah file musik ada (HEAD). Hasil menentukan tampil/tidaknya kontrol musik.
    async probe() {
      try { available = (await fetch(SRC, { method: 'HEAD' })).ok; } catch { available = false; }
      notify();
      return available;
    },
    // Default pilihan di loader: musik, kecuali pengunjung pernah mematikannya.
    prefersSound() { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } },
    async play() {
      if (!available) return;
      init();
      try {
        await ctx.resume();
        await el.play();
        on = true;
        ramp(gain.gain, BASE, 2.5);
        save('on');
      } catch {
        on = false;
      }
      notify();
    },
    stop() {
      if (!ctx) return;
      on = false;
      ramp(gain.gain, 0, 0.8);
      setTimeout(() => { if (!on) el.pause(); }, 900);
      save('off');
      notify();
    },
    toggle() { return on ? this.stop() : this.play(); },
    // Dipanggil tiap frame dengan kecepatan kamera (unit/detik).
    update(speed) {
      if (!on || document.hidden) return;
      const now = performance.now();
      if (now - lastUpdate < 120) return;
      lastUpdate = now;
      const k = Math.min(speed / 50, 1);
      ramp(gain.gain, BASE + BOOST * k, 0.6);
      ramp(filter.frequency, CLOSED + (OPEN - CLOSED) * k, 0.6);
    },
  };
}

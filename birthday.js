/* ============================================
   Birthday Card v2 — Optimized
   ============================================ */

// ===== CONFIGURATION (THAY ĐỔI TẠI ĐÂY) =====
const CONFIG = {
  name: "Tuseer",
  signature: "— With all my love, Abeeha ❤️",
  candleCount: 10,
reasons: [
  "The way you make me laugh even when I'm annoyed at you.",
  "Your ridiculously cute smile.",
  "The way you keep up with my weirdness.",
  "Because you annoy me.",
  "The way you get excited about the smallest things.",
  "Because you're my favourite person to annoy.",
  "The way you make me feel safe.",
  "Because you put up with me. Somehow. 😂",
  ],
 letterLines: [
    "Hey Tushi,",
    "",
    "Happy birthday my lovely Fiancé (a literal unc). 😂",
    "",
    "I don't think I say it enough, but I'm really grateful for you, even tho you annoy me.",
    "",
    "For all the laughs, the random conversations, the stupid arguments, the little moments, and everything in between — thank you for being you.",
    "",
    "I hope 23 brings you closer to everything you've been working for, dreaming about, and quietly wishing for.",
    "",
    "And I hope you know that no matter how much I annoy you, I’ll always be rooting for you.",
    "",
    "Happy birthday, Tushi. ❤️"
],

balloonWishes: [
    "May you grow big musclessss 💪",
    "May you keep smiling, even on the annoying days 🌟",
    "May you get that cute wife you wished for (me, obviously) 💕",
    "May you get all the happiness you deserve 🎉",
    "May you become everything you want to be 💛",
    "May you somehow get ALL your +100 dream cars 🚗",
    "May all your little and BIG wishes come true ✨",
    "And may I get to annoy you for many, many more birthdays ❤️"
],
};

// ===== STATE =====
const state = {
  envelopeOpen: false,
  starsRevealed: new Set(),
  letterStarted: false,
  allCandlesBlown: false,
  musicPlaying: false,
  audioCtx: null,
  melodyTimeout: null,
  fireworksActive: false
};

// ===== HELPERS =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

// ===== SOUND EFFECTS =====
function ensureAudioCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
  return state.audioCtx;
}

function playStarSound() {
  const ac = ensureAudioCtx();
  const t = ac.currentTime;
  // Gentle sparkle chime — two layered sine tones
  [880, 1318].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.09, t + i * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.4);
  });
}

function playTypeSound() {
  const ac = ensureAudioCtx();
  const t = ac.currentTime;
  // Tiny soft click — short noise tick
  const len = Math.round(ac.sampleRate * 0.018);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.04 + Math.random() * 0.03, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  src.connect(hp); hp.connect(g); g.connect(ac.destination);
  src.start(t); src.stop(t + 0.02);
}

function playPopSound() {
  const ac = ensureAudioCtx();
  const t = ac.currentTime;
  // Soft pop — filtered noise burst + low thump
  const len = Math.round(ac.sampleRate * 0.12);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.18, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  noise.connect(bp); bp.connect(g1); g1.connect(ac.destination);
  noise.start(t); noise.stop(t + 0.12);
  // Low thump layer
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.12, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g2); g2.connect(ac.destination);
  osc.start(t); osc.stop(t + 0.12);
}

// ===== CENTRAL ANIMATION LOOP =====
// FIX: Gộp 4 vòng rAF riêng lẻ thành 1 vòng duy nhất
const AnimLoop = {
  _systems: new Map(),
  _running: false,
  _rafId: null,

  register(name, fn) {
    this._systems.set(name, fn);
    if (!this._running) this._start();
  },

  unregister(name) {
    this._systems.delete(name);
    if (!this._systems.size) this._stop();
  },

  _start() {
    this._running = true;
    const tick = (t) => {
      if (!this._running) return;
      for (const fn of this._systems.values()) fn(t);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  },

  _stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },

  pause()  { this._stop(); },
  resume() { if (this._systems.size && !this._running) this._start(); }
};

// ===== DEBOUNCE =====
function debounce(fn, ms = 150) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ===== MANAGED INTERVALS (trackable, auto-cleanup) =====
const _intervals = new Set();
function managedInterval(fn, ms) {
  const id = setInterval(fn, ms);
  _intervals.add(id);
  return id;
}
function clearManagedInterval(id) {
  clearInterval(id);
  _intervals.delete(id);
}

// ===== PAGE VISIBILITY — tạm dừng animation khi tab ẩn =====
function initVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) AnimLoop.pause();
    else AnimLoop.resume();
  });
}

// ============ BACKGROUND STARS (Canvas) ============
function initBgStars() {
  const canvas = $('#bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    const count = Math.min(180, Math.floor(W * H / 6000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.004,
        color: Math.random() > 0.5 ? '#fbbf24' : '#f9a8d4'
      });
    }
  }

  resize();
  window.addEventListener('resize', debounce(resize)); // FIX: debounce

  AnimLoop.register('bgStars', (t) => {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// ============ ENVELOPE ============
function initEnvelope() {
  const overlay = $('#envelopeOverlay');
  const card = $('#envelopeCard');

  overlay.addEventListener('click', async () => {
    if (state.envelopeOpen) return;
    state.envelopeOpen = true;

    card.classList.add('flipped');
    await wait(1800);
    overlay.classList.add('hide');
    await wait(400);

    $('#mainContent').classList.remove('hidden');
    document.body.style.overflow = '';
    $('#musicBtn').classList.add('visible');

    await wait(100);
    $('#intro').classList.add('animate');
    initSakura();
  });
}

// ============ STARS (Tap-to-Flip Cards) ============
function initStars() {
  const grid = $('#starsGrid');
  const counterEl = $('#starsCount');   // FIX: cache DOM ref
  const bonusEl = $('#allStarsBonus');
  const emojis = ['⭐','✨','💫','🌟','⭐','✨','💫','🌟','⭐','✨','💫','🌟','⭐','✨','💫','🌟','💛'];
  const frag = document.createDocumentFragment(); // FIX: batch insert

  CONFIG.reasons.forEach((reason, i) => {
    const card = document.createElement('div');
    card.className = 'star-card';
    card.innerHTML = `
      <div class="star-card-inner">
        <div class="star-front">
          <span class="star-emoji">${emojis[i]}</span>
          <span class="star-num">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <div class="star-back">
          <span class="star-num-back">✦ ${String(i + 1).padStart(2, '0')} ✦</span>
          <p class="star-reason">${reason}</p>
        </div>
      </div>`;

    card.addEventListener('click', () => {
      if (state.starsRevealed.has(i)) {
        card.classList.remove('revealed');
        state.starsRevealed.delete(i);
      } else {
        card.classList.add('revealed');
        state.starsRevealed.add(i);
        playStarSound();
      }
      const count = state.starsRevealed.size;
      counterEl.textContent = count;
      if (count === CONFIG.reasons.length) {
        bonusEl.classList.add('visible');
        spawnConfetti(40);
        if (navigator.vibrate) navigator.vibrate(100);
      } else {
        bonusEl.classList.remove('visible');
      }
    });
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

// ============ LETTER (Typewriter) ============
function initLetter() {
  const section = $('#letterSection');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !state.letterStarted) {
        state.letterStarted = true;
        obs.disconnect(); // FIX: one-shot, disconnect ngay
        typeLetter();
      }
    });
  }, { threshold: 0.25 });
  obs.observe(section);
}

async function typeLetter() {
  const container = $('#letterBody');
  const cursor = document.createElement('span');
  cursor.className = 'letter-cursor';
  container.appendChild(cursor);

  for (const line of CONFIG.letterLines) {
    if (line === '') {
      cursor.before(document.createElement('br'));
      await wait(350);
      continue;
    }
    for (const char of line) {
      cursor.before(document.createTextNode(char));
      playTypeSound();
      let d = 35 + Math.random() * 30;
      if (',.:'.includes(char)) d = 180 + Math.random() * 80;
      if (char === '—') d = 120;
      await wait(d);
    }
    cursor.before(document.createElement('br'));
    await wait(250);
  }
  cursor.remove();
  await wait(500);
  $('#letterSign').classList.add('visible');
}

// ============ CAKE (Blow Candles) ============
function initCake() {
  const row = $('#candlesRow');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < CONFIG.candleCount; i++) {
    const c = document.createElement('div');
    c.className = 'candle';
    c.innerHTML = `<div class="flame" id="flame${i}"></div><div class="smoke" id="smoke${i}"></div>`;
    frag.appendChild(c);
  }
  row.appendChild(frag);

  $('#blowBtn').addEventListener('click', async () => {
    if (state.allCandlesBlown) return;
    state.allCandlesBlown = true;

    for (let i = 0; i < CONFIG.candleCount; i++) {
      await wait(180 + Math.random() * 120);
      $(`#flame${i}`).classList.add('blown');
      const smoke = $(`#smoke${i}`);
      smoke.classList.add('active');
      setTimeout(() => smoke.classList.remove('active'), 1500);
    }

    await wait(400);
    $('.cake-top').classList.add('dark');
    $('#blowBtn').classList.add('gone');
    await wait(300);
    $('#wishText').classList.add('visible');
    spawnConfetti(60);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  });
}

// ============ FIREWORKS ============
function initFireworks() {
  const canvas = $('#fireworksCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [], W, H;
  const colors = ['#fbbf24','#f472b6','#a855f7','#ec4899','#fde68a','#60a5fa'];

  function resize() {
    const p = canvas.parentElement;
    W = canvas.width = p.offsetWidth;
    H = canvas.height = p.offsetHeight;
  }

  function launch() {
    const x = W * 0.15 + Math.random() * W * 0.7;
    const y = H * 0.15 + Math.random() * H * 0.35;
    const c = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        color: c,
        size: 1.2 + Math.random() * 1.5
      });
    }
  }

  // FIX: Dùng central loop, chỉ vẽ khi fireworksActive
  AnimLoop.register('fireworks', () => {
    if (!state.fireworksActive) return;
    ctx.clearRect(0, 0, W, H);
    // FIX: In-place compaction — không tạo array mới mỗi frame
    let writeIdx = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.025; p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fill();
      particles[writeIdx++] = p;
    }
    particles.length = writeIdx;
    ctx.globalAlpha = 1;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !state.fireworksActive) {
        state.fireworksActive = true;
        resize();
        obs.disconnect(); // FIX: disconnect khi đã trigger
        let count = 0;
        const burst = managedInterval(() => {
          launch();
          if (++count > 12) clearManagedInterval(burst);
        }, 700);
        managedInterval(() => launch(), 2500); // FIX: tracked interval
      }
    });
  }, { threshold: 0.2 });

  obs.observe($('#finaleSection'));
  window.addEventListener('resize', debounce(resize));
}

// ============ CONFETTI ============
function spawnConfetti(count) {
  const container = $('#confettiContainer');
  const colors = ['#fbbf24','#f472b6','#a855f7','#ec4899','#fde68a'];
  const frag = document.createDocumentFragment(); // FIX: batch
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 6;
    p.style.width = size + 'px'; p.style.height = size + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
    p.style.animationDelay = Math.random() * 0.4 + 's';
    frag.appendChild(p);
  }
  container.appendChild(frag);
  // FIX: batch remove thay vì từng cái riêng lẻ
  setTimeout(() => { container.textContent = ''; }, 5500);
}

// ============ SAKURA PETALS ============
let _sakuraStarted = false;
function initSakura() {
  if (_sakuraStarted) return;
  _sakuraStarted = true;
  const container = $('#floatingHearts');

  function spawn() {
    const p = document.createElement('div');
    p.className = 'sakura-petal';
    p.style.left = Math.random() * 100 + 'vw';
    const size = 6 + Math.random() * 8;
    p.style.width = size + 'px';
    p.style.height = (size * 1.2) + 'px';
    const dur = 8 + Math.random() * 12;
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = Math.random() * 2 + 's';
    p.style.filter = `hue-rotate(${Math.random() * 20 - 10}deg)`;
    container.appendChild(p);
    setTimeout(() => p.remove(), (dur + 3) * 1000);
  }

  managedInterval(spawn, 1200); // FIX: tracked interval
  for (let i = 0; i < 5; i++) setTimeout(spawn, i * 250);
}

// ============ AUDIO (Web Audio Birthday Melody) ============
function initAudio() {
  const btn = $('#musicBtn');
  const audio = new Audio('Y2Mate.is - Laufey - From The Start Lyrics.mp3');

  audio.loop = true;
  audio.volume = 0.5;

  btn.addEventListener('click', async () => {
    state.musicPlaying = !state.musicPlaying;

    btn.classList.toggle('playing', state.musicPlaying);
    btn.querySelector('span').textContent = state.musicPlaying ? '🔊' : '🎵';

    if (state.musicPlaying) {
      try {
        await audio.play();
      } catch (error) {
        state.musicPlaying = false;
        btn.classList.remove('playing');
        btn.querySelector('span').textContent = '🎵';
      }
    } else {
      audio.pause();
    }
  });
}

// ============ SCROLL FADE-IN ============
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target); // FIX: ngừng theo dõi sau khi hiện
      }
    });
  }, { threshold: 0.15 });
  $$('.fade-in-up').forEach(el => obs.observe(el));
}

// ============ SPARKLE TRAIL ============
function initSparkleTrail() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:600;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H, lastT = 0;
  let sparkles = [];
  const COLORS = ['#fbbf24','#f9a8d4','#fde68a','#a855f7'];
  const MAX = 100;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', debounce(resize));

  function add(x, y) {
    for (let i = 0; i < 3; i++) {
      if (sparkles.length >= MAX) break; // FIX: hard cap
      sparkles.push({
        x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 12,
        size: 1 + Math.random() * 2.5, life: 1,
        decay: 0.025 + Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.8, vy: -0.3 - Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * 4)]
      });
    }
  }

  document.addEventListener('touchmove', e => {
    const now = Date.now();
    if (now - lastT < 30) return;
    lastT = now;
    add(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener('mousemove', e => { if (e.buttons > 0) add(e.clientX, e.clientY); });

  AnimLoop.register('sparkleTrail', () => {
    ctx.clearRect(0, 0, W, H);
    // FIX: in-place compaction — zero allocation per frame
    let writeIdx = 0;
    for (let i = 0; i < sparkles.length; i++) {
      const s = sparkles[i];
      s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      if (s.life <= 0) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.fill();
      sparkles[writeIdx++] = s;
    }
    sparkles.length = writeIdx;
    ctx.globalAlpha = 1;
  });
}

// ============ CONSTELLATION (Name in Stars) ============
function initConstellation() {
  const canvas = $('#constellationCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, points = [], revealed = false, progress = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = 260;
  }

  function sampleText() {
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = '#fff';
    const fs = Math.min(90, W * 0.22);
    tctx.font = `italic 700 ${fs}px "Playfair Display", serif`;
    tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    tctx.fillText(CONFIG.name, W / 2, H / 2);
    const data = tctx.getImageData(0, 0, W, H).data;
    const pts = [];
    const step = Math.max(3, Math.floor(W / 110));
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) {
          pts.push({ x, y, size: 0.8 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2, delay: x / W });
        }
      }
    }
    return pts;
  }

  AnimLoop.register('constellation', () => {
    if (!revealed) return;
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();
    for (const p of points) {
      if (progress < p.delay) continue;
      const alpha = Math.min(1, (progress - p.delay) * 3);
      const tw = 0.5 + 0.5 * Math.sin(now * 0.003 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.globalAlpha = alpha * tw;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251,191,36,0.1)';
      ctx.globalAlpha = alpha * tw * 0.6;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (progress < 1) progress += 0.006;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !revealed) {
        revealed = true;
        obs.disconnect(); // FIX: disconnect
        document.fonts.ready.then(() => { resize(); points = sampleText(); });
      }
    });
  }, { threshold: 0.2 });

  obs.observe($('#constellationSection'));
  window.addEventListener('resize', debounce(() => { if (revealed) { resize(); points = sampleText(); } }));
}

// ============ BALLOONS MINI-GAME ============
function initBalloons() {
  const grid = $('#balloonsGrid');
  if (!grid) return;
  const counterEl = $('#balloonsCount'); // FIX: cache
  const colors = ['#f472b6','#fbbf24','#a855f7','#ec4899','#f9a8d4','#fde68a','#818cf8','#fb7185'];
  let popped = 0;
  const frag = document.createDocumentFragment();

  CONFIG.balloonWishes.forEach((wish, i) => {
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.backgroundColor = colors[i]; b.style.color = colors[i];
    b.style.animationDelay = (i * 0.35) + 's';
    b.innerHTML = '<div class="balloon-string"></div>';

    b.addEventListener('click', () => {
      if (b.classList.contains('popped')) return;
      b.classList.add('popped'); popped++;
      counterEl.textContent = popped;
      playPopSound();

      const rect = b.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;

      // FIX: dùng onfinish thay vì setTimeout
      for (let j = 0; j < 8; j++) {
        const p = document.createElement('div');
        const angle = (j / 8) * Math.PI * 2;
        const dist = 25 + Math.random() * 20;
        p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:6px;height:6px;border-radius:50%;background:${colors[i]};z-index:700;pointer-events:none;`;
        document.body.appendChild(p);
        const anim = p.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(angle)*dist-3}px,${Math.sin(angle)*dist-3}px) scale(0)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out', fill: 'forwards' });
        anim.onfinish = () => p.remove();
      }

      const w = document.createElement('div');
      w.className = 'balloon-wish-float'; w.textContent = wish;
      w.style.left = cx + 'px'; w.style.top = cy + 'px';
      document.body.appendChild(w);
      const wishAnim = w.animate([
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: 'translate(-50%,calc(-50% - 50px))', opacity: 0 }
      ], { duration: 2000, easing: 'ease-out', fill: 'forwards' });
      wishAnim.onfinish = () => w.remove();

      if (navigator.vibrate) navigator.vibrate(50);
      if (popped === CONFIG.balloonWishes.length) setTimeout(() => spawnConfetti(50), 500);
    });
    frag.appendChild(b);
  });
  grid.appendChild(frag);
}

// ============ EASTER EGGS ============
function initEasterEggs() {
  const name = $('.finale-name');
  if (!name) return;
  let pressTimer;
  const startPress = () => {
    pressTimer = setTimeout(() => {
      spawnConfetti(80);
      if (navigator.vibrate) navigator.vibrate(200);
    }, 1500);
  };
  const endPress = () => clearTimeout(pressTimer);

  // FIX: tất cả touch listeners đều passive
  name.addEventListener('touchstart', startPress, { passive: true });
  name.addEventListener('touchend', endPress, { passive: true });
  name.addEventListener('touchmove', endPress, { passive: true });
  name.addEventListener('mousedown', startPress);
  name.addEventListener('mouseup', endPress);

  if (window.DeviceMotionEvent) {
    let lastShake = 0;
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const total = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      if (total > 45 && Date.now() - lastShake > 3000) {
        lastShake = Date.now();
        spawnConfetti(50);
      }
    }, { passive: true });
  }
}

// ============ INIT ============
function init() {
  document.body.style.overflow = 'hidden';
  initVisibility();
  initBgStars();
  initEnvelope();
  initStars();
  initLetter();
  initCake();
  initFireworks();
  initAudio();
  initScrollAnimations();
  initEasterEggs();
  initSparkleTrail();
  initConstellation();
  initBalloons();
}

document.addEventListener('DOMContentLoaded', init);

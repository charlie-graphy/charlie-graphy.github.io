(() => {
'use strict';

/* ================= 설정 (난이도·연출은 여기서 조절) ================= */
const CFG = {
  duration: 30, total: 50, countdown: 3,
  // 각 단계의 별 개수(n)와 등장 구간(from~to)은 "게임 시작 시" 확정됩니다. n 합계는 total 과 같아야 합니다.
  // 총 50개 = 15 + 18 + 17 (황금 5개 포함). from~to 는 "생성 시각"이며, 화면 진입은 생성 후 약 0.1~0.4초.
  // 마지막 별의 화면 진입은 약 27초, 노출이 끝나는 시점은 29.5초 안팎. 후반(ramp)은 간격이 점점 짧아져 피날레에 별이 이어짐
  phases: [
    { from: 0.6,  to: 9.6,  n: 15 },
    { from: 9.9,  to: 18.7, n: 18, pairs: 1 },
    { from: 19.0, to: 26.7, n: 17, ramp: .35 }
  ],
  // 별이 "화면 안에서 보이는" 시간(초): 단계별, PC / 모바일 분리 (화면 밖 이동 시간은 포함하지 않음)
  dur: { desktop: [2.7, 2.1, 1.9], mobile: [2.7, 2.2, 1.9] },
  golden: { count: 5, slow: 1.25, size: 1.25 },    // 황금 소원별: 50개 중 5개, 일반보다 25% 느리고 조금 큼
  goldPal: { t: '255,200,95' },
  zoneWeight: { A: 1, B: 1, C: 1 },        // A 상단 / B 중앙 / C 낮게(호수 위까지)
  // 클릭 판정: r = 머리 중심 반경(px), tail = 머리 뒤쪽으로 판정에 포함하는 꼬리 길이(px). 입력 방식(마우스/터치)에 따라 적용
  hit: { desktop: { r: 24, tail: 32 }, mobile: { r: 26, tail: 0 } },
  particleCap: 200, finaleAt: 25,
  pal: [ { t: '255,238,205' }, { t: '175,215,255' }, { t: '255,205,228' } ],   // 크림 / 연하늘 / 연분홍
  storeKey: 'lalala-stars-best',
  DEBUG: /[?&]debug/.test(location.search),   // 주소 뒤에 ?debug 를 붙이거나 true 로 바꾸면 콘솔 로그 출력
};

/* ================= 유틸 ================= */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(n).padStart(2, '0');
const rad = d => d * Math.PI / 180;
const el = { game: $('game'), bg: $('bg'), lk: $('lk'), fx: $('fx'), far: $('far'), terrace: $('terrace'), char: $('char'), hud: $('hud'),
  hudTime: $('hud-time'), hudScore: $('hud-score'), scoreBox: $('hud-score-box'), count: $('count'), mute: $('mute'),
  rScore: $('r-score'), rBest: $('r-best'), rNew: $('r-new'), rMsg: $('r-msg') };
const bctx = el.bg.getContext('2d'), lctx = el.lk.getContext('2d'), ctx = el.fx.getContext('2d');

/* ================= 상태 ================= */
const view = { w: 0, h: 0, dpr: 1, S: 1 };
const L = { skyTop: 90, playBottom: 600, horizon: 500, lakeBottom: 700, portrait: false, avoid: [] };   // 화면 크기에 따라 계산되는 레이아웃
let state = 'ready', last = 0, t = 0, cdT = 0, resT = 0, lastSec = -1, phaseIdx = -1;
let profile = 'desktop', minRatio = 99, maxSpeed = 0, lastPointer = null, lastEnter = 0, goldenSpawned = 0, exposed = 0, minExpose = 99, planned = 0, spawned = 0, caught = 0, missed = 0, combo = 0, peak = 0, nextIdx = 0, schedule = [];
let active = [], parts = [], stars = [], glints = [], sparks = [], grand = null, zoneHist = [], zoneCount = { A: 0, B: 0, C: 0 }, passHist = [], lastDir = 1;
let succUntil = 0, dbg = null, glintTimer = 0, joyTimer = 0, best = 0, muted = false, newRecord = false, wishTimer = 0;
try { best = +localStorage.getItem(CFG.storeKey) || 0; muted = localStorage.getItem(CFG.storeKey + '-mute') === '1'; } catch (e) {}
// 난이도 프로필은 "입력 방식"으로 정함: 마지막으로 쓴 포인터가 터치/펜이면 모바일, 마우스면 PC.
// 아직 입력이 없으면 주 입력 장치(pointer: coarse)로 판단. 휴대폰을 가로로 돌려도 터치이므로 모바일 설정 유지.
document.addEventListener('pointerdown', e => { lastPointer = e.pointerType; paintDebug(); }, true);
const forcedProfile = CFG.DEBUG ? (location.search.match(/[?&]profile=(mobile|desktop)/) || [])[1] : null;   // 디버그: ?debug&profile=mobile
const isTouchInput = e => forcedProfile ? forcedProfile === 'mobile' : e.pointerType !== 'mouse';       // 판정은 실제 입력 방식으로 결정
function deviceProfile() {
  if (forcedProfile) return forcedProfile;
  if (lastPointer === 'touch' || lastPointer === 'pen') return 'mobile';
  if (lastPointer === 'mouse') return 'desktop';
  return window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
}
function paintDebug() {                                           // 디버그 모드에서만 보이는 현재 난이도 프로필 표시
  if (!dbg) return;
  const h = profile === 'mobile' ? CFG.hit.mobile : CFG.hit.desktop;
  dbg.textContent = `profile=${profile}${forcedProfile ? '(forced)' : ''} | last input=${lastPointer || '-'} | viewport ${view.w}x${view.h} ${L.portrait ? 'portrait' : 'landscape'} | hit r=${h.r} tail=${h.tail} | dur=${CFG.dur[profile].join('/')}`;
}
const log = (...a) => { if (CFG.DEBUG) console.log('[라라라]', ...a); };

/* ================= 오디오 ================= */
let ac = null;
function initAudio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } }
function chime() {
  if (muted || !ac) return;
  try {
    const n = ac.currentTime;
    [1319, 1976, 2637].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.09 / (i + 1), n + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.35);
      o.connect(g); g.connect(ac.destination); o.start(n); o.stop(n + 0.4);
    });
  } catch (e) {}
}
function paintMute() { el.mute.textContent = muted ? '🔇' : '🔊'; el.mute.setAttribute('aria-pressed', muted); el.mute.setAttribute('aria-label', muted ? '효과음 켜기' : '효과음 끄기'); }

/* ================= 배경: 어두운 밤의 호숫가 마을(원경) + 언덕 위 테라스(전경) ================= */
function buildScene() {
  const hillY = x => 232 - 62 * Math.exp(-(((x - 880) / 400) ** 2)) - 22 * Math.exp(-(((x - 330) / 260) ** 2)) - 14 * Math.exp(-(((x - 1400) / 220) ** 2));
  const wall = ['#8E7F94', '#A58C8A', '#8A87A8', '#9A8F9C'], roof = ['#7A4452', '#6B3C4E'];
  let v = '<path d="M0 250';
  for (let x = 0; x <= 1600; x += 40) v += `L${x} ${hillY(x).toFixed(1)}`;
  v += 'L1600 250Z" fill="#354D45"/><path d="M0 250L0 240Q400 236 800 242T1600 240L1600 250Z" fill="#2b3f39"/>';
  for (let x = 120, i = 0; x < 1560; i++) {                                    // 호숫가를 따라 자리한 작은 마을
    const row = i % 3, bx = x + row * 17, by = hillY(bx) + 6 + row * 20; x += 31;
    if (by > 244) continue;
    const w = 28 + (i * 5 % 9), h = 20 + (i * 7 % 8);
    v += `<rect x="${bx}" y="${by - h}" width="${w}" height="${h}" fill="${wall[i % 4]}"/><polygon points="${bx - 3},${by - h} ${bx + w / 2},${by - h - 13} ${bx + w + 3},${by - h}" fill="${roof[i % 2]}"/>` +
         (i % 5 ? `<rect x="${bx + w / 2 - 4}" y="${by - h + 4}" width="8" height="11" rx="3.500" fill="#F6C785"/>` : '') +
         (i % 3 === 0 ? `<rect x="${bx + 4}" y="${by - h + 8}" width="5" height="7" rx="2" fill="#F6C785" opacity=".8"/>` : '');
  }
  const tb = hillY(905) + 8;                                                     // 작은 종탑
  v += `<rect x="893" y="${tb - 74}" width="26" height="74" fill="#9A8F9C" stroke="#6f6578" stroke-width="2"/><polygon points="889,${tb - 74} 906,${tb - 104} 923,${tb - 74}" fill="#7A4452"/>` +
       `<path d="M900 ${tb - 58}v10a6 6 0 0 0 12 0v-10a6 6 0 0 0-12 0z" fill="#F6C785"/><circle cx="906" cy="${tb - 30}" r="6" fill="#FFE6A3"/>`;
  for (let i = 0; i < 9; i++) { const x = 160 + i * 170 + (i * 43 % 60); v += `<ellipse cx="${x}" cy="${hillY(x) + 4}" rx="6" ry="20" fill="#2A4038"/>`; }
  for (let i = 0; i < 26; i++) { const x = 190 + i * 50; v += `<circle class="bulb" style="animation-delay:${(i * .31 % 3).toFixed(2)}s" cx="${x}" cy="${(hillY(x) - 16 + (i % 2) * 8).toFixed(1)}" r="2.600" fill="#F6C785"/>`; }
  let s = `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A4F7C"/><stop offset=".4" stop-color="#2F4670"/><stop offset="1" stop-color="#263F62"/></linearGradient></defs>
    <path d="M0 200L160 150L300 190L520 120L760 180L980 110L1220 175L1420 130L1600 170V260H0Z" fill="#1E2A52"/>
    <path d="M0 225L220 185L420 215L700 170L1000 210L1300 178L1600 215V260H0Z" fill="#27325E"/>
    <ellipse cx="800" cy="252" rx="800" ry="40" fill="#5A4F86" opacity=".3"/>
    <rect y="250" width="1600" height="350" fill="url(#lake)"/>
    <g id="vill">${v}</g>
    <g transform="translate(0 500) scale(1 -1)" opacity=".3"><use href="#vill"/></g>`;
  for (let i = 0; i < 18; i++) s += `<rect class="rip" style="animation-delay:${(i * .5 % 4).toFixed(1)}s" x="${(i * 173 + 40) % 1450}" y="${264 + i * 17}" width="${90 - i * 2}" height="2.500" rx="1.200" fill="#7488B0" opacity=".5"/>`;
  el.far.innerHTML = s + '</svg>';

  // 전경은 낮은 언덕만 남김 (앉는 돌담은 캐릭터 이미지에 포함되어 있음)
  let T = `<svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 300V170C220 140 420 190 600 215H1000C1180 190 1380 140 1600 170V300Z" fill="#354D45"/>
    <path d="M0 170C220 140 420 190 600 215H1000C1180 190 1380 140 1600 170" fill="none" stroke="#4a6a5d" stroke-width="5"/>`;
  el.terrace.innerHTML = T + '</svg>';
}

/* ================= 크기 · 레이아웃 ================= */
function layout() {
  const g = el.game.getBoundingClientRect(), W = view.w, H = view.h, hasBg = document.body.classList.contains('has-bg');
  L.portrait = H > W * 1.05;
  L.skyTop = Math.max(el.hud.getBoundingClientRect().bottom - g.top + 10, 64);
  const far = el.far.getBoundingClientRect(), sc = Math.max(far.width / 1600, far.height / 600);
  L.horizon = hasBg || !far.height ? H * .66 : far.bottom - g.top - 350 * sc;      // 호수 수평선 위치
  L.playBottom = Math.min(L.horizon + H * .07, H * .82);                          // 별똥별이 지나갈 수 있는 가장 낮은 높이(호수 위)
  const tr = el.terrace.getBoundingClientRect();
  L.lakeBottom = hasBg || !tr.height ? H * .86 : tr.top - g.top + 24;
  const box = (r, p) => ({ l: r.left - g.left - p, t: r.top - g.top - p, r: r.right - g.left + p, b: r.bottom - g.top + p });
  L.avoid = [box(el.char.getBoundingClientRect(), 8), box(el.mute.getBoundingClientRect(), 16)]; paintDebug();   // 캐릭터·버튼 위로는 지나가지 않음
}
function resize() {
  const w = el.game.clientWidth, h = el.game.clientHeight; if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), fx = view.w ? w / view.w : 1, fy = view.h ? h / view.h : 1;
  Object.assign(view, { w, h, dpr, S: clamp(Math.min(w, h) / 700, .95, 1.3) });
  [[el.bg, bctx], [el.lk, lctx], [el.fx, ctx]].forEach(([c, x]) => { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); });
  active.forEach(m => { const nx = m.x * fx, ny = m.y * fy; m.sx = nx - m.ux * m.speed * m.age; m.sy = ny - m.uy * m.speed * m.age; });   // 크기 변경 시 위치 연속 유지
  if (!stars.length) for (let i = 0; i < 170; i++) stars.push({ x: Math.random(), y: Math.random() * .62, r: rand(.6, 1.8), p: rand(0, 6.3), sp: rand(.6, 1.8) });
  layout();
}

/* ================= 별똥별: 경로 · 생성 · 이동 ================= */
// 게임 시작 시 50개의 등장 시각을 모두 확정 (활성 개수 때문에 미루지 않음)
function buildSchedule() {
  const out = [];
  CFG.phases.forEach((p, pi) => {
    const dur = CFG.dur[profile][pi];
    const w = Array.from({ length: p.n }, (_, i) => rand(.94, 1.06) * (1 + (p.ramp || 0) * (.5 - i / (p.n - 1))));   // ramp: 뒤로 갈수록 간격이 짧아짐
    const idx = []; for (let i = 1; i < p.n; i++) idx.push(i);
    idx.sort(() => Math.random() - .5).slice(0, p.pairs || 0).forEach(i => { w[i] = .3; });     // 거의 동시에 2개 등장
    const k = (p.to - p.from) / w.reduce((a, b) => a + b, 0); let c = p.from;
    w.forEach(x => { out.push({ t: c + x * k / 2, dur: dur * rand(.95, 1.05) }); c += x * k; });
  });
  out.sort((a, b) => a.t - b.t);
  for (let k = 0; k < CFG.golden.count; k++) {                    // 10개 구간마다 하나씩 → 황금별이 동시에 여러 개 나오지 않음
    const lo = Math.floor(k * CFG.total / CFG.golden.count) + 3, e = out[lo + (Math.random() * 6 | 0)];
    if (e) { e.golden = true; e.dur *= CFG.golden.slow; }
  }
  if (CFG.DEBUG) out.forEach((e, i) => { if (e.t + e.dur * 1.1 + .5 > CFG.duration) console.warn('[라라라] 종료 전 노출이 부족할 수 있는 별', i, e.t.toFixed(2)); });
  return out;
}
// 등장 구간: A 상단 / B 중앙(좌우 바깥에서 비스듬히) / C 낮게(호수 위까지). 최근 구간은 피하고 덜 나온 구간을 우대
function selectMeteorZone() {
  const zs = ['A', 'B', 'C'], mn = Math.min(zoneCount.A, zoneCount.B, zoneCount.C);
  const w = zs.map(z => { let x = CFG.zoneWeight[z] * (1 + (mn - zoneCount[z]) * .5); if (zoneHist[0] === z) x *= .3; if (zoneHist[0] === z && zoneHist[1] === z) x = 0; return Math.max(x, 0); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; while (i < 2 && r >= w[i]) r -= w[i++];
  return zs[i];
}
// 화면 크기·비율에 맞춰 시작점/도착점 계산. 시작은 화면 바로 바깥, 이동은 항상 아래쪽, 캐릭터·버튼 위는 피함
function createMeteorPath(zone, dur) {
  const { w: W, h: H, S } = view, mg = 40 * S, playH = L.playBottom - L.skyTop, P = L.portrait, mn = Math.min(W, H);
  const band = { A: [0, .3], B: [.3, .62], C: [.5, .92] }[zone];                     // 통과 지점의 높이(플레이 영역 비율)
  const ang = { A: P ? [48, 64] : [38, 58], B: P ? [28, 42] : [20, 34], C: P ? [40, 58] : [32, 50] }[zone];
  const yEnd = { A: .55, B: .85, C: 1.1 }[zone], need = P ? .34 * H : .28 * W;
  // 공정성 검사(모바일만): 판정 원(지름 2r)이 한 점을 지나는 시간이 최소 약 0.12초는 되도록, 지나치게 빠른 경로만 제외. 속도를 늦추거나 보정하지는 않음
  const cap = profile === 'mobile' ? 2 * CFG.hit.mobile.r / .12 : Infinity, score = c => profile === 'mobile' ? Math.max(0, c.vis - cap * dur) - c.vis * 1e-4 : -c.vis;
  const build = (dir, a, px, py, ye) => {
    const cs = Math.cos(a), sn = Math.sin(a), ux = dir * cs, uy = sn;
    const sBack = Math.min((py + mg) / sn, dir > 0 ? (px + mg) / cs : (W + mg - px) / cs);
    const entry = Math.min(py / sn, dir > 0 ? px / cs : (W - px) / cs);               // 화면에 들어오는 지점까지의 거리
    const sOut = Math.min((H - py) / sn, dir > 0 ? (W - px) / cs : px / cs);                  // 머리가 화면 밖으로 나가는 지점까지의 거리
    const sFwd = Math.min((L.skyTop + playH * ye - py) / sn, dir > 0 ? (W - 24 - px) / cs : (px - 24) / cs);
    const c = { dir, ux, uy, px, py, sx: px - ux * sBack, sy: py - uy * sBack, len: sBack + Math.max(sOut, sFwd), vis: entry + sFwd, hits: false };   // vis = 속도 계산용 기준 구간, len = 화면 밖으로 나갈 때까지의 전체 경로   // vis = 화면 안에서 보이는 길이
    for (let k = 0; k <= 12; k++) {
      const x = c.sx + ux * c.len * k / 12, y = c.sy + uy * c.len * k / 12;
      if (L.avoid.some(r => x > r.l && x < r.r && y > r.t && y < r.b)) c.hits = true;
    }
    return c;
  };
  let best = null;
  for (let i = 0; i < 28; i++) {
    const dir = Math.random() < .35 ? lastDir : -lastDir, a = rad(rand(ang[0], ang[1]));
    const px = rand(.1, .9) * W, py = L.skyTop + playH * rand(band[0], band[1]);
    const c = build(dir, a, px, py, yEnd);
    if (c.len - c.vis < 0 || c.vis < .12 * mn) continue;
    const ok = !c.hits && c.vis >= need && c.vis <= cap * dur && passHist.every(q => Math.hypot(q[0] - px, q[1] - py) > .17 * mn) && active.every(m => Math.hypot(m.x - px, m.y - py) > .1 * mn);
    if (!c.hits && (!best || score(c) < score(best))) best = c;
    if (ok) { best = c; break; }
  }
  if (!best) {                                                       // 안전한 대체 경로: 화면 좌우 가장자리에서 진입
    const fb = [[1, .15, .3], [-1, .85, .3], [1, .25, .12], [-1, .75, .12]];
    for (const [dir, fx, fy] of fb) { const c = build(dir, rad(52), W * fx, L.skyTop + playH * fy, yEnd); if (!c.hits && c.vis > .1 * mn) { best = c; break; } }
    if (!best) best = build(1, rad(52), W * .15, L.skyTop + playH * .3, yEnd);
  }
  return best;
}
function spawnMeteor(dur, golden) {
  const zone = selectMeteorZone(), p = createMeteorPath(zone, dur), S = view.S, speed = p.vis / dur;   // 기준 구간을 dur 에 통과하는 속도
  const pal = golden ? CFG.goldPal : CFG.pal[Math.random() * CFG.pal.length | 0], tail = clamp(speed * .22, 80 * S, 180 * S);
  active.push({ sx: p.sx, sy: p.sy, ux: p.ux, uy: p.uy, speed, exitAge: p.len / speed, life: (p.len + tail * 1.05) / speed,   // 머리가 나간 뒤 꼬리까지 나가야 제거
    age: 0, x: p.sx, y: p.sy, alpha: 1, zone, pal, tail, r: 10 * S * (golden ? CFG.golden.size : 1), golden: !!golden,
    caught: false, missed: false, trail: 0, dead: false, vis: 0, seen: false, dur });
  maxSpeed = Math.max(maxSpeed, speed); zoneCount[zone]++; zoneHist.unshift(zone); zoneHist.length = Math.min(zoneHist.length, 2);
  passHist.unshift([p.px, p.py]); passHist.length = Math.min(passHist.length, 3); lastDir = p.dir; spawned++; if (golden) goldenSpawned++;
  const live = active.filter(m => !m.caught && !m.missed).length; if (live > peak) peak = live;
  log(`spawn #${spawned} zone ${zone} t=${t.toFixed(2)}s${golden ? ' (golden)' : ''}`);
}
// 놓친 별: 방향·속도를 그대로 유지한 채 화면 밖으로 지나가고, 꼬리까지 나간 뒤 제거됨 (추락·물결 없음)
function updateMeteor(m, dt) {
  if (m.caught) { m.dead = true; return; }
  m.age += dt; if (inView(m)) { m.vis += dt; if (!m.seen) { m.seen = true; exposed++; lastEnter = t; } }   // 화면에 들어온 뒤부터 노출 시간 측정
  m.x = m.sx + m.ux * m.speed * m.age; m.y = m.sy + m.uy * m.speed * m.age;
  m.trail += dt;
  while (m.trail > .06) {
    m.trail -= .06;
    if (inView(m) && parts.length < CFG.particleCap) { const k = rand(.1, .8); parts.push({ x: m.x - m.ux * m.tail * k + rand(-4, 4), y: m.y - m.uy * m.tail * k + rand(-4, 4), vx: rand(-8, 8), vy: rand(-4, 14), life: 0, max: .45, r: rand(1.5, 3) * view.S, c: m.pal.t, kind: 0, rot: 0 }); }
  }
  if (!m.missed && m.age >= m.exitAge) { m.missed = true; missed++; combo = 0; minExpose = Math.min(minExpose, m.vis); minRatio = Math.min(minRatio, m.vis / m.dur); log('missed (exited screen), combo reset'); }
  if (m.age >= m.life) m.dead = true;
}
function inView(m) { return m.x > -4 && m.x < view.w + 4 && m.y > -4 && m.y < view.h + 4; }

/* ================= 판정 ================= */
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1, u = clamp(((px - x1) * dx + (py - y1) * dy) / l, 0, 1);
  return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
}
function hitTest(px, py, touch) {
  const H = touch ? CFG.hit.mobile : CFG.hit.desktop, r = H.r, tl = H.tail * (touch ? 1 : view.S); let b = null, bd = 1e9;
  for (const m of active) {
    if (m.caught || m.missed || m.alpha < .35 || !inView(m)) continue;
    const d = segDist(px, py, m.x, m.y, m.x - m.ux * tl, m.y - m.uy * tl);
    if (d <= r && d < bd) { b = m; bd = d; }
  }
  return b;
}
const pointerPos = e => { const r = el.fx.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
el.fx.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  const [x, y] = pointerPos(e), m = hitTest(x, y, isTouchInput(e));
  if (m) catchMeteor(m, x, y);
});
el.fx.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || state !== 'playing') return;
  const [x, y] = pointerPos(e); el.fx.style.cursor = hitTest(x, y, isTouchInput(e)) ? 'pointer' : 'crosshair';
});
el.fx.addEventListener('contextmenu', e => e.preventDefault());

/* ================= 이펙트 (텍스트 없음: 별 모양 파티클만) ================= */
function starBurst(x, y, n, spd, life) {                          // 작은 빛 입자 (새 기록 축하용)
  for (let i = 0; i < n && parts.length < CFG.particleCap; i++) {
    const a = Math.PI * 2 * i / n + rand(-.25, .25), s = rand(.55, 1) * spd;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: life * rand(.8, 1), r: rand(2, 3.5) * view.S, c: i % 2 ? '255,232,161' : '255,255,255', kind: 0, rot: 0 });
  }
}
function lakeGlint(x, big, gold) {
  if (glints.length > 60) glints.shift();
  glints.push({ x: clamp(x, 20, view.w - 20), y: rand(L.horizon + 10, Math.max(L.horizon + 30, L.lakeBottom)), age: 0, max: big ? 1.1 : rand(.7, 1.1), r: big ? rand(7, 10) : rand(2.5, 5), ripple: big, gold: !!gold });
}
// 클릭 이펙트: 클릭한 자리에서 작은 네 갈래 빛 + 입자 3~5개, 약 0.3초 뒤 사라짐 (텍스트 없음)
function createClickSpark(x, y, gold) {
  if (sparks.length >= 16) sparks.shift();
  sparks.push({ x, y, t: 0, max: rand(.24, .32), gold });
  const n = 3 + (Math.random() * 3 | 0), col = gold ? '255,214,110' : '255,244,214';
  for (let i = 0; i < n && parts.length < CFG.particleCap; i++) {
    const a = Math.random() * 6.283, sp = rand(35, 65) * view.S;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(.22, .32), r: rand(1.6, 2.6) * view.S, c: col, kind: 0, rot: 0 });
  }
}
function updateSparks(dt) { sparks.forEach(sp => { sp.t += dt; }); sparks = sparks.filter(sp => sp.t < sp.max); }
function drawSparks() {
  for (const sp of sparks) {
    const k = sp.t / sp.max, r = 13 * view.S * (.55 + .45 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2)) * (sp.gold ? 1.15 : 1);
    ctx.fillStyle = `rgba(${sp.gold ? '255,208,100' : '255,248,224'},${1 - k})`; star4(ctx, sp.x, sp.y, r, Math.PI / 8 * (1 - k));
    ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.beginPath(); ctx.arc(sp.x, sp.y, 2.2 * view.S, 0, 6.283); ctx.fill();
  }
}
// 캐릭터 반응(단일 이미지의 아주 작은 움직임): 5연속 포착일 때만
function triggerCharacterReaction() {
  el.char.classList.add('wish'); clearTimeout(wishTimer); wishTimer = setTimeout(() => el.char.classList.remove('wish'), 500);
}
function charCenter() { const r = el.char.getBoundingClientRect(), g = el.game.getBoundingClientRect(); return [r.left - g.left + r.width / 2, r.top - g.top + r.height * .5]; }
function catchMeteor(m, px, py) {
  m.caught = true; caught++; combo++; if (!m.seen) { m.seen = true; exposed++; }
  createClickSpark(px, py, m.golden);
  el.hudScore.textContent = caught;
  el.scoreBox.classList.remove('bump'); void el.scoreBox.offsetWidth; el.scoreBox.classList.add('bump');
  chime();
  if (combo % 5 === 0) triggerCharacterReaction();
  log(`caught ${caught}, combo ${combo}`);
}
// 만점 특별 엔딩: 점수와 무관한 배경 연출 (큰 금빛 유성 1개)
function startGrandMeteor() {
  const W = view.w, dir = Math.random() < .5 ? 1 : -1, a = rad(rand(22, 30)), sx = dir > 0 ? -.12 * W : 1.12 * W, ex = dir > 0 ? 1.12 * W : -.12 * W, sy = L.skyTop + (L.playBottom - L.skyTop) * .1;
  grand = { sx, sy, ex, ey: sy + Math.abs(ex - sx) * Math.tan(a), t: 0, dur: 1.4 };
  for (let i = 0; i < 6; i++) setTimeout(() => { if (state === 'result') lakeGlint(rand(.15, .85) * view.w, true, true); }, 300 + i * 160);
}
function updateGrand(dt) { if (grand) { grand.t += dt; if (grand.t >= grand.dur) grand = null; } }
function drawGrand() {
  if (!grand) return;
  const u = grand.t / grand.dur, e = u * u * (3 - 2 * u), x = grand.sx + (grand.ex - grand.sx) * e, y = grand.sy + (grand.ey - grand.sy) * e;
  const dx = grand.ex - grand.sx, dy = grand.ey - grand.sy, d = Math.hypot(dx, dy);
  drawComet(x, y, dx / d, dy / d, 15 * view.S, 300 * view.S, '255,205,110', Math.sqrt(Math.sin(Math.PI * u)), true);
}

/* ================= 상태 전환 ================= */
function setState(s) { state = s; document.body.classList.remove('s-ready', 's-countdown', 's-playing', 's-result'); document.body.classList.add('s-' + s); }
function reset() {
  active = []; parts = []; glints = []; sparks = []; grand = null; zoneHist = []; passHist = []; zoneCount = { A: 0, B: 0, C: 0 };
  exposed = 0; minExpose = 99; minRatio = 99; maxSpeed = 0; goldenSpawned = 0; planned = CFG.total; spawned = caught = missed = combo = peak = nextIdx = 0; t = cdT = 0; lastSec = -1; phaseIdx = -1; newRecord = false;
  profile = deviceProfile(); schedule = buildSchedule(); paintDebug();      // 난이도 프로필은 게임 시작 시 한 번만 정함 (도중 입력 장치가 바뀌어도 속도·스케줄 유지)
  if (schedule.length !== CFG.total) console.warn('[라라라] phases 의 n 합계가 total 과 다릅니다:', schedule.length, CFG.total);
  el.hudScore.textContent = 0; el.hudTime.textContent = CFG.duration;
  el.hud.classList.remove('hot'); el.char.classList.remove('joy', 'wish', 'happy'); document.body.classList.remove('finale');
}
function startGame() {
  if (state === 'countdown' || state === 'playing') return;       // 중복 시작 방지
  initAudio(); reset(); setState('countdown'); cdT = -0.3;   // 시작 카드가 0.3초 사라진 뒤 3·2·1
}
function showCount(n) { el.count.textContent = n; el.count.classList.remove('pop'); void el.count.offsetWidth; el.count.classList.add('pop'); }
function stats() { return { Planned: planned, Spawned: spawned, Caught: caught, Missed: missed, Remaining: active.filter(m => !m.caught && !m.missed).length, Golden: goldenSpawned, Profile: profile, Exposed: exposed, MinExposureRatio: +minRatio.toFixed(2), MaxSpeedPxS: Math.round(maxSpeed), LastEnterSec: +lastEnter.toFixed(2), MinExposureSec: +minExpose.toFixed(2), PeakActive: peak, Zones: { ...zoneCount } }; }
function endGame() {
  active.forEach(m => { if (!m.caught && !m.missed) missed++; });               // 종료 순간 남은 별은 놓친 별로 정리
  active = []; setState('result'); el.count.textContent = ''; resT = 0; document.body.classList.remove('finale');
  if (CFG.DEBUG) { console.table(stats()); if (spawned !== CFG.total || exposed !== spawned || caught + missed !== spawned) console.error('[라라라] 집계 불일치!', stats()); }
  newRecord = caught > best && caught > 0;
  if (newRecord) { best = caught; try { localStorage.setItem(CFG.storeKey, best); } catch (e) {} }
  if (newRecord) {                                                // 새 최고 기록일 때만 작은 별빛 축하
    for (let i = 0; i < 10; i++) setTimeout(() => lakeGlint(rand(.08, .92) * view.w, true), i * 90);
    const [cx, cy] = charCenter(); starBurst(cx, cy - view.h * .08, 12, 170 * view.S, .8);
  }
  el.rBest.textContent = best; el.rNew.hidden = !newRecord;
  el.rMsg.textContent = caught === CFG.total ? '오늘 밤, 모든 소원을 잡았어요!' : `오늘 밤, 소원 ${caught}개를 잡았어요!`;
  if (caught === CFG.total) { startGrandMeteor(); triggerCharacterReaction(); }   // 만점일 때만 특별 엔딩
  el.rScore.textContent = 0; el.char.classList.add('joy'); el.hud.classList.remove('hot');
}
$('btn-start').addEventListener('click', startGame);
$('btn-retry').addEventListener('click', () => { if (state === 'result') startGame(); });
el.mute.addEventListener('click', () => {
  muted = !muted; paintMute(); try { localStorage.setItem(CFG.storeKey + '-mute', muted ? '1' : '0'); } catch (e) {}
  if (!muted) { initAudio(); chime(); }
});

/* ================= 업데이트 ================= */
function update(dt) {
  if (state === 'countdown') {
    const before = cdT < 0 ? CFG.countdown + 1 : Math.ceil(CFG.countdown - cdT); cdT += dt; const n = Math.ceil(CFG.countdown - cdT);
    if (cdT >= CFG.countdown) { el.count.textContent = ''; setState('playing'); }
    else if (cdT >= 0 && n !== before) showCount(n);
  } else if (state === 'playing') {
    t += dt;                                                       // dt 상한이 있어 탭이 숨겨지면 게임 시간도 함께 멈춤
    while (nextIdx < schedule.length && schedule[nextIdx].t <= t) { const e = schedule[nextIdx++]; spawnMeteor(e.dur, e.golden); }   // 밀리지 않고 반드시 생성
    active.forEach(m => updateMeteor(m, dt)); active = active.filter(m => !m.dead);
    const sec = Math.ceil(Math.max(0, CFG.duration - t));
    if (sec !== lastSec) { lastSec = sec; el.hudTime.textContent = sec; el.hud.classList.toggle('hot', sec <= 5 && sec > 0); }
    if (t >= CFG.finaleAt) document.body.classList.add('finale');
    if (t >= CFG.duration) endGame();
  } else if (state === 'result') {
    resT += dt; el.rScore.textContent = Math.floor(Math.min(1, resT / .9) * caught);
  }
  glintTimer -= dt;
  if (glintTimer <= 0) { glintTimer = document.body.classList.contains('finale') ? .16 : .5; lakeGlint(rand(.05, .95) * view.w, false); }
  updateSparks(dt); updateGrand(dt);
  for (const p of parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95; }
  parts = parts.filter(p => p.life < p.max);
  glints.forEach(g => { g.age += dt; }); glints = glints.filter(g => g.age < g.max);
}

/* ================= 그리기 ================= */
function star4(c, x, y, r, rot) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .38 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
function drawBg(time) {                                           // 하늘의 작고 은은한 장식 별 (별똥별보다 작고 흐림)
  bctx.clearRect(0, 0, view.w, view.h);
  const boost = document.body.classList.contains('finale') ? 1.7 : 1;
  for (const s of stars) { bctx.fillStyle = `rgba(255,230,163,${clamp((.5 + .4 * Math.sin(time * s.sp + s.p)) * boost, 0, .95)})`; bctx.beginPath(); bctx.arc(s.x * view.w, s.y * view.h, s.r, 0, 6.283); bctx.fill(); }
}
function drawLake(time) {                                             // 수면 반짝임: 아주 작고 정지해 있어 별똥별과 구분됨
  lctx.clearRect(0, 0, view.w, view.h);
  const fin = document.body.classList.contains('finale') ? 1.7 : 1;
  for (const s of stars) {                                        // 호수에 비친 별빛(가늘고 낮게 흔들려 별똥별과 구분)
    const sy = s.y * view.h, ry = L.horizon + (L.horizon - sy) * .55; if (sy > L.horizon - 6 || ry > L.lakeBottom) continue;
    lctx.fillStyle = `rgba(190,205,240,${(.22 + .18 * Math.sin(time * s.sp * 1.3 + s.p)) * fin})`; lctx.fillRect(s.x * view.w + Math.sin(time + s.p) * 3, ry, s.r * 3, 1.5);
  }
  for (const g of glints) {
    const k = g.age / g.max, a = Math.sin(Math.PI * k);
    lctx.fillStyle = g.gold ? `rgba(255,210,110,${a * .9})` : `rgba(255,248,224,${a * .9})`; star4(lctx, g.x, g.y, g.r * (.6 + .4 * a), 0);
    if (g.ripple) { lctx.strokeStyle = `rgba(255,255,255,${(1 - k) * .6})`; lctx.lineWidth = 1.5; lctx.beginPath(); lctx.ellipse(g.x, g.y, g.r * 2 + k * 36 * view.S, (g.r * 2 + k * 36 * view.S) * .25, 0, 0, 6.283); lctx.stroke(); }
  }
}
// 부드러운 유성: 작은 발광 구체 머리 + 길고 부드럽게 옅어지는 꼬리 (정형적인 별 모양·외곽선 없음)
function drawComet(x, y, ux, uy, r, tail, pal, alpha, gold) {
  const tx = x - ux * tail, ty = y - uy * tail;
  ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  [[r * 1.8, .14], [r * 1, .26], [r * .42, .8]].forEach(([w, a], i) => {
    const g = ctx.createLinearGradient(x, y, tx, ty);
    g.addColorStop(0, `rgba(${i === 2 ? '255,255,255' : pal},${a})`); g.addColorStop(.5, `rgba(${pal},${a * .45})`); g.addColorStop(1, `rgba(${pal},0)`);
    ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  });
  const R = r * (gold ? 4.2 : 3), gl = ctx.createRadialGradient(x, y, 0, x, y, R);
  gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(.25, `rgba(${pal},.55)`); gl.addColorStop(1, `rgba(${pal},0)`);
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#fffdf3'; ctx.beginPath(); ctx.arc(x, y, r * .5, 0, 6.283); ctx.fill();
  ctx.globalAlpha = 1;
}
function drawMeteor(m) { if (!m.caught) drawComet(m.x, m.y, m.ux, m.uy, m.r, m.tail, m.pal.t, m.alpha, m.golden); }
function draw(time) {
  ctx.clearRect(0, 0, view.w, view.h);
  if (state === 'playing' && CFG.duration - t <= 5) {             // 마지막 5초: 작은 카운트다운 효과
    const rem = CFG.duration - t, p = 1 - (rem - Math.floor(rem));
    ctx.fillStyle = `rgba(255,255,255,${.22 - p * .14})`; ctx.font = `800 ${Math.min(view.w, view.h) * .32}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.ceil(rem), view.w / 2, L.skyTop + (L.playBottom - L.skyTop) * .45);
  }
  active.forEach(drawMeteor); drawGrand();
  for (const p of parts) { ctx.fillStyle = `rgba(${p.c},${1 - p.life / p.max})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
  drawSparks();
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000 || 0, .05); last = now;   // 경과 시간 기반 이동 (주사율 무관)
  update(dt); drawBg(now / 1000); drawLake(now / 1000); draw(now / 1000);
}

/* ================= 초기화 ================= */
buildScene(); paintMute(); reset(); resize();
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el.game);
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
document.addEventListener('gesturestart', e => e.preventDefault());
if (CFG.DEBUG) {
  dbg = document.createElement('div');
  dbg.style.cssText = 'position:fixed;right:6px;bottom:6px;z-index:99;max-width:70vw;padding:3px 7px;font:11px/1.3 monospace;color:#d6f5e0;background:rgba(0,0,0,.6);border-radius:6px;pointer-events:none';
  document.body.appendChild(dbg); paintDebug();
}
window.LALALA = { CFG, stats, layout: L, getActive: () => active, getSparks: () => sparks, getGrand: () => grand };                           // 콘솔에서 LALALA.stats() 로 확인 가능
// 선택 이미지: assets/character.webp (캐릭터, 투명 배경) / assets/background.webp (전체 배경). 없거나 로드 실패 시 SVG 기본 캐릭터·배경 유지
const loadImg = (src, ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => {}; i.src = src; };
loadImg('assets/character.webp', i => { $('charImg').src = i.src; $('charImg').hidden = false; $('charSvg').style.display = 'none'; layout(); });
loadImg('assets/background.webp', i => { const b = $('bgimg'); b.style.backgroundImage = `url(${i.src})`; b.hidden = false; document.body.classList.add('has-bg'); layout(); });
requestAnimationFrame(frame);
})();

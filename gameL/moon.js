'use strict';
/* ===== 난이도·연출 설정 (여기만 고치면 밸런스가 바뀝니다) ===== */
const CONFIG = {
  startGrowth: 15,          // 시작 성장률(%)
  clickGain: 1.2,           // 클릭당 성장(%)
  decayBands: [             // 구간별 초당 감소량(%)  upTo: 해당 성장률 미만
    { upTo: 30,  rate: 1.0 },
    { upTo: 60,  rate: 2.0 },
    { upTo: 80,  rate: 3.4 },
    { upTo: 101, rate: 5.0 },
  ],
  moonCenterY: 0.32,        // 달 중심의 세로 위치 (화면 높이 비율)
  startMoon: { w: 0.30, h: 0.17, min: 80 }, // 시작 달 지름: min(너비×w, 높이×h), 최소 min px
  growthCurve: 1.2,         // 1보다 크면 초반은 완만, 후반은 급격히 커짐
  glowRatio: 3.4,           // 달빛 반경 = 달 반경 × 이 값 (style.css의 그라데이션과 같은 값)
  startLockMs: 200,         // 시작/다시하기 직후 입력 무시 시간
  bubbleMs: 1600,           // 터치 대사 노출 시간
  maxDt: 0.1,               // 프레임 튐 방지(초)
  clear: { startleAt: 550, startleMs: 300, fallMs: 1000, resultDelay: 650 }, // 클리어 연출 타이밍(ms)
};
const LINES = { start: '오늘 달도 진짜 밝다-!', touch: '달이 왜 점점 커져?', shout: '우와아아악!' };
const KEY = 'moonGrow.v1';
/* 게임 상태: READY(시작 화면) → WAITING_FOR_TAP(플레이 화면, 첫 터치 대기) → PLAYING → CLEAR | GAME_OVER */
const ST = { READY:'READY', WAITING:'WAITING_FOR_TAP', PLAYING:'PLAYING', CLEAR:'CLEAR', OVER:'GAME_OVER' };

const $ = id => document.getElementById(id);
const el = { game:$('game'), moon:$('moon'), pop:$('pop'), hit:$('moonHit'), glow:$('glow'), time:$('time'),
  bubble:$('bubble'), start:$('start'), result:$('result'), flash:$('flash'), dark:$('dark'),
  hint:$('hint'), char:$('char'), rig:$('rig'), upper:$('upper'), legs:$('p-legs'), torso:$('p-torso'),
  armDown:$('p-armdown'), head:$('p-head'), armUp:$('p-armup'), fallenWrap:$('fallenWrap'), fallen:$('fallenImg'), stars:$('stars') };

let state = ST.READY;
let growth = CONFIG.startGrowth, elapsed = 0;
let last = 0, paused = false, bubbleTimer = 0, resultTimer = 0, lockUntil = 0;
const timers = [];
let W = 0, H = 0, cx = 0, cy = 0, dMax = 400, dStart = 100, S = 400;

/* ----- 기록 (최고 완성 시간만 저장) ----- */
const loadBest = () => { try { const b = JSON.parse(localStorage.getItem(KEY)).bestTime; return typeof b === 'number' ? b : null; } catch { return null; } };
const saveBest = t => { try { localStorage.setItem(KEY, JSON.stringify({ bestTime: t })); } catch {} };

const fmt = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
const decayRate = g => CONFIG.decayBands.find(b => g < b.upTo).rate;

/* ----- 화면 크기 기준 달 지름 계산 ----- */
function layout() {
  W = el.game.clientWidth; H = el.game.clientHeight;
  cx = W / 2; cy = H * CONFIG.moonCenterY;
  dMax = 2 * Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.03;
  const m = CONFIG.startMoon;
  dStart = Math.max(m.min, Math.min(W * m.w, H * m.h));
  S = Math.min(dMax, 1600);
  el.game.style.setProperty('--cy', (CONFIG.moonCenterY * 100) + '%');
  el.moon.style.setProperty('--S', S + 'px');
  render();
}
function moonDiameter(g) {
  const t = (g - CONFIG.startGrowth) / (100 - CONFIG.startGrowth);
  const e = t >= 0 ? Math.pow(t, CONFIG.growthCurve) : t;
  return dStart * Math.pow(dMax / dStart, e);
}
function render() {
  const g = Math.max(0, Math.min(100, growth)) / 100;
  if (state !== ST.OVER) {
    const d = moonDiameter(growth);
    el.moon.style.setProperty('--s', (d / S).toFixed(4));
    el.hit.style.width = el.hit.style.height = Math.max(d, 130) + 'px';
    const R = d * CONFIG.glowRatio / 2, size = Math.min(2 * R, dMax * 1.15);
    el.glow.style.width = el.glow.style.height = size + 'px';
    el.glow.style.setProperty('--R', R.toFixed(1) + 'px');
    el.glow.style.opacity = (.45 + .55 * g).toFixed(3);
  }
  el.game.style.setProperty('--lit', g.toFixed(3));
  el.game.style.setProperty('--wash', (Math.pow(g, 1.6) * .9).toFixed(3));
  el.time.textContent = fmt(elapsed);
}

/* ----- 말풍선: 하나만 재사용 (중복 생성 없음) ----- */
function say(text, ms, shout) {
  clearTimeout(bubbleTimer);
  el.bubble.textContent = text;
  el.bubble.classList.toggle('shout', !!shout);
  el.bubble.classList.add('show');
  if (ms) bubbleTimer = setTimeout(() => el.bubble.classList.remove('show'), ms);
}

/* ----- 입력: 대기(WAITING_FOR_TAP)·진행(PLAYING) 상태에서만, 첫 입력이 게임 시작 ----- */
function tap() {
  if (state !== ST.WAITING && state !== ST.PLAYING) return;
  if (paused || performance.now() < lockUntil) return;
  if (state === ST.WAITING) {            // 첫 터치 = 실제 게임 시작 (타이머·자동 축소 시작)
    state = ST.PLAYING; elapsed = 0; last = performance.now();
  }
  growth = Math.min(100, growth + CONFIG.clickGain);   // 첫 터치도 정상 성장 입력
  el.hit.classList.remove('pulse'); el.hint.classList.add('off');
  say(LINES.touch, CONFIG.bubbleMs);
  el.pop.animate([{ transform:'scale(1)' },{ transform:'scale(1.05)' },{ transform:'scale(.995)' },{ transform:'scale(1)' }],
    { duration:220, easing:'ease-out' });
  sparkle();
  render();
  if (growth >= 100) end(ST.CLEAR);
}
function sparkle() {
  const s = document.createElement('span'); s.className = 'spark'; s.textContent = '✦';
  const r = Math.min(moonDiameter(growth) / 2, Math.min(W, H) * .38), a = Math.random() * Math.PI * 2;
  s.style.left = cx + Math.cos(a) * r * .95 + 'px'; s.style.top = cy + Math.sin(a) * r * .95 + 'px';
  s.style.setProperty('--x', Math.cos(a) * 24 + 'px'); s.style.setProperty('--y', Math.sin(a) * 24 + 'px');
  el.game.appendChild(s); setTimeout(() => s.remove(), 620);
}
el.hit.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
addEventListener('keydown', e => {
  if (e.code !== 'Space' || (state !== ST.WAITING && state !== ST.PLAYING)) return;
  e.preventDefault(); if (!e.repeat) tap();
});
['gesturestart','dblclick','contextmenu'].forEach(t => document.addEventListener(t, e => e.preventDefault()));

/* ----- 시작 / 초기화 ----- */
const animated = () => [el.rig, el.upper, el.legs, el.torso, el.armDown, el.head, el.armUp, el.fallen, el.pop];
function resetVisuals() {
  clearTimeout(resultTimer); clearTimeout(bubbleTimer);
  timers.splice(0).forEach(clearTimeout);
  animated().forEach(n => n.getAnimations().forEach(a => a.cancel()));   // 캐릭터·달 원상복구
  el.char.classList.remove('still'); el.fallenWrap.classList.remove('hit'); el.bubble.classList.remove('shout');
  el.moon.classList.remove('vanish'); el.glow.classList.remove('vanish');
  el.flash.className = ''; el.dark.classList.remove('on');
  document.querySelectorAll('.shock').forEach(n => n.remove());
}
/* '시작하기'/'다시 하기' = 플레이 화면 진입만 담당. 게임은 첫 터치 때 시작 */
function enterPlayScreen() {
  if (state === ST.WAITING || state === ST.PLAYING) return;
  resetVisuals();
  if (document.activeElement) document.activeElement.blur();
  growth = CONFIG.startGrowth; elapsed = 0;
  el.result.classList.add('hidden'); el.start.classList.add('hidden');
  el.hit.classList.add('pulse'); el.hint.classList.remove('off');
  say(LINES.start);
  el.moon.animate([{ opacity:0 },{ opacity:1 }], { duration:600 });
  state = ST.WAITING;                      // 타이머·축소 정지 상태로 대기
  el.game.classList.add('active');
  layout();
  lockUntil = performance.now() + CONFIG.startLockMs;
}

/* ----- 종료 ----- */
function end(kind) {
  if (state !== ST.PLAYING) return;        // 중복 판정 방지
  state = kind;                            // 이 순간부터 입력·타이머 정지
  el.game.classList.remove('active');
  clearTimeout(bubbleTimer); el.bubble.classList.remove('show'); el.hint.classList.add('off');
  el.hit.classList.remove('pulse');
  if (kind === ST.CLEAR) {
    growth = 100; render();
    playClear();
  } else {
    growth = 0; render();
    el.moon.style.setProperty('--s', '0.02'); el.moon.classList.add('vanish'); el.glow.classList.add('vanish');
    el.dark.classList.add('on');
    resultTimer = setTimeout(() => showResult(ST.OVER), 900);
  }
}

/* 클리어 연출: 달이 화면을 채움 → 움찔·"우와아아악!" → 뒤로 넘어짐(카메라 쪽으로) → 누워 있는 모습 → 결과
   옆으로 눕히지 않고, 상체·머리가 카메라 쪽으로 다가오며(세로 압축 + 확대) 다리는 뒤에 남는 원근으로 표현한 뒤
   '뒤로 넘어진 포즈(char-fallen.svg)'로 쿵 하고 이어집니다. */
function playClear() {
  const T = CONFIG.clear, D = T.startleMs + T.fallMs;
  const sp = T.startleMs / D, F = f => sp + (1 - sp) * f;
  const A = (node, origin, frames) => { node.style.transformOrigin = origin;
    return node.animate(frames, { duration: D, delay: T.startleAt, fill: 'both' }); };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  el.pop.animate([{ transform:'scale(1)' },{ transform:'scale(1.14)' }], { duration:1600, easing:'cubic-bezier(.15,.8,.2,1)', fill:'forwards' });
  const sh = document.createElement('div'); sh.className = 'shock';
  sh.style.setProperty('--D', (dMax * 1.4).toFixed(0) + 'px'); el.game.appendChild(sh);
  el.flash.className = 'go';

  later(() => el.char.classList.add('still'), T.startleAt - 20);
  later(() => say(LINES.shout, 0, true), T.startleAt);           // 클리어 순간에만, 말풍선 하나로 표시
  const HIP = '50% 61.5%';
  A(el.rig, '50% 100%', [       // 점프 → (서 있는 몸은 충돌 순간 사라지고 넘어진 포즈로 교체)
    { offset:0, transform:'translateY(0)', opacity:1, easing:'ease-out' },
    { offset:sp * .3, transform:'translateY(-4%)', opacity:1, easing:'ease-in' },
    { offset:sp, transform:'translateY(0)', opacity:1 },
    { offset:F(.52), transform:'translateY(0)', opacity:1 },
    { offset:F(.62), transform:'translateY(3%)', opacity:0 },
    { offset:1, transform:'translateY(3%)', opacity:0 }]);
  A(el.upper, HIP, [            // 상체: 뒤로 젖혀지며 카메라 쪽으로 → 세로로 눌리고 커지고 아래로
    { offset:0, transform:'translateY(0) scale(1,1)' },
    { offset:sp, transform:'translateY(0) scale(1,1)', easing:'ease-out' },
    { offset:F(.12), transform:'translateY(-1.5%) scale(1.02,1.03)', easing:'cubic-bezier(.5,0,.85,.45)' },
    { offset:F(.56), transform:'translateY(26%) scale(1.25,.5)' },
    { offset:1, transform:'translateY(26%) scale(1.25,.5)' }]);
  A(el.legs, HIP, [             // 다리: 상대적으로 뒤에 남아 작아짐
    { offset:0, transform:'none' }, { offset:sp, transform:'none', easing:'ease-out' },
    { offset:F(.12), transform:'translateY(-1%)', easing:'cubic-bezier(.5,0,.85,.45)' },
    { offset:F(.56), transform:'translateY(-4%) scale(.88,.78)' },
    { offset:1, transform:'translateY(-4%) scale(.88,.78)' }]);
  A(el.torso, HIP, [            // 놀라서 몸통 움찔
    { offset:0, transform:'scale(1)', easing:'ease-out' },
    { offset:sp * .3, transform:'scale(.99,.965)', easing:'ease-in-out' },
    { offset:sp, transform:'scale(1)' }, { offset:1, transform:'scale(1)' }]);
  A(el.head, '50% 32.7%', [     // 머리: 움츠렸다가 카메라 쪽으로 커지며 다가옴
    { offset:0, transform:'none', easing:'ease-out' },
    { offset:sp * .3, transform:'translateY(3%) scale(.96)', easing:'ease-in-out' },
    { offset:sp, transform:'translateY(1%)', easing:'ease-in-out' },
    { offset:F(.14), transform:'translateY(-2%) scale(1.02)', easing:'cubic-bezier(.5,0,.85,.45)' },
    { offset:F(.56), transform:'translateY(38%) scale(1.45,2.5)' },
    { offset:1, transform:'translateY(38%) scale(1.45,2.5)' }]);
  A(el.armUp, '67.3% 36.9%', [  // 가리키던 팔: 휘청휘청
    { offset:0, transform:'rotate(0deg)', easing:'ease-out' },
    { offset:sp * .3, transform:'rotate(24deg)', easing:'ease-in-out' },
    { offset:sp, transform:'rotate(14deg)', easing:'ease-in-out' },
    { offset:F(.22), transform:'rotate(-38deg)', easing:'ease-in-out' },
    { offset:F(.4), transform:'rotate(42deg)', easing:'ease-in-out' },
    { offset:F(.56), transform:'rotate(-12deg) scale(1.15)' },
    { offset:1, transform:'rotate(-12deg) scale(1.15)' }]);
  A(el.armDown, '33.3% 37.3%', [
    { offset:0, transform:'rotate(0deg)', easing:'ease-out' },
    { offset:sp * .3, transform:'rotate(25deg)', easing:'ease-in-out' },
    { offset:sp, transform:'rotate(16deg)', easing:'ease-in-out' },
    { offset:F(.22), transform:'rotate(-30deg)', easing:'ease-in-out' },
    { offset:F(.4), transform:'rotate(36deg)', easing:'ease-in-out' },
    { offset:F(.56), transform:'rotate(-10deg) scale(1.15)' },
    { offset:1, transform:'rotate(-10deg) scale(1.15)' }]);
  A(el.fallen, '50% 100%', [    // 뒤로 넘어진 포즈: 쿵! 찌그러졌다 튕기고 자리 잡음
    { offset:0, opacity:0, transform:'translateY(-14%) scale(.9)' },
    { offset:F(.54), opacity:0, transform:'translateY(-14%) scale(.9)', easing:'ease-in' },
    { offset:F(.62), opacity:1, transform:'translateY(1%) scale(1.08,.88)', easing:'ease-out' },
    { offset:F(.74), opacity:1, transform:'translateY(-5%) scale(.98,1.05)', easing:'ease-in' },
    { offset:F(.84), opacity:1, transform:'translateY(0) scale(1.02,.96)', easing:'ease-out' },
    { offset:F(.92), opacity:1, transform:'translateY(0) scale(1,1)' },
    { offset:1, opacity:1, transform:'none' }]);
  const impact = T.startleAt + T.startleMs + T.fallMs * .6;
  later(() => { el.fallenWrap.classList.add('hit');                       // 먼지
    el.game.animate([{ transform:'translateY(0)' },{ transform:'translateY(5px)' },{ transform:'translateY(-3px)' },{ transform:'translateY(0)' }], { duration:220 }); }, impact);

  // 넘어짐이 끝나고 누워 있는 모습이 잠깐 보인 뒤에 결과 화면
  resultTimer = setTimeout(() => showResult(ST.CLEAR), T.startleAt + D + T.resultDelay);
}

function showResult(kind) {
  let html;
  el.bubble.classList.remove('show');
  if (kind === ST.CLEAR) {
    const prev = loadBest();
    const isNew = prev !== null && elapsed < prev;     // 기존 기록을 깼을 때만 NEW RECORD!
    const best = (prev === null || elapsed < prev) ? elapsed : prev;
    if (best !== prev) saveBest(best);
    html = `<div class="rbox"><h2 class="big">우당탕 쿵 탕!</h2>${isNew ? '<span class="new">NEW RECORD!</span>' : ''}
      <dl><dt>이번 기록</dt><dd>${fmt(elapsed)}</dd><dt>최고 기록</dt><dd>${fmt(best)}</dd></dl>
      <button id="again">다시 하기</button></div>`;
  } else {
    html = `<div class="rbox over"><span class="badge">GAME OVER</span><h2>달이 사라졌어…</h2>
      <button id="again">다시 하기</button></div>`;
  }
  el.result.innerHTML = html; el.result.classList.remove('hidden');
  $('again').addEventListener('click', enterPlayScreen);   // 다시 하기도 첫 터치를 기다림
}

/* ----- 메인 루프 (시간 기반, PLAYING일 때만 진행 — 대기 중엔 타이머·축소 없음) ----- */
function frame(t) {
  requestAnimationFrame(frame);
  if (state !== ST.PLAYING || paused) return;
  const dt = Math.min((t - last) / 1000, CONFIG.maxDt); last = t;
  elapsed += dt;
  growth -= decayRate(growth) * dt;
  if (growth <= 0) { end(ST.OVER); return; }
  render();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) paused = true; else { last = performance.now(); paused = false; }
});

/* ----- 초기화 ----- */
for (let i = 0; i < 26; i++) {
  const s = document.createElement('i'); s.className = 'star';
  const z = Math.random() * 2 + 1;
  s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*62}%;width:${z}px;height:${z}px;animation-delay:${-Math.random()*3}s;opacity:${.4+Math.random()*.5}`;
  el.stars.appendChild(s);
}
$('startBtn').addEventListener('click', enterPlayScreen);
new ResizeObserver(layout).observe(el.game);
say(LINES.start);
layout();
requestAnimationFrame(t => { last = t; frame(t); });

/* 오렌지 쌓기 — 시각적 접촉 기준으로 착지 판정, 안정적인 탑은 유지, 실패 종류에 맞는 물리 연출 */
'use strict';
const DEBUG_BALANCE = false; // true로 바꾸면 균형 디버그 표시(지지점·무게중심·위험도). 배포 시에는 반드시 false
/* ===== 밸런스 설정 ===== (월드 단위: 오렌지 지름 = radius*2 = 100) */
const CONFIG = {
  world:  { centerX: 200 },
  floorY: 700,
  orange: { radius: 50 },
  size:   { widthRatio: 0.31, heightRatio: 0.2, minPx: 80, maxPx: 170 },
  support:{ reach: 0.66 },   // 지름 대비: reach 이상 어긋나면(겹침 34% 미만) 지지되지 못하고 미끄러져 실패 / 2R(=1.0) 이상이면 아예 닿지 않음
  balance:{ tipTol: 1.45,                 // 접촉부 가상 지지 폭(반지름 배수): 위쪽 전체 무게중심이 접촉점에서 이 이상 벗어나면 한계
            tipLoadShrink: 0.3, tipLoadFull: 8, // 하중이 커질수록(위에 8개 이상이면 최대) 지지 폭이 30%까지 좁아짐
            baseTol: 2.2,                   // 바닥 첫 오렌지 검사: 위쪽 전체 무게중심이 첫 오렌지 중심에서 벗어날 수 있는 한계
            slideMu: 0.87, stressStart: 0.5, stressMax: 6, // slideMu: 접촉각 마찰 한계(tanθ/μ, 무게와 무관) / stress*: 한계에 가까운 접촉부가 이만큼 쌓이면 붕괴
            propagate: 0.88,                // 아래 접촉부 불안정이 위층 흔들림에 전달되는 비율(층마다 감쇠)
            tiltTol: 0.6, tiltWindow: 6, tiltMin: 3, maxOverhang: 4.0, // maxOverhang: 첫 오렌지 중심에서 이만큼(반지름 배수) 밀린 오렌지가 있으면 육안으로도 한계 // 최근 6층의 기울기(높이가 커져도 희석되지 않음)
            blend: 0.15, collapse: 1.0 },   // 최악 항목 + 나머지 15% / 1.0 이상이면 붕괴
  sway:   { curve: [[0, 0.25], [0.15, 1.6], [0.4, 4.8], [0.7, 9.5], [0.9, 14], [1, 18]], // [균형값, 흔들림 폭]
            bendMax: 4.5, leanCap: 16, leanStart: 0.15, leanPow: 1.3, globalShare: 0.6,       // 불안정한 접촉부마다 꺾이는 정도 / 누적 상한
            freqMin: 2.2, freqMax: 5, wave: 0.5, tiltGain: 1.4, heightRef: 12,
            kickBase: 0.15, kickGain: 1.2, kickAmp: 4, smooth: 4,
            lurchStart: 0.75, lurchAmp: 9, lurchRate: 2.4 }, // 붕괴 직전(균형값 0.75↑)에 가장 불안정한 접촉부 위가 크게 휘청임
  hover:  { halfDiam: 0.9, screenFactor: 0.95, margin: 10, hudPx: 64, // 이동 반폭 = 지름 0.9배(화면 가용폭의 95% 이내) / hudPx: 상단 UI 아래에서 오렌지가 시작하는 최소 높이
            crossSec: 1.45, easeZone: 0.2, edgeMin: 0.55,             // 기준 왕복 시간 / 끝에서 감속 구간 / 끝에서 최소 속도 비율
            speeds: [{ p: 0.30, min: 0.75, max: 0.95 }, { p: 0.45, min: 1.0, max: 1.25 }, // 느림 / 보통  (등장 확률, 속도 배율)
                     { p: 0.20, min: 1.3, max: 1.6 }, { p: 0.05, min: 1.7, max: 1.9 }] }, // 빠름 / 매우 빠름 — 오렌지 생성 시 한 번만 결정
  fall:   { gravity: 2600, maxSpeed: 1500 },
  landing:{ sec: 0.24, squash: 0.11, wobble: 0.1 },
  collapse: { shakeSec: 0.3, stagger: 0.06, maxStagger: 0.9, durationSec: 1.7, maxBodies: 45,
              gravity: 2, restitution: 0.3, friction: 0.4, frictionAir: 0.002,
              kickX: 0.6, kickPerRank: 0.25, kickMaxRank: 10, spin: 0.05, failKick: 1.5,
              blockStagger: 0.04, lowerDelay: 0.25, lowerStagger: 0.07, lowerKick: 0.35 }, // 무너진 접촉부 위는 한 덩어리로 먼저, 아래는 늦게·약하게
  sound:  { master: 0.5, storageKey: 'orange-stack-sound' },                                    // 효과음 (Web Audio, 외부 파일 없음)
  guide:  { chance: 0.05, fadeSec: 0.35, smooth: 10, alpha: 0.55, // chance: 오렌지마다 점선이 보일 확률 / fadeSec: 생성 직후 부드럽게 나타나는 시간 // 착지 전 점선 가이드: 예상 균형값 → 색 (초록=안정 / 노랑·주황=불안정 / 빨강=붕괴 위험)
            stops: [[0, [96, 190, 120]], [0.2, [96, 190, 120]], [0.45, [236, 196, 72]], [0.7, [244, 146, 58]], [0.95, [226, 84, 84]]] },
  camera: { speed: 4, collapseSpeed: 2.2, towerAt: 0.62, floorShowPx: 64 },
  storageKey: 'orange-stack-best'
};
const { Engine, Bodies, Body, Composite } = Matter;
/* 좌표의 역할 분리: x,y,a = 확정 좌표(균형 판정에 사용) / ox,oy,da,lda = 렌더링 전용 오프셋(흔들림·착지 연출) / b,o0 = 착지 직후 오프셋 전환용 */
const mkOrange = (x, y, a) => ({ x, y, a, ox: 0, oy: 0, lx: 0, da: 0, lda: 0, sx: 1, sy: 1, b: 1, o0: 0 }); // lx: 흔들림의 '중심'(기운 방향, 진동 제외) — 착지 판정·예상에 사용
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), norm = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

class StorageManager {
  get() { try { return +localStorage.getItem(CONFIG.storageKey) || 0; } catch (e) { return 0; } }
  set(v) { try { localStorage.setItem(CONFIG.storageKey, String(v)); } catch (e) {} }
}

/* 지지 구조 기반 균형 계산 — 실제 쌓인 월드 좌표에서만 계산 (화면 크기·카메라 무관, 시간 경과 무관, 착지할 때만 재평가).
   오렌지 j는 바로 아래 j-1과 한 점(두 원 중심의 중점)에서 맞닿고, 그 접촉부는 "j 이상 위쪽 전체"를 떠받친다. 접촉부마다:
   ① 전복: 위쪽 전체 무게중심이 접촉점에서 벗어난 정도 / 가상 지지 폭(tipTol)
   ② 미끄러짐: 접촉각(중심 어긋남/2R)이 클수록, 얹힌 오렌지가 많을수록(하중) 위험
   그 밖에 ③ 바닥 첫 오렌지가 위쪽 전체 무게를 지탱하는지, ④ 최근 층들의 기울기를 별도로 검사한다.
   가장 나쁜 항목이 전체 판정을 결정하므로 평균으로 상쇄되지 않고, 아래 접촉부가 이미 한계면 위쪽이 중앙이어도 안정으로 보지 않는다. */
class BalanceSystem {
  restY(top, dx) { // 아래 오렌지와 원이 맞닿는 높이
    const d = CONFIG.orange.radius * 2;
    return top.y - Math.sqrt(Math.max(0, d * d - dx * dx));
  }
  evaluate(stack, extraX, lite) { // extraX를 주면 "그 위치에 오렌지를 하나 더 얹었을 때"를 계산(착지 전 예상), lite면 값만 계산
    const C = CONFIG.balance, R = CONFIG.orange.radius, n0 = stack.length, n = extraX === undefined ? n0 : n0 + 1;
    const X = i => (i < n0 ? stack[i].x : extraX), full = !lite;
    const rng = full ? new Array(n).fill(C.tipTol * R) : null, own = full ? new Array(n).fill(0) : null, dir = full ? new Array(n).fill(0) : null;
    const contact = full ? new Array(n).fill(0) : null, com = full ? new Array(n).fill(0) : null;
    let sumX = 0, worst = 0, worstJ = 0, com1 = 0, stress = 0;
    for (let j = n - 1; j >= 1; j--) {
      sumX += X(j); const m = n - j, d = X(j) - X(j - 1), cx = X(j - 1) + d / 2, cm = sumX / m;
      const rg = C.tipTol * R * (1 - C.tipLoadShrink * Math.min(1, m / C.tipLoadFull)); // 하중이 클수록 지지 폭 감소
      const e = cm - cx, uTip = Math.abs(e) / rg;
      const sn = Math.min(0.999, Math.abs(d) / (2 * R)), uSlip = sn / Math.sqrt(1 - sn * sn) / C.slideMu; // 접촉각 θ(sinθ=d/2R)에서 필요한 마찰 / 가능한 마찰: 한계에 가까울수록 급격히 위험
      const o = Math.max(uTip, uSlip) + 0.3 * Math.min(uTip, uSlip);
      if (o > worst) { worst = o; worstJ = j; }
      stress += clamp((o - C.stressStart) / (1 - C.stressStart), 0, 1); // 한계에 가까운 접촉부 수(지그재그처럼 위험 접촉부가 이어진 탑)
      if (full) { rng[j] = rg; own[j] = o; dir[j] = Math.sign(e) || Math.sign(d); contact[j] = cx; com[j] = cm; }
      if (j === 1) com1 = cm;
    }
    let joint = null;
    if (full) { joint = new Array(n).fill(0); for (let i = 1; i < n; i++) joint[i] = Math.max(own[i], C.propagate * joint[i - 1]); } // 아래 접촉부의 불안정이 위층으로 전달
    const K = Math.min(C.tiltWindow, n - 1);
    const uBase = n > 1 ? Math.abs(com1 - X(0)) / (C.baseTol * R) : 0;
    const uTilt = n > 1 ? Math.abs(X(n - 1) - X(n - 1 - K)) / (Math.max(K, C.tiltMin) * 1.75 * R) / C.tiltTol : 0;
    let over = 0; for (let i = 1; i < n; i++) over = Math.max(over, Math.abs(X(i) - X(0)));
    const uOver = over / (C.maxOverhang * R);
    const uMulti = stress / C.stressMax;
    // 별도 위험도를 가중 합산하면 각 항목은 안전한데도 갑자기 붕괴할 수 있다.
    // 명확한 접촉·무게중심·기울기 한계 중 하나가 넘을 때만 붕괴시키고, 누적 stress는 디버그 참고값으로만 남긴다.
    const danger = Math.max(worst, uBase, uTilt, uOver);
    return { value: n > 1 ? danger : 0, signed: n > 1 ? (com1 - X(0)) / R : 0,
             joint, own, dir, contact, com, rng, worst, worstJ, uBase, uTilt, uOver, uMulti };
  }
}

/* 흔들림 연출: 렌더링용 오프셋(ox/oy/da)만 변경. 확정 좌표(x,y)·판정에는 영향 없고, 시간이 지나도 악화되지 않음.
   불안정한 접촉부마다 탑이 그 방향으로 꺾이고(누적), 그 위층일수록 더 크게 흔들린다. 붕괴 직전에는 그 접촉부 위가 크게 휘청인다.
   lx = 진동을 뺀 '흔들림 중심'. 착지 판정/예상은 이 값을 기준으로 해서 진동 위상에 따라 결과가 달라지지 않는다. */
class SwaySystem {
  constructor() { this.reset(); }
  reset() { this.ph = 0; this.amp = []; this.lean = []; this.freq = CONFIG.sway.freqMin; this.kick = 0; this.lv = 0; this.lp = 0; }
  curve(v) { // 균형값 → 흔들림 폭 (구간별 선형 보간, 작은 불균형부터 반응)
    const c = CONFIG.sway.curve;
    for (let i = 1; i < c.length; i++) if (v <= c[i][0]) return c[i - 1][1] + (c[i][1] - c[i - 1][1]) * norm(v, c[i - 1][0], c[i][0]);
    return c[c.length - 1][1];
  }
  update(dt, stack, bal) {
    const S = CONFIG.sway, v = bal.value, R = CONFIG.orange.radius, n = stack.length, k = 1 - Math.exp(-dt * S.smooth), cv = CONFIG.balance.collapse;
    const own = bal.own || [], dir = bal.dir || [], wj = bal.worstJ || 0;
    this.freq += (S.freqMin + (S.freqMax - S.freqMin) * norm(v, 0, cv) - this.freq) * k;
    this.ph += this.freq * dt; this.kick *= Math.exp(-dt * 3);
    this.lv += (norm(v, S.lurchStart, cv) - this.lv) * k; this.lp += dt * S.lurchRate;
    const lurch = S.lurchAmp * this.lv * (0.5 + 0.5 * Math.sin(this.lp)), ld = dir[wj] || Math.sign(bal.signed) || 1;
    while (this.amp.length < n) { this.amp.push(this.amp.length ? this.amp[this.amp.length - 1] : 0); this.lean.push(this.lean.length ? this.lean[this.lean.length - 1] : 0); }
    this.amp.length = this.lean.length = n;
    let prev = 0, cum = 0, vy = stack[0].y;
    for (let i = 1; i < n; i++) {
      const q = stack[i], vi = Math.max((bal.joint && bal.joint[i]) || 0, v * S.globalShare);
      cum = clamp(cum + (dir[i] || 0) * S.bendMax * Math.pow(norm(own[i] || 0, S.leanStart, 1), S.leanPow), -S.leanCap, S.leanCap);
      this.amp[i] += (this.curve(vi) - this.amp[i]) * k;
      this.lean[i] += (cum - this.lean[i]) * k;
      q.lx = this.lean[i];
      const hf = 0.3 + 0.7 * Math.pow(Math.min(1, i / S.heightRef), 1.15); // 하단은 안정, 위로 갈수록 크게 (스택 길이와 무관하게 고정)
      const osc = Math.sin(this.ph - i * S.wave) + 0.35 * Math.sin(this.ph * 1.7 + i * 0.9 + 1.3);
      let ox = this.lean[i] + (this.amp[i] + this.kick * S.kickAmp) * hf * osc + (wj && i >= wj ? ld * lurch * hf : 0);
      if (q.b < 1) ox = q.o0 + (ox - q.o0) * q.b * q.b * (3 - 2 * q.b); // 착지 직후엔 떨어진 화면 위치에서 시작해 부드럽게 전환
      q.ox = ox; q.da = (ox - prev) / (2 * R) * S.tiltGain; prev = ox;
      const vdx = (q.x + q.ox) - (stack[i - 1].x + stack[i - 1].ox);   // 보이는 수평 차이
      vy -= Math.sqrt(Math.max(0, 4 * R * R - vdx * vdx));              // 그 차이에서 정확히 맞닿는 높이
      q.oy = vy - q.y;
    }
  }
}

/* 평소에는 물리 없이 위치만 관리. 성공한 오렌지는 확정 좌표에 고정된다 */
class OrangeManager {
  constructor() { this.reset(); }
  reset() {
    this.stack = [mkOrange(CONFIG.world.centerX, CONFIG.floorY - CONFIG.orange.radius, 0)]; // 첫 오렌지
    this.fall = null; this.cx = CONFIG.world.centerX; this.x = this.cx; this.hoverY = 0;
    this.spawnHover();
  }
  get top() { return this.stack[this.stack.length - 1]; }
  spawnHover() { // 새 오렌지가 생길 때마다 한 번만 결정: 속도 구간(확률 가중)과 배율, 점선 표시 여부(5%) — 이동 중에는 바뀌지 않음
    const h = CONFIG.hover; let r = Math.random(), tier = h.speeds[h.speeds.length - 1];
    for (const t of h.speeds) { if (r < t.p) { tier = t; break; } r -= t.p; }
    this.speedMul = tier.min + Math.random() * (tier.max - tier.min);
    this.guideOn = Math.random() < CONFIG.guide.chance; // 표시 여부는 렌더링에만 쓰이고 판정·균형 계산과 무관
    this.p = Math.random() * 2 - 1; this.pDir = Math.random() < 0.5 ? -1 : 1; this.pop = 0;
  }
  updateHover(dt, ui) { // 맨 위 오렌지 x 중심, 등속 이동 + 양 끝에서만 부드럽게 방향 전환 (멈추지 않음)
    const h = CONFIG.hover, half = ui.half(), drift = ui.drift(), cx0 = CONFIG.world.centerX;
    this.cx += (clamp(this.top.x + this.top.lx, cx0 - drift, cx0 + drift) - this.cx) * (1 - Math.exp(-dt * 6));
    const n = Math.max(1, Math.ceil(dt / 0.008)), sdt = dt / n; // 잘게 나눠 계산 → 매우 빠른 속도·프레임 저하에도 끝 감속 구간을 건너뛰지 않음
    for (let k = 0; k < n; k++) {
      const e = norm(1 - Math.abs(this.p), 0, h.easeZone), f = h.edgeMin + (1 - h.edgeMin) * e * e * (3 - 2 * e);
      this.p += this.pDir * (2 / h.crossSec) * this.speedMul * f * sdt; // 왕복 시간이 화면 크기와 무관하게 일정
      if (this.p > 1) { this.p = 2 - this.p; this.pDir = -1; } else if (this.p < -1) { this.p = -2 - this.p; this.pDir = 1; }
    }
    this.x = this.cx + this.p * half; this.pop += dt;
  }
  drop() { this.fall = Object.assign(mkOrange(this.x, this.hoverY, Math.random() * 6.283), { vy: 0, av: (Math.random() - 0.5) * 4 }); }
  stepFall(dt) { // 화면에 보이는 두 원의 접촉을 기준으로 판정한다. 렌더링 좌표와 다른 lx는 사용하지 않는다.
    const f = this.fall, R = CONFIG.orange.radius, t = this.top, tx = t.x + t.ox, ty = t.y + t.oy;
    const prevY = f.y;
    f.vy = Math.min(CONFIG.fall.maxSpeed, f.vy + CONFIG.fall.gravity * dt);
    f.y += f.vy * dt; f.a += f.av * dt;
    const dx = f.x - tx, adx = Math.abs(dx);
    const hasContact = adx < 2 * R;
    const cy = hasContact ? ty - Math.sqrt(4 * R * R - dx * dx) : ty - R;
    if (f.y < cy) return null;
    // 한 프레임 사이 접촉점을 지나쳐도 정확한 표면에 멈춘다.
    f.y = cy;
    return { hit: hasContact && adx < CONFIG.support.reach * 2 * R, dx, y: cy, prevY };
  }
}

/* 물리엔진(Matter.js)은 실패 후 붕괴 연출에서만 사용 */
class PhysicsManager {
  constructor() { this.engine = null; this.items = []; }
  clear() { this.engine = null; this.items = []; }
  startCollapse(stack, f, dir, jf = 0, keepStack = false) { // keepStack=true: 빗나간 오렌지만 떨어지고 기존 탑은 고정
    const c = CONFIG.collapse, R = CONFIG.orange.radius;
    this.engine = Engine.create({ positionIterations: 8, velocityIterations: 6 });
    this.engine.gravity.y = c.gravity; this.t = 0; this.acc = 0; this.dir = dir; this.items = [];
    Composite.add(this.engine.world, Bodies.rectangle(CONFIG.world.centerX, CONFIG.floorY + 30, 20000, 60, { isStatic: true, friction: 1 }));
    const mk = o => {
      const b = Bodies.circle(o.x, o.y, R, { friction: c.friction, restitution: c.restitution, frictionAir: c.frictionAir, density: 0.001 }, 40);
      Body.setAngle(b, o.a); Composite.add(this.engine.world, b); return b;
    };
    const n = stack.length;
    for (let i = n - 1; i >= Math.max(0, n - c.maxBodies); i--) { // 화면 밖 아래쪽은 개수 제한
      const above = jf > 0 && i >= jf, rank = n - 1 - i, b = mk(stack[i]);
      Body.setStatic(b, true); // 위치는 그대로 두고 대기
      const rel = jf ? c.shakeSec + (above ? c.blockStagger * (i - jf) : c.lowerDelay + c.lowerStagger * (jf - 1 - i))
                     : c.shakeSec + Math.min(rank * c.stagger, c.maxStagger);
      this.items.push({ o: stack[i], b, rank, rel: Math.min(rel, c.shakeSec + c.maxStagger + 0.4), kickMul: jf && !above ? c.lowerKick : 1, released: false, keepStatic: keepStack });
    }
    if (f) { // 탑에 닿지 못한 오렌지는 즉시 동적 상태로
      const b = mk(f);
      Body.setVelocity(b, { x: dir * c.failKick, y: f.vy / 60 }); Body.setAngularVelocity(b, dir * 0.08);
      this.items.push({ o: f, b, rank: -1, released: true });
    }
  }
  step(dt) {
    if (!this.engine) return;
    const c = CONFIG.collapse;
    this.t += dt; this.acc += Math.min(dt, 0.05);
    for (const it of this.items) {
      if (it.released || it.keepStatic) continue;
      if (this.t >= it.rel) { // 개별 오렌지를 동적 상태로 전환 (현재 위치 유지)
        it.released = true; it.o.ox = 0; Body.setStatic(it.b, false);
        const k = Math.min(it.rank, c.kickMaxRank), m = it.kickMul;
        Body.setVelocity(it.b, { x: this.dir * (c.kickX + c.kickPerRank * k) * m + (Math.random() - 0.5) * 0.6 * m, y: -0.3 * Math.random() * m });
        Body.setAngularVelocity(it.b, this.dir * (0.01 + Math.random() * c.spin) * m);
      } else it.o.ox = Math.sin(this.t * 75 + it.rank) * 4 * Math.min(1, this.t / 0.1); // 붕괴 직전 흔들림
    }
    while (this.acc >= 1 / 60) { Engine.update(this.engine, 1000 / 60); this.acc -= 1 / 60; }
    for (const it of this.items) if (it.released) { it.o.x = it.b.position.x; it.o.y = it.b.position.y; it.o.a = it.b.angle; }
  }
}

class CameraManager {
  constructor() { this.y = 0; }
  base(ui) { return CONFIG.floorY + CONFIG.camera.floorShowPx / ui.scale - ui.viewH; }
  reset(ui) { this.y = this.base(ui); }
  update(dt, ui, topY, speed) {
    const t = Math.min(this.base(ui), topY - CONFIG.orange.radius - ui.viewH * CONFIG.camera.towerAt);
    this.y += (t - this.y) * (1 - Math.exp(-dt * speed));
  }
}

class UIManager {
  constructor(g) {
    this.g = g;
    const $ = id => document.getElementById(id);
    this.canvas = $('canvas'); this.ctx = this.canvas.getContext('2d'); this.box = $('game');
    this.scoreEl = $('score'); this.bestEl = $('best'); this.hint = $('hint');
    this.start = $('start'); this.over = $('over'); this.startBtn = $('startBtn'); this.retryBtn = $('retryBtn');
    this.newRec = $('newRec'); this.overScore = $('overScore'); this.overBest = $('overBest'); this.soundBtn = $('sound'); this.hud = $('hud');
    addEventListener('resize', () => this.resize());
    this.resize();
  }
  resize() {
    const Z = CONFIG.size;
    this.w = innerWidth; this.h = innerHeight; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr;
    const D = Math.max(Z.minPx, Math.min(this.w * Z.widthRatio, this.h * Z.heightRatio, Z.maxPx)); // 화면에 보이는 오렌지 지름(px)
    this.scale = D / (CONFIG.orange.radius * 2);  // 그래픽 크기 = 판정 크기
    this.viewH = this.h / this.scale; this.visW = this.w / this.scale;
    this.ox = this.w / 2 - CONFIG.world.centerX * this.scale;
    const hb = this.hud && this.hud.getBoundingClientRect ? this.hud.getBoundingClientRect().bottom : 0;
    this.hudPx = Math.max(CONFIG.hover.hudPx, (hb || 0) + 8); // 상단 UI 높이(안전 영역 포함) 아래에서 오렌지가 등장
    this.buildSprite();
  }
  avail() { return this.visW / 2 - CONFIG.orange.radius - CONFIG.hover.margin; }
  half() { const H = CONFIG.hover; return Math.max(20, Math.min(H.halfDiam * 2 * CONFIG.orange.radius, H.screenFactor * this.avail())); } // 이동 반폭: 지름 기준
  drift() { return Math.max(0, this.avail() - this.half()); } // 탑 상단을 따라가되 화면 밖으로는 못 나감
  buildSprite() {
    const R = CONFIG.orange.radius * this.scale * this.dpr, S = Math.ceil(R * 2.2), c = S / 2;
    const k = document.createElement('canvas'); k.width = k.height = S;
    const x = k.getContext('2d'), P = (a, b, r) => { x.beginPath(); x.arc(a, b, r, 0, 7); };
    let g = x.createRadialGradient(c - R * .35, c - R * .4, R * .05, c, c, R * 1.02);
    g.addColorStop(0, '#ffd45e'); g.addColorStop(.45, '#ffa826'); g.addColorStop(1, '#ff7f14');
    x.fillStyle = g; P(c, c, R); x.fill();
    g = x.createRadialGradient(c + R * .2, c + R * .5, R * .1, c + R * .2, c + R * .5, R * .9);
    g.addColorStop(0, 'rgba(255,225,120,.35)'); g.addColorStop(1, 'rgba(255,225,120,0)');
    x.fillStyle = g; P(c, c, R); x.fill();
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.fillStyle = 'rgba(255,255,255,.14)';
    for (let i = 0; i < 16; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R * .85; P(c + Math.cos(a) * d, c + Math.sin(a) * d, R * .028); x.fill(); }
    x.save(); P(c, c, R); x.clip(); // 위쪽에 아주 은은한 오목한 음영만 (잎·꼭지는 그리지 않음)
    g = x.createRadialGradient(c, c - R * .8, 0, c, c - R * .8, R * .24);
    g.addColorStop(0, 'rgba(230,100,10,.26)'); g.addColorStop(1, 'rgba(230,100,10,0)');
    x.fillStyle = g; P(c, c - R * .8, R * .24); x.fill(); x.restore();
    x.strokeStyle = 'rgba(240,110,15,.4)'; x.lineWidth = Math.max(1.5, R * .03); P(c, c, R - x.lineWidth / 2); x.stroke();
    x.fillStyle = '#7a4a1e'; x.beginPath(); x.ellipse(c, c - R * .9, R * .11, R * .075, 0, 0, 7); x.fill(); // 작은 갈색 꼭지(장식, 판정과 무관)
    x.fillStyle = 'rgba(255,214,150,.55)'; x.beginPath(); x.ellipse(c - R * .03, c - R * .925, R * .045, R * .025, 0, 0, 7); x.fill();
    this.sprite = k;
  }
  drawOrange(x, y, a, sx, sy) {
    const s = this.scale, c = this.ctx, R = CONFIG.orange.radius * s, px = x * s + this.ox, py = (y - this.g.camera.y) * s + R * (1 - sy);
    if (py < -2 * R || py > this.h + 2 * R) return;
    c.fillStyle = 'rgba(200,110,20,.13)'; c.beginPath(); c.arc(px + 2 * s, py + 3 * s, R, 0, 7); c.fill();
    c.save(); c.translate(px, py); c.scale(sx, sy); c.rotate(a);
    const d = this.sprite.width / this.dpr; c.drawImage(this.sprite, -d / 2, -d / 2, d, d); c.restore();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath();
    c.ellipse(px - R * .4, py - R * .42, R * .22, R * .13, -.7, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(px - R * .12, py - R * .66, R * .05, 0, 7); c.fill();
  }
  draw() {
    const g = this.g, o = g.oranges, c = this.ctx, s = this.scale, w = this.w, h = this.h, R = CONFIG.orange.radius * s;
    const X = x => x * s + this.ox, Y = y => (y - g.camera.y) * s;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    let gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#fdebc8');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    gr = c.createRadialGradient(w * .85, h * .06, 0, w * .85, h * .06, Math.max(w, h) * .75);
    gr.addColorStop(0, 'rgba(255,224,140,.7)'); gr.addColorStop(1, 'rgba(255,224,140,0)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (const [x, y, r] of [[.15, .22, 60], [.82, .45, 42], [.3, .68, 52], [.9, .82, 70], [.55, .12, 32]]) {
      c.beginPath(); c.arc(w * x, h * y, r * Math.min(1.4, s), 0, 7); c.fill();
    }
    const fy = Y(CONFIG.floorY);
    if (fy < h) {
      gr = c.createLinearGradient(0, fy, 0, h); gr.addColorStop(0, '#f8cf86'); gr.addColorStop(1, '#f3b963');
      c.fillStyle = gr; c.fillRect(0, fy, w, h - fy + 1);
      c.fillStyle = '#ffe6b8'; c.fillRect(0, fy, w, Math.max(4, 6 * s));
      c.fillStyle = 'rgba(150,80,10,.16)'; c.beginPath(); c.ellipse(X(o.stack[0].x), fy + 4 * s, R * 1.05, 7 * s, 0, 0, 7); c.fill();
    }
    for (const q of o.stack) this.drawOrange(q.x + q.ox, q.y + q.oy, q.a + q.da + q.lda, q.sx, q.sy);
    if (o.fall) this.drawOrange(o.fall.x, o.fall.y, o.fall.a, 1, 1);
    if (DEBUG_BALANCE) this.drawDebug();
    if (g.state === 'MENU' || g.state === 'READY') {
      const py = Y(o.hoverY), ty = Y(o.top.y + o.top.oy - CONFIG.orange.radius), k = Math.min(1, .5 + o.pop * 4);
      if (o.guideOn) { // 생성 시 정해진 5%의 오렌지에만, 낙하할 때까지 계속 표시 (생성 직후 부드럽게 나타남)
        c.setLineDash([6, 8]); c.strokeStyle = this.guideColor(g.guideV, Math.min(1, o.pop / CONFIG.guide.fadeSec)); c.lineWidth = 2;
        c.beginPath(); c.moveTo(X(o.x), py + R); c.lineTo(X(o.x), ty); c.stroke(); c.setLineDash([]);
      }
      this.drawOrange(o.x, o.hoverY, 0, k, k);
    }
  }
  guideColor(v, k = 1) { // 예상 균형값 → 부드럽게 이어지는 색 (형태·굵기는 기존 점선 그대로)
    const G = CONFIG.guide, st = G.stops; v = clamp(v, 0, st[st.length - 1][0]);
    let a = st[0], b = st[st.length - 1];
    for (let i = 1; i < st.length; i++) if (v <= st[i][0]) { a = st[i - 1]; b = st[i]; break; }
    const t = b[0] === a[0] ? 0 : (v - a[0]) / (b[0] - a[0]), m = i => Math.round(a[1][i] + (b[1][i] - a[1][i]) * t);
    return 'rgba(' + m(0) + ',' + m(1) + ',' + m(2) + ',' + (G.alpha * k).toFixed(2) + ')';
  }
  setSound(on) { this.soundBtn.classList.toggle('off', !on); this.soundBtn.setAttribute('aria-pressed', String(on)); }
  drawDebug() { // 개발용: 접촉부별 지지점(●)·지지 가능 범위(선)·위쪽 무게중심(|) + 요약 정보
    const g = this.g, b = g.bal, st = g.oranges.stack, c = this.ctx, s = this.scale, R = CONFIG.orange.radius, C = CONFIG.balance;
    if (!b.contact) return;
    const X = x => x * s + this.ox, Y = y => (y - g.camera.y) * s;
    for (let j = 1; j < st.length; j++) {
      const sh = (st[j].ox + st[j - 1].ox) / 2, cy = Y((st[j].y + st[j].oy + st[j - 1].y + st[j - 1].oy) / 2), v = b.own[j], col = v >= 1 ? '#e03131' : v >= 0.7 ? '#f76707' : v >= 0.4 ? '#f59f00' : '#2f9e44';
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3;
      c.beginPath(); c.moveTo(X(b.contact[j] + sh - b.rng[j]), cy); c.lineTo(X(b.contact[j] + sh + b.rng[j]), cy); c.stroke();
      c.beginPath(); c.arc(X(b.contact[j] + sh), cy, 4, 0, 7); c.fill();
      c.beginPath(); c.moveTo(X(b.com[j] + sh), cy - 9); c.lineTo(X(b.com[j] + sh), cy + 9); c.stroke();
    }
    const v = b.value, name = v >= 1 ? '붕괴' : v >= 0.5 ? '위험' : v >= 0.15 ? '약한 불균형' : '안정', j = b.worstJ;
    const lines = ['균형 위험도 ' + v.toFixed(2) + ' [' + name + ']', '최악 접촉부: ' + j + '층' + (j ? ' (무게중심 이탈 ' + ((b.com[j] - b.contact[j]) / R).toFixed(2) + 'R / 지지범위 ±' + (b.rng[j] / R).toFixed(2) + 'R)' : ''),
      '접촉 ' + b.worst.toFixed(2) + ' | 바닥 ' + b.uBase.toFixed(2) + ' | 기울기 ' + b.uTilt.toFixed(2)];
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(8, 96, 330, 56); c.fillStyle = '#fff'; c.font = '12px monospace';
    lines.forEach((t, i) => c.fillText(t, 14, 114 + i * 16));
  }
  setScore(n) { this.scoreEl.textContent = n; }
  setBest(n) { this.bestEl.textContent = n; }
  showStart() { this.start.classList.remove('hidden'); }
  hideStart() { this.start.classList.add('hidden'); this.hint.style.opacity = .7; }
  hideOver() { this.over.classList.add('hidden'); this.hint.style.opacity = .7; }
  hideHint() { this.hint.style.opacity = 0; }
  showOver(score, best, isNew) {
    this.overScore.textContent = score; this.overBest.textContent = best;
    this.newRec.classList.toggle('hidden', !isNew);
    this.over.classList.remove('hidden');
  }
}

/* 효과음: Web Audio로 직접 합성(외부 파일 없음). 컴프레서 + 동시 음 수 제한으로 겹쳐도 커지지 않고,
   실패·차단·미지원이어도 예외를 삼켜 게임은 그대로 진행된다. */
class SoundManager {
  constructor() {
    this.ctx = null; this.master = null; this.noise = null; this.live = new Map(); this.primed = false;
    this.enabled = true; try { this.enabled = localStorage.getItem(CONFIG.sound.storageKey) !== '0'; } catch (e) {}
  }
  unlock() { // 사용자 입력 안에서 호출 → 모바일 브라우저의 오디오 잠금 해제
    try {
      if (this.ctx && this.ctx.state === 'running') return;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        const c = this.ctx = new AC(), comp = c.createDynamicsCompressor();
        comp.threshold.value = -20; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.15;
        this.master = c.createGain(); this.master.gain.value = CONFIG.sound.master; this.master.connect(comp); comp.connect(c.destination);
        const len = Math.floor(c.sampleRate * 0.4), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.primed) { const s = this.ctx.createBufferSource(); s.buffer = this.ctx.createBuffer(1, 1, 22050); s.connect(this.ctx.destination); s.start(0); this.primed = true; }
    } catch (e) {}
  }
  setEnabled(on) {
    this.enabled = on; try { localStorage.setItem(CONFIG.sound.storageKey, on ? '1' : '0'); } catch (e) {}
    if (!on) for (const n of [...this.live.keys()]) { try { n.stop(); } catch (e) {} } // 꺼지면 재생 중인 소리도 즉시 중지
    return on;
  }
  toggle() { return this.setEnabled(!this.enabled); }
  get ready() { return this.enabled && this.ctx && this.ctx.state === 'running'; }
  track(n, dur) { this.live.set(n, this.ctx.currentTime + dur + 0.3); n.onended = () => this.live.delete(n); }
  count() { const t = this.ctx.currentTime; for (const [n, end] of this.live) if (end < t) this.live.delete(n); return this.live.size; } // 끝난 음 정리(onended가 안 와도 막히지 않음)
  tone(type, f0, f1, dur, gain, delay = 0) {
    if (!this.ready || this.count() > 16) return;
    try {
      const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02); this.track(o, dur + delay);
    } catch (e) {}
  }
  burst(delay, dur, freq, gain) { // 대역 필터를 건 짧은 노이즈 = 오렌지 구르는 소리
    if (!this.ready || !this.noise || this.count() > 26) return;
    try {
      const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random() * 0.15); s.stop(t + dur + 0.02); this.track(s, dur + delay);
    } catch (e) {}
  }
  land() { this.tone('sine', 380, 220, 0.11, 0.34); this.tone('triangle', 760, 440, 0.05, 0.07); }                  // 톡!
  collapse() { // 와르르
    for (let i = 0; i < 9; i++) this.burst(i * 0.12 + Math.random() * 0.08, 0.22, 260 + Math.random() * 500, 0.2);
    this.tone('sine', 140, 60, 0.25, 0.28, 0.05); this.tone('sine', 120, 55, 0.25, 0.22, 0.5); this.tone('sine', 110, 50, 0.3, 0.18, 0.95);
  }
  gameOver() { this.tone('triangle', 392, 330, 0.18, 0.2); this.tone('triangle', 330, 247, 0.28, 0.2, 0.16); }
}

/* 상태: MENU → READY → FALLING → LANDING → READY … / (닿지 못함) FALLING → COLLAPSING / (균형 붕괴) LANDING → COLLAPSING → GAME_OVER */
class GameManager {
  constructor() {
    this.storage = new StorageManager(); this.physics = new PhysicsManager(); this.balance = new BalanceSystem(); this.sound = new SoundManager();
    this.sway = new SwaySystem(); this.oranges = new OrangeManager(); this.camera = new CameraManager(); this.ui = new UIManager(this);
    this.best = this.storage.get(); this.ui.setBest(this.best); this.ui.setSound(this.sound.enabled);
    this.state = 'MENU'; this.guard = 0; this.landT = 0; this.collapseT = 0; this.wob = 0; this.landSec = CONFIG.landing.sec; this.landSquash = CONFIG.landing.squash;
    this.bal = { value: 0, signed: 0 }; this.pending = false; this.extra = 0; this.guideV = 0;
    this.ui.setScore(1); this.camera.reset(this.ui); this.ui.showStart();
    this.bind();
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
  bind() {
    const u = this.ui;
    for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(ev, () => this.sound.unlock(), { passive: true }); // 첫 입력에서 오디오 활성화
    u.canvas.addEventListener('pointerdown', e => { e.preventDefault(); this.drop(); });
    addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) this.drop(); } });
    u.box.addEventListener('contextmenu', e => e.preventDefault());
    u.box.addEventListener('dblclick', e => e.preventDefault());
    u.startBtn.addEventListener('click', e => { e.currentTarget.blur(); this.begin(); });
    u.retryBtn.addEventListener('click', e => { e.currentTarget.blur(); this.restart(); });
    u.soundBtn.addEventListener('pointerdown', e => e.stopPropagation()); // 소리 버튼은 오렌지를 떨어뜨리지 않음
    u.soundBtn.addEventListener('click', e => {
      e.stopPropagation(); e.currentTarget.blur(); this.sound.unlock();
      const on = this.sound.toggle(); this.ui.setSound(on); if (on) this.sound.land();
    });
  }
  begin() { this.ui.hideStart(); this.state = 'READY'; this.guard = performance.now() + 250; } // 시작 버튼은 낙하 입력 아님
  restart() { // 균형값·흔들림·가이드·붕괴 상태까지 전부 초기화
    this.oranges.reset(); this.physics.clear(); this.sway.reset(); this.camera.reset(this.ui);
    this.bal = { value: 0, signed: 0 }; this.pending = false; this.extra = 0; this.wob = 0; this.guideV = 0;
    this.ui.setScore(1); this.ui.hideOver(); this.state = 'READY'; this.guard = performance.now() + 250;
  }
  drop() {
    if (this.state !== 'READY' || performance.now() < this.guard) return;
    this.state = 'FALLING'; this.oranges.drop(); this.ui.hideHint(); // 즉시 상태 전환 → 중복 생성 방지
  }
  predictBalance() { // 가이드가 등장할 때 실제로 보이는 오렌지 중심과 같은 접촉 기준 사용
    const o = this.oranges, t = o.top, R = CONFIG.orange.radius;
    const dx = o.x - (t.x + t.ox);
    if (Math.abs(dx) >= CONFIG.support.reach * 2 * R) return 1.2;
    return this.balance.evaluate(o.stack, t.x + dx, true).value;
  }
  land(r) { // r.dx는 화면에 표시된 원 중심 사이의 수평 거리
    const o = this.oranges, f = o.fall, R = CONFIG.orange.radius, t = o.top, L = CONFIG.landing, S = CONFIG.sway;
    // 화면에 보이는 접촉 상대 거리로 확정 좌표를 저장해 눈으로 본 착지와 판정을 일치시킨다.
    const dx = r.dx, qx = t.x + dx, qy = t.y - Math.sqrt(Math.max(0, 4 * R * R - dx * dx));
    const q = mkOrange(qx, qy, (dx / R) * 0.2 + (Math.random() - 0.5) * 0.2);
    q.o0 = q.ox = f.x - qx; q.oy = r.y - qy; q.b = 0;
    o.stack.push(q); o.fall = null;
    const prev = this.bal.value; this.bal = this.balance.evaluate(o.stack); const v = this.bal.value;
    this.pending = v >= CONFIG.balance.collapse; // 붕괴 기준 초과: 이 오렌지는 점수에 포함하지 않음
    // 착지 피드백: 안정=짧고 경쾌한 통통 / 약한 불안정=접촉부가 흔들렸다 안정 / 위험=탑 전체가 기울며 크게 흔들림 / 붕괴=크게 휘청
    this.sway.kick = Math.min(1, Math.max(S.kickBase + S.kickGain * Math.max(0, v - prev), norm(v, 0.4, 1)));
    this.landSec = L.sec * (1 + 0.6 * norm(v, 0.15, 1)); this.landSquash = L.squash * (1 - 0.5 * norm(v, 0.15, 0.7));
    this.wob = v < 0.1 ? 0 : L.wobble * (0.5 + norm(v, 0.1, 1));
    this.sound.land();
    if (!this.pending) this.ui.setScore(o.stack.length);
    this.landT = 0; this.state = 'LANDING';
  }
  bake() { // 렌더 오프셋을 현재 보이는 위치로 확정한 뒤 물리로 넘김 (순간이동 방지)
    for (const q of this.oranges.stack) { q.x += q.ox; q.y += q.oy; q.a += q.da + q.lda; q.ox = q.oy = q.lx = q.da = q.lda = 0; q.sx = q.sy = 1; q.b = 1; }
  }
  miss(r) { // 빗나간 오렌지만 물리적으로 굴러 떨어진다. 기존 탑은 무너지지 않음
    const o = this.oranges, f = o.fall, d = f.x - (o.top.x + o.top.ox);
    f.y = r.y; f.vy = Math.min(f.vy, 900);
    const dir = Math.abs(d) < 1 ? (Math.random() < .5 ? -1 : 1) : Math.sign(d);
    this.extra = 0; this.bake(); this.physics.startCollapse(o.stack, f, dir, 0, true);
    this.sound.collapse(); this.collapseT = 0; this.state = 'COLLAPSING';
  }
  collapseTower() { // 접촉부 문제 또는 전체 무게중심 문제 중 실제로 더 위험한 위치부터 붕괴
    const b = this.bal, st = this.oranges.stack, n = st.length;
    const global = Math.max(b.uBase, b.uTilt, b.uOver);
    const j = global > b.worst ? (b.uBase >= b.uTilt && b.uBase >= b.uOver ? 1 : n - 1) : (b.worstJ || 1);
    const dir = global > b.worst ? (Math.sign(st[n-1].x - st[Math.max(0,j-1)].x) || Math.sign(b.signed) || 1) : (b.dir[j] || Math.sign(b.signed) || 1);
    this.extra = 1; this.bake(); this.physics.startCollapse(this.oranges.stack, null, dir, j);
    this.sound.collapse(); this.collapseT = 0; this.state = 'COLLAPSING';
  }
  gameOver() {
    if (this.state !== 'COLLAPSING') return; // 중복 실행 방지
    this.state = 'GAME_OVER';
    const score = this.oranges.stack.length - this.extra, isNew = score > this.best;
    if (isNew) { this.best = score; this.storage.set(score); this.ui.setBest(score); }
    this.sound.gameOver(); this.ui.showOver(score, this.best, isNew);
  }
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    const o = this.oranges, st = this.state;
    o.hoverY = this.camera.y + this.ui.hudPx / this.ui.scale + CONFIG.orange.radius; // 항상 화면 맨 위(상단 UI 바로 아래)
    if (st === 'MENU' || st === 'READY') {
      o.updateHover(dt, this.ui);
      this.guideV += (this.predictBalance() - this.guideV) * (1 - Math.exp(-dt * CONFIG.guide.smooth)); // 가이드 색은 부드럽게 전환
    } else if (st === 'FALLING') {
      const r = o.stepFall(dt, this.balance);
      if (r) r.hit ? this.land(r) : this.miss(r);
    } else if (st === 'LANDING') { // 짧은 찌그러짐/통통 연출 (확정 좌표 변화 없음)
      this.landT += dt; const p = Math.min(1, this.landT / this.landSec), q = o.top;
      const sq = this.landSquash * Math.sin(p * Math.PI * 2) * (1 - p);
      q.sx = 1 + sq; q.sy = 1 - sq; q.lda = this.wob * Math.sin(p * 20) * (1 - p); q.b = p;
      if (p >= 1) {
        q.sx = q.sy = 1; q.lda = 0; q.b = 1;
        if (this.pending) this.collapseTower(); else { this.state = 'READY'; o.pop = 0; o.spawnHover(); }
      }
    } else { // COLLAPSING / GAME_OVER
      this.physics.step(dt);
      if (st === 'COLLAPSING') { this.collapseT += dt; if (this.collapseT >= CONFIG.collapse.durationSec) this.gameOver(); }
    }
    const live = this.state !== 'COLLAPSING' && this.state !== 'GAME_OVER';
    if (live) this.sway.update(dt, o.stack, this.bal);
    this.camera.update(dt, this.ui, o.top.y + o.top.oy, live ? CONFIG.camera.speed : CONFIG.camera.collapseSpeed);
    this.ui.draw();
    requestAnimationFrame(t2 => this.loop(t2));
  }
}

new GameManager();

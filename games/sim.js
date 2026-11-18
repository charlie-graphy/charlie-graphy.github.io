/* =====================================================================
   오렌지 껍질 까기 3D — sim.js (Three.js 에 의존하지 않는 순수 로직)
   1. 벡터 / 쿼터니언
   2. Mask      : 오렌지 표면(경위도 격자)에 '벗겨진 곳'을 기록. 렌더링과 판정이 같은 데이터를 쓴다.
   3. PeelSim   : 구면 위의 칼날(P, 진행 방향 T)이 이동하며 띠를 벗긴다. 폭 = 지난 경계까지의 실제 표면 거리.
   4. 화면 ↔ 표면 변환, 회전 보정
   5. Ribbon    : 오렌지에서 손까지 이어지고 손 너머는 늘어지는 3D 껍질 로프 (물리)
   ===================================================================== */
(function (root) {
'use strict';
const TAU = Math.PI * 2, PI = Math.PI;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------- 1. 벡터 / 쿼터니언 (배열 [x,y,z], [x,y,z,w]) ---------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const comb = (a, s, b, t) => [a[0] * s + b[0] * t, a[1] * s + b[1] * t, a[2] * s + b[2] * t];
const tangentAt = (P, v) => norm(sub(v, mul(P, dot(P, v))));                 // v 를 P 의 접평면에 투영
const rodrigues = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };
const signedAngle = (P, a, b) => Math.atan2(dot(cross(a, b), P), dot(a, b));  // P 를 바깥쪽 법선으로 볼 때 a→b (반시계 +)

const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qAxis = (ax, ang) => { const s = Math.sin(ang / 2), a = norm(ax); return [a[0] * s, a[1] * s, a[2] * s, Math.cos(ang / 2)]; };
const qConj = (q) => [-q[0], -q[1], -q[2], q[3]];
const qNorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
const qRot = (q, v) => { const u = [q[0], q[1], q[2]], t = mul(cross(u, v), 2); return add(add(v, mul(t, q[3])), cross(u, t)); };
/* 로컬 기저 (a1,a2,a3) 를 월드 기저 (b1,b2,b3) 로 보내는 회전 */
function qFromBasis(a, b) {
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m[r][c] += b[i][r] * a[i][c];
  const tr = m[0][0] + m[1][1] + m[2][2]; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s, s / 4]; }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [s / 4, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s, (m[2][1] - m[1][2]) / s]; }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[0][1] + m[1][0]) / s, s / 4, (m[1][2] + m[2][1]) / s, (m[0][2] - m[2][0]) / s]; }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, s / 4, (m[1][0] - m[0][1]) / s]; }
  return qNorm(q);
}

/* ---------- 설정 ---------- */
const CFG = {
  WSTART: 0.42,        // 경계가 없을 때 기본 폭: 처음엔 넓게 시작해서 쉽다 (R=1 기준 표면 거리 rad)
  WMAX: 0.6,          // 이전 경계를 찾는 최대 거리 = 가장 넓은 폭
  WBREAK: 0.03,        // 이 폭 이하로 가늘어지면 끊어진다
  WSOFT: 0.02, TW: 1.5, WRATE: 4,
  WTHIN: 4.5,          // 가늘어지는 속도(1/rad): 실수해도 바로 끊어지지 않고 먼저 눈에 보이게 가늘어진다 (폭 0.42 → 끊어짐까지 약 0.55rad)
  WGROW: 22,           // 바로잡았을 때 폭이 회복되는 속도(1/rad)
  ST: 0.01,            // 칼날 이동 단위 (rad)
  PROBE: 0.005, RECENT: 45,
  HSMOOTH: 0.02,       // 진행 방향 평활 길이 (rad): 손떨림이 폭에 영향을 주지 않게
  KSMOOTH: 0.05,       // 곡률 평활 길이
  KCAP: 1.3,           // 왼쪽으로 꺾는 곡률반경보다 띠가 넓을 수 없다 (폭 <= KCAP / 곡률)
  ARRIVE: 0.012,       // 지정 경로 점에 이만큼 가까워지면 도착으로 본다
  FLAP: 0.25,          // 처음 들려 있는 껍질 끝 길이
  START_LAT: 50 * PI / 180,
  CLEAR_TOTAL: 0.03,   // 남은 껍질이 표면의 3% 이하이면 클리어
  CLEAR_LEFT: 0.10,    // 남은 껍질이 15% 이하이고
  CLEAR_REACH: 0.015,  // 칼날에서 이어서 닿는 부분이 1.5% 이하이면(나머지는 고립 조각) 클리어
  CM_PER_R: 2.6,
  BACKLASH: 5, PULL_CAP: 0.9, PULL_QUEUE: 4, PULL_GAIN: 1, GRAZE: 0.28
};

/* ---------- 2. Mask: 표면에 남은 벗겨진 자국 (경위도 격자, 로컬 좌표) ---------- */
class Mask {
  constructor(W = 1024, H = 512) {
    this.W = W; this.H = H; this.data = new Uint8Array(W * H); this.stamp = new Uint32Array(W * H); this.cur = 0;
    this.cosRow = new Float32Array(H); this.total = 0;
    for (let r = 0; r < H; r++) { this.cosRow[r] = Math.cos(((r + 0.5) / H - 0.5) * PI); this.total += this.cosRow[r] * W; }
    this.peeledW = 0; this.version = 0;
  }
  clear() { this.data.fill(0); this.stamp.fill(0); this.cur = 0; this.peeledW = 0; this.version++; }
  get frac() { return this.peeledW / this.total; }
  cellOf(d) {
    const lon = Math.atan2(d[2], d[0]), lat = Math.asin(clamp(d[1], -1, 1));
    let c = Math.floor((lon / TAU + 0.5) * this.W); if (c >= this.W) c = this.W - 1; if (c < 0) c = 0;
    let r = Math.floor((lat / PI + 0.5) * this.H); if (r >= this.H) r = this.H - 1; if (r < 0) r = 0;
    return r * this.W + c;
  }
  get(d) { return this.data[this.cellOf(d)]; }
  /* 최근 RECENT 스텝 안에 직접 지난 자리가 아닌, '이전에 벗겨진 곳'인가 (자기 자신이 방금 낸 자국은 경계가 아니다) */
  old(d, recent) { const i = this.cellOf(d); return this.data[i] && this.cur - this.stamp[i] > recent; }
  /* 방향 d 주위 반지름 rad 의 원을 벗겨진 것으로 표시 (극지방에서는 경도 방향으로 넓게 칠한다) */
  paint(d, rad) {
    const W = this.W, H = this.H, lat = Math.asin(clamp(d[1], -1, 1)), lon = Math.atan2(d[2], d[0]);
    const r0 = (lat / PI + 0.5) * H, hr = Math.ceil(rad / (PI / H)) + 1, c0 = (lon / TAU + 0.5) * W;
    for (let r = Math.max(0, Math.floor(r0) - hr); r <= Math.min(H - 1, Math.floor(r0) + hr); r++) {
      const latr = ((r + 0.5) / H - 0.5) * PI, dl = latr - lat; if (Math.abs(dl) > rad) continue;
      const half = Math.sqrt(rad * rad - dl * dl), cr = this.cosRow[r], cw = cr > 1e-3 ? half / cr / (TAU / W) : W;
      const row = r * W;
      if (cw >= W / 2) { for (let c = 0; c < W; c++) { const i = row + c; if (!this.data[i]) { this.data[i] = 255; this.peeledW += cr; this.stamp[i] = this.cur; } } continue; }
      const k = Math.ceil(cw), base = Math.floor(c0);
      for (let c = base - k; c <= base + k; c++) {
        const cc = ((c % W) + W) % W;
        const i = row + cc; if (!this.data[i]) { this.data[i] = 255; this.peeledW += cr; this.stamp[i] = this.cur; }   // 이미 벗겨진 칸의 '언제 벗겼는지'는 바꾸지 않는다
      }
    }
    this.version++;
  }
}

/* ---------- 3. PeelSim : 칼날이 '플레이어가 그린 표면 경로'를 그대로 따라간다 ---------- */
const fromLatLon = (lat, lon) => [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
const moveAlong = (P, T, s) => ({ P: comb(P, Math.cos(s), T, Math.sin(s)), T: comb(P, -Math.sin(s), T, Math.cos(s)) });
const bandPoint = (P, L, s) => comb(P, Math.cos(s), L, Math.sin(s));          // P 에서 왼쪽(L)으로 s 만큼

class PeelSim {
  constructor() { this.mask = new Mask(); this.reset(); }
  reset(lat = CFG.START_LAT, lon = 0) {
    this.mask.clear();
    const P = fromLatLon(lat, lon), east = tangentAt(P, [-Math.sin(lon), 0, Math.cos(lon)]);
    this.P = P; this.T = east; this.initP = P; this.initT = east;
    this.w = CFG.WSTART; this.wFree = CFG.WSTART; this.wr = 0; this.q = 1; this.kap = 0;
    this.status = 'run'; this.reason = null; this.fail = null; this.tgtSteps = 0; this.length = 0; this.steps = 0; this.started = false;
    this.C = this.center(); this.Cprev = this.C; this.prevLine = { P, L: this.L, w: this.w };
  }
  get L() { return cross(this.P, this.T); }
  center(P = this.P, T = this.T, w = this.w) { return bandPoint(P, cross(P, T), w / 2); }
  get peelFrac() { return this.mask.frac; }
  /* 시작 때 살짝 들려 있는 껍질 끝(칼날 뒤쪽) 중심선 점들: 머리 → 꼬리. 아직 벗긴 영역은 아니다. */
  flapPoints(n = 4) {
    const out = [];
    for (let i = 0; i < n; i++) { const m = moveAlong(this.initP, this.initT, -CFG.FLAP * i / (n - 1)); out.push(this.center(m.P, m.T, CFG.WSTART)); }
    return out;
  }
  /* P 에서 왼쪽으로 가며 처음 만나는 '이전에 벗겨진 곳'까지의 거리(= 이번 띠의 폭) */
  probe(P, L) {
    for (let s = CFG.PROBE; s <= CFG.WMAX + 1e-9; s += CFG.PROBE) {
      const Q = bandPoint(P, L, s);
      if (this.mask.old(Q, CFG.RECENT)) return { s: s - CFG.PROBE / 2, E: Q };
    }
    return null;
  }
  /* 칼날을 tgt(오렌지 로컬 표면 방향) 쪽으로 ds 만큼. 경로 = 플레이어가 지정한 점들. 자동 보정 없음.
     폭 = 지나간 경계까지의 실제 거리(경로를 경계에 붙이면 좁게, 떨어지면 넓게). 급한 왼쪽 꺾임은 안쪽 가장자리가 접혀 폭이 줄어든다. */
  stepToward(tgt, ds = CFG.ST) {
    const P0 = this.P, D = tangentAt(P0, tgt);
    if (!this.started) { this.T = D; this.started = true; this.prevLine = { P: P0, L: cross(P0, D), w: this.w }; }
    const a = 1 - Math.exp(-ds / CFG.HSMOOTH), Told = this.T, T1 = tangentAt(P0, comb(Told, 1 - a, D, a));
    const kapI = signedAngle(P0, Told, T1) / ds;                                   // 왼쪽 + / 오른쪽 -
    this.kap += (kapI - this.kap) * (1 - Math.exp(-ds / CFG.KSMOOTH));
    const m = moveAlong(P0, T1, ds), L = cross(m.P, m.T);
    const self = this.mask.old(m.P, CFG.RECENT), hit = self ? { s: 0 } : this.probe(m.P, L), d = hit ? hit.s : null;
    const tw0 = d !== null ? Math.min(d, CFG.WMAX) : this.wFree;
    const wcap = this.kap > 0.05 ? CFG.KCAP / this.kap : Infinity, tw = Math.min(tw0, wcap);
    const w = Math.max(0, this.w + (tw - this.w) * (1 - Math.exp(-(tw < this.w ? CFG.WTHIN : CFG.WGROW) * ds)));
    if (d !== null && d > 0) this.wFree = clamp(d, 0.12, CFG.WMAX);                // 마지막으로 정한 폭을 기억(경계에서 멀어져도 유지)
    const wr = this.wr + ((w - this.w) / ds - this.wr) * (1 - Math.exp(-CFG.WRATE * ds));
    const tb = wr < -1e-4 ? (w - CFG.WBREAK) / -wr : Infinity;
    const qt = Math.min(clamp(tb / CFG.TW, 0, 1), clamp((w - CFG.WBREAK) / CFG.WSOFT, 0, 1));
    this.q += (qt - this.q) * (1 - Math.exp(-14 * ds * (qt < this.q ? 2 : 1)));
    this.P = m.P; this.T = m.T; this.w = w; this.wr = wr; this.C = this.center(); this.lastD = d; this.lastCap = wcap;
    this.cause = self ? 'self' : (wcap < tw0 - 0.02 ? 'turn' : (d !== null && d < w - 0.01 ? 'edge' : null));   // 지금 폭이 줄고 있는 이유
    if (w <= CFG.WBREAK) {
      this.reason = self ? 'self' : (wcap < tw0 - 0.02 ? 'turn' : 'edge');
      const rest = this.remain();   // 더 이어서 벗길 곳이 없고 남은 건 고립된 조각뿐이면 실패가 아니라 완성
      if (rest.total <= CFG.CLEAR_TOTAL || (rest.total <= CFG.CLEAR_LEFT && rest.reach <= CFG.CLEAR_REACH)) { this.status = 'clear'; return; }
      this.status = 'broken';
      this.fail = { w, P: this.P, C: this.C, reason: this.reason }; return;
    }
    const Ln = this.L, pl = this.prevLine; this.mask.cur = this.steps + 1;
    const ang = Math.acos(clamp(dot(pl.L, Ln), -1, 1)), n = clamp(Math.ceil((ang * Math.max(w, pl.w) + ds) / 0.008), 1, 14);
    for (let i = 1; i <= n; i++) {                                                  // 이전 선과 새 선 사이를 빈틈없이 칠한다
      const f = i / n, Pf = norm(comb(pl.P, 1 - f, this.P, f)), Lf = tangentAt(Pf, comb(pl.L, 1 - f, Ln, f)), wf = pl.w + (w - pl.w) * f;
      for (let t = 0; t <= wf + 1e-9; t += 0.005) this.mask.paint(bandPoint(Pf, Lf, t), 0.0055);
    }
    this.prevLine = { P: this.P, L: Ln, w };
    const dl = Math.acos(clamp(dot(this.Cprev, this.C), -1, 1)); if (!self) this.length += dl; this.Cprev = this.C; this.steps++;   // 이미 벗긴 곳을 다시 지나가는 구간은 길이로 치지 않는다
  }
  /* 플레이어가 지정한 표면 점(queue, 로컬)을 순서대로 따라간다. 큐가 비면 즉시 멈춘다. 한 번에 budget(rad) 이하만. */
  followQueue(queue, budget, onStep, canGo) {
    let used = 0, guard = 0, blocked = false;
    while (queue.length && used < budget && this.status === 'run' && guard++ < 3000) {
      if (canGo && !canGo()) { queue.length = 0; blocked = true; break; }
      const tgt = queue[0], dist = Math.acos(clamp(dot(this.P, tgt), -1, 1));
      // 도착했거나 이미 지나쳤으면 다음 점으로 (방향 평활 때문에 가까운 점 주위를 맴돌지 않게)
      if (dist < CFG.ARRIVE || (this.started && dist < 0.06 && dot(this.T, tangentAt(this.P, tgt)) < 0) || ++this.tgtSteps > 60) { queue.shift(); this.tgtSteps = 0; continue; }
      const ds = Math.min(CFG.ST, Math.max(dist, 0.004)), b = this.length; this.stepToward(tgt, ds);
      used += ds; if (onStep) onStep(this.length - b);
    }
    return { used, blocked };
  }
  /* 포인터가 구 밖으로 나갔을 때: 마지막으로 유효했던 진행 방향(곡률 없이)으로만 ds 진행 */
  straight(ds, onStep) {
    const b = this.length; this.stepToward(moveAlong(this.P, this.T, 0.2).P, ds); if (onStep) onStep(this.length - b);
  }
  /* 남은(안 벗겨진) 면적 비율과, 지금 칼날에서 이어서 닿을 수 있는 영역의 비율 (저해상도 연결 성분) */
  remain() {
    const M = this.mask, LW = 256, LH = 128, bw = M.W / LW, bh = M.H / LH, N = LW * LH, un = new Uint8Array(N), area = new Float32Array(LH);
    let all = 0, rem = 0;
    for (let r = 0; r < LH; r++) {
      area[r] = Math.cos(((r + 0.5) / LH - 0.5) * PI);
      for (let c = 0; c < LW; c++) {
        let pc = 0; for (let y = 0; y < bh; y++) { const row = (r * bh + y) * M.W + c * bw; for (let x = 0; x < bw; x++) if (M.data[row + x]) pc++; }
        const u = pc < (bw * bh) / 2 ? 1 : 0; un[r * LW + c] = u; all += area[r] * LW; if (u) rem += area[r];
      }
    }
    const lab = new Int32Array(N).fill(-1), reachSet = new Set(), compArea = [], stack = [];
    const label = (start) => {
      const id = compArea.length; let a = 0; stack.length = 0; stack.push(start); lab[start] = id;
      while (stack.length) {
        const i = stack.pop(), r = (i / LW) | 0, c = i - r * LW; a += area[r];
        const nb = [r > 0 ? i - LW : -1, r < LH - 1 ? i + LW : -1, r * LW + (c + 1) % LW, r * LW + (c + LW - 1) % LW];
        for (const j of nb) if (j >= 0 && un[j] && lab[j] < 0) { lab[j] = id; stack.push(j); }
      }
      compArea.push(a); return id;
    };
    const cellOf = (d) => { const lon = Math.atan2(d[2], d[0]), lat = Math.asin(clamp(d[1], -1, 1)); return Math.min(LH - 1, Math.floor((lat / PI + 0.5) * LH)) * LW + Math.min(LW - 1, Math.floor((lon / TAU + 0.5) * LW)); };
    const L = this.L, seeds = [];
    for (const s of [0.04, 0.08, 0.14, 0.22]) { seeds.push(bandPoint(this.P, L, s)); const m = moveAlong(this.P, this.T, s); seeds.push(m.P); seeds.push(bandPoint(m.P, cross(m.P, m.T), s)); }
    for (const d of seeds) { const i = cellOf(d); if (un[i]) { if (lab[i] < 0) label(i); reachSet.add(lab[i]); } }
    let reach = 0; for (const id of reachSet) reach += compArea[id];
    return { total: rem / all * LW, reach: reach / all * LW };
  }
  /* 클리어 판정: ① 남은 껍질이 CLEAR_TOTAL 이하 ② 남은 것이 CLEAR_LEFT 이하이고 칼날에서 이어 닿는 부분이 CLEAR_REACH 이하(= 고립된 작은 조각들) */
  clearCheck() {
    const r = this.remain();
    if (r.total <= CFG.CLEAR_TOTAL || (r.total <= CFG.CLEAR_LEFT && r.reach <= CFG.CLEAR_REACH)) { this.status = 'clear'; }
    return r;
  }
}

/* ---------- 4. 화면 ↔ 표면 ---------- */
/* 시작 자세: 칼날 위치가 화면 앞쪽 위에 오게 */
function initialQuat(sim) {
  const Pl = sim.initP, Tl = sim.initT, Ll = cross(Pl, Tl), Pw = norm([0.08, 0.12, 0.98]), Tw = tangentAt(Pw, [1, 0, 0]);
  return qFromBasis([Pl, Tl, Ll], [Pw, Tw, cross(Pw, Tw)]);
}

/* ---------- 5. Ribbon: 3D 껍질 로프 ---------- */
const STEP_H = 1 / 60;
class Ribbon {
  constructor() { this.reset(); }
  reset() {
    this.nodes = []; this.acc = 0; this.attached = false; this.count = 0; this.clock = 0; this.pile = [];
    this.grabbed = false; this.gi = -1; this.grip = [0, 0, 0];
    this.fx = 0; this.fy = 0; this.tx = 0; this.ty = 0; this.ox = 0; this.oy = 0; this.ox1 = 0; this.oy1 = 0;   // 화면 좌표(px)
    this.rho = 0; this.peak = 0; this.trough = 0; this.dirOut = true; this.pending = 0; this.tension = 0; this.grabT = 0;
    this.gx0 = [0, 0, 0]; this.jit = 0; this.bx = this.bx || 6; this.side = 0; this.floorY = -3; this.pileC = [0, -3, 0.5];
  }
  get sp() { return 0.085; }
  get maxN() { return 110; }
  mk(p, w, q, cl) { return { x: p[0], y: p[1], z: p[2], px: p[0], py: p[1], pz: p[2], w, q, cl: cl || null, tw: this.count++ }; }
  /* pts: 머리(칼날)에서 꼬리 순서의 월드 좌표. 꼬리는 살짝 들려 있다. */
  begin(pts, w) {
    this.reset();
    this.attached = true;
    for (let i = pts.length - 1; i >= 0; i--) this.nodes.push(this.mk(pts[i], w, 1));
  }
  detach() { this.attached = false; this.release(); }
  tip() { return this.nodes.length ? this.nodes[0] : null; }
  setFloor(y, c) { this.floorY = y; this.pileC = c; }
  /* project(p) → {x,y}(px) 로 화면에 투영한 손끝 근처의 껍질 노드를 잡는다. 잡는 순간 껍질은 움직이지 않는다. */
  /* 보이는 껍질 메시를 레이캐스트해 정한 노드를 잡는다. 잡는 순간 껍질은 움직이지 않는다(grip = 그 노드의 현재 위치). */
  grabNode(best, sx, sy, touch, project) {
    if (!this.attached || best < 0 || best >= this.nodes.length - 1) return false;
    const p = this.nodes[best], s = project([p.x, p.y, p.z]);
    this.grabbed = true; this.gi = best; this.grabT = 0;
    this.fx = sx; this.fy = sy; this.tx = s.x; this.ty = s.y;
    this.ox = s.x - sx; this.oy = s.y - sy; this.ox1 = touch ? -10 : this.ox; this.oy1 = touch ? -34 : this.oy;   // 터치: 손가락이 분리 지점을 가리지 않도록 잡은 지점을 위쪽에 둔다
    this.grip = [p.x, p.y, p.z]; this.gx0 = [p.x, p.y, p.z];
    this.rho = 0; this.peak = 0; this.trough = 0; this.dirOut = true; this.pending = 0;
    return true;
  }
  /* 표면 ↔ 바깥 전환 때: 당김 누적의 기준을 현재 손가락 위치로 새로 잡는다 (갑자기 진행하지 않게) */
  rebase(x, y) { this.fx = x; this.fy = y; this.rho = 0; this.peak = 0; this.trough = 0; this.dirOut = true; this.pending = 0; }
  /* 손가락이 움직일 때마다 (모든 입력 샘플). 칼날에서 멀어진 만큼만 진행량에 더한다. 되돌림·떨림은 인정하지 않는다. */
  moveFinger(x, y, ksx, ksy, scale) {
    if (!this.grabbed) return;
    const dx = x - this.fx, dy = y - this.fy; this.fx = x; this.fy = y;
    let ux = x - ksx, uy = y - ksy, d = Math.hypot(ux, uy);
    if (d < 14) { ux = this.lu || 1; uy = this.lv || 0; d = 1; } else { this.lu = ux / d; this.lv = uy / d; }
    this.rho += (dx * ux + dy * uy) / d;
    const B = CFG.BACKLASH;
    if (this.dirOut) {
      if (this.rho > this.peak) { this.pending += this.rho - this.peak; this.peak = this.rho; }
      else if (this.rho < this.peak - B) { this.dirOut = false; this.trough = this.rho; }
    } else if (this.rho < this.trough) this.trough = this.rho;
    else if (this.rho > this.trough + B) { this.dirOut = true; this.pending += this.rho - this.trough; this.peak = this.rho; }
    this.pending = Math.min(this.pending, CFG.PULL_QUEUE * scale);
  }
  release() {
    if (!this.grabbed) return;
    this.grabbed = false; this.gi = -1; this.pending = 0;
    for (const p of this.nodes) { p.px = p.x; p.py = p.y; p.pz = p.z; }
  }
  /* 눈에 보이는 잡은 위치(화면)가 손가락을 빠르게 따라온다 */
  easeGrip(dt) {
    if (!this.grabbed) return;
    const k = 1 - Math.exp(-7 * dt);
    this.ox += (this.ox1 - this.ox) * k; this.oy += (this.oy1 - this.oy) * k;
    const f = 1 - Math.exp(-60 * dt), gx = this.fx + this.ox, gy = this.fy + this.oy;
    this.tx += (gx - this.tx) * f; this.ty += (gy - this.ty) * f;
  }
  setGrip(Gw) { this.grip = Gw; }
  /* 손과 칼날 사이에 놓일 껍질 길이를 손 위치에 맞춘다. 남는 껍질은 손 안에서 미끄러져 아래로 늘어진다. */
  fitGrip(Kw, dt) {
    if (!this.grabbed) return;
    const n = this.nodes.length, sp = this.sp; if (n < 2) return;
    const chord = len(sub(this.grip, Kw)), want = clamp(Math.round((chord * 1.06 - this.acc) / sp), 1, n - 1);
    let m = n - 1 - this.gi; const maxStep = Math.max(2, Math.ceil(44 * dt / sp));
    m = clamp(m + clamp(want - m, -maxStep, maxStep), 1, n - 1); this.gi = n - 1 - m;
  }
  feed(units, w, q, Kw, cl) {
    if (!this.attached || !this.nodes.length) return;
    const sp = this.sp; this.acc += units;
    const head = this.nodes[this.nodes.length - 1]; head.w = w; head.q = q;
    while (this.acc >= sp) {
      this.acc -= sp; this.nodes.push(this.mk(Kw, w, q, cl));
      while (this.nodes.length > this.maxN) {
        const o = this.nodes.shift(); this.pile.push(o.w); if (this.pile.length > 1500) this.pile.shift();
        if (this.grabbed && --this.gi < 0) this.release();
      }
    }
  }
  update(dt, Kw, nW, trail, pullRate) {
    this.clock += dt; this.jit = pullRate || 0; let n = 0;
    while (this.clock >= STEP_H && n++ < 6) { this.clock -= STEP_H; this.phys(Kw, nW, trail); }
    if (n >= 6) this.clock = 0;
  }
  phys(Kw, nW, trail) {
    const nodes = this.nodes, n = nodes.length; if (!n) return;
    const sp = this.sp, g = 18 * STEP_H * STEP_H, maxN = this.maxN, fl = this.floorY, pc = this.pileC, attached = this.attached;
    const held = this.grabbed && attached, gi = held ? this.gi : -1;
    if (held) this.grabT += STEP_H;
    for (let i = 0; i < n; i++) {
      const p = nodes[i], age = n - 1 - i;
      if (attached && age === 0) { p.x = Kw[0]; p.y = Kw[1]; p.z = Kw[2]; p.px = p.x; p.py = p.y; p.pz = p.z; continue; }
      if (held && i > gi) continue;
      if (held && i === gi) { p.x = this.grip[0]; p.y = this.grip[1]; p.z = this.grip[2]; p.px = p.x; p.py = p.y; p.pz = p.z; continue; }
      const vx = (p.x - p.px) * 0.99, vy = (p.y - p.py) * 0.99, vz = (p.z - p.pz) * 0.99;
      p.px = p.x; p.py = p.y; p.pz = p.z; p.x += vx; p.y += vy - g; p.z += vz;
      if (this.side && p.z > 0.2 && Math.hypot(p.x, p.y) < 1.15) p.x += this.side * 0.0035;   // 늘어진 껍질이 오렌지 앞면을 덮지 않고 손 쪽으로 비껴 늘어진다
      const anc = (attached && !held && p.cl && age < 16 && this.anchor) ? this.anchor(p) : null;
      if (anc) {                                          // 지나온 실제 경로 위에서 서서히 들려 올라간다 (표면 제거 경로와 메시가 일치)
        const al = Math.hypot(anc[0], anc[1], anc[2]) || 1, wg = 0.4 * (1 - age / 16), lf = 0.012 + 0.11 * (age / 15) * (age / 15);
        p.x += (anc[0] + anc[0] / al * lf - p.x) * wg; p.y += (anc[1] + anc[1] / al * lf - p.y) * wg; p.z += (anc[2] + anc[2] / al * lf - p.z) * wg;
      } else if (attached && !held && age < 7) {                  // 놓은 뒤에도 껍질 끝은 오렌지에서 살짝 들려 있어 다시 잡기 쉽다
        const wgt = 0.2 * (1 - age / 7), lift = 0.02 + 0.07 * (age / 6) * (age / 6);
        p.x += (Kw[0] + trail[0] * age * sp + nW[0] * lift - p.x) * wgt; p.y += (Kw[1] + trail[1] * age * sp + nW[1] * lift - p.y) * wgt; p.z += (Kw[2] + trail[2] * age * sp + nW[2] * lift - p.z) * wgt;
      }
      if (p.y <= fl + 0.01) { p.x += (pc[0] - p.x) * 0.05; p.z += (pc[2] - p.z) * 0.05; }   // 바닥에 닿은 껍질은 가운데로 모여 말린다
      const tail = maxN * 0.6;
      if (age > tail) { const k = 0.015 + 0.12 * ((age - tail) / (maxN * 0.4)); p.x += (pc[0] - p.x) * k; p.z += (pc[2] - p.z) * k; p.y += (fl + 0.03 - p.y) * k; }
    }
    if (held) {                                            // 머리(칼날) ~ 손: 팽팽한 곡선. 세게 당길수록 곧게, 느슨하면 표면에서 살짝 들려 휜다.
      const m = n - 1 - gi, G = this.grip, d = len(sub(G, Kw)), lift = d * (0.05 + 0.17 * (1 - this.tension));
      const C = [(Kw[0] + G[0]) / 2 + nW[0] * lift, (Kw[1] + G[1]) / 2 + nW[1] * lift, (Kw[2] + G[2]) / 2 + nW[2] * lift];
      const mv = len(sub(G, this.gx0)), bl = 0.06 + 0.94 * smooth(Math.max(this.grabT / 0.35, mv / 0.12));
      for (let i = gi + 1; i < n - 1; i++) {
        const t = (n - 1 - i) / m, u = 1 - t, p = nodes[i];
        p.x += (u * u * Kw[0] + 2 * u * t * C[0] + t * t * G[0] - p.x) * bl; p.y += (u * u * Kw[1] + 2 * u * t * C[1] + t * t * G[1] - p.y) * bl; p.z += (u * u * Kw[2] + 2 * u * t * C[2] + t * t * G[2] - p.z) * bl;
        p.px = p.x; p.py = p.y; p.pz = p.z;
      }
    }
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < n - 1; i++) {
        if (held && i >= gi) continue;
        const a = nodes[i], b = nodes[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-5, diff = (d - sp) / d;
        const bPinned = (attached && i + 1 === n - 1) || (held && i + 1 === gi);
        if (bPinned) { a.x += dx * diff; a.y += dy * diff; a.z += dz * diff; }
        else { const h = 0.5 * diff; a.x += dx * h; a.y += dy * h; a.z += dz * h; b.x -= dx * h; b.y -= dy * h; b.z -= dz * h; }
      }
    }
    for (let i = 0; i < n; i++) {
      const p = nodes[i], age = n - 1 - i;
      if (!(held && i >= gi) && !(attached && age < 8)) {      // 오렌지 몸통을 뚫지 않게 (칼날 근처 껍질은 표면 위에 얹혀 있을 수 있다)
        const d = Math.hypot(p.x, p.y, p.z), rr = 1.04 + p.w * 0.12;
        if (d < rr && d > 0.01) { const k = rr / d; p.x *= k; p.y *= k; p.z *= k; }
      }
      if (p.y < fl) { p.y = fl; p.py = p.y; p.px = p.x - (p.x - p.px) * 0.5; p.pz = p.z - (p.z - p.pz) * 0.5; }
      p.x = clamp(p.x, -this.bx, this.bx); p.z = clamp(p.z, -3, 3); p.y = clamp(p.y, fl - 0.1, 8);
      if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)) { p.x = p.px = Kw[0]; p.y = p.py = Kw[1]; p.z = p.pz = Kw[2]; }
    }
  }
}

const API = { CFG, Mask, PeelSim, Ribbon, TAU, PI, clamp, lerp, smooth, add, sub, mul, dot, cross, len, norm, comb, tangentAt, rodrigues, signedAngle,
  qMul, qAxis, qConj, qNorm, qRot, qFromBasis, initialQuat, bandPoint, fromLatLon, moveAlong };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.OrangeSim = API;
})(typeof window !== 'undefined' ? window : globalThis);

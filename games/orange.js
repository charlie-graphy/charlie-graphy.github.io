/* =====================================================================
   오렌지 껍질 까기 3D — script.js  (Three.js r149 전역 THREE + sim.js 전역 OrangeSim)
   - 오렌지 구체 / 속껍질 구체 : 같은 '벗김 마스크'(sim.Mask)를 텍스처로 읽어 셰이더에서 제거 영역 표현
   - 껍질 : Ribbon(월드 좌표 노드) → 두께·앞뒤색·가장자리 불규칙이 있는 StripMesh (버퍼 재사용)
   - 입력 : 빈 곳 드래그 = 레이캐스트 기반 표면 회전(관성) / 껍질 잡기 = 당겨서 벗기기
   ===================================================================== */
(() => {
'use strict';
const S = OrangeSim, CFG = S.CFG;
const { qMul, qAxis, qRot, qNorm, cross, dot, norm, mul, add, sub, len, clamp, initialQuat } = S;
const $ = (id) => document.getElementById(id);
const app = $('app'), canvas = $('game');

/* ---------- 저장 / 사운드 ---------- */
try { localStorage.removeItem('orangePeel3dBest'); } catch (e) {}   // 삭제된 '최고 기록' 기능이 남긴 저장값 정리
const store = { snd() { try { return localStorage.getItem('orangePeel3dSnd') !== '0'; } catch (e) { return true; } },
                setSnd(v) { try { localStorage.setItem('orangePeel3dSnd', v ? '1' : '0'); } catch (e) {} } };
/* 사운드: Web Audio 합성만 사용 (외부 음원 없음 → 라이선스/경로 문제 없음).
   껍질 소리는 '실제로 벗겨진 길이'가 쌓일 때만 짧은 알갱이(rustle)로 난다: 멈추면 즉시 무음, 빠를수록 촘촘하고 조금 커진다. */
const Snd = {
  ctx: null, on: store.snd(), lastR: 0,
  init() {
    if (this.ctx) { this.wake(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(), n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;                                   // 분홍 잡음(부드러운 결): 거친 고주파를 줄인다
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.0555; b1 = 0.985 * b1 + w * 0.0750; b2 = 0.950 * b2 + w * 0.1538; d[i] = b0 + b1 + b2 + w * 0.18; }
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); for (let i = 0; i < n; i++) d[i] /= pk;     // 잡음을 최대치 1로 정규화(필터를 거치며 너무 작아지지 않게)
    this.buf = buf; this.out = c.createGain(); this.out.gain.value = 1;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.12;   // 겹쳐도 깨지지 않게 부드럽게 눌러 준다
    this.out.connect(comp); comp.connect(c.destination);
    const u = c.createBufferSource(); u.buffer = c.createBuffer(1, 1, c.sampleRate); u.connect(c.destination); u.start(0);      // 모바일 브라우저 오디오 잠금 해제용 무음
    this.wake();
  },
  wake() { const c = this.ctx; if (c && c.state !== 'running') { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } },
  noise(t, dur, freq, q, vol, lp) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const l = c.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp || 5200;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(l); l.connect(g); g.connect(this.out); s.start(t, Math.random() * 1.5, dur + 0.02);
  },
  /* speed: 지금 벗겨지는 속도(R/s). 한 번 호출 = 알갱이 하나 */
  rustle(speed) {
    if (!this.ctx || !this.on) return; if (this.ctx.state !== 'running') this.wake(); const t = this.ctx.currentTime; if (t - this.lastR < 0.022) return; this.lastR = t;
    const k = clamp(speed / 3, 0, 1), r = () => Math.random(), V = 2.2;   // V: 껍질 소리 음량 보정(잡기·끊어짐·성공음과 비슷한 체감 크기로 맞춘 값)
    // 사각사각: 중고역 대역 잡음 알갱이(Q 낮게=넓은 대역, 로우패스 6.5k로 날카로움 제거). 빠를수록 조금 크고 밝게
    this.noise(t, 0.035 + r() * 0.05, 1700 + r() * 1500 + k * 700, 0.5 + r() * 0.4, V * (0.34 + 0.2 * k) * (0.6 + r() * 0.4), 6500);
    this.noise(t, 0.05 + r() * 0.04, 650 + r() * 350, 0.6, V * 0.16 * (0.6 + r() * 0.4), 2200);               // 촉촉한 낮은 결
    if (r() < 0.2) this.noise(t + 0.012, 0.014, 3000 + r() * 800, 1.0, V * (0.14 + 0.08 * k), 5200);      // 가끔 나는 섬유 '톡'
  },
  tone(f, t0, dur, vol, type, f1) {
    if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
  },
  grab() { if (!this.ctx || !this.on) return; this.tone(250, 0, 0.09, 0.13, 'sine', 165); this.noise(this.ctx.currentTime, 0.05, 1100, 0.7, 0.3, 3000); },
  snap() { if (!this.ctx || !this.on) return; this.noise(this.ctx.currentTime, 0.14, 1800, 0.6, 0.38, 4200); this.tone(330, 0.02, 0.16, 0.11, 'triangle', 262); this.tone(262, 0.17, 0.22, 0.1, 'triangle', 196); },
  win() { [523, 659, 784].forEach((f, i) => this.tone(f, i * 0.11, 0.4, 0.1, 'triangle')); this.tone(1047, 0.36, 0.5, 0.075, 'sine'); }
};

/* ---------- Three.js 장면 ---------- */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('nogl').style.display = 'block'; $('go').disabled = true; return; }
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
const CAMY = -0.25, FOV_T = Math.tan(16 * Math.PI / 180);
const LIGHT = new THREE.Vector3(0.45, 0.8, 0.6).normalize();

const NOISE = `
float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;
const BUMP = `
vec3 bumpN(vec3 N, vec3 vp, float h, float k){
  vec3 sx=dFdx(vp), sy=dFdy(vp), r1=cross(sy,N), r2=cross(N,sx); float det=dot(sx,r1);
  vec3 g=sign(det)*(dFdx(h)*r1+dFdy(h)*r2); return normalize(abs(det)*N-k*g); }
`;
const matCommon = { extensions: { derivatives: true } };

const maskTex = new THREE.DataTexture(null, 1, 1);   // reset()에서 sim.mask 데이터로 교체
const orangeVS = `
uniform float uR; uniform float uBump; varying vec3 vLocal; varying vec3 vVP; varying vec3 vN;
${NOISE}
void main(){ vec3 d=normalize(position); float n=vnoise(d*7.0)*0.6+vnoise(d*19.0)*0.4;
  vec3 p=d*(uR+(n-0.5)*uBump); vLocal=d; vec4 mv=modelViewMatrix*vec4(p,1.0); vVP=mv.xyz;
  vN=normalize(normalMatrix*d); gl_Position=projectionMatrix*mv; }`;
const orangeFS = `
uniform sampler2D uMask; uniform vec3 uLight; uniform float uMode; varying vec3 vLocal; varying vec3 vVP; varying vec3 vN;
${NOISE}${BUMP}
void main(){
  vec3 d=normalize(vLocal);
  vec2 uv=vec2(atan(d.z,d.x)/6.2831853+0.5, asin(clamp(d.y,-1.,1.))/3.14159265+0.5);
  float m=texture2D(uMask,uv).r;
  vec3 N=normalize(vN); vec3 col;
  if(uMode<0.5){
    if(m>0.62) discard;
    float pores=vnoise(d*90.)*0.5+vnoise(d*190.)*0.3+vnoise(d*38.)*0.2;
    N=bumpN(N,vVP,pores,0.0016);
    vec3 base=mix(vec3(1.0,0.62,0.13),vec3(0.97,0.46,0.06),vnoise(d*4.0));
    base=mix(base,vec3(1.0,0.74,0.22),smoothstep(0.55,0.9,vnoise(d*12.0))*0.35);
    base*=1.0-0.16*smoothstep(0.62,0.92,pores);
    float rim=smoothstep(0.05,0.55,m);                       // 잘린 단면: 얇은 크림색 띠
    col=mix(base,vec3(1.0,0.92,0.72),rim);
  } else {
    float fib=vnoise(d*vec3(46.,46.,46.))*0.5+vnoise(d*110.)*0.5;
    N=bumpN(N,vVP,fib,0.0012);
    col=mix(vec3(1.0,0.97,0.88),vec3(0.98,0.87,0.64),smoothstep(0.35,0.8,vnoise(d*15.))*0.55);
    col*=0.93+0.07*fib;
    col*=0.86+0.14*smoothstep(0.62,1.0,m);                   // 단면 바로 아래는 살짝 어둡게
  }
  float df=dot(N,uLight)*0.5+0.5; float sh=mix(0.52,1.08,pow(df,1.3));
  vec3 H=normalize(uLight-normalize(vVP)); float sp=pow(max(dot(N,H),0.),22.)*0.035;
  float rimL=pow(1.0-max(dot(N,-normalize(vVP)),0.),3.)*0.07;
  gl_FragColor=vec4(col*sh+sp+rimL*vec3(1.,.8,.5),1.0);
}`;
function mkOrangeMat(mode, R, bump) {
  return new THREE.ShaderMaterial({ ...matCommon, vertexShader: orangeVS, fragmentShader: orangeFS,
    uniforms: { uMask: { value: maskTex }, uLight: { value: LIGHT.clone() }, uMode: { value: mode }, uR: { value: R }, uBump: { value: bump } } });
}
const og = new THREE.Group(); og.matrixAutoUpdate = true; scene.add(og);
const peelMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mkOrangeMat(0, 1.036, 0.016));
const pithMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mkOrangeMat(1, 1.0, 0.006));
og.add(pithMesh); og.add(peelMesh);
/* 초록 꼭지 (오렌지 로컬 +Y) */
const stemMat = new THREE.MeshLambertMaterial({ color: 0x4caf3a });
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.1, 14), stemMat);
stem.position.set(0.0, 1.03, 0); stem.rotation.z = 0.12; og.add(stem);
const stemTop = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), stemMat); stemTop.position.set(-0.006, 1.085, 0); og.add(stemTop);
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.copy(LIGHT); scene.add(dl);

/* 바닥 그림자 */
function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(120,70,20,.38)'); gr.addColorStop(1, 'rgba(120,70,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

/* 처음 한 번만: 어디로 문지르면 되는지 오렌지 표면에 점선으로 보여 준다 (조금 벗기면 사라진다) */
const guide = new THREE.Group(), gMat = new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.95 });
for (let i = 0; i < 9; i++) guide.add(new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), gMat));
scene.add(guide);

/* ---------- 껍질 메시 (버퍼 재사용) ---------- */
const K = 7, V = 2 * K + 4, TH = 0.03, RC = 1.1;
const stripVS = `
attribute float kind; attribute vec2 puv; varying vec3 vN; varying vec3 vVP; varying float vKind; varying vec2 vUv;
void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vVP=mv.xyz; vN=normalize(normalMatrix*normal); vKind=kind; vUv=puv; gl_Position=projectionMatrix*mv; }`;
const stripFS = `
uniform vec3 uLight; uniform float uHint; uniform float uFlash; varying vec3 vN; varying vec3 vVP; varying float vKind; varying vec2 vUv;
${NOISE}${BUMP}
void main(){
  vec3 N=normalize(vN); if(dot(N,-normalize(vVP))<0.) N=-N; vec3 col;
  if(vKind<0.5){
    float pores=vnoise(vec3(vUv.x*14.,vUv.y*7.,1.))*0.6+vnoise(vec3(vUv.x*34.,vUv.y*17.,3.))*0.4;
    N=bumpN(N,vVP,pores,0.0015);
    col=mix(vec3(1.0,0.60,0.12),vec3(0.96,0.45,0.06),vnoise(vec3(vUv.x*1.5,vUv.y*2.,5.)));
    col*=1.0-0.15*smoothstep(0.6,0.9,pores);
    col*=0.88+0.12*smoothstep(0.0,0.2,min(vUv.y,1.-vUv.y));
  } else if(vKind<1.5){
    float fib=vnoise(vec3(vUv.x*30.,vUv.y*4.,7.));
    col=mix(vec3(1.0,0.97,0.88),vec3(0.97,0.88,0.68),fib*0.6);
  } else col=vec3(1.0,0.90,0.66);
  float df=dot(N,uLight)*0.5+0.5; float sh=mix(0.55,1.08,pow(df,1.3));
  vec3 outc=col*sh; outc=mix(outc,vec3(1.0,0.95,0.6),clamp(uHint*0.42+uFlash*0.55,0.,0.8));
  gl_FragColor=vec4(outc,1.0);
}`;
const stripMat = new THREE.ShaderMaterial({ ...matCommon, vertexShader: stripVS, fragmentShader: stripFS, side: THREE.DoubleSide, uniforms: { uLight: { value: LIGHT.clone() }, uHint: { value: 0 }, uFlash: { value: 0 } } });
class StripMesh {
  constructor(maxN) {
    this.maxN = maxN; const nv = maxN * V;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3); this.kind = new Float32Array(nv); this.puv = new Float32Array(nv * 2);
    const idx = new Uint16Array((maxN - 1) * (4 * (K - 1) + 4) * 3); let o = 0;
    const quad = (a, b, c, d) => { idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = c; idx[o++] = b; idx[o++] = d; };
    for (let i = 0; i < maxN - 1; i++) {
      const a = i * V, b = (i + 1) * V;
      for (let j = 0; j < K - 1; j++) { quad(a + j, b + j, a + j + 1, b + j + 1); quad(a + K + j, b + K + j, a + K + j + 1, b + K + j + 1); }
      quad(a + 2 * K, b + 2 * K, a + 2 * K + 1, b + 2 * K + 1); quad(a + 2 * K + 2, b + 2 * K + 2, a + 2 * K + 3, b + 2 * K + 3);
    }
    for (let i = 0; i < maxN; i++) for (let v = 0; v < V; v++) this.kind[i * V + v] = v < K ? 0 : v < 2 * K ? 1 : 2;
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('kind', new THREE.BufferAttribute(this.kind, 1));
    g.setAttribute('puv', new THREE.BufferAttribute(this.puv, 2).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); this.idxPer = (4 * (K - 1) + 4) * 3;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80); this.mesh = new THREE.Mesh(g, stripMat); this.mesh.frustumCulled = false; this.mesh.visible = false; scene.add(this.mesh);
    this.P = []; for (let i = 0; i < maxN; i++) this.P.push([0, 0, 0]);
  }
  /* nodes: [{x,y,z,w,tw}] 꼬리 → 머리. nHead: 머리에서의 바깥 법선(월드). shake: 떨림 크기 */
  update(nodes, nHead, shake, time, curlBase) {
    const n = Math.min(nodes.length, this.maxN);
    if (n < 2) { this.mesh.visible = false; return; }
    this.mesh.visible = true; const P = this.P;
    for (let i = 0; i < n; i++) { const p = nodes[i]; P[i][0] = p.x; P[i][1] = p.y; P[i][2] = p.z; }
    let nx = nHead[0], ny = nHead[1], nz = nHead[2];
    for (let i = n - 1; i >= 0; i--) {
      const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, n - 1)], age = n - 1 - i, nd = nodes[i];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2], tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const dn = nx * tx + ny * ty + nz * tz; nx -= tx * dn; ny -= ty * dn; nz -= tz * dn;
      let nl = Math.hypot(nx, ny, nz); if (nl < 1e-4) { nx = 0; ny = 1; nz = 0; nl = 1; } nx /= nl; ny /= nl; nz /= nl;
      /* 비틀림: 머리에서 멀어질수록 서서히 */
      const amp = 1.25 * S.smooth((age - 5) / 14), ph = amp * Math.sin(nd.tw * 0.19 + 0.8) + 0.4 * amp * Math.sin(nd.tw * 0.53);
      const cs = Math.cos(ph), sn = Math.sin(ph);
      let sx = ty * nz - tz * ny, sy = tz * nx - tx * nz, sz = tx * ny - ty * nx;         // t × n
      const rnx = nx * cs + sx * sn, rny = ny * cs + sy * sn, rnz = nz * cs + sz * sn;
      const rsx = sx * cs - nx * sn, rsy = sy * cs - ny * sn, rsz = sz * cs - nz * sn;
      const eL = 0.09 * Math.sin(nd.tw * 0.9 + 1.3) + 0.05 * Math.sin(nd.tw * 2.3 + 0.4), eR = 0.09 * Math.sin(nd.tw * 0.7 + 4.1) + 0.05 * Math.sin(nd.tw * 2.9 + 2.2);
      const base = nd.w * 0.5;
      let px = P[i][0], py = P[i][1], pz = P[i][2];
      if (age < 12 && shake > 0) { const f = shake * (1 - age / 12), t = time * 63 + age * 1.7; px += rsx * Math.sin(t) * f; py += rsy * Math.sin(t) * f; pz += rsz * Math.sin(t) * f; px += rnx * Math.cos(t * 1.3) * f; py += rny * Math.cos(t * 1.3) * f; pz += rnz * Math.cos(t * 1.3) * f; }
      const o = i * V;
      for (let j = 0; j < K; j++) {
        const u = -1 + 2 * j / (K - 1), hw = Math.max(base * (1 + (u < 0 ? eL : eR)), 0.004), x = u * hw, cv = -x * x * 0.5 / RC;
        const cx = px + rsx * x + rnx * cv, cy = py + rsy * x + rny * cv, cz = pz + rsz * x + rnz * cv;
        let ox = rnx - rsx * x / RC, oy = rny - rsy * x / RC, oz = rnz - rsz * x / RC; const ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
        this.set(o + j, cx + ox * TH * 0.5, cy + oy * TH * 0.5, cz + oz * TH * 0.5, ox, oy, oz, nd.tw * CFG_SP, u * 0.5 + 0.5);
        this.set(o + K + j, cx - ox * TH * 0.5, cy - oy * TH * 0.5, cz - oz * TH * 0.5, -ox, -oy, -oz, nd.tw * CFG_SP, u * 0.5 + 0.5);
        if (j === 0 || j === K - 1) {
          const w = j === 0 ? 0 : 2, sg = j === 0 ? -1 : 1;
          this.set(o + 2 * K + w, cx + ox * TH * 0.5, cy + oy * TH * 0.5, cz + oz * TH * 0.5, rsx * sg, rsy * sg, rsz * sg, nd.tw * CFG_SP, u * 0.5 + 0.5);
          this.set(o + 2 * K + w + 1, cx - ox * TH * 0.5, cy - oy * TH * 0.5, cz - oz * TH * 0.5, rsx * sg, rsy * sg, rsz * sg, nd.tw * CFG_SP, u * 0.5 + 0.5);
        }
      }
    }
    const g = this.geo; g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.attributes.puv.needsUpdate = true;
    g.setDrawRange(0, (n - 1) * this.idxPer);
  }
  set(v, x, y, z, nx, ny, nz, u, w) {
    const i = v * 3; this.pos[i] = x; this.pos[i + 1] = y; this.pos[i + 2] = z; this.nor[i] = nx; this.nor[i + 1] = ny; this.nor[i + 2] = nz;
    this.puv[v * 2] = u; this.puv[v * 2 + 1] = w;
  }
}
const CFG_SP = 0.085;
const rib = new S.Ribbon(), strip = new StripMesh(rib.maxN);
const PILE_MAX = 200, pileStrip = new StripMesh(PILE_MAX);
let pileCount = -1;

/* ---------- 게임 상태 ---------- */
const sim = new S.PeelSim();
maskTex.image = { data: sim.mask.data, width: sim.mask.W, height: sim.mask.H };
maskTex.format = THREE.RedFormat; maskTex.type = THREE.UnsignedByteType;
maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter; maskTex.wrapS = THREE.RepeatWrapping; maskTex.wrapT = THREE.ClampToEdgeWrapping;
maskTex.generateMipmaps = false; maskTex.unpackAlignment = 1; maskTex.needsUpdate = true;
let maskVer = sim.mask.version;

let q = [0, 0, 0, 1];                 // 오렌지 회전 (로컬 → 월드). 화면에 보이는 시점과 동일한 값
let state = 'ready', danger = 0, endT = 0, timeNow = 0, firstGrab = false;
let spinAxis = [0, 1, 0], spinSpeed = 0;       // 놓은 뒤 관성
let layoutInfo = { floorY: -1.6, bx: 3, scale: 100, w: 1, h: 1, zg: 0.5 };
let pullSpeed = 0, shakeAmt = 0;

function applyQuat() { og.quaternion.set(q[0], q[1], q[2], q[3]); og.updateMatrixWorld(true); }
function layout() {
  const w = app.clientWidth || 360, h = app.clientHeight || 640;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const d = Math.max(1.55 / (FOV_T * camera.aspect), 2.0 / FOV_T);
  camera.position.set(0, CAMY, d); camera.lookAt(0, CAMY, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  const halfH = d * FOV_T, halfW = halfH * camera.aspect;
  layoutInfo.w = w; layoutInfo.h = h; layoutInfo.floorY = Math.min(-1.35, CAMY - halfH + 0.55);
  layoutInfo.bx = Math.max(1.0, (d - 1.3) * FOV_T * camera.aspect - 0.3); rib.bx = layoutInfo.bx;
  const a = pxOf([0, 0, 1]), b = pxOf([1, 0, 1]); layoutInfo.scale = Math.hypot(b.x - a.x, b.y - a.y);
  rib.setFloor(layoutInfo.floorY, [0, layoutInfo.floorY, 0.6]);
  shadow.position.set(0, layoutInfo.floorY - 0.02, 0.2); shadow.scale.set(3.4, 2.4, 1);
}
const _v = new THREE.Vector3();
function pxOf(p) { _v.set(p[0], p[1], p[2]).project(camera); return { x: (_v.x * 0.5 + 0.5) * layoutInfo.w, y: (-_v.y * 0.5 + 0.5) * layoutInfo.h }; }
function unprojectPlane(x, y, zg) {
  _v.set((x / layoutInfo.w) * 2 - 1, -(y / layoutInfo.h) * 2 + 1, 0.5).unproject(camera);
  const o = camera.position, dx = _v.x - o.x, dy = _v.y - o.y, dz = _v.z - o.z, t = (zg - o.z) / dz;
  return [o.x + dx * t, o.y + dy * t, zg];
}
const surf = (p, r = 1.04) => mul(norm(p), r);
function knifeW() { return surf(qRot(q, sim.C), 1.045); }
function nW() { return norm(qRot(q, sim.C)); }

function resetGame() {
  const lat = (-25 + Math.random() * 70) * Math.PI / 180, lon = Math.random() * Math.PI * 2;
  sim.reset(lat, lon); maskVer = -1; q = initialQuat(sim); applyQuat(); danger = 0; spinSpeed = 0; pullSpeed = 0; shakeAmt = 0; pileCount = -1;
  queue.length = 0; pathHist.length = 0; ptr.id = null; ptr.mode = 'idle'; canvas.classList.remove('grab');
  const nw = nW(), pts = sim.flapPoints(4).map((c, i) => { const lift = 0.012 + 0.08 * (i / 3) * (i / 3); return add(surf(qRot(q, c), 1.045), mul(norm(qRot(q, c)), lift)); });
  rib.begin(pts, CFG.WSTART); rib.bx = layoutInfo.bx; rib.setFloor(layoutInfo.floorY, [0, layoutInfo.floorY, 0.6]);
  rib.anchor = (p) => (p.cl ? mul(qRot(q, p.cl), 1.045) : null);
  state = 'play'; firstGrab = false; clearT = 0; lastCheckW = -1;
  $('start').classList.add('hidden'); $('result').classList.add('hidden'); $('result').classList.remove('show'); hud();
}
const pct = () => Math.round(sim.peelFrac * 100);          // 플레이 화면과 결과 화면이 같은 값·같은 반올림을 쓴다 (성공 판정과 무관)
function hud() {
  const cm = sim.length * CFG.CM_PER_R;
  $('len').textContent = cm.toFixed(1) + ' cm'; $('area').textContent = pct() + '%';
}
function finish(kind) {
  if (state !== 'play') return; state = 'over'; endT = timeNow; endPointer(); rib.detach();
  const cm = sim.length * CFG.CM_PER_R;
  $('r-len').textContent = '오렌지를 ' + pct() + '% 깠어요'; $('r-cm').textContent = '깐 껍질 길이 ' + cm.toFixed(1) + ' cm';
  if (kind === 'clear') Snd.win(); else Snd.snap();
  hud(); $('danger').style.opacity = 0;
  const R = $('result'); R.classList.remove('show', 'win', 'lose'); R.classList.add(kind === 'clear' ? 'win' : 'lose');
  $('b-text').textContent = kind === 'clear' ? '그걸 왜 까!' : '입술로 부드럽게!!';        // 문구는 정확히 이대로 유지
  setTimeout(() => { if (state === 'over') { R.classList.remove('hidden'); void R.offsetWidth; R.classList.add('show'); } }, kind === 'clear' ? 900 : 1000);
}

/* ---------- 입력 상태 머신 (포인터 하나) ----------
   idle ──(빈 곳을 누름)──▶ look : 레이캐스트로 잡은 표면 점이 손을 따라 회전. 껍질·점수·위험도 불변. 놓으면 관성 감속.
   idle ──(보이는 껍질을 누름)──▶ peel : Ribbon.grabNode 로 껍질을 실제로 잡는다. 오렌지는 절대 회전하지 않는다.
        peel/surface : 포인터 이벤트마다 raw 좌표(+잡을 때의 손↔칼날 간격) 아래의 표면점을 구해 지정 경로(queue)에 즉시 쌓고, 칼날이 그 경로를 그대로 따라간다.
        peel/off     : 그 점이 구 밖이면 아무것도 하지 않고 정지(자동 직진 없음). 표면으로 돌아오면 현재 분리 지점에 간격을 다시 맞춰 이어서 깐다.
        껍질 메시는 항상 손(grip)에 붙어 따라온다(Ribbon.easeGrip / fitGrip).
   손을 떼면 queue·당김 누적을 비우고 즉시 정지 → idle. 끊어짐/클리어 후에는 입력이 무시된다. */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const queue = [], pathHist = [];
const ptr = { lastMoveT: 0, id: null, mode: 'idle', x: 0, y: 0, hPrev: null, tgtW: [0, 0, 1], lastT: 0, vel: null, h0: null, onSurf: false, flash: 0 };
const gripS = [0, 0, 1.2];
const dbg = { on: /[?&]debug/.test(location.search), hit: null, autoRot: false, px: 0, py: 0, intent: [], trail: [], devSum: 0, devN: 0, devMax: 0, dev: 0 };
function rayDir(x, y) { ndc.set((x / layoutInfo.w) * 2 - 1, -(y / layoutInfo.h) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray; }
/* 포인터 → 오렌지 표면. 셰이더가 discard 한 '이미 벗겨진 곳'은 메시에는 남아 있으므로, 마스크를 확인해서
   벗겨진 곳이면 속껍질 면(반지름 1.0)과의 교점으로 바꾼다. 구를 벗어나면 광선이 구에 가장 가까이 지나는 점의 방향(on:false). */
function surfaceHit(x, y) {
  applyQuat(); const r = rayDir(x, y), o = [r.origin.x, r.origin.y, r.origin.z], dd = [r.direction.x, r.direction.y, r.direction.z];
  const hit = ray.intersectObject(peelMesh, false);
  if (hit.length) {
    const p = hit[0].point; let d = norm([p.x, p.y, p.z]), dist = hit[0].distance, peeled = false;
    if (sim.mask.get(qRot(S.qConj(q), d))) {
      peeled = true; const b = dot(o, dd), c = dot(o, o) - 1, disc = b * b - c;
      if (disc > 0) { const t = -b - Math.sqrt(disc); if (t > 0) { d = norm(add(o, mul(dd, t))); dist = t; } }
    }
    return { d, on: true, dist, peeled };
  }
  const t = -dot(o, dd); return { d: norm(add(o, mul(dd, t))), on: false, dist: t, peeled: false };
}
const surfaceDir = surfaceHit;
/* 눈에 보이는 껍질 메시를 레이캐스트해 가장 가까운 노드 번호를 돌려준다 (없으면 -1). 오렌지 뒤에 가려진 껍질은 잡히지 않는다. */
function pickPeel(x, y, touch) {
  applyQuat();
  /* 잡기 허용 오차(px). 오렌지 몸통을 누르면 회전 의도로 보고 아주 작게, 오렌지 바깥(늘어진 껍질)이나 분리 지점(칼날 끝) 근처에선 넉넉하게. */
  const body = surfaceHit(x, y).on, kk = pxOf(surf(qRot(q, sim.P), 1.04)), nearKnife = qRot(q, sim.P)[2] > 0.05 && Math.hypot(x - kk.x, y - kk.y) < (touch ? 46 : 26);
  let tol = body ? (touch ? 10 : 4) : (touch ? 34 : 12);
  if (nearKnife) tol = Math.max(tol, touch ? 30 : 14);
  const offs = [[0, 0]];
  for (const f of [0.5, 1]) for (let a = 0; a < 8; a++) { const r = tol * f; offs.push([Math.cos(a * Math.PI / 4) * r, Math.sin(a * Math.PI / 4) * r]); }   // 가까운 고리부터 → 가장 가까운 껍질이 이긴다
  const nodes = rib.nodes, n = nodes.length;
  for (const o of offs) {
    rayDir(x + o[0], y + o[1]); const hs = ray.intersectObject(strip.mesh, false); if (!hs.length) continue;
    const sh = surfaceHit(x + o[0], y + o[1]); if (sh.on && sh.dist < hs[0].distance - 0.015) continue;   // 오렌지(벗겨진 곳은 속껍질 면) 뒤에 가림
    const p = hs[0].point; let best = -1, bd = 1e9;
    for (let i = Math.max(0, n - 60); i < n - 1; i++) { const d = Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y, nodes[i].z - p.z); if (d < bd) { bd = d; best = i; } }
    if (best >= 0 && bd < 0.4) return best;
  }
  return -1;
}
function knifeDirW() { return norm(qRot(q, sim.P)); }
function rotateBetween(h0, h1) {
  const ax = cross(h0, h1), al = len(ax); if (al < 1e-7) return 0;
  const ang = Math.atan2(al, dot(h0, h1)); q = qNorm(qMul(qAxis(ax, ang), q)); return ang;
}
canvas.addEventListener('pointerdown', (e) => {
  if (ptr.id !== null) return; Snd.init();
  if (state !== 'play') return; e.preventDefault(); canvas.setPointerCapture(e.pointerId);
  const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, touch = e.pointerType !== 'mouse';
  ptr.id = e.pointerId; ptr.x = x; ptr.y = y; spinSpeed = 0; applyQuat();
  const idx = sim.status === 'run' && rib.attached ? pickPeel(x, y, touch) : -1;
  if (idx >= 0 && rib.grabNode(idx, x, y, touch, pxOf)) {
    ptr.mode = 'peel'; canvas.classList.add('grab'); Snd.grab(); grainAcc = grainGap; ptr.flash = 1; if (navigator.vibrate) { try { navigator.vibrate(12); } catch (er) {} }
    queue.length = 0; ptr.pLoc = null; ptr.onSurf = false; ptr.tgtW = knifeDirW(); rib.tension = 0.4;
    { const kp = pxOf(surf(qRot(q, sim.P), 1.04)); ptr.offx = kp.x - x; ptr.offy = kp.y - y; }     // 잡는 순간의 손↔칼날 화면 간격(이후 유지)
    dbg.intent.length = 0; dbg.trail.length = 0; dbg.devSum = 0; dbg.devN = 0; dbg.devMax = 0;
    collectPath(x, y);
    const g = rib.grip; gripS[0] = g[0]; gripS[1] = g[1]; gripS[2] = g[2];
    firstGrab = true;
  } else { ptr.mode = 'look'; ptr.h0 = surfaceDir(x, y).d; ptr.lastT = performance.now(); ptr.vel = null; }
});
function onMove(x, y) {
  ptr.x = x; ptr.y = y; dbg.px = x; dbg.py = y;
  if (ptr.mode === 'peel') {
    rib.fx = x; rib.fy = y; ptr.lastMoveT = performance.now();   // 시각용 손 위치(부드럽게 따라옴)
    collectPath(x, y);                      // 실제 제거 경로는 지연 없이 raw 포인터로
  } else if (ptr.mode === 'look') {
    const h1 = surfaceDir(x, y).d, now = performance.now(), dt = Math.max(1, now - ptr.lastT) / 1000, ax = cross(ptr.h0, h1), ang = rotateBetween(ptr.h0, h1);
    if (ang > 0) { const k = Math.min(1, dt / 0.05), sp = ang / dt; spinAxis = norm(ax); spinSpeed = ptr.vel === null ? sp : spinSpeed + (sp - spinSpeed) * k; ptr.vel = 1; }
    ptr.h0 = h1; ptr.lastT = now; applyQuat();
  }
}
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== ptr.id) return; e.preventDefault(); const r = canvas.getBoundingClientRect();
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
  if (list && list.length) for (const c of list) onMove(c.clientX - r.left, c.clientY - r.top); else onMove(e.clientX - r.left, e.clientY - r.top);
});
function endPointer() { if (ptr.mode === 'peel') { rib.release(); queue.length = 0; rib.pending = 0; canvas.classList.remove('grab'); } ptr.id = null; ptr.mode = 'idle'; ptr.pLoc = null; ptr.onSurf = false; queue.length = 0; }
function up(e) {
  if (e.pointerId !== ptr.id) return;
  if (ptr.mode === 'look') { if (performance.now() - ptr.lastT > 90) spinSpeed = 0; spinSpeed = Math.min(spinSpeed, 9); }
  endPointer();
}
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => { if (e.key === 'd' || e.key === 'D') dbg.on = !dbg.on; });

/* ---------- 프레임 ---------- */
let clearT = 0, grainAcc = 0, grainGap = 0.05, lastCheckW = -1;
/* 손(포인터)이 지나간 경로 → 오렌지 표면 경로. 포인터 이벤트마다 즉시 호출 (보정·지연 없음).
   칼날이 가려는 점 = '포인터 + 잡을 때의 손↔칼날 화면 간격' 아래의 표면점. */
function collectPath(x, y) {
  if (state !== 'play' || sim.status !== 'run') return;
  const sdp = surfaceDir(x + ptr.offx, y + ptr.offy), front = sdp.on && sdp.d[2] > CFG.GRAZE;
  dbg.hit = sdp.on ? sdp.d : null;
  if (!front) { ptr.onSurf = false; ptr.pLoc = null; queue.length = 0; ptr.why = '표면 밖: 정지'; return; }
  const loc = qRot(S.qConj(q), sdp.d);
  if (!ptr.onSurf || !ptr.pLoc) {
    // 표면에 (다시) 들어옴: ① 지금 분리 지점(칼날 끝)에 손↔칼날 간격을 다시 맞추고 ② 목표 표면점도 '새 간격' 기준으로 다시 구한다.
    // (옛 간격으로 구한 loc 를 그대로 쓰면 첫 구간이 옛 목표→새 목표로 꺾이거나 점프한다)
    if (qRot(q, sim.P)[2] > 0.1) {
      const kp = pxOf(surf(qRot(q, sim.P), 1.04)); ptr.offx = kp.x - x; ptr.offy = kp.y - y;
      const s2 = surfaceDir(x + ptr.offx, y + ptr.offy);
      ptr.pLoc = s2.on && s2.d[2] > CFG.GRAZE ? qRot(S.qConj(q), s2.d) : sim.P.slice();
    } else ptr.pLoc = loc;                       // 칼날이 오렌지 뒤쪽이면 간격을 맞출 수 없다 → 기준점만 잡고(진행은 followQueue 가 막는다)
    ptr.onSurf = true; ptr.why = ''; return;
  }
  const ang = Math.acos(clamp(dot(ptr.pLoc, loc), -1, 1));
  if (ang < 1e-5) return;
  if (ang < 1.0) {
    const n = Math.ceil(ang / 0.03), ax = norm(cross(ptr.pLoc, loc));   // 큰 드래그는 작은 표면 경로 여러 개로 쪼갠다
    for (let k = 1; k <= n; k++) { const pt = norm(S.rodrigues(ptr.pLoc, ax, ang * k / n)); queue.push(pt); dbg.intent.push(pt); }
    if (queue.length > 600) queue.splice(0, queue.length - 600);   // 안전 한도(18rad): 정상 입력으로는 닿지 않는다
    if (dbg.intent.length > 800) dbg.intent.splice(0, 200);
    ptr.tgtW = qRot(q, loc);
  }
  dbg.trail.push([x + ptr.offx, y + ptr.offy]); if (dbg.trail.length > 600) dbg.trail.splice(0, 150);
  ptr.pLoc = loc; ptr.lastMoveT = performance.now();
}
function slerpDir(a, b, ang, t) { return norm(S.rodrigues(a, norm(cross(a, b)), ang * t)); }
function peelFrame(dt) {
  const qb = q.slice(); let emitted = 0; rib.easeGrip(dt);
  const onStep = (dl) => { if (dl > 0) { emitted += dl; rib.feed(dl, sim.w, sim.q, knifeW(), sim.C.slice()); grainAcc += dl; if (grainAcc >= grainGap) { grainAcc = 0; grainGap = (0.016 + Math.random() * 0.022) / (1 + Math.min(pullSpeed, 4) * 0.2); Snd.rustle(Math.max(pullSpeed, emitted / Math.max(dt, 0.001))); } } };
  const visible = () => qRot(q, sim.P)[2] > 0.04;
  /* 1) 손의 실제 경로는 포인터 이벤트(onMove)에서 지연 없이 queue 에 쌓였다. 여기서는 그 경로를 따라 칼날만 움직인다.
        큐가 비면 칼날은 즉시 멈추고, 표면 밖으로 나가면 자동 직진 없이 정지한다. */
  const sd = surfaceDir(rib.tx, rib.ty);                                           // (표시 전용) 눈에 보이는 손 아래 표면
  const res = sim.followQueue(queue, CFG.PULL_CAP, onStep, visible);
  // 못 간 경로는 버리지 않는다(빠른 드래그 보존). 다만 손이 70ms(또는 프레임 1.5개) 이상 안 움직였으면(멈춤) 남은 입력은 비운다 → 혼자 계속 까지지 않음
  if (performance.now() - ptr.lastMoveT > Math.max(70, dt * 1500)) queue.length = 0;     // 느린 프레임(dt 큼)에서는 기준도 늘려 정상 입력을 버리지 않는다
  if (res.blocked) ptr.blockedT = 1;                                  // 분리 지점이 오렌지 뒤쪽: 화면 가장자리가 잠깐 깜빡인다
  if (emitted > 0 && dbg.intent.length) {                                          // (검증용) 손이 지정한 경로 ↔ 실제 제거(칼날) 위치의 어긋남
    let m = 9; for (let i = dbg.intent.length - 1, c = 0; i >= 0 && c < 300; i--, c++) { const a = Math.acos(clamp(dot(sim.P, dbg.intent[i]), -1, 1)); if (a < m) m = a; }
    dbg.dev = m; dbg.devSum += m; dbg.devN++; if (m > dbg.devMax) dbg.devMax = m;
  }
  if (emitted > 0) { pathHist.push(sim.P.slice()); if (pathHist.length > 400) pathHist.shift(); hud(); }
  pullSpeed += (emitted / Math.max(dt, 1e-3) - pullSpeed) * (1 - Math.exp(-18 * dt));
  danger = 1 - sim.q; rib.tension = clamp(0.3 + 0.7 * danger + pullSpeed * 0.2, 0, 1);
  /* 4) 껍질 메시가 손을 따라오게: 손 위치 → grip. 늘어진 껍질이 오렌지 앞을 덮지 않도록 손이 있는 쪽으로 비껴 늘어진다 */
  const kw = knifeW(); let gt;
  if (ptr.onSurf) gt = mul(sd.d, 1.13); else gt = unprojectPlane(rib.tx, rib.ty, 1.15);
  const maxL = Math.max(0.12, (rib.nodes.length - 1) * rib.sp * 0.97), vx = sub(gt, kw), vl = len(vx);
  if (vl > maxL) gt = add(kw, mul(vx, maxL / vl));            // 껍질은 고무줄처럼 늘어나지 않는다
  const f = 1 - Math.exp(-40 * dt); for (let i = 0; i < 3; i++) gripS[i] += (gt[i] - gripS[i]) * f;
  rib.setGrip(gripS.slice()); rib.fitGrip(kw, dt); rib.side = gripS[0] >= 0 ? 1 : -1;
  dbg.autoRot = q.some((v, i) => v !== qb[i]);                // 껍질 벗기는 동안 오렌지가 저절로 돌았는가 (항상 false 여야 함)
}
function drawDebug() {
  let c = $('dbg'); if (!c) { c = document.createElement('canvas'); c.id = 'dbg'; c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:15'; app.appendChild(c); }
  c.style.display = dbg.on ? 'block' : 'none'; if (!dbg.on) return;
  if (c.width !== layoutInfo.w) { c.width = layoutInfo.w; c.height = layoutInfo.h; }
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); applyQuat();
  g.strokeStyle = '#ffd400'; g.lineWidth = 2; g.beginPath();
  pathHist.forEach((p, i) => { const a = pxOf(mul(qRot(q, p), 1.05)); i ? g.lineTo(a.x, a.y) : g.moveTo(a.x, a.y); }); g.stroke();      // 실제로 껍질이 제거된 경로(칼날 궤적)
  g.strokeStyle = '#ff2d2d'; g.lineWidth = 2; g.beginPath();                                                    // 손이 지정한 경로(포인터 + 간격)
  dbg.trail.forEach((p, i) => { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
  const dot_ = (x, y, col, r = 6) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  if (ptr.mode === 'peel') dot_(dbg.px, dbg.py, '#ff2d2d');                                                      // 실제 포인터
  if (dbg.hit) { const a = pxOf(mul(dbg.hit, 1.04)); dot_(a.x, a.y, '#2d7dff', 5); }                              // 레이캐스트 표면 좌표
  if (ptr.mode === 'peel') { const a = pxOf(mul(ptr.tgtW, 1.04)); dot_(a.x, a.y, '#22c55e', 5); }                // 현재 표면 진행 목표점
  const k = pxOf(knifeW()); dot_(k.x, k.y, '#ff00ff', 4);
  g.fillStyle = '#000'; g.font = '12px monospace';
  [`mode:${ptr.mode} queue:${queue.length} surf:${ptr.onSurf}`, `폭 w=${sim.w.toFixed(3)} (최근 경계거리 ${sim.lastD == null ? '-' : sim.lastD.toFixed(3)}, 곡률한계 ${isFinite(sim.lastCap) ? sim.lastCap.toFixed(2) : '∞'})`, `자동 회전: ${dbg.autoRot ? '발생!' : '없음'}  길이 ${(sim.length * CFG.CM_PER_R).toFixed(1)}cm`, `어긋남(손경로↔제거위치) 지금 ${(dbg.dev * 57.3).toFixed(1)}° 평균 ${(dbg.devN ? dbg.devSum / dbg.devN * 57.3 : 0).toFixed(1)}° 최대 ${(dbg.devMax * 57.3).toFixed(1)}°`, '빨간선=손이 지정한 경로 / 노란선=실제 제거 경로', '빨강점=포인터 파랑=표면좌표 분홍=칼날 ' + (ptr.why || '')]
    .forEach((t, i) => g.fillText(t, 8, layoutInfo.h - 160 + i * 14));
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - last) / 1000, 0.001, 1 / 20); last = now; timeNow += dt;
  if (state === 'play' || state === 'over') {
    if (state === 'play' && ptr.mode === 'peel') peelFrame(dt);
    else {
      pullSpeed *= Math.exp(-20 * dt);
      if (state === 'play' && ptr.mode !== 'look' && spinSpeed > 0.01) { q = qNorm(qMul(qAxis(spinAxis, spinSpeed * dt), q)); spinSpeed *= Math.exp(-3.2 * dt); applyQuat(); }   // 놓은 뒤 관성: 부드럽게 감속
      if (state === 'play' && ptr.mode !== 'look') danger += ((1 - sim.q) - danger) * (1 - Math.exp(-6 * dt));
    }
    if (state === 'play') {
      if (sim.status === 'broken') finish('over');
      else { clearT += dt; if (clearT > 0.35 && sim.peelFrac > 0.6) { clearT = 0; if (sim.mask.peeledW !== lastCheckW) { lastCheckW = sim.mask.peeledW; sim.clearCheck(); } }   if (sim.status === 'clear') finish('clear'); }   // 새로 벗겨진 게 있을 때만 remain() 실행(반복 계산 방지)
    }
    const kw = knifeW(), nw = nW(), trail = qRot(q, mul(sim.T, -1));
    rib.update(dt, kw, nw, trail, pullSpeed);
    shakeAmt = state === 'play' && ptr.mode === 'peel' ? clamp(pullSpeed * 0.004, 0, 0.012) + danger * 0.012 : 0;
    strip.update(rib.nodes, nw, shakeAmt, timeNow, 0);
    const tutor = state === 'play' && !firstGrab;
    stripMat.uniforms.uHint.value = tutor ? 0.5 + 0.5 * Math.sin(timeNow * 5) : 0;
    ptr.flash = Math.max(0, ptr.flash - dt * 3.5); stripMat.uniforms.uFlash.value = ptr.flash;
    const showGuide = state === 'play' && sim.length * CFG.CM_PER_R < 2.5;
    guide.visible = showGuide;
    if (showGuide) guide.children.forEach((m, i) => { const mv = S.moveAlong(sim.P, sim.T, 0.14 + i * 0.085), p = mul(qRot(q, mv.P), 1.05); m.position.set(p[0], p[1], p[2]); const k = 0.7 + 0.5 * Math.sin(timeNow * 5 - i * 0.7); m.scale.setScalar(k); });
    const fing = $('fing');
    if (tutor && rib.nodes.length > 1) { const n1 = rib.nodes[1], pp = pxOf([n1.x, n1.y, n1.z]); fing.style.display = 'block'; fing.style.left = pp.x + 'px'; fing.style.top = (pp.y + 6) + 'px'; } else fing.style.display = 'none';
    if (rib.pile.length !== pileCount) {
      pileCount = rib.pile.length; const m = Math.min(pileCount, PILE_MAX), nodes = []; let th = 0;
      for (let i = 0; i < m; i++) { const r = 0.16 + 0.05 * th / (Math.PI * 2); th += CFG_SP / r; const lap = th / (Math.PI * 2);
        nodes.push({ x: Math.cos(th) * r, y: layoutInfo.floorY + 0.03 + 0.016 * lap, z: 0.6 + Math.sin(th) * r * 0.8, w: rib.pile[pileCount - m + i] || 0.2, tw: i }); }
      pileStrip.update(nodes, [0, 1, 0], 0, 0, 0);
    }
    if (sim.mask.version !== maskVer) { maskVer = sim.mask.version; maskTex.needsUpdate = true; }
    $('danger').style.opacity = state === 'play' ? clamp(Math.max(danger * 0.9, (ptr.blockedT || 0) * 0.5), 0, 0.85) : 0;
    ptr.blockedT = Math.max(0, (ptr.blockedT || 0) - dt * 2.5);
  }
  renderer.render(scene, camera); drawDebug();
}

/* ---------- 버튼 ---------- */
$('go').addEventListener('click', () => { Snd.init(); resetGame(); });
$('retry').addEventListener('click', () => { Snd.init(); resetGame(); });
const sb = $('snd'); function sndUi() { sb.classList.toggle('off', !Snd.on); }
sb.addEventListener('click', () => { Snd.on = !Snd.on; store.setSnd(Snd.on); sndUi(); Snd.init(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) Snd.wake(); });
sndUi();
window.addEventListener('resize', layout);
layout(); resetGame(); state = 'ready'; $('start').classList.remove('hidden'); hud();
requestAnimationFrame(frame);

/* 검증/디버그용 (게임 동작에는 쓰이지 않음) */
window.PEEL_DEBUG = { Snd, sim, rib, get q() { return q; }, set q(v) { q = v; applyQuat(); }, camera, pxOf, knifeW, layoutInfo, get state() { return state; }, get danger() { return danger; }, strip, applyQuat, renderer, scene, peelMesh, surfaceDir, get spinSpeed() { return spinSpeed; }, ptr, queue, dbg, pickPeel, S, pathHist };
})();

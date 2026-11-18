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
const store = { get() { try { return parseFloat(localStorage.getItem('orangePeel3dBest')) || 0; } catch (e) { return 0; } },
                set(v) { try { localStorage.setItem('orangePeel3dBest', String(v)); } catch (e) {} },
                snd() { try { return localStorage.getItem('orangePeel3dSnd') !== '0'; } catch (e) { return true; } },
                setSnd(v) { try { localStorage.setItem('orangePeel3dSnd', v ? '1' : '0'); } catch (e) {} } };
const Snd = {
  ctx: null, on: store.snd(),
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(), n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.buf = buf;
    this.src = c.createBufferSource(); this.src.buffer = buf; this.src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8;
    this.sg = c.createGain(); this.sg.gain.value = 0; this.bp = bp;
    this.src.connect(bp); bp.connect(this.sg); this.sg.connect(c.destination); this.src.start();
    this.osc = c.createOscillator(); this.osc.type = 'sine'; this.osc.frequency.value = 600;
    this.tg = c.createGain(); this.tg.gain.value = 0; this.osc.connect(this.tg); this.tg.connect(c.destination); this.osc.start();
  },
  /* speed: 실제로 벗겨진 길이/초 (R 단위), danger 0..1 */
  loop(speed, danger) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    const g = this.on ? clamp(speed / 3, 0, 1) * 0.22 : 0;
    this.sg.gain.setTargetAtTime(g, t, 0.025);
    this.bp.frequency.setTargetAtTime(2400 + clamp(speed, 0, 4) * 700, t, 0.05);
    this.tg.gain.setTargetAtTime(this.on ? danger * danger * 0.04 : 0, t, 0.05);
    this.osc.frequency.setTargetAtTime(500 + danger * 900, t, 0.05);
  },
  burst(dur, freq, vol) {
    if (!this.ctx || !this.on) return; const c = this.ctx, s = c.createBufferSource(); s.buffer = this.buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(); s.stop(c.currentTime + dur);
  },
  tone(f, t0, dur, vol) {
    if (!this.ctx || !this.on) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  },
  grab() { this.burst(0.08, 900, 0.18); this.tone(520, 0, 0.1, 0.05); },
  snap() { this.burst(0.25, 1400, 0.5); this.tone(110, 0, 0.3, 0.12); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.12, 0.35, 0.09)); }
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
let state = 'ready', best = store.get(), danger = 0, endT = 0, timeNow = 0, firstGrab = false;
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
  state = 'play'; firstGrab = false; clearT = 0;
  setTip('반짝이는 껍질 끝을 잡고, 점선을 따라 오렌지 위를 문질러 보세요');
  $('start').classList.add('hidden'); $('result').classList.add('hidden'); hud();
}
function setTip(t, warn) { const e = $('tip'); e.textContent = t; e.classList.toggle('warn', !!warn); }
function hud() {
  const cm = sim.length * CFG.CM_PER_R;
  $('len').textContent = cm.toFixed(1) + ' cm'; $('area').textContent = Math.round(sim.peelFrac * 100) + '%'; $('best').textContent = best.toFixed(1) + ' cm';
}
const REASONS = { self: '이미 벗긴 곳을 다시 지나가서 껍질이 끊어졌어요', turn: '너무 급하게 꺾어서 껍질이 접혀 끊어졌어요', edge: '이전 경계에 너무 붙어서 껍질이 가늘어져 끊어졌어요' };
function finish(kind) {
  if (state !== 'play') return; state = 'over'; endT = timeNow; endPointer(); rib.detach(); setTip('');
  const cm = sim.length * CFG.CM_PER_R, nb = cm > best + 1e-6; if (nb) { best = cm; store.set(best); }
  $('r-title').textContent = kind === 'clear' ? 'CLEAR! 🍊' : 'GAME OVER';
  $('r-len').textContent = cm.toFixed(1) + ' cm'; $('r-best').textContent = '최고 기록 ' + best.toFixed(1) + ' cm';
  $('r-reason').textContent = kind === 'clear' ? '오렌지를 끝까지 벗겼어요!' : (REASONS[sim.reason] || '껍질이 끊어졌어요');
  $('badge').classList.toggle('hidden', !nb);
  if (kind === 'clear') Snd.win(); else Snd.snap();
  hud(); $('danger').style.opacity = 0; setTimeout(() => { if (state === 'over') $('result').classList.remove('hidden'); }, kind === 'clear' ? 900 : 1100);
}

/* ---------- 입력 상태 머신 (포인터 하나) ----------
   idle ──(빈 곳을 누름)──▶ look : 레이캐스트로 잡은 표면 점이 손을 따라 회전. 껍질·점수·위험도 불변. 놓으면 관성 감속.
   idle ──(보이는 껍질을 누름)──▶ peel : Ribbon.grabNode 로 껍질을 실제로 잡는다. 오렌지는 절대 회전하지 않는다.
        peel/surface : 손 위치(눈에 보이는 잡은 지점)의 레이캐스트 표면점이 움직인 만큼 지정 경로(queue)가 늘고, 칼날이 그 경로를 따라간다.
        peel/off     : 손이 구 밖이면 방향을 새로 만들지 않고 마지막 진행 방향으로, 손이 멀어진 거리만큼만 이어서 벗긴다(Ribbon.moveFinger).
        껍질 메시는 항상 손(grip)에 붙어 따라온다(Ribbon.easeGrip / fitGrip).
   손을 떼면 queue·당김 누적을 비우고 즉시 정지 → idle. 끊어짐/클리어 후에는 입력이 무시된다. */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const queue = [], pathHist = [];
const ptr = { id: null, mode: 'idle', x: 0, y: 0, hPrev: null, tgtW: [0, 0, 1], lastT: 0, vel: null, h0: null, onSurf: false, flash: 0 };
const gripS = [0, 0, 1.2];
const dbg = { on: /[?&]debug/.test(location.search), hit: null, autoRot: false, px: 0, py: 0 };
function rayDir(x, y) { ndc.set((x / layoutInfo.w) * 2 - 1, -(y / layoutInfo.h) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray; }
function surfaceDir(x, y) {
  applyQuat(); const r = rayDir(x, y), hit = ray.intersectObject(peelMesh, false);
  if (hit.length) return { d: norm([hit[0].point.x, hit[0].point.y, hit[0].point.z]), on: true };
  const o = [r.origin.x, r.origin.y, r.origin.z], dd = [r.direction.x, r.direction.y, r.direction.z], t = -dot(o, dd);
  return { d: norm(add(o, mul(dd, t))), on: false };
}
/* 눈에 보이는 껍질 메시를 레이캐스트해 가장 가까운 노드 번호를 돌려준다 (없으면 -1). 오렌지 뒤에 가려진 껍질은 잡히지 않는다. */
function pickPeel(x, y, touch) {
  applyQuat(); const tol = touch ? 26 : 8, offs = [[0, 0], [tol, 0], [-tol, 0], [0, tol], [0, -tol]]; if (touch) offs.push([tol * .7, tol * .7], [-tol * .7, tol * .7], [tol * .7, -tol * .7], [-tol * .7, -tol * .7]);
  const nodes = rib.nodes, n = nodes.length;
  for (const o of offs) {
    rayDir(x + o[0], y + o[1]); const hs = ray.intersectObject(strip.mesh, false); if (!hs.length) continue;
    const sp = ray.intersectObject(peelMesh, false); if (sp.length && sp[0].distance < hs[0].distance - 0.015) continue;   // 오렌지 뒤에 가림
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
    ptr.mode = 'peel'; canvas.classList.add('grab'); Snd.grab(); ptr.flash = 1; if (navigator.vibrate) { try { navigator.vibrate(12); } catch (er) {} }
    queue.length = 0; ptr.hPrev = null; ptr.onSurf = false; ptr.tgtW = knifeDirW(); rib.tension = 0.4;
    const g = rib.grip; gripS[0] = g[0]; gripS[1] = g[1]; gripS[2] = g[2];
    if (!firstGrab) { firstGrab = true; setTip('오렌지 위에서 손가락을 움직이면 그 길을 따라 벗겨져요'); }
  } else { ptr.mode = 'look'; ptr.h0 = surfaceDir(x, y).d; ptr.lastT = performance.now(); ptr.vel = null; }
});
function onMove(x, y) {
  ptr.x = x; ptr.y = y; dbg.px = x; dbg.py = y;
  if (ptr.mode === 'peel') {
    const k = pxOf(knifeW());
    if (ptr.onSurf) rib.rebase(x, y); else rib.moveFinger(x, y, k.x, k.y, layoutInfo.scale);   // 구 밖에서만 '당긴 거리'를 모은다
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
function endPointer() { if (ptr.mode === 'peel') { rib.release(); queue.length = 0; rib.pending = 0; canvas.classList.remove('grab'); } ptr.id = null; ptr.mode = 'idle'; ptr.hPrev = null; ptr.onSurf = false; }
function up(e) {
  if (e.pointerId !== ptr.id) return;
  if (ptr.mode === 'look') { if (performance.now() - ptr.lastT > 90) spinSpeed = 0; spinSpeed = Math.min(spinSpeed, 9); }
  endPointer();
}
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => { if (e.key === 'd' || e.key === 'D') dbg.on = !dbg.on; });

/* ---------- 프레임 ---------- */
let clearT = 0;
function slerpDir(a, b, ang, t) { return norm(S.rodrigues(a, norm(cross(a, b)), ang * t)); }
function peelFrame(dt) {
  const qb = q.slice(); let emitted = 0; rib.easeGrip(dt);
  const onStep = (dl) => { if (dl > 0) { emitted += dl; rib.feed(dl, sim.w, sim.q, knifeW(), sim.C.slice()); } };
  const visible = () => qRot(q, sim.P)[2] > 0.04;
  /* 1) 손(눈에 보이는 잡은 지점)이 가리키는 표면점 → 지정 경로 */
  const sd = surfaceDir(rib.tx, rib.ty), front = sd.on && sd.d[2] > CFG.GRAZE;   // sd.d 는 이미 월드 방향
  dbg.hit = sd.on ? sd.d : null;
  if (front) {
    if (!ptr.onSurf) { ptr.tgtW = queue.length ? ptr.tgtW : knifeDirW(); ptr.hPrev = sd.d; rib.rebase(ptr.x, ptr.y); }   // 표면에 (다시) 들어올 때 기준만 새로 잡는다: 순간이동 없음
    else if (ptr.hPrev) {
      const ang = Math.acos(clamp(dot(ptr.hPrev, sd.d), -1, 1));
      if (ang > 1e-5 && ang < 0.6) {
        if (!queue.length) ptr.tgtW = knifeDirW();            // 목표점은 항상 칼날에서 이어진다
        const n = Math.ceil(ang / 0.04), ax = norm(cross(ptr.hPrev, sd.d));
        for (let k = 1; k <= n; k++) { ptr.tgtW = norm(S.rodrigues(ptr.tgtW, ax, ang / n)); queue.push(qRot(S.qConj(q), ptr.tgtW)); }
      }
      ptr.hPrev = sd.d;
    }
    ptr.onSurf = true;
  } else { ptr.onSurf = false; ptr.hPrev = null; }
  /* 2) 경로를 따라 칼날 이동 (큐가 비면 즉시 정지) */
  const res = sim.followQueue(queue, CFG.PULL_CAP, onStep, visible);
  /* 3) 구 밖에서 당기면: 마지막 진행 방향으로 당긴 거리만큼 */
  if (!ptr.onSurf && rib.pending > 0 && sim.status === 'run') {
    let want = Math.min(rib.pending / layoutInfo.scale * CFG.PULL_GAIN, 0.5); rib.pending = 0;
    while (want > 0 && sim.status === 'run') { if (!visible()) { res.blocked = true; break; } const ds = Math.min(0.01, want); sim.straight(ds, onStep); want -= ds; }
  }
  if (res.blocked) setTip('분리 지점이 오렌지 뒤쪽이에요. 손을 놓고 오렌지를 돌려 이어서 벗기세요', true);
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
  const dot_ = (x, y, col, r = 6) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  if (ptr.mode === 'peel') dot_(dbg.px, dbg.py, '#ff2d2d');                                                      // 실제 포인터
  if (dbg.hit) { const a = pxOf(mul(dbg.hit, 1.04)); dot_(a.x, a.y, '#2d7dff', 5); }                              // 레이캐스트 표면 좌표
  if (ptr.mode === 'peel') { const a = pxOf(mul(ptr.tgtW, 1.04)); dot_(a.x, a.y, '#22c55e', 5); }                // 현재 표면 진행 목표점
  const k = pxOf(knifeW()); dot_(k.x, k.y, '#ff00ff', 4);
  g.fillStyle = '#000'; g.font = '12px monospace';
  [`mode:${ptr.mode} queue:${queue.length} surf:${ptr.onSurf}`, `폭 w=${sim.w.toFixed(3)} (최근 경계거리 ${sim.lastD == null ? '-' : sim.lastD.toFixed(3)}, 곡률한계 ${isFinite(sim.lastCap) ? sim.lastCap.toFixed(2) : '∞'})`, `자동 회전: ${dbg.autoRot ? '발생!' : '없음'}  길이 ${(sim.length * CFG.CM_PER_R).toFixed(1)}cm`, '빨강=포인터 파랑=표면좌표 초록=목표점 노랑=제거경로 분홍=칼날']
    .forEach((t, i) => g.fillText(t, 8, layoutInfo.h - 130 + i * 14));
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
      else { clearT += dt; if (clearT > 0.35 && sim.peelFrac > 0.6) { clearT = 0; sim.clearCheck(); } if (sim.status === 'clear') finish('clear'); }
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
    $('danger').style.opacity = state === 'play' ? clamp(danger * 0.9, 0, 0.85) : 0;
    if (state === 'play') {
      const CAUSE = { self: '이미 벗긴 곳이에요! 아직 남은 껍질 쪽으로 가요', turn: '너무 급하게 꺾으면 껍질이 가늘어져요. 완만하게!', edge: '벗긴 가장자리에 너무 붙었어요. 조금 떨어져 가 보세요' };
      if (danger > 0.35 && ptr.mode === 'peel' && sim.cause) setTip(CAUSE[sim.cause], true);
      else if ($('tip').classList.contains('warn') && danger < 0.2 && ptr.mode === 'peel') setTip('좁게 붙어 갈수록 껍질이 길어져요. 넓게 가면 안전해요');
    }
  }
  Snd.loop(state === 'play' && ptr.mode === 'peel' ? pullSpeed : 0, state === 'play' && ptr.mode === 'peel' ? danger : 0);
  renderer.render(scene, camera); drawDebug();
}

/* ---------- 버튼 ---------- */
$('go').addEventListener('click', () => { Snd.init(); resetGame(); });
$('retry').addEventListener('click', () => { Snd.init(); resetGame(); });
const sb = $('snd'); function sndUi() { sb.textContent = Snd.on ? '🔊' : '🔇'; sb.classList.toggle('off', !Snd.on); }
sb.addEventListener('click', () => { Snd.on = !Snd.on; store.setSnd(Snd.on); sndUi(); Snd.init(); });
sndUi();
window.addEventListener('resize', layout);
layout(); resetGame(); state = 'ready'; $('start').classList.remove('hidden'); hud();
requestAnimationFrame(frame);

/* 검증/디버그용 (게임 동작에는 쓰이지 않음) */
window.PEEL_DEBUG = { sim, rib, get q() { return q; }, set q(v) { q = v; applyQuat(); }, camera, pxOf, knifeW, layoutInfo, get state() { return state; }, get danger() { return danger; }, strip, applyQuat, renderer, scene, peelMesh, surfaceDir, get spinSpeed() { return spinSpeed; }, ptr, queue, dbg, pickPeel, S };
})();

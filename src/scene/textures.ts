import * as THREE from 'three';
import type { BodyId } from '../data/bodies';

type RGB = [number, number, number];
type RGBA = [number, number, number, number];
type Shader = (lon: number, lat: number, x: number, y: number, z: number) => RGB | RGBA;

/* ---------- Шум на сфере (бесшовный по долготе) ---------- */

function hash3(x: number, y: number, z: number, seed: number): number {
  let h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(z | 0, 1274126177) ^
    Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mixc = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** Усиление контраста вокруг 0.5. */
const ct = (n: number): number => clamp01((n - 0.5) * 1.8 + 0.5);

function noise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);
  return lerp(
    lerp(lerp(c000, c100, u), lerp(c010, c110, u), v),
    lerp(lerp(c001, c101, u), lerp(c011, c111, u), v),
    w,
  );
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * freq, y * freq, z * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/* ---------- Генерация canvas-текстуры ---------- */

function makeCanvasTexture(w: number, h: number, shader: Shader): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-контекст canvas недоступен');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let j = 0; j < h; j++) {
    const lat = (0.5 - (j + 0.5) / h) * Math.PI;
    const cl = Math.cos(lat);
    const y = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = ((i + 0.5) / w - 0.5) * Math.PI * 2;
      const x = cl * Math.cos(lon);
      const z = cl * Math.sin(lon);
      const c = shader(lon, lat, x, y, z);
      const a = c.length === 4 ? c[3] : 255;
      const idx = (j * w + i) * 4;
      d[idx] = c[0];
      d[idx + 1] = c[1];
      d[idx + 2] = c[2];
      d[idx + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- Шейдеры поверхностей ---------- */

const sun: Shader = (_lon, _lat, x, y, z) => {
  const n = ct(fbm(x * 3, y * 3, z * 3, 21, 5));
  const g = fbm(x * 11, y * 11, z * 11, 23, 3);
  const t = clamp01(n * 0.8 + g * 0.35);
  return mixc([232, 108, 22], [255, 214, 120], t);
};

const mercury: Shader = (_lon, _lat, x, y, z) => {
  const n = ct(fbm(x * 3, y * 3, z * 3, 31, 5));
  const crater = sstep(0.62, 0.78, fbm(x * 12, y * 12, z * 12, 33, 2));
  const g = 104 + n * 70 - crater * 38;
  return [g, g * 0.97, g * 0.92];
};

const venus: Shader = (_lon, _lat, x, y, z) => {
  const warp = fbm(x * 2, y * 2, z * 2, 41, 3);
  const n = ct(fbm(x * 1.6 + warp * 1.6, y * 4 + warp, z * 1.6 + warp * 1.6, 43, 5));
  return mixc([200, 160, 98], [240, 214, 158], n);
};

const earth: Shader = (_lon, lat, x, y, z) => {
  const n = ct(fbm(x * 2.3 + 5, y * 2.3, z * 2.3, 1, 5));
  const al = Math.abs(lat);
  if (al + (n - 0.5) * 0.35 > 1.28) {
    const t = fbm(x * 8, y * 8, z * 8, 9, 3);
    return mixc([224, 233, 244], [248, 250, 253], t);
  }
  if (n > 0.56) {
    const e = clamp01((n - 0.56) / 0.3);
    const dry =
      sstep(0.45, 0.7, fbm(x * 3.1 + 20, y * 3.1, z * 3.1, 3, 4)) * sstep(0.15, 0.45, al) * (1 - sstep(0.7, 1.0, al));
    let c = mixc([58, 112, 60], [172, 150, 94], dry);
    c = mixc(c, [128, 112, 96], sstep(0.5, 1, e));
    c = mixc(c, [150, 160, 142], sstep(0.9, 1.15, al));
    return c;
  }
  const depth = clamp01((0.56 - n) / 0.3);
  return mixc([44, 118, 166], [6, 30, 82], sstep(0, 1, depth));
};

const earthClouds: Shader = (_lon, _lat, x, y, z) => {
  const a = sstep(0.52, 0.78, fbm(x * 2.8 + 40, y * 3.4, z * 2.8, 7, 5));
  return [255, 255, 255, a * 215];
};

const mars: Shader = (_lon, lat, x, y, z) => {
  const n = ct(fbm(x * 2.5, y * 2.5, z * 2.5, 51, 5));
  const fine = fbm(x * 10, y * 10, z * 10, 53, 3) - 0.5;
  let c = mixc([182, 98, 58], [118, 58, 40], sstep(0.4, 0.7, n));
  c = [c[0] + fine * 30, c[1] + fine * 22, c[2] + fine * 16];
  const cap = Math.abs(lat) + (n - 0.5) * 0.2;
  return mixc(c, [240, 235, 230], sstep(1.33, 1.42, cap));
};

const jupiter: Shader = (lon, lat, x, y, z) => {
  const warp = fbm(x * 2.2 + 3, y * 2.2, z * 2.2, 11, 4) - 0.5;
  const b1 = Math.sin(lat * 9 + warp * 3.2) * 0.5 + 0.5;
  const b2 = Math.sin(lat * 24 + warp * 5) * 0.5 + 0.5;
  const streak = fbm(x * 9, y * 1.6, z * 9, 13, 4) - 0.5;
  const v = clamp01(0.62 * b1 + 0.38 * b2 + streak * 0.35);
  let c: RGB =
    v < 0.5 ? mixc([140, 92, 60], [205, 160, 115], v * 2) : mixc([205, 160, 115], [236, 220, 190], (v - 0.5) * 2);
  let dl = lon - 0.9;
  dl = Math.atan2(Math.sin(dl), Math.cos(dl));
  const ex = (dl * Math.cos(lat)) / 0.2;
  const ey = (lat + 0.38) / 0.085;
  const d = ex * ex + ey * ey;
  if (d < 2) c = mixc(c, [176, 70, 46], sstep(2, 0.6, d));
  return c;
};

const saturn: Shader = (_lon, lat, x, y, z) => {
  const warp = fbm(x * 2, y * 2, z * 2, 61, 3) - 0.5;
  const b1 = Math.sin(lat * 12 + warp * 1.8) * 0.5 + 0.5;
  const b2 = Math.sin(lat * 30 + warp * 2.5) * 0.5 + 0.5;
  const v = clamp01(0.65 * b1 + 0.35 * b2 + (fbm(x * 8, y * 1.5, z * 8, 63, 3) - 0.5) * 0.2);
  return v < 0.5 ? mixc([168, 140, 100], [196, 168, 118], v * 2) : mixc([196, 168, 118], [228, 208, 162], (v - 0.5) * 2);
};

const uranus: Shader = (_lon, lat, x, y, z) => {
  const band = Math.sin(lat * 10) * 0.5 + 0.5;
  const n = fbm(x * 3, y * 1.5, z * 3, 71, 3) - 0.5;
  return mixc([138, 198, 206], [166, 220, 220], clamp01(band * 0.6 + 0.2 + n * 0.5));
};

const neptune: Shader = (_lon, lat, x, y, z) => {
  const warp = fbm(x * 2.4, y * 2.4, z * 2.4, 81, 3) - 0.5;
  const band = Math.sin(lat * 11 + warp * 2.5) * 0.5 + 0.5;
  let c = mixc([36, 66, 170], [64, 104, 210], band);
  const streak = sstep(0.6, 0.72, fbm(x * 6, y * 1.2, z * 6, 83, 4));
  c = mixc(c, [190, 210, 240], streak * 0.55);
  return c;
};

const SHADERS: Record<BodyId, Shader> = {
  sun,
  mercury,
  venus,
  earth,
  mars,
  jupiter,
  saturn,
  uranus,
  neptune,
};

const cache = new Map<string, THREE.CanvasTexture>();

export function getBodyTexture(id: BodyId, lowPower: boolean): THREE.CanvasTexture {
  const key = `${id}:${lowPower ? 'l' : 'h'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = lowPower ? 256 : 512;
  const tex = makeCanvasTexture(w, w / 2, SHADERS[id]);
  cache.set(key, tex);
  return tex;
}

export function getCloudTexture(lowPower: boolean): THREE.CanvasTexture {
  const key = `clouds:${lowPower ? 'l' : 'h'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = lowPower ? 256 : 512;
  const tex = makeCanvasTexture(w, w / 2, earthClouds);
  cache.set(key, tex);
  return tex;
}

/* ---------- Кольца Сатурна ---------- */

export function getRingTexture(): THREE.CanvasTexture {
  const hit = cache.get('ring');
  if (hit) return hit;
  const w = 512;
  const h = 4;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-контекст canvas недоступен');
  for (let i = 0; i < w; i++) {
    const r = i / (w - 1);
    let a = 0;
    if (r < 0.25) a = 0.25;
    else if (r < 0.62) a = 0.85;
    else if (r < 0.68) a = 0.05;
    else if (r < 0.97) a = 0.6;
    if (r > 0.89 && r < 0.91) a *= 0.12;
    if (r > 0.94) a *= clamp01((0.97 - r) / 0.03);
    const n = fbm(r * 60, 0.5, 0.5, 91, 3);
    a *= 0.7 + 0.3 * n;
    const c = mixc([170, 146, 108], [226, 206, 166], n);
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp01(a).toFixed(3)})`;
    ctx.fillRect(i, 0, 1, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('ring', tex);
  return tex;
}

/** RingGeometry с UV по радиусу — чтобы градиентная текстура шла от внутреннего края к внешнему. */
export function makeRingGeometry(inner: number, outer: number, segments: number): THREE.RingGeometry {
  const g = new THREE.RingGeometry(inner, outer, segments, 1);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  return g;
}

/* ---------- Свечение Солнца ---------- */

export function getGlowTexture(): THREE.CanvasTexture {
  const hit = cache.get('glow');
  if (hit) return hit;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-контекст canvas недоступен');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,200,120,1)');
  g.addColorStop(0.25, 'rgba(255,160,70,0.45)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('glow', tex);
  return tex;
}

import { useEffect, useMemo, useRef } from 'react';
import type { ElementRef, MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BODY_BY_ID, PLANETS } from '../data/bodies';
import type { Body, BodyId } from '../data/bodies';
import { clock, orbitAngle, publishClock, spinAngle } from '../sim/clock';
import { getBodyTexture, getCloudTexture, getGlowTexture, getRingTexture, makeRingGeometry } from './textures';

const ACCENT = '#9fd8cf';
const HOME_POS = new THREE.Vector3(0, 46, 88);
const ORIGIN = new THREE.Vector3(0, 0, 0);

type Registry = MutableRefObject<Map<BodyId, THREE.Object3D>>;

export interface SolarSceneProps {
  selectedId: BodyId | null;
  onSelect: (id: BodyId) => void;
  paused: boolean;
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  homeToken: number;
  lowPower: boolean;
  reducedMotion: boolean;
  onFail: () => void;
}

/* ---------- Часы модели ---------- */

function ClockDriver({ paused, speed }: { paused: boolean; speed: number }) {
  const acc = useRef(0);
  useFrame((_, delta) => {
    if (document.hidden) return;
    const dt = Math.min(delta, 0.1);
    if (!paused) clock.days += dt * speed;
    acc.current += dt;
    if (acc.current > 0.2) {
      acc.current = 0;
      publishClock();
    }
  });
  return null;
}

/* ---------- Выбор объекта ---------- */

function usePick(id: BodyId, onSelect: (id: BodyId) => void) {
  return useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4) return; // это было перетаскивание, а не клик
        e.stopPropagation();
        onSelect(id);
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
      },
    }),
    [id, onSelect],
  );
}

function Label({ body, selected, onSelect, y }: { body: Body; selected: boolean; onSelect: (id: BodyId) => void; y: number }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[6, 0]}>
      <div className="scene-label" data-selected={selected} aria-hidden="true" onClick={() => onSelect(body.id)}>
        {body.name}
      </div>
    </Html>
  );
}

/* ---------- Атмосферное свечение (стилизованный fresnel) ---------- */

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.2);
    gl_FragColor = vec4(uColor * f * uIntensity, f * uIntensity);
  }
`;

function Atmosphere({ radius, color, intensity, scale, segments }: { radius: number; color: string; intensity: number; scale: number; segments: number }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } }),
    [color, intensity],
  );
  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[radius * scale, segments, segments]} />
      <shaderMaterial
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ---------- Пульсирующая рамка выбранного тела ---------- */

function SelectionRing({ radius, reducedMotion }: { radius: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const camera = useThree((s) => s.camera);

  useFrame(({ clock: three }) => {
    const m = ref.current;
    if (!m) return;
    m.quaternion.copy(camera.quaternion);
    const t = reducedMotion ? 0 : three.elapsedTime;
    const pulse = Math.sin(t * 2.6);
    m.scale.setScalar(1 + pulse * 0.05);
    if (mat.current) mat.current.opacity = 0.55 + pulse * 0.2;
  });

  return (
    <mesh ref={ref} raycast={() => null} renderOrder={5}>
      <ringGeometry args={[radius, radius * 1.045, 96]} />
      <meshBasicMaterial ref={mat} color={ACCENT} transparent opacity={0.6} depthTest={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ---------- Луна (декоративный элемент у Земли) ---------- */

const MOON_PERIOD_DAYS = 27.3;

function Moon({ lowPower }: { lowPower: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const map = useMemo(() => getBodyTexture('mercury', lowPower), [lowPower]);
  useFrame(() => {
    const a = (Math.PI * 2 * clock.days) / MOON_PERIOD_DAYS;
    if (ref.current) ref.current.position.set(Math.cos(a) * 2.2, 0.15, -Math.sin(a) * 2.2);
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[0.27, lowPower ? 16 : 24, lowPower ? 16 : 24]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

/* ---------- Солнце ---------- */

function Sun({
  selected,
  showLabel,
  lowPower,
  reducedMotion,
  onSelect,
}: {
  selected: boolean;
  showLabel: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
  onSelect: (id: BodyId) => void;
}) {
  const body = BODY_BY_ID.sun;
  const mesh = useRef<THREE.Mesh>(null);
  const glowA = useRef<THREE.Sprite>(null);
  const glowB = useRef<THREE.Sprite>(null);
  const map = useMemo(() => getBodyTexture('sun', lowPower), [lowPower]);
  const glow = useMemo(() => getGlowTexture(), []);
  const pick = usePick('sun', onSelect);
  const seg = lowPower ? 40 : 64;

  useFrame(({ clock: three }) => {
    if (mesh.current) mesh.current.rotation.y = spinAngle(body, clock.days);
    const t = reducedMotion ? 0 : three.elapsedTime;
    if (glowA.current) glowA.current.scale.setScalar(22 + Math.sin(t * 0.9) * 1.2);
    if (glowB.current) glowB.current.scale.setScalar(40 + Math.sin(t * 0.55 + 1.3) * 3);
  });

  return (
    <group>
      <pointLight color="#fff1dc" intensity={3.2} decay={0} />
      <mesh ref={mesh} {...pick}>
        <sphereGeometry args={[body.visual.radius, seg, seg]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <sprite ref={glowA} scale={[22, 22, 1]} raycast={() => null}>
        <spriteMaterial map={glow} transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite ref={glowB} scale={[40, 40, 1]} raycast={() => null}>
        <spriteMaterial map={glow} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      {selected && <SelectionRing radius={body.visual.radius * 1.45} reducedMotion={reducedMotion} />}
      {showLabel && <Label body={body} selected={selected} onSelect={onSelect} y={body.visual.radius + 1.6} />}
    </group>
  );
}

/* ---------- Планета ---------- */

function Planet({
  body,
  registry,
  selected,
  showLabel,
  lowPower,
  reducedMotion,
  onSelect,
}: {
  body: Body;
  registry: Registry;
  selected: boolean;
  showLabel: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
  onSelect: (id: BodyId) => void;
}) {
  const v = body.visual;
  const pivot = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const map = useMemo(() => getBodyTexture(body.id, lowPower), [body.id, lowPower]);
  const cloudMap = useMemo(() => (body.id === 'earth' ? getCloudTexture(lowPower) : null), [body.id, lowPower]);
  const ringMap = useMemo(() => (v.hasRings ? getRingTexture() : null), [v.hasRings]);
  const ringGeo = useMemo(
    () => (v.hasRings ? makeRingGeometry(v.radius * 1.25, v.radius * 2.3, lowPower ? 64 : 128) : null),
    [v.hasRings, v.radius, lowPower],
  );
  const initial = useMemo<[number, number, number]>(() => {
    const a = orbitAngle(body, clock.days);
    return [Math.cos(a) * v.orbitRadius, 0, -Math.sin(a) * v.orbitRadius];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);
  const pick = usePick(body.id, onSelect);
  const seg = lowPower ? 32 : 56;
  const tilt = (body.axialTiltDeg * Math.PI) / 180;
  const hitRadius = Math.max(v.radius * 1.15, 0.9);

  useEffect(() => {
    const obj = pivot.current;
    if (!obj) return;
    const map_ = registry.current;
    map_.set(body.id, obj);
    return () => {
      map_.delete(body.id);
    };
  }, [body.id, registry]);

  useEffect(() => {
    return () => {
      ringGeo?.dispose();
    };
  }, [ringGeo]);

  useFrame(() => {
    const d = clock.days;
    const a = orbitAngle(body, d);
    if (pivot.current) pivot.current.position.set(Math.cos(a) * v.orbitRadius, 0, -Math.sin(a) * v.orbitRadius);
    const s = spinAngle(body, d);
    if (mesh.current) mesh.current.rotation.y = s;
    if (clouds.current) clouds.current.rotation.y = s * 1.08;
  });

  return (
    <group ref={pivot} position={initial}>
      <group rotation={[0, 0, tilt]}>
        <mesh ref={mesh}>
          <sphereGeometry args={[v.radius, seg, seg]} />
          <meshStandardMaterial
            map={map}
            bumpMap={v.bump ? map : null}
            bumpScale={v.bump ?? 0}
            roughness={body.id === 'earth' ? 0.6 : 0.9}
            metalness={0}
          />
        </mesh>
        {v.atmosphere && (
          <Atmosphere
            radius={v.radius}
            color={v.atmosphere.color}
            intensity={v.atmosphere.intensity}
            scale={v.atmosphere.scale}
            segments={lowPower ? 32 : 48}
          />
        )}
        {cloudMap && (
          <mesh ref={clouds}>
            <sphereGeometry args={[v.radius * 1.018, seg, seg]} />
            <meshStandardMaterial map={cloudMap} transparent depthWrite={false} roughness={1} />
          </mesh>
        )}
        {ringGeo && ringMap && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} {...pick}>
            <primitive object={ringGeo} attach="geometry" />
            <meshStandardMaterial map={ringMap} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
          </mesh>
        )}
        <mesh {...pick}>
          <sphereGeometry args={[hitRadius, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {body.id === 'earth' && <Moon lowPower={lowPower} />}
      {selected && <SelectionRing radius={Math.max(v.radius * (v.hasRings ? 2.6 : 1.7), 1.2)} reducedMotion={reducedMotion} />}
      {showLabel && <Label body={body} selected={selected} onSelect={onSelect} y={v.radius * (v.hasRings ? 1.9 : 1) + 1.1} />}
    </group>
  );
}

/* ---------- Орбиты ---------- */

function OrbitLine({ radius, selected, visible }: { radius: number; selected: boolean; visible: boolean }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 192;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <lineLoop geometry={geo} visible={visible}>
      <lineBasicMaterial color={selected ? ACCENT : '#6b7788'} transparent opacity={selected ? 0.75 : 0.3} />
    </lineLoop>
  );
}

/* ---------- Звёзды ---------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Starfield({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!reducedMotion && group.current && !document.hidden) group.current.rotation.y += Math.min(delta, 0.1) * 0.004;
  });

  const geo = useMemo(() => {
    const rnd = mulberry32(1234);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 350 + rnd() * 250;
      pos[i * 3] = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
      const b = 0.45 + rnd() * 0.55;
      const warm = rnd();
      col[i * 3] = b * (0.85 + warm * 0.15);
      col[i * 3 + 1] = b * 0.92;
      col[i * 3 + 2] = b * (1 - warm * 0.15);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <primitive object={geo} attach="geometry" />
        <pointsMaterial size={1.4} sizeAttenuation={false} vertexColors transparent opacity={0.85} depthWrite={false} />
      </points>
    </group>
  );
}

/* ---------- Камера ---------- */

function CameraRig({
  selectedId,
  homeToken,
  registry,
  reducedMotion,
}: {
  selectedId: BodyId | null;
  homeToken: number;
  registry: Registry;
  reducedMotion: boolean;
}) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  // При старте камера плавно «влетает» в общий вид (без анимации при уменьшенном движении).
  const mode = useRef<'free' | 'focus' | 'home'>(reducedMotion ? 'free' : 'home');
  const zoomAnim = useRef(false);
  const desiredDist = useRef(20);
  const selRef = useRef<BodyId | null>(selectedId);
  selRef.current = selectedId;
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (selectedId) {
      mode.current = 'focus';
      zoomAnim.current = true;
      const b = BODY_BY_ID[selectedId];
      desiredDist.current = Math.max(b.visual.radius * 4.2, 6);
      if (controls.current) controls.current.minDistance = Math.min(b.visual.radius * 1.8, 9);
    } else if (mode.current === 'focus') {
      mode.current = 'free';
    }
  }, [selectedId]);

  useEffect(() => {
    if (homeToken === 0) return;
    mode.current = 'home';
    zoomAnim.current = false;
    if (controls.current) controls.current.minDistance = 9;
  }, [homeToken]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const dt = Math.min(delta, 0.1);
    const k = reducedMotion ? 1 : 1 - Math.exp(-5 * dt);
    const kHome = reducedMotion ? 1 : 1 - Math.exp(-2.6 * dt);

    if (mode.current === 'focus' && selRef.current) {
      const obj = registry.current.get(selRef.current);
      if (obj) {
        obj.getWorldPosition(tmp);
        tmp.sub(c.target).multiplyScalar(k);
        c.target.add(tmp);
        camera.position.add(tmp);
      }
      if (zoomAnim.current) {
        offset.copy(camera.position).sub(c.target);
        const dist = offset.length();
        offset.setLength(dist + (desiredDist.current - dist) * k);
        camera.position.copy(c.target).add(offset);
        if (Math.abs(desiredDist.current - dist) < 0.05) zoomAnim.current = false;
      }
    } else if (mode.current === 'home') {
      c.target.lerp(ORIGIN, kHome);
      camera.position.lerp(HOME_POS, kHome);
      if (c.target.length() < 0.02 && camera.position.distanceTo(HOME_POS) < 0.1) {
        c.target.set(0, 0, 0);
        camera.position.copy(HOME_POS);
        mode.current = 'free';
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={9}
      maxDistance={180}
      onStart={() => {
        zoomAnim.current = false;
        if (mode.current === 'home') mode.current = 'free';
      }}
    />
  );
}

/* ---------- Сцена ---------- */

export default function SolarScene(props: SolarSceneProps) {
  const { selectedId, onSelect, paused, speed, showOrbits, showLabels, homeToken, lowPower, reducedMotion, onFail } = props;
  const registry = useRef<Map<BodyId, THREE.Object3D>>(new Map());

  return (
    <Canvas
      flat
      dpr={[1, lowPower ? 1.5 : 2]}
      camera={{
        position: reducedMotion ? [HOME_POS.x, HOME_POS.y, HOME_POS.z] : [0, 120, 200],
        fov: 45,
        near: 0.1,
        far: 1500,
      }}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onFail();
        });
      }}
    >
      <color attach="background" args={['#030509']} />
      <ClockDriver paused={paused} speed={speed} />
      <ambientLight intensity={0.15} />
      <Starfield count={lowPower ? 900 : 1800} reducedMotion={reducedMotion} />
      <Sun selected={selectedId === 'sun'} showLabel={showLabels} lowPower={lowPower} reducedMotion={reducedMotion} onSelect={onSelect} />
      {PLANETS.map((b) => (
        <OrbitLine key={`o-${b.id}`} radius={b.visual.orbitRadius} selected={selectedId === b.id} visible={showOrbits} />
      ))}
      {PLANETS.map((b) => (
        <Planet
          key={b.id}
          body={b}
          registry={registry}
          selected={selectedId === b.id}
          showLabel={showLabels}
          lowPower={lowPower}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
        />
      ))}
      <CameraRig selectedId={selectedId} homeToken={homeToken} registry={registry} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

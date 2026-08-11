'use client';

import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── Astronomical Database ────────────────────────────────────────────────────
interface CelestialData {
  name: string;
  type: string;
  radius: number;
  distance: number;
  speed: number;
  color: string;
  url: string;
  hasRings?: boolean;
  mass: string;
  classification: string;
  atmosphere: string;
  description: string;
  facts: string[];
}

const CELESTIAL_DB: Record<string, CelestialData> = {
  Sun: {
    name: 'Sun', type: 'Star', radius: 9, distance: 0, speed: 0, color: '#ffcc00',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg',
    mass: '1.989 × 10³⁰ kg', classification: 'Yellow Dwarf (G2V)',
    atmosphere: '73% Hydrogen, 25% Helium',
    description: 'The blazing heart of our solar system, powering all life on Earth through nuclear fusion at its core.',
    facts: ['Core temperature reaches 15 million °C.', 'Contains 99.86% of all solar system mass.', 'Light takes 8 min 20 sec to reach Earth.']
  },
  Mercury: {
    name: 'Mercury', type: 'Planet', radius: 0.9, distance: 20, speed: 0.02, color: '#8c8c8c',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/mercurymap.jpg',
    mass: '3.285 × 10²³ kg', classification: 'Inner Terrestrial',
    atmosphere: 'Ultra-thin Exosphere (Oxygen, Sodium)',
    description: 'The smallest and fastest planet in our solar system, with extreme temperature swings.',
    facts: ['Closest planet to the Sun.', 'Temperature swings from -180°C to +430°C.', 'No natural moons or rings.']
  },
  Venus: {
    name: 'Venus', type: 'Planet', radius: 1.6, distance: 30, speed: 0.015, color: '#e6ccb3',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/venusmap.jpg',
    mass: '4.867 × 10²⁴ kg', classification: 'Runaway Greenhouse World',
    atmosphere: '96.5% CO₂, Dense Sulfuric Acid Clouds',
    description: "Earth's twin in size but a scorching inferno with the hottest surface in the solar system.",
    facts: ['Hottest planet (465°C average).', 'Rotates backwards relative to most planets.', 'Atmospheric pressure 92× Earth\'s.']
  },
  Earth: {
    name: 'Earth', type: 'Planet', radius: 1.8, distance: 42, speed: 0.01, color: '#2b82c9',
    url: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    mass: '5.972 × 10²⁴ kg', classification: 'Habitable Ocean World',
    atmosphere: '78% Nitrogen, 21% Oxygen',
    description: 'Our blue marble — the only known world with liquid oceans, a rich atmosphere, and abundant life.',
    facts: ['Only planet known to harbor life.', '71% of surface covered in liquid water.', 'Protected by a strong magnetic field.']
  },
  Mars: {
    name: 'Mars', type: 'Planet', radius: 1.1, distance: 56, speed: 0.008, color: '#c1440e',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/marsmap1k.jpg',
    mass: '6.39 × 10²³ kg', classification: 'Red Desert Planet',
    atmosphere: '95% CO₂, 2.6% Nitrogen',
    description: 'The rust-red desert world with towering extinct volcanoes and valleys stretching thousands of kilometers.',
    facts: ['Home to Olympus Mons, the tallest volcano in the solar system.', 'Has frozen polar ice caps.', 'Primary target for human colonization.']
  },
  Jupiter: {
    name: 'Jupiter', type: 'Planet', radius: 5.5, distance: 80, speed: 0.004, color: '#c88b3a',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/jupitermap.jpg',
    mass: '1.898 × 10²⁷ kg', classification: 'Gas Giant',
    atmosphere: '89% Hydrogen, 10% Helium',
    description: 'A colossal world of storm bands and the Great Red Spot, a storm larger than Earth that has raged for centuries.',
    facts: ['Largest planet in the solar system.', 'Great Red Spot storm is larger than Earth.', 'Has 95+ confirmed moons.']
  },
  Saturn: {
    name: 'Saturn', type: 'Planet', radius: 4.5, distance: 108, speed: 0.003, color: '#e3d2a4',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/saturnmap.jpg',
    hasRings: true,
    mass: '5.683 × 10²⁶ kg', classification: 'Ringed Gas Giant',
    atmosphere: '96% Hydrogen, 3% Helium',
    description: 'The jewel of the solar system, adorned with magnificent ice and rock ring structures spanning hundreds of thousands of km.',
    facts: ['Rings are primarily made of ice and rock.', 'Less dense than water — it could float.', 'Moon Titan has liquid methane lakes.']
  },
  Uranus: {
    name: 'Uranus', type: 'Planet', radius: 3.2, distance: 138, speed: 0.002, color: '#7de8e8',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/uranusmap.jpg',
    mass: '8.681 × 10²⁵ kg', classification: 'Tilted Ice Giant',
    atmosphere: '83% H₂, 15% He, 2% Methane',
    description: 'An icy cyan world tilted completely on its side, experiencing extreme 42-year long seasonal cycles.',
    facts: ['Rotates at an extreme 98° axial tilt.', 'Atmospheric methane gives it cyan color.', 'Coldest planetary atmosphere (-224°C).']
  },
  Neptune: {
    name: 'Neptune', type: 'Planet', radius: 3.0, distance: 164, speed: 0.001, color: '#274687',
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/neptunemap.jpg',
    mass: '1.024 × 10²⁶ kg', classification: 'Deep Blue Ice Giant',
    atmosphere: '80% H₂, 19% He, 1% Methane',
    description: 'The most distant planet, lashed by supersonic winds and orbiting on the outer frontier of the solar system.',
    facts: ['Fastest winds recorded: up to 2,100 km/h.', 'Takes 165 Earth years per orbit.', 'Discovered through mathematics before telescopes confirmed it.']
  },
  Gargantua: {
    name: 'Gargantua', type: 'Supermassive Black Hole', radius: 16, distance: 0, speed: 0, color: '#000000',
    url: '',
    mass: '100 Million Solar Masses', classification: 'Kerr Rotating Singularity',
    atmosphere: 'Relativistic Plasma & Gravitational Lensing',
    description: 'A supermassive rotating black hole with a blazing accretion disk. Time dilation near the event horizon is extreme — 1 hour equals 7 years elsewhere.',
    facts: ['Event horizon swallows light itself.', 'Accretion disk glows at millions of degrees.', 'Gravitational time dilation distorts spacetime.']
  },
};

const PLANET_KEYS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

// ─── Planet Component ─────────────────────────────────────────────────────────
function Planet({ data, onFocus }: { data: CelestialData; onFocus: (name: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const texture = useLoader(THREE.TextureLoader, data.url) as THREE.Texture;

  useFrame((_, delta) => {
    angleRef.current += data.speed * 8 * delta;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * data.distance;
      groupRef.current.position.z = Math.sin(angleRef.current) * data.distance;
    }
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={groupRef} onClick={e => { e.stopPropagation(); onFocus(data.name); }}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[data.radius, 48, 48]} />
        <meshStandardMaterial map={texture} roughness={0.75} metalness={0.1} />
      </mesh>
      {data.hasRings && (
        <mesh rotation={[Math.PI / 2.3, 0.15, 0]}>
          <ringGeometry args={[data.radius * 1.5, data.radius * 2.7, 80]} />
          <meshStandardMaterial color="#e3d2a4" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
      )}
      <Html distanceFactor={data.distance * 1.6}>
        <div className="text-white text-xs px-2 py-0.5 bg-black/60 border border-white/20 rounded pointer-events-none whitespace-nowrap backdrop-blur-sm">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

// ─── Sun Component ────────────────────────────────────────────────────────────
function Sun({ onFocus }: { onFocus: (name: string) => void }) {
  const tex = useLoader(THREE.TextureLoader, CELESTIAL_DB.Sun.url) as THREE.Texture;
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => { if (meshRef.current) meshRef.current.rotation.y += d * 0.08; });

  return (
    <group onClick={e => { e.stopPropagation(); onFocus('Sun'); }}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[9, 64, 64]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh><sphereGeometry args={[9.8, 64, 64]} /><meshBasicMaterial color="#ffaa00" transparent opacity={0.25} blending={THREE.AdditiveBlending} /></mesh>
      <mesh><sphereGeometry args={[11, 64, 64]} /><meshBasicMaterial color="#ff5500" transparent opacity={0.1} blending={THREE.AdditiveBlending} /></mesh>
      <Html distanceFactor={30}><div className="text-amber-300 font-bold text-xs px-2 py-0.5 bg-black/60 border border-amber-500/40 rounded pointer-events-none whitespace-nowrap">☀ Sun</div></Html>
    </group>
  );
}

// ─── Gargantua Black Hole ─────────────────────────────────────────────────────
function GargantuaBlackHole({ onFocus }: { onFocus: (name: string) => void }) {
  const innerDisk = useRef<THREE.Mesh>(null!);
  const outerDisk = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (innerDisk.current) innerDisk.current.rotation.z += d * 0.4;
    if (outerDisk.current) outerDisk.current.rotation.z -= d * 0.2;
  });

  return (
    <group position={[320, 25, -120]} onClick={e => { e.stopPropagation(); onFocus('Gargantua'); }}>
      {/* Event horizon */}
      <mesh><sphereGeometry args={[16, 64, 64]} /><meshBasicMaterial color="#000000" /></mesh>
      {/* Inner halo */}
      <mesh><sphereGeometry args={[17, 64, 64]} /><meshBasicMaterial color="#ff8800" transparent opacity={0.5} blending={THREE.AdditiveBlending} /></mesh>
      {/* Accretion disk — inner */}
      <mesh ref={innerDisk} rotation={[Math.PI / 2.8, 0, 0]}>
        <ringGeometry args={[18, 45, 128]} />
        <meshBasicMaterial color="#ffcc44" side={THREE.DoubleSide} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Accretion disk — outer glow */}
      <mesh ref={outerDisk} rotation={[Math.PI / 2.8, 0, 0]}>
        <ringGeometry args={[45, 70, 128]} />
        <meshBasicMaterial color="#ff4400" side={THREE.DoubleSide} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html distanceFactor={300}><div className="text-amber-400 font-mono text-xs px-3 py-1 bg-black/80 border border-amber-500/40 rounded pointer-events-none whitespace-nowrap shadow-[0_0_15px_rgba(255,170,0,0.5)]">🕳 Gargantua Black Hole</div></Html>
    </group>
  );
}

// ─── Nebula Cosmic Dust ───────────────────────────────────────────────────────
function NebulaDust() {
  const points = useRef<THREE.Points>(null!);
  const count = 3000;
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.3;
      arr[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      arr[i * 3 + 1] = r * Math.sin(phi) * 60;
      arr[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    return arr;
  }, []);

  const colors = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    const palette = [[0.3, 0.7, 1.0], [1.0, 0.4, 0.6], [0.5, 1.0, 0.8]];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      arr[i * 3] = c[0]; arr[i * 3 + 1] = c[1]; arr[i * 3 + 2] = c[2];
    }
    return arr;
  }, []);

  useFrame((_, d) => { if (points.current) points.current.rotation.y += d * 0.01; });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.8} vertexColors transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── Orbit Paths ──────────────────────────────────────────────────────────────
function OrbitPaths() {
  return (
    <group>
      {PLANET_KEYS.map((k, i) => {
        const d = CELESTIAL_DB[k].distance;
        const pts: THREE.Vector3[] = [];
        for (let j = 0; j <= 128; j++) {
          const a = (j / 128) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.4 });
        return <primitive key={i} object={new THREE.Line(geom, mat)} />;
      })}
    </group>
  );
}

// ─── Cinematic Camera ─────────────────────────────────────────────────────────
function CinematicCamera({ focus }: { focus: string | null }) {
  const ref = useRef<CameraControls>(null!);
  const initialized = useRef(false);
  const prevFocus = useRef<string | null>(null);

  useFrame(() => {
    if (!ref.current) return;
    if (!initialized.current) {
      initialized.current = true;
      ref.current.setLookAt(0, 900, 1600, 0, 0, 0, false);
      setTimeout(() => ref.current?.setLookAt(0, 180, 280, 0, 0, 0, true), 800);
      return;
    }
    if (prevFocus.current === focus) return;
    prevFocus.current = focus;

    if (!focus) {
      ref.current.setLookAt(0, 180, 280, 0, 0, 0, true);
    } else if (focus === 'Gargantua') {
      ref.current.setLookAt(320, 80, 0, 320, 25, -120, true);
    } else if (CELESTIAL_DB[focus]) {
      const p = CELESTIAL_DB[focus];
      const dist = p.distance;
      const offset = p.radius * 5 + 10;
      ref.current.setLookAt(dist + offset, p.radius * 2, dist + offset, dist, 0, dist, true);
    }
  });

  return <CameraControls ref={ref} maxDistance={2800} minDistance={5} smoothTime={0.9} />;
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
function Scene({ focus, onFocus }: { focus: string | null; onFocus: (n: string) => void }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]} intensity={4} color="#ffcc88" distance={700} />
      <Suspense fallback={null}>
        <Sun onFocus={onFocus} />
        <GargantuaBlackHole onFocus={onFocus} />
        <NebulaDust />
        <OrbitPaths />
        {PLANET_KEYS.map(k => <Planet key={k} data={CELESTIAL_DB[k]} onFocus={onFocus} />)}
        <Stars radius={500} depth={100} count={14000} factor={5} saturation={0.1} fade speed={0.6} />
        <CinematicCamera focus={focus} />
      </Suspense>
    </>
  );
}

// ─── Cookie Banner ────────────────────────────────────────────────────────────
function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('3dvision_cookie')) setVisible(true);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-black/90 border border-white/20 backdrop-blur-xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      <p className="text-xs text-slate-300 leading-relaxed">
        🍪 We use cookies & Google AdSense (<code className="text-cyan-400">ca-pub-6751037211810646</code>) to personalize content. See our{' '}
        <a href="/privacy" className="text-cyan-400 underline">Privacy Policy</a>.
      </p>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => { localStorage.setItem('3dvision_cookie', '1'); setVisible(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition">Accept All</button>
        <button onClick={() => setVisible(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl transition">Decline</button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SolarSystem() {
  const [focus, setFocus] = useState<string | null>(null);
  const selected = focus ? CELESTIAL_DB[focus] : null;

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden select-none">
      {/* WebGL Canvas */}
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 900, 1600], fov: 42 }} gl={{ antialias: true }}>
        <Scene focus={focus} onFocus={setFocus} />
      </Canvas>

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 p-5 z-10 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-black/70 border border-white/10 backdrop-blur-xl rounded-2xl px-5 py-3">
          <div className="text-xl font-extrabold text-white tracking-widest flex items-center gap-2">
            <span className="text-cyan-400">⚛</span> 3D VISION
            <span className="text-xs font-mono px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg">INTERSTELLAR</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">Cinematic Universe Explorer</div>
        </div>

        {/* Scope Switcher */}
        <div className="pointer-events-auto flex gap-2 bg-black/70 border border-white/10 backdrop-blur-xl p-2 rounded-2xl">
          {[
            { key: null, label: '☀ Solar System', active: !focus },
            { key: 'Gargantua', label: '🕳 Gargantua', active: focus === 'Gargantua' },
          ].map(({ key, label, active }) => (
            <button
              key={String(key)}
              onClick={() => setFocus(key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${active ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(79,165,255,0.7)]' : 'text-slate-300 hover:bg-white/10'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Science HUD Panel ── */}
      {selected && (
        <div className="absolute left-5 top-24 w-80 z-20 bg-black/85 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-5 text-white shadow-[0_0_30px_rgba(0,0,0,0.9)]">
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">{selected.type}</span>
              <h2 className="text-xl font-bold">{selected.name}</h2>
            </div>
            <button onClick={() => setFocus(null)} className="text-slate-400 hover:text-white text-lg leading-none mt-1">✕</button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">{selected.description}</p>
          <div className="space-y-2 text-xs mb-4">
            {[['Classification', selected.classification, 'text-cyan-300'], ['Mass', selected.mass, 'text-amber-300'], ['Atmosphere', selected.atmosphere, 'text-slate-200']].map(([k, v, cls]) => (
              <div key={k} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">{k}</span>
                <span className={`font-mono ${cls} text-right max-w-[55%]`}>{v}</span>
              </div>
            ))}
          </div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Key Facts</h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {selected.facts.map((f, i) => (
              <li key={i} className="flex gap-2 items-start"><span className="text-cyan-400 shrink-0">•</span>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Bottom Selector Bar ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="flex gap-1.5 overflow-x-auto bg-black/80 border border-white/10 backdrop-blur-xl p-2 rounded-2xl max-w-[96vw]">
          <button onClick={() => setFocus('Sun')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focus === 'Sun' ? 'bg-amber-500 text-black font-bold' : 'text-slate-300 hover:bg-white/10'}`}>☀ Sun</button>
          {PLANET_KEYS.map(k => (
            <button key={k} onClick={() => setFocus(k)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focus === k ? 'bg-cyan-600 text-white font-bold shadow-[0_0_10px_rgba(79,165,255,0.7)]' : 'text-slate-300 hover:bg-white/10'}`}>{k}</button>
          ))}
          <button onClick={() => setFocus('Gargantua')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focus === 'Gargantua' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'}`}>🕳 Gargantua</button>
        </div>
      </div>

      <CookieBanner />
    </div>
  );
}

'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

export interface CelestialData {
  name: string;
  type: string;
  radius: number;
  distance: number;
  speed: number;
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
    name: 'Sun',
    type: 'Star',
    radius: 9,
    distance: 0,
    speed: 0.002,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg',
    mass: '1.989 × 10³⁰ kg (333,000 Earths)',
    classification: 'Yellow Dwarf (G2V)',
    atmosphere: 'Hydrogen 73%, Helium 25%',
    description: 'The luminous heart of our solar system, powering life on Earth through nuclear fusion.',
    facts: [
      'Core temperature reaches 15 million °C.',
      'Contains 99.86% of the solar system mass.',
      'Surface light takes 8 minutes 20 seconds to reach Earth.'
    ]
  },
  Mercury: {
    name: 'Mercury',
    type: 'Terrestrial Planet',
    radius: 0.8,
    distance: 18,
    speed: 0.02,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/mercurymap.jpg',
    mass: '3.285 × 10²³ kg',
    classification: 'Inner Terrestrial',
    atmosphere: 'Ultra-thin Exosphere (Oxygen, Sodium)',
    description: 'The smallest planet in the solar system, featuring extreme temperature variations.',
    facts: [
      'Closest planet to the Sun.',
      'Temperatures range from -180°C to 430°C.',
      'No natural moons or rings.'
    ]
  },
  Venus: {
    name: 'Venus',
    type: 'Terrestrial Planet',
    radius: 1.5,
    distance: 26,
    speed: 0.015,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/venusmap.jpg',
    mass: '4.867 × 10²⁴ kg',
    classification: 'Runaway Greenhouse',
    atmosphere: '96.5% Carbon Dioxide, Dense Sulfuric Acid Clouds',
    description: 'Earth’s twin in size, but a scorching inferno dominated by toxic runaway greenhouse effects.',
    facts: [
      'Hottest planet in our solar system (465°C average).',
      'Rotates backwards relative to most planets.',
      'Atmospheric pressure is 92 times greater than Earth.'
    ]
  },
  Earth: {
    name: 'Earth',
    type: 'Terrestrial Planet',
    radius: 2,
    distance: 36,
    speed: 0.01,
    url: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    mass: '5.972 × 10²⁴ kg',
    classification: 'Habitable World',
    atmosphere: '78% Nitrogen, 21% Oxygen, 1% Argon',
    description: 'Our blue marble—the only known cradle of liquid oceans and complex life in the cosmos.',
    facts: [
      'Only planet known to harbor living organisms.',
      '71% of surface covered in liquid water.',
      'Protected by a strong magnetosphere.'
    ]
  },
  Mars: {
    name: 'Mars',
    type: 'Terrestrial Planet',
    radius: 1.2,
    distance: 48,
    speed: 0.008,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/marsmap1k.jpg',
    mass: '6.39 × 10²³ kg',
    classification: 'Red Planet',
    atmosphere: '95% Carbon Dioxide, 2.6% Nitrogen',
    description: 'The rust-colored desert world boasting gigantic extinct volcanoes and deep canyons.',
    facts: [
      'Home to Olympus Mons, the solar system’s tallest volcano.',
      'Contains frozen polar ice caps of water and CO₂.',
      'Primary target for human interplanetary colonization.'
    ]
  },
  Jupiter: {
    name: 'Jupiter',
    type: 'Gas Giant',
    radius: 5.2,
    distance: 68,
    speed: 0.004,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/jupitermap.jpg',
    mass: '1.898 × 10²⁷ kg (318 Earths)',
    classification: 'Gas Giant System',
    atmosphere: '89% Hydrogen, 10% Helium',
    description: 'A giant world of storm bands featuring the ancient Great Red Spot super-storm.',
    facts: [
      'Largest planet in the solar system.',
      'Great Red Spot storm is bigger than Earth.',
      'Has over 95 confirmed moons including Europa and Ganymede.'
    ]
  },
  Saturn: {
    name: 'Saturn',
    type: 'Gas Giant',
    radius: 4.2,
    distance: 92,
    speed: 0.003,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/saturnmap.jpg',
    hasRings: true,
    mass: '5.683 × 10²⁶ kg',
    classification: 'Ringed Gas Giant',
    atmosphere: '96% Hydrogen, 3% Helium',
    description: 'Adorned with spectacular ice and rock ring structures spanning thousands of kilometers.',
    facts: [
      'Ring system is made primarily of ice particles and rock debris.',
      'Less dense than water—it could float in a large ocean.',
      'Moon Titan possesses lakes of liquid methane.'
    ]
  },
  Uranus: {
    name: 'Uranus',
    type: 'Ice Giant',
    radius: 3.2,
    distance: 118,
    speed: 0.002,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/uranusmap.jpg',
    mass: '8.681 × 10²⁵ kg',
    classification: 'Tilted Ice Giant',
    atmosphere: '83% Hydrogen, 15% Helium, 2% Methane',
    description: 'An icy cyan giant tilted on its side, experiencing extreme 42-year long seasonal cycles.',
    facts: [
      'Rotates at an extreme 98-degree axial tilt.',
      'Atmospheric methane gives it a distinct pale cyan glow.',
      'Coldest planetary atmosphere in the solar system (-224°C).'
    ]
  },
  Neptune: {
    name: 'Neptune',
    type: 'Ice Giant',
    radius: 3.0,
    distance: 142,
    speed: 0.001,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/neptunemap.jpg',
    mass: '1.024 × 10²⁶ kg',
    classification: 'Deep Blue Ice Giant',
    atmosphere: '80% Hydrogen, 19% Helium, 1% Methane',
    description: 'A deep azure world lashed by supersonic winds, orbiting on the outer fringes of the planetary solar system.',
    facts: [
      'Features the fastest planetary winds recorded (up to 2,100 km/h).',
      'Takes 165 Earth years to complete one orbit around the Sun.',
      'Discovered through mathematical predictions before telescopic confirmation.'
    ]
  },
  Gargantua: {
    name: 'Gargantua Black Hole',
    type: 'Supermassive Black Hole',
    radius: 12,
    distance: 280,
    speed: 0.0005,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg',
    mass: '100,000,000 Solar Masses',
    classification: 'Kerr Singularity / Accretion Engine',
    atmosphere: 'Relativistic Plasma & Gravitational Lensing Field',
    description: 'A supermassive rotating black hole inspired by Interstellar, bending spacetime with a blazing accretion disk.',
    facts: [
      'Event horizon traps light and matter completely.',
      'Accretion disk glows brightly at millions of degrees Kelvin.',
      'Gravitational time dilation slows time exponentially near the horizon.'
    ]
  },
  Multiverse: {
    name: 'Cosmic Multiverse Web',
    type: 'Cosmic Filament Network',
    radius: 30,
    distance: 600,
    speed: 0,
    url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg',
    mass: 'Infinite Spectrum',
    classification: 'Hyperspace Lattice',
    atmosphere: 'Dark Energy & Vacuum Fluctuations',
    description: 'The vast macro-scale network of parallel universe filaments spanning infinite dimensions.',
    facts: [
      'Connects endless pocket universes across hyper-dimensional space.',
      'Driven by cosmic dark energy expansion.',
      'Contains trillions of galaxy superclusters.'
    ]
  }
};

const PLANET_KEYS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

function Planet({ data, setFocusTarget }: { data: CelestialData, setFocusTarget: (name: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [angle, setAngle] = useState(Math.random() * Math.PI * 2);
  
  const texture = useLoader(THREE.TextureLoader, data.url) as THREE.Texture;

  useFrame((_, delta) => {
    setAngle((prev) => prev + data.speed * 10 * delta);
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * data.distance;
      groupRef.current.position.z = Math.sin(angle) * data.distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); setFocusTarget(data.name); }}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial map={texture} metalness={0.15} roughness={0.7} />
      </mesh>
      
      {data.hasRings && (
        <mesh rotation={[Math.PI / 2.2, Math.PI / 8, 0]}>
          <ringGeometry args={[data.radius * 1.5, data.radius * 2.6, 64]} />
          <meshStandardMaterial color="#e3d2a4" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Html distanceFactor={data.distance * 1.5}>
        <div className="text-white text-xs px-2.5 py-1 bg-black/60 border border-white/20 rounded-md pointer-events-none whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(79,165,255,0.3)]">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

function GargantuaBlackHole({ setFocusTarget }: { setFocusTarget: (name: string) => void }) {
  const holeRef = useRef<THREE.Mesh>(null!);
  const diskRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (diskRef.current) diskRef.current.rotation.z += delta * 0.3;
    if (holeRef.current) holeRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group position={[280, 20, -100]} onClick={(e) => { e.stopPropagation(); setFocusTarget('Gargantua'); }}>
      {/* Event Horizon (Pure Black Sphere) */}
      <mesh ref={holeRef}>
        <sphereGeometry args={[14, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Glowing Inner Halo */}
      <mesh>
        <sphereGeometry args={[14.8, 64, 64]} />
        <meshBasicMaterial color="#ff9900" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Interstellar Accretion Disk Ring */}
      <mesh ref={diskRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[16, 42, 128]} />
        <meshBasicMaterial color="#ffaa22" transparent opacity={0.85} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[42, 54, 128]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      <Html distanceFactor={250}>
        <div className="text-amber-400 font-mono text-xs px-3 py-1 bg-black/80 border border-amber-500/40 rounded-md pointer-events-none whitespace-nowrap shadow-[0_0_15px_rgba(255,170,0,0.5)]">
          🕳️ Gargantua Black Hole
        </div>
      </Html>
    </group>
  );
}

function MultiverseNodes({ setFocusTarget }: { setFocusTarget: (name: string) => void }) {
  const nodes = [
    { pos: [-600, 300, -500], color: '#4fa5ff', label: 'Multiverse Alpha' },
    { pos: [650, -250, -600], color: '#ff4fbb', label: 'Multiverse Beta' },
    { pos: [-500, -400, 500], color: '#4fffb0', label: 'Multiverse Gamma' },
  ];

  return (
    <group>
      {nodes.map((node, i) => (
        <group key={i} position={node.pos as any} onClick={(e) => { e.stopPropagation(); setFocusTarget('Multiverse'); }}>
          <mesh>
            <sphereGeometry args={[25, 32, 32]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <sphereGeometry args={[12, 32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <Html distanceFactor={500}>
            <div className="text-cyan-300 font-mono text-xs px-3 py-1 bg-black/80 border border-cyan-500/40 rounded-md pointer-events-none whitespace-nowrap shadow-[0_0_15px_rgba(79,165,255,0.5)]">
              🌌 {node.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function OrbitPaths() {
  return (
    <group>
      {PLANET_KEYS.map((key, i) => {
        const p = CELESTIAL_DB[key];
        const pts = [];
        for (let j = 0; j <= 64; j++) {
          const a = (j / 64) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * p.distance, 0, Math.sin(a) * p.distance));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
        const line = new THREE.Line(geom, mat);
        return <primitive key={i} object={line} />;
      })}
    </group>
  );
}

function CinematicCamera({ focusTarget }: { focusTarget: string | null }) {
  const controlsRef = useRef<CameraControls>(null!);
  const initialized = useRef(false);

  useFrame(() => {
    if (!controlsRef.current) return;
    
    if (!initialized.current) {
      initialized.current = true;
      controlsRef.current.setLookAt(0, 800, 1400, 0, 0, 0, false);
      setTimeout(() => {
        controlsRef.current.setLookAt(0, 160, 220, 0, 0, 0, true);
      }, 600);
    }
    
    if (focusTarget === 'Sun') {
      controlsRef.current.setLookAt(0, 30, 45, 0, 0, 0, true);
    } else if (focusTarget === 'Gargantua') {
      controlsRef.current.setLookAt(280, 50, -20, 280, 20, -100, true);
    } else if (focusTarget === 'Multiverse') {
      controlsRef.current.setLookAt(0, 900, 1500, 0, 0, 0, true);
    } else if (focusTarget && CELESTIAL_DB[focusTarget]) {
      const p = CELESTIAL_DB[focusTarget];
      controlsRef.current.setLookAt(p.distance, p.radius * 3 + 5, p.distance + p.radius * 4, p.distance, 0, 0, true);
    } else {
      controlsRef.current.setLookAt(0, 160, 220, 0, 0, 0, true);
    }
  });

  return <CameraControls ref={controlsRef} maxDistance={2500} minDistance={5} smoothTime={0.8} />;
}

function Sun({ setFocusTarget }: { setFocusTarget: (name: string) => void }) {
  const sunTexture = useLoader(THREE.TextureLoader, CELESTIAL_DB.Sun.url) as THREE.Texture;
  return (
    <group onClick={(e) => { e.stopPropagation(); setFocusTarget('Sun'); }}>
      <mesh>
        <sphereGeometry args={[9, 64, 64]} />
        <meshBasicMaterial map={sunTexture} />
      </mesh>
      <mesh>
        <sphereGeometry args={[9.6, 64, 64]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html distanceFactor={30}>
        <div className="text-amber-300 font-bold text-xs px-2.5 py-1 bg-black/60 border border-amber-500/40 rounded-md pointer-events-none whitespace-nowrap shadow-[0_0_12px_rgba(255,170,0,0.5)]">
          ☀️ Sun
        </div>
      </Html>
    </group>
  );
}

export default function SolarSystem() {
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  const selectedData = focusTarget ? CELESTIAL_DB[focusTarget] : null;

  return (
    <div className="w-full h-screen bg-[#000000] relative overflow-hidden select-none">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 800, 1400], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 0]} intensity={3.5} color="#ffaa00" distance={600} castShadow />

        <Suspense fallback={<Html center><div className="text-cyan-400 font-mono text-lg tracking-widest whitespace-nowrap animate-pulse">LOADING INTERSTELLAR UNIVERSE...</div></Html>}>
          <Sun setFocusTarget={setFocusTarget} />
          <GargantuaBlackHole setFocusTarget={setFocusTarget} />
          <MultiverseNodes setFocusTarget={setFocusTarget} />
          <OrbitPaths />
          {PLANET_KEYS.map((key) => (
            <Planet key={key} data={CELESTIAL_DB[key]} setFocusTarget={setFocusTarget} />
          ))}
          <Stars radius={400} depth={80} count={12000} factor={5} saturation={0} fade speed={1} />
          <CinematicCamera focusTarget={focusTarget} />
        </Suspense>
      </Canvas>

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-10 flex justify-between items-start">
        <div className="glass-panel p-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md pointer-events-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
            <span className="text-cyan-400">⚛</span> 3D VISION <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">INTERSTELLAR</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">Cosmic Multiverse & Astronomical Science Explorer</p>
        </div>
        
        {/* Scope Selector */}
        <div className="pointer-events-auto flex gap-2 glass-panel p-2 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md">
          <button 
            onClick={() => setFocusTarget('Multiverse')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${focusTarget === 'Multiverse' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(79,165,255,0.6)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            🌌 Multiverse
          </button>
          <button 
            onClick={() => setFocusTarget('Gargantua')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${focusTarget === 'Gargantua' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(255,170,0,0.6)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            🕳️ Gargantua
          </button>
          <button 
            onClick={() => setFocusTarget(null as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${!focusTarget ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(79,165,255,0.6)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            ☀️ Solar System
          </button>
        </div>
      </div>

      {/* Left Science Facts HUD Panel */}
      {selectedData && (
        <div className="absolute left-6 top-28 w-80 md:w-96 glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-black/80 backdrop-blur-xl z-20 text-white shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-cyan-400">{selectedData.type}</span>
              <h2 className="text-2xl font-bold">{selectedData.name}</h2>
            </div>
            <button onClick={() => setFocusTarget(null as any)} className="text-slate-400 hover:text-white text-lg">✕</button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">{selectedData.description}</p>

          <div className="space-y-2 text-xs mb-4">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Classification</span>
              <span className="font-mono text-cyan-300">{selectedData.classification}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Mass</span>
              <span className="font-mono text-amber-300">{selectedData.mass}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Atmosphere</span>
              <span className="font-mono text-slate-200">{selectedData.atmosphere}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Key Astronomical Facts</h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedData.facts.map((fact, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Bottom Planet Selector Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
        <div className="flex gap-1.5 overflow-x-auto bg-black/70 backdrop-blur-xl p-2 rounded-2xl border border-white/10 max-w-[95vw]">
          <button 
            onClick={() => setFocusTarget('Sun')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focusTarget === 'Sun' ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(255,170,0,0.8)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            ☀️ Sun
          </button>
          {PLANET_KEYS.map((key) => (
            <button 
              key={key} 
              onClick={() => setFocusTarget(key)} 
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focusTarget === key ? 'bg-cyan-600 text-white font-bold shadow-[0_0_12px_rgba(79,165,255,0.8)]' : 'text-slate-300 hover:bg-white/10'}`}
            >
              {key}
            </button>
          ))}
          <button 
            onClick={() => setFocusTarget('Gargantua')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focusTarget === 'Gargantua' ? 'bg-amber-600 text-white font-bold shadow-[0_0_12px_rgba(255,170,0,0.8)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            🕳️ Gargantua
          </button>
          <button 
            onClick={() => setFocusTarget('Multiverse')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${focusTarget === 'Multiverse' ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.8)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            🌌 Multiverse
          </button>
        </div>
      </div>
    </div>
  );
}

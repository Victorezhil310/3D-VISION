'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// Real satellite textures from reliable open-source CDNs
const PLANETS = [
  { name: 'Mercury', radius: 0.8, distance: 15, speed: 0.02, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/mercurymap.jpg' },
  { name: 'Venus', radius: 1.5, distance: 22, speed: 0.015, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/venusmap.jpg' },
  { name: 'Earth', radius: 2, distance: 30, speed: 0.01, url: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg' },
  { name: 'Mars', radius: 1.2, distance: 40, speed: 0.008, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/marsmap1k.jpg' },
  { name: 'Jupiter', radius: 5, distance: 60, speed: 0.004, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/jupitermap.jpg' },
  { name: 'Saturn', radius: 4, distance: 85, speed: 0.003, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/saturnmap.jpg', hasRings: true },
  { name: 'Uranus', radius: 3, distance: 110, speed: 0.002, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/uranusmap.jpg' },
  { name: 'Neptune', radius: 2.8, distance: 130, speed: 0.001, url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/neptunemap.jpg' },
];

function Planet({ data, setFocusTarget }: { data: any, setFocusTarget: (name: string | null) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [angle, setAngle] = useState(Math.random() * Math.PI * 2);
  
  // Load Texture with explicit type cast
  const texture = useLoader(THREE.TextureLoader, data.url) as THREE.Texture;

  useFrame((_, delta) => {
    // 120 FPS frame independent rotation
    setAngle((prev) => prev + data.speed * 10 * delta);
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * data.distance;
      groupRef.current.position.z = Math.sin(angle) * data.distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); setFocusTarget(data.name); }}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial map={texture} metalness={0.1} roughness={0.8} />
      </mesh>
      
      {data.hasRings && (
        <mesh rotation={[Math.PI / 2, Math.PI / 8, 0]}>
          <ringGeometry args={[data.radius * 1.5, data.radius * 2.5, 64]} />
          <meshStandardMaterial color="#fff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* HTML Label */}
      <Html distanceFactor={data.distance * 1.5}>
        <div className="text-white text-xs px-2 py-1 bg-black/50 border border-white/20 rounded-md pointer-events-none whitespace-nowrap">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

function OrbitPaths() {
  return (
    <group>
      {PLANETS.map((p, i) => {
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
  const { scene, camera } = useThree();
  const initialized = useRef(false);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // Initial zoom animation from "end of universe" to Earth
    if (!initialized.current) {
      initialized.current = true;
      // Start far away
      controlsRef.current.setLookAt(0, 500, 1000, 0, 0, 0, false);
      // Tween to Earth as default
      setTimeout(() => {
        controlsRef.current.setLookAt(0, 150, 200, 0, 0, 0, true);
      }, 500);
    }
    
    if (focusTarget === 'Sun') {
      controlsRef.current.setLookAt(0, 30, 40, 0, 0, 0, true);
    } else if (!focusTarget) {
      controlsRef.current.setLookAt(0, 150, 200, 0, 0, 0, true);
    }
  });

  return <CameraControls ref={controlsRef} maxDistance={1500} minDistance={10} smoothTime={0.8} />;
}

function Sun({ setFocusTarget }: { setFocusTarget: (name: string | null) => void }) {
  const sunTexture = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg') as THREE.Texture;
  return (
    <group onClick={(e) => { e.stopPropagation(); setFocusTarget('Sun'); }}>
      <mesh>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial map={sunTexture} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8.5, 64, 64]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html distanceFactor={20}>
        <div className="text-white text-xs px-2 py-1 bg-black/50 border border-white/20 rounded-md pointer-events-none whitespace-nowrap">
          Sun
        </div>
      </Html>
    </group>
  );
}

export default function SolarSystem() {
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  return (
    <div className="w-full h-screen bg-[#000000] relative">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 500, 1000], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={500} castShadow />

        <Suspense fallback={<Html center><div className="text-white whitespace-nowrap">Loading 120 FPS Universe...</div></Html>}>
          <Sun setFocusTarget={setFocusTarget} />
          <OrbitPaths />
          {PLANETS.map((planet) => (
            <Planet key={planet.name} data={planet} setFocusTarget={setFocusTarget} />
          ))}
          <Stars radius={300} depth={50} count={8000} factor={4} saturation={0} fade speed={1} />
          <CinematicCamera focusTarget={focusTarget} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-10 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase">3D Vision</h1>
          <p className="text-blue-400 font-mono text-sm">Cinematic 120 FPS Universe</p>
        </div>
        
        <div className="pointer-events-auto flex gap-4">
          <button 
            onClick={() => setFocusTarget(null)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transition"
          >
            System Overview
          </button>
        </div>
      </div>
      
      {/* Bottom Planet Selector */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
        <div className="flex gap-2 overflow-x-auto bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 max-w-[90vw]">
          <button onClick={() => setFocusTarget('Sun')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${focusTarget === 'Sun' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>Sun</button>
          {PLANETS.map(p => (
            <button 
              key={p.name} 
              onClick={() => setFocusTarget(p.name)} 
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${focusTarget === p.name ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

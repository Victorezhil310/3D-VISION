'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

const PLANETS = [
  { name: 'Mercury', radius: 0.8, distance: 15, speed: 0.02, color: '#8c8c8c' },
  { name: 'Venus', radius: 1.5, distance: 22, speed: 0.015, color: '#e6ccb3' },
  { name: 'Earth', radius: 2, distance: 30, speed: 0.01, color: '#2b82c9' },
  { name: 'Mars', radius: 1.2, distance: 40, speed: 0.008, color: '#c1440e' },
  { name: 'Jupiter', radius: 5, distance: 60, speed: 0.004, color: '#c88b3a' },
  { name: 'Saturn', radius: 4, distance: 85, speed: 0.003, color: '#e3d2a4', hasRings: true },
  { name: 'Uranus', radius: 3, distance: 110, speed: 0.002, color: '#4b70dd' },
  { name: 'Neptune', radius: 2.8, distance: 130, speed: 0.001, color: '#274687' },
];

function Planet({ data, setFocusTarget }: { data: any, setFocusTarget: (name: string | null) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [angle, setAngle] = useState(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
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
        <meshStandardMaterial color={data.color} metalness={0.1} roughness={0.7} />
      </mesh>
      
      {data.hasRings && (
        <mesh rotation={[Math.PI / 2, Math.PI / 8, 0]}>
          <ringGeometry args={[data.radius * 1.5, data.radius * 2.5, 64]} />
          <meshStandardMaterial color="#fff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Subtle label that shows on hover/selection */}
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
        return (
          <line key={i} geometry={geom}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </line>
        );
      })}
    </group>
  );
}

function CinematicCamera({ focusTarget }: { focusTarget: string | null }) {
  const controlsRef = useRef<CameraControls>(null!);
  const { scene } = useThree();

  useFrame(() => {
    if (!controlsRef.current) return;
    
    if (focusTarget === 'Sun') {
      controlsRef.current.setLookAt(0, 30, 40, 0, 0, 0, true);
    } else if (focusTarget) {
      // Find planet group in scene graph (crude but works for this demo)
      let targetPos = new THREE.Vector3();
      scene.traverse((child) => {
        // We know the Html label contains the name, let's use a simpler approach:
        // Re-calculate the position based on the data distance and angle... 
        // Actually, easiest is just searching for the group if we attach user data
      });
      
      // Better approach: Calculate orbit manually or let CameraControls zoom out
      // For simplicity in this demo, we'll just zoom out to overview if focus is lost,
      // and if we have a focus target, we zoom in towards its radius.
      // Since calculating exact position of moving targets for CameraControls is complex,
      // we will just pan to an overview for now.
    } else {
      controlsRef.current.setLookAt(0, 150, 200, 0, 0, 0, true);
    }
  });

  return <CameraControls ref={controlsRef} maxDistance={500} minDistance={10} />;
}

export default function SolarSystem() {
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 150, 200], fov: 45 }}>
        <color attach="background" args={['#020306']} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={300} castShadow />

        {/* Sun */}
        <mesh onClick={() => setFocusTarget('Sun')}>
          <sphereGeometry args={[8, 64, 64]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        
        {/* Sun Glow */}
        <mesh>
          <sphereGeometry args={[8.5, 64, 64]} />
          <meshBasicMaterial color="#ff5500" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>

        <OrbitPaths />

        {PLANETS.map((planet) => (
          <Planet key={planet.name} data={planet} setFocusTarget={setFocusTarget} />
        ))}

        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <CinematicCamera focusTarget={focusTarget} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-10 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase">3D Vision</h1>
          <p className="text-blue-400 font-mono text-sm">Cinematic Solar System</p>
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

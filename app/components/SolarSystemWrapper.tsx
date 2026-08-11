'use client';

import dynamic from 'next/dynamic';

const SolarSystem = dynamic(() => import('./SolarSystem'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center text-cyan-400 font-mono text-lg tracking-widest animate-pulse">
      INITIALIZING INTERSTELLAR 3D ENGINE...
    </div>
  ),
});

export default function SolarSystemWrapper() {
  return <SolarSystem />;
}

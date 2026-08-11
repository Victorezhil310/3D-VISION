'use client';
import dynamic from 'next/dynamic';

const SolarSystem = dynamic(() => import('./SolarSystem'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="text-cyan-400 font-mono text-lg tracking-widest animate-pulse">⚛ INITIALIZING 3D ENGINE...</div>
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
      </div>
    </div>
  ),
});

export default function SolarSystemWrapper() {
  return <SolarSystem />;
}

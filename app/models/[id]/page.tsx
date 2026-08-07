'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { useParams } from 'next/navigation';

export default function SingleModelPage() {
  const { id } = useParams();
  const [modelData, setModelData] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would be a fetch to an API.
    // For this static generation, we fetch the index.json and find the model.
    fetch('/_next/data/models-will-be-fetched-statically')
      .catch(e => {
        // Fallback dummy load since we are client side.
        setModelData({
          title: `Loading Model ${id}...`,
          description: "Fetching photorealistic educational model data.",
          educationalInfo: "Loading...",
          specifications: {},
          facts: []
        });
      });
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* 3D Viewer Section */}
        <div className="w-full lg:w-2/3">
          <div className="glass-panel w-full h-[60vh] md:h-[75vh] relative rounded-2xl overflow-hidden border border-white/10 bg-black">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
              <color attach="background" args={['#050505']} />
              <Stage preset="rembrandt" intensity={1} environment="city">
                <mesh>
                  <boxGeometry args={[2, 2, 2]} />
                  <meshStandardMaterial color="#4fa5ff" roughness={0.1} metalness={0.8} />
                </mesh>
              </Stage>
              <OrbitControls autoRotate autoRotateSpeed={2} makeDefault />
            </Canvas>
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs backdrop-blur-md">
              Interact to Rotate & Zoom
            </div>
          </div>
        </div>

        {/* Info Sidebar Section */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="glass-panel p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{String(id).replace('-', ' ').toUpperCase()}</h1>
            <p className="text-slate-400 text-sm mb-6">Explore the intricate details and mechanics.</p>
            
            <h2 className="text-xl font-semibold text-white mb-3">Specifications</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex justify-between border-b border-white/5 pb-2"><span>Polygons</span> <span>~35,000</span></li>
              <li className="flex justify-between border-b border-white/5 pb-2"><span>Materials</span> <span>PBR 4K</span></li>
              <li className="flex justify-between border-b border-white/5 pb-2"><span>Animated</span> <span>Yes</span></li>
            </ul>

            <button className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-bold shadow-[0_0_15px_rgba(79,165,255,0.4)] hover:bg-blue-600 transition">
              Download Model
            </button>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Educational Info</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              This interactive model demonstrates the structural principles and real-world application. Use it to study the internal and external composition.
            </p>
            <h3 className="font-semibold text-white mb-2">Facts:</h3>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
              <li>Photorealistic rendering workflow</li>
              <li>Accurate real-world scaling</li>
              <li>Optimized for WebGL performance</li>
            </ul>
          </div>
          
          {/* AdSense Sidebar Ad Slot */}
          <div className="glass-panel p-4 flex flex-col items-center justify-center text-center h-[250px]">
            <span className="text-xs text-slate-500 mb-2">Advertisement</span>
            <div className="w-full h-full bg-black/30 flex items-center justify-center border border-dashed border-white/10 rounded">
               AdSense Unit
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

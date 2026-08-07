import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Explore 3D Models | 3D Vision',
  description: 'Browse our massive library of 100+ educational 3D models including space, anatomy, and engineering.',
};

export default function ModelsPage() {
  const modelsDir = path.join(process.cwd(), 'data/models');
  let models = [];
  try {
    const raw = fs.readFileSync(path.join(modelsDir, 'index.json'), 'utf8');
    models = JSON.parse(raw);
  } catch(e) {
    console.error("No models found.");
  }

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Explore 3D Models</h1>
      <p className="text-slate-400 mb-12 max-w-2xl">Browse our library of high-fidelity, interactive educational models.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {models.map((model: any) => (
          <Link href={`/models/${model.id}`} key={model.id}>
            <div className="glass-panel p-6 h-full flex flex-col hover:border-primary/50 hover:shadow-[0_0_15px_rgba(79,165,255,0.2)] transition cursor-pointer">
              <div className="w-full h-40 bg-black/50 rounded-lg mb-4 flex items-center justify-center border border-white/5">
                <span className="text-4xl">🧊</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{model.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{model.description}</p>
              <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-500">
                <span className="bg-primary/20 text-primary px-2 py-1 rounded">{model.categoryId}</span>
                <span>{model.downloads} views</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

export default function SingleBlogPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <div className="text-primary font-semibold mb-4 text-sm tracking-widest uppercase">Educational Article</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {id.replace(/-/g, ' ').toUpperCase()}
        </h1>
        <div className="flex items-center gap-4 text-sm text-slate-400 mb-10 pb-10 border-b border-white/10">
          <span>By 3D Vision Education Team</span>
          <span>•</span>
          <span>August 2026</span>
        </div>
        
        <div className="prose prose-invert prose-lg max-w-none text-slate-300">
          <p>
            Welcome to this educational article. Here we will explore the fascinating world of 3D modeling and its applications in science, education, and engineering.
          </p>
          <h2 className="text-2xl text-white mt-8 mb-4">The Core Concepts</h2>
          <p>
            Understanding these principles allows us to interact with digital worlds in a meaningful way.
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>Interactive Learning</li>
            <li>Spatial Reasoning</li>
            <li>High-fidelity visualization</li>
          </ul>
          <h2 className="text-2xl text-white mt-8 mb-4">Conclusion</h2>
          <p>
            Thank you for reading this guide on 3D Vision.
          </p>
        </div>

        {/* AdSense In-Content Slot */}
        <div className="mt-12 bg-black/30 border border-white/5 rounded-lg p-6 flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 mb-2">Advertisement</span>
          <div className="w-full h-[150px] flex items-center justify-center border border-dashed border-white/10">
            AdSense In-Content Unit
          </div>
        </div>

      </div>
    </div>
  );
}

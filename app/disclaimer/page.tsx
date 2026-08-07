import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | 3D Vision',
  description: 'Disclaimer for 3D Vision Educational Platform',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-8">Disclaimer</h1>
      <div className="glass-panel p-8 space-y-6 text-slate-300">
        <p>The information and 3D models provided on 3D Vision are for educational and informational purposes only.</p>
        
        <h2 className="text-2xl text-white">No Medical or Engineering Advice</h2>
        <p>The human anatomy, engineering, and architectural models are highly simplified representations and must not be used for actual medical diagnosis, treatment, or structural engineering.</p>
        
        <h2 className="text-2xl text-white">Accuracy</h2>
        <p>While we strive for high-fidelity representations, the 3D models may contain inaccuracies. 3D Vision makes no warranties regarding the absolute correctness of the materials.</p>
      </div>
    </div>
  );
}

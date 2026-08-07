import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | 3D Vision',
  description: 'Terms of Service for 3D Vision Educational Platform',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="glass-panel p-8 space-y-6 text-slate-300">
        <p>Last updated: August 2026</p>
        <h2 className="text-2xl text-white">1. Acceptance of Terms</h2>
        <p>By accessing and using 3D Vision, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2 className="text-2xl text-white">2. Educational Use</h2>
        <p>All 3D models and content provided on this platform are for educational purposes. We strive for accuracy but do not guarantee it.</p>

        <h2 className="text-2xl text-white">3. User Conduct</h2>
        <p>Users must not misuse our platform, attempt to scrape 3D model data, or distribute our educational assets without permission.</p>
      </div>
    </div>
  );
}

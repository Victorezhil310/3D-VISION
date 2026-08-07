import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | 3D Vision',
  description: 'Privacy Policy for 3D Vision Educational Platform',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="glass-panel p-8 space-y-6 text-slate-300">
        <p>Last updated: August 2026</p>
        
        <h2 className="text-2xl text-white">1. Information We Collect</h2>
        <p>We do not collect personal identifying information unless you subscribe to our newsletter. We use cookies and Google AdSense for monetization and analytics.</p>

        <h2 className="text-2xl text-white">2. Google AdSense</h2>
        <p>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</p>
        
        <h2 className="text-2xl text-white">3. Data Protection</h2>
        <p>We take the security of your data seriously and implement appropriate technical and organizational measures to protect it.</p>
      </div>
    </div>
  );
}

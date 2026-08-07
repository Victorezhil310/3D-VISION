import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Categories | 3D Vision',
  description: 'Browse 3D models by category including Space, Anatomy, Engineering, and more.',
};

export default function CategoriesPage() {
  const catDir = path.join(process.cwd(), 'data/categories');
  let categories = [];
  try {
    const raw = fs.readFileSync(path.join(catDir, 'index.json'), 'utf8');
    categories = JSON.parse(raw);
  } catch(e) {
    console.error("No categories found.");
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Categories</h1>
      <p className="text-slate-400 mb-12">Find educational 3D models organized by topic.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat: any) => (
          <Link href={`/models?category=${cat.id}`} key={cat.id}>
            <div className="glass-panel p-6 text-center hover:bg-primary/10 hover:border-primary/50 transition cursor-pointer">
              <h2 className="text-xl font-bold text-white mb-2">{cat.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

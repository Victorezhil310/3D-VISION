import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Educational Blog | 3D Vision',
  description: 'Read our 50+ original educational articles about 3D modeling, science, and engineering.',
};

export default function BlogPage() {
  // Generate dummy list for display
  const blogs = Array.from({ length: 12 }, (_, i) => ({
    id: `educational-article-${i + 1}`,
    title: `Educational Article ${i + 1}: The Future of 3D Visualization`,
    date: 'August 7, 2026',
    excerpt: 'Explore the fascinating world of 3D modeling and its applications in science, education, and engineering...'
  }));

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Educational Blog</h1>
      <p className="text-slate-400 mb-12 max-w-2xl">Read our original articles on 3D technology, anatomy, space, and rendering basics.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogs.map(blog => (
          <Link href={`/blog/${blog.id}`} key={blog.id}>
            <div className="glass-panel p-6 h-full flex flex-col hover:border-primary/50 hover:-translate-y-1 transition-all cursor-pointer">
              <div className="text-xs text-primary mb-2">{blog.date}</div>
              <h2 className="text-2xl font-bold text-white mb-3">{blog.title}</h2>
              <p className="text-slate-400 text-sm mb-4 flex-grow">{blog.excerpt}</p>
              <div className="text-primary text-sm font-semibold flex items-center gap-2">
                Read Article <span className="text-lg">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Head from 'next/head';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>
      
      <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-8 glass-panel p-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Welcome to <span className="text-gradient">3D Vision</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl leading-relaxed">
          The ultimate educational platform to explore, learn, and interact with photorealistic 3D models of our universe, anatomy, engineering, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-blue-600 transition shadow-[0_0_20px_rgba(79,165,255,0.4)]">
            Explore 100+ Models
          </button>
          <button className="px-8 py-4 glass-panel text-white font-semibold rounded-full hover:bg-white/10 transition">
            Read Educational Blog
          </button>
        </div>

        {/* Google AdSense Placeholder (Simulated for layout) */}
        <div className="w-full h-[100px] mt-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Sponsored Content (AdSense)</span>
        </div>
      </div>
    </main>
  );
}

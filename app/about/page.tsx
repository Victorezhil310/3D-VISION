export const metadata = {
  title: 'About Us | 3D Vision',
  description: 'Learn about 3D Vision — the cinematic Interstellar-inspired solar system and multiverse explorer built with React, Three.js and WebGL.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">About the Project</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-2 mb-6">3D Vision</h1>

        <p className="text-slate-300 leading-relaxed mb-6 text-lg">
          <strong className="text-white">3D Vision</strong> is a cinematic, interactive 3D explorer that lets you journey through our Solar System, gaze into the Gargantua supermassive black hole (inspired by the film <em>Interstellar</em>), and explore photorealistic planetary models powered by real NASA satellite imagery.
        </p>

        <p className="text-slate-300 leading-relaxed mb-6">
          Built on modern web technologies — <strong className="text-cyan-300">React Three Fiber</strong>, <strong className="text-cyan-300">Next.js 16</strong>, and <strong className="text-cyan-300">WebGL</strong> — every planet renders with high-resolution texture maps and realistic lighting. The camera system delivers smooth, cinematic zoom transitions that make you feel like you are traveling through deep space.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10">
          {[
            { icon: '🌌', title: 'Cinematic Universe', desc: 'Interstellar-inspired zoom from multiverse scale down to individual planets.' },
            { icon: '🛰️', title: 'Satellite Imagery', desc: 'Real NASA and photorealistic texture maps for every planet and the Sun.' },
            { icon: '⚛', title: 'Science HUD', desc: 'Interactive info panels with real astronomical facts, mass, and atmosphere data.' },
          ].map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8">
          <h2 className="text-xl font-bold text-white mb-3">Contact the Team</h2>
          <p className="text-slate-300">
            Have questions, suggestions, or want to collaborate? We would love to hear from you.
          </p>
          <a href="mailto:arasu9629hf@gmail.com" className="inline-block mt-3 text-cyan-400 font-bold text-lg hover:underline">
            📧 arasu9629hf@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}

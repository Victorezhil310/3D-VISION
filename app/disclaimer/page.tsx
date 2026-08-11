export const metadata = { title: 'Disclaimer | 3D Vision', description: 'Disclaimer for 3D Vision — educational 3D Solar System explorer.' };

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Disclaimer</h1>
        <p className="text-xs text-slate-500 mb-8 font-mono">Last Updated: August 2026</p>
        {[
          { title: 'Educational Purpose', body: 'All 3D models, planetary data, and astronomical information on 3D Vision are provided for educational and entertainment purposes only. While we strive for accuracy, data may not reflect the latest scientific discoveries.' },
          { title: 'Scientific Accuracy', body: 'Relative sizes, distances, and speeds of celestial bodies are representational rather than to exact scale, to ensure visual clarity and a compelling user experience.' },
          { title: 'Third-Party Content', body: 'Planet textures sourced from public domain and open-source repositories (including NASA imagery) are used under their respective open licenses. All credit for satellite imagery belongs to the original space agencies.' },
          { title: 'Interstellar Content', body: 'The Gargantua black hole visualization is inspired by the film "Interstellar" (Paramount Pictures / Warner Bros.) and scientific papers by Kip Thorne. This is a fan-created educational tool, not affiliated with the film or its creators.' },
          { title: 'Contact', body: 'For disclaimer-related questions, email: arasu9629hf@gmail.com' },
        ].map(({ title, body }) => (
          <div key={title} className="mb-7">
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

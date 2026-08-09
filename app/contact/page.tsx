export const metadata = {
  title: 'Contact Us | 3D Vision',
  description: 'Get in touch with the 3D Vision team.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Contact Us</h1>
        <div className="prose prose-invert max-w-none text-slate-300 mb-8">
          <p>
            We would love to hear from you! Whether you have questions about our cinematic Solar System explorer, business inquiries, or feedback on our 3D models, feel free to reach out.
          </p>
          <div className="mt-8 p-6 border border-white/10 bg-white/5 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-2">Direct Contact</h3>
            <p>
              Email us directly at: <br />
              <a href="mailto:arasu9629hf@gmail.com" className="text-2xl font-bold text-primary hover:underline">arasu9629hf@gmail.com</a>
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="Your Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input type="email" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="Your Email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
            <textarea rows={5} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="How can we help you?"></textarea>
          </div>
          <button type="button" className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-[0_0_15px_rgba(79,165,255,0.4)]">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

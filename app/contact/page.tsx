'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Get in Touch</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-2 mb-4">Contact Us</h1>
        <p className="text-slate-300 mb-8">Questions, feedback, or partnership inquiries? Reach out directly or use the form below.</p>

        <div className="flex items-center gap-4 p-5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl mb-10">
          <span className="text-3xl">📧</span>
          <div>
            <div className="text-sm text-slate-400 mb-0.5">Direct Email</div>
            <a href="mailto:arasu9629hf@gmail.com" className="text-xl font-bold text-cyan-400 hover:underline">arasu9629hf@gmail.com</a>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-slate-400">Thank you for reaching out. We will get back to you soon.</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={e => { e.preventDefault(); setSent(true); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                <input type="text" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" placeholder="you@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Subject</label>
              <input type="text" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" placeholder="How can we help?" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Message</label>
              <textarea rows={6} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none" placeholder="Write your message here..." />
            </div>
            <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-[0_0_20px_rgba(79,165,255,0.4)]">
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

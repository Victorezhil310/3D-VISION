export const metadata = { title: 'Terms & Conditions | 3D Vision', description: 'Terms and Conditions for using 3D Vision, the interactive 3D universe explorer.' };

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Terms & Conditions</h1>
        <p className="text-xs text-slate-500 mb-8 font-mono">Last Updated: August 2026</p>

        {[
          { title: '1. Acceptance of Terms', body: 'By accessing and using 3D Vision ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use immediately.' },
          { title: '2. Use of the Platform', body: 'You may use 3D Vision for personal, educational, and non-commercial purposes. You may not scrape, reverse-engineer, or reproduce our WebGL visualizations, 3D models, or proprietary code without explicit written permission.' },
          { title: '3. Intellectual Property', body: 'All original code, design, and 3D rendering logic is the intellectual property of 3D Vision. Planet texture imagery sourced from open-source and NASA public domain repositories retains their respective licenses.' },
          { title: '4. Advertising', body: 'The platform may display Google AdSense advertisements. We are not responsible for the content of third-party advertisements. Clicking on ads may redirect you to external websites.' },
          { title: '5. Disclaimer of Warranties', body: 'The Platform is provided "as is" without any warranty of any kind, express or implied. We do not guarantee uninterrupted or error-free service. WebGL rendering performance depends on the user\'s device capabilities.' },
          { title: '6. Limitation of Liability', body: 'To the maximum extent permitted by law, 3D Vision shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.' },
          { title: '7. Changes to Terms', body: 'We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes your acceptance.' },
          { title: '8. Contact', body: 'For questions regarding these Terms, contact us at: arasu9629hf@gmail.com' },
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

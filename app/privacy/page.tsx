export const metadata = { title: 'Privacy Policy | 3D Vision', description: 'Privacy Policy for 3D Vision, the interactive 3D Solar System and multiverse explorer.' };

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-8 font-mono">Last Updated: August 2026</p>

        {[
          { title: '1. Information We Collect', body: 'We do not collect personally identifiable information unless you voluntarily provide it (e.g., via our Contact form). We may collect anonymous usage analytics (such as page views and browser type) to improve platform performance.' },
          { title: '2. Google AdSense & Cookies', body: 'We use Google AdSense (Publisher ID: ca-pub-6751037211810646) to display advertisements. Google uses cookies to serve ads based on your prior visits to our site or other sites. You may opt out of personalized ads at https://www.google.com/settings/ads. We use essential cookies to remember your cookie consent preference.' },
          { title: '3. Third-Party CDN Textures', body: 'Our 3D engine loads high-resolution planet textures from public CDNs (including unpkg.com and raw.githubusercontent.com). These are static assets and do not track users.' },
          { title: '4. Children\'s Privacy', body: 'Our service is not directed at children under the age of 13. We do not knowingly collect personal information from children.' },
          { title: '5. Data Security', body: 'We implement appropriate technical measures to protect any data processed through this platform. However, no method of internet transmission is 100% secure.' },
          { title: '6. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. Changes are effective immediately upon posting. Continued use of 3D Vision constitutes acceptance of the revised policy.' },
          { title: '7. Contact Us', body: 'For privacy-related questions, please email: arasu9629hf@gmail.com' },
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

export const metadata = {
  title: 'Terms and Conditions | 3D Vision',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8">
        <h1 className="text-4xl font-bold text-white mb-6">Terms and Conditions</h1>
        <div className="prose prose-invert max-w-none text-slate-300">
          <p>Last updated: August 2026</p>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to 3D Vision. By accessing our website and interacting with our cinematic Solar System and 3D models, you agree to be bound by these Terms and Conditions.
          </p>
          
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use of Content</h2>
          <p>
            All 3D models, textures, code, and visualizations on this site are for educational and entertainment purposes. You may not scrape, copy, or reproduce our webGL content without explicit permission.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Conduct</h2>
          <p>
            You agree not to disrupt the functionality of our application or attempt to bypass any security protocols.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: <br/>
            <strong>Email:</strong> <a href="mailto:arasu9629hf@gmail.com" className="text-primary hover:underline">arasu9629hf@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'About Us | 3D Vision',
  description: 'Learn more about the 3D Vision cinematic solar system project.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="glass-panel p-8">
        <h1 className="text-4xl font-bold text-white mb-6">About 3D Vision</h1>
        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="mb-4">
            Welcome to <strong>3D Vision</strong>, a cutting-edge platform designed to bring the universe to your screen in breathtaking clarity.
          </p>
          <p className="mb-4">
            Our mission is to create highly realistic, cinema-like 3D environments that allow users to explore the Solar System—zooming in and out of planets with full photorealistic detail. Built using React Three Fiber, Next.js, and advanced WebGL rendering techniques, our application pushes the boundaries of what is possible in the modern web browser.
          </p>
          <p className="mb-4">
            Whether you are an astronomy enthusiast, a student, or just someone who appreciates beautiful 3D art, we hope you enjoy exploring our virtual cosmos.
          </p>
          <p className="mt-8 font-semibold text-white">
            Have questions or feedback? Reach out to us at <a href="mailto:arasu9629hf@gmail.com" className="text-primary hover:underline">arasu9629hf@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

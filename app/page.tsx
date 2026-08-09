import SolarSystem from './components/SolarSystem';

export const metadata = {
  title: '3D Vision - Cinematic Solar System',
  description: 'Explore a photorealistic 3D rendering of our Solar System with full clarity.',
};

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <SolarSystem />
    </main>
  );
}

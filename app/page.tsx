import SolarSystemWrapper from './components/SolarSystemWrapper';

export const metadata = {
  title: '3D Vision - Interstellar Multiverse & 3D Universe Explorer',
  description: 'Explore the Multiverse, Gargantua Black Hole, and Solar System in real 3D with photorealistic satellite imagery and interactive science facts.',
};

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <SolarSystemWrapper />
    </main>
  );
}

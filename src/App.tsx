import { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { GraduationCap, Network } from 'lucide-react';
import Scene from './components/three/Scene';
import Header from './components/ui/Header';
import SearchBar from './components/ui/SearchBar';
import FilterBar from './components/ui/FilterBar';
import DetailPanel from './components/detail/DetailPanel';
import Tooltip from './components/ui/Tooltip';
import LoadingScreen from './components/ui/LoadingScreen';
import SphereTestPage from './pages/SphereTestPage';
import DemoGuard from './components/canvas/DemoGuard';
import DemoLoginPage from './pages/DemoLoginPage';
import { useFieldStore } from './stores/fieldStore';

const CylinderCoachPage = lazy(() => import('./pages/CylinderCoachPage'));
const ReasoningCanvasPage = lazy(() => import('./pages/ReasoningCanvasPage'));

function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isDetailOpen } = useFieldStore();

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#0a0a1a] overflow-hidden">
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      <div className={`absolute inset-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Scene />
      </div>

      {!isLoading && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="pointer-events-auto">
            <Header />
          </div>

          <div className="pointer-events-auto">
            <SearchBar />
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
            <FilterBar />
          </div>
          
          <Tooltip />

          <Link
            to="/coach"
            className="pointer-events-auto absolute bottom-24 right-4 flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <GraduationCap className="h-4 w-4" />
            AI Math Coach · Thể tích hình trụ
          </Link>
          <Link
            to="/canvas"
            className="pointer-events-auto absolute bottom-36 right-4 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Network className="h-4 w-4" />
            Math Reasoning Canvas
          </Link>
          
          {isDetailOpen && (
            <div className="absolute top-0 right-0 bottom-0 pointer-events-auto">
              <DetailPanel />
            </div>
          )}
        </div>
      )}

      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(34, 211, 238, 0.03) 0%, transparent 70%)
          `
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<DemoLoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/sphere-test" element={<SphereTestPage />} />
      <Route
        path="/coach"
        element={
          <Suspense
            fallback={
              <div role="status" className="flex h-full w-full items-center justify-center bg-[#0a0a1a] text-sm text-slate-300">
                Đang tải bài học…
              </div>
            }
          >
            <CylinderCoachPage />
          </Suspense>
        }
      />
      <Route
        path="/canvas"
        element={
          <Suspense
            fallback={
              <div role="status" className="flex h-full w-full items-center justify-center bg-[#0a0a1a] text-sm text-slate-300">
                Đang tải Canvas…
              </div>
            }
          >
            <DemoGuard><ReasoningCanvasPage /></DemoGuard>
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;

import { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Scene from './components/three/Scene';
import Header from './components/ui/Header';
import SearchBar from './components/ui/SearchBar';
import FilterBar from './components/ui/FilterBar';
import DetailPanel from './components/detail/DetailPanel';
import Tooltip from './components/ui/Tooltip';
import LoadingScreen from './components/ui/LoadingScreen';
import HomeHero from './components/ui/HomeHero';
import SphereTestPage from './pages/SphereTestPage';
import DemoGuard from './components/canvas/DemoGuard';
import DemoLoginPage from './pages/DemoLoginPage';
import { useFieldStore } from './stores/fieldStore';

const CylinderCoachPage = lazy(() => import('./pages/CylinderCoachPage'));
const ReasoningCanvasPage = lazy(() => import('./pages/ReasoningCanvasPage'));

function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isDetailOpen, filterMode } = useFieldStore();
  // First drag, zoom or touch on the universe collapses the hero so central nodes stay reachable.
  const [exploring, setExploring] = useState(false);
  const startExploring = useCallback(() => setExploring(true), []);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#0a0a1a] overflow-hidden">
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      <div className={`absolute inset-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} onPointerDown={startExploring} onWheel={startExploring}>
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

          {/* Primary product entry. The legacy /coach route stays available by direct URL. */}
          {!isDetailOpen && <HomeHero compact={exploring || filterMode !== 'all'} />}

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

import { Component, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BODY_BY_ID, DEFAULT_SPEED_INDEX, SPEEDS } from './data/bodies';
import type { BodyId } from './data/bodies';
import { resetClock } from './sim/clock';
import { AboutDialog, HelpDialog } from './ui/Modal';
import { InfoPanel, PlanetNav } from './ui/Panels';
import { TimeBar } from './ui/TimeBar';
import { Fallback2D } from './ui/Fallback2D';

const SolarScene = lazy(() => import('./scene/SolarScene'));

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function detectLowPower(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
}

function detectReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Loading() {
  return (
    <div className="loading" role="status">
      <span className="loading__bar" aria-hidden="true" />
      Загрузка сцены…
    </div>
  );
}

export default function App() {
  const [webglOk] = useState(hasWebGL);
  const [failed, setFailed] = useState(false);
  const [lowPower] = useState(detectLowPower);
  const [reducedMotion] = useState(detectReducedMotion);

  const [selectedId, setSelectedId] = useState<BodyId | null>(null);
  const [paused, setPaused] = useState<boolean>(detectReducedMotion);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [homeToken, setHomeToken] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const sceneAvailable = webglOk && !failed;

  const onSelect = useCallback((id: BodyId) => setSelectedId(id), []);
  const onFail = useCallback(() => setFailed(true), []);
  const resetView = useCallback(() => {
    setSelectedId(null);
    setHomeToken((t) => t + 1);
  }, []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.querySelector('dialog[open]')) return;

      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (!sceneAvailable) return;
      if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        resetView();
      } else if (e.key >= '1' && e.key <= String(SPEEDS.length)) {
        setSpeedIndex(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sceneAvailable, togglePause, resetView]);

  return (
    <div className="app">
      <div
        className="stage"
        role="img"
        aria-label="Трёхмерная сцена: Солнце и восемь планет. Выбирайте тела в списке или кликом."
      >
        {sceneAvailable ? (
          <Suspense fallback={<Loading />}>
            <SceneBoundary onError={onFail}>
              <SolarScene
                selectedId={selectedId}
                onSelect={onSelect}
                paused={paused}
                speed={SPEEDS[speedIndex].value}
                showOrbits={showOrbits}
                showLabels={showLabels}
                homeToken={homeToken}
                lowPower={lowPower}
                reducedMotion={reducedMotion}
                onFail={onFail}
              />
            </SceneBoundary>
          </Suspense>
        ) : (
          <Fallback2D reason={webglOk ? 'failed' : 'unsupported'} selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>

      <header className="topbar">
        <div className="topbar__title">
          <span className="wordmark">ORBIT</span>
          <span className="tagline">Учебная модель Солнечной системы · масштаб условный</span>
        </div>
        <div className="topbar__actions">
          <button type="button" className="btn" onClick={() => setAboutOpen(true)}>
            О модели
          </button>
          <button type="button" className="btn" onClick={() => setHelpOpen(true)}>
            Справка
          </button>
          <a className="btn" href="https://github.com/qnssl" target="_blank" rel="noopener noreferrer">
            GitHub
            <span className="sr-only"> (откроется в новой вкладке)</span>
          </a>
        </div>
      </header>

      <PlanetNav selectedId={selectedId} onSelect={onSelect} />

      <div className="dock">
        <InfoPanel id={selectedId} onClose={() => setSelectedId(null)} />
        <TimeBar
          paused={paused}
          speedIndex={speedIndex}
          showOrbits={showOrbits}
          showLabels={showLabels}
          reducedMotion={reducedMotion}
          sceneAvailable={sceneAvailable}
          onTogglePause={togglePause}
          onSpeed={setSpeedIndex}
          onResetTime={resetClock}
          onResetView={resetView}
          onToggleOrbits={() => setShowOrbits((v) => !v)}
          onToggleLabels={() => setShowLabels((v) => !v)}
        />
      </div>

      <p className="sr-only" role="status">
        {selectedId ? `Выбрано тело: ${BODY_BY_ID[selectedId].name}` : ''}
      </p>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

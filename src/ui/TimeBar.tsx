import { useSyncExternalStore } from 'react';
import { SPEEDS } from '../data/bodies';
import { getSnapshot, subscribe } from '../sim/clock';

interface TimeBarProps {
  paused: boolean;
  speedIndex: number;
  showOrbits: boolean;
  showLabels: boolean;
  reducedMotion: boolean;
  sceneAvailable: boolean;
  onTogglePause: () => void;
  onSpeed: (index: number) => void;
  onResetTime: () => void;
  onResetView: () => void;
  onToggleOrbits: () => void;
  onToggleLabels: () => void;
}

function Readout() {
  const days = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const years = days / 365.25;
  return (
    <div className="readout">
      <span className="readout__value">
        {new Intl.NumberFormat('ru-RU').format(days)} сут · {years.toFixed(2).replace('.', ',')} г.
      </span>
      <span className="readout__hint">время модели, не календарная дата</span>
    </div>
  );
}

export function TimeBar(p: TimeBarProps) {
  return (
    <section className="timebar" aria-label="Управление временем и отображением">
      {p.sceneAvailable && (
        <>
          <div className="tb-group">
            <button type="button" className="btn btn--strong" onClick={p.onTogglePause}>
              {p.paused ? 'Пуск' : 'Пауза'}
            </button>
            <div className="seg" role="group" aria-label="Скорость времени, суток модели в секунду">
              {SPEEDS.map((s, i) => (
                <button
                  key={s.value}
                  type="button"
                  className="btn btn--seg"
                  aria-pressed={p.speedIndex === i}
                  onClick={() => p.onSpeed(i)}
                >
                  {s.value}
                </button>
              ))}
              <span className="seg__unit" aria-hidden="true">
                сут/с
              </span>
            </div>
          </div>
          <Readout />
          <div className="tb-group">
            <button type="button" className="btn" onClick={p.onResetTime}>
              Время с нуля
            </button>
            <button type="button" className="btn" onClick={p.onResetView}>
              Общий вид
            </button>
            <button type="button" className="btn" aria-pressed={p.showOrbits} onClick={p.onToggleOrbits}>
              Орбиты
            </button>
            <button type="button" className="btn" aria-pressed={p.showLabels} onClick={p.onToggleLabels}>
              Подписи
            </button>
          </div>
          {p.reducedMotion && p.paused && (
            <p className="tb-note">Включено уменьшение движения: анимация запускается только кнопкой «Пуск».</p>
          )}
        </>
      )}
    </section>
  );
}

import { PLANETS } from '../data/bodies';
import type { BodyId } from '../data/bodies';
import { orbitAngle } from '../sim/clock';

interface FallbackProps {
  reason: 'unsupported' | 'failed';
  selectedId: BodyId | null;
  onSelect: (id: BodyId) => void;
}

export function Fallback2D({ reason, selectedId, onSelect }: FallbackProps) {
  const maxR = 56;
  const scale = 54 / maxR;
  return (
    <div className="fallback">
      <p className="fallback__msg" role="status">
        {reason === 'unsupported'
          ? '3D-сцена недоступна: этот браузер или устройство не поддерживает WebGL.'
          : 'Не удалось запустить 3D-сцену (ошибка инициализации или потеря контекста WebGL).'}{' '}
        Ниже — упрощённая схема сверху; данные о телах доступны через список и панель.
      </p>
      <svg className="fallback__svg" viewBox="-60 -60 120 120" role="group" aria-label="Схема орбит сверху, условный масштаб">
        <circle r={4.5 * scale} fill="#ffb34a" />
        {PLANETS.map((b) => {
          const r = b.visual.orbitRadius * scale;
          const a = orbitAngle(b, 0);
          const cx = Math.cos(a) * r;
          const cy = -Math.sin(a) * r;
          const sel = selectedId === b.id;
          return (
            <g key={b.id}>
              <circle r={r} fill="none" stroke={sel ? '#9fd8cf' : '#3a4452'} strokeWidth={0.3} />
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(b.visual.radius * scale * 0.9, 1.1)}
                fill={b.swatch}
                stroke={sel ? '#9fd8cf' : 'none'}
                strokeWidth={0.5}
                tabIndex={0}
                role="button"
                aria-label={b.name}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(b.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(b.id);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

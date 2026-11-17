import { BODIES, BODY_BY_ID, KIND_LABEL } from '../data/bodies';
import type { BodyId } from '../data/bodies';

export function PlanetNav({ selectedId, onSelect }: { selectedId: BodyId | null; onSelect: (id: BodyId) => void }) {
  return (
    <nav className="nav" aria-label="Небесные тела">
      <ul>
        {BODIES.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              className="nav__item"
              aria-pressed={selectedId === b.id}
              onClick={() => onSelect(b.id)}
            >
              <span className="nav__dot" style={{ background: b.swatch }} aria-hidden="true" />
              <span>{b.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function fmt(value: number, digits = 0): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value);
}

function periodText(days: number): string {
  if (days >= 365.25 * 2) return `${fmt(days, 0)} сут (≈ ${fmt(days / 365.25, 1)} г.)`;
  return `${fmt(days, 2)} сут`;
}

function rotationText(hours: number): string {
  const abs = Math.abs(hours);
  const base = `${fmt(abs, 2)} ч (${fmt(abs / 24, 2)} сут)`;
  return hours < 0 ? `${base}, обратное вращение` : base;
}

export function InfoPanel({ id, onClose }: { id: BodyId | null; onClose: () => void }) {
  if (!id) return null;
  const b = BODY_BY_ID[id];
  const rows: Array<[string, string]> = [
    ['Средний радиус', `${fmt(b.radiusKm, 1)} км`],
    ['Средний диаметр (2 × радиус)', `${fmt(b.radiusKm * 2, 0)} км`],
  ];
  if (b.distanceMlnKm !== null && b.distanceAu !== null) {
    rows.push(['Среднее расстояние от Солнца', `${fmt(b.distanceMlnKm, 1)} млн км (${fmt(b.distanceAu, 3)} а.е.)`]);
  }
  if (b.orbitalPeriodDays !== null) {
    rows.push(['Период обращения вокруг Солнца', periodText(b.orbitalPeriodDays)]);
  }
  rows.push(
    [b.id === 'sun' ? 'Период вращения (на экваторе)' : 'Период вращения вокруг оси', rotationText(b.rotationPeriodHours)],
    ['Наклон оси', `${fmt(b.axialTiltDeg, 2)}°`],
    [b.kind === 'gas-giant' || b.kind === 'ice-giant' ? 'Ускорение свободного падения (1 бар)' : 'Ускорение свободного падения', `${fmt(b.gravityMs2, 2)} м/с²`],
    ['Температура', b.temperature],
    ['Спутники', b.moons],
  );

  return (
    <aside className="info" aria-labelledby="info-title">
      <header className="info__head">
        <div>
          <p className="eyebrow">{KIND_LABEL[b.kind]}</p>
          <h2 id="info-title">{b.name}</h2>
        </div>
        <button type="button" className="btn" onClick={onClose} aria-label={`Закрыть панель: ${b.name}`}>
          Закрыть
        </button>
      </header>
      <p className="info__text">{b.description}</p>
      <dl className="info__stats">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="info__note">На экране радиус тела и расстояние до Солнца условны: масштаб изменён ради наглядности.</p>
    </aside>
  );
}

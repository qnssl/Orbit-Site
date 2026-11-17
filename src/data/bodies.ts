export type BodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type BodyKind = 'star' | 'terrestrial' | 'gas-giant' | 'ice-giant';

export const KIND_LABEL: Record<BodyKind, string> = {
  star: 'Звезда',
  terrestrial: 'Планета земной группы',
  'gas-giant': 'Газовый гигант',
  'ice-giant': 'Ледяной гигант',
};

export interface Body {
  id: BodyId;
  name: string;
  kind: BodyKind;
  description: string;
  swatch: string;
  radiusKm: number;
  distanceMlnKm: number | null;
  distanceAu: number | null;
  orbitalPeriodDays: number | null;
  rotationPeriodHours: number;
  axialTiltDeg: number;
  gravityMs2: number;
  temperature: string;
  moons: string;
  visual: {
    radius: number;
    orbitRadius: number;
    phase: number;
    hasRings?: boolean;
    atmosphere?: { color: string; intensity: number; scale: number };
    bump?: number;
  };
}

export const BODIES: Body[] = [
  {
    id: 'sun',
    name: 'Солнце',
    kind: 'star',
    description:
      'Звезда в центре системы. Содержит почти всю массу Солнечной системы (около 99,86 %), а её гравитация удерживает на орбитах все планеты. Энергию даёт термоядерный синтез в ядре.',
    swatch: '#ffb34a',
    radiusKm: 695700,
    distanceMlnKm: null,
    distanceAu: null,
    orbitalPeriodDays: null,
    rotationPeriodHours: 609.1,
    axialTiltDeg: 7.25,
    gravityMs2: 274,
    temperature: 'около 5 500 °C на видимой поверхности',
    moons: '—',
    visual: { radius: 4.5, orbitRadius: 0, phase: 0 },
  },
  {
    id: 'mercury',
    name: 'Меркурий',
    kind: 'terrestrial',
    description:
      'Ближайшая к Солнцу и самая маленькая планета. Почти без атмосферы, поэтому перепады температур между днём и ночью очень велики. Поверхность покрыта кратерами.',
    swatch: '#9a948c',
    radiusKm: 2439.7,
    distanceMlnKm: 57.9,
    distanceAu: 0.387,
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6,
    axialTiltDeg: 0.03,
    gravityMs2: 3.7,
    temperature: 'около 167 °C (среднее по поверхности)',
    moons: 'нет',
    visual: { radius: 0.5, orbitRadius: 9, phase: 0.6, bump: 1.5 },
  },
  {
    id: 'venus',
    name: 'Венера',
    kind: 'terrestrial',
    description:
      'Размером близка к Земле, но скрыта плотной атмосферой из углекислого газа. Сильный парниковый эффект делает её самой горячей планетой системы. Вращается в обратную сторону, очень медленно.',
    swatch: '#dcbf8a',
    radiusKm: 6051.8,
    distanceMlnKm: 108.2,
    distanceAu: 0.723,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5,
    axialTiltDeg: 177.4,
    gravityMs2: 8.87,
    temperature: 'около 464 °C (у поверхности)',
    moons: 'нет',
    visual: { radius: 0.95, orbitRadius: 12.5, phase: 2.4, atmosphere: { color: '#e8c88a', intensity: 0.9, scale: 1.09 } },
  },
  {
    id: 'earth',
    name: 'Земля',
    kind: 'terrestrial',
    description:
      'Единственное известное тело, где есть жизнь. На поверхности много жидкой воды, атмосфера из азота и кислорода. Имеет один крупный естественный спутник — Луну.',
    swatch: '#3f7fb5',
    radiusKm: 6371,
    distanceMlnKm: 149.6,
    distanceAu: 1,
    orbitalPeriodDays: 365.26,
    rotationPeriodHours: 23.93,
    axialTiltDeg: 23.44,
    gravityMs2: 9.8,
    temperature: 'около 15 °C (среднее по поверхности)',
    moons: '1 (Луна)',
    visual: { radius: 1, orbitRadius: 16, phase: 4.1, bump: 1, atmosphere: { color: '#5aa9ff', intensity: 1.2, scale: 1.12 } },
  },
  {
    id: 'mars',
    name: 'Марс',
    kind: 'terrestrial',
    description:
      'Холодная пустынная планета с тонкой атмосферой. Красноватый цвет придают оксиды железа в грунте. На Марсе находится гора Олимп — один из самых высоких известных вулканов Солнечной системы.',
    swatch: '#b5603f',
    radiusKm: 3389.5,
    distanceMlnKm: 227.9,
    distanceAu: 1.524,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    gravityMs2: 3.71,
    temperature: 'около −65 °C (среднее по поверхности)',
    moons: '2 (Фобос, Деймос)',
    visual: { radius: 0.7, orbitRadius: 20, phase: 1.2, bump: 1.5, atmosphere: { color: '#d98a60', intensity: 0.55, scale: 1.08 } },
  },
  {
    id: 'jupiter',
    name: 'Юпитер',
    kind: 'gas-giant',
    description:
      'Крупнейшая планета системы, состоит в основном из водорода и гелия. Заметны полосы облаков и Большое красное пятно — огромный долгоживущий атмосферный вихрь.',
    swatch: '#cfa57c',
    radiusKm: 69911,
    distanceMlnKm: 778.5,
    distanceAu: 5.203,
    orbitalPeriodDays: 4332.6,
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    gravityMs2: 24.79,
    temperature: 'около −110 °C (на уровне 1 бар)',
    moons: 'более 90',
    visual: { radius: 2.5, orbitRadius: 29, phase: 5.3, atmosphere: { color: '#d9b894', intensity: 0.4, scale: 1.06 } },
  },
  {
    id: 'saturn',
    name: 'Сатурн',
    kind: 'gas-giant',
    description:
      'Газовый гигант с самой заметной системой колец. Кольца состоят из множества частиц льда и камня. Средняя плотность планеты меньше плотности воды.',
    swatch: '#d8c08c',
    radiusKm: 58232,
    distanceMlnKm: 1432,
    distanceAu: 9.537,
    orbitalPeriodDays: 10759.2,
    rotationPeriodHours: 10.66,
    axialTiltDeg: 26.73,
    gravityMs2: 10.44,
    temperature: 'около −140 °C (на уровне 1 бар)',
    moons: 'более 140',
    visual: { radius: 2.1, orbitRadius: 39, phase: 3.2, hasRings: true, atmosphere: { color: '#e4cf9e', intensity: 0.35, scale: 1.06 } },
  },
  {
    id: 'uranus',
    name: 'Уран',
    kind: 'ice-giant',
    description:
      'Ледяной гигант, ось которого наклонена почти на 98°, поэтому планета как будто катится «на боку». Голубовато-зелёный цвет даёт метан в атмосфере.',
    swatch: '#8fd0d4',
    radiusKm: 25362,
    distanceMlnKm: 2867,
    distanceAu: 19.19,
    orbitalPeriodDays: 30688.5,
    rotationPeriodHours: -17.24,
    axialTiltDeg: 97.77,
    gravityMs2: 8.69,
    temperature: 'около −195 °C (на уровне 1 бар)',
    moons: 'около 30',
    visual: { radius: 1.5, orbitRadius: 48, phase: 0.2, atmosphere: { color: '#8fe0e6', intensity: 0.75, scale: 1.1 } },
  },
  {
    id: 'neptune',
    name: 'Нептун',
    kind: 'ice-giant',
    description:
      'Самая далёкая планета системы. Тёмно-синий ледяной гигант с очень быстрыми ветрами в атмосфере. Из-за большого расстояния полный оборот вокруг Солнца занимает около 165 земных лет.',
    swatch: '#3f62c4',
    radiusKm: 24622,
    distanceMlnKm: 4515,
    distanceAu: 30.07,
    orbitalPeriodDays: 60182,
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    gravityMs2: 11.15,
    temperature: 'около −200 °C (на уровне 1 бар)',
    moons: 'около 16',
    visual: { radius: 1.45, orbitRadius: 56, phase: 2.9, atmosphere: { color: '#4a78ff', intensity: 0.85, scale: 1.1 } },
  },
];

export const PLANETS: Body[] = BODIES.filter((b) => b.id !== 'sun');

export const BODY_BY_ID: Record<BodyId, Body> = BODIES.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<BodyId, Body>,
);

export interface SpeedOption {
  value: number;
}

export const SPEEDS: SpeedOption[] = [{ value: 2 }, { value: 10 }, { value: 40 }, { value: 150 }];
export const DEFAULT_SPEED_INDEX = 1;

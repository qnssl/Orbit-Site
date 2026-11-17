# Orbit — учебная 3D-модель Солнечной системы

Статическое клиентское приложение: React + TypeScript + Vite + Three.js (через React Three Fiber). Без backend, серверных функций и API-ключей.

> Это образовательная визуализация, а не астрономический симулятор. Размеры и расстояния масштабированы визуально, начальные положения планет условны, орбиты круговые, время модели не является календарной датой.

## Требования

- Node.js 20 или новее (npm входит в комплект).

## Запуск в IntelliJ IDEA

Откройте папку проекта, затем во встроенном терминале (Alt+F12):

```bash
npm install        # первый раз; создаст package-lock.json — закоммитьте его
npm run dev        # режим разработки, адрес выводится в терминале
npm run typecheck  # проверка типов
npm run build      # сборка в dist/
npm run preview    # локальный просмотр собранной версии
```

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub и отправьте код в ветку `main` (имя пользователя и репозитория в проекте нигде не зашиты).
2. На GitHub: **Settings → Pages → Source: GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` запускается при push в `main` и вручную (Actions → Deploy to GitHub Pages → Run workflow).

Путь `base` вычисляется автоматически: `/` для репозитория `username.github.io` и `/repository-name/` для остальных. Локально его можно задать через переменную `VITE_BASE`:

```bash
# Linux / macOS / Git Bash
VITE_BASE=/orbit/ npm run build
# Windows PowerShell
$env:VITE_BASE="/orbit/"; npm run build
```

Если `package-lock.json` есть в репозитории, workflow использует `npm ci`, иначе `npm install`.

## Структура

- `src/data/bodies.ts` — типизированные данные о Солнце и планетах (с единицами измерения).
- `src/sim/clock.ts` — часы модели; React-состояние на каждом кадре не обновляется.
- `src/scene/` — 3D-сцена, камера, орбиты и процедурные текстуры (canvas, без внешних файлов).
- `src/ui/` — HTML-интерфейс: список тел, панель объекта, управление временем, диалоги, 2D-fallback.

## Источники данных

Справочные значения в `bodies.ts` округлены. Ориентир для сверки: [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/). Автоматическая или ручная сверка значений с источником при создании проекта не выполнялась — перед публикацией проверьте цифры.

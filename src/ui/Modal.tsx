import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal__body">
        <header className="modal__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Закрыть
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Справка по управлению" onClose={onClose}>
      <h3>Мышь и сенсорный экран</h3>
      <ul>
        <li>Перетаскивание — вращение камеры вокруг системы или выбранного тела.</li>
        <li>Колесо мыши или щипок двумя пальцами — приближение и отдаление.</li>
        <li>Клик или касание по телу либо по его подписи — выбор объекта.</li>
      </ul>
      <h3>Список тел</h3>
      <p>Список слева (на телефоне — лента сверху) работает с клавиатуры: Tab, Enter или пробел выбирают тело. Данные открываются в панели объекта.</p>
      <h3>Клавиши</h3>
      <ul>
        <li><kbd>Пробел</kbd> — пауза и возобновление (когда фокус не на кнопке).</li>
        <li><kbd>R</kbd> — вернуться к общему виду.</li>
        <li><kbd>1</kbd>–<kbd>4</kbd> — скорость времени.</li>
        <li><kbd>Esc</kbd> — закрыть панель объекта или диалог.</li>
      </ul>
      <h3>Нижняя панель</h3>
      <p>Пауза, четыре скорости (суток модели в секунду), сброс времени, общий вид, включение орбит и подписей.</p>
    </Modal>
  );
}

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="О модели" onClose={onClose}>
      <p>Orbit — учебная визуализация, а не астрономический симулятор. Она не показывает, где планеты находятся сегодня.</p>
      <h3>Допущения</h3>
      <ul>
        <li>Размеры тел и расстояния между орбитами визуально масштабированы и не соответствуют физическому масштабу.</li>
        <li>Начальные положения планет условные и не соответствуют текущей дате.</li>
        <li>Орбиты упрощены: круговые, лежат в одной плоскости. Реальные эфемериды не используются.</li>
        <li>Время модели — счётчик суток с момента запуска, а не календарная дата.</li>
        <li>Скорость вращения тел вокруг осей показана условно, а направление (в том числе обратное у Венеры и Урана) и наклон осей соответствуют справочным данным.</li>
        <li>Поверхности — процедурные стилизованные текстуры, а не фотографии.</li>
        <li>Из спутников показана только Луна (декоративно, с условным радиусом орбиты). Остальные спутники и астероиды не показаны.</li>
        <li>Свечение атмосфер и рельеф поверхностей — стилизованные эффекты, а не физическое моделирование.</li>
      </ul>
      <h3>Данные</h3>
      <p>Характеристики в панели объекта округлены. Ориентир для сверки — справочная таблица NASA Planetary Fact Sheet. Автоматическая сверка значений с источником в этой версии не выполнялась.</p>
      <p>
        <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener noreferrer">
          NASA Planetary Fact Sheet
        </a>
      </p>
    </Modal>
  );
}

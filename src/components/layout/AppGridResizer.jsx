import { useRef } from 'react';

const DEFAULT_STEP = 16;

export const clampGridSize = (value, min, max) => Math.min(max, Math.max(min, value));

export function gridSizeFromKey(key, value, min, max, step = DEFAULT_STEP) {
  if (key === 'ArrowLeft') return clampGridSize(value - step, min, max);
  if (key === 'ArrowRight') return clampGridSize(value + step, min, max);
  if (key === 'Home') return min;
  if (key === 'End') return max;
  return null;
}

/**
 * Separador vertical accessible per a columnes redimensionables.
 *
 * @param {{
 *   label: string,
 *   value: number,
 *   min: number,
 *   max: number,
 *   onResize: (value: number) => void,
 *   className?: string,
 *   controls?: string
 * }} props
 *
 * Corrector del Gauntlet f4 (30-10-2026) · `controls` (opcional): l'id de la
 * columna que redimensiona, per a aria-controls (patró «Window Splitter» de
 * l'APG). `max` és el màxim real, el que deixa l'espai: el declara
 * aria-valuemax i hi porten Fi i l'arrossegament.
 */
export default function AppGridResizer({
  label,
  value,
  min,
  max,
  onResize,
  className = '',
  controls = undefined,
}) {
  const dragRef = useRef(null);

  const handlePointerDown = (event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startValue: value,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onResize(clampGridSize(drag.startValue + event.clientX - drag.startX, min, max));
  };

  const handlePointerEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleKeyDown = (event) => {
    const nextValue = gridSizeFromKey(event.key, value, min, max);
    if (nextValue == null) return;
    event.preventDefault();
    onResize(nextValue);
  };

  return (
    <div
      className={`app-grid-resizer ${className}`.trim()}
      role="separator"
      aria-label={label}
      aria-controls={controls}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    />
  );
}

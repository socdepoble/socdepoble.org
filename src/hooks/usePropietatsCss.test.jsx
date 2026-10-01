/* T10 (ordre del Mestre, 261001) · Propietats CSS des d'una ref, mai un
   style en JSX: s'escriuen, es renoven quan canvien i es lleven en desmuntar. */
import { useRef } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { usePropietatsCss } from './usePropietatsCss.js';

afterEach(cleanup);

function Caixa({ propietats }) {
  const ref = useRef(null);
  usePropietatsCss(ref, propietats);
  return <div ref={ref} data-testid="caixa" />;
}

test('escriu les propietats, salta les nul·les i lleva les velles quan canvien', () => {
  const { getByTestId, rerender } = render(<Caixa propietats={{ '--sdp-cal-inici': 600, '--sdp-cal-fi': null, '--sdp-cal-col': 0 }} />);
  const caixa = getByTestId('caixa');
  expect(caixa.style.getPropertyValue('--sdp-cal-inici')).toBe('600');
  expect(caixa.style.getPropertyValue('--sdp-cal-col')).toBe('0');
  expect(caixa.style.getPropertyValue('--sdp-cal-fi')).toBe('');
  rerender(<Caixa propietats={{ '--sdp-cal-inici': 630 }} />);
  expect(caixa.style.getPropertyValue('--sdp-cal-inici')).toBe('630');
  expect(caixa.style.getPropertyValue('--sdp-cal-col')).toBe('');
});

test('en desmuntar no deixa cap propietat òrfena', () => {
  let node = null;
  function AmbNode() {
    const ref = useRef(null);
    usePropietatsCss(ref, { '--sdp-cal-carril': 2 });
    return <span ref={(el) => { ref.current = el; if (el) node = el; }} />;
  }
  const { unmount } = render(<AmbNode />);
  expect(node.style.getPropertyValue('--sdp-cal-carril')).toBe('2');
  unmount();
  expect(node.style.getPropertyValue('--sdp-cal-carril')).toBe('');
});

import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import logoDark from '../assets/ui/logo-socdepoble-rect-negre.svg';
import logoLight from '../assets/ui/logo-socdepoble-rect-blanc.svg';
import BrandMark from './BrandMark.jsx';

afterEach(cleanup);

test.each([['light', logoLight], ['dark', logoDark]])('la marca %s reserva la proporció del seu SVG conegut', (variant, src) => {
  const img = render(<BrandMark variant={variant} className="mobileBrandMark" />).getByRole('img', { name: 'Sóc de Poble' });
  expect(img.getAttribute('src')).toBe(src);
  expect(img.getAttribute('class')).toBe('mobileBrandMark');
  expect(img.getAttribute('width')).toBe('300');
  expect(img.getAttribute('height')).toBe('78');
  expect(img.getAttribute('fetchpriority')).toBe('high');
  expect(img.hasAttribute('style')).toBe(false);
});

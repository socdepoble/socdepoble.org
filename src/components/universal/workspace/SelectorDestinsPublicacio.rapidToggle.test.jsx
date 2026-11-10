import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import SelectorDestinsPublicacio from './SelectorDestinsPublicacio.jsx';

afterEach(cleanup);
test.each([false, true])('tres clics agrupats conserven una sola destinació (StrictMode=%s)', async strict => {
  const desa = vi.fn().mockResolvedValue(undefined);
  const font = { font: 'herbari', id: 'romer', title: 'Romer' };
  const selector = <SelectorDestinsPublicacio font={font} inicials={['bar']} desa={desa} autoritzat />;
  render(strict ? <StrictMode>{selector}</StrictMode> : selector);
  const input = screen.getByRole('checkbox', { name: 'Rebost privat' });
  act(() => { fireEvent.click(input); fireEvent.click(input); fireEvent.click(input); });
  expect(input.checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
  await waitFor(() => expect(desa).toHaveBeenCalledWith(font, ['bar', 'rebost']));
  expect(desa).toHaveBeenCalledTimes(1);
});

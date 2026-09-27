import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AppGridShell from './AppGridShell.jsx';

vi.mock('../../config/storage.js', () => ({
  getVal: () => ({ left: 420, middle: 340 }),
  setVal: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('plegar i desplegar recalcula el layout sense esperar un canvi del contenidor', () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(950);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  const { container, rerender } = render(<AppGridShell />);
  const shell = () => container.querySelector('.app-grid-shell');
  expect(shell().dataset.layout).toBe('mitja');

  rerender(<AppGridShell leftCollapsed />);
  expect(shell().dataset.layout).toBe('ample');
  expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
  expect(container.querySelector('#app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();

  rerender(<AppGridShell />);
  expect(shell().dataset.layout).toBe('mitja');
  expect(shell().dataset.panell).toBe('left');
  expect(container.querySelector('#app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();
});

/* T41 (ordre del Mestre, 260928) · PUBLICAR obri el selector de visibilitat:
   el botó ho anuncia (aria-haspopup). La barra continua muda: només crida onPublish. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('amb publishPopup, PUBLICAR porta aria-haspopup i continua cridant onPublish; sense, com sempre', () => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 900 } }]); }
    disconnect() {}
  });
  const onPublish = vi.fn();
  const { container, rerender } = render(<UniversalToolbar onPublish={onPublish} publishPopup="dialog" />);
  const boto = within(container).getByRole('button', { name: 'Publicar' });
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  fireEvent.click(boto);
  expect(onPublish).toHaveBeenCalledOnce();
  rerender(<UniversalToolbar onPublish={onPublish} />);
  expect(within(container).getByRole('button', { name: 'Publicar' }).hasAttribute('aria-haspopup')).toBe(false);
});

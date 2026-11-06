/* IDEA-108 · V-06 · Si el tros lazy del servei de veu no es pot carregar, el
   botó diu que ha fallat (common.veuIaiaFallada), no que el navegador no
   sap llegir en veu alta. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';

vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActionsOpcional: () => null,
  useUIStateOpcional: () => ({ language: 'ca' }),
}));
vi.mock('../../../services/veuIaiaService.js', () => {
  throw new Error('tros lazy no disponible');
});
import { BotoVeuIaia } from './BotoVeuIaia.jsx';

afterEach(cleanup);

describe('BotoVeuIaia · càrrega lazy fallida', () => {
  test('mostra la fallada, no «este navegador no pot llegir»', async () => {
    render(<BotoVeuIaia text="Hola" />);
    const missatge = await screen.findByRole('status');
    expect(missatge.textContent).toBe('No s’ha pogut llegir en veu alta. Torna-ho a provar.');
    const boto = screen.getByRole('button');
    expect(boto.disabled).toBe(true);
    expect(boto.getAttribute('aria-describedby')).toBe(missatge.id);
  });
});

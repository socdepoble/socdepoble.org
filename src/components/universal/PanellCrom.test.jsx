import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MISSATGE_PERSONALITZACIO } from '../../data/errorsBackend.js';

const sessio = vi.hoisted(() => ({ rol: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ rol: sessio.rol }) }));
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El port i el contingut core
   que «Desar» necessita; sense la capacitat, el panell és el d'abans. */
const port = vi.hoisted(() => ({ capacitats: new Set(), desa: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => port.capacitats.has(cap),
  adminDesaPersonalitzacio: (...a) => port.desa(...a)
}));
const core = vi.hoisted(() => ({ valor: { personalitzacio: null, refresh: vi.fn() } }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => core.valor }));

import { BotoCrom, PanellCrom } from './PanellCrom.jsx';

// La condició vella deixava passar tothom en MODE development: la prova es fa
// en eixe mode perquè el forat no puga tornar sense que ho notem.
beforeEach(() => {
  vi.stubEnv('MODE', 'development');
  port.capacitats = new Set();
  port.desa.mockReset().mockResolvedValue({ clau: 'estil', payload: {}, versio: 1 });
  core.valor = { personalitzacio: null, refresh: vi.fn() };
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

test.each([null, 'desconegut', 'usuari'])('rol %s: la roda del crom no es mostra, tampoc en desenvolupament', (rol) => {
  sessio.rol = rol;
  render(<BotoCrom />);
  expect(screen.queryByRole('button', { name: 'Crom del sistema' })).toBeNull();
});

test('superadmin: la roda del crom es mostra', () => {
  sessio.rol = 'superadmin';
  render(<BotoCrom />);
  expect(screen.getByRole('button', { name: 'Crom del sistema' })).toBeTruthy();
});

function muntaPanell() {
  const arrel = document.createElement('div');
  arrel.className = 'sdp-root';
  document.body.appendChild(arrel);
  const resultat = render(<PanellCrom arrel={arrel} obert onTanca={() => {}} />);
  return { arrel, ...resultat };
}
const noms = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') || b.textContent);

test('sense la capacitat personalitzacio, el panell obert és el d’abans: Aplicar i Tornar al cànon, cap «Desar»', () => {
  muntaPanell();
  expect(noms()).toEqual(['Tancar', 'Aplicar', 'Tornar al cànon']);
  expect(screen.queryByRole('status')).toBeNull();
});

test('amb la capacitat: «Desar» al costat d’Aplicar crida adminDesaPersonalitzacio amb l’estil desat fusionat, el gir i la versió, i refresca', async () => {
  port.capacitats = new Set(['personalitzacio']);
  core.valor = {
    personalitzacio: { taxonomia: null, estil: { payload: { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: { to: 40 } }, versio: 2 } },
    refresh: vi.fn()
  };
  port.desa.mockResolvedValue({ clau: 'estil', payload: {}, versio: 3 });
  muntaPanell();
  expect(noms()).toEqual(['Tancar', 'Aplicar', 'Desar', 'Tornar al cànon']);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });
  expect(port.desa).toHaveBeenCalledTimes(1);
  /* En jsdom el gir és 0 (cap token computat): el crom desat queda null, els tokens es conserven. */
  expect(port.desa).toHaveBeenCalledWith({ clau: 'estil', payload: { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: null }, versio: 2 });
  expect(screen.getByRole('status').textContent).toContain('Crom desat per a tot el poble (versió 3).');
  expect(core.valor.refresh).toHaveBeenCalledTimes(1);
});

test.each([
  ['cal-segon-factor', MISSATGE_PERSONALITZACIO['cal-segon-factor']],
  ['conflicte-versio', MISSATGE_PERSONALITZACIO['conflicte-versio']],
  [undefined, MISSATGE_PERSONALITZACIO.desconegut]
])('«Desar» amb el codi %s: la frase del codi, sense el text del proveïdor, i el botó torna a estar actiu', async (code, frase) => {
  port.capacitats = new Set(['personalitzacio']);
  port.desa.mockRejectedValue(Object.assign(new Error('Supabase 403: {"code":"42501"}'), code ? { code } : {}));
  muntaPanell();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });
  const alerta = screen.getByRole('alert');
  expect(alerta.textContent).toContain(frase);
  expect(alerta.textContent).not.toContain('Supabase');
  expect(core.valor.refresh).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Desar' }).disabled).toBe(false);
});

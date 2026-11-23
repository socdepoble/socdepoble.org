import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

/* v1.2.23 · R2E-04 (Gauntlet R2) · El tros dels textos del calaix de la barra
   negra (textosCalaixIdentitats.js) quan no arriba: el calaix s'obri igual,
   amb els textos fixos i els rols en valencià (v1.2.23 · integració,
   pesDelNucli: el rol també viu al tros, propsDelCalaix; és el calaix d'abans
   de la v1.2.23), i el clic següent ho torna a provar. Fitxer propi: la càrrega
   es recorda al mòdul del hook (useIdentitatDeLaBarra.js · diferit), i a
   useIdentitatDeLaBarra.test.jsx ja ha arribat bé. La sessió, la identitat,
   els mitjans, el traductor i el tros, simulats. */
/* `porta`: el tros no arriba fins que la prova l'obri (la xarxa lenta). */
const m = vi.hoisted(() => ({ t: null, identitat: null, fallaTextos: false, carregues: 0, porta: Promise.resolve() }));
vi.mock('../../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: { id: 'u-1' }, logout: vi.fn(), preparaEixida: vi.fn() }),
  useSessioOpcional: () => ({ currentUser: { id: 'u-1' }, logout: vi.fn(), preparaEixida: vi.fn() }),
}));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => m.identitat,
  useIdentitatOpcional: () => m.identitat,
}));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null),
}));
vi.mock('./textosCalaixIdentitats.js', async (importOriginal) => {
  m.carregues += 1;
  await m.porta;
  if (m.fallaTextos) throw new Error('xarxa');
  return importOriginal();
});
import { useIdentitatDeLaBarra } from './useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva } from './BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from './CalaixIdentitats.jsx';

function Barra() {
  const { boto, calaix } = useIdentitatDeLaBarra({ onNavega: vi.fn(), etiquetaEntrar: 'Entrar' });
  return (
    <>
      <header className="bar-black"><div className="right-icons"><BotoIdentitatActiva {...boto} /></div></header>
      {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
}

const PERSONA = { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: null, rol: 'persona' };
const FORN = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner' };

beforeEach(() => {
  m.t = createTranslator('en');
  m.identitat = { actor: PERSONA, identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }], setActor: vi.fn(() => true) };
});
afterEach(cleanup);

test('R2E-04 · no s’obri a mitges; sense el tros, s’obri igual en valencià; el clic següent el torna a demanar i parla anglés', async () => {
  m.fallaTextos = true;
  let obriLaPorta;
  m.porta = new Promise((resol) => { obriLaPorta = resol; });
  render(<Barra />);
  const boto = screen.getByRole('button', { name: 'Active identity: Pepa Soler. Switch identity, language or sign out' });
  await act(async () => { fireEvent.click(boto); });
  /* El tros encara és en camí: cap calaix a mitges (ni el títol valencià amb els botons en anglés). */
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  await act(async () => { obriLaPorta(); });
  /* No ha arribat: el calaix s'obri igual, amb els textos fixos de sempre. */
  const dialeg = await screen.findByRole('dialog', { name: 'Amb qui actues?' });
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(within(dialeg).getByRole('list', { name: 'Identitats' })).toBeTruthy();
  const rols = [...dialeg.querySelectorAll('.sdp-calaix-identitats__rol')].map((rol) => rol.textContent);
  expect(rols).toEqual(['Persona', 'Propietari']);
  expect(within(dialeg).getByRole('button', { name: 'System language' })).toBeTruthy();
  const carreguesFallides = m.carregues;
  expect(carreguesFallides).toBeGreaterThan(0);

  /* La xarxa torna: tancar i tornar a obrir el demana de nou. */
  m.fallaTextos = false;
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: /^(Tancar|Close)$/ })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { fireEvent.click(boto); });
  expect(await screen.findByRole('dialog', { name: 'Who are you acting as?' })).toBeTruthy();
  expect(m.carregues).toBeGreaterThan(carreguesFallides);
  expect(screen.getByRole('list', { name: 'Identities' })).toBeTruthy();
  /* Amb el tros, els rols també en la llengua de la interfície (rolDeLaIdentitat). */
  expect([...document.querySelectorAll('.sdp-calaix-identitats__rol')].map((rol) => rol.textContent)).toEqual(['Person', 'Owner']);
});

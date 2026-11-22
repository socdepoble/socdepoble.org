/* v1.2.19 · Gauntlet R1 (L3-01) · «Els teus pobles» en les cinc llengües: el
   text visible de «Fer principal» i «Llevar» ix del mateix diccionari que
   l'aria-label, i el nom accessible hi comença (WCAG 2.5.3, regla A11Y-1).
   En valencià, text i aria-label queden byte a byte com en la v1.2.18. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ t: null }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: vi.fn(), preparaEixida: vi.fn() }),
  useSessioOpcional: () => null,
}));
vi.mock('../../admin/SegonFactor.jsx', () => ({ SegonFactor: () => null }));
/* El traductor de l'app, simulat: només respon la clau amb què el diccionari endevina la llengua. */
vi.mock('../../../components/PedraSeca/hooks/useTraductorOpcional.js', () => ({
  useTraductorOpcional: () => m.t,
  tradueix: (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva),
}));
import DetallAjust from '../DetallAjust.jsx';
import { textosPerfilA11y } from '../i18nPerfilA11y.js';

const MARCA_LLENGUA = Object.freeze({ es: 'Cerrar sesión', en: 'Log out', eu: 'Itxi saioa', gl: 'Pechar sesión' });
const traductorDe = (codi) => (codi === 'ca' ? null : (clau, reserva) => (clau === 'section.xat.ajustos.tancaSessio' ? MARCA_LLENGUA[codi] : reserva));

const CATALEG = Object.freeze([
  { valor: '', etiqueta: 'Tria un poble…' },
  { valor: 'Benifallim', etiqueta: 'Benifallim' },
  { valor: 'La Torre de les Maçanes', etiqueta: 'La Torre de les Maçanes' },
  { valor: 'Xixona', etiqueta: 'Xixona' },
]);
const POBLES = Object.freeze({
  id: 'poble', lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', multiple: true,
  valor: 'La Torre de les Maçanes · Xixona · Benifallim', obert: true, opcions: CATALEG,
});
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });

const botonsDeLaLlista = (tx) => within(screen.getByRole('list', { name: tx.elsTeusPoblesAria })).getAllByRole('button');

afterEach(() => { cleanup(); m.t = null; vi.restoreAllMocks(); });

describe('v1.2.19 · Gauntlet R1 (L3-01) · Perfil, «Els teus pobles»: el nom accessible comença pel text visible', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: cada botó es veu traduït i el seu aria-label hi comença', (codi) => {
    m.t = traductorDe(codi);
    const tx = textosPerfilA11y({ language: codi });
    render(<DetallAjust ajust={POBLES} identitat={jo} guardarAjust={vi.fn()} />);
    const botons = botonsDeLaLlista(tx);
    /* Dos «Fer principal» (el primer és el principal) i tres «Llevar». */
    expect(botons).toHaveLength(5);
    for (const boto of botons) {
      const visible = boto.textContent.trim();
      expect([tx.ferPrincipal, tx.llevar], `${codi}: ${visible}`).toContain(visible);
      expect(boto.getAttribute('aria-label').startsWith(visible), `${codi}: «${boto.getAttribute('aria-label')}» / «${visible}»`).toBe(true);
    }
    expect(screen.getByRole('button', { name: tx.llevarPobleAria('Benifallim') }).textContent).toBe(tx.llevar);
    expect(screen.getByRole('button', { name: tx.ferPrincipalPobleAria('Xixona') }).textContent).toBe(tx.ferPrincipal);
  });

  test('ca: text visible i aria-label byte a byte com en la v1.2.18', () => {
    render(<DetallAjust ajust={POBLES} identitat={jo} guardarAjust={vi.fn()} />);
    const fesPrincipal = screen.getByRole('button', { name: 'Fer principal Xixona' });
    const lleva = screen.getByRole('button', { name: 'Llevar Benifallim' });
    expect(fesPrincipal.textContent).toBe('Fer principal');
    expect(lleva.textContent).toBe('Llevar');
    expect(fesPrincipal.getAttribute('aria-label')).toBe('Fer principal Xixona');
    expect(lleva.getAttribute('aria-label')).toBe('Llevar Benifallim');
  });

  test('en: «Make primary» passa el poble primer i el focus troba el seu «Remove» pel mateix diccionari', async () => {
    m.t = traductorDe('en');
    render(<DetallAjust ajust={POBLES} identitat={jo} guardarAjust={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Make primary: Xixona' })); });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Xixona' }));
    expect(document.activeElement.textContent).toBe('Remove');
  });
});

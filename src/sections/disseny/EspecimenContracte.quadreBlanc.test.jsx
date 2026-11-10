/* Onada R16b (C5-09) · L'espècimen del Contracte pinta els dos patrons nous (el quadre blanc
   editorial i on s'obrin els ajustos de l'espai de treball) i els pinta en la llengua de la
   interfície. Només asseveracions de render de l'espècimen: cap lectura del text font d'altres
   fitxers. L'estructura documentada és un selector CSS i es prova contra el DOM que es pinta. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const ui = vi.hoisted(() => ({ actions: null }));
vi.mock('../../app/contexts/UIContext', async (original) => ({ ...await original(), useUIActionsOpcional: () => ui.actions }));

import EspecimenContracte, { DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA } from './cataleg/detalls/EspecimenContracte.jsx';

const traductor = (diccionari) => (clau, reserva) => diccionari[clau] ?? reserva;
const EDITORIAL = DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA.find((item) => item.id === 'redaccio-editorial-h4-h5-p');

afterEach(() => { cleanup(); ui.actions = null; });

describe('EspecimenContracte · quadre blanc editorial i ajustos de l’espai de treball', () => {
  it('pinta els tres patrons del quadre blanc, cadascun amb el seu estat i quan usar-lo, i l’estructura dels dos canònics', () => {
    render(<EspecimenContracte />);
    const matriu = screen.getByRole('group', { name: 'Quadres blancs editorials i llistes tècniques curtes' });
    expect(matriu.getAttribute('data-testid')).toBe('diagnostic-operatiu-quadres-blancs');
    const blocs = within(matriu).getAllByRole('article');
    expect(blocs.map((bloc) => bloc.getAttribute('data-patro-id'))).toEqual(DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA.map((item) => item.id));
    expect(blocs.map((bloc) => within(bloc).getByRole('heading', { level: 5 }).textContent)).toEqual([
      'Redacció editorial (h4/h5 + p) · Canònic',
      'Parella tècnica curta (dl) · Canònic',
      'Fals tauler en columnes (dl amb paràgrafs llargs) · Prohibit'
    ]);
    expect(blocs.map((bloc) => bloc.querySelector('code')?.textContent ?? null)).toEqual([
      '.sdp-admin-editorial-stack > .sdp-admin-editorial-bloc > :is(h4, h5) + p', 'dl > dt + dd', null
    ]);
    for (const [index, item] of DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA.entries()) {
      expect(blocs[index].textContent).toContain(item.quanUsar[1]);
    }
  });

  it('l’estructura editorial documentada casa amb el que pinta l’espècimen: cada bloc, un h5 sota l’h4 de la secció i un paràgraf', () => {
    const { container } = render(<EspecimenContracte />);
    const blocs = [...container.querySelectorAll('.sdp-admin-editorial-bloc')];
    expect(blocs).toHaveLength(5);
    /* El selector documentat troba el paràgraf de tots els blocs, i només eixos. */
    const casats = [...container.querySelectorAll(EDITORIAL.estructura)];
    expect(casats).toEqual(blocs.map((bloc) => bloc.querySelector(':scope > p')));
    for (const bloc of blocs) {
      const titol = bloc.querySelector(':scope > :is(h4, h5)');
      expect(titol.tagName).toBe('H5');
      expect(titol.nextElementSibling.tagName).toBe('P');
      /* La secció que el conté s'obri amb un h4: l'h5 no salta cap nivell. */
      let anterior = bloc.closest('.sdp-admin-editorial-stack').previousElementSibling;
      while (anterior && !/^H[1-6]$/.test(anterior.tagName)) anterior = anterior.previousElementSibling;
      expect(anterior?.tagName).toBe('H4');
    }
  });

  it('tot quadre editorial amb nom és un grup: el lector de pantalla anuncia el nom', () => {
    const { container } = render(<EspecimenContracte />);
    const ambNom = [...container.querySelectorAll('.sdp-admin-editorial-stack[aria-label]')];
    expect(ambNom).toHaveLength(2);
    expect(ambNom.map((stack) => stack.getAttribute('role'))).toEqual(['group', 'group']);
    expect(screen.getAllByRole('group').filter((grup) => grup.classList.contains('sdp-admin-editorial-stack'))).toEqual(ambNom);
  });

  it('els ajustos: columna 3 als catàlegs de CatalegWorkspace i diàleg a la resta, sense cap llei sobre els altres diàlegs', () => {
    render(<EspecimenContracte />);
    expect(screen.getByRole('heading', { level: 4, name: 'Ajustos de l’espai de treball: columna 3 als catàlegs, diàleg a la resta' })).toBeTruthy();
    const ajustos = screen.getByRole('group', { name: 'Ajustos de l’espai de treball: columna 3 als catàlegs, diàleg a la resta' });
    expect(ajustos.getAttribute('data-testid')).toBe('ajustos-espai-treball');
    expect(within(ajustos).getAllByRole('heading', { level: 5 }).map((h) => h.textContent))
      .toEqual(['Catàlegs: ajustos en la columna 3', 'Resta d’espais: ajustos en un diàleg']);
    const [columna3, dialeg] = within(ajustos).getAllByRole('article');
    expect(columna3.textContent).toContain('CatalegWorkspace');
    expect(dialeg.textContent).toContain('WorkspaceSettingsDialog');
    expect(dialeg.textContent).toContain('FullAjustos');
    /* La llei antiga (cap modal per a la configuració densa; un modal només per a confirmar) no es pinta. */
    expect(ajustos.textContent).not.toContain('DialegConfirmacio');
    expect(screen.queryByText(/cap modal per a la configuració densa/)).toBeNull();
  });

  it('amb la interfície en castellà, els dos patrons ixen en castellà', () => {
    ui.actions = { t: traductor(ES), language: 'es' };
    render(<EspecimenContracte />);
    expect(screen.getByRole('heading', { level: 4, name: 'Ley del cuadro blanco editorial y del falso tablero en columnas' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Ajustes del espacio de trabajo: columna 3 en los catálogos, diálogo en el resto' })).toBeTruthy();
    const matriu = screen.getByRole('group', { name: 'Cuadros blancos editoriales y listas técnicas cortas' });
    expect(within(matriu).getAllByRole('heading', { level: 5 }).map((h) => h.textContent)).toEqual([
      'Redacción editorial (h4/h5 + p) · Canónico',
      'Pareja técnica corta (dl) · Canónico',
      'Falso tablero en columnas (dl con párrafos largos) · Prohibido'
    ]);
    const ajustos = screen.getByRole('group', { name: 'Ajustes del espacio de trabajo: columna 3 en los catálogos, diálogo en el resto' });
    expect(within(ajustos).getAllByRole('heading', { level: 5 }).map((h) => h.textContent))
      .toEqual(['Catálogos: ajustes en la columna 3', 'Resto de espacios: ajustes en un diálogo']);
  });

  it.each([['es', ES], ['en', EN], ['eu', EU], ['gl', GL]])('amb la interfície en %s, cap text dels dos patrons no queda en valencià', (llengua, diccionari) => {
    ui.actions = { t: traductor(diccionari), language: llengua };
    render(<EspecimenContracte />);
    const clausNoves = Object.keys(CA).filter((clau) => clau.startsWith('section.disseny.contracte.'));
    expect(clausNoves.length).toBeGreaterThan(0);
    for (const clau of clausNoves) expect(diccionari[clau], clau).toBeTruthy();
    const matriu = screen.getByRole('group', { name: diccionari['section.disseny.contracte.quadreBlanc.diagnostic'] });
    const ajustos = screen.getByRole('group', { name: diccionari['section.disseny.contracte.modals.titol'] });
    const textNou = `${matriu.textContent} ${ajustos.textContent}`;
    for (const clau of clausNoves) {
      if (CA[clau] !== diccionari[clau]) expect(textNou, clau).not.toContain(CA[clau]);
    }
  });
});

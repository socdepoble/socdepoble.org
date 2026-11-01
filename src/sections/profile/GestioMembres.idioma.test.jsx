import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* El port, parcial com a GestioMembres.test.jsx: cap capacitat (ni la casella
   de la titular ni el veïnat connectat). */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
}));
import { GestioMembres, TEXTOS_MEMBRES } from './GestioMembres.jsx';
import { PARELLS_ROL } from '../../components/universal/identitat/rols.js';
import { PARELLS_TIPUS } from './membresModel.js';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { LANGUAGE_STORAGE_KEY } from '../../config/i18n.js';
import { delVal } from '../../config/storage.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
/* Les proves en una llengua que no és el valencià pinten des del primer fotograma amb els cinc diccionaris. */
import '../../../tests/helpers/diccionaris.js';

/* ═══════════════════════════════════════════════════════════════════
   T5a · P1-22 i P1-15 (assalt 261101) · LA GESTIÓ DELS MEMBRES EN CINC
   LLENGÜES, I LA CERCA ANUNCIADA

   GestioMembres.test.jsx prova el comportament en valencià (la reserva, sense
   UIProvider). Ací: els mateixos fluxos dins de l'App en castellà i en basc
   (patró «Etiqueta: {nom}»), la paritat dels parells, i el recompte de la
   cerca per al lector de pantalla (regió viva sense rol: l'únic role=status
   continua sent l'avís d'èxit).
   ═══════════════════════════════════════════════════════════════════ */

const persona = (id, nom, rol = 'member') => ({ tipus: 'persona', id, nom, avatar: '', rol, desDe: null });
const org = (id, nom) => ({ tipus: 'organitzacio', id, nom, avatar: '', rol: 'member', desDe: null });
const FORN = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { id: 'O', name: 'Forn', role: 'owner' } };
const MEMBRES = [persona('JO', 'Jo', 'owner'), persona('A', 'Andreu', 'admin'), persona('M', 'Marta'), org('G', 'Colla')];

function accionsAmb(extra = {}) {
  return {
    usuariId: 'JO',
    llistaMembres: vi.fn(async () => MEMBRES),
    desaMembre: vi.fn(async (_orgId, dades) => ({ ...dades, nom: dades.id === 'Q' ? 'Quique' : dades.id, avatar: '', desDe: null })),
    llevaMembre: vi.fn(async () => ({ llevat: true })),
    cercaCandidats: vi.fn(async () => [
      { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' },
      { tipus: 'organitzacio', id: 'K', nom: 'Cooperativa', avatar: '' },
    ]),
    ...extra,
  };
}

function pinta({ llengua = null, ...extra } = {}) {
  const accions = accionsAmb(extra);
  const vista = <GestioMembres organitzacio={FORN} accions={accions} />;
  render(llengua ? <UIProvider externalConfig={{ language: llengua }}>{vista}</UIProvider> : vista);
  return accions;
}

/* El text de cada cel·la tal com el llig un lector: sense les inicials decoratives (aria-hidden) de l'avatar. */
const textLlegible = (node) => {
  const copia = node.cloneNode(true);
  copia.querySelectorAll('[aria-hidden="true"]').forEach((amagat) => amagat.remove());
  return copia.textContent.trim();
};
const filesDe = (regio) => [...regio.querySelectorAll('tbody tr')]
  .map((tr) => [...tr.querySelectorAll('td')].slice(0, 3).map(textLlegible));
const anunci = () => document.querySelector('.sdp-nomes-lector[aria-live="polite"]');
const escriu = (etiqueta, text) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: text } });
const triaCandidat = async (etiquetaSelector, etiqueta) => {
  const selector = screen.getByLabelText(etiquetaSelector);
  await waitFor(() => expect([...selector.options].map((o) => o.textContent)).toContain(etiqueta), { timeout: 2000 });
  fireEvent.change(selector, { target: { value: [...selector.options].find((o) => o.textContent === etiqueta).value } });
};

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delVal(LANGUAGE_STORAGE_KEY); });

describe('P1-22 · els parells', () => {
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const PARELLS = [...Object.values(TEXTOS_MEMBRES), ...Object.values(PARELLS_ROL), ...Object.values(PARELLS_TIPUS)];
  const buitsDe = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  test('cada parell és a les cinc llengües, el valencià és la reserva i els buits són els mateixos', () => {
    // 36 de la gestió + 2 claus comunes reutilitzades, 3 rols i 2 tipus.
    expect(PARELLS).toHaveLength(43);
    expect(new Set(PARELLS.map(([clau]) => clau)).size).toBe(PARELLS.length);
    for (const [clau, reserva] of PARELLS) {
      expect(clau).toMatch(/^(?:section\.perfil\.(?:membres|rol)\.|common\.(?:search|cancela)$)/);
      expect(CA[clau], clau).toBe(reserva);
      for (const [codi, dic] of Object.entries(DICCIONARIS)) {
        expect(typeof dic[clau] === 'string' && dic[clau].trim() !== '', `${codi}: ${clau}`).toBe(true);
        expect(buitsDe(dic[clau]), `${codi}: ${clau}`).toEqual(buitsDe(reserva));
      }
    }
  });

  test('en basc, cap sufix enganxat a {nom} ni a {org} (el patró és «Etiqueta: {nom}»)', () => {
    const enganxats = PARELLS.map(([clau]) => [clau, EU[clau]]).filter(([, text]) => /\{(?:nom|org)\}\p{L}/u.test(text));
    expect(enganxats).toEqual([]);
  });
});

describe('P1-22 · dins de l’App en castellà', () => {
  test('la taula, les capçaleres, els rols, els tipus i els botons de cada fila', async () => {
    pinta({ llengua: 'es' });
    expect(screen.getByRole('status').textContent).toBe('Cargando los miembros…');
    const regio = await screen.findByRole('region', { name: 'Miembros de Forn' });
    expect(within(regio).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Miembro', 'Tipo', 'Rol', 'Acciones']);
    expect(filesDe(regio)).toEqual([
      ['Jo (tú)', 'Persona', 'Propietario'],
      ['Andreu', 'Persona', 'Administra'],
      ['Marta', 'Persona', 'Miembro'],
      ['Colla', 'Organización', 'Miembro'],
    ]);
    const etiquetes = within(regio).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(etiquetes).toEqual(['Volver a miembro: Andreu', 'Quitar: Andreu', 'Nombrar administradora: Marta', 'Quitar: Marta', 'Quitar: Colla']);
    expect(screen.getByRole('group', { name: 'Añadir un miembro' })).toBeTruthy();
    expect(screen.getByLabelText('Buscar')).toBeTruthy();
    expect(screen.getByText('Personas del pueblo u organizaciones que también administras. Escribe al menos 2 letras.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeTruthy();
    expect([...screen.getByLabelText('A quién quieres añadir').options].map((o) => o.textContent)).toEqual(['Primero escribe un nombre…']);
  });

  test('la confirmació de «Quitar» diu el nom i l’entitat, i el botó de tornar ja no és «Cancel·lar»', async () => {
    pinta({ llengua: 'es' });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    fireEvent.click(screen.getByRole('button', { name: 'Quitar: Colla' }));
    const dialeg = screen.getByRole('dialog', { name: '¿Quitar a Colla de Forn?' });
    expect(within(dialeg).getByText('Dejará de ser miembro. Se puede volver a añadir cuando haga falta.')).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: 'Quitar' })).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(dialeg.textContent).not.toContain('Cancel·lar');
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Quitar' })); });
    expect(screen.getByRole('status').textContent).toBe('Colla ya no es miembro de Forn.');
  });

  test('l’alta: les opcions del selector, el rol i l’avís d’èxit', async () => {
    const accions = pinta({ llengua: 'es' });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    escriu('Buscar', 'Qu');
    await triaCandidat('A quién quieres añadir', 'Quique · Persona');
    expect([...screen.getByLabelText('A quién quieres añadir').options].map((o) => o.textContent))
      .toEqual(['Elige un resultado…', 'Quique · Persona', 'Cooperativa · Organización']);
    const rol = screen.getByLabelText('Rol');
    expect([...rol.options].map((o) => [o.value, o.textContent])).toEqual([['member', 'Miembro'], ['admin', 'Administra']]);
    fireEvent.change(rol, { target: { value: 'admin' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Añadir' })); });
    expect(accions.desaMembre).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'Q', rol: 'admin' });
    expect(screen.getByRole('status').textContent).toBe('Quique ya es miembro de Forn.');
  });

  test('canvi de rol i errors sense text del servidor, en castellà', async () => {
    pinta({
      llengua: 'es',
      desaMembre: vi.fn(async (_orgId, dades) => {
        if (dades.id === 'A') throw new Error('');
        return { ...MEMBRES.find((m) => m.id === dades.id), rol: dades.rol };
      }),
    });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Nombrar administradora: Marta' })); });
    expect(screen.getByRole('status').textContent).toBe('Marta ya administra Forn.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Volver a miembro: Andreu' })); });
    expect(screen.getByRole('alert').textContent).toBe('No se ha podido cambiar el rol.');
  });

  test('si la llista no es pot llegir i el port no diu res, el genèric en castellà', async () => {
    pinta({ llengua: 'es', llistaMembres: vi.fn(async () => { throw new Error(''); }) });
    expect((await screen.findByRole('alert')).textContent).toBe('No se ha podido leer la lista de miembros.');
  });

  test('sense cap membre, ho diu en castellà', async () => {
    pinta({ llengua: 'es', llistaMembres: vi.fn(async () => []) });
    expect(await screen.findByText('Todavía no hay ningún miembro.')).toBeTruthy();
  });
});

describe('P1-22 · en basc, «Etiqueta: {nom}»', () => {
  test('la regió, els botons i la confirmació no enganxen cap sufix al nom', async () => {
    pinta({ llengua: 'eu' });
    const regio = await screen.findByRole('region', { name: 'Forn: kideak' });
    expect(within(regio).getByRole('button', { name: 'Kendu: Colla' })).toBeTruthy();
    fireEvent.click(within(regio).getByRole('button', { name: 'Kendu: Colla' }));
    const dialeg = screen.getByRole('dialog', { name: 'Colla kendu nahi duzu? Erakundea: Forn.' });
    expect(within(dialeg).getByRole('button', { name: 'Utzi' })).toBeTruthy();
  });
});

describe('P1-15 · el recompte de la cerca, per al lector de pantalla', () => {
  test('una regió viva sense rol: buida fins que hi ha resultats, i el recompte de la consulta del camp', async () => {
    pinta();
    await screen.findByRole('region', { name: 'Membres de Forn' });
    const regio = anunci();
    expect(regio).toBeTruthy();
    expect(regio.hasAttribute('role')).toBe(false);
    expect(regio.textContent).toBe('');
    escriu('Cerca', 'q');
    expect(anunci().textContent).toBe('');
    escriu('Cerca', 'Qu');
    // Mentre es cerca, res.
    expect(anunci().textContent).toBe('');
    await waitFor(() => expect(anunci().textContent).toBe('2 resultats per a «Qu».'), { timeout: 2000 });
    // Cap role=status nou: la regió no és un avís.
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });

  test('compta els que es poden afegir (no els que ja en són membres), i diu «un» i «cap»', async () => {
    const respostes = [
      [{ tipus: 'persona', id: 'M', nom: 'Marta', avatar: '' }, { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' }],
      [],
    ];
    pinta({ cercaCandidats: vi.fn(async () => respostes.shift() ?? []) });
    await screen.findByRole('region', { name: 'Membres de Forn' });
    escriu('Cerca', 'Ma');
    await waitFor(() => expect(anunci().textContent).toBe('Un resultat per a «Ma».'), { timeout: 2000 });
    escriu('Cerca', 'Mar');
    await waitFor(() => expect(anunci().textContent).toBe('Cap resultat per a «Mar».'), { timeout: 2000 });
  });

  test('mai el recompte d’una consulta vella: en canviar el text, la regió es buida en el mateix pintat', async () => {
    const QUIQUE = { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' };
    const COOPERATIVA = { tipus: 'organitzacio', id: 'K', nom: 'Cooperativa', avatar: '' };
    pinta({ cercaCandidats: vi.fn(async (_orgId, consulta) => (consulta === 'Qu' ? [QUIQUE, COOPERATIVA] : [QUIQUE])) });
    await screen.findByRole('region', { name: 'Membres de Forn' });
    escriu('Cerca', 'Qu');
    await waitFor(() => expect(anunci().textContent).toBe('2 resultats per a «Qu».'), { timeout: 2000 });
    /* Cada text que la regió ha tingut, també el d'un pintat intermedi que ja
       s'ha substituït: l'oldValue d'un canvi de text i el text d'un node llevat. */
    const vistos = new Set();
    const anota = (registres) => {
      for (const r of registres) {
        if (r.type === 'characterData') vistos.add(r.oldValue);
        for (const node of r.removedNodes) vistos.add(node.textContent);
      }
    };
    const observador = new MutationObserver(anota);
    observador.observe(anunci(), { childList: true, characterData: true, characterDataOldValue: true, subtree: true });
    escriu('Cerca', 'Qui');
    await waitFor(() => expect(anunci().textContent).toBe('Un resultat per a «Qui».'), { timeout: 2000 });
    anota(observador.takeRecords());
    observador.disconnect();
    vistos.add(anunci().textContent);
    vistos.delete('');
    vistos.delete('2 resultats per a «Qu».');
    // Cap estat intermedi amb la consulta nova i el recompte de la vella («2 resultats per a «Qui».»).
    expect([...vistos]).toEqual(['Un resultat per a «Qui».']);
  });

  test('si la cerca falla, l’error s’anuncia (role=alert) i la regió no diu cap recompte', async () => {
    pinta({ cercaCandidats: vi.fn(async () => { throw new Error('Sense xarxa'); }) });
    await screen.findByRole('region', { name: 'Membres de Forn' });
    escriu('Cerca', 'Qu');
    expect((await screen.findByRole('alert', {}, { timeout: 2000 })).textContent).toBe('Sense xarxa');
    expect(anunci().textContent).toBe('');
  });

  test('després d’una alta, un sol role=status (l’avís d’èxit)', async () => {
    pinta();
    await screen.findByRole('region', { name: 'Membres de Forn' });
    escriu('Cerca', 'Qu');
    await triaCandidat('Qui vols afegir', 'Quique · Persona');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Afegir' })); });
    expect(screen.getAllByRole('status').map((n) => n.textContent)).toEqual(['Quique ja és membre de Forn.']);
    expect(anunci().textContent).toBe('');
  });

  test('Escape tanca la confirmació i el focus torna al botó «Llevar» de la fila', async () => {
    const accions = pinta();
    await screen.findByRole('region', { name: 'Membres de Forn' });
    const boto = screen.getByRole('button', { name: 'Llevar: Colla' });
    boto.focus();
    fireEvent.click(boto);
    const dialeg = screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' });
    const cancel = new Event('cancel', { cancelable: true });
    await act(async () => { dialeg.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog', { name: 'Llevar Colla de Forn?' })).toBeNull();
    expect(accions.llevaMembre).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(boto);
  });
});

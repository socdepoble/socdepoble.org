import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* El port, parcial com a GestioMembres.test.jsx: cap capacitat (ni la casella
   de la titular ni el veïnat connectat). */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
}));
import { ERRORS_MEMBRES, ERRORS_TRANSFERENCIA, GestioMembres, TEXTOS_MEMBRES } from './GestioMembres.jsx';
import { MISSATGES_MEMBRES_ORGANITZACIO } from '../../data/contracte.js';
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
    // 36 de la gestió (+6 de la transferència, IDEA-24, M12) + 2 claus comunes reutilitzades, 3 rols i 2 tipus.
    expect(PARELLS).toHaveLength(49);
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
    // T11-02 · Sense codi, el genèric de la cerca: mai el text de l'error.
    expect((await screen.findByRole('alert', {}, { timeout: 2000 })).textContent).toBe('No s’ha pogut cercar a la gent del municipi.');
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

/* ═══════════════════════════════════════════════════════════════════
   T11-02 (Gemini, Tall 11; marató 261101_2143) · ELS ERRORS DEL PORT, PEL
   SEU CODI I EN LA LLENGUA DE LA INTERFÍCIE

   Abans, textDError pintava el `message` de l'error: en valencià en totes
   les llengües, i el text cru del proveïdor quan l'adaptador no el traduïa.
   Ara la vista tria la frase pel `code` (ERRORS_MEMBRES) i, sense cap codi
   propi, diu el genèric de l'acció. Cada lloc on la vista pinta un error
   (llista, cerca, alta, rol i baixa) es prova fora del valencià.
   ═══════════════════════════════════════════════════════════════════ */
const errorAmb = (code, missatge = 'Text de l’adaptador que la vista no ha de pintar.') => Object.assign(new Error(missatge), { code });

describe('T11-02 · els errors del port, pel codi', () => {
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };

  test('ERRORS_MEMBRES té els codis del contracte i NO-DISPONIBLE, ni un més, amb la frase valenciana lletra per lletra', () => {
    expect(Object.keys(ERRORS_MEMBRES).sort()).toEqual([...Object.keys(MISSATGES_MEMBRES_ORGANITZACIO), 'NO-DISPONIBLE'].sort());
    for (const [codi, missatge] of Object.entries(MISSATGES_MEMBRES_ORGANITZACIO)) expect(ERRORS_MEMBRES[codi][1], codi).toBe(missatge);
    // NO-DISPONIBLE: la frase de l'adaptador remot i del context del Perfil (cap dels dos l'exporta: es llig la font).
    const reserva = ERRORS_MEMBRES['NO-DISPONIBLE'][1];
    for (const font of ['src/data/supabase/organizations.js', 'src/sections/profile/PerfilContext.jsx']) {
      expect(readFileSync(path.join(process.cwd(), font), 'utf8'), font).toContain(`'${reserva}'`);
    }
  });

  test('cada clau és a les cinc llengües: el valencià és la reserva i les altres quatre, frases pròpies sense buits', () => {
    const parells = Object.values(ERRORS_MEMBRES);
    expect(new Set(parells.map(([clau]) => clau)).size).toBe(parells.length);
    for (const [clau, reserva] of parells) {
      expect(clau).toMatch(/^section\.perfil\.membres\.error\.\w+$/);
      expect(CA[clau], clau).toBe(reserva);
      for (const [codi, dic] of Object.entries(DICCIONARIS)) {
        expect(typeof dic[clau] === 'string' && dic[clau].trim() !== '', `${codi}: ${clau}`).toBe(true);
        expect(dic[clau], `${codi}: ${clau}`).not.toMatch(/\{\w+\}/);
        if (codi !== 'ca') expect(dic[clau], `${codi}: ${clau}`).not.toBe(reserva);
      }
    }
  });

  test.each(['es', 'en', 'eu', 'gl'])('%s: la llista rebutjada (SDP-ORGMEM-002) diu la frase del diccionari, no la valenciana', async (llengua) => {
    const clau = ERRORS_MEMBRES['SDP-ORGMEM-002'][0];
    pinta({ llengua, llistaMembres: vi.fn(async () => { throw errorAmb('SDP-ORGMEM-002', CA[clau]); }) });
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toBe(DICCIONARIS[llengua][clau]);
    expect(alerta.textContent).not.toBe(CA[clau]);
  });

  test('en castellà, la llista d’un servidor sense els membres (NO-DISPONIBLE) ho diu en castellà', async () => {
    pinta({ llengua: 'es', llistaMembres: vi.fn(async () => { throw errorAmb('NO-DISPONIBLE', ERRORS_MEMBRES['NO-DISPONIBLE'][1]); }) });
    expect((await screen.findByRole('alert')).textContent).toBe('El servidor de este pueblo todavía no gestiona los miembros de las organizaciones.');
  });

  test('en castellà, la cerca rebutjada (SDP-ORGMEM-002) ho diu en castellà', async () => {
    pinta({ llengua: 'es', cercaCandidats: vi.fn(async () => { throw errorAmb('SDP-ORGMEM-002'); }) });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    escriu('Buscar', 'Qu');
    expect((await screen.findByRole('alert', {}, { timeout: 2000 })).textContent)
      .toBe('Solo quien administra la organización puede ver y gestionar sus miembros.');
  });

  test('en castellà, l’alta rebutjada diu la frase del codi (SDP-ORGMEM-003) i, sense codi, el genèric; mai el text valencià de l’error', async () => {
    const desaMembre = vi.fn()
      .mockRejectedValueOnce(errorAmb('SDP-ORGMEM-003', 'Esta persona no és del poble de l’organització o ha demanat la baixa.'))
      .mockRejectedValueOnce(new Error('El servidor no ha confirmat el membre. Torna a carregar la llista.'));
    pinta({ llengua: 'es', desaMembre });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    escriu('Buscar', 'Qu');
    await triaCandidat('A quién quieres añadir', 'Quique · Persona');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Añadir' })); });
    expect(screen.getByRole('alert').textContent).toBe('Esta persona no es del pueblo de la organización o ha pedido la baja.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Añadir' })); });
    expect(desaMembre).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('alert').textContent).toBe('No se ha podido añadir al miembro.');
    expect(document.body.textContent).not.toMatch(/no ha confirmat|no és del poble|no és del municipi/);
  });

  test('en castellà, el canvi de rol rebutjat (SDP-ORGMEM-006) ho diu en castellà', async () => {
    pinta({ llengua: 'es', desaMembre: vi.fn(async () => { throw errorAmb('SDP-ORGMEM-006'); }) });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Nombrar administradora: Marta' })); });
    expect(screen.getByRole('alert').textContent).toBe('Solo la persona propietaria nombra, degrada o quita administradoras.');
  });

  test('en castellà, la baixa rebutjada (SDP-ORGMEM-005) ho diu en castellà, amb la confirmació ja tancada', async () => {
    pinta({ llengua: 'es', llevaMembre: vi.fn(async () => { throw errorAmb('SDP-ORGMEM-005'); }) });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    fireEvent.click(screen.getByRole('button', { name: 'Quitar: Colla' }));
    const dialeg = screen.getByRole('dialog', { name: '¿Quitar a Colla de Forn?' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Quitar' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('La persona propietaria no se puede cambiar ni quitar.');
  });

  test('el text cru del proveïdor no arriba mai a la vista: el genèric de l’acció', async () => {
    pinta({ llistaMembres: vi.fn(async () => { throw new Error('Supabase 500: {"message":"permission denied for function membres_organitzacio"}'); }) });
    expect((await screen.findByRole('alert')).textContent).toBe('No s’ha pogut llegir la llista de membres.');
    expect(document.body.textContent).not.toMatch(/permission|Supabase/);
  });

  test('un codi que no és de la taula (un nom del prototip, un codi d’un altre domini) diu el genèric', async () => {
    for (const code of ['toString', '__proto__', 'constructor', 'hasOwnProperty', 'SDP-TIT-001', 'DESCONEGUT']) {
      pinta({ llistaMembres: vi.fn(async () => { throw errorAmb(code); }) });
      expect((await screen.findByRole('alert')).textContent, code).toBe('No s’ha pogut llegir la llista de membres.');
      cleanup();
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   IDEA-24 (M12-B4-UI; marató 261101_2143) · LA TRANSFERÈNCIA DE LA
   PROPIETAT EN CINC LLENGÜES

   Els sis parells nous ja són a PARELLS (dalt). Ací, els errors propis de la
   transferència (ERRORS_TRANSFERENCIA: 003, 006 i NO-DISPONIBLE, que en la
   gestió diria «no gestiona els membres» i mentiria) i el flux sencer en
   castellà i en basc.
   ═══════════════════════════════════════════════════════════════════ */
describe('IDEA-24 · la transferència, en cinc llengües', () => {
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const FORN_EMPRESA = { ...FORN, dades: { ...FORN.dades, kind: 'company' } };
  function pintaTransferencia({ llengua = 'es', transfereixPropietat = vi.fn(async () => ({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' })) } = {}) {
    const accions = accionsAmb({ transfereixPropietat });
    const vista = <GestioMembres organitzacio={FORN_EMPRESA} accions={accions} />;
    render(<UIProvider externalConfig={{ language: llengua }}>{vista}</UIProvider>);
    return accions;
  }

  test('ERRORS_TRANSFERENCIA: només codis que ja són de la gestió (cap d’inventat), a les cinc llengües, sense buits i amb frase pròpia', () => {
    expect(Object.keys(ERRORS_TRANSFERENCIA).sort()).toEqual(['NO-DISPONIBLE', 'SDP-ORGMEM-003', 'SDP-ORGMEM-006']);
    for (const codi of Object.keys(ERRORS_TRANSFERENCIA)) expect(Object.hasOwn(ERRORS_MEMBRES, codi), codi).toBe(true);
    const parells = Object.values(ERRORS_TRANSFERENCIA);
    const totes = [...parells, ...Object.values(ERRORS_MEMBRES)].map(([clau]) => clau);
    expect(new Set(totes).size).toBe(totes.length);
    for (const [codi, [clau, reserva]] of Object.entries(ERRORS_TRANSFERENCIA)) {
      expect(clau).toMatch(/^section\.perfil\.membres\.error\.transfereix\w+$/);
      expect(CA[clau], clau).toBe(reserva);
      // La frase de la transferència no és la de la gestió (si no, sobraria).
      expect(reserva, codi).not.toBe(ERRORS_MEMBRES[codi][1]);
      for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
        expect(typeof dic[clau] === 'string' && dic[clau].trim() !== '', `${llengua}: ${clau}`).toBe(true);
        expect(dic[clau], `${llengua}: ${clau}`).not.toMatch(/\{\w+\}/);
        if (llengua !== 'ca') expect(dic[clau], `${llengua}: ${clau}`).not.toBe(reserva);
      }
    }
  });

  test('NO-DISPONIBLE de la transferència és la frase de l’adaptador remot (no l’exporta: es llig la font)', () => {
    const reserva = ERRORS_TRANSFERENCIA['NO-DISPONIBLE'][1];
    const font = 'src/data/supabase/organizations.js';
    expect(readFileSync(path.join(process.cwd(), font), 'utf8'), font).toContain(`'${reserva}'`);
  });

  test('en castellà: el botó de la fila, la confirmació, l’èxit i el focus a «Cancelar»', async () => {
    const accions = pintaTransferencia();
    const regio = await screen.findByRole('region', { name: 'Miembros de Forn' });
    expect(within(regio).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Volver a miembro: Andreu', 'Transferir la propiedad: Andreu', 'Quitar: Andreu',
      'Nombrar administradora: Marta', 'Transferir la propiedad: Marta', 'Quitar: Marta', 'Quitar: Colla',
    ]);
    fireEvent.click(within(regio).getByRole('button', { name: 'Transferir la propiedad: Marta' }));
    const dialeg = screen.getByRole('dialog', { name: '¿Transferir la propiedad de Forn a Marta?' });
    expect(within(dialeg).getByText('Marta será la propietaria y tú pasarás a administradora: seguirás gestionando la ficha y los miembros, pero ya no podrás nombrar ni quitar administradoras. Solo Marta podrá devolverte la propiedad.')).toBeTruthy();
    expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Cancelar' }));
    expect(dialeg.textContent).not.toMatch(/Cancel·lar|propietat/);
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Transferir la propiedad' })); });
    expect(accions.transfereixPropietat).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'M' });
    expect(screen.getByRole('status').textContent).toBe('Marta ya es la propietaria de Forn. Tú sigues como administradora.');
    expect(filesDe(screen.getByRole('region', { name: 'Miembros de Forn' })).map(([nom, , rol]) => [nom, rol])).toEqual([
      ['Marta', 'Propietario'], ['Andreu', 'Administra'], ['Jo (tú)', 'Administra'], ['Colla', 'Miembro'],
    ]);
  });

  test.each([
    ['NO-DISPONIBLE', 'El servidor de este pueblo todavía no sabe transferir la propiedad de las organizaciones.'],
    ['SDP-ORGMEM-006', 'Solo la persona propietaria puede transferir la propiedad.'],
    ['SDP-ORGMEM-003', 'Solo se puede transferir a una persona que sea miembro de la organización y de su pueblo y que no haya pedido la baja.'],
    // Un codi sense frase pròpia de la transferència: la de la gestió, en castellà.
    ['SDP-ORGMEM-002', 'Solo quien administra la organización puede ver y gestionar sus miembros.'],
    // Sense codi: el genèric de l'acció, mai el text de l'error.
    [undefined, 'No se ha podido transferir la propiedad.'],
  ])('en castellà, la transferència rebutjada (%s) diu la frase del diccionari, mai la valenciana ni la de l’error', async (code, esperat) => {
    pintaTransferencia({ transfereixPropietat: vi.fn(async () => { throw errorAmb(code); }) });
    await screen.findByRole('region', { name: 'Miembros de Forn' });
    fireEvent.click(screen.getByRole('button', { name: 'Transferir la propiedad: Andreu' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Transferir la propiedad' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe(esperat);
    expect(document.body.textContent).not.toMatch(/Text de l’adaptador|encara no sap|propietat/);
  });

  test('en basc, «Etiqueta: {nom}»: el botó i la confirmació no enganxen cap sufix al nom', async () => {
    pintaTransferencia({ llengua: 'eu' });
    const regio = await screen.findByRole('region', { name: 'Forn: kideak' });
    fireEvent.click(within(regio).getByRole('button', { name: 'Jabetza eskualdatu: Marta' }));
    const dialeg = screen.getByRole('dialog', { name: 'Jabetza eskualdatu nahi duzu? Erakundea: Forn. Jabe berria: Marta.' });
    expect(within(dialeg).getByRole('button', { name: 'Utzi' })).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: 'Jabetza eskualdatu' })).toBeTruthy();
    const enganxats = Object.values(ERRORS_TRANSFERENCIA).map(([clau]) => [clau, EU[clau]]).filter(([, text]) => /\{(?:nom|org)\}\p{L}/u.test(text));
    expect(enganxats).toEqual([]);
  });
});

import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { escaneja } from '../../../tooling/gates/tractor-vocabulari.mjs';
/* IDEA-22, punt 2 (pla 261025_0200) · El port, parcial: la tria de la titular
   es simula; sense cap capacitat (per defecte), com abans, cap casella ni cap
   veïnat connectat. */
const mp = vi.hoisted(() => ({ capacitats: new Set(), estat: vi.fn(), marca: vi.fn() }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => mp.capacitats.has(cap),
  estatTitularPublic: (...args) => mp.estat(...args),
  marcaTitularPublic: (...args) => mp.marca(...args)
}));
import { GestioMembres, ESPERA_CERCA } from './GestioMembres.jsx';

/* Ordre del Mestre (261008, grup C) · La gestió dels membres d'una
   organització a «El compte»: llista, alta directa, canvi de rol i baixa,
   amb les decisions del Mestre (només la propietària gestiona les
   administradores; una organització membre sempre és membre). */
afterEach(() => {
  cleanup();
  mp.capacitats = new Set();
  mp.estat.mockReset();
  mp.marca.mockReset();
});

const persona = (id, nom, rol = 'member') => ({ tipus: 'persona', id, nom, avatar: '', rol, desDe: null });
const org = (id, nom) => ({ tipus: 'organitzacio', id, nom, avatar: '', rol: 'member', desDe: null });
const FORN = (rol = 'owner') => ({ id: 'O', mena: 'empresa', nom: 'Forn', dades: { id: 'O', name: 'Forn', role: rol } });
const deferred = () => { let resolve; let reject; const promise = new Promise((s, r) => { resolve = s; reject = r; }); return { promise, resolve, reject }; };

function pinta({ rol = 'owner', membres = [persona('JO', 'Jo', rol), persona('A', 'Andreu', 'admin'), persona('M', 'Marta'), org('G', 'Colla')], ...extra } = {}) {
  const accions = {
    usuariId: 'JO',
    llistaMembres: vi.fn(async () => membres),
    desaMembre: vi.fn(async (orgId, dades) => ({ ...dades, nom: dades.id === 'Q' ? 'Quique' : dades.id, avatar: '', desDe: null })),
    llevaMembre: vi.fn(async () => ({ llevat: true })),
    cercaCandidats: vi.fn(async () => [
      { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' },
      { tipus: 'organitzacio', id: 'K', nom: 'Cooperativa', avatar: '' },
    ]),
    ...extra,
  };
  render(<GestioMembres organitzacio={FORN(rol)} accions={accions} />);
  return accions;
}
const taula = () => screen.findByRole('region', { name: 'Membres de Forn' });
const fila = (nom) => screen.getByText(new RegExp(`^${nom}`), { selector: 'td' }).closest('tr');
/* El text de cada cel·la tal com el llig un lector: sense les inicials decoratives (aria-hidden) de l'avatar. */
const textLlegible = (node) => {
  const copia = node.cloneNode(true);
  copia.querySelectorAll('[aria-hidden="true"]').forEach((amagat) => amagat.remove());
  return copia.textContent.trim();
};
const textDeFiles = () => [...screen.getByRole('region', { name: 'Membres de Forn' }).querySelectorAll('tbody tr')]
  .map((tr) => [...tr.querySelectorAll('td')].slice(0, 3).map(textLlegible));
const cerca = (text) => fireEvent.change(screen.getByLabelText('Cerca'), { target: { value: text } });
const triaCandidat = async (etiqueta) => {
  const selector = screen.getByLabelText('Qui vols afegir');
  await waitFor(() => expect([...selector.options].map((o) => o.textContent)).toContain(etiqueta), { timeout: 2000 });
  const opcio = [...selector.options].find((o) => o.textContent === etiqueta);
  fireEvent.change(selector, { target: { value: opcio.value } });
};

test('llig la llista en obrir-se i la pinta per rols, amb «(tu)» i el tipus', async () => {
  const accions = pinta();
  expect(screen.getByRole('status').textContent).toBe('Carregant els membres…');
  // Correcció 261008 · l'alta espera la llista: sense ella s'oferirien els que ja en són membres.
  expect(screen.queryByLabelText('Cerca')).toBeNull();
  await taula();
  expect(screen.getByLabelText('Cerca')).toBeTruthy();
  expect(accions.llistaMembres).toHaveBeenCalledWith('O', { signal: expect.any(AbortSignal) });
  expect(textDeFiles()).toEqual([
    ['Jo (tu)', 'Persona', 'Propietari'],
    ['Andreu', 'Persona', 'Administra'],
    ['Marta', 'Persona', 'Membre'],
    ['Colla', 'Organització', 'Membre'],
  ]);
});

test('la propietària: nomena i degrada administradores, i lleva; sobre ella mateixa, cap acció', async () => {
  pinta();
  await taula();
  expect(within(fila('Jo')).queryAllByRole('button')).toHaveLength(0);
  expect(within(fila('Andreu')).getAllByRole('button').map((b) => b.getAttribute('aria-label')))
    .toEqual(['Tornar a membre: Andreu', 'Llevar: Andreu']);
  expect(within(fila('Marta')).getAllByRole('button').map((b) => b.getAttribute('aria-label')))
    .toEqual(['Nomenar administradora: Marta', 'Llevar: Marta']);
  expect(within(fila('Colla')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Llevar: Colla']);
});

test('una administradora no toca cap administradora ni la propietària, ni nomena; i no tria rol en l’alta', async () => {
  pinta({ rol: 'admin', membres: [persona('P', 'Pepa', 'owner'), persona('JO', 'Jo', 'admin'), persona('A', 'Andreu', 'admin'), persona('M', 'Marta')] });
  await taula();
  expect(within(fila('Pepa')).queryAllByRole('button')).toHaveLength(0);
  expect(within(fila('Andreu')).queryAllByRole('button')).toHaveLength(0);
  expect(within(fila('Marta')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Llevar: Marta']);
  expect(screen.queryByText(/Nomenar administradora/)).toBeNull();
  expect(screen.queryByLabelText('Rol')).toBeNull();
});

test('si la llista no es pot llegir, ho diu (el missatge del port, en valencià) i no oferix cap alta', async () => {
  pinta({ llistaMembres: vi.fn(async () => { throw Object.assign(new Error('El servidor d’este poble encara no gestiona els membres de les organitzacions.'), { code: 'NO-DISPONIBLE' }); }) });
  expect((await screen.findByRole('alert')).textContent).toBe('El servidor d’este poble encara no gestiona els membres de les organitzacions.');
  expect(screen.queryByRole('region', { name: 'Membres de Forn' })).toBeNull();
  /* Correcció 261008 · Honestedat abans que promeses: si el servidor ja ha dit
     que no gestiona els membres, el formulari d'alta no promet el que fallarà. */
  expect(screen.queryByRole('group', { name: 'Afegir un membre' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Afegir' })).toBeNull();
  expect(screen.queryByLabelText('Cerca')).toBeNull();
});

test('la cerca espera que pares d’escriure, no busca amb menys de 2 lletres i només llança l’última', async () => {
  const accions = pinta();
  await taula();
  cerca('q');
  await new Promise((r) => { setTimeout(r, ESPERA_CERCA + 100); });
  expect(accions.cercaCandidats).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Qui vols afegir').disabled).toBe(true);
  cerca('qu');
  cerca('qui');
  await waitFor(() => expect(accions.cercaCandidats).toHaveBeenCalledTimes(1), { timeout: 2000 });
  expect(accions.cercaCandidats).toHaveBeenCalledWith('O', 'qui', { signal: expect.any(AbortSignal), membres: expect.any(Array) });
  expect(accions.cercaCandidats.mock.calls[0][2].membres.map((m) => m.id)).toEqual(['JO', 'A', 'M', 'G']);
});

test('la propietària afig una persona com a administradora: alta directa, fila nova i avís', async () => {
  const accions = pinta();
  await taula();
  cerca('qui');
  await triaCandidat('Quique · Persona');
  fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'admin' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Afegir' })); });
  expect(accions.desaMembre).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'Q', rol: 'admin' });
  expect(screen.getByRole('status').textContent).toBe('Quique ja és membre de Forn.');
  expect(textDeFiles()).toContainEqual(['Quique', 'Persona', 'Administra']);
  // La cerca torna a començar.
  expect(screen.getByLabelText('Cerca').value).toBe('');
});

test('una organització s’afig sempre com a membre, i el rol no es tria', async () => {
  const accions = pinta();
  await taula();
  cerca('coop');
  await triaCandidat('Cooperativa · Organització');
  expect(screen.queryByLabelText('Rol')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Afegir' })); });
  expect(accions.desaMembre).toHaveBeenCalledWith('O', { tipus: 'organitzacio', id: 'K', rol: 'member' });
});

test('qui ja és membre no s’oferix, encara que la cerca el torne', async () => {
  pinta({ cercaCandidats: vi.fn(async () => [{ tipus: 'persona', id: 'M', nom: 'Marta', avatar: '' }, { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' }]) });
  await taula();
  cerca('ma');
  await triaCandidat('Quique · Persona');
  expect([...screen.getByLabelText('Qui vols afegir').options].map((o) => o.textContent)).toEqual(['Tria un resultat…', 'Quique · Persona']);
});

test('un doble enviament només dona una alta, i el botó espera la resposta', async () => {
  const pendent = deferred();
  const accions = pinta({ desaMembre: vi.fn(() => pendent.promise) });
  await taula();
  cerca('qui');
  await triaCandidat('Quique · Persona');
  const formulari = screen.getByLabelText('Cerca').closest('form');
  act(() => { fireEvent.submit(formulari); fireEvent.submit(formulari); });
  expect(accions.desaMembre).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Treballant…' }).disabled).toBe(true);
  await act(async () => { pendent.resolve({ tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '', rol: 'member', desDe: null }); });
  expect(textDeFiles()).toContainEqual(['Quique', 'Persona', 'Membre']);
});

test('si el servidor rebutja l’alta, el missatge del port es diu en línia i la llista no canvia', async () => {
  pinta({ desaMembre: vi.fn(async () => { throw Object.assign(new Error('Esta persona no és del poble de l’organització o ha demanat la baixa.'), { code: 'SDP-ORGMEM-003' }); }) });
  await taula();
  cerca('qui');
  await triaCandidat('Quique · Persona');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Afegir' })); });
  expect(screen.getByRole('alert').textContent).toBe('Esta persona no és del poble de l’organització o ha demanat la baixa.');
  expect(textDeFiles()).toHaveLength(4);
});

test('nomenar i degradar una administradora canvien el rol de la fila', async () => {
  const accions = pinta();
  await taula();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Nomenar administradora: Marta' })); });
  expect(accions.desaMembre).toHaveBeenLastCalledWith('O', { tipus: 'persona', id: 'M', rol: 'admin' });
  expect(screen.getByRole('status').textContent).toBe('Marta ja administra Forn.');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tornar a membre: Andreu' })); });
  expect(accions.desaMembre).toHaveBeenLastCalledWith('O', { tipus: 'persona', id: 'A', rol: 'member' });
  expect(screen.getByRole('status').textContent).toBe('Andreu ja no administra Forn.');
});

test('llevar demana confirmació; «Cancel·lar» no lleva res i «Llevar» la trau de la llista', async () => {
  const accions = pinta();
  await taula();
  fireEvent.click(screen.getByRole('button', { name: 'Llevar: Colla' }));
  let dialeg = screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
  expect(accions.llevaMembre).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Llevar: Colla' }));
  dialeg = screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Llevar' })); });
  expect(accions.llevaMembre).toHaveBeenCalledWith('O', { tipus: 'organitzacio', id: 'G' });
  expect(textDeFiles().map(([nom]) => nom)).toEqual(['Jo (tu)', 'Andreu', 'Marta']);
  expect(screen.getByRole('status').textContent).toBe('Colla ja no és membre de Forn.');
});

/* Correcció 261008 · Si «Llevar» falla, la confirmació es tanca (com «Eixir»
   a DetallAjust): l'error es pinta fora del <dialog> modal, i amb ell obert
   quedaria inert i amagat darrere. */
test('si «Llevar» falla, la confirmació es tanca, l’error es veu i el focus torna al botó de la fila', async () => {
  pinta({ llevaMembre: vi.fn(async () => { throw Object.assign(new Error('Només qui administra aquesta organització pot gestionar-ne els membres.'), { code: 'SDP-ORGMEM-002' }); }) });
  await taula();
  const boto = screen.getByRole('button', { name: 'Llevar: Colla' });
  boto.focus();
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Llevar' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('alert').textContent).toBe('Només qui administra aquesta organització pot gestionar-ne els membres.');
  expect(textDeFiles().map(([nom]) => nom)).toEqual(['Jo (tu)', 'Andreu', 'Marta', 'Colla']);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Llevar: Colla' }));
});

/* Correcció 261008 · El botó que obria la confirmació se'n va amb la fila: el
   focus no pot caure al <body> (WCAG 2.4.3). Va a la llista, que és estable. */
test('després de llevar, el focus va a la llista de membres i no es perd al <body>', async () => {
  pinta();
  await taula();
  const boto = screen.getByRole('button', { name: 'Llevar: Colla' });
  boto.focus();
  fireEvent.click(boto);
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' })).getByRole('button', { name: 'Llevar' })); });
  expect(boto.isConnected).toBe(false);
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Membres de Forn' }));
});

/* Correcció 261008 · Mentre el <dialog> és modal, la resta de la pàgina és
   inert: un avís que hi naix no s'anuncia. L'ordre real del DOM (registres
   de MutationObserver): primer es tanca la confirmació, després naix l'avís. */
test.each([
  ['ix bé', async () => ({ llevat: true }), 'status'],
  ['falla', async () => { throw new Error('Sense xarxa'); }, 'alert'],
])('«Llevar» (%s): l’avís naix quan la confirmació ja s’ha tancat', async (_, llevaMembre, rol) => {
  pinta({ llevaMembre: vi.fn(llevaMembre) });
  await taula();
  fireEvent.click(screen.getByRole('button', { name: 'Llevar: Colla' }));
  const dialeg = screen.getByRole('dialog', { name: 'Llevar Colla de Forn?' });
  const ordre = [];
  const anota = (registres) => {
    for (const r of registres) {
      if (r.type === 'attributes' && r.target === dialeg && r.oldValue !== null) ordre.push('tancat');
      if (r.type === 'childList') {
        for (const node of r.addedNodes) if (node.nodeType === 1 && node.matches('[role="status"], [role="alert"]')) ordre.push('avis');
      }
    }
  };
  const observador = new MutationObserver(anota);
  observador.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'], attributeOldValue: true });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Llevar' })); });
  anota(observador.takeRecords());
  observador.disconnect();
  expect(ordre).toEqual(['tancat', 'avis']);
  expect(screen.getByRole(rol).textContent).toBe(rol === 'status' ? 'Colla ja no és membre de Forn.' : 'Sense xarxa');
});

test('desmuntar avorta la lectura de la llista', async () => {
  const pendent = deferred();
  const accions = pinta({ llistaMembres: vi.fn(() => pendent.promise) });
  await waitFor(() => expect(accions.llistaMembres).toHaveBeenCalled());
  const { signal } = accions.llistaMembres.mock.calls[0][1];
  expect(signal.aborted).toBe(false);
  cleanup();
  expect(signal.aborted).toBe(true);
  await act(async () => { pendent.resolve([persona('JO', 'Jo', 'owner')]); });
});

/* Correcció 261008 · L'escriptura tardana sí que es pot observar: si canvia
   l'organització, la resposta de l'anterior (bona o dolenta) no trepitja la
   llista de l'actual. Sense la guarda del senyal, esta prova cau. */
test.each([
  ['es resol', (tardana) => tardana.resolve([persona('JO', 'Jo', 'owner'), persona('M', 'Marta')])],
  ['falla', (tardana) => tardana.reject(new Error('Sense xarxa'))],
])('la resposta tardana de l’organització d’abans (%s) no trepitja la llista de l’actual', async (_, acaba) => {
  const tardana = deferred();
  const llistaMembres = vi.fn((orgId) => (orgId === 'O' ? tardana.promise : Promise.resolve([persona('JO', 'Jo', 'owner'), persona('B', 'Berta')])));
  const accions = { usuariId: 'JO', llistaMembres, desaMembre: vi.fn(), llevaMembre: vi.fn(), cercaCandidats: vi.fn(async () => []) };
  const { rerender } = render(<GestioMembres organitzacio={FORN()} accions={accions} />);
  await waitFor(() => expect(llistaMembres).toHaveBeenCalledTimes(1));
  rerender(<GestioMembres organitzacio={{ id: 'C', mena: 'grup', nom: 'Colla', dades: { id: 'C', name: 'Colla', role: 'owner' } }} accions={accions} />);
  await screen.findByRole('region', { name: 'Membres de Colla' });
  expect(llistaMembres.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { acaba(tardana); await tardana.promise.catch(() => {}); });
  expect(screen.getByText(/^Berta/, { selector: 'td' })).toBeTruthy();
  expect(screen.queryByText(/^Marta/, { selector: 'td' })).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});

/* Qualitat · el vocabulari (cap classe que no existisca als fulls canònics)
   i ESLint amb la configuració del projecte, sense cap missatge, als fitxers
   de la interfície del grup C. */
const CENS_UI_GRUP_C = Object.freeze([
  'src/sections/profile/GestioMembres.jsx',
  'src/sections/profile/membresModel.js',
  'src/sections/profile/DetallAjust.jsx',
  'src/sections/profile/DetallCompte.jsx',
  'src/sections/profile/DialegNovaOrganitzacio.jsx',
  'src/sections/profile/PerfilContext.jsx',
]);
const TESTS_UI_GRUP_C = Object.freeze([
  'src/sections/profile/GestioMembres.test.jsx',
  'src/sections/profile/membresModel.test.js',
  'src/sections/profile/DetallAjust.test.jsx',
  'src/sections/profile/DetallCompte.test.jsx',
  'src/sections/profile/DialegNovaOrganitzacio.test.jsx',
  'src/sections/profile/PerfilContext.test.jsx',
  'src/sections/profile/PerfilPublicSection.test.jsx',
]);

test('qualitat · cap classe forastera ni opaca nova als fitxers de la interfície del grup C (els nous, cap ni una)', () => {
  const { infraccions, vocab } = escaneja();
  /* El deute admés (identitat regla|fitxer|token) és d'abans: DetallAjust ja duia
     sdp-form i sdp-camp__check. El que no hi és, és nou i no s'admet. */
  const DEUTE = JSON.parse(readFileSync(path.join(process.cwd(), '.agents/deute/.vocabulari-deute.json'), 'utf8'));
  const admesa = (i) => (DEUTE[i.regla]?.identitats ?? []).includes(`${i.regla}|${i.fitxer}|${i.token}`);
  const propies = infraccions.filter((i) => CENS_UI_GRUP_C.includes(i.fitxer.split(path.sep).join('/')));
  expect(propies.filter((i) => !admesa(i)).map((i) => `${i.fitxer}:${i.linia} [${i.regla}] ${i.token}`)).toEqual([]);
  const NOUS = ['src/sections/profile/GestioMembres.jsx', 'src/sections/profile/membresModel.js'];
  expect(propies.filter((i) => NOUS.includes(i.fitxer.split(path.sep).join('/')))).toEqual([]);
  // El selector nou de DetallAjust no afig cap ús més de la classe forastera de sempre.
  expect(propies.filter((i) => i.token === 'sdp-form')).toHaveLength(1);
  // Sonda: la porta ha llegit el vocabulari (hi són les classes que pinta GestioMembres) i escaneja el JSX.
  expect(vocab.size).toBeGreaterThan(1000);
  for (const classe of ['sdp-text-exit', 'sdp-camp__error', 'sdp-buit', 'sdp-alerta__accions']) expect(vocab.has(classe), classe).toBe(true);
  expect(vocab.has('classe-que-no-existix')).toBe(false);
  expect(infraccions.some((i) => i.regla === 'classe-forastera')).toBe(true);
}, 120000);

test('qualitat · ESLint sense cap missatge als fitxers de la interfície del grup C (i les seues proves)', async () => {
  const arrel = process.cwd();
  const eslint = new ESLint({ cwd: arrel });
  const fitxers = [...CENS_UI_GRUP_C, ...TESTS_UI_GRUP_C];
  const resultats = await eslint.lintFiles(fitxers.map((fitxer) => path.join(arrel, fitxer)));
  const missatges = resultats.flatMap((r) => r.messages.map((mis) => `${path.relative(arrel, r.filePath)}:${mis.line} [${mis.ruleId}] ${mis.message}`));
  expect(resultats).toHaveLength(fitxers.length);
  expect(missatges).toEqual([]);
  // Sonda: la configuració del projecte és activa també en un .jsx d'esta carpeta.
  const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(arrel, 'src/sections/profile/sonda.jsx') });
  expect(sonda.messages.map((mis) => mis.ruleId)).toContain('no-unused-vars');
}, 120000);

/* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla 261025_0200)
   · Mostrar-se com a titular a Connectar: només la propietària ho tria, i ho
   llig abans del clic (cal el perfil públic). Una administradora no en veu res. */
const ETIQUETA_TITULAR = 'Mostra’m com a titular de Forn a Connectar';
const casellaTitular = () => screen.queryByRole('checkbox', { name: new RegExp(`^${ETIQUETA_TITULAR}`) });

test('IDEA-22 · la propietària tria mostrar-se com a titular, i ho pot desfer; el port rep la tria i res més', async () => {
  mp.capacitats = new Set(['consentimentTitular']);
  mp.estat.mockResolvedValue({ titularPublic: false });
  mp.marca.mockImplementation(async (_orgId, valor) => ({ titularPublic: valor }));
  pinta();
  await taula();
  await waitFor(() => expect(casellaTitular()).toBeTruthy());
  expect(mp.estat).toHaveBeenCalledWith('O', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  const casella = casellaTitular();
  expect(casella.checked).toBe(false);
  /* Abans del clic: el perfil i l'entitat han de ser públics (el servidor ho
     exigix tot dos) i ningú més no ho tria per ella. */
  expect(screen.getByText(/^Qui connecte amb Forn també podrà connectar amb tu/).textContent)
    .toBe('Qui connecte amb Forn també podrà connectar amb tu, a la mateixa pantalla. Només es veu mentre el teu perfil i l’entitat siguen públics; ho pots llevar quan vulgues, i ningú més no ho pot triar per tu.');
  await act(async () => { fireEvent.click(casella); });
  expect(mp.marca).toHaveBeenCalledWith('O', true, {});
  expect(screen.getByRole('status').textContent).toBe('Desat: et mostrarem com a titular de Forn a Connectar mentre el teu perfil i l’entitat siguen públics.');
  expect(casellaTitular().checked).toBe(true);
  await act(async () => { fireEvent.click(casellaTitular()); });
  expect(mp.marca).toHaveBeenLastCalledWith('O', false, {});
  expect(screen.getByRole('status').textContent).toBe('Ja no et mostrem com a titular de Forn.');
  expect(casellaTitular().checked).toBe(false);
});

test('IDEA-22 · mentre desa, la casella no es desactiva (no perd el focus) i un segon toc no torna a escriure', async () => {
  mp.capacitats = new Set(['consentimentTitular']);
  mp.estat.mockResolvedValue({ titularPublic: false });
  let acaba;
  mp.marca.mockImplementation(() => new Promise((resol) => { acaba = resol; }));
  pinta();
  await taula();
  await waitFor(() => expect(casellaTitular()).toBeTruthy());
  const casella = casellaTitular();
  casella.focus();
  await act(async () => { fireEvent.click(casella); });
  expect(casellaTitular().disabled).toBe(false);
  /* La tria es veu de seguida i es diu que s'està desant. */
  expect(casellaTitular().checked).toBe(true);
  expect(screen.getByRole('status').textContent).toBe('Desant la tria…');
  expect(casellaTitular().closest('[aria-busy="true"]')).toBeTruthy();
  expect(document.activeElement).toBe(casellaTitular());
  await act(async () => { fireEvent.click(casellaTitular()); });
  expect(mp.marca).toHaveBeenCalledTimes(1);
  await act(async () => { acaba({ titularPublic: true }); });
  expect(casellaTitular().checked).toBe(true);
  expect(casellaTitular().closest('[aria-busy="true"]')).toBeNull();
});

test('IDEA-22 · una administradora no en veu cap casella ni en pregunta l’estat', async () => {
  mp.capacitats = new Set(['consentimentTitular']);
  mp.estat.mockResolvedValue({ titularPublic: true });
  pinta({ rol: 'admin' });
  await taula();
  await act(async () => {});
  expect(casellaTitular()).toBeNull();
  expect(mp.estat).not.toHaveBeenCalled();
});

test('IDEA-22 · sense la capacitat, o amb un servidor sense la migració o que diu que no n’ets la propietària, cap casella', async () => {
  pinta();
  await taula();
  await act(async () => {});
  expect(casellaTitular()).toBeNull();
  expect(mp.estat).not.toHaveBeenCalled();
  cleanup();
  for (const code of ['NO-DISPONIBLE', 'SDP-TIT-001']) {
    mp.capacitats = new Set(['consentimentTitular']);
    mp.estat.mockRejectedValue(Object.assign(new Error('No.'), { code }));
    pinta();
    await taula();
    await waitFor(() => expect(mp.estat).toHaveBeenCalled());
    await act(async () => {});
    expect(casellaTitular(), code).toBeNull();
    cleanup();
    mp.estat.mockReset();
  }
});

test('IDEA-22 · si la tria no es desa, ho diu i la casella no canvia', async () => {
  mp.capacitats = new Set(['consentimentTitular']);
  mp.estat.mockResolvedValue({ titularPublic: false });
  mp.marca.mockRejectedValue(Object.assign(new Error('Supabase 500: boom'), { code: 'DESCONEGUT' }));
  pinta();
  await taula();
  await waitFor(() => expect(casellaTitular()).toBeTruthy());
  await act(async () => { fireEvent.click(casellaTitular()); });
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut desar la tria. Torna-ho a provar.');
  expect(screen.getByRole('alert').textContent).not.toContain('Supabase');
  expect(casellaTitular().checked).toBe(false);
});

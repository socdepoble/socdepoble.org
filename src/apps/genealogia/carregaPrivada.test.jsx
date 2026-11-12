/* Arbre Genealògic · la càrrega privada d'un clic (P0-114b, ordre del Mestre
   261111). Dins de /app/genealogia, al panell dels arbres: la persona tria un
   .json o un .ged, l'app el llig en este dispositiu i el desa com a arbre nou
   al magatzem local. Llavors SINTÈTIQUES amb noms inventats; magatzem en
   memòria. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestGenealogia from './manifest.js';
import AppGenealogia from './AppGenealogia.jsx';
import { ESQUEMA_LLAVOR } from './gedcom/index.js';
import { MIDA_MAXIMA_IMPORTACIO } from './nucli/index.js';
import { VERSIO_AVIS } from './textos.js';
import { carregaArbre, creaMagatzemGenealogia, desaMeta, llistaArbres } from './magatzem.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 10, 11, 9, 30);
const ETIQUETA = 'El meu arbre privat (.json o .ged)';
/* La primera càrrega diferida (lazy) pot tardar més d'un segon amb la suite en paral·lel. */
const ESPERA = Object.freeze({ timeout: 10000 });
let magatzem;

function munta(url, { externalConfig = {} } = {}) {
  let n = 0;
  const App = () => (
    <AppGenealogia magatzem={magatzem} rellotge={() => ARA}
      nouId={() => { n += 1; return `00000000-0000-4000-8000-${String(7000 + n).padStart(12, '0')}`; }} />
  );
  const carrega = vi.fn(() => Promise.resolve({ default: App }));
  muntaPlataforma(url, { registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega }] }), entorn: ENTORN, externalConfig });
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const acceptaAvis = () => desaMeta(magatzem, 'avis', { acceptatA: '2026-11-01T08:00:00.000Z', versio: VERSIO_AVIS });
const tria = (input, contingut, nom) => fireEvent.change(input, { target: { files: [new File([contingut], nom)] } });

const LLAVOR = Object.freeze({
  schema: ESQUEMA_LLAVOR,
  poble_arrel: { municipi_oficial: 'Poble Inventat' },
  persones_confirmades_pel_mestre: [
    { id: 'a', ahnentafel: 1, nom: 'Pere', primer_cognom: 'Exemple', segon_cognom: 'Prova', estat_vital: 'viu', estat_epistemologic: 'CONFIRMAT' },
    { id: 'b', ahnentafel: 2, nom: 'Joan', primer_cognom: 'Exemple', estat_epistemologic: 'CONFIRMAT', naixement: '1950' },
    { id: 'c', ahnentafel: 3, nom: 'Maria', primer_cognom: 'Prova', estat_epistemologic: 'APROXIMAT' }
  ],
  pistes_col_laterals_fan_club_pendents_confirmar: [
    { grup: 'Cognoms coincidents (Cognom ≠ Parentiu)', estat_epistemologic: 'FALTA CONFIRMAR', persones: ['Anna Exemple Prova'] }
  ]
});
const GED = [
  '0 HEAD', '1 GEDC', '2 VERS 7.0',
  '0 @I1@ INDI', '1 NAME Pere /Exemple/', '1 SEX M', '1 FAMC @F1@', '1 NOTE [CONFIRMAT] Font inventada.',
  '0 @I2@ INDI', '1 NAME Joan /Exemple/', '1 SEX M', '1 FAMS @F1@', '1 NOTE [APROXIMAT] Memòria inventada.',
  '0 @F1@ FAM', '1 HUSB @I2@', '1 CHIL @I1@',
  '0 TRLR'
].join('\n');

beforeEach(() => {
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('carrega el meu arbre privat (un clic)', () => {
  test('una llavor .json: es llig ací, es desa com a arbre nou i porta a l’arbre', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    const input = await screen.findByLabelText(ETIQUETA, {}, ESPERA);
    expect(screen.getByRole('button', { name: `${ETIQUETA}: Carrega el meu arbre privat (.json o .ged)` })).toBeTruthy();
    expect(screen.getByText(/no ix d’este dispositiu/)).toBeTruthy();
    tria(input, JSON.stringify(LLAVOR), 'llavor-de-prova.json');
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arbre'), ESPERA);
    const arbres = await llistaArbres(magatzem);
    expect(arbres).toHaveLength(1);
    const complet = await carregaArbre(magatzem, arbres[0].id);
    expect(complet.arbre).toMatchObject({ titol: 'El meu arbre privat', poble: 'Poble Inventat' });
    expect(complet.persones.map((p) => p.nom).sort()).toEqual(['Anna', 'Joan', 'Maria', 'Pere']);
    expect(complet.relacions).toHaveLength(2);
    /* La pista no té cap vincle. */
    const anna = complet.persones.find((p) => p.nom === 'Anna');
    expect(complet.relacions.some((r) => r.de === anna.id || r.a === anna.id)).toBe(false);
    /* L'arbre ensenya la numeració Sosa amb l'estat en text. */
    expect(await screen.findAllByText(/\[CONFIRMAT\]/)).not.toHaveLength(0);
    /* El nom del fitxer (pot portar cognoms) no es pinta. */
    expect(screen.queryByText(/llavor-de-prova/)).toBeNull();
  });

  test('un .ged: el format es detecta pel contingut i les NOTE conserven l’estat', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    /* Sense extensió fiable: el contingut mana. */
    tria(await screen.findByLabelText(ETIQUETA, {}, ESPERA), GED, 'arbre.txt');
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arbre'), ESPERA);
    const [arbre] = await llistaArbres(magatzem);
    const complet = await carregaArbre(magatzem, arbre.id);
    expect(complet.persones.map((p) => [p.nom, p.estat]).sort()).toEqual([['Joan', 'aproximat'], ['Pere', 'confirmat']]);
    expect(complet.relacions).toHaveLength(1);
  });

  test('un fitxer malformat o massa gran no desa res i ho diu traduït', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    const input = await screen.findByLabelText(ETIQUETA, {}, ESPERA);
    tria(input, '{ això no és JSON', 'trencat.json');
    expect(await screen.findByText('El fitxer no s’ha pogut llegir. No s’ha desat res.')).toBeTruthy();
    expect(screen.getByText('No és un JSON vàlid.')).toBeTruthy();
    expect(screen.queryByText(/^json$/)).toBeNull();
    const gran = new File(['{}'], 'gran.json');
    Object.defineProperty(gran, 'size', { value: MIDA_MAXIMA_IMPORTACIO + 1 });
    fireEvent.change(input, { target: { files: [gran] } });
    expect(await screen.findByText('El fitxer passa de 8 MB: no s’obri.')).toBeTruthy();
    expect(await llistaArbres(magatzem)).toEqual([]);
    expect(ubicacio()).toBe('/app/genealogia/entrevista');
  });

  test('abans d’acceptar l’avís no hi ha càrrega; i el botó parla la llengua de la closca', async () => {
    munta('/app/genealogia/avis');
    expect(await screen.findByRole('button', { name: 'Entesos' }, ESPERA)).toBeTruthy();
    expect(screen.queryByLabelText(ETIQUETA)).toBeNull();
    cleanup();
    await acceptaAvis();
    munta('/app/genealogia/entrevista', { externalConfig: { language: 'en' } });
    expect(await screen.findByRole('button', { name: /Load my private tree \(\.json or \.ged\)$/ }, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText(/never leaves this device/)).toBeTruthy();
  });
});

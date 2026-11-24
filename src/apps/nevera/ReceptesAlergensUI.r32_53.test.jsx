/* La Nevera de Casa · R32.53 (IDEA-336) · Bloc honest d'al·lèrgens UE 1169/2011
   al detall de les receptes en les 5 llengües oficials (ca, es, en, eu, gl),
   sense certificar absències i compatible amb matrius externes del nucli. */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { CODIS_IDIOMA_NEVERA, textosVistaNevera } from './i18nNevera.js';
import { creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import { RECEPTES, estatInicial, marcaACasa } from './nucli/index.js';
import { resumAlergensRecepta } from './vistes/alergensVistaRecepta.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

async function prepara(estat = null) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  tancats.push(magatzem);
  if (estat) await magatzem.desa(estat);
  const App = () => <AppNevera magatzem={magatzem} descarrega={vi.fn()} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { registre };
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('R32.53 · resumAlergensRecepta (pur i compatible amb matriu externa)', () => {
  test('classifica amb honestedat les 14 receptes de llavor entre ingredients principals, opcionals i notes preventives', () => {
    expect(RECEPTES).toHaveLength(14);
    const perId = Object.fromEntries(RECEPTES.map((r) => [r.id, resumAlergensRecepta(r)]));

    expect(perId['pa-amb-tomaca'].obligatoris).toEqual(['gluten']);
    expect(perId['pa-amb-tomaca'].opcionalsOTraces).toEqual([]);
    expect(perId['pa-amb-tomaca'].teElaborats).toBe(true);

    expect(perId['ous-amb-tomaca'].obligatoris).toEqual(['ous']);
    expect(perId['truita-de-creilla'].obligatoris).toEqual(['ous']);

    expect(perId['sopa-d-all'].obligatoris).toEqual(['gluten']);
    expect(perId['sopa-d-all'].opcionalsOTraces).toEqual(['ous']);

    expect(perId.espencat.obligatoris).toEqual([]);
    expect(perId.espencat.opcionalsOTraces).toEqual(['peix']);

    expect(perId['coca-de-tomaca-i-pebrera'].obligatoris).toEqual(['gluten']);
    expect(perId['coca-de-tomaca-i-pebrera'].opcionalsOTraces).toEqual(['peix']);

    expect(perId['coca-en-tonyina'].obligatoris).toEqual(['gluten', 'peix']);
    expect(perId['coca-en-tonyina'].tePinyo).toBe(true);

    expect(perId.llentilles.obligatoris).toEqual([]);
    expect(perId.llentilles.teLlentilla).toBe(true);

    expect(perId.allioli.obligatoris).toEqual([]);
    expect(perId.allioli.opcionalsOTraces).toEqual([]);
  });

  test('prioritza matriuAlergens acreditada (amb fruits_closca o fruits-closca) quan la recepta la porta', () => {
    const sintetica = {
      id: 'coca-ametla',
      ingredients: [{ id: 'farina', quantitat: '300 g', opcional: false, o: [] }],
      matriuAlergens: {
        gluten: 'ingredient',
        fruits_closca: 'conte',
        llet: 'traca',
        soja: 'desconegut'
      }
    };
    const resum = resumAlergensRecepta(sintetica);
    expect(resum.obligatoris).toEqual(['gluten', 'fruits-closca']);
    expect(resum.opcionalsOTraces).toEqual(['llet']);
  });
});

describe('R32.53 · bloc visual d’al·lèrgens al diàleg de Receptes en les 5 llengües', () => {
  test.each(CODIS_IDIOMA_NEVERA)('en %s mostra les icones i textos honestos per a Sopa d’all sense inventar absències', async (llengua) => {
    const tx = textosVistaNevera(llengua);
    const estat = marcaACasa(estatInicial(), 'pa', 'hi-ha');
    const entorn = await prepara(estat);
    muntaPlataforma('/app/nevera/receptes/casa?article=sopa-d-all', {
      registre: entorn.registre,
      entorn: ENTORN,
      externalConfig: { language: llengua }
    });
    const dialeg = await screen.findByRole('dialog', { name: 'Sopa d’all' });
    const grup = await within(dialeg).findByRole('group', { name: tx.alergensReceptaTitol });
    expect(grup.textContent).toContain(tx.alergensConteLabel);
    expect(grup.textContent).toContain(tx.nomsAlergens.gluten);
    expect(grup.textContent).toContain(tx.alergensOpcionalLabel);
    expect(grup.textContent).toContain(tx.nomsAlergens.ous);
    expect(grup.textContent).toContain(tx.alergensAvisEtiqueta);
    expect(grup.textContent).not.toMatch(/absent|lliure de|sense gluten|sin gluten|gluten-free/i);
    expect(within(grup).getByRole('img', { name: (nom) => nom.startsWith(tx.alergensIconesConte) })).toBeTruthy();
    expect(within(grup).getByRole('img', { name: (nom) => nom.startsWith(tx.alergensIconesOpcional) })).toBeTruthy();
  });

  test('mostra la nota de llentilles i el missatge honest quan la recepta base no porta cap ingredient directe dels 14 grups', async () => {
    const tx = textosVistaNevera('ca');
    const entorn = await prepara(estatInicial());
    muntaPlataforma('/app/nevera/receptes/casa?article=llentilles', {
      registre: entorn.registre,
      entorn: ENTORN
    });
    const dialeg = await screen.findByRole('dialog', { name: 'Llentilles amb verdura' });
    const grup = within(dialeg).getByRole('group', { name: tx.alergensReceptaTitol });
    expect(grup.textContent).toContain(tx.alergensCapDirecte);
    expect(grup.textContent).toContain(tx.alergensNotaLlentilla);
    expect(within(grup).queryByRole('img')).toBeNull();
  });
});

/* IDEA-258b (Onada R24) · Precomanda per a la botiga local / de poble dins de La Nevera.
   Verifica:
     1. Nucli pur (`creaEncarrecBotigaPoble`): agrupació per seccions segons l'ordre de la llista,
        5 llengües (`ca, es, en, eu, gl`) i purga radical de marques blanques de gran superfície
        (`Mercadona`, `Hacendado`, `Bosque Verde`, `Deliplus`, `Compy`) tant en productes del catàleg
        com en noms antics de llista o especificacions.
     2. Vista (`EncarrecBotigaPoble`): estat buit, previsualització viva amb comerç/recollida/signatura,
        còpia al porta-retalls (i avís manual si falla), menú natiu `navigator.share`, descàrrega `.txt`
        i «Copia i obri el Xat» (`/xat`) sense cap petició de xarxa. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import {
  ARTICLES_PRODUCTES, afig, afigPerNom, creaEncarrecBotigaPoble, creaLlista, estatInicial, mouSeccio
} from './nucli/index.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const MARQUES_PROHIBIDES = /\b(?:Mercadona|Hacendado|Bosque Verde|Deliplus|Compy)\b/i;
const tancats = [];

function prepara({ idioma = 'ca' } = {}) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  tancats.push(magatzem);
  const descarrega = vi.fn();
  const App = () => <AppNevera magatzem={magatzem} descarrega={descarrega} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, magatzem, descarrega, registre, idioma };
}

function munta(url, entorn = prepara()) {
  muntaPlataforma(url, { registre: entorn.registre, entorn: { ...ENTORN, idioma: entorn.idioma } });
  return entorn;
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

describe('IDEA-258b · nucli pur creaEncarrecBotigaPoble', () => {
  test('agrupa per seccions en l’ordre de la llista, traduïx en ca/es/en/eu/gl i purga al 100% qualsevol marca de supermercat', () => {
    const prodHacendado = ARTICLES_PRODUCTES.find((p) => /hacendado/i.test(String(p.marca || '')) || /hacendado/i.test(p.nom))
      || ARTICLES_PRODUCTES[0];

    let estat = creaLlista(estatInicial(), 'Mercadona');
    const llistaId = estat.darreraLlista;
    // Posem pa-pastissos davant de fruita-verdura per verificar que respecta l'ordre de la llista
    estat = mouSeccio(estat, llistaId, 'pa-pastissos', -1);
    estat = afig(estat, llistaId, 'tomaques', { especificacio: '2 kg madures per amanir' });
    estat = afig(estat, llistaId, 'pa', { especificacio: '1 fogassa de llenya' });
    estat = afig(estat, llistaId, prodHacendado.id, { especificacio: '2 unitats Hacendado' });
    estat = afigPerNom(estat, llistaId, 'Mel de romer de la serra', { especificacio: '1 pot' });

    const esperatsPerIdioma = {
      ca: { cap: 'Encàrrec per a la botiga local · Botiga de poble', pa: '[Pa i pastissos]', fruita: '[Fruita i verdura]' },
      es: { cap: 'Encargo para la tienda local · Tienda de pueblo', pa: '[Pan y bollería]', fruita: '[Fruta y verdura]' },
      en: { cap: 'Pre-order for the local shop · Village shop', pa: '[Bread and bakery]', fruita: '[Fruit and vegetables]' },
      eu: { cap: 'Herriko dendarako enkargua · Herriko denda', pa: '[Ogia eta gozogintza]', fruita: '[Fruta eta barazkiak]' },
      gl: { cap: 'Encargo para a tenda local · Tenda da vila', pa: '[Pan e pastelaría]', fruita: '[Froita e verdura]' }
    };

    for (const [idioma, pistes] of Object.entries(esperatsPerIdioma)) {
      const resultat = creaEncarrecBotigaPoble(estat, llistaId, {
        idioma,
        comerc: 'Forn i Cooperativa de La Torre',
        recollida: 'Dijous a les 11:30 h',
        signatura: 'Maria · Cal Ximet'
      });
      expect(resultat.ok, idioma).toBe(true);
      expect(resultat.totalArticles, idioma).toBe(4);
      expect(resultat.text, idioma).toContain(pistes.cap);
      expect(resultat.text, idioma).toContain(pistes.pa);
      expect(resultat.text, idioma).toContain(pistes.fruita);
      expect(resultat.text.indexOf(pistes.pa), idioma).toBeLessThan(resultat.text.indexOf(pistes.fruita));
      expect(resultat.text, idioma).toContain('Forn i Cooperativa de La Torre');
      expect(resultat.text, idioma).toContain('Dijous a les 11:30 h');
      expect(resultat.text, idioma).toContain('Maria · Cal Ximet');
      expect(MARQUES_PROHIBIDES.test(resultat.text), idioma).toBe(false);
    }
  });

  test('retorna codi clar quan la llista és buida o inexistent', () => {
    const buit = creaEncarrecBotigaPoble(estatInicial(), 'casa');
    expect(buit).toEqual({ ok: false, codi: 'sense-articles' });
    const inexistent = creaEncarrecBotigaPoble(estatInicial(), 'no-existix');
    expect(inexistent).toEqual({ ok: false, codi: 'sense-llista' });
  });
});

describe('IDEA-258b · vista EncarrecBotigaPoble dins de La Compra', () => {
  test('mostra avís honest en llista buida; amb articles copia, compartix, descarrega .txt i pot obrir /xat sense xarxa', async () => {
    const escriuPortaRetalls = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: escriuPortaRetalls }
    });
    const compartixNatiu = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: compartixNatiu
    });

    const entorn = prepara({ idioma: 'ca' });
    await entorn.magatzem.desa(estatInicial());
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });

    const mig = within(document.getElementById('app-grid-list'));
    fireEvent.click(mig.getByRole('button', { name: 'Prepara encàrrec per a la botiga local' }));
    expect(mig.getByText(/Afig almenys un article per comprar a la llista/)).toBeTruthy();

    // Afegim Pa i Oli d'oliva des del catàleg
    const cataleg = within(document.getElementById('app-grid-main'));
    fireEvent.click(cataleg.getAllByRole('button', { name: 'Pa' })[0]);
    fireEvent.click(cataleg.getAllByRole('button', { name: 'Tomaques' })[0]);

    fireEvent.change(mig.getByRole('textbox', { name: 'Comerç, forn o cooperativa (opcional)' }), {
      target: { value: 'Botiga de la Plaça' }
    });
    fireEvent.change(mig.getByRole('textbox', { name: 'Recollida o indicació breu (opcional)' }), {
      target: { value: 'Divendres matí' }
    });
    fireEvent.change(mig.getByRole('textbox', { name: 'De part de qui (opcional)' }), {
      target: { value: 'Vicent' }
    });

    const quadre = mig.getByRole('textbox', { name: 'Text de l’encàrrec ordenat per seccions' });
    expect(quadre.value).toContain('Encàrrec per a la botiga local · Casa');
    expect(quadre.value).toContain('Comerç: Botiga de la Plaça');
    expect(quadre.value).toContain('Recollida o nota: Divendres matí');
    expect(quadre.value).toContain('De part de: Vicent');
    expect(quadre.value).toContain('- Tomaques');
    expect(quadre.value).toContain('- Pa');
    expect(MARQUES_PROHIBIDES.test(quadre.value)).toBe(false);

    // 1. Copia al porta-retalls
    fireEvent.click(mig.getByRole('button', { name: 'Copia l’encàrrec' }));
    await waitFor(() => expect(escriuPortaRetalls).toHaveBeenCalledWith(quadre.value));
    expect(await mig.findByRole('status')).toBeTruthy();

    // 2. Compartix natiu al mòbil
    fireEvent.click(mig.getByRole('button', { name: 'Compartix al mòbil' }));
    await waitFor(() => expect(compartixNatiu).toHaveBeenCalledWith({
      title: 'Encàrrec per a la botiga local · «Casa»',
      text: quadre.value
    }));

    // 3. Descarrega .txt
    fireEvent.click(mig.getByRole('button', { name: 'Descarrega .txt' }));
    expect(entorn.descarrega).toHaveBeenCalledWith({
      nom: 'encarrec-casa.txt',
      tipus: 'text/plain;charset=utf-8',
      dades: `${quadre.value}\n`
    });

    // 4. Copia i obri el Xat
    fireEvent.click(mig.getByRole('button', { name: 'Copia i obri el Xat' }));
    await waitFor(() => expect(screen.getByTestId('ubicacio').textContent).toBe('/xat'));
  });

  /* CODEX-R24-D1-04 (Onada R24.2) · Si el porta-retalls falla, «Copia i obri
     el Xat» no navega: l'encàrrec es queda al quadre i l'avís de còpia manual
     ho diu, perquè la persona no perda el text que ha escrit. */
  test('si el porta-retalls falla, «Copia i obri el Xat» es queda a la Nevera amb el text i l’avís manual', async () => {
    const escriuPortaRetalls = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: escriuPortaRetalls }
    });

    const entorn = prepara({ idioma: 'ca' });
    await entorn.magatzem.desa(estatInicial());
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });

    const mig = within(document.getElementById('app-grid-list'));
    fireEvent.click(mig.getByRole('button', { name: 'Prepara encàrrec per a la botiga local' }));
    const cataleg = within(document.getElementById('app-grid-main'));
    fireEvent.click(cataleg.getAllByRole('button', { name: 'Pa' })[0]);
    fireEvent.change(mig.getByRole('textbox', { name: 'De part de qui (opcional)' }), {
      target: { value: 'Vicent' }
    });
    const quadre = mig.getByRole('textbox', { name: 'Text de l’encàrrec ordenat per seccions' });
    const text = quadre.value;
    expect(text).toContain('De part de: Vicent');
    const ubicacioAbans = screen.getByTestId('ubicacio').textContent;
    expect(ubicacioAbans).not.toBe('/xat');

    fireEvent.click(mig.getByRole('button', { name: 'Copia i obri el Xat' }));
    await waitFor(() => expect(escriuPortaRetalls).toHaveBeenCalledWith(text));
    expect(await mig.findByText(/Este navegador no ha permés copiar automàticament/)).toBeTruthy();
    expect(screen.getByTestId('ubicacio').textContent).toBe(ubicacioAbans);
    expect(mig.getByRole('textbox', { name: 'Text de l’encàrrec ordenat per seccions' }).value).toBe(text);
  });
});

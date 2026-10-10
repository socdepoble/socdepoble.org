/* CU (Onada 3, 261003) · On porta la targeta del Snippet (la fitxa, amb una
   consulta sobre la mateixa ruta) i on porta el botó principal (la clau
   `snippetChromeUrl` de la capa del paquet, només https, mai un lloc fixat). */
import { describe, expect, test } from 'vitest';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import {
  CLAU_FITXA, CLAU_URL_SNIPPET, DATA_DEL_SNIPPET, FITXA_SNIPPET, destiDelSnippet, rutaDeLaFitxa, urlDelSnippet
} from './destiSnippet.js';

const APP = 'https://poble.test';
const BOTIGA = 'https://chromewebstore.google.com/detail/snippet/abcdefghijklmnop';

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) · La
   data de la targeta canònica del Snippet i de la barra taronja de la seua
   fitxa: el dia documentat («CU, Onada 3, 261003») i res més. Cap font en diu
   l'hora: és una data de només dia, i la pastilla no en pinta cap (l'hora no
   s'inventa). Si el Mestre en dicta una, esta prova es gira amb la dada. */
describe('DATA_DEL_SNIPPET', () => {
  test('és el dia de la CU, sense hora: la pastilla pinta la data i prou', () => {
    expect(DATA_DEL_SNIPPET).toBe('2026-10-03');
    expect(dataHoraDeBarra({ creat: DATA_DEL_SNIPPET })).toEqual({ time: '', date: '03/10/26', dateTime: '2026-10-03' });
  });
});

describe('rutaDeLaFitxa', () => {
  test('obri la fitxa sobre la ruta d’on està la persona, sense ruta nova', () => {
    expect(rutaDeLaFitxa('/control')).toBe('/control?fitxa=snippet');
    expect(rutaDeLaFitxa('/utilitats')).toBe('/utilitats?fitxa=snippet');
    expect(`${CLAU_FITXA}=${FITXA_SNIPPET}`).toBe('fitxa=snippet');
  });

  test('des de qualsevol altre lloc, fora de base o amb brossa, el Panell de Control', () => {
    for (const cami of ['/control-xat', '/notes', '/utilitats/x', '', null, undefined, 'utilitats', 42]) {
      expect(rutaDeLaFitxa(cami), String(cami)).toBe('/control?fitxa=snippet');
    }
  });
});

describe('urlDelSnippet', () => {
  test('llig la clau de la capa del paquet i res més', () => {
    expect(CLAU_URL_SNIPPET).toBe('snippetChromeUrl');
    expect(urlDelSnippet({ snippetChromeUrl: `  ${BOTIGA}  ` })).toBe(BOTIGA);
    expect(urlDelSnippet({ supabaseUrl: 'https://x.supabase.co', dataMode: 'remote' })).toBe('');
    expect(urlDelSnippet({ snippetChromeUrl: 42 })).toBe('');
    expect(urlDelSnippet(null)).toBe('');
  });
});

describe('destiDelSnippet', () => {
  test('la botiga de Chrome: s’instal·la i és de fora', () => {
    expect(destiDelSnippet(BOTIGA, APP)).toEqual({ href: BOTIGA, descarrega: false, extern: true });
  });

  test('un paquet .zip es descarrega; del mateix origen, no és de fora', () => {
    expect(destiDelSnippet(`${APP}/extensio/snippet.zip`, APP))
      .toEqual({ href: `${APP}/extensio/snippet.zip`, descarrega: true, extern: false });
    expect(destiDelSnippet('https://paquets.test/snippet-1.0.ZIP', APP))
      .toEqual({ href: 'https://paquets.test/snippet-1.0.ZIP', descarrega: true, extern: true });
    expect(destiDelSnippet('https://paquets.test/snippet.zip?v=2', APP).descarrega).toBe(true);
  });

  /* Correcció de la revisió · Chrome estable (Windows i macOS) no instal·la
     un .crx de fora de la botiga: no és una via per a la gent del poble. */
  test('un .crx no és cap destí, ni com a descàrrega ni com a instal·lació', () => {
    for (const valor of ['https://paquets.test/snippet.crx', `${APP}/extensio/snippet-1.0.CRX`, 'https://paquets.test/snippet.crx?v=2']) {
      expect(destiDelSnippet(valor, APP), valor).toBeNull();
    }
  });

  test('cap destí sense una adreça https vàlida', () => {
    for (const valor of [
      '', '   ', null, undefined, 42,
      'http://paquets.test/snippet.zip',
      'javascript:alert(1)',
      'chrome://extensions',
      'https://usuari:clau@paquets.test/snippet.zip',
      '/extensio/snippet.zip',
      `https://paquets.test/${'a'.repeat(2100)}`
    ]) {
      expect(destiDelSnippet(valor, APP), String(valor).slice(0, 40)).toBeNull();
    }
  });
});

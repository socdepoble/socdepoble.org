/* Onada 6 (prompt 261009_0230, punt 4) · L'esborrany de «Informa d'un
   error»: la plantilla curta i quatre dades tècniques que no diuen res de la
   persona (ruta sense identificadors ni consulta, versió del paquet,
   navegador i pantalla). */
import { afterEach, describe, expect, it } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import {
  CORREU_DE_RESERVA, PLANTILLA_INFORME, afigInforme, composaInforme, enllacDeCorreu, midaDePantalla, navegadorDe,
  oblidaRutaForaDelXat, recordaRutaForaDelXat, rutaSenseDades, versioDelPaquet
} from './informeDError.js';
import { createTranslator } from '../../config/i18n.js';

const UUID = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d09';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0';
const FIREFOX = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:131.0) Gecko/20100101 Firefox/131.0';
const ENTORN = { ua: IPHONE, amplada: 375, alcada: 812, densitat: 3 };

afterEach(() => oblidaRutaForaDelXat());

describe('les dades tècniques', () => {
  it('la ruta perd la consulta, el fragment i tot identificador', () => {
    expect(rutaSenseDades(`/xat/${UUID}?sobre=pagina%3A%2Fiaia`)).toBe('/xat/:id');
    expect(rutaSenseDades('/gent/pepa-la-del-forn#bio')).toBe('/gent/:id');
    expect(rutaSenseDades('/perfil/iaia')).toBe('/perfil/:id');
    expect(rutaSenseDades('/mercat/123456')).toBe('/mercat/:id');
    expect(rutaSenseDades(`/empresa/${UUID}`)).toBe('/empresa/:id');
    expect(rutaSenseDades('/xat')).toBe('/xat');
    expect(rutaSenseDades('')).toBe('/');
  });

  /* Revisió 261009 · Llista blanca: `:sectionId/:itemId` (App.jsx) porta
     slugs de títol o ids de llavor curts que una llista negra deixava passar. */
  it('llista blanca: només el primer segment, la secció; la resta és «:id»', () => {
    expect(rutaSenseDades('/pobles/la-torre-de-les-macanes')).toBe('/pobles/:id');
    expect(rutaSenseDades('/notes/el-meu-sopar-amb-la-pepa')).toBe('/notes/:id');
    expect(rutaSenseDades('/mur/n7')).toBe('/mur/:id');
    expect(rutaSenseDades('/app/gestoria/historic')).toBe('/app/:id/:id');
    expect(rutaSenseDades(`/${UUID}`)).toBe('/:id');
    expect(rutaSenseDades('/123456')).toBe('/:id');
    expect(rutaSenseDades(`/${'a'.repeat(41)}`)).toBe('/:id');
    expect(rutaSenseDades('/Pepa Garcia')).toBe('/:id');
  });

  it('la reserva de correu: l’adreça pública, l’assumpte i l’informe amb salts CRLF', () => {
    expect(CORREU_DE_RESERVA).toBe('socdepoble@socdepoble.org');
    const enllac = enllacDeCorreu('Què ha passat: \nRuta: /xat', "Informe d'un error a Sóc de Poble");
    expect(enllac.startsWith('mailto:socdepoble@socdepoble.org?subject=')).toBe(true);
    const consulta = new URLSearchParams(enllac.slice(enllac.indexOf('?') + 1));
    expect(consulta.get('subject')).toBe("Informe d'un error a Sóc de Poble");
    expect(consulta.get('body')).toBe('Què ha passat: \r\nRuta: /xat');
    expect(enllacDeCorreu('', '')).toBe('mailto:socdepoble@socdepoble.org');
  });

  it('el navegador: nom, versió major i sistema; res més de l’agent', () => {
    expect(navegadorDe(IPHONE)).toBe('Safari 16 · iOS');
    expect(navegadorDe(ANDROID)).toBe('Chrome 129 · Android');
    expect(navegadorDe(EDGE)).toBe('Edge 128 · Windows');
    expect(navegadorDe(FIREFOX)).toBe('Firefox 131 · macOS');
    expect(navegadorDe('')).toBe('—');
  });

  it('la pantalla, en píxels CSS i amb la densitat si no és 1', () => {
    expect(midaDePantalla(375, 812, 3)).toBe('375 × 812 · ×3');
    expect(midaDePantalla(1280, 800, 1)).toBe('1280 × 800');
    expect(midaDePantalla(undefined, 800)).toBe('—');
  });

  it('la versió: el mode i el tros de JavaScript (el hash canvia a cada construcció)', () => {
    expect(versioDelPaquet('https://socdepoble.org/assets/XatSection-Bx3k2.js?v=1', 'production')).toBe('production · XatSection-Bx3k2.js');
    expect(versioDelPaquet('no és cap url', 'test')).toBe('test');
    expect(versioDelPaquet('', '')).toBe('—');
  });
});

describe('composaInforme', () => {
  it('la plantilla valenciana és la reserva de la clau i porta les quatre dades', () => {
    const ca = createTranslator('ca');
    expect(ca('section.xat.informe.plantilla')).toBe(PLANTILLA_INFORME);
    recordaRutaForaDelXat('/mercat/123456');
    const text = composaInforme({ t: ca, rutaActual: `/xat/${UUID}`, entorn: ENTORN, versio: 'production · XatSection-Bx3k2.js' });
    expect(text.split('\n').slice(0, 3)).toEqual(['Què ha passat: ', 'On: ', 'Què esperaves: ']);
    expect(text).toContain('Ruta: /mercat/:id → /xat/:id');
    expect(text).toContain('Versió: production · XatSection-Bx3k2.js');
    expect(text).toContain('Navegador: Safari 16 · iOS');
    expect(text).toContain('Pantalla: 375 × 812 · ×3');
    expect(text).not.toContain(UUID);
    expect(text).not.toMatch(/\{(ruta|versio|navegador|pantalla)\}/);
  });

  it('en la llengua de la interfície, i sense ruta anterior només la del xat', () => {
    const en = createTranslator('en');
    const text = composaInforme({ t: en, rutaActual: '/xat', rutaAnterior: null, entorn: ENTORN, versio: 'v' });
    expect(text.startsWith('What happened: ')).toBe(true);
    expect(text).toContain('Route: /xat\n');
  });

  it('una ruta del xat no es recorda com a anterior', () => {
    recordaRutaForaDelXat('/pobles/sella');
    recordaRutaForaDelXat('/xat/abc');
    recordaRutaForaDelXat('/e/coop/xat');
    expect(composaInforme({ rutaActual: '/xat', entorn: ENTORN, versio: 'v' })).toContain('Ruta: /pobles/:id → /xat');
  });

  it('afigInforme no trepitja el que la persona ja havia escrit ni el repetix', () => {
    expect(afigInforme('', 'INFORME')).toBe('INFORME');
    expect(afigInforme('Hola  ', 'INFORME')).toBe('Hola\n\nINFORME');
    expect(afigInforme('Hola\n\nINFORME', 'INFORME')).toBe('Hola\n\nINFORME');
  });
});

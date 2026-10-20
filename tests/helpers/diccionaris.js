/* Suport de proves · Fase D (261020, tasca 4.1) · L1: els cinc diccionaris,
   fora de src/ (LLEI_08: el suport de proves viu a tests/helpers/).
   · Importar este fitxer carrega es, en, eu i gl pel carregador de veres
     (carregaDiccionari, amb els import() literals d'i18n.js) abans que corra
     cap prova del fitxer: createTranslator('es') i un UIProvider en castellà
     parlen castellà des del primer pintat, com abans de L1. Una prova que
     tradueix a una llengua que no és el valencià l'ha d'importar
     (src/config/i18n.idiomes.test.js ho comprova).
   · S'importa al nivell de dalt del fitxer de prova, mai després d'un
     vi.resetModules(): un reinici dona un registre nou que només porta el
     valencià, i este fitxer, ja avaluat, no el tornaria a omplir.
   · FONT_DELS_DICCIONARIS és el text cru dels cinc fitxers, un darrere
     l'altre, per a les proves que compten aparicions de claus (abans
     llegien i18n.js?raw, quan els cinc blocs vivien allí).
   Res d'ací no és codi de producció: només l'importen les proves. */
import { IDIOMES_DIFERITS, carregaDiccionari } from '../../src/config/i18n.js';
import fontCa from '../../src/config/idiomes/ca.js?raw';
import fontEs from '../../src/config/idiomes/es.js?raw';
import fontEn from '../../src/config/idiomes/en.js?raw';
import fontEu from '../../src/config/idiomes/eu.js?raw';
import fontGl from '../../src/config/idiomes/gl.js?raw';

export const FONTS_PER_IDIOMA = Object.freeze({ ca: fontCa, es: fontEs, en: fontEn, eu: fontEu, gl: fontGl });
export const FONT_DELS_DICCIONARIS = Object.values(FONTS_PER_IDIOMA).join('\n');

const carregats = await Promise.all(IDIOMES_DIFERITS.map((codi) => carregaDiccionari(codi)));
if (carregats.some((carregat) => carregat !== true)) {
  throw new Error(`[proves] No s'han pogut carregar els diccionaris: ${IDIOMES_DIFERITS.filter((_, i) => !carregats[i]).join(', ')}`);
}

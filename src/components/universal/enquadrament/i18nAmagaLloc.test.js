// @vitest-environment node
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Carril T · La paritat del
   diccionari diferit de l'interruptor «Amaga el lloc» (i18nAmagaLloc.js): les
   cinc llengües oficials, els mateixos textos, cap de buit, el marcador {lloc}
   (el rètol de l'interruptor) a l'avís de revisar, i el castellà i l'anglés no
   copien el valencià. Una llengua desconeguda parla valencià. Les reserves de
   DialegEnquadrament.jsx són el valencià d'ací, lletra per lletra. */
import { describe, expect, test } from 'vitest';
import { AJUDA_TAMBE_DATA, AVIS_REVISA_LLOC, ETIQUETA_AMAGA_LLOC } from './DialegEnquadrament.jsx';
import { TEXTOS_AMAGA_LLOC, textosAmagaLloc } from './i18nAmagaLloc.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
/* v1.2.23 · L2-03 (Gauntlet R1) · I els dos avisos d'una pujada rebutjada amb l'interruptor apagat. */
const CLAUS = ['revisaLloc', 'tambeData', 'noConservableLloc', 'pressupostLloc'];
const AMB_LLOC = ['revisaLloc', 'noConservableLloc', 'pressupostLloc'];

describe('i18nAmagaLloc · el diccionari diferit de l’interruptor', () => {
  test('té exactament les cinc llengües oficials i els quatre textos a cada una', () => {
    expect(Object.keys(TEXTOS_AMAGA_LLOC).sort()).toEqual([...LLENGUES].sort());
    for (const llengua of LLENGUES) {
      expect(Object.keys(TEXTOS_AMAGA_LLOC[llengua]).sort(), llengua).toEqual([...CLAUS].sort());
      for (const clau of CLAUS) expect(TEXTOS_AMAGA_LLOC[llengua][clau].trim().length, `${llengua}.${clau}`).toBeGreaterThan(10);
    }
  });

  test.each(LLENGUES)('%s: els avisos que nomenen l’interruptor porten un sol {lloc}, i la línia de la data cap marcador', (llengua) => {
    for (const clau of AMB_LLOC) expect(TEXTOS_AMAGA_LLOC[llengua][clau].match(/\{\w+\}/g), `${llengua}.${clau}`).toEqual(['{lloc}']);
    expect(TEXTOS_AMAGA_LLOC[llengua].tambeData).not.toMatch(/\{\w+\}/);
  });

  /* v1.2.23 · L2-03 (Gauntlet R1) · Els avisos d'un rebuig no demanen desmarcar cap casella en cap llengua. */
  test.each(LLENGUES)('%s: els avisos d’un rebuig amb l’interruptor no parlen de desmarcar cap casella', (llengua) => {
    for (const clau of ['noConservableLloc', 'pressupostLloc']) {
      expect(TEXTOS_AMAGA_LLOC[llengua][clau], `${llengua}.${clau}`).not.toMatch(/desmarc|untick|kendu marka/i);
    }
  });

  test('el castellà i l’anglés no copien el valencià', () => {
    for (const llengua of ['es', 'en']) {
      for (const clau of CLAUS) expect(TEXTOS_AMAGA_LLOC[llengua][clau], `${llengua}.${clau}`).not.toBe(TEXTOS_AMAGA_LLOC.ca[clau]);
    }
  });

  test('una llengua desconeguda o absent parla valencià', () => {
    expect(textosAmagaLloc('fr')).toBe(TEXTOS_AMAGA_LLOC.ca);
    expect(textosAmagaLloc(undefined)).toBe(TEXTOS_AMAGA_LLOC.ca);
    expect(textosAmagaLloc('eu')).toBe(TEXTOS_AMAGA_LLOC.eu);
  });

  test('les reserves de DialegEnquadrament.jsx són el valencià, lletra per lletra', () => {
    expect(AVIS_REVISA_LLOC).toBe('Esta foto porta dades que es publicarien amb ella. Revisa «Amaga el lloc» i torna a desar.');
    expect(AVIS_REVISA_LLOC).toBe(TEXTOS_AMAGA_LLOC.ca.revisaLloc.replace('{lloc}', ETIQUETA_AMAGA_LLOC));
    expect(AJUDA_TAMBE_DATA).toBe('També es publicarà la data de la foto.');
  });
});

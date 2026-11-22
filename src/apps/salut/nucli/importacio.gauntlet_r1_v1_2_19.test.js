// @vitest-environment node
/* v1.2.19 · Gauntlet R1 · fulls de la Salut.
   · L3-03: les marques del sistema de la columna Notes («Hora aproximada (franja)»,
     «Líquid del menjar», «Calculat a ull») tornen a la forma canònica en importar,
     encara que el full les porte en una altra de les 5 llengües (els fulls que va
     traure la v1.2.19 abans d'esta correcció).
   · L5-08 (punt 3): l'avís «format-desconegut» traduït cita el full de l'exportació
     amb el nom que li dona l'exportació en eixa llengua, i en valencià no canvia. */
import { describe, expect, test } from 'vitest';
import { modelFullSalutTraduit, propostaImportacioTraduida } from '../i18nSalut.js';
import { validaApunt, validaPersona } from './diccionari.js';
import { exporta } from './exportacio.js';
import { fullDiari } from './full.js';
import { assignaJornades } from './hores.js';
import { NOTA_FRANJA, llegixFitxer, llibreDeCsv, proposaApunts } from './importacio.js';

const DIA = '2026-03-10';
const PERSONA = validaPersona({}).persona;
const OFSET = () => 60;
const ALTRES_LLENGUES = Object.freeze(['es', 'en', 'eu', 'gl']);

/* Les marques tal com les escrivia a la columna Notes la v1.2.19 abans de la correcció. */
const MARQUES_TRADUIDES = Object.freeze({
  'Calculat a ull': Object.freeze({ es: 'Calculado a ojo', en: 'Estimated amount', eu: 'Begiz kalkulatua', gl: 'Calculado a ollo' }),
  [NOTA_FRANJA]: Object.freeze({ es: 'Hora aproximada (franja)', en: 'Approximate time (slot)', eu: 'Gutxi gorabeherako ordua (tartea)', gl: 'Hora aproximada (franxa)' }),
  'Líquid del menjar': Object.freeze({ es: 'Líquido de la comida', en: 'Fluid from food', eu: 'Janariaren likidoa', gl: 'Líquido da comida' })
});
const notaTraduida = (nota, codi) => (nota
  ? nota.split(' · ').map((part) => MARQUES_TRADUIDES[part]?.[codi] ?? part).join(' · ')
  : nota);

let seq = 0;
const nouId = () => {
  seq += 1;
  return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
};

describe('v1.2.19 · Gauntlet R1 (L3-03): les marques de les notes tornen a la forma canònica', () => {
  const crus = [
    { tipus: 'ingesta', moment: `${DIA}T08:00`, volumMl: 120, beguda: 'altra', estimat: true, rebutjada: false, nota: `Líquid del menjar · ${NOTA_FRANJA}` },
    { tipus: 'ingesta', moment: `${DIA}T09:00`, volumMl: 200, beguda: 'aigua', estimat: false, rebutjada: false, nota: `Amb llimó · ${NOTA_FRANJA} potser` },
    { tipus: 'miccio', moment: `${DIA}T10:00`, volumMl: 250, mesura: 'mesurat', lloc: 'vater', nota: NOTA_FRANJA },
    { tipus: 'escapament', moment: `${DIA}T11:00`, quantitat: 'gotes', circumstancia: 'no-se-sap', nota: NOTA_FRANJA }
  ];
  const originals = assignaJornades(
    crus.map((c) => validaApunt({ ...c, id: nouId(), ofsetMin: 60 }, { ambId: true }).apunt),
    PERSONA
  );
  const esperats = originals
    .sort((a, b) => (a.moment < b.moment ? -1 : 1))
    .map((a) => ({ ...a, id: undefined, jornada: undefined }));

  test.each(ALTRES_LLENGUES)('idioma %s: un full amb les marques traduïdes torna les notes canòniques', (idioma) => {
    const { model, periode } = fullDiari({ des: DIA, dies: 1, apunts: originals, persona: PERSONA, ofsetDe: OFSET });
    const traduit = modelFullSalutTraduit(model, {
      des: DIA, fins: DIA, dies: 1, completes: periode.completes, nomPersona: '', idioma
    });
    /* El full que va traure la v1.2.19 abans de la correcció: Notes amb les marques traduïdes. */
    const antic = {
      ...traduit,
      fulles: traduit.fulles.map((fulla, i) => (i === 1
        ? { ...fulla, files: fulla.files.map((fila) => fila.map((v, col) => (col === 13 ? notaTraduida(v, idioma) : v))) }
        : fulla))
    };
    if (idioma === 'en') {
      expect(antic.fulles[1].files.map((fila) => fila[13])).toContain('Estimated amount · Fluid from food · Approximate time (slot)');
    }
    for (const format of ['xlsx', 'csv']) {
      const fitxer = exporta({ model: antic, format, des: DIA, dies: 1, fullaCsv: antic.fulles[1].nom });
      const bytes = typeof fitxer.dades === 'string' ? new TextEncoder().encode(fitxer.dades) : fitxer.dades;
      const llegit = llegixFitxer(bytes, fitxer.nom);
      expect(llegit.ok).toBe(true);
      const proposta = proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, fitxer: fitxer.nom });
      const recuperats = [...proposta.apunts]
        .sort((a, b) => (a.moment < b.moment ? -1 : 1))
        .map((a) => ({ ...a, id: undefined, jornada: undefined }));
      expect(recuperats, `${idioma} ${format}`).toEqual(esperats);
    }
  });
});

describe('v1.2.19 · Gauntlet R1 (L5-08): l’avís «format-desconegut» cita el full en la llengua de l’avís', () => {
  const desconegut = proposaApunts({ llibre: llibreDeCsv([['a', 'b'], ['1', '2']]) });
  const { model, periode } = fullDiari({ des: DIA, dies: 1, apunts: [], persona: PERSONA, ofsetDe: OFSET });

  test('en valencià l’avís és byte a byte el de la v1.2.18', () => {
    expect(desconegut.avisos.map((a) => a.codi)).toEqual(['format-desconegut']);
    expect(desconegut.avisos[0].text).toBe('Este full no té la forma d’un diari que l’app sàpia llegir: una graella amb la columna «HORA» i les franges, o la fulla «Diari» que exporta Salut.');
    expect(propostaImportacioTraduida(desconegut, 'ca')).toBe(desconegut);
  });

  test.each(ALTRES_LLENGUES)('idioma %s: l’avís nomena el full com l’anomena l’exportació', (idioma) => {
    const nomFull = modelFullSalutTraduit(model, {
      des: DIA, fins: DIA, dies: 1, completes: periode.completes, nomPersona: '', idioma
    }).fulles[1].nom;
    expect(nomFull).not.toBe('Diari');
    const text = propostaImportacioTraduida(desconegut, idioma).avisos[0].text;
    expect(text).toMatch(new RegExp(`[«“]${nomFull}[»”]`));
    expect(text).not.toMatch(/[«“]Diari[»”]/);
  });
});

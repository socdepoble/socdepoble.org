/** R32.14 · Catàleg de comportaments runtime observats (no una llista blanca).
 * Cada regla exigeix obligacions de codi actiu i l'empremta íntegra revisada.
 * La ruta només és procedència: ni ruta, nom de variable ni número de línia
 * per si sols acrediten cap cobertura. Un canvi de bytes revoca la revisió.
 *
 * No resol URL dinàmiques. La porta conserva TOTS els desconeguts i el seu
 * veredicte; estos comptadors separen «signatura catalogada» de «destí provat».
 * El cost és O(bytes): un SHA per font i un màxim fix de 37 regles (v1.2.23)/8 patrons,
 * tots indexOf literals. Sense regex, eval, xarxa, parser ni escriptures.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
const dades = JSON.parse(fs.readFileSync(new URL('./tellado-cataleg-r32_14.json', import.meta.url), 'utf8'));

export const CATALEG_TELLADO_R3214 = Object.freeze(dades.signatures.map(s => Object.freeze({ ...s, requisits: Object.freeze(s.requisits) })));
const perHash = new Map();
for (const s of CATALEG_TELLADO_R3214) {
  if (!perHash.has(s.sha256)) perHash.set(s.sha256, []);
  perHash.get(s.sha256).push(s);
}
const clau = d => `${d.tipus}|${d.regla}|${d.linia}`;

/** Patrons d'obligacions visibles en text sense comentaris; no un CFG.
 * L'empremta és obligatòria perquè una guarda traslladada darrere del sink
 * satisfaria presència lèxica però canviaria la semàntica del programa.
 */
export function compleixObligacionsTellado(textNet, signatura) {
  return typeof textNet === 'string' && textNet.includes(signatura.embornal)
    && signatura.requisits.every(literal => textNet.includes(literal));
}
export function preparaRevisioTellado(textCru, textNet) {
  const hash = createHash('sha256').update(textCru).digest('hex');
  const regles = new Map();
  for (const s of perHash.get(hash) || []) {
    if (compleixObligacionsTellado(textNet, s)) regles.set(clau(s), s);
  }
  return regles;
}
export function catalogaTellado(desconegut, revisio) {
  const s = revisio.get(clau(desconegut));
  return s ? { id: s.id, categoria: s.categoria, fitxer: desconegut.fitxer, linia: desconegut.linia,
    tipus: desconegut.tipus, regla: desconegut.regla, obligacions: s.requisits.length + 1,
    estat: 'catalogada-amb-limit', certificaDesti: false, limit: s.limit } : null;
}
export function resumCatalegTellado(revisions, totalDesconeguts, desconegutsTruncats = false) {
  return { esquema: dades.esquema, signatures: CATALEG_TELLADO_R3214.length,
    observades: totalDesconeguts, cobertes: revisions.length,
    pendents: totalDesconeguts - revisions.length,
    destinacionsEnTempsExecucio: totalDesconeguts,
    desconegutsTruncats, certificaZeroExfiltracio: false,
    significat: 'Coberta significa comportament revisat amb empremta i obligacions; no resol ni autoritza la destinació runtime. totalDesconeguts i veredicte originals es conserven.',
    revisions };
}

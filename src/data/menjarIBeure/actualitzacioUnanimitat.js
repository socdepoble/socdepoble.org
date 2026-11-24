/** Explicit offline update; no data import, network, clock or medical claim.
 * Validate the whole checkpoint before selection. A partial coverage snapshot
 * is different from truncated JSONL bytes, which invalidate the entire input.
 * The catalogue is supplied by the trusted offline caller, not by the study. */
import { CORPUS_UNANIMITAT, LIMITS_UNANIMITAT, AVIS_UNANIMITAT, ingereixResultatsUnanimitat, normalitzaCorpusUnanimitat } from './alergensPatrimoni.js';
export const FORMAT_ACTUALITZACIO_UNANIMITAT = 'socdepoble.alergens.parcial.v1';
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function indexCataleg(catalogue) {
  if (!Array.isArray(catalogue) || catalogue.length > LIMITS_UNANIMITAT.registres || Reflect.ownKeys(catalogue).length !== catalogue.length + 1) return null;
  const index = new Map();
  for (let i = 0; i < catalogue.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(catalogue, String(i));
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !plain(descriptor.value)) return null;
    const fields = Object.getOwnPropertyDescriptors(descriptor.value);
    if (Reflect.ownKeys(fields).length !== 2 || !fields.uid?.enumerable || !Object.hasOwn(fields.uid, 'value')
      || !fields.corpus?.enumerable || !Object.hasOwn(fields.corpus, 'value')) return null;
    const uid = fields.uid.value, corpus = normalitzaCorpusUnanimitat(fields.corpus.value);
    if (!corpus || typeof uid !== 'string' || uid.length > 220 || !/^[a-z0-9][a-z0-9:_-]*$/.test(uid) || index.has(uid)) return null;
    index.set(uid, corpus);
  }
  return CORPUS_UNANIMITAT.every(c => [...index.values()].includes(c)) ? index : null;
}
const canonical = value => Array.isArray(value) ? value.map(canonical) : plain(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const freeze = value => { if (value && typeof value === 'object') { for (const v of Object.values(value)) freeze(v); Object.freeze(value); } return value; };
export function creaActualitzacioUnanimitat(jsonl, catalogue) {
  const input = ingereixResultatsUnanimitat(jsonl);
  if (input.estat === 'malformat' || input.estat === 'absent') return freeze({ estat: input.estat, errors: input.errors });
  const catalog = indexCataleg(catalogue);
  if (!catalog) return freeze({ estat: 'malformat', errors: [{ linia: 0, codi: 'cataleg_invalid' }] });
  if (input.registres.some(r => catalog.get(r.uid) !== normalitzaCorpusUnanimitat(r.corpus))) return freeze({ estat: 'malformat', errors: [{ linia: 0, codi: 'identitat_cataleg' }] });
  const ordered = [...input.registres].sort((a, b) => a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);
  const ready = ordered.filter(r => r.estatConsens !== 'PRECAUCIO_MAXIMA_REVISIO_MESTRE');
  if (!ready.length) return freeze({ estat: 'pendent', errors: [] });
  const pending = ordered.filter(r => r.estatConsens === 'PRECAUCIO_MAXIMA_REVISIO_MESTRE');
  const identities = records => records.map(r => ({ corpus: normalitzaCorpusUnanimitat(r.corpus), uid: r.uid }));
  const corpus = Object.fromEntries(CORPUS_UNANIMITAT.map(c => {
    const total = [...catalog.values()].filter(v => v === c).length;
    const read = ordered.filter(r => normalitzaCorpusUnanimitat(r.corpus) === c).length;
    const consolidated = ready.filter(r => normalitzaCorpusUnanimitat(r.corpus) === c).length;
    return [c, { cataleg: total, llegits: read, consolidats: consolidated, pendents: read - consolidated,
      senseResultat: total - read, desconeguts: total - consolidated }];
  }));
  return freeze({ format: FORMAT_ACTUALITZACIO_UNANIMITAT, estat: 'parcial', abast: 'sis_corpus_esquema_c3', coberturaGlobal: 'parcial',
    certificacioExperta: false, acreditatPerAlConsum: false, corpus,
    consolidats: identities(ready), pendents: identities(pending),
    jsonl: ready.map(r => JSON.stringify(canonical(r))).join('\n') + '\n',
    avisos: [AVIS_UNANIMITAT, 'Només es projecten els registres consolidats del checkpoint validat. La resta conserva els 14 al·lèrgens desconeguts. No substituïx les matrius editorials existents.',
      'Els sis corpus són els de l’esquema C3 del checkpoint. Mercat/Botiga C4 queda fora d’este esquema i no rep cobertura per inferència.'] });
}

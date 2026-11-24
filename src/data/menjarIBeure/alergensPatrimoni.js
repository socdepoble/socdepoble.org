/** IDEA-336: offline adapter for the study's data, never its executable motor.
 * A checked eight-model agreement is structural evidence, not expert certification.
 * No absence among the 14 allergens establishes edibility or absence of other risks.
 */
import { ALERGENS, matriuAlergens } from './allergens.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../patrimoni/herbariLaTorre117.js';

export const ESCOLES_UNANIMITAT = Object.freeze(['iaia-maria:latest', 'qwen2.5-coder:14b', 'deepseek-r1:14b', 'phi4:14b', 'gemma3:12b', 'mistral-nemo:12b', 'glm4:9b', 'hermes3:8b']);
export const CORPUS_UNANIMITAT = Object.freeze(['quedinem', 'bar', 'nevera-ing', 'nevera-rec', 'llavors', 'herbari']);
export const LIMITS_UNANIMITAT = Object.freeze({ entrada: 8 * 1024 * 1024, linia: 65536, registres: 4096, nodes: 2048, profunditat: 12 });
export const AVIS_UNANIMITAT = 'Consens estructural de dades de 8 models; no és una certificació clínica ni de seguretat alimentària. Verifiqueu ingredients, etiquetatge, preparació i consell expert. L’absència dels 14 al·lèrgens no acredita comestibilitat.';
const ALIAS = Object.freeze({
  quedinem: 'quedinem', '1_receptes_que_dinem': 'quedinem',
  bar: 'bar', '2_bar_tpv': 'bar',
  'nevera-ing': 'nevera-ing', '3b_nevera_ingredients_base': 'nevera-ing',
  'nevera-rec': 'nevera-rec', '3_nevera_rebost_receptes': 'nevera-rec',
  llavors: 'llavors', '5_banc_llavors_i_verdures': 'llavors',
  herbari: 'herbari', '4_herbari_la_torre_117': 'herbari'
});
const PREFIXOS = Object.freeze({ quedinem: ['quedinem:'], bar: ['bar-producte:'], 'nevera-ing': ['nevera-ingredient:'], 'nevera-rec': ['nevera-recepta:'], llavors: ['llavor-cv:', 'llavor-avl:', 'llavor-atles:', 'olivera-gva:'], herbari: ['herbari:'] });
const UIDS_HERBARI = new Set(ESPECIES_HERBARI_LA_TORRE_117.map(s => `herbari:${s.slug}`));
const TOXIQUES_FONT = new Set(ESPECIES_HERBARI_LA_TORRE_117.filter(s => s.esToxica === true).map(s => `herbari:${s.slug}`));
const APTITUDS = ['aliment', 'aromatica_infusio', 'no_comestible', 'toxica'];
const CELLES = ['conte', 'traca', 'absent'];
const CONSENS = ['UNANIMITAT_8_DE_8_R1', 'UNANIMITAT_8_DE_8_R2', 'UNANIMITAT_8_DE_8_R3'];
const CLAUS = ['uid', 'corpus', 'nom', 'estatConsens', 'rondesUsades', 'discrepantsFinals', 'aptitud', 'matriuFinal', 'discrepanciesAmbCodiActual', 'justificacioSintesi', 'votsPerEscola', 'timestamp'];
const PERILLOSES = new Set(['__proto__', 'prototype', 'constructor']);
const propi = (o, k) => Object.hasOwn(o, k);
const objecte = o => o !== null && typeof o === 'object' && !Array.isArray(o) && [Object.prototype, null].includes(Object.getPrototypeOf(o));
const text = (v, max, min = 1) => typeof v === 'string' && v.length <= max && v.trim().length >= min && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
function dadesSegures(entrada, maximNodes = LIMITS_UNANIMITAT.nodes) {
  const cua = [[entrada, 0]];
  let nodes = 0;
  while (cua.length) {
    const [v, profunditat] = cua.pop();
    if (++nodes > maximNodes || profunditat > LIMITS_UNANIMITAT.profunditat) return false;
    if (v === null || ['string', 'boolean'].includes(typeof v) || typeof v === 'number' && Number.isFinite(v)) continue;
    if (typeof v !== 'object' || !Array.isArray(v) && !objecte(v)) return false;
    if (Array.isArray(v) && (v.length > LIMITS_UNANIMITAT.registres || Reflect.ownKeys(v).length !== v.length + 1)) return false;
    for (const k of Reflect.ownKeys(v)) {
      const d = Object.getOwnPropertyDescriptor(v, k);
      if (typeof k !== 'string' || PERILLOSES.has(k) || !d || !propi(d, 'value')) return false;
      if (Array.isArray(v) && k === 'length') continue;
      if (typeof d.value === 'string' && d.value.length > LIMITS_UNANIMITAT.linia) return false;
      cua.push([d.value, profunditat + 1]);
    }
  }
  return true;
}
function congela(v) {
  if (v !== null && typeof v === 'object') { for (const x of Object.values(v)) congela(x); Object.freeze(v); }
  return v;
}
export function normalitzaCorpusUnanimitat(corpus) {
  return typeof corpus === 'string' && propi(ALIAS, corpus) ? ALIAS[corpus] : null;
}
function identitatValida(uid, corpus) {
  const grup = normalitzaCorpusUnanimitat(corpus);
  if (!grup || !text(uid, 220) || !/^[a-z0-9][a-z0-9:_-]*$/.test(uid)) return false;
  if (grup === 'herbari' && !UIDS_HERBARI.has(uid)) return false;
  return PREFIXOS[grup].some(p => uid.startsWith(p) && uid.length > p.length && !uid.slice(p.length).includes(':'));
}
function matriuValida(m) {
  return objecte(m) && Object.keys(m).length === ALERGENS.length && ALERGENS.every(k => propi(m, k) && CELLES.includes(m[k]));
}
function clausValides(o, claus) { return Object.keys(o).every(k => claus.includes(k)); }
/** Errors are fixed codes: untrusted content is never echoed into diagnostics. */
export function validaRegistreUnanimitat(r) {
  const errors = [];
  if (!dadesSegures(r) || !objecte(r)) return { valid: false, errors: ['dades_no_planes_o_insegures'] };
  if (!clausValides(r, CLAUS)) errors.push('camps_desconeguts');
  if (!identitatValida(r.uid, r.corpus)) errors.push('identitat_corpus_uid');
  if (!APTITUDS.includes(r.aptitud)) errors.push('aptitud');
  if (!matriuValida(r.matriuFinal)) errors.push('matriu_14');
  if (!text(r.justificacioSintesi, 6000, 20)) errors.push('justificacio_sintesi');
  if (propi(r, 'nom') && !text(r.nom, 300)) errors.push('nom');
  if (propi(r, 'timestamp') && (!text(r.timestamp, 30) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.timestamp) || !Number.isFinite(Date.parse(r.timestamp)))) errors.push('timestamp');
  if (![1, 2, 3].includes(r.rondesUsades)) errors.push('rondes');
  if (!Array.isArray(r.discrepantsFinals) || r.discrepantsFinals.length > 15 || r.discrepantsFinals.some(v => ![...ALERGENS, 'aptitud', 'falten_escoles'].includes(v))) errors.push('discrepants');
  if (propi(r, 'discrepanciesAmbCodiActual') && (!Array.isArray(r.discrepanciesAmbCodiActual) || r.discrepanciesAmbCodiActual.length > 14 || r.discrepanciesAmbCodiActual.some(d => !objecte(d) || !clausValides(d, ['alergen', 'codiActual', 'dictamenNode0']) || !ALERGENS.includes(d.alergen) || !CELLES.includes(d.codiActual) || !CELLES.includes(d.dictamenNode0)))) errors.push('discrepancies_codi');
  const vots = r.votsPerEscola;
  if (!objecte(vots) || Object.keys(vots).some(id => !ESCOLES_UNANIMITAT.includes(id))) errors.push('escoles');
  else for (const v of Object.values(vots)) {
    if (!objecte(v) || !clausValides(v, ['aptitud', 'alergens', 'justificacio']) || !APTITUDS.includes(v.aptitud) || !matriuValida(v.alergens) || !text(v.justificacio, 6000, 20)) errors.push('vot_invalid');
  }
  const ronda = CONSENS.indexOf(r.estatConsens) + 1;
  if (!ronda && r.estatConsens !== 'PRECAUCIO_MAXIMA_REVISIO_MESTRE') errors.push('estat_consens');
  if (ronda) {
    if (r.rondesUsades !== ronda || !Array.isArray(r.discrepantsFinals) || r.discrepantsFinals.length) errors.push('consens_ronda_discrepants');
    if (!objecte(vots) || Object.keys(vots).length !== 8 || !ESCOLES_UNANIMITAT.every(id => propi(vots, id))) errors.push('consens_8_escoles');
    else if (Object.values(vots).some(v => !objecte(v) || v.aptitud !== r.aptitud || !matriuValida(v.alergens) || !matriuValida(r.matriuFinal) || ALERGENS.some(k => v.alergens[k] !== r.matriuFinal[k]))) errors.push('consens_vots_incoherents');
  }
  if (TOXIQUES_FONT.has(r.uid) && r.aptitud !== 'toxica') errors.push('conflicte_toxicitat_font');
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
/** Linear lexical scan before JSON.parse: duplicate/escaped keys and excessive
 * depth are rejected instead of silently accepting JSON.parse's last value. */
function inspeccionaJson(linia) {
  const pila = [];
  for (let i = 0; i < linia.length; i++) {
    const c = linia[i];
    if (c === '{' || c === '[') {
      pila.push(c === '{' ? new Set() : null);
      if (pila.length > LIMITS_UNANIMITAT.profunditat) return 'profunditat';
    } else if (c === '}' || c === ']') pila.pop();
    else if (c === '"') {
      const inici = i++;
      while (i < linia.length && linia[i] !== '"') { if (linia[i] === '\\') i++; i++; }
      if (i >= linia.length) return 'json_invalid';
      let j = i + 1;
      while (j < linia.length && ' \t\r\n'.includes(linia[j])) j++;
      if (linia[j] === ':' && pila.at(-1) instanceof Set) {
        let clau;
        try { clau = JSON.parse(linia.slice(inici, i + 1)); } catch { return 'json_invalid'; }
        if (pila.at(-1).has(clau)) return 'clau_json_duplicada';
        pila.at(-1).add(clau);
      }
    }
  }
  return null;
}
/** null means no checkpoint supplied; an empty checkpoint is pending. A malformed
 * checkpoint invalidates the complete input, including previously valid lines. */
export function ingereixResultatsUnanimitat(jsonl = null) {
  const resultat = (estat, registres = [], errors = []) => congela({ estat, registres, errors, avisos: estat === 'validat' ? [AVIS_UNANIMITAT] : ['Dades absents, pendents o no vàlides: els 14 al·lèrgens continuen desconeguts.', AVIS_UNANIMITAT] });
  if (jsonl === null) return resultat('absent');
  if (typeof jsonl !== 'string' || jsonl.length > LIMITS_UNANIMITAT.entrada) return resultat('malformat', [], [{ linia: 0, codi: 'entrada_tipus_o_limit' }]);
  const registres = [], errors = [], vistos = new Set();
  if (jsonl && !jsonl.endsWith('\n')) errors.push({ linia: jsonl.split('\n').length, codi: 'linia_final_parcial' });
  let inici = 0, numero = 0;
  while (inici < jsonl.length) {
    const fi = jsonl.indexOf('\n', inici), final = fi < 0 ? jsonl.length : fi;
    let linia = jsonl.slice(inici, final); inici = final + 1; numero++;
    if (linia.endsWith('\r')) linia = linia.slice(0, -1);
    if (!linia.trim()) continue;
    if (numero > LIMITS_UNANIMITAT.registres || linia.length > LIMITS_UNANIMITAT.linia) { errors.push({ linia: numero, codi: 'limit_linia_o_registres' }); break; }
    const lexical = inspeccionaJson(linia);
    if (lexical) { errors.push({ linia: numero, codi: lexical }); continue; }
    let r;
    try { r = JSON.parse(linia); } catch { errors.push({ linia: numero, codi: 'json_invalid' }); continue; }
    const validacio = validaRegistreUnanimitat(r);
    if (!validacio.valid) { for (const codi of validacio.errors) errors.push({ linia: numero, codi }); continue; }
    if (vistos.has(r.uid)) { errors.push({ linia: numero, codi: 'uid_duplicat' }); continue; }
    vistos.add(r.uid); registres.push(r);
  }
  if (errors.length) return resultat('malformat', [], errors);
  return resultat(registres.length && registres.every(r => CONSENS.includes(r.estatConsens)) ? 'validat' : 'pendent', registres);
}
/** Projection also accepts caller-supplied indexes, so repeat the parser's
 * all-or-nothing invariants. A valid first row cannot mask a bad later row,
 * duplicate identity, recorded error or contradictory envelope status. */
function indexCoherent(ingesta) {
  const claus = ['estat', 'registres', 'errors', 'avisos'];
  if (!dadesSegures(ingesta, 1000000) || !objecte(ingesta) || Object.keys(ingesta).length !== claus.length || !claus.every(k => propi(ingesta, k))) return false;
  if (!Array.isArray(ingesta.registres) || !Array.isArray(ingesta.errors) || !Array.isArray(ingesta.avisos) || ingesta.avisos.some(v => !text(v, 6000))) return false;
  const { estat, registres, errors } = ingesta;
  if (estat === 'absent') return registres.length === 0 && errors.length === 0;
  if (estat === 'malformat') return registres.length === 0 && errors.length > 0;
  if (!['validat', 'pendent'].includes(estat) || errors.length) return false;
  const vistos = new Set();
  let totsConsolidats = registres.length > 0;
  for (const r of registres) {
    if (!validaRegistreUnanimitat(r).valid || vistos.has(r.uid)) return false;
    vistos.add(r.uid);
    if (!CONSENS.includes(r.estatConsens)) totsConsolidats = false;
  }
  return estat === 'validat' ? totsConsolidats : !totsConsolidats;
}
/** Public UI contract: classification is descriptive; accreditation is always
 * false. Aromatic/infusion scope is distinct from ordinary food. Missing items,
 * unresolved votes and malformed checkpoints always project 14 unknown cells. */
export function projectaAlergensPatrimoni(identitat, ingesta = ingereixResultatsUnanimitat()) {
  const valida = dadesSegures(identitat) && objecte(identitat) && clausValides(identitat, ['uid', 'corpus']) && identitatValida(identitat.uid, identitat.corpus);
  const uid = valida ? identitat.uid : null;
  const corpus = valida ? normalitzaCorpusUnanimitat(identitat.corpus) : null;
  const fontToxica = TOXIQUES_FONT.has(uid);
  const indexSegur = indexCoherent(ingesta);
  const estatIngesta = indexSegur ? ingesta.estat : 'malformat';
  const r = valida && indexSegur && ['validat', 'pendent'].includes(ingesta.estat) && Array.isArray(ingesta.registres)
    ? ingesta.registres.find(v => objecte(v) && v.uid === uid && normalitzaCorpusUnanimitat(v.corpus) === corpus) : null;
  const consolidat = !!r && validaRegistreUnanimitat(r).valid && CONSENS.includes(r.estatConsens);
  const aptitud = consolidat ? r.aptitud : null;
  const ambitConsum = aptitud === 'aliment' ? 'alimentari_habitual' : aptitud === 'aromatica_infusio' ? 'aromatic_infusio_limitat' : aptitud === 'toxica' || aptitud === 'no_comestible' || fontToxica ? 'no_consum' : 'no_avaluat';
  const font = consolidat ? `Estudi 8 escoles (${r.estatConsens}), ${uid}. ${r.justificacioSintesi}` : null;
  const matriu = matriuAlergens(consolidat ? Object.fromEntries(ALERGENS.map(k => [k, { estat: { conte: 'ingredient', traca: 'traca', absent: 'absent' }[r.matriuFinal[k]], font }])) : {});
  return congela({ uid, corpus, estat: consolidat ? 'consolidat' : estatIngesta === 'malformat' || !valida ? 'invalid' : 'pendent', aptitud, ambitConsum, classificatComAliment: aptitud === 'aliment' && !fontToxica, acreditatPerAlConsum: false, certificacioExperta: false, identitatCatalegVerificada: corpus === 'herbari' && UIDS_HERBARI.has(uid), coberturaEstudi: 'no_acreditada', toxicitatAdvertidaFont: fontToxica, matriu, justificacioSintesi: consolidat ? r.justificacioSintesi : null, avisos: [!consolidat ? 'Estudi absent, pendent de consens o no vàlid: no pressuposeu absència d’al·lèrgens ni aptitud de consum.' : aptitud === 'aromatica_infusio' ? 'Classificació limitada a ús aromàtic o infusió; cal revisió experta de l’espècie, la part i la preparació.' : aptitud === 'toxica' || aptitud === 'no_comestible' ? 'No ingeriu esta espècie o producte.' : 'Classificació descriptiva d’aliment, pendent de verificació experta per al consum.', ...(fontToxica ? ['La font canònica advertix toxicitat: no ingeriu cap part.'] : []), AVIS_UNANIMITAT] });
}

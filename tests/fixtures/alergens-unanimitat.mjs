/** Synthetic values; keys and producer envelope follow the immutable motor snapshot.
 * This is a schema fixture, never a real result or food-safety declaration. */
export const ALERGENS_FIXTURE = ['gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja', 'llet', 'fruits-closca', 'api', 'mostassa', 'sesam', 'sulfits', 'tramussos', 'molluscs'];
export const ESCOLES_FIXTURE = ['iaia-maria:latest', 'qwen2.5-coder:14b', 'deepseek-r1:14b', 'phi4:14b', 'gemma3:12b', 'mistral-nemo:12b', 'glm4:9b', 'hermes3:8b'];
export const CORPUS_FIXTURE = [
  ['quedinem', '1_receptes_que_dinem', 'quedinem:allioli'],
  ['bar', '2_bar_tpv', 'bar-producte:patates-picants'],
  ['nevera-ing', '3b_nevera_ingredients_base', 'nevera-ingredient:ou'],
  ['nevera-rec', '3_nevera_rebost_receptes', 'nevera-recepta:truita'],
  ['llavors', '5_banc_llavors_i_verdures', 'llavor-cv:tomaca'],
  ['herbari', '4_herbari_la_torre_117', 'herbari:alfabega']
];
export function registreFixture(canvis = {}) {
  const aptitud = canvis.aptitud ?? 'aliment';
  const matriuFinal = canvis.matriuFinal ?? Object.fromEntries(ALERGENS_FIXTURE.map(id => [id, id === 'ous' ? 'conte' : id === 'sesam' ? 'traca' : 'absent']));
  const justificacio = 'Fixture sintètica del contracte: cal revisió de la composició real i de la preparació.';
  return {
    uid: 'herbari:alfabega', corpus: '4_herbari_la_torre_117', nom: 'Alfàbega (fixture)',
    estatConsens: 'UNANIMITAT_8_DE_8_R1', rondesUsades: 1, discrepantsFinals: [],
    aptitud, matriuFinal, discrepanciesAmbCodiActual: [], justificacioSintesi: justificacio,
    votsPerEscola: Object.fromEntries(ESCOLES_FIXTURE.map(id => [id, { aptitud, alergens: { ...matriuFinal }, justificacio }])),
    timestamp: '2026-11-23T16:31:13.557Z', ...canvis
  };
}
export const jsonlFixture = (...records) => records.map(r => JSON.stringify(r)).join('\n') + '\n';

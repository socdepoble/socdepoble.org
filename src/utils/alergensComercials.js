/** Projecció comercial pura: sense fitxa d’envàs no s’acredita cap declaració. */
import { matriuDeProducte } from './alergens.js';

export const AVIS_ALERGENS_COMERCIALS = 'Sense fitxa d’envàs acreditada: els 14 al·lèrgens són desconeguts. Desconegut no acredita absència, absència de traces ni aptitud per al consum. Cal comprovar l’etiqueta del producte i el lot amb el fabricant o proveïdor.';

const DECLARACIO_PENDENT = Object.freeze({
  alergens: Object.freeze([]),
  tracesAlergens: Object.freeze([]),
  alergensAbsents: Object.freeze([]),
  fontAlergens: null,
  estatEvidenciaAlergens: 'sense_fitxa_envas_acreditada',
  abastAlergens: 'cap declaració de composició, absència o traces acreditada per a la referència i el lot comercials',
  avisAlergens: AVIS_ALERGENS_COMERCIALS,
  acreditatPerAlConsum: false
});

const FONT_BOTIGA = Object.freeze({
  canal: 'botiga',
  fitxer: null,
  colleccio: null,
  tall: null,
  origenVerificat: false,
  abast: 'fila comercial rebuda sense verificar contra el catàleg; sense composició ni etiqueta d’envàs acreditada'
});
const FONT_MERCAT = Object.freeze({
  canal: 'mercat',
  fitxer: null,
  colleccio: null,
  tall: null,
  origenVerificat: false,
  abast: 'identitat declarada del payload rebut; origen, vigència, composició i etiqueta d’envàs sense acreditar'
});
const ID = /^[a-z0-9][a-z0-9_-]{0,159}$/;
const INVISIBLES = /[\u{0}-\u{1f}\u{7f}-\u{9f}\u{ad}\u{200b}-\u{200f}\u{2028}-\u{202e}\u{2060}-\u{2069}\u{feff}]/u;

/* DTO de dades pròpies, sense coerció d'objectes ni execució de getters.
 * Els proxies revocats o amb traps que llancen també fallen cap a null.
 * No s'itera, copia ni inspecciona cap camp de declaració del payload. */
function descriptorsPlans(valor, array = false) {
  try {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor) !== array) return null;
    if (array ? Object.getPrototypeOf(valor) !== Array.prototype : ![Object.prototype, null].includes(Object.getPrototypeOf(valor))) return null;
    return Object.getOwnPropertyDescriptors(valor);
  } catch {
    return null;
  }
}
const dada = (descriptors, camp) => {
  const descriptor = descriptors && Object.hasOwn(descriptors, camp) ? descriptors[camp] : null;
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
};
const text = (valor, maxim = 512) => typeof valor === 'string' && valor.trim() !== '' && valor.length <= maxim && !INVISIBLES.test(valor);
const esId = (valor) => typeof valor === 'string' && ID.test(valor);

/** Forma de fila compacta de huit camps; el cridador no n'acredita l'origen. */
export function producteBotigaAmbAlergens(fila) {
  const d = descriptorsPlans(fila, true);
  if (dada(d, 'length') !== 8) return null;
  const camps = Array.from({ length: 8 }, (_, index) => dada(d, index));
  const [id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims] = camps;
  if (!esId(id) || !text(nom) || !esId(categoriaId)
      || typeof marca !== 'string' || marca.length > 512 || INVISIBLES.test(marca)
      || !text(envas) || typeof quantitat !== 'number' || !Number.isFinite(quantitat) || quantitat <= 0
      || !['g', 'kg', 'ml', 'l', 'u'].includes(unitat) || !Number.isSafeInteger(preuCentims) || preuCentims <= 0) return null;
  return Object.freeze({
    id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims,
    ...DECLARACIO_PENDENT,
    procedenciaAlergens: FONT_BOTIGA
  });
}

/**
 * DTO real del Mercat (id, title, type, category_slug), després del seu
 * mapejador habitual. La categoria és descriptiva: no certifica que siga
 * aliment ni que puga consumir-se. Tampoc es propaga prosa o dades de contacte.
 */
export function alimentMercat(producte) {
  const d = descriptorsPlans(producte);
  const id = dada(d, 'id'), nom = dada(d, 'title'), tipus = dada(d, 'type');
  if (!esId(id) || !text(nom) || !['product', 'market'].includes(tipus)) return null;
  const categoria = dada(d, 'category_slug');
  return Object.freeze({
    id, nom,
    categoriaId: esId(categoria) ? categoria : null,
    ...DECLARACIO_PENDENT,
    procedenciaAlergens: FONT_MERCAT
  });
}

/** Cap entrada invàlida es convertix en absent, ni aporta una font inventada. */
function matriuImmutable(producte) {
  return Object.freeze(Object.fromEntries(Object.entries(matriuDeProducte(producte))
    .map(([id, cell]) => [id, Object.freeze(cell)])));
}
export function matriuProducteBotiga(fila) {
  return matriuImmutable(producteBotigaAmbAlergens(fila));
}
export function matriuAlimentMercat(producte) {
  return matriuImmutable(alimentMercat(producte));
}

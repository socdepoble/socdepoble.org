/**
 * llicencies.js — Catàleg didàctic dels drets d'autor.
 *
 * T39 (ordre del Mestre, 260928) · La vista de drets (CopyrightPage) explica
 * cada llicència amb paraules de poble: què permet, què demana i un exemple.
 * Este mòdul és PUR (sense React ni emmagatzematge): el valor que es desa és
 * sempre el mateix text d'abans («CC BY 4.0», «© Nom», «text · CC0 1.0»).
 *
 * Límit: la columna `copyright` té un CHECK de 256 caràcters (notes, profiles
 * i organizations). El text lliure en porta com a màxim 246 perquè la marca
 * « · CC0 1.0» (10) hi càpiga: 246 + 10 = 256.
 */

export const MAXIM_COPYRIGHT = 256;
export const MARCA_CC0 = ' · CC0 1.0';
export const MAXIM_TEXT_LLIURE = MAXIM_COPYRIGHT - MARCA_CC0.length;
export const AUTOR_PER_DEFECTE = 'Sóc de Poble';

/* Permisos: sempre amb text (l'estat no es diu només amb el color). `exit`
   per al que queda permés; `neutre` per a les condicions i els límits. */
const PERMIS = Object.freeze({
  demanar: Object.freeze({ text: 'Cal demanar-te permís', to: 'neutre' }),
  citar: Object.freeze({ text: 'Cal citar-te', to: 'neutre' }),
  senseCitar: Object.freeze({ text: 'Sense citar', to: 'exit' }),
  adaptar: Object.freeze({ text: 'Es pot adaptar', to: 'exit' }),
  adaptarIgual: Object.freeze({ text: 'Es pot adaptar, compartint igual', to: 'exit' }),
  senseAdaptar: Object.freeze({ text: 'No es pot adaptar', to: 'neutre' }),
  comercial: Object.freeze({ text: 'Ús comercial', to: 'exit' }),
  senseComercial: Object.freeze({ text: 'Sense ús comercial', to: 'neutre' }),
});

const llicencia = (dades) => Object.freeze({ ...dades, permisos: Object.freeze(dades.permisos) });

/**
 * Les opcions, en l'ordre de la pàgina: de la més tancada a la més oberta.
 * `codi` és el valor que es desa (null quan depén de l'autor o del text).
 * `icona` és una clau: el component tria la icona (el catàleg no sap de React).
 */
export const LLICENCIES = Object.freeze([
  llicencia({
    id: 'reservats', codi: null, nom: 'Tots els drets reservats', icona: 'reservats',
    explicacio: 'Ningú pot copiar, canviar ni vendre la teua obra sense demanar-te permís.',
    exemple: 'Les fotos de la teua casa rural, que només vols a la teua fitxa.',
    permisos: [PERMIS.demanar],
  }),
  llicencia({
    id: 'cc-by-nc-nd', codi: 'CC BY-NC-ND 4.0', nom: 'Reconeixement, no comercial i sense obres derivades', icona: 'cc',
    explicacio: 'La més tancada de les Creative Commons: només es pot compartir sencera, citant-te i sense ús comercial.',
    exemple: 'Un conte teu per a l’escola del poble: el poden llegir i repartir, no retallar ni vendre.',
    permisos: [PERMIS.citar, PERMIS.senseAdaptar, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nc-sa', codi: 'CC BY-NC-SA 4.0', nom: 'Reconeixement, no comercial i compartir igual', icona: 'cc',
    explicacio: 'Es pot adaptar citant-te i sense ús comercial, i qui l’adapte l’ha de compartir amb esta mateixa llicència.',
    exemple: 'Els apunts del curs de poda: l’escola d’adults els millora i els torna a compartir.',
    permisos: [PERMIS.citar, PERMIS.adaptarIgual, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nc', codi: 'CC BY-NC 4.0', nom: 'Reconeixement i no comercial', icona: 'cc',
    explicacio: 'Es pot copiar i adaptar citant-te, però ningú en pot fer un ús comercial sense el teu permís.',
    exemple: 'Les fotos de la romeria: l’associació de veïns les usa; una agència de viatges, no.',
    permisos: [PERMIS.citar, PERMIS.adaptar, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nd', codi: 'CC BY-ND 4.0', nom: 'Reconeixement i sense obres derivades', icona: 'cc',
    explicacio: 'Es pot copiar i difondre, també per a guanyar diners, citant-te, però sempre sencera i sense canvis.',
    exemple: 'El pregó de festes: que córrega de mà en mà tal com el vas escriure.',
    permisos: [PERMIS.citar, PERMIS.senseAdaptar, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc-by-sa', codi: 'CC BY-SA 4.0', nom: 'Reconeixement i compartir igual', icona: 'cc',
    explicacio: 'Es pot copiar, adaptar i usar per a qualsevol cosa citant-te, i qui la millore ha de compartir el resultat amb esta mateixa llicència. És la de la Viquipèdia.',
    exemple: 'La recepta de la coca de tomaca: qui l’enriquisca la torna al poble igual d’oberta.',
    permisos: [PERMIS.citar, PERMIS.adaptarIgual, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc-by', codi: 'CC BY 4.0', nom: 'Reconeixement', icona: 'cc',
    explicacio: 'Qualsevol la pot copiar, adaptar i usar, també per a guanyar diners, sempre que diga que és teua.',
    exemple: 'La història de la font vella: l’ajuntament la posa en un plafó i cita el teu nom.',
    permisos: [PERMIS.citar, PERMIS.adaptar, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc0', codi: 'CC0 1.0', nom: 'Domini públic', icona: 'domini',
    explicacio: 'Renuncies als teus drets en la mesura que la llei ho permet: qualsevol la pot usar per a qualsevol cosa, sense citar-te.',
    exemple: 'El calendari de reg de la séquia: com més circule, millor.',
    permisos: [PERMIS.senseCitar, PERMIS.adaptar, PERMIS.comercial],
  }),
  llicencia({
    id: 'lliure', codi: null, nom: 'Text lliure personalitzat (CC0)', icona: 'lliure',
    explicacio: 'Escrius l’autoria amb les teues paraules i l’obra queda en domini públic (CC0).',
    exemple: `Fotos de la Iaia Pepa, del Mas de Dalt${MARCA_CC0}`,
    permisos: [PERMIS.senseCitar, PERMIS.adaptar, PERMIS.comercial],
  }),
]);

/** L'opció «actual»: només quan el valor desat no és cap de les de dalt. */
export const OPCIO_ACTUAL = Object.freeze({
  id: 'actual', codi: null, nom: 'Mantindre els drets actuals', icona: 'actual',
  explicacio: 'Es queda tal com està ara.', exemple: null, permisos: Object.freeze([]),
});

const PER_CODI = new Map(LLICENCIES.filter((l) => l.codi).map((l) => [l.codi, l.id]));
const PER_ID = new Map([...LLICENCIES, OPCIO_ACTUAL].map((l) => [l.id, l]));

/** La fitxa d'una opció del catàleg (o null). */
export const llicenciaDe = (id) => PER_ID.get(id) || null;

/** «Tots els drets reservats» es desa com «© Nom» (com el valor de sèrie de la fitxa). */
export function reservatsDe(autor) {
  const nom = String(autor ?? '').trim() || AUTOR_PER_DEFECTE;
  return `© ${nom}`.slice(0, MAXIM_COPYRIGHT);
}

/** CC0 i el text lliure demanen l'acceptació irrevocable abans de desar. */
export const requereixCC0 = (id) => id === 'cc0' || id === 'lliure';

/**
 * Quina opció correspon a un valor desat, i el text lliure si n'hi ha.
 *   · un codi CC exacte → eixa llicència;
 *   · un valor acabat en « · CC0 1.0» → «lliure», amb el text sense la marca;
 *   · «© autor» (o cap valor) → «reservats»;
 *   · qualsevol altra cosa → «actual» (es pot conservar intacte).
 */
export function triaDe(valor, autor) {
  const text = String(valor ?? '');
  if (PER_CODI.has(text)) return { id: PER_CODI.get(text), text: '' };
  if (text.endsWith(MARCA_CC0)) return { id: 'lliure', text: text.slice(0, -MARCA_CC0.length) };
  if (!text.trim() || text === reservatsDe(autor)) return { id: 'reservats', text: '' };
  return { id: 'actual', text: '' };
}

/** El valor que es desa per a una opció. El text lliure es talla a 246. */
export function valorDe(id, { text = '', autor = '', actual = '' } = {}) {
  if (id === 'reservats') return reservatsDe(autor);
  if (id === 'lliure') return `${String(text).slice(0, MAXIM_TEXT_LLIURE)}${MARCA_CC0}`;
  if (id === 'actual') return String(actual ?? '');
  return llicenciaDe(id)?.codi ?? String(actual ?? '');
}

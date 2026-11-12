/**
 * Catàleg didàctic i serialització de l'autoria de les obres.
 * Cada atribució admet 256 punts de codi; la marca es desa a banda del recompte.
 */
import {
  CODIS_CC, MARCA_CC0, MAXIM_AUTORIA, PREFIX_COPYRIGHT, PREFIX_RESERVATS_LITERAL,
  SEPARADOR_AUTORIA_LITERAL, desglossaDrets, llargariaDe, sanejaAutoria,
} from '../../../data/dretsAutor.js';

export { MARCA_CC0, MAXIM_AUTORIA, llargariaDe };
export const AUTOR_PER_DEFECTE = 'Sóc de Poble';
export const LLICENCIA_PER_DEFECTE = CODIS_CC['cc-by-nc-sa'];

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
 * Les opcions, en l'ordre de la pàgina (D15): la de sèrie primer; després la
 * resta de Creative Commons (de la més tancada a la més oberta), el domini
 * públic i el text lliure CC0; «Copyright (C)» l'última.
 * `codi` és el valor que es desa (null quan depén de l'autor o del text).
 * `icona` és una clau: el component tria la icona (el catàleg no sap de React).
 */
export const LLICENCIES = Object.freeze([
  llicencia({
    id: 'cc-by-nc-sa', codi: CODIS_CC['cc-by-nc-sa'], nom: 'Reconeixement, no comercial i compartir igual', icona: 'cc',
    explicacio: 'Es pot adaptar citant-te i sense ús comercial, i qui l’adapte l’ha de compartir amb esta mateixa llicència. És la que porten les notes noves quan no hereten uns altres drets del teu Perfil.',
    exemple: 'Els apunts del curs de poda: l’escola d’adults els millora i els torna a compartir.',
    permisos: [PERMIS.citar, PERMIS.adaptarIgual, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nc-nd', codi: CODIS_CC['cc-by-nc-nd'], nom: 'Reconeixement, no comercial i sense obres derivades', icona: 'cc',
    explicacio: 'La més tancada de les Creative Commons: només es pot compartir sencera, citant-te i sense ús comercial.',
    exemple: 'Un conte teu per a l’escola del poble: el poden llegir i repartir, no retallar ni vendre.',
    permisos: [PERMIS.citar, PERMIS.senseAdaptar, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nc', codi: CODIS_CC['cc-by-nc'], nom: 'Reconeixement i no comercial', icona: 'cc',
    explicacio: 'Es pot copiar i adaptar citant-te, però ningú en pot fer un ús comercial sense el teu permís.',
    exemple: 'Les fotos de la romeria: l’associació de veïns les usa; una agència de viatges, no.',
    permisos: [PERMIS.citar, PERMIS.adaptar, PERMIS.senseComercial],
  }),
  llicencia({
    id: 'cc-by-nd', codi: CODIS_CC['cc-by-nd'], nom: 'Reconeixement i sense obres derivades', icona: 'cc',
    explicacio: 'Es pot copiar i difondre, també per a guanyar diners, citant-te, però sempre sencera i sense canvis.',
    exemple: 'El pregó de festes: que córrega de mà en mà tal com el vas escriure.',
    permisos: [PERMIS.citar, PERMIS.senseAdaptar, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc-by-sa', codi: CODIS_CC['cc-by-sa'], nom: 'Reconeixement i compartir igual', icona: 'cc',
    explicacio: 'Es pot copiar, adaptar i usar per a qualsevol cosa citant-te, i qui la millore ha de compartir el resultat amb esta mateixa llicència. És la de la Viquipèdia.',
    exemple: 'La recepta de la coca de tomaca: qui l’enriquisca la torna al poble igual d’oberta.',
    permisos: [PERMIS.citar, PERMIS.adaptarIgual, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc-by', codi: CODIS_CC['cc-by'], nom: 'Reconeixement', icona: 'cc',
    explicacio: 'Qualsevol la pot copiar, adaptar i usar, també per a guanyar diners, sempre que diga que és teua.',
    exemple: 'La història de la font vella: l’ajuntament la posa en un plafó i cita el teu nom.',
    permisos: [PERMIS.citar, PERMIS.adaptar, PERMIS.comercial],
  }),
  llicencia({
    id: 'cc0', codi: CODIS_CC.cc0, nom: 'Domini públic', icona: 'domini',
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
  llicencia({
    id: 'reservats', codi: null, nom: 'Copyright (C)', icona: 'reservats',
    explicacio: 'Tots els drets reservats: ningú pot copiar, canviar ni vendre la teua obra sense demanar-te permís. Escrius qui en té els drets amb les teues paraules, darrere de «©».',
    exemple: 'Les fotos de la teua casa rural, que només vols a la teua fitxa.',
    permisos: [PERMIS.demanar],
  }),
]);

/** L'opció «actual»: només quan el valor desat no és cap de les de dalt. */
export const OPCIO_ACTUAL = Object.freeze({
  id: 'actual', codi: null, nom: 'Mantindre els drets actuals', icona: 'actual',
  explicacio: 'Es queda tal com està ara.', exemple: null, permisos: Object.freeze([]),
});

const PER_ID = new Map([...LLICENCIES, OPCIO_ACTUAL].map((l) => [l.id, l]));

export const llicenciaDe = (id) => PER_ID.get(id) || null;
export const requereixCC0 = (id) => id === 'cc0' || id === 'lliure';

/** En drets reservats, la marca «©» no forma part del nom. */
export function autoriaDeText(id, valor) {
  const text = sanejaAutoria(valor);
  if (id !== 'reservats' || !text.startsWith('©')) return text;
  if (text.startsWith(PREFIX_RESERVATS_LITERAL)) return text.slice(PREFIX_RESERVATS_LITERAL.length);
  // Com el ltrim() del CHECK de 2611110010: només l'espai ASCII, mai l'NBSP ni l'U+3000.
  return text.slice(1).replace(/^ +/u, '');
}

export function reservatsDe(autor) {
  return valorDe('reservats', { text: sanejaAutoria(autor) || AUTOR_PER_DEFECTE });
}

export function triaDe(valor) {
  const text = sanejaAutoria(valor);
  if (!text) return { id: 'cc-by-nc-sa', text: '' };
  const { id, autoria } = desglossaDrets(text);
  return { id, text: id === 'actual' ? '' : id === 'reservats' ? text : autoria };
}

/** Torna '' quan l'autoria és invàlida. L'editor conserva el text perquè es puga corregir. */
export function valorDe(id, { text, autor, actual = '' } = {}) {
  if (id === 'actual') return typeof actual === 'string' ? actual : '';
  const nom = autoriaDeText(id, text ?? autor ?? (id === 'reservats' ? AUTOR_PER_DEFECTE : ''));
  if (llargariaDe(nom) > MAXIM_AUTORIA) return '';
  if (id === 'reservats') {
    if (!nom) return '';
    const escrit = sanejaAutoria(text);
    if (escrit.startsWith(PREFIX_RESERVATS_LITERAL)) return escrit;
    if (nom.endsWith(MARCA_CC0) || nom.startsWith('· ')) return `${PREFIX_RESERVATS_LITERAL}${nom}`;
    const marca = escrit.startsWith('©') && !escrit.startsWith(PREFIX_COPYRIGHT) ? '©' : PREFIX_COPYRIGHT;
    return `${marca}${nom}`;
  }
  if (id === 'lliure') {
    if (!nom) return '';
    const desat = `${nom}${MARCA_CC0}`;
    return desglossaDrets(desat).id === 'lliure' ? desat : `${CODIS_CC.cc0}${SEPARADOR_AUTORIA_LITERAL}${nom}`;
  }
  const codi = llicenciaDe(id)?.codi;
  if (!codi || !nom) return codi ?? '';
  const separador = nom.endsWith(MARCA_CC0) || nom.startsWith('· ') ? SEPARADOR_AUTORIA_LITERAL : ' ';
  return `${codi}${separador}${nom}`;
}

/**
 * formularisFinestreta.js — la Finestreta: quatre formularis declaratius i
 * l'omplidor que hi posa els valors CONFIRMATS de la Fitxa d'identitat.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H). L'app prepara el
 * tràmit; no el signa ni el presenta: l'eixida és la llista de camps per a
 * copiar un a un a la seu electrònica i un esborrany per a imprimir. Tots els
 * formularis són «a verificar contra el model vigent» de l'organisme.
 *
 * Tipatge estricte (regressió Xylella): el valor de cada camp es torna a
 * validar amb el tipus del camp del formulari, no amb el de la fitxa. Un NIF
 * en un camp de nom queda 'tipus-incompatible' i no s'hi posa mai. Només els
 * valors confirmats omplin; un de proposat queda 'sense-confirmar'. Els camps
 * bancaris (l'IBAN de la domiciliació) són sempre de la persona: mai ixen de
 * la fitxa, encara que un formulari els apunte.
 * JS pur: sense DOM, React, xarxa ni emmagatzematge.
 */
import { CAMPS_IDENTITAT, congela, esDataIso, provinciaDelCodiPostal, validaCamp, validaSegons, VALIDADORS } from './validadorsIdentitat.js';

export const VERIFICAR = 'A verificar contra el model vigent';
export const ESTATS_CAMP = Object.freeze(['llest', 'falta', 'sense-confirmar', 'tipus-incompatible']);
export const TRANSFORMACIONS = Object.freeze(['nom-complet', 'cognoms-nom', 'majuscules', 'provincia-del-cp', 'data-dmy']);

/* D'on pot vindre un valor: un titular del context, una representació, un tribut o el dia de hui. */
const ROL_DE_LORIGEN = Object.freeze({
  persona: 'persona', representant: 'persona', activitat: 'activitat', entitat: 'entitat', representacio: 'representacio', tribut: 'tribut'
});
const ORIGEN = /^(persona|representant|activitat|entitat|representacio|tribut|context):([A-Za-z0-9.]+)(\?)?$/;
const BANCARI = /iban|compte|cuenta|bancari|domiciliacio/i;

const camp = (id, etiqueta, origen, tipus, { obligatori = true, transformacio = null } = {}) => Object.freeze({
  id, etiqueta, origen: Array.isArray(origen) ? Object.freeze(origen) : origen, tipus, obligatori, transformacio
});
/* Un camp que escriu la persona: l'app no el pot omplir. */
const aMa = (id, etiqueta, obligatori = true) => camp(id, etiqueta, null, null, { obligatori });

const NOM_COMPLET = (rol) => [`${rol}:identificacio.nom`, `${rol}:identificacio.cognom1`, `${rol}:identificacio.cognom2?`];

/* L'interessat: identificació, domicili i contacte (Llei 39/2015, art. 66.1). */
const INTERESSAT = Object.freeze([
  camp('nif', 'NIF o NIE', 'persona:identificacio.nif', 'nif-persona'),
  camp('nom', 'Nom', 'persona:identificacio.nom', 'nom-propi'),
  camp('cognom1', 'Primer cognom', 'persona:identificacio.cognom1', 'nom-propi'),
  camp('cognom2', 'Segon cognom', 'persona:identificacio.cognom2', 'nom-propi', { obligatori: false }),
  camp('tipusVia', 'Tipus de via', 'persona:domicili.tipusVia', 'nom-lloc', { obligatori: false }),
  camp('via', 'Nom de la via', 'persona:domicili.via', 'via'),
  camp('numero', 'Número', 'persona:domicili.numero', 'numero-via'),
  camp('complement', 'Pis, porta o escala', 'persona:domicili.complement', 'complement', { obligatori: false }),
  camp('codiPostal', 'Codi postal', 'persona:domicili.codiPostal', 'codi-postal'),
  camp('municipi', 'Municipi', 'persona:domicili.municipi', 'nom-lloc'),
  camp('provincia', 'Província', 'persona:domicili.codiPostal', 'codi-postal', { transformacio: 'provincia-del-cp' }),
  camp('telefon', 'Telèfon', 'persona:contacte.telefon', 'telefon', { obligatori: false }),
  camp('correu', 'Correu electrònic', 'persona:contacte.correu', 'correu', { obligatori: false }),
  camp('mitjaNotificacio', 'Mitjà de notificació', 'persona:contacte.mitjaNotificacio', 'mitja-notificacio')
]);

/* El representant, si la persona actua per a algú altre (opcional). */
const REPRESENTANT = Object.freeze([
  camp('representantNif', 'NIF del representant', 'representant:identificacio.nif', 'nif-persona', { obligatori: false }),
  camp('representantNom', 'Nom i cognoms del representant', NOM_COMPLET('representant'), 'nom-propi', { obligatori: false, transformacio: 'nom-complet' })
]);

const LLOC_I_DATA = Object.freeze([
  camp('lloc', 'Lloc', 'persona:domicili.municipi', 'nom-lloc'),
  camp('data', 'Data', 'context:avui', 'data', { transformacio: 'data-dmy' })
]);

const formulari = (id, nom, organisme, font, camps) => Object.freeze({ id, nom, organisme, font: Object.freeze(font), verificar: VERIFICAR, camps: Object.freeze(camps) });

export const FORMULARIS = Object.freeze([
  formulari('gva-sollicitud-generica', 'Sol·licitud genèrica de la Generalitat Valenciana', 'GENERALITAT',
    { norma: 'Llei 39/2015, art. 66.1 (contingut de les sol·licituds)', consulta: 'Seu electrònica de la Generalitat: tràmit de sol·licitud genèrica' },
    [
      ...INTERESSAT, ...REPRESENTANT, ...LLOC_I_DATA,
      aMa('organ', 'Òrgan al qual es dirigix (codi DIR3)'), aMa('exposa', 'Exposa'), aMa('sollicita', 'Sol·licita'), aMa('signatura', 'Signatura')
    ]),
  formulari('ajuntament-instancia-general', 'Instància general de l’Ajuntament de la Torre de les Maçanes', 'AJUNTAMENT',
    { norma: 'Llei 39/2015, art. 66.1 (contingut de les sol·licituds)', consulta: 'Seu electrònica de l’Ajuntament: instància general (codi DIR3 a verificar)' },
    [
      ...INTERESSAT, ...REPRESENTANT,
      camp('referenciaCadastral', 'Referència cadastral de l’immoble', 'tribut:tribut.referenciaCadastral', 'referencia-cadastral', { obligatori: false }),
      ...LLOC_I_DATA,
      aMa('organ', 'Codi DIR3 de l’Ajuntament'), aMa('exposa', 'Exposa'), aMa('sollicita', 'Sol·licita'), aMa('signatura', 'Signatura')
    ]),
  formulari('suma-sollicitud', 'Sol·licitud a SUMA Gestió Tributària', 'SUMA',
    { norma: 'Ordenança general de gestió, inspecció i recaptació de SUMA', consulta: 'Seu electrònica de SUMA: sol·licitud genèrica, domiciliació o canvi de domicili fiscal' },
    [
      camp('nif', 'NIF o NIE', 'persona:identificacio.nif', 'nif-persona'),
      camp('cognomsNom', 'Cognoms i nom', NOM_COMPLET('persona'), 'nom-propi', { transformacio: 'cognoms-nom' }),
      camp('via', 'Domicili fiscal: via', 'persona:domicili.via', 'via'),
      camp('numero', 'Domicili fiscal: número', 'persona:domicili.numero', 'numero-via'),
      camp('complement', 'Domicili fiscal: pis, porta o escala', 'persona:domicili.complement', 'complement', { obligatori: false }),
      camp('codiPostal', 'Codi postal', 'persona:domicili.codiPostal', 'codi-postal'),
      camp('municipi', 'Municipi', 'persona:domicili.municipi', 'nom-lloc'),
      camp('provincia', 'Província', 'persona:domicili.codiPostal', 'codi-postal', { transformacio: 'provincia-del-cp' }),
      camp('concepte', 'Concepte', 'tribut:tribut.concepte', 'concepte-tribut'),
      camp('referenciaSuma', 'Referència de SUMA (número fix)', 'tribut:tribut.referenciaSuma', 'ref-suma'),
      camp('referenciaCadastral', 'Referència cadastral', 'tribut:tribut.referenciaCadastral', 'referencia-cadastral', { obligatori: false }),
      camp('adrecaObjecte', 'Adreça de l’objecte tributari', 'tribut:tribut.adreca', 'adreca', { obligatori: false }),
      camp('telefon', 'Telèfon', 'persona:contacte.telefon', 'telefon', { obligatori: false }),
      camp('correu', 'Correu electrònic', 'persona:contacte.correu', 'correu', { obligatori: false }),
      aMa('iban', 'IBAN per a la domiciliació (l’escrius tu)', false),
      camp('data', 'Data', 'context:avui', 'data', { transformacio: 'data-dmy' }),
      aMa('sollicita', 'Sol·licita'), aMa('signatura', 'Signatura')
    ]),
  formulari('representacio-entitat', 'Acreditació de la representació d’una entitat', 'ALTRE',
    { norma: 'Llei 39/2015, art. 5 (representació)', consulta: 'El model de representació de l’organisme on es presenta' },
    [
      camp('entitatNif', 'NIF de l’entitat', 'entitat:entitat.nif', 'nif-entitat'),
      camp('denominacio', 'Denominació', 'entitat:entitat.denominacio', 'denominacio'),
      camp('domiciliSocial', 'Domicili social', 'entitat:entitat.domiciliSocial', 'adreca'),
      camp('numeroInscripcio', 'Número d’inscripció al registre', 'entitat:registre.numeroInscripcio', 'numero-inscripcio'),
      camp('seccio', 'Secció del registre', 'entitat:registre.seccio', 'seccio', { obligatori: false }),
      camp('representantNif', 'NIF del representant', 'representant:identificacio.nif', 'nif-persona'),
      camp('representantNom', 'Nom i cognoms del representant', NOM_COMPLET('representant'), 'nom-propi', { transformacio: 'nom-complet' }),
      camp('carrec', 'Càrrec', 'representacio:representacio.carrec', 'carrec'),
      camp('vigentDes', 'Vigent des de', 'representacio:representacio.vigentDes', 'data', { transformacio: 'data-dmy' }),
      camp('vigentFins', 'Vigent fins a', 'representacio:representacio.vigentFins', 'data', { obligatori: false, transformacio: 'data-dmy' }),
      camp('data', 'Data', 'context:avui', 'data', { transformacio: 'data-dmy' }),
      aMa('signatura', 'Signatura')
    ])
]);

/* ---------- Validació d'un formulari ---------- */

const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

/** Els errors d'un formulari declaratiu (els quatre de dalt o un de nou), sense llançar. */
export function validaFormulari(form) {
  const errors = [];
  if (!esObjecte(form) || typeof form.id !== 'string' || !Array.isArray(form.camps) || form.camps.length === 0) return ['El formulari necessita un id i una llista de camps.'];
  const ids = new Set();
  for (const c of form.camps) {
    if (!esObjecte(c) || typeof c.id !== 'string' || c.id === '' || typeof c.etiqueta !== 'string') {
      errors.push('Cada camp porta id i etiqueta.');
      continue;
    }
    if (ids.has(c.id)) errors.push(`El camp ${c.id} es repetix.`);
    ids.add(c.id);
    if (c.origen === null) continue;
    const origens = Array.isArray(c.origen) ? c.origen : [c.origen];
    for (const origen of origens) {
      const r = typeof origen === 'string' ? ORIGEN.exec(origen) : null;
      if (!r) errors.push(`${c.id}: l’origen ${origen} no té la forma «rol:camp».`);
      else if (r[1] === 'context' ? r[2] !== 'avui' : CAMPS_IDENTITAT[r[2]]?.rol !== ROL_DE_LORIGEN[r[1]]) errors.push(`${c.id}: ${origen} no és cap camp de la fitxa.`);
    }
    if (!Object.prototype.hasOwnProperty.call(VALIDADORS, c.tipus)) errors.push(`${c.id}: el tipus ${c.tipus} no té validador.`);
    if (c.transformacio !== null && c.transformacio !== undefined && !TRANSFORMACIONS.includes(c.transformacio)) errors.push(`${c.id}: transformació desconeguda.`);
  }
  return errors;
}

/* ---------- L'omplidor ---------- */

const unic = (llista) => (llista.length === 1 ? llista[0] : null);

/* Qui és qui en este tràmit, a partir dels ids que tria la persona. */
function contextDe(fitxa, { titular, representacio, tribut, avui } = {}) {
  const titulars = Array.isArray(fitxa?.titulars) ? fitxa.titulars.filter(esObjecte) : [];
  const tributs = Array.isArray(fitxa?.tributs) ? fitxa.tributs.filter(esObjecte) : [];
  const representacions = Array.isArray(fitxa?.representacions) ? fitxa.representacions.filter(esObjecte) : [];
  const persona = titular ? titulars.find((t) => t.id === titular && t.ambit === 'LLAR') ?? null : unic(titulars.filter((t) => t.ambit === 'LLAR'));
  const rep = representacio ? representacions.find((r) => r.id === representacio) ?? null : null;
  return {
    persona,
    activitat: persona ? unic(titulars.filter((t) => t.ambit === 'ACTIVITAT' && t.persona === persona.id)) : null,
    representacio: rep,
    representant: rep ? titulars.find((t) => t.id === rep.representant && t.ambit === 'LLAR') ?? null : null,
    entitat: rep ? titulars.find((t) => t.id === rep.representat && t.ambit === 'ENTITAT') ?? null : null,
    tribut: tribut ? tributs.find((t) => t.id === tribut) ?? null : persona ? unic(tributs.filter((t) => t.titular === persona.id)) : null,
    avui: esDataIso(avui) ? avui : null
  };
}

/* Un component de l'origen: el Valor de la fitxa (o el dia de hui), i si pot faltar. */
function component(ctx, origen) {
  const [, rol, nomCamp, opcional] = ORIGEN.exec(origen);
  if (rol === 'context') return { opcional: Boolean(opcional), nomCamp: null, valor: ctx.avui ? { valor: ctx.avui, estat: 'confirmat', fonts: [] } : null };
  const valor = ctx[rol]?.camps?.[nomCamp];
  return { opcional: Boolean(opcional), nomCamp, valor: esObjecte(valor) ? valor : null };
}

const dataDmy = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/* El valor final a partir dels components ja validats (null els absents). */
function transforma(transformacio, valors) {
  const [primer] = valors;
  switch (transformacio) {
    case 'nom-complet': return valors.filter(Boolean).join(' ');
    case 'cognoms-nom': return `${valors.slice(1).filter(Boolean).join(' ')}, ${primer}`.toUpperCase();
    case 'majuscules': return String(primer).toUpperCase();
    case 'provincia-del-cp': return provinciaDelCodiPostal(primer);
    case 'data-dmy': return esDataIso(primer) ? dataDmy(primer) : null;
    default: return primer;
  }
}

function fonts(components) {
  const totes = [];
  for (const { valor } of components) {
    for (const font of valor?.fonts ?? []) {
      if (!totes.some((f) => JSON.stringify(f) === JSON.stringify(font))) totes.push(font);
    }
  }
  return totes;
}

function omplixCamp(c, ctx) {
  const base = { id: c.id, etiqueta: c.etiqueta, obligatori: Boolean(c.obligatori) };
  const resposta = (estat, valor = null, font = null) => ({ ...base, valor, estat, font, perLaPersona: false });
  /* Els camps bancaris són sempre de la persona, ho diga o no el formulari. */
  if (c.origen === null || BANCARI.test(c.id) || BANCARI.test(String(c.tipus))) return { ...base, valor: null, estat: 'falta', font: null, perLaPersona: true };
  const components = (Array.isArray(c.origen) ? c.origen : [c.origen]).map((origen) => component(ctx, origen));
  if (components.some((x) => !x.opcional && !x.valor)) return resposta('falta');
  const presents = components.filter((x) => x.valor);
  if (presents.some((x) => x.valor.estat !== 'confirmat')) return resposta('sense-confirmar');
  /* Tipatge estricte: el tipus del camp del formulari i el del catàleg de la fitxa. */
  const valors = [];
  for (const x of components) {
    if (!x.valor) {
      valors.push(null);
      continue;
    }
    const delFormulari = validaSegons(c.tipus, x.valor.valor);
    const delCataleg = x.nomCamp ? validaCamp(x.nomCamp, x.valor.valor) : delFormulari;
    if (!delFormulari.valid || !delCataleg.valid) return resposta('tipus-incompatible');
    valors.push(delFormulari.normalitzat);
  }
  const valor = transforma(c.transformacio, valors);
  return valor === null || valor === '' ? resposta('tipus-incompatible') : resposta('llest', valor, fonts(presents));
}

/**
 * Omplix un formulari amb els valors confirmats de la fitxa.
 * @param {object} form un de FORMULARIS (o un de nou que passe validaFormulari)
 * @param {object} fitxa la Fitxa d'identitat
 * @param {{ titular?: string, representacio?: string, tribut?: string, avui?: string }} [opcions]
 *   titular: la persona (LLAR) que fa el tràmit (si n'hi ha una sola, no cal);
 *   representacio: la representació (entitat i representant) per al formulari
 *   d'entitat o per a actuar per a algú; tribut: l'objecte tributari (si la
 *   persona en té un sol, no cal); avui: «aaaa-mm-dd».
 * @returns {Readonly<{ formulari: string, verificar: string, camps: object[], llest: boolean, falten: number, aMa: number }>}
 *   Cada camp: { id, etiqueta, obligatori, valor, estat, font, perLaPersona };
 *   `font` és la llista de fonts dels valors que l'han omplit. `falten` compta
 *   els obligatoris que l'app hauria d'omplir i no estan llestos; `aMa`, els
 *   que escriu sempre la persona.
 */
export function omplixFormulari(form, fitxa, opcions = {}) {
  const errors = validaFormulari(form);
  if (errors.length) throw new TypeError(`El formulari no és vàlid: ${errors.join(' ')}`);
  const ctx = contextDe(fitxa, opcions);
  const camps = form.camps.map((c) => omplixCamp(c, ctx));
  const falten = camps.filter((c) => c.obligatori && !c.perLaPersona && c.estat !== 'llest').length;
  return congela({
    formulari: form.id,
    verificar: VERIFICAR,
    camps,
    llest: falten === 0,
    falten,
    aMa: camps.filter((c) => c.perLaPersona).length
  });
}

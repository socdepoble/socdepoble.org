/**
 * clauDelPoble.js · Onada 6 (pla 261009_0245, ítems 2, 5 i 11) · De quin
 * poble és una publicació, i quan va nàixer un poble. La part lleugera de
 * publicacionsDelPoble.js (que la reexporta i hi afig l'ordre del Mur): la
 * llig també la meta de Pobles (detailSectionMeta.jsx), que no ha
 * d'arrossegar la façana de Pedra Seca (Esmena 3 del pla 261007_1645), i per
 * això ací no s'importa res de les targetes.
 *
 *   · pobleDeLaPublicacio: des de quin poble s'ha publicat una targeta (la
 *     clau, un slug). Mana `poble_id`, que escriuen les publicacions noves
 *     (NotesContext · publishNote); sense, el text del lloc que ja porten
 *     (author_location, town_name, population o location) fet slug amb la
 *     regla única de nomsDelPoble.js.
 *   · clausDelPoble / esDelPoble / itemsDelPoble: les claus d'una fitxa de
 *     /pobles (id, slug i nom fet slug) i les publicacions del Mur, de
 *     l'Agenda i del Mercat que hi casen. esDelPoble és el predicat de la
 *     decisió 1 per a una publicació sola: el fan servir les proves i qui
 *     haja de casar-ne una fora d'una llista (el front Xat, un filtre al
 *     servidor); itemsDelPoble fa el mateix sobre les fonts del Mur.
 *   · poblesAmbNaixement: la data de cada poble és la més antiga entre la de
 *     la fitxa (created_at) i la de la primera publicació que el DECLARA
 *     (requisit 15 de l'Onada 5: «En crear un poble per primera vegada, s'hi
 *     assignarà la data i hora d'aquella primera publicació de naixement del
 *     poble»). Vegeu baix per què només compta poble_id.
 *
 * Ordre del Mestre (prompt 261009_0230, punt 6) · «si demà algú obri un poble
 * nou, la pestanya de la seua gent ha de funcionar automàticament sense tocar
 * ni una línia de codi»: ací no hi ha cap nom de poble. Tot surt de les dades
 * de la fitxa i de la publicació.
 *
 * Límits coneguts (documentats a l'informe de l'Onada 6):
 *   · un lloc escrit d'una altra manera («La Torre» a seques) no casa amb
 *     «La Torre de les Maçanes»: només el poble_id o el nom sencer;
 *   · les publicacions antigues que el mapejador marcava amb el poble per
 *     defecte compten com d'eixe poble a la seua pestanya: sense poble_id no
 *     es poden destriar (però no en canvien el naixement, vegeu baix);
 *   · «ajuntaments fora de moment»: la targeta no porta el tipus de
 *     l'organització que signa, i no se'n pot excloure cap per dades;
 *   · el poble és una declaració de qui publica (payload): val per a
 *     mostrar, mai per a permisos.
 *
 * Pur: sense React, sense xarxa i sense dades pròpies.
 */
import { dataDeDocument } from '../../components/universal/editorial.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { slugDelPoble } from './nomsDelPoble.js';

const CAP = Object.freeze([]);

/** D'on ix cada secció dins de les dades del Mur (useMur), en l'ordre en què el Mur les barreja. */
export const FONTS_DEL_POBLE = Object.freeze([['events', 'events'], ['mur', 'feedPosts'], ['mercat', 'marketItems']]);

/* Els camps de text que diuen des d'on es publica, de més a menys propi: el
   lloc de qui signa (NotesContext), el del mapejador d'abans, el d'un
   producte de la llavor (marketSeed.js) i el genèric. */
const CAMPS_DE_LLOC = Object.freeze(['author_location', 'town_name', 'population', 'location']);

const textDe = (valor) => (typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '');

/* Les pàgines del sistema (targetesDeSistema) les signa l'entitat pilot
   (DEFAULT_AUTHOR, amb seu al seu poble). */
const esDeSistema = (item) => item.isSystem === true || item.type === 'sistema';

/* La clau que la publicació DECLARA (poble_id, fet slug), o null. */
const pobleDeclaratDe = (item) => slugDelPoble(textDe(item.poble_id)) || null;

/** La clau (slug) del poble des d'on s'ha publicat `item`, o null si no se sap. */
export function pobleDeLaPublicacio(item) {
  if (!item || typeof item !== 'object') return null;
  if (esDeSistema(item)) return slugDelPoble(textDe(DEFAULT_AUTHOR.location)) || null;
  const declarat = pobleDeclaratDe(item);
  if (declarat) return declarat;
  const lloc = CAMPS_DE_LLOC.map((camp) => textDe(item[camp])).find(Boolean);
  return lloc ? slugDelPoble(lloc) : null;
}

/** Les claus amb què es reconeix un poble: el seu id, el seu slug i el seu nom fet slug. */
export function clausDelPoble(town) {
  if (!town || typeof town !== 'object') return CAP;
  const claus = [town.id, town.slug, town.title || town.name]
    .map((valor) => slugDelPoble(textDe(valor)))
    .filter(Boolean);
  return claus.length ? [...new Set(claus)] : CAP;
}

/** Si `item` s'ha publicat des del poble `town`. */
export function esDelPoble(item, town) {
  const clau = pobleDeLaPublicacio(item);
  return clau !== null && clausDelPoble(town).includes(clau);
}

/**
 * Les publicacions del poble `town` dins de `fonts` (el que dona useMur:
 * { feedPosts, marketItems, events }), sense ordenar: [{ seccio, item }],
 * sense repetits. Sense cap, CAP.
 */
export function itemsDelPoble(fonts, town) {
  const claus = clausDelPoble(town);
  if (!claus.length || !fonts || typeof fonts !== 'object') return CAP;
  const vistos = new Set();
  const trobats = [];
  for (const [seccio, font] of FONTS_DEL_POBLE) {
    const llista = Array.isArray(fonts[font]) ? fonts[font] : CAP;
    for (const item of llista) {
      if (!item || typeof item !== 'object' || item.id == null) continue;
      const clau = pobleDeLaPublicacio(item);
      const id = `${seccio}:${item.id}`;
      if (clau === null || !claus.includes(clau) || vistos.has(id)) continue;
      vistos.add(id);
      trobats.push({ seccio, item });
    }
  }
  return trobats.length ? trobats : CAP;
}

/* La creació REAL d'una publicació (requisit 15: «la data de la creació real
   de la publicació»): created_at, el que el servidor conserva en republicar
   (trigger section_submissions_conserva_creacio). Ni la data triada al
   calendari (T40, publish_date: l'autoria la pot posar en el passat, i un
   article d'història faria nàixer el poble fa cent anys) ni el dia d'un acte
   (no és quan es va publicar) ni una edició. Torna el valor tal com ve,
   perquè la pastilla el llija amb la regla de sempre. */
function creacioDe(valor) {
  const data = dataDeDocument({ creat: valor });
  return data ? { valor, instant: data.instant.getTime() } : null;
}

/* Revisió adversarial de l'Onada 6 · Quines publicacions poden fer nàixer un
   poble: només les que el DECLAREN (poble_id), no les que hi casen pel text
   del lloc. El text del lloc de les publicacions d'abans no és prou fiable per
   a datar un poble: el mapejador i NotesContext hi escrivien «La Torre de les
   Maçanes» per defecte a tota publicació sense poble, i el contingut de
   l'administració (app_content, supabase/seed.sql) porta dates anteriors a
   les fitxes (el Mac Mini del Mercat, 15-02-2026, casa amb la Torre per
   `population`). Amb el text, una sola d'eixes publicacions reescrivia la
   data i la posició del poble a /pobles (la Torre passava de la primera a
   l'última); a la pestanya, en canvi, una targeta mal casada només és una
   targeta de més. La declaració és la dada pensada per al requisit (les
   publicacions noves la porten, decisió 3 de la nit). Pregunta oberta al
   Mestre: si les publicacions antigues casades pel text també han de comptar. */
function naixementsDeclarats(fonts) {
  const perClau = new Map();
  if (!fonts || typeof fonts !== 'object') return perClau;
  for (const [, font] of FONTS_DEL_POBLE) {
    for (const item of Array.isArray(fonts[font]) ? fonts[font] : CAP) {
      if (!item || typeof item !== 'object' || item.id == null || esDeSistema(item)) continue;
      const clau = pobleDeclaratDe(item);
      const creacio = clau === null ? null : creacioDe(item.created_at);
      if (!creacio) continue;
      const ara = perClau.get(clau);
      if (!ara || creacio.instant < ara.instant) perClau.set(clau, creacio);
    }
  }
  return perClau;
}

/**
 * Les fitxes amb el seu naixement a created_at, la font que ja lligen la
 * pastilla i l'ordre (editorial.js · dataDElement i momentDElement): el
 * valor de data més antic entre el created_at de la fitxa i el de la primera
 * publicació que declara el poble (poble_id contra l'id, el slug o el nom fet
 * slug de la fitxa). Cap data inventada: sense cap data real, la fitxa tal
 * qual. El criden /pobles (PoblesSection) i la meta de Pobles (la pàgina del
 * poble i el lector del MAS), sobre les dades del Mur: totes tres diuen la
 * mateixa data (T51). Si cap fitxa no canvia, la MATEIXA llista (qui la
 * memoritza no torna a pintar), i cada fitxa que no canvia és la mateixa.
 */
export function poblesAmbNaixement(towns, fonts) {
  if (!Array.isArray(towns)) return CAP;
  const perClau = naixementsDeclarats(fonts);
  if (!perClau.size) return towns;
  const pobles = towns.map((town) => {
    if (!town || typeof town !== 'object') return town;
    let mes = creacioDe(town.created_at);
    for (const clau of clausDelPoble(town)) {
      const creacio = perClau.get(clau);
      if (creacio && (!mes || creacio.instant < mes.instant)) mes = creacio;
    }
    return !mes || mes.valor === town.created_at ? town : { ...town, created_at: mes.valor };
  });
  return pobles.every((poble, i) => poble === towns[i]) ? towns : pobles;
}

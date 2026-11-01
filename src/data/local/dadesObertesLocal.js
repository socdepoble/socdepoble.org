/**
 * dadesObertesLocal.js — Les dades obertes de l'adaptador local (T2 ·
 * D04/D10; assalt 261101, pla 261101_1246, D-3): les capacitats
 * 'dadesObertes' (llegixDadesObertes) i 'restauracioDadesObertes'
 * (restauraDadesObertes). Forma: contracte.js.
 *
 * El magatzem de la restauració és d'esta instància (e.dadesObertes.estat,
 * src/data/dadesObertesLot.js) i s'intercanvia sencer: una restauració és o
 * tota o res. El que s'hi restaura també ho servixen el directori públic
 * (comunitatLocal.js · listPublicOrganizations), els pobles i el Mur
 * (contingutLocal.js · loadCoreContent i loadMur).
 *
 * La lectura és la mateixa amb sessió i sense: les llistes de
 * l'administració del node (la llavor o `dades`) més el que s'hi ha
 * restaurat, mai les publicacions del veïnat. Este node té comptes però cap
 * rol d'administració: la restauració només escriu si la instància es crea
 * amb `restauracioOberta` (T2-G04, com personalitzacioOberta); si no, un lot
 * vàlid rebutja amb `code` 'sense-permis' (contracte.js) i no escriu res.
 *
 * Gauntlet D-01/D-02 · Un lot no es pot apropiar del que el node ja té fora
 * del magatzem: els pobles, les notícies i els actes de la base i el padró
 * d'entitats sencer (també les no públiques). Cada fila de la base és del
 * poble que hi declara, amb la regla de l'exportador; una sense poble (l'acte
 * de la llavor) no és de cap, i cap lot no la pot portar.
 */
import { ambCodi } from '../errorsBackend.js';
import { normalitzaSlugMunicipi } from '../activitypub.js';
import { COLECCIONS_DADES_OBERTES, LIMIT_DADES_OBERTES } from '../contracte.js';
import { fusionaLotDadesObertes, llegixDeLEstat } from '../dadesObertesLot.js';
import { ENTITATS_SEED } from '../identitatsSeed.js';

/* Un text d'una línia (o un nombre) retallat, o ''. */
const textDe = (valor) => (typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '');
const slugDe = (valor) => normalitzaSlugMunicipi(textDe(valor)) || null;
const esEntitat = (perfil) => perfil?.tipus === 'entitat' || perfil?.tipus === 'grup';

/* Els pobles de la base, amb la regla de l'exportador
   (entradaOpenDataDelPoble.js: el poble és `slug || id`, i el nom
   `title || name`): el slug canònic de cada poble → el seu nom, i l'id de
   cada poble → el seu slug (per a poble_id). Gauntlet V-A01 · Cap àlies porta
   el nom: un àlies que valia el nom deixava entrar el mateix poble amb un altre
   slug (dos «La Torre»). Les altres claus d'un poble (l'id, el slug del nom, i
   totes les d'un poble sense nom) queden reservades amb null: el directori
   (contingutLocal.js · pobles) amaga un poble restaurat amb l'id o el slug
   d'un de la base, i cap lot no es queda les files de la base que apunten al
   slug del nom (town_name o lloc). */
function poblesDeLaBase(towns) {
  const noms = new Map();
  const slugPerId = new Map();
  const reservades = [];
  for (const poble of towns) {
    const nom = textDe(poble?.title) || textDe(poble?.name);
    const slug = slugDe(poble?.slug) ?? slugDe(poble?.id) ?? slugDe(nom);
    const canonic = nom && slug ? slug : null;
    if (canonic !== null) {
      if (!noms.has(canonic)) noms.set(canonic, nom);
      if (textDe(poble.id)) slugPerId.set(textDe(poble.id), canonic);
    }
    for (const clau of [slugDe(poble?.slug), slugDe(poble?.id), slugDe(nom)]) if (clau && clau !== canonic) reservades.push(clau);
  }
  /* Un slug canònic mana sobre la reserva d'un altre poble. */
  for (const clau of reservades) if (!noms.has(clau)) noms.set(clau, null);
  return { noms, slugPerId };
}

/* El poble d'una fila de la base, amb la regla de l'exportador
   (exportaMunicipiOpenData.js · coincidenciaDelPoble): mana poble_id (l'id o
   el slug d'un poble); si no n'hi ha, el town_name o el lloc (el primer
   poble d'«A · B»). Sense cap: null. */
function pobleDeLaFilaBase(fila, slugPerId) {
  const declarat = textDe(fila?.poble_id);
  if (declarat) return slugPerId.get(declarat) ?? slugDe(declarat);
  for (const camp of ['town_name', 'location']) {
    const lloc = textDe(fila?.[camp]);
    if (lloc) return slugDe(lloc.split(' · ')[0]);
  }
  return null;
}

/* Una col·lecció de la base: id → poble. */
const perId = (files, slugPerId) => new Map(files.filter((fila) => textDe(fila?.id)).map((fila) => [textDe(fila.id), pobleDeLaFilaBase(fila, slugPerId)]));

/* La llista de l'administració amb les files restaurades: una restaurada
   substituïx SENCERA la de l'administració amb el mateix id (mai una barreja
   de camps, com faria mergeById), i les altres van darrere, en ordre d'id. */
export function unioPerId(base, restaurades) {
  const ids = new Set(restaurades.map((fila) => String(fila.id)));
  return [...base.filter((fila) => !(fila && (typeof fila.id === 'string' || typeof fila.id === 'number') && ids.has(String(fila.id)))), ...restaurades];
}

/* El poble del filtre: { slug, nom } de text no buit, o TypeError. */
function pobleDelFiltre(filtre) {
  const poble = filtre?.poble;
  if (!poble || typeof poble.slug !== 'string' || !poble.slug.trim() || typeof poble.nom !== 'string' || !poble.nom.trim()) {
    throw new TypeError('llegixDadesObertes: cal el poble { slug, nom }.');
  }
  return { slug: poble.slug, nom: poble.nom };
}

export function creaDadesObertesLocal(e) {
  /* Gauntlet D-01/D-02 · El que el node ja té fora del magatzem, en la forma de
     fusionaLotDadesObertes. El padró d'entitats, sencer: les públiques del
     directori sense sostre (cap LIMIT_DIRECTORI_ENTITATS) i, per a la resta, la
     fitxa de cada id que porta el lot (loadPerfilPublic també troba les no
     públiques) i, per als slugs, la de cada id del padró. Les fitxes es
     consulten només després de validar el lot. */
  const ocupatsDelNode = () => {
    const { noms, slugPerId } = poblesDeLaBase(e.coleccio('towns'));
    const publiques = e.perfils.listPublicOrganizations({});
    const pobleDeLaPublica = new Map(publiques.map((org) => [textDe(org.id), slugDe(org.town_name)]));
    const fitxa = (clau) => {
      const perfil = e.perfils.loadPerfilPublic(clau);
      return esEntitat(perfil) ? perfil : null;
    };
    /* Gauntlet V-A03 · slug → id de TOT el padró, també de les no públiques.
       El padró és `dades.entitats` o, si no en porta, ENTITATS_SEED
       (adaptadorLocal.js · createLocalPerfilsAdapter); es miren els ids de
       totes dues llistes i, de cada un, la fitxa viva (updateOrganization en pot
       canviar el slug o la visibilitat). Només compta la fitxa que és d'eixe id:
       un id de la llavor que no és al padró no en té cap (o, del catàleg, sense
       slug). Es calcula una sola volta. */
    let idPerSlug = null;
    const slugsDelPadro = () => {
      if (idPerSlug) return idPerSlug;
      idPerSlug = new Map(publiques.filter((org) => textDe(org.slug)).map((org) => [textDe(org.slug), textDe(org.id)]));
      const ids = new Set([...e.coleccio('entitats'), ...ENTITATS_SEED].map((entitat) => textDe(entitat?.id)).filter(Boolean));
      for (const id of ids) {
        const viva = fitxa(id);
        const slug = textDe(viva?.slug);
        if (slug && textDe(viva.id) === id && !idPerSlug.has(slug)) idPerSlug.set(slug, id);
      }
      return idPerSlug;
    };
    return {
      pobles: noms,
      noticies: perId(e.coleccio('feedPosts'), slugPerId),
      agenda: perId(e.coleccio('events'), slugPerId),
      entitats: {
        has: (id) => pobleDeLaPublica.has(id) || fitxa(id) !== null,
        get: (id) => (pobleDeLaPublica.has(id) ? pobleDeLaPublica.get(id) : slugDe(fitxa(id)?.poble))
      },
      slugsEntitats: {
        has: (slug) => slugsDelPadro().has(slug),
        get: (slug) => slugsDelPadro().get(slug)
      }
    };
  };

  return {
    /* Contracte: cap llista passa de LIMIT_DADES_OBERTES (Gauntlet D-04): la
       unió de la base i el que s'hi ha restaurat no es talla, s'atura. */
    async llegixDadesObertes(filtre = {}) {
      const poble = pobleDelFiltre(filtre);
      const restaurades = llegixDeLEstat(e.dadesObertes.estat, { poble });
      const resposta = {
        noticies: unioPerId(e.copia(e.coleccio('feedPosts')), restaurades.noticies),
        agenda: unioPerId(e.copia(e.coleccio('events')), restaurades.agenda),
        memoria: restaurades.memoria,
        memoriaOral: restaurades.memoriaOral
      };
      for (const coleccio of COLECCIONS_DADES_OBERTES) {
        if ((resposta[coleccio]?.length ?? 0) > LIMIT_DADES_OBERTES) {
          throw new RangeError(`«${coleccio}» passa de ${LIMIT_DADES_OBERTES} elements: no es talla en silenci.`);
        }
      }
      return resposta;
    },

    /* Valida i comprova els conflictes abans de tocar res (fusionaLotDadesObertes, pur) i
       després intercanvia l'estat sencer: un error no deixa cap fila a mitges. Un lot
       invàlid és un TypeError per a tothom (contracte.js); un id, un slug o un poble que
       ja són d'un altre poble del node, 'conflicte-identificador'; sense
       restauracioOberta, un de vàlid és 'sense-permis' i el magatzem no canvia. */
    async restauraDadesObertes(lot) {
      const { estat, informe } = fusionaLotDadesObertes(e.dadesObertes.estat, lot, { ocupats: ocupatsDelNode() });
      if (!e.opcions.restauracioOberta) {
        throw ambCodi(new Error('Este node local només restaura paquets de dades obertes si es crea amb restauracioOberta.'), 'sense-permis');
      }
      e.dadesObertes.estat = estat;
      return informe;
    }
  };
}

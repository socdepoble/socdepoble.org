import { sanitizeHtml, netejaText } from '../utils/sanitize.js';
import { origenPublic } from './origenNota.js';
import { fotoDelBucketPublic } from '../utils/mitjaOpac.js';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* Onada 6 · La forma d'un id de poble (nomsDelPoble.js · SLUG_DE_POBLE) i la
   seua llargària màxima (la d'un slug, seleccioUrl.js · LLARGARIA_SLUG). Ací
   no s'importa res de les seccions: el mapejador és de la capa de dades. */
const SLUG_DE_POBLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAXIM_POBLE_ID = 80;

const normalizeText = (value) =>
  String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const firstAsset = (value) => (Array.isArray(value) ? value[0] || null : value || null);
const buildSearchText = (parts) => normalizeText(parts.filter(Boolean).join(' '));

function validaUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('data:image/')) return s;
  if (s.startsWith('//')) return null; // Bloquejar protocol-relative (Z audit)
  if (s.startsWith('/') || s.startsWith('./')) return s;
  try {
    const p = new URL(s);
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch {
    return null;
  }
}

/* Relleu 261007 · «Límits» §5 · Abans, variations.map(netejaText) i
   tags.map(netejaText): Array.prototype.map passa (element, índex), i l'índex
   queia al segon paràmetre de netejaText(valor, maxim) i retallava cada element
   a la seua posició (el primer quedava buit, el segon d'un caràcter). Ara
   cada element passa per una fletxa i el màxim és el de sèrie.
   Una variació, a més, no és una cadena: és un objecte amb name, price,
   description, image i stock_status (marketSeed.js, seed.sql), i el detall en
   llig els camps (detailSectionMeta.jsx). netejaText la convertia en
   «[object Object]». Es neteja camp a camp: el text amb netejaText, la imatge
   amb validaUrl com la resta d'imatges d'este mapejador. Una cadena es
   conserva neta (el compte de «N variants» de la targeta la inclou); qualsevol
   altra cosa (null, un número, un array) no és una variació i no viatja. */
const CAMPS_DE_TEXT_DE_VARIACIO = Object.freeze(['name', 'price', 'description', 'stock_status']);

/* Revisió adversarial (Relleu 261007) · validaUrl només admet http(s), camins
   relatius i data:image, i una pujada pròpia es guarda com a referència opaca
   sdp-media:// (storage.js), que és justament la forma que vol la Decisió 3 del
   Mestre (261007, «només imatges allotjades localment o pujades al nostre
   servidor»). Per validaUrl, la foto pròpia d'una variació es perdia en
   escriure. Es conserva amb la mateixa regla dels dos buckets d'admetFont
   (sanitize.js); la resta passa per validaUrl com abans.
   Relleu 261007 (peça «netes» i verificació final) · Conservar-la no vol dir
   que ja es pinte. El detall (detailSectionMeta.jsx, variacions del Mercat)
   descarta la referència opaca sdp-media:// (REFERENCIA_OPACA) abans
   d'esImatgePropiaDelDetall: una variació amb sdp-media:// es pinta com sense
   foto. Ningú no la resol encara pel port de mitjans; fer-ho demana un
   component nou amb espècimen i és una pregunta oberta al Mestre (Decisió 3). */
const REFERENCIA_DE_MITJANS = /^sdp-media:\/\/(?:mitjans_privats|mitjans)\//i;

function imatgeDeVariacio(image) {
  const s = String(image).trim();
  return REFERENCIA_DE_MITJANS.test(s) ? s : validaUrl(s);
}

/* Revisió del Gauntlet 261017 (ID2; relleu 3: la foto de la barra és la de la
   publicació) · La foto de qui signa una publicació del Mur (author_avatar),
   com la d'una variació però NOMÉS del bucket públic: la foto de perfil
   pujada a l'app (sdp-media://mitjans/…, PerfilContext · uploadToStorage)
   que publishNote ja hi posa (autoriaNota.js · fotoPublica). Abans validaUrl
   la buidava abans d'escriure la fila, i la publicació eixia sense la foto
   que la barra prometia; el servidor sí que l'admet
   (2610072230_mur_imatges_propies.sql). El bucket privat (mitjans_privats) i
   qualsevol altre bucket no hi entren: qui llig el Mur no els podria obrir.
   La resta de fonts passen per validaUrl com abans; validaUrl i els altres
   camps d'imatge no canvien. */
/* Contrast final · La regla és una sola, a utils/mitjaOpac.js
   (fotoDelBucketPublic): un camí amb '..' o caràcters estranys ja no passa. */
function avatarDeLaPublicacio(avatar) {
  if (!avatar) return null;
  const s = String(avatar).trim();
  return fotoDelBucketPublic(s) || validaUrl(s);
}

function netejaVariacio(variacio) {
  if (typeof variacio === 'string') return netejaText(variacio);
  if (!variacio || typeof variacio !== 'object' || Array.isArray(variacio)) return null;
  const neta = {};
  for (const camp of CAMPS_DE_TEXT_DE_VARIACIO) {
    if (variacio[camp] != null) neta[camp] = netejaText(variacio[camp]);
  }
  if (variacio.image != null) neta.image = imatgeDeVariacio(variacio.image);
  return neta;
}

export function mapSectionSubmissionToItem(submission) {
  const payload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const sectionId = netejaText(submission?.sectionId || payload.sectionId || '');
  const createdAt = netejaText(submission?.createdAt || payload.created_at || new Date().toISOString());

  const baseItem = {
    ...payload,
    id: netejaText(payload.id || submission.id || generateUUID()),
    sectionId,
    created_at: payload.created_at || createdAt
  };
  /* T43 (ordre del Mestre, 260928) · Esta funció munta el payload que
     appendSectionSubmissionNetworkOnly escriu a section_submissions, i eixa
     fila la llig tot el poble. L'origen d'una connexió compartida hi va net i
     sense `abast` (a qui s'ha enviat): un origen desconegut no hi va. */
  if (Object.hasOwn(baseItem, 'origen')) {
    const origen = origenPublic(baseItem.origen);
    if (origen) baseItem.origen = origen;
    else delete baseItem.origen;
  }
  /* Onada 6 (decisió 2 de la nit del 261009) · El poble des d'on es publica
     (poble_id, el slug que escriu NotesContext · publishNote) viatja net:
     només la forma d'un id de poble (minúscules ASCII i xifres separades per
     guions, la de nomsDelPoble.js · slugDelPoble). Qualsevol altra cosa no
     viatja. És una declaració de qui publica: val per a mostrar (la pestanya
     «Gent de …»), mai per a permisos. */
  if (Object.hasOwn(baseItem, 'poble_id')) {
    const poble = netejaText(baseItem.poble_id).toLowerCase();
    if (poble.length <= MAXIM_POBLE_ID && SLUG_DE_POBLE.test(poble)) baseItem.poble_id = poble;
    else delete baseItem.poble_id;
  }

  if (sectionId === 'mur') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'post'),
      title: netejaText(baseItem.title || 'Publicació'),
      summary: netejaText(baseItem.summary || baseItem.post_subtitle || baseItem.description || ''),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.post_subtitle || ''),
      post_subtitle: netejaText(baseItem.post_subtitle || baseItem.description || ''),
      author: netejaText(baseItem.author || baseItem.author_name || 'Foraster'),
      author_name: netejaText(baseItem.author_name || baseItem.author || 'Foraster'),
      /* Revisió del Gauntlet 261017 (ID2) · També la foto del bucket públic
         (avatarDeLaPublicacio, dalt). */
      author_avatar: avatarDeLaPublicacio(baseItem.author_avatar || baseItem.avatar_url),
      /* Onada 6 (decisió 2 de la nit del 261009) · Abans s'hi escrivia «La
         Torre de les Maçanes» quan el payload no en portava: un poble que
         ningú havia triat, persistit a section_submissions. Ara, sense poble,
         cap clau. Les reserves de PINTURA (TargetaDelMur, el detall del Mur)
         es queden: la targeta es veu igual (Llei del Píxel). */
      ...(baseItem.town_name ? { town_name: netejaText(baseItem.town_name) } : {}),
      imageSrc: validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url)),
      image_url: validaUrl(baseItem.image_url || baseItem.image || baseItem.imageSrc),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.post_subtitle, baseItem.description, baseItem.content,
        baseItem.author, baseItem.town_name, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'mercat') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'product'),
      title: netejaText(baseItem.title || 'Producte'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      summary: netejaText(baseItem.summary || baseItem.description || ''),
      seller: netejaText(baseItem.seller || baseItem.author_name || 'Foraster'),
      avatar_url: validaUrl(baseItem.avatar_url),
      imageSrc,
      image_url: validaUrl(baseItem.image_url || baseItem.image || imageSrc),
      image: validaUrl(baseItem.image || imageSrc),
      category_slug: netejaText(baseItem.category_slug || 'connectat'),
      tag: netejaText(baseItem.tag || 'Connectat'),
      variations: Array.isArray(baseItem.variations) ? baseItem.variations.map((v) => netejaVariacio(v)).filter((v) => v !== null) : [],
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.seller, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'events') {
    /* T5 (ordre del Mestre, 260930) · El dia de l'acte és el que porta el
       payload, i res més. created_at és quan s'ha publicat (i en UTC): mai no
       fa de dia de l'acte. Sense dia, la clau no viatja: l'Agenda no el pinta
       (acteAEsdeveniment torna null) i la targeta mostra la data de
       publicació (T51). */
    const { date: diaTriat, ...acte } = baseItem;
    const dia = netejaText(diaTriat);
    return {
      ...acte,
      ...(dia ? { date: dia } : {}),
      type: netejaText(acte.type || 'event'),
      title: netejaText(acte.title || 'Acte'),
      description: sanitizeHtml(acte.description || acte.summary || ''),
      summary: netejaText(acte.summary || acte.description || ''),
      author_name: netejaText(acte.author_name || acte.author || 'Foraster'),
      image_url: validaUrl(acte.image_url),
      searchText: netejaText(acte.searchText || buildSearchText([
        acte.title, acte.description, acte.author_name, acte.type
      ]))
    };
  }

  if (sectionId === 'multimedia') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'media'),
      title: netejaText(baseItem.title || 'Arxiu Multimèdia'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      tag: netejaText(baseItem.tag || 'Multimèdia'),
      source: netejaText(baseItem.source || baseItem.author_name || 'Usuari'),
      src: validaUrl(baseItem.src || imageSrc),
      created_at: netejaText(baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.tag, baseItem.source
      ]))
    };
  }

  if (sectionId === 'notes') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'note'),
      title: netejaText(baseItem.title || 'Nota Nova'),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.summary || ''),
      plainText: netejaText(baseItem.plainText || baseItem.description || baseItem.summary || ''),
      category: netejaText(baseItem.category || 'General'),
      /* Relleu 261007 · Amb una fletxa: l'índex del map no fa de màxim (vegeu
         netejaVariacio, a dalt). */
      tags: Array.isArray(baseItem.tags) ? baseItem.tags.map((v) => netejaText(v)) : [],
      folderId: netejaText(baseItem.folderId || 'f-root'),
      updatedAt: netejaText(baseItem.updatedAt || baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.content, baseItem.category
      ]))
    };
  }

  return baseItem;
}

/* Auditoria 261007 (B) · Claus d'autoritat que una publicació d'un veí no pot
   dir de si mateixa. El payload d'una publicació és un jsonb que qualsevol
   membre del poble escriu directament per l'API (la clau pública és al
   paquet), i el servidor només en lleva id, created_at i author. Amb estes
   claus una publicació signava com a entitat (author_org_id fa ombra a la
   columna en autorDe, navigation.js), com a «Sistema» (isSystem, isAvis,
   type 'sistema'), es clavava dalt de tot (is_pinned, pinned_position),
   enllaçava la targeta a una web de fora (mainHref) o feia ombra a l'id d'una
   altra publicació (slug, trobaElement d'elementDeSeccio.js). L'únic
   escriptor legítim (NotesContext · publishNote) no n'escriu cap: la neteja
   és idèntica al píxel per al contingut real.
   Onada 12 (261011; ordres 261011_0130, punt 1; correcció D5 de la
   refutació) · `article` (l'article on s'usa una foto de Multimèdia) el posa
   el sistema a les fotos derivades (multimedia/mediaContent.js) i el Cercador
   el llig per a no repetir un article (indexCerca.js · cercaEntrades): amb
   ell al payload, un veí lligaria la seua publicació a un producte o a un
   poble d'altri i la faria desaparéixer de la vista «tot». Cap escriptor
   legítim de publicacions n'escriu. */
const CLAUS_D_AUTORITAT = Object.freeze([
  'author_org_id', 'authorOrgId', 'author_entity_id', 'author_id', 'author_user_id',
  'owner_user_id', 'ownerUserId', 'isSystem', 'isAvis', 'is_pinned', 'pinned_position',
  'mainHref', 'slug', 'article'
]);

/* La insígnia «Sistema» (sdp-badge-system) és de les pàgines del sistema i de
   la reserva del Mercat que pinta la targeta, mai d'una etiqueta que porta una
   publicació. De la resta de classes, només la família sdp-badge-*: un nom de
   classe de maquetació (l'overlay de la targeta, per exemple) no hi té lloc. */
const CLASSE_DE_SISTEMA = 'sdp-badge-system';
const RE_CLASSE_D_ETIQUETA = /^sdp-badge-[a-z0-9-]+$/;

function classeDEtiqueta(className) {
  if (typeof className !== 'string') return '';
  return className.split(/\s+/)
    .filter((classe) => RE_CLASSE_D_ETIQUETA.test(classe) && classe !== CLASSE_DE_SISTEMA)
    .join(' ');
}

/* Una etiqueta d'una publicació és text i, com a molt, una classe: sense href
   (un enllaç a fora amb aparença d'etiqueta oficial). Un text pla es queda
   igual. Sense classe admesa, la targeta hi posa la de sèrie (sdp-badge-tag). */
function etiquetaDePublicacio(label) {
  if (!label || typeof label !== 'object') return label;
  const classe = classeDEtiqueta(label.className);
  return { text: label.text, ...(classe ? { className: classe } : {}) };
}

/**
 * Auditoria 261007 (B) · L'element del Mur (o del Mercat, o de l'agenda) que fa
 * una publicació d'un veí, amb l'autoria de les COLUMNES que valida el
 * servidor (qui és propietari i l'entitat que signa) i mai del payload que el
 * client mateix ha escrit. Funció neutra: l'adaptador hi passa els camps de la
 * seua fila amb noms del port; una regla de producte no es tanca dins d'un
 * adaptador. Només per a publicacions dels veïns: el contingut de
 * l'administració (app_content) signa legítimament dins del payload.
 * @param {{ id: string, payload?: object, titol?: string, createdAt?: string,
 *   updatedAt?: string, ownerUserId?: string|null, authorOrgId?: string|null }} fila
 * @returns {object}
 */
export function elementDeFilaPublicada({ id, payload, titol, createdAt, updatedAt, ownerUserId = null, authorOrgId = null } = {}) {
  const dades = payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...payload } : {};
  for (const clau of CLAUS_D_AUTORITAT) delete dades[clau];
  if (dades.type === 'sistema') delete dades.type;
  if (Array.isArray(dades.labels)) dades.labels = dades.labels.map(etiquetaDePublicacio);
  return {
    ...dades,
    id,
    created_at: createdAt,
    updated_at: updatedAt,
    author_name: dades.author_name || titol,
    ownerUserId: ownerUserId ?? null,
    /* Després de l'escampat i amb un null explícit: autorDe (navigation.js)
       llig primer author_org_id, i un null talla el `??` cap a cap altra clau. */
    author_org_id: authorOrgId ?? null,
    authorOrgId: authorOrgId ?? null
  };
}

export function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...primary, ...secondary].forEach((item) => {
    if (!item) return;
    const existing = map.get(String(item.id));
    if (existing) {
      // Si tots dos tenen revision (Sollutia Notes), la versió major guanya. F11.
      if (item.revision !== undefined && existing.revision !== undefined) {
        if (item.revision >= existing.revision) {
          map.set(String(item.id), { ...existing, ...item });
        }
      } else {
        const t1 = new Date(existing.updated_at || existing.updatedAt || existing.created_at || existing.createdAt || 0).getTime() || 0;
        const t2 = new Date(item.updated_at || item.updatedAt || item.created_at || item.createdAt || 0).getTime() || 0;
        // En cas d'empat, l'últim (secondary) guanya, combinant els camps
        if (t2 >= t1) map.set(String(item.id), { ...existing, ...item });
      }
    } else {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
}

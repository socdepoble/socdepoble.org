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
   component nou amb espècimen i és una pregunta oberta al Mestre (Decisió 3).
   Derogat en part per l'ordre del Mestre (18-10-2026, relleu del Pla 2000,
   punt 1; auditoria Codex 2030, §3.2) · El selector de variacions del detall
   (detailSectionMeta.jsx · FotoDeLaVariacio) ja la resol pel port
   (useResolvedAsset) abans del filtre d'imatges pròpies, i només pinta la URL
   que en torna; mai l'esquema opac cru. Este mapejador no canvia: la
   conserva igual. */
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

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1; auditoria Codex
   2030, R6 i §3.2) · Una variació es tria pel seu id ESTABLE, mai per la
   posició ni pel nom: reordenar o reanomenar les variacions no canvia quina
   està triada. L'id s'assigna una vegada (la llavor, l'editor) i este
   mapejador no l'inventa ni el recalcula: només el conserva si és curt i
   segur, amb la forma d'un id de poble (minúscules ASCII i xifres separades
   per guions, SLUG_DE_POBLE) i com a molt MAXIM_ID_DE_VARIACIO caràcters.
   Qualsevol altra cosa no viatja i la variació queda com una de llegat (sense
   id). La mateixa regla la llig el detall del Mercat
   (mercat/variacionsDeProducte.js) per a les files que no passen per ací
   (app_content). */
const MAXIM_ID_DE_VARIACIO = 64;

/** L'id estable d'una variació en la seua forma canònica, o null si no és un id net. */
export function idDeVariacio(valor) {
  if (typeof valor !== 'string') return null;
  const id = valor.trim().toLowerCase();
  return id.length <= MAXIM_ID_DE_VARIACIO && SLUG_DE_POBLE.test(id) ? id : null;
}

function netejaVariacio(variacio) {
  if (typeof variacio === 'string') return netejaText(variacio);
  if (!variacio || typeof variacio !== 'object' || Array.isArray(variacio)) return null;
  const neta = {};
  const id = idDeVariacio(variacio.id);
  if (id) neta.id = id;
  for (const camp of CAMPS_DE_TEXT_DE_VARIACIO) {
    if (variacio[camp] != null) neta[camp] = netejaText(variacio[camp]);
  }
  if (variacio.image != null) neta.image = imatgeDeVariacio(variacio.image);
  return neta;
}

/* Pla 2000 (punt 1) · L'id és únic dins del producte: si dos variacions
   porten el mateix, la primera el conserva i la segona viatja sense (de
   llegat). Cap variació es perd. */
function netejaVariacions(variacions) {
  if (!Array.isArray(variacions)) return [];
  const ids = new Set();
  return variacions.map((v) => netejaVariacio(v)).filter((v) => v !== null).map((v) => {
    if (typeof v !== 'object' || !v.id) return v;
    if (ids.has(v.id)) {
      const senseId = { ...v };
      delete senseId.id;
      return senseId;
    }
    ids.add(v.id);
    return v;
  });
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
      variations: netejaVariacions(baseItem.variations),
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
   legítim de publicacions n'escriu.
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3; auditoria Codex
   2030, §1.5; correcció F1 de la revisió) · `author_agent_id` i
   `authorAgentId` (l'agent IA titular d'una foto, que llig «Multimèdia» del
   Perfil · titularDelMitja) tampoc: cap columna del servidor no els valida, i
   amb ells al payload un veí posava la seua foto a la galeria de IAIA MarIA
   (i la traia de la seua). Només l'administració (app_content) el pot dir.
   Sense cap null explícit (una publicació legítima arriba igual que abans):
   si una fila d'un veí reprén l'id d'un element de l'administració, mergeById
   n'hereta l'agent, però la fila porta sempre la seua propietària
   (owner_user_id és NOT NULL i l'RLS l'iguala a auth.uid()), i titularDelMitja
   (profile/DetallMultimedia.jsx) no reconeix cap agent en un element amb
   persona propietària.
   Auditoria de seguretat 261019 (F11) · `autor` i `source` (qui va fer la
   foto, que el visor de l'Arxiu pinta com a «Autor»: panellDeLaFoto.js ·
   autorDeclarat) tampoc: amb ells un veí signava la seua foto com «IAIA
   MarIA», un ajuntament o un altre veí. Cap escriptor legítim de
   publicacions no n'escriu (publishNote no en porta; el servidor ja lleva
   `author`, trg_force_submission_author), i sense ells el visor diu
   «Desconegut», que és el que se'n sap. Revisió adversarial · Tampoc
   `srcDelPort`: és la URL que el port torna per a una referència opaca, i la
   posa el sistema en memòria (VisorDePublicacio, DetallMultimedia). Al
   payload, el visor de l'Arxiu la pintava abans que `src`: un veí hi mostrava
   la seua foto sobre una imatge del paquet classificada com a d'IA. */
const CLAUS_D_AUTORITAT = Object.freeze([
  'author_org_id', 'authorOrgId', 'author_entity_id', 'author_id', 'author_user_id',
  'owner_user_id', 'ownerUserId', 'author_agent_id', 'authorAgentId', 'isSystem', 'isAvis',
  'is_pinned', 'pinned_position', 'mainHref', 'slug', 'article', 'autor', 'source', 'srcDelPort'
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
  /* Auditoria de seguretat 261019 (F3) · Una etiqueta és un text pla (que es
     queda igual; un número, el seu text) o un objecte amb un text de cadena
     (textDelPayload, baix). La que no en porta cap (null, un booleà, un text
     que és un objecte) no viatja: abans, un null tombava la targeta
     (UniversalCard · Etiqueta, label.text) i un text que no era cadena, el
     filtre ?category= del Mur (MurSection · perCategoria). */
  if (typeof label === 'string') return label;
  if (!label || typeof label !== 'object') return textDelPayload(label);
  const text = textDelPayload(label.text);
  if (text === null) return null;
  const classe = classeDEtiqueta(label.className);
  return { text, ...(classe ? { className: classe } : {}) };
}

/* Auditoria de seguretat 261019 (F3, F7 i F9) · Les claus que les vistes
   pinten o tracten com a text (un fill de React, String(), un join, un
   toLowerCase, una ruta) només viatgen com a text. El payload és un jsonb que
   el veí escriu directament per l'API: un objecte o una llista on toca una
   cadena tombava la llista del Mercat (UniversalCard: «Objects are not valid
   as a React child»), /multimedia (Cella) i, des de MultimediaProvider, que és
   damunt de la frontera d'error de la ruta, l'aplicació sencera; un objecte
   sense conversió a primitiu ({"toString":0}) ho feia fins i tot dins d'un
   String(); un `sectionId` objecte, /cerca (getSectionItemPath), i un títol
   numèric, la targeta d'un acte (EventCard, title.toLowerCase()). Un número
   finit es queda com el seu text; un objecte, una llista o un booleà no
   viatgen, i la vista hi posa la reserva de quan falta. El preu admet també
   un número tal qual, i `revision` (mergeById la compara) només un número.
   L'únic escriptor legítim (NotesContext · publishNote, per
   mapSectionSubmissionToItem) hi escriu sempre cadenes: el contingut real
   arriba igual que abans.
   Les claus d'imatge admeten també una llista (firstAsset, getFirstImage): un
   element que no és primitiu hi queda com a null, que les vistes ja lligen
   com a «sense foto». Les etiquetes, les variacions i les etiquetes de nota
   (tags) que no són una llista no viatgen (les vistes en fan map o en compten
   la llargària), i una etiqueta de nota que no és primitiva tampoc. La
   geolocalització només porta lat, lng i altitud primitius (formataGps en fa
   Number()). L'origen d'una connexió compartida passa per origenPublic
   (origenNota.js), la mateixa regla de l'escriptura: un origen ja net no
   canvia, i un que la regla no reconeix (o que no es deixa llegir) no
   viatja. */
const CLAUS_DE_TEXT_DEL_PAYLOAD = Object.freeze([
  'title', 'name', 'subtitle', 'post_subtitle', 'lead', 'excerpt', 'description', 'summary', 'content',
  'plainText', 'body', 'entradilla', 'author', 'author_name', 'seller', 'price', 'author_location',
  'location', 'population', 'town_name', 'provincia', 'comarca', 'tag', 'category_slug', 'category',
  'copyright', 'source', 'autor', 'nomPoble', 'poble', 'poble_id', 'icon', 'imageAlt', 'type', 'kind',
  'date', 'time', 'publish_date', 'dataCaptura', 'searchText', 'comments', 'likes', 'file', 'sectionId'
]);
/* Llibre Mestre, P1-61 (àudio del Mestre del 27-10-2026 a les 12:08) · «el
   model de dades i la resolució d'imatge han de prioritzar item.og_image ||
   item.featured_image»: la imatge que l'autor tria per a xarxes
   (config/imatgeSocial.js) és una clau d'imatge més, amb la mateixa neteja. */
const CLAUS_D_IMATGE_DEL_PAYLOAD = Object.freeze([
  'image', 'image_url', 'imageSrc', 'images', 'src', 'avatar_url', 'author_avatar', 'logo_image',
  'og_image', 'featured_image'
]);
const CLAUS_DE_LLISTA_DEL_PAYLOAD = Object.freeze(['labels', 'variations', 'tags']);
const CAMPS_DE_GEOLOCALITZACIO = Object.freeze(['lat', 'lng', 'altitud']);

function esObjecte(valor) {
  return valor !== null && typeof valor === 'object';
}

const esNumeroFinit = (valor) => typeof valor === 'number' && Number.isFinite(valor);

/* El text d'un valor del payload: una cadena, tal qual; un número finit, el
   seu text; qualsevol altra cosa, null. */
function textDelPayload(valor) {
  if (typeof valor === 'string') return valor;
  return esNumeroFinit(valor) ? String(valor) : null;
}

function origenLlegible(origen) {
  try {
    return origenPublic(origen);
  } catch {
    return null;
  }
}

function netejaTipusDelPayload(dades) {
  for (const clau of CLAUS_DE_TEXT_DEL_PAYLOAD) {
    const valor = dades[clau];
    if (valor == null || typeof valor === 'string') continue;
    if (clau === 'price' && esNumeroFinit(valor)) continue;
    const text = textDelPayload(valor);
    if (text === null) delete dades[clau];
    else dades[clau] = text;
  }
  if (Object.hasOwn(dades, 'revision') && !esNumeroFinit(dades.revision)) delete dades.revision;
  for (const clau of CLAUS_D_IMATGE_DEL_PAYLOAD) {
    const valor = dades[clau];
    if (Array.isArray(valor)) dades[clau] = valor.map((element) => (esObjecte(element) ? null : element));
    else if (esObjecte(valor)) delete dades[clau];
  }
  for (const clau of CLAUS_DE_LLISTA_DEL_PAYLOAD) {
    if (Object.hasOwn(dades, clau) && dades[clau] != null && !Array.isArray(dades[clau])) delete dades[clau];
  }
  if (Array.isArray(dades.tags)) dades.tags = dades.tags.filter((etiqueta) => !esObjecte(etiqueta));
  if (Object.hasOwn(dades, 'geolocalitzacio')) {
    const geo = dades.geolocalitzacio;
    if (esObjecte(geo) && !Array.isArray(geo)) {
      dades.geolocalitzacio = Object.fromEntries(CAMPS_DE_GEOLOCALITZACIO
        .filter((camp) => geo[camp] != null && !esObjecte(geo[camp]))
        .map((camp) => [camp, geo[camp]]));
    } else if (geo != null) {
      delete dades.geolocalitzacio;
    }
  }
  if (Object.hasOwn(dades, 'origen') && dades.origen != null) {
    const origen = origenLlegible(dades.origen);
    if (origen) dades.origen = origen;
    else delete dades.origen;
  }
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
  netejaTipusDelPayload(dades);
  if (Array.isArray(dades.labels)) dades.labels = dades.labels.map(etiquetaDePublicacio).filter(Boolean);
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

/* Auditoria Port Neutral 261025 (omissió del verificador) · Només es fusionen
   els elements amb un id de veres (un text o un número). Abans, tots els que no
   en portaven queien a la clau «undefined» i només en sobrevivia l'últim, i un
   primitiu (un número, un text) es convertia en un objecte estrany en
   fusionar-se: una pèrdua silenciosa de dades. Ara un element sense id passa
   tal qual, al seu lloc, i el que no és un objecte no hi entra. */
export function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...primary, ...secondary].forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    if (typeof item.id !== 'string' && typeof item.id !== 'number') {
      map.set(Symbol('sense-id'), item);
      return;
    }
    const clau = String(item.id);
    const existing = map.get(clau);
    if (existing) {
      // Si tots dos tenen revision (Sollutia Notes), la versió major guanya. F11.
      if (item.revision !== undefined && existing.revision !== undefined) {
        if (item.revision >= existing.revision) {
          map.set(clau, { ...existing, ...item });
        }
      } else {
        const t1 = new Date(existing.updated_at || existing.updatedAt || existing.created_at || existing.createdAt || 0).getTime() || 0;
        const t2 = new Date(item.updated_at || item.updatedAt || item.created_at || item.createdAt || 0).getTime() || 0;
        // En cas d'empat, l'últim (secondary) guanya, combinant els camps
        if (t2 >= t1) map.set(clau, { ...existing, ...item });
      }
    } else {
      map.set(clau, item);
    }
  });
  return Array.from(map.values());
}

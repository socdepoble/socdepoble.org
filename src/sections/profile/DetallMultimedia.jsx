import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila } from '../../components/universal/editorial.js';
import { Alerta, Boto, Carregant, DialegConfirmacio, Insignia } from '../../components/PedraSeca';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { esborraElMeuMitja, getRuntimeDataMode, llistaElsMeusMitjans, teCapacitat } from '../../data/backendPort.js';
import { AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT, esComptePersonaPilot } from '../../data/identitatsSeed.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { esAvatarDeProveidorOAuth, esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { useMultimedia } from '../multimedia/MultimediaContext.jsx';
import { VisorDeLArxiu } from '../multimedia/VisorDeLArxiu.jsx';
import { usePerfilOpcional } from './PerfilContext.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { documentDeFitxa, menaDeFitxa, valorPerDesar } from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import {
  avatarDeLaBarraDeFitxa, avatarDeLaFitxa, pobleDeFitxa, potEditarFitxa, rutaDeFitxaPublica,
} from './fitxaDePerfil.js';

/* ═══════════════════════════════════════════════════════════════════
   MULTIMÈDIA · les fotos de cada actor del Perfil, de veres

   Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · Reescrita
   sobre la primera passada. Les fonts de la PERSONA, i cap altra:
     1. les fotos que la persona ha pujat al seu espai del servidor de
        fitxers (llistaElsMeusMitjans, la capacitat opcional
        'mitjansPropis'), només en mode remot. Correcció de la revisió · La
        llavor i el mode local corren sobre el mateix adaptador, que sí que
        porta la capacitat i hi torna []: per això ho diu el mode de dades
        (getRuntimeDataMode), no la capacitat; sense servidor, cap crida i
        l'explicació en línia;
     2. l'avatar i la capçalera actius de la fitxa, amb l'esborrany de la cua
        (avatarDeLaFitxa i documentDeFitxa, com «El compte» i «Les vistes»);
     3. la foto del compte de Google de la sessió (la identitat 'google' o,
        si no, user_metadata.picture), sense referent i mai esborrable;
     4. per al compte de Javi Llinares (esComptePersonaPilot: mai pel nom),
        la foto canònica de la seua fitxa (PERSONA_PILOT.avatar).
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3; auditories 2030
   de Codex §1.5 i §4.1 i de Gemini) · «Multimèdia» per a CADA actor que la
   persona pot editar (la persona, una empresa o un grup i un agent IA), amb
   el visor complet de l'Arxiu (VisorDeLArxiu: EXIF, resolució, data) i, al
   seu panell, les accions del Perfil. La titularitat, NOMÉS per
   identificadors EXPLÍCITS (titularDelMitja, idsDeLActor), mai pel nom, el
   correu, la carpeta del paquet ni qui ho va pujar:
     5. de l'Arxiu visual (useMultimedia), els elements amb titular explícit:
        la persona, pel seu uid (ownerUserId, la columna owner_user_id que
        valida el servidor) i sense cap entitat ni agent que el signe;
        l'organització, pel seu id (author_org_id) o un àlies que el catàleg
        declara per a eixe mateix id; l'agent IA, pel seu id o un àlies
        declarat al catàleg (author_agent_id, el camp del contracte
        llistaMitjansActor que dissenya Codex: avui cap element no el porta).
        Una foto pujada per Javi per a Rentonar és de Rentonar, no de Javi;
     6. per a una organització o un agent, les imatges de la seua fitxa: el
        logotip o l'avatar, la capçalera i les de la presentació. Sense el
        contracte llistaMitjansActor al backend, és tot el que es pot provar
        al client: si no n'hi ha cap, ho diu clarament.
   FORA: qualsevol reconeixement per NOM (una foto d'algú que es diu igual no
   és teua), qualsevol «biblioteca» desada al navegador i les fotos de tercers
   al visor (la de Google no s'hi obri: el visor no la demanaria sense
   referent).
   «Elimina» i «Eliminar duplicats» esborren de veres (esborraElMeuMitja), i
   mai l'avatar ni la capçalera actius. Ordre del Mestre (18-10-2026, després
   de les auditories 2030 de Codex i Gemini) · NOMÉS si el backend declara la
   capacitat 'integritatMitjans' (CAPACITAT_INTEGRITAT): sense ella ningú no sap
   si una publicació fa servir la foto, i esborrar-la la deixaria sense imatge.
   Mentrestant les còpies es veuen, però cap botó no esborra res. Una
   organització o un agent no tenen cap esborrat (no hi ha cap contracte de
   titularitat al servidor). Posar-ne una de logotip, d'avatar o de capçalera
   descarta l'esborrany de la cua d'eixe camp i desa la columna de la seua
   mena (valorPerDesar i guardarCampPerfil, com l'editor): avatar_url i
   hero_url de la persona i de l'agent, logo_url i hero_url de l'organització.
   Correcció de la revisió (Pla 261018_1605, Tasca 4):
     · Les fotos protegides no són només les actives de l'esborrany: també
       les DESADES (avatar_url i hero_url de la fila, les que veu el veïnat
       mentre un esborrany és pendent o rebutjat), la de la identitat i la de
       les metadades de la sessió. Cap d'elles s'esborra ni compta com a còpia
       sobrera. Una URL pública del Storage de `mitjans` es llig com la seua
       referència opaca (clauDeFont).
     · El títol d'una foto pujada és la data («Foto pujada el 12-10-2026»),
       mai el nom del fitxer (un UUID); la miniatura porta alt="" perquè el
       títol del costat ja la nomena, i els botons de cada targeta el lligen
       amb aria-describedby.
     · El focus no es perd: després d'eliminar, a la llista (o al text de
       buit); després de «Mostra’n més», al primer botó de la primera foto
       nova; si en posar-ne una el botó queda desactivat, a la mateixa
       targeta (o, amb el visor obert, a les seues accions). En tancar el
       visor, a la miniatura que l'ha obert (Dialeg).
   ═══════════════════════════════════════════════════════════════════ */

/** Les miniatures que es pinten d'entrada; «Mostra’n més» n'afig unes altres tantes. */
export const LIMIT_MINIATURES = 48;

const TITOL = Object.freeze({
  pujada: 'Foto pujada',
  avatar: 'Foto de perfil actual',
  capcalera: 'Capçalera actual',
  google: 'Foto del compte de Google',
  canonica: 'Foto canònica del perfil',
  presentacio: 'Foto de la presentació',
  arxiu: 'Foto de l’Arxiu visual',
});

/* La ruta pública d'un objecte del bucket `mitjans` al Storage del node. */
const RUTA_PUBLICA_MITJANS = /^\/storage\/v1\/object\/public\/mitjans\/(.+)$/;

/* La referència opaca d'una URL pública del Storage de `mitjans`, si l'origen
   és dels nostres (esFontImatgePropia); si no, ''. */
function refDeLaUrlPublica(url) {
  if (!/^https?:\/\//i.test(url) || !esFontImatgePropia(url)) return '';
  try {
    const ruta = new URL(url).pathname.match(RUTA_PUBLICA_MITJANS);
    return ruta ? `sdp-media://mitjans/${decodeURIComponent(ruta[1])}`.toLowerCase() : '';
  } catch {
    return '';
  }
}

/**
 * La clau d'una font per a reconéixer la mateixa foto: sense espais, sense
 * consulta ni fragment i sense barres al final; una referència opaca, en
 * minúscules (les rutes del servidor de fitxers ho són). La URL pública del
 * mateix objecte (el Storage del node, bucket `mitjans`) és la mateixa foto
 * que la seua referència opaca. Un data URL, tal qual. Pura.
 */
export function clauDeFont(font) {
  const neta = typeof font === 'string' ? font.trim() : '';
  if (!neta) return '';
  if (neta.startsWith('data:')) return neta;
  const sense = neta.split('#')[0].split('?')[0].replace(/\/+$/, '');
  if (sense.toLowerCase().startsWith('sdp-media://')) return sense.toLowerCase();
  return refDeLaUrlPublica(sense) || sense;
}

/* Pla 261018_1605 (Tasca 4; revisió adversarial, 18-10-2026) · Les fotos
   que la presentació de la fitxa (presentacio_html) fa servir: la referència
   opaca o la URL pública del bucket `mitjans`. Esborrar-ne una deixaria un
   forat a la fitxa que veu el veïnat. Pura. */
const PATRO_FOTO_DEL_TEXT = /(?:sdp-media:\/\/mitjans\/|https:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/mitjans\/)[^\s"'<>()]+/gi;

export function fotesDelText(html) {
  if (typeof html !== 'string' || !html) return [];
  return html.match(PATRO_FOTO_DEL_TEXT) || [];
}

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · El src de cada
   <img> de la presentació (l'HTML sanejat de la fitxa), amb les cometes
   dobles o simples i l'&amp; desfet.
   Auditoria de seguretat 261019 (R3) · En temps lineal. Abans era
   /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, i una presentació amb
   molts '<img' (o '<img src=') i cap '>' feia recórrer el text sencer des de
   cada '<img': treball quadràtic en obrir el panell (40.000 '<img src=': uns
   4 s). Este recorregut torna els mateixos src, en el mateix ordre. El tram
   d'una '<img' arriba fins al primer '>' (o al final), i hi mana el primer
   atribut ' src=' seguit d'una cometa que es tanca més avant (el valor sí que
   pot passar el '>'). Si cap atribut del tram no es tanca, tampoc no ho farà
   cap '<img' posterior del mateix tram, i la cerca salta després del '>'.
   Cada resposta (el '>', l'atribut, la cometa de tancament) es reutilitza
   mentre cau endavant: cada caràcter del text es mira un nombre fitat de
   vegades. */
const OBERTURA_D_IMG = /<img\b/gi;
const ATRIBUT_SRC = /\ssrc\s*=\s*(["'])/gi;

/* La primera casada de `buscat` (una expressió global) des de `des`, ja
   resumida per `respon`, o null. Per a preguntes amb un `des` que mai no
   recula: mentre la resposta d'abans encara cau endavant, val. */
function casadaEndavant(html, buscat, respon) {
  let trobat;
  return (des) => {
    if (trobat === undefined || (trobat !== null && trobat.index < des)) {
      buscat.lastIndex = des;
      const casa = buscat.exec(html);
      trobat = casa ? respon(casa, buscat.lastIndex) : null;
    }
    return trobat;
  };
}

export function srcsDeLesImg(html) {
  if (typeof html !== 'string') return [];
  const respon = (casa, fi) => ({ index: casa.index, fi, cometa: casa[1] });
  const tancament = casadaEndavant(html, />/g, respon);
  const atribut = casadaEndavant(html, ATRIBUT_SRC, respon);
  const cometes = { '"': casadaEndavant(html, /"/g, respon), "'": casadaEndavant(html, /'/g, respon) };
  const srcs = [];
  OBERTURA_D_IMG.lastIndex = 0;
  while (OBERTURA_D_IMG.exec(html) !== null) {
    const des = OBERTURA_D_IMG.lastIndex;
    const fiDelTram = tancament(des)?.index ?? html.length;
    let candidat = atribut(des);
    let valor = null;
    while (candidat && candidat.index < fiDelTram) {
      const tanca = cometes[candidat.cometa](candidat.fi);
      if (tanca) {
        valor = { text: html.slice(candidat.fi, tanca.index), fi: tanca.fi };
        break;
      }
      candidat = atribut(candidat.index + 1);
    }
    if (valor) {
      srcs.push(valor.text);
      OBERTURA_D_IMG.lastIndex = valor.fi;
    } else if (fiDelTram === html.length) {
      break;
    } else {
      OBERTURA_D_IMG.lastIndex = fiDelTram + 1;
    }
  }
  return srcs;
}

/**
 * Les imatges de la presentació d'una fitxa, en l'ordre del text i sense
 * repetir-ne cap: només les pròpies (esFontImatgePropia: un camí de casa, el
 * nostre servidor de fitxers o una referència opaca); una de fora no es
 * demana mai. Pura.
 */
export function imatgesDeLaPresentacio(html) {
  if (typeof html !== 'string' || !html) return [];
  const fonts = [];
  for (const src of srcsDeLesImg(html)) {
    const font = src.replaceAll('&amp;', '&').trim();
    if (font && esFontImatgePropia(font) && !fonts.includes(font)) fonts.push(font);
  }
  return fonts;
}

const idNet = (valor) => (valor == null ? '' : String(valor).trim());

/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3; Codex 2030, §1.5:
 * «titularitat explícita, no inferir-la pel nom, carpeta, e-mail o persona que
 * va pujar el fitxer») · El titular d'un element de l'Arxiu visual, només pels
 * identificadors que porta: { mena: 'organitzacio' | 'agent' | 'persona', id },
 * o null. L'entitat que el signa mana sobre qui l'ha pujat (author_org_id, la
 * columna que valida el servidor, com autorDe de config/navigation.js); després,
 * l'agent IA declarat (author_agent_id, el camp del contracte
 * llistaMitjansActor); i, sense cap dels dos, la persona propietària
 * (ownerUserId, la columna owner_user_id). El nom (source, author_name), la
 * carpeta i el correu no compten mai. Pura.
 * Correcció F1 de la revisió (Pla 2000) · L'agent només el pot dir un element
 * de l'administració (app_content), que no porta cap propietari: un element
 * amb una persona propietària (una publicació d'un veí, que el servidor
 * signa amb owner_user_id) és d'eixa persona, encara que el payload diga un
 * agent (elementDeFilaPublicada ja el lleva; esta és la segona guarda, fins
 * que el servidor tinga la columna author_agent_id validada).
 */
export function titularDelMitja(item) {
  if (!item || typeof item !== 'object') return null;
  const entitat = idNet(item.author_org_id ?? item.authorOrgId ?? item.author_entity_id);
  if (entitat) return { mena: 'organitzacio', id: entitat };
  const persona = idNet(item.ownerUserId ?? item.owner_user_id ?? item.author_user_id);
  const agent = idNet(item.author_agent_id ?? item.authorAgentId);
  if (agent && !persona) return { mena: 'agent', id: agent };
  if (persona) return { mena: 'persona', id: persona };
  return null;
}

/**
 * Els identificadors amb què un element de l'Arxiu pot dir que és d'este
 * actor: la persona, pel seu uid (la fila, dades.id, o l'usuari de la sessió);
 * una organització, pel seu id i els àlies que el catàleg (ENTITATS_SEED)
 * declara per a ESE id; un agent IA, pel seu id i, si el catàleg
 * (AGENTS_IA_SEED) el declara amb eixe id, el seu slug. Mai pel slug que torne
 * un servidor ni pel nom: un homònim d'un altre poble no hi entra. Pura.
 */
export function idsDeLActor(identitat, usuari = null) {
  const ids = new Set();
  if (!identitat) return ids;
  const mena = menaDeFitxa(identitat);
  if (mena === 'persona') {
    const uid = idNet(identitat.dades?.id) || idNet(usuari?.id);
    if (uid) ids.add(uid);
    return ids;
  }
  const id = idNet(identitat.id);
  if (!id) return ids;
  ids.add(id);
  const agent = mena === 'agent' ? AGENTS_IA_SEED.find((a) => a.id === id) : null;
  const declarats = mena === 'agent'
    ? (agent ? [agent.id, agent.slug] : [])
    : (ENTITATS_SEED.find((e) => e.id === id)?.alies || []);
  for (const alies of declarats) if (idNet(alies)) ids.add(idNet(alies));
  return ids;
}

/**
 * Els elements de l'Arxiu visual (mediaItems) amb titularitat explícita d'este
 * actor (titularDelMitja, de la seua mena i amb un dels seus `ids`): només
 * imatges pròpies (esFontImatgePropia, també una referència opaca). Pura.
 */
export function arxiuDeLActor(mediaItems, ids, mena) {
  if (!(ids instanceof Set) || !ids.size || !Array.isArray(mediaItems)) return [];
  return mediaItems.filter((item) => {
    const titular = titularDelMitja(item);
    if (!titular || titular.mena !== mena || !ids.has(titular.id)) return false;
    if (item.kind != null && item.kind !== 'image') return false;
    const src = typeof item.src === 'string' ? item.src.trim() : '';
    return Boolean(src) && esFontImatgePropia(src);
  });
}

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * El títol d'una foto pujada: la seua data, com la de la barra taronja
 * («Foto pujada el 12-10-2026»), mai el nom del fitxer (un UUID que ningú no
 * ha triat). Sense data, «Foto pujada». Pura.
 */
export function titolDeLaPujada(creat) {
  const data = typeof creat === 'string' && creat ? new Date(creat) : null;
  if (!data || Number.isNaN(data.getTime())) return TITOL.pujada;
  return `${TITOL.pujada} el ${dosXifres(data.getDate())}-${dosXifres(data.getMonth() + 1)}-${data.getFullYear()}`;
}

/**
 * La foto del compte de Google de la sessió: la de la identitat 'google'
 * (identity_data.avatar_url o picture) o, si no, user_metadata.picture. Només
 * una foto d'un proveïdor d'entrada (esAvatarDeProveidorOAuth); si no, ''. Pura.
 */
export function fotoGoogleDeLaSessio(usuari) {
  const identitats = Array.isArray(usuari?.identities) ? usuari.identities : [];
  const google = identitats.find((identitat) => identitat?.provider === 'google');
  const candidates = [google?.identity_data?.avatar_url, google?.identity_data?.picture, usuari?.user_metadata?.picture];
  for (const candidata of candidates) {
    const font = typeof candidata === 'string' ? candidata.trim() : '';
    if (font && esAvatarDeProveidorOAuth(font)) return font;
  }
  return '';
}

/* La més antiga d'un grup de còpies: per data (les que no en tenen, al
   final) i, a igual data, per ruta. */
const perAntiguitat = (a, b) => {
  if (a.creat && b.creat && a.creat !== b.creat) return a.creat < b.creat ? -1 : 1;
  if (a.creat && !b.creat) return -1;
  if (!a.creat && b.creat) return 1;
  return String(a.ref).localeCompare(String(b.ref));
};

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * La galeria: una entrada per foto (la mateixa font, una sola vegada) i les
 * còpies sobreres que «Eliminar duplicats» esborraria. Pura.
 *   · `mitjans`: el que torna llistaElsMeusMitjans (de la més nova a la més vella);
 *   · `avatar`, `capcalera`: les fonts actives de la fitxa (amb l'esborrany);
 *   · `google`, `canonica`: la foto de Google de la sessió i la canònica del pilot;
 *   · `protegides`: les fonts que no es poden esborrar encara que no siguen
 *     les actives de l'esborrany (les desades a la fila, la de la sessió);
 *   · `presentacio` (relleu del Pla 2000): les imatges de la presentació
 *     d'una organització o d'un agent (imatgesDeLaPresentacio);
 *   · `arxiu` (relleu del Pla 2000): els elements de l'Arxiu visual amb
 *     titularitat explícita de l'actor (arxiuDeLActor); l'entrada en porta
 *     l'element (`item`) per al visor;
 *   · `titols`: el títol d'un origen per a esta mena (el «Logotip actual»
 *     d'una organització).
 * Dues fotos del servidor amb el mateix etag i la mateixa mida són còpies: se
 * n'hi conserven les actives i les protegides (si no n'hi ha cap, la més
 * antiga) i la resta de les esborrables són `sobreres`. Mai una activa ni una
 * protegida. Cap foto de la presentació ni de l'Arxiu és esborrable d'ací.
 * Torna { fotos, sobreres, grupsRepetits }: les actives primer i, després, en
 * l'ordre de les fonts; `grupsRepetits`, quantes fotos tenen còpies sobreres.
 */
export function construeixGaleria({
  mitjans = [], avatar = '', capcalera = '', google = '', canonica = '', protegides = [],
  presentacio = [], arxiu = [], titols = {},
} = {}) {
  const clausProtegides = new Set((Array.isArray(protegides) ? protegides : []).map(clauDeFont).filter(Boolean));
  const titolDe = (origen) => textNet(titols?.[origen]) || TITOL[origen];
  const perClau = new Map();
  const ordre = [];
  const afig = (entrada) => {
    if (!entrada.clau || perClau.has(entrada.clau)) return perClau.get(entrada.clau) || null;
    perClau.set(entrada.clau, entrada);
    ordre.push(entrada);
    return entrada;
  };
  const base = (font, origen) => ({
    clau: clauDeFont(font), font, ref: null, titol: titolDe(origen), origen, esborrable: false,
    etag: null, mida: null, creat: null, avatarActiu: false, capcaleraActiva: false, google: false, duplicat: false,
    protegida: false, arxiu: false, item: null,
  });

  for (const mitja of Array.isArray(mitjans) ? mitjans : []) {
    if (typeof mitja?.ref !== 'string' || !mitja.ref.startsWith('sdp-media://')) continue;
    afig({
      ...base(mitja.ref, 'pujada'),
      ref: mitja.ref,
      titol: titolDeLaPujada(mitja.creat),
      esborrable: mitja.esborrable === true,
      etag: typeof mitja.etag === 'string' && mitja.etag ? mitja.etag : null,
      mida: Number.isFinite(mitja.mida) ? mitja.mida : null,
      creat: typeof mitja.creat === 'string' && mitja.creat ? mitja.creat : null,
    });
  }

  const marca = (font, origen, canvis) => {
    const clau = clauDeFont(font);
    if (!clau) return;
    const entrada = perClau.get(clau) || afig(base(font.trim(), origen));
    Object.assign(entrada, canvis(entrada));
  };
  marca(avatar, 'avatar', () => ({ avatarActiu: true }));
  marca(capcalera, 'capcalera', () => ({ capcaleraActiva: true }));
  marca(google, 'google', () => ({ google: true, titol: TITOL.google }));
  marca(canonica, 'canonica', (entrada) => (entrada.origen === 'canonica' || entrada.origen === 'avatar'
    ? { titol: TITOL.canonica } : {}));

  for (const font of Array.isArray(presentacio) ? presentacio : []) {
    if (textNet(font)) afig(base(font.trim(), 'presentacio'));
  }
  /* Un element de l'Arxiu que ja hi és (el logotip, una pujada) hi deixa el
     seu element per al visor; si no, una entrada pròpia amb el seu títol. */
  for (const item of Array.isArray(arxiu) ? arxiu : []) {
    const font = textNet(item?.src);
    const clau = clauDeFont(font);
    if (!clau) continue;
    const previa = perClau.get(clau);
    if (previa) {
      previa.arxiu = true;
      previa.item = previa.item || item;
      continue;
    }
    afig({ ...base(font, 'arxiu'), titol: textNet(item.title) || TITOL.arxiu, arxiu: true, item });
  }

  for (const entrada of ordre) entrada.protegida = clausProtegides.has(entrada.clau);

  /* Les còpies: només les del servidor, pel contingut (etag i mida). */
  const grups = new Map();
  for (const entrada of ordre) {
    if (!entrada.ref || entrada.etag == null || entrada.mida == null) continue;
    const clau = `${entrada.etag}|${entrada.mida}`;
    grups.set(clau, [...(grups.get(clau) || []), entrada]);
  }
  const sobreres = [];
  let grupsRepetits = 0;
  for (const grup of grups.values()) {
    if (grup.length < 2) continue;
    const intocables = grup.filter((entrada) => entrada.avatarActiu || entrada.capcaleraActiva || entrada.protegida);
    const conservades = new Set(intocables.length ? intocables : [[...grup].sort(perAntiguitat)[0]]);
    let ambSobrera = false;
    for (const entrada of grup) {
      if (conservades.has(entrada)) continue;
      entrada.duplicat = true;
      if (entrada.esborrable) {
        sobreres.push(entrada);
        ambSobrera = true;
      }
    }
    if (ambSobrera) grupsRepetits += 1;
  }

  const activa = (entrada) => entrada.avatarActiu || entrada.capcaleraActiva;
  const fotos = [...ordre.filter(activa), ...ordre.filter((entrada) => !activa(entrada))];
  return { fotos, sobreres, grupsRepetits };
}

/* «de» davant del nom, amb l'apòstrof davant de vocal o d'una h muda (mai
   davant d'una i o una u semiconsonants: «de IAIA MarIA»). */
const deNom = (nom) => (/^h?(?![iu][aeiouàèéíòóú])[aeiouàèéíòóú]/i.test(nom) ? `d’${nom}` : `de ${nom}`);

/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · Els textos de
 * cada mena. La persona, en segona persona, com sempre; una organització, amb
 * el seu logotip (la paraula de la casa, PerfilEditor · ETIQUETA_LOGOTIP); un
 * agent IA, amb el seu avatar. Les columnes, de CAMPS_FITXA (valorPerDesar).
 */
export function textosDeMultimedia(mena, nom = '') {
  const qui = deNom(textNet(nom) || 'esta fitxa');
  if (mena === 'persona') {
    return {
      lead: 'Les fotos que has pujat al teu perfil, l’avatar i la capçalera. Tria’n una per a posar-la o elimina les còpies repetides.',
      bloc: 'Les teues fotos',
      buit: 'Encara no tens cap foto.',
      lectura: 'Ara la fitxa es veu en lectura: de moment no pots canviar ni eliminar cap foto.',
      posaAvatar: 'Posa com a avatar',
      avatarActiu: 'Avatar actiu',
      titolAvatar: TITOL.avatar,
      jaAvatar: 'Ja és el teu avatar.',
      jaCapcalera: 'Ja és la teua capçalera.',
      errorAvatar: 'No s’ha pogut canviar l’avatar.',
    };
  }
  const logotip = mena === 'organitzacio';
  return {
    lead: `Les fotos que es pot provar que són ${qui}: ${logotip ? 'el logotip' : 'l’avatar'}, la capçalera, les de la presentació i les de l’Arxiu visual que porten el seu identificador. Tria’n una per a posar-la.`,
    bloc: `Les fotos ${qui}`,
    buit: `Encara no hi ha cap foto amb titularitat ${qui}.`,
    lectura: 'Ara la fitxa es veu en lectura: de moment no pots canviar cap foto.',
    posaAvatar: logotip ? 'Posa com a logotip' : 'Posa com a avatar',
    avatarActiu: logotip ? 'Logotip actiu' : 'Avatar actiu',
    titolAvatar: logotip ? 'Logotip actual' : TITOL.avatar,
    jaAvatar: logotip ? `Ja és el logotip ${qui}.` : `Ja és l’avatar ${qui}.`,
    jaCapcalera: `Ja és la capçalera ${qui}.`,
    errorAvatar: logotip ? 'No s’ha pogut canviar el logotip.' : 'No s’ha pogut canviar l’avatar.',
  };
}

/* Una miniatura per cel·la (un hook per cel·la): la referència opaca, pel
   port; un camí de /assets, amb resolRecursPropi; una foto de fora (la de
   Google), tal qual però sense referent. alt="": el títol de la targeta, al
   costat, ja la nomena (com l'Avatar de Pedra Seca amb el nom escrit).
   Relleu del Pla 2000 · La URL que el port torna per a una referència opaca
   puja a la galeria (onResolta): el visor la pinta sense tornar-la a demanar.
   Correcció F2 de la revisió (auditoria Codex 2030, §4.1: primer el port i
   DESPRÉS el filtre d'imatges pròpies) · Si el port no la sap resoldre (una
   URL firmada que falla torna la referència tal qual, storage.js), o torna
   una URL que no és dels nostres, cap <img> i res no puja al visor: mai
   l'esquema opac cru. */
function Miniatura({ font, onResolta }) {
  const opaca = font.startsWith('sdp-media://');
  const resolta = useResolvedAsset(opaca ? font : '');
  const delPort = opaca && resolta && !esMitjaOpac(resolta) && esFontImatgePropia(resolta) ? resolta : '';
  const propia = esFontImatgePropia(font);
  const src = opaca ? delPort : propia ? resolRecursPropi(font) : font;
  useEffect(() => {
    if (delPort) onResolta?.(font, delPort);
  }, [font, delPort, onResolta]);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className="perfil-multimedia__imatge"
      loading="lazy"
      decoding="async"
      referrerPolicy={propia ? undefined : 'no-referrer'}
    />
  );
}

const ESTAT_INICIAL = Object.freeze({ estat: 'inactiu', mitjans: [], error: null });
const CAP = Object.freeze([]);

/* Si hi ha servidor de fitxers: la capacitat del port i, a més, el mode
   remot (en llavor i en local l'adaptador hi torna sempre []). Un port que
   no sap dir-ne el mode no en té. */
function ambServidorDeFitxers(config) {
  if (!teCapacitat('mitjansPropis')) return false;
  try {
    return getRuntimeDataMode(config) === 'remote';
  } catch {
    return false;
  }
}

/* Revisió adversarial (18-10-2026) · Una publicació antiga (una nota, el Mur)
   pot portar l'enllaç d'una foto pujada al Perfil: el diàleg ho diu abans
   d'esborrar, perquè no es pot saber sense llegir-les totes. */
const AVIS_PUBLICACIONS = 'Si l’havies posada en alguna publicació, allí deixarà de vore’s.';

/* Ordre del Mestre (18-10-2026) · La capacitat que dirà si una foto està en
   ús en alguna publicació (el contracte comprovaUsImatge que dissenya Codex,
   auditoria 261018_2030). Encara no és al contracte: teCapacitat torna false i
   l'esborrat queda tancat. */
export const CAPACITAT_INTEGRITAT = 'integritatMitjans';
export const MOTIU_SENSE_INTEGRITAT = 'De moment no es pot eliminar: el servidor encara no pot comprovar si alguna publicació la fa servir.';
export const AVIS_SENSE_INTEGRITAT = 'Eliminar fotos s’activarà quan el servidor puga comprovar si alguna publicació les fa servir. Mentrestant les pots vore i posar d’avatar o de capçalera.';

/* El text que diu per què no es pot eliminar una foto (avatar, capçalera,
   desada o sense la comprovació d'ús del servidor). */
function motiuDeBloqueig(entrada, ambIntegritat) {
  if (entrada.avatarActiu) return 'És el teu avatar: posa’n un altre abans d’eliminar-la.';
  if (entrada.capcaleraActiva) return 'És la teua capçalera: posa’n una altra abans d’eliminar-la.';
  if (entrada.protegida) return 'La teua fitxa la fa servir (la foto o la presentació que veu el veïnat): no es pot eliminar mentre la tinga.';
  if (!ambIntegritat) return MOTIU_SENSE_INTEGRITAT;
  return '';
}

/* El primer botó actiu de les accions d'una targeta (o del visor), o null; si
   no en té cap d'actiu, el primer actiu de dins (la miniatura). */
const primerBotoActiu = (element) => {
  if (!element) return null;
  const actiu = (botons) => [...botons].find((boto) => !boto.disabled) || null;
  return actiu(element.querySelectorAll('.perfil-multimedia__accions button')) || actiu(element.querySelectorAll('button'));
};

/* Es pot obrir al visor: una foto pròpia (també una referència opaca). La de
   Google no: VisorImatges la demanaria amb referent. */
const esObrible = (entrada) => esFontImatgePropia(entrada.font);

/* Les files del panell que no diuen res d'una foto que no és de cap article
   ni de cap poble (una pujada, el logotip): el poble i «Publicat a». */
const FILES_SENSE_ARTICLE = Object.freeze(['poble', 'publicat']);

export function DetallMultimedia({ identitat, config }) {
  const perfil = usePerfilOpcional();
  const { mediaItems } = useMultimedia();
  const dades = useMemo(() => identitat?.dades || {}, [identitat]);
  const usuari = perfil?.usuari || null;
  const guardarCampPerfil = perfil?.guardarCampPerfil;
  const autodesament = perfil?.autodesament;
  /* La configuració del port: la del Perfil (PerfilShell), o la de la cua. */
  const configDelPort = config ?? autodesament?.context ?? undefined;
  const idBase = useId();
  const idAvisIntegritat = `${idBase}-sense-integritat`;
  const idMotiuVisor = `${idBase}-visor-motiu`;

  const potEditar = potEditarFitxa(identitat);
  const mena = menaDeFitxa(identitat);
  const persona = mena === 'persona';
  const textos = useMemo(() => textosDeMultimedia(mena, identitat?.nom), [mena, identitat?.nom]);
  const id = identitat?.id;
  /* La clau de la cua, com la de l'editor: sense àmbit o en lectura, cap. */
  const refCua = useMemo(() => (autodesament && potEditar && id != null ? {
    ambit: autodesament.ambit, context: autodesament.context, entitat: ENTITATS_FITXA[mena], id,
  } : null), [autodesament, potEditar, mena, id]);
  const esborrany = useAutodesament(refCua).camps;
  const fitxa = useMemo(
    () => (identitat ? documentDeFitxa(identitat, esborrany || {}) : null),
    [identitat, esborrany],
  );
  const avatarActiu = useMemo(
    () => (identitat ? avatarDeLaFitxa(fitxa, esborrany, identitat) : ''),
    [identitat, fitxa, esborrany],
  );
  const capcaleraActiva = fitxa?.heroImage || '';

  /* 1 · Les fotos del servidor de fitxers, si n'hi ha (mode remot i el port
     en sap), només de la persona: la carpeta del servidor no diu de quina
     organització és una foto. Amb servidor, naix carregant: cap «Encara no
     tens cap foto.» abans de llegir-les. */
  const ambBiblioteca = useMemo(() => persona && ambServidorDeFitxers(configDelPort), [persona, configDelPort]);
  /* Sense la comprovació d'ús del servidor, cap esborrat (CAPACITAT_INTEGRITAT). */
  const ambIntegritat = teCapacitat(CAPACITAT_INTEGRITAT);
  const [llistat, setLlistat] = useState(() => (ambBiblioteca ? { ...ESTAT_INICIAL, estat: 'carregant' } : ESTAT_INICIAL));
  useEffect(() => {
    if (!ambBiblioteca) {
      setLlistat(ESTAT_INICIAL);
      return undefined;
    }
    let viu = true;
    setLlistat((previ) => ({ ...previ, estat: 'carregant', error: null }));
    Promise.resolve()
      .then(() => llistaElsMeusMitjans(configDelPort))
      .then((mitjans) => {
        if (viu) setLlistat({ estat: 'llest', mitjans: Array.isArray(mitjans) ? mitjans : [], error: null });
      })
      .catch((error) => {
        if (viu) setLlistat({ estat: 'error', mitjans: [], error: error?.message || 'No s’ha pogut llegir la teua biblioteca de fotos.' });
      });
    return () => { viu = false; };
  }, [ambBiblioteca, configDelPort]);

  /* 3 i 4 · La foto de Google de la sessió i, per al compte de Javi, la
     canònica: només de la persona. */
  const fotoGoogle = useMemo(() => (persona ? fotoGoogleDeLaSessio(usuari) : ''), [persona, usuari]);
  /* La fila, només per l'id o el slug: el seu `email` el copia PerfilContext
     de la sessió sense dir si GoTrue l'ha confirmat, i el correu només compta
     amb l'usuari de sessió sencer (esComptePersonaPilot). */
  const esPilot = persona && (esComptePersonaPilot(usuari) || esComptePersonaPilot({ id: dades.id, slug: dades.slug }));

  /* 5 · L'Arxiu visual, només per titularitat explícita. 6 · Les imatges de
     la presentació d'una organització o d'un agent (la desada i la de
     l'esborrany). */
  const idsActor = useMemo(() => idsDeLActor(identitat, usuari), [identitat, usuari]);
  const delArxiu = useMemo(() => arxiuDeLActor(mediaItems, idsActor, mena), [mediaItems, idsActor, mena]);
  const presentacioEsborrany = fitxa?.content;
  const dePresentacio = useMemo(() => (persona ? CAP : [
    ...imatgesDeLaPresentacio(dades.presentacio_html), ...imatgesDeLaPresentacio(presentacioEsborrany),
  ]), [persona, dades, presentacioEsborrany]);

  /* Les fonts que no s'esborren mai, encara que l'esborrany de la cua diga
     una altra cosa: les desades a la fila (les que veu el veïnat mentre un
     esborrany és pendent o rebutjat), les actives de l'esborrany, la de la
     identitat i la de les metadades de la sessió. */
  const metaAvatar = usuari?.user_metadata?.avatar_url;
  /* I les que cita la presentació, la desada i la de l'esborrany (fotesDelText). */
  const protegides = useMemo(() => [
    dades.avatar_url, dades.hero_url, avatarActiu, capcaleraActiva, identitat?.avatar, metaAvatar,
    ...fotesDelText(dades.presentacio_html), ...fotesDelText(presentacioEsborrany),
  ].filter((font) => typeof font === 'string' && font.trim()), [dades, avatarActiu, capcaleraActiva, identitat, metaAvatar, presentacioEsborrany]);
  const clausProtegides = useMemo(() => new Set(protegides.map(clauDeFont).filter(Boolean)), [protegides]);

  const { fotos, sobreres, grupsRepetits } = useMemo(() => construeixGaleria({
    mitjans: llistat.mitjans,
    avatar: avatarActiu,
    capcalera: capcaleraActiva,
    google: fotoGoogle,
    canonica: esPilot ? PERSONA_PILOT.avatar : '',
    protegides,
    presentacio: dePresentacio,
    arxiu: delArxiu,
    titols: { avatar: textos.titolAvatar },
  }), [llistat.mitjans, avatarActiu, capcaleraActiva, fotoGoogle, esPilot, protegides, dePresentacio, delArxiu, textos]);

  const [limit, setLimit] = useState(LIMIT_MINIATURES);
  const [desant, setDesant] = useState(false);
  const [missatge, setMissatge] = useState(null);
  /* Què es vol esborrar: { tipus: 'una' | 'duplicats', entrades }, o null. */
  const [aEsborrar, setAEsborrar] = useState(null);
  const [esborrant, setEsborrant] = useState(false);
  /* La foto oberta al visor, per la seua clau (no per la posició: posar-la
     d'avatar la passa al davant de la galeria), o null. */
  const [visor, setVisor] = useState(null);
  /* Les URL que el port ha tornat per a les referències opaques de la graella. */
  const [resoltes, setResoltes] = useState(() => new Map());
  const anotaResolta = useCallback((font, url) => {
    setResoltes((previes) => (previes.get(font) === url ? previes : new Map(previes).set(font, url)));
  }, []);
  const muntat = useRef(true);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; }; }, []);
  /* Com «Eixir» (DetallAjust) · El resultat d'un esborrat es diu quan la
     confirmació ja s'ha tancat: nascut amb el modal obert, el lector no
     l'anunciaria (la pàgina és inert). */
  const missatgePendent = useRef(null);
  /* El focus després d'un esborrat: la targeta (o el Bloc sencer) que l'ha
     obert ja no hi és i el <dialog> no hi pot tornar (com GestioMembres,
     correcció 261008). Este efecte corre després del de Dialeg (el fill). */
  const refLlista = useRef(null);
  const refBuit = useRef(null);
  const refAccionsVisor = useRef(null);
  const focusDespresDEsborrar = useRef(false);
  useEffect(() => {
    if (aEsborrar) return;
    if (missatgePendent.current != null) {
      setMissatge(missatgePendent.current);
      missatgePendent.current = null;
    }
    if (focusDespresDEsborrar.current) {
      focusDespresDEsborrar.current = false;
      (refLlista.current || refBuit.current)?.focus?.();
    }
  }, [aEsborrar]);

  /* «Mostra’n més» desapareix amb l'última tanda: el focus, al primer botó
     actiu de la primera foto nova (o a la llista). */
  const focusCarta = useRef(null);
  useEffect(() => {
    const index = focusCarta.current;
    if (index == null) return;
    focusCarta.current = null;
    const llista = refLlista.current;
    (primerBotoActiu(llista?.children?.[index]) || llista)?.focus?.();
  }, [limit]);

  /* «Posa com a…»: mentre es desa, els botons es desactiven, i el de la foto
     que ja és l'activa es queda desactivat. Si el focus s'ha perdut, a la
     mateixa targeta (o a la llista); amb el visor obert, a les seues accions:
     el fons és inert i el focus no pot eixir del visor. */
  const focusPosa = useRef(null);
  const [fiDePosa, setFiDePosa] = useState(0);
  useEffect(() => {
    const desti = focusPosa.current;
    if (desti == null) return;
    focusPosa.current = null;
    /* Pla 2000 (integració; Llei 6 de Pedra Seca, encapsulament) · El focus
       es llig a l'arrel de la llista: dins del Web Component, el seu shadow
       root (el `document` hi veuria l'amfitrió, mai perdut); fora, el
       document. Perdut: enlloc o al body del seu document. */
    const arrel = refLlista.current?.isConnected ? refLlista.current.getRootNode() : document;
    const actiu = arrel.activeElement ?? null;
    if (actiu && actiu !== actiu.ownerDocument?.body && !actiu.disabled) return;
    if (desti.enVisor && refAccionsVisor.current) {
      primerBotoActiu(refAccionsVisor.current)?.focus?.();
      return;
    }
    const llista = refLlista.current;
    const targeta = llista ? [...llista.children].find((li) => li.dataset.clau === desti.clau) : null;
    (primerBotoActiu(targeta) || llista)?.focus?.();
  }, [fiDePosa]);

  /* camp: 'logoImage' (l'avatar o el logotip) o 'heroImage' (la capçalera),
     a la columna de la seua mena (valorPerDesar: CAMPS_FITXA). */
  const posa = useCallback(async (entrada, camp, { enVisor = false } = {}) => {
    if (!guardarCampPerfil || !identitat || !potEditar) return;
    setDesant(true);
    setMissatge(null);
    const avatar = camp === 'logoImage';
    try {
      const { columna, valor } = valorPerDesar(mena, camp, entrada.font);
      /* L'esborrany del camp a la cua guanyaria a la tria: primer es descarta. */
      if (refCua) cuaDesament.descarta(refCua, camp);
      await guardarCampPerfil(columna, valor, identitat.id);
      if (muntat.current) {
        setMissatge({ to: 'exit', text: avatar ? textos.jaAvatar : textos.jaCapcalera });
      }
    } catch (error) {
      if (muntat.current) {
        setMissatge({
          to: 'error',
          text: error?.message || (avatar ? textos.errorAvatar : 'No s’ha pogut canviar la capçalera.'),
        });
      }
    } finally {
      if (muntat.current) {
        focusPosa.current = { clau: entrada.clau, enVisor };
        setDesant(false);
        setFiDePosa((n) => n + 1);
      }
    }
  }, [guardarCampPerfil, identitat, potEditar, refCua, mena, textos]);

  const confirmaEsborrat = useCallback(async () => {
    /* Només la persona esborra, i només amb la comprovació d'ús del servidor. */
    if (!aEsborrar || esborrant || !ambIntegritat || !persona) return;
    /* Mai una protegida (l'avatar o la capçalera actius o desats, la de la
       sessió), encara que hagen canviat mentre la confirmació era oberta. */
    const entrades = aEsborrar.entrades.filter((entrada) => entrada.esborrable && !clausProtegides.has(entrada.clau));
    setEsborrant(true);
    const esborrades = [];
    let error = null;
    for (const entrada of entrades) {
      try {
        await esborraElMeuMitja(entrada.ref, configDelPort);
        esborrades.push(entrada.ref);
      } catch (e) {
        error = e;
        break;
      }
    }
    if (!muntat.current) return;
    if (esborrades.length) {
      setLlistat((previ) => ({ ...previ, mitjans: previ.mitjans.filter((mitja) => !esborrades.includes(mitja.ref)) }));
    }
    const n = esborrades.length;
    const duplicats = aEsborrar.tipus === 'duplicats';
    if (error) {
      const fetes = n ? `${n === 1 ? 'S’ha eliminat 1 foto' : `S’han eliminat ${n} fotos`}, però no totes. ` : '';
      missatgePendent.current = { to: 'error', text: `${fetes}${error?.message || 'No s’ha pogut eliminar la foto.'}` };
    } else if (n === 0) {
      /* Res esborrat (la foto s'ha tornat protegida mentre es confirmava): cap èxit. */
      missatgePendent.current = { to: 'info', text: duplicats ? 'No s’ha eliminat cap còpia.' : 'No s’ha eliminat cap foto.' };
    } else if (duplicats) {
      missatgePendent.current = { to: 'exit', text: n === 1 ? 'S’ha eliminat 1 còpia repetida.' : `S’han eliminat ${n} còpies repetides.` };
    } else {
      missatgePendent.current = { to: 'exit', text: 'S’ha eliminat la foto.' };
    }
    focusDespresDEsborrar.current = n > 0;
    setEsborrant(false);
    setAEsborrar(null);
  }, [aEsborrar, esborrant, ambIntegritat, persona, clausProtegides, configDelPort]);

  const tancaConfirmacio = useCallback(() => { if (!esborrant) setAEsborrar(null); }, [esborrant]);

  const visibles = useMemo(() => fotos.slice(0, limit), [fotos, limit]);
  /* El visor passa per les fotos de la graella que s'hi poden obrir. */
  const delVisor = useMemo(() => visibles.filter(esObrible), [visibles]);
  const indexVisor = visor == null ? -1 : delVisor.findIndex((entrada) => entrada.clau === visor);
  /* La foto oberta ja no hi és (s'ha eliminat, la galeria ha canviat): el
     visor es tanca. Ajust en pintar, sense efecte. */
  if (visor != null && indexVisor < 0) setVisor(null);
  const llistaVisor = useMemo(() => delVisor.map((entrada) => ({
    ...(entrada.item || {}),
    src: entrada.font,
    srcDelPort: entrada.font.startsWith('sdp-media://') ? resoltes.get(entrada.font) || '' : '',
    title: entrada.titol,
    /* La foto d'una persona: el visor no en mostra cap GPS. */
    ...(persona ? { ambit: 'persona' } : {}),
  })), [delVisor, resoltes, persona]);
  const tancaVisor = useCallback(() => setVisor(null), []);
  const canviaVisor = useCallback((nou) => {
    const entrada = delVisor[nou];
    if (entrada) setVisor(entrada.clau);
  }, [delVisor]);

  if (!identitat) return null;

  const ocupat = desant || esborrant;
  const nSobreres = sobreres.length;
  const textRepetides = `${nSobreres === 1 ? 'Tens 1 còpia repetida' : `Tens ${nSobreres} còpies repetides`} ${grupsRepetits === 1 ? 'd’una foto que ja tens' : `de ${grupsRepetits} fotos que ja tens`}. Se’n conserva una de cada: l’activa o, si no n’hi ha, la més antiga.`;
  const nAEsborrar = aEsborrar?.entrades.length || 0;

  /* Les accions del Perfil al panell del visor, per a la foto oberta. */
  const oberta = indexVisor >= 0 ? delVisor[indexVisor] : null;
  const motiuOberta = oberta && persona && oberta.esborrable ? motiuDeBloqueig(oberta, ambIntegritat) : '';
  const filesDelVisor = oberta ? [{
    clau: 'accions-perfil',
    etiqueta: 'Accions',
    valor: (
      <div ref={refAccionsVisor} className="perfil-multimedia__accions">
        <Boto
          varietat="primari"
          ple
          onClick={() => posa(oberta, 'logoImage', { enVisor: true })}
          disabled={!potEditar || ocupat || oberta.avatarActiu}
        >
          {textos.posaAvatar}
        </Boto>
        <Boto
          varietat="secundari"
          ple
          onClick={() => posa(oberta, 'heroImage', { enVisor: true })}
          disabled={!potEditar || ocupat || oberta.capcaleraActiva}
        >
          Posa com a capçalera
        </Boto>
        {persona && oberta.esborrable ? (
          <>
            <Boto
              varietat="perill"
              ple
              onClick={() => {
                /* El visor es tanca (el focus torna a la miniatura) i s'obri la
                   confirmació: cap modal damunt d'un altre. */
                setVisor(null);
                setAEsborrar({ tipus: 'una', entrades: [oberta] });
              }}
              disabled={!potEditar || ocupat || Boolean(motiuOberta)}
              aria-describedby={motiuOberta ? idMotiuVisor : undefined}
            >
              Elimina
            </Boto>
            {motiuOberta ? <span id={idMotiuVisor}>{motiuOberta}</span> : null}
          </>
        ) : null}
      </div>
    ),
  }] : CAP;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="Multimèdia"
      lead={textos.lead}
      {...dataDeFila(dades)}
      topBarData={{
        authorName: identitat.nom,
        authorAvatar: avatarDeLaBarraDeFitxa(identitat, avatarActiu),
        authorLocation: pobleDeFitxa(identitat, perfil?.identitats),
        authorHref: rutaDeFitxaPublica(identitat),
      }}
    >
      <div className="perfil-compte">
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
        {!potEditar ? (
          <Alerta to="info" viva={false}>{textos.lectura}</Alerta>
        ) : null}

        {persona && nSobreres > 0 ? (
          <Bloc titol="Fotos repetides">
            <p className="perfil-compte__text">{textRepetides}</p>
            <div className="perfil-compte__accions">
              <Boto
                varietat="perill"
                onClick={() => setAEsborrar({ tipus: 'duplicats', entrades: sobreres })}
                disabled={!potEditar || ocupat || !ambIntegritat}
                aria-describedby={ambIntegritat ? undefined : idAvisIntegritat}
              >
                Eliminar duplicats
              </Boto>
            </div>
            {!ambIntegritat ? <p id={idAvisIntegritat} className="sdp-camp__ajuda">{AVIS_SENSE_INTEGRITAT}</p> : null}
          </Bloc>
        ) : null}

        <Bloc titol={textos.bloc}>
          {persona && !ambBiblioteca ? (
            <p className="perfil-compte__text">En este mode no hi ha servidor de fitxers: es veuen les fotos de la fitxa.</p>
          ) : null}
          {llistat.estat === 'carregant' ? <Carregant etiqueta="Carregant les teues fotos…" /> : null}
          {llistat.estat === 'error' ? <Alerta to="error">{llistat.error}</Alerta> : null}
          {/* Correcció de la revisió · El buit només amb la llista llegida (o sense
              servidor): ni abans de llegir-la ni al costat d'un error. */}
          {fotos.length === 0 && (!ambBiblioteca || llistat.estat === 'llest') ? (
            <p ref={refBuit} tabIndex={-1} className="perfil-compte__text">{textos.buit}</p>
          ) : null}
          {fotos.length > 0 ? (
            <ul ref={refLlista} tabIndex={-1} className="perfil-multimedia__graella" aria-label={textos.bloc}>
              {visibles.map((entrada, index) => {
                const motiu = motiuDeBloqueig(entrada, ambIntegritat);
                const idMotiu = `${idBase}-${index}-motiu`;
                const idTitol = `${idBase}-${index}-titol`;
                const miniatura = <Miniatura font={entrada.font} onResolta={anotaResolta} />;
                return (
                  <li key={entrada.clau} data-clau={entrada.clau} className="perfil-multimedia__targeta">
                    {/* Relleu del Pla 2000 · La miniatura d'una foto pròpia obri el
                        visor: el disparador de la casa (.sdp-visor__obridor,
                        components.css), el mateix de les publicacions. */}
                    {esObrible(entrada) ? (
                      <button
                        type="button"
                        className="sdp-visor__obridor"
                        aria-haspopup="dialog"
                        aria-label="Obri al visor"
                        aria-describedby={idTitol}
                        onClick={() => setVisor(entrada.clau)}
                      >
                        <span className="perfil-multimedia__marc">{miniatura}</span>
                      </button>
                    ) : (
                      <div className="perfil-multimedia__marc">{miniatura}</div>
                    )}
                    <div className="perfil-multimedia__info">
                      <p id={idTitol} className="perfil-multimedia__titol">{entrada.titol}</p>
                      <div className="perfil-multimedia__etiquetes">
                        {entrada.avatarActiu ? <Insignia to="exit">{textos.avatarActiu}</Insignia> : null}
                        {entrada.capcaleraActiva ? <Insignia to="exit">Capçalera activa</Insignia> : null}
                        {entrada.google ? <Insignia to="info">De Google</Insignia> : null}
                        {entrada.arxiu ? <Insignia to="info">De l’Arxiu visual</Insignia> : null}
                        {/* Només una còpia que «Eliminar duplicats» esborraria: la
                            d'una altra carpeta (o del llegat) no es pot eliminar d'ací. */}
                        {entrada.duplicat && entrada.esborrable ? <Insignia to="avis">Còpia repetida</Insignia> : null}
                      </div>
                    </div>
                    <div className="perfil-multimedia__accions">
                      <Boto
                        varietat="primari"
                        ple
                        onClick={() => posa(entrada, 'logoImage')}
                        disabled={!potEditar || ocupat || entrada.avatarActiu}
                        aria-describedby={idTitol}
                      >
                        {textos.posaAvatar}
                      </Boto>
                      <Boto
                        varietat="secundari"
                        ple
                        onClick={() => posa(entrada, 'heroImage')}
                        disabled={!potEditar || ocupat || entrada.capcaleraActiva}
                        aria-describedby={idTitol}
                      >
                        Posa com a capçalera
                      </Boto>
                      {persona && entrada.esborrable ? (
                        <>
                          <Boto
                            varietat="perill"
                            ple
                            onClick={() => setAEsborrar({ tipus: 'una', entrades: [entrada] })}
                            disabled={!potEditar || ocupat || Boolean(motiu)}
                            aria-describedby={motiu ? `${idTitol} ${idMotiu}` : idTitol}
                          >
                            Elimina
                          </Boto>
                          {motiu ? <p id={idMotiu} className="sdp-camp__ajuda">{motiu}</p> : null}
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {fotos.length > visibles.length ? (
            <div className="perfil-compte__accions">
              <Boto
                varietat="secundari"
                onClick={() => {
                  focusCarta.current = limit;
                  setLimit((previ) => previ + LIMIT_MINIATURES);
                }}
              >
                Mostra’n més
              </Boto>
            </div>
          ) : null}
        </Bloc>
      </div>

      {/* Relleu del Pla 2000 · El visor complet de l'Arxiu, amb el panell
          desplegat (les accions del Perfil, al davant) i sense el poble ni
          «Publicat a» d'una foto que no és de cap article. Abans de la
          confirmació: en tancar-se per a «Elimina», el focus torna a la
          miniatura abans que la confirmació l'anote com el seu retorn. */}
      <VisorDeLArxiu
        llista={llistaVisor}
        index={indexVisor}
        onTanca={tancaVisor}
        onCanvi={canviaVisor}
        filesInicials={filesDelVisor}
        ometFiles={oberta?.item?.article || oberta?.item?.poble ? CAP : FILES_SENSE_ARTICLE}
        infoInicial
      />

      <DialegConfirmacio
        obert={Boolean(aEsborrar)}
        onTanca={tancaConfirmacio}
        onConfirma={confirmaEsborrat}
        destructiu
        carregant={esborrant}
        titol={aEsborrar?.tipus === 'duplicats' ? 'Vols eliminar les còpies repetides?' : 'Vols eliminar esta foto?'}
        descripcio={`${aEsborrar?.tipus === 'duplicats'
          ? `${nAEsborrar === 1
            ? 'S’esborrarà 1 còpia del servidor de fitxers i no es podrà recuperar.'
            : `S’esborraran ${nAEsborrar} còpies del servidor de fitxers i no es podran recuperar.`} Se’n conserva una de cada foto.`
          : 'S’esborrarà del servidor de fitxers i no es podrà recuperar.'} ${AVIS_PUBLICACIONS}`}
        etiquetaConfirma={aEsborrar?.tipus === 'duplicats' ? 'Eliminar duplicats' : 'Elimina'}
      />
    </UniversalPage>
  );
}

export default DetallMultimedia;

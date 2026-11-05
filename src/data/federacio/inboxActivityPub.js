/**
 * P1-23 fase 2 · D05/D07 (pla 261101_1246, carril T3) · La recepció
 * ActivityPub d'un poble, PURA i portable (Node ≥ 20, Deno, una Edge
 * Function): cap fetch, cap rellotge (`ara` s'injecta sempre), cap global del
 * navegador. Només importa ../activitypub.js. Les claus remotes
 * (obtenClauPublica), els documents remots (obtenDocument), el magatzem
 * (idempotència, seguidors i alertes) i el lliurament signat de l'Accept són
 * de qui la desplega.
 *
 * Honestedat del desplegament: la crida supabase/functions/ap-inbox-verifica
 * (B5, marató 261101_2143), que NO està desplegada i, desplegada, naix
 * apagada (SDP_AP_ACTIVA). Firebase és estàtic, i /ap/inbox/<slug> continua
 * responent 405 al servidor de desenvolupament i a NixOS (fase 1). Encendre-la
 * demana el parell de claus de l'actor (la pública amb
 * construeixActor.clauPublicaPem; la privada, secret del servidor), aplicar la
 * migració de les taules persistents i decidir on arriba el POST. Cap codi de
 * src/ de producció no importa este mòdul (la prova ho vigila): no entra al
 * paquet del navegador.
 *
 * Límits que posa qui desplega (la biblioteca no els pot posar sola):
 *   · el cos es llig amb un sostre de MAXIM_COS_INBOX + 1 octets, mai amb
 *     req.arrayBuffer() sense límit (el 413 d'atenPeticioInbox arriba tard si
 *     el cos sencer ja és en memòria);
 *   · obtenClauPublica, obtenDocument i el lliurament fan el fetch amb
 *     redirect:'manual' o 'error' (o comproven que l'URL final és del mateix
 *     origen), AbortSignal.timeout(10_000), un sostre de resposta d'1 MiB i
 *     Accept: application/activity+json;
 *   · les IP privades es bloquegen DESPRÉS de resoldre el DNS (urlRemota és
 *     només lèxica).
 *
 * Perfil propi de signatures draft-cavage-http-signatures-12: rsa-sha256
 * (RSA), hs2019 (RSA o Ed25519) i ed25519; (request-target), host i Digest signats
 * en un POST; finestra de 5 min sense expires, mai més de 12 h, i 1 h de marge
 * de rellotge. No és RFC 9421 (Signature-Input és un altre format).
 * La interoperabilitat remota amb Mastodon no està acreditada.
 */
import {
  CONTEXT_AS, PUBLIC, TIPUS_JRD, analitzaRecursWebFinger, construeixWebFinger, dataIso, esSlugFederat, normalitzaOrigen,
  textPla, urlsDeMunicipi
} from '../activitypub.js';

export const MAXIM_COS_INBOX = 256 * 1024;
export const LIMITS_SIGNATURA = Object.freeze({ capcalera: 4096, keyId: 2048, signatura: 2048, capcaleres: 16, url: 2048 });
/* B5 · La clau pública més llarga que s'importa (importaClauPublica): qui la desa en memòria cau no en guarda cap de més llarga. */
export const LIMITS_CLAU_PUBLICA = Object.freeze({ pem: 8192, multibase: 128 });
export const FINESTRA_SIGNATURA = Object.freeze({ caducitatMs: 5 * 60_000, maximMs: 12 * 3_600_000, margeMs: 3_600_000 });
export const ALGORISMES = Object.freeze(['rsa-sha256', 'hs2019', 'ed25519']);
export const TIPUS_ENTRANTS = Object.freeze(['Follow', 'Undo', 'Create', 'Delete', 'Announce']);
/* Els objectes que poden portar una alerta (Mastodon envia Note; un altre node, Article o Event). */
export const TIPUS_OBJECTE_ALERTA = Object.freeze(['Note', 'Article', 'Page', 'Event']);
/* La mateixa vigència que VIGENCIA_ALERTA_MS de src/sections/mur/alertesMunicipals.js (la prova ho compara). */
export const VIGENCIA_ALERTA_REMOTA_MS = 72 * 3_600_000;
export const MAXIM_VIGENCIA_ALERTA_MS = 30 * 24 * 3_600_000;
/* B5 · Quant es conserva l'id d'una activitat rebuda: la finestra màxima en què una rèplica encara verificaria (14 h). */
export const RETENCIO_ACTIVITAT_MS = FINESTRA_SIGNATURA.maximMs + 2 * FINESTRA_SIGNATURA.margeMs;
/* Una làpida dura més que la vigència màxima d'una alerta més la retenció. */
export const RETENCIO_LAPIDA_MS = MAXIM_VIGENCIA_ALERTA_MS + RETENCIO_ACTIVITAT_MS;
/* Una alerta caducada es conserva un dia més abans de purgar-la (el mateix interval que ap_purga). */
export const MARGE_PURGA_ALERTA_MS = 24 * 3_600_000;
/* B5 · Una reclamació «en curs» de fa més de 5 min és d'un procés que va caure, o d'un efecte i un alliberament que
   van fallar alhora: es torna a prendre (el mateix interval que ap_inbox_reclama). */
export const REPRESA_EN_CURS_MS = 5 * 60_000;
/* P1-23 · ARB-M13-04 · Reclamació de tres estats: nova, en_curs i feta. */
export const ESTATS_RECLAMACIO_INBOX = Object.freeze(['nova', 'en_curs', 'feta']);

const DATA_HTTP = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const NOM_PARAMETRE = /^[A-Za-z]{1,16}$/;
const ENTER = /^\d{1,12}$/;
const NOM_CAPCALERA = /^(?:\([a-z-]+\)|[a-z0-9-]+)$/;
const CAMI_INBOX = /^\/ap\/inbox\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
/* B5 · El prefix d'una inbox que no penja de l'arrel: buit, o segments «/nom» (cada repetició comença per «/»: lineal). */
const PREFIX_CAMI = /^(?:\/[A-Za-z0-9._~-]+)*$/;
const IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
/* B5 · Un host LDH tal com el deixa el parser (minúscules i punycode): sense «_» ni els signes que el parser admet. Lineal. */
const HOST_LDH = /^[a-z0-9.-]+$/;
/* Noms de la mateixa màquina o de la xarxa local (RFC 6761, 6762 i 8375, i .internal d'ICANN). */
const DOMINIS_LOCALS = Object.freeze(['localhost', 'localdomain', 'local', 'internal', 'home.arpa']);
const ED25519_SPKI = Object.freeze([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
const OID_RSA = Object.freeze([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]);
const ALFABET_58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/* Els sinònims del Mur (alertesMunicipals.js) i les formes CamelCase dels hashtags de Mastodon. */
const SINONIMS_ALERTA = new Map([
  ['alerta', 'alerta'], ['alerta_municipal', 'alerta'], ['alertamunicipal', 'alerta'], ['emergencia', 'alerta'],
  ['emergencia_municipal', 'alerta'], ['emergenciamunicipal', 'alerta'], ['bandol_urgent', 'bandol_urgent'], ['bandolurgent', 'bandol_urgent']
]);

const enc = new TextEncoder();
/* El cos com a bytes: text, Uint8Array (Buffer inclòs) o ArrayBuffer (el de Deno.serve, req.arrayBuffer()). */
const bytesDe = (cos) => (typeof cos === 'string' ? enc.encode(cos) : cos instanceof Uint8Array ? cos : cos instanceof ArrayBuffer ? new Uint8Array(cos) : null);
const b64 = (buffer) => { let s = ''; for (const b of new Uint8Array(buffer)) s += String.fromCharCode(b); return btoa(s); };
const desdeB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const hex = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
const no = (motiu) => ({ valida: false, motiu });
/* B5 · Un subrogat sense parella (PostgreSQL rebutja el JSON que el porta): l'alta sense baixa, o la baixa sense alta. Lineal. */
const SUBROGAT_SOL = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
/* Talla un text desat sense deixar mig emoji al final, i canvia els subrogats solts per U+FFFD. */
const tallaBe = (text, maxim) => {
  let tros = text.slice(0, maxim);
  const darrer = tros.charCodeAt(tros.length - 1);
  if (darrer >= 0xd800 && darrer <= 0xdbff) tros = tros.slice(0, -1);
  return tros.replace(SUBROGAT_SOL, '\ufffd');
};

/**
 * Una URL https pública, o null: sense credencials, ni IP literal, ni host
 * sense punt, ni amb el punt final d'un FQDN («localhost.», que a més faria
 * dos orígens del mateix host), ni d'un domini local (DOMINIS_LOCALS). És un
 * filtre lèxic: qui desplega ha de bloquejar també les IP privades DESPRÉS de
 * resoldre el DNS (com el PrivateAddressCheck de Mastodon) en obtenClauPublica,
 * en obtenDocument i en el lliurament de l'Accept.
 * B5 (ARB-M13-03) · A més, la forma que accepten les CHECK de la migració
 * 2611020106, perquè la memòria i l'SQL diguen el mateix (abans, l'SQL hi
 * responia 23514 → 503 i el remot reintentava sense fi): el text comença
 * literalment per «https://» (ni «HTTPS://» ni espais davant, que el parser
 * normalitza), té de 12 caràcters (https://a.bc, la més curta amb un TLD real)
 * a 2048, també la .href normalitzada, i el host és LDH (cap «_»: cap
 * certificat públic no en porta) de 253 caràcters com a molt.
 */
export function urlRemota(valor) {
  if (typeof valor !== 'string' || valor.length < 12 || valor.length > LIMITS_SIGNATURA.url || !valor.startsWith('https://')) return null;
  let url = null;
  try { url = new URL(valor); } catch { return null; }
  const host = url.hostname;
  if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') || host.endsWith('.')
    || host.length > 253 || !HOST_LDH.test(host) || url.href.length > LIMITS_SIGNATURA.url
    || IPV4.test(host) || host.startsWith('[') || DOMINIS_LOCALS.some((d) => host === d || host.endsWith(`.${d}`))) return null;
  return url;
}

/**
 * B5 · El host de la quota d'un actor: el hostname en minúscules i sense els
 * punts finals, o '' si no és una URL. Tots els ports d'un host són una sola
 * quota (Gauntlet B, B-V1). La fan servir el magatzem en memòria i l'adaptador
 * PostgREST (supabase/functions/ap-inbox-verifica), que així calculen la
 * mateixa quota.
 */
export function hostDeQuota(actor) {
  let host = '';
  try { host = new URL(actor).hostname.toLowerCase(); } catch { return ''; }
  while (host.endsWith('.')) host = host.slice(0, -1);
  return host;
}
const idDe = (valor) => (typeof valor === 'string' ? valor : valor && typeof valor === 'object' && typeof valor.id === 'string' ? valor.id : null);
const mateixOrigen = (a, b) => { const [x, y] = [urlRemota(a), urlRemota(b)]; return Boolean(x && y && x.origin === y.origin); };

/* ── WebFinger dinàmic (?resource=) ─────────────────────────────────── */

/**
 * La resposta HTTP de /.well-known/webfinger per a un servidor (dev, NixOS,
 * Edge): 400 (resource absent, repetit o malformat: RFC 7033 §4.2), 404 (d'un
 * altre host o d'un actor que no és a `municipis`) o 200 amb el JRD de
 * construeixWebFinger. `consulta`: URLSearchParams, URL o el text de la consulta.
 */
export function resolveWebFingerAcct(consulta, { origen, municipis = [] } = {}) {
  const params = consulta instanceof URLSearchParams ? consulta
    : consulta instanceof URL ? consulta.searchParams
      : new URLSearchParams(String(consulta ?? '').replace(/^\?/, ''));
  const capcaleres = { 'Content-Type': `${TIPUS_JRD}; charset=utf-8`, 'Access-Control-Allow-Origin': '*' };
  const recursos = params.getAll('resource');
  if (recursos.length !== 1 || !analitzaRecursWebFinger(recursos[0])) return { status: 400, capcaleres, cos: { error: 'bad_resource' } };
  const jrd = construeixWebFinger(recursos[0], { origen, municipis, rel: params.getAll('rel') });
  return jrd ? { status: 200, capcaleres, cos: jrd } : { status: 404, capcaleres, cos: { error: 'not_found' } };
}

/* ── Signatures HTTP (draft-cavage-12, perfil acceptat per este motor) ── */

/**
 * Els paràmetres de la capçalera Signature ({keyId, algorithm, headers[],
 * signature, created, expires}), o null si és malformada: paràmetre repetit o
 * desconegut de forma, més de 8, valors sense separador, base64 invàlid.
 * Lineal (indexOf; cap regex que puga recular). Sense `algorithm`, hs2019; sense
 * `headers`, '(created)' en hs2019 i 'date' en la resta, en este perfil.
 */
export function analitzaCapcaleraSignatura(valor) {
  if (typeof valor !== 'string' || !valor || valor.length > LIMITS_SIGNATURA.capcalera) return null;
  const params = new Map();
  const n = valor.length;
  const blanc = (i) => valor[i] === ' ' || valor[i] === '\t';
  let i = 0;
  while (i < n) {
    while (i < n && blanc(i)) i += 1;
    if (i >= n) break;
    const igual = valor.indexOf('=', i);
    if (igual < 0) return null;
    const nom = valor.slice(i, igual).trim();
    if (!NOM_PARAMETRE.test(nom) || params.has(nom)) return null;
    i = igual + 1;
    let contingut = '';
    if (valor[i] === '"') {
      const tanca = valor.indexOf('"', i + 1);
      if (tanca < 0) return null;
      contingut = valor.slice(i + 1, tanca);
      i = tanca + 1;
    } else {
      const coma = valor.indexOf(',', i);
      const fi = coma < 0 ? n : coma;
      contingut = valor.slice(i, fi).trim();
      i = fi;
      if (!ENTER.test(contingut)) return null;
    }
    params.set(nom, contingut);
    if (params.size > 8) return null;
    // Després d'un valor, només blancs i una coma (o la fi): «a="1"b="2"» és malformat.
    while (i < n && blanc(i)) i += 1;
    if (i < n) {
      if (valor[i] !== ',') return null;
      i += 1;
    }
  }
  const keyId = params.get('keyId');
  const signature = params.get('signature');
  const algorithm = (params.get('algorithm') ?? 'hs2019').toLowerCase();
  const headers = (params.get('headers') ?? (algorithm === 'hs2019' ? '(created)' : 'date')).toLowerCase().split(' ').filter(Boolean);
  for (const temps of ['created', 'expires']) if (params.has(temps) && !ENTER.test(params.get(temps))) return null;
  if (!keyId || keyId.length > LIMITS_SIGNATURA.keyId || !signature || signature.length > LIMITS_SIGNATURA.signatura
    || signature.length % 4 || !BASE64.test(signature) || headers.length > LIMITS_SIGNATURA.capcaleres
    || new Set(headers).size !== headers.length || !headers.every((h) => NOM_CAPCALERA.test(h))) return null;
  const numero = (clau) => (params.has(clau) ? Number(params.get(clau)) : null);
  return { keyId, algorithm, headers, signature, created: numero('created'), expires: numero('expires') };
}

/* Capçaleres (objecte, Headers o Map) → Map amb el nom en minúscules. */
const mapaCapcaleres = (capcaleres) => {
  const mapa = new Map();
  const entrades = capcaleres instanceof Map ? [...capcaleres]
    : typeof capcaleres?.entries === 'function' && typeof capcaleres.get === 'function' ? [...capcaleres.entries()]
      : Object.entries(capcaleres ?? {});
  for (const [clau, valor] of entrades) mapa.set(String(clau).toLowerCase(), Array.isArray(valor) ? valor.join(', ') : String(valor));
  return mapa;
};

/** La cadena que es signa (cavage-12 §2.3), o null si hi falta alguna capçalera. `cami` porta la consulta, si n'hi ha. */
export function cadenaDeSignatura({ metode, cami, capcaleres, noms, created = null, expires = null }) {
  const mapa = capcaleres instanceof Map ? capcaleres : mapaCapcaleres(capcaleres);
  const linies = [];
  for (const nom of noms) {
    if (nom === '(request-target)') linies.push(`(request-target): ${String(metode).toLowerCase()} ${cami}`);
    else if (nom === '(created)') { if (created === null) return null; linies.push(`(created): ${created}`); }
    else if (nom === '(expires)') { if (expires === null) return null; linies.push(`(expires): ${expires}`); }
    else if (nom.startsWith('(')) return null;
    else { if (!mapa.has(nom)) return null; linies.push(`${nom}: ${mapa.get(nom).trim()}`); }
  }
  return linies.join('\n');
}

/** «SHA-256=<base64>» dels bytes exactes del cos. */
export async function digestSha256(cos, { subtle = globalThis.crypto?.subtle } = {}) {
  return `SHA-256=${b64(await subtle.digest('SHA-256', bytesDe(cos)))}`;
}

/* base58btc (multibase «z»). Cada xifra multiplica l'acumulador, en bytes de menor a major pes. */
function base58(text) {
  const bytes = [0];
  for (const caracter of text) {
    let valor = ALFABET_58.indexOf(caracter);
    if (valor < 0) return null;
    for (let j = 0; j < bytes.length; j += 1) { valor += bytes[j] * 58; bytes[j] = valor & 0xff; valor >>= 8; }
    while (valor) { bytes.push(valor & 0xff); valor >>= 8; }
  }
  for (const caracter of text) { if (caracter !== '1') break; bytes.push(0); }
  return Uint8Array.from(bytes.reverse());
}

/**
 * La clau d'un document d'actor per a un keyId: publicKey (PEM, una o una
 * llista) o assertionMethod Multikey (FEP-521a), amb el propietari igual a
 * l'actor. {id, owner, publicKeyPem|publicKeyMultibase} o null.
 */
export function clauDeDocumentActor(perfil, keyId) {
  if (!perfil || typeof perfil !== 'object' || !urlRemota(perfil.id)) return null;
  const actor = perfil.id;
  for (const clau of [].concat(perfil.publicKey ?? [])) {
    if (clau?.id === keyId && (clau.owner ?? actor) === actor && typeof clau.publicKeyPem === 'string') {
      return { id: keyId, owner: actor, publicKeyPem: clau.publicKeyPem };
    }
  }
  for (const clau of [].concat(perfil.assertionMethod ?? [])) {
    if (clau?.id === keyId && clau.type === 'Multikey' && (clau.controller ?? actor) === actor && typeof clau.publicKeyMultibase === 'string') {
      return { id: keyId, owner: actor, publicKeyMultibase: clau.publicKeyMultibase };
    }
  }
  return null;
}

const comenca = (der, prefix) => der.length >= prefix.length && prefix.every((b, i) => der[i] === b);
const conte = (der, seq, fins = 32) => {
  for (let i = 0; i + seq.length <= Math.min(der.length, fins); i += 1) if (seq.every((b, j) => der[i + j] === b)) return true;
  return false;
};

/**
 * {tipus:'rsa'|'ed25519', cryptoKey} d'una clau PEM SPKI o d'un Multikey
 * Ed25519, o null: PKCS#1 («BEGIN RSA PUBLIC KEY»), RSA fora de 2048–8192
 * bits, una corba desconeguda o bytes que no són una clau.
 */
export async function importaClauPublica(clau, { subtle = globalThis.crypto?.subtle } = {}) {
  try {
    let der = null;
    if (typeof clau?.publicKeyPem === 'string' && clau.publicKeyPem.length <= LIMITS_CLAU_PUBLICA.pem) {
      const pem = clau.publicKeyPem.replace(/\r/g, '');
      if (!pem.includes('-----BEGIN PUBLIC KEY-----') || !pem.includes('-----END PUBLIC KEY-----')) return null;
      der = desdeB64(pem.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\s+/g, ''));
    } else if (typeof clau?.publicKeyMultibase === 'string' && clau.publicKeyMultibase.startsWith('z') && clau.publicKeyMultibase.length <= LIMITS_CLAU_PUBLICA.multibase) {
      const crus = base58(clau.publicKeyMultibase.slice(1));
      if (!crus || crus.length !== 34 || crus[0] !== 0xed || crus[1] !== 0x01) return null;
      der = Uint8Array.from([...ED25519_SPKI, ...crus.slice(2)]);
    } else return null;
    if (der.length === 44 && comenca(der, ED25519_SPKI)) {
      return { tipus: 'ed25519', cryptoKey: await subtle.importKey('spki', der, { name: 'Ed25519' }, false, ['verify']) };
    }
    if (conte(der, OID_RSA)) {
      const cryptoKey = await subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      const bits = cryptoKey.algorithm.modulusLength;
      return bits >= 2048 && bits <= 8192 ? { tipus: 'rsa', cryptoKey } : null;
    }
    return null;
  } catch { return null; }
}

/**
 * Verifica la signatura HTTP d'una petició entrant. Primer el que és barat i
 * local (capçalera, finestra, host, Digest) i només al final
 * obtenClauPublica(keyId) → {clau:{id, owner, publicKeyPem|publicKeyMultibase},
 * documentActor} (la xarxa és de qui desplega: sense redireccions a un altre
 * origen, amb termini de 10 s i sostre d'1 MiB; vegeu la capçalera). `cos`:
 * els BYTES exactes rebuts (string, Uint8Array o ArrayBuffer). Torna
 * {valida:true, keyId, actor, algorisme, documentActor} o {valida:false,
 * motiu}; documentActor és null si el document obtingut no és el del
 * propietari de la clau. Mai no llança per una entrada dolenta; només si
 * falten `ara`, obtenClauPublica o WebCrypto.
 */
export async function verificaSignaturaHttpActivityPub({
  metode, cami, capcaleres, cos, obtenClauPublica, hostEsperat = null, ara, subtle = globalThis.crypto?.subtle, finestra = FINESTRA_SIGNATURA
} = {}) {
  if (!Number.isFinite(ara)) throw new TypeError('verificaSignaturaHttpActivityPub necessita ara (ms).');
  if (typeof obtenClauPublica !== 'function' || !subtle) throw new TypeError('Cal obtenClauPublica i WebCrypto.');
  const mapa = mapaCapcaleres(capcaleres);
  const bytes = bytesDe(cos ?? '');
  if (!bytes) return no('signature_malformed');
  if (!mapa.has('signature')) return no('signature_missing');
  const params = analitzaCapcaleraSignatura(mapa.get('signature'));
  if (!params) return no('signature_malformed');
  if (!ALGORISMES.includes(params.algorithm)) return no('algorithm_unsupported');
  // (created) i (expires) només amb hs2019 (Mastodon: «Invalid pseudo-header … for rsa-sha256»).
  if (params.algorithm !== 'hs2019' && (params.headers.includes('(created)') || params.headers.includes('(expires)'))) return no('signature_malformed');
  const ambCos = String(metode).toUpperCase() === 'POST';
  const obligatories = ['(request-target)', 'host', ...(ambCos ? ['digest'] : [])];
  const ambData = params.headers.includes('date') || params.headers.includes('(created)');
  if (!obligatories.every((h) => params.headers.includes(h)) || !ambData) return no('headers_insufficient');
  let creat = null;
  if (params.headers.includes('(created)')) creat = params.created === null ? null : params.created * 1000;
  else {
    const data = mapa.get('date') ?? '';
    creat = DATA_HTTP.test(data) ? Date.parse(data) : null;
  }
  if (!Number.isFinite(creat)) return no('date_invalid');
  // Només un `expires` signat ((expires) a headers) canvia la finestra: el paràmetre solt, qualsevol el pot afegir.
  const expires = params.headers.includes('(expires)') ? params.expires : null;
  const caduca = Math.min(expires !== null ? expires * 1000 : creat + finestra.caducitatMs, creat + finestra.maximMs);
  if (creat > ara + finestra.margeMs || ara > caduca + finestra.margeMs) return no('date_out_of_window');
  if (hostEsperat && (mapa.get('host') ?? '').toLowerCase() !== String(hostEsperat).toLowerCase()) return no('host_mismatch');
  if (ambCos) {
    const digest = mapa.get('digest');
    if (!digest) return no('digest_missing');
    const esperat = await digestSha256(bytes, { subtle });
    const declarats = digest.split(',').map((d) => d.trim()).filter((d) => d.slice(0, 8).toLowerCase() === 'sha-256=').map((d) => `SHA-256=${d.slice(8)}`);
    if (!declarats.length || !declarats.includes(esperat)) return no('digest_mismatch');
  }
  const cadena = cadenaDeSignatura({ metode, cami, capcaleres: mapa, noms: params.headers, created: params.created, expires: params.expires });
  if (cadena === null) return no('headers_insufficient');
  if (!urlRemota(params.keyId)) return no('key_not_found');
  let obtinguda = null;
  try { obtinguda = await obtenClauPublica(params.keyId); } catch { obtinguda = null; }
  const clau = obtinguda?.clau;
  // La clau ha de ser la del keyId, i el seu propietari, del mateix origen (mai la d'un altre servidor).
  if (!clau || clau.id !== params.keyId || !urlRemota(clau.owner) || !mateixOrigen(clau.owner, params.keyId)) return no('key_not_found');
  const importada = await importaClauPublica(clau, { subtle });
  if (!importada || (params.algorithm === 'rsa-sha256' && importada.tipus !== 'rsa') || (params.algorithm === 'ed25519' && importada.tipus !== 'ed25519')) {
    return no('key_unsupported');
  }
  const algorisme = importada.tipus === 'rsa' ? 'RSASSA-PKCS1-v1_5' : 'Ed25519';
  let valida = false;
  try { valida = await subtle.verify(algorisme, importada.cryptoKey, desdeB64(params.signature), enc.encode(cadena)); } catch { valida = false; }
  if (!valida) return no('signature_invalid');
  const documentActor = obtinguda.documentActor && idDe(obtinguda.documentActor) === clau.owner ? obtinguda.documentActor : null;
  return { valida: true, keyId: params.keyId, actor: clau.owner, algorisme: params.algorithm, documentActor };
}

/**
 * Signa una petició sortint (l'Accept, en un desplegament amb la clau privada
 * de l'actor): torna les capçaleres host, date, digest i signature. RSA
 * s'etiqueta rsa-sha256 (el que envia Mastodon); Ed25519, hs2019.
 */
export async function signaPeticioHttpActivityPub({ metode = 'POST', url, cos = '', keyId, clauPrivada, ara, subtle = globalThis.crypto?.subtle } = {}) {
  if (!Number.isFinite(ara)) throw new TypeError('signaPeticioHttpActivityPub necessita ara (ms).');
  if (!urlRemota(url) || !urlRemota(keyId) || !clauPrivada?.algorithm) throw new TypeError('Cal una URL i un keyId https i una clau privada.');
  const desti = new URL(url);
  const capcaleres = { host: desti.host, date: new Date(ara).toUTCString(), digest: await digestSha256(cos, { subtle }) };
  const noms = ['(request-target)', 'host', 'date', 'digest'];
  const cadena = cadenaDeSignatura({ metode, cami: `${desti.pathname}${desti.search}`, capcaleres, noms });
  const ed = clauPrivada.algorithm.name === 'Ed25519';
  const signatura = b64(await subtle.sign(ed ? 'Ed25519' : 'RSASSA-PKCS1-v1_5', clauPrivada, enc.encode(cadena)));
  return { ...capcaleres, signature: `keyId="${keyId}",algorithm="${ed ? 'hs2019' : 'rsa-sha256'}",headers="${noms.join(' ')}",signature="${signatura}"` };
}

/* ── Alertes municipals federades ───────────────────────────────────── */

/**
 * 'alerta' | 'bandol_urgent' | null pels Hashtag de l'objecte (fins a 32):
 * la normalització de normalitzaEtiqueta del Mur (#Alerta, #alerta_municipal,
 * #Emergència, #Bàndol_urgent…) i les formes CamelCase de Mastodon
 * (#AlertaMunicipal, #EmergenciaMunicipal, #BandolUrgent). Si en porta dos, mana alerta.
 */
export function tipusDAlertaFederada(objecte) {
  const trobats = new Set();
  for (const etiqueta of [].concat(objecte?.tag ?? []).slice(0, 32)) {
    const nom = typeof etiqueta === 'string' ? etiqueta : etiqueta?.type === 'Hashtag' ? etiqueta.name : null;
    if (typeof nom !== 'string' || nom.length > 64) continue;
    let net = nom.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (net.startsWith('_')) net = net.slice(1);
    if (net.endsWith('_')) net = net.slice(0, -1);
    const clau = SINONIMS_ALERTA.get(net);
    if (clau) trobats.add(clau);
  }
  return trobats.has('alerta') ? 'alerta' : trobats.has('bandol_urgent') ? 'bandol_urgent' : null;
}

/** Text pla d'un HTML remot: cap etiqueta, les entitats bàsiques i numèriques, tallat a `maxim`. Lineal; res d'HTML es guarda. */
export function textDHtmlRemot(html, maxim = 2000) {
  if (typeof html !== 'string') return '';
  let eixida = '';
  let dins = false;
  for (const caracter of html.slice(0, 64 * 1024)) {
    if (caracter === '<') { dins = true; eixida += ' '; } else if (dins) { if (caracter === '>') dins = false; } else eixida += caracter;
  }
  const entitats = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return tallaBe(textPla(eixida.replace(/&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,6});/gi, (sencera, nom) => {
    const clau = nom.toLowerCase();
    if (Object.hasOwn(entitats, clau)) return entitats[clau];
    const codi = clau.startsWith('#x') ? parseInt(clau.slice(2), 16) : clau.startsWith('#') ? Number(clau.slice(1)) : NaN;
    return Number.isInteger(codi) && codi > 31 && codi <= 0x10ffff && !(codi >= 0xd800 && codi <= 0xdfff) ? String.fromCodePoint(codi) : sencera;
  })), maxim);
}

const esPublic = (objecte) => [].concat(objecte?.to ?? [], objecte?.cc ?? []).includes(PUBLIC);
const urlDe = (valor) => {
  const primer = [].concat(valor ?? [])[0];
  return typeof primer === 'string' ? primer : typeof primer?.href === 'string' ? primer.href : idDe(primer);
};

/* L'alerta desada (mai l'HTML ni l'objecte remot sencer): {id, actor, via, activitat, tipus, url, nom, text, publicat, caduca, rebuda}. */
function alertaDe(objecte, { actor, via = null, activitat, ara }) {
  if (!TIPUS_OBJECTE_ALERTA.includes(objecte?.type)) return { motiu: 'type_unsupported' };
  const tipus = tipusDAlertaFederada(objecte);
  if (!tipus) return { motiu: 'not_an_alert' };
  if (!esPublic(objecte)) return { motiu: 'not_public' };
  const publicat = dataIso(objecte.published);
  // Una data de publicació futura no allarga la vigència: compta des de la recepció.
  const base = publicat ? Math.min(Date.parse(publicat), ara) : ara;
  const fiDeclarada = dataIso(objecte.endTime);
  let caduca = base + VIGENCIA_ALERTA_REMOTA_MS;
  // O2-F03 (inspecció de Codex, 261101): una fi declarada mana sempre, també si ja ha passat
  // o és anterior a la publicació; mai es reviscola un avís vençut amb la vigència per defecte.
  if (fiDeclarada) caduca = Math.min(Date.parse(fiDeclarada), base + MAXIM_VIGENCIA_ALERTA_MS);
  if (caduca <= ara) return { motiu: 'alert_expired' };
  return {
    alerta: {
      id: objecte.id, actor, via, activitat, tipus, url: urlRemota(urlDe(objecte.url) ?? '')?.href ?? null,
      nom: tallaBe(textPla(typeof objecte.name === 'string' ? objecte.name : ''), 160),
      text: textDHtmlRemot(objecte.content ?? objecte.summary ?? ''),
      publicat, caduca: new Date(caduca).toISOString(), rebuda: new Date(ara).toISOString()
    }
  };
}

/* ── Magatzem de referència (proves i un sol procés) ───────────────── */

/**
 * El PORT del magatzem, en memòria. Un servidor real el fa amb taules:
 *   reclamaActivitat(id, {actor, tipus, rebuda}) → bool   atòmic (clau única per id d'activitat),
 *                                           amb quota per host de l'actor (hostname en minúscules i
 *                                           sense el punt final: tots els ports d'un host són una
 *                                           sola quota) i purga per TTL: un host ple no bloqueja
 *                                           els altres. Cada id es conserva
 *                                           com a mínim caducitatMs + 2·margeMs (2 h 5 min), o
 *                                           maximMs + 2·margeMs (14 h) si admet (expires) signat:
 *                                           és la finestra en què una rèplica encara verifica
 *                                           (RETENCIO_ACTIVITAT_MS). Una reclamació en curs de fa
 *                                           més de REPRESA_EN_CURS_MS es torna a prendre (true),
 *                                           sense gastar quota ni allargar la retenció
 *   alliberaActivitat(id)                   desfà la reclamació (i la quota) si un efecte falla;
 *                                           només una reclamació encara en curs, i una sola vegada.
 *                                           Residu (ARB-M13-04): si l'efecte i l'alliberament fallen
 *                                           alhora (la base caiguda), la reclamació queda en curs i
 *                                           una rèplica d'abans de REPRESA_EN_CURS_MS és 'duplicada'
 *                                           (202): el remot ja no reintenta i l'efecte es perd. Ho
 *                                           tancaria una reclamació de tres estats (nova, feta, en
 *                                           curs) que responga 503 a «en curs» (petició a M14)
 *   confirmaActivitat(id) → bool            (opcional) l'efecte ha acabat bé: en curs → fet. Un
 *                                           magatzem que no el té es comporta com abans
 *   desaSeguidor({slug, actor, inbox, followId, acceptId, des}) → 'nou'|'existent'
 *                                           (un Follow repetit actualitza followId i acceptId); la
 *                                           quota (`maxim`) és per actor local, com ap_seguidor_desa
 *   retiraSeguidor({slug, actor, followId}) → bool
 *   retiraActorRemot(actor) → n             seguidors i alertes de l'actor (o anunciades per ell)
 *   desaAlertaRemota(alerta) → 'nova'|'existent'|'esborrada'
 *                                           un Create de l'autor sobre una alerta anunciada la fa
 *                                           directa (via null): ja no la retira qui l'anuncià. Residu:
 *                                           amb dos anunciadors, l'Undo d'un la retira (caldria un
 *                                           conjunt d'anunciadors)
 *   retiraAlertaRemota({id, actor, lapida, ara}) → bool  Delete: només el propietari; amb `lapida`,
 *                                           un Create posterior del mateix objecte i del mateix
 *                                           propietari no la ressuscita (com el Tombstone de
 *                                           Mastodon); la làpida d'un altre compte no veta l'autor.
 *                                           `ara` data la làpida (un servidor usa el seu rellotge)
 *   retiraAlertaRemota({activitat, actor}) → bool     Undo(Announce): només qui l'anuncià
 *   llistaAlertesVigents(ara) → [alerta]
 *   purga(ara) → {activitats, alertes, lapides}       (opcional) el TTL: activitats rebudes fa més
 *                                           de RETENCIO_ACTIVITAT_MS (tornen la quota), alertes
 *                                           caducades fa més de MARGE_PURGA_ALERTA_MS i làpides
 *                                           de fa més de RETENCIO_LAPIDA_MS
 * `maxim` fita cada mapa (els seguidors, els de cada actor local) i `maximPerOrigen`, les activitats de cada host: plens, llancen
 * RangeError. Residu: els subdominis d'un mateix atacant (un DNS comodí) són hosts diferents i
 * només els fita `maxim`. En memòria la purga la crida qui la usa; el servidor
 * (ap-inbox-verifica) purga a cada reclamació i a cada passada de la cua.
 */
export function creaMagatzemInboxEnMemoria({ maxim = 10_000, maximPerOrigen = 1_000 } = {}) {
  const activitats = new Map();
  const perOrigen = new Map();
  const seguidors = new Map();
  const alertes = new Map();
  const lapides = new Map();
  const clauSeguidor = (slug, actor) => `${slug} ${actor}`;
  /* La làpida és de l'objecte I del seu propietari: un altre compte del mateix origen no la pot posar per endavant. */
  const clauLapida = (id, actor) => `${id} ${actor}`;
  const capHi = (mapa) => { if (mapa.size >= maxim) throw new RangeError('Magatzem de la inbox ple.'); };
  /* Treu una activitat i torna la seua quota (una sola vegada: la fila ja no hi és). */
  const trau = (id, registre) => {
    activitats.delete(id);
    const n = (perOrigen.get(registre.origen) ?? 1) - 1;
    if (n > 0) perOrigen.set(registre.origen, n); else perOrigen.delete(registre.origen);
  };
  return Object.freeze({
    async reclamaActivitat(id, registre) {
      const tresEstats = registre?.tresEstats === true;
      // `rebuda` en ms (Date.parse de l'ISO del processador); sense data, ni la purga ni la represa la toquen.
      const rebuda = Date.parse(registre?.rebuda ?? '');
      const actual = activitats.get(id);
      if (actual) {
        // Represa (com ap_inbox_reclama): una en curs de fa més de REPRESA_EN_CURS_MS es torna a prendre.
        // `presa` compta la represa; `rebuda` (la retenció) no canvia.
        if (actual.estat !== 'en_curs') return tresEstats ? 'feta' : false;
        if (!(rebuda - actual.presa > REPRESA_EN_CURS_MS)) {
          if (tresEstats || actual.falladaAlliberament === true) return 'en_curs';
          return false;
        }
        actual.presa = rebuda;
        actual.falladaAlliberament = false;
        return tresEstats ? 'nova' : true;
      }
      // La quota és per host, no per origen: l'origen porta el port, i urlRemota admet qualsevol port.
      const origen = hostDeQuota(registre?.actor);
      const n = perOrigen.get(origen) ?? 0;
      if (n >= maximPerOrigen) throw new RangeError('Quota de la inbox esgotada per a este origen.');
      capHi(activitats);
      activitats.set(id, { origen, estat: 'en_curs', rebuda, presa: rebuda, falladaAlliberament: false });
      perOrigen.set(origen, n + 1);
      return tresEstats ? 'nova' : true;
    },
    async reclamaEstatActivitat(id, registre) {
      const estat = await this.reclamaActivitat(id, { ...registre, tresEstats: true });
      return estat === true ? 'nova' : estat === false ? 'feta' : estat;
    },
    async marcaEnCursFallida(id) {
      const registre = activitats.get(id);
      if (!registre || registre.estat !== 'en_curs') return false;
      registre.falladaAlliberament = true;
      return true;
    },
    async alliberaActivitat(id) {
      const registre = activitats.get(id);
      if (!registre || registre.estat !== 'en_curs') return false;
      trau(id, registre);
      return true;
    },
    async confirmaActivitat(id) {
      const registre = activitats.get(id);
      if (!registre || registre.estat !== 'en_curs') return false;
      registre.estat = 'fet';
      registre.falladaAlliberament = false;
      return true;
    },
    async desaSeguidor(seguidor) {
      const clau = clauSeguidor(seguidor.slug, seguidor.actor);
      const actual = seguidors.get(clau);
      // La quota és per actor local (ap_seguidor_desa): un poble ple no bloqueja els altres.
      if (!actual) {
        let n = 0;
        for (const s of seguidors.values()) if (s.slug === seguidor.slug) n += 1;
        if (n >= maxim) throw new RangeError('Magatzem de la inbox ple.');
      }
      seguidors.set(clau, { ...seguidor, des: actual?.des ?? seguidor.des });
      return actual ? 'existent' : 'nou';
    },
    async retiraSeguidor({ slug, actor, followId = null }) {
      const clau = clauSeguidor(slug, actor);
      const actual = seguidors.get(clau);
      if (!actual || (followId && actual.followId !== followId)) return false;
      return seguidors.delete(clau);
    },
    async retiraActorRemot(actor) {
      let n = 0;
      for (const [clau, s] of seguidors) if (s.actor === actor) { seguidors.delete(clau); n += 1; }
      for (const [id, a] of alertes) if (a.actor === actor || a.via === actor) { alertes.delete(id); n += 1; }
      return n;
    },
    async desaAlertaRemota(alerta) {
      if (lapides.has(clauLapida(alerta.id, alerta.actor))) return 'esborrada';
      const actual = alertes.get(alerta.id);
      if (actual) {
        // El Create directe de l'autor guanya a l'Announce: ja no la retira qui només l'anuncià.
        if (actual.via && !alerta.via && actual.actor === alerta.actor) alertes.set(alerta.id, { ...alerta });
        return 'existent';
      }
      capHi(alertes);
      alertes.set(alerta.id, { ...alerta });
      return 'nova';
    },
    async retiraAlertaRemota({ id = null, actor, activitat = null, lapida = false, ara = null }) {
      if (id) {
        const actual = alertes.get(id);
        if (actual && actual.actor !== actor) return false;
        if (lapida && !lapides.has(clauLapida(id, actor))) {
          capHi(lapides);
          lapides.set(clauLapida(id, actor), { id, creada: Number.isFinite(ara) ? ara : NaN });
        }
        return alertes.delete(id);
      }
      for (const [clau, a] of alertes) {
        if (activitat && a.activitat === activitat && a.via === actor) { alertes.delete(clau); return true; }
      }
      return false;
    },
    async llistaAlertesVigents(ara) { return [...alertes.values()].filter((a) => Date.parse(a.caduca) > ara).map((a) => ({ ...a })); },
    async purga(ara) {
      if (!Number.isFinite(ara)) throw new TypeError('purga necessita ara (ms).');
      const purgades = { activitats: 0, alertes: 0, lapides: 0 };
      // Una data que no s'entén (NaN) no caduca mai: la comparació és falsa.
      for (const [id, r] of activitats) if (r.rebuda + RETENCIO_ACTIVITAT_MS < ara) { trau(id, r); purgades.activitats += 1; }
      for (const [id, a] of alertes) if (Date.parse(a.caduca) + MARGE_PURGA_ALERTA_MS < ara) { alertes.delete(id); purgades.alertes += 1; }
      for (const [clau, l] of lapides) if (l.creada + RETENCIO_LAPIDA_MS < ara) { lapides.delete(clau); purgades.lapides += 1; }
      return purgades;
    },
    instantania() {
      return {
        activitats: [...activitats.keys()].sort(), seguidors: [...seguidors.values()].map((s) => ({ ...s })),
        alertes: [...alertes.values()].map((a) => ({ ...a })), lapides: [...new Set([...lapides.values()].map((l) => l.id))].sort()
      };
    }
  });
}

/* ── El processador ─────────────────────────────────────────────────── */

const HTTP = Object.freeze({
  invalid_activity: 400, activity_id_invalid: 400, follow_target_mismatch: 400, local_actor_unknown: 404,
  actor_mismatch: 401, origin_spoofed: 403, authorship_mismatch: 403, activity_in_progress: 503
});
const resultat = (estat, { motiu = null, efectes = [], lliuraments = [] } = {}) => ({
  estat,
  motiu,
  http: estat === 'rebutjada' ? HTTP[motiu] ?? 400 : estat === 'en_curs' ? HTTP[motiu] ?? 503 : 202,
  efectes,
  lliuraments
});

/**
 * Processa una activitat JA verificada (verificaSignaturaHttpActivityPub) per
 * a l'actor local `slug`: {estat:'processada'|'duplicada'|'ignorada'|'rebutjada',
 * motiu, http, efectes[], lliuraments[{inbox, activitat}]}.
 *   · Primer es valida sense tocar el magatzem; només una activitat amb efecte
 *     es reclama (reclamaActivitat), i una repetició és 'duplicada' (si era un
 *     Follow, torna el MATEIX Accept). Si un efecte falla, s'allibera i es rellança.
 *   · Follow → Accept determinista (id `${actor local}#accepts/<sha256(followId)>`)
 *     cap a l'inbox de documentActor. Undo de Follow o d'Announce.
 *   · Create/Announce: només alertes municipals (Hashtag), públiques i vigents,
 *     de nodesDeConfianca (llista d'orígens; buida = cap alerta: fallada tancada).
 *     L'autor (attributedTo) d'un objecte anunciat ha de ser de confiança i del
 *     seu origen; si l'objecte no ve inclòs, o no és de l'origen de qui
 *     l'anuncia, cal obtenDocument (injectat: sense redireccions a un altre
 *     origen, termini de 10 s, sostre d'1 MiB; vegeu la capçalera). Delete:
 *     l'actor sencer (també el que només va anunciar) o un objecte del seu origen.
 */
export async function processaActivitatInbox(activitat, {
  slug, origen, actorsLocals = [], signant, documentActor = null, magatzem, nodesDeConfianca = [], obtenDocument = null, ara,
  subtle = globalThis.crypto?.subtle
} = {}) {
  if (!Number.isFinite(ara) || !magatzem || !subtle) throw new TypeError('processaActivitatInbox necessita ara, magatzem i WebCrypto.');
  const base = normalitzaOrigen(origen);
  if (!esSlugFederat(slug) || !actorsLocals.includes(slug)) return resultat('rebutjada', { motiu: 'local_actor_unknown' });
  if (!activitat || typeof activitat !== 'object' || Array.isArray(activitat)) return resultat('rebutjada', { motiu: 'invalid_activity' });
  const local = urlsDeMunicipi(slug, { origen: base }).actor;
  const actor = idDe(activitat.actor);
  if (!signant?.actor || actor !== signant.actor) return resultat('rebutjada', { motiu: 'actor_mismatch' });
  if (!urlRemota(actor) || new URL(actor).origin === base) return resultat('rebutjada', { motiu: 'origin_spoofed' });
  if (!urlRemota(activitat.id) || !mateixOrigen(activitat.id, actor)) return resultat('rebutjada', { motiu: 'activity_id_invalid' });
  if (!TIPUS_ENTRANTS.includes(activitat.type)) return resultat('ignorada', { motiu: 'type_unsupported' });
  const confiat = (url) => nodesDeConfianca.some((o) => { try { return normalitzaOrigen(o) === new URL(url).origin; } catch { return false; } });
  const accept = async (follow) => ({
    '@context': CONTEXT_AS,
    id: `${local}#accepts/${hex(await subtle.digest('SHA-256', enc.encode(follow.id))).slice(0, 32)}`,
    type: 'Accept', actor: local, to: [actor], object: { id: follow.id, type: 'Follow', actor, object: local }
  });
  const inboxDeLActor = idDe(documentActor) === actor ? urlRemota(documentActor.inbox)?.href ?? null : null;

  // 1 · Validació pura: res del magatzem encara. `efecte` és el que farà si no és una repetició.
  let efecte = null;
  switch (activitat.type) {
    case 'Follow': {
      if (idDe(activitat.object) !== local) return resultat('rebutjada', { motiu: 'follow_target_mismatch' });
      if (!inboxDeLActor) return resultat('ignorada', { motiu: 'actor_without_inbox' });
      efecte = async () => {
        const resposta = await accept(activitat);
        const estat = await magatzem.desaSeguidor({ slug, actor, inbox: inboxDeLActor, followId: activitat.id, acceptId: resposta.id, des: new Date(ara).toISOString() });
        return resultat('processada', {
          efectes: [{ tipus: estat === 'nou' ? 'seguidor_afegit' : 'seguidor_existent', actor }],
          lliuraments: [{ inbox: inboxDeLActor, activitat: resposta }]
        });
      };
      break;
    }
    case 'Undo': {
      const objecte = activitat.object;
      const id = idDe(objecte);
      const tipus = objecte && typeof objecte === 'object' ? objecte.type : null;
      if (!id) return resultat('rebutjada', { motiu: 'invalid_activity' });
      if (tipus && tipus !== 'Follow' && tipus !== 'Announce') return resultat('ignorada', { motiu: 'type_unsupported' });
      if (tipus === 'Follow' && (idDe(objecte.actor) !== actor || idDe(objecte.object) !== local)) return resultat('rebutjada', { motiu: 'authorship_mismatch' });
      if (tipus === 'Announce' && idDe(objecte.actor) && idDe(objecte.actor) !== actor) return resultat('rebutjada', { motiu: 'authorship_mismatch' });
      efecte = async () => {
        // Sense tipus (només l'id), es prova com a Follow i després com a Announce.
        if (tipus !== 'Announce' && await magatzem.retiraSeguidor({ slug, actor, followId: id })) {
          return resultat('processada', { efectes: [{ tipus: 'seguidor_retirat', actor }] });
        }
        if (tipus !== 'Follow' && await magatzem.retiraAlertaRemota({ actor, activitat: id })) {
          return resultat('processada', { efectes: [{ tipus: 'alerta_retirada', actor }] });
        }
        return resultat('ignorada', { motiu: 'nothing_to_undo' });
      };
      break;
    }
    case 'Delete': {
      const objecte = idDe(activitat.object);
      if (objecte === actor) {
        efecte = async () => {
          const n = await magatzem.retiraActorRemot(actor);
          return n ? resultat('processada', { efectes: [{ tipus: 'actor_retirat', actor }] }) : resultat('ignorada', { motiu: 'nothing_to_delete' });
        };
        break;
      }
      if (!objecte || !mateixOrigen(objecte, actor)) return resultat('rebutjada', { motiu: 'authorship_mismatch' });
      efecte = async () => {
        const fet = await magatzem.retiraAlertaRemota({ id: objecte, actor, lapida: confiat(actor), ara });
        return fet ? resultat('processada', { efectes: [{ tipus: 'alerta_retirada', id: objecte }] }) : resultat('ignorada', { motiu: 'nothing_to_delete' });
      };
      break;
    }
    default: {
      // Create i Announce: només alertes municipals de nodes de confiança.
      if (!confiat(actor)) return resultat('ignorada', { motiu: 'not_trusted' });
      let objecte = activitat.object;
      if (activitat.type === 'Create') {
        if (!objecte || typeof objecte !== 'object' || idDe(objecte.attributedTo) !== actor || !mateixOrigen(objecte.id, actor)) {
          return resultat('rebutjada', { motiu: 'authorship_mismatch' });
        }
      } else {
        // Announce: un objecte d'un autor de confiança i del seu mateix origen. L'inclòs només es creu si
        // a més és de l'origen de qui l'anuncia (com trustworthy_attribution? de Mastodon); si no, es
        // demana a l'origen amb obtenDocument (injectat) i es comprova igual.
        const fiable = (o) => {
          const autor = idDe(o?.attributedTo);
          return Boolean(o && typeof o === 'object' && autor && confiat(autor) && mateixOrigen(o.id, autor));
        };
        const inclos = objecte && typeof objecte === 'object' ? objecte : null;
        if (!inclos || !mateixOrigen(idDe(inclos), actor) || !fiable(inclos)) {
          const id = idDe(objecte);
          if (!urlRemota(id) || typeof obtenDocument !== 'function') return resultat('ignorada', { motiu: 'object_unverifiable' });
          try { objecte = await obtenDocument(id); } catch { objecte = null; }
          if (objecte?.id !== id || !fiable(objecte)) return resultat('ignorada', { motiu: 'object_unverifiable' });
        }
      }
      const propietari = activitat.type === 'Create' ? actor : idDe(objecte.attributedTo);
      const { alerta, motiu } = alertaDe(objecte, { actor: propietari, via: activitat.type === 'Announce' ? actor : null, activitat: activitat.id, ara });
      if (!alerta) return resultat('ignorada', { motiu });
      efecte = async () => {
        const estat = await magatzem.desaAlertaRemota(alerta);
        if (estat === 'esborrada') return resultat('ignorada', { motiu: 'object_deleted' });
        return resultat('processada', { efectes: [{ tipus: estat === 'nova' ? 'alerta_desada' : 'alerta_existent', id: alerta.id }] });
      };
    }
  }

  // 2 · Idempotència: la reclamació abans de cap efecte (ARB-M13-04: tres estats nova / en_curs / feta).
  const reclamada = await magatzem.reclamaActivitat(activitat.id, { actor, tipus: activitat.type, rebuda: new Date(ara).toISOString() });
  if (reclamada === 'en_curs') {
    return resultat('en_curs', { motiu: 'activity_in_progress' });
  }
  if (!reclamada || reclamada === 'feta') {
    const lliuraments = activitat.type === 'Follow' ? [{ inbox: inboxDeLActor, activitat: await accept(activitat) }] : [];
    return resultat('duplicada', { lliuraments });
  }
  let r = null;
  try {
    r = await efecte();
  } catch (fallada) {
    // ARB-M13-04: si l'efecte i l'alliberament fallen alhora, la reclamació es marca com a en_curs fallida
    // perquè una rèplica abans de REPRESA_EN_CURS_MS reba 503 i reintente, mai 202 duplicada.
    try {
      await magatzem.alliberaActivitat(activitat.id);
    } catch {
      if (typeof magatzem.marcaEnCursFallida === 'function') {
        try { await magatzem.marcaEnCursFallida(activitat.id); } catch { /* s'ignora */ }
      }
    }
    throw fallada;
  }
  // B5 · Fora del try: l'efecte ja és fet i no s'ha d'alliberar. Si la confirmació falla, la
  // reclamació queda «en curs» i el servidor la reprén més tard (els efectes són idempotents).
  if (typeof magatzem.confirmaActivitat === 'function') {
    try { await magatzem.confirmaActivitat(activitat.id); } catch { /* es reprendrà */ }
  }
  return r;
}

/**
 * La petició sencera (POST /ap/inbox/<slug>[?…]) per a Deno.serve, node:http o
 * un middleware: {status, capcaleres, cos, lliuraments}. 405 (Allow: POST),
 * 404 (inbox desconeguda), 415, 413, 401 {error: motiu de la signatura},
 * 400 invalid_json, i en la resta l'estat del processador (202, 400, 401, 403, 404).
 * `cami` és el camí rebut amb la consulta: la consulta es signa, la ruta no la porta.
 * `cos`: qui desplega el llig amb un sostre de MAXIM_COS_INBOX + 1 octets (mai
 * req.arrayBuffer() sense límit); el que en passa ja és 413 ací.
 * B5 · `prefixCami` ('' per defecte; p. ex. '/functions/v1/ap-inbox-verifica'): la
 * ruta es busca després de llevar-lo del camí rebut, però la signatura es
 * verifica sobre el camí SENCER. `hostEsperat`: el host signat que s'accepta
 * (per defecte, el de l'origen). Amb un prefix mal format, cap ruta (404).
 */
export async function atenPeticioInbox({ metode, cami, capcaleres, cos }, {
  origen, actorsLocals = [], obtenClauPublica, magatzem, nodesDeConfianca = [], obtenDocument = null, ara, subtle = globalThis.crypto?.subtle,
  hostEsperat = null, prefixCami = ''
} = {}) {
  const json = (status, objecte, extra = {}) => ({ status, capcaleres: { 'Content-Type': 'application/json; charset=utf-8', ...extra }, cos: objecte, lliuraments: [] });
  if (String(metode).toUpperCase() !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  const rebut = String(cami ?? '');
  const prefix = typeof prefixCami === 'string' ? prefixCami : '';
  const camiSol = rebut.split('?')[0];
  const ruta = PREFIX_CAMI.test(prefix) && camiSol.startsWith(prefix) ? CAMI_INBOX.exec(camiSol.slice(prefix.length)) : null;
  if (!ruta || !actorsLocals.includes(ruta[1])) return json(404, { error: 'not_found' });
  const mapa = mapaCapcaleres(capcaleres);
  const tipus = (mapa.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!['application/activity+json', 'application/ld+json'].includes(tipus)) return json(415, { error: 'unsupported_media_type' });
  const bytes = bytesDe(cos ?? '');
  if (!bytes || bytes.length > MAXIM_COS_INBOX) return json(413, { error: 'payload_too_large' });
  const base = normalitzaOrigen(origen);
  const verificacio = await verificaSignaturaHttpActivityPub({
    metode: 'POST', cami: rebut, capcaleres: mapa, cos: bytes, obtenClauPublica, hostEsperat: hostEsperat || new URL(base).host, ara, subtle
  });
  if (!verificacio.valida) return json(401, { error: verificacio.motiu });
  let activitat = null;
  try { activitat = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return json(400, { error: 'invalid_json' }); }
  const r = await processaActivitatInbox(activitat, {
    slug: ruta[1], origen: base, actorsLocals, signant: verificacio, documentActor: verificacio.documentActor, magatzem, nodesDeConfianca, obtenDocument, ara, subtle
  });
  return { ...json(r.http, { estat: r.estat, ...(r.motiu ? { motiu: r.motiu } : {}) }), lliuraments: r.lliuraments };
}

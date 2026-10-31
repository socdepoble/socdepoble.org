/**
 * instantania-consola.mjs — Decisió del Mestre (31-10-2026) · la instantània
 * sanejada de la Consola que el build web publica a dist/__iaia/.
 *
 * «Sí, vull que la web publicada mostre una instantània sanejada amb totes les
 * dades reals de la Consola a qualsevol usuari» (prompt 261030_2208, T2.2).
 *
 * Qui la fa: el connector sdp:consola-instantania (apply 'build') de
 * tooling/vite/consola-iaia.mjs, que vite.config.js registra amb consolaIaia().
 * Crida ELS MATEIXOS productors que servix el middleware de desenvolupament
 * (recullConsola, recullMapa, recullGovern amb el vocabulari de
 * matriuGovern.js i recullEmpaquetats), passa cada resposta per
 * sanejaInstantania i n'emet quatre JSON estàtics, sense sagnat:
 *   __iaia/consola.json · __iaia/mapa.json · __iaia/govern.json · __iaia/empaquetats.json
 * La Consola publicada els llig amb un GET al mateix origen i sense
 * credencials (src/sections/consola/fontsConsola.js); les escriptures
 * continuen només en desenvolupament. Ni el connector de WordPress
 * (vite.standalone.config.js) ni el natiu (vite.natiu.config.js) registren
 * consolaIaia(): no porten instantània i la Consola no hi demana res.
 *
 * Un productor que falla (sense git, sense Llibre: el build reproduïble de
 * flake.nix no en porta) no atura el build: la seua font ix com un sobre
 * d'error (ESQUEMA_ERROR) amb un text fix i la Consola el pinta com a error,
 * no com a dada. El rellotge és SOURCE_DATE_EPOCH si n'hi ha (build
 * reproduïble); si no, el d'ara.
 *
 * SANEJADOR (fail-closed). Cada text i cada clau de les quatre fonts:
 *   · S'emmascara: els camins /Users/<usuari> → ~ (emmascaraCamins de
 *     tooling/wiki/lib/publication-policy.mjs, la frontera dels exportadors
 *     públics); els correus de persones (tota adreça que no siga una de les
 *     ja publicades, CORREUS_PUBLICS, ni d'un domini sintètic: RFC 2606 i
 *     6761); els telèfons; els NIF, NIE i DNI amb la lletra de control
 *     vàlida, i els que porten davant «DNI», «NIF» o «NIE» encara que no
 *     porten lletra; els IBAN i els CCC amb els dígits de control vàlids; les
 *     targetes que passen Luhn amb un prefix de targeta, i les IP privades
 *     (10/8, 172.16/12, 192.168/16, 169.254/16 i 100.64/10, la de Tailscale).
 *     Els patrons de correu, telèfon i NIF són els de
 *     tooling/gates/tractor-llavor.mjs, que és una porta i no exporta res.
 *     Els noms i les adreces postals no es cacen (com la llavor): el del
 *     titular ja és a /legal (LSSI, art. 10).
 *   · Atura el build (ErrorInstantania, amb el tipus i el camí del JSON, mai
 *     el valor; el camí es fa amb les claus ja emmascarades): JWT, claus
 *     Supabase sb_secret_ i sb_publishable_ (cap no hi té lloc), tokens
 *     Bearer, credencials, tokens o signatures dins d'una URL, els tokens dels
 *     proveïdors coneguts (GitHub, Anthropic, OpenAI, Google, AWS, Slack,
 *     Discord, Stripe, Matrix, GitLab, npm, Hugging Face), assignacions de
 *     secrets (api_key=…, JWT_SECRET=…, SMTP_PASS: …) i camps JSON amb nom de
 *     secret, claus privades (PEM, VAPID, JWK, PKCS#8: findPrivateKeySecrets
 *     de tooling/lib/dist-secrets.mjs), claus de DeepL, qualsevol valor
 *     secret de l'entorn (tots els .env* de l'arrel, de supabase/ i de
 *     supabase/functions/, i el procés: secretsPrivatsDeLEntorn i els noms
 *     amb KEY, SECRET, TOKEN, PASSWORD…) i el nom d'usuari del sistema fora
 *     d'un camí.
 * Quantificadors fitats i frontera esquerra a tot arreu (cap ReDoS).
 * Gauntlet f9 (sanejador-llista-negra-estreta, agulles-env-incompletes,
 * cami-error-clau-crua, correus-institucionals-tot-el-domini) · Derogat: els
 * sis formats bloquejants sols, les agulles només dels .env de producció,
 * el camí de l'error amb la clau crua i tot el domini socdepoble.org com a
 * públic.
 *
 * PORTA DE PUBLICABILITAT (Gauntlet f9, F6) · `node
 * tooling/vite/instantania-consola.mjs --comprova` construïx la instantània
 * real d'este arbre amb els productors i l'entorn del build web i ix amb 1,
 * sense mostrar cap valor, si `vite build` s'aturaria. Només llig.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emmascaraCamins } from '../wiki/lib/publication-policy.mjs';
import { findDeepLSecrets, findPrivateKeySecrets, secretsPrivatsDeLEntorn } from '../lib/dist-secrets.mjs';

export const CARPETA_INSTANTANIA = '__iaia';
export const FONTS_INSTANTANIA = Object.freeze(['consola', 'mapa', 'govern', 'empaquetats']);
/** El sobre d'una font que no s'ha pogut produir: { schema, font, codi, error }. */
export const ESQUEMA_ERROR = 'sdp.instantania-error.v1';
export const MARQUES = Object.freeze({
  correu: '[correu emmascarat]',
  telefon: '[telèfon emmascarat]',
  nif: '[NIF emmascarat]',
  iban: '[IBAN emmascarat]',
  compte: '[compte emmascarat]',
  targeta: '[targeta emmascarada]',
  ip: '[IP privada emmascarada]'
});
/**
 * Gauntlet f9 (correus-institucionals-tot-el-domini) · Les úniques adreces del
 * domini propi que ja són públiques: les tres de WebFinger de firebase.json
 * (la prova ho comprova contra eixe fitxer). Qualsevol altra @socdepoble.org
 * pot ser la bústia d'una persona i s'emmascara.
 */
export const CORREUS_PUBLICS = Object.freeze([
  'socdepoble@socdepoble.org', 'la-torre-de-les-macanes@socdepoble.org', 'latorredelesmacanes@socdepoble.org'
]);
/* El text fix de cada font que falla (el missatge d'un error de disc portaria camins). */
const TEXT_ERROR = Object.freeze({
  consola: 'No s’ha pogut llegir consola.json en fer la instantània.',
  mapa: 'No s’ha pogut compilar el Mapa en fer la instantània.',
  govern: 'No s’ha pogut compilar la matriu del Govern en fer la instantània.',
  empaquetats: 'No s’han pogut llegir els empaquetats en fer la instantània.'
});

/** Una cosa que el sanejador no sap sanejar: el build s'atura. El missatge no porta mai el valor. */
export class ErrorInstantania extends Error {
  constructor(tipus, on) {
    // Sense prefix: Vite ja hi posa el nom del connector ([sdp:consola-instantania]).
    super(`${tipus} a ${on}: la instantània de la Consola no es publica i el build s'atura (el valor no es mostra).`);
    this.name = 'ErrorInstantania';
    this.tipus = tipus;
    this.on = on;
  }
}

/* ── Dades personals: s'emmascaren ───────────────────────────────────── */
const DOMINIS_SINTETICS = Object.freeze(['example.com', 'example.net', 'example.org']);
const TLD_SINTETICS = Object.freeze(['example', 'test', 'invalid', 'localhost']);
/* tractor-llavor.mjs (P2), més un TLD de lletres: «vite@7.3.6» és un paquet, no un correu. */
const CORREU = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@([A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63}){1,8})/g;
const TLD_DE_LLETRES = /\.(?:[A-Za-z][A-Za-z0-9-]{0,61}[A-Za-z0-9]|xn--[A-Za-z0-9-]{1,59})$/;
/* tractor-llavor.mjs (P3): l'espanyol, darrere d'una paraula i una barra, WhatsApp i l'estranger. */
const TELEFON_NUCLI = String.raw`(?:(?:\+|00)?34[\s.-]?)?\(?[6789](?:\)?[\s.-]?\d){8}(?![\w]|[.,/-]?\d)`;
const TELEFONS = Object.freeze([
  new RegExp(String.raw`(?<![\w.,/+-])${TELEFON_NUCLI}`, 'g'),
  new RegExp(String.raw`(?<=(?:^|[\s"'\x60(>:;=,])\p{L}{1,24}\/)${TELEFON_NUCLI}(?!\.\p{L})`, 'gu'),
  /\bwa\.me\/\+?\d{8,15}|\bwhatsapp\.com\/send\?phone=\+?\d{8,15}/g,
  /(?<![\w.,/+-])(?:\+|00)(?!34)[1-9]\d{0,2}(?:[\s.-]?\d){6,12}(?![\w]|[.,/-]?\d)/g
]);
/* tractor-llavor.mjs (P4), amb la lletra de control. */
const NIF = /(?<![A-Za-z0-9])(?:[Ee][Ss][\s-]?)?([XYZxyz][\s.-]?\d{7}|\d{2}[.\s]?\d{3}[.\s]?\d{3})(?:[\s.-]?([A-Z])|-?([a-z]))(?![A-Za-z0-9])/g;
const LLETRES_NIF = 'TRWAGMYFPDXBNJZSQVHLCKE';
const IBAN = /(?<![A-Za-z0-9])[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?(?![A-Za-z0-9])/g;
/* Gauntlet f9 (sanejador-llista-negra-estreta) · El que la llista negra deixava passar. */
/* El CCC de 20 xifres (entitat, oficina, dos dígits de control i compte), amb els dígits de control vàlids. */
const CCC = /(?<![\w.,/+-])(\d{4})[\s-]?(\d{4})[\s-]?(\d)(\d)[\s-]?(\d{10})(?![\w]|[.,/-]?\d)/g;
const PESOS_CCC = Object.freeze([1, 2, 4, 8, 5, 10, 9, 7, 3, 6]);
/* Una targeta: de 13 a 19 xifres, amb espais o guions, un prefix de targeta i Luhn. */
const TARGETA = /(?<![\w.,/+-])\d(?:[ -]?\d){12,18}(?![\w]|[.,/-]?\d)/g;
const PREFIX_TARGETA = /^(?:4|5[1-5]|2(?:2[2-9]|[3-6]\d|7[01]|720)|3[47]|6(?:011|5|4[4-9])|35(?:2[89]|[3-8]\d))/;
/* Les IP privades i de Tailscale (100.64/10): diuen on és la xarxa de casa. */
const OCTET = String.raw`(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)`;
const IP_PRIVADA = new RegExp(String.raw`(?<![\w.])(?:10\.${OCTET}|172\.(?:1[6-9]|2\d|3[01])|192\.168|169\.254|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.${OCTET}\.${OCTET}(?![\w]|\.\d)`, 'g');
/* Un document sense lletra, amb el nom davant: «DNI 48123456», «NIE X1234567». */
const DOCUMENT_SENSE_LLETRA = /(\b(?:DNI|NIF|NIE)\b[\s:.ºª°nº-]{0,6})(?:\d{2}\.?\d{3}\.?\d{3}|[XYZ]-?\d{7})(?![\w])/g;

const dominiSintetic = (domini) => {
  const d = domini.toLowerCase();
  const tld = d.split('.').pop();
  return TLD_SINTETICS.includes(tld) || DOMINIS_SINTETICS.some((x) => d === x || d.endsWith(`.${x}`));
};
/* El dígit de control d'un CCC: mòdul 11 amb els pesos de la norma. */
const dcCcc = (xifres) => {
  const r = 11 - ([...xifres].reduce((s, d, i) => s + Number(d) * PESOS_CCC[i], 0) % 11);
  return r === 11 ? 0 : r === 10 ? 1 : r;
};
const cccValid = (entitat, oficina, dc1, dc2, compte) => dcCcc(`00${entitat}${oficina}`) === Number(dc1) && dcCcc(compte) === Number(dc2);
const luhn = (xifres) => {
  let suma = 0;
  for (let i = 0; i < xifres.length; i++) {
    let d = Number(xifres[xifres.length - 1 - i]);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  }
  return suma % 10 === 0;
};
const nifValid = (numero, lletra) => {
  const net = numero.toUpperCase().replace(/[\s.-]/g, '').replace(/^[XYZ]/, (x) => String('XYZ'.indexOf(x)));
  return LLETRES_NIF[Number(net) % 23] === lletra.toUpperCase();
};
/* ISO 13616: les quatre primeres al final, cada lletra en dos dígits, mòdul 97 igual a 1. */
const ibanValid = (brut) => {
  const net = brut.replace(/ /g, '');
  if (net.length < 15 || net.length > 34) return false;
  let resta = 0;
  for (const c of `${net.slice(4)}${net.slice(0, 4)}`) {
    const valor = /\d/.test(c) ? c : String(c.charCodeAt(0) - 55);
    for (const d of valor) resta = (resta * 10 + Number(d)) % 97;
  }
  return resta === 1;
};

/** El text amb les dades personals emmascarades, i quantes de cada classe. Pur. */
export function emmascaraDadesPersonals(text, recompte = {}) {
  const suma = (clau) => { recompte[clau] = (recompte[clau] ?? 0) + 1; };
  let net = emmascaraCamins(text);
  if (net !== text) suma('camins');
  net = net.replace(CORREU, (tros, domini) => {
    if (!TLD_DE_LLETRES.test(domini) || dominiSintetic(domini) || CORREUS_PUBLICS.includes(tros.toLowerCase())) return tros;
    suma('correus');
    return MARQUES.correu;
  });
  // Els números llargs abans que els telèfons: cap telèfon no es menja un tros d'un compte.
  net = net.replace(IBAN, (tros) => {
    if (!ibanValid(tros)) return tros;
    suma('ibans');
    return MARQUES.iban;
  });
  net = net.replace(CCC, (tros, entitat, oficina, dc1, dc2, compte) => {
    if (!cccValid(entitat, oficina, dc1, dc2, compte)) return tros;
    suma('comptes');
    return MARQUES.compte;
  });
  net = net.replace(TARGETA, (tros) => {
    const xifres = tros.replace(/[ -]/g, '');
    if (!PREFIX_TARGETA.test(xifres) || !luhn(xifres)) return tros;
    suma('targetes');
    return MARQUES.targeta;
  });
  net = net.replace(IP_PRIVADA, () => { suma('ips'); return MARQUES.ip; });
  for (const re of TELEFONS) net = net.replace(re, () => { suma('telefons'); return MARQUES.telefon; });
  net = net.replace(NIF, (tros, numero, gran, petita) => {
    if (!nifValid(numero, gran || petita)) return tros;
    suma('nifs');
    return MARQUES.nif;
  });
  net = net.replace(DOCUMENT_SENSE_LLETRA, (tros, davant) => { suma('nifs'); return `${davant}${MARQUES.nif}`; });
  return net;
}

/* ── Secrets: aturen el build ────────────────────────────────────────── */
/* El nom d'un secret en una assignació («SMTP_PASS:», «JWT_SECRET=», «api_key=»):
   la paraula sola o darrere d'un prefix amb guió baix o guionet, mai dins
   d'una paraula («bypass», «secretaria»). */
const NOM_D_ASSIGNACIO = String.raw`(?<![A-Za-z0-9_-])(?:[A-Za-z0-9]{1,40}[_-]){0,6}(?:secret|password|passwd|pass|pwd|token|contrasenya|clau[_-]privada|(?:api|secret|private|access|signing|encryption|master|service[_-]?role)[_-]?key|service[_-]?role|client[_-]?secret)`;
/* Un valor que sembla un secret: ASCII, sense cap marcador de lloc ($VAR,
   process.env, <...>, ***), i o bé de 8 o més amb lletres i xifres, o bé de 20 o més. */
const VALOR_SECRET = String.raw`(?!\$|process\.env|import\.meta|<|\{|\*{3}|x{4}|\.{3})(?:(?=[A-Za-z0-9_+/=.~-]{0,256}\d)(?=[A-Za-z0-9_+/=.~-]{0,256}[A-Za-z])[A-Za-z0-9_+/=.~-]{8,}|[A-Za-z0-9_+/=.-]{20,})`;
const ASSIGNACIO = new RegExp(String.raw`${NOM_D_ASSIGNACIO}["']?\s{0,3}[:=]\s{0,3}["']?${VALOR_SECRET}`, 'i');
/* El nom d'un camp JSON que porta un secret: { "password": "…" }, { "SMTP_PASS": "…" }. */
const CLAU_SECRETA = /^(?:[A-Za-z0-9.-]{0,60}[_-])?(?:pass|pwd)$|^[A-Za-z0-9_.-]{0,60}(?:secret|password|passwd|token|contrasenya|api[_-]?key|private[_-]?key|access[_-]?key|secret[_-]?key|client[_-]?secret|service[_-]?role(?:[_-]?key)?)$/i;
const VALOR_DE_CAMP_SECRET = new RegExp(String.raw`^\s{0,4}${VALOR_SECRET}`);
const BLOQUEJANTS = Object.freeze([
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, 'un JWT'],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}/, 'una clau de Supabase (sb_secret_ o sb_publishable_)'],
  [/\bBearer\s{1,4}[A-Za-z0-9._~+/-]{12,}/, 'un token Bearer'],
  [/\b[a-z][a-z0-9+.-]{1,20}:\/\/[^\s/:@"'`]{1,64}:[^\s/@"'`]{1,128}@/i, 'credencials dins d’una URL'],
  [/[?&#;](?:access_token|refresh_token|id_token|token|auth|api_?key|key|secret|password|code|sig|signature|x-amz-signature|x-amz-credential|x-amz-security-token|x-goog-signature|x-goog-credential)=[^&\s"'`#]{8,}/i, 'un token o una signatura dins d’una URL'],
  [/-----BEGIN [A-Z ]{0,30}PRIVATE KEY-----/, 'una clau privada (PEM)'],
  [/(?<![A-Za-z0-9_-])(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/, 'un token de GitHub'],
  [/(?<![A-Za-z0-9_-])(?:sk-ant-[A-Za-z0-9_-]{16,}|sk-proj-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{32,})/, 'una clau d’API sk- (Anthropic o OpenAI)'],
  [/(?<![A-Za-z0-9_-])AIza[0-9A-Za-z_-]{35}/, 'una clau d’API de Google'],
  [/(?<![A-Za-z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}(?![A-Za-z0-9])/, 'una clau d’accés d’AWS'],
  [/(?<![A-Za-z0-9_-])xox[abposr]-[A-Za-z0-9-]{10,}|hooks\.slack\.com\/services\/[A-Za-z0-9/_-]{10,}|discord(?:app)?\.com\/api\/webhooks\/\d{5,}\/[A-Za-z0-9_-]{20,}/, 'un token o un webhook de Slack o de Discord'],
  [/(?<![A-Za-z0-9_-])(?:(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{20,})/, 'una clau de Stripe'],
  [/(?<![A-Za-z0-9_-])syt_[A-Za-z0-9_-]{16,}/, 'un token d’accés de Matrix'],
  [/(?<![A-Za-z0-9_-])(?:glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|GOCSPX-[A-Za-z0-9_-]{20,}|hf_[A-Za-z0-9]{30,})/, 'un token d’un proveïdor (GitLab, npm, Google OAuth o Hugging Face)'],
  [ASSIGNACIO, 'una assignació d’un secret']
]);
/* Els noms d'entorn que porten secrets (a més dels de secretsPrivatsDeLEntorn). */
const NOM_SECRET = /(?:^|_)(?:KEY|SECRET|TOKEN|PASS|PASSWORD|PASSWD|PWD|PIN|PRIVATE|PRIVADA|PRIV|SERVICE_ROLE|JWT|CREDENTIALS?|SALT|DSN)(?:_|$)/i;
/* …llevat dels que en diuen on és o com es diu, no el secret: SDP_ASC_KEY_PATH, SDP_ANDROID_KEY_ALIAS. */
const NOM_NO_SECRET = /_(?:PATH|DIR|FILE|URL|HOST|ID|ALIAS|NAME|ISSUER)$/i;
/* Una contrasenya pot ser curta: s'hi busca des de 8 caràcters; la resta, des de 16. */
const NOM_CONTRASENYA = /(?:^|_)(?:PASS|PASSWORD|PASSWD|PWD|PIN|CONTRASENYA)(?:_|$)/i;
const MINIM_AGULLA = 16;
const MINIM_CONTRASENYA = 8;
/* Noms d'usuari que són paraules corrents en qualsevol text (CI, contenidors). */
const USUARIS_GENERICS = new Set(['root', 'runner', 'admin', 'user', 'ubuntu', 'node', 'nobody', 'nixbld', 'build', 'builder', 'docker', 'app']);

/* Un .env com el llig dist-secrets.mjs (llegixEnv, que no s'exporta): NOM=valor, amb «export» i cometes opcionals. */
function llegixFitxerEnv(fitxer) {
  const valors = {};
  let text;
  try { text = fs.readFileSync(fitxer, 'utf8'); } catch { return valors; }
  for (const linia of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(linia);
    if (!m) continue;
    let valor = m[2];
    const cometa = valor[0];
    if ((cometa === '"' || cometa === "'") && valor.length >= 2 && valor.endsWith(cometa)) valor = valor.slice(1, -1);
    valors[m[1]] = valor;
  }
  return valors;
}

/** Els valors de tots els .env* (cap *example*) d'`arrel`, de supabase/ i de supabase/functions/, un objecte per fitxer. */
export function valorsDelsEnv(arrel) {
  const fonts = [];
  for (const carpeta of ['', 'supabase', path.join('supabase', 'functions')]) {
    let noms = [];
    try { noms = fs.readdirSync(path.join(arrel, carpeta)); } catch { continue; }
    for (const nom of noms.sort()) {
      if (/^\.env(?:\.[\w.-]+)?$/.test(nom) && !/example/i.test(nom)) fonts.push(llegixFitxerEnv(path.join(arrel, carpeta, nom)));
    }
  }
  return fonts;
}

/**
 * Les agulles dels secrets de l'entorn: secretsPrivatsDeLEntorn (dist-secrets.mjs:
 * les claus privades del procés i dels .env* d'`arrel`) i el valor de cada
 * variable amb nom de secret, de l'`entorn` i de TOTS els .env* d'`arrel`
 * (valorsDelsEnv: també .env.botigues.local i qualsevol .env.<altre>.local,
 * que loadEnv de Vite no llig mai). Mai llança; cap valor no ix d'ací més que
 * cap al sanejador.
 */
export function agullesDeLEntorn({ entorn = {}, arrel = null } = {}) {
  const agulles = new Set(secretsPrivatsDeLEntorn({ env: entorn, arrel }));
  const fonts = [entorn && typeof entorn === 'object' ? entorn : {}, ...(arrel ? valorsDelsEnv(arrel) : [])];
  for (const font of fonts) {
    for (const [nom, valor] of Object.entries(font)) {
      const net = typeof valor === 'string' ? valor.trim() : '';
      if (!NOM_SECRET.test(nom) || NOM_NO_SECRET.test(nom)) continue;
      if (net.length >= (NOM_CONTRASENYA.test(nom) ? MINIM_CONTRASENYA : MINIM_AGULLA)) agulles.add(net);
    }
  }
  return [...agulles].filter((a) => a.length >= MINIM_CONTRASENYA);
}

function comprovaSecrets(text, on, { agulles, usuari }) {
  for (const [re, tipus] of BLOQUEJANTS) if (re.test(text)) throw new ErrorInstantania(`Hi ha ${tipus}`, on);
  if (findPrivateKeySecrets(text).length) throw new ErrorInstantania('Hi ha una clau privada (VAPID, JWK o PKCS#8)', on);
  if (findDeepLSecrets(text).length) throw new ErrorInstantania('Hi ha una clau de DeepL', on);
  for (const agulla of agulles) if (text.includes(agulla)) throw new ErrorInstantania('Hi ha el valor d’un secret de l’entorn', on);
  if (usuari && text.toLowerCase().includes(usuari)) throw new ErrorInstantania('Hi ha el nom d’usuari del sistema fora d’un camí', on);
}

const usuariVigilat = (usuari) => {
  const net = typeof usuari === 'string' ? usuari.trim().toLowerCase() : '';
  return net.length >= 4 && !USUARIS_GENERICS.has(net) ? net : null;
};
const usuariDelSistema = () => { try { return os.userInfo().username; } catch { return null; } };

/**
 * Una còpia sanejada de `valor` (JSON pla). Emmascara les dades personals a
 * cada text i clau, i llança ErrorInstantania davant de qualsevol secret o
 * de qualsevol cosa que no siga JSON (funcions, símbols, cicles).
 * `recompte` acumula quantes coses s'han emmascarat de cada classe.
 */
export function sanejaInstantania(valor, { on = 'instantània', agulles = [], usuari = usuariDelSistema(), recompte = {} } = {}) {
  const context = { agulles: agulles.filter((a) => typeof a === 'string' && a.length >= MINIM_CONTRASENYA), usuari: usuariVigilat(usuari) };
  const vistos = new WeakSet();
  /* Els secrets, en el text tal com arriba i en l'emmascarat; el nom d'usuari,
     només en l'emmascarat (dins d'un camí ja s'ha canviat per ~). */
  const text = (brut, cami) => {
    const net = emmascaraDadesPersonals(brut, recompte);
    comprovaSecrets(brut, cami, { ...context, usuari: null });
    comprovaSecrets(net, cami, context);
    return net;
  };
  const recorre = (v, cami) => {
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new ErrorInstantania('Hi ha un número que no és JSON', cami);
      return v;
    }
    if (typeof v === 'string') return text(v, cami);
    if (typeof v !== 'object') throw new ErrorInstantania(`Hi ha un valor de tipus ${typeof v}`, cami);
    if (vistos.has(v)) throw new ErrorInstantania('Hi ha una referència circular', cami);
    vistos.add(v);
    let eixida;
    if (Array.isArray(v)) eixida = v.map((x, i) => recorre(x, `${cami}[${i}]`));
    else {
      const proto = Object.getPrototypeOf(v);
      if (proto !== Object.prototype && proto !== null) throw new ErrorInstantania('Hi ha un objecte que no és JSON pla', cami);
      eixida = {};
      for (const [clau, x] of Object.entries(v)) {
        if (x === undefined) continue;
        /* Gauntlet f9 (cami-error-clau-crua) · La clau es saneja abans i el camí
           dels errors es fa amb la sanejada: una dada personal d'una clau no ix
           al registre del build. Derogat: el camí amb la clau crua. */
        const clauNeta = text(clau, `${cami} (clau)`);
        const camiDeLaClau = `${cami}.${clauNeta.replace(/[^\w-]/g, '_').slice(0, 40)}`;
        if (typeof x === 'string' && CLAU_SECRETA.test(clau) && VALOR_DE_CAMP_SECRET.test(x)) {
          throw new ErrorInstantania('Hi ha un secret en un camp amb nom de secret', camiDeLaClau);
        }
        eixida[clauNeta] = recorre(x, camiDeLaClau);
      }
    }
    vistos.delete(v);
    return eixida;
  };
  return recorre(valor, on);
}

/** El sobre d'error d'una font que no s'ha pogut produir: el codi i el text fix del compilador del Govern, o el de la font. */
export function sobreDError(font, error) {
  const controlat = error?.name === 'ErrorGovern' && typeof error.codi === 'string' && typeof error.message === 'string';
  return {
    schema: ESQUEMA_ERROR,
    font,
    codi: controlat ? error.codi : 'intern',
    error: controlat ? error.message : TEXT_ERROR[font]
  };
}

/** L'instant de la instantània: SOURCE_DATE_EPOCH (segons) si n'hi ha, per a un build reproduïble; si no, el d'ara. */
export function instantDeLaInstantania(env = process.env, ara = Date.now()) {
  const epoca = Number(env?.SOURCE_DATE_EPOCH);
  return env?.SOURCE_DATE_EPOCH && Number.isFinite(epoca) ? epoca * 1000 : ara;
}

/**
 * Les quatre fonts sanejades: { fitxers: Map(nom de fitxer → JSON), recompte, errors }.
 * `productors` és { consola, mapa, govern, empaquetats }, cada un una funció
 * que torna (o promet) la resposta del middleware; un que llança dona el
 * sobre d'error. Un secret o una cosa que no es pot sanejar llança
 * ErrorInstantania i no torna res.
 */
export async function construeixInstantania({ productors, agulles = [], usuari = usuariDelSistema() } = {}) {
  const recompte = {};
  const errors = [];
  const fitxers = new Map();
  for (const font of FONTS_INSTANTANIA) {
    if (typeof productors?.[font] !== 'function') throw new TypeError(`construeixInstantania necessita el productor «${font}».`);
    let valor;
    try {
      valor = await productors[font]();
    } catch (e) {
      valor = sobreDError(font, e);
      errors.push({ font, codi: valor.codi });
    }
    const net = sanejaInstantania(valor, { on: `${font}.json`, agulles, usuari, recompte });
    fitxers.set(`${CARPETA_INSTANTANIA}/${font}.json`, JSON.stringify(net));
  }
  return { fitxers, recompte, errors };
}

/**
 * Gauntlet f9 (F6-prova-de-l-arbre-real-buida) · La porta de publicabilitat:
 * cada font de `productors` sanejada com al build, una per una perquè es
 * vegen totes. { publicable, fonts: [{ font, estat: 'ok' | 'error' | 'atura', codi?, missatge? }] }.
 * 'error' és un sobre d'error (la Consola el pinta com a error i el build no
 * s'atura); 'atura', el que faria caure `vite build`. Cap valor: el missatge és
 * el d'ErrorInstantania (el tipus i el camí).
 */
export async function comprovaPublicabilitat({ productors, agulles = [], usuari = usuariDelSistema() } = {}) {
  const fonts = [];
  for (const font of FONTS_INSTANTANIA) {
    let valor;
    try { valor = await productors[font](); } catch (e) { valor = sobreDError(font, e); }
    try {
      sanejaInstantania(valor, { on: `${font}.json`, agulles, usuari });
      fonts.push(valor?.schema === ESQUEMA_ERROR ? { font, estat: 'error', codi: valor.codi } : { font, estat: 'ok' });
    } catch (e) {
      if (!(e instanceof ErrorInstantania)) throw e;
      fonts.push({ font, estat: 'atura', missatge: e.message });
    }
  }
  return { publicable: fonts.every((f) => f.estat !== 'atura'), fonts };
}

/* `node tooling/vite/instantania-consola.mjs --comprova`: la porta, amb els
   productors del build (consola-iaia.mjs) i l'entorn de producció. Ix amb 1
   si el build web s'aturaria. Carregat per Vite (amb ?v=), no fa res. */
const esPrincipal = () => {
  try { return Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]); } catch { return false; }
};
if (esPrincipal()) {
  if (!process.argv.includes('--comprova')) {
    console.error('Ús: node tooling/vite/instantania-consola.mjs --comprova');
    process.exitCode = 2;
  } else {
    const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const [{ productorsDeLaInstantania }, { loadEnv }] = await Promise.all([import('./consola-iaia.mjs'), import('vite')]);
    const { publicable, fonts } = await comprovaPublicabilitat({
      productors: productorsDeLaInstantania({ arrel, ara: instantDeLaInstantania(process.env) }),
      agulles: agullesDeLEntorn({ entorn: loadEnv('production', arrel, ''), arrel })
    });
    for (const f of fonts) {
      console.log(f.estat === 'ok' ? `${f.font}.json: es pot publicar.`
        : f.estat === 'error' ? `${f.font}.json: ix com a sobre d'error (${f.codi}); la Consola publicada ho dirà.`
          : `${f.font}.json: el build s'atura. ${f.missatge}`);
    }
    console.log(publicable ? 'La instantània de la Consola es pot publicar.' : 'La instantània de la Consola NO es pot publicar: `vite build` s’aturaria.');
    process.exitCode = publicable ? 0 : 1;
  }
}

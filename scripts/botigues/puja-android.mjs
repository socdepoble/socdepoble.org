/**
 * scripts/botigues/puja-android.mjs — AAB de publicació, verificació de la signatura i pujada a
 * Google Play (RUNBOOK_BOTIGUES_IA.txt, A4-A5). 261003.
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/puja-android.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs, per al canal de
 * producció (B9, marató 261101_2143) tests/botigues.produccio.android.test.js, i per al client de
 * l'API de Google Play (R32.3) tests/botigues-play-api-rest.test.mjs.
 *
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7                     en sec
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --compila           bundleRelease i verificació
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --confirma=1.0.0+7  verifica i PUJA (esborrany intern)
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --desplega --confirma=1.0.0+7
 *                                                                  verifica, PUJA i DESPLEGA a la prova interna
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --canal alpha --desplega --confirma=alpha:1.0.0+7
 *                                                                  verifica, PUJA i DESPLEGA a la prova tancada (alpha)
 *   node scripts/botigues/puja-android.mjs --comprova-play         prova la clau i els permisos sense publicar res
 *
 * Onada R32.3 (P0, ordre del Mestre 261116 22:09: «les actualitzacions han de ser completament
 * automàtiques i en tot el sistema») · La pujada ja no depén de fastlane supply, que no era
 * instal·lat en este Mac: Google Play no rebia cap AAB. Ara és un client HTTPS de Node pur
 * (cap dependència) per a la Google Play Developer API v3 (androidpublisher):
 *   1. un JWT RS256 signat amb node:crypto amb el client_email i la private_key del JSON del compte
 *      de servei (SDP_PLAY_JSON_KEY_PATH, per RUTA), canviat per un token d'accés a
 *      https://oauth2.googleapis.com/token (grant_type urn:ietf:params:oauth:grant-type:jwt-bearer,
 *      scope https://www.googleapis.com/auth/androidpublisher);
 *   2. edits.insert → edits.bundles.upload (l'AAB en streaming, uploadType=media,
 *      application/octet-stream; el sha256 dels octets enviats i el que torna Google han de ser el
 *      de l'AAB verificat) → edits.tracks.update (pista internal, alpha o production, versionCodes i
 *      status) → edits.validate → edits.commit. Si res falla abans del commit, l'edició s'esborra
 *      (edits.delete) i a Google Play no canvia res.
 * Els errors HTTP ixen amb un missatge net (cap token, asserció, clau ni compte de servei), cada
 * petició té temps màxim i només els 5xx i els errors de xarxa es reintenten (3 intents, espera
 * exponencial). El commit MAI es reintenta (no és idempotent): un 2xx és fet, un 4xx és un «no» net,
 * i qualsevol altra resposta es contrasta amb Play (edits.get i una edició de lectura amb
 * edits.tracks.get); si Play no ho pot dir, l'estat és DESCONEGUT (eixida 11, EIXIDA_PLAY_DESCONEGUT),
 * l'edició no s'esborra i ningú ho ha de repetir sense mirar Play Console (Gauntlet R32.3, Elefant).
 * Onada v1.2.16 (prompt 261121_0216, T3.1; ordres del Mestre 261121 01:32 i 01:55) · --canal alpha puja
 * l'AAB a la pista TANCADA «alpha» de Google Play, la dels verificadors del grup socdepoble-testers
 * (la prova tancada de 12 provadors × 14 dies, P0-23). Amb --desplega, el llançament queda «completed»
 * i els verificadors el reben de Google Play sense cap clic; sense, és un esborrany. El «sí» va lligat
 * al canal: --confirma=alpha:VERSIO+BUILD. ZERO APK fora de botiga: este script només puja AAB a Google
 * Play, i cap camí d'eina no ofereix ni anuncia cap APK directe (publica-tot.mjs, MOTIU_APK_APAGAT).
 * Les adreces de Google són fixes: només una opció explícita de les proves
 * (main(argv, { play: { endpoints } })) les canvia, i només a https o a un http de
 * 127.0.0.1/localhost. Cap variable d'entorn les toca.
 *
 * El contracte de pista i estat és el de sempre (D-B9-3): el llançament és un ESBORRANY (draft); a
 * producció mai completed ni per fases, i «Envia a revisió» és del Mestre (P9). Única excepció,
 * opcional i explícita: --desplega a la prova interna o a la tancada (alpha) (status completed), perquè
 * els provadors d'eixa pista reben l'actualització de Google Play sense cap clic a Play Console. Si
 * Play encara té l'app en esborrany, només admet llançaments draft: Play ho diu i el script ho explica.
 *
 * GUIA DE 3 PASSOS PER AL MESTRE · SDP_PLAY_JSON_KEY_PATH [NO VERIFICATS els noms exactes dels menús]:
 *   1. Descarrega el JSON del compte de servei amb permisos de llançament. Al projecte de Google
 *      Cloud lligat a Play Console: activa «Google Play Android Developer API», crea un compte de
 *      servei i, a «Claus › Afig una clau › JSON», descarrega'n la clau (un sol fitxer .json). A
 *      Play Console › Usuaris i permisos, convida el client_email d'eixe compte amb accés a Sóc de
 *      Poble i els permisos de llançament a les pistes de prova (i a producció, si cal). El JSON és
 *      un secret: mai al repositori, al xat ni a cap IA.
 *   2. Desa'l FORA del repositori amb mode 600:
 *        mkdir -p ~/claus-socdepoble && mv ~/Downloads/<nom-de-la-clau>.json ~/claus-socdepoble/play-compte-servei.json
 *        chmod 600 ~/claus-socdepoble/play-compte-servei.json
 *   3. Apunta-hi SDP_PLAY_JSON_KEY_PATH a .env.botigues.local (que també és chmod 600):
 *        SDP_PLAY_JSON_KEY_PATH=~/claus-socdepoble/play-compte-servei.json
 *      i comprova-ho sense publicar res (token, edits.insert i edits.delete):
 *        node scripts/botigues/puja-android.mjs --comprova-play
 *
 * B9 · --canal produccio deixa l'AAB en ESBORRANY a la pista production (mai completed ni per fases:
 * «Envia a revisió» és del Mestre, P9). El «sí» va lligat al canal i al binari:
 * --confirma=produccio:VERSIO+BUILD@<12 primers del sha256 de l'AAB>, que dona el rebut en sec (si
 * l'AAB ja l'has signat a Android Studio) o el de --compila; --compila i --confirma no van junts.
 * Cada pujada feta s'apunta a SDP_BUILDS_DIR/pujades.jsonl (fora del repositori), i un build que ja
 * hi és no es torna a pujar. Un compte personal de Play només publica a producció després de la
 * prova tancada (12 provadors × 14 dies, P0-23) o amb un compte d'organització (D-B9-2).
 *
 * Per defecte no fa res: preflight, versió de build.gradle, pla. La signatura és del Mestre
 * (RUNBOOK A4, opció A: Android Studio o el seu gradlew, amb les contrasenyes que posa ell). Si el
 * Mestre decidix que la signe el script, --compila llig la keystore per RUTA i les dues
 * contrasenyes del fitxer d'entorn, i les passa NOMÉS a l'entorn del procés de Gradle (amb
 * --no-daemon, perquè cap dimoni se les quede); mai a la línia d'ordres ni a la pantalla.
 * Només --confirma=VERSIO+BUILD puja.
 * R24 botigues (D2) · Abans de keytool, l'AAB es mira per dins: cap classe de com.facebook (dexDeLAab).
 * Gradle compila amb el JDK que tria el preflight (del JDK_MINIM al JDK_MAXIM, 21-24, a entorn.mjs), passat per JAVA_HOME
 * només al procés de Gradle: el java del PATH d'este Mac és un 17 i Capacitor 8 compila amb Java 21
 * [VERIFICAT 261019].
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, CANALS, EIXIDA, SEGELL, VERSIO, analitzaArguments, analitzaConfirmacio, apuntaPujada, avisDelRegistre, canalAdmes, carregaEntorn,
  comprovaVariables, confirmacioEsperada, emmascara, empremtaDeKeytool, guardaDelRegistre, REBUTS, executa, llegixDelZip, mostraCami,
  mostraOrdre, normalitzaEmpremta, plega, problemaDelPaquet, rutaDe, sha256DeFitxer, usDelCanal, versioDeGradle
} from './entorn.mjs';
import { arrelComprovada, llegixClauPlay, preflight } from './preflight.mjs';

import { problemaDeVersioClient } from './versio-client.mjs';

const ADMESOS = Object.freeze({
  versio: true, build: true, compila: false, confirma: true, canal: true, push: false, desplega: false, 'comprova-play': false, ajuda: false
});
const US = 'Ús: --versio X.Y.Z --build N [--canal intern|alpha|produccio] [--push] [--desplega] [--compila] [--confirma=X.Y.Z+N | --confirma=alpha:X.Y.Z+N | --confirma=produccio:X.Y.Z+N@<sha12>] · o --comprova-play';
export const AAB = Object.freeze(['android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab']);

/* ───────────────── R32.3 · Client REST de la Google Play Developer API v3 ───────────────── */

/** Les adreces de Google. Fixes: cap variable d'entorn les canvia (endpointsDePlay). */
export const PLAY_API = Object.freeze({
  token: 'https://oauth2.googleapis.com/token',
  api: 'https://androidpublisher.googleapis.com/androidpublisher/v3',
  pujada: 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3'
});
export const ABAST_PLAY = 'https://www.googleapis.com/auth/androidpublisher';
export const CONCESSIO_JWT = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
/** La pista de Play de cada canal (CANALS d'entorn.mjs). v1.2.16 · alpha és la prova tancada (PISTES.alpha = 'alpha'). */
export const PISTES = Object.freeze({ [CANALS.INTERN]: 'internal', [CANALS.PRODUCCIO]: 'production', [CANALS.ALPHA]: 'alpha' });
/** L'status del llançament: draft sempre, completed només amb --desplega a la prova interna o a la tancada (alpha). */
export const ESTATS_PLAY = Object.freeze({ ESBORRANY: 'draft', DESPLEGAT: 'completed' });
/** Temps màxim de cada petició (ms): les de JSON i la pujada de l'AAB (~107 MB el 261116). */
export const TEMPS_PLAY = Object.freeze({ peticio: 60_000, pujada: 20 * 60_000 });
/** Intents totals (amb l'espera inicial, que es duplica a cada intent) per a 5xx i errors de xarxa. */
export const REINTENTS_PLAY = Object.freeze({ intents: 3, esperaMs: 2_000 });

const DURADA_JWT_S = 3600;
const MAX_RESPOSTA = 1024 * 1024;
const MAX_TEXT_ERROR = 300;
const AGENT_HTTP = 'socdepoble-botigues/1.0 (Node.js)';
const PAQUET = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/;
const ID_EDICIO = /^[A-Za-z0-9_-]{1,200}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const AMFITRIONS_LOCALS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const COMMIT_SENSE_REVISIO = /set the query parameter changesNotSentForReview to true/i;

/** Un error del client de Play. `tipus`: clau, us, endpoint, xarxa, temps, http, resposta o verificacio. */
export class ErrorPlay extends Error {
  constructor(missatge, { tipus = 'http', operacio = null, estat = null, detall = null, consell = null } = {}) {
    super(missatge);
    this.name = 'ErrorPlay';
    this.tipus = tipus;
    this.operacio = operacio;
    this.estat = estat;
    this.detall = detall;
    this.consell = consell;
  }
}

/**
 * Un text que pot portar secrets (el d'una resposta d'error), net: sense els `secrets` coneguts
 * (token, asserció, compte de servei, kid), sense cap clau PEM, JWT, token ya29, Bearer ni compte de
 * servei, sense caràcters de control (ni seqüències de terminal) i d'una línia de 300 caràcters com a molt.
 */
export function netejaText(text, secrets = []) {
  let net = String(text ?? '');
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 6) net = net.split(secret).join('<secret>');
  }
  net = net
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?(?:-----END [A-Z ]+-----|$)/g, '<clau>')
    .replace(/\beyJ[\w-]{2,}\.[\w-]{2,}\.[\w-]*/g, '<jwt>')
    .replace(/\bya29\.[\w.-]+/g, '<token>')
    .replace(/\bBearer\s+[\w.~+/=-]+/gi, 'Bearer <token>')
    .replace(/[^\s@"'<>()]+@[^\s@"'<>()]+\.iam\.gserviceaccount\.com/gi, '<compte de servei>')
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return net.length > MAX_TEXT_ERROR ? `${net.slice(0, MAX_TEXT_ERROR)}…` : net;
}

/**
 * Les adreces que farà servir el client: PLAY_API, o les de les proves si arriben per opció
 * explícita. Les de proves han de ser les tres, https o http només de 127.0.0.1/localhost, sense
 * credencials, consulta ni fragment.
 */
export function endpointsDePlay(endpoints = null) {
  if (endpoints === null || endpoints === undefined) return PLAY_API;
  const fets = {};
  for (const nom of Object.keys(PLAY_API)) {
    let url;
    try { url = new URL(String(endpoints[nom])); } catch { throw new ErrorPlay(`l'adreça ${nom} de Google Play no és una URL`, { tipus: 'endpoint' }); }
    const local = url.protocol === 'http:' && AMFITRIONS_LOCALS.has(url.hostname);
    if (url.protocol !== 'https:' && !local) throw new ErrorPlay(`l'adreça ${nom} ha de ser https (o http de 127.0.0.1/localhost per a les proves)`, { tipus: 'endpoint' });
    if (url.username || url.password || url.search || url.hash) throw new ErrorPlay(`l'adreça ${nom} no pot portar credencials, consulta ni fragment`, { tipus: 'endpoint' });
    fets[nom] = url.href.replace(/\/+$/, '');
  }
  return Object.freeze(fets);
}

/** L'asserció JWT RS256 que es canvia per un token d'accés (RFC 7523): iss, scope, aud, iat i exp (+1 h). */
export function signaAssercio(clau, { ara = Date.now(), aud = PLAY_API.token } = {}) {
  const b64 = (text) => Buffer.from(text).toString('base64url');
  const iat = Math.floor(ara / 1000);
  const capcalera = { alg: 'RS256', typ: 'JWT', ...(clau.kid ? { kid: clau.kid } : {}) };
  const reclams = { iss: clau.email, scope: ABAST_PLAY, aud, iat, exp: iat + DURADA_JWT_S };
  const signat = `${b64(JSON.stringify(capcalera))}.${b64(JSON.stringify(reclams))}`;
  return `${signat}.${clau.signa(signat).toString('base64url')}`;
}

const esperaReal = (ms) => new Promise((resol) => { setTimeout(resol, ms); });

const errorDeXarxa = (error, operacio) => {
  const codi = /^[A-Z][A-Z0-9_]{1,40}$/.test(String(error?.code ?? '')) ? error.code : 'desconegut';
  return new ErrorPlay(`${operacio}: error de xarxa (${codi})`, { tipus: 'xarxa', operacio });
};

/* Una petició HTTP(S) sense agent compartit, amb temps màxim i resposta fitada. Amb `fitxer`, el cos
   és el fitxer en streaming (exactament `mida` octets) i se'n calcula el sha256 del que s'envia.
   Torna { estat, text, enviats, sha256Enviat }; els errors de xarxa i de temps són ErrorPlay. */
function peticioHttp({ metode, url, capcaleres = {}, cos = null, fitxer = null, tempsMs, operacio }) {
  return new Promise((resol, rebutja) => {
    const desti = new URL(url);
    const modul = desti.protocol === 'https:' ? https : http;
    const cap = { 'User-Agent': AGENT_HTTP, Accept: 'application/json', ...capcaleres };
    cap['Content-Length'] = String(fitxer ? fitxer.mida : (cos === null ? 0 : Buffer.byteLength(cos)));
    let acabat = false;
    let rellotge = null;
    let flux = null;
    let hash = null;
    let enviats = 0;
    let sha256Enviat = null;
    const fi = (accio, valor) => {
      if (acabat) return;
      acabat = true;
      clearTimeout(rellotge);
      if (flux) flux.destroy();
      accio(valor);
    };
    let req;
    try {
      req = modul.request(desti, { method: metode, headers: cap, agent: false }, (res) => {
        const trossos = [];
        let rebuts = 0;
        res.on('data', (tros) => {
          rebuts += tros.length;
          if (rebuts > MAX_RESPOSTA) {
            fi(rebutja, new ErrorPlay(`${operacio}: la resposta passa d'1 MB`, { tipus: 'resposta', operacio, estat: res.statusCode }));
            res.destroy();
            return;
          }
          trossos.push(tros);
        });
        res.on('end', () => fi(resol, { estat: res.statusCode, text: Buffer.concat(trossos).toString('utf8'), enviats, sha256Enviat }));
        res.on('error', (error) => fi(rebutja, errorDeXarxa(error, operacio)));
        res.on('close', () => { if (!res.complete) fi(rebutja, errorDeXarxa({ code: 'ECONNRESET' }, operacio)); });
      });
    } catch (error) {
      rebutja(errorDeXarxa(error, operacio));
      return;
    }
    rellotge = setTimeout(() => {
      const error = new ErrorPlay(`${operacio}: sense resposta en ${Math.max(1, Math.round(tempsMs / 1000))} s`, { tipus: 'temps', operacio });
      fi(rebutja, error);
      req.destroy(error);
    }, tempsMs);
    req.on('error', (error) => fi(rebutja, error instanceof ErrorPlay ? error : errorDeXarxa(error, operacio)));
    if (!fitxer) {
      req.end(cos === null ? undefined : cos);
      return;
    }
    hash = crypto.createHash('sha256');
    flux = fs.createReadStream(fitxer.cami, { start: 0, end: fitxer.mida - 1 });
    flux.on('data', (tros) => {
      if (sha256Enviat !== null) return;
      hash.update(tros);
      enviats += tros.length;
    });
    flux.on('end', () => {
      if (sha256Enviat === null) sha256Enviat = hash.digest('hex');
      /* Un AAB que s'ha escurçat mentre es llegia deixaria el servidor esperant octets fins al temps
         màxim de la pujada: es talla ací, sense commit. */
      if (enviats !== fitxer.mida) {
        const error = new ErrorPlay(`${operacio}: l'AAB ha canviat de mida durant la pujada: no es confirma res`, { tipus: 'verificacio', operacio });
        fi(rebutja, error);
        req.destroy(error);
      }
    });
    flux.on('error', () => {
      const error = new ErrorPlay(`${operacio}: no es pot llegir l'AAB`, { tipus: 'verificacio', operacio });
      fi(rebutja, error);
      req.destroy(error);
    });
    flux.pipe(req);
  });
}

/* Una pista per a cada fallada coneguda de l'API. */
function consellDe(operacio, estat, detall) {
  const text = String(detall ?? '');
  if (operacio === 'token') return estat >= 500 ? null : 'la clau del compte de servei no és vàlida o està revocada, o el rellotge del Mac va desfasat (guia de 3 passos de puja-android.mjs, pas 1)';
  if (/has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(text)) {
    return 'activa «Google Play Android Developer API» al projecte de Google Cloud del compte de servei (guia de 3 passos, pas 1)';
  }
  if (/draft app|status draft/i.test(text)) return 'Play encara té l\'app en esborrany i només admet llançaments draft: torna-ho a fer sense --desplega';
  if (/version ?code|already been used/i.test(text)) {
    return 'este versionCode ja és a Google Play: si una pujada anterior va acabar amb l\'estat DESCONEGUT (eixida 11), ja hi és (mira Play Console i apunta-la al registre); si no, puja el build següent';
  }
  if (estat === 401 || estat === 403) return 'el compte de servei no té permisos per a esta app: Play Console › Usuaris i permisos (guia de 3 passos, pas 1; RUNBOOK H-G4)';
  if (operacio === 'edits.insert' && estat === 404) return 'Play no troba el paquet: si és el PRIMER AAB d\'esta app, s\'ha de pujar a mà (RUNBOOK H-G5)';
  return null;
}

/* L'error d'una resposta no 2xx, amb el missatge de Google net (cos JSON d'API o d'OAuth). */
function errorHttp(resposta, operacio, secrets) {
  let missatge = '';
  try {
    const cos = JSON.parse(resposta.text);
    if (cos?.error && typeof cos.error === 'object') missatge = [cos.error.status, cos.error.message].filter((p) => typeof p === 'string' && p).join(': ');
    else if (typeof cos?.error === 'string') missatge = [cos.error, cos.error_description].filter((p) => typeof p === 'string' && p).join(': ');
  } catch {
    missatge = resposta.text;
  }
  const detall = netejaText(missatge, secrets);
  return new ErrorPlay(`${operacio}: HTTP ${resposta.estat}${detall ? ` · ${detall}` : ''}`, {
    tipus: 'http', operacio, estat: resposta.estat, detall, consell: consellDe(operacio, resposta.estat, detall)
  });
}

function jsonDe(resposta, operacio) {
  if (!resposta.text) return {};
  try {
    const cos = JSON.parse(resposta.text);
    if (cos && typeof cos === 'object' && !Array.isArray(cos)) return cos;
  } catch { /* cau a l'error de baix */ }
  throw new ErrorPlay(`${operacio}: la resposta de Google no és un objecte JSON`, { tipus: 'resposta', operacio, estat: resposta.estat });
}

/* Reintents acotats: només un 5xx, i (si es demana) un error de xarxa o de temps. Cap 4xx. */
async function ambReintents(fes, { intents, esperaMs, espera, reintentaXarxa = true, reintentaTemps = true }) {
  for (let intent = 1; ; intent += 1) {
    try {
      return await fes();
    } catch (error) {
      const reintentable = error instanceof ErrorPlay && ((error.tipus === 'http' && error.estat >= 500)
        || (reintentaXarxa && error.tipus === 'xarxa') || (reintentaTemps && error.tipus === 'temps'));
      if (!reintentable || intent >= intents) throw error;
      await espera(esperaMs * 2 ** (intent - 1));
    }
  }
}

/** L'eixida de puja-android.mjs quan l'estat del commit a Google Play és DESCONEGUT (ni fet ni no fet):
    cap persona ni automatisme l'ha de tornar a provar sense mirar abans Play Console. */
export const EIXIDA_PLAY_DESCONEGUT = 11;

const esCorrecte = (estat) => estat >= 200 && estat < 300;
const STATUS_PLAY = /^[A-Za-z]{1,40}$/;

/* La clau del compte de servei, sense mirar-ne res més que la forma (preflight.mjs, ClauPlay). */
function comprovaClau(clau) {
  if (!clau || typeof clau.signa !== 'function' || typeof clau.email !== 'string' || !clau.email) {
    throw new ErrorPlay('falta la clau del compte de servei (SDP_PLAY_JSON_KEY_PATH)', { tipus: 'clau' });
  }
}

/* Una sessió de l'API: el token d'accés (l'asserció JWT RS256, un sol ús per execució) i les crides
   autoritzades. `crida` té temps màxim, reintents acotats i torna el JSON; `peticio` és una sola
   petició crua, sense reintents. Cap secret ix d'ací: tots van a `secrets`, que netejaText tapa. */
async function obriSessio({ clau, ep, limit, opcionsReintent, ara, registra }) {
  const secrets = [clau.email, clau.kid];
  const assercio = signaAssercio(clau, { ara: ara(), aud: ep.token });
  secrets.push(assercio);
  const cosToken = await ambReintents(async () => {
    const resposta = await peticioHttp({
      metode: 'POST', url: ep.token, capcaleres: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cos: new URLSearchParams({ grant_type: CONCESSIO_JWT, assertion: assercio }).toString(), tempsMs: limit.peticio, operacio: 'token'
    });
    if (!esCorrecte(resposta.estat)) throw errorHttp(resposta, 'token', secrets);
    return jsonDe(resposta, 'token');
  }, opcionsReintent);
  const token = typeof cosToken.access_token === 'string' ? cosToken.access_token : '';
  if (!token || token.length > 8192 || /[\s\p{Cc}]/u.test(token)
      || (cosToken.token_type !== undefined && !/^bearer$/i.test(String(cosToken.token_type)))) {
    throw new ErrorPlay('token: Google no ha tornat cap token Bearer', { tipus: 'resposta', operacio: 'token' });
  }
  secrets.push(token);
  registra('  ✓ token OAuth de Google (JWT RS256, abast androidpublisher)');

  const autoritzacio = { Authorization: `Bearer ${token}` };
  const crida = (operacio, { metode = 'POST', url, cos, reintentaXarxa = true, reintentaTemps = true }) => ambReintents(async () => {
    const resposta = await peticioHttp({
      metode, url, capcaleres: { ...autoritzacio, ...(cos === undefined ? {} : { 'Content-Type': 'application/json; charset=utf-8' }) },
      cos: cos === undefined ? null : JSON.stringify(cos), tempsMs: limit.peticio, operacio
    });
    if (!esCorrecte(resposta.estat)) throw errorHttp(resposta, operacio, secrets);
    return jsonDe(resposta, operacio);
  }, { ...opcionsReintent, reintentaXarxa, reintentaTemps });
  const peticio = (operacio, { metode = 'POST', url, tempsMs = limit.peticio }) => peticioHttp({ metode, url, capcaleres: autoritzacio, tempsMs, operacio });
  return { ep, limit, secrets, autoritzacio, crida, peticio, edicions: (paquet) => `${ep.api}/applications/${encodeURIComponent(paquet)}/edits` };
}

/* On és el versionCode `build` a cada pista de `pistes`, amb una edició nova NOMÉS de lectura
   (edits.insert → edits.tracks.get → edits.delete; mai cap commit). Torna [{ pista, status }], buida si
   no hi és; una pista que Play no coneix (404) no té cap llançament. Llança ErrorPlay si Google no respon. */
async function llancamentsDe(sessio, { paquet, build, pistes }) {
  const edicions = sessio.edicions(paquet);
  const lectura = await sessio.crida('edits.insert', { url: edicions, cos: {} });
  const id = typeof lectura.id === 'string' ? lectura.id : '';
  if (!ID_EDICIO.test(id)) throw new ErrorPlay('edits.insert: Google no ha tornat cap identificador d\'edició', { tipus: 'resposta', operacio: 'edits.insert' });
  const urlLectura = `${edicions}/${encodeURIComponent(id)}`;
  try {
    const trobats = [];
    for (const pista of pistes) {
      let track;
      try {
        track = await sessio.crida('edits.tracks.get', { metode: 'GET', url: `${urlLectura}/tracks/${encodeURIComponent(pista)}` });
      } catch (error) {
        if (error instanceof ErrorPlay && error.tipus === 'http' && error.estat === 404) continue;
        throw error;
      }
      for (const llancament of Array.isArray(track.releases) ? track.releases : []) {
        const codis = Array.isArray(llancament?.versionCodes) ? llancament.versionCodes.map(String) : [];
        if (codis.includes(String(build))) {
          trobats.push({ pista, status: STATUS_PLAY.test(String(llancament.status ?? '')) ? String(llancament.status) : 'desconegut' });
        }
      }
    }
    return trobats;
  } finally {
    try { await sessio.peticio('edits.delete', { metode: 'DELETE', url: urlLectura, tempsMs: Math.min(sessio.limit.peticio, 30_000) }); } catch { /* una edició de lectura caduca sola */ }
  }
}

/**
 * On és el versionCode `build` a Google Play (per defecte, a totes les pistes de PISTES: internal,
 * production i alpha):
 * [{ pista, status }] amb l'status de cada llançament que el porta (draft, inProgress, halted o
 * completed), o una llista buida. Només lectura: token → edits.insert → edits.tracks.get →
 * edits.delete, mai cap commit. publica-tot.mjs --sincronitza-ard ho pregunta abans d'anunciar un
 * build a l'App (src/natiu/actualitzacioAppNativa.js). Llança ErrorPlay; cap missatge porta cap secret.
 */
export async function consultaLlancament({
  clau, paquet, build, pistes = Object.values(PISTES), endpoints = null, temps = TEMPS_PLAY, reintents = REINTENTS_PLAY,
  espera = esperaReal, ara = Date.now, registra = () => {}
} = {}) {
  const ep = endpointsDePlay(endpoints);
  comprovaClau(clau);
  if (!PAQUET.test(String(paquet ?? ''))) throw new ErrorPlay('SDP_APP_ID no té la forma d\'un paquet d\'Android', { tipus: 'us' });
  if (!BUILD.test(String(build ?? ''))) throw new ErrorPlay('falta el versionCode', { tipus: 'us' });
  if (!Array.isArray(pistes) || !pistes.length || pistes.some((pista) => !Object.values(PISTES).includes(pista))) {
    throw new ErrorPlay('pista desconeguda', { tipus: 'us' });
  }
  const sessio = await obriSessio({
    clau, ep, limit: { ...TEMPS_PLAY, ...temps }, opcionsReintent: { ...REINTENTS_PLAY, ...reintents, espera }, ara, registra
  });
  return llancamentsDe(sessio, { paquet, build, pistes });
}

/* Un commit que no ha tornat ni un 2xx ni un «no» net (4xx) de Google: l'estat és a l'aire. */
const commitAmbigu = (error) => !(error instanceof ErrorPlay && error.tipus === 'http' && error.estat >= 400 && error.estat < 500);

/* Després d'un commit ambigu, què diu Google Play, sense tornar-lo a enviar: el versionCode a la
   pista (confirmat), l'edició encara oberta (oberta: no ha entrat), ni una cosa ni l'altra
   (no-confirmat) o cap resposta (desconegut). */
async function estatDelCommit(sessio, { urlEdicio, paquet, build, pista }) {
  let oberta;
  try {
    const resposta = await sessio.peticio('edits.get', { metode: 'GET', url: urlEdicio });
    if (esCorrecte(resposta.estat)) oberta = true;
    else if ([400, 404, 410].includes(resposta.estat)) oberta = false;
    else return { estat: 'desconegut' };
  } catch {
    return { estat: 'desconegut' };
  }
  let trobats;
  try { trobats = await llancamentsDe(sessio, { paquet, build, pistes: [pista] }); } catch { return { estat: 'desconegut' }; }
  if (trobats.length) return { estat: 'confirmat', status: trobats[0].status };
  return { estat: oberta ? 'oberta' : 'no-confirmat' };
}

const consellDesconegut = (pista, build) => `mira Play Console › pista ${pista}: si hi ha el versionCode ${build}, la pujada ja està feta (apunta-la a SDP_BUILDS_DIR/pujades.jsonl i no la repetisques); si no hi és, torna-ho a provar`;

/**
 * Puja l'AAB `aab` (de sha256 `sha256` i versionCode `build`) a la pista `pista` de Google Play amb
 * l'status `estat`, per l'API REST v3: token → edits.insert → edits.bundles.upload → edits.tracks.update
 * → edits.validate → edits.commit. Sense commit, l'edició s'esborra. Amb `nomesComprova`, només
 * token, edits.insert i edits.delete. Llança ErrorPlay; cap missatge porta cap secret.
 * El commit no és idempotent: s'envia una sola vegada. Si no torna ni un 2xx ni un 4xx net, es
 * pregunta a Play si ha entrat (estatDelCommit): confirmat (verificatDespres), no confirmat (error
 * normal) o DESCONEGUT (ErrorPlay de tipus «desconegut», sense esborrar l'edició).
 * @returns {Promise<{ comprovat: boolean, pujat: boolean, versionCode?: number, sha256Google?: string|null,
 *   pista?: string, estat?: string, senseRevisio?: boolean, verificatDespres?: boolean, statusPlay?: string }>}
 */
export async function pujaAPlay({
  clau, paquet, aab = null, sha256 = null, build = null, nomVersio = null,
  pista = PISTES[CANALS.INTERN], estat = ESTATS_PLAY.ESBORRANY, nomesComprova = false,
  endpoints = null, temps = TEMPS_PLAY, reintents = REINTENTS_PLAY, espera = esperaReal, ara = Date.now,
  registra = (text) => process.stdout.write(`${text}\n`)
} = {}) {
  const ep = endpointsDePlay(endpoints);
  comprovaClau(clau);
  if (!PAQUET.test(String(paquet ?? ''))) throw new ErrorPlay('SDP_APP_ID no té la forma d\'un paquet d\'Android', { tipus: 'us' });
  if (!nomesComprova) {
    if (!Object.values(PISTES).includes(pista)) throw new ErrorPlay(`pista desconeguda: ${netejaText(pista)}`, { tipus: 'us' });
    if (!Object.values(ESTATS_PLAY).includes(estat)) throw new ErrorPlay(`status desconegut: ${netejaText(estat)}`, { tipus: 'us' });
    if (pista === PISTES[CANALS.PRODUCCIO] && estat !== ESTATS_PLAY.ESBORRANY) {
      throw new ErrorPlay('a producció el llançament és sempre un esborrany: «Envia a revisió» és del Mestre (D-B9-3, P9)', { tipus: 'us' });
    }
    if (!SHA256.test(String(sha256 ?? '')) || !BUILD.test(String(build ?? '')) || !aab) {
      throw new ErrorPlay('falten l\'AAB, el seu sha256 o el versionCode', { tipus: 'us' });
    }
  }
  const limit = { ...TEMPS_PLAY, ...temps };

  // 1. El token d'accés.
  const sessio = await obriSessio({ clau, ep, limit, opcionsReintent: { ...REINTENTS_PLAY, ...reintents, espera }, ara, registra });
  const { crida, autoritzacio, secrets } = sessio;

  // 2. L'edició.
  const edicions = sessio.edicions(paquet);
  const edicio = await crida('edits.insert', { url: edicions, cos: {} });
  const id = typeof edicio.id === 'string' ? edicio.id : '';
  if (!ID_EDICIO.test(id)) throw new ErrorPlay('edits.insert: Google no ha tornat cap identificador d\'edició', { tipus: 'resposta', operacio: 'edits.insert' });
  registra('  ✓ edits.insert: edició oberta');
  const urlEdicio = `${edicions}/${encodeURIComponent(id)}`;

  let confirmada = false;
  let commitIntentat = false;
  let estatDesconegut = false;
  let edicioTancada = false;
  try {
    if (nomesComprova) return { comprovat: true, pujat: false };

    // 3. L'AAB en streaming: el que s'envia i el que ha rebut Google han de ser l'AAB verificat.
    let mida;
    try { mida = fs.statSync(aab).size; } catch { throw new ErrorPlay('edits.bundles.upload: no es pot llegir l\'AAB', { tipus: 'verificacio', operacio: 'edits.bundles.upload' }); }
    if (!mida) throw new ErrorPlay('edits.bundles.upload: l\'AAB és buit', { tipus: 'verificacio', operacio: 'edits.bundles.upload' });
    const urlPujada = `${ep.pujada}/applications/${encodeURIComponent(paquet)}/edits/${encodeURIComponent(id)}/bundles?uploadType=media`;
    const pujada = await ambReintents(async () => {
      const resposta = await peticioHttp({
        metode: 'POST', url: urlPujada, capcaleres: { ...autoritzacio, 'Content-Type': 'application/octet-stream' },
        fitxer: { cami: aab, mida }, tempsMs: limit.pujada, operacio: 'edits.bundles.upload'
      });
      if (!esCorrecte(resposta.estat)) throw errorHttp(resposta, 'edits.bundles.upload', secrets);
      return { resposta, bundle: jsonDe(resposta, 'edits.bundles.upload') };
    }, { ...REINTENTS_PLAY, ...reintents, espera, reintentaTemps: false });
    if (pujada.resposta.enviats !== mida || pujada.resposta.sha256Enviat !== sha256) {
      throw new ErrorPlay('edits.bundles.upload: l\'AAB ha canviat durant la pujada (el que s\'ha enviat no és l\'AAB verificat): no es confirma res',
        { tipus: 'verificacio', operacio: 'edits.bundles.upload' });
    }
    const sha256Google = typeof pujada.bundle.sha256 === 'string' ? pujada.bundle.sha256.toLowerCase() : null;
    if (sha256Google !== null && sha256Google !== sha256) {
      throw new ErrorPlay('edits.bundles.upload: Google ha rebut un AAB amb un altre sha256: no es confirma res', { tipus: 'verificacio', operacio: 'edits.bundles.upload' });
    }
    if (String(pujada.bundle.versionCode ?? '') !== String(build)) {
      throw new ErrorPlay(`edits.bundles.upload: Google llig el versionCode ${netejaText(String(pujada.bundle.versionCode ?? 'cap')).slice(0, 20)}, no ${build}: no es confirma res`,
        { tipus: 'verificacio', operacio: 'edits.bundles.upload' });
    }
    registra(`  ✓ edits.bundles.upload: versionCode ${build}; ${sha256Google ? 'el sha256 que ha rebut Google' : 'el sha256 del que s\'ha enviat (Google no el torna)'} és el de l'AAB`);

    // 4. La pista, la validació i el commit.
    const llancament = { name: String(nomVersio ?? build).slice(0, 50), versionCodes: [String(build)], status: estat };
    await crida('edits.tracks.update', { metode: 'PUT', url: `${urlEdicio}/tracks/${encodeURIComponent(pista)}`, cos: { track: pista, releases: [llancament] } });
    registra(`  ✓ edits.tracks.update: pista ${pista}, status ${estat}, versionCode ${build}`);
    await crida('edits.validate', { url: `${urlEdicio}:validate` });
    registra('  ✓ edits.validate: Google accepta l\'edició');

    /* edits.commit no és idempotent: UN sol intent, mai cap reintent. Un 2xx és confirmat (el cos no
       compta) i un 4xx és un «no» net de Google. Qualsevol altra cosa (un 5xx, la xarxa, el temps, una
       resposta que no s'entén) deixa l'estat a l'aire: es pregunta a Play i, si no ho pot dir, l'estat
       és DESCONEGUT; llavors ni es diu «no s'ha publicat res», ni s'esborra l'edició, ni es repetix. */
    const confirma = async (url) => {
      let resposta;
      try {
        resposta = await sessio.peticio('edits.commit', { metode: 'POST', url });
      } catch (error) {
        if (error instanceof ErrorPlay && error.tipus === 'resposta' && esCorrecte(error.estat)) return;
        if (error instanceof ErrorPlay && error.tipus === 'resposta' && error.estat >= 400 && error.estat < 500) {
          throw new ErrorPlay(`edits.commit: HTTP ${error.estat}`, { tipus: 'http', operacio: 'edits.commit', estat: error.estat });
        }
        throw error;
      }
      if (!esCorrecte(resposta.estat)) throw errorHttp(resposta, 'edits.commit', secrets);
    };
    let senseRevisio = false;
    commitIntentat = true;
    try {
      try {
        await confirma(`${urlEdicio}:commit`);
      } catch (error) {
        if (!(error instanceof ErrorPlay && error.tipus === 'http' && error.estat === 400 && COMMIT_SENSE_REVISIO.test(error.detall ?? ''))) throw error;
        registra('  ! edits.commit: Google demana changesNotSentForReview=true; es confirma sense enviar res a revisió');
        await confirma(`${urlEdicio}:commit?changesNotSentForReview=true`);
        senseRevisio = true;
      }
    } catch (error) {
      if (!commitAmbigu(error)) throw error;
      const motiu = error instanceof ErrorPlay ? error.message : 'edits.commit: error inesperat';
      registra(`  ! ${motiu}: es pregunta a Google Play si el commit ha entrat, sense tornar-lo a enviar`);
      const comprovacio = await estatDelCommit(sessio, { urlEdicio, paquet, build, pista });
      const dades = { operacio: 'edits.commit', estat: error?.estat ?? null, detall: error?.detall ?? null };
      if (comprovacio.estat === 'confirmat') {
        confirmada = true;
        registra(`  ✓ edits.commit: Google Play ja té el versionCode ${build} a la pista ${pista} (status ${comprovacio.status}): confirmat`);
        return { comprovat: true, pujat: true, versionCode: Number(build), sha256Google, pista, estat, senseRevisio, verificatDespres: true, statusPlay: comprovacio.status };
      }
      /* L'edició encara oberta: s'esborra ara, i només un DELETE 2xx tanca la qüestió (si el commit
         entrara mentrestant, el DELETE ja no ho podria fer i l'estat seria desconegut). */
      let tancada = comprovacio.estat === 'no-confirmat';
      if (comprovacio.estat === 'oberta') {
        try {
          tancada = esCorrecte((await sessio.peticio('edits.delete', { metode: 'DELETE', url: urlEdicio, tempsMs: Math.min(limit.peticio, 30_000) })).estat);
        } catch { tancada = false; }
        if (tancada) registra('  · edits.delete: l\'edició s\'ha esborrat; a Google Play no ha canviat res');
      }
      if (tancada) {
        edicioTancada = true;
        const com = comprovacio.estat === 'oberta' ? 'l\'edició continuava oberta (ara esborrada)' : 'l\'edició ja no hi és';
        throw new ErrorPlay(`${motiu} · Google Play diu que ${com} i que la pista ${pista} no té el versionCode ${build}: no s'ha publicat res`, {
          tipus: error instanceof ErrorPlay ? error.tipus : 'xarxa', ...dades, consell: 'torna-ho a provar amb el mateix «sí»: este build no s\'ha publicat'
        });
      }
      estatDesconegut = true;
      throw new ErrorPlay(`${motiu} · l'estat del commit és DESCONEGUT: Google Play no ha pogut dir si ha entrat`, {
        tipus: 'desconegut', ...dades, consell: consellDesconegut(pista, build)
      });
    }
    confirmada = true;
    registra('  ✓ edits.commit: confirmat a Google Play');
    return { comprovat: true, pujat: true, versionCode: Number(build), sha256Google, pista, estat, senseRevisio };
  } finally {
    if (estatDesconegut) {
      registra('  ! edits.commit: estat DESCONEGUT; l\'edició no s\'esborra (si no s\'ha confirmat, caduca sola): mira Play Console abans de tornar-ho a provar');
    } else if (!confirmada && !edicioTancada) {
      /* Abans del commit, una edició que no s'esborra caduca sola i no publica res; després d'un
         commit, un DELETE que no torna 2xx no diu res de cert: mira Play Console. */
      const despresDelCommit = `l'edició ja no hi era: mira Play Console › pista ${pista} abans de tornar-ho a provar`;
      try {
        const resposta = await sessio.peticio('edits.delete', { metode: 'DELETE', url: urlEdicio, tempsMs: Math.min(limit.peticio, 30_000) });
        if (esCorrecte(resposta.estat)) registra('  · edits.delete: l\'edició s\'ha esborrat; a Google Play no ha canviat res');
        else registra(`  ! edits.delete: HTTP ${resposta.estat}; ${commitIntentat ? despresDelCommit : 'una edició sense confirmar caduca sola i no publica res'}`);
      } catch {
        registra(`  ! edits.delete: sense resposta; ${commitIntentat ? despresDelCommit : 'una edició sense confirmar caduca sola i no publica res'}`);
      }
    }
  }
}

/* ─────────────────────────────── El pla ─────────────────────────────── */

/** El pla d'A4-A5 per a un canal (intern per defecte). Pur: no toca el disc. B9 · La pista és
    la del canal (internal, alpha o production) i el llançament és un esborrany (D-B9-3); --desplega
    (R32.3; v1.2.16, també alpha) el desplega a la prova interna o a la tancada, mai a producció.
    Un canal que Android no admet llança (main el refusa abans). */
export function planAndroid({ arrel, valors, canal = CANALS.INTERN, desplega = false }) {
  if (!canalAdmes(canal, ['android'])) throw new Error(usDelCanal(['android']));
  const aab = path.join(arrel, ...AAB);
  const produccio = canal === CANALS.PRODUCCIO;
  const pista = PISTES[canal];
  const estat = desplega && !produccio ? ESTATS_PLAY.DESPLEGAT : ESTATS_PLAY.ESBORRANY;
  // Les quatre variables les llig la signingConfig de release d'android/app/build.gradle (LLEGIU.txt §4).
  const entornDeSignatura = () => ({
    SDP_ANDROID_KEYSTORE_PATH: rutaDe(arrel, valors, 'SDP_ANDROID_KEYSTORE_PATH'),
    SDP_ANDROID_KEY_ALIAS: valors.SDP_ANDROID_KEY_ALIAS,
    SDP_ANDROID_KEYSTORE_PASSWORD: valors.SDP_ANDROID_KEYSTORE_PASSWORD,
    SDP_ANDROID_KEY_PASSWORD: valors.SDP_ANDROID_KEY_PASSWORD
  });
  return {
    aab,
    pista,
    estat,
    compila: [path.join(arrel, 'android', 'gradlew'), ['--no-daemon', 'bundleRelease']],
    entornDeSignatura,
    // Tot el que rep el procés de Gradle a més del seu entorn: el JDK que ha triat el preflight i la signatura.
    entornDeGradle: (jdkHome) => ({ JAVA_HOME: jdkHome, ...entornDeSignatura() }),
    certificat: ['keytool', ['-printcert', '-jarfile', aab]],
    api: { paquet: String(valors.SDP_APP_ID ?? '').trim(), clau: rutaDe(arrel, valors, 'SDP_PLAY_JSON_KEY_PATH') }
  };
}

/** La pujada del pla en una línia, emmascarada (cap valor del fitxer d'entorn). */
export function mostraPlaApi(pla, valors = {}, arrel = null) {
  return emmascara(`API REST de Google Play v3 (Node, sense fastlane): token OAuth (JWT RS256 amb ${pla.api.clau}) → edits.insert (${pla.api.paquet})`
    + ` → edits.bundles.upload (app-release.aab en streaming) → edits.tracks.update (pista ${pla.pista}, estat ${pla.estat}) → edits.validate → edits.commit`, valors, arrel);
}

export const PASSOS_A_MA = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Testing › Internal testing › Create new release [NO VERIFICAT el camí].',
  'Pujar android/app/build/outputs/bundle/release/app-release.aab (el mateix fitxer que diu el rebut, amb el mateix sha256).',
  'Nom de la versió: VERSIO (BUILD). Notes: les del laboratori, sense dades personals.',
  'Desar com a esborrany. Revisar-lo i desplegar-lo a la prova interna és del Mestre (RUNBOOK P9).',
  'Si és el PRIMER AAB d\'esta app, l\'API no el pot crear: este pas a mà és obligatori (RUNBOOK H-G5).'
]);

/* v1.2.16 · La prova tancada (alpha) a mà, si l'API no pot: la mateixa pujada, a la pista dels verificadors. */
export const PASSOS_A_MA_ALPHA = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Testing › Closed testing › alpha › Create new release [NO VERIFICAT el camí].',
  'Pujar android/app/build/outputs/bundle/release/app-release.aab (el mateix fitxer que diu el rebut, amb el mateix sha256).',
  'Nom de la versió: VERSIO (BUILD). Notes: les del laboratori, sense dades personals.',
  'Desar i desplegar a la prova tancada: els verificadors del grup socdepoble-testers el reben de Google Play (cap APK fora de botiga).',
  'Si és el PRIMER AAB d\'esta app, l\'API no el pot crear: este pas a mà és obligatori (RUNBOOK H-G5).'
]);

/* B9 · Producció a mà (si l'API no pot) i després d'una pujada feta: sempre un esborrany, i
   «Envia a revisió» és del Mestre (P9). Cap desplegament per fases. */
export const PASSOS_A_MA_PRODUCCIO = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Production › Create new release [NO VERIFICAT el camí].',
  'Pujar android/app/build/outputs/bundle/release/app-release.aab: el mateix fitxer, amb el mateix sha256, que diu el rebut i el «sí».',
  'Nom de la versió: VERSIO (BUILD). Notes: les del laboratori, sense dades personals.',
  'Desar com a ESBORRANY. Revisar-lo i «Envia a revisió» és del Mestre (RUNBOOK P9).',
  'Si el compte (personal) no té accés a producció: primer la prova tancada de 12 provadors durant 14 dies (P0-23) o un compte d\'organització (D-B9-2).',
  'Si és el PRIMER AAB d\'esta app, potser s\'ha de pujar a mà (RUNBOOK H-G5) [NO VERIFICAT].'
]);
export const PASSOS_DESPRES_PRODUCCIO = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Production: obri l\'esborrany VERSIO (BUILD) [NO VERIFICAT el camí].',
  'Revisa les notes, els països i la fitxa de la botiga.',
  '«Envia a revisió»: ho fa el Mestre (RUNBOOK P9). El script no publica ni fa cap desplegament per fases.'
]);

/* La pista de producció quan Play diu que no (validar, la pista o el commit). */
const CONSELL_PRODUCCIO = 'Un compte personal sense accés a producció necessita la prova tancada de 12 provadors × 14 dies (P0-23) o un compte d\'organització (D-B9-2); si no, permisos del compte de servei (RUNBOOK H-G4) o primer AAB (H-G5)';
/* Una línia per a quan falta la clau: on és la guia. */
const GUIA_CLAU_PLAY = 'guia de 3 passos a la capçalera de scripts/botigues/puja-android.mjs: JSON del compte de servei amb permisos de llançament, fora del repositori amb chmod 600, i SDP_PLAY_JSON_KEY_PATH a .env.botigues.local';

/** Una llista de passos numerada, amb VERSIO i BUILD posats. */
const enumera = (passos, versio, build) => passos.map((p, i) => `  ${i + 1}. ${p}`).join('\n').replace(/VERSIO/g, versio).replace(/BUILD/g, build);

/* BOT-A4 (261025) · L'AAB és un zip i porta els recursos del mòdul base a base/assets/: la còpia de
   dist-natiu/ que fa cap sync hi és a base/assets/public/ [VERIFICAT 261025 en l'AAB de 261023:
   base/assets/public/index.html, amb deflate]. Si el segell de dins no és el de dist-natiu/, l'AAB
   s'ha signat abans de l'últim build o de l'últim cap sync, i no es puja. */
export const SEGELL_DE_L_AAB = 'base/assets/public/segell.json';

/** Per què l'AAB no ix del dist-natiu/ que ha contrastat el preflight, o null si en ix. */
export function problemaDeLAab(arrel, aab) {
  return problemaDelPaquet(arrel, llegixDelZip(aab, SEGELL_DE_L_AAB), 'app-release.aab');
}

/* R24 botigues (D2, RC-7) · Cap classe de com.facebook (el SDK de Meta) als dex del mòdul base de
   l'AAB: el connector social l'enllaça si socialLogin.facebook.include no és false, i la política diu
   «No hi ha Píxel de Meta». Un AAB porta els dex a base/dex/classes.dex, classes2.dex… (multidex,
   seguits); el nom del tipus, «Lcom/facebook/…», és a la taula de cadenes del dex. Es mira abans de
   keytool i de cap pujada; només llig. Sostre de dex per si un lector no torna mai null. */
export const SDK_FACEBOOK_DEX = 'Lcom/facebook/';
const MAX_DEX = 100;

/** Els dex del mòdul base d'un AAB, en ordre, fins al primer que falta: [{ nom, octets }]; [] si no n'hi ha. */
export function dexDeLAab(aab, { llig = llegixDelZip } = {}) {
  const dexs = [];
  for (let n = 1; n <= MAX_DEX; n += 1) {
    const nom = `base/dex/classes${n === 1 ? '' : n}.dex`;
    const octets = llig(aab, nom);
    if (!octets) break;
    dexs.push({ nom, octets });
  }
  return dexs;
}

/** Els noms dels dex que porten classes de com.facebook. Pura. */
export const dexAmbFacebook = (dexs = []) => dexs.filter(({ octets }) => Buffer.from(octets).includes(SDK_FACEBOOK_DEX)).map(({ nom }) => nom);

/* BOT-A4 (261025) · El commit és el del segell de dist-natiu/ (el que el preflight ha contrastat
   amb HEAD), no el HEAD d'ara; main només imprimix el rebut quan l'AAB porta eixe segell. */
export function rebut({ segell, versio, build, aab, pujat, canal = CANALS.INTERN, sha256 = null, estat = ESTATS_PLAY.ESBORRANY }) {
  /* B9 · main passa el sha256 de l'AAB verificat; sense, es calcula com abans. En producció, el
     rebut porta també el «sí» exacte per a este AAB. */
  const empremta = sha256 ?? (fs.existsSync(aab) ? sha256DeFitxer(aab) : null);
  const produccio = canal === CANALS.PRODUCCIO;
  const comFa = estat === ESTATS_PLAY.DESPLEGAT && !produccio ? 'desplegat' : 'esborrany';
  const lloc = { [CANALS.PRODUCCIO]: 'pista production', [CANALS.ALPHA]: 'pista alpha, la prova tancada' }[canal] ?? 'pista interna';
  return ['', `REBUT (per a ${REBUTS}/AAMMDD_HHMM_pujada_android.txt; cap secret, cap adreça):`,
    `  commit: ${segell?.commit ?? 'desconegut'} (el de ${SEGELL.join('/')}, que porta l'AAB)`, `  versio: ${versio}  build (versionCode): ${build}`,
    `  sha256 de l'AAB: ${empremta ?? 'sense AAB'}`, `  canal: ${canal}`, `  hora: ${new Date().toISOString()}`,
    `  pujat a Google Play (${comFa}, ${lloc}): ${pujat ? 'sí' : 'no'}`,
    ...(produccio && empremta && !pujat ? [`  «sí» per a pujar ESTE AAB: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal, sha256: empremta })}`] : []),
    '  qui ha dit «sí»: (ho escriu qui executa)', ''].join('\n');
}

/* Les opcions del client que només les proves passen (main(argv, { play })). */
const opcionsDeProves = (play = {}) => ({ endpoints: play.endpoints ?? null, temps: play.temps, reintents: play.reintents, espera: play.espera, ara: play.ara });

/* Un ErrorPlay (o qualsevol error del client) com a eixida del script: net i emmascarat. Si Play
   no coneix el paquet (primer AAB, H-G5), els passos a mà. */
function plegaDePlay(error, { valors = {}, arrel = null, produccio = false, alpha = false, versio = null, build = null } = {}) {
  const neta = (text) => emmascara(netejaText(text), valors, arrel);
  if (!(error instanceof ErrorPlay)) return plega(EIXIDA.EXTERNA, `Google Play: error inesperat del client (${neta(error?.message ?? error)})`);
  const codi = { verificacio: EIXIDA.VERIFICACIO, clau: EIXIDA.FALTA, us: EIXIDA.US, endpoint: EIXIDA.US, desconegut: EIXIDA_PLAY_DESCONEGUT }[error.tipus] ?? EIXIDA.EXTERNA;
  const passos = ['edits.tracks.update', 'edits.validate', 'edits.commit'];
  const consells = [
    error.consell,
    produccio && error.tipus === 'http' && error.estat < 500 && passos.includes(error.operacio) ? CONSELL_PRODUCCIO : null,
    error.operacio === 'edits.insert' && error.estat === 404 && versio && build
      ? `passos a mà:\n${enumera(produccio ? PASSOS_A_MA_PRODUCCIO : (alpha ? PASSOS_A_MA_ALPHA : PASSOS_A_MA), versio, build)}` : null
  ].filter(Boolean);
  return plega(codi, `Google Play: ${neta(error.message)}`, consells.map((consell) => emmascara(consell, valors, arrel)));
}

/* --comprova-play · La guia, pas 3: la clau, els permisos i el paquet, sense publicar res. */
async function comprovaPlay({ env, play }) {
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');
  const entorn = carregaEntorn({ arrel, env });
  if (entorn.codi !== EIXIDA.BE) return plega(entorn.codi, 'El fitxer d\'entorn no deixa seguir:', entorn.problemes);
  const { valors } = entorn;
  const variables = comprovaVariables({ arrel, valors, contextos: ['android'] });
  if (variables.codi !== EIXIDA.BE) return plega(variables.codi, 'Falten variables o fitxers d\'Android:', variables.problemes);
  const clau = llegixClauPlay(rutaDe(arrel, valors, 'SDP_PLAY_JSON_KEY_PATH'));
  if (!clau.valida) return plega(EIXIDA.FALTA, `SDP_PLAY_JSON_KEY_PATH: ${clau.problema}`, [GUIA_CLAU_PLAY]);
  process.stdout.write('Google Play (API REST v3): comprovació de la clau, sense publicar res\n');
  try {
    await (play.pujaAPlay ?? pujaAPlay)({
      ...opcionsDeProves(play), nomesComprova: true, clau: clau.clau, paquet: String(valors.SDP_APP_ID).trim(),
      registra: (text) => process.stdout.write(`${emmascara(text, valors, arrel)}\n`)
    });
  } catch (error) {
    return plegaDePlay(error, { valors, arrel });
  }
  process.stdout.write('✓ La clau, els permisos i el paquet responen: --confirma ja pot pujar l\'AAB a Google Play.\n');
  return EIXIDA.BE;
}

/**
 * @param {string[]} argv
 * @param {{ env?: object, play?: { pujaAPlay?: Function, endpoints?: object, temps?: object, reintents?: object, espera?: Function, ara?: Function } }} [dependencies]
 *   Només per a les proves: el client de Play (o les seues adreces locals) i l'entorn de --comprova-play.
 */
export async function main(argv, { env = process.env, play = {} } = {}) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/puja-android.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  if (opcions['comprova-play']) {
    if (errors.length || Object.keys(opcions).length > 1) return plega(EIXIDA.US, '--comprova-play va sol', errors);
    return comprovaPlay({ env, play });
  }
  const { versio, build } = opcions;
  if (errors.length || !VERSIO.test(versio ?? '') || !BUILD.test(build ?? '')) {
    return plega(EIXIDA.US, US, errors);
  }
  /* B9 · Les guardes del canal, en este ordre i abans de tocar res: canal conegut, en producció el
     «sí» en una execució a banda de --compila, i un --confirma amb la forma d'este canal. */
  const canal = opcions.canal ?? CANALS.INTERN;
  if (!canalAdmes(canal, ['android'])) return plega(EIXIDA.US, usDelCanal(['android']));
  const produccio = canal === CANALS.PRODUCCIO;
  const alpha = canal === CANALS.ALPHA;
  if (produccio && opcions.desplega) {
    return plega(EIXIDA.US, '--desplega només val per a la prova interna o la tancada (alpha): a producció el llançament és sempre un ESBORRANY i «Envia a revisió» és del Mestre (P9)');
  }
  if (produccio && opcions.compila && opcions.confirma !== undefined) {
    return plega(EIXIDA.US, 'en producció, primer el rebut amb el sha256 (en sec si signes tu a Android Studio, o --compila); el «sí» va en una altra execució');
  }
  const confirmacio = opcions.confirma === undefined ? null : analitzaConfirmacio(opcions.confirma, { versio, build, canal });
  if (confirmacio && !confirmacio.valida) {
    const pista = produccio ? ' i per a un sol AAB (els 12 primers caràcters del sha256 que diu el rebut); un «sí» intern no val per a producció'
      : (alpha ? ' i per a la prova tancada: un «sí» intern o de producció no val per a alpha'
        : (String(opcions.confirma).startsWith('produccio:') ? ' (este és un «sí» de producció: va amb --canal produccio)'
          : (String(opcions.confirma).startsWith('alpha:') ? ' (este és un «sí» de la prova tancada: va amb --canal alpha)' : '')));
    return plega(EIXIDA.CONFIRMACIO, `--confirma ha de ser exactament ${confirmacioEsperada(versio, build, { canal })}: un «sí» val per a una sola pujada${pista}`);
  }
  // P0-23 · El build porta la versió del client que l'app dirà al node (versio-client.mjs).
  const deLaVersio = problemaDeVersioClient(build);
  if (deLaVersio) return plega(EIXIDA.ARBRE, deLaVersio);
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');

  const pre = preflight({ arrel, plataformes: ['android'], signa: Boolean(opcions.compila), canal, push: Boolean(opcions.push) });
  process.stdout.write(`${pre.linies.join('\n')}\n`);
  if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight amb problemes: no es fa res.');
  const valors = pre.valors;

  /* B9 · El registre de pujades (SDP_BUILDS_DIR/pujades.jsonl): un build ja pujat no es torna a pujar,
     i el que ja és a la prova interna es promou des de Play Console. */
  const registre = guardaDelRegistre({ arrel, valors, canal, plataforma: 'android', versio, build });
  for (const text of registre.avisos) process.stdout.write(`  ! ${text}\n`);
  if (registre.codi !== EIXIDA.BE) return plega(registre.codi, 'El registre de pujades no deixa seguir: no es fa res.', registre.problemes);

  // El versionCode i el versionName que es compilen han de ser els que es confirmen.
  const gradle = path.join(arrel, 'android', 'app', 'build.gradle');
  const deGradle = fs.existsSync(gradle) ? versioDeGradle(fs.readFileSync(gradle, 'utf8')) : { versio: null, build: null };
  if (deGradle.versio !== versio || deGradle.build !== build) {
    return plega(EIXIDA.ARBRE, `android/app/build.gradle diu versionName ${deGradle.versio} i versionCode ${deGradle.build}, no ${versio} i ${build} (RUNBOOK A1)`);
  }

  const pla = planAndroid({ arrel, valors, canal, desplega: Boolean(opcions.desplega) });
  const desplegat = pla.estat === ESTATS_PLAY.DESPLEGAT;
  process.stdout.write(['', 'PLA (cada valor del fitxer d\'entorn es mostra com a <NOM>):',
    produccio ? `  P  canal produccio: pista ${pla.pista}, sempre en esborrany (estat ${pla.estat}); «Envia a revisió» és del Mestre (P9)` : '',
    alpha ? `  T  canal alpha: pista ${pla.pista}, la prova tancada dels verificadors (socdepoble-testers), estat ${pla.estat}; cap APK fora de botiga` : '',
    desplegat ? `  D  --desplega: la pista ${pla.pista} queda DESPLEGADA (estat ${pla.estat}): els ${alpha ? 'verificadors de la prova tancada' : 'provadors interns'} reben l'actualització de Google Play sense cap clic` : '',
    opcions.compila
      ? `  A4 JAVA_HOME=${mostraOrdre(mostraCami(arrel, pre.jdk.home), [], valors, arrel)} SDP_ANDROID_KEYSTORE_PATH SDP_ANDROID_KEY_ALIAS SDP_ANDROID_KEYSTORE_PASSWORD SDP_ANDROID_KEY_PASSWORD (només a l'entorn de Gradle) ${mostraOrdre(...pla.compila, valors, arrel)}`
      : '  A4 (el Mestre signa l\'AAB: Android Studio › Generate Signed Bundle, o el seu gradlew; o bé --compila)',
    `  V  ${mostraOrdre(...pla.certificat, valors, arrel)} → SHA-256 = <SDP_ANDROID_UPLOAD_CERT_SHA256>`,
    `  A5 ${mostraPlaApi(pla, valors, arrel)}`, ''].filter((l, i, tot) => l || i === tot.length - 1).join('\n'));

  const enSec = !opcions.compila && opcions.confirma === undefined;
  if (enSec && !produccio) {
    process.stdout.write(`En sec: no s'ha fet res. Per a compilar i signar amb les claus del fitxer: --compila. Per a pujar, amb el «sí» del Mestre per a ESTA pujada: ${alpha ? '--canal alpha ' : ''}--confirma=${confirmacioEsperada(versio, build, { canal })}\n`);
    return EIXIDA.BE;
  }
  /* ARB-B9-04 · En sec a producció no es compila ni es puja res, però si l'AAB ja hi és (signat pel
     Mestre a Android Studio), es verifica en local (segell i keytool, només lectura) i el rebut dona
     el «sí» exacte. Sense AAB, només el pla i què cal fer. */
  if (enSec && !fs.existsSync(pla.aab)) {
    process.stdout.write(`En sec (producció: pista ${pla.pista}, esborrany): no hi ha app-release.aab. Signa l'AAB (Android Studio › Build › Generate Signed Bundle) o fes --compila, i torna a executar esta ordre en sec per a tindre el «sí» (${confirmacioEsperada(versio, build, { canal })}).\n`);
    return EIXIDA.BE;
  }

  if (opcions.compila) {
    const resultat = await executa(...pla.compila, { cwd: path.join(arrel, 'android'), valors, arrel, entornExtra: pla.entornDeGradle(pre.jdk.home) });
    if (resultat.codi !== 0) return plega(EIXIDA.EXTERNA, 'gradlew bundleRelease ha fallat');
  }

  // Verificació local: l'AAB existix, ix del dist-natiu/ del preflight i el signa la clau de pujada que coneix Play.
  if (!fs.existsSync(pla.aab)) return plega(EIXIDA.ARBRE, 'no hi ha app-release.aab: signa\'l tu (Android Studio) o fes --compila');
  const deLAab = problemaDeLAab(arrel, pla.aab);
  if (deLAab) return plega(EIXIDA.ARBRE, `${deLAab}: torna a signar-lo després de l'últim cap sync (Android Studio) o fes --compila`);
  process.stdout.write(`✓ l'AAB porta el ${SEGELL.join('/')} del preflight\n`);
  /* R24 botigues (D2) · El SDK de Meta, abans de keytool i de cap pujada. */
  const dexs = dexDeLAab(pla.aab);
  if (!dexs.length) return plega(EIXIDA.ARBRE, 'no s\'ha pogut llegir cap base/dex/classes*.dex de l\'AAB: no es pot comprovar que no porta el SDK de Facebook, i no es puja');
  const deFacebook = dexAmbFacebook(dexs);
  if (deFacebook.length) {
    return plega(EIXIDA.ARBRE, `l'AAB porta classes de com.facebook (${deFacebook.join(', ')}): el SDK de Meta no hi ha de ser. Comprova socialLogin.facebook.include=false a android/gradle.properties i SocialLogin.providers.facebook false a capacitor.config.json, npx cap sync android i torna a signar l'AAB`);
  }
  process.stdout.write(`✓ l'AAB no porta cap classe de com.facebook (${dexs.length} dex)\n`);
  /* En producció, l'eixida de keytool (el propietari del certificat) no es pinta: només se'n llig l'empremta. */
  const certificat = await executa(...pla.certificat, { valors, arrel, mostra: false, eco: !produccio });
  const empremta = empremtaDeKeytool(certificat.crua);
  if (certificat.codi !== 0 || !empremta) return plega(EIXIDA.EXTERNA, 'keytool -printcert no ha donat cap empremta SHA-256 (l\'AAB no està signat?)');
  if (empremta !== normalitzaEmpremta(valors.SDP_ANDROID_UPLOAD_CERT_SHA256)) {
    return plega(EIXIDA.VERIFICACIO, 'l\'AAB està signat amb una altra clau que la de pujada (SDP_ANDROID_UPLOAD_CERT_SHA256): no es puja');
  }
  process.stdout.write('✓ signat amb la clau de pujada de SDP_ANDROID_UPLOAD_CERT_SHA256\n');

  // B9 · El sha256 de l'AAB verificat: el rebut el diu, i el «sí» de producció hi va lligat (D-B9-7).
  const sha256 = sha256DeFitxer(pla.aab);
  if (opcions.confirma === undefined) {
    process.stdout.write(rebut({ segell: pre.segell, versio, build, aab: pla.aab, pujat: false, canal, sha256, estat: pla.estat }));
    return EIXIDA.BE;
  }
  if (produccio && sha256.slice(0, 12) !== confirmacio.sha12) {
    return plega(EIXIDA.CONFIRMACIO, `l'AAB d'ara no és el del «sí»: el seu sha256 comença per ${sha256.slice(0, 12)}, no per ${confirmacio.sha12}; torna a executar l'ordre en sec per al rebut d'este AAB`);
  }

  /* R32.3 · La clau del compte de servei, per RUTA, i la pujada per l'API REST. El client compara el
     sha256 dels octets que envia i el que torna Google amb este sha256: si l'AAB canvia durant la
     pujada, l'edició s'esborra sense commit (eixida 9) i no s'apunta res. */
  const clau = llegixClauPlay(pla.api.clau);
  if (!clau.valida) return plega(EIXIDA.FALTA, `SDP_PLAY_JSON_KEY_PATH: ${clau.problema}: no es puja res`, [GUIA_CLAU_PLAY]);
  process.stdout.write(`\nGoogle Play (API REST v3, sense fastlane): pista ${pla.pista}, estat ${pla.estat}\n`);
  let pujada;
  try {
    pujada = await (play.pujaAPlay ?? pujaAPlay)({
      ...opcionsDeProves(play), clau: clau.clau, paquet: pla.api.paquet, aab: pla.aab, sha256, build, nomVersio: `${versio} (${build})`,
      pista: pla.pista, estat: pla.estat, registra: (text) => process.stdout.write(`${emmascara(text, valors, arrel)}\n`)
    });
  } catch (error) {
    return plegaDePlay(error, { valors, arrel, produccio, alpha, versio, build });
  }
  if (!pujada?.pujat) return plega(EIXIDA.EXTERNA, 'Google Play: el client no confirma la pujada: cap rebut ni registre; el Mestre mira Play Console');
  // B9 · La pujada s'apunta al registre DESPRÉS de fer-se (mai abans).
  if (registre.carpeta) {
    const avis = avisDelRegistre(apuntaPujada(registre.carpeta, { plataforma: 'android', canal, versio, build, sha256, commit: pre.segell?.commit ?? null, data: new Date().toISOString() }));
    if (avis) process.stderr.write(`avís: ${avis}\n`);
  }
  if (pujada.verificatDespres) {
    process.stdout.write(`! El commit no va tornar una resposta neta, però Google Play ja té el versionCode ${build} a la pista ${pla.pista} (status ${pujada.statusPlay ?? 'desconegut'}): la pujada està feta i s'apunta.\n`);
  }
  if (pujada.senseRevisio) {
    process.stdout.write('! Google Play ha demanat changesNotSentForReview: els canvis queden sense enviar a revisió; enviar-los és del Mestre a Play Console (P9).\n');
  }
  const prova = alpha ? 'la prova tancada (alpha)' : 'la prova interna';
  process.stdout.write(produccio
    ? `✓ pujat com a ESBORRANY a la pista production. Enviar-lo a revisió és del Mestre (RUNBOOK P9):\n${enumera(PASSOS_DESPRES_PRODUCCIO, versio, build)}\n`
    : (desplegat
      ? `✓ pujat i DESPLEGAT a ${prova}: els ${alpha ? 'verificadors de la prova tancada' : 'provadors interns'} reben l'actualització de Google Play sense cap clic a Play Console.\n`
      : `✓ pujat com a ESBORRANY a ${prova}. Revisar-lo i desplegar-lo és del Mestre (RUNBOOK P9), o --desplega ho fa en la pujada.\n`));
  process.stdout.write(rebut({ segell: pre.segell, versio, build, aab: pla.aab, pujat: true, canal, sha256, estat: pla.estat }));
  return EIXIDA.BE;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });

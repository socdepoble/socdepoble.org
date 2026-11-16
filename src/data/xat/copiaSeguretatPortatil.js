/**
 * copiaSeguretatPortatil.js — Còpia de Seguretat Portàtil `.sdpbackup` i
 * traspàs efímer per QR en xarxa local (`IDEA-267` · Onada R26, format v2).
 *
 * Nucli pur: cap DOM, cap xarxa, cap emmagatzematge. Els dos auxiliars d'arxiu
 * (desar i llegir el `.sdpbackup`) només fan servir les API web que se'ls
 * injecten, quan se'ls crida; cap Capacitor ni res de src/natiu/. Este és
 * l'ÚNIC motor `.sdpbackup` (consolidació R26 amb el Kit de Gemini i la
 * correcció de Codex 2224: el format `sdp.copia-seguretat-portatil` no
 * s'integra). `cripto` (WebCrypto) s'hi
 * injecta, `globalThis.crypto` per defecte, i les primitives són les del xat
 * xifrat (`../xifratXatCripto.js`): PBKDF2-HMAC-SHA256 amb el rang validat
 * ABANS de derivar, AES-256-GCM amb IV de 96 bits que només ix del generador i
 * etiqueta de 128 bits, JWK pública estricta (mai amb «d»), ECDH P-256 i HKDF.
 *
 * ── API estable (si el Kit R26 mou el motor a `src/data/`, es conserva tal qual) ──
 *   exportaCopiaSeguretatXat(opcions)            → Promise<string> (el fitxer)
 *   exportaCopiaSeguretatXatAmbRebut(opcions)    → Promise<{ text, rebut }>
 *   importaCopiaSeguretatXat(text, opcions)      → Promise<resultat>
 *   descriuCopiaSeguretatXat(text)               → capçalera i empremta, sense desxifrar
 *   fusionaRevisioMissatge(existent, revisio)    → el registre que es queda (mode «aplica-si-mes-nou»)
 *   creaOfertaTraspasLocalQr / validaOfertaTraspasLocalQr
 *   creaRespostaTraspasLocalQr / derivaSasTraspasLocalQr / creaComprovadorSas
 *   generaParellaEfimeraTraspas
 *   nomArxiuCopiaSeguretatXat / desaArxiuCopiaSeguretatXat / llegixArxiuCopiaSeguretatXat
 *   teCriptoPerALaCopia(cripto)                  → boolean (Onada R28: hi ha WebCrypto?)
 *   i les constants i codis `CODI_*` (cada error porta `codi` i `motiu`).
 *
 * ── Entrada (ronda 2 del Gauntlet R26 i consolidació R26) ──────────────
 *   · Fils i missatges amb la forma del DTO real (mapejaFil, mapejaMissatge):
 *     llista blanca de camps per àmbit; un camp de fora fa fallar la còpia
 *     (CODI_MATERIAL_SENSIBLE/camp-no-admes), mai es descarta en silenci. A
 *     més, a qualsevol profunditat i en exportar i en importar, noms prohibits
 *     normalitzats (camelCase, snake_case, kebab-case, majúscules i accents
 *     són el mateix nom; els reals del projecte, com privateKeyJwk o la
 *     credencial nativa), «token» i «sessio» dins dels objectes lliures, i
 *     heurística de valor (JWT, «Bearer», clau privada PEM o DER, secret de
 *     Supabase, JWK privada reconeguda per l'estructura amb o sense `kty`,
 *     també la RSA, credencial nativa, Push, també dins d'un JSON
 *     serialitzat), menys al text lliure de la gent (Onada R28: també el
 *     nom de cada altra persona, `altres[*].nom`, i el títol del subjecte,
 *     `subjecte.titol`, del fil). Una JWK pública passa.
 *   · Un missatge el fil del qual no és a `fils` fa fallar la còpia (mai es
 *     perd en silenci), i el mapa de cursors conserva cada fil amb missatges.
 *   · La data del missatge és `creatAl` (o l'àlies `createdAt`; tots dos
 *     discordants es rebutgen). Amb tall de data, una data absent o invàlida i
 *     un missatge sense seq fan fallar la còpia; cap dels dos talls deixa
 *     passar el cursor per damunt del primer missatge que exclou.
 *   · finsAlDia i desDeData: Date, «AAAA-MM-DD» d'un dia que existix, o ISO amb
 *     fus horari; l'instant es calcula sense Date.parse (igual a tots els motors).
 *
 * ── Format `.sdpbackup` v2 ──────────────────────────────────────────────
 *   { esquema: 'sdp.xat.backup.v2', versio: 2, capcalera, xifrat }   (xifrada)
 *   { esquema: 'sdp.xat.backup.v2', versio: 2, capcalera, pla }      (només proves)
 *   capcalera = { backupId, baseId, baseEmpremta, mode, usuariId, tenantId,
 *                 creatAt, proteccio, kdf: { algoritme, iteracions, sal },
 *                 aead: { algoritme, etiquetaBits, iv } }
 *   · AAD = JSON canònic de { esquema, versio, capcalera } sense `aead.iv`: el
 *     canvi de qualsevol camp (versió, algorisme, KDF, àmbit, backupId, baseId,
 *     mode) fa fallar l'etiqueta. L'IV no hi va perquè GCM ja l'autentica (J0).
 *   · Dins de l'AEAD: el manifest (backupId repetit, recomptes i SHA-256 de
 *     cada lot, cursors `desDeSeqPerFil` / `ultimSeqPerFil`, procedència de la
 *     clau) i les dades { fils, missatges, revisions, adjunts }. Els cursors
 *     van xifrats: no filtren metadades. `revisions` (només en una
 *     incremental) és la versió actual de cada missatge de la base que té
 *     làpida (`esborratAl`) o edició (`editatAl`): totes, no només les noves.
 *   · Empremta = SHA-256(AAD ‖ 0x00 ‖ xifrat): identifica els bytes exactes.
 *   · Contrasenya en UTF-8 de la forma NFC: la mateixa frase amb accents
 *     obri la còpia en iOS i en Android encara que el teclat la compose distint.
 *   · El v1 (sandbox R25.2, mai publicat) es rebutja com a degradació.
 *
 * ── Restauració ────────────────────────────────────────────────────────
 *   1. Tot es valida en memòria (mida, profunditat, esquema tancat, àmbit, KDF,
 *      AEAD, manifest, cada adjunt, referències, cursors, cadena) abans de
 *      cap escriptura.
 *   2. Les escriptures són operacions «insereix-si-absent» (mai sobreescriuen:
 *      una còpia antiga no ressuscita làpides ni canvia dades més noves) i
 *      el registre de la còpia va dins de la MATEIXA transacció. Les revisions
 *      d'una incremental són «aplica-si-mes-nou»: el magatzem ha d'aplicar
 *      fusionaRevisioMissatge (la làpida guanya sempre), de manera que
 *      restaurar A i després B no ressuscita un missatge esborrat per a tothom
 *      després de A. Amb `magatzem` ({ obriTransaccio() → { escriu, confirma,
 *      avorta } }) qualsevol fallada, també en l'últim adjunt, avorta la
 *      transacció: zero mutacions. Qui use `aplicaImportacio` ha d'aplicar
 *      també `revisions` amb la mateixa regla.
 *   3. Mai s'escriu cap estat de claus: el `kid` i el comptador de la còpia són
 *      procedència; una còpia antiga no reactiva un kid retirat ni un comptador
 *      vell (l'autoritat és el servidor, migració 2610290400).
 *   4. Incremental = `baseId` + `baseEmpremta` + cursors per fil autenticats;
 *      base absent, bifurcació, mateixa id amb bytes distints, nonce repetit i
 *      esquema desconegut es rebutgen; reimportar la mateixa còpia no escriu res.
 *
 * ── Contenidor ─────────────────────────────────────────────────────────
 *   No hi ha ZIP ni cap compressió ni descompressió: el contenidor és JSON
 *   (comprimir seria un format nou, decisió oberta del Mestre). Cotes de bytes,
 *   membres, profunditat, mida per adjunt (la de la classe en clar: imatge
 *   2 MB, veu 3 MB, vídeo 20 MB; un blob E2EE, una mida Padmé de blob fins als
 *   20 MB del bucket) i cancel·lació per `senyal`; ids ASCII segurs (cap
 *   col·lisió Unicode, cap ruta), noms en NFC sense `/`, `\`, `..`, controls
 *   ni bidi; en clar, la màgia del MIME declarat i cap arxiu comprimit ni
 *   còpia niada (un blob xifrat no s'inspecciona: comença per un IV
 *   aleatori); cap URL d'adjunt (mai es fa fetch de rutes del backup); una
 *   sola seq per fil.
 *
 * ── Traspàs QR/LAN (v2) ─────────────────────────────────────────────────
 *   Oferta (QR, canal autenticat per la càmera) amb clau ECDH efímera, nonce,
 *   sessió de 128 bits i caducitat ≤ 5 min mesurada amb el rellotge de qui
 *   valida; consum únic. Resposta pel LAN amb la clau efímera de l'altre
 *   extrem. SAS de 6 dígits = HKDF(ECDH, SHA-256 de tot el transcript, amb les
 *   dues claus, els dos nonces, identitats i empremtes DTLS): un home del mig
 *   que canvia la resposta obté un altre secret i un altre SAS. Comprovador
 *   amb límit d'intents. Mismatch, replay o caducitat avorten. L'àmbit esperat
 *   (sessió activa) i el de l'oferta són obligatoris i canònics: una oferta
 *   forjada amb null o '' no casa mai amb un esperat null o ''.
 *
 * ── Què NO fa (cablejat de la interfície) ────────────────────────────────
 *   Pujar adjunts restaurats al servidor (ha de passar per reserva, pujada,
 *   confirmació i quota reals de 2610220240), autoritzar o revocar la Tauleta
 *   Espill, ni obrir WebRTC: només en dona les peces verificades.
 */
import { MAXIM_ADJUNT_XAT, MAXIM_BLOB_ADJUNT, MIME_XAT, MIME_XIFRAT } from '../xatMultimedia.js';
import {
  BYTES_ETIQUETA,
  BYTES_IV,
  aBase64url,
  aleatori,
  deBase64url,
  derivaBitsHkdf,
  desxifraAesGcm,
  exigixCripto,
  exportaPublica,
  generaParellaDh,
  importaClauHkdf,
  infoHkdf,
  jwkDePublica,
  kekPbkdf2,
  midaPadme,
  publicaDeJwk,
  secretDh,
  sha256,
  xifraAesGcm,
} from '../xifratXatCripto.js';

export const VERSIO_SDP_BACKUP = 2;
export const ESQUEMA_SDP_BACKUP = 'sdp.xat.backup.v2';
export const VERSIO_SDP_QR_P2P = 2;
export const ESQUEMA_SDP_QR_P2P = 'sdp.xat.qr_p2p.v2';
export const ALGORITME_KDF = 'PBKDF2-HMAC-SHA256';
export const ALGORITME_AEAD = 'AES-256-GCM';
export const ITERACIONS_PBKDF2_MINIMES = 600000;
export const ITERACIONS_PBKDF2_MAXIMES = 10000000;
export const MIN_CARACTERS_CONTRASENYA = 12;
export const TTL_QR_MAX_MS = 5 * 60 * 1000; // 5 minuts
export const TTL_QR_MIN_MS = 30 * 1000;
export const MARGE_RELLOTGE_QR_MS = 30 * 1000;
export const MAX_INTENTS_SAS = 3;
export const MAX_BYTES_ARXIU_BACKUP = 64 * 1024 * 1024; // 64 MiB per arxiu portàtil
export const MAX_BYTES_ADJUNT = MAXIM_BLOB_ADJUNT; // 20 MB, el sostre del bucket
export const MAX_FILS = 10000;
export const MAX_MISSATGES = 500000;
export const MAX_ADJUNTS = 10000;
export const MAX_PROFUNDITAT_JSON = 32;
export const MAX_PROFUNDITAT_REGISTRE = 16;
export const MIMES_ADJUNT_PERMESOS = Object.freeze([...Object.keys(MIME_XAT), MIME_XIFRAT]);

export const CODI_CLAU_FEBLE = 'SDP_BACKUP_CLAU_FEBLE';
export const CODI_CLAU_INCORRECTA = 'SDP_BACKUP_CLAU_INCORRECTA';
export const CODI_COPIA_CORRUPTA = 'SDP_BACKUP_CORRUPTA';
export const CODI_IDENTITAT_DIVERGENT = 'SDP_BACKUP_IDENTITAT_DIVERGENT';
export const CODI_DEGRADACIO = 'SDP_BACKUP_DEGRADACIO';
export const CODI_NONCE_REPETIT = 'SDP_BACKUP_NONCE_REPETIT';
export const CODI_BASE_ABSENT = 'SDP_BACKUP_BASE_ABSENT';
export const CODI_CADENA_DIVERGENT = 'SDP_BACKUP_CADENA_DIVERGENT';
export const CODI_MATERIAL_SENSIBLE = 'SDP_BACKUP_MATERIAL_SENSIBLE';
export const CODI_LIMIT_SUPERAT = 'SDP_BACKUP_LIMIT_SUPERAT';
export const CODI_RESTAURACIO_AVORTADA = 'SDP_BACKUP_RESTAURACIO_AVORTADA';
export const CODI_ARXIU_NO_DESAT = 'SDP_BACKUP_ARXIU_NO_DESAT';
export const CODI_QR_INVALID = 'SDP_QR_P2P_INVALID';

export const EXTENSIO_SDP_BACKUP = '.sdpbackup';
export const MIME_SDP_BACKUP = 'application/vnd.socdepoble.backup+json';
export const ESPERA_REVOCACIO_URL_MS = 60 * 1000;

const MODES_DISPOSITIU_QR = new Set(['traspas_mobil_nou', 'tauleta_espill_casa']);
const MODES_COPIA = new Set(['complet', 'incremental', 'parcial']);
const ROLS_QR = new Set(['oferent', 'responent']);
const FORMA_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const FORMA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const FORMA_HEX_SHA256 = /^[0-9a-f]{64}$/;
/* Forma simple a propòsit: la variant amb grups `(?:x{4})*` esgota la pila de
   l'expressió regular amb desenes de MB. La llargària i la forma canònica es
   comproven a part (re-codificat idèntic). */
const FORMA_B64 = /^[A-Za-z0-9+/]*={0,2}$/;
const FORMA_MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;
const CONTROLS_I_BIDI = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
const FORMA_EMPREMTA_DTLS = /^a=fingerprint:sha-256 ((?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})\s*$/gim;
const MAX_BYTES_SDP = 16 * 1024;
const MAX_BYTES_AMBIT = 256;
const MAX_REGISTRE_NONCES_EXPORT = 4096;

/* Llista blanca per àmbit (ronda 2 del Gauntlet R26, D-COPIA-7): els camps
   del DTO real del xat i cap més. Fil = mapejaFil de supabase/xat.js (i
   conversaDe de localXat.js, que en té la mateixa forma); missatge =
   mapejaMissatge i mapejaMissatgeXifrat (supabase/xatXifrat.js), amb
   `createdAt` admés com a àlies de `creatAl`. Un camp de fora (una sessió, un
   token, una fila crua amb `cos`) fa fallar la còpia en exportar i en
   importar: mai es descarta en silenci (seria pèrdua de dades sense avís). */
const CAMPS_FIL = new Set([
  'id', 'canalClau', 'canalBetaTesters', 'esPropi', 'epocaActual', 'e2eeDesDeSeq', 'capEpoca', 'tipus', 'titol',
  'altresNoms', 'altres', 'entitatId', 'entitatNom', 'comEntitat', 'imatgeUrl', 'actualitzatAl', 'ultimText',
  'ultimTipus', 'ultimAl', 'ultimAutorId', 'ultimSeq', 'llegitFinsSeq', 'rebutFinsSeq', 'llegitPelsAltresFinsSeq',
  'rebutPelsAltresFinsSeq', 'noLlegits', 'arxivatAl', 'fixatAl', 'silenciatFinsAl', 'preferitAl', 'noLlegitManual',
  'comunitatId', 'subjecte', 'rol', 'participants', 'participant',
]);
const CAMPS_MISSATGE = new Set([
  'id', 'xifrat', 'filId', 'seq', 'usuariId', 'autorNom', 'text', 'tipus', 'respostaA', 'editatAl', 'esborratAl',
  'metadades', 'esIA', 'comOrgId', 'creatAl', 'createdAt',
]);
/* Text que escriu la gent (cos, títols, noms): és contingut seu, no material de
   l'app. L'heurística de valor no s'hi aplica, perquè un missatge que diu un
   JWT no ha de deixar mai sense còpia la persona que l'ha escrit. */
const CAMPS_TEXT_LLIURE = new Set(['text', 'ultimText', 'titol', 'autorNom', 'entitatNom', 'altresNoms']);
/* Onada R28 · copia-xat-02 · El text de la gent també viu dins de dos objectes
   lliures del fil: el nom de cada altra persona o entitat (`altres[*].nom`, que
   ve de profiles.full_name o d'organizations.name i l'escriu un altre veí, de
   120 caràcters com a molt) i el títol del subjecte (`subjecte.titol`, el d'una
   pàgina o d'una entitat). «Bearer Pepa» hi és un nom, no un testimoni: sense
   això, el nom d'un veí deixava sense còpia tothom que hi parla. Només el VALOR
   DE TEXT d'eixos camps se salta l'heurística de valor, com els de primer nivell
   de CAMPS_TEXT_LLIURE. Dins d'`altres` i de `subjecte` continuen els noms
   prohibits, les JWK privades, la credencial nativa, Push i l'heurística de
   valor de tots els altres camps; i un `nom` o un `titol` que no és text, també
   la passa. `'*'` és cada element d'una llista. Només per a l'àmbit 'fil'. */
const CAMPS_TEXT_LLIURE_NIAT_FIL = Object.freeze({
  altres: Object.freeze({ '*': new Set(['nom']) }),
  subjecte: new Set(['titol']),
});
/* Noms de camp que mai poden viatjar en una còpia, a qualsevol profunditat:
   segona capa, darrere de la llista blanca, per als objectes lliures
   (metadades, altres, subjecte). Es comparen normalitzats (nomNormalitzat):
   sense accents, en minúscules i sense res que no siga lletra o xifra, de
   manera que accessToken, access_token, access-token, ACCESS.TOKEN i «access
   token» són el mateix nom. Consolidació R26 (GBK02 de Codex): també els noms
   reals del projecte, la credencial nativa de credencialDe
   (src/natiu/entradaSocial.js: testimoniAcces, codiAutoritzacio), la clau del
   mode rural i de la federació (privateKeyJwk), els codis d'un sol ús del
   connector social (authorizationCode, serverAuthCode) i les claus de servei. */
const CLAUS_PROHIBIDES = new Set([
  'accesstoken', 'refreshtoken', 'idtoken', 'providertoken', 'providerrefreshtoken', 'jwt', 'authorization',
  'bearer', 'password', 'contrasenya', 'passphrase', 'fraserecuperacio', 'frasederecuperacio', 'mnemonic',
  'clauprivada', 'privatekey', 'privkey', 'secretkey', 'clausecreta', 'pushsubscription', 'subscripciopush',
  'rk', 'kll', 'backupprivatct', 'backuprkct', 'sobreclau', 'sigpriv', 'dhpriv',
  'privatekeyjwk', 'clauprivadajwk', 'credencial', 'credencials', 'credencialnativa', 'credential', 'credentials',
  'testimoniacces', 'codiautoritzacio', 'authorizationcode', 'serverauthcode', 'authcode',
  'servicerole', 'servicerolekey', 'apikey', 'clientsecret',
]);
const nomNormalitzat = (clau) => clau.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
/* Una clau privada amb qualsevol sufix (privateKeyPem, clauPrivadaB64, secretKeyHex). */
const PREFIXOS_CLAU_PRIVADA = ['privatekey', 'clauprivada', 'secretkey', 'clausecreta', 'privkey'];
const esNomProhibit = (nom) => CLAUS_PROHIBIDES.has(nom) || PREFIXOS_CLAU_PRIVADA.some((p) => nom.startsWith(p));
/* Noms genèrics de credencial (GBK02): «token» en qualsevol composició
   (pushToken, token_acces, csrf-token) i «sessio»/«session». També tenen usos
   innocents (els tokens d'una resposta d'IA són un recompte; una sessió d'un
   curs, un número), per això només compten dins dels objectes lliures (al
   primer nivell ja mana la llista blanca de l'àmbit) i amb un valor que pot
   portar un secret: un text no buit, un objecte o una llista. */
const NOMS_SESSIO = new Set(['sessio', 'sessions', 'session']);
const esNomCredencialGeneric = (nom) => nom.includes('token') || NOMS_SESSIO.has(nom);
const potPortarSecret = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== null && typeof v === 'object');
/* Heurística de valor (qualsevol nom de camp): un JWT sencer, un «Bearer …»,
   una clau privada PEM o DER (PKCS#8 o SEC1) en base64, una clau secreta de
   Supabase (la idea és del Kit R26 de Gemini). */
const FORMA_JWT = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
const FORMA_BEARER = /^bearer\s+\S/i;
const FORMA_PEM_PRIVADA = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/;
const FORMA_SECRET_SUPABASE = /^sb_secret_[A-Za-z0-9_-]{8}/;
const MEMBRES_JWK_PRIVATS = ['d', 'k', 'p', 'q', 'dp', 'dq', 'qi'];
const MEMBRES_RSA_PRIVATS = ['d', 'p', 'q', 'dp', 'dq', 'qi'];
const MAX_BYTES_JSON_NIAT = 64 * 1024;
/* Capçaleres d'arxius comprimits: el contenidor mai descomprimix res i no n'admet de niats. */
const MAGIQUES_ARXIU = Object.freeze([
  [0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08],
  [0x1f, 0x8b], [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07],
]);
/* Màgia positiva de cada MIME en clar del xat: el contingut ha de ser del tipus
   declarat. ISO-BMFF (mp4, QuickTime, audio/mp4): el tipus de la primera caixa
   a l'òfset 4. Els adjunts xifrats (MIME_XIFRAT) no s'inspeccionen: comencen
   per un IV aleatori. */
const CAIXES_ISO_BMFF = new Set(['ftyp', 'styp', 'moov', 'mdat', 'free', 'skip', 'wide', 'pnot']);
const ascii = (bytes, des, n) => String.fromCharCode(...bytes.subarray(des, des + n));
const MAGIA_FAMILIA_MIME = Object.freeze({
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP',
  'video/mp4': (b) => b.length >= 8 && CAIXES_ISO_BMFF.has(ascii(b, 4, 4)),
  'video/quicktime': (b) => b.length >= 8 && CAIXES_ISO_BMFF.has(ascii(b, 4, 4)),
  'audio/mp4': (b) => b.length >= 8 && CAIXES_ISO_BMFF.has(ascii(b, 4, 4)),
  'video/webm': (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  'audio/webm': (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  'audio/ogg': (b) => b.length >= 4 && ascii(b, 0, 4) === 'OggS',
});
const CLAUS_ADJUNT = 'bytes,dadesBase64,id,mime,missatgeId,nom,sha256';
const CLAUS_CAPCALERA_XIFRADA = 'aead,backupId,baseEmpremta,baseId,creatAt,kdf,mode,proteccio,tenantId,usuariId';
const CLAUS_CAPCALERA_PLA = 'backupId,baseEmpremta,baseId,creatAt,mode,proteccio,tenantId,usuariId';
const CLAUS_OFERTA = 'clauPublicaEfimeraJwk,creatAtMs,empremtaSha256,esquema,expiraAtMs,modeDispositiu,nonce,sdpOffer,sessioId,tenantId,tipus,usuariId,versio';
const CLAUS_RESPOSTA = 'clauPublicaEfimeraJwk,creatAtMs,empremtaOferta,esquema,nonce,sdpAnswer,sessioId,tenantId,tipus,usuariId,versio';

/* ── Utilitats ─────────────────────────────────────────────────────────── */

function creaErrorTipificat(codi, motiu, missatge, extra = null) {
  const err = new Error(missatge);
  err.codi = codi;
  err.motiu = motiu;
  if (extra) Object.assign(err, extra);
  return err;
}

const codifica = (text) => new TextEncoder().encode(text);
const esObjectePla = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const clausOrdenades = (v) => Object.keys(v).sort().join(',');

function bytesAHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function comparacioTempsConstant(a, b) {
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  let diff = sa.length ^ sb.length;
  const n = Math.max(sa.length, sb.length);
  for (let i = 0; i < n; i += 1) diff |= (sa.charCodeAt(i) || 0) ^ (sb.charCodeAt(i) || 0);
  return diff === 0;
}

function concatena(...trossos) {
  const total = trossos.reduce((n, t) => n + t.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const t of trossos) {
    out.set(t, p);
    p += t.length;
  }
  return out;
}

/* JSON canònic (claus ordenades). Falla tancat amb qualsevol valor no JSON:
   sense això un `undefined` o una `Date` donarien un hash que no es pot repetir. */
function canonic(valor) {
  if (valor === null || typeof valor === 'string' || typeof valor === 'boolean') return JSON.stringify(valor);
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'valor-no-json', 'Nombre no finit a la còpia.');
    return JSON.stringify(valor);
  }
  if (Array.isArray(valor)) return `[${valor.map(canonic).join(',')}]`;
  if (esObjectePla(valor)) {
    return `{${Object.keys(valor).sort().map((k) => `${JSON.stringify(k)}:${canonic(valor[k])}`).join(',')}}`;
  }
  throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'valor-no-json', 'Valor no serialitzable a la còpia.');
}

async function sha256Hex(cripto, bytes) {
  return bytesAHex(await sha256(cripto, bytes));
}

function exigixNoAvortat(senyal) {
  if (senyal && senyal.aborted) {
    throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, 'avortat', 'Operació de còpia cancel·lada abans d’escriure res.');
  }
}

/* Profunditat de claudàtors d'un text JSON, en una passada i abans de
   JSON.parse: un niament patològic es rebutja sense construir-lo. */
function exigixProfunditatJson(text, maxim) {
  let profunditat = 0;
  let enCadena = false;
  let escapat = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (enCadena) {
      if (escapat) escapat = false;
      else if (c === 92) escapat = true;
      else if (c === 34) enCadena = false;
    } else if (c === 34) {
      enCadena = true;
    } else if (c === 123 || c === 91) {
      profunditat += 1;
      if (profunditat > maxim) {
        throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'profunditat', `JSON niat per damunt de ${maxim} nivells.`);
      }
    } else if (c === 125 || c === 93) {
      profunditat -= 1;
    }
  }
}

function midaUtf8(text) {
  if (text.length > MAX_BYTES_ARXIU_BACKUP) return text.length; // ja és massa gran
  return /^[\x00-\x7f]*$/.test(text) ? text.length : codifica(text).length;
}

function base64ABytes(b64, motiu = 'base64') {
  const net = typeof b64 === 'string' ? b64 : '';
  if (!net || net.length % 4 !== 0 || !FORMA_B64.test(net)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, 'Codificació Base64 invàlida a la còpia .sdpbackup.');
  }
  let bytes;
  if (typeof Buffer !== 'undefined') {
    bytes = new Uint8Array(Buffer.from(net, 'base64'));
  } else {
    const bin = atob(net);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  }
  // Canònic: els bits sobrers a zero (una altra cadena no pot donar els mateixos bytes).
  if (bytesABase64(bytes) !== net) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, 'Base64 no canònic a la còpia .sdpbackup.');
  }
  return bytes;
}

function bytesABase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  const trossos = [];
  for (let i = 0; i < bytes.length; i += 0x8000) trossos.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)));
  return btoa(trossos.join(''));
}

/* El xifrat pot fer desenes de MB: base64url pel descodificador natiu, amb la
   mateixa exigència de forma canònica que deBase64url (re-codificat idèntic). */
function aBase64urlGran(bytes) {
  return bytesABase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlGranABytes(text, motiu) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, `Camp binari invàlid a la còpia (${motiu}).`);
  }
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const bytes = base64ABytes(b64, motiu);
  if (aBase64urlGran(bytes) !== text) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, `Camp binari no canònic a la còpia (${motiu}).`);
  }
  return bytes;
}

function b64urlABytes(text, longitud, motiu) {
  try {
    return deBase64url(text, longitud);
  } catch {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, `Camp binari invàlid a la còpia (${motiu}).`);
  }
}

function exigixAmbit(valor, nom, codi = CODI_IDENTITAT_DIVERGENT) {
  const net = typeof valor === 'string' ? valor.trim() : '';
  if (!net || codifica(net).length > MAX_BYTES_AMBIT || CONTROLS_I_BIDI.test(net)) {
    throw creaErrorTipificat(codi, 'ambit', `Cal indicar ${nom} no buit i sense caràcters de control.`);
  }
  return net;
}

function exigixId(valor, motiu) {
  if (typeof valor !== 'string' || !FORMA_ID.test(valor) || valor.includes('..')) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, `Identificador invàlid a la còpia (${motiu}).`);
  }
  return valor;
}

/* L'id d'una còpia són 128 bits aleatoris en base64url canònic: pot començar
   per «-» o «_», així que no passa per la forma dels ids de registre. */
function exigixIdCopia(valor, motiu) {
  b64urlABytes(valor, 16, motiu);
  return valor;
}

function esCursor(v) {
  return Number.isSafeInteger(v) && v >= 0;
}

function exigixMapaCursors(mapa, motiu) {
  if (!esObjectePla(mapa)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, 'Cal un mapa de cursors per fil.');
  const net = Object.create(null);
  for (const [fil, seq] of Object.entries(mapa)) {
    exigixId(fil, motiu);
    if (!esCursor(seq)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, 'Cursor per fil invàlid.');
    net[fil] = seq;
  }
  return net;
}

const mapaPla = (mapa) => Object.fromEntries(Object.keys(mapa).sort().map((k) => [k, mapa[k]]));

const errorMaterial = (ruta) => creaErrorTipificat(CODI_MATERIAL_SENSIBLE, 'material-sensible', `Material secret a la còpia (${ruta}).`, { cami: ruta });

/* Una clau privada DER en base64 o base64url: SEQUENCE, INTEGER 0 (PKCS#8) o
   1 (SEC1), i després SEQUENCE (AlgorithmIdentifier) o OCTET STRING. Només es
   descodifiquen els 16 primers caràcters; en un xifrat aleatori la
   coincidència dels 6 bytes fixos és ~2⁻⁴⁰. */
function esDerClauPrivada(text) {
  if (text.length < 40 || !text.startsWith('MI')) return false;
  const net = text.replace(/\s+/g, '');
  if (!/^MI[A-Za-z0-9+/_-]+={0,2}$/.test(net)) return false;
  const cap = net.slice(0, 16).replace(/-/g, '+').replace(/_/g, '/');
  let b;
  try {
    b = Uint8Array.from(atob(cap), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  if (b[0] !== 0x30) return false;
  const i = b[1] < 0x80 ? 2 : b[1] === 0x81 ? 3 : b[1] === 0x82 ? 4 : -1;
  return i > 0 && b[i] === 0x02 && b[i + 1] === 0x01 && (b[i + 2] === 0x00 || b[i + 2] === 0x01)
    && (b[i + 3] === 0x30 || b[i + 3] === 0x04);
}

/* El valor (no el nom) d'una cadena: JWT, «Bearer», clau privada PEM o DER.
   Torna el JSON niat si la cadena n'és un d'objecte o de llista (p. ex. una
   subscripció Push o una sessió serialitzades), perquè també s'inspeccione. */
function inspeccionaCadena(text, ruta) {
  const net = text.trim();
  if (FORMA_JWT.test(net) || FORMA_BEARER.test(net) || FORMA_PEM_PRIVADA.test(net) || FORMA_SECRET_SUPABASE.test(net)
    || esDerClauPrivada(net)) {
    throw errorMaterial(ruta);
  }
  if (net.startsWith('{') || net.startsWith('[')) {
    // Un JSON massa gran per a inspeccionar no és text opac segur: podria
    // amagar el mateix material privat que rebutgem en un JSON menut.
    if (net.length > MAX_BYTES_JSON_NIAT) {
      throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'json-niat-massa-gran', `JSON serialitzat massa gran per a inspeccionar (${ruta}).`);
    }
    try {
      return JSON.parse(net);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/* Material sensible, a qualsevol profunditat: noms prohibits, JWK privada
   reconeguda per l'estructura i no pel nom del camp que la conté (amb `kty`
   o `crv`, o amb `x` i `y`, i `d`; amb `kty` i qualsevol membre privat; RSA
   sense `kty`: `n` i `e` de text amb `d`, `p`, `q`, `dp`, `dq` o `qi`), la
   credencial nativa de credencialDe (`testimoni` amb `nonce`; un `testimoni`
   sol és dada patrimonial), subscripció Push, i l'heurística de valor de les
   cadenes (també dins d'un JSON serialitzat). També la profunditat i
   `__proto__`. Iteratiu (sense pila). Els camps de primer nivell de
   `textLliure` no passen per l'heurística de valor. Onada R28 · Tampoc els
   camps de text niats que diu `textLliureNiat` (un mapa clau → mapa niat, o
   el Set dels camps de text d'un objecte; `'*'`, cada element d'una llista):
   vegeu CAMPS_TEXT_LLIURE_NIAT_FIL. */
function exigixRegistreNet(registre, cami, { textLliure = null, textLliureNiat = null } = {}) {
  const pendents = [[registre, cami, 1, false, textLliureNiat]];
  while (pendents.length) {
    const [valor, ruta, profunditat, lliure, esquema] = pendents.pop();
    if (typeof valor === 'string') {
      if (!lliure) {
        const niat = inspeccionaCadena(valor, ruta);
        if (niat !== undefined && niat !== null && typeof niat === 'object') pendents.push([niat, `${ruta}<json>`, profunditat + 1, false]);
      }
      continue;
    }
    if (valor === null || typeof valor !== 'object') continue;
    if (profunditat > MAX_PROFUNDITAT_REGISTRE) {
      throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'profunditat', `Registre massa niat (${ruta}).`);
    }
    if (Array.isArray(valor)) {
      /* `esquema`: la part de textLliureNiat que toca a este valor (o null). */
      const esquemaElement = esquema && !(esquema instanceof Set) && Object.hasOwn(esquema, '*') ? esquema['*'] : null;
      valor.forEach((v, i) => pendents.push([v, `${ruta}[${i}]`, profunditat + 1, lliure, esquemaElement]));
      continue;
    }
    const claus = Object.keys(valor);
    const te = (m) => claus.includes(m);
    const esJwk = te('kty') || te('crv') || (te('x') && te('y'));
    const esRsa = te('n') && te('e') && typeof valor.n === 'string' && typeof valor.e === 'string';
    if ((esJwk && te('d')) || (te('kty') && MEMBRES_JWK_PRIVATS.some(te)) || (esRsa && MEMBRES_RSA_PRIVATS.some(te))
      || (te('testimoni') && te('nonce') && potPortarSecret(valor.testimoni))
      || (te('endpoint') && (esObjectePla(valor.keys) || te('p256dh') || te('auth')))) {
      throw errorMaterial(ruta);
    }
    for (const clau of claus) {
      if (clau === '__proto__' || clau === 'constructor' || clau === 'prototype') {
        throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'clau-reservada', `Clau reservada a la còpia (${ruta}).`);
      }
      const nom = nomNormalitzat(clau);
      if (esNomProhibit(nom) || (profunditat > 1 && esNomCredencialGeneric(nom) && potPortarSecret(valor[clau]))) {
        throw errorMaterial(`${ruta}.${clau}`);
      }
      let filla = profunditat === 1 && textLliure ? textLliure.has(clau) : lliure;
      let esquemaFill = null;
      if (esquema instanceof Set) filla = filla || (esquema.has(clau) && typeof valor[clau] === 'string');
      /* Onada R28 · revisió · `'*'` només val per als elements d'una llista: en
         un objecte, una clau «*» no hereta l'esquema dels elements. */
      else if (esquema && clau !== '*' && Object.hasOwn(esquema, clau)) esquemaFill = esquema[clau];
      pendents.push([valor[clau], `${ruta}.${clau}`, profunditat + 1, filla, esquemaFill]);
    }
  }
}

/* Només els camps del model del xat (després de buscar material secret, perquè
   un secret sempre es diga pel seu nom encara que vinga en un camp de fora). */
function exigixCampsAdmesos(registre, camps, cami) {
  for (const clau of Object.keys(registre)) {
    if (!camps.has(clau)) {
      throw creaErrorTipificat(CODI_MATERIAL_SENSIBLE, 'camp-no-admes',
        `Camp no admés a la còpia (${cami}.${clau}): només viatgen els camps del model del xat.`, { cami: `${cami}.${clau}` });
    }
  }
}

const AMBITS_REGISTRE = Object.freeze({ fil: CAMPS_FIL, missatge: CAMPS_MISSATGE });

function exigixRegistreDelModel(registre, ambit, cami) {
  exigixRegistreNet(registre, cami, {
    textLliure: CAMPS_TEXT_LLIURE,
    textLliureNiat: ambit === 'fil' ? CAMPS_TEXT_LLIURE_NIAT_FIL : null,
  });
  exigixCampsAdmesos(registre, AMBITS_REGISTRE[ambit], cami);
}

/* Còpia JSON del registre que entra a l'exportació: Date → ISO, cap undefined. */
function normalitzaRegistre(registre, ambit, cami) {
  if (!esObjectePla(registre)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'registre', `Registre invàlid (${cami}).`);
  let clon;
  try {
    clon = JSON.parse(JSON.stringify(registre));
  } catch {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'valor-no-json', `Registre no serialitzable (${cami}).`);
  }
  exigixRegistreDelModel(clon, ambit, cami);
  return clon;
}

function exigixNomAdjunt(nom) {
  if (typeof nom !== 'string' || !nom || codifica(nom).length > 255 || nom !== nom.normalize('NFC')
    || CONTROLS_I_BIDI.test(nom) || /[/\\:]/.test(nom) || nom.startsWith('.') || nom.trim() !== nom) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'nom-adjunt', 'Nom d’adjunt insegur a la còpia (ruta, control o forma no NFC).');
  }
  return nom;
}

/* En exportar, el nom d'origen (p. ex. «foto 12:30.jpg» de macOS) es saneja
   en lloc de fer fallar la còpia; en importar, la mateixa regla és estricta. */
function sanejaNomAdjunt(nom, id) {
  let net = String(nom ?? '').normalize('NFC')
    .replace(new RegExp(CONTROLS_I_BIDI.source, 'g'), '')
    .replace(/[/\\:]/g, '_')
    .trim()
    .replace(/^[.\s]+/, '');
  while (codifica(net).length > 255) net = Array.from(net).slice(0, -1).join('').trimEnd();
  return net || id;
}

function esArxiuNiat(bytes) {
  if (MAGIQUES_ARXIU.some((m) => m.length <= bytes.length && m.every((b, i) => bytes[i] === b))) return true;
  if (bytes[0] === 0x7b) {
    const cap = new TextDecoder().decode(bytes.subarray(0, 96));
    if (cap.includes('sdp.xat.backup')) return true;
  }
  return false;
}

/* Un blob E2EE és iv12 ‖ Padmé(clar ‖ 0x80) ‖ etiqueta16 (midaBlobAdjunt de
   xatMultimediaXifrat.js): la seua mida és un punt fix de Padmé més 28 B. */
function esMidaBlobXifrat(mida) {
  const farcit = mida - BYTES_IV - BYTES_ETIQUETA;
  return Number.isSafeInteger(mida) && mida <= MAXIM_BLOB_ADJUNT && farcit >= 2 && midaPadme(farcit) === farcit;
}

/* Sostre de cada adjunt: el de la seua classe en clar (imatge 2 MB, veu 3 MB,
   vídeo 20 MB: MAXIM_ADJUNT_XAT, com la migració 2610220240) o el del blob
   xifrat al bucket. */
const sostreAdjunt = (mime) => (mime === MIME_XIFRAT ? MAXIM_BLOB_ADJUNT : MAXIM_ADJUNT_XAT[MIME_XAT[mime]]);

async function verificaAdjunt(cripto, adj, idsMissatges) {
  if (!esObjectePla(adj) || clausOrdenades(adj) !== CLAUS_ADJUNT) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-forma', 'Adjunt amb camps inesperats (cap URL ni ruta admesa).');
  }
  exigixId(adj.id, 'adjunt-id');
  exigixId(adj.missatgeId, 'adjunt-missatge');
  if (!idsMissatges.has(adj.missatgeId)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-orfe', `Adjunt sense missatge dins de la còpia (${adj.id}).`);
  }
  if (typeof adj.mime !== 'string' || !FORMA_MIME.test(adj.mime) || !MIMES_ADJUNT_PERMESOS.includes(adj.mime)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-mime', `MIME d’adjunt no admés (${adj.id}).`);
  }
  exigixNomAdjunt(adj.nom);
  const sostre = Math.min(MAX_BYTES_ADJUNT, sostreAdjunt(adj.mime) ?? 0);
  if (!Number.isSafeInteger(adj.bytes) || adj.bytes < 1 || adj.bytes > sostre) {
    throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'adjunt-mida', `Adjunt fora de la mida admesa per a ${adj.mime} (${adj.id}).`);
  }
  if (typeof adj.dadesBase64 !== 'string' || adj.dadesBase64.length > Math.ceil(sostre / 3) * 4) {
    throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'adjunt-mida', `Adjunt massa gran (${adj.id}).`);
  }
  const bytes = base64ABytes(adj.dadesBase64, 'adjunt-base64');
  if (bytes.length !== adj.bytes) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-truncat', `Adjunt truncat (${adj.id}).`);
  }
  if (adj.mime === MIME_XIFRAT) {
    // Xifrat: bytes aleatoris des del primer (l'IV). Mirar-hi màgies no aporta
    // res i rebutjaria 1 de cada 65.536 blobs legítims; es comprova la mida.
    if (!esMidaBlobXifrat(bytes.length)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-blob', `El blob xifrat no té una mida de blob E2EE (${adj.id}).`);
    }
  } else {
    if (esArxiuNiat(bytes)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'arxiu-niat', `Arxiu comprimit o còpia niada dins d’un adjunt (${adj.id}).`);
    }
    const magia = MAGIA_FAMILIA_MIME[adj.mime];
    if (!magia || !magia(bytes)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-contingut', `El contingut no és del tipus declarat ${adj.mime} (${adj.id}).`);
    }
  }
  if (typeof adj.sha256 !== 'string' || !FORMA_HEX_SHA256.test(adj.sha256)
    || !comparacioTempsConstant(await sha256Hex(cripto, bytes), adj.sha256)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-sha256', `Adjunt corrupte o truncat (${adj.id}).`);
  }
  return bytes.length;
}

function exigixUnics(llista, motiu) {
  const vistos = new Set();
  for (const r of llista) {
    if (vistos.has(r.id)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, motiu, `Identificador duplicat a la còpia (${r.id}).`);
    vistos.add(r.id);
  }
  return vistos;
}

function exigixRecomptes(fils, missatges, adjunts) {
  if (fils.length > MAX_FILS || missatges.length > MAX_MISSATGES || adjunts.length > MAX_ADJUNTS) {
    throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'membres', 'La còpia supera el nombre màxim d’elements admesos.');
  }
}

function exigixSeqMissatge(m, ambSeq) {
  const teSeq = m.seq !== undefined && m.seq !== null;
  if ((ambSeq || teSeq) && (!Number.isSafeInteger(m.seq) || m.seq < 1)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'missatge-seq', `Missatge sense seq vàlida (${m.id}).`);
  }
}

function exigixMissatge(m, idsFils, ambSeq) {
  exigixId(m.id, 'missatge-id');
  exigixId(m.filId, 'missatge-fil');
  if (!idsFils.has(m.filId)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'missatge-orfe', `Missatge sense fil dins de la còpia (${m.id}).`);
  }
  exigixSeqMissatge(m, ambSeq);
}

/* La seq és única dins de cada fil (índex únic (fil_id, seq) del servidor). */
function creaGuardaSeq() {
  const vistes = new Set();
  return (m) => {
    if (!Number.isSafeInteger(m.seq)) return;
    const clau = `${m.filId}\u0000${m.seq}`;
    if (vistes.has(clau)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'seq-duplicada', `Dos missatges del fil ${m.filId} amb la seq ${m.seq}.`);
    }
    vistes.add(clau);
  };
}

/* ── Revisions (làpides i edicions) ── Una incremental porta, a més dels
   missatges nous, la versió actual de cada missatge ja cobert per la base
   (seq ≤ cursor) que té `esborratAl` o `editatAl`. Les porta TOTES, no només
   les posteriors a la base: un aparell que va fer la base sense xarxa aprén
   després esborrats amb una data de servidor anterior. S'apliquen amb el mode
   «aplica-si-mes-nou» (fusionaRevisioMissatge): la làpida guanya sempre. */
const esRevisio = (m) => (m.esborratAl !== null && m.esborratAl !== undefined) || (m.editatAl !== null && m.editatAl !== undefined);

function exigixDatesRevisio(m) {
  for (const camp of ['esborratAl', 'editatAl']) {
    if (m[camp] !== null && m[camp] !== undefined && !Number.isFinite(instantDe(m[camp]))) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'revisio-data', `Data ${camp} invàlida (${m.id}).`);
    }
  }
}

/**
 * La regla del mode «aplica-si-mes-nou» per a l'adaptador del magatzem: torna
 * el registre que s'ha de quedar. Una làpida guanya sempre i no es desfà mai;
 * una edició només substituïx una versió sense edició o amb una edició més
 * antiga; una revisió d'un altre fil, d'una altra seq o sense data vàlida no
 * toca res. Si el missatge no hi és, s'insereix la revisió (la làpida també:
 * marca el missatge com a esborrat abans que cap còpia antiga el porte).
 */
export function fusionaRevisioMissatge(existent, revisio) {
  if (!esObjectePla(revisio)) return existent ?? null;
  if (existent === null || existent === undefined) return revisio;
  if (existent.id !== revisio.id || existent.filId !== revisio.filId || existent.seq !== revisio.seq) return existent;
  const esborratExistent = existent.esborratAl !== null && existent.esborratAl !== undefined;
  if (esborratExistent) return existent;
  if (Number.isFinite(instantDe(revisio.esborratAl))) return revisio;
  const editatRevisio = instantDe(revisio.editatAl);
  if (!Number.isFinite(editatRevisio)) return existent;
  const editatExistent = instantDe(existent.editatAl);
  return !Number.isFinite(editatExistent) || editatRevisio > editatExistent ? revisio : existent;
}

/* Els cursors declarats han de quadrar amb el contingut: mai es pot declarar
   una seq per damunt de l'última inclosa (una incremental posterior perdria
   missatges) ni una de davall del punt de partida. Consolidació R26 (GBK01 de
   Codex): cada fil amb missatges seqüenciats a la còpia té el seu cursor al
   mapa (l'exportador sempre l'hi posa; sense ell, el fil desapareixeria de la
   cadena encara que se'n restauraren els missatges) i, sense tall de data,
   eixe cursor no queda per davall de cap missatge inclòs. */
function exigixCursorsCoherents(missatges, desDe, ultim, ambTallData) {
  const maxims = Object.create(null);
  for (const m of missatges) {
    if (!Number.isSafeInteger(m.seq)) continue;
    const des = Object.hasOwn(desDe, m.filId) ? desDe[m.filId] : 0;
    if (m.seq <= des) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-solapat', `Missatge anterior al cursor de partida (${m.id}).`);
    }
    maxims[m.filId] = Math.max(maxims[m.filId] ?? 0, m.seq);
  }
  for (const [fil, maxim] of Object.entries(maxims)) {
    if (!Object.hasOwn(ultim, fil) || (!ambTallData && ultim[fil] < maxim)) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-incoherent', `El mapa de cursors no conserva el fil ${fil}.`);
    }
  }
  const fils = new Set([...Object.keys(desDe), ...Object.keys(ultim)]);
  for (const fil of fils) {
    const des = desDe[fil] ?? 0;
    const fi = ultim[fil] ?? 0;
    if (fi < des || fi > Math.max(des, maxims[fil] ?? 0)) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-incoherent', `Cursor de fil incoherent amb el contingut (${fil}).`);
    }
  }
}

/* ── Dates ── Date.parse de V8 és indulgent («2026-02-31» passa a ser el 3 de
   març, una hora sense fus horari es llig en l'hora local de l'aparell) i no
   coincidix amb el de Safari. Ací l'instant es calcula a mà, igual a tots els
   motors: el dia ha d'existir al calendari i una hora ha de dur Z o el
   desplaçament (un dia sol és UTC, com a l'ECMAScript). */
const FORMA_DATA = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2})?))?$/;

function instantDe(valor) {
  if (typeof valor !== 'string') return NaN;
  const p = FORMA_DATA.exec(valor);
  if (!p) return NaN;
  const [any, mes, dia, hora, minut, segon] = [p[1], p[2], p[3], p[4] ?? 0, p[5] ?? 0, p[6] ?? 0].map(Number);
  const mil = p[7] ? Number(p[7].slice(0, 3).padEnd(3, '0')) : 0;
  if (mes < 1 || mes > 12 || dia < 1 || hora > 23 || minut > 59 || segon > 59) return NaN;
  const d = new Date(0);
  d.setUTCFullYear(any, mes - 1, dia);
  d.setUTCHours(hora, minut, segon, mil);
  if (d.getUTCFullYear() !== any || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return NaN;
  let desplacament = 0;
  if (p[8] && p[8] !== 'Z') {
    const xifres = p[8].slice(1).replace(':', '');
    const [hh, mm] = [Number(xifres.slice(0, 2)), Number(xifres.slice(2) || 0)];
    if (hh > 23 || mm > 59) return NaN;
    desplacament = (p[8][0] === '-' ? -1 : 1) * (hh * 60 + mm) * 60000;
  }
  return d.getTime() - desplacament;
}

/* Una data ISO UTC com les que escriu el motor (FORMA_ISO) i que existix. */
const esIsoUtcValida = (txt) => typeof txt === 'string' && FORMA_ISO.test(txt) && Number.isFinite(instantDe(txt));
/* La forma exacta de toISOString(): la dels cursors de data del manifest. */
const esIsoCanonica = (txt) => esIsoUtcValida(txt) && new Date(instantDe(txt)).toISOString() === txt;

/* L'instant d'un missatge: el DTO real porta `creatAl` (supabase/xat.js
   mapejaMissatge, localXat.js); `createdAt` s'hi admet com a àlies. Dos camps
   discordants es rebutgen sempre; amb tall de data, també una data absent o
   invàlida (falla tancat: mai s'inclou ni s'exclou un missatge a cegues). */
function tempsMissatge(m, ambTall) {
  const valors = [m.creatAl, m.createdAt].filter((v) => v !== undefined && v !== null && v !== '');
  const temps = valors.map(instantDe);
  const discordants = temps.length === 2 && Number.isFinite(temps[0]) && Number.isFinite(temps[1]) && temps[0] !== temps[1];
  if (discordants || (ambTall && (!temps.length || temps.some((t) => !Number.isFinite(t)) || temps.some((t) => t !== temps[0])))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'missatge-data', `Data del missatge absent, invàlida o contradictòria (${m.id}).`);
  }
  return temps.length ? temps[0] : NaN;
}

function normalitzaDataTall(valor, nom, finalDelDia) {
  if (valor === null || valor === undefined || valor === '' || valor === false) return null;
  let iso;
  if (valor instanceof Date) {
    iso = Number.isNaN(valor.getTime()) ? null : valor.toISOString();
  } else {
    // Una hora sense fus horari no passa: FORMA_DATA l'exigix (instantDe → NaN).
    const txt = typeof valor === 'string' ? valor.trim() : '';
    const ms = instantDe(txt);
    if (Number.isFinite(ms)) {
      iso = /^\d{4}-\d{2}-\d{2}$/.test(txt) ? `${txt}T${finalDelDia ? '23:59:59.999' : '00:00:00.000'}Z` : new Date(ms).toISOString();
    }
  }
  // La mateixa forma que acceptarà la importació (cap any de sis xifres).
  if (!iso || !esIsoCanonica(iso)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'data', `Data ${nom} invàlida: ${String(valor)}`);
  return iso;
}

const normalitzaIsoTallFinalDia = (finsAlDia) => normalitzaDataTall(finsAlDia, 'finsAlDia', true);
const normalitzaIsoInici = (desDeData) => normalitzaDataTall(desDeData, 'desDeData', false);

function exigixIteracions(iteracions) {
  if (!Number.isSafeInteger(iteracions) || iteracions < ITERACIONS_PBKDF2_MINIMES || iteracions > ITERACIONS_PBKDF2_MAXIMES) {
    throw creaErrorTipificat(
      CODI_CLAU_FEBLE,
      'kdf-fora-de-rang',
      `PBKDF2-HMAC-SHA256 requerix entre ${ITERACIONS_PBKDF2_MINIMES} i ${ITERACIONS_PBKDF2_MAXIMES} iteracions.`,
    );
  }
  return iteracions;
}

const bytesContrasenya = (contrasenya) => codifica(contrasenya.normalize('NFC'));

/* AAD: tota la capçalera menys l'IV (GCM ja l'autentica). */
function aadDe(esquema, versio, capcalera) {
  const cap = { ...capcalera };
  if (cap.aead) cap.aead = { algoritme: cap.aead.algoritme, etiquetaBits: cap.aead.etiquetaBits };
  return codifica(canonic({ esquema, versio, capcalera: cap }));
}

function nonceDe(capcalera) {
  return capcalera.proteccio === 'xifrada' ? `${capcalera.kdf.sal}.${capcalera.aead.iv}` : null;
}

/* Registre de (sal, IV) d'esta instància: si el generador repetira, la
   segona còpia no ix mai (GCM amb nonce repetit filtra text i clau d'autenticació). */
const noncesExportats = new Set();

function registraNonceExportat(sal, iv) {
  if (sal.every((b) => b === 0) || iv.every((b) => b === 0)) {
    throw creaErrorTipificat(CODI_NONCE_REPETIT, 'generador-degenerat', 'El generador d’atzar ha tornat zeros: no es xifra cap còpia.');
  }
  const clau = `${aBase64url(sal)}.${aBase64url(iv)}`;
  if (noncesExportats.has(clau)) {
    throw creaErrorTipificat(CODI_NONCE_REPETIT, 'nonce-repetit', 'Sal i IV repetits: el generador d’atzar no és fiable, no es xifra cap còpia.');
  }
  noncesExportats.add(clau);
  if (noncesExportats.size > MAX_REGISTRE_NONCES_EXPORT) noncesExportats.delete(noncesExportats.values().next().value);
}

/* ── Exportació ────────────────────────────────────────────────────────── */

function preparaBase(base, uid, tid) {
  if (base === null || base === undefined) return null;
  if (!esObjectePla(base)) throw creaErrorTipificat(CODI_BASE_ABSENT, 'base', 'La base de la incremental ha de ser el rebut d’una còpia anterior.');
  const backupId = exigixIdCopia(base.backupId, 'base-id');
  if (typeof base.empremta !== 'string' || !FORMA_HEX_SHA256.test(base.empremta)) {
    throw creaErrorTipificat(CODI_BASE_ABSENT, 'base', 'La base no porta l’empremta SHA-256 de la seua còpia.');
  }
  if (base.mode === 'parcial' || !MODES_COPIA.has(base.mode)) {
    throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'base-parcial', 'Una còpia parcial no pot ser la base d’una incremental.');
  }
  if ((base.usuariId !== undefined && base.usuariId !== uid) || (base.tenantId !== undefined && base.tenantId !== tid)) {
    throw creaErrorTipificat(CODI_IDENTITAT_DIVERGENT, 'base-ambit', 'La base pertany a un altre compte o poble.');
  }
  return { backupId, empremta: base.empremta, ultimSeqPerFil: exigixMapaCursors(base.ultimSeqPerFil, 'base-cursors') };
}

function preparaClauProcedencia(estatClaus) {
  if (estatClaus === null || estatClaus === undefined) return null;
  exigixRegistreNet(estatClaus, 'estatClaus');
  if (!esObjectePla(estatClaus) || clausOrdenades(estatClaus) !== 'comptador,kid') {
    throw creaErrorTipificat(CODI_MATERIAL_SENSIBLE, 'estat-claus', 'De l’estat de claus només viatgen el kid públic i el comptador.');
  }
  b64urlABytes(estatClaus.kid, 16, 'kid');
  if (!esCursor(estatClaus.comptador)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'comptador', 'Comptador de llibreta invàlid.');
  return { kid: estatClaus.kid, comptador: estatClaus.comptador };
}

/**
 * Onada R28 · copia-xat-04 · Cert si `cripto` té el WebCrypto que este motor
 * exigix (exigixCripto) per a exportar, descriure i importar. Fora d'un
 * context segur no hi és, i reintentar no ho arregla: la interfície ho pot dir
 * abans de demanar res. Viu ací perquè exigixCripto només entre al paquet amb
 * el motor (el trinquet de index.e2eeApagat.produccio.test.js).
 */
export function teCriptoPerALaCopia(cripto = globalThis.crypto) {
  try {
    exigixCripto(cripto);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exporta fils, missatges i adjunts a un `.sdpbackup` v2 i torna també el
 * rebut que farà de `base` de la incremental següent.
 * @returns {Promise<{ text: string, rebut: object }>}
 */
export async function exportaCopiaSeguretatXatAmbRebut({
  usuariId,
  tenantId,
  fils = [],
  missatges = [],
  adjunts = [],
  contrasenya = '',
  finsAlDia = null,
  desDeSeq = null,
  desDeSeqPerFil = null,
  desDeData = null,
  base = null,
  estatClaus = null,
  iteracions = ITERACIONS_PBKDF2_MINIMES,
  permetSenseXifrar = false,
  araIso = new Date().toISOString(),
  cripto = globalThis.crypto,
} = {}) {
  exigixCripto(cripto);
  const uid = exigixAmbit(usuariId, 'usuariId');
  const tid = exigixAmbit(tenantId, 'tenantId');
  if (!esIsoUtcValida(araIso)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'data', 'Data de creació invàlida.');
  }

  const xifratActiu = permetSenseXifrar !== true || Boolean(contrasenya);
  if (xifratActiu) {
    if (typeof contrasenya !== 'string' || contrasenya.normalize('NFC').trim().length < MIN_CARACTERS_CONTRASENYA) {
      throw creaErrorTipificat(CODI_CLAU_FEBLE, 'contrasenya-curta', `La clau de còpia ha de tindre com a mínim ${MIN_CARACTERS_CONTRASENYA} caràcters.`);
    }
    exigixIteracions(iteracions);
  }

  // Cursors: la seq del servidor és de cada fil (índex únic (fil_id, seq)), mai global.
  const baseNeta = preparaBase(base, uid, tid);
  const clau = preparaClauProcedencia(estatClaus);
  const teDesDeSeq = desDeSeq !== null && desDeSeq !== undefined;
  const tePerFil = desDeSeqPerFil !== null && desDeSeqPerFil !== undefined;
  if (teDesDeSeq && (tePerFil || !esCursor(desDeSeq))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'cursor-invalid', 'Cursor de seq invàlid o ambigu.');
  }
  if (baseNeta && (teDesDeSeq || desDeData)) {
    throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-ambigu', 'Una incremental parteix dels cursors de la base: sense desDeSeq ni desDeData.');
  }
  let cursorsInicials = Object.create(null);
  if (baseNeta) {
    cursorsInicials = { ...baseNeta.ultimSeqPerFil };
    if (tePerFil && canonic(mapaPla(exigixMapaCursors(desDeSeqPerFil, 'cursor-invalid'))) !== canonic(mapaPla(cursorsInicials))) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-base', 'Els cursors indicats no són els de la base.');
    }
  } else if (tePerFil) {
    cursorsInicials = exigixMapaCursors(desDeSeqPerFil, 'cursor-invalid');
  }

  exigixRecomptes(Array.isArray(fils) ? fils : [], Array.isArray(missatges) ? missatges : [], Array.isArray(adjunts) ? adjunts : []);
  const filsEntrada = (Array.isArray(fils) ? fils : []).map((f, i) => normalitzaRegistre(f, 'fil', `fils[${i}]`));
  const missatgesEntrada = (Array.isArray(missatges) ? missatges : []).map((m, i) => normalitzaRegistre(m, 'missatge', `missatges[${i}]`));
  filsEntrada.forEach((f) => exigixId(f.id, 'fil-id'));
  const idsFilsEntrada = exigixUnics(filsEntrada, 'fil-duplicat');
  exigixUnics(missatgesEntrada, 'missatge-duplicat');

  if (teDesDeSeq) {
    const idsFils = new Set([...idsFilsEntrada, ...missatgesEntrada.map((m) => m.filId)]);
    if (idsFils.size > 1) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'cursor-ambigu', 'desDeSeq global no és segur amb diversos fils; utilitza desDeSeqPerFil.');
    }
    for (const fil of idsFils) cursorsInicials[fil] = desDeSeq;
  }
  const teTallSeq = Boolean(baseNeta) || teDesDeSeq || tePerFil;
  const isoFins = normalitzaIsoTallFinalDia(finsAlDia);
  const isoDesDe = normalitzaIsoInici(desDeData);
  const tallFinsMs = isoFins ? instantDe(isoFins) : null;
  const tallDesDeMs = isoDesDe ? instantDe(isoDesDe) : null;
  const teTallData = tallFinsMs !== null || tallDesDeMs !== null;

  /* Un tall (de seq o de data) es mesura contra la seq: cap missatge sense seq
     vàlida hi passa (garantia de Codex R26). Cap seq repetida dins d'un fil. */
  const guardaSeq = creaGuardaSeq();
  const primerExclosPerData = Object.create(null);
  const missatgesFiltrats = [];
  const revisionsFiltrades = [];
  for (const m of missatgesEntrada) {
    exigixMissatge(m, idsFilsEntrada, teTallSeq || teTallData);
    guardaSeq(m);
    const tMs = tempsMissatge(m, teTallData);
    const des = Object.hasOwn(cursorsInicials, m.filId) ? cursorsInicials[m.filId] : 0;
    if (teTallSeq && m.seq <= des) {
      // Ja és a la cadena de la base: només hi torna la seua làpida o edició.
      if (baseNeta && esRevisio(m)) {
        exigixDatesRevisio(m);
        revisionsFiltrades.push(m);
      }
      continue;
    }
    if ((tallFinsMs !== null && tMs > tallFinsMs) || (tallDesDeMs !== null && tMs <= tallDesDeMs)) {
      // El cursor no pot passar el primer missatge que un tall de data deixa fora.
      if (Number.isSafeInteger(m.seq)) primerExclosPerData[m.filId] = Math.min(primerExclosPerData[m.filId] ?? Infinity, m.seq);
      continue;
    }
    missatgesFiltrats.push(m);
  }
  const perId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  missatgesFiltrats.sort(perId);
  revisionsFiltrades.sort(perId);

  const idsMissatgesActius = new Set(missatgesFiltrats.map((m) => m.id));
  const idsFilsActius = new Set(missatgesFiltrats.map((m) => m.filId));
  const mode = baseNeta ? 'incremental' : (teTallSeq || tallDesDeMs !== null ? 'parcial' : 'complet');
  /* Onada R29 · R29-E2EE-03 · Una parcial amb cursors per fil conserva també el fil que porta cursor
     declarat i cap missatge nou (la conversa de la vista sense cap missatge carregat): el seu cursor ja
     viatja a ultimSeqPerFil i el fil és dins de l'abast que la còpia declara. */
  const ambCursorDeclarat = (f) => mode === 'parcial' && tePerFil && Object.hasOwn(cursorsInicials, f.id);
  const filsFiltrats = filsEntrada
    .filter((f) => mode === 'complet' || idsFilsActius.has(f.id) || ambCursorDeclarat(f))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const adjuntsAmbHash = [];
  for (const adj of Array.isArray(adjunts) ? adjunts : []) {
    if (!esObjectePla(adj)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'adjunt-forma', 'Adjunt invàlid.');
    exigixId(adj.id, 'adjunt-id');
    exigixId(adj.missatgeId, 'adjunt-missatge');
    if (!idsMissatgesActius.has(adj.missatgeId)) continue;
    // Les dades van dins de la còpia: cap adjunt buit ni cap URL a recuperar després.
    const dades = base64ABytes(adj.dadesBase64, 'adjunt-base64');
    const registre = {
      id: adj.id,
      missatgeId: adj.missatgeId,
      mime: String(adj.mime || MIME_XIFRAT),
      nom: sanejaNomAdjunt(adj.nom, adj.id),
      bytes: dades.length,
      sha256: await sha256Hex(cripto, dades),
      dadesBase64: adj.dadesBase64,
    };
    await verificaAdjunt(cripto, registre, idsMissatgesActius);
    adjuntsAmbHash.push(registre);
  }
  adjuntsAmbHash.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  exigixUnics(adjuntsAmbHash, 'adjunt-duplicat');

  const ultimSeqPerFil = Object.assign(Object.create(null), cursorsInicials);
  for (const m of missatgesFiltrats) {
    if (!Number.isSafeInteger(m.seq)) continue;
    ultimSeqPerFil[m.filId] = Math.max(ultimSeqPerFil[m.filId] ?? 0, m.seq);
  }
  for (const [fil, primer] of Object.entries(primerExclosPerData)) {
    const sostre = Math.max(cursorsInicials[fil] ?? 0, primer - 1);
    if ((ultimSeqPerFil[fil] ?? 0) > sostre) ultimSeqPerFil[fil] = sostre;
  }

  const backupId = aBase64url(aleatori(cripto, 16));
  const manifest = {
    backupId,
    cursors: {
      finsAlDia: isoFins,
      desDeData: isoDesDe,
      desDeSeqPerFil: mapaPla(cursorsInicials),
      ultimSeqPerFil: mapaPla(ultimSeqPerFil),
    },
    lots: {
      fils: { total: filsFiltrats.length, sha256: await sha256Hex(cripto, codifica(canonic(filsFiltrats))) },
      missatges: { total: missatgesFiltrats.length, sha256: await sha256Hex(cripto, codifica(canonic(missatgesFiltrats))) },
      revisions: { total: revisionsFiltrades.length, sha256: await sha256Hex(cripto, codifica(canonic(revisionsFiltrades))) },
      adjunts: { total: adjuntsAmbHash.length, sha256: await sha256Hex(cripto, codifica(canonic(adjuntsAmbHash))) },
    },
    clau,
  };
  const paquetIntern = {
    manifest,
    dades: { fils: filsFiltrats, missatges: missatgesFiltrats, revisions: revisionsFiltrades, adjunts: adjuntsAmbHash },
  };
  const capcaleraComuna = {
    backupId,
    baseId: baseNeta ? baseNeta.backupId : null,
    baseEmpremta: baseNeta ? baseNeta.empremta : null,
    mode,
    usuariId: uid,
    tenantId: tid,
    creatAt: araIso,
  };

  let sobre;
  let empremta;
  if (!xifratActiu) {
    const capcalera = { ...capcaleraComuna, proteccio: 'cap' };
    sobre = { esquema: ESQUEMA_SDP_BACKUP, versio: VERSIO_SDP_BACKUP, capcalera, pla: paquetIntern };
    empremta = await sha256Hex(cripto, concatena(aadDe(sobre.esquema, sobre.versio, capcalera), Uint8Array.of(0), codifica(canonic(paquetIntern))));
  } else {
    const sal = aleatori(cripto, 16);
    const capcaleraSenseIv = {
      ...capcaleraComuna,
      proteccio: 'xifrada',
      kdf: { algoritme: ALGORITME_KDF, iteracions, sal: aBase64url(sal) },
      aead: { algoritme: ALGORITME_AEAD, etiquetaBits: 128 },
    };
    const aad = aadDe(ESQUEMA_SDP_BACKUP, VERSIO_SDP_BACKUP, capcaleraSenseIv);
    const clauAes = await kekPbkdf2(cripto, bytesContrasenya(contrasenya), sal, { iteracions, usos: ['encrypt'] });
    const { iv, xifrat } = await xifraAesGcm(cripto, clauAes, { dades: codifica(JSON.stringify(paquetIntern)), aad });
    registraNonceExportat(sal, iv);
    const capcalera = { ...capcaleraSenseIv, aead: { ...capcaleraSenseIv.aead, iv: aBase64url(iv) } };
    sobre = { esquema: ESQUEMA_SDP_BACKUP, versio: VERSIO_SDP_BACKUP, capcalera, xifrat: aBase64urlGran(xifrat) };
    empremta = await sha256Hex(cripto, concatena(aad, Uint8Array.of(0), xifrat));
  }

  const text = JSON.stringify(sobre);
  if (midaUtf8(text) > MAX_BYTES_ARXIU_BACKUP) {
    throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran', 'La còpia supera els 64 MiB: feu-la incremental o amb tall de data.');
  }
  const rebut = Object.freeze({
    backupId,
    empremta,
    mode,
    baseId: capcaleraComuna.baseId,
    baseEmpremta: capcaleraComuna.baseEmpremta,
    usuariId: uid,
    tenantId: tid,
    nonce: nonceDe(sobre.capcalera),
    ultimSeqPerFil: Object.freeze(mapaPla(ultimSeqPerFil)),
  });
  return { text, rebut };
}

/** El fitxer `.sdpbackup` (text JSON). Vegeu exportaCopiaSeguretatXatAmbRebut. */
export async function exportaCopiaSeguretatXat(opcions = {}) {
  return (await exportaCopiaSeguretatXatAmbRebut(opcions)).text;
}

/* ── Lectura i validació del sobre ─────────────────────────────────────── */

function llegixText(entrada) {
  if (typeof entrada === 'string') {
    if (!entrada || midaUtf8(entrada) > MAX_BYTES_ARXIU_BACKUP) {
      throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran', 'Arxiu .sdpbackup buit o per damunt del límit de seguretat.');
    }
    return entrada;
  }
  if (entrada instanceof ArrayBuffer || ArrayBuffer.isView(entrada)) {
    const bytes = entrada instanceof ArrayBuffer ? new Uint8Array(entrada) : new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength);
    if (!bytes.length || bytes.length > MAX_BYTES_ARXIU_BACKUP) {
      throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran', 'Arxiu .sdpbackup buit o per damunt del límit de seguretat.');
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'utf8', 'Arxiu .sdpbackup amb UTF-8 invàlid.');
    }
  }
  throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'entrada', 'Arxiu .sdpbackup absent.');
}

function analitzaSobre(entrada) {
  const text = llegixText(entrada);
  exigixProfunditatJson(text, MAX_PROFUNDITAT_JSON);
  let sobre;
  try {
    sobre = JSON.parse(text);
  } catch {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'json', 'Arxiu .sdpbackup truncat o amb JSON malformat.');
  }
  if (!esObjectePla(sobre)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'esquema', 'Esquema de .sdpbackup desconegut.');
  if (sobre.esquema !== ESQUEMA_SDP_BACKUP || sobre.versio !== VERSIO_SDP_BACKUP) {
    const antic = typeof sobre.esquema === 'string' && /^sdp\.xat\.backup\.v\d+$/.test(sobre.esquema)
      && Number.isSafeInteger(sobre.versio) && sobre.versio < VERSIO_SDP_BACKUP;
    throw creaErrorTipificat(
      antic ? CODI_DEGRADACIO : CODI_COPIA_CORRUPTA,
      antic ? 'versio-antiga' : 'esquema',
      antic ? 'Versió antiga de .sdpbackup: no s’accepta cap degradació del format.' : 'Esquema o versió de .sdpbackup desconegut.',
    );
  }
  const cap = sobre.capcalera;
  if (!esObjectePla(cap)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'capcalera', 'Capçalera de .sdpbackup absent.');
  const clausSobre = clausOrdenades(sobre);
  if (cap.proteccio === 'xifrada') {
    if (clausSobre !== 'capcalera,esquema,versio,xifrat' || clausOrdenades(cap) !== CLAUS_CAPCALERA_XIFRADA
      || !esObjectePla(cap.kdf) || clausOrdenades(cap.kdf) !== 'algoritme,iteracions,sal'
      || !esObjectePla(cap.aead) || clausOrdenades(cap.aead) !== 'algoritme,etiquetaBits,iv') {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'capcalera', 'Capçalera xifrada amb camps inesperats.');
    }
    if (cap.kdf.algoritme !== ALGORITME_KDF || cap.aead.algoritme !== ALGORITME_AEAD || cap.aead.etiquetaBits !== 128) {
      throw creaErrorTipificat(CODI_DEGRADACIO, 'algoritme', 'Algoritme de xifrat o de derivació no admés.');
    }
  } else if (cap.proteccio === 'cap') {
    if (clausSobre !== 'capcalera,esquema,pla,versio' || clausOrdenades(cap) !== CLAUS_CAPCALERA_PLA) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'capcalera', 'Capçalera sense xifrar amb camps inesperats.');
    }
  } else {
    throw creaErrorTipificat(CODI_DEGRADACIO, 'proteccio', 'Protecció de .sdpbackup desconeguda.');
  }
  exigixIdCopia(cap.backupId, 'backup-id');
  if (!MODES_COPIA.has(cap.mode)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'mode', 'Mode de còpia desconegut.');
  if (cap.mode === 'incremental') {
    exigixIdCopia(cap.baseId, 'base-id');
    if (typeof cap.baseEmpremta !== 'string' || !FORMA_HEX_SHA256.test(cap.baseEmpremta)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'base-empremta', 'Incremental sense empremta de la base.');
    }
  } else if (cap.baseId !== null || cap.baseEmpremta !== null) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'base-id', 'Només una incremental té base.');
  }
  exigixAmbit(cap.usuariId, 'usuariId', CODI_COPIA_CORRUPTA);
  exigixAmbit(cap.tenantId, 'tenantId', CODI_COPIA_CORRUPTA);
  if (!esIsoUtcValida(cap.creatAt)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'data', 'Data de creació invàlida a la capçalera.');
  }
  return sobre;
}

/**
 * La capçalera i l'empremta d'un `.sdpbackup` sense desxifrar res (per a
 * mostrar «còpia del dia X» o detectar una reimportació). No autentica: qui
 * vol saber si és bona l'ha d'importar.
 */
export async function descriuCopiaSeguretatXat(entrada, { cripto = globalThis.crypto } = {}) {
  exigixCripto(cripto);
  const sobre = analitzaSobre(entrada);
  const cap = sobre.capcalera;
  const aad = aadDe(sobre.esquema, sobre.versio, cap);
  const cos = cap.proteccio === 'xifrada' ? b64urlGranABytes(sobre.xifrat, 'xifrat') : codifica(canonic(sobre.pla));
  return {
    backupId: cap.backupId,
    baseId: cap.baseId,
    mode: cap.mode,
    usuariId: cap.usuariId,
    tenantId: cap.tenantId,
    creatAt: cap.creatAt,
    xifrada: cap.proteccio === 'xifrada',
    empremta: await sha256Hex(cripto, concatena(aad, Uint8Array.of(0), cos)),
  };
}

/* ── Importació ────────────────────────────────────────────────────────── */

function entradaRegistre(copies, id) {
  if (!copies) return null;
  if (copies instanceof Map) return copies.get(id) ?? null;
  return Object.hasOwn(copies, id) ? copies[id] : null;
}

function* entradesRegistre(copies) {
  if (!copies) return;
  if (copies instanceof Map) yield* copies.values();
  else yield* Object.values(copies);
}

function exigixEstatLocal(estatLocal) {
  if (estatLocal === null || estatLocal === undefined) return { copies: null, clau: null };
  if (!esObjectePla(estatLocal)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'estat-local', 'Estat local de restauració invàlid.');
  const { copies = null, clau = null } = estatLocal;
  if (copies !== null && !(copies instanceof Map) && !esObjectePla(copies)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'estat-local', 'El registre de còpies ha de ser un Map o un objecte.');
  }
  if (clau !== null && (!esObjectePla(clau) || (clau.kidsRetirats !== undefined && !Array.isArray(clau.kidsRetirats)))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'estat-local', 'Estat de claus local invàlid.');
  }
  return { copies, clau };
}

function estatProcedenciaClau(clauCopia, clauLocal) {
  if (!clauCopia) return 'sense-procedencia';
  if (!clauLocal) return 'desconeguda';
  if (Array.isArray(clauLocal.kidsRetirats) && clauLocal.kidsRetirats.includes(clauCopia.kid)) return 'retirada';
  if (clauLocal.kidActiu !== clauCopia.kid) return 'divergent';
  if (esCursor(clauLocal.comptador) && clauCopia.comptador < clauLocal.comptador) return 'antiga';
  return 'vigent';
}

function exigixMagatzem(magatzem) {
  if (magatzem === null || magatzem === undefined) return null;
  if (typeof magatzem !== 'object' || typeof magatzem.obriTransaccio !== 'function') {
    throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, 'magatzem', 'El magatzem ha d’oferir obriTransaccio() per a un commit atòmic.');
  }
  return magatzem;
}

/* Escriu totes les operacions dins d'una transacció i només confirma si cap
   no falla; qualsevol error (també en l'últim adjunt) l'avorta. */
async function aplicaAtomicament(magatzem, operacions, senyal) {
  const tx = await magatzem.obriTransaccio();
  if (!tx || typeof tx.escriu !== 'function' || typeof tx.confirma !== 'function' || typeof tx.avorta !== 'function') {
    throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, 'magatzem', 'La transacció ha d’oferir escriu, confirma i avorta.');
  }
  try {
    for (const op of operacions) {
      exigixNoAvortat(senyal);
      await tx.escriu(op);
    }
    exigixNoAvortat(senyal);
    await tx.confirma();
  } catch (causa) {
    try {
      await tx.avorta();
    } catch {
      // L'error original és el que compta: la transacció no s'ha confirmat.
    }
    throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, causa?.motiu === 'avortat' ? 'avortat' : 'escriptura',
      'La restauració s’ha avortat sencera: no s’ha confirmat cap escriptura.', { cause: causa });
  }
}

/**
 * Valida i desxifra una còpia `.sdpbackup` en memòria abans de tocar cap
 * estat local i, només si tot quadra, l'aplica atòmicament.
 *
 * @param {string|Uint8Array|ArrayBuffer} textSdpBackup
 * @param {object} opcions
 *   usuariIdEsperat, tenantIdEsperat: l'àmbit de la sessió activa.
 *   contrasenya: la clau de la còpia (NFC).
 *   permetSenseXifrar: només proves; mai amb contrasenya (degradació).
 *   estatLocal: { copies: Map|{ [backupId]: rebut }, clau: { kidActiu, kidsRetirats, comptador } }.
 *   magatzem: { obriTransaccio() → { escriu(op), confirma(), avorta() } } (recomanat).
 *   aplicaImportacio: compatibilitat; rep el lot validat una sola vegada.
 *   senyal: AbortSignal per a cancel·lar abans del commit.
 */
export async function importaCopiaSeguretatXat(textSdpBackup, {
  usuariIdEsperat,
  tenantIdEsperat,
  contrasenya = '',
  permetSenseXifrar = false,
  estatLocal = null,
  magatzem = null,
  aplicaImportacio = null,
  senyal = null,
  cripto = globalThis.crypto,
} = {}) {
  exigixCripto(cripto);
  const uidEsperat = exigixAmbit(usuariIdEsperat, 'usuariIdEsperat');
  const tidEsperat = exigixAmbit(tenantIdEsperat, 'tenantIdEsperat');
  const magatzemNet = exigixMagatzem(magatzem);
  if (magatzemNet && typeof aplicaImportacio === 'function') {
    throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, 'magatzem', 'Indiqueu magatzem o aplicaImportacio, no tots dos.');
  }
  const local = exigixEstatLocal(estatLocal);
  exigixNoAvortat(senyal);

  const sobre = analitzaSobre(textSdpBackup);
  const cap = sobre.capcalera;
  if (cap.usuariId !== uidEsperat || cap.tenantId !== tidEsperat) {
    throw creaErrorTipificat(CODI_IDENTITAT_DIVERGENT, 'ambit', 'La còpia pertany a un altre compte o poble i no coincidix amb la sessió activa.');
  }
  const aad = aadDe(sobre.esquema, sobre.versio, cap);

  let paquetIntern;
  let cos;
  if (cap.proteccio === 'cap') {
    if (contrasenya) {
      throw creaErrorTipificat(CODI_DEGRADACIO, 'sense-xifrar', 'S’esperava una còpia xifrada i l’arxiu ve sense xifrar: es rebutja.');
    }
    if (permetSenseXifrar !== true) {
      throw creaErrorTipificat(CODI_CLAU_FEBLE, 'sense-xifrar', 'No s’admeten còpies sense xifrar si permetSenseXifrar no està actiu.');
    }
    paquetIntern = sobre.pla; // la profunditat ja s'ha comprovat sobre el text sencer
    cos = codifica(canonic(paquetIntern));
  } else {
    const iteracions = exigixIteracions(cap.kdf.iteracions); // abans de derivar res
    const sal = b64urlABytes(cap.kdf.sal, 16, 'sal');
    const iv = b64urlABytes(cap.aead.iv, 12, 'iv');
    cos = b64urlGranABytes(sobre.xifrat, 'xifrat');
    if (cos.length < 17) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'xifrat', 'Xifrat truncat a .sdpbackup.');
    if (typeof contrasenya !== 'string' || !contrasenya) {
      throw creaErrorTipificat(CODI_CLAU_INCORRECTA, 'contrasenya-absent', 'Cal la clau secreta per a desxifrar la còpia .sdpbackup.');
    }
    exigixNoAvortat(senyal);
    const clauAes = await kekPbkdf2(cripto, bytesContrasenya(contrasenya), sal, { iteracions, usos: ['decrypt'] });
    let desxifrat;
    try {
      desxifrat = await desxifraAesGcm(cripto, clauAes, { xifrat: cos, aad, iv });
    } catch {
      throw creaErrorTipificat(CODI_CLAU_INCORRECTA, 'aead', 'No s’ha pogut autenticar o desxifrar .sdpbackup: clau incorrecta o fitxer manipulat.');
    }
    let textIntern;
    try {
      textIntern = new TextDecoder('utf-8', { fatal: true }).decode(desxifrat);
      exigixProfunditatJson(textIntern, MAX_PROFUNDITAT_JSON);
      paquetIntern = JSON.parse(textIntern);
    } catch (err) {
      if (err?.codi) throw err;
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'json-intern', 'Contingut intern de .sdpbackup malformat.');
    }
  }
  exigixNoAvortat(senyal);
  const empremta = await sha256Hex(cripto, concatena(aad, Uint8Array.of(0), cos));

  // ── Manifest i dades: esquema tancat ──
  if (!esObjectePla(paquetIntern) || clausOrdenades(paquetIntern) !== 'dades,manifest') {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'manifest', 'Falta el manifest intern d’integritat.');
  }
  const mf = paquetIntern.manifest;
  const dades = paquetIntern.dades;
  if (!esObjectePla(mf) || clausOrdenades(mf) !== 'backupId,clau,cursors,lots' || mf.backupId !== cap.backupId) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'manifest', 'Manifest intern invàlid o d’una altra còpia.');
  }
  const LOTS = ['fils', 'missatges', 'revisions', 'adjunts'];
  if (!esObjectePla(dades) || clausOrdenades(dades) !== 'adjunts,fils,missatges,revisions'
    || LOTS.some((l) => !Array.isArray(dades[l]))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'lots', 'Lots de dades absents o invàlids al manifest.');
  }
  const { fils, missatges, revisions, adjunts } = dades;
  exigixRecomptes(fils, [...missatges, ...revisions], adjunts);
  const lots = mf.lots;
  if (!esObjectePla(lots) || clausOrdenades(lots) !== 'adjunts,fils,missatges,revisions'
    || LOTS.some((l) => !esObjectePla(lots[l]) || clausOrdenades(lots[l]) !== 'sha256,total')) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'manifest', 'Lots del manifest invàlids.');
  }
  if (LOTS.some((l) => dades[l].length !== lots[l].total)) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'recompte', 'Recompte d’elements truncat respecte al manifest signat.');
  }
  const cursors = mf.cursors;
  if (!esObjectePla(cursors) || clausOrdenades(cursors) !== 'desDeData,desDeSeqPerFil,finsAlDia,ultimSeqPerFil') {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'cursors', 'Cursors del manifest invàlids.');
  }
  const desDe = exigixMapaCursors(cursors.desDeSeqPerFil, 'cursors');
  const ultim = exigixMapaCursors(cursors.ultimSeqPerFil, 'cursors');
  // Instants reals en la forma exacta que escriu el motor (cap «2026-13-45»).
  if ([cursors.finsAlDia, cursors.desDeData].some((d) => d !== null && !esIsoCanonica(d))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'cursors', 'Dates dels cursors invàlides.');
  }
  if (mf.clau !== null) {
    if (!esObjectePla(mf.clau) || clausOrdenades(mf.clau) !== 'comptador,kid' || !esCursor(mf.clau.comptador)) {
      throw creaErrorTipificat(CODI_MATERIAL_SENSIBLE, 'estat-claus', 'De l’estat de claus només viatgen el kid públic i el comptador.');
    }
    b64urlABytes(mf.clau.kid, 16, 'kid');
  }

  // ── Registres: ids, referències, material sensible, adjunts ──
  fils.forEach((f, i) => {
    if (!esObjectePla(f)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'registre', `Fil invàlid (${i}).`);
    exigixRegistreDelModel(f, 'fil', `fils[${i}]`);
    exigixId(f.id, 'fil-id');
  });
  const idsFils = exigixUnics(fils, 'fil-duplicat');
  const ambSeq = cap.mode === 'incremental' || cursors.finsAlDia !== null || cursors.desDeData !== null;
  const guardaSeq = creaGuardaSeq();
  missatges.forEach((m, i) => {
    if (!esObjectePla(m)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'registre', `Missatge invàlid (${i}).`);
    exigixRegistreDelModel(m, 'missatge', `missatges[${i}]`);
    exigixMissatge(m, idsFils, ambSeq);
    tempsMissatge(m, false);
  });
  const idsMissatges = exigixUnics(missatges, 'missatge-duplicat');
  missatges.forEach(guardaSeq);
  // Revisions: només en una incremental, d'un missatge ja cobert per la base.
  if (revisions.length && cap.mode !== 'incremental') {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'revisio-fora-de-lloc', 'Només una incremental porta làpides o edicions.');
  }
  const idsRevisions = new Set();
  revisions.forEach((r, i) => {
    if (!esObjectePla(r)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'registre', `Revisió invàlida (${i}).`);
    exigixRegistreDelModel(r, 'missatge', `revisions[${i}]`);
    exigixId(r.id, 'missatge-id');
    exigixId(r.filId, 'missatge-fil');
    exigixSeqMissatge(r, true);
    if (idsRevisions.has(r.id) || idsMissatges.has(r.id)) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'revisio-duplicada', `Revisió repetida o d’un missatge nou (${r.id}).`);
    }
    idsRevisions.add(r.id);
    if (!Object.hasOwn(desDe, r.filId) || r.seq > desDe[r.filId]) {
      throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'revisio-fora-de-base', `Revisió d’un missatge que la base no cobrix (${r.id}).`);
    }
    if (!esRevisio(r)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'revisio-buida', `Revisió sense làpida ni edició (${r.id}).`);
    exigixDatesRevisio(r);
    tempsMissatge(r, false);
    guardaSeq(r);
  });
  exigixUnics(adjunts, 'adjunt-duplicat');
  let bytesAdjunts = 0;
  for (const adj of adjunts) {
    exigixNoAvortat(senyal);
    bytesAdjunts += await verificaAdjunt(cripto, adj, idsMissatges);
    if (bytesAdjunts > MAX_BYTES_ARXIU_BACKUP) {
      throw creaErrorTipificat(CODI_LIMIT_SUPERAT, 'bytes-adjunts', 'Els adjunts superen el límit total de la còpia.');
    }
  }
  const shas = await Promise.all(LOTS.map((l) => sha256Hex(cripto, codifica(canonic(dades[l])))));
  if (!LOTS.every((l, i) => comparacioTempsConstant(shas[i], lots[l].sha256))) {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'lot-sha256', 'Verificació SHA-256 fallida: la còpia ha sigut alterada.');
  }
  exigixCursorsCoherents(missatges, desDe, ultim, cursors.finsAlDia !== null || cursors.desDeData !== null);

  // ── Cadena: reimportació, mateixa id amb bytes distints, nonce, base i bifurcació ──
  const nonce = nonceDe(cap);
  const previa = entradaRegistre(local.copies, cap.backupId);
  let idempotent = false;
  if (previa) {
    if (previa.empremta !== empremta) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'mateixa-id-bytes-distints', 'Ja hi ha una còpia amb esta id i bytes distints: es rebutja.');
    }
    idempotent = true;
  } else {
    for (const e of entradesRegistre(local.copies)) {
      if (nonce && e?.nonce === nonce) {
        throw creaErrorTipificat(CODI_NONCE_REPETIT, 'nonce-repetit', 'Una altra còpia ja va usar esta sal i este IV: es rebutja.');
      }
    }
    if (cap.mode === 'incremental') {
      const base = entradaRegistre(local.copies, cap.baseId);
      if (!base) {
        throw creaErrorTipificat(CODI_BASE_ABSENT, 'base-absent', 'Falta importar abans la còpia base d’esta incremental.');
      }
      if (base.empremta !== cap.baseEmpremta || base.mode === 'parcial'
        || (base.usuariId !== undefined && base.usuariId !== uidEsperat) || (base.tenantId !== undefined && base.tenantId !== tidEsperat)) {
        throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'base-divergent', 'La base registrada no és la que autentica esta incremental.');
      }
      for (const e of entradesRegistre(local.copies)) {
        if (e?.baseId === cap.baseId && e.backupId !== cap.backupId) {
          throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'bifurcacio', 'Ja hi ha una altra incremental sobre la mateixa base (bifurcació).');
        }
      }
      if (canonic(mapaPla(exigixMapaCursors(base.ultimSeqPerFil ?? {}, 'base-cursors'))) !== canonic(mapaPla(desDe))) {
        throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-base', 'Els cursors de partida no són els de la base: hi hauria buits o duplicats.');
      }
    } else if (cap.mode === 'complet' && Object.keys(desDe).length) {
      throw creaErrorTipificat(CODI_CADENA_DIVERGENT, 'cursor-incoherent', 'Una còpia completa no parteix de cap cursor.');
    }
  }

  const rebut = Object.freeze({
    backupId: cap.backupId,
    empremta,
    mode: cap.mode,
    baseId: cap.baseId,
    baseEmpremta: cap.baseEmpremta,
    usuariId: cap.usuariId,
    tenantId: cap.tenantId,
    nonce,
    ultimSeqPerFil: Object.freeze(mapaPla(ultim)),
  });
  const claus = Object.freeze({
    kid: mf.clau?.kid ?? null,
    comptador: mf.clau?.comptador ?? null,
    estat: estatProcedenciaClau(mf.clau, local.clau),
    aplicaClaus: false, // mai: l'autoritat de claus i comptadors és el servidor
  });
  const operacions = idempotent ? [] : Object.freeze([
    ...fils.map((f) => Object.freeze({ tipus: 'fil', id: f.id, mode: 'insereix-si-absent', valor: f })),
    ...missatges.map((m) => Object.freeze({ tipus: 'missatge', id: m.id, mode: 'insereix-si-absent', valor: m })),
    // La làpida o l'edició d'un missatge de la base: el magatzem aplica fusionaRevisioMissatge.
    ...revisions.map((r) => Object.freeze({ tipus: 'missatge', id: r.id, mode: 'aplica-si-mes-nou', valor: r })),
    ...adjunts.map((a) => Object.freeze({ tipus: 'adjunt', id: a.id, mode: 'insereix-si-absent', valor: a })),
    Object.freeze({ tipus: 'registre_copia', id: cap.backupId, mode: 'insereix-si-absent', valor: rebut }),
  ]);
  const manifest = Object.freeze({
    esquema: sobre.esquema,
    versio: sobre.versio,
    backupId: cap.backupId,
    baseId: cap.baseId,
    mode: cap.mode,
    usuariId: cap.usuariId,
    tenantId: cap.tenantId,
    creatAt: cap.creatAt,
    cursors,
    lots,
    clau: mf.clau,
  });
  const resultat = { manifest, fils, missatges, revisions, adjunts, operacions, rebut, claus, idempotent, autenticada: cap.proteccio === 'xifrada' };

  // Tot validat en memòria: ara, i només ara, s'escriu, en una sola transacció.
  exigixNoAvortat(senyal);
  if (!idempotent) {
    if (magatzemNet) {
      await aplicaAtomicament(magatzemNet, operacions, senyal);
    } else if (typeof aplicaImportacio === 'function') {
      try {
        await aplicaImportacio({ manifest, fils, missatges, revisions, adjunts, operacions, rebut, claus });
      } catch (causa) {
        throw creaErrorTipificat(CODI_RESTAURACIO_AVORTADA, 'escriptura', 'La restauració ha fallat en aplicar el lot validat.', { cause: causa });
      }
    }
  }
  return resultat;
}

/* ── Arxiu: desar i llegir el `.sdpbackup` (Web, Files.app d'iOS, SAF d'Android) ──
   Port dels auxiliars del Kit R26 de Gemini (consolidació R26), sense
   Capacitor ni res de src/natiu/: només API web estàndard, injectades, i cap
   no s'executa en importar el mòdul. Tres esmenes sobre el kit: només ix de
   l'aparell una còpia xifrada v2 vàlida (mai el mode de proves sense xifrar ni
   un text qualsevol), cancel·lar el full o el selector no és un error, i
   l'ObjectURL es revoca després de la descàrrega i no en el mateix torn
   (Safari d'iOS la pot cancel·lar si es revoca de seguida). */

const errorArxiu = (motiu, missatge, causa) => creaErrorTipificat(CODI_ARXIU_NO_DESAT, motiu, missatge, causa ? { cause: causa } : null);

/**
 * Nom de fitxer de la còpia: `socdepoble-xat[-etiqueta][-mode]-AAAAMMDD-HHMM.sdpbackup`,
 * en UTC. `etiqueta` es reduïx a ASCII [a-z0-9-] (32 caràcters com a molt).
 */
export function nomArxiuCopiaSeguretatXat({ data = new Date(), mode = null, etiqueta = null } = {}) {
  const ms = data instanceof Date ? data.getTime() : instantDe(data);
  const iso = Number.isFinite(ms) ? new Date(ms).toISOString() : '';
  if (!esIsoCanonica(iso)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'data', 'Data del nom d’arxiu invàlida.');
  if (mode !== null && !MODES_COPIA.has(mode)) throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'mode', 'Mode de còpia desconegut.');
  const etiquetaNeta = etiqueta === null || etiqueta === undefined ? ''
    : String(etiqueta).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '').slice(0, 32).replace(/-+$/, '');
  const marca = `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
  return `${['socdepoble', 'xat', etiquetaNeta, mode, marca].filter(Boolean).join('-')}${EXTENSIO_SDP_BACKUP}`;
}

/* El nom que proposa qui crida: la mateixa regla que un nom d'adjunt (cap
   ruta, control, bidi ni forma no NFC) i sempre amb l'extensió `.sdpbackup`. */
function exigixNomArxiu(nom) {
  const ambExtensio = typeof nom === 'string' && !nom.toLowerCase().endsWith(EXTENSIO_SDP_BACKUP) ? `${nom}${EXTENSIO_SDP_BACKUP}` : nom;
  try {
    return exigixNomAdjunt(ambExtensio);
  } catch {
    throw errorArxiu('nom-arxiu', 'Nom d’arxiu insegur per a la còpia (ruta, control o forma no NFC).');
  }
}

const esError = (err, ...noms) => noms.includes(err?.name);

/**
 * Desa un `.sdpbackup` xifrat al dispositiu amb API web estàndard, per este ordre:
 *   1. Web Share de fitxers (si `prefereixCompartir`): el full de compartir
 *      d'iOS (Files.app, iCloud Drive, AirDrop) o d'Android;
 *   2. File System Access (`showSaveFilePicker`), on n'hi ha;
 *   3. descàrrega per enllaç `<a download>` (Descàrregues d'Android i d'escriptori).
 * Sense activació d'usuari vigent (NotAllowedError, SecurityError) passa al
 * mètode següent; cancel·lar el full o el selector torna `{ lliurat: false,
 * motiu: 'cancellat' }`. `lliurat: true` vol dir que el fitxer s'ha donat al
 * sistema (full, selector o descàrrega), no que la persona l'haja guardat.
 * Una còpia sense xifrar (mode de proves) o que no és un `.sdpbackup` v2 vàlid
 * no ix mai. Torna `{ metode, nomArxiu, lliurat, motiu? }`.
 */
export async function desaArxiuCopiaSeguretatXat(contingut, {
  nomArxiu = null,
  prefereixCompartir = false,
  finestra = globalThis.window,
  navegador = globalThis.navigator,
  documentDom = globalThis.document,
  urlApi = globalThis.URL,
  ConstructorFitxer = globalThis.File,
  ConstructorBlob = globalThis.Blob,
  temporitzador = globalThis.setTimeout,
} = {}) {
  const text = llegixText(contingut);
  const cap = analitzaSobre(text).capcalera;
  if (cap.proteccio !== 'xifrada') {
    throw creaErrorTipificat(CODI_CLAU_FEBLE, 'sense-xifrar', 'Una còpia sense xifrar no es desa mai fora de l’aparell.');
  }
  const nom = exigixNomArxiu(nomArxiu ?? nomArxiuCopiaSeguretatXat({ data: cap.creatAt, mode: cap.mode }));
  const tipus = { type: MIME_SDP_BACKUP };

  if (prefereixCompartir === true && typeof ConstructorFitxer === 'function'
    && typeof navegador?.share === 'function' && typeof navegador?.canShare === 'function') {
    const fitxer = new ConstructorFitxer([text], nom, tipus);
    let pot = false;
    try {
      pot = navegador.canShare({ files: [fitxer] }) === true;
    } catch {
      pot = false;
    }
    if (pot) {
      try {
        await navegador.share({ files: [fitxer], title: nom });
        return { metode: 'web-share', nomArxiu: nom, lliurat: true };
      } catch (err) {
        if (esError(err, 'AbortError')) return { metode: 'web-share', nomArxiu: nom, lliurat: false, motiu: 'cancellat' };
        if (!esError(err, 'NotAllowedError', 'SecurityError')) throw errorArxiu('web-share', 'No s’ha pogut compartir la còpia.', err);
      }
    }
  }

  if (typeof finestra?.showSaveFilePicker === 'function') {
    let manegador = null;
    try {
      manegador = await finestra.showSaveFilePicker({
        suggestedName: nom,
        types: [{ description: 'Còpia de seguretat del xat de Sóc de Poble', accept: { [MIME_SDP_BACKUP]: [EXTENSIO_SDP_BACKUP] } }],
      });
    } catch (err) {
      if (esError(err, 'AbortError')) return { metode: 'selector-fitxers', nomArxiu: nom, lliurat: false, motiu: 'cancellat' };
      if (!esError(err, 'NotAllowedError', 'SecurityError')) throw errorArxiu('selector-fitxers', 'No s’ha pogut obrir el selector de fitxers.', err);
    }
    if (manegador) {
      let escriptura = null;
      try {
        escriptura = await manegador.createWritable();
        await escriptura.write(text);
        await escriptura.close();
      } catch (err) {
        // Cap fitxer a mitges: abort() descarta el que s'haja escrit.
        try {
          await escriptura?.abort?.();
        } catch {
          // L'error que compta és el de l'escriptura.
        }
        throw errorArxiu('selector-fitxers', 'No s’ha pogut escriure la còpia al fitxer triat.', err);
      }
      return { metode: 'selector-fitxers', nomArxiu: nom, lliurat: true };
    }
  }

  if (typeof documentDom?.createElement !== 'function' || typeof urlApi?.createObjectURL !== 'function' || typeof ConstructorBlob !== 'function') {
    throw errorArxiu('sense-mecanisme', 'No hi ha cap mecanisme per a desar arxius en este entorn.');
  }
  const url = urlApi.createObjectURL(new ConstructorBlob([text], tipus));
  const revoca = () => {
    try {
      urlApi.revokeObjectURL?.(url);
    } catch {
      // Revocar és alliberar memòria: no fa fallar una descàrrega ja llançada.
    }
  };
  try {
    const ancora = documentDom.createElement('a');
    ancora.href = url;
    ancora.download = nom;
    ancora.rel = 'noopener';
    ancora.click();
  } catch (err) {
    revoca();
    throw errorArxiu('descarrega', 'No s’ha pogut llançar la descàrrega de la còpia.', err);
  }
  if (typeof temporitzador === 'function') temporitzador(revoca, ESPERA_REVOCACIO_URL_MS);
  else revoca();
  return { metode: 'descarrega', nomArxiu: nom, lliurat: true };
}

/**
 * Llig els bytes d'un File o Blob triat amb `<input type="file">`, el selector
 * de documents d'Android (SAF) o Files.app, amb el sostre de l'importador
 * (MAX_BYTES_ARXIU_BACKUP, o un de més baix) comprovat ABANS de llegir-lo.
 * Torna un Uint8Array per a importaCopiaSeguretatXat, que és qui el valida.
 */
export async function llegixArxiuCopiaSeguretatXat(fitxer, { maxBytes = MAX_BYTES_ARXIU_BACKUP } = {}) {
  if (!fitxer || typeof fitxer.arrayBuffer !== 'function') {
    throw creaErrorTipificat(CODI_COPIA_CORRUPTA, 'entrada', 'No s’ha triat cap arxiu .sdpbackup.');
  }
  const sostre = Number.isSafeInteger(maxBytes) && maxBytes > 0 ? Math.min(maxBytes, MAX_BYTES_ARXIU_BACKUP) : MAX_BYTES_ARXIU_BACKUP;
  const massaGran = () => creaErrorTipificat(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran', 'Arxiu .sdpbackup buit o per damunt del límit de seguretat.');
  if (typeof fitxer.size === 'number' && (fitxer.size < 1 || fitxer.size > sostre)) throw massaGran();
  const bytes = new Uint8Array(await fitxer.arrayBuffer());
  if (!bytes.length || bytes.length > sostre) throw massaGran();
  return bytes;
}

/* ── Traspàs QR / LAN ──────────────────────────────────────────────────── */

const consumsPerDefecte = new Map(); // sessioId → expiraAtMs

function registreConsum(sessionsConsumides, araMs) {
  if (sessionsConsumides !== null && sessionsConsumides !== undefined) {
    if (typeof sessionsConsumides.has !== 'function' || typeof sessionsConsumides.add !== 'function') {
      throw creaErrorTipificat(CODI_QR_INVALID, 'registre-consum', 'El registre de consum ha d’oferir has i add.');
    }
    return { has: (k) => sessionsConsumides.has(k), add: (k) => sessionsConsumides.add(k) };
  }
  // Per defecte, el de la instància: el consum únic no depén de qui crida.
  for (const [k, expira] of consumsPerDefecte) if (expira + MARGE_RELLOTGE_QR_MS < araMs) consumsPerDefecte.delete(k);
  return { has: (k) => consumsPerDefecte.has(k), add: (k, expira) => consumsPerDefecte.set(k, expira) };
}

function empremtaDtlsDe(sdp) {
  const valors = new Set();
  for (const coincidencia of sdp.matchAll(FORMA_EMPREMTA_DTLS)) valors.add(coincidencia[1].toUpperCase());
  if (valors.size !== 1) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'dtls', 'El SDP ha de portar una sola empremta DTLS sha-256.');
  }
  return [...valors][0];
}

function exigixSdp(sdp, nom) {
  if (typeof sdp !== 'string' || !sdp.trim() || codifica(sdp).length > MAX_BYTES_SDP) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'sdp', `Falta ${nom} o és massa gran.`);
  }
  return empremtaDtlsDe(sdp);
}

function exigixJwkEfimera(jwk) {
  try {
    return publicaDeJwk(jwk);
  } catch (err) {
    throw creaErrorTipificat(CODI_QR_INVALID, err?.codi === 'JWK_AMB_PRIVADA' ? 'jwk-privada' : 'jwk', 'La clau efímera ha de ser una JWK pública P-256 estricta.');
  }
}

const id128 = (cripto) => aBase64url(aleatori(cripto, 16));

function exigixId128(valor, motiu) {
  try {
    deBase64url(valor, 16);
  } catch {
    throw creaErrorTipificat(CODI_QR_INVALID, motiu, `Identificador de 128 bits invàlid (${motiu}).`);
  }
  return valor;
}

const campsOferta = (o) => ({
  esquema: o.esquema, versio: o.versio, tipus: o.tipus, sessioId: o.sessioId, nonce: o.nonce,
  modeDispositiu: o.modeDispositiu, usuariId: o.usuariId, tenantId: o.tenantId, creatAtMs: o.creatAtMs,
  expiraAtMs: o.expiraAtMs, sdpOffer: o.sdpOffer, clauPublicaEfimeraJwk: o.clauPublicaEfimeraJwk,
});

/* Els missatges QR són dades planes. Captura els camps i la JWK abans de
   qualsevol espera: una mutació del caller no pot canviar la transcripció
   validada, la sessió consumida ni la resposta. Cap accessor s’executa. */
function copiaObjecteQr(valor) {
  if (!esObjectePla(valor)) return valor;
  const descriptors = Object.getOwnPropertyDescriptors(valor);
  if (Object.getOwnPropertySymbols(valor).length || Object.values(descriptors).some(d => !Object.hasOwn(d, 'value') || !d.enumerable)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'esquema', 'El missatge QR ha de contindre només dades planes.');
  }
  return Object.fromEntries(Object.entries(descriptors).map(([clau, d]) => [clau, d.value]));
}

function instantaniaMissatgeQr(valor) {
  const copia = copiaObjecteQr(valor);
  if (esObjectePla(copia) && Object.hasOwn(copia, 'clauPublicaEfimeraJwk')) {
    copia.clauPublicaEfimeraJwk = copiaObjecteQr(copia.clauPublicaEfimeraJwk);
  }
  return copia;
}

/** Una parella ECDH P-256 efímera (privada no extraïble) i la seua JWK pública. */
export async function generaParellaEfimeraTraspas({ cripto = globalThis.crypto } = {}) {
  exigixCripto(cripto);
  const parella = await generaParellaDh(cripto);
  return { clauPrivada: parella.privateKey, clauPublicaJwk: jwkDePublica(await exportaPublica(cripto, parella.publicKey)) };
}

/**
 * L'oferta que mostra el QR (Mòbil Nou o Tauleta Espill de Casa): clau ECDH
 * efímera, nonce i sessió de 128 bits, caducitat entre 30 s i 5 min. No porta
 * cap SAS: el SAS naix dels dos extrems (derivaSasTraspasLocalQr).
 */
export async function creaOfertaTraspasLocalQr({
  modeDispositiu = 'traspas_mobil_nou',
  usuariId,
  tenantId,
  sdpOffer,
  clauPublicaEfimeraJwk,
  ttlMs = TTL_QR_MAX_MS,
  araMs = Date.now(),
  cripto = globalThis.crypto,
} = {}) {
  exigixCripto(cripto);
  if (!MODES_DISPOSITIU_QR.has(modeDispositiu)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'mode', `Mode d'emparellament desconegut: ${modeDispositiu}`);
  }
  const uid = exigixAmbit(usuariId, 'usuariId', CODI_QR_INVALID);
  const tid = exigixAmbit(tenantId, 'tenantId', CODI_QR_INVALID);
  exigixSdp(sdpOffer, 'l’oferta SDP');
  const publica = copiaObjecteQr(clauPublicaEfimeraJwk);
  exigixJwkEfimera(publica);
  if (!Number.isSafeInteger(araMs) || araMs < 0) throw creaErrorTipificat(CODI_QR_INVALID, 'rellotge', 'Rellotge invàlid.');
  const durada = Math.max(TTL_QR_MIN_MS, Math.min(TTL_QR_MAX_MS, Number.isSafeInteger(ttlMs) ? ttlMs : TTL_QR_MAX_MS));
  const oferta = {
    esquema: ESQUEMA_SDP_QR_P2P,
    versio: VERSIO_SDP_QR_P2P,
    tipus: 'oferta',
    sessioId: id128(cripto),
    nonce: id128(cripto),
    modeDispositiu,
    usuariId: uid,
    tenantId: tid,
    creatAtMs: araMs,
    expiraAtMs: araMs + durada,
    sdpOffer,
    clauPublicaEfimeraJwk: publica,
  };
  // Integritat de la transcripció del QR (no és autenticació: el SAS ho és).
  return { ...oferta, empremtaSha256: await sha256Hex(cripto, codifica(canonic(campsOferta(oferta)))) };
}

/* L'àmbit que porta un missatge del traspàs: no buit, sense controls i en la
   forma canònica que escriu creaOfertaTraspasLocalQr (sense espais sobrers).
   Una oferta forjada amb null o '' no casa mai, ni amb un esperat null o ''. */
function exigixAmbitQr(valor, nom) {
  const net = exigixAmbit(valor, nom, CODI_QR_INVALID);
  if (net !== valor) throw creaErrorTipificat(CODI_QR_INVALID, 'ambit', `${nom} del QR no és canònic.`);
  return net;
}

function analitzaOferta(ofertaCrua) {
  let oferta;
  try {
    oferta = typeof ofertaCrua === 'string' ? JSON.parse(ofertaCrua) : ofertaCrua;
  } catch {
    throw creaErrorTipificat(CODI_QR_INVALID, 'json', 'Codi QR malformat.');
  }
  oferta = instantaniaMissatgeQr(oferta);
  if (!esObjectePla(oferta) || oferta.esquema !== ESQUEMA_SDP_QR_P2P || oferta.versio !== VERSIO_SDP_QR_P2P
    || oferta.tipus !== 'oferta' || clausOrdenades(oferta) !== CLAUS_OFERTA) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'esquema', 'Codi QR d’emparellament desconegut.');
  }
  return oferta;
}

/**
 * Valida una oferta llegida per la càmera abans d'obrir WebRTC i la consumix
 * (un sol ús). La caducitat es mesura amb el rellotge de qui valida: una
 * oferta datada en el futur no viu més de 5 minuts.
 */
export async function validaOfertaTraspasLocalQr(ofertaCrua, {
  usuariIdEsperat,
  tenantIdEsperat,
  araMs = Date.now(),
  sessionsConsumides = null,
  cripto = globalThis.crypto,
} = {}) {
  exigixCripto(cripto);
  // L'àmbit de la sessió activa és obligatori: null === null no autentica res.
  const uidEsperat = exigixAmbit(usuariIdEsperat, 'usuariIdEsperat');
  const tidEsperat = exigixAmbit(tenantIdEsperat, 'tenantIdEsperat');
  const oferta = analitzaOferta(ofertaCrua);
  exigixId128(oferta.sessioId, 'sessio');
  exigixId128(oferta.nonce, 'nonce');
  const registre = registreConsum(sessionsConsumides, araMs);
  if (registre.has(oferta.sessioId)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'reutilitzat', 'Aquest codi QR d’un sol ús ja ha sigut consumit.');
  }
  if (!MODES_DISPOSITIU_QR.has(oferta.modeDispositiu)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'mode', 'Mode de dispositiu invàlid al QR.');
  }
  const uidOferta = exigixAmbitQr(oferta.usuariId, 'usuariId');
  const tidOferta = exigixAmbitQr(oferta.tenantId, 'tenantId');
  if (uidOferta !== uidEsperat || tidOferta !== tidEsperat) {
    throw creaErrorTipificat(CODI_IDENTITAT_DIVERGENT, 'ambit', 'El QR correspon a un altre compte o poble.');
  }
  const { creatAtMs, expiraAtMs } = oferta;
  if (!Number.isSafeInteger(araMs) || !Number.isSafeInteger(creatAtMs) || !Number.isSafeInteger(expiraAtMs)
    || expiraAtMs <= creatAtMs || expiraAtMs - creatAtMs > TTL_QR_MAX_MS
    || araMs > expiraAtMs || creatAtMs > araMs + MARGE_RELLOTGE_QR_MS
    || expiraAtMs > araMs + TTL_QR_MAX_MS + MARGE_RELLOTGE_QR_MS) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'caducat', 'El codi QR local ha caducat o ve del futur; genereu-ne un de nou.');
  }
  exigixSdp(oferta.sdpOffer, 'l’oferta SDP');
  exigixJwkEfimera(oferta.clauPublicaEfimeraJwk);
  const empremta = await sha256Hex(cripto, codifica(canonic(campsOferta(oferta))));
  if (typeof oferta.empremtaSha256 !== 'string' || !comparacioTempsConstant(empremta, oferta.empremtaSha256)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'empremta', 'L’empremta del QR no verifica.');
  }
  // La verificació és asíncrona: una altra validació pot haver consumit el
  // mateix QR durant el digest. La comprovació i l’alta són un sol pas síncron.
  if (registre.has(oferta.sessioId)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'reutilitzat', 'Aquest codi QR d’un sol ús ja ha sigut consumit.');
  }
  registre.add(oferta.sessioId, expiraAtMs);
  return { ok: true, sessioId: oferta.sessioId, modeDispositiu: oferta.modeDispositiu, expiraAtMs };
}

/**
 * L'aparell que escaneja respon pel LAN amb la seua clau efímera. Valida i
 * consumix l'oferta abans de respondre.
 */
export async function creaRespostaTraspasLocalQr(ofertaCrua, {
  usuariId,
  tenantId,
  sdpAnswer,
  clauPublicaEfimeraJwk,
  araMs = Date.now(),
  sessionsConsumides = null,
  cripto = globalThis.crypto,
} = {}) {
  const oferta = analitzaOferta(ofertaCrua);
  const publica = copiaObjecteQr(clauPublicaEfimeraJwk);
  await validaOfertaTraspasLocalQr(oferta, { usuariIdEsperat: usuariId, tenantIdEsperat: tenantId, araMs, sessionsConsumides, cripto });
  const dtlsResposta = exigixSdp(sdpAnswer, 'la resposta SDP');
  exigixJwkEfimera(publica);
  if (dtlsResposta === empremtaDtlsDe(oferta.sdpOffer)
    || canonic(publica) === canonic(oferta.clauPublicaEfimeraJwk)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'reflexio', 'La resposta no pot reutilitzar la clau ni l’empremta DTLS de l’oferta.');
  }
  return {
    esquema: ESQUEMA_SDP_QR_P2P,
    versio: VERSIO_SDP_QR_P2P,
    tipus: 'resposta',
    sessioId: oferta.sessioId,
    nonce: id128(cripto),
    usuariId: oferta.usuariId,
    tenantId: oferta.tenantId,
    creatAtMs: araMs,
    sdpAnswer,
    clauPublicaEfimeraJwk: publica,
    empremtaOferta: oferta.empremtaSha256,
  };
}

/**
 * El SAS de 6 dígits, derivat dels DOS extrems: HKDF-SHA256 sobre el secret
 * ECDH, amb sal = SHA-256 del transcript sencer (oferta i resposta, claus,
 * nonces, identitats, SDP amb empremtes DTLS). Els dos aparells l'han de
 * mostrar igual; si algú ha canviat la resposta pel camí, no quadra.
 * L'oferent consumix la resposta: una segona resposta a la mateixa oferta avorta.
 * Les identitats de l'oferta i de la resposta han de ser no buides i iguals; amb
 * `usuariIdEsperat` i `tenantIdEsperat` (recomanat), també les de la sessió activa.
 */
export async function derivaSasTraspasLocalQr({
  oferta: ofertaCrua,
  resposta: respostaCrua,
  clauPrivadaEfimera,
  rol,
  araMs = Date.now(),
  sessionsConsumides = null,
  usuariIdEsperat = undefined,
  tenantIdEsperat = undefined,
  cripto = globalThis.crypto,
} = {}) {
  exigixCripto(cripto);
  if (!ROLS_QR.has(rol)) throw creaErrorTipificat(CODI_QR_INVALID, 'rol', 'Rol de traspàs desconegut.');
  const ambEsperat = usuariIdEsperat !== undefined || tenantIdEsperat !== undefined;
  const uidEsperat = ambEsperat ? exigixAmbit(usuariIdEsperat, 'usuariIdEsperat') : null;
  const tidEsperat = ambEsperat ? exigixAmbit(tenantIdEsperat, 'tenantIdEsperat') : null;
  const oferta = analitzaOferta(ofertaCrua);
  let resposta;
  try {
    resposta = typeof respostaCrua === 'string' ? JSON.parse(respostaCrua) : respostaCrua;
  } catch {
    throw creaErrorTipificat(CODI_QR_INVALID, 'json', 'Resposta de traspàs malformada.');
  }
  resposta = instantaniaMissatgeQr(resposta);
  if (!esObjectePla(resposta) || resposta.esquema !== ESQUEMA_SDP_QR_P2P || resposta.versio !== VERSIO_SDP_QR_P2P
    || resposta.tipus !== 'resposta' || clausOrdenades(resposta) !== CLAUS_RESPOSTA) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'esquema', 'Resposta de traspàs desconeguda.');
  }
  exigixId128(resposta.nonce, 'nonce');
  const empremtaOferta = await sha256Hex(cripto, codifica(canonic(campsOferta(oferta))));
  if (typeof oferta.empremtaSha256 !== 'string' || typeof resposta.empremtaOferta !== 'string'
    || !comparacioTempsConstant(empremtaOferta, oferta.empremtaSha256)
    || !comparacioTempsConstant(resposta.empremtaOferta, oferta.empremtaSha256)
    || resposta.sessioId !== oferta.sessioId) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'sessio', 'La resposta no correspon a esta oferta.');
  }
  const uidOferta = exigixAmbitQr(oferta.usuariId, 'usuariId');
  const tidOferta = exigixAmbitQr(oferta.tenantId, 'tenantId');
  if (resposta.usuariId !== uidOferta || resposta.tenantId !== tidOferta) {
    throw creaErrorTipificat(CODI_IDENTITAT_DIVERGENT, 'ambit', 'La resposta ve d’un altre compte o poble.');
  }
  if (ambEsperat && (uidOferta !== uidEsperat || tidOferta !== tidEsperat)) {
    throw creaErrorTipificat(CODI_IDENTITAT_DIVERGENT, 'ambit', 'L’emparellament correspon a un altre compte o poble.');
  }
  if (!Number.isSafeInteger(araMs) || araMs > oferta.expiraAtMs || !Number.isSafeInteger(resposta.creatAtMs)
    || resposta.creatAtMs < oferta.creatAtMs || resposta.creatAtMs > oferta.expiraAtMs) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'caducat', 'L’emparellament ha caducat; genereu un QR nou.');
  }
  const dtlsOferta = exigixSdp(oferta.sdpOffer, 'l’oferta SDP');
  const dtlsResposta = exigixSdp(resposta.sdpAnswer, 'la resposta SDP');
  const publicaOferta = exigixJwkEfimera(oferta.clauPublicaEfimeraJwk);
  const publicaResposta = exigixJwkEfimera(resposta.clauPublicaEfimeraJwk);
  if (dtlsOferta === dtlsResposta || oferta.nonce === resposta.nonce
    || canonic(oferta.clauPublicaEfimeraJwk) === canonic(resposta.clauPublicaEfimeraJwk)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'reflexio', 'Els dos extrems no poden compartir clau, nonce ni empremta DTLS.');
  }
  if (rol === 'oferent') {
    const registre = registreConsum(sessionsConsumides, araMs);
    const clauConsum = `resposta:${oferta.sessioId}`;
    if (registre.has(clauConsum)) {
      throw creaErrorTipificat(CODI_QR_INVALID, 'resposta-repetida', 'Esta oferta ja ha rebut una resposta: un sol emparellament per QR.');
    }
    registre.add(clauConsum, oferta.expiraAtMs);
  }
  let secret;
  try {
    secret = await secretDh(cripto, clauPrivadaEfimera, rol === 'oferent' ? publicaResposta : publicaOferta);
  } catch {
    throw creaErrorTipificat(CODI_QR_INVALID, 'ecdh', 'No s’ha pogut acordar el secret efímer.');
  }
  const transcript = await sha256(cripto, codifica(canonic({
    oferta: { ...campsOferta(oferta), dtls: dtlsOferta },
    resposta: { ...resposta, dtls: dtlsResposta },
  })));
  try {
    const clauHkdf = await importaClauHkdf(cripto, secret);
    const bits = await derivaBitsHkdf(cripto, clauHkdf, transcript, infoHkdf('traspas-qr-sas'), 8);
    let n = 0n;
    for (const b of bits) n = (n << 8n) | BigInt(b);
    return { codiVerificacioSas: String(n % 1000000n).padStart(6, '0'), transcriptSha256: bytesAHex(transcript) };
  } finally {
    secret.fill(0);
  }
}

/**
 * Comprovador del SAS en un aparell: compara en temps constant, admet com a
 * molt `maxIntents` errors i després queda bloquejat (cal un QR nou). Una
 * confirmació correcta només val una vegada.
 */
export function creaComprovadorSas({ codiVerificacioSas, maxIntents = MAX_INTENTS_SAS } = {}) {
  if (typeof codiVerificacioSas !== 'string' || !/^\d{6}$/.test(codiVerificacioSas)) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'sas', 'El SAS esperat ha de tindre 6 dígits.');
  }
  if (!Number.isSafeInteger(maxIntents) || maxIntents < 1 || maxIntents > 10) {
    throw creaErrorTipificat(CODI_QR_INVALID, 'sas', 'Límit d’intents del SAS invàlid.');
  }
  let errors = 0;
  let estat = 'pendent';
  return Object.freeze({
    get bloquejat() {
      return estat === 'bloquejat';
    },
    get intentsRestants() {
      return estat === 'pendent' ? maxIntents - errors : 0;
    },
    comprova(codi) {
      if (estat === 'bloquejat') throw creaErrorTipificat(CODI_QR_INVALID, 'sas-bloquejat', 'Massa intents: genereu un QR nou.');
      if (estat === 'confirmat') throw creaErrorTipificat(CODI_QR_INVALID, 'sas-ja-confirmat', 'Este SAS ja s’ha confirmat.');
      const bo = typeof codi === 'string' && /^\d{6}$/.test(codi) && comparacioTempsConstant(codi, codiVerificacioSas);
      if (bo) {
        estat = 'confirmat';
        return true;
      }
      errors += 1;
      if (errors >= maxIntents) {
        estat = 'bloquejat';
        throw creaErrorTipificat(CODI_QR_INVALID, 'sas-bloquejat', 'El SAS no coincidix i s’han esgotat els intents: emparellament avortat.');
      }
      throw creaErrorTipificat(CODI_QR_INVALID, 'sas-no-coincidix', 'El codi de 6 dígits no coincidix amb l’altre aparell.', { intentsRestants: maxIntents - errors });
    },
  });
}

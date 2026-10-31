import { createPrivateKey } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Secret-bearing values, not the name of a database role in documentation.
 * Keep project URL and publishable-key restrictions from the deployment contract.
 * Diagnostics never return matched credentials.
 * Decisió del Mestre (30-10-2026, «Sí, accepta l'anon») · esta política estricta
 * continua sent la de findDistSecrets; la porta Consell (L9) llig el web (dist/),
 * el connector (wordpress-plugin/dist/) i el natiu (dist-natiu/) amb
 * findDistSecretsWeb, d'ací baix.
 */
export function findDistSecrets(source) {
  return compta(source, [
    [/https:\/\/[a-z0-9]{15,}\.supabase\.co/g, 'URL del projecte Supabase'],
    [/\bsb_(publishable|secret)_[A-Za-z0-9_-]{10,}/g, 'clau Supabase'],
    [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, 'JWT (possible service_role)'],
    ...vapidPrivatePatterns()
  ]);
}

/** Decisió del Mestre (30-10-2026, «Sí, accepta l'anon») · El web (dist/), el
 * connector (wordpress-plugin/dist/) i el natiu (dist-natiu/, l'APK i l'IPA)
 * porten per contracte la URL del projecte i el JWT anon (main.jsx, embed.jsx,
 * capaDelPaquet.js i sdp-release.json, que errorsDeRelease exigix): passen. Hi cau qualsevol JWT que no siga anon
 * (service_role, un altre rol o una càrrega il·legible), tota clau sb_secret_
 * i sb_publishable_ (fora de la decisió, que només nomena la URL i el JWT anon)
 * i les privades VAPID. Cap valor al diagnòstic: només l'etiqueta i el recompte. */
export function findDistSecretsWeb(source) {
  const noAnon = [...source.matchAll(/\beyJ[A-Za-z0-9_-]{20,}\.([A-Za-z0-9_-]{20,})/g)]
    .filter(([, carrega]) => rolDelJwt(carrega) !== 'anon').length;
  return [
    ...compta(source, [
      [/\bsb_secret_[A-Za-z0-9_-]{10,}/g, 'clau Supabase secreta (sb_secret_)'],
      [/\bsb_publishable_[A-Za-z0-9_-]{10,}/g, 'clau Supabase publicable (sb_publishable_), fora de la decisió del Mestre'],
      ...vapidPrivatePatterns()
    ]),
    ...(noAnon ? [{ label: 'JWT no anon (service_role, un altre rol o il·legible)', count: noAnon }] : [])
  ];
}

/** El camp «role» de la càrrega (base64url) d'un JWT, o null si no es pot llegir. */
export function rolDelJwt(carrega) {
  try {
    const rol = JSON.parse(Buffer.from(String(carrega), 'base64url').toString('utf8'))?.role;
    return typeof rol === 'string' ? rol : null;
  } catch {
    return null;
  }
}

/** Només les claus privades i les variables VITE_ privades o secretes, sense la
 * URL ni cap JWT de Supabase (Gauntlet c3, vapid-detector-cec-al-build-real).
 * La porta Consell ja no la usa per a dist-natiu: no hi veia cap service_role ni
 * sb_secret_, i la decisió del 30-10-2026 diu «qualsevol» (Gauntlet f6). Cap
 * valor al diagnòstic. */
export function findPrivateKeySecrets(source) {
  return compta(source, vapidPrivatePatterns());
}

function compta(source, patterns) {
  return patterns.flatMap(([pattern, label]) => {
    const count = source.match(pattern)?.length || 0;
    return count ? [{ label, count }] : [];
  });
}

/* Ordre nocturna 261030_0252 (Fase 3, WP) · La clau privada VAPID dels avisos
   push viu només als secrets del servidor (SDP_PUSH_VAPID_PRIVADA); la pública
   (VITE_PUSH_VAPID_PUBLICA) sí que pot anar al client. Al dist, una privada es
   reconeix pel seu nom amb un valor al costat (en brut, base64 o PKCS#8), per
   una clau privada PEM amb el seu cos, o per un JWK d'EC amb la part privada
   ("d", 43 caràcters base64url), també dins d'un JSON escapat. Un nom sense
   valor (documentació), la clau pública, un PEM públic o una capçalera PEM
   sense cos no hi compten. Cada quantificador és fitat (cap ReDoS).
   Gauntlet c3 (vapid-detector-cec-al-build-real) · Les formes d'un build
   real: el JWK minificat (claus sense cometes: `{kty:"EC",…,d:"…"}`), el nom
   que algú posaria per simetria amb la pública (VITE_PUSH_VAPID_PRIVADA,
   VITE_VAPID_PRIVADA, …_PRIVATE_KEY) dins de l'objecte d'entorn que Vite
   incrusta, qualsevol VITE_* amb PRIVAD, PRIVATE o SECRET, i el DER P-256 en
   base64 sense capçalera (PKCS#8, amb o sense la pública, i SEC1). El valor
   inlinat sol, sense nom, només el veu secretsPrivatsDeLEntorn (d'ací baix). */
function vapidPrivatePatterns() {
  const cometa = '\\\\?["\']';
  const clau = (nom) => `(?:${cometa})?\\b${nom}(?:${cometa})?\\s*:`;
  const kty = `${clau('kty')}\\s*${cometa}EC${cometa}`;
  const d = `${clau('d')}\\s*${cometa}[A-Za-z0-9_-]{43}${cometa}`;
  const nom = '[A-Z0-9_]{0,40}?VAPID_PRIVA(?:DA|TE)[A-Z0-9_]{0,20}|vapidPrivateKey|VITE_[A-Z0-9_]{0,60}?(?:PRIVAD|PRIVATE|SECRET)[A-Z0-9_]{0,60}';
  const base64 = '[A-Za-z0-9+/_-]';
  const der = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg|MEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBC|MHcCAQEEI';
  return [
    [new RegExp(`\\b(?:${nom})\\\\?["']?\\s{0,8}[:=,]\\s{0,8}\\\\?["']?[A-Za-z0-9_+/=-]{40,}`, 'g'),
      'clau privada VAPID o secret VITE_'],
    [/-----BEGIN (?:EC |ENCRYPTED )?PRIVATE KEY-----(?:\\[rn]|\s){1,8}[A-Za-z0-9+/]{40}/g, 'clau privada (PEM)'],
    [new RegExp(`${kty}[^{}]{0,400}?${d}|${d}[^{}]{0,400}?${kty}`, 'g'), 'clau privada EC (JWK)'],
    [new RegExp(`(?<!${base64})(?:${der})${base64}{40}`, 'g'), 'clau privada EC (PKCS#8 o SEC1 en base64)']
  ];
}

/* Gauntlet c3 (vapid-detector-cec-al-build-real) · La defensa que no depén de
   la forma: el valor EXACTE de les claus privades que l'entorn coneix, buscat
   tal qual al dist. Es lligen les variables del procés i dels fitxers .env*
   de l'arrel, de supabase/ i de supabase/functions/ (mai .env.example) amb
   VAPID i PRIV al nom, o VITE_ i PRIVAD, PRIVATE o SECRET. De cada valor
   s'extrau també l'escalar privat d d'una clau EC (PEM, JWK, PKCS#8 o SEC1)
   i les línies del cos PEM. Cap valor no ix d'ací: el diagnòstic és només
   l'etiqueta i el recompte. */
const MINIM_AGULLA = 20;
const NOM_VAPID_PRIVAT = /VAPID/i;
const NOM_PRIVAT = /PRIV/i;
const NOM_VITE_SECRET = /^VITE_[A-Z0-9_]*(?:PRIVAD|PRIVATE|SECRET)/i;
const esNomPrivat = (nom) => (NOM_VAPID_PRIVAT.test(nom) && NOM_PRIVAT.test(nom)) || NOM_VITE_SECRET.test(nom);

function llegixEnv(fitxer) {
  const valors = {};
  let text;
  try {
    text = readFileSync(fitxer, 'utf8');
  } catch {
    return valors;
  }
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

/* L'escalar privat d (base64url, 43) d'una clau EC en qualsevol forma, o null. */
function escalarPrivat(text) {
  if (/^[A-Za-z0-9_-]{43}$/.test(text)) return text;
  const intents = [];
  if (text.includes('-----BEGIN')) intents.push({ key: text.replace(/\\n/g, '\n') });
  if (text.startsWith('{')) {
    try {
      intents.push({ key: JSON.parse(text), format: 'jwk' });
    } catch {
      /* no és JSON */
    }
  }
  if (/^[A-Za-z0-9+/_-]{40,}=*$/.test(text)) {
    const bytes = Buffer.from(text, /[-_]/.test(text) ? 'base64url' : 'base64');
    intents.push({ key: bytes, format: 'der', type: 'pkcs8' }, { key: bytes, format: 'der', type: 'sec1' });
  }
  for (const intent of intents) {
    try {
      const { d } = createPrivateKey(intent).export({ format: 'jwk' });
      if (typeof d === 'string') return d;
    } catch {
      /* no és una clau privada en esta forma */
    }
  }
  return null;
}

/* Els trossos que delatarien el valor dins d'un bundle (cap de menys de MINIM_AGULLA). */
function agullesDe(valor) {
  const net = String(valor ?? '').trim();
  const agulles = new Set();
  if (!net) return [];
  if (!net.includes('-----') && !/\s/.test(net)) agulles.add(net);
  for (const linia of net.split(/\\n|\r?\n/)) if (/^[A-Za-z0-9+/=]{40,}$/.test(linia.trim())) agulles.add(linia.trim());
  const d = escalarPrivat(net);
  if (d) {
    agulles.add(d);
    agulles.add(Buffer.from(d, 'base64url').toString('base64').replace(/=+$/, ''));
  }
  return [...agulles].filter((agulla) => agulla.length >= MINIM_AGULLA);
}

/** Les agulles dels secrets privats de l'entorn: de `env` (per defecte, el procés) i dels .env* d'`arrel`. Mai llança. */
export function secretsPrivatsDeLEntorn({ env = process.env, arrel = null } = {}) {
  const fonts = [env && typeof env === 'object' ? env : {}];
  if (arrel) {
    for (const carpeta of ['', 'supabase', path.join('supabase', 'functions')]) {
      let noms = [];
      try {
        noms = readdirSync(path.join(arrel, carpeta));
      } catch {
        continue;
      }
      for (const nom of noms.sort()) {
        if (/^\.env(?:\.[\w.-]+)?$/.test(nom) && !/example/i.test(nom)) fonts.push(llegixEnv(path.join(arrel, carpeta, nom)));
      }
    }
  }
  const agulles = new Set();
  for (const font of fonts) {
    for (const [nom, valor] of Object.entries(font)) if (esNomPrivat(nom)) for (const agulla of agullesDe(valor)) agulles.add(agulla);
  }
  return [...agulles];
}

/** Quantes vegades apareix al text alguna de les agulles (secretsPrivatsDeLEntorn). Cap valor al diagnòstic. */
export function findKnownSecretValues(source, agulles = []) {
  let count = 0;
  for (const agulla of Array.isArray(agulles) ? agulles : []) {
    if (typeof agulla !== 'string' || agulla.length < MINIM_AGULLA) continue;
    for (let i = source.indexOf(agulla); i !== -1; i = source.indexOf(agulla, i + agulla.length)) count += 1;
  }
  return count ? [{ label: 'clau privada o secret de l\'entorn (valor exacte)', count }] : [];
}


/** Free (:fx) o clau Pro al costat del seu nom/capçalera. Cap valor al diagnòstic. */
export function findDeepLSecrets(source) {
  const uuid = '[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}';
  const free = new RegExp(`\\b${uuid}:fx\\b`, 'gi');
  const contextual = new RegExp(`(?:DeepL-Auth-Key\\s+|(?:VITE_)?DEEPL_API_KEY["']?\\s*[:,=]\\s*["']?)${uuid}(?!:fx)`, 'gi');
  const count = (source.match(free)?.length || 0) + (source.match(contextual)?.length || 0);
  return count ? [{label: 'possible clau DeepL', count}] : [];
}

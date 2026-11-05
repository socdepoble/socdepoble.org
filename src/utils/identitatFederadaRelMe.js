/**
 * identitatFederadaRelMe.js — Ronda 21 (Directiva AH-12 · Fase B de l'Estudi Doctoral AH-10)
 *
 * Motor pur d'Identitat Federada Verificada (`rel="me"` inspirat en VerifyAccountLinksService
 * de Mastodon AGPLv3) i Configurador de Pont amb Simetria Universal Multi-Entitat / Multi-Usuari.
 */

const RE_CONTROL_O_BIDI = /[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;
const RE_USUARI_VALID = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,62}$/;
const RE_DOMINI_VALID = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const AMBITS_EDITORIALS_PER_DEFECTE = Object.freeze([
  'mur',
  'calendari',
  'mapa',
  'animalets',
  'vehicle',
  'treball',
  'habitatge'
]);

export const COMPTE_INSTITUCIONAL_CANONIC = 'socdepoble@socdepoble.org';
export const WEBFINGER_INSTITUCIONAL_CANONIC = 'acct:socdepoble@socdepoble.org';

export const DESCRIPTOR_IDENTITAT_INSTITUCIONAL_SOCDEPOBLE = Object.freeze({
  correuInstitucional: COMPTE_INSTITUCIONAL_CANONIC,
  remitentTransaccionalNode0: COMPTE_INSTITUCIONAL_CANONIC,
  propietariMirallWorkspace20TB: COMPTE_INSTITUCIONAL_CANONIC,
  carpetaArrelMirallWorkspace: 'Sóc de Poble · Mirall Sobirà Node 0/',
  webfingerSubject: WEBFINGER_INSTITUCIONAL_CANONIC,
  node0ActorAcct: 'socdepoble@socdepoble.cat',
  replicaPosseMastodon: '@depoble@mastodont.cat',
  aliases: Object.freeze([
    'https://socdepoble.org',
    'https://socdepoble.cat/users/socdepoble',
    'https://mastodont.cat/@depoble'
  ])
});

const ENTITATS_PREDEFINIDES = Object.freeze({
  socdepoble: Object.freeze({
    id: 'socdepoble',
    nom: 'Sóc de Poble',
    etiqueta: '#SocDePoble',
    urlCanonica: 'https://socdepoble.org/entitats/socdepoble'
  }),
  rentonar: Object.freeze({
    id: 'rentonar',
    nom: 'El Rentonar',
    etiqueta: '#ElRentonar',
    urlCanonica: 'https://socdepoble.org/rentonar'
  }),
  'coordinadora-comtat': Object.freeze({
    id: 'coordinadora-comtat',
    nom: 'Coordinadora d’Estudis Eòlics del Comtat',
    etiqueta: '#CoordinadoraComtat',
    urlCanonica: 'https://socdepoble.org/entitats/coordinadora-comtat'
  })
});

function esHostPrivatOLocal(host) {
  const h = String(host ?? '').trim().toLowerCase();
  if (!h) return true;
  if (
    h === 'localhost'
    || h.endsWith('.localhost')
    || h.endsWith('.local')
    || h.endsWith('.internal')
    || h.endsWith('.lan')
    || h.includes(':')
    || h.startsWith('[')
  ) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    return true;
  }
  return !RE_DOMINI_VALID.test(h);
}

function escapaAtributHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function normalitzaUrlCanonicaComparacio(urlBruta) {
  const cadena = String(urlBruta ?? '').trim();
  if (!cadena || cadena.length > 2048 || RE_CONTROL_O_BIDI.test(cadena)) return null;
  try {
    const parsed = new URL(cadena);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    if (esHostPrivatOLocal(parsed.hostname)) return null;
    const cami = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.origin.toLowerCase()}${cami}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * Valida i normalitza una identitat del Fedivers (`@usuari@servidor.tld`, `usuari@servidor.tld`
 * o URL HTTPS `https://servidor.tld/@usuari` / `https://servidor.tld/users/usuari`).
 */
export function normalitzaIdentitatFedivers(entrada) {
  const brut = String(entrada ?? '').trim();
  if (!brut || brut.length > 512) {
    return Object.freeze({ ok: false, motiu: 'BUIT_O_MASSA_LLARG' });
  }
  if (RE_CONTROL_O_BIDI.test(brut)) {
    return Object.freeze({ ok: false, motiu: 'CARACTERS_CONTROL_O_BIDI' });
  }

  let username = '';
  let domain = '';

  if (brut.startsWith('http://') || brut.startsWith('https://')) {
    try {
      const parsed = new URL(brut);
      if (parsed.protocol !== 'https:') {
        return Object.freeze({ ok: false, motiu: 'PROTOCOL_NO_HTTPS' });
      }
      if (parsed.username || parsed.password || parsed.port) {
        return Object.freeze({ ok: false, motiu: 'CREDENCIALS_O_PORT_NO_PERMESOS' });
      }
      domain = parsed.hostname.toLowerCase();
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 1 && segments[0].startsWith('@') && segments[0].length > 1) {
        username = segments[0].slice(1);
      } else if (segments.length === 2 && segments[0] === 'users' && segments[1]) {
        username = segments[1];
      } else {
        return Object.freeze({ ok: false, motiu: 'RUTA_ACTOR_INVALIDA' });
      }
    } catch {
      return Object.freeze({ ok: false, motiu: 'URL_MALFORMADA' });
    }
  } else {
    const senseArrobaInicial = brut.startsWith('@') ? brut.slice(1) : brut;
    const parts = senseArrobaInicial.split('@');
    if (parts.length !== 2) {
      return Object.freeze({ ok: false, motiu: 'FORMAT_HANDLE_INVALID' });
    }
    [username, domain] = parts;
    domain = domain.toLowerCase();
  }

  if (!RE_USUARI_VALID.test(username)) {
    return Object.freeze({ ok: false, motiu: 'USUARI_INVALID' });
  }
  if (esHostPrivatOLocal(domain)) {
    return Object.freeze({ ok: false, motiu: 'DOMINI_PRIVAT_O_INVALID' });
  }

  const acct = `${username}@${domain}`;
  const handle = `@${acct}`;
  const profileUrl = `https://${domain}/@${username}`;
  const actorUri = `https://${domain}/users/${username}`;

  return Object.freeze({
    ok: true,
    username,
    domain,
    acct,
    handle,
    profileUrl,
    actorUri
  });
}

/**
 * Genera els descriptors i etiquetes `<link rel="me">` i `<a rel="me">` per a un usuari
 * o entitat de Sóc de Poble, permetent que Mastodon verifique la propietat de la fitxa
 * en `https://socdepoble.org/...` amb el tic verd (`VerifyAccountLinksService`).
 */
export function construeixEnllacosRelMe(entradesIdentitat, opcions = {}) {
  const llista = Array.isArray(entradesIdentitat) ? entradesIdentitat : [entradesIdentitat];
  const urlCanonica = normalitzaUrlCanonicaComparacio(
    opcions.urlCanonicaSocDePoble ?? 'https://socdepoble.org'
  ) ?? 'https://socdepoble.org';

  const vistos = new Set();
  const enllacos = [];

  for (const item of llista) {
    const norm = normalitzaIdentitatFedivers(item);
    if (!norm.ok) continue;
    if (vistos.has(norm.profileUrl)) continue;
    vistos.add(norm.profileUrl);

    const hrefEscapat = escapaAtributHtml(norm.profileUrl);
    const handleEscapat = escapaAtributHtml(norm.handle);

    enllacos.push(
      Object.freeze({
        handle: norm.handle,
        acct: norm.acct,
        profileUrl: norm.profileUrl,
        actorUri: norm.actorUri,
        urlCanonicaSocDePoble: urlCanonica,
        linkTagHtml: `<link rel="me" href="${hrefEscapat}" />`,
        anchorTagHtml: `<a rel="me noopener noreferrer" href="${hrefEscapat}" target="_blank">${handleEscapat}</a>`
      })
    );
  }

  return Object.freeze(enllacos);
}

function extrauAtributTag(contingutTag, nomAtribut) {
  const objectiu = nomAtribut.toLowerCase();
  const n = contingutTag.length;
  let i = 0;

  while (i < n) {
    while (i < n && /\s/.test(contingutTag[i])) i += 1;
    if (i >= n || contingutTag[i] === '/') break;

    const iniciNom = i;
    while (i < n && /[A-Za-z0-9_:-]/.test(contingutTag[i])) i += 1;
    const nom = contingutTag.slice(iniciNom, i).toLowerCase();

    while (i < n && /\s/.test(contingutTag[i])) i += 1;
    if (i >= n || contingutTag[i] !== '=') continue;
    i += 1;
    while (i < n && /\s/.test(contingutTag[i])) i += 1;
    if (i >= n) break;

    let valor = '';
    const cometa = contingutTag[i];
    if (cometa === '"' || cometa === "'") {
      i += 1;
      const iniciVal = i;
      while (i < n && contingutTag[i] !== cometa) i += 1;
      valor = contingutTag.slice(iniciVal, i);
      if (i < n) i += 1;
    } else {
      const iniciVal = i;
      while (i < n && !/[\s>]/.test(contingutTag[i])) i += 1;
      valor = contingutTag.slice(iniciVal, i);
    }

    if (nom === objectiu) {
      return valor.replaceAll('&amp;', '&').trim();
    }
  }
  return '';
}

/**
 * Verifica de manera pura i en temps lineal O(N) si l'HTML públic del perfil de Mastodon
 * conté un enllaç `<a rel="me" href="...">` o `<link rel="me" href="...">` que apunte a
 * la URL canònica de l'usuari o entitat a `https://socdepoble.org/...`.
 */
export function verificaReciprocitatRelMe(htmlRemot, urlCanonicaSocDePoble) {
  const objectiu = normalitzaUrlCanonicaComparacio(urlCanonicaSocDePoble);
  if (!objectiu || !objectiu.startsWith('https://socdepoble.org')) {
    return Object.freeze({ verificat: false, urlTrobada: null, motiu: 'URL_CANONICA_INVALIDA' });
  }

  const html = String(htmlRemot ?? '');
  if (!html || html.length > 524288) {
    return Object.freeze({ verificat: false, urlTrobada: null, motiu: 'HTML_BUIT_O_MASSA_GRAN' });
  }

  const n = html.length;
  let i = 0;
  while (i < n) {
    const posObertura = html.indexOf('<', i);
    if (posObertura === -1) break;
    const posTancament = html.indexOf('>', posObertura + 1);
    if (posTancament === -1) break;

    const interior = html.slice(posObertura + 1, posTancament).trim();
    i = posTancament + 1;

    if (!interior || interior.startsWith('/') || interior.startsWith('!')) continue;
    const espaiIdx = interior.search(/[\s/>]/);
    const tagNom = (espaiIdx === -1 ? interior : interior.slice(0, espaiIdx)).toLowerCase();
    if (tagNom !== 'a' && tagNom !== 'link') continue;

    const relValor = extrauAtributTag(interior, 'rel').toLowerCase();
    if (!relValor) continue;
    const tokensRel = relValor.split(/\s+/).filter(Boolean);
    if (!tokensRel.includes('me')) continue;

    const hrefValor = extrauAtributTag(interior, 'href');
    const hrefNorm = normalitzaUrlCanonicaComparacio(hrefValor);
    if (hrefNorm && hrefNorm === objectiu) {
      return Object.freeze({
        verificat: true,
        urlTrobada: hrefNorm,
        motiu: null
      });
    }
  }

  return Object.freeze({
    verificat: false,
    urlTrobada: null,
    motiu: 'CAP_ENLLAC_REL_ME_COINCIDENT'
  });
}

/**
 * Configura un pont POSSE cap a Mastodon amb Simetria Universal:
 * tant per al pont compartit `@depoble@mastodont.cat` (Sóc de Poble + El Rentonar + Coordinadora)
 * com per a qualsevol veí, entitat o associació que vincule el seu propi compte de Mastodon.
 */
export function configuraPontMastodonUsuari(opcions = {}) {
  const identitat = normalitzaIdentitatFedivers(opcions.compteMastodon ?? '@depoble@mastodont.cat');
  if (!identitat.ok) {
    return Object.freeze({
      ok: false,
      motiu: identitat.motiu
    });
  }

  const idsEntitats = Array.isArray(opcions.entitatsVinculades) && opcions.entitatsVinculades.length > 0
    ? opcions.entitatsVinculades
    : ['socdepoble', 'rentonar'];

  const entitats = [];
  const vistos = new Set();
  for (const entrada of idsEntitats) {
    const id = typeof entrada === 'string'
      ? entrada.trim().toLowerCase()
      : String(entrada?.id ?? '').trim().toLowerCase();
    if (!id || vistos.has(id)) continue;
    vistos.add(id);

    if (ENTITATS_PREDEFINIDES[id]) {
      entitats.push(ENTITATS_PREDEFINIDES[id]);
    } else {
      const nom = typeof entrada === 'object' && entrada?.nom
        ? String(entrada.nom).trim()
        : id;
      const slugSegur = encodeURIComponent(id);
      entitats.push(
        Object.freeze({
          id,
          nom,
          etiqueta: `#${nom.replace(/[^0-9A-Za-zÀ-ÿ]/g, '') || 'SocDePoble'}`,
          urlCanonica: `https://socdepoble.org/perfil/${slugSegur}`
        })
      );
    }
  }

  const excloureMercatComercial = opcions.excloureMercatComercial !== false;
  const ambitsBruts = Array.isArray(opcions.ambitsActius) && opcions.ambitsActius.length > 0
    ? opcions.ambitsActius.map((a) => String(a).trim().toLowerCase())
    : [...AMBITS_EDITORIALS_PER_DEFECTE];

  const ambitsActius = ambitsBruts.filter((a) => Boolean(a) && (!excloureMercatComercial || a !== 'mercat'));
  const urlCanonicaPerfil = normalitzaUrlCanonicaComparacio(
    opcions.urlCanonicaPerfil ?? entitats[0]?.urlCanonica ?? 'https://socdepoble.org'
  ) ?? 'https://socdepoble.org';

  const enllacosRelMe = construeixEnllacosRelMe(identitat.handle, {
    urlCanonicaSocDePoble: urlCanonicaPerfil
  });

  return Object.freeze({
    ok: true,
    compteInstitucionalCanonic: COMPTE_INSTITUCIONAL_CANONIC,
    webfingerInstitucionalCanonic: WEBFINGER_INSTITUCIONAL_CANONIC,
    compteMastodon: identitat.handle,
    acct: identitat.acct,
    profileUrl: identitat.profileUrl,
    actorUri: identitat.actorUri,
    urlCanonicaPerfil,
    entitatsVinculades: Object.freeze(entitats),
    ambitsActius: Object.freeze(ambitsActius),
    excloureMercatComercial,
    requereixConformitatHumana: true,
    enllacosRelMe
  });
}

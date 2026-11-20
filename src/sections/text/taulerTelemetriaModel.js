import { SECTIONS } from '../../config/sections.js';
import { CLAUS_FUNDACIONALS } from '../../data/identitatsSeed.js';

/*
 * Model pur i consultor públic del Tauler de Telemetria de /legal
 * (extret de TaulerTelemetria.jsx a l'Onada R32.19 per a preservar Fast Refresh / HMR pur).
 */

/* Ordre del Mestre (30-10-2026, prompt 2208, T3.2) · Motius de telemetria.js
   amb les frases del Mestre; «umami» diu visita o clic segons el tipus. */
const MOTIUS = {
  umami: "S'ha sumat 1 visita anònima al comptador públic (sense cap dada personal).",
  amfitrio: "S'ha passat l'avís de manera anònima al comptador de la web que allotja Sóc de Poble.",
  apagada: "No s'ha enviat res: tens el comptador apagat en aquest navegador.",
  'sense-configurar': "No s'ha enviat res: aquest servidor té el comptador desconnectat.",
  'amfitrio-compta-visites': "No s'ha enviat dues voltes: la web que allotja Sóc de Poble ja compta la visita.",
  'error-amfitrio': "No s'ha enviat res perquè la connexió amb el comptador no ha respost.",
  encastada: "No s'ha enviat res: Sóc de Poble està dins de la web d'un altre, i allí mana la seua política de privacitat.",
  'sense-fetch': "No s'ha enviat res: aquest navegador no sap fer l'enviament.",
  'error-xarxa': "No s'ha enviat res perquè la connexió amb el comptador no ha respost.",
  'sense-navegador': "No s'ha enviat res: no hi havia cap navegador.",
  'servidor-local': "No s'ha enviat res: estàs en un servidor local de proves, i les visites d'ací no es sumen al comptador públic."
};
const UMAMI_CLIC = "S'ha anotat aquest clic de manera anònima al comptador públic.";

const PENDENT_DE_RESPOSTA = "Pendent de resposta del comptador; s'ha intentat enviar.";
const ACCEPTAT = "El comptador ha donat una resposta HTTP satisfactòria a l'intent; el registre final no es verifica ací.";
const SENSE_CONFIRMACIO = "S'ha intentat enviar, però no sabem si ha arribat.";

export function estatEnParaules({ tipus, enviat, motiu, verificacio }) {
  if (motiu === 'umami' && verificacio === 'intent') return PENDENT_DE_RESPOSTA;
  if (motiu === 'umami' && verificacio === 'acceptat') return tipus === 'esdeveniment' ? UMAMI_CLIC : ACCEPTAT;
  if (motiu === 'umami' && verificacio === 'fallat') return SENSE_CONFIRMACIO;
  if (motiu === 'umami' && tipus === 'esdeveniment') return UMAMI_CLIC;
  return MOTIUS[motiu] || (enviat
    ? SENSE_CONFIRMACIO
    : `No s'ha enviat res (motiu tècnic: ${motiu || 'desconegut'}).`);
}

const NOMS_DEL_MESTRE = { notes: 'Bloc de notes', mur: 'El Mur', mercat: 'El Mercat' };
const NOMS_FORA_DE_LA_BARRA = {
  admin: 'Administració',
  app: 'Apps',
  cerca: 'Cerca',
  consola: 'Consola',
  'control-xat': 'Control del xat',
  'el-meu-perfil': 'El meu perfil',
  events: 'Agenda',
  iaia: 'Perfil',
  realitat: 'Realitat',
  registre: 'Entrar o crear compte',
  traduccions: 'Traduccions i llengua',
  utilitats: 'Panell de Control',
  descarregues: 'Descàrregues i Aplicacions',
  fediversity: 'Candidatura Europea NLnet · NGI Fediversity'
};
const ADRECES_CURTES = {
  login: 'registre', accedir: 'registre', entrar: 'registre', 'crear-compte': 'registre', registra: 'registre',
  chat: 'xat', wiki: 'wikidepoble', skills: 'wikidepoble', ia: 'anima'
};
const NOMS_DE_SECCIO = new Map([
  ...Object.entries(NOMS_FORA_DE_LA_BARRA),
  ...SECTIONS.map((seccio) => [String(seccio.path).split('/').filter(Boolean)[0], seccio.label]),
  ...Object.entries(NOMS_DEL_MESTRE)
]);
for (const [curta, desti] of Object.entries(ADRECES_CURTES)) NOMS_DE_SECCIO.set(curta, NOMS_DE_SECCIO.get(desti));
const TRAMS_DE_FITXA = new Set(['perfil', 'gent', 'empresa', 'grup', 'ajuntament']);
const SUBSECCIONS_DEL_MESTRE = { xat: 'Xat (conversa o canal)' };

function nomsDeLaRuta(url) {
  const [primer, ...resta] = String(url || '/').split('/').filter(Boolean);
  if (!primer) return { seccio: 'Inici', visita: 'Visita a: Inici' };
  if (TRAMS_DE_FITXA.has(primer)) return { seccio: 'Fitxes i perfils', visita: 'Visita a una fitxa o perfil (sense dir quin)' };
  if (primer === 'page' && resta.length) return { seccio: 'Pàgines informatives', visita: 'Visita a una pàgina informativa (sense dir quina)' };
  if (primer === 'plugin' && resta.length) return { seccio: "Fitxes d'eines", visita: "Visita a la fitxa d'una eina (sense dir quina)" };
  const seccio = NOMS_DE_SECCIO.get(primer);
  if (!seccio) return null;
  if (!resta.length) return { seccio, visita: `Visita a: ${seccio}` };
  return {
    seccio: SUBSECCIONS_DEL_MESTRE[ADRECES_CURTES[primer] ?? primer] ?? `${seccio} (una pàgina de dins)`,
    visita: primer === 'app' ? 'Visita a una app (sense dir quina)' : `Visita a: ${seccio} (una pàgina de dins, sense dir quina)`
  };
}

/** El nom net d'una secció per al rànquing, sense «Visita a:» (Ordre del Mestre, 31-10-2026), o null. */
export function nomDeSeccio(url) {
  return nomsDeLaRuta(url)?.seccio ?? null;
}

export function nomDeLIntent({ tipus, nom, url }) {
  if (tipus === 'esdeveniment') {
    return nom === 'connectar' ? 'Clic al botó Connectar' : `Acció anotada: ${nom || 'sense nom'}`;
  }
  const resta = String(url || '/').split('/').filter(Boolean).slice(1);
  return nomsDeLaRuta(url)?.visita ?? `Visita a una altra part de Sóc de Poble${resta.length ? ' (sense dir quina)' : ''}`;
}

export const TEMPS_LIMIT_TAULER_MS = 20000;
const FINESTRA_MS = 24 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
export const ZONA_HORARIA = 'Europe/Madrid';
const MAX_SECCIONS = 8;
const ID_DE_TAULER = /^[A-Za-z0-9_-]{1,128}$/;
const ID_DE_WEB = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAU_HORARIA = /^\d{4}-\d{2}-\d{2}T\d{2}$/;
const OPCIONS_DE_CONSULTA = Object.freeze({
  method: 'GET', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'manual', cache: 'no-store'
});

const MOTIUS_DEL_TAULER = {
  'enllac-no-compartit': "L'enllaç configurat no és el d'un tauler compartit d'Umami (ha de tindre la forma …/share/…).",
  'no-trobat': "El comptador diu que eixe enllaç públic no existix: pot haver caducat o s'ha tancat.",
  redirigit: "El comptador no ensenya el tauler: envia a una pantalla d'entrada amb compte.",
  'resposta-estranya': 'El comptador ha contestat, però no com un tauler públic.',
  'sense-resposta': "El comptador no ha contestat: pot ser la connexió, o que este navegador o esta web no deixen preguntar-li.",
  'temps-exhaurit': 'El comptador ha tardat massa a contestar.'
};

export function motiuDelTaulerEnParaules({ motiu, status }) {
  if (motiu === 'no-public') return `El comptador no l'ha obert com a tauler públic (ha contestat amb el codi ${status}).`;
  return MOTIUS_DEL_TAULER[motiu] || MOTIUS_DEL_TAULER['sense-resposta'];
}

/** On viu el tauler compartit: { id, bases } (la primera, la de l'enllaç), o null si no és …/share/<id>. */
export function basesDelTauler(shareUrl) {
  let url;
  try { url = new URL(shareUrl); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const trams = url.pathname.split('/');
  const posicio = trams.indexOf('share');
  const id = posicio < 0 ? '' : trams[posicio + 1];
  if (!id || !ID_DE_TAULER.test(id)) return null;
  const cami = trams.slice(0, posicio).join('/');
  const bases = [`${url.origin}${cami}`];
  if (!cami && url.hostname === 'cloud.umami.is') bases.unshift(`${url.origin}/analytics/eu`);
  return { id, bases };
}

function esFitxaDeTaulerPublic(cos) {
  return Boolean(cos) && typeof cos === 'object' && !Array.isArray(cos)
    && typeof cos.token === 'string' && cos.token.trim() !== ''
    && typeof cos.websiteId === 'string' && ID_DE_WEB.test(cos.websiteId);
}

function nombre(valor) {
  if (typeof valor === 'number') return valor;
  if (valor && typeof valor === 'object' && typeof valor.value === 'number') return valor.value;
  return Number.NaN;
}
const esXifra = (valor) => Number.isFinite(valor) && valor >= 0;

/** Les xifres de /stats, o null si no hi són totes. Rebot i temps, amb les fórmules del tauler d'Umami. */
export function resumDelTauler(cos) {
  if (!cos || typeof cos !== 'object' || Array.isArray(cos)) return null;
  const [vistes, visitants, visites, rebots, tempsTotal] = ['pageviews', 'visitors', 'visits', 'bounces', 'totaltime']
    .map((camp) => nombre(cos[camp]));
  if (![vistes, visitants, visites, rebots, tempsTotal].every(esXifra)) return null;
  return {
    visitants,
    visites,
    vistes,
    rebot: visites > 0 ? Math.min(visites, rebots) / visites : null,
    tempsMitja: visites > 0 ? tempsTotal / visites : null
  };
}

function enLiniaDe(cos) {
  const valor = cos && typeof cos === 'object' ? nombre(cos.visitors ?? cos.x) : nombre(cos);
  return esXifra(valor) ? valor : null;
}

function formatadorHorari(zona) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
    });
  } catch { return null; }
}

function clauDeLHora(format, instant) {
  const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}`;
}

function sumaPerHora(punts) {
  const perHora = new Map();
  for (const punt of punts) {
    const clau = String(punt?.x ?? '').replace(' ', 'T').slice(0, 13);
    if (CLAU_HORARIA.test(clau) && esXifra(punt.y)) perHora.set(clau, (perHora.get(clau) || 0) + punt.y);
  }
  return perHora;
}

export function horesDelTauler(cos, fins, zona = ZONA_HORARIA) {
  const punts = cos && typeof cos === 'object' && Array.isArray(cos.pageviews) ? cos.pageviews : null;
  const format = formatadorHorari(zona);
  if (!punts || !format || !Number.isFinite(fins)) return null;
  const vistes = sumaPerHora(punts);
  const visitants = Array.isArray(cos.sessions) ? sumaPerHora(cos.sessions) : null;
  const darrera = Math.floor(fins / HORA_MS) * HORA_MS;
  const hores = [];
  const posades = new Set();
  for (let enrere = 23; enrere >= 0; enrere -= 1) {
    const clau = clauDeLHora(format, darrera - enrere * HORA_MS);
    if (posades.has(clau)) continue;
    posades.add(clau);
    const hora = clau.slice(11, 13);
    hores.push({
      id: clau,
      etiqueta: `${hora}:00 h`,
      marca: Number(hora) % 6 === 0 ? hora : '',
      vistes: vistes.get(clau) || 0,
      visitants: visitants ? visitants.get(clau) || 0 : null
    });
  }
  return hores;
}

const FORMA_TAPADA = /^\/(?:[a-z0-9-]{1,40}(?:\/\*)?)?$/;
const TRAMS_PERSONALS = new Set(CLAUS_FUNDACIONALS.map((clau) => String(clau).toLowerCase()));

function esRutaDelTauler(ruta) {
  if (!FORMA_TAPADA.test(ruta)) return false;
  const primer = ruta.split('/')[1];
  return !TRAMS_PERSONALS.has(primer) && nomsDeLaRuta(ruta) !== null;
}

export function seccionsDelTauler(cos) {
  if (!Array.isArray(cos)) return null;
  const files = cos
    .filter((fila) => fila && typeof fila.x === 'string' && fila.x !== '' && esXifra(fila.y))
    .slice(0, MAX_SECCIONS);
  const seccions = files.filter((fila) => esRutaDelTauler(fila.x)).map((fila) => ({ ruta: fila.x, visitants: fila.y }));
  return { seccions, amagades: files.length - seccions.length };
}

async function consulta(demana, adreca, { capcaleres, signal }) {
  let resposta;
  try {
    resposta = await demana(adreca, { ...OPCIONS_DE_CONSULTA, ...(capcaleres ? { headers: capcaleres } : {}), signal });
  } catch { return { ok: false, motiu: 'sense-resposta' }; }
  if (!resposta || resposta.redirected || resposta.type === 'opaqueredirect' || (resposta.status >= 300 && resposta.status < 400)) {
    return { ok: false, motiu: 'redirigit' };
  }
  if (!resposta.status) return { ok: false, motiu: 'sense-resposta' };
  if (resposta.status === 404) return { ok: false, motiu: 'no-trobat' };
  if (resposta.status !== 200) return { ok: false, motiu: 'no-public', status: resposta.status };
  try { return { ok: true, cos: await resposta.json() }; } catch { return { ok: false, motiu: 'resposta-estranya' }; }
}

const fallada = ({ motiu, status }) => ({ estat: 'fallada', motiu, ...(status ? { status } : {}) });

export async function carregaTauler(shareUrl, { fetch: demana, tempsLimitMs = TEMPS_LIMIT_TAULER_MS, signal, ara } = {}) {
  const tauler = basesDelTauler(shareUrl);
  if (!tauler) return fallada({ motiu: 'enllac-no-compartit' });
  if (typeof demana !== 'function') return fallada({ motiu: 'sense-resposta' });
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const avorta = () => control?.abort();
  if (signal?.aborted) avorta();
  signal?.addEventListener?.('abort', avorta, { once: true });
  let rellotge;
  const temps = new Promise((resol) => {
    rellotge = setTimeout(() => { avorta(); resol(fallada({ motiu: 'temps-exhaurit' })); }, tempsLimitMs);
  });
  const opcions = { signal: control?.signal };
  const lectura = (async () => {
    let base = '';
    let fitxa = null;
    let darrera = { motiu: 'sense-resposta' };
    for (const candidata of tauler.bases) {
      const resposta = await consulta(demana, `${candidata}/api/share/${tauler.id}`, opcions);
      if (resposta.ok) { base = candidata; fitxa = resposta.cos; break; }
      darrera = resposta;
      if (resposta.motiu !== 'no-trobat') break;
    }
    if (!base) return fallada(darrera);
    if (!esFitxaDeTaulerPublic(fitxa)) return fallada({ motiu: 'resposta-estranya' });
    const fins = Number.isFinite(ara) ? ara : Date.now();
    const finestra = `startAt=${fins - FINESTRA_MS}&endAt=${fins}`;
    const web = `${base}/api/websites/${fitxa.websiteId}`;
    const ambTestimoni = {
      ...opcions,
      capcaleres: { 'x-umami-share-token': fitxa.token, 'x-umami-share-context': '1' }
    };
    const [resum, actius, perHora, rutes] = await Promise.all([
      consulta(demana, `${web}/stats?${finestra}`, ambTestimoni),
      consulta(demana, `${web}/active`, ambTestimoni),
      consulta(demana, `${web}/pageviews?${finestra}&unit=hour&timezone=${encodeURIComponent(ZONA_HORARIA)}`, ambTestimoni),
      consulta(demana, `${web}/metrics?${finestra}&type=path&limit=${MAX_SECCIONS}`, ambTestimoni)
    ]);
    if (!resum.ok) return fallada(resum);
    const xifres = resumDelTauler(resum.cos);
    if (!xifres) return fallada({ motiu: 'resposta-estranya' });
    const llista = rutes.ok ? seccionsDelTauler(rutes.cos) : null;
    return {
      estat: 'dades',
      dades: {
        ...xifres,
        enLinia: actius.ok ? enLiniaDe(actius.cos) : null,
        hores: perHora.ok ? horesDelTauler(perHora.cos, fins) : null,
        seccions: llista ? llista.seccions : null,
        rutesAmagades: llista ? llista.amagades : 0,
        fins
      }
    };
  })();
  try {
    return await Promise.race([lectura, temps]);
  } finally {
    clearTimeout(rellotge);
    signal?.removeEventListener?.('abort', avorta);
  }
}

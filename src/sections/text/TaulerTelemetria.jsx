import { getPreferenciaLlegat } from '../../config/storage.js';
import { SECTIONS } from '../../config/sections.js';
import { CLAUS_FUNDACIONALS } from '../../data/identitatsSeed.js';
import { useEffect, useId, useRef, useState } from 'react';
import { Alerta, Carregant, EstatBuit, Interruptor, QuadreDeComandament } from '../../components/PedraSeca';
import {
  CLAU_APAGADA, ESDEVENIMENT_DOM, configTelemetria, darrersEnviaments,
  estableixTelemetriaApagada, telemetriaApagada
} from '../../data/telemetria.js';

/*
 * Tauler de Telemetria de /legal (Transparència Radical, pla 260924_1850 §4).
 * TextSection el pinta davall del text legal, que no toca: eixe text té la
 * seua pròpia aprovació.
 *
 * Quatre peces, i cap xifra calculada ací:
 *   1. Què es compta i què no. Cada frase descriu el que fa HUI
 *      data/telemetria.js (el `payload` d'`envia`); si canvia el contracte,
 *      canvia esta llista.
 *   2. L'interruptor d'este navegador. La tria local i el senyal del navegador
 *      (DNT/GPC) es distingixen: el segon no es pot desfer des d'ací.
 *   3. El tauler públic, nadiu i sense iframe, només si el node té
 *      VITE_UMAMI_SHARE_URL. Ordre del Mestre (30-10-2026, prompt 2208, T3.1):
 *      l'iframe de cloud.umami.is portava un segon scroll, l'entrada d'Umami
 *      quan l'enllaç caducava (i, des d'ella, un 403 de Google) i dos errors
 *      de consola. Ara el navegador demana les xifres a l'API pública de
 *      compartició (carregaTauler, més avall) i les pinta el Quadre de
 *      Comandament de Pedra Seca: «En línia», cinc xifres, visitants i vistes
 *      per hora i les seccions més visitades. Si l'enllaç falla, un estat buit
 *      que mai demana compte ni contrasenya.
 *   4. Els intents d'este navegador: darrersEnviaments(), refrescat amb
 *      l'esdeveniment sdp:telemetria. Així es comprova «Connectar» sense backend.
 *      Ordre del Mestre (30-10-2026, prompt 2208, T3.2): en paraules de plaça,
 *      amb el nom humà de la secció i l'adreça tècnica com a detall secundari.
 *
 * `config`, `fetchTauler`, `tempsLimitTaulerMs` i `ara` s'injecten en les
 * proves; en l'app són la configuració de compilació, el fetch del navegador,
 * 20 segons i l'hora del moment.
 */

const CONFIG_COMPILADA = configTelemetria();

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
  /* Ordre del Mestre (30-10-2026, prompt 2208, T3.3): des d'un servidor local
     no es compta res al comptador públic de socdepoble.org. */
  'servidor-local': "No s'ha enviat res: estàs en un servidor local de proves, i les visites d'ací no es sumen al comptador públic."
};
const UMAMI_CLIC = "S'ha anotat aquest clic de manera anònima al comptador públic.";

function estatEnParaules({ tipus, enviat, motiu }) {
  if (motiu === 'umami' && tipus === 'esdeveniment') return UMAMI_CLIC;
  return MOTIUS[motiu] || (enviat
    ? "S'ha intentat enviar, però no sabem si ha arribat."
    : `No s'ha enviat res (motiu tècnic: ${motiu || 'desconegut'}).`);
}

/* Noms de secció (T3.2): els que va nomenar el Mestre i, per a la resta,
   l'etiqueta de la barra (config/sections.js). Una ruta que no és enlloc rep
   un nom genèric: mai se n'inventa cap. */
const NOMS_DEL_MESTRE = { notes: 'Bloc de notes', mur: 'El Mur', mercat: 'El Mercat' };
/* Ordre del Mestre (30-10-2026, prompt 2208, T3.1 i T3.2: un nom humà per a
   cada ruta) · Les rutes de l'app que no són a la barra, amb el nom copiat
   d'un registre que ja existix, mai inventat: el títol de reserva de
   RouteSEO.jsx (TITLES, que no s'exporta), «Agenda» per a la fitxa d'un acte
   (/events/<id>, ItemDetailSection; idiomes/ca.js, section.events.title) i el
   títol de la pàgina a què porten /descarregues i /fediversity (pageContent).
   Les adreces curtes que App.jsx redirigix prenen el nom de la destinació.
   /lector no és cap ruta d'App.jsx: no té nom. */
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
/* Fitxes de persona o entitat (subrutes de Pobles a sections.js): telemetria.js
   ja tapa el sobrenom en /perfil/*, i ací tampoc es diu quina. */
const TRAMS_DE_FITXA = new Set(['perfil', 'gent', 'empresa', 'grup', 'ajuntament']);

/* Ordre del Mestre (31-10-2026, 01:10) · Les subpàgines amb nom propi al
   rànquing de seccions (prompt 2208, T3.1 punt 4). */
const SUBSECCIONS_DEL_MESTRE = { xat: 'Xat (conversa o canal)' };

/**
 * Com es diu una ruta tapada de Sóc de Poble, o null si no és cap que sapiem
 * nomenar: { seccio, visita }. `seccio` és el nom net del rànquing («Xat»,
 * «Pàgines informatives»); `visita`, la frase del registre d'activitat, on
 * conviu amb els clics («Visita a: Xat»). Un sol mapa (NOMS_DE_SECCIO).
 */
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

/* ─── Tauler públic nadiu (T3.1) ───
   Ordre del Mestre (30-10-2026, prompt 2208, T3.1): cap <iframe>. L'API
   pública de compartició d'Umami (v3) servix JSON amb CORS obert:
     1. GET <base>/api/share/<id> → { websiteId, token }. <base> és el que va
        davant de /share/ en l'enllaç. L'enllaç curt de cloud.umami.is
        (/share/<id>) hui respon 404 a /api/share i el tauler viu a la regió
        /analytics/eu: es pregunta primer allí i, si diu 404, a l'arrel. Així
        un enllaç bo no deixa cap 404 roig a la consola del navegador.
     2. Amb x-umami-share-token i x-umami-share-context: 1 (sense qualsevol
        de les dues, 401), de <base>/api/websites/<websiteId>/: stats, active,
        pageviews per hora (Europe/Madrid) i metrics de rutes, de les últimes
        24 hores.
   Comprovat amb curl el 30-10-2026, preflight OPTIONS inclòs (204 amb
   access-control-allow-origin i allow-headers *). Res porta galetes ni
   referent, cap redirecció se seguix, i tot té temps límit i es pot avortar.
   Lectures de les respostes, també comprovades: stats porta nombres (les
   versions velles, { value }); pageviews porta l'hora de rellotge de la zona
   demanada (amb una Z que no és UTC) i omet les hores sense vistes; metrics
   de rutes compta visitants (sessions), no vistes. */
/* Tota la cadena (fitxa, preflight i lectura) en un sol temps límit. El
   30-10-2026, amb fibra, cloud.umami.is va tardar fins a 1,9 s en la fitxa,
   4,2 s en un preflight i 2,6 s en una lectura: 8 s ja no hi cabien. La peça
   va davall del plec i no bloqueja res. */
const TEMPS_LIMIT_TAULER_MS = 20000;
const FINESTRA_MS = 24 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
const ZONA_HORARIA = 'Europe/Madrid';
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

function motiuDelTaulerEnParaules({ motiu, status }) {
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

/** Una sèrie de /pageviews ([{ x, y }]) sumada per hora de rellotge («2026-10-30T03»). */
function sumaPerHora(punts) {
  const perHora = new Map();
  for (const punt of punts) {
    const clau = String(punt?.x ?? '').replace(' ', 'T').slice(0, 13);
    if (CLAU_HORARIA.test(clau) && esXifra(punt.y)) perHora.set(clau, (perHora.get(clau) || 0) + punt.y);
  }
  return perHora;
}

/**
 * Les 24 hores que acaben en `fins`, en hora de rellotge de la zona, amb les
 * vistes (pageviews) i els visitants (sessions) de /pageviews; les hores que
 * el comptador no porta valen 0. Sense `sessions` (versions velles),
 * visitants és null. Etiqueta «03:00 h»; la marca de l'eix, cada 6 hores.
 * Ordre del Mestre (31-10-2026, 00:20): les dues sèries a la gràfica.
 */
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
    if (posades.has(clau)) continue; // l'hora repetida del canvi d'horari d'octubre
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

/* Gauntlet f6 (31-10-2026, T3.1-rutes-de-tercers-sense-filtre) · El
   comptador és públic: el websiteId va al bundle i /api/send no demana res,
   de manera que qualsevol li pot enviar rutes. Només es pinta, en <code>, la
   que té la forma que tapa telemetria.js (rutaTapada: /tram o /tram/*) i un
   primer tram que sabem nomenar (nomsDeLaRuta), mai el d'una identitat
   fundacional (/javillinares…): eixes, el nostre client les envia com a
   /perfil/*. La resta només es compta, sense mostrar-ne el text. */
const FORMA_TAPADA = /^\/(?:[a-z0-9-]{1,40}(?:\/\*)?)?$/;
const TRAMS_PERSONALS = new Set(CLAUS_FUNDACIONALS.map((clau) => String(clau).toLowerCase()));

function esRutaDelTauler(ruta) {
  if (!FORMA_TAPADA.test(ruta)) return false;
  const primer = ruta.split('/')[1];
  return !TRAMS_PERSONALS.has(primer) && nomsDeLaRuta(ruta) !== null;
}

/**
 * Les rutes de /metrics?type=path (com a molt MAX_SECCIONS): { seccions, amagades },
 * amb seccions = [{ ruta, visitants }] de Sóc de Poble i amagades = quantes no es mostren.
 */
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

/**
 * Demana les xifres de les últimes 24 hores al tauler compartit. Mai
 * rebutja: torna { estat: 'dades', dades } o { estat: 'fallada', motiu[, status] }.
 * Sense /stats no hi ha tauler; si falta una altra peça, eixa peça diu que no
 * ha arribat. `signal` l'avorta des de fora (el component desmuntat).
 */
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
      if (resposta.motiu !== 'no-trobat') break; // només un 404 mira la regió següent
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

/* ─── Les xifres en paraules (format local; temps en minuts i segons) ─── */
const NOMBRE = new Intl.NumberFormat('ca-ES');
const PERCENTATGE = new Intl.NumberFormat('ca-ES', { style: 'percent', maximumFractionDigits: 0 });
const xifra = (valor) => NOMBRE.format(valor);
const ambUnitat = (valor, [una, moltes]) => `${xifra(valor)} ${valor === 1 ? una : moltes}`;
const ESPAI_DUR = String.fromCharCode(0xa0); // sense el caràcter en cru al codi

function tempsEnParaules(segons) {
  const total = Math.max(0, Math.round(segons));
  const minuts = Math.floor(total / 60);
  const resta = total % 60;
  /* Espais durs dins de cada parella: en una targeta estreta es parteix
     entre «20 min» i «25 s», mai davant de la unitat. */
  if (!minuts) return { curt: `${resta}${ESPAI_DUR}s`, llarg: ambUnitat(resta, ['segon', 'segons']) };
  return {
    curt: `${xifra(minuts)}${ESPAI_DUR}min ${resta}${ESPAI_DUR}s`,
    llarg: `${ambUnitat(minuts, ['minut', 'minuts'])} i ${ambUnitat(resta, ['segon', 'segons'])}`
  };
}

function horaDelTauler(instant) {
  try {
    return new Date(instant).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', timeZone: ZONA_HORARIA });
  } catch { return ''; }
}

const SENSE_VISITES = 'sense cap visita encara';

/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · Targetes KPI
   baixes: només etiqueta i xifra. Què vol dir cada xifra (`pista`) va fora
   de les caixes, a tota amplada i amb el cos de paràgraf de la pàgina. */
function targetesDe(dades) {
  const temps = dades.tempsMitja === null ? null : tempsEnParaules(dades.tempsMitja);
  return [
    {
      clau: 'visitants', nom: 'Visitants', valor: xifra(dades.visitants),
      pista: "navegadors diferents que han entrat (el mòbil i l'ordinador d'una mateixa persona en són dos)."
    },
    {
      clau: 'visites', nom: 'Visites', valor: xifra(dades.visites),
      pista: 'voltes que algú ha entrat. En una visita es poden obrir moltes pàgines.'
    },
    {
      clau: 'vistes', nom: 'Vistes', valor: xifra(dades.vistes),
      pista: 'pàgines obertes en total, sumant totes les visites.'
    },
    {
      clau: 'rebot', nom: 'Percentatge de rebot',
      valor: dades.rebot === null ? '—' : PERCENTATGE.format(dades.rebot),
      lector: dades.rebot === null ? SENSE_VISITES : null,
      pista: "visites que només han obert una pàgina i se n'han anat."
    },
    {
      clau: 'temps', nom: 'Temps mitjà de visita',
      valor: temps ? temps.curt : '—',
      lector: temps ? temps.llarg : SENSE_VISITES,
      pista: 'el que dura, de mitjana, cada visita.'
    }
  ];
}

/* Ordre del Mestre (31-10-2026, 00:20) · Visitants (sessions) i vistes
   (pageviews) de cada hora, amb el detall exacte en tocar o passar el
   ratolí: «03:00 h: 136 vistes · 9 visitants». */
function graficaDe(hores) {
  if (!hores) {
    return { titol: 'Vistes de cada hora, les últimes 24 hores (hora peninsular)', punts: null, falta: 'El comptador no ha tornat les vistes per hores.' };
  }
  const ambVisitants = hores.every((hora) => hora.visitants !== null);
  const series = ambVisitants
    ? [{ clau: 'visitants', nom: 'Visitants' }, { clau: 'vistes', nom: 'Vistes' }]
    : [{ clau: 'vistes', nom: 'Vistes' }];
  return {
    titol: `${ambVisitants ? 'Visitants i vistes' : 'Vistes'} de cada hora, les últimes 24 hores (hora peninsular)`,
    series,
    punts: hores.map(({ id, etiqueta, marca, vistes, visitants }) => ({ id, etiqueta, marca, valors: { vistes, visitants } })),
    destacat: hores[hores.length - 1]?.id ?? null,
    detall: ({ etiqueta, valors }) => [
      `${etiqueta}: ${ambUnitat(valors.vistes, ['vista', 'vistes'])}`,
      ...(ambVisitants ? [ambUnitat(valors.visitants, ['visitant', 'visitants'])] : [])
    ].join(' · '),
    buit: 'Cap vista en les últimes 24 hores.'
  };
}

/* Les seccions, una fila compacta cadascuna: el nom net de la secció
   (nomDeSeccio; Ordre del Mestre, 31-10-2026: sense «Visita a:», que el
   títol ja diu que són seccions visitades) i l'adreça tapada en <code>,
   visitants a la dreta i la barra de proporció. */
function ranquingDe({ seccions, rutesAmagades = 0 }) {
  const maxim = Math.max(0, ...(seccions || []).map((seccio) => seccio.visitants));
  const files = seccions === null ? null : [
    ...seccions.map(({ ruta, visitants }, i) => ({
      clau: `${ruta}-${i}`,
      nom: nomDeSeccio(ruta),
      codi: ruta,
      valor: ambUnitat(visitants, ['visitant', 'visitants']),
      proporcio: maxim > 0 ? visitants / maxim : 0
    })),
    ...(rutesAmagades
      ? [{ clau: 'altres', nom: 'Altres adreces, que no mostrem', valor: ambUnitat(rutesAmagades, ['adreça', 'adreces']) }]
      : [])
  ];
  return {
    titol: 'Les seccions més visitades',
    intro: "Quants visitants diferents han passat per cada part de Sóc de Poble. Només s'hi mostren adreces de Sóc de Poble i tapades: mai diuen quina fitxa, nota o fil.",
    files,
    falta: 'El comptador no ha tornat la llista de seccions.',
    buit: 'Cap secció visitada en les últimes 24 hores.',
    nota: rutesAmagades && files ? (
      <p>
        Les «altres adreces»: el comptador és públic i qualsevol li pot enviar adreces. Estes no són rutes de
        Sóc de Poble que sapiem nomenar, o dirien de qui és una fitxa: per això no les copiem ací.
      </p>
    ) : null
  };
}

/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · El tauler pinta
   amb el Quadre de Comandament de Pedra Seca (PedraSeca, QuadreDeComandament;
   estils a src/css/taulers.css), el motlle compacte que també han de fer
   servir la Consola, la Gestoria i el TPV o la Botiga. */
function TaulerNadiu({ dades, shareUrl }) {
  const targetes = targetesDe(dades);
  return (
    <QuadreDeComandament
      nivell={5}
      estat={{
        viu: dades.enLinia !== null && dades.enLinia > 0,
        text: dades.enLinia === null
          ? 'En línia ara mateix: el comptador no ho ha dit'
          : <>En línia ara mateix: <strong>{ambUnitat(dades.enLinia, ['persona', 'persones'])}</strong></>
      }}
      periode={`Les xifres de les últimes 24 hores, fins a les ${horaDelTauler(dades.fins)} (hora peninsular).`}
      xifres={targetes.map(({ clau, nom, valor, lector }) => ({ clau, nom, valor, lector }))}
      explicacio={(
        <ul className="sdp-telemetria__punts">
          {targetes.map(({ clau, nom, pista }) => <li key={clau}><strong>{nom}</strong>: {pista}</li>)}
        </ul>
      )}
      grafica={graficaDe(dades.hores)}
      ranquing={ranquingDe(dades)}
      peu={(
        <p className="sdp-telemetria__nota">
          Les xifres les servix el comptador públic ({servidorDe(shareUrl)}). Esta pàgina només les
          ordena, calcula el rebot i el temps mitjà amb les fórmules del tauler original, i no en guarda
          cap. Per a demanar-les, el teu navegador s'hi ha connectat sense galetes ni cap dada teua, i eixe
          servidor veu la teua adreça IP, com en qualsevol connexió.{' '}
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">Obri el tauler original en una pestanya nova</a>
        </p>
      )}
    />
  );
}

function fetchDelNavegador() {
  return typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? (...parametres) => window.fetch(...parametres)
    : null;
}

function sabMirarSiEsVeu() {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
}

/* La mateixa lectura que telemetriaApagada() (data/telemetria.js:63-64). El
   contracte no l'exporta a banda, i ací cal separar-la de la tria local per a
   dir la veritat: el senyal del navegador no el pot desfer este interruptor. */
function senyalDelNavegador() {
  try {
    const nav = window.navigator || {};
    if (nav.globalPrivacyControl === true) return 'Global Privacy Control';
    if (nav.doNotTrack === '1' || window.doNotTrack === '1') return 'Do Not Track';
  } catch { /* navegador sense eixes propietats */ }
  return null;
}

function triaLocal() {
  return Boolean(getPreferenciaLlegat(CLAU_APAGADA));
}

function llegixPreferencia() {
  return { apagada: telemetriaApagada(), senyal: senyalDelNavegador(), local: triaLocal() };
}

function hora(moment) {
  const data = new Date(moment);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function dadesEnText(dades) {
  return Object.entries(dades).map(([clau, valor]) => `${clau}: ${valor}`).join(' · ');
}

function servidorDe(url) {
  try { return new URL(url).host; } catch { return ''; }
}

export default function TaulerTelemetria({
  config = CONFIG_COMPILADA, fetchTauler, tempsLimitTaulerMs = TEMPS_LIMIT_TAULER_MS, ara
}) {
  const id = useId();
  const seccioRef = useRef(null);
  const [preferencia, setPreferencia] = useState(llegixPreferencia);
  const [triaFallida, setTriaFallida] = useState(false);
  const [enviaments, setEnviaments] = useState(darrersEnviaments);
  const shareUrl = config.shareUrl;
  const adrecaTauler = shareUrl && basesDelTauler(shareUrl) ? shareUrl : '';
  /* La consulta al comptador espera que esta peça es veja: obrir /legal no
     connecta amb el comptador si no s'hi arriba. */
  const [aprop, setAprop] = useState(() => !sabMirarSiEsVeu());
  const [tauler, setTauler] = useState({ per: null, resultat: null });

  useEffect(() => {
    const refresca = () => setEnviaments(darrersEnviaments());
    window.addEventListener(ESDEVENIMENT_DOM, refresca);
    refresca(); // el que haja arribat entre el primer pintat i l'escolta
    return () => window.removeEventListener(ESDEVENIMENT_DOM, refresca);
  }, []);

  useEffect(() => {
    if (aprop || !adrecaTauler || !seccioRef.current) return undefined;
    const observador = new window.IntersectionObserver((entrades) => {
      if (entrades.some((entrada) => entrada.isIntersecting)) {
        observador.disconnect();
        setAprop(true);
      }
    });
    observador.observe(seccioRef.current);
    return () => observador.disconnect();
  }, [aprop, adrecaTauler]);

  useEffect(() => {
    if (!aprop || !adrecaTauler) return undefined;
    let viu = true;
    const desmunta = typeof AbortController === 'function' ? new AbortController() : null;
    carregaTauler(shareUrl, {
      fetch: fetchTauler || fetchDelNavegador(),
      tempsLimitMs: tempsLimitTaulerMs,
      signal: desmunta?.signal,
      ara
    }).then((resultat) => { if (viu) setTauler({ per: shareUrl, resultat }); });
    return () => { viu = false; desmunta?.abort(); };
  }, [aprop, adrecaTauler, shareUrl, fetchTauler, tempsLimitTaulerMs, ara]);

  let estatTauler = 'carregant';
  if (!shareUrl) estatTauler = 'sense-enllac';
  else if (!adrecaTauler) estatTauler = 'fallada';
  else if (tauler.per === shareUrl) estatTauler = tauler.resultat?.estat === 'dades' ? 'dades' : 'fallada';
  const motiuTauler = adrecaTauler ? (tauler.resultat || {}) : { motiu: 'enllac-no-compartit' };

  const canviaTria = (encesa) => {
    setTriaFallida(!estableixTelemetriaApagada(!encesa));
    setPreferencia(llegixPreferencia());
  };

  return (
    <section ref={seccioRef} className="sdp-telemetria" aria-labelledby={`${id}-titol`}>
      <h3 id={`${id}-titol`}>Telemetria: què comptem i com ho pots comprovar</h3>
      <p>
        A <strong>Sóc de Poble</strong> comptem les visites i l'acte de «Connectar» amb un comptador <strong>Umami</strong>. Per a comptar <strong>no carreguem cap programa extern</strong> de rastreig comercial: el codi de la mateixa aplicació inicia la petició, i més avall pots vore en directe els intents de comptar d'este navegador.
      </p>

      <h4>Què es compta i què no</h4>
      <ul className="sdp-telemetria__punts">
        <li>
          <strong>Les visites</strong>, per ruta: sense res del que va darrere de «?» o de «#», i amb un
          asterisc en lloc de la part que identifica una fitxa, un perfil o un fil (<code>/perfil/*</code>).
        </li>
        <li>
          <strong>Quan prems «Connectar»</strong>: l'acte, la secció on eres, si ho has fet des d'una
          targeta o des d'una pàgina (i si era una previsualització), i la ruta tapada igual que les
          visites. Quan després confirmes on el guardes, es compta el destí triat (notes, xat…) i si és
          privat o públic.
        </li>
        <li>
          <strong>Amb cada compte viatja també</strong> el domini de la web, l'idioma del navegador, la mida
          de la pantalla i, només en la primera visita, el domini de la web d'on vens (mai la pàgina
          concreta). El títol de la pestanya no viatja: en una fitxa porta el títol del que mires.
        </li>
        <li>
          <strong>Cap galeta (zero cookies)</strong> i cap identificador guardat al teu navegador. Com en qualsevol
          connexió a internet, el servidor del comptador veu la teua adreça IP i el tipus de navegador.
        </li>
        <li>
          <strong>Es respecten Do Not Track i Global Privacy Control</strong>: si el teu navegador en porta
          algun d'encés, no s'envia res.
        </li>
      </ul>

      <h4>Apagar-la en este navegador</h4>
      <Interruptor
        etiqueta="Comptar les meues visites des d'este navegador"
        actiu={!preferencia.apagada}
        desactivat={Boolean(preferencia.senyal)}
        onCanvi={canviaTria}
      />
      {preferencia.senyal ? (
        <Alerta to="info">
          El teu navegador envia el senyal {preferencia.senyal} i el respectem: no s'envia res. Este
          interruptor no el pot desfer; es canvia als ajustos del navegador.
        </Alerta>
      ) : (
        <p className="sdp-telemetria__nota">
          {preferencia.local ? 'Apagada per tu. La tria es guarda' : "Encesa. Si l'apagues, la tria es guardarà"}
          {' '}només en este navegador, en l'emmagatzematge local amb la clau{' '}
          <code>{CLAU_APAGADA}</code>, la mateixa que respecta Umami.
        </p>
      )}
      {triaFallida ? (
        <Alerta to="error">
          No s'ha pogut guardar la tria: este navegador no deixa escriure en l'emmagatzematge local.
        </Alerta>
      ) : null}
      {config.actiu ? null : (
        <p className="sdp-telemetria__nota">
          Este node encara no té cap comptador propi configurat: ara com ara no s'envia res a cap
          comptador de Sóc de Poble.
        </p>
      )}

      <h4>Tauler públic</h4>
      <p className="sdp-telemetria__nota">
        <strong>Transparència radical:</strong> si les mètriques d'ús són col·lectives i respecten la privacitat, han de ser visibles per a tothom. Ací baix tens les xifres del comptador públic, sense entrar enlloc i sense cap compte.
      </p>
      {estatTauler === 'dades' ? <TaulerNadiu dades={tauler.resultat.dades} shareUrl={shareUrl} /> : null}
      {estatTauler === 'carregant' ? (
        <Carregant etiqueta="Demanant les xifres al comptador públic…" />
      ) : null}
      {estatTauler === 'fallada' ? (
        <EstatBuit titol="El tauler públic no està obert ara mateix">
          {motiuDelTaulerEnParaules(motiuTauler)} Per això no el mostrem: per a vore estes xifres mai et
          demanarem cap compte, cap contrasenya ni cap inici de sessió. Quan el comptador torne a tindre un
          enllaç públic, les xifres es veuran ací, servides per ell mateix; fins aleshores no en posem
          d'inventades.
          {adrecaTauler ? ` Ho ha comprovat el teu navegador preguntant a ${servidorDe(shareUrl)}, que veu la teua adreça IP com en qualsevol connexió.` : null}
        </EstatBuit>
      ) : null}
      {estatTauler === 'sense-enllac' ? (
        <EstatBuit titol="El tauler públic encara no està endollat">
          Quan este node tinga un comptador amb enllaç públic, les xifres es veuran ací, servides pel mateix
          comptador. Fins aleshores no n'hi ha cap: no en posem d'inventades.
        </EstatBuit>
      ) : null}

      <h4>Què s'ha apuntat de la teua visita d'hui (en directe)</h4>
      <p className="sdp-telemetria__nota">
        Ací baix pots comprovar, en directe, tot el que aquesta pestanya ha anotat mentre camines per Sóc de
        Poble (fins als últims 20 passos). Fixa't que només s'apunta a quina secció general has entrat (com
        ara «Disseny», «El Mur» o «Bloc de notes»), sense guardar mai qui eres, ni el teu correu, ni què has
        llegit o escrit dins. Si apagues l'interruptor de dalt, ací mateix veuràs que ja no s'envia res.
      </p>
      <p className="sdp-telemetria__nota">
        Una precisió honesta: esta llista diu el que este navegador ha intentat enviar, però no pot comprovar
        si el comptador ho ha rebut. I viu només en la memòria d'esta pestanya: quan la tanques, s'esborra.
      </p>
      {enviaments.length ? (
        <ol className="sdp-telemetria__llista">
          {enviaments.map((intent, i) => (
            <li key={`${intent.moment}-${intent.tipus}-${intent.nom}-${intent.url}-${i}`} className="sdp-telemetria__intent">
              <p className="sdp-telemetria__cap">
                <span className="sdp-telemetria__nom">{nomDeLIntent(intent)}</span>
                <time className="sdp-telemetria__moment" dateTime={intent.moment}>{hora(intent.moment)}</time>
              </p>
              <p className="sdp-telemetria__estat">{estatEnParaules(intent)}</p>
              <p className="sdp-telemetria__dades">
                Adreça tècnica: <code className="sdp-telemetria__ruta">{intent.url}</code>
              </p>
              {intent.dades ? (
                <p className="sdp-telemetria__dades">
                  Detall tècnic que l'acompanya: <span>{dadesEnText(intent.dades)}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="sdp-telemetria__nota">Encara no s'ha intentat comptar res en esta pestanya.</p>
      )}
    </section>
  );
}

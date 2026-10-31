/**
 * MapaFotografic.jsx — el Mapa Fotogràfic del Mur (P1-64), del poble al món.
 *
 * Pla 261028_1526 §3.7.1 (Bloc G) i decisions 1 i 9 del Mestre (261028).
 * MurSection el carrega en diferit (React.lazy) només quan s'obri la pestanya
 * «Mapa», i Leaflet 1.9.4 arriba amb un import() dins d'un efecte: cap byte
 * del mapa viatja amb el Mur fins que es demana. El full de Leaflet i el propi
 * (MapaFotografic.css) s'adopten a l'arrel on es munta (el document o el
 * shadow root de <soc-de-poble>), amb la regla d'aplicaEstil.js.
 *
 * QUÈ ES VEU
 *   · Els punts i les targetes, sempre, sobre un fons neutre i amb el nom dels
 *     pobles de la llavor. El fons detallat d'OpenStreetMap només quan es prem
 *     «Vore mapa» (aria-pressed; passa a «Ocultar mapa»): abans, cap petició
 *     de tessel·les. La tria es recorda en este navegador. L'atribució d'OSM
 *     es veu sempre. A l'app nativa, el botó no hi és (decisió 9: fins a
 *     provar-ho al simulador).
 *   · Tres nivells (modeDelMapa): grups (targetes amb número, nom, fins a tres
 *     miniatures, parades i fotos, dates; vora ocre si alguna foto no porta
 *     GPS), parades (del zoom 13 al 15 en automàtic) i foto a foto (des del
 *     16, sempre: cada foto en el seu punt, amb el recorregut de cada
 *     publicació, mai entre publicacions).
 *   · «Agrupació per distància»: el lliscador dels deu llindars i «Segons el
 *     zoom». Mai no canvia el zoom ni l'encuadrament.
 *   · Les targetes s'arrosseguen (el mapa no es mou) i una línia discontínua
 *     les lliga al seu punt fix; Alt + fletxes les mou des del teclat.
 *     «Recol·locar grups» oblida les posicions desades.
 *   · El títol de la zona ix de nomDeLaZona amb els pobles de la llavor: cap
 *     coordenada de cap foto no ix de l'aparell per a posar-hi nom.
 *
 * SEGURETAT · Les targetes es fan amb nodes del DOM i textContent: un títol
 * o un nom de lloc mai no es llig com a HTML. Les miniatures només són de fonts
 * pròpies (puntsDelMapa). Cap color al codi: classes i tokens.
 *
 * Una fallada (Leaflet que no carrega, un error de pintura) puja a la barrera
 * de MurSection, que torna al mapa de sempre.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import estilDeLeaflet from 'leaflet/dist/leaflet.css?inline';
import estilDelMapa from './MapaFotografic.css?inline';
import { Boto, VisorImatges } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { getPreferenciaLlegat, setPreferenciaLlegat } from '../../config/storage.js';
import { resolveAsset as resolDelPort } from '../../data/backendPort.js';
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { LIMITS_DEL_POBLE, MAPA_INICI, TESSELES } from './mapConfig.js';
import {
  GUIONS, ZOOM_FOTO_A_FOTO, ZOOM_PARADES, ajudaDelLliscador, arbreDAgrupacio, caixaLliure, centreDelGrup, clauDeContingut,
  clauDelConjunt, etiquetaDistancia, formataDia, formataHora, indexDelLlindar, llindarDelLliscador, llindarDelZoom,
  modeDelMapa, nomDeLaZona, nomDelGrup, omplix, puntDeLaVora, solapen, tallaArbre, tonDeLaUbicacio
} from './mapaFotografic.js';
import { puntsDelMapa } from './puntsDelMapa.js';

const PANELL_POBLES = 'sdpMapaPobles';
const PANELL_TARGETES = 'sdpMapaTargetes';
const PANELL_PUNTS = 'sdpMapaPunts';
/* Damunt de les capes de Leaflet (400) i davall dels controls (800): els punts
   sempre per damunt de les targetes, que mai no amaguen un lloc. */
const ORDRE_DELS_PANELLS = Object.freeze([[PANELL_POBLES, 450], [PANELL_TARGETES, 610], [PANELL_PUNTS, 620]]);
const GESTOS_DEL_MAPA = Object.freeze(['dragging', 'touchZoom', 'doubleClickZoom', 'scrollWheelZoom', 'boxZoom', 'keyboard']);
/* Les mides de les targetes (les mateixes del CSS: cada botó, 48 px). */
const MIDA_GRUP = Object.freeze({ w: 192, h: 168 });
const MIDA_FOTO = Object.freeze({ w: 224, h: 80 });
const MAX_TARGETES_DE_FOTO = 60;
const ZOOM_AMB_HORA = 15;
const ZOOM_AMB_POBLES = 10;
const RETARD_DEL_FONS_MS = 12000;
const LLINDAR_D_ARROSSEGAR_PX = 4;
const PAS_DEL_TECLAT_PX = 20;
const BLOQUEIG_DEL_CLIC_MS = 350;
const FARCIMENT = Object.freeze([48, 48]);
/* Este navegador: si es vol el fons d'OSM i on s'han deixat les targetes. */
const CLAU_DEL_FONS = 'sdp-mapa-fons';
const CLAU_DE_POSICIONS = 'sdp-mapa-posicions-v1';
const MAX_POSICIONS = 300;
const DECIMALS_DE_LA_PRECISIO = Object.freeze({ exacta: 5, '100m': 3, poble: 2 });
/* Com diu cada targeta de foto que el seu lloc no és el GPS (no només pel
   color): una paraula a la targeta i la frase sencera al seu nom accessible. */
const ETIQUETES_DE_L_ESTAT = Object.freeze({
  estimada: Object.freeze(['section.mur.mapa.ubicacio.estimada', 'estimada']),
  poble: Object.freeze(['section.mur.mapa.ubicacio.poble', 'al poble']),
  indicada: Object.freeze(['section.mur.mapa.ubicacio.indicada', 'indicada'])
});
const FRASES_DE_L_ESTAT = Object.freeze({
  estimada: Object.freeze(['section.mur.mapa.origen.estimadaCurta', 'ubicació estimada per una altra foto de la publicació']),
  poble: Object.freeze(['section.mur.mapa.origen.pobleCurta', 'posada al centre del poble: la foto no porta GPS']),
  indicada: Object.freeze(['section.mur.mapa.origen.indicadaCurta', 'ubicació indicada per l’autor'])
});
/* Un GPS de veres però arrodonit per l'autor continua verd: la targeta en diu
   la precisió, perquè des del zoom 16 el punt no sembla més exacte del que és. */
const PRECISIONS_DE_LA_TARGETA = Object.freeze({
  '100m': Object.freeze(['section.mur.mapa.precisio.centCurta', 'GPS a uns 100 m']),
  poble: Object.freeze(['section.mur.mapa.precisio.pobleCurta', 'GPS només del poble'])
});
const FLETXES = Object.freeze({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] });

/* ═══ L'EMMAGATZEMATGE D'ESTE NAVEGADOR (sempre dins d'un try) ═════
   CL-08 · Passa per la capa única de config/storage.js (porta Persistència
   L2). Les claus són les de sempre, sense prefix: la política de privacitat
   les nomena (legalContent.js) i canviar-les faria perdre la tria desada. */

function llegixFons() {
  return getPreferenciaLlegat(CLAU_DEL_FONS) === '1';
}

function desaFons(actiu) {
  /* Sense emmagatzematge, setPreferenciaLlegat torna false i la tria dura la visita. */
  setPreferenciaLlegat(CLAU_DEL_FONS, actiu ? '1' : null);
}

const esDesplacament = (valor) => Array.isArray(valor) && valor.length === 2 && valor.every(Number.isFinite);

function llegixPosicions(conjunt) {
  try {
    const desat = JSON.parse(getPreferenciaLlegat(CLAU_DE_POSICIONS) || 'null');
    if (!desat || desat.conjunt !== conjunt || !desat.posicions || typeof desat.posicions !== 'object') return {};
    return Object.fromEntries(Object.entries(desat.posicions).filter(([, valor]) => esDesplacament(valor)).slice(-MAX_POSICIONS));
  } catch {
    return {};
  }
}

function desaPosicions(conjunt, posicions) {
  try {
    const entrades = Object.entries(posicions).slice(-MAX_POSICIONS);
    setPreferenciaLlegat(CLAU_DE_POSICIONS, entrades.length ? JSON.stringify({ conjunt, posicions: Object.fromEntries(entrades) }) : null);
  } catch { /* sense emmagatzematge, les posicions duren la visita */ }
}

/* ═══ ELS FULLS: el de Leaflet i el del mapa, una vegada per arrel ══ */

const ARRELS_AMB_FULL = new WeakSet();

function adoptaFulls(element) {
  const arrel = (typeof element?.getRootNode === 'function' ? element.getRootNode() : null) || document;
  if (ARRELS_AMB_FULL.has(arrel)) return;
  const css = `${estilDeLeaflet}\n${estilDelMapa}`;
  const potAdoptar = typeof CSSStyleSheet === 'function' && typeof CSSStyleSheet.prototype.replaceSync === 'function'
    && 'adoptedStyleSheets' in arrel;
  if (potAdoptar) {
    try {
      const full = new CSSStyleSheet();
      full.replaceSync(css);
      arrel.adoptedStyleSheets = [...Array.from(arrel.adoptedStyleSheets), full];
      ARRELS_AMB_FULL.add(arrel);
      return;
    } catch { /* un amfitrió que trenca adoptedStyleSheets: el <style> de recurs */ }
  }
  const doc = element?.ownerDocument || document;
  const node = doc.createElement('style');
  node.setAttribute('data-sdp-mapa', '');
  node.textContent = css;
  const esOmbra = arrel.nodeType === 11 && typeof arrel.appendChild === 'function';
  (esOmbra ? arrel : (doc.head || doc.documentElement)).appendChild(node);
  ARRELS_AMB_FULL.add(arrel);
}

function movimentReduit() {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

/* ═══ ELS NODES DE LES TARGETES (sempre textContent) ═══════════════ */

function node(etiqueta, classe, text) {
  const element = document.createElement(etiqueta);
  if (classe) element.className = classe;
  if (text !== undefined && text !== null) element.textContent = String(text);
  return element;
}

function boto(classe, etiqueta) {
  const element = node('button', classe);
  element.type = 'button';
  element.setAttribute('aria-label', etiqueta);
  return element;
}

/* Revisió adversarial 261028 (D3) · Una pujada (sdp-media://) és una referència
   opaca: només el port la convertix en URL, com ImatgeDePortada (PageFrame). Mentre es
   resol, o si falla, no es demana cap imatge; mai es pinta la referència crua. */
const urlsDelPort = new Map();
const VIDA_DE_LA_URL_MS = 10 * 60 * 1000; // una URL signada caduca: es torna a demanar
function urlDeMiniatura(src) {
  if (!esMitjaOpac(src)) return Promise.resolve(src);
  const ref = src.trim();
  const desada = urlsDelPort.get(ref);
  if (desada && Date.now() - desada.quan < VIDA_DE_LA_URL_MS) return desada.promesa;
  const promesa = Promise.resolve()
    .then(() => resolDelPort(ref))
    .then((url) => (typeof url === 'string' && !esMitjaOpac(url) && isSafeAsset(url) ? url : null))
    .catch(() => null)
    .then((url) => { if (!url) urlsDelPort.delete(ref); return url; });
  urlsDelPort.set(ref, { promesa, quan: Date.now() });
  return promesa;
}

function miniatura(src) {
  const img = node('img');
  if (esMitjaOpac(src)) {
    img.hidden = true;
    urlDeMiniatura(src).then((url) => { if (url) { img.src = url; img.hidden = false; } });
  } else {
    img.src = src;
  }
  img.alt = '';
  img.draggable = false;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

/* El dia (o els dies) de les fotos d'un grup, i l'hora de la primera si cal. */
function diesDe(fotos, ambHora = false) {
  const datades = fotos.filter((foto) => foto.dataCaptura);
  if (!datades.length) return '';
  const primer = formataDia(datades[0].dataCaptura);
  const darrer = formataDia(datades[datades.length - 1].dataCaptura);
  const hora = ambHora ? formataHora(datades[0].dataCaptura) : '';
  const dies = primer === darrer ? primer : `${primer} – ${darrer}`;
  return hora ? `${dies} · ${hora}` : dies;
}

/* ═══ EL MOTOR: Leaflet, fora de React ═════════════════════════════ */

function creaMotor({ L, element, tr: traductor, enVista, enAvisDelFons, enObriFotos, enError }) {
  const reduit = movimentReduit();
  const mapa = L.map(element, {
    minZoom: 2, maxZoom: TESSELES.maxZoom, zoomControl: true, attributionControl: true,
    zoomAnimation: !reduit, fadeAnimation: !reduit, markerZoomAnimation: !reduit, inertia: !reduit
  });
  mapa.setView([MAPA_INICI.lat, MAPA_INICI.lng], MAPA_INICI.zoom, { animate: false });
  // L'atribució d'OpenStreetMap, també sense tessel·les (decisió 9).
  mapa.attributionControl.addAttribution(TESSELES.atribucio);
  // Els controls (+, − i l'atribució) abans de les targetes en l'ordre del teclat: van en posició absoluta, i a la vista no canvia res.
  const controls = element.querySelector('.leaflet-control-container');
  if (controls) element.insertBefore(controls, element.firstChild);
  for (const [nom, ordre] of ORDRE_DELS_PANELLS) mapa.createPane(nom).style.zIndex = String(ordre);
  const capa = L.layerGroup().addTo(mapa);
  const pobles = L.layerGroup(MOCK_TOWNS.filter((poble) => Number.isFinite(poble.lat) && Number.isFinite(poble.lng)).map((poble) => {
    const rotul = node('span', null, poble.title);
    return L.marker([poble.lat, poble.lng], {
      pane: PANELL_POBLES, interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'sdp-mapa-poble', html: rotul, iconSize: null, iconAnchor: [0, 8] })
    });
  }));

  let tr = traductor;
  let dades = { fotos: [], parades: [], pendents: [] };
  let arbre = arbreDAgrupacio([]);
  let talls = new Map();
  let conjunt = '';
  let posicions = {};
  let llindarManual = null;
  let gest = null;
  let ultimArrossegament = 0;
  let pendent = null;
  let tesseles = null;
  let tesselesCarregades = 0;
  let errorsDeTesseles = 0;
  let rellotgeDelFons = null;
  let destruit = false;

  const tall = (km) => {
    if (!talls.has(km)) talls.set(km, tallaArbre(arbre, km));
    return talls.get(km);
  };
  const enPantalla = (punt) => mapa.latLngToContainerPoint([punt.lat, punt.lng]);
  const fotosDe = (indexs) => indexs.map((index) => dades.fotos[index]).filter(Boolean);

  function obri(indexs, foto) {
    const ambMiniatura = fotosDe(indexs).filter((f) => f.miniatura);
    const posicio = ambMiniatura.findIndex((f) => f.id === foto.id);
    if (posicio >= 0) enObriFotos(ambMiniatura.map((f) => f.id), posicio);
  }

  /* ── Arrossegar una targeta: només la targeta, mai el mapa ── */
  function lligaArrossegament({ marcador, targeta, enMoure, enDeixar }) {
    L.DomEvent.disableClickPropagation(targeta);
    L.DomEvent.disableScrollPropagation(targeta);
    targeta.addEventListener('dragstart', (event) => event.preventDefault());
    targeta.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || gest) return;
      event.stopPropagation();
      mapa.stop();
      const apagats = GESTOS_DEL_MAPA.filter((nom) => mapa[nom]?.enabled());
      apagats.forEach((nom) => mapa[nom].disable());
      // La captura, al botó que s'ha premut: el clic de veres hi continua arribant.
      const objectiu = event.target?.closest?.('button') || targeta;
      gest = { marcador, id: event.pointerId, x: event.clientX, y: event.clientY, punt: mapa.latLngToContainerPoint(marcador.getLatLng()), apagats, mogut: false, objectiu };
      try { objectiu.setPointerCapture?.(event.pointerId); } catch { /* un punter que ja no hi és */ }
    });
    targeta.addEventListener('pointermove', (event) => {
      if (!gest || gest.marcador !== marcador || gest.id !== event.pointerId) return;
      event.stopPropagation();
      const dx = event.clientX - gest.x;
      const dy = event.clientY - gest.y;
      if (Math.hypot(dx, dy) > LLINDAR_D_ARROSSEGAR_PX) gest.mogut = true;
      if (!gest.mogut) return;
      event.preventDefault();
      marcador.setLatLng(mapa.containerPointToLatLng(L.point(gest.punt.x + dx, gest.punt.y + dy)));
      enMoure();
    });
    const acaba = (event) => {
      if (!gest || gest.marcador !== marcador || gest.id !== event.pointerId) return;
      event.stopPropagation();
      const acabat = gest;
      gest = null;
      if (acabat.mogut) {
        ultimArrossegament = Date.now();
        enDeixar();
      }
      acabat.apagats.forEach((nom) => mapa[nom].enable());
      try {
        if (acabat.objectiu.hasPointerCapture?.(event.pointerId)) acabat.objectiu.releasePointerCapture(event.pointerId);
      } catch { /* ja alliberada */ }
    };
    for (const nom of ['pointerup', 'pointercancel', 'lostpointercapture']) targeta.addEventListener(nom, acaba);
    // Un arrossegament no obri cap foto ni acosta el mapa.
    targeta.addEventListener('click', (event) => {
      if (Date.now() - ultimArrossegament < BLOQUEIG_DEL_CLIC_MS) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    targeta.addEventListener('keydown', (event) => {
      const fletxa = FLETXES[event.key];
      if (!event.altKey || !fletxa) return;
      event.preventDefault();
      event.stopPropagation();
      const punt = mapa.latLngToContainerPoint(marcador.getLatLng());
      marcador.setLatLng(mapa.containerPointToLatLng(L.point(punt.x + fletxa[0] * PAS_DEL_TECLAT_PX, punt.y + fletxa[1] * PAS_DEL_TECLAT_PX)));
      enMoure();
      enDeixar();
    });
  }

  /* Una targeta al mapa: a la seua caixa, lligada al punt fix per la línia.
     Una que queda sencera fora del mapa (es pinten fins a un 25 % més enllà
     de la vora) no entra en l'ordre del teclat: el focus mai no va on no es veu. */
  function afigTargeta({ targeta, caixa, mida, origen, linia, clau }) {
    targeta.dataset.clau = clau;
    const { x: ample, y: alt } = mapa.getSize();
    if (!solapen(caixa, { x: 0, y: 0, w: ample, h: alt })) {
      const botons = targeta.tagName === 'BUTTON' ? [targeta] : [...targeta.querySelectorAll('button')];
      botons.forEach((botoDeFora) => { botoDeFora.tabIndex = -1; });
    }
    const marcador = L.marker(mapa.containerPointToLatLng(L.point(caixa.x, caixa.y)), {
      pane: PANELL_TARGETES, interactive: false, keyboard: false, autoPan: false,
      icon: L.divIcon({ className: 'sdp-mapa-icona', html: targeta, iconSize: [mida.w, mida.h], iconAnchor: [0, 0] })
    }).addTo(capa);
    const tiba = () => {
      const punt = mapa.latLngToContainerPoint(origen);
      const canto = mapa.latLngToContainerPoint(marcador.getLatLng());
      const vora = puntDeLaVora(punt, { x: canto.x, y: canto.y, w: mida.w, h: mida.h });
      linia.setLatLngs([origen, mapa.containerPointToLatLng(L.point(vora.x, vora.y))]);
    };
    tiba();
    lligaArrossegament({
      marcador, targeta, enMoure: tiba,
      enDeixar: () => {
        const punt = mapa.latLngToContainerPoint(origen);
        const canto = mapa.latLngToContainerPoint(marcador.getLatLng());
        posicions = { ...posicions, [clau]: [Math.round(canto.x - punt.x), Math.round(canto.y - punt.y)] };
        desaPosicions(conjunt, posicions);
        tiba();
      }
    });
  }

  function caixaDe(clau, origen, mida, ocupades, punts) {
    const desada = posicions[clau];
    if (desada) return { x: Math.round(origen.x + desada[0]), y: Math.round(origen.y + desada[1]), w: mida.w, h: mida.h };
    const { x: w, y: h } = mapa.getSize();
    return caixaLliure({ origen, mida, ocupades, punts, limits: { w, h } });
  }

  const linia = (desde, ton) => L.polyline([desde, desde], {
    weight: 1, dashArray: GUIONS, interactive: false, className: `sdp-mapa-linia sdp-mapa-linia--${ton}`
  }).addTo(capa);

  const punt = (lloc, ton, { radi, grup = false, enClic = null }) => {
    const cercle = L.circleMarker(lloc, {
      pane: PANELL_PUNTS, radius: radi, weight: 2, fillOpacity: 1, interactive: Boolean(enClic),
      className: `sdp-mapa-punt sdp-mapa-punt--${ton}${grup ? ' sdp-mapa-punt--grup' : ''}`
    }).addTo(capa);
    if (enClic) cercle.on('click', enClic);
    return cercle;
  };

  /* La targeta d'un grup o d'una parada: el número i el nom (el botó de dalt),
     fins a tres miniatures i dues línies de dades. */
  function targetaDeConjunt({ numero, nom, fotos, linies, ocre, etiquetaDelCap, enCap, enMiniatura }) {
    const targeta = node('div', `sdp-mapa-targeta${ocre ? ' sdp-mapa-targeta--ocre' : ''}`);
    targeta.setAttribute('role', 'group');
    targeta.setAttribute('aria-label', `${numero} · ${nom}`);
    targeta.title = tr('section.mur.mapa.arrossega', 'Arrossega per a moure-la; prem per a vore les fotos. Amb el teclat, Alt + fletxes.');
    const cap = boto('sdp-mapa-targeta__cap', etiquetaDelCap);
    cap.dataset.rol = 'cap';
    cap.append(node('span', 'sdp-mapa-targeta__num', numero), node('span', 'sdp-mapa-targeta__nom', nom));
    cap.addEventListener('click', enCap);
    const tira = node('div', 'sdp-mapa-targeta__miniatures');
    fotos.filter((foto) => foto.miniatura).slice(0, 3).forEach((foto, posicio) => {
      const peca = boto('sdp-mapa-targeta__miniatura', tr('section.mur.mapa.obriFoto', 'Obri la foto {n} de {nom}', { n: foto.ordre, nom }));
      peca.dataset.rol = `miniatura-${posicio}`;
      peca.append(miniatura(foto.miniatura));
      peca.addEventListener('click', () => enMiniatura(foto));
      tira.append(peca);
    });
    targeta.append(cap, tira, ...linies.filter(Boolean).map((text) => node('p', 'sdp-mapa-targeta__meta', text)));
    return targeta;
  }

  const recompteDe = (parades, fotos) => [
    parades === 1 ? tr('section.mur.mapa.unaParada', '1 parada') : tr('section.mur.mapa.parades', '{n} parades', { n: parades }),
    fotos === 1 ? tr('section.mur.mapa.unaFoto', '1 foto') : tr('section.mur.mapa.fotos', '{n} fotos', { n: fotos })
  ].join(' · ');
  const senseLloc = () => tr('section.mur.mapa.llocSenseNom', 'Lloc sense nom');
  const precisioDe = (lloc) => (lloc?.estat === 'gps' && PRECISIONS_DE_LA_TARGETA[lloc.precisio] ? tr(...PRECISIONS_DE_LA_TARGETA[lloc.precisio]) : '');

  /* «Acosta el mapa» sempre acosta: el requadre del grup si hi cap en un zoom
     més gran (fins a max(13, z + 2)); si no (de lluny, «Tot junt» amb França
     i la Torre), dos zooms més a la seua primera parada. Un fitBounds sol, amb
     maxZoom, només posava sostre i podia allunyar o quedar-se igual. */
  function acosta(ids) {
    const parades = ids.map((id) => dades.parades[id]).filter(Boolean);
    if (!parades.length) return;
    const zoom = mapa.getZoom();
    const limits = L.latLngBounds(parades.map((parada) => [parada.lat, parada.lng]));
    if (mapa.getBoundsZoom(limits, false, L.point(FARCIMENT).multiplyBy(2)) > zoom) {
      mapa.fitBounds(limits, { padding: FARCIMENT, maxZoom: Math.min(ZOOM_FOTO_A_FOTO, Math.max(ZOOM_PARADES, zoom + 2)), animate: !reduit });
    } else {
      mapa.setView([parades[0].lat, parades[0].lng], Math.min(ZOOM_FOTO_A_FOTO, zoom + 2), { animate: !reduit });
    }
  }

  function pintaGrups(zoom) {
    const km = llindarManual ?? llindarDelZoom(zoom);
    const grups = tall(km);
    const limits = mapa.getBounds().pad(0.25);
    const visibles = grups.map((ids, index) => ({ ids, numero: index + 1, centre: centreDelGrup(dades.parades, ids) }))
      .filter((grup) => grup.centre && limits.contains([grup.centre.lat, grup.centre.lng]));
    const origens = visibles.map((grup) => enPantalla(grup.centre));
    const ocupades = [];
    const opcionsDelNom = {
      nomDeTot: tr('section.mur.mapa.totesLesFotos', 'Totes les fotos del Mur'),
      nomSenseLloc: senseLloc(),
      formataMes: (primer, n) => tr('section.mur.mapa.zonesMes', '{nom} · {n} zones més', { nom: primer, n })
    };
    visibles.forEach((grup, k) => {
      const indexs = grup.ids.flatMap((id) => dades.parades[id].fotos).sort((a, b) => a - b);
      const fotos = fotosDe(indexs);
      const ocre = grup.ids.some((id) => dades.parades[id].estimada);
      const clau = clauDeContingut(fotos.map((foto) => foto.id));
      const nom = nomDelGrup(grup.ids, dades.parades, opcionsDelNom) || senseLloc();
      const caixa = caixaDe(clau, origens[k], MIDA_GRUP, ocupades, origens);
      ocupades.push(caixa);
      const centre = L.latLng(grup.centre.lat, grup.centre.lng);
      punt(centre, ocre ? 'ocre' : 'verd', { radi: 4, grup: true });
      const targeta = targetaDeConjunt({
        numero: grup.numero, nom, fotos, ocre,
        linies: [recompteDe(grup.ids.length, fotos.length), diesDe(fotos)],
        etiquetaDelCap: tr('section.mur.mapa.acostaGrup', 'Zona {n}, {nom}: {recompte}. Acosta el mapa', {
          n: grup.numero, nom, recompte: `${recompteDe(grup.ids.length, fotos.length)}${ocre ? `, ${tr('section.mur.mapa.ambEstimades', 'amb fotos sense GPS')}` : ''}`
        }),
        enCap: () => acosta(grup.ids),
        enMiniatura: (foto) => obri(indexs, foto)
      });
      afigTargeta({ targeta, caixa, mida: MIDA_GRUP, origen: centre, linia: linia(centre, ocre ? 'ocre' : 'grup'), clau });
    });
    return { nodes: grups.length, km, visibles: visibles.length, amagades: 0 };
  }

  function pintaParades(zoom) {
    const limits = mapa.getBounds().pad(0.25);
    const visibles = dades.parades.map((parada, index) => ({ parada, numero: index + 1 }))
      .filter(({ parada }) => limits.contains([parada.lat, parada.lng]));
    const origens = visibles.map(({ parada }) => enPantalla(parada));
    const ocupades = [];
    for (const { parada } of visibles) {
      for (const index of parada.fotos) {
        const foto = dades.fotos[index];
        punt(L.latLng(foto.lat, foto.lng), tonDeLaUbicacio(foto.estat), { radi: 6, enClic: () => obri(parada.fotos, foto) });
      }
    }
    visibles.forEach(({ parada, numero }, k) => {
      const fotos = fotosDe(parada.fotos);
      const clau = clauDeContingut(fotos.map((foto) => foto.id));
      const nom = parada.lloc || parada.titol || senseLloc();
      const caixa = caixaDe(clau, origens[k], MIDA_GRUP, ocupades, origens);
      ocupades.push(caixa);
      const lloc = L.latLng(parada.lat, parada.lng);
      const fotosText = fotos.length === 1 ? tr('section.mur.mapa.unaFoto', '1 foto') : tr('section.mur.mapa.fotos', '{n} fotos', { n: fotos.length });
      const targeta = targetaDeConjunt({
        numero, nom, fotos, ocre: parada.estimada,
        linies: [parada.lloc ? parada.titol : '', [diesDe(fotos, zoom >= ZOOM_AMB_HORA), fotosText, precisioDe(parada)].filter(Boolean).join(' · ')],
        etiquetaDelCap: tr('section.mur.mapa.obriParada', 'Parada {n}, {nom}: obri les seues fotos', { n: numero, nom }),
        enCap: () => fotos[0] && obri(parada.fotos, fotos.find((foto) => foto.miniatura) || fotos[0]),
        enMiniatura: (foto) => obri(parada.fotos, foto)
      });
      afigTargeta({ targeta, caixa, mida: MIDA_GRUP, origen: lloc, linia: linia(lloc, 'targeta'), clau });
    });
    return { nodes: dades.parades.length, km: null, visibles: visibles.length, amagades: 0 };
  }

  function pintaFotos() {
    const limits = mapa.getBounds().pad(0.08);
    // El recorregut de cada publicació, en ordre de captura: mai entre publicacions ni pels carrers.
    const perPublicacio = new Map();
    for (const foto of dades.fotos) {
      if (!perPublicacio.has(foto.publicacio)) perPublicacio.set(foto.publicacio, []);
      perPublicacio.get(foto.publicacio).push([foto.lat, foto.lng]);
    }
    for (const llocs of perPublicacio.values()) {
      if (new Set(llocs.map((lloc) => lloc.join('|'))).size < 2) continue;
      L.polyline(llocs, { weight: 7, interactive: false, className: 'sdp-mapa-recorregut sdp-mapa-recorregut--halo' }).addTo(capa);
      L.polyline(llocs, { weight: 3, interactive: false, className: 'sdp-mapa-recorregut' }).addTo(capa);
    }
    const visibles = dades.fotos.map((foto, index) => ({ foto, index })).filter(({ foto }) => limits.contains([foto.lat, foto.lng]));
    const ambTargeta = visibles.slice(0, MAX_TARGETES_DE_FOTO);
    const origens = ambTargeta.map(({ foto }) => enPantalla(foto));
    const ocupades = [];
    for (const { foto } of visibles) {
      const parada = dades.parades[foto.parada];
      punt(L.latLng(foto.lat, foto.lng), tonDeLaUbicacio(foto.estat), { radi: 7, enClic: () => obri(parada?.fotos || [], foto) });
    }
    ambTargeta.forEach(({ foto }, k) => {
      const ton = tonDeLaUbicacio(foto.estat);
      const clau = clauDeContingut([foto.id]);
      const caixa = caixaDe(clau, origens[k], MIDA_FOTO, ocupades, origens);
      ocupades.push(caixa);
      const hora = formataHora(foto.dataCaptura);
      const dia = formataDia(foto.dataCaptura);
      const precisio = precisioDe(foto);
      const frase = [FRASES_DE_L_ESTAT[foto.estat] ? tr(...FRASES_DE_L_ESTAT[foto.estat]) : '', precisio].filter(Boolean).map((part) => `, ${part}`).join('');
      const targeta = boto(`sdp-mapa-foto sdp-mapa-foto--${ton}`, tr('section.mur.mapa.obriFotoSola', 'Obri la foto {n}{quan}', {
        n: foto.ordre, quan: `${dia ? `, ${dia}${hora ? ` ${hora}` : ''}` : ''}${frase}`
      }));
      targeta.dataset.rol = 'foto';
      const marc = node('span', 'sdp-mapa-foto__marc');
      if (foto.miniatura) {
        const img = miniatura(foto.miniatura);
        img.className = 'sdp-mapa-foto__miniatura';
        marc.append(img);
      }
      const text = node('span', 'sdp-mapa-foto__text');
      text.append(
        node('span', 'sdp-mapa-foto__num', hora ? `${foto.ordre} · ${hora}` : String(foto.ordre)),
        node('span', null, foto.titol || foto.lloc || senseLloc()),
        node('span', null, [dia, ETIQUETES_DE_L_ESTAT[foto.estat] ? tr(...ETIQUETES_DE_L_ESTAT[foto.estat]) : '', precisio].filter(Boolean).join(' · '))
      );
      targeta.append(marc, text);
      const parada = dades.parades[foto.parada];
      targeta.addEventListener('click', () => obri(parada?.fotos || [], foto));
      const lloc = L.latLng(foto.lat, foto.lng);
      afigTargeta({ targeta, caixa, mida: MIDA_FOTO, origen: lloc, linia: linia(lloc, ton), clau });
    });
    return { nodes: dades.fotos.length, km: null, visibles: visibles.length, amagades: Math.max(0, visibles.length - ambTargeta.length) };
  }

  /* El focus d'una targeta sobreviu al repintat (la mateixa clau i el mateix
     botó). Si la targeta ja no hi és, o ha quedat fora de la vista, el focus
     va al mapa, mai al buit ni a una targeta que no es veu. */
  function recordaFocus() {
    const arrel = element.getRootNode?.() || document;
    const actiu = arrel.activeElement;
    if (!actiu || !element.contains(actiu)) return null;
    const targeta = actiu.closest?.('[data-clau]');
    return targeta ? { clau: targeta.dataset.clau, rol: actiu.dataset?.rol || null } : null;
  }

  function tornaFocus(record) {
    if (!record) return;
    const targeta = [...element.querySelectorAll('[data-clau]')].find((candidata) => candidata.dataset.clau === record.clau);
    const objectiu = targeta && record.rol && targeta.dataset.rol !== record.rol
      ? [...targeta.querySelectorAll('[data-rol]')].find((candidat) => candidat.dataset.rol === record.rol)
      : targeta;
    const visible = objectiu && objectiu.tabIndex >= 0;
    (visible ? objectiu : element).focus?.({ preventScroll: true });
  }

  /* I, amb el disseny ja fet (el navegador; jsdom no en fa), cada botó d'una
     targeta que la vora del mapa tapa sencer: una sola lectura per repintat. */
  function apagaElsDeFora() {
    const vora = element.getBoundingClientRect();
    if (!vora.width || !vora.height) return;
    const botons = [...mapa.getPane(PANELL_TARGETES).querySelectorAll('button')];
    const fora = botons.filter((botoDeLaTargeta) => {
      const caixa = botoDeLaTargeta.getBoundingClientRect();
      return caixa.right <= vora.left || caixa.left >= vora.right || caixa.bottom <= vora.top || caixa.top >= vora.bottom;
    });
    fora.forEach((botoDeFora) => { botoDeFora.tabIndex = -1; });
  }

  function refresca() {
    if (destruit || gest) return;
    try {
      const zoom = mapa.getZoom();
      const mode = modeDelMapa({ zoom, llindarManual });
      const focus = recordaFocus();
      capa.clearLayers();
      let resum = { nodes: 0, km: null, visibles: 0, amagades: 0 };
      if (dades.parades.length) {
        if (mode === 'foto-a-foto') resum = pintaFotos();
        else if (mode === 'parades') resum = pintaParades(zoom);
        else resum = pintaGrups(zoom);
      }
      apagaElsDeFora();
      tornaFocus(focus);
      if (zoom >= ZOOM_AMB_POBLES) pobles.addTo(mapa);
      else pobles.remove();
      const titol = nomDeLaZona({
        centre: mapa.getCenter(), zoom, pobles: MOCK_TOWNS,
        nomGeneral: tr('section.mur.mapa.totesLesFotos', 'Totes les fotos del Mur'),
        nomDeFora: tr('section.mur.mapa.zonaSenseNom', 'Zona sense nom al catàleg'),
        rodalia: (nom) => tr('section.mur.mapa.rodalia', '{nom} · rodalia', { nom })
      });
      enVista({ zoom, mode, titol, ...resum });
    } catch (error) {
      enError(error);
    }
  }

  function programa() {
    if (pendent !== null || destruit) return;
    const fes = () => { pendent = null; refresca(); };
    pendent = typeof window.requestAnimationFrame === 'function' ? { raf: window.requestAnimationFrame(fes) } : { temps: setTimeout(fes, 0) };
  }
  mapa.on('zoomend moveend resize', programa);

  function vesATot() {
    const llocs = dades.parades.map((parada) => [parada.lat, parada.lng]);
    if (llocs.length) mapa.fitBounds(L.latLngBounds(llocs), { padding: FARCIMENT, maxZoom: 13, animate: false });
    else mapa.setView([MAPA_INICI.lat, MAPA_INICI.lng], MAPA_INICI.zoom, { animate: false });
  }

  function apagaElRellotgeDelFons() {
    if (rellotgeDelFons) clearTimeout(rellotgeDelFons);
    rellotgeDelFons = null;
  }

  return {
    mapa,
    posaDades(noves, primeraVegada) {
      dades = noves.dades;
      arbre = noves.arbre;
      talls = new Map();
      if (noves.conjunt !== conjunt) {
        conjunt = noves.conjunt;
        posicions = llegixPosicions(conjunt);
      }
      if (primeraVegada) vesATot();
      refresca();
    },
    posaLlindar(km) {
      llindarManual = km;
      refresca();
    },
    posaTraductor(nou) {
      tr = nou;
      refresca();
    },
    posaFons(actiu) {
      apagaElRellotgeDelFons();
      if (!actiu) {
        if (tesseles) tesseles.remove();
        enAvisDelFons('');
        return;
      }
      if (!tesseles) {
        // Sense cap càrrega anticipada: Leaflet només demana les tessel·les de la vista.
        tesseles = L.tileLayer(TESSELES.url, { maxZoom: TESSELES.maxZoom, attribution: TESSELES.atribucio });
        tesseles.on('tileload', () => {
          tesselesCarregades += 1;
          if (mapa.hasLayer(tesseles)) enAvisDelFons(errorsDeTesseles ? 'error' : 'connectat');
        });
        tesseles.on('tileerror', () => {
          errorsDeTesseles += 1;
          if (mapa.hasLayer(tesseles)) enAvisDelFons('error');
        });
      }
      tesselesCarregades = 0;
      errorsDeTesseles = 0;
      enAvisDelFons('carregant');
      tesseles.addTo(mapa);
      rellotgeDelFons = setTimeout(() => {
        if (tesseles && mapa.hasLayer(tesseles) && !tesselesCarregades) enAvisDelFons('lent');
      }, RETARD_DEL_FONS_MS);
    },
    recolloca() {
      posicions = {};
      desaPosicions(conjunt, posicions);
      refresca();
    },
    vesATot,
    vesAlPoble() {
      mapa.fitBounds(L.latLngBounds(LIMITS_DEL_POBLE), { animate: false });
    },
    destruix() {
      destruit = true;
      apagaElRellotgeDelFons();
      if (pendent?.raf) window.cancelAnimationFrame?.(pendent.raf);
      if (pendent?.temps) clearTimeout(pendent.temps);
      mapa.off();
      mapa.remove();
    }
  };
}

/* ═══ EL COMPONENT ═════════════════════════════════════════════════ */

/**
 * @param {object} props
 * @param {Array<object>} props.items  els elements del Mur que es veuen (puntsDelMapa en tria les fotos)
 * @param {Array<object>} [props.pobles] les fitxes de /pobles (coordenades de poble_id); sense, la llavor
 * @param {(mapa: object) => void} [props.onMapa] rep la instància de Leaflet en crear-la (proves i diagnòstic)
 */
export default function MapaFotografic({ items, pobles = null, onMapa = null }) {
  const t = useTraductorOpcional();
  const tr = useCallback((clau, reserva, valors) => omplix(tradueix(t, [clau, reserva]), valors), [t]);
  const nativa = useMemo(() => esAppNativa(), []);
  const dades = useMemo(() => puntsDelMapa(items, { pobles }), [items, pobles]);
  const arbre = useMemo(() => arbreDAgrupacio(dades.parades), [dades]);
  const conjunt = useMemo(() => clauDelConjunt(dades.fotos), [dades]);
  const perId = useMemo(() => new Map(dades.fotos.map((foto) => [foto.id, foto])), [dades]);

  const [error, setError] = useState(null);
  const [llest, setLlest] = useState(false);
  const [vista, setVista] = useState({ zoom: MAPA_INICI.zoom, mode: 'grups', titol: '', nodes: 0, visibles: 0, amagades: 0 });
  const [llindarManual, setLlindarManual] = useState(null);
  const [fons, setFons] = useState(() => !nativa && llegixFons());
  const [avisDelFons, setAvisDelFons] = useState('');
  const [visor, setVisor] = useState(null);

  const arrelRef = useRef(null);
  const llencRef = useRef(null);
  const motorRef = useRef(null);
  const primeraVegada = useRef(true);
  const trInicial = useRef(tr);
  const onMapaInicial = useRef(onMapa);
  const idTitol = useId();
  const idLliscador = useId();
  const idEtiqueta = useId();
  const idAjuda = useId();

  useEffect(() => {
    let viu = true;
    adoptaFulls(arrelRef.current);
    import('leaflet').then((modul) => {
      if (!viu) return;
      const L = modul.default || modul;
      motorRef.current = creaMotor({
        L, element: llencRef.current, tr: trInicial.current,
        enVista: (nova) => { if (viu) setVista(nova); },
        enAvisDelFons: (avis) => { if (viu) setAvisDelFons(avis); },
        enObriFotos: (ids, index) => { if (viu) setVisor({ ids, index }); },
        enError: (causa) => { if (viu) setError(causa); }
      });
      onMapaInicial.current?.(motorRef.current.mapa);
      setLlest(true);
    }).catch((causa) => { if (viu) setError(causa); });
    return () => {
      viu = false;
      motorRef.current?.destruix();
      motorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!llest) return;
    motorRef.current?.posaDades({ dades, arbre, conjunt }, primeraVegada.current);
    primeraVegada.current = false;
  }, [llest, dades, arbre, conjunt]);
  useEffect(() => { if (llest) motorRef.current?.posaLlindar(llindarManual); }, [llest, llindarManual]);
  useEffect(() => { if (llest) motorRef.current?.posaTraductor(tr); }, [llest, tr]);
  useEffect(() => { if (llest) motorRef.current?.posaFons(fons && !nativa); }, [llest, fons, nativa]);

  if (error) throw error;

  const commutaFons = () => {
    const actiu = !fons;
    desaFons(actiu);
    setFons(actiu);
  };
  const manual = llindarManual !== null;
  const detallLocal = vista.mode === 'foto-a-foto';
  const km = llindarManual ?? llindarDelZoom(vista.zoom);
  const textDelValor = `${manual ? etiquetaDistancia(llindarManual, t) : tr('section.mur.mapa.automatica', 'Automàtica segons el zoom')}${detallLocal ? ` · ${tr('section.mur.mapa.detallLocal', 'Detall local actiu')}` : ''}`;
  const ajuda = ajudaDelLliscador({ llindarManual, mode: vista.mode });
  const textDelEstat = (() => {
    if (!dades.parades.length) return '';
    if (detallLocal) {
      const base = tr('section.mur.mapa.estat.fotoAFoto', 'Foto a foto · {n} en esta vista · arrossega les miniatures per a moure-les', { n: vista.visibles });
      return vista.amagades ? `${base} ${tr('section.mur.mapa.estat.mesFotos', '({n} més sense targeta: acosta’t per a vore-les)', { n: vista.amagades })}` : base;
    }
    if (vista.mode === 'parades') return tr('section.mur.mapa.estat.parades', 'Detall de parades · arrossega les targetes per a destapar el mapa');
    if (manual) return tr('section.mur.mapa.estat.manual', '{n} nodes · {d} · prem un node per a acostar-t’hi', { n: vista.nodes, d: etiquetaDistancia(llindarManual, t) });
    if (km === Infinity) return tr('section.mur.mapa.estat.totJunt', 'Tot junt · prem el node per a acostar-t’hi');
    return tr('section.mur.mapa.estat.zones', '{n} zones · proximitat de {d}', { n: vista.nodes, d: etiquetaDistancia(km, t) });
  })();
  // Amb massa parades diferents, l'arbre s'ha fet per cel·les: la distància del lliscador és aproximada, i es diu.
  let textDelRetall = '';
  if (arbre.retallat && vista.mode === 'grups' && dades.parades.length) {
    textDelRetall = Number.isFinite(arbre.resolucioKm)
      ? tr('section.mur.mapa.estat.aproximat', 'Agrupació aproximada: hi ha massa parades diferents (precisió ≈ {d})', { d: etiquetaDistancia(arbre.resolucioKm, t) })
      : tr('section.mur.mapa.estat.senseAgrupar', 'Hi ha massa parades per a agrupar-les en este aparell: cada una va a banda.');
  }
  const AVISOS_DEL_FONS = {
    carregant: ['section.mur.mapa.fons.carregant', 'Carregant el fons detallat…'],
    connectat: ['section.mur.mapa.fons.connectat', 'Fons detallat connectat.'],
    error: ['section.mur.mapa.fons.error', 'No s’ha pogut carregar part del fons. El mapa bàsic continua disponible.'],
    lent: ['section.mur.mapa.fons.lent', 'El fons no respon. Es conserva el mapa bàsic.']
  };
  const textDelFons = AVISOS_DEL_FONS[avisDelFons] ? tr(...AVISOS_DEL_FONS[avisDelFons]) : '';

  const fotosDelVisor = visor ? visor.ids.map((id) => perId.get(id)).filter(Boolean) : [];
  /* D3 · El visor rep la URL que ha resolt el port, mai la referència opaca. */
  const [urlsDelVisor, setUrlsDelVisor] = useState(() => new Map());
  const opaquesDelVisor = fotosDelVisor.map((foto) => foto.miniatura).filter((src) => esMitjaOpac(src)).join('\n');
  useEffect(() => {
    if (!opaquesDelVisor) return undefined;
    let viu = true;
    Promise.all(opaquesDelVisor.split('\n').map((ref) => urlDeMiniatura(ref).then((url) => [ref, url])))
      .then((parells) => { if (viu) setUrlsDelVisor(new Map(parells.filter(([, url]) => url))); });
    return () => { viu = false; };
  }, [opaquesDelVisor]);
  const fontDelVisor = (src) => (esMitjaOpac(src) ? urlsDelVisor.get(src) || '' : src);
  const fotoOberta = fotosDelVisor[Math.min(visor?.index ?? 0, Math.max(0, fotosDelVisor.length - 1))] || null;

  return (
    <section className="sdp-mapa" ref={arrelRef} aria-labelledby={idTitol}>
      <h2 id={idTitol} className="sdp-mapa__titol" aria-live="polite">
        {vista.titol || tr('section.mur.mapa.totesLesFotos', 'Totes les fotos del Mur')}
      </h2>
      <div className="sdp-mapa__eines" role="toolbar" aria-label={tr('section.mur.mapa.eines', 'Controls del mapa')}>
        {nativa ? null : (
          <Boto aria-pressed={fons} onClick={commutaFons}>
            {fons ? tr('section.mur.mapa.ocultaMapa', 'Ocultar mapa') : tr('section.mur.mapa.voreMapa', 'Vore mapa')}
          </Boto>
        )}
        <Boto onClick={() => motorRef.current?.recolloca()} disabled={!llest}
          title={tr('section.mur.mapa.recollocaAjuda', 'Torna les targetes que has mogut al seu lloc automàtic')}>
          {tr('section.mur.mapa.recolloca', 'Recol·locar grups')}
        </Boto>
        <Boto onClick={() => motorRef.current?.vesATot()} disabled={!llest}>{tr('section.mur.mapa.voreTot', 'Vore tot')}</Boto>
        <Boto onClick={() => motorRef.current?.vesAlPoble()} disabled={!llest}>{tr('section.mur.mapa.vorePoble', 'Vore el poble')}</Boto>
      </div>
      {/* L'agrupació, abans del mapa: amb el teclat s'hi arriba sense travessar
          totes les targetes (fins a 60, amb quatre botons cada una). */}
      <div className="sdp-mapa__agrupacio" role="group" aria-labelledby={idEtiqueta}>
        <div className="sdp-mapa__agrupacio-cap">
          <label id={idEtiqueta} className="sdp-mapa__etiqueta" htmlFor={idLliscador}>{tr('section.mur.mapa.agrupacio', 'Agrupació per distància')}</label>
          <output className="sdp-mapa__valor" htmlFor={idLliscador} aria-live="polite">{textDelValor}</output>
          <Boto aria-pressed={!manual} onClick={() => setLlindarManual(null)}>{tr('section.mur.mapa.segonsElZoom', 'Segons el zoom')}</Boto>
        </div>
        <input id={idLliscador} className="sdp-mapa__lliscador" type="range" min={0} max={9} step={1}
          value={indexDelLlindar(km)} aria-describedby={idAjuda} aria-valuetext={textDelValor}
          onChange={(event) => setLlindarManual(llindarDelLliscador(event.target.value))} />
        <div className="sdp-mapa__extrems" aria-hidden="true">
          <span>{etiquetaDistancia(Infinity, t)}</span>
          <span>{etiquetaDistancia(0, t)}</span>
        </div>
        <p id={idAjuda} className="sdp-mapa__ajuda" aria-live="polite">{tr(ajuda.clau, ajuda.reserva, ajuda.valors)}</p>
      </div>
      <p className="sdp-mapa__estat" role="status">{[textDelEstat, textDelRetall, textDelFons].filter(Boolean).join(' · ')}</p>
      <div ref={llencRef} className="sdp-mapa__llenc" role="region"
        aria-label={tr('section.mur.mapa.llenc', 'Mapa fotogràfic del Mur')} />
      <p className="sdp-mapa__llegenda">
        <span className="sdp-mapa__mostra" aria-hidden="true" />
        {tr('section.mur.mapa.llegenda.verd', 'Verd: ubicació GPS de la foto')}
        {' · '}
        <span className="sdp-mapa__mostra sdp-mapa__mostra--ocre" aria-hidden="true" />
        {tr('section.mur.mapa.llegenda.ocre', 'Ocre: estimada, del poble o indicada per l’autor')}
        {' · '}
        {tr('section.mur.mapa.llegenda.linies', 'Línia contínua: l’ordre de les fotos d’una publicació, no els carrers exactes. Línia discontínua: de la targeta al seu punt.')}
      </p>
      {dades.fotos.length ? null : (
        <p className="sdp-mapa__avis">{tr('section.mur.mapa.buit', 'Encara no hi ha cap foto del Mur amb lloc. Les fotos amb GPS i les de publicacions amb poble apareixeran ací.')}</p>
      )}
      {dades.pendents.length ? (
        <p className="sdp-mapa__avis">
          {dades.pendents.length === 1
            ? tr('section.mur.mapa.unaPendent', '1 foto pendent d’ubicar: no porta GPS ni poble.')
            : tr('section.mur.mapa.pendents', '{n} fotos pendents d’ubicar: no porten GPS ni poble.', { n: dades.pendents.length })}
        </p>
      ) : null}
      <VisorImatges
        obert={fotosDelVisor.length > 0}
        imatges={fotosDelVisor.map((foto) => ({ src: fontDelVisor(foto.miniatura), alt: textAlternatiu(foto, tr), titol: foto.titol || foto.lloc || '' }))}
        index={Math.min(visor?.index ?? 0, Math.max(0, fotosDelVisor.length - 1))}
        onCanvi={(index) => setVisor((actual) => (actual ? { ...actual, index } : actual))}
        onTanca={() => setVisor(null)}
        titol={tr('section.mur.mapa.visor', 'Fotos del mapa')}
        metadades={metadadesDe(fotoOberta, tr, perId)}
      />
    </section>
  );
}

function textAlternatiu(foto, tr) {
  return tr('section.mur.mapa.alt', 'Foto {n} · {nom}', { n: foto.ordre, nom: foto.titol || foto.lloc || tr('section.mur.mapa.llocSenseNom', 'Lloc sense nom') });
}

/* El panell del visor: quan, on, d'on ix el lloc, amb quina precisió i de quina publicació. */
function metadadesDe(foto, tr, perId) {
  if (!foto) return [];
  const instant = foto.dataCaptura ? `${formataDia(foto.dataCaptura)} · ${formataHora(foto.dataCaptura)}` : '';
  const zona = /([+-]\d{2}:\d{2}|Z)$/.exec(foto.dataCaptura || '');
  const quan = instant
    ? `${instant} (${zona ? `UTC${zona[1] === 'Z' ? '+00:00' : zona[1]}` : tr('section.mur.mapa.senseZona', 'zona horària desconeguda')})`
    : tr('section.mur.mapa.senseData', 'Sense data de captura');
  const decimals = DECIMALS_DE_LA_PRECISIO[foto.precisio] ?? 4;
  let origen = tr('section.mur.mapa.origen.gps', 'GPS de la foto');
  if (foto.estat === 'estimada') {
    const referencia = perId.get(foto.referencia);
    origen = tr('section.mur.mapa.origen.estimada', 'Estimada a partir de la foto {n} · diferència: {min} min', {
      n: referencia ? referencia.ordre : '?', min: Math.round((foto.diferencia_s || 0) / 60)
    });
    if (foto.incertesaAlta) origen = `${origen} · ${tr('section.mur.mapa.incertesaAlta', 'incertesa alta')}`;
  } else if (foto.estat === 'poble') {
    origen = tr('section.mur.mapa.origen.poble', 'Centre del poble: la foto no porta GPS');
  } else if (foto.estat === 'indicada') {
    origen = tr('section.mur.mapa.origen.indicada', 'Indicada per l’autor, no pel GPS de la foto');
  }
  const precisio = {
    exacta: tr('section.mur.mapa.precisio.exacta', 'Exacta'),
    '100m': tr('section.mur.mapa.precisio.cent', 'Uns 100 m'),
    poble: tr('section.mur.mapa.precisio.poble', 'Només el poble')
  }[foto.precisio];
  return [
    { clau: 'quan', etiqueta: tr('section.mur.mapa.meta.quan', 'Data de captura'), valor: quan },
    { clau: 'on', etiqueta: tr('section.mur.mapa.meta.on', 'Ubicació'), valor: `${foto.lat.toFixed(decimals)}, ${foto.lng.toFixed(decimals)}` },
    { clau: 'origen', etiqueta: tr('section.mur.mapa.meta.origen', 'D’on ix el lloc'), valor: origen },
    ...(precisio && foto.estat === 'gps' ? [{ clau: 'precisio', etiqueta: tr('section.mur.mapa.meta.precisio', 'Precisió'), valor: precisio }] : []),
    ...(foto.titol ? [{ clau: 'publicacio', etiqueta: tr('section.mur.mapa.meta.publicacio', 'Publicació'), valor: foto.titol }] : [])
  ];
}

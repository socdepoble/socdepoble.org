/* DOL-32 · Reserva del lloc propi, carregada en diferit. La font és la
   resposta crua d'una lectura iniciada I acabada sense sessió, abans de
   revisions editorials i projeccions locals. Mai s'extrau text del DOM. */
import { getSessionState, subscribeSession } from '../data/sessionService.js';
import { lecturesPubliques, subscriuLecturesPubliques } from './lecturesPubliques.js';
import { esElementPublic } from '../components/universal/traduccio/visibilitatTraduible.js';
import { senseHtmlCru } from '../sections/mercat/etiquetesMercat.js';
import { formataPreuMercat } from '../sections/mercat/preuMercat.js';
import { preuInicialDelProducte } from '../sections/mercat/variacionsDeProducte.js';
import { acteAEsdeveniment, esActeDelCalendari } from '../sections/mur/agendaMur.js';
import { llegixDataHora } from '../utils/esdeveniment.js';

export const MISSATGE_LECTURA_PUBLICA = 'sdp-lectura-publica';
const RUTA_PUBLICA = /^\/(?:mur|mercat|pobles|calendari)(?:\/[a-z0-9][a-z0-9_-]{0,99})?\/?$/i;
const PRIVATS = /\/(?:nou|nova|editar|edit|create|esborranys?)\/?$/i;
const ORIGENS = { mur: ['mur', 'feedPosts', 'Mur'], mercat: ['mur', 'marketItems', 'Mercat'],
  calendari: ['mur', 'events', 'Calendari'], pobles: ['core', 'towns', 'Pobles'] };

/* v1.2.20 · Gauntlet R1 (L3-07) · Un acte de la còpia porta el seu quan, el seu on i la seua
   repetició, llegits del mateix text públic que ja es guarda i amb el model del Calendari
   (acteAEsdeveniment: date i time, inici i fi, dades.data_inici…, location, recurrencia), en
   valencià, la llengua de la còpia (lang="ca"). Una hora de paret es diu tal com està escrita (la
   de la zona de l'acte); una amb desfasament, en la seua zona. La fi d'un acte de tot el dia és
   exclusiva (RFC 5545): es diu l'últim dia. La còpia és text estàtic: no marca els actes passats,
   que ho serien o no segons el dia que es llija; l'avís de dalt ja diu de quan és. */
const FREQUENCIES = { DAILY: ['cada dia', 'dies'], WEEKLY: ['cada setmana', 'setmanes'], MONTHLY: ['cada mes', 'mesos'],
  YEARLY: ['cada any', 'anys'], HOURLY: ['cada hora', 'hores'], MINUTELY: ['cada minut', 'minuts'], SECONDLY: ['cada segon', 'segons'] };
function textDelMoment(moment, ambDia = true) {
  try {
    if ('data' in moment) {
      const [any, mes, dia] = moment.data.split('-').map(Number);
      return new Intl.DateTimeFormat('ca', { dateStyle: 'full', timeZone: 'UTC' }).format(Date.UTC(any, mes - 1, dia));
    }
    const p = llegixDataHora(moment.dataHora);
    const opcions = { timeStyle: 'short', timeZone: p.ambDesfas ? moment.zona : 'UTC', ...(ambDia ? { dateStyle: 'full' } : {}) };
    return new Intl.DateTimeFormat('ca', opcions).format(p.ambDesfas ? p.instant : Date.UTC(p.any, p.mes, p.dia, p.hora, p.minut, p.segon));
  } catch { return moment.data || moment.dataHora; }
}
function liniesDeLActe(acte, item, pla) {
  const regla = (acte.recurrencia || []).find(linia => /^RRULE:/i.test(linia)) || '';
  const linies = [`${acte.recurrencia ? 'Primera vegada' : 'Quan'}: ${textDelMoment(acte.inici)}`];
  if (acte.fi && 'data' in acte.fi) {
    const [any, mes, dia] = acte.fi.data.split('-').map(Number);
    const ultim = new Date(Date.UTC(any, mes - 1, dia - 1)).toISOString().slice(0, 10);
    if (ultim > acte.inici.data) linies.push(`Fins: ${textDelMoment({ data: ultim })}`);
  } else if (acte.fi) {
    // Dues hores de paret del mateix dia: només l'hora. Amb desfasament, el dia sencer.
    const mateixDia = !llegixDataHora(acte.fi.dataHora).ambDesfas && acte.fi.dataHora.slice(0, 10) === acte.inici.dataHora.slice(0, 10);
    linies.push(`Fins: ${textDelMoment(acte.fi, !mateixDia)}`);
  }
  if (acte.lloc) linies.push(`On: ${pla(acte.lloc)}`);
  if (acte.recurrencia) {
    const [, freq] = /(?:^RRULE:|;)FREQ=([A-Z]+)/i.exec(regla) || [];
    const interval = Number((/(?:^RRULE:|;)INTERVAL=(\d+)/i.exec(regla) || [])[1] || 1);
    const [cada, plural] = FREQUENCIES[String(freq).toUpperCase()] || [];
    linies.push(cada ? `Es repetix: ${interval > 1 ? `cada ${interval} ${plural}` : cada}` : 'Es repetix');
  }
  return [...linies, pla(item.date_label)];
}

export function esRutaDeLecturaPublica(ubicacio) {
  return Boolean(ubicacio && !ubicacio.search && !ubicacio.hash &&
    RUTA_PUBLICA.test(ubicacio.pathname || '') && !PRIVATS.test(ubicacio.pathname));
}

export function capturaLecturaPublica({ finestra, sessio = getSessionState, fonts = lecturesPubliques } = {}) {
  try {
    const inici = sessio();
    if (inici?.estat !== 'fora' || inici.usuari || !esRutaDeLecturaPublica(finestra?.location)) return null;
    const [, ruta, id] = finestra.location.pathname.split('/');
    const [font, clau, etiqueta] = ORIGENS[ruta] || [];
    const lectura = fonts().get(font);
    const crues = lectura?.payload?.[clau];
    if (lectura?.generacio !== inici.generacio || !Array.isArray(crues)) return null;
    const elements = crues.filter(esElementPublic).filter(item => !id || String(item.id) === id || item.slug === id).slice(0, 50);
    if (!elements.length) return null;
    const pla = valor => typeof valor === 'string' ? senseHtmlCru(valor.slice(0, 20000)) : '';
    const text = elements.map(item => {
      const acte = ruta === 'calendari' || esActeDelCalendari(item) ? acteAEsdeveniment(item) : null;
      return [pla(item.title || item.name || item.nom), pla(item.subtitle || item.summary || item.lead),
        pla(item.description || item.content), ruta === 'mercat' ? preuInicialDelProducte(item) : formataPreuMercat(item.price),
        ...(acte ? liniesDeLActe(acte, item, pla) : [pla(item.date || item.data)])]
        .filter(Boolean).join('\n');
    }).join('\n\n').slice(0, 80000);
    const fi = sessio();
    if (fi?.estat !== 'fora' || fi.usuari || fi.generacio !== inici.generacio || text.length < 30) return null;
    return { tipus: MISSATGE_LECTURA_PUBLICA, cami: finestra.location.pathname, capturadaEl: lectura.capturadaEl,
      titol: (id ? pla(elements[0].title || elements[0].name || elements[0].nom) : etiqueta).slice(0, 200), text };
  } catch { return null; }
}

export function iniciaLecturaPublicaOffline({ finestra = globalThis.window, publica, escoltaControlador = () => () => {}, sessio = getSessionState,
  subscriu = subscribeSession, fonts = lecturesPubliques, subscriuFonts = subscriuLecturesPubliques } = {}) {
  const Observador = finestra?.MutationObserver;
  const arrel = finestra?.document?.getElementById('root');
  if (typeof publica !== 'function' || !arrel || typeof Observador !== 'function') return () => {};
  // Eixir pot deixar DOM anterior fins al següent pintat: una sessió
  // observada invalida futures captures durant tota la vida del document.
  let bloquejada = false;
  let pendent = null;
  let ultima = '';
  const captura = () => {
    pendent = null;
    if (bloquejada) return;
    const generacio = sessio()?.generacio;
    const dades = capturaLecturaPublica({ finestra, sessio, fonts });
    const ara = sessio();
    if (bloquejada || !dades || ara?.estat !== 'fora' || ara.usuari || ara.generacio !== generacio) return;
    const clau = JSON.stringify(dades);
    if (clau === ultima) return;
    try { if (publica(dades) !== false) ultima = clau; } catch { /* ajuda opcional */ }
  };
  const programa = () => {
    finestra.clearTimeout(pendent);
    pendent = finestra.setTimeout(captura, 750);
  };
  const deixaSessio = subscriu(estat => {
    if (estat?.usuari || estat?.estat === 'dins') bloquejada = true;
    programa();
  });
  const auth = event => { if (event?.detail?.user) bloquejada = true; };
  finestra.addEventListener('sdp:auth-change', auth);
  const observador = new Observador(programa);
  observador.observe(arrel, { childList: true, subtree: true });
  const deixaControlador = escoltaControlador(programa);
  const deixaFonts = subscriuFonts(programa);
  programa();
  return () => {
    observador.disconnect();
    deixaSessio();
    deixaFonts();
    finestra.removeEventListener('sdp:auth-change', auth);
    finestra.clearTimeout(pendent);
    deixaControlador();
  };
}

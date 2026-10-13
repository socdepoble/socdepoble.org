/**
 * diagnosiConsola.js — el «Diagnòstic del Mas» en text pla, sense React.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · «Al final de la
 * pàgina, davall de les targetes, incorporar un índex de navegació ràpida a
 * cada card (El pols del cervell, Explorador, Fluxos de treball...) i un bloc
 * de text continu (estil terminal / <pre> amb tipografia monoespaiada i format
 * net) que mostre el diagnòstic complet del Mas d'un sol colp d'ull.»
 *
 * Ací viuen les dues dades del bloc, perquè una prova les fixe sense muntar
 * res i la vista (DiagnosiConsola.jsx) només les pinte:
 *  · accesRapid: les nou pàgines del tauler (paginesConsola), amb el seu
 *    títol i la seua ruta. Cap ruta nova.
 *  · diagnosiTextual: el text del <pre>. NO calcula res pel seu compte: cada
 *    línia ix de les mateixes funcions pures que pinten les targetes
 *    (resumPagina, etiquetesPagina, estatsPagina, problemesPagina,
 *    cobertesPols, xifresDeLaGraella, avisosDeVigilancia), amb el mateix
 *    rellotge (`ara`) que el tauler: el text i les targetes no es poden
 *    contradir, i el que la targeta diu «sense mesura» o «no disponible en
 *    este entorn» ací també (la Consola no inventa cap xifra).
 * Els problemes de cada pàgina hi van sencers, sense retallar: la targeta en
 * pinta com a molt MAX_PROBLEMES_TARGETA, i este és el diagnòstic complet.
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · El text pla repetix
 * xifres que ja tenen targeta: cada línia nomena la pàgina (o «El Mas en
 * xifres») on viu la seua targeta, i l'accés ràpid hi porta.
 *
 * MODE PRIVACITAT. El <pre> és text pla i no passa per <Privat>: les rutes
 * dels avisos i dels problemes i les evidències del compilador hi diuen
 * MASCARA (la mateixa de Privat, peces.jsx), i les xifres amb ruta al títol
 * o al subtítol diuen la seua versió privada (titolPrivat, subtitolPrivat).
 * Exactament el que amaguen les targetes, ni més ni menys. Un camp nou amb
 * rutes ha de passar per `amaga` o seria una fuita silenciosa
 * (diagnosiConsola.test.js ho vigila).
 */
import { dataLocal } from './consolaContent.js';
import {
  avisosDeVigilancia, copyConsola, estatsPagina, etiquetesPagina, paginaConsola, paginesConsola,
  problemesPagina, resumPagina
} from './consolaPagines.js';
import { cobertesPols, panellsPols } from './polsConsola.js';
import { rutaDelNode } from './problemesConsola.js';
import { xifresDeLaGraella } from './xifresMas.js';
import { TEXTOS_AVIS } from './mapa/grafMapa.js';

/** El títol del bloc (l'H2) i el nom accessible de l'accés ràpid. */
export const TITOL_DIAGNOSI = 'Diagnòstic del Mas';
export const ETIQUETA_ACCES = 'Accés ràpid a les pàgines de la Consola';
/** El que diu una ruta o una evidència amb el mode privacitat: la mateixa marca que Privat (peces.jsx). */
export const MASCARA = '••••••';
/** Una pàgina sense cap etiqueta de nivell (llegint, o sense base per al verd). */
export const SENSE_SEMAFOR = 'Sense semàfor';

const SAGNAT = '    ';
const amaga = (text, privat) => (privat ? MASCARA : text);

/** Les nou pàgines del tauler, en l'ordre d'IDS_PAGINES: { id, titol, ruta }. */
export const accesRapid = () => paginesConsola().map(({ id, title, ruta }) => ({ id, titol: title, ruta }));

/* Sense estat declarat, cap font ha arribat: 'absent', com diu resumPagina.
   Les fonts de la secció (useConsola, useMapa) sempre en porten un. */
const normalitza = (fonts = {}) => ({
  dades: fonts.dades ?? null,
  estatDades: fonts.estatDades ?? 'absent',
  mapa: fonts.mapa ?? null,
  estatMapa: fonts.estatMapa ?? 'absent'
});

const instantania = (de, iso, locale) => `Instantània ${de}: ${iso ? dataLocal(iso, locale) : 'encara no disponible'}`;

/* AlertaVigilancia (ConsolaSection.jsx) en text: el text de l'avís, on mirar
   i l'evidència; el detall, a Avisos i salut. */
function vigilancia(mapa, privat) {
  const avisos = avisosDeVigilancia(mapa);
  if (!avisos.length) return [];
  return [
    '',
    'VIGILÀNCIA TRENCADA',
    ...avisos.map((a) => {
      const evidencia = typeof a.evidencia === 'string' && a.evidencia ? ` · Evidència: ${amaga(a.evidencia, privat)}` : '';
      return `- ${TEXTOS_AVIS[a.codi] ?? `Avís ${a.codi}.`} On: ${amaga(rutaDelNode(a.node), privat)}${evidencia}`;
    }),
    `El detall i què cal reparar són a la pàgina ${paginaConsola('salut').title}.`
  ];
}

/* Un problema com el pinta la targeta (TargetaConsola): la marca, el text i la ruta. */
const problema = (p, privat) => `${p.marca ? `${p.marca} ` : ''}${p.text}${p.text && p.ruta ? ' · ' : ''}${p.ruta ? amaga(p.ruta, privat) : ''}`;

/* Una pàgina: el nivell, el títol i el resum de la seua targeta; davall, les
   cobertes dels tres panells (només el pols), els estats i tots els problemes. */
function pagina(p, fonts, ara, privat) {
  const nivell = etiquetesPagina(p.id, fonts, undefined, ara)[0]?.text ?? SENSE_SEMAFOR;
  const linies = [`[${nivell}] ${p.title} · ${resumPagina(p.id, fonts)}`];
  if (p.id === 'pols') {
    const cobertes = cobertesPols(fonts.dades, fonts.estatDades);
    for (const panell of panellsPols()) {
      const { metriques, senseMesura } = cobertes[panell.id];
      linies.push(`${SAGNAT}${panell.titol}: ${(metriques ?? [senseMesura]).join(' · ')}`);
    }
  }
  for (const e of estatsPagina(p.id, fonts, ara) ?? []) linies.push(`${SAGNAT}estat: ${e.text}`);
  for (const x of problemesPagina(p.id, fonts) ?? []) linies.push(`${SAGNAT}problema: ${problema(x, privat)}`);
  return linies;
}

/* Una xifra del Mas com la diu la seua targeta (TargetaXifra): títol i subtítol, la versió privada si cal. */
function xifra(x, privat) {
  const titol = privat && x.titolPrivat ? x.titolPrivat : x.titol;
  const subtitol = privat && x.subtitolPrivat ? x.subtitolPrivat : x.subtitol;
  return `- ${titol} · ${subtitol}`;
}

/**
 * El diagnòstic complet del Mas en text pla (línies unides amb '\n').
 * `fonts` té la forma de fontsDe (ConsolaSection.jsx): { dades, estatDades,
 * mapa, estatMapa }, cap obligatòria. `ara` és el rellotge del tauler (el
 * mateix que passa a estatsPagina i etiquetesPagina); `privat`, el mode
 * privacitat. Mateixes fonts i mateix `ara` ⇒ mateixa cadena.
 */
export function diagnosiTextual(fonts = {}, { ara = Date.now(), locale = 'ca-ES', privat = false } = {}) {
  const f = normalitza(fonts);
  return [
    `DIAGNÒSTIC DEL MAS · ${copyConsola().title}`,
    instantania('del pols', f.dades?.generat, locale),
    instantania('del Mapa', f.mapa?.generat, locale),
    ...(privat ? [`Mode privacitat: les rutes i les evidències diuen ${MASCARA}.`] : []),
    ...vigilancia(f.mapa, privat),
    '',
    'PÀGINES',
    ...paginesConsola().flatMap((p) => pagina(p, f, ara, privat)),
    '',
    'EL MAS EN XIFRES',
    ...xifresDeLaGraella(f.mapa).map((x) => xifra(x, privat))
  ].join('\n');
}

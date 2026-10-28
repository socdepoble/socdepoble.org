import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Activity, ArrowLeftRight, Bot, CalendarClock, HeartPulse, Network, Puzzle, RefreshCw, Users, Workflow
} from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Carregant, EstatBuit, Interruptor, MollaPa
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIState } from '../../app/contexts/UIContext';
import { Link, Navigate, useParams } from '../../app/contexts/RouterContext';
import { carregaConsola, dataLocal } from './consolaContent.js';
import { useFontDev } from './useFontDev.js';
import {
  RUTA_CONSOLA, avisosDeVigilancia, copyConsola, desaPrivacitat,
  estatsPagina, etiquetesPagina, llegixPrivacitat, llegixVistes, marcaVista, mesuresPagina,
  paginaConsola, paginesConsola, problemesPagina, resumPagina, segmentPagina, signaturaPagina
} from './consolaPagines.js';
import { Mono, Privat, PrivacitatConsola, TargetaConsola, tornaAlCim } from './peces.jsx';
import { PaginaPanellPols, PaginaPols } from './PolsConsola.jsx';
import { panellPols, segmentPols } from './polsConsola.js';
import { GraellaXifres, PaginaXifra, XifresMas } from './XifresMas.jsx';
import { IndexConsola } from './IndexConsola.jsx';
import { DiagnosiConsola } from './DiagnosiConsola.jsx';
import { ETIQUETA_VERSIO } from './diagnosiConsola.js';
import { versioCanonica } from '../../config/versio.js';
import { carregaEmpaquetats, esRutaEmpaquetats, paginaEmpaquetats } from './empaquetats.js';
import { PaginaEmpaquetats, SeccioEmpaquetats } from './EmpaquetatsConsola.jsx';
import { imatgeDePagina } from './imatgesConsola.js';
import { XIFRA_DE_CODI, segmentXifra, xifraDelMas, xifresDeLaGraella, xifresDeVista } from './xifresMas.js';
import { entradetaPlana } from './xifresComu.js';
import { rutaDelNode } from './problemesConsola.js';
import { MapaConsola } from './mapa/MapaConsola.jsx';
import { useMapa } from './mapa/useMapa.js';
import { ExploradorMapa } from './mapa/ExploradorMapa.jsx';
import { CalendariMapa } from './mapa/CalendariMapa.jsx';
import { InventariMapa } from './mapa/InventariMapa.jsx';
import { EntradesEixides } from './mapa/EntradesEixides.jsx';
import { FluxosMapa } from './mapa/FluxosMapa.jsx';
import { AgentsAtomics } from './mapa/AgentsAtomics.jsx';
import { ActorsMapa } from './mapa/ActorsMapa.jsx';
import { TEXTOS_AVIS } from './mapa/grafMapa.js';
import { useGovern } from './govern/useGovern.js';
import { PaginaDeGovern, SeccioGovern } from './govern/GovernConsola.jsx';
import { TITOL_SALA_MAQUINES, paginaGovern, segmentGovern } from './govern/governConsola.js';

/* La Consola és un tauler de nou targetes (/consola), una ruta per pàgina
   (/consola/<id>), una per panell del pols (/consola/pols/<id>) i una per
   xifra o peça del Mapa (/consola/xifres/<slug>). Les dues fonts
   (consola.json i el Mapa) es lligen una sola vegada per a tota la secció:
   /consola/* munta el mateix element per a totes les subrutes, i navegar
   entre pàgines no torna a llegir res.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Tota targeta de la
   Consola és una UniversalCard sencera amb la boina de Sóc de Poble
   (TargetaConsola, peces.jsx) i té pàgina pròpia: les del tauler, la seua
   pàgina; les del pols, la del seu panell; les xifres i les peces del Mapa,
   la seua (XifresMas.jsx). Derogat per l'ordre del Mestre del 261004 (xat:
   cap xifra solta): l'excepció de les xifres de dins dels panells i de les
   vistes del Mapa, que conservaven la targeta compacta del Panell de Control
   (TargetaResum) sense boina ni pàgina.
   Pla 261016_1530, Onada 0.5 (Mandat Suprem: la Consola com a quadre de
   comandament del Mestre) · Damunt de les nou targetes, el Govern del Mestre
   (govern/GovernConsola.jsx): quatre targetes i una pàgina per a cada una,
   /consola/govern/<id>. La matriu del govern també es llig una sola vegada
   per a tota la secció (useGovern).
   Pla 261027_0845 (Guarda Nocturna), §3 · La Consola incrustada de la Wiki
   pinta el mateix Govern del Mestre que /consola, amb el mateix cap de tauler
   (TaulerAmbGovern): l'alerta de vigilància, les quatre targetes, l'H2 de la
   sala de màquines i les nou targetes. Llig la matriu una sola vegada per a
   tota la fitxa, com les seues altres dues fonts, i les targetes porten a
   /consola/govern/<id>, com les nou porten a /consola/<pàgina>. Derogat:
   «La Consola incrustada de la Wiki no la llig ni la pinta». */

const ICONES = Object.freeze({
  pols: Activity, explorador: Network, fluxos: Workflow, calendari: CalendarClock,
  inventari: Puzzle, entrades: ArrowLeftRight, agents: Bot, actors: Users, salut: HeartPulse
});

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   Les targetes de la Consola porten la boina de Sóc de Poble i la data a la
   seua pastilla (TargetaConsola, peces.jsx). La font («Font: consola.json»,
   «Font: el Mapa del Mas») continua sense pintar-se.
   T51 · Cap targeta sense data (regla del Mestre). Les targetes són
   fragments de la pàgina Consola i porten la data de versió del copy
   d'eixa pàgina (PAGE_COPY.consola.date, un dia sense hora), no una data
   pròpia del seu text. Si hi ha instantània i és més recent, mana la
   instantània (TargetaConsola). */
const dataDelCopy = () => copyConsola().date;

/** Una lectura de /__iaia/consola.json. Un error conserva l'última instantània bona.
    `actiu: false` (o fora de DEV) no llig res, ni en muntar ni amb `carrega`.
    Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
    consola.json només el servix el middleware de desenvolupament: fora de DEV
    l'estat és 'absent' des del principi, com useMapa.
    Neteja 261007 (prompt 261007_1628, peça D) · La lectura és la de
    useFontDev (useFontDev.js), la mateixa del Mapa: ací només es diu `dades`
    el que el hook genèric diu `valor`. */
function useConsola({ actiu = true } = {}) {
  const { valor: dades, ...font } = useFontDev(carregaConsola, { actiu });
  return { ...font, dades };
}

/* Les pàgines que viuen del Mapa diuen per què no hi ha dades, mai n'inventen.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Sense Mapa, les xifres de
   la pàgina que es pinten sempre també hi són, amb el seu nom: la seua pàgina
   existix i diu per què no hi ha dada (cap pàgina sense targeta).
   Correcció 261004 (verificador de la segona passada, punt 1) · Les targetes
   són les de la vista (VISTES_XIFRES), la mateixa font que decidix quines
   pàgines existixen: les condicionals i les peces de les famílies no es
   poden saber sense Mapa, i ni es pinten ni tenen pàgina.
   Correcció 261004 (verificador de la tercera passada, punt 5) · Mentre es
   llig el Mapa, també: «Llegint el mapa…» i, davall, les targetes que la
   vista pinta sense Mapa, amb el seu nom i sense cap número. Abans la pàgina
   quedava buida mentre la pàgina de cada una d'eixes xifres ja existia. */
function AmbMapa({ font, vista, children }) {
  if (font.mapa) return children(font.mapa);
  const xifres = <GraellaXifres xifres={xifresDeVista(vista, null)} />;
  if (font.estat === 'loading') return <><Carregant etiqueta="Llegint el mapa…" />{xifres}</>;
  if (font.estat === 'error') {
    return (
      <>
        <Alerta to="error" titol="No s’ha pogut llegir el mapa">
          {font.error?.message || 'Torna a provar-ho amb Refrescar.'}
        </Alerta>
        {xifres}
      </>
    );
  }
  return (
    <>
      <EstatBuit icona={Network} titol="Mapa no disponible">
        Esta pàgina viu del Mapa (<Mono>GET /__iaia/mapa.json</Mono>), que només se servix al
        servidor local de desenvolupament. Mentre el compilador <Mono>tooling/brain/mapa-consola.mjs</Mono> i
        la ruta del middleware no s’instal·len, no hi ha dades i la Consola no en inventa.
      </EstatBuit>
      {xifres}
    </>
  );
}

/* ── Tauler i peces compartides ─────────────────────────────────────────── */

/* T12 (ordre del Mestre, 260930) · La ruta de l'avís és el seu node sense el
   tipus (document:.agents/SKILLS_SEAL.json): problemesConsola.js · rutaDelNode,
   l'única còpia (correcció de l'Onada 6, revisió adversarial). */

/**
 * Quan la vigilància mateixa està trencada (CODIS_VIGILANCIA, consolaPagines.js),
 * el tauler ho diu dalt de tot amb una <Alerta to="error"> (rol alert: cal
 * actuar ja). Què està trencat es diu amb la redacció del detall de
 * l'Explorador (TEXTOS_AVIS, grafMapa.js; Avisos i salut pinta el codi tal
 * qual, i per això un codi sense text es diu pel seu nom); on mirar va
 * darrere, separat de la frase: la ruta del node i l'evidència del
 * compilador, que passen pel mode privacitat del marc (PrivacitatConsola).
 * Correcció B1 (260930): rol alert de l'encàrrec i procedència sense parèntesis.
 * Correcció 261004 (verificador de la segona passada, punt 2) · L'evidència
 * porta recomptes («8 segells fòssils», «6 de 30 skills fora del segell»)
 * que resumixen una xifra amb targeta: cada avís hi enllaça, amb el títol de
 * la targeta (XIFRA_DE_CODI). Derogat per l'ordre del Mestre del 261004 (xat:
 * cap xifra solta): «sense enllaç propi: la porta a Avisos i salut és la seua
 * targeta».
 */
function AlertaVigilancia({ mapa }) {
  const avisos = avisosDeVigilancia(mapa);
  if (!avisos.length) return null;
  const delMas = new Map(xifresDeLaGraella(mapa).map((x) => [x.slug, x]));
  return (
    <Alerta to="error" titol="La vigilància del cervell està trencada">
      <ul>
        {avisos.map((a, i) => {
          const xifra = delMas.get(XIFRA_DE_CODI[a.codi]);
          return (
            <li key={`${a.node}-${a.codi}-${i}`}>
              {TEXTOS_AVIS[a.codi] ?? `Avís ${a.codi}.`} On: <Mono>{rutaDelNode(a.node)}</Mono>
              {typeof a.evidencia === 'string' && a.evidencia ? <> · Evidència: <Privat>{a.evidencia}</Privat></> : null}
              {xifra ? <> · La seua xifra: <Link to={xifra.ruta}>{xifra.titol}</Link></> : null}
            </li>
          );
        })}
      </ul>
      <p>El detall i què cal reparar són a la pàgina {paginaConsola('salut').title}.</p>
    </Alerta>
  );
}

const fontsDe = (consola, mapa) => ({
  dades: consola.dades, estatDades: consola.estat, mapa: mapa.mapa, estatMapa: mapa.estat
});

/**
 * Les targetes del tauler. Cada una explica la seua pàgina (el «per a què»
 * de subtítol i l'entradilla del copy), porta a la seua ruta, resumix dades
 * reals o diu per què no n'hi ha, desglossa a la coberta el que la pàgina
 * marca per dins (T3) i du les etiquetes d'un colp d'ull (consolaPagines.js).
 * El record de visites es llig en muntar el tauler: tornar-hi des d'una
 * pàgina el refresca. Davall, «El Mas en xifres», també sense Mapa.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · «Col·locar a les
 * capçaleres de les targetes de la Consola Termodinàmica les il·lustracions
 * artístiques de Pedra Seca existents.» Amb `ambImatges`, cada targeta porta
 * la il·lustració de la seua pàgina (imatgesConsola.js) al mitjà, quadrada i
 * centrada (Llei Visual del quadrat), i la icona d'ICONES deixa de pintar-se
 * (TargetaConsola: «la imatge o la icona»). Només el tauler de /consola en
 * porta: la Consola incrustada de la Wiki (ConsolaIncrustada) no passa
 * `ambImatges`, i les seues nou targetes continuen amb la icona (des del pla
 * 261027_0845, §3, la resta del seu tauler sí que canvia: TaulerAmbGovern,
 * avall). Derogat EN PART per l'ordre del
 * Mestre del 13-10-2026 (pla 261013_1405, front F): l'Onada 12 (261011;
 * ordres 261011_0130, punt 2), «fora de l'índex, el tauler no guanya cap
 * imatge de contingut», i l'ordre del 260926 «la icona de la part en el lloc
 * de la foto» per a les nou targetes de /consola (les xifres conserven la
 * seua icona).
 * `ara` és el rellotge de la pintada: la coberta i l'etiqueta del pols diuen
 * el mateix dels rebuts, i el tauler de /consola el comparteix amb el
 * Diagnòstic del Mas (DiagnosiConsola.jsx). Sense, el d'ara.
 * Revisió adversarial del carril F1 (problema 10) · Amb `alertaFora`, el
 * tauler no pinta l'alerta de vigilància: la pinta qui el munta, dalt de tot
 * (a /consola, damunt del Govern del Mestre). Sense la prop, el DOM de sempre.
 * Pla 261027_0845 (Guarda Nocturna), §3 · Les dues que el munten (/consola i
 * la Consola incrustada de la Wiki) passen per TaulerAmbGovern i porten la
 * prop. Derogat: «la Consola incrustada de la Wiki conserva els seus píxels»
 * (sense la prop).
 */
export function ConsolaTauler({ consola, mapa, cimRef, ambImatges = false, alertaFora = false, ara = Date.now() }) {
  const fonts = fontsDe(consola, mapa);
  const [vistes] = useState(llegixVistes);
  return (
    <>
      {alertaFora ? null : <AlertaVigilancia mapa={mapa.mapa} />}
      <nav className="sdp-card-grid sdp-consola__graella" aria-label="Pàgines de la Consola" ref={cimRef}>
        {paginesConsola().map((p) => {
          const delMapa = p.id !== 'pols';
          return (
            <TargetaConsola key={p.id} icona={ICONES[p.id]} titol={p.title} subtitol={p.subtitle}
              {...(ambImatges ? imatgeDePagina(p.id) : null)}
              entradilla={p.lead} metriques={mesuresPagina(p.id, fonts)} dada={resumPagina(p.id, fonts)} a={p.ruta}
              estats={estatsPagina(p.id, fonts, ara)}
              problemes={problemesPagina(p.id, fonts)}
              creat={dataDelCopy()}
              generat={delMapa ? mapa.mapa?.generat : consola.dades?.generat}
              etiquetes={etiquetesPagina(p.id, fonts, vistes?.[p.id], ara)} />
          );
        })}
      </nav>
      <XifresMas mapa={mapa.mapa} />
    </>
  );
}

/**
 * Pla 261027_0845 (Guarda Nocturna), §3 · El cap del tauler, un sol per a
 * /consola i per a la Consola incrustada de la Wiki, perquè no tornen a
 * divergir: l'alerta de vigilància al cim, el Govern del Mestre (SeccioGovern:
 * el seu H2 i quatre targetes que porten a /consola/govern/<id>), l'H2 de la
 * sala de màquines (TITOL_SALA_MAQUINES) i les nou targetes, que ja no pinten
 * l'alerta (alertaFora). `ara` és el rellotge de tota la pintada. Les
 * il·lustracions (ambImatges) continuen sent només del tauler de /consola, i
 * l'Índex i el Diagnòstic, que van darrere, també.
 */
function TaulerAmbGovern({ consola, mapa, govern, ara, cimRef, ambImatges = false }) {
  return (
    <>
      <AlertaVigilancia mapa={mapa.mapa} />
      <SeccioGovern govern={govern} ara={ara} />
      <h2>{TITOL_SALA_MAQUINES}</h2>
      <ConsolaTauler consola={consola} mapa={mapa} cimRef={cimRef} ambImatges={ambImatges} alertaFora ara={ara} />
    </>
  );
}

/** El tauler dins d'un altre marc (la Wiki): llig les seues fonts, i la
    privacitat que el visitant va deixar a la Consola, pel seu compte.
    Higiene d'amfitrió (261004) · La Wiki és pública: fora de DEV les fonts
    no es demanen i el tauler diu que no hi ha dades.
    Pla 261027_0845 (Guarda Nocturna), §3 · També el Govern del Mestre, amb
    el mateix cap que /consola (TaulerAmbGovern). useGovern es munta una sola
    vegada per a tota la fitxa, com consola.json i el Mapa: fora de DEV no
    demana /__iaia/govern.json, i el registre de certificacions és el d'este
    navegador, el mateix que llig /consola. */
export function ConsolaIncrustada() {
  const consola = useConsola({ actiu: import.meta.env.DEV === true });
  const mapa = useMapa({ actiu: import.meta.env.DEV === true });
  const govern = useGovern({ actiu: import.meta.env.DEV === true });
  const [privat] = useState(() => llegixPrivacitat());
  return (
    <PrivacitatConsola.Provider value={privat}>
      <TaulerAmbGovern consola={consola} mapa={mapa} govern={govern} ara={Date.now()} />
    </PrivacitatConsola.Provider>
  );
}

/* Instantània, Refrescar i Privacitat són dades de la pàgina, no capçalera:
   viuen en un panell al peu (ordre del Mestre, 260926), perquè el que el
   visitant veu primer siga la molla de pa i el contingut. `cimRef` no depén
   de la posició: tornaAlCim puja pels pares fins al contenidor de scroll. */
function ControlsConsola({ pagina, consola, mapa, empaquetats, privat, onPrivat, locale, cimRef }) {
  const { dades } = consola;
  /* Correcció 261004 (verificador de la segona passada, punt 2) · El recompte
     d'operacions immunitàries (amb la data de l'última, T12) era una xifra
     solta al peu de totes les pàgines del pols: ara és la targeta
     «operacions-immunitaries» del pols. El peu només data la instantània.
     Cada pàgina data la seua pròpia font: el pols, consola.json; la resta, el Mapa. */
  /* P1-35 · La pàgina dels empaquetats data la seua font, /__iaia/empaquetats.json. */
  const instantania = pagina === 'pols'
    ? (dades?.generat && `Instantània: ${dataLocal(dades.generat, locale)}`)
    : pagina === 'empaquetats'
      ? (empaquetats?.valor?.generat && `Instantània dels empaquetats: ${dataLocal(empaquetats.valor.generat, locale)}`)
      : (mapa.mapa?.generat && `Instantània del Mapa: ${dataLocal(mapa.mapa.generat, locale)}`);
  return (
    <div className="sdp-consola__peu" ref={cimRef}>
      <p className="sdp-consola__instantania" role="status">
        {instantania || 'Instantània encara no disponible.'}
      </p>
      {/* P1-35 (pla 261028_1526 §3.5.2) · La Versió Canònica del Sistema, la
          mateixa del Diagnòstic del Mas. Sense role=status: no canvia mai
          mentre es mira, i el peu té una sola regió viva (la instantània). */}
      <p className="sdp-consola__instantania">{`${ETIQUETA_VERSIO}: ${versioCanonica()}`}</p>
      <Boto varietat="secundari" icona={RefreshCw}
        carregant={consola.estat === 'loading' || mapa.estat === 'loading' || empaquetats?.estat === 'loading'}
        onClick={() => { consola.carrega(); mapa.carrega(); empaquetats?.carrega(); }}>Refrescar</Boto>
      <Interruptor etiqueta="Privacitat: amaga rutes, ordres i empremtes"
        actiu={privat} onCanvi={onPrivat} />
    </div>
  );
}

/* Cada pàgina és una vista de VISTES_XIFRES (xifresMas.js) amb el seu id. */
function ContingutPagina({ id, consola, mapa, locale }) {
  const ambMapa = (pinta) => <AmbMapa font={mapa} vista={id}>{pinta}</AmbMapa>;
  switch (id) {
    case 'pols': return <PaginaPols consola={consola} locale={locale} />;
    case 'explorador': return ambMapa((m) => <ExploradorMapa mapa={m} />);
    case 'fluxos': return ambMapa((m) => <FluxosMapa mapa={m} />);
    case 'calendari': return ambMapa((m) => <CalendariMapa mapa={m} locale={locale} />);
    case 'inventari': return ambMapa((m) => <InventariMapa mapa={m} locale={locale} />);
    case 'entrades': return ambMapa((m) => <EntradesEixides mapa={m} />);
    case 'agents': return ambMapa((m) => <AgentsAtomics mapa={m} />);
    case 'actors': return ambMapa((m) => <ActorsMapa mapa={m} />);
    case 'salut': return <MapaConsola locale={locale} font={mapa} />;
    default: return null;
  }
}

/* ── Secció ─────────────────────────────────────────────────────────────── */

/* El títol i la descripció de la pestanya: el tauler, una pàgina, un panell
   del pols o una xifra (la seua imatge, si en té, és la del SEO). El que no
   existix no s'indexa. Amb el mode privacitat, el títol de la pestanya no
   porta cap ruta (titolPrivat).
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · La imatge de la
   targeta d'una pàgina del tauler (imatgesConsola.js) és la imatge SEO de la
   seua pàgina (lliçó 261004 de sdp-universal-page). No en fa la portada
   (hero): la Llei Visual del quadrat no cobrix la portada de PageFrame i
   canviaria els píxels de nou pàgines sense l'ordre del Mestre. */
function seoDe({ copy, pagina, slugXifra, xifra, llegint, idPanell, panell, idGovern, paginaDeGovern, deEmpaquetats, privat }) {
  if (slugXifra !== null) {
    // Mentre les fonts es lligen no se sap si la xifra existix (PaginaXifra espera).
    if (!xifra && llegint) return { title: `El Mas en xifres · ${copy.title}`, description: copy.lead };
    if (!xifra) return { title: `Xifra no trobada · ${copy.title}`, description: 'Esta adreça no correspon a cap xifra del Mas.', index: false };
    const titol = privat && xifra.titolPrivat ? xifra.titolPrivat : xifra.titol;
    return { title: `${titol} · ${copy.title}`, description: xifra.entradeta, image: xifra.imatge || undefined };
  }
  if (idPanell !== null) {
    if (!panell) return { title: `Panell no trobat · ${copy.title}`, description: 'Esta adreça no correspon a cap panell del pols.', index: false };
    return { title: `${panell.titol} · ${copy.title}`, description: entradetaPlana(panell.entradilla) };
  }
  // Onada 0.5 (pla 261016_1530) · Les pàgines del Govern del Mestre: el que no existix no s'indexa.
  if (idGovern !== null) {
    if (!paginaDeGovern) return { title: `Pàgina no trobada · ${copy.title}`, description: 'Esta adreça no correspon a cap pàgina del govern del Mestre.', index: false };
    return { title: `${paginaDeGovern.title} · ${copy.title}`, description: paginaDeGovern.lead };
  }
  // P1-35 · /consola/empaquetats.
  if (deEmpaquetats) {
    const p = paginaEmpaquetats();
    return { title: `${p.title} · ${copy.title}`, description: p.lead };
  }
  if (pagina) return { title: `${pagina.title} · ${copy.title}`, description: pagina.lead, image: imatgeDePagina(pagina.id).imatge || undefined };
  return { title: copy.title, description: copy.lead };
}

export default function ConsolaSection() {
  const { locale } = useUIState();
  const params = useParams();
  /* Ordre del Mestre, 261004 (xat: cap xifra solta) · /consola/xifres/<slug>
     és la pàgina d'una xifra o d'una peça; /consola/pols/<id>, la d'un panell
     del pols; la resta de rutes, les de sempre (segmentPagina no canvia). */
  const comodi = params['*'];
  const slugXifra = segmentXifra(comodi);
  const idPanell = slugXifra === null ? segmentPols(comodi) : null;
  // Onada 0.5 (pla 261016_1530) · /consola/govern/<id>, la pàgina d'un mòdul del Govern del Mestre.
  const idGovern = slugXifra === null && idPanell === null ? segmentGovern(comodi) : null;
  // P1-35 (pla 261028_1526 §3.5.2) · /consola/empaquetats, la pàgina dels empaquetats.
  const deEmpaquetats = slugXifra === null && idPanell === null && idGovern === null && esRutaEmpaquetats(comodi);
  const sensePropia = slugXifra === null && idPanell === null && idGovern === null && !deEmpaquetats;
  const id = sensePropia ? segmentPagina(comodi) : '';
  const pagina = sensePropia && id ? paginaConsola(id) : null;
  const paginaDeGovern = idGovern === null ? null : paginaGovern(idGovern);
  const copy = copyConsola();
  const consola = useConsola();
  const mapa = useMapa();
  const govern = useGovern();
  // P1-35 · Els empaquetats es lligen una sola vegada per a tota la secció, com les altres fonts.
  const empaquetats = useFontDev(carregaEmpaquetats);
  const [privat, setPrivatEstat] = useState(() => llegixPrivacitat());
  const setPrivat = useCallback((actiu) => { setPrivatEstat(actiu); desaPrivacitat(actiu); }, []);
  const cim = useRef(null);
  const signatura = pagina ? signaturaPagina(pagina.id, fontsDe(consola, mapa)) : null;
  const xifra = slugXifra === null ? null : xifraDelMas(slugXifra, mapa.mapa, consola.dades, locale);
  const panell = idPanell === null ? null : panellPols(idPanell);

  const llegint = mapa.estat === 'loading' || consola.estat === 'loading';
  useSEO(seoDe({ copy, pagina, slugXifra, xifra, llegint, idPanell, panell, idGovern, paginaDeGovern, deEmpaquetats, privat }));

  /* /consola/* és un sol element muntat: canviar de pàgina no desmunta res i
     el contenidor de scroll de l'aplicació es quedava on era. */
  useLayoutEffect(() => { tornaAlCim(cim.current); }, [id, slugXifra, idPanell, idGovern, deEmpaquetats]);

  /* Obrir una pàgina amb la seua font carregada la marca com a vista: el
     tauler només dirà «Canvis nous» si el resum canvia després. */
  useEffect(() => {
    if (pagina && signatura) marcaVista(pagina.id, signatura);
  }, [pagina?.id, signatura]); // eslint-disable-line react-hooks/exhaustive-deps

  const peu = (quina) => (
    <ControlsConsola pagina={quina} consola={consola} mapa={mapa} empaquetats={empaquetats} privat={privat} onPrivat={setPrivat} locale={locale} cimRef={cim} />
  );

  /* Neteja 261007 (prompt 261007_1628, peça D) · La xifra es busca una sola
     vegada per pintada (xifraDelMas recorre totes les vistes de la Consola):
     la mateixa del SEO i del peu passa a la pàgina, i la pàgina al detall. */
  if (slugXifra !== null) {
    return (
      <PaginaXifra slug={slugXifra} xifra={xifra} fonts={{ mapa, consola }} creat={dataDelCopy()} privat={privat} locale={locale}
        peu={peu(xifra?.origen === 'consola' ? 'pols' : 'xifra')} />
    );
  }

  if (idPanell !== null) {
    return <PaginaPanellPols id={idPanell} consola={consola} locale={locale} privat={privat} peu={peu('pols')} />;
  }

  if (idGovern !== null) {
    return <PaginaDeGovern id={idGovern} govern={govern} privat={privat} onPrivat={setPrivat} locale={locale} cimRef={cim} />;
  }

  if (deEmpaquetats) return <PaginaEmpaquetats font={empaquetats} privat={privat} peu={peu('empaquetats')} />;

  if (id === null) return <Navigate to={RUTA_CONSOLA} replace />;

  if (!pagina) {
    // Un sol rellotge per a les targetes i el Diagnòstic del Mas: el text diu el mateix dels rebuts.
    const ara = Date.now();
    return (
      /* T2 (ordre del Mestre, 260930) · l'Índex de la Consola arriba a h6: hi entren les mètriques (h5).
         Correcció B1 (260930) · el tauler també respecta la privacitat recordada: l'alerta de
         vigilància hi pinta rutes i ordres.
         Onada 11 (261010; prompt 261010_1730, tasca 5) · Davall de totes les targetes, l'Índex de
         la Consola (IndexConsola.jsx): text pur, H2, H3 per pàgina i H4 per targeta, cada títol
         enllaçat a la seua pàgina. Només ací, a /consola: la Consola incrustada de la Wiki
         (ConsolaIncrustada) no el pinta (el pla 261027_0845, §3, només hi afig el Govern del
         Mestre; l'Índex, no). Dins del mateix proveïdor
         de privacitat: les entradetes porten rutes en <Mono>.
         Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · Les targetes del tauler porten
         la il·lustració de la seua pàgina (ambImatges), i darrere de l'Índex, tancant el tauler,
         el Diagnòstic del Mas (DiagnosiConsola.jsx): l'accés ràpid a les nou pàgines i el
         diagnòstic sencer en un <pre>, amb les mateixes fonts i el mateix rellotge que les
         targetes. Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
         front F): l'Índex de la Consola com a últim bloc del tauler (Onada 11). Tampoc a la
         Consola incrustada.
         Pla 261016_1530, Onada 0.5 (Mandat Suprem) · Damunt de les nou targetes, el Govern del
         Mestre (SeccioGovern): el seu H2 i quatre targetes. Fora de ConsolaTauler: la Consola
         incrustada de la Wiki conserva els seus píxels.
         Revisió adversarial del carril F1 (problemes 2, 9 i 10) · La sala de màquines porta el
         seu H2 (TITOL_SALA_MAQUINES), també fora de ConsolaTauler: l'Índex de secció i la
         navegació per encapçalaments ja no posen les nou targetes davall del Govern del Mestre.
         I l'alerta de vigilància continua al cim del tauler, damunt del govern (alertaFora).
         Derogat EN PART: el separador (Divisor) entre el govern i la sala de màquines, i
         l'alerta just davant de les nou targetes.
         Pla 261027_0845 (Guarda Nocturna), §3 · Eixe cap (alerta, govern, H2 de la sala i nou
         targetes) és TaulerAmbGovern, el mateix de la Consola incrustada de la Wiki; ací, amb
         les il·lustracions. El DOM de /consola no canvia. Derogat de l'Onada 0.5: «Fora de
         ConsolaTauler: la Consola incrustada de la Wiki conserva els seus píxels».
         P1-35 (pla 261028_1526 §3.5.2) · Darrere de les xifres i abans de l'Índex, la secció
         dels empaquetats (EmpaquetatsConsola.jsx): el seu H2 i una targeta que porta a
         /consola/empaquetats. Només ací: ni la Consola incrustada de la Wiki ni l'Índex. */
      <UniversalPage title={copy.title} subtitle={copy.subtitle} lead={copy.lead} chrome="system" nivellMaxIndex={6}>
        <PrivacitatConsola.Provider value={privat}>
          <TaulerAmbGovern consola={consola} mapa={mapa} govern={govern} ara={ara} cimRef={cim} ambImatges />
          <SeccioEmpaquetats font={empaquetats} />
          <IndexConsola mapa={mapa.mapa} dades={consola.dades} locale={locale} />
          <DiagnosiConsola fonts={fontsDe(consola, mapa)} locale={locale} ara={ara} />
        </PrivacitatConsola.Provider>
      </UniversalPage>
    );
  }

  return (
    <UniversalPage title={pagina.title} subtitle={pagina.subtitle} lead={pagina.lead} chrome="system" nivellMaxIndex={6}>
      <PrivacitatConsola.Provider value={privat}>
        <MollaPa className="sdp-molla--panell"
          passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: pagina.title }]} />
        <ContingutPagina id={pagina.id} consola={consola} mapa={mapa} locale={locale} />
        {peu(pagina.id)}
      </PrivacitatConsola.Provider>
    </UniversalPage>
  );
}

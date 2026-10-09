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
   (TargetaResum) sense boina ni pàgina. */

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
 */
export function ConsolaTauler({ consola, mapa, cimRef }) {
  const fonts = fontsDe(consola, mapa);
  const [vistes] = useState(llegixVistes);
  // Un sol rellotge per pintada: la coberta i l'etiqueta del pols diuen el mateix dels rebuts.
  const ara = Date.now();
  return (
    <>
      <AlertaVigilancia mapa={mapa.mapa} />
      <nav className="sdp-card-grid sdp-consola__graella" aria-label="Pàgines de la Consola" ref={cimRef}>
        {paginesConsola().map((p) => {
          const delMapa = p.id !== 'pols';
          return (
            <TargetaConsola key={p.id} icona={ICONES[p.id]} titol={p.title} subtitol={p.subtitle}
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

/** El tauler dins d'un altre marc (la Wiki): llig les seues fonts, i la
    privacitat que el visitant va deixar a la Consola, pel seu compte.
    Higiene d'amfitrió (261004) · La Wiki és pública: fora de DEV les dues
    fonts no es demanen i el tauler diu que no hi ha dades. */
export function ConsolaIncrustada() {
  const consola = useConsola({ actiu: import.meta.env.DEV === true });
  const mapa = useMapa({ actiu: import.meta.env.DEV === true });
  const [privat] = useState(() => llegixPrivacitat());
  return (
    <PrivacitatConsola.Provider value={privat}>
      <ConsolaTauler consola={consola} mapa={mapa} />
    </PrivacitatConsola.Provider>
  );
}

/* Instantània, Refrescar i Privacitat són dades de la pàgina, no capçalera:
   viuen en un panell al peu (ordre del Mestre, 260926), perquè el que el
   visitant veu primer siga la molla de pa i el contingut. `cimRef` no depén
   de la posició: tornaAlCim puja pels pares fins al contenidor de scroll. */
function ControlsConsola({ pagina, consola, mapa, privat, onPrivat, locale, cimRef }) {
  const { dades } = consola;
  /* Correcció 261004 (verificador de la segona passada, punt 2) · El recompte
     d'operacions immunitàries (amb la data de l'última, T12) era una xifra
     solta al peu de totes les pàgines del pols: ara és la targeta
     «operacions-immunitaries» del pols. El peu només data la instantània.
     Cada pàgina data la seua pròpia font: el pols, consola.json; la resta, el Mapa. */
  const instantania = pagina === 'pols'
    ? (dades?.generat && `Instantània: ${dataLocal(dades.generat, locale)}`)
    : (mapa.mapa?.generat && `Instantània del Mapa: ${dataLocal(mapa.mapa.generat, locale)}`);
  return (
    <div className="sdp-consola__peu" ref={cimRef}>
      <p className="sdp-consola__instantania" role="status">
        {instantania || 'Instantània encara no disponible.'}
      </p>
      <Boto varietat="secundari" icona={RefreshCw}
        carregant={consola.estat === 'loading' || mapa.estat === 'loading'}
        onClick={() => { consola.carrega(); mapa.carrega(); }}>Refrescar</Boto>
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
   porta cap ruta (titolPrivat). */
function seoDe({ copy, pagina, slugXifra, xifra, llegint, idPanell, panell, privat }) {
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
  if (pagina) return { title: `${pagina.title} · ${copy.title}`, description: pagina.lead };
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
  const id = slugXifra === null && idPanell === null ? segmentPagina(comodi) : '';
  const pagina = slugXifra === null && idPanell === null && id ? paginaConsola(id) : null;
  const copy = copyConsola();
  const consola = useConsola();
  const mapa = useMapa();
  const [privat, setPrivatEstat] = useState(() => llegixPrivacitat());
  const setPrivat = useCallback((actiu) => { setPrivatEstat(actiu); desaPrivacitat(actiu); }, []);
  const cim = useRef(null);
  const signatura = pagina ? signaturaPagina(pagina.id, fontsDe(consola, mapa)) : null;
  const xifra = slugXifra === null ? null : xifraDelMas(slugXifra, mapa.mapa, consola.dades, locale);
  const panell = idPanell === null ? null : panellPols(idPanell);

  const llegint = mapa.estat === 'loading' || consola.estat === 'loading';
  useSEO(seoDe({ copy, pagina, slugXifra, xifra, llegint, idPanell, panell, privat }));

  /* /consola/* és un sol element muntat: canviar de pàgina no desmunta res i
     el contenidor de scroll de l'aplicació es quedava on era. */
  useLayoutEffect(() => { tornaAlCim(cim.current); }, [id, slugXifra, idPanell]);

  /* Obrir una pàgina amb la seua font carregada la marca com a vista: el
     tauler només dirà «Canvis nous» si el resum canvia després. */
  useEffect(() => {
    if (pagina && signatura) marcaVista(pagina.id, signatura);
  }, [pagina?.id, signatura]); // eslint-disable-line react-hooks/exhaustive-deps

  const peu = (quina) => (
    <ControlsConsola pagina={quina} consola={consola} mapa={mapa} privat={privat} onPrivat={setPrivat} locale={locale} cimRef={cim} />
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

  if (id === null) return <Navigate to={RUTA_CONSOLA} replace />;

  if (!pagina) {
    return (
      /* T2 (ordre del Mestre, 260930) · l'Índex de la Consola arriba a h6: hi entren les mètriques (h5).
         Correcció B1 (260930) · el tauler també respecta la privacitat recordada: l'alerta de
         vigilància hi pinta rutes i ordres. */
      <UniversalPage title={copy.title} subtitle={copy.subtitle} lead={copy.lead} chrome="system" nivellMaxIndex={6}>
        <PrivacitatConsola.Provider value={privat}>
          <ConsolaTauler consola={consola} mapa={mapa} cimRef={cim} />
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

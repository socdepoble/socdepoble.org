/**
 * XifresMas.jsx — les targetes amb pàgina pròpia de la Consola: «El Mas en
 * xifres» del tauler, les xifres de dins de cada pàgina, les peces del Mapa
 * i la pàgina pròpia de cada una (/consola/xifres/<slug>).
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · «TOT han de ser targetes
 * pures (UniversalCard). Si no tenen capçalera (boina taronja), no puc
 * editar-les ni tindre una pàgina pròpia.» Derogat per l'ordre del Mestre del
 * 261004 (xat: cap xifra solta): les xifres com a targetes compactes del
 * Control (TargetaResum, «action»), sense boina ni peu, també les de dins dels
 * panells i de les vistes del Mapa. Ara cada xifra és una targeta pura:
 *  · TargetaXifra → TargetaConsola (peces.jsx): la UniversalCard sencera, amb
 *    la boina de Sóc de Poble (autor enllaçat a /projecte i la pastilla de la
 *    data de la mesura), títol amb la xifra, subtítol, entradeta que explica
 *    què compta, d'on ix i per què importa (els noms de fitxer en <Mono>), la
 *    icona a la insígnia lateral (sense imatge), les etiquetes d'estat i el
 *    peu canònic. Tota la targeta, i Connectar, porten a la seua pàgina.
 *  · PaginaXifra: la Pàgina Universal (PaginaApp) amb el mateix títol,
 *    subtítol i entradeta, Sóc de Poble a la barra taronja, la imatge de la
 *    targeta de portada si en té, i al cos la dada viva detallada (les
 *    evidències en <Mono>: el mode privacitat les amaga) i la pàgina de la
 *    Consola que la tracta. Compartir hi comparteix la seua adreça.
 * Els textos i el detall viuen a xifresMas.js, sense React.
 */
import { useContext, useId } from 'react';
import {
  Activity, Anchor, Bot, Box, CalendarDays, CalendarRange, CircleDashed, CircleHelp, ClipboardList, Clock,
  Cpu, FileStack, FileX, FolderOpen, Gauge, Ghost, GitBranch, HeartPulse, Inbox, Infinity as IconaSempre, Layers,
  Link2, Link2Off, ListChecks, Lock, LockOpen, Network, OctagonAlert, Power, Puzzle, Receipt, Route,
  ScrollText, SearchX, ShieldAlert, ShieldCheck, Shuffle, Siren, Stamp, Sun, Syringe, Timer, TimerOff, TriangleAlert,
  Unlink, Waypoints, Workflow, Zap, ZapOff
} from 'lucide-react';
import {
  Alerta, Carregant, EstatBuit, Insignia, MollaPa, PaginaApp, Taula
} from '../../components/PedraSeca';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { AUTORIA_SOCDEPOBLE } from '../control/destinsControl.js';
import { RUTA_CONSOLA, copyConsola } from './consolaPagines.js';
import { Mono, PrivacitatConsola, TargetaConsola } from './peces.jsx';
import { EvidenciesAvis, codiIFrase } from './mapa/AvisosMapa.jsx';
import {
  TEXT_ESTAT as TEXT_ESTAT_TASCA, TO_CONFIANCA, TO_ESTAT as TO_ESTAT_TASCA, TO_SEVERITAT, etiquetaNode
} from './mapa/grafMapa.js';
import { trossosEntradeta } from './xifresComu.js';
import { rutaDelNode } from './problemesConsola.js';
import { GENERADOR_CONSOLA, GENERADOR_MAPA, detallXifra, xifraDelMas, xifresDeLaGraella } from './xifresMas.js';

/** La icona de cada xifra i de cada peça: la de la seua insígnia lateral (no en porten imatge). */
export const ICONES_XIFRES = Object.freeze({
  activity: Activity, anchor: Anchor, bot: Bot, box: Box, calendarDays: CalendarDays, calendarRange: CalendarRange,
  circleDashed: CircleDashed, circleHelp: CircleHelp, clipboardList: ClipboardList, clock: Clock, cpu: Cpu,
  fileStack: FileStack, fileX: FileX, folderOpen: FolderOpen, gauge: Gauge, ghost: Ghost, gitBranch: GitBranch,
  heartPulse: HeartPulse, inbox: Inbox, infinity: IconaSempre, layers: Layers, link2: Link2, link2Off: Link2Off,
  listChecks: ListChecks, lock: Lock, lockOpen: LockOpen, network: Network,
  octagonAlert: OctagonAlert, power: Power, puzzle: Puzzle, receipt: Receipt, route: Route, scrollText: ScrollText,
  shieldAlert: ShieldAlert, shieldCheck: ShieldCheck, shuffle: Shuffle, siren: Siren, stamp: Stamp, sun: Sun,
  syringe: Syringe, timer: Timer, timerOff: TimerOff, triangleAlert: TriangleAlert, unlink: Unlink,
  waypoints: Waypoints, workflow: Workflow, zap: Zap, zapOff: ZapOff
});
const iconaDe = (xifra) => ICONES_XIFRES[xifra.icona] ?? Puzzle;

/* L'autor de la pàgina, el mateix de la boina de la targeta: l'entitat. */
const AUTOR = Object.freeze({
  nom: AUTORIA_SOCDEPOBLE.author,
  avatar: AUTORIA_SOCDEPOBLE.avatarUrl,
  href: AUTORIA_SOCDEPOBLE.authorHref,
  poble: AUTORIA_SOCDEPOBLE.location
});

/** L'entradeta d'una xifra: els noms de fitxer (entre accents greus a xifresMas.js) en <Mono>. */
export function Entradeta({ marcada }) {
  return trossosEntradeta(marcada).map((t, i) => ('mono' in t ? <Mono key={i}>{t.mono}</Mono> : t.text));
}

/* El títol i el subtítol que es veuen: amb el mode privacitat, els que no
   porten cap ruta (xifresMas.js · titolPrivat, subtitolPrivat). */
function textos(xifra, privat) {
  return {
    titol: privat && xifra.titolPrivat ? xifra.titolPrivat : xifra.titol,
    subtitol: privat && xifra.subtitolPrivat ? xifra.subtitolPrivat : xifra.subtitol
  };
}

/**
 * La targeta d'una xifra o d'una peça. `generat` és la data de la seua font
 * (el Mapa o consola.json); `creat`, la del copy de la Consola: a la
 * pastilla mana la més recent (T51).
 */
export function TargetaXifra({ xifra, generat = null, creat = copyConsola().date }) {
  const privat = useContext(PrivacitatConsola);
  const { titol, subtitol } = textos(xifra, privat);
  return (
    <TargetaConsola icona={iconaDe(xifra)} titol={titol} subtitol={subtitol}
      entradilla={<Entradeta marcada={xifra.entradetaMarcada} />}
      imatge={xifra.imatge} imatgeAlt={xifra.imatgeAlt} etiquetes={xifra.etiquetes ?? undefined}
      problemes={xifra.problemes ?? undefined}
      creat={creat} generat={generat} a={xifra.ruta} />
  );
}

/** Una graella de targetes de xifra, la de les targetes explicatives de la Consola. */
export function GraellaXifres({ xifres, generat = null }) {
  if (!xifres.length) return null;
  return (
    <div className="sdp-card-grid sdp-consola__graella">
      {xifres.map((x) => <TargetaXifra key={x.slug} xifra={x} generat={generat} />)}
    </div>
  );
}

/**
 * Les deu xifres del tauler. Sense Mapa també es pinten, amb el seu nom i
 * sense cap número: la seua pàgina existix i diu per què no hi ha dada
 * (correcció 261004, verificador, punt 9: cap pàgina sense targeta).
 */
export function XifresMas({ mapa = null }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>El Mas en xifres</h2>
      <GraellaXifres xifres={xifresDeLaGraella(mapa)} generat={mapa?.generat ?? null} />
    </section>
  );
}

/* Els estats de les tasques (els de la taula de Salut, MapaConsola.jsx) i el
   N/A d'una mètrica sense mesura.
   Neteja 261007 (prompt 261007_1628, peça D) · Els estats de les tasques
   són els de grafMapa.js, la seua única font. El N/A és l'única diferència i
   es queda ací: és la cel·la d'una mètrica sense mesura (filaMetrica,
   xifresComu.js), no un estat de tasca (ESTATS_TASCA no el porta), i la
   taula de Salut (MapaConsola.jsx) pinta el seu N/A sense passar per l'estat.
   Amb ell, el detall diu «N/A» en una insígnia neutra, com fins ara. */
const TO_ESTAT = Object.freeze({ ...TO_ESTAT_TASCA, 'N/A': 'neutre' });
const TEXT_ESTAT = Object.freeze({ ...TEXT_ESTAT_TASCA, 'N/A': 'N/A' });

/* La ruta d'una peça és el seu node sense el tipus (document:.agents/LEDGER.md):
   problemesConsola.js · rutaDelNode, l'única còpia. */

/** Una cel·la del detall (xifresMas.js): el que és ruta, ordre o empremta va en <Mono>. */
function Cela({ cela }) {
  if ('mono' in cela) return <Mono>{cela.mono}</Mono>;
  if ('node' in cela) {
    return String(cela.node).startsWith('skill:') ? etiquetaNode({ id: cela.node }) : <Mono>{rutaDelNode(cela.node)}</Mono>;
  }
  if ('codi' in cela) return codiIFrase(cela.codi);
  if ('severitat' in cela) return <Insignia to={TO_SEVERITAT[cela.severitat] ?? 'neutre'}>{cela.severitat}</Insignia>;
  if ('estat' in cela) return <Insignia to={TO_ESTAT[cela.estat] ?? 'neutre'}>{TEXT_ESTAT[cela.estat] ?? cela.estat}</Insignia>;
  if ('confianca' in cela) return <Insignia to={TO_CONFIANCA[cela.confianca] ?? 'neutre'}>{cela.confianca}</Insignia>;
  if ('avis' in cela) return <EvidenciesAvis avis={cela.avis} />;
  return cela.text;
}

function TaulaDetall({ taula }) {
  if (!taula.files.length) return <p>{taula.buit}</p>;
  return (
    <Taula titol={taula.titol} densa>
      <thead>
        <tr>{taula.columnes.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
      </thead>
      <tbody>
        {taula.files.map(({ clau, celes }) => (
          <tr key={clau}>
            {celes.map((cela, i) => (i === 0
              ? <th key={i} scope="row"><Cela cela={cela} /></th>
              : <td key={i}><Cela cela={cela} /></td>))}
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/* De quina font viu cada xifra, i com es diu quan no hi és. */
const FONTS = Object.freeze({
  mapa: Object.freeze({
    llegint: 'Llegint el mapa…', error: 'No s’ha pogut llegir el mapa', absent: 'Mapa no disponible',
    explica: (
      <>
        Esta dada viu del Mapa (<Mono>GET /__iaia/mapa.json</Mono>), que només se servix al servidor local de
        desenvolupament. Sense Mapa no hi ha mesura, i la Consola no n’inventa cap.
      </>
    )
  }),
  consola: Object.freeze({
    llegint: 'Llegint l’estat de l’eixam…', error: 'No s’ha pogut llegir consola.json', absent: 'Consola no disponible',
    explica: (
      <>
        Esta dada viu de consola.json (<Mono>GET /__iaia/consola.json</Mono>), que només se servix al servidor
        local de desenvolupament. En producció no n’hi ha, i la Consola no n’inventa cap.
      </>
    )
  })
});

/* La dada viva: la mesura, les taules i el que la font encara no sap. Sense
   font, per què; sense mesura, «Sense mesura», mai un zero ni una taula buida. */
function DadaViva({ detall, font, textos: t, icona }) {
  if (!detall) {
    if (font.estat === 'loading') return <Carregant etiqueta={t.llegint} />;
    if (font.estat === 'error') {
      return <Alerta to="error" titol={t.error}>{font.error?.message || 'Torna a provar-ho amb Refrescar.'}</Alerta>;
    }
    return <EstatBuit icona={icona} titol={t.absent}>{t.explica}</EstatBuit>;
  }
  if (detall.senseMesura) {
    return <EstatBuit icona={icona} titol="Sense mesura">{detall.senseMesura}</EstatBuit>;
  }
  return (
    <>
      {detall.mesura && <p className="sdp-consola__dada">{detall.mesura}</p>}
      {detall.taules.map((taula) => <TaulaDetall key={taula.titol} taula={taula} />)}
      {detall.nota && <p>{detall.nota}</p>}
    </>
  );
}

/**
 * La pàgina d'una xifra o d'una peça. `fonts` són les dues de la Consola
 * ({ mapa: { mapa, estat, error }, consola: { dades, estat, error } }),
 * `creat` la data del copy, `privat` el mode privacitat i `peu` els controls
 * de la Consola (instantània, Refrescar i Privacitat). Un slug que no
 * existix no peta: la pàgina ho diu i torna a la Consola.
 * Neteja 261007 (prompt 261007_1628, peça D) · `xifra` és la que ja ha
 * buscat qui la crida (ConsolaSection.jsx, per al SEO i el peu), amb les
 * mateixes fonts: null vol dir «no existix». Sense la prop, la pàgina la
 * busca ella. El detall rep la mateixa: xifraDelMas recorre totes les vistes
 * de la Consola i abans es feia tres vegades per pintada.
 */
export function PaginaXifra({ slug, xifra: donada, fonts, creat, privat = false, peu = null, locale = 'ca-ES' }) {
  const navigate = useNavigate();
  const id = useId();
  const copy = copyConsola();
  const { mapa: fontMapa, consola: fontConsola } = fonts;
  const xifra = donada === undefined ? xifraDelMas(slug, fontMapa.mapa, fontConsola.dades, locale) : donada;
  const tornar = () => navigate(RUTA_CONSOLA);

  if (!xifra) {
    /* Correcció 261004 (verificador de la segona passada, punt 1) · Una peça
       del Mapa només té pàgina quan la seua font diu que existix: mentre es
       llig, la pàgina espera; després, si cap targeta no la pinta, no existix.
       Sense alguna de les fonts (producció), ho diu. */
    const llegint = fontMapa.estat === 'loading' || fontConsola.estat === 'loading';
    const senseFont = !fontMapa.mapa || !fontConsola.dades;
    const molla = (darrer) => (
      <MollaPa className="sdp-molla--panell" passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: darrer }]} />
    );
    if (llegint) {
      return (
        <PaginaApp title="Llegint la xifra…" subtitle="El Mas en xifres"
          lead="La Consola encara llig les seues fonts: el Mapa del Mas i consola.json."
          author={AUTOR} {...dataHoraDeBarra({ creat, modificat: fontMapa.mapa?.generat })} onBack={tornar}>
          {molla('Llegint la xifra…')}
          <Carregant etiqueta="Llegint les fonts de la Consola…" />
        </PaginaApp>
      );
    }
    return (
      <PaginaApp title="Xifra no trobada" subtitle="El Mas en xifres"
        lead="Esta adreça no correspon a cap xifra ni a cap peça del Mas: les xifres vives són a les targetes de la Consola."
        author={AUTOR} {...dataHoraDeBarra({ creat, modificat: fontMapa.mapa?.generat })} onBack={tornar}>
        {molla('Xifra no trobada')}
        <EstatBuit icona={SearchX} titol="Cap xifra amb este nom">
          <Link to={RUTA_CONSOLA}>Torna a la Consola</Link> per a vore les xifres del Mas.
          {/* Correcció 261004 (verificador de la tercera passada, informatiu) · també les condicionals. */}
          {senseFont ? (
            <> Les peces del Mapa, els proveïdors de crèdits i les xifres que només existixen quan hi ha dades (les
              cadències del Calendari, les tasques sense llançador) només tenen pàgina on la seua font es pot
              llegir, al servidor local de desenvolupament: sense font no es pot saber si existixen.</>
          ) : null}
        </EstatBuit>
      </PaginaApp>
    );
  }

  const deConsola = xifra.origen === 'consola';
  const font = deConsola
    ? { valor: fontConsola.dades, estat: fontConsola.estat, error: fontConsola.error }
    : { valor: fontMapa.mapa, estat: fontMapa.estat, error: fontMapa.error };
  const quan = dataHoraDeBarra({ creat, modificat: font.valor?.generat });
  const detall = detallXifra(slug, fontMapa.mapa, fontConsola.dades, locale, xifra);
  const icona = iconaDe(xifra);
  const { titol, subtitol } = textos(xifra, privat);
  return (
    <PrivacitatConsola.Provider value={privat}>
      <PaginaApp title={titol} subtitle={subtitol} lead={<Entradeta marcada={xifra.entradetaMarcada} />}
        author={AUTOR} {...quan} heroImage={xifra.imatge || undefined} heroAlt={xifra.imatgeAlt} onBack={tornar}>
        <MollaPa className="sdp-molla--panell"
          passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: titol }]} />
        <section aria-labelledby={`${id}-dada`}>
          <h3 id={`${id}-dada`}>La dada viva</h3>
          <DadaViva detall={detall} font={font} textos={FONTS[xifra.origen]} icona={icona} />
        </section>
        <section aria-labelledby={`${id}-font`}>
          <h3 id={`${id}-font`}>D’on ix</h3>
          <p>
            Font: <Mono>{detall?.font ?? xifra.font}</Mono> · Generador: <Mono>{deConsola ? GENERADOR_CONSOLA : GENERADOR_MAPA}</Mono>
          </p>
          {detall?.prova && <p>Per a reproduir-la: <Mono>{detall.prova}</Mono></p>}
        </section>
        <section aria-labelledby={`${id}-on`}>
          <h3 id={`${id}-on`}>On es tracta</h3>
          <p>
            La pàgina de la Consola que la tracta és{' '}
            <Link to={xifra.tracta.ruta}>{xifra.tracta.titol}</Link>.
          </p>
        </section>
        {peu}
      </PaginaApp>
    </PrivacitatConsola.Provider>
  );
}

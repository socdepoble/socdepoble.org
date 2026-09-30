import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  Activity, Anchor, ArrowLeftRight, Bot, Box, CalendarClock, Coins, Gauge, Ghost, HeartPulse, LogIn, LogOut,
  Network, Puzzle, Receipt, RefreshCw, Timer, TriangleAlert, Unlink, Users, Workflow
} from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Dialeg, Taula, Insignia, EstatBuit, Carregant, Progres, Interruptor, MollaPa
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIState } from '../../app/contexts/UIContext';
import { Navigate, useParams } from '../../app/contexts/RouterContext';
import {
  carregaConsola, resumSkills, resumConsums, curt, dataLocal
} from './consolaContent.js';
import {
  LLINDAR_SATURACIO, RUTA_CONSOLA, avisosDeVigilancia, copyConsola, dataUltimaOperacio, desaPrivacitat, diesDes,
  etiquetesPagina, etiquetesPols, llegixPrivacitat, llegixVistes, marcaVista, mesuresPagina, paginaConsola,
  paginesConsola, recompteArtefactes, resumPagina, segmentPagina, signaturaPagina, ultimRebut
} from './consolaPagines.js';
import {
  Desplegable, Xifra, Mono, Privat, PrivacitatConsola, TargetaConsola, TargetaResum, movimentReduit, tornaAlCim,
  useTargetesQueObrin
} from './peces.jsx';
import { MapaConsola } from './mapa/MapaConsola.jsx';
import { useMapa } from './mapa/useMapa.js';
import { ExploradorMapa } from './mapa/ExploradorMapa.jsx';
import { CalendariMapa } from './mapa/CalendariMapa.jsx';
import { InventariMapa } from './mapa/InventariMapa.jsx';
import { EntradesEixides } from './mapa/EntradesEixides.jsx';
import { FluxosMapa } from './mapa/FluxosMapa.jsx';
import { AgentsAtomics } from './mapa/AgentsAtomics.jsx';
import { ActorsMapa } from './mapa/ActorsMapa.jsx';
import { xifresDelMas } from './mapa/actorsMapa.js';
import { TEXTOS_AVIS } from './mapa/grafMapa.js';

/* La Consola és un tauler de nou targetes (/consola) i una ruta per pàgina
   (/consola/<id>). Les dues fonts (consola.json i el Mapa) es lligen una sola
   vegada per a tota la secció: /consola/* munta el mateix element per a totes
   les subrutes, i navegar entre pàgines no torna a llegir res. Les targetes
   que expliquen una part de la Consola (tauler i pols) són UniversalCard
   senceres (TargetaConsola); les xifres i les vistes del Mapa conserven la
   targeta compacta del Panell de Control (TargetaResum, peces.jsx). */

const ICONES = Object.freeze({
  pols: Activity, explorador: Network, fluxos: Workflow, calendari: CalendarClock,
  inventari: Puzzle, entrades: ArrowLeftRight, agents: Bot, actors: Users, salut: HeartPulse
});

/* D'on ix cada targeta: la capçalera ho diu amb l'hora de la instantània. */
const FONT_DADES = 'Font: consola.json';
const FONT_MAPA = 'Font: el Mapa del Mas';

/* T51 · Cap targeta sense data (regla del Mestre). Les targetes són
   fragments de la pàgina Consola i porten la data de versió del copy
   d'eixa pàgina (PAGE_COPY.consola.date, un dia sense hora), no una data
   pròpia del seu text: els cinc panells del pols tenen el text escrit ací
   (PaginaPols), i les pàgines del tauler que PAGE_COPY encara no porta,
   el copy provisional de consolaPagines.js. Si hi ha instantània i és més
   recent, mana la instantània (TargetaConsola). */
const dataDelCopy = () => copyConsola().date;

const plural = (n, un, molts) => `${n} ${n === 1 ? un : molts}`;
const faDies = (dies) => (dies === 0 ? 'avui' : `fa ${plural(dies, 'dia', 'dies')}`);

/** Una lectura de /__iaia/consola.json. Un error conserva l'última instantània bona. */
function useConsola() {
  const [estat, setEstat] = useState('loading');
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const enCurs = useRef(null);

  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    setError(null);
    carregaConsola(ac.signal)
      .then((d) => {
        if (ac.signal.aborted) return;
        setDades(d);
        setEstat(d ? 'ready' : 'absent');
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e);
        setEstat('error');
      });
  }, []);
  useEffect(() => {
    carrega();
    return () => enCurs.current?.abort();
  }, [carrega]);

  return { estat, dades, error, carrega };
}

function PanellConsums({ consums, locale }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <Mono>.agents/.diari_sessio.jsonl</Mono> no conté cap entrada <Mono>consum.tokens</Mono>.
        Quan un agent en registre, apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  const n = (x) => x.toLocaleString(locale);
  return (
    <>
      <div className="sdp-card-grid">
        <Xifra icona={LogIn} etiqueta="Tòkens d'entrada" valor={n(total.entrada)} />
        <Xifra icona={LogOut} etiqueta="Tòkens d'eixida" valor={n(total.eixida)} />
        <Xifra icona={Activity} etiqueta="Registres de consum" valor={n(consums.length)} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Registres</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <th scope="row">{a.agent}</th>
              <td>{n(a.sessions)}</td>
              <td>{n(a.entrada)}</td>
              <td>{n(a.eixida)}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa:
        quan hi haja font (§3.6 de l'auditoria 260920_0300), es connecta ací.
      </EstatBuit>
    );
  }
  return (
    <div className="sdp-consola__llista">
      {credits.map((c) => (
        <Progres key={c.proveidor} etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit} max={c.limit} />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, locale, onVeure }) {
  if (rebuts.length === 0) {
    return (
      <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
        El diari de sessió no té entrades <Mono>matrix.rebut</Mono>.
      </EstatBuit>
    );
  }
  /* T12 (ordre del Mestre, 260930) · Quan va entrar l'últim rebut: un diari
     que ningú no escriu ha de dir-ho, no passar per viu. Mateixa línia de
     procedència que el segell de l'inventari de skills.
     T9 (260930) · les taules del pols ja no porten límit d'alçada propi (són
     dins d'un desplegable): l'únic scroll vertical és el de la pàgina. */
  const ultim = ultimRebut(rebuts);
  return (
    <>
      {ultim && (
        <p className="sdp-consola__segell">
          {`Últim rebut: ${dataLocal(ultim, locale)} (${faDies(diesDes(ultim))})`}
        </p>
      )}
      <Taula titol="Rebuts de lectura Matrix" densa>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Petició</th>
            <th scope="col">Protocol</th>
            <th scope="col">Fonts</th>
            <th scope="col"><span className="sdp-nomes-lector">Accions</span></th>
          </tr>
        </thead>
        <tbody>
          {rebuts.map((r, i) => {
            const quan = dataLocal(r.t, locale);
            return (
              <tr key={`${r.t}-${r.peticio}-${i}`}>
                <td>{quan}</td>
                <td><Mono>{curt(r.peticio)}</Mono></td>
                <td>{r.protocols.length ? <Privat>{r.protocols.map((p) => p.split('/').pop()).join(', ')}</Privat> : '—'}</td>
                <td>{r.fonts.length}</td>
                <td>
                  <Boto varietat="fantasma" onClick={() => onVeure(r)} aria-label={`Veure les ${r.fonts.length} fonts del rebut de ${quan}`}>
                    Veure fonts
                  </Boto>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Taula>
    </>
  );
}

function PanellSkills({ skills, segell, locale }) {
  const { total, orfes, fantasmes, nucli } = resumSkills(skills);
  return (
    <>
      <div className="sdp-card-grid">
        <Xifra icona={Puzzle} etiqueta="Skills" valor={total} />
        <Xifra icona={Anchor} etiqueta="Nucli (core)" valor={nucli.length} />
        <Xifra icona={Unlink} etiqueta="Orfes (disc sense manifest)" valor={orfes.length} />
        <Xifra icona={Ghost} etiqueta="Fantasmes (manifest sense disc)" valor={fantasmes.length} />
      </div>
      {segell ? (
        <p className="sdp-consola__segell">
          Segell <Mono>{curt(segell.hash)}</Mono> · {segell.filesCount} fitxers · {dataLocal(segell.timestamp, locale)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa>
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">{s.core ? <strong>{s.nom}</strong> : s.nom}</th>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="neutre">sense estat</Insignia>}</td>
              <td>{s.alManifest ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">no</Insignia>}</td>
              <td>{s.alDisc ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">esborrat</Insignia>}</td>
              <td>{s.descripcio}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* Les pàgines que viuen del Mapa diuen per què no hi ha dades, mai n'inventen. */
function AmbMapa({ font, children }) {
  if (font.mapa) return children(font.mapa);
  if (font.estat === 'loading') return <Carregant etiqueta="Llegint el mapa…" />;
  if (font.estat === 'error') {
    return (
      <Alerta to="error" titol="No s’ha pogut llegir el mapa">
        {font.error?.message || 'Torna a provar-ho amb Refrescar.'}
      </Alerta>
    );
  }
  return (
    <EstatBuit icona={Network} titol="Mapa no disponible">
      Esta pàgina viu del Mapa (<Mono>GET /__iaia/mapa.json</Mono>), que només se servix al
      servidor local de desenvolupament. Mentre el compilador <Mono>tooling/brain/mapa-consola.mjs</Mono> i
      la ruta del middleware no s’instal·len, no hi ha dades i la Consola no en inventa.
    </EstatBuit>
  );
}

/* ── Pàgina «El pols del cervell» ──────────────────────────────────────── */

function PaginaPols({ consola, locale, onVeure }) {
  const { estat, dades, error } = consola;
  const detalls = useRef({});
  const graella = useRef(null);
  const [oberts, setOberts] = useState({});
  const inventari = dades ? resumSkills(dades.skills) : null;
  const termometria = dades?.termometria;
  const recompte = recompteArtefactes(dades);
  const mesurat = recompte !== null;
  const llindar = LLINDAR_SATURACIO;
  const etiquetes = etiquetesPols(dades, estat);
  const estatSenseDades = estat === 'loading' ? 'Llegint…'
    : estat === 'absent' ? 'No disponible en este entorn'
      : 'No s’ha pogut llegir';
  const anota = (id, obert) => setOberts((o) => (Boolean(o[id]) === obert ? o : { ...o, [id]: obert }));
  /* Cada targeta resumix un panell; el detall viu plegat davall de la graella
     i la targeta l'obri, hi llisca (salt directe amb moviment reduït) i hi
     porta el focus sense un segon salt. */
  const obre = (id) => {
    const el = detalls.current[id];
    if (!el) return;
    el.open = true;
    anota(id, true);
    el.scrollIntoView?.({ behavior: movimentReduit() ? 'auto' : 'smooth', block: 'start' });
    el.querySelector('summary')?.focus({ preventScroll: true });
  };
  /* Cada panell s'explica a si mateix: el «per a què» de subtítol, què mesura
     d'entradilla i les mètriques vives a part (T2, 260930: cada una en h5) o,
     si no n'hi ha, per què en un paràgraf (`senseMesura`). */
  const panells = [
    { id: 'carrega', titol: 'Càrrega documental', Icona: Gauge,
      subtitol: 'Per a saber quan s’embossa el context',
      entradilla: 'Compta els artefactes actius del cervell i avisa quan passen del llindar de saturació. No arxiva res: només diu quan cal revisar rellevància i context.',
      metriques: mesurat ? [`${recompte} artefactes actius`, `avís per damunt de ${llindar}`] : null,
      senseMesura: 'Recompte d’artefactes actius encara no disponible: les skills i els rebuts no en són cap mesura',
      contingut: mesurat && <>
        <Progres etiqueta="Artefactes actius respecte del llindar d’avís"
          valor={Math.min(recompte, llindar)} max={llindar} />
        {termometria.abast && <p>{termometria.abast}</p>}
      </> },
    { id: 'consums', titol: 'Consums', Icona: Activity,
      subtitol: 'Per a saber qui gasta tòkens i quants',
      entradilla: 'Tòkens d’entrada i d’eixida que cada agent anota al diari de sessió. Si no hi ha cap registre, no vol dir consum zero: vol dir que ningú no l’ha mesurat.',
      metriques: dades?.consums.length ? [`${dades.consums.length} registres`] : null,
      senseMesura: dades ? 'Sense mesura de tòkens' : estatSenseDades,
      contingut: dades && <PanellConsums consums={dades.consums} locale={locale} /> },
    { id: 'credits', titol: 'Crèdits', Icona: Coins,
      subtitol: 'Per a saber quant queda de cada proveïdor',
      entradilla: 'Saldo consumit de cada proveïdor d’IA respecte del seu límit. Mentre cap fitxer no el registre, la Consola ho diu en lloc d’inventar-lo.',
      metriques: dades?.credits?.length ? [`${dades.credits.length} proveïdors`] : null,
      senseMesura: dades ? 'Saldo desconegut' : estatSenseDades,
      contingut: dades && <PanellCredits credits={dades.credits?.length ? dades.credits : null} /> },
    { id: 'rebuts', titol: 'Rebuts', Icona: Receipt,
      subtitol: 'Per a comprovar què ha llegit de veritat l’eixam',
      entradilla: 'Cada vegada que un agent llig senceres les fonts d’un protocol, en queda un rebut amb l’empremta de cada fitxer. Obri’l per vore quines fonts va llegir.',
      metriques: dades ? [`${dades.rebuts.length} rebuts de lectura`] : null,
      senseMesura: estatSenseDades,
      contingut: dades && <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={onVeure} /> },
    { id: 'skills', titol: 'Skills', Icona: Puzzle,
      subtitol: 'Per a saber quins procediments cal cuidar',
      entradilla: 'L’inventari de procediments de l’eixam: quins són del nucli, quins viuen al disc sense manifest (orfes) i quins són al manifest sense disc (fantasmes).',
      metriques: inventari
        ? [`${inventari.total} skills`, `${inventari.orfes.length} orfes`, `${inventari.fantasmes.length} fantasmes`] : null,
      senseMesura: estatSenseDades,
      contingut: dades && <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
  ];
  useTargetesQueObrin(graella, panells.map(({ id, contingut }) => (
    contingut ? { controla: `pols-${id}`, obert: oberts[id] } : null
  )));

  return (
    <>
      {estat === 'loading' && !dades && <Carregant etiqueta="Llegint l’estat de l’eixam…" />}
      {estat === 'absent' && <Alerta to="info" titol="Consola no disponible">
        Esta font només es publica al servidor local de desenvolupament.
      </Alerta>}
      {estat === 'error' && <Alerta to="error" titol="No s’ha pogut refrescar">
        {dades ? 'Es conserva l’última instantània bona. ' : ''}
        {error?.message || 'Torna a provar-ho amb Refrescar.'}
      </Alerta>}
      {mesurat && recompte > llindar && <Alerta to="avis" titol="Revisem la saturació">
        Hi ha {recompte - llindar} artefactes per damunt del llindar.
        Cal revisar rellevància i context; no s’arxiva res automàticament.
      </Alerta>}
      <div className="sdp-card-grid sdp-consola__graella" ref={graella}>
        {panells.map(({ id, titol, Icona, subtitol, entradilla, metriques, senseMesura, contingut }) => (
          <TargetaConsola key={id} icona={Icona} titol={titol} subtitol={subtitol} entradilla={entradilla}
            metriques={metriques} dada={senseMesura}
            font={FONT_DADES} creat={dataDelCopy()} generat={dades?.generat} etiquetes={etiquetes[id]}
            onObri={contingut ? () => obre(id) : undefined} />
        ))}
      </div>
      {panells.filter((p) => p.contingut).map(({ id, titol, contingut }) => (
        <Desplegable key={id} id={`pols-${id}`} ref={(el) => { detalls.current[id] = el; }}
          titol={`Veure detall de ${titol.toLocaleLowerCase(locale)}`}
          onToggle={(e) => anota(id, e.currentTarget.open)}>
          {contingut}
        </Desplegable>
      ))}
    </>
  );
}

/* ── Tauler i peces compartides ─────────────────────────────────────────── */

/**
 * Les cinc xifres de la capçalera del «Mapa de mis agentes». T11 (ordre del
 * Mestre, 260930): són dades, no portes. A cada pàgina s'entra per la seua
 * targeta del tauler i se'n torna per la molla de pa; dues xifres cap a
 * l'inventari i «avisos» cap a dos llocs diferents confonien el camí.
 */
function XifresMas({ mapa }) {
  const id = useId();
  const x = xifresDelMas(mapa);
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>El Mas en xifres</h2>
      <div className="sdp-card-grid">
        <TargetaResum icona={Puzzle} titol={plural(x.skills, 'skill', 'skills')}
          descripcio="al cens del Mapa" />
        <TargetaResum icona={Bot} titol={plural(x.agents, 'agent', 'agents')}
          descripcio="arnesos que conversen amb el Mestre" />
        <TargetaResum icona={Box} titol={plural(x.opaques, 'skill opaca', 'skills opaques')}
          descripcio="sense entrades ni eixides declarades" />
        <TargetaResum icona={Timer} titol={plural(x.programades, 'cosa que corre sola', 'coses que corren soles')}
          descripcio={`tasques que llança launchd · ${plural(x.vives, 'viva', 'vives')}`} />
        <TargetaResum icona={TriangleAlert} titol={plural(x.ambAvisos, 'skill amb avisos', 'skills amb avisos')}
          descripcio="semàfor ambre o roig a l’inventari" />
      </div>
    </section>
  );
}

/* T12 (ordre del Mestre, 260930) · La ruta de l'avís és el seu node sense el
   tipus (document:.agents/SKILLS_SEAL.json). */
const rutaDelNode = (node) => String(node ?? '').replace(/^[a-z]+:/, '');

/**
 * Quan la vigilància mateixa està trencada (CODIS_VIGILANCIA, consolaPagines.js),
 * el tauler ho diu dalt de tot amb una <Alerta to="error"> (rol alert: cal
 * actuar ja) i sense enllaç propi: la porta a Avisos i salut és la seua
 * targeta. Què està trencat es diu amb la redacció del detall de l'Explorador
 * (TEXTOS_AVIS, grafMapa.js; Avisos i salut pinta el codi tal qual, i per
 * això un codi sense text es diu pel seu nom); on mirar va darrere, separat
 * de la frase: la ruta del node i l'evidència del compilador, que passen pel
 * mode privacitat del marc (PrivacitatConsola).
 * Correcció B1 (260930): rol alert de l'encàrrec i procedència sense parèntesis.
 */
function AlertaVigilancia({ mapa }) {
  const avisos = avisosDeVigilancia(mapa);
  if (!avisos.length) return null;
  return (
    <Alerta to="error" titol="La vigilància del cervell està trencada">
      <ul>
        {avisos.map((a, i) => (
          <li key={`${a.node}-${a.codi}-${i}`}>
            {TEXTOS_AVIS[a.codi] ?? `Avís ${a.codi}.`} On: <Mono>{rutaDelNode(a.node)}</Mono>
            {typeof a.evidencia === 'string' && a.evidencia ? <> · Evidència: <Privat>{a.evidencia}</Privat></> : null}
          </li>
        ))}
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
 * reals o diu per què no n'hi ha, i du les etiquetes d'un colp d'ull
 * (consolaPagines.js). El record de visites es llig en muntar el tauler:
 * tornar-hi des d'una pàgina el refresca.
 */
export function ConsolaTauler({ consola, mapa, cimRef }) {
  const fonts = fontsDe(consola, mapa);
  const [vistes] = useState(llegixVistes);
  return (
    <>
      <AlertaVigilancia mapa={mapa.mapa} />
      <nav className="sdp-card-grid sdp-consola__graella" aria-label="Pàgines de la Consola" ref={cimRef}>
        {paginesConsola().map((p) => {
          const delMapa = p.id !== 'pols';
          return (
            <TargetaConsola key={p.id} icona={ICONES[p.id]} titol={p.title} subtitol={p.subtitle}
              entradilla={p.lead} metriques={mesuresPagina(p.id, fonts)} dada={resumPagina(p.id, fonts)} a={p.ruta}
              font={delMapa ? FONT_MAPA : FONT_DADES} creat={dataDelCopy()}
              generat={delMapa ? mapa.mapa?.generat : consola.dades?.generat}
              etiquetes={etiquetesPagina(p.id, fonts, vistes?.[p.id])} />
          );
        })}
      </nav>
      {mapa.mapa && <XifresMas mapa={mapa.mapa} />}
    </>
  );
}

/** El tauler dins d'un altre marc (la Wiki): llig les seues fonts, i la
    privacitat que el visitant va deixar a la Consola, pel seu compte. */
export function ConsolaIncrustada() {
  const consola = useConsola();
  const mapa = useMapa();
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
  /* T12 (ordre del Mestre, 260930) · Un recompte d'operacions immunitàries
     sense data no diu si el sistema és viu: si consola.json porta la data de
     l'última (immunitari.ultima.data), el peu la mostra; si no, no se n'inventa. */
  const ultimaOperacio = dataUltimaOperacio(dades);
  const immunitari = dades && `${dades.immunitari.operacions} operacions immunitàries${
    ultimaOperacio ? `, l’última el ${dataLocal(ultimaOperacio, locale)}` : ''}`;
  /* Cada pàgina data la seua pròpia font: el pols, consola.json; la resta, el Mapa. */
  const instantania = pagina === 'pols'
    ? (dades?.generat && `Instantània: ${dataLocal(dades.generat, locale)} · ${immunitari}`)
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

function ContingutPagina({ id, consola, mapa, locale, onVeure }) {
  const ambMapa = (pinta) => <AmbMapa font={mapa}>{pinta}</AmbMapa>;
  switch (id) {
    case 'pols': return <PaginaPols consola={consola} locale={locale} onVeure={onVeure} />;
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

export default function ConsolaSection() {
  const { locale } = useUIState();
  const params = useParams();
  const id = segmentPagina(params['*']);
  const pagina = id ? paginaConsola(id) : null;
  const copy = copyConsola();
  const consola = useConsola();
  const mapa = useMapa();
  const [privat, setPrivatEstat] = useState(() => llegixPrivacitat());
  const setPrivat = useCallback((actiu) => { setPrivatEstat(actiu); desaPrivacitat(actiu); }, []);
  const [rebutObert, setRebutObert] = useState(null);
  const cim = useRef(null);
  const signatura = pagina ? signaturaPagina(pagina.id, fontsDe(consola, mapa)) : null;

  useSEO({
    title: pagina ? `${pagina.title} · ${copy.title}` : copy.title,
    description: pagina ? pagina.lead : copy.lead
  });

  /* /consola/* és un sol element muntat: canviar de pàgina no desmunta res i
     el contenidor de scroll de l'aplicació es quedava on era. */
  useLayoutEffect(() => { tornaAlCim(cim.current); }, [id]);

  /* Obrir una pàgina amb la seua font carregada la marca com a vista: el
     tauler només dirà «Canvis nous» si el resum canvia després. */
  useEffect(() => {
    if (pagina && signatura) marcaVista(pagina.id, signatura);
  }, [pagina?.id, signatura]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <ContingutPagina id={pagina.id} consola={consola} mapa={mapa} locale={locale} onVeure={setRebutObert} />
        <ControlsConsola pagina={pagina.id} consola={consola} mapa={mapa} privat={privat} onPrivat={setPrivat} locale={locale} cimRef={cim} />
        <Dialeg obert={rebutObert !== null} onTanca={() => setRebutObert(null)}
          titol="Fonts llegides senceres" mida="g"
          descripcio={rebutObert ? (privat ? dataLocal(rebutObert.t, locale)
            : `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}`) : undefined}
          accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}>
          {rebutObert && <Taula titol="Fonts del rebut" densa>
            <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
            <tbody>{rebutObert.fonts.map((f) => (
              <tr key={f.ruta}><td><Mono>{f.ruta}</Mono></td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
            ))}</tbody>
          </Taula>}
        </Dialeg>
      </PrivacitatConsola.Provider>
    </UniversalPage>
  );
}

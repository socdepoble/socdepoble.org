import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  RUTA_CONSOLA, copyConsola, paginaConsola, paginesConsola, resumPagina, segmentPagina
} from './consolaPagines.js';
import { Xifra, Mono, PrivacitatConsola, TargetaResum } from './peces.jsx';
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

/* La Consola és un tauler de nou targetes (/consola) i una ruta per pàgina
   (/consola/<id>). Les dues fonts (consola.json i el Mapa) es lligen una sola
   vegada per a tota la secció: /consola/* munta el mateix element per a totes
   les subrutes, i navegar entre pàgines no torna a llegir res. Totes les
   targetes de resum són les del Panell de Control (TargetaResum, peces.jsx). */

const ICONES = Object.freeze({
  pols: Activity, explorador: Network, fluxos: Workflow, calendari: CalendarClock,
  inventari: Puzzle, entrades: ArrowLeftRight, agents: Bot, actors: Users, salut: HeartPulse
});

const plural = (n, un, molts) => `${n} ${n === 1 ? un : molts}`;

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
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
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
              <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
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
      <Taula titol="Inventari de skills" densa className="sdp-taula--llarga">
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
  const inventari = dades ? resumSkills(dades.skills) : null;
  const termometria = dades?.termometria;
  const mesurat = Number.isSafeInteger(termometria?.artefactesActius)
    && termometria.artefactesActius >= 0;
  const recompte = mesurat ? termometria.artefactesActius : null;
  const llindar = 150;
  const estatSenseDades = estat === 'loading' ? 'Llegint…'
    : estat === 'absent' ? 'No disponible en este entorn'
      : 'No s’ha pogut llegir';
  /* Cada targeta resumix un panell; el detall viu plegat davall de la graella
     i la targeta l'obri i hi porta el focus. */
  const obre = (id) => {
    const el = detalls.current[id];
    if (!el) return;
    el.open = true;
    el.scrollIntoView?.({ block: 'start' });
    el.querySelector('summary')?.focus();
  };
  const panells = [
    { id: 'carrega', titol: 'Càrrega documental', Icona: Gauge,
      resum: mesurat ? `${recompte} artefactes actius · avís per damunt de ${llindar}`
        : 'Recompte d’artefactes actius encara no disponible: les skills i els rebuts no en són cap mesura',
      contingut: mesurat && <>
        <Progres etiqueta="Artefactes actius respecte del llindar d’avís"
          valor={Math.min(recompte, llindar)} max={llindar} />
        <p>{termometria.abast}</p>
      </> },
    { id: 'consums', titol: 'Consums', Icona: Activity,
      resum: dades ? (dades.consums.length ? `${dades.consums.length} registres` : 'Sense mesura de tòkens') : estatSenseDades,
      contingut: dades && <PanellConsums consums={dades.consums} locale={locale} /> },
    { id: 'credits', titol: 'Crèdits', Icona: Coins,
      resum: dades ? (dades.credits?.length ? `${dades.credits.length} proveïdors` : 'Saldo desconegut') : estatSenseDades,
      contingut: dades && <PanellCredits credits={dades.credits?.length ? dades.credits : null} /> },
    { id: 'rebuts', titol: 'Rebuts', Icona: Receipt,
      resum: dades ? `${dades.rebuts.length} rebuts de lectura` : estatSenseDades,
      contingut: dades && <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={onVeure} /> },
    { id: 'skills', titol: 'Skills', Icona: Puzzle,
      resum: inventari ? `${inventari.total} skills · ${inventari.orfes.length} orfes · ${inventari.fantasmes.length} fantasmes` : estatSenseDades,
      contingut: dades && <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
  ];

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
      <div className="sdp-card-grid">
        {panells.map(({ id, titol, Icona, resum, contingut }) => (
          <TargetaResum key={id} icona={Icona} titol={titol} descripcio={resum}
            onObri={contingut ? () => obre(id) : undefined} />
        ))}
      </div>
      {panells.filter((p) => p.contingut).map(({ id, titol, contingut }) => (
        <details key={id} id={`pols-${id}`} ref={(el) => { detalls.current[id] = el; }}>
          <summary>Veure detall de {titol.toLocaleLowerCase(locale)}</summary>
          {contingut}
        </details>
      ))}
    </>
  );
}

/* ── Tauler i peces compartides ─────────────────────────────────────────── */

/** Les cinc xifres de la capçalera del «Mapa de mis agentes», cadascuna cap a la pàgina que l'explica. */
function XifresMas({ mapa }) {
  const id = useId();
  const x = xifresDelMas(mapa);
  const a = (pagina) => `${RUTA_CONSOLA}/${pagina}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>El Mas en xifres</h2>
      <div className="sdp-card-grid">
        <TargetaResum icona={Puzzle} titol={plural(x.skills, 'skill', 'skills')}
          descripcio="al cens del Mapa" a={a('inventari')} />
        <TargetaResum icona={Bot} titol={plural(x.agents, 'agent', 'agents')}
          descripcio="arnesos que conversen amb el Mestre" a={a('actors')} />
        <TargetaResum icona={Box} titol={plural(x.opaques, 'skill opaca', 'skills opaques')}
          descripcio="sense entrades ni eixides declarades" a={a('entrades')} />
        <TargetaResum icona={Timer} titol={plural(x.programades, 'cosa que corre sola', 'coses que corren soles')}
          descripcio={`tasques que llança launchd · ${plural(x.vives, 'viva', 'vives')}`} a={a('calendari')} />
        <TargetaResum icona={TriangleAlert} titol={plural(x.ambAvisos, 'skill amb avisos', 'skills amb avisos')}
          descripcio="semàfor ambre o roig a l’inventari" a={a('inventari')} />
      </div>
    </section>
  );
}

/** Les targetes del tauler. Cada una porta a la seua ruta i resumix dades reals o diu per què no n'hi ha. */
export function ConsolaTauler({ consola, mapa }) {
  const fonts = { dades: consola.dades, estatDades: consola.estat, mapa: mapa.mapa, estatMapa: mapa.estat };
  return (
    <>
      <nav className="sdp-card-grid" aria-label="Pàgines de la Consola">
        {paginesConsola().map((p) => (
          <TargetaResum key={p.id} icona={ICONES[p.id]} titol={p.title}
            descripcio={resumPagina(p.id, fonts)} a={p.ruta} />
        ))}
      </nav>
      {mapa.mapa && <XifresMas mapa={mapa.mapa} />}
    </>
  );
}

/** El tauler dins d'un altre marc (la Wiki): llig les seues fonts pel seu compte. */
export function ConsolaIncrustada() {
  const consola = useConsola();
  const mapa = useMapa();
  return <ConsolaTauler consola={consola} mapa={mapa} />;
}

function ControlsConsola({ consola, mapa, privat, onPrivat, locale }) {
  const { dades } = consola;
  return (
    <div className="sdp-consola__capcal">
      <p className="sdp-consola__instantania" role="status">
        {dades?.generat ? `Instantània: ${dataLocal(dades.generat, locale)} · ${dades.immunitari.operacions} operacions immunitàries`
          : 'Instantània encara no disponible.'}
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
  const [privat, setPrivat] = useState(false);
  const [rebutObert, setRebutObert] = useState(null);

  useSEO({
    title: pagina ? `${pagina.title} · ${copy.title}` : copy.title,
    description: pagina ? pagina.lead : copy.lead
  });

  if (id === null) return <Navigate to={RUTA_CONSOLA} replace />;

  if (!pagina) {
    return (
      <UniversalPage title={copy.title} subtitle={copy.subtitle} lead={copy.lead} chrome="system">
        <ConsolaTauler consola={consola} mapa={mapa} />
      </UniversalPage>
    );
  }

  return (
    <UniversalPage title={pagina.title} lead={pagina.lead} chrome="system">
      <PrivacitatConsola.Provider value={privat}>
        <MollaPa passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: pagina.title }]} />
        <ControlsConsola consola={consola} mapa={mapa} privat={privat} onPrivat={setPrivat} locale={locale} />
        <ContingutPagina id={pagina.id} consola={consola} mapa={mapa} locale={locale} onVeure={setRebutObert} />
        <Dialeg obert={rebutObert !== null} onTanca={() => setRebutObert(null)}
          titol="Fonts llegides senceres" mida="g"
          descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
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

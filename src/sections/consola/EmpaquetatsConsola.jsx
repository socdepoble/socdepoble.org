import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
/* P1-35 (pla 261028_1526 §3.5.2) · Empaquetats i llançament: la targeta del
   tauler de /consola i la seua pàgina, /consola/empaquetats. Les dades i les
   regles viuen a empaquetats.js (sense React); la lectura és la de useFontDev,
   la mateixa de consola.json i del Mapa, i fora de DEV no demana res.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · El recompte de
   plataformes al pas és una TargetaConsola amb boina i pàgina pròpia.
   Cap botó publica: la pàgina diu l'ordre exacta de cada plataforma per a
   copiar-la al terminal, on la pujada continua demanant --confirma. Cap
   classe nova: les peces són les de la Consola (peces.jsx i modules.css).
   Derogat EN PART per l'ordre del Mestre del 2026-11-02 14:46 (Llibre Mestre,
   IDEA-60; prompt 261102_1532, T1): «cap botó publica». El Mode Jarvis
   Omnicanal d'1 Clic (SeccioJarvis, jarvis.js) porta un sol botó que, en
   local, crida el corredor del servidor de desenvolupament; les ordres per
   plataforma es queden, com a camí de reserva. */
import { useEffect, useId, useRef, useState } from 'react';
import { Package, Rocket } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { Alerta, AreaText, Boto, Camp, Carregant, EstatBuit, Insignia, MollaPa } from '../../components/PedraSeca';
import { RUTA_CONSOLA, copyConsola } from './consolaPagines.js';
import { DestiVersions, Mono, Privat, PrivacitatConsola, TargetaConsola } from './peces.jsx';
import {
  ENTRADETA_EMPAQUETATS, ETIQUETA_NAV_EMPAQUETATS, SEMAFOR, TITOL_EMPAQUETATS,
  canonicaDesfasada, cobertaEmpaquetats, paginaEmpaquetats, plataformesEmpaquetades
} from './empaquetats.js';
import {
  ETIQUETA_CANALS, ETIQUETA_NOTES, ETIQUETA_PASSOS, INSIGNIA_PAS, INTERVAL_PROGRES_MS, MAX_ESPERA_MS, MAX_NOTES,
  MISSATGES_JARVIS, MOTIU_FORA_DE_DEV, MOTIU_LLEST, PASSOS_INICIALS, RUTA_PROGRES, RUTA_PUBLICA_TOT, TEXT_BOTO_JARVIS,
  TITOL_JARVIS, canalsJarvis, entradetaJarvis, estatDelsCanals, interpretaResposta, llegixProgres, motiuDesactivat,
  ordreTerminal, passosPerPintar, peticioPublicaTot
} from './jarvis.js';
import { VERSIO_SISTEMA, versioCanonica } from '../../config/versio.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { Link } from '../../app/contexts/RouterContext';
import { resolvePageSlugPath } from '../../config/navigation.js';

/**
 * La secció del tauler: el seu H2, una línia que l'explica i una sola
 * targeta, que porta a la pàgina. `font` és la lectura de useFontDev
 * ({ estat, valor }).
 */
export function SeccioEmpaquetats({ font }) {
  const id = useId();
  const pagina = paginaEmpaquetats();
  const coberta = cobertaEmpaquetats(font.valor, font.estat);
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{TITOL_EMPAQUETATS}</h2>
      <p>{ENTRADETA_EMPAQUETATS}</p>
      <nav className="sdp-card-grid sdp-consola__graella" onKeyDown={gestionaTeclaGraella} aria-label={ETIQUETA_NAV_EMPAQUETATS}>
        <TargetaConsola icona={Package} titol={pagina.title} subtitol={pagina.subtitle} entradilla={pagina.lead}
          dada={coberta.dada} etiquetes={coberta.etiquetes} a={pagina.ruta}
          creat={copyConsola().date} generat={font.valor?.generat ?? null} />
      </nav>
    </section>
  );
}

/* Una plataforma: el semàfor i el per què, el que declara, els artefactes
   de la carpeta de builds (només els noms), l'ordre que la publica i el
   fitxer que puja eixa ordre, que no és cap d'eixos artefactes. El cos de
   les pàgines de la Consola parla en H3. */
function Plataforma({ p }) {
  const id = useId();
  const semafor = SEMAFOR[p.semafor];
  return (
    <section aria-labelledby={id}>
      <h3 id={id}>{p.nom}</h3>
      <p><Insignia to={semafor.to}>{semafor.text}</Insignia> {p.motiu}</p>
      <p>
        Versió declarada: {p.versio ? <Mono>{p.build ? `${p.versio}+${p.build}` : p.versio}</Mono> : 'cap'}
        {p.font ? <> · Font: <Mono>{p.font}</Mono></> : null}
      </p>
      {p.artefactes.length ? (
        <>
          <p>
            {p.ultim
              ? (p.alDia ? 'A la carpeta de builds, l’últim artefacte és el de la versió declarada.' : `A la carpeta de builds, l’últim artefacte és de la ${p.ultim.versio}${p.ultim.build ? `+${p.ultim.build}` : ''}, no de la versió declarada.`)
              : 'A la carpeta de builds, cap artefacte porta la versió al nom.'}
          </p>
          <ul className="sdp-consola__evidencies" aria-label={`Artefactes de ${p.nom}, el més recent primer`}>
            {p.artefactes.map((a) => <li key={a.nom}><Mono>{a.nom}</Mono></li>)}
          </ul>
        </>
      ) : <p>Cap artefacte a la carpeta de builds.</p>}
      {p.ordre ? (
        <>
          <p>L’ordre per a publicar-la, per a copiar-la al terminal:</p>
          <pre className="sdp-consola__diagnosi-text"><Privat>{p.ordre}</Privat></pre>
          {p.fitxer ? <p>Puja <Mono>{p.fitxer}</Mono>, no cap artefacte de la carpeta de builds.</p> : null}
        </>
      ) : null}
      <p>{p.nota}</p>
    </section>
  );
}

/* El missatge i el to del progrés: en curs, acabat, aturat pel corredor, o
   el contacte perdut i el límit de temps (motiu propi del panell). */
function estatDelProgres(progres) {
  if (!progres || progres.estat === 'en_curs') return { to: 'info', text: MISSATGES_JARVIS.iniciat };
  if (progres.estat === 'fet') return { to: 'exit', text: MISSATGES_JARVIS.fet };
  return { to: 'error', text: MISSATGES_JARVIS[progres.motiu] ?? MISSATGES_JARVIS.aturada };
}

/**
 * IDEA-60 (T1, prompt 261102_1532) · El Mode Jarvis Omnicanal d'1 Clic
 * (ordre del Mestre, Llibre Mestre, 2026-11-02 14:46): l'estat de cada canal,
 * un camp amb el que hem millorat i un sol botó que publica a totes les
 * botigues. El botó crida POST RUTA_PUBLICA_TOT, el corredor del servidor
 * local de desenvolupament (tooling/vite/consola-iaia.mjs), i després demana
 * el progrés cada INTERVAL_PROGRES_MS a RUTA_PROGRES fins a 'fet' o 'error',
 * com a molt MAX_ESPERA_MS, amb neteja en desmuntar. Si el servidor no porta
 * el corredor (404, 405 o l'HTML de l'SPA), diu l'ordre del terminal.
 * Fora de DEV (`dev`, per defecte import.meta.env.DEV) el botó va desactivat
 * i una alerta diu, honestament, que el webhook de la web pública encara no
 * existix. `nativa` (per defecte esAppNativa): dins de l'app, cap canal ni cap
 * text nomena una altra plataforma mòbil (regla 2.3.10). `interval` i
 * `maxEspera` són per a les proves. Cap classe nova: les llistes són les de
 * la Consola (sdp-consola__estats, sdp-consola__evidencies,
 * sdp-consola__diagnosi-text) i les peces, les de Pedra Seca.
 */
export function SeccioJarvis({
  font, plataformes, dev = import.meta.env.DEV === true, nativa = esAppNativa(),
  interval = INTERVAL_PROGRES_MS, maxEspera = MAX_ESPERA_MS
}) {
  const id = useId();
  const idTitol = `${id}-titol`;
  const idMotiu = `${id}-motiu`;
  const [notes, setNotes] = useState('');
  const [enviant, setEnviant] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [progres, setProgres] = useState(null);
  /* Verificador T1a (prompt 261102_1532) · Sota <StrictMode> (App.jsx), React 18
     en DEV munta, desmunta i torna a muntar l'efecte: el ref es torna a posar a
     true en cada muntatge (patró d'OnboardingSection), o el primer clic deixaria
     el botó carregant per sempre. */
  const muntat = useRef(true);
  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; };
  }, []);

  const fontViva = font?.estat === 'ready' && Boolean(font?.valor);
  const canals = estatDelsCanals(plataformes, { nativa });
  const idsCanals = canalsJarvis({ nativa }).map((c) => c.id);
  const motiu = motiuDesactivat({ dev, fontViva, notes });
  const enCurs = resposta?.estat === 'iniciat' && (progres === null || progres.estat === 'en_curs');

  /* El progrés: cada `interval` mentre el corredor diu 'en_curs'; s'atura
     amb 'fet', 'error', el límit de temps o en desmuntar. Un cos que no és
     el de l'esquema és contacte perdut, no un progrés inventat. */
  useEffect(() => {
    if (!enCurs) return undefined;
    const inici = Date.now();
    const ac = new AbortController();
    let rellotge = null;
    let aturat = false;
    const demana = async () => {
      if (aturat) return;
      if (Date.now() - inici > maxEspera) {
        setProgres((previ) => ({ estat: 'error', motiu: 'temps', passos: previ?.passos }));
        return;
      }
      try {
        const r = await fetch(RUTA_PROGRES, { cache: 'no-store', signal: ac.signal });
        const p = llegixProgres(await r.json());
        if (aturat) return;
        setProgres(p);
        if (p.estat === 'en_curs') rellotge = setTimeout(demana, interval);
      } catch (e) {
        if (aturat || e?.name === 'AbortError') return;
        setProgres((previ) => ({ estat: 'error', motiu: 'contacte', passos: previ?.passos }));
      }
    };
    rellotge = setTimeout(demana, interval);
    return () => {
      aturat = true;
      clearTimeout(rellotge);
      ac.abort();
    };
  }, [enCurs, interval, maxEspera]);

  const publica = async () => {
    let peticio;
    try {
      peticio = peticioPublicaTot({ notes, canals: idsCanals });
    } catch (e) {
      setResposta({ estat: 'error', missatge: e.message });
      return;
    }
    setEnviant(true);
    setProgres(null);
    setResposta(null);
    try {
      const r = await fetch(RUTA_PUBLICA_TOT, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(peticio)
      });
      const cos = await r.text();
      if (!muntat.current) return;
      setResposta(interpretaResposta({ status: r.status, contentType: r.headers?.get?.('content-type') || '', cos }));
    } catch {
      if (!muntat.current) return;
      setResposta({ estat: 'error', missatge: MISSATGES_JARVIS.xarxa });
    } finally {
      if (muntat.current) setEnviant(false);
    }
  };

  const delProgres = estatDelProgres(progres);
  /* Els passos: els del progrés si n'hi ha; si no, els que va dir el corredor
     en arrancar; si no, els inicials dels canals que es veuen. */
  const passos = passosPerPintar(progres?.passos ?? resposta?.passos ?? PASSOS_INICIALS(idsCanals), { nativa });
  return (
    <section aria-labelledby={idTitol}>
      <h3 id={idTitol}>{TITOL_JARVIS}</h3>
      <p>{entradetaJarvis({ nativa })}</p>
      <ul className="sdp-consola__estats" aria-label={ETIQUETA_CANALS}>
        {canals.map((c) => (
          <li key={c.id}>
            <span>
              <Insignia to={c.to}>{c.nom} · {c.text}</Insignia>
              {c.versio ? <> <Mono>{c.versio}</Mono></> : null}
              {c.ultim ? <> · <Mono>{c.ultim}</Mono></> : null}
            </span>
          </li>
        ))}
      </ul>
      <Camp etiqueta={ETIQUETA_NOTES} ajuda={`Fins a ${MAX_NOTES} caràcters: són les notes de versió de cada botiga.`}>
        <AreaText files={2} maxLength={MAX_NOTES} value={notes} disabled={enviant || enCurs}
          onChange={(e) => setNotes(e.target.value)} />
      </Camp>
      <p id={idMotiu}>{motiu ?? MOTIU_LLEST}</p>
      <Boto varietat="primari" mida="gran" icona={Rocket} carregant={enviant} disabled={motiu !== null || enCurs}
        aria-describedby={idMotiu} onClick={publica}>
        {TEXT_BOTO_JARVIS}
      </Boto>
      {!dev && <Alerta to="info" titol="Des de la web pública, encara no">{MOTIU_FORA_DE_DEV}</Alerta>}
      {resposta?.estat === 'sense-corredor' && (
        <Alerta to="avis">
          {resposta.missatge}
          <pre className="sdp-consola__diagnosi-text"><Privat>{ordreTerminal({ notes })}</Privat></pre>
        </Alerta>
      )}
      {(resposta?.estat === 'no-local' || resposta?.estat === 'error') && <Alerta to="error">{resposta.missatge}</Alerta>}
      {resposta?.estat === 'iniciat' && (
        <>
          <Alerta to={delProgres.to}>{delProgres.text}</Alerta>
          {/* Àrbitre T1a-ARB-03 · Els títols ja porten «1/4»: la parella de
              classes de TargetaConsola (list-style: none), cap numeració doble. */}
          <ol className="sdp-consola__evidencies sdp-consola__problemes" aria-label={ETIQUETA_PASSOS}>
            {passos.map((p) => (
              <li key={p.id}>
                <Insignia to={INSIGNIA_PAS[p.estat].to}>{INSIGNIA_PAS[p.estat].text}</Insignia> {p.titol}
                {p.detall ? <> · <Privat>{p.detall}</Privat></> : null}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/**
 * /consola/empaquetats. Sense font, diu per què (la font només la servix el
 * servidor local de desenvolupament) i no en pinta cap plataforma: la
 * Consola no inventa versions. Amb una lectura, les quatre plataformes. `peu`
 * és el panell de dades de totes les pàgines (ControlsConsola).
 * IDEA-60 (T1, prompt 261102_1532) · El Mode Jarvis (SeccioJarvis) va just
 * darrere de la Versió Canònica i abans de les alertes i les plataformes.
 * Gauntlet 261030 (cicle 4, ALT-C1 de Codex) · Sense Traductor
 * (traduccio={false}): les rutes, els artefactes i les ordres de la carpeta
 * de builds són d'este ordinador i no s'envien a cap motor de traducció.
 * Traduir avisa; el botó no canvia (Llei del Píxel).
 */
export function PaginaEmpaquetats({ font, privat, peu }) {
  const copy = copyConsola();
  const pagina = paginaEmpaquetats();
  const plataformes = plataformesEmpaquetades(font.valor);
  return (
    <UniversalPage title={pagina.title} subtitle={pagina.subtitle} lead={pagina.lead} chrome="system" nivellMaxIndex={6}
      topBarData={dataHoraDeBarra({ creat: copy.date, modificat: font.valor?.generat })}
      traduccio={false} llenguaDelContingut="ca">
      <PrivacitatConsola.Provider value={privat}>
        <MollaPa className="sdp-molla--panell" passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: pagina.title }]} />
        {/* IDEA-50 (pàgina de versions; pla 261029_1605, Bloc G) · La versió
            porta a /versions amb un enllaç de prosa: cap modal, cap classe nova.
            Gauntlet 261029 · El lector hi sent també on porta (DestiVersions). */}
        <p>Versió Canònica del Sistema: <Link to={resolvePageSlugPath('versions')}><Mono>{versioCanonica()}</Mono><DestiVersions /></Link></p>
        <SeccioJarvis font={font} plataformes={plataformes} />
        {canonicaDesfasada(font.valor) && (
          <Alerta to="avis" titol="La versió de package.json ha canviat">
            El servidor llig la {font.valor.canonica} i esta pàgina porta la {VERSIO_SISTEMA}: recarrega-la.
          </Alerta>
        )}
        {font.estat === 'loading' && <Carregant etiqueta="Llegint els empaquetats…" />}
        {font.estat === 'error' && (
          <Alerta to="error" titol="No s’han pogut llegir els empaquetats">
            {font.valor ? 'Es conserva l’última lectura bona. ' : ''}
            {font.error?.message || 'Torna a provar-ho amb Refrescar.'}
          </Alerta>
        )}
        {!font.valor && font.estat === 'absent' && (
          <EstatBuit icona={Package} titol="Empaquetats no disponibles">
            Esta pàgina viu de <Mono>GET /__iaia/empaquetats.json</Mono>, que només llig noms d’artefactes i
            versions declarades: en viu, al servidor local de desenvolupament, i a la web publicada, en la
            instantània sanejada de cada publicació. Este paquet no la porta, i la Consola no en inventa.
          </EstatBuit>
        )}
        {font.valor && !font.valor.carpeta && (
          <Alerta to="avis" titol="No s’ha trobat la carpeta de builds">
            Les versions declarades es lligen igual; els artefactes, no.
          </Alerta>
        )}
        {plataformes.map((p) => <Plataforma key={p.id} p={p} />)}
        {peu}
      </PrivacitatConsola.Provider>
    </UniversalPage>
  );
}

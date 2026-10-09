/**
 * PolsConsola.jsx — «El pols del cervell» (/consola/pols) i la pàgina pròpia
 * de cada un dels seus tres panells (/consola/pols/<id>).
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada panell és una
 * targeta sencera amb la boina de Sóc de Poble que porta a la seua pàgina
 * (PaginaApp), on viu el contingut que abans obria un desplegable (Derogat
 * per l'ordre del Mestre del 261004, xat: cap xifra solta: el <details> «Veure
 * detall de…» davall de la graella i la targeta «quieta», sense peu, quan no
 * hi havia dades). Compartir comparteix l'adreça del panell. Sense
 * consola.json (producció), la targeta continua sent una targeta completa i
 * la pàgina explica que la dada només existix en local. Les xifres del pols
 * (rebuts, skills) són targetes de xifra amb pàgina pròpia
 * (XifresMas.jsx), com totes les de la Consola.
 *
 * Correcció 261004 (verificador de la segona passada, punt 2) · També les
 * que quedaven soltes: la barra i l'avís de la Càrrega, el nombre de
 * rebuts i l'últim, el segell de Skills i, al pols,
 * les operacions immunitàries i les línies descartades. Cada panell pinta
 * les targetes de la seua vista (VISTES_XIFRES, xifresMas.js), també sense
 * consola.json; els avisos que porten un recompte enllacen amb la seua
 * targeta.
 */
import { useState } from 'react';
import { Gauge, Puzzle, Receipt, SearchX } from 'lucide-react';
import {
  Alerta, Boto, Carregant, Dialeg, EstatBuit, Insignia, MollaPa, PaginaApp, Taula
} from '../../components/PedraSeca';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { AUTORIA_SOCDEPOBLE } from '../control/destinsControl.js';
import { curt, dataLocal } from './consolaContent.js';
import {
  LLINDAR_SATURACIO, RUTA_CONSOLA, copyConsola, etiquetesPols, fontLlegible, liniesDescartades, plural,
  problemesPols, recompteArtefactes, saturat
} from './consolaPagines.js';
import { concorda } from './concordanca.js';
import { Mono, Privat, PrivacitatConsola, TargetaConsola } from './peces.jsx';
import { RUTA_POLS, cobertesPols, panellPols, panellsPols } from './polsConsola.js';
import { Entradeta, GraellaXifres } from './XifresMas.jsx';
import { xifresDeVista } from './xifresMas.js';

const ICONES_PANELLS = Object.freeze({ gauge: Gauge, receipt: Receipt, puzzle: Puzzle });

const AUTOR = Object.freeze({
  nom: AUTORIA_SOCDEPOBLE.author,
  avatar: AUTORIA_SOCDEPOBLE.avatarUrl,
  href: AUTORIA_SOCDEPOBLE.authorHref,
  poble: AUTORIA_SOCDEPOBLE.location
});

/* Ordre del Mestre, 261004 · La targeta porta la data de versió del copy de
   la Consola (T51) o, si és més recent, la de la instantània. */
const dataDelCopy = () => copyConsola().date;

/* Les targetes d'una vista del pols ('pols' o 'pols/<panell>'), amb la data de consola.json. */
function XifresDelPols({ vista, dades, locale }) {
  return <GraellaXifres xifres={xifresDeVista(vista, null, dades, locale)} generat={dades?.generat ?? null} />;
}

/* Un avís o una frase que porta un recompte enllaça amb la targeta de la seua
   xifra, pel títol de la targeta (cap xifra solta). */
function EnllacXifra({ vista, slug, dades, locale }) {
  const xifra = xifresDeVista(vista, null, dades, locale).find((x) => x.slug === slug);
  return xifra ? <>Ho compta la targeta <Link to={xifra.ruta}>{xifra.titol}</Link>.</> : null;
}

/* L'avís de saturació, al pols i a la Càrrega documental. */
function AvisSaturacio({ dades, locale }) {
  const recompte = recompteArtefactes(dades);
  if (!saturat(recompte)) return null;
  return (
    <Alerta to="avis" titol="Revisem la saturació">
      Hi ha {plural(recompte - LLINDAR_SATURACIO, 'artefacte', 'artefactes')} per damunt del llindar.
      Cal revisar rellevància i context; no s’arxiva res automàticament.{' '}
      <EnllacXifra vista="pols/carrega" slug="artefactes-actius" dades={dades} locale={locale} />
    </Alerta>
  );
}

/* ── Els panells ───────────────────────────────────────────────────────── */

/* Correcció 261004 (verificador de la tercera passada, punt 4) · Sense el
   diari de sessió no hi ha mesura, i no es diu «cap» com si fóra un zero. */
function DiariIllegible({ icona }) {
  return (
    <EstatBuit icona={icona} titol="Diari de sessió no disponible">
      El diari <Mono>.agents/.diari_sessio.jsonl</Mono> no existix o no es pot llegir: no hi ha mesura, i això no
      és cap zero.
    </EstatBuit>
  );
}

/* Correcció 261004 (verificador de la segona passada, punt 2) · El nombre de
   rebuts i l'últim (T12: un diari que ningú no escriu ha de dir-ho) són
   targetes. Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta):
   la línia «Últim rebut: data (fa N dies)» damunt de la taula.
   T9 (260930) · les taules del pols no porten límit d'alçada propi: l'únic
   scroll vertical és el de la pàgina. */
function PanellRebuts({ dades, locale, onVeure }) {
  const { rebuts } = dades;
  const xifres = <XifresDelPols vista="pols/rebuts" dades={dades} locale={locale} />;
  if (!fontLlegible(dades, 'diari')) return <>{xifres}<DiariIllegible icona={Receipt} /></>;
  if (rebuts.length === 0) {
    return (
      <>
        {xifres}
        <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
          El diari de sessió no té entrades <Mono>matrix.rebut</Mono>.
        </EstatBuit>
      </>
    );
  }
  return (
    <>
      {xifres}
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
                  <Boto varietat="fantasma" onClick={() => onVeure(r)} aria-label={`Veure les fonts del rebut de ${quan} (${plural(r.fonts.length, 'font', 'fonts')})`}>
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

function PanellSkills({ dades, locale }) {
  const { skills } = dades;
  return (
    <>
      {/* Ordre del Mestre, 261004 · ni «orfes» ni «fantasmes»: són paraules del Mapa (Inventari).
          Correcció 261004 (verificador de la segona passada, punt 2) · el segell és una targeta:
          derogada la línia «Segell … · N fitxers · data». */}
      <XifresDelPols vista="pols/skills" dades={dades} locale={locale} />
      <Taula titol="Inventari de skills" densa>
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">{s.core ? <strong>{s.nom}</strong> : s.nom}</th>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="error">sense estat</Insignia>}</td>
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

/* Correcció 261004 (verificador de la segona passada, punt 2) · El recompte
   d'artefactes actius és una targeta (sense termometria, «sense mesura», i
   la seua pàgina diu per què). Derogat per l'ordre del Mestre del 261004
   (xat: cap xifra solta): la barra de progrés respecte del llindar. */
function PanellCarrega({ dades, locale }) {
  return (
    <>
      <XifresDelPols vista="pols/carrega" dades={dades} locale={locale} />
      <AvisSaturacio dades={dades} locale={locale} />
      {dades.termometria?.abast && <p>{dades.termometria.abast}</p>}
    </>
  );
}

/* ── El tauler del pols ────────────────────────────────────────────────── */

/* Cada panell s'explica a si mateix: el «per a què» de subtítol, què mesura
   d'entradilla i les mètriques vives a part o, si no n'hi ha, per què
   (cobertesPols, polsConsola.js: cada mètrica té la seua targeta). */

/* Correcció 261004 (verificador de la segona passada, punt 2) · Al pols, les
   operacions immunitàries i les línies descartades són targetes, també sense
   consola.json (amb el seu nom). */
export function PaginaPols({ consola, locale = 'ca-ES' }) {
  const { estat, dades, error } = consola;
  // Un sol rellotge per pintada: l'etiqueta i els problemes dels rebuts diuen el mateix.
  const ara = Date.now();
  const etiquetes = etiquetesPols(dades, estat, ara);
  // Correcció de l'Onada 6 (revisió adversarial) · cada panell diu també quins problemes té, a la vista.
  const problemes = problemesPols(dades, ara);
  const cobertes = cobertesPols(dades, estat);
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
      <AvisSaturacio dades={dades} locale={locale} />
      <div className="sdp-card-grid sdp-consola__graella">
        {panellsPols().map((p) => (
          <TargetaConsola key={p.id} icona={ICONES_PANELLS[p.icona]} titol={p.titol} subtitol={p.subtitol}
            entradilla={<Entradeta marcada={p.entradilla} />}
            metriques={cobertes[p.id].metriques} dada={cobertes[p.id].senseMesura}
            problemes={problemes[p.id]}
            creat={dataDelCopy()} generat={dades?.generat} etiquetes={etiquetes[p.id]} a={p.ruta} />
        ))}
      </div>
      <AvisLiniesDescartades dades={dades} locale={locale} />
      <XifresDelPols vista="pols" dades={dades} locale={locale} />
    </>
  );
}

/* Ordre del Mestre, 261004 (cap anomalia sense mostrar) · Les línies que el
   middleware no ha pogut llegir del diari de sessió i del journal
   immunitari: si n'hi ha, un avís diu què vol dir. Correcció 261004
   (verificador de la segona passada, punt 2) · el recompte és la targeta
   «linies-descartades», també a zero, i l'avís hi enllaça. Derogat per
   l'ordre del Mestre del 261004 (xat: cap xifra solta): la línia «Línies
   descartades: N al diari de sessió · M al journal immunitari». */
function AvisLiniesDescartades({ dades, locale }) {
  const n = liniesDescartades(dades);
  const total = (n?.diari ?? 0) + (n?.immunitari ?? 0);
  if (!total) return null;
  return (
    <Alerta to="avis" titol="Hi ha línies que no es poden llegir">
      {plural(total, 'línia del diari o del journal', 'línies del diari o del journal')}{' '}
      {concorda(total, 'no és JSON vàlid', 'no són JSON vàlid')}: no compten en cap rebut, consum ni operació
      d’esta pàgina. <EnllacXifra vista="pols" slug="linies-descartades" dades={dades} locale={locale} />
    </Alerta>
  );
}

/* ── La pàgina d'un panell ─────────────────────────────────────────────── */

/* Sense consola.json, cada panell ho diu i pinta les targetes de la seua
   vista que es pinten sempre, amb el seu nom (cap pàgina sense targeta). */
function SenseConsola({ id, consola, locale }) {
  const motiu = consola.estat === 'loading' ? <Carregant etiqueta="Llegint l’estat de l’eixam…" />
    : consola.estat === 'error' ? (
      <Alerta to="error" titol="No s’ha pogut llegir consola.json">
        {consola.error?.message || 'Torna a provar-ho amb Refrescar.'}
      </Alerta>
    ) : (
      <EstatBuit icona={ICONES_PANELLS[panellPols(id).icona]} titol="Consola no disponible">
        Esta dada viu de consola.json (<Mono>GET /__iaia/consola.json</Mono>), que només se servix al servidor
        local de desenvolupament. En producció no n’hi ha, i la Consola no n’inventa cap.
      </EstatBuit>
    );
  return (
    <>
      <XifresDelPols vista={`pols/${id}`} dades={null} locale={locale} />
      {motiu}
    </>
  );
}

/**
 * La pàgina d'un panell del pols. `consola` és la font ({ dades, estat,
 * error }), `privat` el mode privacitat i `peu` els controls de la Consola.
 * Un id que no existix no peta: la pàgina ho diu i torna al pols.
 */
export function PaginaPanellPols({ id, consola, locale = 'ca-ES', privat = false, peu = null }) {
  const navigate = useNavigate();
  const [rebutObert, setRebutObert] = useState(null);
  const copy = copyConsola();
  const panell = panellPols(id);
  const { dades } = consola;
  const quan = dataHoraDeBarra({ creat: dataDelCopy(), modificat: dades?.generat });
  const tornar = () => navigate(RUTA_POLS);
  const molla = (darrer) => (
    <MollaPa className="sdp-molla--panell"
      passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: 'El pols del cervell', a: RUTA_POLS }, { etiqueta: darrer }]} />
  );

  if (!panell) {
    return (
      <PaginaApp title="Panell no trobat" subtitle="El pols del cervell"
        lead="Esta adreça no correspon a cap panell del pols: els tres panells són al pols del cervell."
        author={AUTOR} {...quan} onBack={tornar}>
        {molla('Panell no trobat')}
        <EstatBuit icona={SearchX} titol="Cap panell amb este nom">
          <Link to={RUTA_POLS}>Torna al pols del cervell</Link> per a vore els tres panells.
        </EstatBuit>
      </PaginaApp>
    );
  }

  const contingut = !dades ? <SenseConsola id={panell.id} consola={consola} locale={locale} /> : {
    carrega: <PanellCarrega dades={dades} locale={locale} />,
    rebuts: <PanellRebuts dades={dades} locale={locale} onVeure={setRebutObert} />,
    skills: <PanellSkills dades={dades} locale={locale} />
  }[panell.id];

  return (
    <PrivacitatConsola.Provider value={privat}>
      <PaginaApp title={panell.titol} subtitle={panell.subtitol} lead={<Entradeta marcada={panell.entradilla} />}
        author={AUTOR} {...quan} onBack={tornar}>
        {molla(panell.titol)}
        {contingut}
        {peu}
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
      </PaginaApp>
    </PrivacitatConsola.Provider>
  );
}

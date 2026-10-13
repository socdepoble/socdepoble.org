/**
 * PanellEscaner.jsx — el mòdul «Escàner Local» de la closca de la Gestoria.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D; mapa D, §4): la
 * Gestoria accepta la carpeta arrel sencera, hi troba els extractes del banc i
 * les factures de cada trimestre, avisa dels duplicats, de les dates que no
 * quadren i dels buits, i proposa abocar els extractes al Tauler amb un clic.
 *
 * Les peces, de dalt a baix:
 *   · LA PORTA · sense la signatura del tractor 'gestoria.escaner', l'estat
 *     honest «Cal aprovar el tractor» i el camí al panell de Tractors (com
 *     PortaTauler); si el que falta és el del Tauler, una nota: l'Escàner
 *     analitza igualment, però no pot abocar.
 *   · «Tria la carpeta» · el selector del sistema (Boto) o, on no n'hi ha,
 *     l'<input type="file" webkitdirectory>, i el progrés de l'anàlisi.
 *   · «Radiografia de la carpeta» · una tessel·la per apartat (Bancs,
 *     Factures, Duplicats, Dates, Buits, Alertes, Identitat, Burocràcia, Arxiu
 *     i altres) amb el seu recompte, i una sola Taula amb el detall de la
 *     triada. Cada tessel·la és un Boto amb aria-pressed, del nucli 1.1.0 de
 *     Pedra Seca: UniversalIndicatorCard no n'és, i el mòdul de la Gestoria no
 *     compilava (ordre del Mestre, 13-10-2026, pla 261013_1405, front D). La
 *     identitat només es compta per carpetes: cap nom dels seus fitxers en cap
 *     vista, tampoc a «Alertes» ni a l'arxiu (revisió adversarial 13-10-2026,
 *     troballes PRIV-2, ORD-1 i FP-1), i la pista cap a «Identitat i Finestreta».
 *   · «Extractes per al Tauler» · una casella per extracte (els preseleccionats
 *     pel nucli, perquè res no es compte dues vegades) i «Aboca N extractes al
 *     Tauler», que crida tauler.llig: els bytes els llig el tractor del Tauler,
 *     amb la seua aprovació. Després, el resum de les dades del Tauler:
 *     les dates de cada compte es veuen sempre; els moviments i les parelles
 *     són xifres del banc i només es pinten amb l'ull de la boina obert (ordre
 *     del Mestre, 261004).
 *   · Les factures van al Full trimestral (opció A del mapa): una pista per a
 *     triar-hi la mateixa carpeta amb el selector del sistema, o la del
 *     trimestre on no n'hi ha (revisió adversarial 13-10-2026, troballa
 *     PRIV-3); l'Escàner no toca el Full.
 * Cap títol porta dades: l'Índex de la pàgina escriu el text dels H2 a
 * l'adreça (?seccio=). Els trimestres, les carpetes i els fitxers van en
 * paràgrafs i cel·les. Res no ix d'este ordinador.
 */
import { useId, useState } from 'react';
import { Archive, CalendarRange, CalendarX, Copy, EyeOff, IdCard, Landmark, Receipt, ShieldAlert, Stamp } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant, Progres } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText, Casella, GrupCamps } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { formatData } from '../nucli/dates.js';

/* Com diu la porta l'estat del tractor, quan no està aprovat (les paraules de PortaTauler). */
const ESTATS_TRACTOR = Object.freeze({
  pendent: 'encara no està aprovat',
  caducat: 'té l’aprovació caducada',
  revocat: 'té l’aprovació revocada',
  'empremta-divergent': 'ha canviat des que el vas aprovar',
  incomplet: 'no té tots els fitxers declarats',
  error: 'no s’ha pogut comprovar'
});
/* Les files que pinta la Taula del detall, com a molt; la resta es compta. */
const MAX_FILES = 200;
const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info', info: 'neutre' });
const TEXT_SEVERITAT = Object.freeze({ alta: 'Alta', mitjana: 'Mitjana', baixa: 'Baixa', info: 'Informativa' });
const TEXT_FASE = Object.freeze({
  llistant: 'Llistant els fitxers de la carpeta…',
  empremtes: 'Comparant els fitxers que tenen la mateixa mida…',
  reconeixent: 'Reconeixent els extractes del banc…',
  classificant: 'Classificant la carpeta…'
});
const TEXT_FORMAT = Object.freeze({
  n43: 'Norma 43', 'csv-tauler': 'CSV del banc', 'csv-altre': 'CSV d’un altre format', xls: 'Full de càlcul', pdf: 'PDF', no: 'Sense format llegible'
});
const TEXT_CODI = Object.freeze({
  DUPLICAT_EXACTE: 'Còpia exacta', EXTRACTES_SOLAPATS_POSSIBLES: 'Pot repetir moviments', CSV_ALTRE_FORMAT: 'Format que el Tauler no llig',
  EXTRACTE_NO_LLEGIBLE: 'No llegible', MASSA_EXTRACTES: 'Fora del límit', TRIMESTRE_SENSE_CARPETA: 'Trimestre sense carpeta',
  MES_SENSE_EXTRACTE: 'Mes sense extracte', FORAT_SERIE: 'Forat en una sèrie'
});
const TEXT_CATEGORIA = Object.freeze({ arxiu: 'Arxiu', codi: 'Codi', altres: 'Altres' });

const plural = (n, una, moltes) => `${n} ${n === 1 ? una : moltes}`;

/* Les tessel·les de la radiografia: el títol, la icona (el component, que pinta el Boto) i el recompte
   (estructural: mai una xifra del banc). */
const TESSELES = Object.freeze([
  { id: 'bancs', titol: 'Bancs', icona: Landmark, compte: (r) => plural(r.bancs.candidats, 'extracte', 'extractes') },
  { id: 'factures', titol: 'Factures', icona: Receipt, compte: (r) => plural(r.perCategoria.factures, 'fitxer', 'fitxers') },
  { id: 'duplicats', titol: 'Duplicats', icona: Copy, compte: (r) => plural(r.duplicats.grups, 'grup', 'grups') },
  { id: 'dates', titol: 'Dates', icona: CalendarRange, compte: (r) => plural(r.incongruencies.total, 'avís', 'avisos') },
  { id: 'buits', titol: 'Buits', icona: CalendarX, compte: (r) => plural(r.buits.total, 'buit', 'buits') },
  { id: 'alertes', titol: 'Alertes', icona: ShieldAlert, compte: (r) => plural(r.alertes.total, 'alerta', 'alertes') },
  { id: 'identitat', titol: 'Identitat', icona: IdCard, compte: (r) => plural(r.identitat.fitxers, 'fitxer', 'fitxers') },
  { id: 'burocracia', titol: 'Burocràcia', icona: Stamp, compte: (r) => plural(r.perCategoria.burocracia, 'fitxer', 'fitxers') },
  {
    id: 'altres', titol: 'Arxiu i altres', icona: Archive,
    compte: (r) => plural(r.perCategoria.arxiu + r.perCategoria.codi + r.perCategoria.altres, 'fitxer', 'fitxers')
  }
]);

function Severitat({ severitat }) {
  return <Insignia to={TO_SEVERITAT[severitat] ?? 'neutre'}>{TEXT_SEVERITAT[severitat] ?? 'Sense gravetat'}</Insignia>;
}

/* Una xifra del banc: el text, o «Xifra amagada» mentre l'ull de la boina està tancat. */
function XifraDelBanc({ valor, visible }) {
  if (!Number.isFinite(valor)) return <span>Sense dades</span>;
  if (!visible) {
    return (
      <span className="sdp-gestoria-tauler__amagat">
        <EyeOff size={20} aria-hidden="true" focusable="false" />
        <span>Xifra amagada</span>
      </span>
    );
  }
  return <span>{String(valor)}</span>;
}

/* Les files que es pinten, i quantes en queden fora. */
function talla(files) {
  return { visibles: files.slice(0, MAX_FILES), fora: Math.max(0, files.length - MAX_FILES) };
}

function NotaFora({ fora }) {
  return fora > 0 ? <p className="sdp-gestoria-escaner__nota">{`I ${plural(fora, 'fila', 'files')} més, que no es pinten.`}</p> : null;
}

function SenseRes() {
  return <p className="sdp-gestoria-escaner__nota">Res en este apartat.</p>;
}

/* Revisió adversarial 13-10-2026, troballes PRIV-2, ORD-1 i FP-1: de la identitat legal (la seua carpeta, també la que
   hi ha dins de l'arxiu, o la categoria pel nom) no es pinta mai el nom ni la ruta d'un fitxer, només la carpeta. */
const esDeLaIdentitat = (d) => Boolean(d.context?.identitat) || d.categoria === 'identitat';
const carpetaDeLaIdentitat = (d) => d.context?.carpetaIdentitat ?? (d.carpeta || 'L’arrel de la carpeta');

/* Les files d'una vista de documents: un fitxer per fila; els de la identitat, una fila per carpeta amb el recompte,
   on hi havia el primer. */
function filesDeDocuments(docs) {
  const files = [];
  const perCarpeta = new Map();
  for (const d of docs) {
    if (!esDeLaIdentitat(d)) {
      files.push({ clau: d.ruta, cap: d.ruta, doc: d, n: 0 });
      continue;
    }
    const carpeta = carpetaDeLaIdentitat(d);
    if (!perCarpeta.has(carpeta)) {
      const fila = { clau: `identitat:${carpeta}`, cap: carpeta, doc: null, categoria: d.categoria, n: 0 };
      perCarpeta.set(carpeta, fila);
      files.push(fila);
    }
    perCarpeta.get(carpeta).n += 1;
  }
  return files;
}

/* El detall de cada apartat: una sola Taula, amb el nom propi de la regió («Taula · …»). */
function Detall({ vista, resultat }) {
  const tessela = TESSELES.find((t) => t.id === vista) ?? TESSELES[0];
  const titol = `Taula · ${tessela.titol}`;
  const { radiografia: r, documents = [], duplicats = [], incongruencies = [], buits = [], alertes = [], extractes = [] } = resultat;

  if (vista === 'factures') {
    const { perTrimestre, perAny } = r.factures;
    if (!perTrimestre.length && !perAny.length) return <SenseRes />;
    return (
      <Taula titol={titol} densa>
        <thead>
          <tr>
            <th scope="col">Carpeta</th><th scope="col">Factures</th><th scope="col">Rebuts</th><th scope="col">Fulls</th>
            <th scope="col">CSV de proveïdor</th><th scope="col">Imatges</th><th scope="col">Extractes</th><th scope="col">Altres</th>
          </tr>
        </thead>
        <tbody>
          {perTrimestre.map((q) => (
            <tr key={q.carpeta}>
              <th scope="row">{`${q.t}T de ${q.any}`}</th>
              <td className="sdp-num">{q.factures}</td><td className="sdp-num">{q.rebuts}</td><td className="sdp-num">{q.fulls}</td>
              <td className="sdp-num">{q.csvProveidor}</td><td className="sdp-num">{q.imatges}</td><td className="sdp-num">{q.extractes}</td>
              <td className="sdp-num">{q.altres}</td>
            </tr>
          ))}
          {perAny.map((a) => (
            <tr key={`any-${a.any}`}>
              <th scope="row">{`L’any ${a.any}`}</th>
              <td colSpan={7}>{`${plural(a.n, 'fitxer', 'fitxers')} de factures en la carpeta de l’any`}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    );
  }

  if (vista === 'identitat') {
    const perCarpeta = new Map();
    for (const d of documents.filter((x) => x.categoria === 'identitat')) {
      const carpeta = carpetaDeLaIdentitat(d);
      perCarpeta.set(carpeta, (perCarpeta.get(carpeta) ?? 0) + 1);
    }
    if (!perCarpeta.size) return <SenseRes />;
    return (
      <>
        <p className="sdp-gestoria-escaner__nota">Només es compten: no se n’ha llegit cap byte i ací no es diu el nom de cap fitxer.</p>
        <Taula titol={titol} densa>
          <thead><tr><th scope="col">Carpeta</th><th scope="col">Fitxers</th></tr></thead>
          <tbody>
            {[...perCarpeta].sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)).map(([carpeta, n]) => (
              <tr key={carpeta}><th scope="row">{carpeta}</th><td className="sdp-num">{n}</td></tr>
            ))}
          </tbody>
        </Taula>
      </>
    );
  }

  if (vista === 'bancs') {
    if (!extractes.length) return <SenseRes />;
    const { visibles, fora } = talla(extractes);
    return (
      <>
        <Taula titol={titol} densa>
          <thead><tr><th scope="col">Extracte</th><th scope="col">Format</th><th scope="col">Estat</th><th scope="col">Per què</th></tr></thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.ruta}>
                <th scope="row">{f.ruta}</th>
                <td>{TEXT_FORMAT[f.format] ?? f.format}</td>
                <td>
                  {f.preseleccionat ? <Insignia to="exit">Proposat</Insignia>
                    : f.seleccionable ? <Insignia to="neutre">Es pot triar</Insignia>
                      : <Insignia to={TO_SEVERITAT[f.severitat] ?? 'neutre'}>{TEXT_CODI[f.codi] ?? 'No s’aboca'}</Insignia>}
                </td>
                <td>{f.motiu}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
        <NotaFora fora={fora} />
      </>
    );
  }

  if (vista === 'duplicats') {
    if (!duplicats.length) return <SenseRes />;
    const { visibles, fora } = talla(duplicats);
    return (
      <>
        <Taula titol={titol} densa>
          <thead><tr><th scope="col">Original</th><th scope="col">Còpies</th><th scope="col">Gravetat</th><th scope="col">Què passa</th></tr></thead>
          <tbody>
            {visibles.map((g) => (
              <tr key={g.original}>
                <th scope="row">{g.original}</th>
                <td>{g.copies.join(', ')}</td>
                <td><Severitat severitat={g.severitat} /></td>
                <td>{g.missatge}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
        <NotaFora fora={fora} />
      </>
    );
  }

  if (vista === 'dates') {
    if (!incongruencies.length) return <SenseRes />;
    const { visibles, fora } = talla(incongruencies);
    return (
      <>
        <Taula titol={titol} densa>
          <thead><tr><th scope="col">Fitxer</th><th scope="col">La carpeta diu</th><th scope="col">El nom diu</th><th scope="col">Gravetat</th></tr></thead>
          <tbody>
            {visibles.map((x) => (
              <tr key={x.ruta}>
                <th scope="row">{x.ruta}</th><td>{x.diuCarpeta}</td><td>{x.diuNom}</td><td><Severitat severitat={x.severitat} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
        <NotaFora fora={fora} />
      </>
    );
  }

  if (vista === 'buits') {
    if (!buits.length) return <SenseRes />;
    const { visibles, fora } = talla(buits);
    return (
      <>
        <Taula titol={titol} densa>
          <thead><tr><th scope="col">Què falta</th><th scope="col">Detall</th><th scope="col">Gravetat</th></tr></thead>
          <tbody>
            {visibles.map((b, i) => (
              <tr key={`${b.codi}-${i}`}>
                <th scope="row">{TEXT_CODI[b.codi] ?? b.codi}</th><td>{b.missatge}</td><td><Severitat severitat={b.severitat} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
        <NotaFora fora={fora} />
      </>
    );
  }

  if (vista === 'alertes') {
    if (!alertes.length) return <SenseRes />;
    const { visibles, fora } = talla(alertes);
    /* Revisió adversarial 13-10-2026, troballes PRIV-2 i ORD-1: una alerta de la identitat porta la carpeta i el
       recompte (el missatge), mai la ruta; si en vinguera una, tampoc es pinta. */
    const ambCarpeta = alertes.some((a) => a.identitat);
    return (
      <>
        <Taula titol={titol} densa>
          <thead>
            <tr><th scope="col">{ambCarpeta ? 'Fitxer o carpeta' : 'Fitxer'}</th><th scope="col">Gravetat</th><th scope="col">Què fer</th></tr>
          </thead>
          <tbody>
            {visibles.map((a) => (
              <tr key={a.identitat ? `identitat:${a.carpeta}` : a.ruta}>
                <th scope="row">{a.identitat ? (a.carpeta || 'L’arrel de la carpeta') : a.ruta}</th>
                <td><Severitat severitat={a.severitat} /></td><td>{a.missatge}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
        <NotaFora fora={fora} />
      </>
    );
  }

  const deLaVista = vista === 'burocracia'
    ? documents.filter((d) => d.categoria === 'burocracia')
    : documents.filter((d) => d.categoria === 'arxiu' || d.categoria === 'codi' || d.categoria === 'altres');
  if (!deLaVista.length) return <SenseRes />;
  /* Revisió adversarial 13-10-2026, troballa FP-1: la identitat dins de l'arxiu (90_Arxiu/01_Identitat_Legal/…) va en
     una fila per carpeta, amb el recompte; cap nom dels seus fitxers. */
  const filesDeLaVista = filesDeDocuments(deLaVista);
  const ambCarpeta = filesDeLaVista.some((f) => !f.doc);
  const { visibles, fora } = talla(filesDeLaVista);
  return (
    <>
      <Taula titol={titol} densa>
        <thead>
          <tr>
            <th scope="col">{ambCarpeta ? 'Fitxer o carpeta' : 'Fitxer'}</th>
            {vista === 'burocracia' ? <th scope="col">Quan es pot esborrar</th> : <th scope="col">Apartat</th>}
            <th scope="col">Què és</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map(({ clau, cap, doc, categoria, n }) => (
            doc ? (
              <tr key={clau}>
                <th scope="row">{cap}</th>
                <td>{vista === 'burocracia' ? (doc.quanEsborrar || 'Sense fitxa') : (TEXT_CATEGORIA[doc.categoria] ?? doc.categoria)}</td>
                <td>{doc.queEs || 'Sense fitxa'}</td>
              </tr>
            ) : (
              <tr key={clau}>
                <th scope="row">{cap}</th>
                <td>{vista === 'burocracia' ? 'Sense fitxa' : (TEXT_CATEGORIA[categoria] ?? categoria)}</td>
                <td>{`${plural(n, 'fitxer', 'fitxers')} de la identitat legal. Només es compten: ací no es diu el nom de cap fitxer.`}</td>
              </tr>
            )
          ))}
        </tbody>
      </Taula>
      {vista === 'burocracia' ? <p className="sdp-gestoria-escaner__nota">Els terminis són orientatius: a verificar amb la gestoria. L’Escàner no mou ni esborra res.</p> : null}
      <NotaFora fora={fora} />
    </>
  );
}

/* Qui és cada compte: «Compte 1», «Compte 2»… (el nom de les targetes del Tauler, mai cap dígit del compte). */
const nomDelCompte = (compte, i) => (compte.id === 'csv' ? 'Moviments en CSV' : `Compte ${i + 1}`);

function cobertura(compte) {
  const desde = formatData(compte.desde);
  const fins = formatData(compte.fins);
  return desde && fins ? `del ${desde} al ${fins}` : 'sense dates';
}

/* El que el Tauler ja té: les dates de cada compte, sempre; els moviments i les parelles, darrere de l'ull. */
function ResumDelTauler({ dades, visible }) {
  const comptes = Array.isArray(dades?.comptes) ? dades.comptes : [];
  const conciliacio = dades?.resum?.conciliacio ?? null;
  let parelles;
  if (!conciliacio?.ambFactures) parelles = <span>sense factures del Full trimestral</span>;
  else if (Number.isFinite(conciliacio.parelles)) parelles = <XifraDelBanc valor={conciliacio.parelles} visible={visible} />;
  else parelles = <span>sense moviments per aparellar</span>;
  return (
    <div className="sdp-gestoria-escaner__resum">
      <p className="sdp-gestoria-escaner__nota">El Tauler, els Bancs i els Impostos ja tenen les xifres d’estos extractes.</p>
      <ul className="sdp-gestoria-escaner__llista">
        {comptes.map((c, i) => <li key={c.id}>{`${nomDelCompte(c, i)}: ${cobertura(c)}.`}</li>)}
        <li>Moviments llegits: <XifraDelBanc valor={conciliacio?.moviments} visible={visible} /></li>
        <li>Moviments aparellats amb factures: {parelles}</li>
      </ul>
    </div>
  );
}

/**
 * @param {{ escaner: object, tauler: object, dades?: object|null, visible?: boolean, onObreTractors: () => void,
 *   onObreIdentitat?: () => void }} p `escaner`: el de useEscaner; `tauler`: el de useTauler; `dades`: el de
 *   dadesDelTauler (la closca); `visible`: l'ull de la boina; `onObreIdentitat`: obri la vista «Identitat i Finestreta»
 */
export function PanellEscaner({ escaner, tauler, dades = null, visible = false, onObreTractors, onObreIdentitat }) {
  const [vista, setVista] = useState('bancs');
  const idTria = useId();
  const idRadiografia = useId();
  const idExtractes = useId();
  /* La porta és la del Tauler (useEscaner no en fa cap segona passada). */
  const porta = escaner.porta ?? tauler.porta ?? null;

  if (porta?.carregant) return <Carregant etiqueta="Llegint les aprovacions dels tractors…" />;
  if (!escaner.aprovat) {
    const estat = ESTATS_TRACTOR[escaner.fila?.estat] ?? ESTATS_TRACTOR.pendent;
    return (
      <Alerta to="avis" titol="Cal aprovar el tractor"
        accions={<Boto varietat="primari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
        {`L’Escàner Local recorre la carpeta amb el tractor «Gestoria · Escàner Local de la carpeta», que ${estat}. `}
        {'Aprova’l amb la teua signatura al panell de Tractors: sense, no es llista ni es llig cap fitxer.'}
        {porta?.error ? ` ${porta.error}` : ''}
      </Alerta>
    );
  }

  const resultat = escaner.resultat;
  const r = resultat?.radiografia ?? null;
  const progres = escaner.progres;
  const seleccio = Array.isArray(escaner.seleccio) ? escaner.seleccio : [];
  const triats = (resultat?.extractes ?? []).filter((f) => f.seleccionable && seleccio.includes(f.ruta)).length;
  const potAbocar = Boolean(tauler.aprovat) && !tauler.llegint && !escaner.ocupat && triats > 0;
  const aboca = () => {
    tauler.llig(escaner.fitxersPerAlTauler());
  };
  /* Oblidar la carpeta mentre el Tauler en llig els extractes cancel·la eixa lectura: sense la Font, no els podria llegir. */
  const oblida = () => {
    if (tauler.llegint) tauler.oblida();
    escaner.oblida();
  };

  return (
    <div className="sdp-gestoria-escaner">
      {tauler.aprovat ? null : (
        <Alerta to="info" viva={false} titol="Per a abocar els extractes cal també el Tauler"
          accions={<Boto varietat="secundari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
          El Tauler llig els extractes amb el seu tractor, «Gestoria · Tauler de l’empresa», que encara no està aprovat.
          L’Escàner pot analitzar la carpeta igualment.
        </Alerta>
      )}

      <section className="sdp-gestoria-escaner__seccio" aria-labelledby={idTria}>
        <h2 id={idTria} className="sdp-gestoria-escaner__titol">Tria la carpeta</h2>
        <Alerta to="info" viva={false} titol="La carpeta no ix d’este ordinador">
          L’Escàner en llig el nom, la mida i la data de cada fitxer. Només en llig els bytes per a comparar els que tenen la
          mateixa mida (els duplicats) i els primers 4 kB dels extractes del banc. No llig mai la carpeta de la identitat ni
          l’arxiu, no mou ni esborra res i no guarda res.
        </Alerta>
        {escaner.potTriarCarpeta ? (
          <div className="sdp-gestoria-escaner__accions">
            <Boto varietat={escaner.teCarpeta ? 'secundari' : 'primari'} onClick={escaner.triaCarpeta}
              carregant={escaner.ocupat === 'carpeta'}>
              {escaner.teCarpeta ? 'Tria una altra carpeta' : 'Tria la carpeta arrel'}
            </Boto>
          </div>
        ) : (
          <Camp etiqueta="Tria la carpeta arrel"
            ajuda="Este navegador no obri el selector de carpetes: tria-la amb este botó. Res es puja enlloc. A l’iPhone i a l’iPad només es poden triar fitxers solts: sense carpetes, l’Escàner no sap els trimestres ni els bancs.">
            {/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): la carpeta arrel porta la identitat legal;
                la línia d'estat del selector només en diu el recompte, cap nom de fitxer. */}
            <CampText tipus="file" webkitdirectory="" multiple nomsVisibles={false}
              onChange={(event) => escaner.usaFitxers(event.target.files)} />
          </Camp>
        )}
        {escaner.nomCarpeta ? <p className="sdp-gestoria-escaner__nota">{`Carpeta triada: «${escaner.nomCarpeta}».`}</p> : null}
        {escaner.ocupat === 'escaneig' ? (
          <Progres etiqueta={TEXT_FASE[progres?.fase] ?? 'Analitzant la carpeta…'}
            valor={progres && Number.isFinite(progres.total) && progres.total > 0 ? progres.fet : null}
            max={progres && Number.isFinite(progres.total) && progres.total > 0 ? progres.total : 100} />
        ) : null}
        {escaner.error ? <Alerta to="error" titol="No s’ha pogut analitzar la carpeta">{escaner.error}</Alerta> : null}
      </section>

      {r ? (
        <section className="sdp-gestoria-escaner__seccio" aria-labelledby={idRadiografia}>
          <h2 id={idRadiografia} className="sdp-gestoria-escaner__titol">Radiografia de la carpeta</h2>
          <p className="sdp-gestoria-escaner__nota">
            {`${plural(r.fitxers, 'fitxer classificat', 'fitxers classificats')} pel nom, la mida i la carpeta. Les dates dels noms són indicis: revisa-les. Les carpetes buides no es veuen.`}
          </p>
          {r.alertes.credencials > 0 ? (
            <Alerta to="avis" titol="Hi ha credencials soltes en la carpeta">
              {`${plural(r.alertes.credencials, 'fitxer pareix', 'fitxers pareixen')} un certificat o una clau privada: guarda’ls fora d’esta carpeta, en un lloc xifrat. El detall és a «Alertes».`}
            </Alerta>
          ) : null}
          {r.avisos.length ? (
            <Alerta to="avis" viva={false} titol="Notes de l’anàlisi">
              <ul className="sdp-gestoria-escaner__llista">
                {r.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
              </ul>
            </Alerta>
          ) : null}
          {/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): cada tessel·la és un Boto del nucli 1.1.0 amb
              aria-pressed (la triada), el títol i el recompte. L'espai entre els dos fa que el nom diga «Bancs 3
              extractes»; en la columna flex no es pinta. */}
          <div className="sdp-gestoria-escaner__radiografia" role="group" aria-label="Apartats de la radiografia">
            {TESSELES.map((t) => (
              <Boto key={t.id} varietat="secundari" icona={t.icona} className="sdp-gestoria-escaner__tessela"
                aria-pressed={vista === t.id ? 'true' : 'false'} onClick={() => setVista(t.id)}>
                <span className="sdp-gestoria-escaner__tessela-titol">{t.titol}</span>{' '}
                <span className="sdp-gestoria-escaner__tessela-compte">{t.compte(r)}</span>
              </Boto>
            ))}
          </div>
          <Detall vista={vista} resultat={resultat} />
          {r.identitat.carpetes > 0 || r.identitat.fitxers > 0 ? (
            <Alerta to="info" viva={false} titol="La identitat legal té la seua vista"
              accions={onObreIdentitat ? <Boto varietat="secundari" onClick={onObreIdentitat}>Obri Identitat i Finestreta</Boto> : null}>
              {`L’Escàner ha vist ${plural(r.identitat.fitxers, 'fitxer', 'fitxers')} de la identitat legal i no n’ha llegit cap byte. Les dades del titular es revisen i es confirmen a «Identitat i Finestreta».`}
            </Alerta>
          ) : null}
          {/* Revisió adversarial 13-10-2026, troballa PRIV-3: sense el selector del sistema, el Full tria amb un
              <input webkitdirectory> que diu el nom dels primers fitxers; la carpeta arrel porta la identitat legal,
              i per això llavors la pista hi envia la carpeta del trimestre. */}
          {r.perCategoria.factures > 0 ? (
            <Alerta to="info" viva={false} titol="Les factures van al Full trimestral">
              {escaner.potTriarCarpeta
                ? 'Al Full trimestral, tria esta mateixa carpeta: hi troba sola la carpeta del trimestre que prepares. '
                : 'Al Full trimestral, tria la carpeta del trimestre que prepares, com 2026_3T, i no la carpeta arrel: '
                  + 'en este navegador, el Full diu el nom dels primers fitxers que hi troba, i l’arrel porta la identitat legal. '}
              L’Escàner no fa el full ni toca les factures.
            </Alerta>
          ) : null}
        </section>
      ) : null}

      {r ? (
        <section className="sdp-gestoria-escaner__seccio" aria-labelledby={idExtractes}>
          <h2 id={idExtractes} className="sdp-gestoria-escaner__titol">Extractes per al Tauler</h2>
          {resultat.extractes.length ? (
            <GrupCamps llegenda="Els extractes que s’abocaran al Tauler" className="sdp-gestoria-escaner__extractes">
              {resultat.extractes.map((f) => (
                <Casella key={f.ruta} etiqueta={f.ruta} ajuda={`${TEXT_FORMAT[f.format] ?? f.format}. ${f.motiu}`}
                  checked={f.seleccionable && seleccio.includes(f.ruta)} disabled={!f.seleccionable}
                  onChange={() => escaner.commutaExtracte(f.ruta)} />
              ))}
            </GrupCamps>
          ) : (
            <p className="sdp-gestoria-escaner__nota">No s’ha trobat cap extracte del banc en la carpeta.</p>
          )}
          <div className="sdp-gestoria-escaner__accions">
            <Boto varietat="primari" onClick={aboca} disabled={!potAbocar} carregant={Boolean(tauler.llegint)}>
              {triats === 1 ? 'Aboca 1 extracte al Tauler' : `Aboca ${triats} extractes al Tauler`}
            </Boto>
          </div>
          {tauler.error ? <Alerta to="error" titol="No s’han pogut llegir els extractes">{tauler.error}</Alerta> : null}
          {tauler.lectura?.avisos?.length ? (
            <Alerta to="avis" titol="Hi ha fitxers que no s’han llegit">
              <ul className="sdp-gestoria-escaner__llista">
                {tauler.lectura.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
              </ul>
            </Alerta>
          ) : null}
          {tauler.lectura && !tauler.llegint && dades ? <ResumDelTauler dades={dades} visible={visible} /> : null}
        </section>
      ) : null}

      {escaner.teCarpeta || escaner.nomCarpeta || escaner.error ? (
        <div className="sdp-gestoria-escaner__accions">
          <Boto varietat="secundari" onClick={oblida}>Oblida la carpeta</Boto>
        </div>
      ) : null}
    </div>
  );
}

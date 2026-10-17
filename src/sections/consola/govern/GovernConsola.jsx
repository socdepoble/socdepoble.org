/**
 * GovernConsola.jsx — el Govern del Mestre a /consola: la secció del tauler
 * i les quatre pàgines (/consola/govern/<id>), amb el seu peu de dades.
 *
 * Pla 261016_1530, Onada 0.5 (Mandat Suprem) · «L'IDE és per a màquines, la
 * Consola Web és per als humans»: quatre mòduls, en paraules de poble i amb
 * les peces de Pedra Seca, sense <pre>, sense tipografia de màquina i sense
 * cap nom tècnic al text corrent. Les evidències de la matriu porten rutes:
 * van dins de <Privat>, que el mode privacitat amaga.
 *
 * Llei del Píxel · Només el tauler de /consola guanya la secció (damunt de
 * les nou targetes de la maquinària). La Consola incrustada de la Wiki
 * (ConsolaIncrustada), l'Índex de la Consola i el Diagnòstic del Mas no la
 * pinten: conserven els seus píxels.
 *
 * Cap número solt: les xifres del govern són les mètriques de les seues
 * quatre targetes (TargetaConsola, amb boina i pàgina pròpia); dins de les
 * pàgines, els recomptes van dins de frases.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { BadgeCheck, Download, ListChecks, MessagesSquare, RefreshCw, Scale, SearchX, X } from 'lucide-react';
import { UniversalPage } from '../../../components/universal/UniversalPage';
import {
  Alerta, AreaText, Boto, Camp, CampFitxer, Carregant, DialegConfirmacio, EstatBuit, Insignia, Interruptor,
  LiniaDelTemps, MollaPa, PillToggle, Taula
} from '../../../components/PedraSeca';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import { dataLocal } from '../consolaContent.js';
import { ETIQUETES, RUTA_CONSOLA, copyConsola } from '../consolaPagines.js';
import { plural } from '../concordanca.js';
import { Privat, PrivacitatConsola, TargetaConsola } from '../peces.jsx';
import {
  ENTRADETA_GOVERN, ETIQUETA_NAV_GOVERN, TITOL_GOVERN, paginaGovern, paginesGovern
} from './governConsola.js';
import { ETIQUETA_ESTAT, filtraFiles, recompteVist, toDeLEstat, vistaMatriu } from './matriuGovern.js';
import { balancDe, comparaTrasllat } from './balancGovern.js';
import {
  DECISIONS_GOVERN, TEXT_DECISIO, VERB_DECISIO, actorDeLaSessio, estatCertificacio, ordenaCertificacions,
  preparaCertificacio
} from './certificacions.js';
import { LLEGENDA, resumsExecutius } from './comunicacioGovern.js';

const ICONES = Object.freeze({
  requeriments: ListChecks, balanc: Scale, certificacio: BadgeCheck, comunicacio: MessagesSquare
});

/** El text literal de l'estat buit (pla 261016_1530, Onada 0.5; encàrrec F1_govern). */
export const TEXT_SENSE_MATRIU = 'Encara no hi ha cap matriu connectada: falta un pas que ha de fer MarIA al servidor de desenvolupament';
export const TEXT_CERTIFICACIO_LOCAL = 'La certificació viu en aquest navegador fins que MarIA endolle el canal: cap agent la llig si no l’exportes.';

/* Tot el que es deriva de la matriu per a una pintada, amb un sol rellotge. */
function derivaGovern(govern, ara) {
  const vista = vistaMatriu(govern.matriu, { head: govern.head, ara });
  const balanc = balancDe(vista);
  return {
    vista,
    balanc,
    comparacio: comparaTrasllat(balanc, govern.trasllat, vista),
    resums: resumsExecutius(vista)
  };
}

/* Per què una targeta no té mesura, i la seua etiqueta: el patró de consolaPagines.js. */
const llegintMatriu = (govern) => govern.servidor.estat === 'loading' && !govern.matriu;
function senseMatriu(govern) {
  if (llegintMatriu(govern)) return { dada: 'Llegint la matriu…', etiquetes: [] };
  if (govern.servidor.estat === 'error') return { dada: 'No s’ha pogut llegir la matriu', etiquetes: [ETIQUETES.reparar] };
  return { dada: 'Encara no hi ha cap matriu connectada', etiquetes: [ETIQUETES.senseFont] };
}

/* La coberta de cada targeta del govern: les mètriques (h5) o per què no n'hi ha, i les etiquetes. */
function cobertaDe(id, govern, { vista, balanc, comparacio, resums }) {
  const registres = govern.certificacions.registres;
  if (id === 'certificacio') {
    const etiquetes = govern.certificacions.persistent ? [] : [{ text: 'Sense desar', to: 'avis' }];
    if (registres === null) return { dada: 'Llegint les decisions…', etiquetes };
    return { metriques: [`${plural(registres.length, 'decisió apuntada', 'decisions apuntades')} en este navegador`], etiquetes };
  }
  if (!vista) return senseMatriu(govern);
  if (id === 'requeriments') {
    const r = recompteVist(vista.files);
    const metriques = [plural(r.fet, 'fet i segellat', 'fets i segellats'), `${r.parcial} a mitges`, `${r.pendent} per a la tanda següent`];
    if (r.obsolet) metriques.push(plural(r.obsolet, 'obsolet', 'obsolets'));
    return { metriques, etiquetes: vista.caducitat.obsoleta ? [{ text: 'Matriu obsoleta', to: 'avis' }] : [] };
  }
  if (id === 'balanc') {
    return {
      metriques: [plural(balanc.demanat.length, 'demanat', 'demanats'), plural(balanc.fet.length, 'fet', 'fets'),
        `${balanc.traslladat.length} a la tanda següent`],
      etiquetes: comparacio && !comparacio.igual ? [{ text: 'El trasllat no quadra', to: 'avis' }] : []
    };
  }
  /* Revisió adversarial del carril F1 (mètrica de la targeta) · Es compten els
     responsables amb nom; les files sense responsable es diuen a banda.
     Derogat: el grup «Sense responsable» comptat com un responsable més. */
  const metriques = [plural(resums.p1Oberts.length, 'P1 oberta', 'P1 obertes'), plural(resums.responsables, 'responsable', 'responsables')];
  if (resums.senseResponsable) metriques.push(plural(resums.senseResponsable, 'fila sense responsable', 'files sense responsable'));
  return {
    metriques,
    etiquetes: resums.p1Oberts.length ? [{ text: 'Hi ha P1 obertes', to: 'avis' }] : []
  };
}

/**
 * La secció del Govern del Mestre al tauler de /consola: el seu H2, una
 * entradeta i les quatre targetes, cada una cap a la seua pàgina.
 * Revisió adversarial del carril F1 (problemes 2 i 9) · La secció ja no tanca
 * amb un separador: la sala de màquines porta el seu H2
 * (TITOL_SALA_MAQUINES), que pinta ConsolaSection darrere d'esta secció.
 * Derogat: el Divisor «La sala de màquines de la Consola».
 */
export function SeccioGovern({ govern, ara = Date.now() }) {
  const id = useId();
  const derivat = derivaGovern(govern, ara);
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{TITOL_GOVERN}</h2>
      <p>{ENTRADETA_GOVERN}</p>
      <nav className="sdp-card-grid sdp-consola__graella" aria-label={ETIQUETA_NAV_GOVERN}>
        {paginesGovern().map((p) => {
          const coberta = cobertaDe(p.id, govern, derivat);
          return (
            <TargetaConsola key={p.id} icona={ICONES[p.id]} titol={p.title} subtitol={p.subtitle} entradilla={p.lead}
              metriques={coberta.metriques} dada={coberta.dada} etiquetes={coberta.etiquetes} a={p.ruta}
              creat={copyConsola().date} generat={p.id === 'certificacio' ? null : derivat.vista?.at ?? null} />
          );
        })}
      </nav>
    </section>
  );
}

/* ── Peces de les pàgines ─────────────────────────────────────────────── */

/* Un bloc de pàgina: el cos de les pàgines de la Consola parla en H3. */
function Bloc({ titol, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h3 id={id}>{titol}</h3>
      {children}
    </section>
  );
}

/* L'estat d'una fila: la pastilla d'una sola línia i, si és obsoleta, què deia la matriu. */
const EstatDeFila = ({ fila }) => (
  <span className="sdp-consola__estat-fila">
    <Insignia to={toDeLEstat(fila.estatVist)}>{ETIQUETA_ESTAT[fila.estatVist]}</Insignia>
    {fila.desconegut ? <> La matriu diu «{fila.status ?? 'res'}», que no s’entén.</>
      : fila.obsolet ? <> Deia {ETIQUETA_ESTAT[fila.estat]}.</> : null}
  </span>
);

/**
 * El que es diu abans del contingut de qualsevol pàgina del govern: la
 * lectura en curs, els errors, l'estat buit (el text literal de l'encàrrec)
 * i, amb una matriu caducada, per què és obsoleta. Torna si hi ha matriu.
 */
function AvisosDeMatriu({ govern, vista }) {
  return (
    <>
      {llegintMatriu(govern) && <Carregant etiqueta="Llegint la matriu…" />}
      {govern.errorFitxer && (
        <Alerta to="error" titol="No s’ha pogut obrir el fitxer">{govern.errorFitxer}</Alerta>
      )}
      {govern.servidor.estat === 'error' && govern.origen !== 'fitxer' && (
        <Alerta to="error" titol="No s’ha pogut llegir la matriu del servidor">
          {govern.matriu ? 'Es conserva l’última matriu bona. ' : ''}
          {govern.servidor.error?.message || 'Torna a provar-ho amb Refrescar.'}
        </Alerta>
      )}
      {!vista && !llegintMatriu(govern) && (
        <EstatBuit icona={ListChecks} titol={`${TEXT_SENSE_MATRIU}.`}>
          Mentrestant, pots obrir el fitxer de la matriu (mcr.json) amb el botó «Obri una matriu (mcr.json)» del peu de
          la pàgina: es llig en este navegador i no es puja enlloc.
        </EstatBuit>
      )}
      {vista?.caducitat.obsoleta && (
        <Alerta to="avis" titol="La matriu és obsoleta">
          <ul>{vista.caducitat.motius.map((m) => <li key={m.clau}>{m.text}</li>)}</ul>
          <p>Cap fila es pinta de verd fins que no arribe una matriu nova: el que deia es conserva al costat.</p>
        </Alerta>
      )}
    </>
  );
}

/* Quines files es veuen: totes o les d'un estat, amb quantes n'hi ha. */
function FiltreDeFiles({ files, valor, onCanvi }) {
  const r = recompteVist(files);
  return (
    <PillToggle etiqueta="Quines files es veuen" valor={valor} onCanvi={onCanvi} opcions={[
      { valor: 'tots', text: `Totes (${files.length})` },
      { valor: 'fet', text: `Fetes i segellades (${r.fet})` },
      { valor: 'parcial', text: `A mitges (${r.parcial})` },
      { valor: 'pendent', text: `Pendents (${r.pendent})` },
      { valor: 'obsolet', text: `Obsoletes (${r.obsolet})` }
    ]} />
  );
}

/* ── 1 · Estat dels requeriments ─────────────────────────────────────── */

function PaginaRequeriments({ govern, vista, locale }) {
  const [filtre, setFiltre] = useState('tots');
  if (!vista) return null;
  const files = filtraFiles(vista.files, filtre);
  return (
    <>
      <Bloc titol="D’on ve la matriu">
        <p>
          {govern.origen === 'fitxer'
            ? <>Oberta d’un fitxer d’este ordinador (<Privat>{govern.nomFitxer ?? 'sense nom'}</Privat>).</>
            : 'Del servidor de desenvolupament.'}{' '}
          {vista.at ? `Es va fer el ${dataLocal(vista.at, locale)}.` : 'No diu quan es va fer.'}{' '}
          {vista.baselineHead ? <>Diu que es va fer sobre la versió del codi <Privat>{vista.baselineHead.slice(0, 8)}</Privat>.</> : null}{' '}
          {vista.caducitat.commitComprovat ? 'La versió del codi s’ha comprovat amb la d’ara.'
            : 'Des d’ací la Consola no pot saber si el codi ha canviat després: només en comprova la data.'}
        </p>
        {vista.quadren === false && (
          <p>Els recomptes que la matriu declara no quadren amb les seues files: es pinta el que diuen les files.</p>
        )}
        {(vista.descartades > 0 || vista.duplicats.length > 0) && (
          <p>
            {vista.descartades > 0 ? `${plural(vista.descartades, 'fila no porta', 'files no porten')} identificador i no es pinta${vista.descartades === 1 ? '' : 'n'}. ` : ''}
            {vista.duplicats.length > 0 ? `Identificadors repetits (es pinta la primera fila): ${vista.duplicats.join(', ')}.` : ''}
          </p>
        )}
      </Bloc>
      <Bloc titol="Què vol dir cada estat">
        <ul>
          {LLEGENDA.map(({ estat, que }) => (
            <li key={estat}><Insignia to={toDeLEstat(estat)}>{ETIQUETA_ESTAT[estat]}</Insignia> {que}.</li>
          ))}
        </ul>
      </Bloc>
      <Bloc titol="La matriu, fila per fila">
        <FiltreDeFiles files={vista.files} valor={filtre} onCanvi={setFiltre} />
        {/* Cinc columnes: el requeriment porta davall d'on ve, l'evidència (amb les rutes dins de
            <Privat>) i què cal per a donar-lo per bo, i la taula no s'escampa. */}
        <Taula titol="Matriu de requeriments" densa>
          <thead>
            <tr>
              <th scope="col">Fila</th>
              <th scope="col">Requeriment</th>
              <th scope="col">Estat</th>
              <th scope="col">Prioritat</th>
              <th scope="col">Responsables</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <th scope="row">{f.id}</th>
                <td>
                  <p>{f.requeriment ?? 'Sense descripció'}</p>
                  {f.font ? <p>Al pla: {f.font}</p> : null}
                  <p>Evidència: {f.evidencia ? <Privat>{f.evidencia}</Privat> : 'cap'}</p>
                  {f.acceptacio ? <p>Per a donar-ho per bo: {f.acceptacio}</p> : null}
                </td>
                <td><EstatDeFila fila={f} /></td>
                <td>{f.prioritat ?? '—'}</td>
                <td>{f.responsable ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </Bloc>
    </>
  );
}

/* ── 2 · Balanç de la sessió ─────────────────────────────────────────── */

function ComparacioDelTrasllat({ govern, comparacio, balanc, obsoleta }) {
  if (!govern.trasllat) {
    return (
      <p>
        Encara no s’ha obert cap trasllat. Obri el trasllat.json de Codex amb el botó «Obri un trasllat
        (trasllat.json)» del peu de la pàgina: la Consola compara els seus identificadors amb els que la matriu deixa oberts.
      </p>
    );
  }
  const t = govern.trasllat;
  const llista = (ids) => ids.join(', ');
  return (
    <>
      <p>
        {govern.origenTrasllat === 'fitxer'
          ? <>Trasllat obert d’un fitxer d’este ordinador (<Privat>{govern.nomTrasllat ?? 'sense nom'}</Privat>)</>
          : 'Trasllat del servidor de desenvolupament'}
        {`, amb ${plural(t.ids.length, 'identificador', 'identificadors')}.`}
        {comparacio.mateixMoment === false ? ' Atenció: el trasllat i la matriu no són del mateix moment.' : ''}
        {t.declaraIgual !== null ? ` El fitxer diu que ${t.declaraIgual ? 'quadra' : 'no quadra'}; la Consola ho torna a comptar.` : ''}
      </p>
      {/* Amb una matriu obsoleta, que quadre no és cap verd: la matriu mateixa s'ha de tornar a fer. */}
      {comparacio.igual ? (
        <Alerta to={obsoleta ? 'info' : 'exit'} titol="El trasllat quadra">
          Porta exactament els {plural(balanc.oberts.length, 'identificador obert', 'identificadors oberts')} de la matriu: cap es perd ni en sobra cap.
        </Alerta>
      ) : (
        <Alerta to="avis" titol="El trasllat no quadra amb la matriu">
          <ul>
            {comparacio.falten.length > 0 && <li>{`Falten al trasllat (es quedarien en l’oblit): ${llista(comparacio.falten)}.`}</li>}
            {comparacio.sobren.length > 0 && <li>{`Sobren al trasllat (la matriu no els té oberts): ${llista(comparacio.sobren)}.`}</li>}
            {comparacio.duplicats.length > 0 && <li>{`Repetits al trasllat: ${llista(comparacio.duplicats)}.`}</li>}
          </ul>
        </Alerta>
      )}
    </>
  );
}

function PaginaBalanc({ govern, vista, balanc, comparacio }) {
  if (!vista) return null;
  const perId = new Map(vista.files.map((f) => [f.id, f]));
  const traslladades = balanc.traslladat.map((id) => perId.get(id));
  return (
    <>
      <Bloc titol="Demanat, fet i traslladat">
        <p>
          {`S’han demanat ${plural(balanc.demanat.length, 'requeriment', 'requeriments')}. `}
          {`${plural(balanc.fet.length, 'està fet i segellat', 'estan fets i segellats')} i `}
          {`${plural(balanc.traslladat.length, 'passa', 'passen')} a la tanda següent, cada un amb el seu identificador.`}
        </p>
        {balanc.perRevisar.length > 0 && (
          <p>
            {`Com que la matriu és obsoleta, cap fila no es pot donar per feta: ${plural(balanc.perRevisar.length, 'fila que deia fet també es trasllada', 'files que deien fet també es traslladen')} per a tornar-${balanc.perRevisar.length === 1 ? 'la' : 'les'} a comprovar.`}
          </p>
        )}
        <p>La Consola no mou res ni esborra res: el trasllat el fa MarIA al pla nou, i ací es compta i es compara.</p>
      </Bloc>
      <Bloc titol="Comparació amb el trasllat">
        <ComparacioDelTrasllat govern={govern} comparacio={comparacio} balanc={balanc} obsoleta={vista.caducitat.obsoleta} />
      </Bloc>
      <Bloc titol="El que passa a la tanda següent">
        {traslladades.length === 0 ? <p>No en queda cap: tot està fet i segellat.</p> : (
          <Taula titol="Requeriments que passen a la tanda següent" densa>
            <thead>
              <tr><th scope="col">Fila</th><th scope="col">Requeriment</th><th scope="col">Estat</th><th scope="col">Responsables</th></tr>
            </thead>
            <tbody>
              {traslladades.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.id}</th>
                  <td>{f.requeriment ?? '—'}</td>
                  <td><EstatDeFila fila={f} /></td>
                  <td>{f.responsable ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Taula>
        )}
      </Bloc>
    </>
  );
}

/* ── 3 · Certificació del Mestre ─────────────────────────────────────── */

/* Descarrega un text com a fitxer amb un enllaç temporal (el patró de PanellTractors.jsx). */
function useDescarrega() {
  const arrel = useRef(null);
  const ultima = useRef(null);
  useEffect(() => () => { if (ultima.current) URL.revokeObjectURL(ultima.current); }, []);
  const descarrega = (text, nom) => {
    if (typeof URL?.createObjectURL !== 'function') throw new Error('Este navegador no pot descarregar fitxers generats.');
    const url = URL.createObjectURL(new Blob([text], { type: 'application/x-ndjson' }));
    if (ultima.current) URL.revokeObjectURL(ultima.current);
    ultima.current = url;
    const enllac = arrel.current.ownerDocument.createElement('a');
    enllac.href = url;
    enllac.download = nom;
    enllac.hidden = true;
    arrel.current.append(enllac);
    enllac.click();
    enllac.remove();
  };
  return { arrel, descarrega };
}

/* Amb quin pla es desen les decisions (normalitzaMcr): el que declara la
   matriu, la seua data o cap. Revisió adversarial del carril F1 (correcció del
   camp «pla») · Derogat: «les decisions es desen sense pla» per a la matriu de
   Codex, que no diu de quin pla és. */
function textDelPla(vista, locale) {
  if (vista.plaDeclarat) return `Les decisions es desen amb el pla de la matriu: ${vista.pla}.`;
  if (vista.pla) {
    return `La matriu no diu de quin pla és: les decisions es desen amb la seua data (${dataLocal(vista.at, locale)}) i només valen per a esta matriu. Una matriu d’una altra data comença sense decisions, i les d’abans continuen al registre.`;
  }
  return 'La matriu no diu de quin pla és ni quan es va fer: les decisions es desen sense pla i es reconeixen només per l’identificador de la fila i la seua empremta.';
}

/* Revisió adversarial del carril F1 (problema 8) · Mentre l'empremta de la
   fila d'ara no se sap (vigent: null), es diu la decisió i que la versió no
   s'ha comprovat, mai «versió anterior». */
function DecisioDeFila({ estat, locale }) {
  if (!estat) return 'Sense decisió';
  const r = estat.registre;
  return (
    <>
      <Insignia to={estat.to}>{estat.text}</Insignia>
      {` ${dataLocal(r.data, locale)}${r.actor ? ` · ${r.actor}` : ' · sense nom'}`}
      {estat.vigent === false ? ` · era ${TEXT_DECISIO[r.decisio].toLocaleLowerCase('ca')}` : ''}
      {estat.vigent === null ? ' · encara no s’ha comprovat si la fila és la mateixa' : ''}
    </>
  );
}

function PaginaCertificacio({ govern, vista, locale }) {
  const sessio = useSessioOpcional();
  const actor = actorDeLaSessio(sessio?.currentUser);
  const { arrel, descarrega } = useDescarrega();
  const [filtre, setFiltre] = useState('tots');
  const [obert, setObert] = useState(null);
  const [nota, setNota] = useState('');
  const [errorDecisio, setErrorDecisio] = useState(null);
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState(null);
  const { registres, persistent, error, afegix, exporta } = govern.certificacions;
  const pla = vista?.pla ?? null;
  const potDecidir = Boolean(vista && govern.empremtes);

  /* Revisió adversarial del carril F1 (problema 3) · El diàleg fixa en obrir-se
     la fila que el Mestre ha vist: la seua empremta i el seu estat. Si mentre
     decidix arriba una matriu nova (Refrescar, un altre fitxer) i la fila ja
     no és la mateixa, no es desa res i es diu: la decisió és sempre de la
     fila que s'ha vist. */
  const obri = (fila, decisio) => {
    setObert({ fila, decisio, pla, empremta: govern.empremtes?.get(fila.id) ?? null, estatVist: fila.estatVist });
    setNota('');
    setErrorDecisio(null);
  };
  const tanca = () => { if (!desant) setObert(null); };
  async function confirma() {
    if (!obert) return;
    setErrorDecisio(null);
    if (obert.decisio === 'retornat' && !nota.trim()) {
      setErrorDecisio('Escriu la nota: diu a les IAs què cal canviar.');
      return;
    }
    const empremta = govern.empremtes?.get(obert.fila.id) ?? null;
    if (!empremta || !obert.empremta) {
      setErrorDecisio('Encara no s’ha pogut calcular l’empremta d’esta fila: torna a provar-ho d’ací un moment.');
      return;
    }
    const filaAra = vista?.files.find((f) => f.id === obert.fila.id) ?? null;
    if (!filaAra || empremta !== obert.empremta || filaAra.estatVist !== obert.estatVist || pla !== obert.pla) {
      setErrorDecisio('La fila ha canviat mentre decidies: torna-la a mirar. No s’ha apuntat res.');
      return;
    }
    setDesant(true);
    try {
      await afegix(preparaCertificacio({ pla: obert.pla, id: obert.fila.id, decisio: obert.decisio, nota, actor, empremta: obert.empremta }));
      setAvis({ to: 'info', titol: 'Fet', text: `Apuntat: ${obert.fila.id}, ${TEXT_DECISIO[obert.decisio].toLocaleLowerCase('ca')}.` });
      setObert(null);
    } catch (e) {
      setErrorDecisio(e?.message ?? String(e));
    } finally {
      setDesant(false);
    }
  }
  async function exportaTot() {
    setAvis(null);
    try {
      const text = await exporta();
      if (!text) { setAvis({ to: 'info', titol: 'Res a exportar', text: 'Encara no hi ha cap decisió que exportar.' }); return; }
      descarrega(text, `certificacions_govern_${new Date().toISOString().slice(0, 10)}.jsonl`);
      setAvis({ to: 'info', titol: 'Fet', text: 'Certificacions exportades: una línia per decisió, en l’ordre en què es van prendre.' });
    } catch (e) {
      setAvis({ to: 'error', titol: 'No s’han pogut exportar', text: e?.message ?? String(e) });
    }
  }

  const apunts = ordenaCertificacions(registres ?? []).reverse().map((r) => {
    const d = new Date(r.data);
    const dos = (n) => String(n).padStart(2, '0');
    return {
      id: r.nonce,
      hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
      moment: r.data,
      titol: `${TEXT_DECISIO[r.decisio]} · ${r.id}`,
      detall: `${dataLocal(r.data, locale)} · ${r.actor ?? 'sense nom'}${r.nota ? ` · ${r.nota}` : ''}`
    };
  });
  const files = vista ? filtraFiles(vista.files, filtre) : [];
  const retornar = obert?.decisio === 'retornat';

  return (
    <div ref={arrel}>
      <Bloc titol="Com funciona">
        <Alerta to="info" titol="On es guarden les decisions" viva={false}>
          <p>{TEXT_CERTIFICACIO_LOCAL}</p>
          <p>
            Cada decisió porta la fila, el que has decidit, la nota, la data, el teu nom i l’empremta de la fila tal com
            era. Si la fila canvia després, la decisió es diu «certificació d’una versió anterior». Cap decisió porta
            signatura: qualsevol que tinga este navegador obert la pot apuntar.
          </p>
          <p>
            «Valida» confirma que la fila diu la veritat; «Certifica» diu que la tasca està bé per al Mestre;
            «Retorna amb nota» la torna a la tanda amb el que cal canviar. Els tres verbs ixen a totes les files.
            L’estat de la matriu no canvia per cap decisió: una certificació d’una fila que la matriu no dona per feta
            es diu així, al costat, i no es pinta de verd.
          </p>
          <p>{actor ? `Les decisions es desen amb el nom de la sessió: ${actor}.` : 'No hi ha cap sessió amb nom oberta: les decisions es desaran sense nom.'}</p>
          {vista && <p>{textDelPla(vista, locale)}</p>}
        </Alerta>
        {!persistent && (
          <Alerta to="avis" titol="Este navegador no deixa desar">
            Les decisions es perdran en tancar la pestanya: exporta-les abans.
          </Alerta>
        )}
        {error && <Alerta to="error" titol="No s’han pogut llegir les decisions">{error}</Alerta>}
        {vista && govern.errorEmpremtes && (
          <Alerta to="error" titol="No es pot apuntar cap decisió">
            Este navegador no pot calcular l’empremta de les files (cal obrir la Consola en https o en localhost).
          </Alerta>
        )}
        {avis && <Alerta to={avis.to} titol={avis.titol}>{avis.text}</Alerta>}
      </Bloc>
      {vista && (
        <Bloc titol="Les files de la matriu">
          <FiltreDeFiles files={vista.files} valor={filtre} onCanvi={setFiltre} />
          <Taula titol="Decisions sobre cada fila" densa>
            <thead>
              <tr>
                <th scope="col">Fila</th>
                <th scope="col">Requeriment</th>
                <th scope="col">Estat de la matriu</th>
                <th scope="col">Decisió del Mestre</th>
                <th scope="col"><span className="sdp-nomes-lector">Accions</span></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.id}</th>
                  <td>{f.requeriment ?? '—'}</td>
                  <td><EstatDeFila fila={f} /></td>
                  <td><DecisioDeFila locale={locale} estat={estatCertificacio(registres ?? [],
                    { pla, id: f.id, empremta: govern.empremtes?.get(f.id) ?? null, estatVist: f.estatVist })} /></td>
                  <td>
                    {/* Tres verbs a cada fila; «Certifica» és el primari només on la matriu ja la dona per feta. */}
                    {DECISIONS_GOVERN.map((d) => (
                      <Boto key={d} varietat={d === 'certificat' && f.estatVist === 'fet' ? 'primari' : 'secundari'} disabled={!potDecidir}
                        aria-label={`${VERB_DECISIO[d]} ${f.id}`} onClick={() => obri(f, d)}>
                        {VERB_DECISIO[d]}
                      </Boto>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Taula>
        </Bloc>
      )}
      <Bloc titol="Registre de decisions">
        <LiniaDelTemps etiqueta="Decisions del Mestre, la més nova primer" apunts={apunts}
          buit="Encara no hi ha cap decisió en este navegador." />
        <Boto varietat="secundari" icona={Download} onClick={exportaTot}>Exporta les certificacions (JSONL)</Boto>
      </Bloc>
      <DialegConfirmacio obert={obert !== null} onTanca={tanca} onConfirma={confirma} carregant={desant}
        titol={obert ? `${VERB_DECISIO[obert.decisio]} ${obert.fila.id}` : 'Decisió'}
        descripcio={obert?.fila.requeriment ?? undefined}
        etiquetaConfirma={obert ? VERB_DECISIO[obert.decisio] : 'Confirmar'}>
        {obert?.decisio === 'certificat' && obert.estatVist !== 'fet' && (
          <p>
            La matriu no dona esta fila per feta ({ETIQUETA_ESTAT[obert.estatVist]}): la certificació s’apuntarà al
            costat del seu estat, que no canvia, i no es pintarà de verd.
          </p>
        )}
        {obert && (
          <Camp etiqueta={retornar ? 'Nota per a les IAs' : 'Nota (opcional)'} obligatori={retornar}
            ajuda={retornar ? 'Què cal canviar perquè la tasca es puga donar per bona.' : undefined} error={errorDecisio}>
            <AreaText files={3} value={nota} onChange={(e) => setNota(e.target.value)} />
          </Camp>
        )}
      </DialegConfirmacio>
    </div>
  );
}

/* ── 4 · Comunicació amb les IAs ─────────────────────────────────────── */

function PaginaComunicacio({ resums }) {
  if (!resums) return null;
  return (
    <>
      <Bloc titol="Com va la tanda">
        {resums.general.map((frase) => <p key={frase}>{frase}</p>)}
      </Bloc>
      <Bloc titol="Per responsable">
        <p>
          Una fila amb més d’un responsable compta per a cada un: el que diu cada fila, tal qual, és a la pàgina
          de l’estat dels requeriments.
        </p>
        <ul>{resums.perResponsable.map((g) => <li key={g.nom}>{g.frase}</li>)}</ul>
      </Bloc>
      <Bloc titol="Per prioritat">
        <ul>{resums.perPrioritat.map((g) => <li key={g.nom}>{g.frase}</li>)}</ul>
      </Bloc>
      <Bloc titol="Les P1 que queden obertes">
        {resums.p1Oberts.length === 0 ? <p>No en queda cap de P1 oberta.</p> : (
          <ul>{resums.p1Oberts.map((p) => <li key={p.id}>{p.frase}</li>)}</ul>
        )}
      </Bloc>
    </>
  );
}

/* ── Peu i pàgina ─────────────────────────────────────────────────────── */

/** El text literal dels botons del peu (encàrrec F1_govern: «Obri una matriu (mcr.json)»). */
export const TEXT_OBRI_MATRIU = 'Obri una matriu (mcr.json)';
export const TEXT_OBRI_TRASLLAT = 'Obri un trasllat (trasllat.json)';
export const TEXT_TANCA_FITXERS = 'Tanca els fitxers oberts';

/* El botó del peu que diu exactament `text`, si n'hi ha cap que es puga prémer. */
const botoDelPeu = (arrel, text) => [...(arrel?.querySelectorAll('button') ?? [])]
  .find((b) => b.textContent === text && !b.disabled) ?? null;

/**
 * Revisió adversarial del carril F1 (selectors del peu) · Un selector que
 * s'amaga (el fitxer s'ha obert), que torna (s'han tancat els fitxers) o que
 * torna a començar (el fitxer no s'ha pogut obrir) s'emporta el focus si el
 * tenia, i el focus cau al cos del document. Si ha caigut, va al control que
 * ocupa el seu lloc: el botó de tancar en obrir un fitxer, i el selector en
 * tancar-los o quan un fitxer és rebutjat. Si el focus és en un altre lloc, no
 * es toca. En muntar-se el peu (tornar del tauler) no es mou res.
 */
function useFocusDelPeu(arrel, { matriuDeFitxer, trasllatDeFitxer, rebutjosMatriu, rebutjosTrasllat }) {
  const abans = useRef({ matriuDeFitxer, trasllatDeFitxer, rebutjosMatriu, rebutjosTrasllat });
  useLayoutEffect(() => {
    const vell = abans.current;
    abans.current = { matriuDeFitxer, trasllatDeFitxer, rebutjosMatriu, rebutjosTrasllat };
    let desti;
    if (rebutjosMatriu !== vell.rebutjosMatriu) desti = TEXT_OBRI_MATRIU;
    else if (rebutjosTrasllat !== vell.rebutjosTrasllat) desti = TEXT_OBRI_TRASLLAT;
    else if ((matriuDeFitxer && !vell.matriuDeFitxer) || (trasllatDeFitxer && !vell.trasllatDeFitxer)) desti = TEXT_TANCA_FITXERS;
    else if (!matriuDeFitxer && vell.matriuDeFitxer) desti = TEXT_OBRI_MATRIU;
    else if (!trasllatDeFitxer && vell.trasllatDeFitxer) desti = TEXT_OBRI_TRASLLAT;
    else return;
    const doc = arrel.current?.ownerDocument;
    const actiu = doc?.activeElement;
    if (!doc || (actiu && actiu !== doc.body && actiu.isConnected)) return;
    (botoDelPeu(arrel.current, desti) ?? botoDelPeu(arrel.current, TEXT_OBRI_MATRIU))?.focus();
  }, [arrel, matriuDeFitxer, trasllatDeFitxer, rebutjosMatriu, rebutjosTrasllat]);
}

/**
 * El peu de dades de les pàgines del govern (ordre del Mestre, 260926: les
 * dades de la pàgina viuen al peu): d'on ve la matriu, obrir-ne una d'un
 * fitxer (i un trasllat, al Balanç), tornar a la del servidor, Refrescar i
 * Privacitat. El fitxer es llig en este navegador: no es puja enlloc.
 */
export function PeuGovern({ govern, privat, onPrivat, locale, cimRef, ambTrasllat = false }) {
  const { matriu } = govern;
  const matriuDeFitxer = govern.origen === 'fitxer';
  const trasllatDeFitxer = govern.origenTrasllat === 'fitxer';
  const arrel = useRef(null);
  const posaArrel = useCallback((el) => {
    arrel.current = el;
    if (typeof cimRef === 'function') cimRef(el);
    else if (cimRef) cimRef.current = el;
  }, [cimRef]);
  useFocusDelPeu(arrel, {
    matriuDeFitxer, trasllatDeFitxer, rebutjosMatriu: govern.rebutjos?.matriu ?? 0, rebutjosTrasllat: govern.rebutjos?.trasllat ?? 0
  });
  const quan = matriu?.at ? `feta el ${dataLocal(matriu.at, locale)}` : 'sense data';
  const trasllatAlPeu = ambTrasllat && trasllatDeFitxer;
  const instantania = (
    <>
      {!matriu ? 'Encara no hi ha cap matriu connectada.'
        : matriuDeFitxer
          ? <>Matriu oberta d’un fitxer d’este ordinador (<Privat>{govern.nomFitxer ?? 'sense nom'}</Privat>), {quan}.</>
          : `Matriu del servidor de desenvolupament, ${quan}.`}
      {trasllatAlPeu ? <> Trasllat obert d’un fitxer d’este ordinador (<Privat>{govern.nomTrasllat ?? 'sense nom'}</Privat>).</> : null}
      {matriuDeFitxer && trasllatAlPeu ? ' Per a obrir una altra matriu o un altre trasllat, tanca primer els fitxers oberts.'
        : matriuDeFitxer ? ' Per a obrir-ne una altra, tanca primer els fitxers oberts.'
          : trasllatAlPeu ? ' Per a obrir-ne un altre, tanca primer els fitxers oberts.' : null}
    </>
  );
  const tria = (obri) => (e) => {
    const f = e.target.files?.[0];
    if (f) obri(f);
  };
  /* Revisió adversarial del carril F1 (problema 4) · El nom del fitxer obert és
     una dada privada (va dins de <Privat> a la instantània): la línia d'estat
     dels selectors només diu quants n'hi ha (nomsVisibles, opt-in de Pedra
     Seca).
     Revisió adversarial del carril F1 (selectors del peu) · La línia d'estat
     del selector és de Pedra Seca i no se li pot dir des de fora que hi ha un
     fitxer obert: en tornar del tauler (el peu es torna a muntar) diria «Cap
     fitxer triat» al costat d'una matriu oberta. Per això el selector d'una
     classe només es pinta mentre no n'hi ha cap fitxer obert: d'on ve el que
     hi ha ho diu la instantània, i el botó de tancar el torna. I un fitxer
     rebutjat el fa tornar a començar (key amb `rebutjos`). Així la línia no
     contradiu mai l'estat: diu «Cap fitxer triat» en repòs i «1 fitxer» només
     mentre es llig. Derogat: els selectors sempre visibles amb la key de
     `tancades`. */
  return (
    <div className="sdp-consola__peu" ref={posaArrel}>
      <p className="sdp-consola__instantania" role="status">{instantania}</p>
      {!matriuDeFitxer && (
        <Camp etiqueta="La matriu de requeriments" ajuda="Es llig en este navegador: no es puja enlloc.">
          <CampFitxer key={`matriu:${govern.rebutjos?.matriu ?? 0}`} accept=".json,application/json" textBoto={TEXT_OBRI_MATRIU}
            nomsVisibles={false} disabled={govern.llegintFitxer} onChange={tria(govern.obriMatriu)} />
        </Camp>
      )}
      {ambTrasllat && !trasllatDeFitxer && (
        <Camp etiqueta="El trasllat a la tanda següent" ajuda="Es llig en este navegador: no es puja enlloc.">
          <CampFitxer key={`trasllat:${govern.rebutjos?.trasllat ?? 0}`} accept=".json,application/json" textBoto={TEXT_OBRI_TRASLLAT}
            nomsVisibles={false} disabled={govern.llegintFitxer} onChange={tria(govern.obriTrasllat)} />
        </Camp>
      )}
      {(matriuDeFitxer || trasllatDeFitxer) && (
        <Boto varietat="fantasma" icona={X} onClick={govern.tancaFitxers}>{TEXT_TANCA_FITXERS}</Boto>
      )}
      <Boto varietat="secundari" icona={RefreshCw} carregant={govern.servidor.estat === 'loading'}
        onClick={govern.servidor.carrega}>Refrescar</Boto>
      <Interruptor etiqueta="Privacitat: amaga rutes, ordres i empremtes" actiu={privat} onCanvi={onPrivat} />
    </div>
  );
}

/* El contingut de cada pàgina, amb el que ja s'ha derivat de la matriu. */
function ContingutGovern({ id, govern, derivat, locale }) {
  switch (id) {
    case 'requeriments': return <PaginaRequeriments govern={govern} vista={derivat.vista} locale={locale} />;
    case 'balanc': return <PaginaBalanc govern={govern} {...derivat} />;
    case 'certificacio': return <PaginaCertificacio govern={govern} vista={derivat.vista} locale={locale} />;
    case 'comunicacio': return <PaginaComunicacio resums={derivat.resums} />;
    default: return null;
  }
}

/**
 * Una pàgina del govern (/consola/govern/<id>), dins de la mateixa
 * UniversalPage chrome="system" que les pàgines de la maquinària: la molla
 * de pa al cim, el contingut i el peu de dades. Un id que no existix no peta:
 * la pàgina ho diu i torna a la Consola.
 */
export function PaginaDeGovern({ id, govern, privat, onPrivat, locale = 'ca-ES', cimRef, ara = Date.now() }) {
  const copy = copyConsola();
  const pagina = paginaGovern(id);
  const derivat = derivaGovern(govern, ara);
  const titol = pagina?.title ?? 'Pàgina no trobada';
  return (
    <UniversalPage title={titol} subtitle={pagina?.subtitle ?? TITOL_GOVERN}
      lead={pagina?.lead ?? 'Esta adreça no correspon a cap pàgina del govern del Mestre.'} chrome="system" nivellMaxIndex={6}>
      <PrivacitatConsola.Provider value={privat}>
        <MollaPa className="sdp-molla--panell" passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: titol }]} />
        {pagina ? (
          <>
            <AvisosDeMatriu govern={govern} vista={derivat.vista} />
            <ContingutGovern id={pagina.id} govern={govern} derivat={derivat} locale={locale} />
          </>
        ) : (
          <EstatBuit icona={SearchX} titol="Cap pàgina del govern amb este nom">
            Les quatre pàgines del govern són al tauler de la Consola, damunt de la sala de màquines.
          </EstatBuit>
        )}
        <PeuGovern govern={govern} privat={privat} onPrivat={onPrivat} locale={locale} cimRef={cimRef}
          ambTrasllat={pagina?.id === 'balanc'} />
      </PrivacitatConsola.Provider>
    </UniversalPage>
  );
}

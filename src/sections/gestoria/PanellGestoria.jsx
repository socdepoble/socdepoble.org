/**
 * PanellGestoria.jsx — el full trimestral per a la gestoria, pas a pas.
 *
 * Contingut sense pàgina ni h1: l'embolcall (la Wiki, només en
 * desenvolupament) hi posa el títol. Cinc passos numerats:
 *   1. Aprovació: l'estat dels dos tractors. Sense el de factures aprovat no
 *      es pot continuar (botó cap al panell de Tractors).
 *   2. Carpeta i trimestre: el selector del sistema o, si el navegador no en
 *      té, un <input type="file" webkitdirectory>. L'anàlisi no ix de
 *      l'ordinador: l'únic pas que en trau res és el correu del pas 5.
 *   3. Revisió: incidències per severitat, documents, ingressos i despeses
 *      editables (una factura en una altra moneda té el control «Els imports
 *      ja són en euros»), i el creuament opcional amb el correu.
 *   4. Proposta: la vista prèvia del full, «He revisat la proposta» (i
 *      «Genera-la igualment» si hi ha incidències altes), i els fitxers.
 *   5. Envia a la gestoria: EnviamentGestoria (títol h3, dins del pas), només
 *      amb el full generat.
 * «Desenxufa» és sempre visible i demana confirmació: res es guarda.
 *
 * Props: { obteAprovacio, estatTractors: { 'gestoria.factures': { estat,
 * curta }, 'gestoria.correus': { estat, curta } }, onObreTractors, subtle,
 * inflate, entorn, avui, descarrega? } (descarrega: per a les proves; per
 * defecte, Blob i enllaç temporal com a DetallPrivacitat.jsx).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Carregant, Progres } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../components/PedraSeca/organismes/Dialeg.jsx';
import { Taula } from '../../components/PedraSeca/organismes/Taula.jsx';
import { Camp, CampText, Casella, GrupCamps, Selector } from '../../components/PedraSeca/organismes/formulari.jsx';
import EnviamentGestoria from './enviament/EnviamentGestoria.jsx';
import { formatData } from './nucli/dates.js';
import { formatImport } from './nucli/diners.js';
import { maquetaFull } from './nucli/fullModel.js';
import { MONEDA_DEL_FULL, totals } from './nucli/model.js';
import { PLANTILLA_GESTORIA } from './nucli/plantilla.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from './tractors.js';
import { FORMATS_ENTREGABLE, dataDeAvui, trimestreAnterior, useGestoria } from './useGestoria.js';
import VistaPreviaFull from './VistaPreviaFull.jsx';

/* L'estat d'un tractor mai no es diu només amb el color: la insígnia porta el text. */
const INSIGNIA_TRACTOR = Object.freeze({
  aprovat: { to: 'exit', text: 'Aprovat' },
  pendent: { to: 'avis', text: 'Pendent' },
  caducat: { to: 'avis', text: 'Caducat' },
  revocat: { to: 'error', text: 'Revocat' },
  'empremta-divergent': { to: 'avis', text: 'Versió canviada' },
  incomplet: { to: 'neutre', text: 'Incomplet' },
  error: { to: 'error', text: 'Sense empremta' },
  desconegut: { to: 'neutre', text: 'Sense dades' }
});

const ETIQUETES_FASE = Object.freeze({
  llistant: 'Llistant la carpeta',
  historial: 'Llegint els fulls dels trimestres anteriors',
  llegint: 'Llegint les factures',
  extraient: 'Traient els camps de cada factura',
  auditant: 'Revisant el trimestre'
});

const ETIQUETES_CODI = Object.freeze({
  CAMP_BUIT: 'Camp buit',
  MONEDA_ESTRANGERA: 'Moneda estrangera',
  IVA_INCOHERENT: 'L’IVA no quadra',
  TIPUS_IVA_INUSUAL: 'Tipus d’IVA inusual',
  NIF_INVALID: 'NIF no vàlid',
  FORA_TRIMESTRE: 'Fora del trimestre',
  RETENCIO_IRPF: 'Retenció d’IRPF',
  NIF_PROPI: 'NIF propi',
  DUPLICAT: 'Duplicat',
  FALTA_MENSUAL: 'Falta una factura mensual',
  FALTA_HABITUAL: 'Proveïdor habitual absent',
  REBUT_SENSE_FACTURA: 'Rebut sense factura',
  CORREU_NO_REVISAT: 'Correu no revisat',
  CORREU_PARCIAL: 'Correu parcial',
  CORREU_SENSE_DOCUMENT: 'Correu sense factura',
  PDF_SENSE_DESCOMPRESSOR: 'PDF sense llegir',
  SENTIT_DESCONEGUT: 'Emesa o rebuda?'
});
/* Les que sempre ha de decidir la persona: es marquen encara que siguen informatives. */
const DESTACADES = new Set([
  'MONEDA_ESTRANGERA', 'FORA_TRIMESTRE', 'FALTA_MENSUAL', 'RETENCIO_IRPF', 'CORREU_NO_REVISAT', 'CORREU_PARCIAL', 'CORREU_SENSE_DOCUMENT'
]);
const GRUPS_SEVERITAT = Object.freeze([
  { severitat: 'alta', titol: 'Severitat alta', to: 'error' },
  { severitat: 'mitjana', titol: 'Severitat mitjana', to: 'avis' },
  { severitat: 'baixa', titol: 'Severitat baixa', to: 'neutre' },
  { severitat: 'info', titol: 'Informatives', to: 'info' }
]);

const TIPUS_DOCUMENT = Object.freeze({
  'model-trimestral': 'Full de la gestoria',
  factura: 'Factura',
  rebut: 'Rebut de pagament',
  'csv-factura': 'CSV de factura',
  extracte: 'Extracte',
  'full-calcul': 'Full de càlcul',
  imatge: 'Imatge',
  desconegut: 'Altres'
});
const ESTAT_DOCUMENT = Object.freeze({
  extreta: { to: 'exit', text: 'Llegida' },
  parcial: { to: 'avis', text: 'Llegida en part' },
  manual: { to: 'avis', text: 'Cal fer-la a mà' },
  ignorada: { to: 'neutre', text: 'No compta' }
});

const COLUMNES = Object.freeze([
  { camp: 'data', titol: 'Data', tipus: 'data', mida: 'curta' },
  { camp: 'num', titol: 'Núm', tipus: 'text', mida: 'normal' },
  { camp: 'contrapart', titol: { ingres: 'Client', despesa: 'Proveïdor' }, tipus: 'text', mida: 'ampla' },
  { camp: 'nif', titol: 'NIF - CIF', tipus: 'text', mida: 'normal' },
  { camp: 'descripcio', titol: 'Descripció', tipus: 'text', mida: 'ampla' },
  { camp: 'subtotal', titol: 'Subtotal', tipus: 'import', mida: 'curta' },
  { camp: 'iva', titol: 'IVA', tipus: 'import', mida: 'curta' },
  { camp: 'total', titol: 'Total', tipus: 'import', mida: 'curta' }
]);
const COLUMNA_RETENCIO = Object.freeze({ camp: 'retencio', titol: 'Retenció IRPF', tipus: 'import', mida: 'curta' });
const ETIQUETES_CAMP = Object.freeze({
  data: 'data', num: 'número', contrapart: 'contrapart', nif: 'NIF', descripcio: 'descripció',
  subtotal: 'subtotal', iva: 'IVA', total: 'total', retencio: 'retenció'
});

/* Descàrrega amb Blob i un enllaç temporal, com a DetallPrivacitat.jsx: res passa per cap servidor. */
function descarregaPerDefecte({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * La forma de `estatTractors` a partir de les files de useTractors().tractors.
 * @param {Array<{ id: string, estat: string, curta?: string|null }>} tractors
 * @returns {Record<string, { estat: string, curta: string|null }>}
 */
export function estatTractorsDe(tractors) {
  const estat = {};
  for (const t of Array.isArray(tractors) ? tractors : []) {
    if (typeof t?.id === 'string') estat[t.id] = { estat: t.estat, curta: t.curta ?? null };
  }
  return estat;
}

const titolColumna = (columna, tipus) => (typeof columna.titol === 'string' ? columna.titol : columna.titol[tipus]);
/* Una factura amb els imports en una moneda que no és la del full; 'XXX' és una que no se sap. */
const enAltraMoneda = (f) => typeof f.moneda === 'string' && f.moneda !== MONEDA_DEL_FULL;
const nomMoneda = (codi) => (codi === 'XXX' ? 'una moneda que no és l’euro' : codi);
const nomDeRuta = (ruta) => String(ruta ?? '').split('/').pop();
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);

function valorDe(factura, columna) {
  const valor = factura[columna.camp];
  if (columna.tipus === 'data') return formatData(valor);
  if (columna.tipus === 'import') return formatImport(valor);
  return valor == null ? '' : String(valor);
}

/**
 * Una cel·la editable. El canvi es confirma en eixir del camp o amb Intro.
 * Si el que s'ha escrit no s'entén com a data o import, el camp queda buit
 * al full i ací es manté el text amb l'error al costat.
 */
function CelEditable({ etiqueta, valor, tipus, mida, dubte, onCanvi }) {
  const id = useId();
  const [text, setText] = useState(valor);
  const [vist, setVist] = useState(valor);
  const [escrit, setEscrit] = useState('');
  if (valor !== vist) {
    setVist(valor);
    setText(valor === '' && tipus !== 'text' && escrit.trim() !== '' ? escrit : valor);
  }
  const illegible = tipus !== 'text' && valor === '' && text.trim() !== '';
  const confirma = () => {
    if (text === valor) return;
    setEscrit(text);
    onCanvi(text);
  };
  let descrit;
  if (illegible) descrit = `${id}-error`;
  else if (dubte) descrit = `${id}-dubte`;
  return (
    <>
      <input
        type="text"
        className="sdp-gestoria-panell__control"
        aria-label={etiqueta}
        value={text}
        data-mida={mida}
        data-tipus={tipus}
        data-dubte={dubte ? 'true' : undefined}
        inputMode={tipus === 'import' ? 'decimal' : undefined}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={illegible ? 'true' : undefined}
        aria-describedby={descrit}
        onChange={(event) => setText(event.target.value)}
        onBlur={confirma}
        onKeyDown={(event) => {
          if (event.key === 'Enter') confirma();
        }}
      />
      {illegible ? (
        <span id={`${id}-error`} className="sdp-gestoria-panell__cel-error">
          {tipus === 'data' ? 'No s’entén la data: escriu-la com 31/07/2026.' : 'No s’entén l’import: escriu-lo com 1.234,56.'}
        </span>
      ) : null}
      {dubte && !illegible ? <span id={`${id}-dubte`} className="sdp-nomes-lector">Llegit amb confiança baixa: revisa-ho.</span> : null}
    </>
  );
}

function TaulaFactures({ tipus, factures, incidencies, onEdita, onExclou, onAfegix }) {
  const idTitol = useId();
  const ingres = tipus === 'ingres';
  const ambRetencio = factures.some((f) => Object.prototype.hasOwnProperty.call(f, 'retencio'));
  const columnes = ambRetencio ? [...COLUMNES, COLUMNA_RETENCIO] : COLUMNES;
  const sumes = totals(factures);
  const titol = ingres ? 'Ingressos' : 'Despeses';
  const altre = ingres ? 'despeses' : 'ingressos';
  return (
    <section className="sdp-gestoria-panell__bloc" aria-labelledby={idTitol}>
      <h3 id={idTitol} className="sdp-gestoria-panell__subtitol">{`${titol} (${factures.length})`}</h3>
      <Taula titol={`${titol} de la proposta`} densa className="sdp-gestoria-panell__taula">
        <thead>
          <tr>
            {columnes.map((c) => <th key={c.camp} scope="col">{titolColumna(c, tipus)}</th>)}
            <th scope="col">Estat</th>
            <th scope="col">Accions</th>
          </tr>
        </thead>
        <tbody>
          {factures.length === 0 ? (
            <tr><td colSpan={columnes.length + 2}>{ingres ? 'Cap ingrés.' : 'Cap despesa.'}</td></tr>
          ) : factures.map((f, i) => {
            const nomFila = `${ingres ? 'l’ingrés' : 'la despesa'} ${i + 1}${f.num ? ` («${f.num}»)` : ''}`;
            const baixes = Object.entries(f.confianca ?? {}).filter(([, nivell]) => nivell === 'baixa').map(([camp]) => ETIQUETES_CAMP[camp] ?? camp);
            const propies = incidencies.filter((inc) => inc.facturaId === f.id);
            return (
              <tr key={f.id} data-factura={f.id}>
                {columnes.map((c) => (
                  <td key={c.camp} className="sdp-gestoria-panell__cel" data-tipus={c.tipus}>
                    <CelEditable
                      etiqueta={`${titolColumna(c, tipus)}, ${ingres ? 'ingrés' : 'despesa'} ${i + 1}`}
                      valor={valorDe(f, c)}
                      tipus={c.tipus}
                      mida={c.mida}
                      dubte={f.confianca?.[c.camp] === 'baixa'}
                      onCanvi={(valor) => onEdita(f.id, c.camp, valor)}
                    />
                  </td>
                ))}
                <td className="sdp-gestoria-panell__cel">
                  <Insignia to={f.estat === 'completa' ? 'exit' : 'avis'}>{f.estat === 'completa' ? 'Completa' : 'Pendent'}</Insignia>
                  {enAltraMoneda(f) ? <p className="sdp-gestoria-panell__nota">{`Imports en ${nomMoneda(f.moneda)}.`}</p> : null}
                  {baixes.length > 0 ? <p className="sdp-gestoria-panell__nota">{`Confiança baixa: ${baixes.join(', ')}.`}</p> : null}
                  {propies.length > 0 ? (
                    <p className="sdp-gestoria-panell__nota">
                      {`Revisa: ${[...new Set(propies.map((inc) => ETIQUETES_CODI[inc.codi] ?? inc.codi))].join(', ')}.`}
                    </p>
                  ) : null}
                </td>
                <td className="sdp-gestoria-panell__cel">
                  <div className="sdp-gestoria-panell__accions-fila">
                    {enAltraMoneda(f) ? (
                      <Boto varietat="secundari" onClick={() => onEdita(f.id, 'moneda', MONEDA_DEL_FULL)}
                        aria-label={`Els imports ja són en euros, ${nomFila}`}>
                        Els imports ja són en euros
                      </Boto>
                    ) : null}
                    <Boto varietat="fantasma" onClick={() => onEdita(f.id, 'tipus', ingres ? 'despesa' : 'ingres')}
                      aria-label={`Mou a ${altre} ${nomFila}`}>
                      {`Mou a ${altre}`}
                    </Boto>
                    <Boto varietat="secundari" onClick={() => onExclou(f.id)} aria-label={`Exclou ${nomFila}`}>Exclou</Boto>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={5}>Totals</th>
            <td className="sdp-gestoria-panell__cel" data-tipus="import">{formatImport(sumes.subtotal)}</td>
            <td className="sdp-gestoria-panell__cel" data-tipus="import">{formatImport(sumes.iva)}</td>
            <td className="sdp-gestoria-panell__cel" data-tipus="import">{formatImport(sumes.total)}</td>
            <td colSpan={ambRetencio ? 3 : 2}>{sumes.incomplet ? 'Falten imports: la suma no és completa.' : ''}</td>
          </tr>
        </tfoot>
      </Taula>
      <div className="sdp-gestoria-panell__accions">
        <Boto varietat="secundari" onClick={onAfegix}>{ingres ? 'Afig un ingrés' : 'Afig una despesa'}</Boto>
      </div>
    </section>
  );
}

function Incidencies({ incidencies }) {
  const idTitol = useId();
  return (
    <section className="sdp-gestoria-panell__bloc" aria-labelledby={idTitol}>
      <h3 id={idTitol} className="sdp-gestoria-panell__subtitol">{`Incidències (${incidencies.length})`}</h3>
      <p className="sdp-gestoria-panell__nota">Són indicis per a revisar, no veredictes fiscals: la paraula final és teua i de la teua gestoria.</p>
      {incidencies.length === 0 ? <p>Cap incidència detectada a la carpeta.</p> : GRUPS_SEVERITAT.map((grup) => {
        const del = incidencies.filter((i) => i.severitat === grup.severitat);
        if (del.length === 0) return null;
        return (
          <div key={grup.severitat} className="sdp-gestoria-panell__grup">
            <h4 className="sdp-gestoria-panell__grup-titol">{`${grup.titol} (${del.length})`}</h4>
            <ul className="sdp-gestoria-panell__incidencies">
              {del.map((inc, i) => (
                <li key={`${inc.codi}-${inc.facturaId ?? ''}-${inc.fitxer ?? ''}-${inc.mes ?? ''}-${inc.camp ?? ''}-${i}`}
                  className="sdp-gestoria-panell__incidencia" data-destacada={DESTACADES.has(inc.codi) ? 'true' : undefined}>
                  <Insignia to={grup.to}>{ETIQUETES_CODI[inc.codi] ?? inc.codi}</Insignia>
                  <span>{inc.missatge}</span>
                  {inc.fitxer ? <code className="sdp-gestoria-panell__fitxer">{nomDeRuta(inc.fitxer)}</code> : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function Cobertura({ cobertura }) {
  let correu = 'No revisat';
  if (cobertura.correu === 'revisat' || cobertura.correu === 'parcial') {
    const periode = cobertura.periodeCorreu
      ? `, del ${formatData(cobertura.periodeCorreu.inici)} al ${formatData(cobertura.periodeCorreu.fi)}` : '';
    correu = `${cobertura.correu === 'parcial' ? 'Revisat en part' : 'Revisat'}: ${plural(cobertura.correusRevisats ?? 0, 'un missatge', 'missatges')}${periode}`;
  }
  return (
    <dl className="sdp-gestoria-panell__dades">
      <div>
        <dt>Carpeta</dt>
        <dd>
          {cobertura.carpeta === 'parcial' ? 'Revisada en part' : 'Revisada'}
          {cobertura.carpetaTrimestre ? <> · <code>{cobertura.carpetaTrimestre}</code></> : null}
        </dd>
      </div>
      <div>
        <dt>Historial</dt>
        <dd>{cobertura.historial?.length ? cobertura.historial.join(', ') : 'Cap full dels trimestres anteriors'}</dd>
      </div>
      <div>
        <dt>Correu</dt>
        <dd>{correu}</dd>
      </div>
    </dl>
  );
}

function TaulaDocuments({ documents }) {
  return (
    <details className="sdp-gestoria-panell__documents">
      <summary>{`Documents de la carpeta (${documents.length})`}</summary>
      <Taula titol="Documents de la carpeta" densa className="sdp-gestoria-panell__taula">
        <thead>
          <tr>
            <th scope="col">Document</th>
            <th scope="col">Tipus</th>
            <th scope="col">Estat</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => {
            const estat = ESTAT_DOCUMENT[d.estat] ?? ESTAT_DOCUMENT.ignorada;
            return (
              <tr key={`${d.ambit}-${d.ruta}`}>
                <th scope="row" className="sdp-gestoria-panell__ruta"><code>{d.ruta}</code></th>
                <td>{`${TIPUS_DOCUMENT[d.tipus] ?? d.tipus}${d.ambit === 'historial' ? ' (historial)' : ''}`}</td>
                <td><Insignia to={estat.to}>{estat.text}</Insignia></td>
                <td>{(d.avisos ?? []).map((a) => a.missatge).join(' ')}</td>
              </tr>
            );
          })}
        </tbody>
      </Taula>
    </details>
  );
}

/* Un pas numerat: secció amb títol h2 i la seua insígnia d'estat. */
function Pas({ numero, titol, estat, refTitol, children }) {
  const idTitol = useId();
  const insignia = { fet: { to: 'exit', text: 'Fet' }, actiu: { to: 'info', text: 'Ara' }, bloquejat: { to: 'neutre', text: 'Encara no' } }[estat];
  return (
    <li className="sdp-gestoria-panell__pas" data-estat={estat}>
      <section aria-labelledby={idTitol}>
        <div className="sdp-gestoria-panell__cap">
          <h2 id={idTitol} ref={refTitol} tabIndex={-1} className="sdp-gestoria-panell__titol">{`${numero}. ${titol}`}</h2>
          <Insignia to={insignia.to}>{insignia.text}</Insignia>
        </div>
        <div className="sdp-gestoria-panell__cos">{children}</div>
      </section>
    </li>
  );
}

/* L'error es mostra al pas on s'ha produït (`accions`); si eixe pas no es veu, dalt de tot. */
function ErrorDe({ error, accions, visibles, onTanca, onObreTractors }) {
  if (!error) return null;
  if (accions ? !accions.includes(error.accio) : visibles.includes(error.accio)) return null;
  return (
    <Alerta to={error.to === 'info' ? 'info' : 'error'} titol={error.titol} onTanca={onTanca}
      accions={error.aprovacio && onObreTractors ? <Boto varietat="secundari" onClick={onObreTractors}>Obri el panell de Tractors</Boto> : null}>
      {error.detall || null}
    </Alerta>
  );
}

export default function PanellGestoria({
  obteAprovacio, estatTractors, onObreTractors, subtle, inflate, entorn, avui, descarrega = descarregaPerDefecte
}) {
  const g = useGestoria({ obteAprovacio, subtle, inflate, entorn, avui });
  const [hui] = useState(() => dataDeAvui(typeof avui === 'function' ? avui() : new Date()) ?? dataDeAvui(new Date()));
  const [periode, setPeriode] = useState(() => trimestreAnterior(hui));
  const anys = [hui.a - 3, hui.a - 2, hui.a - 1, hui.a];
  const [revisada, setRevisada] = useState(null);
  const [acceptada, setAcceptada] = useState(null);
  const [desenxufant, setDesenxufant] = useState(false);
  const [aEnfocar, setAEnfocar] = useState(null);
  const arrel = useRef(null);
  const refRevisio = useRef(null);
  const refFitxers = useRef(null);
  const idCorreu = useId();
  const idFitxers = useId();
  const idAjudaGenera = useId();

  useEffect(() => {
    if (!aEnfocar) return;
    if (aEnfocar.on === 'revisio') refRevisio.current?.focus();
    else if (aEnfocar.on === 'fitxers') refFitxers.current?.focus();
    else if (aEnfocar.on === 'fila') arrel.current?.querySelector(`[data-factura="${aEnfocar.id}"] input`)?.focus();
  }, [aEnfocar]);

  const factures = estatTractors?.[TRACTOR_FACTURES.id];
  const correus = estatTractors?.[TRACTOR_CORREUS.id];
  const facturesAprovat = factures?.estat === 'aprovat';
  const correusAprovat = correus?.estat === 'aprovat';
  const { proposta, versio, incidencies, entregables } = g;
  const altes = incidencies.filter((i) => i.severitat === 'alta');
  const estaRevisada = revisada === versio && Boolean(proposta);
  const estaAcceptada = acceptada === versio;
  const potGenerar = estaRevisada && (altes.length === 0 || estaAcceptada) && !g.ocupat;

  const vista = useMemo(() => {
    if (!proposta) return { full: null, error: null };
    try {
      return { full: maquetaFull(PLANTILLA_GESTORIA, proposta), error: null };
    } catch (error) {
      return { full: null, error: error?.message ?? String(error) };
    }
  }, [proposta]);

  const adjunts = useMemo(() => (entregables ? [entregables.xlsx] : []), [entregables]);

  async function analitzaTrimestre() {
    if (await g.analitza(periode)) setAEnfocar({ on: 'revisio' });
  }

  async function generaFull() {
    const aprovada = await g.aprovaProposta({ acceptaIncidencies: estaAcceptada });
    if (aprovada && await g.genera()) setAEnfocar({ on: 'fitxers' });
  }

  function afegix(tipus) {
    const id = g.afegixFactura(tipus);
    if (id) setAEnfocar({ on: 'fila', id });
  }

  function descarregaFitxer(format) {
    const fitxer = entregables?.[format];
    if (!fitxer) return;
    try {
      descarrega({ nom: fitxer.nom, tipus: fitxer.tipus, dades: fitxer.dades });
      g.anuncia(`S’ha descarregat «${fitxer.nom}».`);
    } catch {
      g.anuncia(`No s’ha pogut descarregar «${fitxer.nom}»: este navegador no deixa descarregar fitxers generats.`);
    }
  }

  function desenxufa() {
    g.desenxufa();
    setRevisada(null);
    setAcceptada(null);
    setDesenxufant(false);
  }

  const estatPas = (fet, actiu) => {
    if (fet) return 'fet';
    return actiu ? 'actiu' : 'bloquejat';
  };
  const ocupat = Boolean(g.ocupat);
  const progres = g.progres;
  /* Els passos que es veuen ara: cadascun mostra els seus errors. */
  const visibles = [
    facturesAprovat && 'carpeta', proposta && g.analisi && 'correu', proposta && 'proposta', proposta && 'fitxers'
  ].filter(Boolean);
  const errors = { error: g.error, visibles, onTanca: g.tancaError, onObreTractors };

  return (
    <div ref={arrel} className="sdp-gestoria-panell">
      <div className="sdp-gestoria-panell__barra">
        <p>
          Prepara el full trimestral per a la gestoria a partir de la teua carpeta de factures. L’anàlisi es fa
          en este ordinador: les factures no es pugen enlloc ni es guarden al navegador. Només el correu del pas 5,
          si el prepares tu, ix cap a la gestoria.
        </p>
        <Boto varietat="perill" onClick={() => setDesenxufant(true)}>Desenxufa</Boto>
      </div>
      <p role="status" className="sdp-gestoria-panell__avis">{g.avis}</p>
      <ErrorDe {...errors} />

      <ol className="sdp-gestoria-panell__passos">
        <Pas numero={1} titol="Aprovació dels tractors" estat={estatPas(facturesAprovat, true)}>
          <ul className="sdp-gestoria-panell__tractors">
            {[[TRACTOR_FACTURES, factures], [TRACTOR_CORREUS, correus]].map(([manifest, estat]) => {
              const insignia = INSIGNIA_TRACTOR[estat?.estat] ?? INSIGNIA_TRACTOR.desconegut;
              return (
                <li key={manifest.id} className="sdp-gestoria-panell__tractor">
                  <span className="sdp-gestoria-panell__tractor-nom">{manifest.nom}</span>
                  <Insignia to={insignia.to}>{insignia.text}</Insignia>
                  {estat?.curta ? <code>{estat.curta}</code> : null}
                </li>
              );
            })}
          </ul>
          {facturesAprovat ? (
            <p>El tractor de factures està aprovat: pots triar la carpeta.</p>
          ) : (
            <Alerta to="avis" viva={false} titol="Cal aprovar el tractor de factures"
              accions={<Boto varietat="primari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
              <p>
                Abans de llegir cap factura, llig la fitxa de «{TRACTOR_FACTURES.nom}» i aprova’n la versió exacta
                al panell de Tractors. Sense eixa aprovació no es pot continuar.
              </p>
            </Alerta>
          )}
          {facturesAprovat && !correusAprovat ? (
            <p className="sdp-gestoria-panell__nota">
              El creuament amb el correu és opcional. Per a fer-lo, aprova també «{TRACTOR_CORREUS.nom}».
            </p>
          ) : null}
        </Pas>

        <Pas numero={2} titol="Carpeta i trimestre" estat={estatPas(Boolean(proposta), facturesAprovat)}>
          {facturesAprovat ? (
            <>
              <GrupCamps llegenda="Trimestre que prepares">
                <Camp etiqueta="Any">
                  <Selector value={String(periode.any)} disabled={ocupat}
                    opcions={anys.map((a) => ({ valor: String(a), etiqueta: String(a) }))}
                    onChange={(event) => setPeriode((p) => ({ ...p, any: Number(event.target.value) }))} />
                </Camp>
                <Camp etiqueta="Trimestre">
                  <Selector value={String(periode.t)} disabled={ocupat}
                    opcions={[1, 2, 3, 4].map((t) => ({ valor: String(t), etiqueta: `${t}T` }))}
                    onChange={(event) => setPeriode((p) => ({ ...p, t: Number(event.target.value) }))} />
                </Camp>
              </GrupCamps>
              <Alerta to="info" viva={false} titol="L’anàlisi no ix d’este ordinador">
                El navegador només dona a esta pàgina la carpeta que tries, i només per a llegir-la. Les factures
                viuen en memòria fins que prems «Desenxufa» o tanques la pestanya. L’únic pas que ix d’este
                ordinador és el correu per a la gestoria, que inicies tu al pas 5.
              </Alerta>
              {g.potTriarCarpeta ? (
                <div className="sdp-gestoria-panell__accions">
                  <Boto varietat={g.teCarpeta ? 'secundari' : 'primari'} onClick={g.triaCarpeta} disabled={ocupat}
                    carregant={g.ocupat === 'carpeta'}>
                    {g.teCarpeta ? 'Tria una altra carpeta' : 'Tria la carpeta de factures'}
                  </Boto>
                </div>
              ) : (
                <Camp etiqueta="Tria la carpeta de factures"
                  ajuda="Este navegador no obri el selector de carpetes: tria-la amb este botó. Res es puja enlloc.">
                  <CampText tipus="file" webkitdirectory="" multiple disabled={ocupat}
                    onChange={(event) => g.usaFitxers(event.target.files)} />
                </Camp>
              )}
              {g.teCarpeta ? (
                <p>
                  Carpeta triada: <strong>{g.nomCarpeta ? `«${g.nomCarpeta}»` : 'sense nom'}</strong>.
                  {g.potEscriure
                    ? ' Després d’aprovar la proposta, s’hi podrà desar el full del trimestre.'
                    : ' Des d’este navegador no s’hi pot escriure: el full es descarregarà.'}
                </p>
              ) : null}
              <div className="sdp-gestoria-panell__accions">
                <Boto varietat="primari" onClick={analitzaTrimestre} disabled={!g.teCarpeta || ocupat}
                  carregant={g.ocupat === 'analisi'}>
                  {`Analitza el ${periode.t}T de ${periode.any}`}
                </Boto>
              </div>
              {g.ocupat === 'analisi' ? (
                <div role="status" className="sdp-gestoria-panell__progres">
                  <Progres etiqueta={ETIQUETES_FASE[progres?.fase] ?? 'Preparant l’anàlisi'}
                    valor={progres ? progres.fet : null} max={progres?.total > 0 ? progres.total : 1} />
                </div>
              ) : null}
              <ErrorDe {...errors} accions={['carpeta']} />
            </>
          ) : <p>Primer cal aprovar el tractor de factures (pas 1).</p>}
        </Pas>

        <Pas numero={3} titol="Revisió" estat={estatPas(false, Boolean(proposta))} refTitol={refRevisio}>
          {proposta && g.analisi ? (
            <>
              <Cobertura cobertura={g.analisi.cobertura} />
              {g.analisi.cobertura.correu === 'no-revisat' ? (
                <Alerta to="avis" viva={false} titol="Correu no revisat">
                  Sense creuar el correu, les factures que falten es busquen només a la carpeta i a l’historial:
                  esta revisió no pot ser completa.
                </Alerta>
              ) : null}
              {g.analisi.avisos.length > 0 ? (
                <ul className="sdp-gestoria-panell__avisos">
                  {g.analisi.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
                </ul>
              ) : null}
              <Camp etiqueta="Titular del full" ajuda="El nom que encapçala el full i els fitxers." obligatori>
                <CampText value={proposta.titular} autoComplete="off" onChange={(event) => g.editaTitular(event.target.value)} />
              </Camp>
              <Incidencies incidencies={incidencies} />
              <TaulaDocuments documents={g.analisi.documents} />
              <TaulaFactures tipus="ingres" factures={proposta.ingressos} incidencies={incidencies}
                onEdita={g.editaFactura} onExclou={g.exclouFactura} onAfegix={() => afegix('ingres')} />
              <TaulaFactures tipus="despesa" factures={proposta.despeses} incidencies={incidencies}
                onEdita={g.editaFactura} onExclou={g.exclouFactura} onAfegix={() => afegix('despesa')} />
              {g.excloses.length > 0 ? (
                <section className="sdp-gestoria-panell__bloc" aria-label="Factures excloses">
                  <p className="sdp-gestoria-panell__nota">{`Excloses de la proposta (${g.excloses.length}): no aniran al full.`}</p>
                  <ul className="sdp-gestoria-panell__excloses">
                    {g.excloses.map((f) => (
                      <li key={f.id}>
                        <span>{`${f.num || 'Sense número'} · ${f.contrapart || 'sense contrapart'} · ${formatImport(f.total) || 'sense total'}`}</span>
                        <Boto varietat="fantasma" onClick={() => g.restauraFactura(f.id)}
                          aria-label={`Torna a la proposta la factura ${f.num || 'sense número'}`}>
                          Torna a la proposta
                        </Boto>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section className="sdp-gestoria-panell__bloc" aria-labelledby={idCorreu}>
                <h3 id={idCorreu} className="sdp-gestoria-panell__subtitol">Creua amb el correu</h3>
                <p>
                  Opcional. Amb una exportació del correu del trimestre (.mbox o .eml) es busquen les factures que
                  t’han arribat per correu i no són a la carpeta. Només se’n lligen el remitent, l’assumpte, la data i
                  el nom dels adjunts.
                </p>
                {correusAprovat ? (
                  <Camp etiqueta="Exportació del correu (.mbox o .eml)">
                    <CampText tipus="file" accept=".mbox,.eml,message/rfc822,application/mbox" multiple disabled={ocupat}
                      onChange={(event) => g.creuaCorreus(event.target.files)} />
                  </Camp>
                ) : (
                  <Alerta to="info" viva={false} titol="Cal aprovar el tractor del correu"
                    accions={<Boto varietat="secundari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
                    Per a creuar el correu, aprova abans «{TRACTOR_CORREUS.nom}» al panell de Tractors.
                  </Alerta>
                )}
                {g.ocupat === 'correu' ? <Carregant etiqueta="Creuant el correu…" /> : null}
                {g.correu?.avisos.length ? (
                  <ul className="sdp-gestoria-panell__avisos">
                    {g.correu.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
                  </ul>
                ) : null}
                <ErrorDe {...errors} accions={['correu']} />
              </section>
            </>
          ) : <p>Quan analitzes la carpeta, ací veuràs la proposta per a revisar-la i corregir-la.</p>}
        </Pas>

        <Pas numero={4} titol="Proposta del full" estat={estatPas(Boolean(entregables), Boolean(proposta))}>
          {proposta ? (
            <>
              <h3 className="sdp-gestoria-panell__subtitol">Vista prèvia del full</h3>
              {vista.full ? (
                <VistaPreviaFull full={vista.full} titol={`Vista prèvia del full del ${proposta.t}T de ${proposta.any}`} />
              ) : <Alerta to="error">{`No es pot maquetar el full: ${vista.error}`}</Alerta>}
              <Casella etiqueta="He revisat la proposta"
                ajuda="Les dades, les incidències i el full tal com el veurà la gestoria. Si canvies res, l’hauràs de tornar a revisar."
                checked={estaRevisada} disabled={ocupat}
                onChange={(event) => setRevisada(event.target.checked ? versio : null)} />
              {altes.length > 0 ? (
                <Casella etiqueta="Genera-la igualment: les incidències queden anotades"
                  ajuda={`Hi ha ${plural(altes.length, 'una incidència', 'incidències')} d’alta severitat. Si la generes, l’aprovació en guarda la llista.`}
                  checked={estaAcceptada} disabled={ocupat}
                  onChange={(event) => setAcceptada(event.target.checked ? versio : null)} />
              ) : null}
              <p id={idAjudaGenera} className="sdp-gestoria-panell__nota">
                {potGenerar || g.ocupat
                  ? 'En prémer el botó aproves esta proposta exacta: qualsevol canvi posterior l’anul·la.'
                  : 'Per a generar el full, marca «He revisat la proposta»'
                    + `${altes.length > 0 ? ' i «Genera-la igualment»' : ''}.`}
              </p>
              <div className="sdp-gestoria-panell__accions">
                <Boto varietat="primari" onClick={generaFull} disabled={!potGenerar} aria-describedby={idAjudaGenera}
                  carregant={g.ocupat === 'aprovacio' || g.ocupat === 'generant'}>
                  Genera el full
                </Boto>
              </div>
              <ErrorDe {...errors} accions={['proposta', 'fitxers']} />
              {entregables ? (
                <section className="sdp-gestoria-panell__bloc" aria-labelledby={idFitxers}>
                  <h3 id={idFitxers} ref={refFitxers} tabIndex={-1} className="sdp-gestoria-panell__subtitol">Fitxers generats</h3>
                  <ul className="sdp-gestoria-panell__fitxers">
                    {FORMATS_ENTREGABLE.map((format) => (
                      <li key={format} className="sdp-gestoria-panell__fitxer-generat">
                        <code>{entregables[format].nom}</code>
                        <span className="sdp-gestoria-panell__nota">{`SHA-256 ${entregables.empremtes[format].slice(0, 12)}…`}</span>
                        <div className="sdp-gestoria-panell__accions">
                          <Boto varietat={format === 'xlsx' ? 'primari' : 'secundari'} onClick={() => descarregaFitxer(format)}>
                            {format === 'xlsx' ? 'Descarrega l’XLSX' : 'Descarrega el CSV'}
                          </Boto>
                          {g.potEscriure ? (
                            <Boto varietat="secundari" onClick={() => g.desaAlTrimestre(format)} disabled={ocupat}
                              carregant={g.ocupat === 'desant'}>
                              {format === 'xlsx' ? 'Desa l’XLSX a la carpeta del trimestre' : 'Desa el CSV a la carpeta del trimestre'}
                            </Boto>
                          ) : null}
                        </div>
                        {g.desats[format] ? (
                          <span className="sdp-gestoria-panell__nota">{`Desat a «${g.desats[format].ruta}».`}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {g.aprovacioProposta?.acceptades.length ? (
                    <>
                      <p className="sdp-gestoria-panell__nota">Generat amb estes incidències acceptades:</p>
                      <ul className="sdp-gestoria-panell__avisos">
                        {g.aprovacioProposta.acceptades.map((missatge, i) => <li key={`${i}-${missatge}`}>{missatge}</li>)}
                      </ul>
                    </>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : <p>Quan hi haja una proposta, ací la veuràs tal com la rebrà la gestoria.</p>}
        </Pas>

        <Pas numero={5} titol="Envia a la gestoria" estat={estatPas(false, Boolean(entregables))}>
          {entregables && proposta ? (
            <EnviamentGestoria key={entregables.empremtes.xlsx} any={proposta.any} t={proposta.t} adjunts={adjunts}
              inicials={{ nom: proposta.titular }} nivellTitol={3} />
          ) : <p>Quan hages generat el full, ací podràs preparar el correu. L’enviament el fas sempre tu.</p>}
        </Pas>
      </ol>

      <DialegConfirmacio
        obert={desenxufant}
        destructiu
        titol="Vols desenxufar la Gestoria?"
        descripcio="S’oblidaran la carpeta, la proposta, el correu creuat i els fulls generats que no hages descarregat o desat. No s’esborra cap fitxer teu."
        etiquetaConfirma="Sí, desenxufa"
        onTanca={() => setDesenxufant(false)}
        onConfirma={desenxufa}
      />
      <DialegConfirmacio
        obert={Boolean(g.sobreescriure)}
        destructiu
        carregant={g.ocupat === 'desant'}
        titol="Ja hi ha este fitxer a la carpeta"
        descripcio={g.sobreescriure
          ? `Ja hi ha «${g.sobreescriure.nom}» a la carpeta del trimestre. Si el substituïxes, el d’abans es perd.`
          : undefined}
        etiquetaConfirma="Sí, substituïx-lo"
        etiquetaCancela="No, deixa’l"
        onTanca={g.cancellaSobreescriure}
        onConfirma={() => g.desaAlTrimestre(g.sobreescriure.format, { sobreescriu: true })}
      />
    </div>
  );
}

/**
 * El Bar · vistes/Torn.jsx — obrir el torn, la nota de traspàs i el torn en
 * curs (disseny del Bar §A.6, flux 6).
 *
 *   · Si hi ha una nota de traspàs del torn anterior sense llegir, es mostra
 *     primer i cal marcar-la com a llegida (un toc): fins llavors no es ven.
 *   · Obrir: l'àlies de qui atén (mai un nom complet obligat) i el fons.
 *   · Durant el torn: moviments de caixa amb motiu i el resum parcial.
 * Les llistes (moviments, comandes que passen, reposició) són les línies de
 * l'esquelet comú; els números, una Taula de Pedra Seca.
 * Sense permís d'escriptura (ProveidorBar, permis.potEscriure), ni s'obri el
 * torn, ni es marca llegida la nota, ni s'afig cap moviment: els botons es
 * desactiven i l'avís de la sessió diu per què, dins del marc de la columna
 * (també la dels moviments, de l'esquelet: avis, correcció F3, 261006).
 */
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, LiniesColleccio, PillToggle, Pila, Taula, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccio } from '../../comu/esquelet/index.js';
import { esDescartable } from '../nucli/comanda.js';
import { resumTorn } from '../nucli/torn.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisBase, AvisDeLaColumna, AvisOperacio, Columna, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { euros, horaCurta, nomOrigen } from './vestits.js';

const NOMS_INCIDENCIA = Object.freeze({
  'diferencia-caixa': 'Diferència de caixa', anullacions: 'Anul·lacions', devolucions: 'Devolucions', convidades: 'Convidades'
});

/** Les files del resum d'un torn (parcial o tancat), per a una Taula. */
function filesResum(r, torn = null) {
  return [
    ['Fons inicial', r.fonsInicialCents],
    ['Vendes en efectiu', r.vendesPerMetode.efectiu],
    ['Vendes amb targeta', r.vendesPerMetode.targeta],
    ['Vendes amb altres mètodes', r.vendesPerMetode.altre],
    ['Total vendes', r.totalVendesCents, `${r.tiquets} tiquets`],
    ['Tiquet mitjà', r.tiquetMitjaCents],
    ['Devolucions', r.devolucionsCents, `${r.devolucions}`],
    ['Anul·lacions', r.anullacions.importCents, `${r.anullacions.nombre}`],
    ['Descomptes', r.descomptesCents],
    ['Convidades', r.convidadesCents],
    ['Entrades de caixa', r.entradesCents],
    ['Eixides de caixa', r.eixidesCents],
    ['Efectiu esperat', r.efectiuEsperatCents],
    ...(torn?.arqueig ? [['Efectiu comptat', torn.arqueig.totalCents], ['Diferència de caixa', torn.diferenciaCaixaCents]] : []),
    ['Comandes obertes', r.obertesCents, `${r.comandesObertes}`]
  ];
}

export function TaulaResum({ titol = 'Resum del torn', resum, torn = null }) {
  return (
    <Taula titol={titol} densa>
      <thead><tr><th scope="col">Concepte</th><th scope="col">Import</th><th scope="col">Nombre</th></tr></thead>
      <tbody>
        {filesResum(resum, torn).map(([concepte, cents, nombre]) => (
          <tr key={concepte}><th scope="row">{concepte}</th><td>{euros(cents)}</td><td>{nombre || ''}</td></tr>
        ))}
      </tbody>
    </Taula>
  );
}

/** La nota de traspàs com a peces de l'esquelet: avisos, incidències, comandes que passen i reposició. */
export function ContingutTraspas({ nota }) {
  const { sala } = useBar();
  return (
    <Pila gap={4}>
      {nota.avisos.map((avis, i) => <Alerta key={`${i}-${avis}`} to="avis" viva={false}>{avis}</Alerta>)}
      {nota.incidencies.length ? (
        <LiniesColleccio etiqueta="Incidències"
          linies={nota.incidencies.map((inc) => ({ id: inc.tipus, articleId: inc.tipus, nom: NOMS_INCIDENCIA[inc.tipus], detall: inc.detall, valor: euros(inc.importCents) }))} />
      ) : <p>Cap incidència.</p>}
      {nota.comandesObertes.length ? (
        <LiniesColleccio etiqueta="Comandes que passen al torn"
          linies={nota.comandesObertes.map((c) => ({ id: c.id, articleId: c.id, nom: nomOrigen(c.origen, sala), valor: euros(c.totalCents) }))} />
      ) : null}
      {nota.reposicio.length ? (
        <LiniesColleccio etiqueta="Reposició de la nevera"
          linies={nota.reposicio.map((r) => ({ id: r.producteId, articleId: r.producteId, quantitat: r.unitats, nom: r.nom }))} />
      ) : null}
      <p>{`Fons que es va deixar: ${euros(nota.fonsDeixatCents)} · de ${nota.de}, a les ${horaCurta(nota.tancatA)}`}</p>
    </Pila>
  );
}

function LecturaTraspas({ nota }) {
  const { accions, permis } = useBar();
  const [per, setPer] = useState('');
  return (
    <Columna titol="Nota de traspàs">
      <AvisOperacio />
      <Alerta to="info" viva={false} titol="Abans d’obrir">Llig la nota del torn anterior. Fins que no es marca com a llegida no es pot vendre.</Alerta>
      <ContingutTraspas nota={nota} />
      <Camp etiqueta="Qui la llig (àlies)" ajuda="Un àlies curt, com «Cambrera 2».">
        <CampText value={per} maxLength={24} onChange={(event) => setPer(event.target.value)} />
      </Camp>
      <Boto varietat="primari" ple disabled={!permis.potEscriure} onClick={() => accions.llegeixTraspas({ per })}>L’he llegida</Boto>
    </Columna>
  );
}

function ObriTorn({ traspas }) {
  const { accions, permis } = useBar();
  const [per, setPer] = useState(traspas?.llegidaPer || '');
  const [fons, setFons] = useState(traspas ? traspas.fonsDeixatCents : 0);
  return (
    <Columna titol="Obri el torn">
      <AvisBase />
      <AvisOperacio />
      <Camp etiqueta="Qui obri el torn (àlies)" ajuda="Un àlies curt, com «Cambrer 1»: mai cal el nom complet.">
        <CampText value={per} maxLength={24} onChange={(event) => setPer(event.target.value)} />
      </Camp>
      <TeclatNumeric mode="import" etiqueta="Fons inicial de caixa" valor={fons} onCanvi={setFons} />
      {traspas ? <p>{`El torn anterior va deixar ${euros(traspas.fonsDeixatCents)} al calaix.`}</p> : null}
      <Boto varietat="primari" ple mida="gran" disabled={!permis.potEscriure} onClick={() => accions.obriTorn({ per, fonsInicialCents: fons })}>Obri el torn</Boto>
    </Columna>
  );
}

export function TornActual() {
  return (
    <Preparat titol="Torn" ambTorn={false}>
      <Torn />
    </Preparat>
  );
}

function Torn() {
  const bar = useBar();
  const { ves } = useVes();
  const { tornActual, traspas } = bar;
  if (!tornActual) {
    if (traspas && !traspas.llegidaA) return <LecturaTraspas nota={traspas} />;
    return <ObriTorn traspas={traspas} />;
  }
  /* Onada 12 (261011, BAR-R11) · Les mateixes comandes obertes que el tancament (Tancament.jsx):
     una de buida (un tiquet de barra nou sense res) no ho és, i es descartarà en tancar. */
  const resum = resumTorn(tornActual, bar.tiquets, bar.comandes.filter((c) => !esDescartable(c)), { categories: bar.carta.categories });
  return (
    <Columna titol="Torn actual"
      eines={<BarraResum etiqueta={`Torn de ${tornActual.obertPer}`} comptador={resum.tiquets} textComptador={(n) => `${n} tiquets`}
        total={euros(resum.totalVendesCents)} textTotal="Vendes" accio={{ text: 'Tanca el torn', onClick: () => ves('tancament') }} />}>
      <AvisBase />
      <p>{`Obert a les ${horaCurta(tornActual.obertA)}. Esta és una caixa d’este dispositiu: les dades no ixen d’ací.`}</p>
      <TaulaResum titol="Resum parcial (no tanca res)" resum={resum} />
    </Columna>
  );
}

export function MovimentsTorn() {
  return (
    <Preparat titol="Moviments de caixa" avis="estret">
      <Moviments />
    </Preparat>
  );
}

function Moviments() {
  const { tornActual, accions, permis } = useBar();
  const [tipus, setTipus] = useState('entrada');
  const [importCents, setImport] = useState(0);
  const [motiu, setMotiu] = useState('');
  const afig = async () => {
    const r = await accions.moviment({ tipus, importCents, motiu });
    if (r.ok) {
      setImport(0);
      setMotiu('');
    }
  };
  const peu = (
    <Pila gap={2}>
      <AvisOperacio />
      <PillToggle etiqueta="Tipus de moviment" valor={tipus} onCanvi={setTipus}
        opcions={[{ valor: 'entrada', text: 'Entrada' }, { valor: 'eixida', text: 'Eixida' }]} />
      <TeclatNumeric mode="import" etiqueta="Import" valor={importCents} onCanvi={setImport} />
      <Camp etiqueta="Motiu" obligatori>
        <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
      </Camp>
      <Boto varietat="primari" icona={ClipboardList} disabled={!permis.potEscriure || importCents < 1 || !motiu.trim()} onClick={afig}>Afig el moviment</Boto>
    </Pila>
  );
  return (
    <ColumnaColleccio
      titol="Moviments de caixa"
      linies={tornActual.moviments.map((m) => ({
        id: m.id, articleId: m.tipus, nom: `${m.tipus === 'entrada' ? 'Entrada' : 'Eixida'}: ${m.motiu}`, detall: horaCurta(m.moment),
        valor: `${m.tipus === 'entrada' ? '+' : '−'}${euros(m.importCents)}`
      }))}
      peu={peu}
      textos={{ buit: 'Cap moviment', buitText: 'Entrades i eixides de caixa amb el seu motiu.' }}
      avis={<AvisDeLaColumna />}
    />
  );
}

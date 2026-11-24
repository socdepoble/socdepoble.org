/**
 * El Bar · vistes/Torn.jsx — obrir el torn, la nota de traspàs i el torn en
 * curs (disseny del Bar §A.6, flux 6).
 */
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import {
  Accions, Alerta, BarraResum, Boto, Camp, CampText, LiniesColleccio, PillToggle, Pila, Taula, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccio } from '../../comu/esquelet/index.js';
import { esDescartable } from '../nucli/comanda.js';
import { resumTorn } from '../nucli/torn.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisBase, AvisDeLaColumna, AvisOperacio, Columna, Preparat } from './comu.jsx';
import { useIdiomaBar, useUnaVegada, useVes } from './punt.js';
import { euros, horaCurta, nomOrigen } from './vestits.js';

function nomIncidencia(tipus, tx) {
  if (tipus === 'diferencia-caixa') return tx.diferenciaCaixa;
  if (tipus === 'anullacions') return tx.incidenciaAnullacions;
  if (tipus === 'devolucions') return tx.incidenciaDevolucions;
  if (tipus === 'convidades') return tx.incidenciaConvidades;
  return tipus;
}

function filesResum(r, torn = null, tx) {
  return [
    [tx.fonsInicial, r.fonsInicialCents],
    [tx.vendesEfectiu, r.vendesPerMetode.efectiu],
    [tx.vendesTargeta, r.vendesPerMetode.targeta],
    [tx.vendesAltres, r.vendesPerMetode.altre],
    [tx.totalVendes, r.totalVendesCents, tx.nTiquets(r.tiquets)],
    [tx.tiquetMitja, r.tiquetMitjaCents],
    [tx.incidenciaDevolucions, r.devolucionsCents, `${r.devolucions}`],
    [tx.incidenciaAnullacions, r.anullacions.importCents, `${r.anullacions.nombre}`],
    [tx.descomptes, r.descomptesCents],
    [tx.incidenciaConvidades, r.convidadesCents],
    [tx.entradesCaixa, r.entradesCents],
    [tx.eixidesCaixa, r.eixidesCents],
    [tx.efectiuEsperat, r.efectiuEsperatCents],
    ...(torn?.arqueig ? [[tx.efectiuComptat, torn.arqueig.totalCents], [tx.diferenciaCaixa, torn.diferenciaCaixaCents]] : []),
    [tx.comandesObertes, r.obertesCents, `${r.comandesObertes}`]
  ];
}

export function TaulaResum({ titol, resum, torn = null }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const titolResolt = titol ?? tx.resumDelTorn;
  return (
    <Taula titol={titolResolt} densa>
      <thead><tr><th scope="col">{tx.colConcepte}</th><th scope="col">{tx.colImport}</th><th scope="col">{tx.colNombre}</th></tr></thead>
      <tbody>
        {filesResum(resum, torn, tx).map(([concepte, cents, nombre]) => (
          <tr key={concepte}><th scope="row">{concepte}</th><td>{euros(cents)}</td><td>{nombre || ''}</td></tr>
        ))}
      </tbody>
    </Taula>
  );
}

export function ContingutTraspas({ nota }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const { sala } = useBar();
  return (
    <Pila gap={4}>
      {nota.avisos.map((avis, i) => <Alerta key={`${i}-${avis}`} to="avis" viva={false}>{avis}</Alerta>)}
      {nota.incidencies.length ? (
        <LiniesColleccio etiqueta={tx.incidenciesEtiqueta}
          linies={nota.incidencies.map((inc) => ({ id: inc.tipus, articleId: inc.tipus, nom: nomIncidencia(inc.tipus, tx), detall: inc.detall, valor: euros(inc.importCents) }))} />
      ) : <p>{tx.capIncidencia}</p>}
      {nota.comandesObertes.length ? (
        <LiniesColleccio etiqueta={tx.comandesPassenTorn}
          linies={nota.comandesObertes.map((c) => ({ id: c.id, articleId: c.id, nom: nomOrigen(c.origen, sala, idioma), valor: euros(c.totalCents) }))} />
      ) : null}
      {nota.reposicio.length ? (
        <LiniesColleccio etiqueta={tx.reposicioNevera}
          linies={nota.reposicio.map((r) => ({ id: r.producteId, articleId: r.producteId, quantitat: r.unitats, nom: r.nom }))} />
      ) : null}
      <p>{tx.fonsDeixatDe(euros(nota.fonsDeixatCents), nota.de, horaCurta(nota.tancatA))}</p>
    </Pila>
  );
}

function LecturaTraspas({ nota, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, permis } = useBar();
  const [per, setPer] = useState('');
  const [ocupat, unaVegada] = useUnaVegada();
  return (
    <Columna titol={tx.notaDeTraspas}>
      <AvisOperacio />
      <Alerta to="info" viva={false} titol={tx.abansDObrir}>{tx.lligNotaAnterior}</Alerta>
      <ContingutTraspas nota={nota} />
      <Camp etiqueta={tx.quiLaLlig} ajuda={tx.ajudaQuiLaLlig}>
        <CampText value={per} maxLength={24} onChange={(event) => setPer(event.target.value)} />
      </Camp>
      <Accions>
        <Boto varietat="primari" ple carregant={ocupat} disabled={ocupat || !permis.potEscriure}
          onClick={() => unaVegada(() => accions.llegeixTraspas({ per }))}>{tx.lheLlegida}</Boto>
      </Accions>
    </Columna>
  );
}

function ObriTorn({ traspas, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, permis } = useBar();
  const [per, setPer] = useState(traspas?.llegidaPer || '');
  const [fons, setFons] = useState(traspas ? traspas.fonsDeixatCents : 0);
  const [ocupat, unaVegada] = useUnaVegada();
  return (
    <Columna titol={tx.obriTorn}>
      <AvisBase />
      <AvisOperacio />
      <Camp etiqueta={tx.quiObriTorn} ajuda={tx.ajudaQuiObriTorn}>
        <CampText value={per} maxLength={24} onChange={(event) => setPer(event.target.value)} />
      </Camp>
      <TeclatNumeric mode="import" etiqueta={tx.fonsInicialCaixa} valor={fons} onCanvi={setFons} desactivat={ocupat || !permis.potEscriure} />
      {traspas ? <p>{tx.tornAnteriorDeixar(euros(traspas.fonsDeixatCents))}</p> : null}
      <Accions>
        <Boto varietat="primari" ple mida="gran" carregant={ocupat} disabled={ocupat || !permis.potEscriure}
          onClick={() => unaVegada(() => accions.obriTorn({ per, fonsInicialCents: fons }))}>{tx.obriTorn}</Boto>
      </Accions>
    </Columna>
  );
}

export function TornActual() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tornTitol} ambTorn={false}>
      <Torn idioma={idioma} />
    </Preparat>
  );
}

function Torn({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const bar = useBar();
  const { ves } = useVes();
  const { tornActual, traspas } = bar;
  if (!tornActual) {
    if (traspas && !traspas.llegidaA) return <LecturaTraspas nota={traspas} idioma={idioma} />;
    return <ObriTorn traspas={traspas} idioma={idioma} />;
  }
  const resum = resumTorn(tornActual, bar.tiquets, bar.comandes.filter((c) => !esDescartable(c)), { categories: bar.carta.categories });
  return (
    <Columna titol={tx.tornActualTitol}
      eines={<BarraResum etiqueta={tx.tornDe(tornActual.obertPer)} comptador={resum.tiquets} textComptador={(n) => tx.nTiquets(n)}
        total={euros(resum.totalVendesCents)} textTotal={tx.vendesEtiqueta} accio={{ text: tx.tancaElTorn, onClick: () => ves('tancament') }} />}>
      <AvisBase />
      <p>{tx.obertALes(horaCurta(tornActual.obertA))}</p>
      <TaulaResum titol={tx.resumParcialTitol} resum={resum} />
    </Columna>
  );
}

export function MovimentsTorn() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.movimentsCaixa} avis="estret">
      <Moviments idioma={idioma} />
    </Preparat>
  );
}

function Moviments({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { tornActual, accions, permis } = useBar();
  const [tipus, setTipus] = useState('entrada');
  const [importCents, setImport] = useState(0);
  const [motiu, setMotiu] = useState('');
  const [ocupat, unaVegada] = useUnaVegada();
  const afig = () => unaVegada(async () => {
    const r = await accions.moviment({ tipus, importCents, motiu });
    if (r.ok) {
      setImport(0);
      setMotiu('');
    }
  });
  const peu = (
    <Pila gap={2}>
      <AvisOperacio />
      <PillToggle etiqueta={tx.tipusMoviment} valor={tipus} onCanvi={setTipus}
        opcions={[{ valor: 'entrada', text: tx.entrada }, { valor: 'eixida', text: tx.eixida }]} />
      <TeclatNumeric mode="import" etiqueta={tx.importEtiqueta} valor={importCents} onCanvi={setImport} desactivat={ocupat || !permis.potEscriure} />
      <Camp etiqueta={tx.motiuEtiqueta} obligatori>
        <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
      </Camp>
      <Accions>
        <Boto varietat="primari" icona={ClipboardList} carregant={ocupat}
          disabled={ocupat || !permis.potEscriure || importCents < 1 || !motiu.trim()} onClick={afig}>{tx.afigMoviment}</Boto>
      </Accions>
    </Pila>
  );
  return (
    <ColumnaColleccio
      titol={tx.movimentsCaixa}
      linies={tornActual.moviments.map((m) => ({
        id: m.id,
        articleId: m.tipus,
        nom: `${m.tipus === 'entrada' ? tx.entrada : tx.eixida}: ${m.motiu}`,
        detall: horaCurta(m.moment),
        valor: `${m.tipus === 'entrada' ? '+' : '−'}${euros(m.importCents)}`
      }))}
      peu={peu}
      textos={{ buit: tx.capMoviment, buitText: tx.capMovimentText }}
      avis={<AvisDeLaColumna />}
    />
  );
}

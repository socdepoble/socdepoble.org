/**
 * El Bar · vistes/Tancament.jsx — tancar el torn en quatre passos (disseny
 * del Bar §A.6, flux 6): arqueig, resum, traspàs i confirmar.
 */
import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Accions, Alerta, BarraResum, Boto, Camp, CampText, Dialeg, Fila, LiniesColleccio, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esDescartable, totals } from '../nucli/comanda.js';
import { arqueig, resumTorn } from '../nucli/torn.js';
import { llistaReposicio } from '../nucli/reposicio.js';
import { incidenciesAutomatiques } from '../nucli/traspas.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisDeLaColumna, AvisOperacio, Columna, Preparat } from './comu.jsx';
import { passosTancament, useIdiomaBar, useUnaVegada, useVes } from './punt.js';
import { TaulaResum } from './Torn.jsx';
import { euros, nomOrigen } from './vestits.js';

function useTancament() {
  const bar = useBar();
  const esborrany = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...bar.tancament };
  const obertes = bar.comandes.filter((c) => !esDescartable(c));
  const resum = resumTorn(bar.tornActual, bar.tiquets, obertes, { categories: bar.carta.categories });
  const comptat = arqueig(esborrany.perDenominacio, bar.establiment.denominacions);
  return { bar, esborrany, obertes, resum, comptat, diferencia: comptat - resum.efectiuEsperatCents };
}

export function PassosTancament({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tancamentTitol} avis="estret">
      <Passos params={params} idioma={idioma} />
    </Preparat>
  );
}

function Passos({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol={tx.tancamentTitol} actiu={params?.pas || 'arqueig'}
      colleccions={passosTancament(idioma).map((p, i) => ({ id: p.id, nom: p.nom, comptador: i + 1 }))}
      hrefDe={(p) => ruta('tancament', p.id)} textComptador={(n) => tx.pasDeQuatre(n)} avis={<AvisDeLaColumna />} />
  );
}

export function PasTancament({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const pas = params?.pas || 'arqueig';
  return (
    <Preparat titol={tx.tancamentTitol}>
      {pas === 'arqueig' ? <Arqueig idioma={idioma} /> : null}
      {pas === 'resum' ? <Resum idioma={idioma} /> : null}
      {pas === 'traspas' ? <Traspas idioma={idioma} /> : null}
      {pas === 'confirmar' ? <Confirmar idioma={idioma} /> : null}
    </Preparat>
  );
}

function Arqueig({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { bar, esborrany, comptat } = useTancament();
  const { ves } = useVes();
  const [editant, setEditant] = useState(null);
  const [unitats, setUnitats] = useState(0);
  const posa = (cents, valor) => bar.accions.desaEsborranyTancament((actual) => ({
    perDenominacio: { ...actual.perDenominacio, [cents]: Math.max(0, valor) }
  }));
  const sumaPeces = (cents, pas) => bar.accions.desaEsborranyTancament((actual) => ({
    perDenominacio: { ...actual.perDenominacio, [cents]: Math.max(0, (actual.perDenominacio[cents] || 0) + pas) }
  }));
  const de = (cents) => esborrany.perDenominacio[cents] || 0;
  const centsDe = (linia) => Number(linia.articleId);
  const peces = bar.establiment.denominacions.reduce((suma, cents) => suma + de(cents), 0);
  const compta = bar.permis.potEscriure;
  return (
    <>
      <ColumnaColleccio
        titol={tx.pasArqueig}
        linies={bar.establiment.denominacions.map((cents) => ({
          id: `d-${cents}`, articleId: String(cents), quantitat: de(cents), nom: euros(cents), valor: euros(cents * de(cents))
        }))}
        resum={{
          etiqueta: tx.comptatEtiqueta,
          comptador: peces,
          textComptador: (n) => tx.pecesComptador(n),
          total: euros(comptat),
          accio: { text: tx.continuaResum, onClick: () => ves('tancament', 'resum') }
        }}
        onSuma={compta ? (linia) => sumaPeces(centsDe(linia), 1) : undefined}
        onResta={compta ? (linia) => sumaPeces(centsDe(linia), -1) : undefined}
        onEdita={compta ? (linia) => { setEditant(centsDe(linia)); setUnitats(de(centsDe(linia))); } : undefined}
        peu={<AvisOperacio />}
        avis={<AvisDeLaColumna />}
      />
      <Dialeg obert={editant !== null} onTanca={() => setEditant(null)} titol={editant !== null ? tx.pecesDe(euros(editant)) : tx.pecesEtiqueta}
        accions={<Boto onClick={() => setEditant(null)}>{tx.cancela}</Boto>}>
        {editant !== null ? (
          <TeclatNumeric mode="quantitat" etiqueta={tx.pecesEtiqueta} valor={unitats} onCanvi={setUnitats} maxim={9999}
            onAccepta={(n) => { posa(editant, n); setEditant(null); }} textAccepta={tx.desa} />
        ) : null}
      </Dialeg>
    </>
  );
}

function Resum({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { bar, resum, comptat, diferencia } = useTancament();
  const { ves } = useVes();
  return (
    <Columna titol={tx.resumTancament}
      eines={<BarraResum etiqueta={tx.diferenciaCaixa} comptador={0} textComptador={() => ''} total={euros(diferencia)} textTotal={tx.diferencia}
        accio={{ text: tx.continuaTraspas, onClick: () => ves('tancament', 'traspas') }} />}>
      {diferencia !== 0 ? (
        <Alerta to="avis" viva={false} titol={diferencia > 0 ? tx.sobrenDiners : tx.faltenDiners}>
          {tx.esperatComptatNota(euros(resum.efectiuEsperatCents), euros(comptat))}
        </Alerta>
      ) : <Alerta to="exit" viva={false}>{tx.laCaixaQuadra}</Alerta>}
      <TaulaResum resum={resum} torn={{ arqueig: { totalCents: comptat }, diferenciaCaixaCents: diferencia }} />
      <p>{tx.tornDePunt(bar.tornActual.obertPer)}</p>
    </Columna>
  );
}

function Traspas({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { bar, esborrany, obertes, resum, diferencia } = useTancament();
  const { ves } = useVes();
  const [avis, setAvis] = useState('');
  const [fons, setFons] = useState(esborrany.fonsDeixatCents);
  const ambPagaments = obertes.filter((c) => c.pagaments.length > 0);
  const reposicio = llistaReposicio(bar.tiquets, bar.carta);
  const escriu = bar.permis.potEscriure;
  const afigAvis = () => {
    const text = avis.trim();
    if (!text) return;
    bar.accions.desaEsborranyTancament((actual) => ({ avisos: [...actual.avisos, text].slice(0, 10) }));
    setAvis('');
  };
  const llevaAvis = (linia) => {
    const text = esborrany.avisos.find((_, i) => `avis-${i}` === linia.id);
    bar.accions.desaEsborranyTancament((actual) => {
      const posicio = actual.avisos.indexOf(text);
      return { avisos: posicio < 0 ? actual.avisos : actual.avisos.filter((_, i) => i !== posicio) };
    });
  };
  const canviaFons = (cents) => {
    setFons(cents);
    bar.accions.desaEsborranyTancament({ fonsDeixatCents: cents });
  };
  return (
    <Columna titol={tx.notaDeTraspas}>
      <AvisOperacio />
      {ambPagaments.length ? (
        <Alerta to="error" titol={tx.comandesAmbPagamentsTitol}>{tx.comandesAmbPagamentsText}</Alerta>
      ) : null}
      <LiniesColleccio etiqueta={tx.comandesPassenSeguent}
        linies={obertes.map((c) => ({ id: c.id, articleId: c.id, nom: nomOrigen(c.origen, bar.sala, idioma), valor: euros(totals(c).totalCents) }))}
        buit={<p>{tx.capComandaPassa}</p>} />
      <LiniesColleccio etiqueta={tx.reposicioNevera}
        linies={reposicio.map((r) => ({ id: r.producteId, articleId: r.producteId, quantitat: r.unitats, nom: r.nom }))}
        buit={<p>{tx.resAReposar}</p>} />
      <LiniesColleccio etiqueta={tx.incidenciesSoles}
        linies={incidenciesAutomatiques(resum, diferencia).map((inc) => ({ id: inc.tipus, articleId: inc.tipus, nom: inc.detall, valor: euros(inc.importCents) }))}
        buit={<p>{tx.capIncidencia}</p>} />
      <LiniesColleccio etiqueta={tx.avisosTornSeguent}
        linies={esborrany.avisos.map((text, i) => ({ id: `avis-${i}`, articleId: 'avis', nom: text }))}
        onLleva={escriu ? llevaAvis : undefined}
        buit={<p>{tx.capAvis}</p>} />
      <Camp etiqueta={tx.unAvisCurt} ajuda={tx.ajudaAvisCurt}>
        <CampText value={avis} maxLength={80} onChange={(event) => setAvis(event.target.value)} />
      </Camp>
      <Accions>
        <Boto onClick={afigAvis} disabled={!escriu || !avis.trim() || esborrany.avisos.length >= 10}>{tx.afigAvis}</Boto>
      </Accions>
      <TeclatNumeric mode="import" etiqueta={tx.fonsDeixaCalaix} valor={fons} onCanvi={canviaFons} desactivat={!escriu} />
      <Accions>
        <Boto varietat="primari" ple onClick={() => ves('tancament', 'confirmar')}>{tx.continua}</Boto>
      </Accions>
    </Columna>
  );
}

function Confirmar({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { bar, obertes, comptat, diferencia, resum } = useTancament();
  const { ves } = useVes();
  const [ocupat, unaVegada] = useUnaVegada();
  const bloquejat = obertes.some((c) => c.pagaments.length > 0) || !bar.permis.potEscriure;
  const tanca = () => unaVegada(async () => {
    const r = await bar.accions.tancaTorn();
    if (r.ok) ves('torns', r.valor.id);
  });
  return (
    <Columna titol={tx.confirmaTancament}>
      <AvisOperacio />
      <Alerta to="info" viva={false} titol={tx.despresNoDesfer}>
        {tx.tornEsCongelaText}
      </Alerta>
      <Fila gap={2} justify="center">
        <p>{tx.esperatValor(euros(resum.efectiuEsperatCents))}</p>
        <p>{tx.comptatValor(euros(comptat))}</p>
        <p>{tx.diferenciaValor(euros(diferencia))}</p>
        <p>{tx.comandesPassenN(obertes.length)}</p>
      </Fila>
      <Accions>
        <Boto varietat="primari" icona={Lock} ple mida="gran" carregant={ocupat} disabled={ocupat || bloquejat} onClick={tanca}>{tx.tancaElTorn}</Boto>
      </Accions>
    </Columna>
  );
}

/**
 * El Bar · vistes/Tancament.jsx — tancar el torn en quatre passos (disseny
 * del Bar §A.6, flux 6): arqueig, resum, traspàs i confirmar. El pas va al
 * camí (/app/bar/tancament/<pas>) i l'esborrany sobreviu a una recàrrega.
 *
 *   · Arqueig: les denominacions són línies de l'esquelet («3 × 20,00 €»):
 *     + i − compten peces; tocar-ne una obri el teclat per a teclejar-les.
 *   · Resum: efectiu esperat davant del comptat i la diferència en gran.
 *   · Traspàs: les comandes que passen, la reposició, els avisos i el fons.
 *   · Confirmar: es congela el torn i es genera la nota de traspàs.
 * Sense permís d'escriptura (ProveidorBar, permis.potEscriure) els passos es
 * miren, però ni es compta, ni s'afig cap avís, ni es tanca: els controls que
 * escriuen es desactiven i l'avís de la sessió diu per què, dins del marc
 * de cada columna (avis, correcció F3, 261006).
 */
import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, Dialeg, Fila, LiniesColleccio, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esDescartable, totals } from '../nucli/comanda.js';
import { arqueig, resumTorn } from '../nucli/torn.js';
import { llistaReposicio } from '../nucli/reposicio.js';
import { incidenciesAutomatiques } from '../nucli/traspas.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisDeLaColumna, AvisOperacio, Columna, Preparat } from './comu.jsx';
import { PASSOS, useVes } from './punt.js';
import { TaulaResum } from './Torn.jsx';
import { euros, nomOrigen } from './vestits.js';

/** L'esborrany, el resum i la diferència de caixa del tancament en curs. */
function useTancament() {
  const bar = useBar();
  const esborrany = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...bar.tancament };
  const obertes = bar.comandes.filter((c) => !esDescartable(c));
  const resum = resumTorn(bar.tornActual, bar.tiquets, obertes, { categories: bar.carta.categories });
  const comptat = arqueig(esborrany.perDenominacio, bar.establiment.denominacions);
  return { bar, esborrany, obertes, resum, comptat, diferencia: comptat - resum.efectiuEsperatCents };
}

export function PassosTancament({ params }) {
  return (
    <Preparat titol="Tancament" avis="estret">
      <Passos params={params} />
    </Preparat>
  );
}

function Passos({ params }) {
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Tancament" actiu={params?.pas || 'arqueig'}
      colleccions={PASSOS.map((p, i) => ({ id: p.id, nom: p.nom, comptador: i + 1 }))}
      hrefDe={(p) => ruta('tancament', p.id)} textComptador={(n) => `Pas ${n} de 4`} avis={<AvisDeLaColumna />} />
  );
}

export function PasTancament({ params }) {
  const pas = params?.pas || 'arqueig';
  return (
    <Preparat titol="Tancament">
      {pas === 'arqueig' ? <Arqueig /> : null}
      {pas === 'resum' ? <Resum /> : null}
      {pas === 'traspas' ? <Traspas /> : null}
      {pas === 'confirmar' ? <Confirmar /> : null}
    </Preparat>
  );
}

function Arqueig() {
  const { bar, esborrany, comptat } = useTancament();
  const { ves } = useVes();
  const [editant, setEditant] = useState(null);
  const [unitats, setUnitats] = useState(0);
  /* El valor teclejat és absolut; + i − són relatius a l'esborrany d'ara (BAR-R5). */
  const posa = (cents, valor) => bar.accions.desaEsborranyTancament((actual) => ({
    perDenominacio: { ...actual.perDenominacio, [cents]: Math.max(0, valor) }
  }));
  const sumaPeces = (cents, pas) => bar.accions.desaEsborranyTancament((actual) => ({
    perDenominacio: { ...actual.perDenominacio, [cents]: Math.max(0, (actual.perDenominacio[cents] || 0) + pas) }
  }));
  const de = (cents) => esborrany.perDenominacio[cents] || 0;
  const centsDe = (linia) => Number(linia.articleId);
  const peces = bar.establiment.denominacions.reduce((suma, cents) => suma + de(cents), 0);
  /* Sense permís, les peces es miren: cap +, − ni teclat. */
  const compta = bar.permis.potEscriure;
  return (
    <>
      <ColumnaColleccio
        titol="Arqueig"
        linies={bar.establiment.denominacions.map((cents) => ({
          id: `d-${cents}`, articleId: String(cents), quantitat: de(cents), nom: euros(cents), valor: euros(cents * de(cents))
        }))}
        resum={{ etiqueta: 'Comptat', comptador: peces, textComptador: (n) => `${n} peces`, total: euros(comptat),
          accio: { text: 'Continua al resum', onClick: () => ves('tancament', 'resum') } }}
        onSuma={compta ? (linia) => sumaPeces(centsDe(linia), 1) : undefined}
        onResta={compta ? (linia) => sumaPeces(centsDe(linia), -1) : undefined}
        onEdita={compta ? (linia) => { setEditant(centsDe(linia)); setUnitats(de(centsDe(linia))); } : undefined}
        peu={<AvisOperacio />}
        avis={<AvisDeLaColumna />}
      />
      <Dialeg obert={editant !== null} onTanca={() => setEditant(null)} titol={editant !== null ? `Peces de ${euros(editant)}` : 'Peces'}
        accions={<Boto onClick={() => setEditant(null)}>Cancel·la</Boto>}>
        {editant !== null ? (
          <TeclatNumeric mode="quantitat" etiqueta="Peces" valor={unitats} onCanvi={setUnitats} maxim={9999}
            onAccepta={(n) => { posa(editant, n); setEditant(null); }} textAccepta="Desa" />
        ) : null}
      </Dialeg>
    </>
  );
}

function Resum() {
  const { bar, resum, comptat, diferencia } = useTancament();
  const { ves } = useVes();
  return (
    <Columna titol="Resum del tancament"
      eines={<BarraResum etiqueta="Diferència de caixa" comptador={0} textComptador={() => ''} total={euros(diferencia)} textTotal="Diferència"
        accio={{ text: 'Continua al traspàs', onClick: () => ves('tancament', 'traspas') }} />}>
      {diferencia !== 0 ? (
        <Alerta to="avis" viva={false} titol={diferencia > 0 ? 'Sobren diners' : 'Falten diners'}>
          {`Esperat ${euros(resum.efectiuEsperatCents)} · comptat ${euros(comptat)}. Queda a la nota de traspàs.`}
        </Alerta>
      ) : <Alerta to="exit" viva={false}>La caixa quadra.</Alerta>}
      <TaulaResum resum={resum} torn={{ arqueig: { totalCents: comptat }, diferenciaCaixaCents: diferencia }} />
      <p>{`Torn de ${bar.tornActual.obertPer}.`}</p>
    </Columna>
  );
}

function Traspas() {
  const { bar, esborrany, obertes, resum, diferencia } = useTancament();
  const { ves } = useVes();
  const [avis, setAvis] = useState('');
  /* El fons es tecleja en local: cada xifra parteix de l'anterior encara que el disc no haja acabat (BAR-R5). */
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
    <Columna titol="Nota de traspàs">
      <AvisOperacio />
      {ambPagaments.length ? (
        <Alerta to="error" titol="Comandes amb pagaments">Acaba de cobrar-les abans de tancar: el que ja s’ha cobrat és d’este torn.</Alerta>
      ) : null}
      <LiniesColleccio etiqueta="Comandes que passen al torn següent"
        linies={obertes.map((c) => ({ id: c.id, articleId: c.id, nom: nomOrigen(c.origen, bar.sala), valor: euros(totals(c).totalCents) }))}
        buit={<p>Cap comanda oberta passa al torn següent.</p>} />
      <LiniesColleccio etiqueta="Reposició de la nevera"
        linies={reposicio.map((r) => ({ id: r.producteId, articleId: r.producteId, quantitat: r.unitats, nom: r.nom }))}
        buit={<p>Res a reposar.</p>} />
      <LiniesColleccio etiqueta="Incidències que s’afigen soles"
        linies={incidenciesAutomatiques(resum, diferencia).map((inc) => ({ id: inc.tipus, articleId: inc.tipus, nom: inc.detall, valor: euros(inc.importCents) }))}
        buit={<p>Cap incidència.</p>} />
      <LiniesColleccio etiqueta="Avisos per al torn següent"
        linies={esborrany.avisos.map((text, i) => ({ id: `avis-${i}`, articleId: 'avis', nom: text }))}
        onLleva={escriu ? llevaAvis : undefined}
        buit={<p>Cap avís.</p>} />
      <Camp etiqueta="Un avís curt" ajuda="Per exemple: «Falta gel».">
        <CampText value={avis} maxLength={80} onChange={(event) => setAvis(event.target.value)} />
      </Camp>
      <Boto onClick={afigAvis} disabled={!escriu || !avis.trim() || esborrany.avisos.length >= 10}>Afig l’avís</Boto>
      <TeclatNumeric mode="import" etiqueta="Fons que es deixa al calaix" valor={fons} onCanvi={canviaFons} desactivat={!escriu} />
      <Boto varietat="primari" ple onClick={() => ves('tancament', 'confirmar')}>Continua</Boto>
    </Columna>
  );
}

function Confirmar() {
  const { bar, obertes, comptat, diferencia, resum } = useTancament();
  const { ves } = useVes();
  const bloquejat = obertes.some((c) => c.pagaments.length > 0) || !bar.permis.potEscriure;
  const tanca = async () => {
    const r = await bar.accions.tancaTorn();
    if (r.ok) ves('torns', r.valor.id);
  };
  return (
    <Columna titol="Confirma el tancament">
      <AvisOperacio />
      <Alerta to="info" viva={false} titol="Després no es pot desfer">
        El torn es congela: cap venda es pot esborrar ni editar. Les correccions es fan amb devolucions al torn següent.
      </Alerta>
      <Fila gap={2}>
        <p>{`Esperat ${euros(resum.efectiuEsperatCents)}`}</p>
        <p>{`Comptat ${euros(comptat)}`}</p>
        <p>{`Diferència ${euros(diferencia)}`}</p>
        <p>{`${obertes.length} comandes passen`}</p>
      </Fila>
      <Boto varietat="primari" icona={Lock} ple mida="gran" disabled={bloquejat} onClick={tanca}>Tanca el torn</Boto>
    </Columna>
  );
}

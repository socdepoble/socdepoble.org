import { useEffect, useState } from 'react';
import { Alerta, Camp, CampText, GrupCamps, Selector } from '../../../components/PedraSeca/index.js';
import { carregaMercadona, comparaOfertaRural } from '../../plataforma/index.js';

/** El catàleg ampliat es llig només quan es demana la botiga o un producte seu. */
export function useMercadona(necessari) {
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let viu = true;
    if (necessari) carregaMercadona().then((nou) => {
      if (viu) { setDades(nou); setError(false); }
    }, () => { if (viu) setError(true); });
    return () => { viu = false; };
  }, [necessari]);
  return { dades: necessari ? dades : null, error: necessari && error };
}

export function AvisCatalegMercadona({ dades, error }) {
  if (error) return <Alerta to="error" titol="No s’ha pogut obrir el catàleg">Recarrega la pàgina per a tornar-ho a provar. La teua llista continua desada.</Alerta>;
  return (
    <Alerta to="info" viva={false} titol="Catàleg Mercadona">
      {dades ? `${dades.metadades.productes} productes. Preus del tall ${dades.metadades.tall}; poden haver canviat. Les fotografies s’han conservat com a referència de la font.` : 'Obrint els preus del catàleg…'}
    </Alerta>
  );
}

const euros = (centims) => `${(centims / 100).toFixed(2).replace('.', ',')} €`;
const nombre = (text) => /^\d+(?:[.,]\d{1,6})?$/.test(text) ? Number(text.replace(',', '.')) : null;

/** Mateixa quantitat i dimensió; la data i el preu rural els aporta la persona. */
export function ComparadorMercadona({ producte }) {
  const [preu, setPreu] = useState('');
  const [quantitat, setQuantitat] = useState('1');
  const [unitat, setUnitat] = useState(producte.unitatPreuUnitari);
  const [proveidor, setProveidor] = useState('La Torre / Cooperativa');
  const [data, setData] = useState('');
  const p = nombre(preu);
  const q = nombre(quantitat);
  let resultat = null;
  let error = null;
  if (preu || data) {
    if (p === null || !/^\d+(?:[.,]\d{1,2})?$/.test(preu) || !(q > 0) || !data || !proveidor.trim()) {
      error = 'Completa el preu (màxim dos decimals), la quantitat, el proveïdor i la data de l’oferta local.';
    } else {
      try { resultat = comparaOfertaRural(producte, { preuCentims: Math.round(p * 100), quantitat: q, unitat, proveidor, data }); }
      catch (motiu) { error = motiu.message; }
    }
  }
  return (
    <GrupCamps llegenda="Comparador rural">
      <p>Mercadona: {euros(producte.preuUnitariCentims)}/{producte.unitatPreuUnitari}, tall {producte.tall}. Introduïx una oferta local del mateix producte per a comparar-ne la mateixa quantitat.</p>
      <Camp etiqueta="Proveïdor local"><CampText value={proveidor} maxLength={80} onChange={(event) => setProveidor(event.target.value)} /></Camp>
      <Camp etiqueta="Preu de l’oferta local (€)"><CampText value={preu} inputMode="decimal" onChange={(event) => setPreu(event.target.value)} /></Camp>
      <Camp etiqueta="Quantitat de l’oferta"><CampText value={quantitat} inputMode="decimal" onChange={(event) => setQuantitat(event.target.value)} /></Camp>
      <Camp etiqueta="Unitat de l’oferta"><Selector value={unitat} onChange={(event) => setUnitat(event.target.value)} opcions={['g', 'kg', 'ml', 'cl', 'l', 'u'].map((u) => ({ valor: u, etiqueta: u }))} /></Camp>
      <Camp etiqueta="Data de l’oferta local"><CampText tipus="date" value={data} onChange={(event) => setData(event.target.value)} /></Camp>
      {error ? <p role="status">{error}</p> : null}
      {resultat ? <p role="status">{resultat.estat === 'unitats-incompatibles'
        ? 'Les unitats no són comparables. No convertim pes, volum i unitats sense una equivalència acreditada.'
        : `Per a la mateixa quantitat: Mercadona ${euros(resultat.costMercadonaCentims)}, ${resultat.proveidor} ${euros(resultat.preuLocalCentims)}. Diferència local menys Mercadona: ${euros(resultat.diferenciaCentims)}. Oferta local del ${resultat.data}; Mercadona del ${resultat.tallMercadona}.`}</p> : null}
    </GrupCamps>
  );
}

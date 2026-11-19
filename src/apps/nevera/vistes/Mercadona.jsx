import { useEffect, useState } from 'react';
import { Alerta, Camp, CampText, GrupCamps, Selector } from '../../../components/PedraSeca/index.js';
import { carregaMercadona, comparaOfertaRural, useClosaAplicacio } from '../../plataforma/index.js';
import { textosVistaNevera } from '../i18nNevera.js';

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
  const { idioma = 'ca' } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
  if (error) return <Alerta to="error" titol={tx.errorObrirCataleg}>{tx.errorObrirCatalegText}</Alerta>;
  return (
    <Alerta to="info" viva={false} titol={tx.catalegOrientatiuTitol}>
      {dades ? tx.catalegOrientatiuText(dades.metadades.productes, dades.metadades.tall) : tx.obrintPreusOrientatius}
    </Alerta>
  );
}

const euros = (centims) => `${(centims / 100).toFixed(2).replace('.', ',')} €`;
const nombre = (text) => /^\d+(?:[.,]\d{1,6})?$/.test(text) ? Number(text.replace(',', '.')) : null;

/** Mateixa quantitat i dimensió; la data i el preu rural els aporta la persona. */
export function ComparadorMercadona({ producte }) {
  const { idioma = 'ca' } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
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
      error = tx.errorComparador;
    } else {
      try { resultat = comparaOfertaRural(producte, { preuCentims: Math.round(p * 100), quantitat: q, unitat, proveidor, data }); }
      catch (motiu) { error = motiu.message; }
    }
  }
  return (
    <GrupCamps llegenda={tx.comparadorLlegenda}>
      <p>{tx.comparadorIntro(euros(producte.preuUnitariCentims), producte.unitatPreuUnitari)}</p>
      <Camp etiqueta={tx.proveidorLocal}><CampText value={proveidor} maxLength={80} onChange={(event) => setProveidor(event.target.value)} /></Camp>
      <Camp etiqueta={tx.preuOfertaLocal}><CampText value={preu} inputMode="decimal" onChange={(event) => setPreu(event.target.value)} /></Camp>
      <Camp etiqueta={tx.quantitatOferta}><CampText value={quantitat} inputMode="decimal" onChange={(event) => setQuantitat(event.target.value)} /></Camp>
      <Camp etiqueta={tx.unitatOferta}><Selector value={unitat} onChange={(event) => setUnitat(event.target.value)} opcions={['g', 'kg', 'ml', 'cl', 'l', 'u'].map((u) => ({ valor: u, etiqueta: u }))} /></Camp>
      <Camp etiqueta={tx.dataOfertaLocal}><CampText tipus="date" value={data} onChange={(event) => setData(event.target.value)} /></Camp>
      {error ? <p role="status">{error}</p> : null}
      {resultat ? <p role="status">{resultat.estat === 'unitats-incompatibles'
        ? tx.unitatsIncompatibles
        : tx.resultatComparador(euros(resultat.costMercadonaCentims), resultat.proveidor, euros(resultat.preuLocalCentims), euros(resultat.diferenciaCentims), resultat.data)}</p> : null}
    </GrupCamps>
  );
}

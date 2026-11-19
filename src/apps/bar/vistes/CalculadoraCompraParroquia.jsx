import { useState } from 'react';
import { Alerta, Boto, Camp, CampText, Casella, EstatBuit, Fila, GrupCamps, Selector, Taula } from '../../../components/PedraSeca/index.js';
import { carregaCatalegParroquia, costCopaDeTarifaParroquia, ingredientDeTarifaParroquia, tarifesCompraParroquia } from '../../plataforma/index.js';
import { formatEuros, parseEuros } from '../../../utils/diners.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosMercaderies } from '../i18nMercaderies.js';
import { useIdiomaBar } from './punt.js';

const inicial = {
  tarifaId: '', preu: '', unitatsPack: '', quantitatPerUnitat: '', unitat: '', iva: '', regim: '',
  fontPreu: '', zeroConfirmat: false, volumBotella: '', volumCopa: '', minva: ''
};
const decimal = (text) => (/^\d+(?:[.,]\d{1,6})?$/.test(text.trim()) ? Number(text.replace(',', '.')) : undefined);

/** Calculadora de compra i mercaderies sobre files de la font; només escriu amb acció explícita. */
export function CalculadoraCompraParroquia({ producte, variant }) {
  const idioma = useIdiomaBar();
  const tx = textosMercaderies(idioma);
  const { carta, accions, permis } = useBar();
  const [dades, setDades] = useState(null);
  const [carregant, setCarregant] = useState(false);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [camps, setCamps] = useState(inicial);
  const [compra, setCompra] = useState(null);
  const [copa, setCopa] = useState(null);
  const [avis, setAvis] = useState(null);
  const [desat, setDesat] = useState(false);
  const tarifes = dades ? tarifesCompraParroquia(dades) : [];
  const canvia = (changes) => {
    setCamps((actual) => ({ ...actual, ...changes }));
    setCompra(null);
    setCopa(null);
    setAvis(null);
    setDesat(false);
  };
  const triaTarifa = (id, llista = tarifes) => {
    const tarifa = llista.find((t) => t.id === id);
    setCamps({
      ...inicial,
      tarifaId: id,
      preu: Number.isSafeInteger(tarifa?.preuPackCents) ? formatEuros(tarifa.preuPackCents, { simbol: false }) : '',
      unitatsPack: tarifa?.unitatsPack == null ? '' : String(tarifa.unitatsPack)
    });
    setCompra(null);
    setCopa(null);
    setAvis(null);
    setDesat(false);
  };
  const carrega = async () => {
    setCarregant(true);
    setAvis(null);
    setErrorCarrega(false);
    try {
      const source = await carregaCatalegParroquia();
      setDades(source);
      const candidates = tarifesCompraParroquia(source).filter((t) => producte.comptabilitatOrigen?.some((p) => p.full === t.full && p.fila === t.fila));
      if (candidates.length === 1) triaTarifa(candidates[0].id, candidates);
    } catch {
      setErrorCarrega(true);
    } finally {
      setCarregant(false);
    }
  };
  const inputs = () => ({
    dades,
    tarifaId: camps.tarifaId,
    preuPackCents: parseEuros(camps.preu),
    unitatsPack: camps.unitatsPack.trim() === '' ? null : (decimal(camps.unitatsPack) ?? NaN),
    quantitatPerUnitat: decimal(camps.quantitatPerUnitat),
    unitat: camps.unitat,
    ivaPercent: camps.iva === '' ? undefined : Number(camps.iva),
    ivaDeductible: camps.regim === '' ? undefined : camps.regim === 'deduible',
    recarrecEquivalencia: camps.regim === '' ? undefined : camps.regim === 'equivalencia',
    fontPreu: camps.fontPreu,
    zeroConfirmat: camps.zeroConfirmat
  });
  const calculaCompra = () => {
    const result = ingredientDeTarifaParroquia(inputs());
    setCompra(result.estat === 'preparat' ? result : null);
    setAvis(result.estat === 'pendent' ? result.motiu : null);
    setDesat(false);
  };
  const calculaCopa = () => {
    const result = costCopaDeTarifaParroquia({
      ...inputs(),
      volumBotellaCl: decimal(camps.volumBotella),
      volumCopaCl: decimal(camps.volumCopa),
      minvaPercent: decimal(camps.minva)
    });
    setCopa(result.estat === 'preparat' ? result : null);
    setAvis(result.estat === 'pendent' ? result.motiu : null);
    setDesat(false);
  };
  const desaCost = async (tipus) => {
    const result = tipus === 'copa' ? copa?.compra : compra;
    const cost = tipus === 'copa' ? copa?.costCopaCents : compra?.costUnitatCents;
    if (!result || !Number.isSafeInteger(cost)) return;
    const actual = carta.productes.find((p) => p.id === producte.id);
    if (!actual?.variants.some((v) => v.id === variant.id)) {
      setAvis(tx.variantNoEnCarta);
      return;
    }
    const nova = {
      ...carta,
      productes: carta.productes.map((p) => (p.id === actual.id ? {
        ...p,
        variants: p.variants.map((v) => (v.id === variant.id
          ? {
            ...v,
            costCents: cost,
            costConfirmat: true,
            costBaseFiscal: result.costBaseFiscal,
            costEstat: 'revisat',
            fontCost: result.font,
            compraOrigen: tipus === 'copa' ? { tipus, ...copa } : { tipus, compra: result }
          } : v))
      } : p))
    };
    const r = await accions.desaCarta(nova);
    setDesat(r.ok);
  };
  const camp = (key, label) => (
    <Camp etiqueta={label}>
      <CampText inputMode="decimal" value={camps[key]} onChange={(event) => canvia({ [key]: event.target.value })} />
    </Camp>
  );
  const source = tarifes.find((t) => t.id === camps.tarifaId);
  return (
    <GrupCamps llegenda={tx.llegendaCompra}>
      <p>{tx.introCompra}</p>
      {!permis.potEscriure ? <Alerta to="avis" viva={false}>{tx.permisLecturaMercaderies}</Alerta> : null}
      {!dades ? <Fila justify="center"><Boto onClick={carrega} disabled={carregant}>{carregant ? tx.carregantTarifes : tx.obriCalculadora}</Boto></Fila> : null}
      {errorCarrega ? <Alerta to="error">{tx.errorCarregaTarifes}</Alerta> : null}
      {avis ? <Alerta to="info">{avis}</Alerta> : null}
      {desat ? <Alerta to="exit">{tx.exitCostDesat}</Alerta> : null}
      {dades && tarifes.length === 0 ? <EstatBuit titol={tx.triaTarifa}>{tx.senseEscandallManual}</EstatBuit> : null}
      {dades && tarifes.length > 0 ? <>
        <Camp etiqueta={tx.tarifaCompraFont}>
          <Selector value={camps.tarifaId} opcions={[{ valor: '', etiqueta: tx.triaTarifa }, ...tarifes.map((t) => ({ valor: t.id, etiqueta: tx.etiquetaTarifaFila(t.nom, t.full, t.fila) }))]}
            onChange={(event) => triaTarifa(event.target.value)} />
        </Camp>
        {source ? <p>{tx.detallFontTarifa(source.full, source.fila)}</p> : null}
        {camp('preu', tx.preuBasePack)}
        {camp('unitatsPack', tx.unitatsPack)}
        <Camp etiqueta={tx.fontPreuRevisat} ajuda={tx.ajudaFontPreu}>
          <CampText value={camps.fontPreu} maxLength={240} onChange={(event) => canvia({ fontPreu: event.target.value })} />
        </Camp>
        {camps.preu.trim() && parseEuros(camps.preu) === 0 ? <Casella etiqueta={tx.zeroConfirmat} checked={camps.zeroConfirmat} onChange={(event) => canvia({ zeroConfirmat: event.target.checked })} /> : null}
        <Camp etiqueta={tx.ivaCompra}>
          <Selector value={camps.iva} opcions={[{ valor: '', etiqueta: tx.triaTipusRevisat }, ...[4, 10, 21].map((n) => ({ valor: String(n), etiqueta: `${n} %` }))]}
            onChange={(event) => canvia({ iva: event.target.value })} />
        </Camp>
        <Camp etiqueta={tx.regimFiscalCompra}>
          <Selector value={camps.regim} opcions={[{ valor: '', etiqueta: tx.triaRegimRevisat }, { valor: 'deduible', etiqueta: tx.regimDeduible },
            { valor: 'no-deduible', etiqueta: tx.regimNoDeduible }, { valor: 'equivalencia', etiqueta: tx.regimEquivalencia }]}
            onChange={(event) => canvia({ regim: event.target.value })} />
        </Camp>
        {camp('quantitatPerUnitat', tx.contingutUnitat)}
        <Camp etiqueta={tx.unitatContingut}>
          <Selector value={camps.unitat} opcions={[{ valor: '', etiqueta: tx.triaUnitatReal }, ...['g', 'kg', 'ml', 'cl', 'l', 'u'].map((u) => ({ valor: u, etiqueta: u }))]}
            onChange={(event) => canvia({ unitat: event.target.value })} />
        </Camp>
        <Fila justify="center"><Boto onClick={calculaCompra}>{tx.calculaCompra}</Boto></Fila>
        {compra ? <>
          <Taula titol={tx.taulaCostNormalitzat} densa><tbody>
            <tr><th scope="row">{tx.costPackComplet}</th><td>{formatEuros(compra.preuCents)}</td></tr>
            <tr><th scope="row">{tx.contingutTotalPack}</th><td>{`${compra.quantitatCompra} ${compra.unitatCompra}`}</td></tr>
            <tr><th scope="row">{tx.costUnitatComprada}</th><td>{formatEuros(compra.costUnitatCents)}</td></tr>
            <tr><th scope="row">{tx.ivaDeLaCompra}</th><td>{formatEuros(compra.ivaCents)}</td></tr>
            <tr><th scope="row">{tx.recarrecEquivalencia}</th><td>{formatEuros(compra.recarrecCents)}</td></tr>
          </tbody></Taula>
          <p>{tx.notaReceptariPack}</p>
          <Fila justify="center"><Boto disabled={!permis.potEscriure} aria-label={tx.ariaDesaCostUnitat(variant.nom)} onClick={() => desaCost('unitat')}>{tx.desaCostUnitari}</Boto></Fila>
        </> : null}
        <GrupCamps llegenda={tx.llegendaCopaMinva}>
          {camp('volumBotella', tx.volumBotella)}
          {camp('volumCopa', tx.volumCopa)}
          {camp('minva', tx.minvaBeguda)}
          <Fila justify="center"><Boto onClick={calculaCopa}>{tx.calculaCopa}</Boto></Fila>
          {copa ? <>
            <p>{tx.resultatCopa(formatEuros(copa.costCopaCents), copa.minvaPercent)}</p>
            <Fila justify="center"><Boto disabled={!permis.potEscriure} aria-label={tx.ariaDesaCostCopa(variant.nom)} onClick={() => desaCost('copa')}>{tx.desaCostCopa}</Boto></Fila>
          </> : null}
        </GrupCamps>
      </> : null}
    </GrupCamps>
  );
}

import { useState } from 'react';
import { Alerta, Boto, Camp, CampText, Casella, Fila, GrupCamps, Selector, Taula } from '../../../components/PedraSeca/index.js';
import { carregaCatalegParroquia, costCopaDeTarifaParroquia, ingredientDeTarifaParroquia, tarifesCompraParroquia } from '../../plataforma/index.js';
import { formatEuros, parseEuros } from '../../../utils/diners.js';
import { useBar } from '../estat/ProveidorBar.jsx';

const inicial = { tarifaId: '', preu: '', unitatsPack: '', quantitatPerUnitat: '', unitat: '', iva: '', regim: '',
  fontPreu: '', zeroConfirmat: false, volumBotella: '', volumCopa: '', minva: '' };
const decimal = (text) => /^\d+(?:[.,]\d{1,6})?$/.test(text.trim()) ? Number(text.replace(',', '.')) : undefined;

/** A calculator over source rows; a cost reaches the sale variant only after an explicit save action. */
export function CalculadoraCompraParroquia({ producte, variant }) {
  const { carta, accions, permis } = useBar();
  const [dades, setDades] = useState(null);
  const [carregant, setCarregant] = useState(false);
  const [camps, setCamps] = useState(inicial);
  const [compra, setCompra] = useState(null);
  const [copa, setCopa] = useState(null);
  const [avis, setAvis] = useState(null);
  const [desat, setDesat] = useState(false);
  const tarifes = dades ? tarifesCompraParroquia(dades) : [];
  const canvia = (changes) => {
    setCamps((actual) => ({ ...actual, ...changes }));
    setCompra(null); setCopa(null); setAvis(null); setDesat(false);
  };
  const triaTarifa = (id, llista = tarifes) => {
    const tarifa = llista.find((t) => t.id === id);
    setCamps({ ...inicial, tarifaId: id, preu: Number.isSafeInteger(tarifa?.preuPackCents) ? formatEuros(tarifa.preuPackCents, { simbol: false }) : '',
      unitatsPack: tarifa?.unitatsPack == null ? '' : String(tarifa.unitatsPack) });
    setCompra(null); setCopa(null); setAvis(null); setDesat(false);
  };
  const carrega = async () => {
    setCarregant(true); setAvis(null);
    try {
      const source = await carregaCatalegParroquia();
      setDades(source);
      const candidates = tarifesCompraParroquia(source).filter((t) => producte.comptabilitatOrigen?.some((p) => p.full === t.full && p.fila === t.fila));
      if (candidates.length === 1) triaTarifa(candidates[0].id, candidates);
    } catch (error) { setAvis(error.message); }
    finally { setCarregant(false); }
  };
  const inputs = () => ({ dades, tarifaId: camps.tarifaId, preuPackCents: parseEuros(camps.preu), unitatsPack: camps.unitatsPack.trim() === '' ? null : (decimal(camps.unitatsPack) ?? NaN),
    quantitatPerUnitat: decimal(camps.quantitatPerUnitat), unitat: camps.unitat, ivaPercent: camps.iva === '' ? undefined : Number(camps.iva),
    ivaDeductible: camps.regim === '' ? undefined : camps.regim === 'deduible',
    recarrecEquivalencia: camps.regim === '' ? undefined : camps.regim === 'equivalencia',
    fontPreu: camps.fontPreu, zeroConfirmat: camps.zeroConfirmat });
  const calculaCompra = () => {
    const result = ingredientDeTarifaParroquia(inputs());
    setCompra(result.estat === 'preparat' ? result : null); setAvis(result.estat === 'pendent' ? result.motiu : null); setDesat(false);
  };
  const calculaCopa = () => {
    const result = costCopaDeTarifaParroquia({ ...inputs(), volumBotellaCl: decimal(camps.volumBotella), volumCopaCl: decimal(camps.volumCopa), minvaPercent: decimal(camps.minva) });
    setCopa(result.estat === 'preparat' ? result : null); setAvis(result.estat === 'pendent' ? result.motiu : null); setDesat(false);
  };
  const desaCost = async (tipus) => {
    const result = tipus === 'copa' ? copa?.compra : compra;
    const cost = tipus === 'copa' ? copa?.costCopaCents : compra?.costUnitatCents;
    if (!result || !Number.isSafeInteger(cost)) return;
    const actual = carta.productes.find((p) => p.id === producte.id);
    if (!actual?.variants.some((v) => v.id === variant.id)) { setAvis('La variant ja no és a la carta.'); return; }
    const nova = { ...carta, productes: carta.productes.map((p) => p.id === actual.id ? { ...p, variants: p.variants.map((v) => v.id === variant.id
      ? { ...v, costCents: cost, costConfirmat: true, costBaseFiscal: result.costBaseFiscal, costEstat: 'revisat',
        fontCost: result.font, compraOrigen: tipus === 'copa' ? { tipus, ...copa } : { tipus, compra: result } } : v) } : p) };
    const r = await accions.desaCarta(nova);
    setDesat(r.ok);
  };
  const camp = (key, label) => <Camp etiqueta={label}><CampText inputMode="decimal" value={camps[key]} onChange={(event) => canvia({ [key]: event.target.value })} /></Camp>;
  const source = tarifes.find((t) => t.id === camps.tarifaId);
  return (
    <GrupCamps llegenda="Compra i cost de copa · La Parròquia">
      <p>Preus històrics del llibre de compres. Indica el contingut real de cada envàs i el règim fiscal abans de calcular.</p>
      {!dades ? <Fila justify="center"><Boto onClick={carrega} disabled={carregant}>{carregant ? 'Carregant les tarifes…' : 'Obri la calculadora de compres'}</Boto></Fila> : null}
      {avis ? <Alerta to="info">{avis}</Alerta> : null}
      {desat ? <Alerta to="exit">Cost normalitzat desat en la variant. Les comandes anteriors no canvien.</Alerta> : null}
      {dades ? <>
        <Camp etiqueta="Tarifa de compra de la font">
          <Selector value={camps.tarifaId} opcions={[{ valor: '', etiqueta: 'Tria una tarifa' }, ...tarifes.map((t) => ({ valor: t.id, etiqueta: `${t.nom} · ${t.full}, fila ${t.fila}` }))]}
            onChange={(event) => triaTarifa(event.target.value)} />
        </Camp>
        {source ? <p>{`Font: ${source.full}, fila ${source.fila}. El preu base del pack i les unitats són els originals del full; el volum no s’inferix de la columna cl.`}</p> : null}
        {camp('preu', 'Preu base del pack (€)')}
        {camp('unitatsPack', 'Unitats del pack')}
        <Camp etiqueta="Font del preu revisat" ajuda="Obligatòria si canvies el preu original. Indica document o proveïdor i data.">
          <CampText value={camps.fontPreu} maxLength={240} onChange={(event) => canvia({ fontPreu: event.target.value })} />
        </Camp>
        {camps.preu.trim() && parseEuros(camps.preu) === 0 ? <Casella etiqueta="He comprovat expressament el preu zero" checked={camps.zeroConfirmat} onChange={(event) => canvia({ zeroConfirmat: event.target.checked })} /> : null}
        <Camp etiqueta="IVA de compra">
          <Selector value={camps.iva} opcions={[{ valor: '', etiqueta: 'Tria el tipus revisat' }, ...[4, 10, 21].map((n) => ({ valor: String(n), etiqueta: `${n} %` }))]}
            onChange={(event) => canvia({ iva: event.target.value })} />
        </Camp>
        <Camp etiqueta="Règim fiscal de la compra">
          <Selector value={camps.regim} opcions={[{ valor: '', etiqueta: 'Tria el règim revisat' }, { valor: 'deduible', etiqueta: 'IVA deduïble, sense recàrrec' },
            { valor: 'no-deduible', etiqueta: 'IVA no deduïble, sense recàrrec' }, { valor: 'equivalencia', etiqueta: 'IVA no deduïble i recàrrec d’equivalència' }]}
            onChange={(event) => canvia({ regim: event.target.value })} />
        </Camp>
        {camp('quantitatPerUnitat', 'Contingut d’una unitat comprada')}
        <Camp etiqueta="Unitat del contingut">
          <Selector value={camps.unitat} opcions={[{ valor: '', etiqueta: 'Tria la unitat real' }, ...['g', 'kg', 'ml', 'cl', 'l', 'u'].map((u) => ({ valor: u, etiqueta: u }))]}
            onChange={(event) => canvia({ unitat: event.target.value })} />
        </Camp>
        <Fila justify="center"><Boto onClick={calculaCompra}>Calcula la compra</Boto></Fila>
        {compra ? <>
          <Taula titol="Cost normalitzat de compra" densa><tbody>
            <tr><th scope="row">Cost del pack complet</th><td>{formatEuros(compra.preuCents)}</td></tr>
            <tr><th scope="row">Contingut total del pack</th><td>{`${compra.quantitatCompra} ${compra.unitatCompra}`}</td></tr>
            <tr><th scope="row">Cost d’una unitat comprada</th><td>{formatEuros(compra.costUnitatCents)}</td></tr>
            <tr><th scope="row">IVA de la compra</th><td>{formatEuros(compra.ivaCents)}</td></tr>
            <tr><th scope="row">Recàrrec d’equivalència</th><td>{formatEuros(compra.recarrecCents)}</td></tr>
          </tbody></Taula>
          <p>El receptari conserva el preu i la quantitat del pack complet, sense arrodonir primer el cost d’un envàs.</p>
          <Fila justify="center"><Boto disabled={!permis.potEscriure} aria-label={`Desa el cost d’una unitat comprada en «${variant.nom}»`} onClick={() => desaCost('unitat')}>Desa cost unitari</Boto></Fila>
        </> : null}
        <GrupCamps llegenda="Cost d’una copa amb minva">
          {camp('volumBotella', 'Volum real de la botella (cl)')}
          {camp('volumCopa', 'Volum servit per copa (cl)')}
          {camp('minva', 'Minva de la beguda (%)')}
          <Fila justify="center"><Boto onClick={calculaCopa}>Calcula el cost de la copa</Boto></Fila>
          {copa ? <>
            <p>{`Cost normalitzat de la copa: ${formatEuros(copa.costCopaCents)}. Minva: ${copa.minvaPercent} %.`}</p>
            <Fila justify="center"><Boto disabled={!permis.potEscriure} aria-label={`Desa el cost de copa en «${variant.nom}»`} onClick={() => desaCost('copa')}>Desa cost de copa</Boto></Fila>
          </> : null}
        </GrupCamps>
      </> : null}
    </GrupCamps>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { Accions, Alerta, AreaText, Boto, Camp, CampText, Pila, Selector } from '../../components/PedraSeca/index.js';
import { useAppAvaluada } from '../../apps/plataforma/PlataformaContext.jsx';
import { textDelMotiu } from '../../apps/plataforma/PortalApps.jsx';
import { carregaMercadona } from '../../data/menjarIBeure/mercadona.js';
import { candidatsCulturals, carregaConnexionsCulturals, creaEsborranyTrasllat, escandallRecepta, mesuraIngredient } from '../../data/menjarIBeure/horitzontal.js';
import { NOMS_ALERGENS } from '../../data/menjarIBeure/allergens.js';
import { carregaCatalegParroquia, catalegParroquiaDisponible } from '../../data/menjarIBeure/parroquia.js';
import { tarifesCompraParroquia } from '../../data/menjarIBeure/compresParroquia.js';
import { adaptaReceptaEditorial } from '../../data/menjarIBeure/receptaEditorial.js';

const racionsValides = valor => Number.isSafeInteger(valor) && valor >= 1 && valor <= 10000;
const lligRacions = valor => valor === '' ? null : Number(valor);
const euros = (c) => c == null ? 'Pendent' : `${(c / 100).toFixed(2).replace('.', ',')} €`;
const unitats = ['g', 'kg', 'ml', 'cl', 'l', 'u'].map((valor) => ({ valor, etiqueta: valor }));

/** Onada R15 (P1-02) · L'entrada des de /receptes/:slug: la fitxa del llibre i la seua obra. L'adaptació per al
 * càlcul viatja amb el motor, en el tros diferit, i no al de la pàgina pública. */
export function MotorDeReceptaEditorial({ recepta, obra }) {
  const receptaDeTreball = useMemo(() => adaptaReceptaEditorial(recepta, obra), [recepta, obra]);
  return <MotorHoritzontalRecepta recepta={receptaDeTreball} />;
}

/** Optional working layer; the book record is never edited or persisted here. */
export default function MotorHoritzontalRecepta({ recepta }) {
  const navigate = useNavigate();
  const nevera = useAppAvaluada('nevera'), bar = useAppAvaluada('bar');
  const neveraDisponible = nevera?.estat === 'available', barDisponible = bar?.estat === 'available';
  const [ingredients, setIngredients] = useState(recepta.ingredients);
  const [textIngredients, setTextIngredients] = useState(recepta.ingredients.join('\n'));
  const receptaDeTreball = useMemo(() => ({ ...recepta, ingredients }), [recepta, ingredients]);
  const [productes, setProductes] = useState([]);
  const [cultura, setCultura] = useState(null);
  const [error, setError] = useState('');
  const [racions, setRacions] = useState(null);
  const [racionsBase, setRacionsBase] = useState(null);
  const [seleccions, setSeleccions] = useState({});
  const [cerca, setCerca] = useState('');
  const [compresParroquia, setCompresParroquia] = useState(null);
  useEffect(() => {
    let actiu = true;
    Promise.all([carregaMercadona(), carregaConnexionsCulturals()]).then(([cat, cult]) => {
      if (actiu) { setProductes(cat.productes); setCultura(cult); }
    }).catch(() => { if (actiu) setError('No s’han pogut carregar les fonts. Torna a obrir la recepta.'); });
    return () => { actiu = false; };
  }, []);
  const racionsConfirmades = racionsValides(racions) && racionsValides(racionsBase);
  const resultat = useMemo(() => racionsConfirmades ? escandallRecepta(receptaDeTreball, { racions, racionsBase, seleccions, productes, compresParroquia }) : null, [receptaDeTreball, racions, racionsBase, seleccions, productes, compresParroquia, racionsConfirmades]);
  const tarifes = useMemo(() => tarifesCompraParroquia(compresParroquia), [compresParroquia]);
  const connexions = useMemo(() => candidatsCulturals(ingredients, cultura || {}), [ingredients, cultura]);
  const actualitza = (index, camp, valor) => setSeleccions((prev) => ({ ...prev, [index]: { ...prev[index], [camp]: valor } }));
  const actualitzaOferta = (index, camp, valor) => setSeleccions((prev) => ({ ...prev, [index]: { ...prev[index], oferta: { ...prev[index]?.oferta, [camp]: valor } } }));
  const actualitzaCompra = (index, camp, valor) => setSeleccions((prev) => ({ ...prev, [index]: { ...prev[index], compraParroquia: { ...prev[index]?.compraParroquia, [camp]: valor } } }));
  const opcionsProductes = [{ valor: '', etiqueta: 'Tria el producte que usaràs' }, { valor: 'oferta-local', etiqueta: 'Pressupost de La Torre, cooperativa o altre proveïdor' }, ...(catalegParroquiaDisponible() ? [{ valor: 'compra-parroquia', etiqueta: 'Compra històrica de La Parròquia' }] : []), ...productes.filter((p) => `${p.nom} ${p.marca}`.toLocaleLowerCase('ca').includes(cerca.toLocaleLowerCase('ca'))).map((p) => ({ valor: p.id, etiqueta: `${p.nom} · ${p.marca} · ${p.preuUnitari} €/ ${p.unitatPreuUnitari}` }))];
  return <section aria-label="Escandall i connexions de la recepta">
    <Pila gap={4}>
      <h2>Escandall de la recepta</h2>
      <p>Tria un producte per a cada ingredient, confirma la quantitat i indica la minva. Els preus de Mercadona són els del full de compra de 2026-10-03.</p>
      <p>Cost de compra domèstica amb impostos inclosos.{barDisponible && ' Per al marge empresarial usa els escandalls del Bar i confirma la base fiscal de la compra.'}</p>
      <p>Indica les racions originals i les que vols preparar abans de calcular. El llibre no les fixa per a totes les receptes.</p>
      {error && <Alerta to="error">{error}</Alerta>}
      <details><summary>Revisa o desglossa els ingredients</summary><Pila gap={3}>
        <p>Una línia per ingredient. Si el text original n’ajunta diversos, separa’ls i conserva les quantitats de la font. Canviar la llista descarta les seleccions de producte anteriors.</p>
        <Camp etiqueta="Ingredients de treball, un per línia"><AreaText value={textIngredients} maxLength={6000} onChange={(e) => setTextIngredients(e.target.value)} /></Camp>
        <Accions><Boto disabled={!textIngredients.trim()} onClick={() => { setIngredients(textIngredients.split('\n').map((x) => x.trim()).filter(Boolean)); setSeleccions({}); }}>Actualitza els ingredients</Boto></Accions>
      </Pila></details>
      <Camp etiqueta="Racions de la recepta original"><CampText tipus="number" min="1" max="10000" value={racionsBase ?? ''} onChange={(e) => setRacionsBase(lligRacions(e.target.value))} /></Camp>
      <Camp etiqueta="Racions que vols preparar"><CampText tipus="number" min="1" max="10000" value={racions ?? ''} onChange={(e) => setRacions(lligRacions(e.target.value))} /></Camp>
      <Camp etiqueta="Busca productes al catàleg de Mercadona"><CampText value={cerca} onChange={(e) => setCerca(e.target.value)} /></Camp>
      {ingredients.map((text, index) => {
        const mesura = mesuraIngredient(text), choice = seleccions[index] || {};
        const selected = productes.find((p) => p.id === choice.producteId);
        const opts = selected && !opcionsProductes.some((o) => o.valor === selected.id) ? [...opcionsProductes, { valor: selected.id, etiqueta: selected.nom }] : opcionsProductes;
        return <details key={index}><summary>{text} · {euros(resultat?.linies[index]?.costCents)}</summary><Pila gap={3}>
          <Camp etiqueta={`Producte per a ${text}`}><Selector value={choice.producteId || ''} opcions={opts} onChange={(e) => actualitza(index, 'producteId', e.target.value)} /></Camp>
          {mesura.compost && <p>Esta línia ajunta diversos ingredients. Desglossa-la abans de calcular el total.</p>}
          {choice.producteId === 'compra-parroquia' && <>
            <p>Confirma el producte, el contingut real de cada unitat i l’IVA de compra. Ací es calcula el cost final amb impostos, sense deduccions; els PVP de la carta no es tracten com a costos d’ingredients.</p>
            {!compresParroquia ? <Accions><Boto onClick={() => carregaCatalegParroquia().then(setCompresParroquia).catch((e) => setError(e.message))}>Carrega les compres de La Parròquia</Boto></Accions> : null}
            <Camp etiqueta={`Tarifa de compra per a ${text}`}><Selector value={choice.compraParroquia?.tarifaId || ''} opcions={[{ valor: '', etiqueta: 'Tria el full i el producte de compra' }, ...tarifes.map((t) => ({ valor: t.id, etiqueta: `${t.nom} · ${t.full} · fila ${t.fila}` }))]} onChange={(e) => actualitzaCompra(index, 'tarifaId', e.target.value)} /></Camp>
            <Camp etiqueta={`Contingut per unitat del pack de ${text}`}><CampText tipus="number" min="0.000001" step="any" value={choice.compraParroquia?.quantitatPerUnitat ?? ''} onChange={(e) => actualitzaCompra(index, 'quantitatPerUnitat', e.target.value === '' ? null : Number(e.target.value))} /></Camp>
            <Camp etiqueta={`Unitat del contingut del pack de ${text}`}><Selector value={choice.compraParroquia?.unitat || ''} opcions={[{ valor: '', etiqueta: 'Indica la unitat real' }, ...unitats]} onChange={(e) => actualitzaCompra(index, 'unitat', e.target.value)} /></Camp>
            <Camp etiqueta={`IVA de compra del pack de ${text}`}><Selector value={choice.compraParroquia?.ivaPercent ?? ''} opcions={[{ valor: '', etiqueta: 'Confirma l’IVA de compra' }, ...[4, 10, 21].map((v) => ({ valor: v, etiqueta: `${v} %` }))]} onChange={(e) => actualitzaCompra(index, 'ivaPercent', e.target.value === '' ? null : Number(e.target.value))} /></Camp>
            <Camp etiqueta={`Recàrrec d’equivalència del pack de ${text}`}><Selector value={choice.compraParroquia?.recarrecEquivalencia == null ? '' : String(choice.compraParroquia.recarrecEquivalencia)} opcions={[{ valor: '', etiqueta: 'Confirma el règim de compra' }, { valor: 'false', etiqueta: 'Sense recàrrec' }, { valor: 'true', etiqueta: 'Amb recàrrec d’equivalència' }]} onChange={(e) => actualitzaCompra(index, 'recarrecEquivalencia', e.target.value === '' ? null : e.target.value === 'true')} /></Camp>
          </>}
          {choice.producteId === 'oferta-local' && <>
            <Camp etiqueta={`Proveïdor de ${text}`}><CampText value={choice.oferta?.proveidor || ''} onChange={(e) => actualitzaOferta(index, 'proveidor', e.target.value)} /></Camp>
            <Camp etiqueta={`Referència del pressupost de ${text}`}><CampText value={choice.oferta?.referencia || ''} onChange={(e) => actualitzaOferta(index, 'referencia', e.target.value)} /></Camp>
            <Camp etiqueta={`Data del pressupost de ${text}`}><CampText tipus="date" value={choice.oferta?.data || ''} onChange={(e) => actualitzaOferta(index, 'data', e.target.value)} /></Camp>
            <Camp etiqueta={`Preu amb impostos per kg, litre o unitat de ${text} (€)`}><CampText tipus="number" min="0" step="0.01" value={choice.oferta?.preuUnitariCentims == null ? '' : choice.oferta.preuUnitariCentims / 100} onChange={(e) => actualitzaOferta(index, 'preuUnitariCentims', e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))} /></Camp>
            <Camp etiqueta={`Unitat del preu de ${text}`}><Selector value={choice.oferta?.unitatPreuUnitari || ''} opcions={[{ valor: '', etiqueta: 'Tria kg, litre o unitat' }, ...unitats.filter((u) => ['kg', 'l', 'u'].includes(u.valor))]} onChange={(e) => actualitzaOferta(index, 'unitatPreuUnitari', e.target.value)} /></Camp>
            <Camp etiqueta={`Base fiscal del pressupost de ${text}`}><Selector value={choice.oferta?.baseFiscal || ''} opcions={[{ valor: '', etiqueta: 'Confirma el tractament del preu' }, { valor: 'cost-final-no-deduible', etiqueta: 'Cost final amb impostos, sense deduccions' }]} onChange={(e) => actualitzaOferta(index, 'baseFiscal', e.target.value)} /></Camp>
          </>}
          <Camp etiqueta={`Quantitat original de ${text}`}><CampText tipus="number" min="0" max="1000000" step="any" value={(Object.hasOwn(choice, 'quantitat') ? choice.quantitat : mesura.quantitat) ?? ''} onChange={(e) => actualitza(index, 'quantitat', e.target.value === '' ? null : Number(e.target.value))} /></Camp>
          <Camp etiqueta={`Unitat de ${text}`}><Selector value={choice.unitat ?? mesura.unitat ?? ''} opcions={[{ valor: '', etiqueta: 'Indica la unitat' }, ...unitats]} onChange={(e) => actualitza(index, 'unitat', e.target.value)} /></Camp>
          <Camp etiqueta={`Minva en percentatge de ${text}`}><CampText tipus="number" min="0" max="99.999999" step="any" value={choice.minvaPercent ?? ''} onChange={(e) => actualitza(index, 'minvaPercent', e.target.value === '' ? null : Number(e.target.value))} /></Camp>
          {resultat?.linies[index]?.motiu && <p>{resultat?.linies[index].motiu}</p>}
        </Pila></details>;
      })}
      <p role="status">{!racionsConfirmades ? 'Confirma les racions originals i les que vols preparar; el cost encara no està calculat.' : !ingredients.length ? 'La transcripció dels ingredients està pendent; encara no es pot calcular cap cost total.' : resultat.estat === 'complet' ? `Cost total: ${euros(resultat.costTotalCents)}. Cost per ració: ${euros(resultat.costRacioCents)}.` : `Subtotal conegut: ${euros(resultat.costParcialCents)}. ${resultat.pendents} ingredients pendents; el cost total encara no es pot calcular.`}</p>
      <h3>Al·lèrgens</h3>
      {!resultat && <p>Sense revisar: les seleccions de producte encara no formen una revisió de la recepta.</p>}
      <p>• Ingredient · T Traça · ? Sense revisar. Cal revisar les etiquetes dels productes i la preparació del plat.</p>
      <ul>{Object.entries(resultat?.alergens || {}).map(([id, cell]) => <li key={id}>{cell.simbol} {NOMS_ALERGENS[id]}: {({ ingredient: 'ingredient declarat', traca: 'traça declarada', absent: 'absència revisada', desconegut: 'sense revisar' })[cell.estat]}</li>)}</ul>
      <Accions><Boto disabled={!neveraDisponible || !racionsConfirmades || !ingredients.length} onClick={() => { if (!neveraDisponible) return; try { const draft = creaEsborranyTrasllat(receptaDeTreball, { racions, racionsBase, seleccions }); navigate(`/app/nevera/llista/casa?recepta=${encodeURIComponent(recepta.slug)}&racions=${racions}`, { state: { trasllatRecepta: draft } }); } catch (e) { setError(e.message); } }}>Prepara la compra al Rebost</Boto>{barDisponible && <Link className="sdp-boto sdp-boto--secundari" to="/app/bar/escandalls">Obri els escandalls d’El Bar</Link>}</Accions>
      {!neveraDisponible && <p>La compra al Rebost no està disponible ací. {textDelMotiu(nevera?.motiu || 'no-compilada')} Pots continuar calculant el cost de la recepta.</p>}
      <h3>Llavors i herbari</h3>
      <p>Les coincidències de noms són pistes per a consultar les fonts. No acrediten identitat botànica ni comestibilitat.</p>
      <p>{connexions.llavors.length} varietats i {connexions.plantes.length} plantes per revisar.</p>
      <ul>{[...connexions.llavors, ...connexions.plantes].map((x) => <li key={x.id}>{x.nom} · {x.id} · {x.motiu}</li>)}</ul>
      <Accions><Link className="sdp-boto sdp-boto--secundari" to="/page/banc-de-llavors">Consulta el Banc de Llavors</Link><Link className="sdp-boto sdp-boto--secundari" to="/page/herbari">Consulta l’Herbari</Link></Accions>
    </Pila>
  </section>;
}

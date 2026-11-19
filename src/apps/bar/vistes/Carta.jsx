/**
 * El Bar · vistes/Carta.jsx — la carta: productes, categories, modificadors,
 * escandalls i ingredients (disseny del Bar §A.7 i §A.9), sempre amb les
 * columnes de l'ESQUELET COMÚ i paritat en les 5 llengües oficials.
 */
import { useState } from 'react';
import { Calculator, Coffee } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, EstatBuit, GrupCamps, Interruptor, OrdenaCategories, Selector, Taula,
  mouCategoria
} from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { formatEuros, parseEuros } from '../../../utils/diners.js';
import { canalsDe } from '../../../utils/productes/producteUniversal.js';
import { fiscalVenda, useInterruptorsApp } from '../../plataforma/index.js';
import { ALERGENS, ivaDe, validaCataleg, variantDe } from '../nucli/cataleg.js';
import { MICRO_PER_CENT, costDeVenda, costEscandall, costUnitariMicro, foodCostPermil, pvpSuggerit, textPermil } from '../nucli/escandall.js';
import { mitjaAmunt } from '../nucli/comu.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textProductesBar, textosUiBar } from '../i18nBar.js';
import { nomAlergen, textosMercaderies } from '../i18nMercaderies.js';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useIdiomaBar, useVes } from './punt.js';
import { articlesDeCarta, categoriesVestides, euros } from './vestits.js';
import { CalculadoraCompraParroquia } from './CalculadoraCompraParroquia.jsx';

const ambEuros = (cents) => formatEuros(cents, { simbol: false });
const BASES_COST_NORMALITZAT = Object.freeze(['base-cost-deduccions', 'cost-final-no-deduible']);
const baseDeCost = (variant) => variant?.costBaseFiscal || 'desconegut';
const costNormalitzat = (variant, costCents) => costCents !== null && BASES_COST_NORMALITZAT.includes(baseDeCost(variant))
  && (costCents !== 0 || variant?.costConfirmat === true);
const teFontAlergens = (producte) => typeof producte?.fontAlergens === 'string' && Boolean(producte.fontAlergens.trim());

export function ProductesCarta({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.productes} ambTorn={false} avis="estret">
      <Productes params={params} idioma={idioma} />
    </Preparat>
  );
}

function Productes({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta, establiment } = useBar();
  const { ves } = useVes();
  return (
    <ColumnaCataleg titol={tx.productes} categories={categoriesVestides(carta)} vistaPerDefecte="llista"
      articles={articlesDeCarta(carta, { establiment, ambInactius: true, idioma })}
      textosEstat={{ desactivat: tx.noActiu }} textArticles={(n) => textProductesBar(n, idioma)} onTria={(article) => ves('productes', article.id)}
      avis={<AvisDeLaColumna />} />
  );
}

export function TriaProducte() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Columna titol={tx.producteTitol} avis={<AvisSessio />}>
      <EstatBuit icona={Coffee} titol={tx.triaProducteTitol}>{tx.triaProducteCartaText}</EstatBuit>
    </Columna>
  );
}

export function EditorProducte({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.producteTitol} ambTorn={false}>
      <Editor params={params} idioma={idioma} />
    </Preparat>
  );
}

function Editor({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta } = useBar();
  const producte = carta.productes.find((p) => p.id === params.producte) || null;
  if (!producte) return <NoTrobat text={tx.producteNoACarta} torna={{ etiqueta: tx.vesAlsProductes, trams: ['productes'] }} />;
  return <FormulariProducte key={producte.id} producte={producte} idioma={idioma} />;
}

function FormulariProducte({ producte, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const tm = textosMercaderies(idioma);
  const { carta, accions, permis } = useBar();
  const [esborrany, setEsborrany] = useState(() => {
    const ambFont = teFontAlergens(producte);
    return {
      ...structuredClone(producte),
      alergens: ambFont ? [...producte.alergens] : [],
      tracesAlergens: ambFont ? [...(producte.tracesAlergens || [])] : [],
      alergensAbsents: ambFont ? [...(producte.alergensAbsents || [])] : [],
      fontAlergens: ambFont ? producte.fontAlergens.trim() : '',
      novaFontAlergens: '',
      alergensCanviats: false,
      ...(!ambFont && [producte.alergens, producte.tracesAlergens, producte.alergensAbsents].some((ids) => ids?.length)
        ? { alergensOrigenNoVerificats: { ingredients: producte.alergens, traces: producte.tracesAlergens || [], absents: producte.alergensAbsents || [] } } : {}),
      preus: producte.variants.map((v) => ambEuros(v.preuCents)),
      costos: producte.variants.map((v) => (Number.isSafeInteger(v.costCents) && (v.costCents !== 0 || v.costConfirmat === true) ? ambEuros(v.costCents) : ''))
    };
  });
  const [errors, setErrors] = useState([]);
  const [desat, setDesat] = useState(false);
  const canvia = (canvis) => {
    setDesat(false);
    setEsborrany((actual) => ({ ...actual, ...canvis }));
  };
  const desa = async () => {
    const preus = esborrany.preus.map((text) => parseEuros(text));
    if (preus.some((cents) => cents === null || cents < 0)) {
      setErrors([tx.errorPreuNoLlegible]);
      return;
    }
    const costos = esborrany.costos.map((text) => (text.trim() === '' ? undefined : parseEuros(text)));
    if (costos.some((cents) => cents === null || cents < 0)) {
      setErrors([tx.errorCostNoLlegible]);
      return;
    }
    const fontAlergens = esborrany.novaFontAlergens.trim() || (esborrany.alergensCanviats ? '' : esborrany.fontAlergens);
    const declaraAlergens = [esborrany.alergens, esborrany.tracesAlergens, esborrany.alergensAbsents].some((ids) => ids.length);
    if (declaraAlergens && !fontAlergens) {
      setErrors([tx.errorFontAlergens]);
      return;
    }
    const nou = {
      ...esborrany,
      fontAlergens,
      exemple: false,
      variants: esborrany.variants.map((v, i) => {
        const variant = { ...v, preuCents: preus[i] };
        if (costos[i] === undefined) {
          delete variant.costCents;
          variant.costConfirmat = false;
          variant.costBaseFiscal = 'desconegut';
        } else {
          variant.costCents = costos[i];
          variant.costConfirmat = true;
          variant.costBaseFiscal = baseDeCost(v);
        }
        if (v.costEstat !== undefined) variant.costEstat = costos[i] === undefined ? 'pendent' : 'revisat';
        return variant;
      })
    };
    delete nou.preus;
    delete nou.costos;
    delete nou.novaFontAlergens;
    delete nou.alergensCanviats;
    const novaCarta = { ...carta, productes: carta.productes.map((p) => (p.id === nou.id ? nou : p)) };
    const validacio = validaCataleg(novaCarta);
    if (!validacio.ok) {
      setErrors(validacio.errors.slice(0, 3));
      return;
    }
    setErrors([]);
    const r = await accions.desaCarta(novaCarta);
    if (r.ok) setEsborrany((actual) => ({ ...actual, ...nou, fontAlergens, novaFontAlergens: '', alergensCanviats: false }));
    setDesat(r.ok);
  };
  return (
    <Columna titol={producte.nom} torna={{ etiqueta: tx.tornaAlsProductes, trams: ['productes'] }}>
      <AvisOperacio />
      {producte.exemple ? <Alerta to="info" viva={false}>{tx.avisPreuExemple}</Alerta> : null}
      {producte.font?.cataleg === 'la-parroquia' ? <Alerta to="info" viva={false}>{tx.avisCartaHistorica}</Alerta> : null}
      {errors.length ? <Alerta to="error">{errors.join(' · ')}</Alerta> : null}
      {desat ? <Alerta to="exit">{tx.desatComandesNoCanvien}</Alerta> : null}
      <Camp etiqueta={tx.nomEtiqueta}>
        <CampText value={esborrany.nom} maxLength={60} onChange={(event) => canvia({ nom: event.target.value })} />
      </Camp>
      <Camp etiqueta={tx.categoriaEtiqueta}>
        <Selector opcions={carta.categories.map((c) => ({ valor: c.id, etiqueta: c.nom }))} value={esborrany.categoriaId}
          onChange={(event) => canvia({ categoriaId: event.target.value })} />
      </Camp>
      {esborrany.variants.map((v, i) => (
        <GrupCamps key={v.id} llegenda={tx.variantLlegenda(v.nom)}>
          {v.ref ? <p>{`REF: ${v.ref}`}</p> : null}
          <Camp etiqueta={tx.nomVariant}>
            <CampText value={v.nom} maxLength={40}
              onChange={(event) => canvia({ variants: esborrany.variants.map((x, j) => (j === i ? { ...x, nom: event.target.value } : x)) })} />
          </Camp>
          <Camp etiqueta={tx.preuAmbIva}>
            <CampText inputMode="decimal" value={esborrany.preus[i]}
              onChange={(event) => canvia({ preus: esborrany.preus.map((p, j) => (j === i ? event.target.value : p)) })} />
          </Camp>
          <Camp etiqueta={tx.costVariant} ajuda={tx.ajudaCostVariant}>
            <CampText inputMode="decimal" value={esborrany.costos[i]}
              onChange={(event) => canvia({
                costos: esborrany.costos.map((cost, j) => (j === i ? event.target.value : cost)),
                variants: esborrany.variants.map((x, j) => (j === i ? { ...x, costBaseFiscal: 'desconegut' } : x))
              })} />
          </Camp>
          <Camp etiqueta={tm.baseFiscalCost} ajuda={tx.ajudaBaseFiscal}>
            <Selector value={baseDeCost(v)} opcions={[
              { valor: 'desconegut', etiqueta: tm.pendentNormalitzar },
              { valor: 'base-cost-deduccions', etiqueta: tm.costSenseIvaDeduible },
              { valor: 'cost-final-no-deduible', etiqueta: tm.costFinalNoDeduible }
            ]} onChange={(event) => canvia({ variants: esborrany.variants.map((x, j) => (j === i ? { ...x, costBaseFiscal: event.target.value } : x)) })} />
          </Camp>
        </GrupCamps>
      ))}
      <Interruptor etiqueta={tx.actiuACaixa} actiu={esborrany.actiu} onCanvi={(actiu) => canvia({ actiu })} />
      <Interruptor etiqueta={tx.vaReposicioNevera} actiu={esborrany.reposaNevera} onCanvi={(reposaNevera) => canvia({ reposaNevera })} />
      <Interruptor etiqueta={tx.preuObertInterruptor} actiu={esborrany.preuObert} onCanvi={(preuObert) => canvia({ preuObert })} />
      <Interruptor etiqueta={tx.aCartaDigital} actiu={canalsDe(esborrany).cartaDigital}
        onCanvi={(cartaDigital) => canvia({ canals: { ...canalsDe(esborrany), cartaDigital } })} />
      <Interruptor etiqueta={tx.perEmportar} actiu={canalsDe(esborrany).perEmportar}
        onCanvi={(perEmportar) => canvia({ canals: { ...canalsDe(esborrany), perEmportar } })} />
      {producte.grupsModificadorsPendents?.length ? <p>{tx.grupsPendentsFont(producte.grupsModificadorsPendents.join(', '))}</p> : null}
      <GrupCamps llegenda={tx.llegendaAlergensBar}>
        <p>{tx.ajudaSimbolsAlergens}</p>
        {esborrany.alergensOrigenNoVerificats ? <Alerta to="info" viva={false}>{tx.anotacionsSenseFont}</Alerta> : null}
        {esborrany.fontAlergens && !esborrany.alergensCanviats ? <p>{tx.fontVigent(esborrany.fontAlergens)}</p> : null}
        <Camp etiqueta={tx.fontDeclaracioAlergens} ajuda={tx.ajudaFontDeclaracio}>
          <CampText value={esborrany.novaFontAlergens} maxLength={240} onChange={(event) => canvia({ novaFontAlergens: event.target.value })} />
        </Camp>
        {ALERGENS.map((a) => (
          <Camp key={a} etiqueta={nomAlergen(a, idioma)}>
            <Selector value={esborrany.alergens.includes(a) ? 'ingredient' : (esborrany.tracesAlergens || []).includes(a) ? 'traca' : (esborrany.alergensAbsents || []).includes(a) ? 'absent' : 'pendent'}
              opcions={[
                { valor: 'pendent', etiqueta: tx.alergenPendent },
                { valor: 'ingredient', etiqueta: tx.alergenIngredient },
                { valor: 'traca', etiqueta: tx.alergenTraca },
                { valor: 'absent', etiqueta: tx.alergenAbsent }
              ]}
              onChange={(event) => {
                const estat = event.target.value;
                canvia({
                  alergens: [...esborrany.alergens.filter((id) => id !== a), ...(estat === 'ingredient' ? [a] : [])],
                  tracesAlergens: [...(esborrany.tracesAlergens || []).filter((id) => id !== a), ...(estat === 'traca' ? [a] : [])],
                  alergensAbsents: [...(esborrany.alergensAbsents || []).filter((id) => id !== a), ...(estat === 'absent' ? [a] : [])],
                  alergensEstat: 'revisio_manual',
                  fontAlergens: '',
                  alergensCanviats: true
                });
              }} />
          </Camp>
        ))}
      </GrupCamps>
      <Boto varietat="primari" ple disabled={!permis.potEscriure} onClick={desa}>{tx.desaProducte}</Boto>
    </Columna>
  );
}

export function CategoriesCarta() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.categoriesTitol} ambTorn={false}>
      <Categories idioma={idioma} />
    </Preparat>
  );
}

function Categories({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta, accions, permis } = useBar();
  const desa = (categories) => accions.desaCarta({ ...carta, categories });
  const ordena = permis.potEscriure;
  return (
    <Columna titol={tx.categoriesTitol}>
      <AvisOperacio />
      <p>{tx.categoriesOrdreText}</p>
      <OrdenaCategories categories={categoriesVestides(carta)}
        onMou={ordena ? (id, direccio) => desa(mouCategoria(carta.categories, id, direccio)) : undefined}
        onVisibilitat={ordena ? (id, visible) => desa(carta.categories.map((c) => (c.id === id ? { ...c, visible } : c))) : undefined} />
    </Columna>
  );
}

export function GrupsModificadors({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.modificadorsTitol} ambTorn={false} avis="estret">
      <Grups params={params} idioma={idioma} />
    </Preparat>
  );
}

function Grups({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol={tx.modificadorsTitol} actiu={params?.grup || null}
      colleccions={[
        ...carta.grups.map((g) => ({ id: g.id, nom: g.nom, comptador: g.opcions.length, secundari: g.min >= 1 ? tx.obligatori : tx.opcional })),
        ...(carta.grupsPendents || []).map((g) => ({ id: g.id, nom: g.nom, comptador: 0, secundari: tx.opcionsPendentsFont }))
      ]}
      hrefDe={(g) => ruta('modificadors', g.id)} textComptador={(n) => tx.nOpcions(n)} avis={<AvisDeLaColumna />} />
  );
}

export function GrupTriat({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.grupTitol} ambTorn={false}>
      <Grup params={params} idioma={idioma} />
    </Preparat>
  );
}

function Grup({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta } = useBar();
  const grup = carta.grups.find((g) => g.id === params?.grup) || null;
  const pendent = (carta.grupsPendents || []).find((g) => g.id === params?.grup) || null;
  if (pendent) {
    const productes = carta.productes.filter((p) => p.grupsModificadorsPendents?.includes(pendent.nom)).map((p) => p.nom);
    return (
      <Columna titol={pendent.nom}>
        <Alerta to="info" viva={false}>{tx.avisGrupLoyverse}</Alerta>
        <p>{tx.grupContinuaPendent}</p>
        <p>{productes.length ? tx.elPortenFont(productes.join(', ')) : tx.capProducteFont}</p>
      </Columna>
    );
  }
  if (!grup) {
    return (
      <Columna titol={tx.modificadorsTitol}>
        <EstatBuit titol={tx.triaUnGrup}>{tx.triaGrupText}</EstatBuit>
      </Columna>
    );
  }
  const productes = carta.productes.filter((p) => p.grupsModificadors.includes(grup.id)).map((p) => p.nom);
  return (
    <ColumnaColleccio titol={grup.nom}
      linies={grup.opcions.map((o) => ({ id: o.id, articleId: o.id, nom: o.nom, valor: o.deltaCents ? `+${euros(o.deltaCents)}` : tx.senseSuplement }))}
      resum={{ etiqueta: grup.min >= 1 ? tx.obligatori : tx.opcional, comptador: grup.opcions.length, textComptador: (n) => tx.nOpcions(n) }}
      peu={<p>{productes.length ? tx.elPorten(productes.join(', ')) : tx.capProductePorta}</p>} avis={<AvisDeLaColumna />} />
  );
}

function useEscandallsActius() {
  return useInterruptorsApp().actiu('escandalls');
}

function Apagats({ titol, idioma = 'ca' }) {
  const tm = textosMercaderies(idioma);
  return (
    <Columna titol={titol}>
      <EstatBuit icona={Calculator} titol={tm.escandallsApagatsTitol}>{tm.escandallsApagatsText}</EstatBuit>
    </Columna>
  );
}

function costDe(carta, producte) {
  const escandall = carta.escandalls.find((e) => e.producteId === producte.id);
  return costRevisat(carta, producte, escandall?.varianteId);
}

function costRevisat(carta, producte, varianteId) {
  const resultat = costDeVenda(carta, producte, varianteId);
  return resultat.costCents === 0 && variantDe(producte, varianteId)?.costConfirmat !== true
    ? { ...resultat, costCents: null } : resultat;
}

export function EscandallsCarta({ params }) {
  const idioma = useIdiomaBar();
  const tm = textosMercaderies(idioma);
  return (
    <Preparat titol={tm.escandallsTitol} ambTorn={false} avis="estret">
      <Escandalls params={params} idioma={idioma} />
    </Preparat>
  );
}

function Escandalls({ idioma = 'ca' }) {
  const tm = textosMercaderies(idioma);
  const { carta, establiment } = useBar();
  const { ves } = useVes();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol={tm.escandallsTitol} idioma={idioma} />;
  const articles = carta.productes.map((p) => {
    const { costCents } = costDe(carta, p);
    const variant = variantDe(p);
    const fc = costNormalitzat(variant, costCents) && !p.preuObert ? foodCostPermil(costCents, variant.preuCents, ivaDe(p, establiment.ivaPerDefecte)) : null;
    return {
      id: p.id,
      nom: p.nom,
      categoriaId: p.categoriaId,
      valor: costCents === null ? tm.senseCost : tm.costValor(euros(costCents)),
      ...(fc !== null ? { secundari: tm.foodCostNormalitzat(textPermil(fc)) } : costCents !== null ? { secundari: tm.baseFiscalPendent } : {})
    };
  });
  return (
    <ColumnaCataleg titol={tm.escandallsTitol} categories={categoriesVestides(carta)} articles={articles} vistaPerDefecte="llista"
      textArticles={(n) => textProductesBar(n, idioma)} onTria={(article) => ves('escandalls', article.id)} avis={<AvisDeLaColumna />} />
  );
}

export function EscandallTriat({ params }) {
  const idioma = useIdiomaBar();
  const tm = textosMercaderies(idioma);
  return (
    <Preparat titol={tm.escandallTitol} ambTorn={false}>
      <Escandall params={params} idioma={idioma} />
    </Preparat>
  );
}

function Escandall({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const tm = textosMercaderies(idioma);
  const { carta, establiment } = useBar();
  const [tria, setTria] = useState({ producteId: null, varianteId: undefined });
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol={tm.escandallTitol} idioma={idioma} />;
  const producte = carta.productes.find((p) => p.id === params?.producte) || null;
  if (!producte) {
    return (
      <Columna titol={tm.escandallTitol}>
        <EstatBuit icona={Calculator} titol={tm.triaProducteEscandallTitol}>{tm.triaProducteEscandallText}</EstatBuit>
      </Columna>
    );
  }
  const varianteId = tria.producteId === producte.id ? tria.varianteId : undefined;
  const { escandall, costCents } = costRevisat(carta, producte, varianteId);
  const variant = variantDe(producte, varianteId);
  const iva = ivaDe(producte, establiment.ivaPerDefecte);
  const objectiu = escandall?.objectiuFoodCostPercent ?? 30;
  let detall = null;
  try {
    detall = escandall ? costEscandall(escandall, carta.ingredients) : null;
  } catch {
    detall = null;
  }
  const normalitzat = costNormalitzat(variant, costCents);
  const fc = normalitzat ? foodCostPermil(costCents, variant.preuCents, iva) : null;
  const fiscal = normalitzat && !producte.preuObert && [4, 10, 21].includes(iva)
    ? fiscalVenda({ pvpCents: variant.preuCents, costCompraCents: costCents, ivaVendaPercent: iva }) : null;
  return (
    <ColumnaColleccio titol={tm.escandallDe(producte.nom)}
      linies={(detall?.linies || []).map((l) => {
        const ingredient = carta.ingredients.find((i) => i.id === l.ingredientId);
        return {
          id: l.ingredientId,
          articleId: l.ingredientId,
          nom: tm.quantitatIngredientDe(l.quantitat, ingredient?.unitatBase || '', l.nom),
          detall: ingredient?.minvaPercent ? tm.minvaDetall(ingredient.minvaPercent, l.quantitatBruta) : undefined,
          valor: euros(mitjaAmunt(l.costMicro, MICRO_PER_CENT))
        };
      })}
      resum={{ etiqueta: tm.costPerRacio, comptador: detall?.linies.length || 0, textComptador: (n) => tm.comptadorIngredients(n), total: costCents === null ? tm.senseCost : euros(costCents) }}
      textos={{ buit: tm.senseEscandall, buitText: escandall ? tm.revisaIngredients : tm.senseEscandallManual }}
      peu={(
        <>
          {producte.variants.length > 1 ? (
            <Camp etiqueta={tm.variantEscandall}>
              <Selector value={variant.id} opcions={producte.variants.map((v) => ({ valor: v.id, etiqueta: v.nom }))}
                onChange={(event) => setTria({ producteId: producte.id, varianteId: event.target.value })} />
            </Camp>
          ) : null}
          <Taula titol={tm.taulaPreuFoodCost} densa>
            <tbody>
              <tr><th scope="row">{tm.pvpDe(variant.nom)}</th><td>{producte.preuObert ? tx.preuObert : euros(variant.preuCents)}</td></tr>
              <tr><th scope="row">{tm.foodCost}</th><td>{fc === null || producte.preuObert ? '—' : textPermil(fc)}</td></tr>
              <tr><th scope="row">{tm.pvpSuggerit(objectiu)}</th><td>{normalitzat ? euros(pvpSuggerit(costCents, objectiu, iva)) : '—'}</td></tr>
              <tr><th scope="row">{tm.baseFiscalCost}</th><td>{normalitzat ? (baseDeCost(variant) === 'base-cost-deduccions' ? tm.costSenseIvaDeduible : tm.costFinalNoDeduible) : tm.pendentNormalitzar}</td></tr>
              {fiscal ? <>
                <tr><th scope="row">{tm.baseImposableVenda}</th><td>{euros(fiscal.baseImposableCents)}</td></tr>
                <tr><th scope="row">{tm.ivaDeVenda(iva)}</th><td>{euros(fiscal.ivaVendaCents)}</td></tr>
                <tr><th scope="row">{tm.guanyAbansAltres}</th><td>{euros(fiscal.guanyNetCents)}</td></tr>
                <tr><th scope="row">{tm.margeSobreBase}</th><td>{fiscal.margePermil === null ? '—' : `${(fiscal.margePermil / 10).toFixed(1).replace('.', ',')} %`}</td></tr>
              </> : null}
            </tbody>
          </Taula>
          {fiscal ? <p>{tm.limitFiscalNota(fiscal.limit)}</p> : null}
          {costCents !== null && !normalitzat ? <p>{tm.normalitzaAbansMarge}</p> : null}
          {producte.preuObert ? <p>{tm.margePreuObert}</p> : null}
          {producte.font?.cataleg === 'la-parroquia' ? <CalculadoraCompraParroquia key={`${producte.id}-${variant.id}`} producte={producte} variant={variant} /> : null}
        </>
      )} avis={<AvisDeLaColumna />} />
  );
}

export function IngredientsCarta({ params }) {
  const idioma = useIdiomaBar();
  const tm = textosMercaderies(idioma);
  return (
    <Preparat titol={tm.ingredientsTitol} ambTorn={false} avis="estret">
      <Ingredients params={params} idioma={idioma} />
    </Preparat>
  );
}

function Ingredients({ params, idioma = 'ca' }) {
  const tm = textosMercaderies(idioma);
  const { carta } = useBar();
  const { ruta } = useVes();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol={tm.ingredientsTitol} idioma={idioma} />;
  return (
    <ColumnaColleccions titol={tm.ingredientsTitol} actiu={params?.ingredient || null}
      colleccions={carta.ingredients.map((i) => ({
        id: i.id,
        nom: i.nom,
        comptador: carta.escandalls.filter((e) => e.ingredients.some((x) => x.ingredientId === i.id)).length,
        secundari: tm.formatPreuPer(euros(i.formatCompra.preuCents), i.formatCompra.quantitat, i.unitatBase)
      }))}
      hrefDe={(i) => ruta('ingredients', i.id)} textComptador={(n) => tm.comptadorEscandalls(n)} avis={<AvisDeLaColumna />} />
  );
}

export function IngredientTriat({ params }) {
  const idioma = useIdiomaBar();
  const tm = textosMercaderies(idioma);
  return (
    <Preparat titol={tm.ingredientTitol} ambTorn={false}>
      <Ingredient params={params} idioma={idioma} />
    </Preparat>
  );
}

function Ingredient({ params, idioma = 'ca' }) {
  const tm = textosMercaderies(idioma);
  const { carta } = useBar();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol={tm.ingredientTitol} idioma={idioma} />;
  const ingredient = carta.ingredients.find((i) => i.id === params?.ingredient) || null;
  if (!ingredient) {
    return (
      <Columna titol={tm.ingredientTitol}>
        <EstatBuit titol={tm.triaIngredientTitol}>{tm.triaIngredientText}</EstatBuit>
      </Columna>
    );
  }
  const micro = costUnitariMicro(ingredient);
  return (
    <Columna titol={ingredient.nom}>
      <BarraResum etiqueta={tm.formatDeCompra} comptador={ingredient.formatCompra.quantitat} textComptador={(n) => `${n} ${ingredient.unitatBase}`}
        total={euros(ingredient.formatCompra.preuCents)} />
      <p>{tm.costMicroPerUnitat(ingredient.unitatBase, micro, MICRO_PER_CENT, ingredient.minvaPercent)}</p>
      <p>{ingredient.alergens.length ? tm.alergensLlista(ingredient.alergens.map((a) => nomAlergen(a, idioma)).join(', ')) : tm.senseAlergensAnotats}</p>
      <p>{tm.usatEnEscandalls(carta.escandalls.filter((e) => e.ingredients.some((x) => x.ingredientId === ingredient.id)).length)}</p>
    </Columna>
  );
}

/**
 * El Bar · vistes/Carta.jsx — la carta: productes, categories, modificadors,
 * escandalls i ingredients (disseny del Bar §A.7 i §A.9), sempre amb les
 * columnes de l'ESQUELET COMÚ: el catàleg de productes és el mateix
 * ColumnaCataleg de la caixa, en vista de llista; els grups i els
 * ingredients, col·leccions; les opcions i els ingredients d'un escandall,
 * línies. Els editors són formularis de Pedra Seca.
 *
 * Editar un producte li lleva la marca «preu d'exemple». Canviar la carta
 * no toca cap comanda ni cap tiquet: les línies congelen nom, preu i IVA.
 * Els dos canals («A la carta digital» i «Per emportar») es llegixen amb
 * canalsDe: un producte sense `canals` els té tots dos encesos, i només
 * passa a portar-ne quan algú en toca un.
 * Sense permís d'escriptura (ProveidorBar, permis.potEscriure) la carta es
 * mira: «Desa el producte» queda desactivat i les categories no es mouen ni
 * s'amaguen. L'avís de la sessió diu per què, dins del marc de cada columna
 * (la prop `avis` de l'esquelet; correcció F3, 261006).
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
import { useInterruptorsApp } from '../../plataforma/index.js';
import { ALERGENS, NOMS_ALERGENS, ivaDe, validaCataleg, variantDe } from '../nucli/cataleg.js';
import { MICRO_PER_CENT, costDeVenda, costEscandall, costUnitariMicro, foodCostPermil, pvpSuggerit, textPermil } from '../nucli/escandall.js';
import { mitjaAmunt } from '../nucli/comu.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { fiscalVenda } from '../../plataforma/index.js';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { articlesDeCarta, categoriesVestides, euros } from './vestits.js';
import { CalculadoraCompraParroquia } from './CalculadoraCompraParroquia.jsx';

const ambEuros = (cents) => formatEuros(cents, { simbol: false });
const textProductes = (n) => `${n} ${n === 1 ? 'producte' : 'productes'}`;
const BASES_COST_NORMALITZAT = Object.freeze(['base-cost-deduccions', 'cost-final-no-deduible']);
const baseDeCost = (variant) => variant?.costBaseFiscal || 'desconegut';
const costNormalitzat = (variant, costCents) => costCents !== null && BASES_COST_NORMALITZAT.includes(baseDeCost(variant))
  && (costCents !== 0 || variant?.costConfirmat === true);
const teFontAlergens = (producte) => typeof producte?.fontAlergens === 'string' && Boolean(producte.fontAlergens.trim());

export function ProductesCarta({ params }) {
  return (
    <Preparat titol="Productes" ambTorn={false} avis="estret">
      <Productes params={params} />
    </Preparat>
  );
}

function Productes() {
  const { carta, establiment } = useBar();
  const { ves } = useVes();
  return (
    <ColumnaCataleg titol="Productes" categories={categoriesVestides(carta)} vistaPerDefecte="llista"
      articles={articlesDeCarta(carta, { establiment, ambInactius: true })}
      textosEstat={{ desactivat: 'No actiu' }} textArticles={textProductes} onTria={(article) => ves('productes', article.id)}
      avis={<AvisDeLaColumna />} />
  );
}

/* Sense Preparat: l'avís de la sessió hi va ell mateix (el catàleg del costat només el porta en estret). */
export function TriaProducte() {
  return (
    <Columna titol="Producte" avis={<AvisSessio />}>
      <EstatBuit icona={Coffee} titol="Tria un producte">Preus, variants, al·lèrgens i si va a la reposició de la nevera.</EstatBuit>
    </Columna>
  );
}

export function EditorProducte({ params }) {
  return (
    <Preparat titol="Producte" ambTorn={false}>
      <Editor params={params} />
    </Preparat>
  );
}

function Editor({ params }) {
  const { carta } = useBar();
  const producte = carta.productes.find((p) => p.id === params.producte) || null;
  if (!producte) return <NoTrobat text="Este producte no és a la carta." torna={{ etiqueta: 'Ves als productes', trams: ['productes'] }} />;
  return <FormulariProducte key={producte.id} producte={producte} />;
}

function FormulariProducte({ producte }) {
  const { carta, accions, permis } = useBar();
  const [esborrany, setEsborrany] = useState(() => {
    const ambFont = teFontAlergens(producte);
    return {
      ...structuredClone(producte),
      alergens: ambFont ? [...producte.alergens] : [],
      tracesAlergens: ambFont ? [...(producte.tracesAlergens || [])] : [],
      alergensAbsents: ambFont ? [...(producte.alergensAbsents || [])] : [],
      fontAlergens: ambFont ? producte.fontAlergens.trim() : '',
      novaFontAlergens: '', alergensCanviats: false,
      ...(!ambFont && [producte.alergens, producte.tracesAlergens, producte.alergensAbsents].some((ids) => ids?.length)
        ? { alergensOrigenNoVerificats: { ingredients: producte.alergens, traces: producte.tracesAlergens || [], absents: producte.alergensAbsents || [] } } : {}),
      preus: producte.variants.map((v) => ambEuros(v.preuCents)),
      costos: producte.variants.map((v) => Number.isSafeInteger(v.costCents) && (v.costCents !== 0 || v.costConfirmat === true) ? ambEuros(v.costCents) : '')
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
      setErrors(['Algun preu no es pot llegir: escriu-lo com «1,50».']);
      return;
    }
    const costos = esborrany.costos.map((text) => text.trim() === '' ? undefined : parseEuros(text));
    if (costos.some((cents) => cents === null || cents < 0)) {
      setErrors(['Algun cost no es pot llegir. Deixa’l buit si encara no el coneixes.']);
      return;
    }
    const fontAlergens = esborrany.novaFontAlergens.trim() || (esborrany.alergensCanviats ? '' : esborrany.fontAlergens);
    const declaraAlergens = [esborrany.alergens, esborrany.tracesAlergens, esborrany.alergensAbsents].some((ids) => ids.length);
    if (declaraAlergens && !fontAlergens) {
      setErrors(['Indica una font actual per a la declaració d’al·lèrgens: fitxa del proveïdor, lot, recepta revisada o document i data.']);
      return;
    }
    const nou = { ...esborrany, fontAlergens, exemple: false, variants: esborrany.variants.map((v, i) => {
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
    }) };
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
    <Columna titol={producte.nom} torna={{ etiqueta: 'Torna als productes', trams: ['productes'] }}>
      <AvisOperacio />
      {producte.exemple ? <Alerta to="info" viva={false}>Este producte encara porta el preu d’exemple: en desar-lo, passa a ser el teu.</Alerta> : null}
      {producte.font?.cataleg === 'la-parroquia' ? <Alerta to="info" viva={false}>Carta històrica de La Parròquia. Revisa preus, costos i al·lèrgens abans de vendre.</Alerta> : null}
      {errors.length ? <Alerta to="error">{errors.join(' · ')}</Alerta> : null}
      {desat ? <Alerta to="exit">Desat. Les comandes ja fetes no canvien.</Alerta> : null}
      <Camp etiqueta="Nom">
        <CampText value={esborrany.nom} maxLength={60} onChange={(event) => canvia({ nom: event.target.value })} />
      </Camp>
      <Camp etiqueta="Categoria">
        <Selector opcions={carta.categories.map((c) => ({ valor: c.id, etiqueta: c.nom }))} value={esborrany.categoriaId}
          onChange={(event) => canvia({ categoriaId: event.target.value })} />
      </Camp>
      {esborrany.variants.map((v, i) => (
        <GrupCamps key={v.id} llegenda={`Variant: ${v.nom}`}>
          {v.ref ? <p>{`REF: ${v.ref}`}</p> : null}
          <Camp etiqueta="Nom de la variant">
            <CampText value={v.nom} maxLength={40}
              onChange={(event) => canvia({ variants: esborrany.variants.map((x, j) => (j === i ? { ...x, nom: event.target.value } : x)) })} />
          </Camp>
          <Camp etiqueta="Preu amb IVA (€)">
            <CampText inputMode="decimal" value={esborrany.preus[i]}
              onChange={(event) => canvia({ preus: esborrany.preus.map((p, j) => (j === i ? event.target.value : p)) })} />
          </Camp>
          <Camp etiqueta="Cost de la variant (€)" ajuda="Buit vol dir cost pendent. Un zero només és vàlid si l’has comprovat. Normalitza la base fiscal per a calcular marges.">
            <CampText inputMode="decimal" value={esborrany.costos[i]}
              onChange={(event) => canvia({ costos: esborrany.costos.map((cost, j) => j === i ? event.target.value : cost),
                variants: esborrany.variants.map((x, j) => j === i ? { ...x, costBaseFiscal: 'desconegut' } : x) })} />
          </Camp>
          <Camp etiqueta="Base fiscal del cost" ajuda="Tria-la només després de revisar si els impostos de compra són deduïbles.">
            <Selector value={baseDeCost(v)} opcions={[
              { valor: 'desconegut', etiqueta: 'Pendent de normalitzar' },
              { valor: 'base-cost-deduccions', etiqueta: 'Cost sense IVA deduïble' },
              { valor: 'cost-final-no-deduible', etiqueta: 'Cost final amb impostos no deduïbles' }
            ]} onChange={(event) => canvia({ variants: esborrany.variants.map((x, j) => j === i ? { ...x, costBaseFiscal: event.target.value } : x) })} />
          </Camp>
        </GrupCamps>
      ))}
      <Interruptor etiqueta="Actiu a la caixa" actiu={esborrany.actiu} onCanvi={(actiu) => canvia({ actiu })} />
      <Interruptor etiqueta="Va a la reposició de la nevera" actiu={esborrany.reposaNevera} onCanvi={(reposaNevera) => canvia({ reposaNevera })} />
      <Interruptor etiqueta="Preu obert (es tecleja en vendre)" actiu={esborrany.preuObert} onCanvi={(preuObert) => canvia({ preuObert })} />
      <Interruptor etiqueta="A la carta digital" actiu={canalsDe(esborrany).cartaDigital}
        onCanvi={(cartaDigital) => canvia({ canals: { ...canalsDe(esborrany), cartaDigital } })} />
      <Interruptor etiqueta="Per emportar" actiu={canalsDe(esborrany).perEmportar}
        onCanvi={(perEmportar) => canvia({ canals: { ...canalsDe(esborrany), perEmportar } })} />
      {producte.grupsModificadorsPendents?.length ? <p>{`Grups de modificadors de la font: ${producte.grupsModificadorsPendents.join(', ')}. Cal definir-ne les opcions i els suplements abans d’activar-los.`}</p> : null}
      <GrupCamps llegenda="Al·lèrgens (els manté el bar)">
        <p>• indica ingredient i T indica traça. «Pendent» no acredita absència. Una declaració requerix una font actual.</p>
        {esborrany.alergensOrigenNoVerificats ? <Alerta to="info" viva={false}>Les anotacions anteriors no tenen font i es mostren pendents.</Alerta> : null}
        {esborrany.fontAlergens && !esborrany.alergensCanviats ? <p>{`Font vigent: ${esborrany.fontAlergens}`}</p> : null}
        <Camp etiqueta="Font de la declaració d’al·lèrgens" ajuda="Indica document, proveïdor o recepta revisada i data. Quan canvies un estat, cal tornar a informar la font.">
          <CampText value={esborrany.novaFontAlergens} maxLength={240} onChange={(event) => canvia({ novaFontAlergens: event.target.value })} />
        </Camp>
        {ALERGENS.map((a) => (
          <Camp key={a} etiqueta={NOMS_ALERGENS[a]}>
            <Selector value={esborrany.alergens.includes(a) ? 'ingredient' : (esborrany.tracesAlergens || []).includes(a) ? 'traca' : (esborrany.alergensAbsents || []).includes(a) ? 'absent' : 'pendent'}
              opcions={[{ valor: 'pendent', etiqueta: 'Pendent' }, { valor: 'ingredient', etiqueta: '• Present com a ingredient' }, { valor: 'traca', etiqueta: 'T Present com a traça' }, { valor: 'absent', etiqueta: 'Absència comprovada' }]}
              onChange={(event) => {
                const estat = event.target.value;
                canvia({
                  alergens: [...esborrany.alergens.filter((id) => id !== a), ...(estat === 'ingredient' ? [a] : [])],
                  tracesAlergens: [...(esborrany.tracesAlergens || []).filter((id) => id !== a), ...(estat === 'traca' ? [a] : [])],
                  alergensAbsents: [...(esborrany.alergensAbsents || []).filter((id) => id !== a), ...(estat === 'absent' ? [a] : [])],
                  alergensEstat: 'revisio_manual', fontAlergens: '', alergensCanviats: true
                });
              }} />
          </Camp>
        ))}
      </GrupCamps>
      <Boto varietat="primari" ple disabled={!permis.potEscriure} onClick={desa}>Desa el producte</Boto>
    </Columna>
  );
}

export function CategoriesCarta() {
  return (
    <Preparat titol="Categories" ambTorn={false}>
      <Categories />
    </Preparat>
  );
}

function Categories() {
  const { carta, accions, permis } = useBar();
  const desa = (categories) => accions.desaCarta({ ...carta, categories });
  const ordena = permis.potEscriure;
  return (
    <Columna titol="Categories">
      <AvisOperacio />
      <p>L’ordre és el de la caixa. Una categoria amagada no es veu al catàleg, però els seus productes no s’esborren.</p>
      <OrdenaCategories categories={categoriesVestides(carta)}
        onMou={ordena ? (id, direccio) => desa(mouCategoria(carta.categories, id, direccio)) : undefined}
        onVisibilitat={ordena ? (id, visible) => desa(carta.categories.map((c) => (c.id === id ? { ...c, visible } : c))) : undefined} />
    </Columna>
  );
}

export function GrupsModificadors({ params }) {
  return (
    <Preparat titol="Modificadors" ambTorn={false} avis="estret">
      <Grups params={params} />
    </Preparat>
  );
}

function Grups({ params }) {
  const { carta } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Modificadors" actiu={params?.grup || null}
      colleccions={[
        ...carta.grups.map((g) => ({ id: g.id, nom: g.nom, comptador: g.opcions.length, secundari: g.min >= 1 ? 'Obligatori' : 'Opcional' })),
        ...(carta.grupsPendents || []).map((g) => ({ id: g.id, nom: g.nom, comptador: 0, secundari: 'Opcions pendents de la font' }))
      ]}
      hrefDe={(g) => ruta('modificadors', g.id)} textComptador={(n) => `${n} opcions`} avis={<AvisDeLaColumna />} />
  );
}

export function GrupTriat({ params }) {
  return (
    <Preparat titol="Grup" ambTorn={false}>
      <Grup params={params} />
    </Preparat>
  );
}

function Grup({ params }) {
  const { carta } = useBar();
  const grup = carta.grups.find((g) => g.id === params?.grup) || null;
  const pendent = (carta.grupsPendents || []).find((g) => g.id === params?.grup) || null;
  if (pendent) {
    const productes = carta.productes.filter((p) => p.grupsModificadorsPendents?.includes(pendent.nom)).map((p) => p.nom);
    return (
      <Columna titol={pendent.nom}>
        <Alerta to="info" viva={false}>L’exportació de Loyverse indica quins productes porten este grup, però no n’inclou les opcions ni els suplements.</Alerta>
        <p>El grup continua pendent. No s’aplica cap suplement a les comandes.</p>
        <p>{productes.length ? `El porten a la font: ${productes.join(', ')}.` : 'Cap producte el porta a la font.'}</p>
      </Columna>
    );
  }
  if (!grup) {
    return (
      <Columna titol="Modificadors">
        <EstatBuit titol="Tria un grup">Un grup obligatori fa que el toc a la caixa òbriga el diàleg menut.</EstatBuit>
      </Columna>
    );
  }
  const productes = carta.productes.filter((p) => p.grupsModificadors.includes(grup.id)).map((p) => p.nom);
  return (
    <ColumnaColleccio titol={grup.nom}
      linies={grup.opcions.map((o) => ({ id: o.id, articleId: o.id, nom: o.nom, valor: o.deltaCents ? `+${euros(o.deltaCents)}` : 'Sense suplement' }))}
      resum={{ etiqueta: grup.min >= 1 ? 'Obligatori' : 'Opcional', comptador: grup.opcions.length, textComptador: (n) => `${n} opcions` }}
      peu={<p>{productes.length ? `El porten: ${productes.join(', ')}.` : 'Cap producte el porta.'}</p>} avis={<AvisDeLaColumna />} />
  );
}

/** Els escandalls estan apagats: ho diu. */
function useEscandallsActius() {
  return useInterruptorsApp().actiu('escandalls');
}

function Apagats({ titol }) {
  return (
    <Columna titol={titol}>
      <EstatBuit icona={Calculator} titol="Els escandalls estan apagats">Es poden encendre als ajustos del dispositiu.</EstatBuit>
    </Columna>
  );
}

/**
 * El cost d'un producte: el de l'escandall si en té (de la seua variant), o el
 * manual de la primera variant. El mateix càlcul que la línia venuda (costDeVenda).
 */
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
  return (
    <Preparat titol="Escandalls" ambTorn={false} avis="estret">
      <Escandalls params={params} />
    </Preparat>
  );
}

function Escandalls() {
  const { carta, establiment } = useBar();
  const { ves } = useVes();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol="Escandalls" />;
  const articles = carta.productes.map((p) => {
    const { costCents } = costDe(carta, p);
    const variant = variantDe(p);
    const fc = costNormalitzat(variant, costCents) && !p.preuObert ? foodCostPermil(costCents, variant.preuCents, ivaDe(p, establiment.ivaPerDefecte)) : null;
    return {
      id: p.id, nom: p.nom, categoriaId: p.categoriaId,
      valor: costCents === null ? 'Sense cost' : `Cost ${euros(costCents)}`,
      ...(fc !== null ? { secundari: `Food cost normalitzat ${textPermil(fc)}` } : costCents !== null ? { secundari: 'Base fiscal del cost pendent' } : {})
    };
  });
  return (
    <ColumnaCataleg titol="Escandalls" categories={categoriesVestides(carta)} articles={articles} vistaPerDefecte="llista"
      textArticles={textProductes} onTria={(article) => ves('escandalls', article.id)} avis={<AvisDeLaColumna />} />
  );
}

export function EscandallTriat({ params }) {
  return (
    <Preparat titol="Escandall" ambTorn={false}>
      <Escandall params={params} />
    </Preparat>
  );
}

function Escandall({ params }) {
  const { carta, establiment } = useBar();
  const [tria, setTria] = useState({ producteId: null, varianteId: undefined });
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol="Escandall" />;
  const producte = carta.productes.find((p) => p.id === params?.producte) || null;
  if (!producte) {
    return (
      <Columna titol="Escandall">
        <EstatBuit icona={Calculator} titol="Tria un producte">El cost per ració, el food cost i el PVP suggerit.</EstatBuit>
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
    <ColumnaColleccio titol={`Escandall: ${producte.nom}`}
      linies={(detall?.linies || []).map((l) => {
        const ingredient = carta.ingredients.find((i) => i.id === l.ingredientId);
        return {
          id: l.ingredientId, articleId: l.ingredientId, nom: `${l.quantitat} ${ingredient?.unitatBase || ''} de ${l.nom}`,
          detall: ingredient?.minvaPercent ? `Minva ${ingredient.minvaPercent} %: se’n compren ${l.quantitatBruta}` : undefined,
          valor: euros(mitjaAmunt(l.costMicro, MICRO_PER_CENT))
        };
      })}
      resum={{ etiqueta: 'Cost per ració', comptador: detall?.linies.length || 0, textComptador: (n) => `${n} ingredients`, total: costCents === null ? 'Sense cost' : euros(costCents) }}
      textos={{ buit: 'Sense escandall', buitText: escandall ? 'Revisa els ingredients.' : 'Este producte no té escandall: el cost és el manual de la variant, si n’hi ha.' }}
      peu={(
        <>
          {producte.variants.length > 1 ? (
            <Camp etiqueta="Variant de l’escandall">
              <Selector value={variant.id} opcions={producte.variants.map((v) => ({ valor: v.id, etiqueta: v.nom }))}
                onChange={(event) => setTria({ producteId: producte.id, varianteId: event.target.value })} />
            </Camp>
          ) : null}
          <Taula titol="Preu i food cost" densa>
            <tbody>
              <tr><th scope="row">{`PVP (${variant.nom})`}</th><td>{producte.preuObert ? 'Preu obert' : euros(variant.preuCents)}</td></tr>
              <tr><th scope="row">Food cost</th><td>{fc === null || producte.preuObert ? '—' : textPermil(fc)}</td></tr>
              <tr><th scope="row">{`PVP suggerit (objectiu ${objectiu} %)`}</th><td>{normalitzat ? euros(pvpSuggerit(costCents, objectiu, iva)) : '—'}</td></tr>
              <tr><th scope="row">Base fiscal del cost</th><td>{normalitzat ? (baseDeCost(variant) === 'base-cost-deduccions' ? 'Cost sense IVA deduïble' : 'Cost final amb impostos no deduïbles') : 'Pendent de normalitzar'}</td></tr>
              {fiscal ? <>
                <tr><th scope="row">Base imposable de venda</th><td>{euros(fiscal.baseImposableCents)}</td></tr>
                <tr><th scope="row">{`IVA de venda (${iva} %)`}</th><td>{euros(fiscal.ivaVendaCents)}</td></tr>
                <tr><th scope="row">Guany abans d’altres costos</th><td>{euros(fiscal.guanyNetCents)}</td></tr>
                <tr><th scope="row">Marge sobre la base imposable</th><td>{fiscal.margePermil === null ? '—' : `${(fiscal.margePermil / 10).toFixed(1).replace('.', ',')} %`}</td></tr>
              </> : null}
            </tbody>
          </Taula>
          {fiscal ? <p>{`${fiscal.limit}. S’ha emprat el cost normalitzat declarat per a la variant.`}</p> : null}
          {costCents !== null && !normalitzat ? <p>Normalitza la base fiscal del cost a la fitxa del producte abans de calcular el marge o el PVP suggerit.</p> : null}
          {producte.preuObert ? <p>El marge es calcularà quan s’informe el preu de venda.</p> : null}
          {producte.font?.cataleg === 'la-parroquia' ? <CalculadoraCompraParroquia key={`${producte.id}-${variant.id}`} producte={producte} variant={variant} /> : null}
        </>
      )} avis={<AvisDeLaColumna />} />
  );
}

export function IngredientsCarta({ params }) {
  return (
    <Preparat titol="Ingredients" ambTorn={false} avis="estret">
      <Ingredients params={params} />
    </Preparat>
  );
}

function Ingredients({ params }) {
  const { carta } = useBar();
  const { ruta } = useVes();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol="Ingredients" />;
  return (
    <ColumnaColleccions titol="Ingredients" actiu={params?.ingredient || null}
      colleccions={carta.ingredients.map((i) => ({
        id: i.id, nom: i.nom, comptador: carta.escandalls.filter((e) => e.ingredients.some((x) => x.ingredientId === i.id)).length,
        secundari: `${euros(i.formatCompra.preuCents)} per ${i.formatCompra.quantitat} ${i.unitatBase}`
      }))}
      hrefDe={(i) => ruta('ingredients', i.id)} textComptador={(n) => `${n} escandalls`} avis={<AvisDeLaColumna />} />
  );
}

export function IngredientTriat({ params }) {
  return (
    <Preparat titol="Ingredient" ambTorn={false}>
      <Ingredient params={params} />
    </Preparat>
  );
}

function Ingredient({ params }) {
  const { carta } = useBar();
  const actius = useEscandallsActius();
  if (!actius) return <Apagats titol="Ingredient" />;
  const ingredient = carta.ingredients.find((i) => i.id === params?.ingredient) || null;
  if (!ingredient) {
    return (
      <Columna titol="Ingredient">
        <EstatBuit titol="Tria un ingredient">El preu del format de compra, la minva i on s’usa.</EstatBuit>
      </Columna>
    );
  }
  const micro = costUnitariMicro(ingredient);
  return (
    <Columna titol={ingredient.nom}>
      <BarraResum etiqueta="Format de compra" comptador={ingredient.formatCompra.quantitat} textComptador={(n) => `${n} ${ingredient.unitatBase}`}
        total={euros(ingredient.formatCompra.preuCents)} />
      <p>{`Cost per ${ingredient.unitatBase}: ${micro} micro-euros (1 cèntim = ${MICRO_PER_CENT}) · minva ${ingredient.minvaPercent} %.`}</p>
      <p>{ingredient.alergens.length ? `Al·lèrgens: ${ingredient.alergens.map((a) => NOMS_ALERGENS[a]).join(', ')}.` : 'Sense al·lèrgens anotats.'}</p>
      <p>{`Es fa servir en ${carta.escandalls.filter((e) => e.ingredients.some((x) => x.ingredientId === ingredient.id)).length} escandalls.`}</p>
    </Columna>
  );
}

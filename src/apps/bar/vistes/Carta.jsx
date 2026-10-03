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
 */
import { useState } from 'react';
import { Calculator, Coffee } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, Casella, EstatBuit, GrupCamps, Interruptor, OrdenaCategories, Selector, Taula,
  mouCategoria
} from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { formatEuros, parseEuros } from '../../../utils/diners.js';
import { useInterruptorsApp } from '../../plataforma/index.js';
import { ALERGENS, NOMS_ALERGENS, ivaDe, validaCataleg, variantDe } from '../nucli/cataleg.js';
import { MICRO_PER_CENT, costDeVenda, costEscandall, costUnitariMicro, foodCostPermil, pvpSuggerit, textPermil } from '../nucli/escandall.js';
import { mitjaAmunt } from '../nucli/comu.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisOperacio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { articlesDeCarta, categoriesVestides, euros } from './vestits.js';

const ambEuros = (cents) => formatEuros(cents, { simbol: false });
const textProductes = (n) => `${n} ${n === 1 ? 'producte' : 'productes'}`;

export function ProductesCarta({ params }) {
  return (
    <Preparat titol="Productes" ambTorn={false}>
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
      textosEstat={{ desactivat: 'No actiu' }} textArticles={textProductes} onTria={(article) => ves('productes', article.id)} />
  );
}

export function TriaProducte() {
  return (
    <Columna titol="Producte">
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
  const { carta, accions } = useBar();
  const [esborrany, setEsborrany] = useState(() => ({
    ...structuredClone(producte),
    preus: producte.variants.map((v) => ambEuros(v.preuCents))
  }));
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
    const nou = { ...esborrany, exemple: false, variants: esborrany.variants.map((v, i) => ({ ...v, preuCents: preus[i] })) };
    delete nou.preus;
    const novaCarta = { ...carta, productes: carta.productes.map((p) => (p.id === nou.id ? nou : p)) };
    const validacio = validaCataleg(novaCarta);
    if (!validacio.ok) {
      setErrors(validacio.errors.slice(0, 3));
      return;
    }
    setErrors([]);
    const r = await accions.desaCarta(novaCarta);
    setDesat(r.ok);
  };
  return (
    <Columna titol={producte.nom} torna={{ etiqueta: 'Torna als productes', trams: ['productes'] }}>
      <AvisOperacio />
      {producte.exemple ? <Alerta to="info" viva={false}>Este producte encara porta el preu d’exemple: en desar-lo, passa a ser el teu.</Alerta> : null}
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
          <Camp etiqueta="Nom de la variant">
            <CampText value={v.nom} maxLength={40}
              onChange={(event) => canvia({ variants: esborrany.variants.map((x, j) => (j === i ? { ...x, nom: event.target.value } : x)) })} />
          </Camp>
          <Camp etiqueta="Preu amb IVA (€)">
            <CampText inputMode="decimal" value={esborrany.preus[i]}
              onChange={(event) => canvia({ preus: esborrany.preus.map((p, j) => (j === i ? event.target.value : p)) })} />
          </Camp>
        </GrupCamps>
      ))}
      <Interruptor etiqueta="Actiu a la caixa" actiu={esborrany.actiu} onCanvi={(actiu) => canvia({ actiu })} />
      <Interruptor etiqueta="Va a la reposició de la nevera" actiu={esborrany.reposaNevera} onCanvi={(reposaNevera) => canvia({ reposaNevera })} />
      <Interruptor etiqueta="Preu obert (es tecleja en vendre)" actiu={esborrany.preuObert} onCanvi={(preuObert) => canvia({ preuObert })} />
      <GrupCamps llegenda="Al·lèrgens (els manté el bar)">
        {ALERGENS.map((a) => (
          <Casella key={a} etiqueta={NOMS_ALERGENS[a]} checked={esborrany.alergens.includes(a)}
            onChange={(event) => canvia({ alergens: event.target.checked ? [...esborrany.alergens, a] : esborrany.alergens.filter((x) => x !== a) })} />
        ))}
      </GrupCamps>
      <Boto varietat="primari" ple onClick={desa}>Desa el producte</Boto>
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
  const { carta, accions } = useBar();
  const desa = (categories) => accions.desaCarta({ ...carta, categories });
  return (
    <Columna titol="Categories">
      <AvisOperacio />
      <p>L’ordre és el de la caixa. Una categoria amagada no es veu al catàleg, però els seus productes no s’esborren.</p>
      <OrdenaCategories categories={categoriesVestides(carta)}
        onMou={(id, direccio) => desa(mouCategoria(carta.categories, id, direccio))}
        onVisibilitat={(id, visible) => desa(carta.categories.map((c) => (c.id === id ? { ...c, visible } : c)))} />
    </Columna>
  );
}

export function GrupsModificadors({ params }) {
  return (
    <Preparat titol="Modificadors" ambTorn={false}>
      <Grups params={params} />
    </Preparat>
  );
}

function Grups({ params }) {
  const { carta } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Modificadors" actiu={params?.grup || null}
      colleccions={carta.grups.map((g) => ({ id: g.id, nom: g.nom, comptador: g.opcions.length, secundari: g.min >= 1 ? 'Obligatori' : 'Opcional' }))}
      hrefDe={(g) => ruta('modificadors', g.id)} textComptador={(n) => `${n} opcions`} />
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
      peu={<p>{productes.length ? `El porten: ${productes.join(', ')}.` : 'Cap producte el porta.'}</p>} />
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
  return costDeVenda(carta, producte, escandall?.varianteId);
}

export function EscandallsCarta({ params }) {
  return (
    <Preparat titol="Escandalls" ambTorn={false}>
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
    const fc = costCents !== null && variant ? foodCostPermil(costCents, variant.preuCents, ivaDe(p, establiment.ivaPerDefecte)) : null;
    return {
      id: p.id, nom: p.nom, categoriaId: p.categoriaId,
      valor: costCents === null ? 'Sense cost' : `Cost ${euros(costCents)}`,
      ...(fc !== null ? { secundari: `Food cost ${textPermil(fc)}` } : {})
    };
  });
  return (
    <ColumnaCataleg titol="Escandalls" categories={categoriesVestides(carta)} articles={articles} vistaPerDefecte="llista"
      textArticles={textProductes} onTria={(article) => ves('escandalls', article.id)} />
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
  const { escandall, costCents } = costDe(carta, producte);
  const variant = variantDe(producte, escandall?.varianteId);
  const iva = ivaDe(producte, establiment.ivaPerDefecte);
  const objectiu = escandall?.objectiuFoodCostPercent ?? 30;
  let detall = null;
  try {
    detall = escandall ? costEscandall(escandall, carta.ingredients) : null;
  } catch {
    detall = null;
  }
  const fc = costCents !== null ? foodCostPermil(costCents, variant.preuCents, iva) : null;
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
        <Taula titol="Preu i food cost" densa>
          <tbody>
            <tr><th scope="row">{`PVP (${variant.nom})`}</th><td>{euros(variant.preuCents)}</td></tr>
            <tr><th scope="row">Food cost</th><td>{fc === null ? '—' : textPermil(fc)}</td></tr>
            <tr><th scope="row">{`PVP suggerit (objectiu ${objectiu} %)`}</th><td>{costCents === null ? '—' : euros(pvpSuggerit(costCents, objectiu, iva))}</td></tr>
          </tbody>
        </Taula>
      )} />
  );
}

export function IngredientsCarta({ params }) {
  return (
    <Preparat titol="Ingredients" ambTorn={false}>
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
      hrefDe={(i) => ruta('ingredients', i.id)} textComptador={(n) => `${n} escandalls`} />
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

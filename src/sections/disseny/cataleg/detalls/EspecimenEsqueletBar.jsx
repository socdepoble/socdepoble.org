import { useMemo, useState } from 'react';
import { Beer, Coffee, CupSoda, Sandwich } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { formatEuros } from '../../../../utils/diners.js';
import { useColleccioActiva } from '../../../../apps/comu/esquelet/index.js';
import { MarcEsquelet, MostraEsquelet } from './mostraEsquelet.jsx';

/* Ordre del Mestre (261002, sinergies T4/T8) · l'esquelet comú VESTIT DE BAR
   («La Parròquia»). La intel·ligència de dades d'esta mostra (preus en
   cèntims, variants, grups obligatoris, les comandes de cada tiquet) és un
   esbós sintètic: preus d'exemple, cap producte ni marca de cap establiment
   real. Les columnes són les mateixes que les de l'espècimen «vestit de
   compra». */
const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, ordre: 0, visible: true },
  { id: 'esmorzars', nom: 'Esmorzars', icona: Sandwich, ordre: 1, visible: true },
  { id: 'refrescs', nom: 'Refrescs', icona: CupSoda, ordre: 2, visible: true },
  { id: 'cerveses', nom: 'Cerveses', icona: Beer, ordre: 3, visible: true }
];

/* La primera variant és la per defecte. `grup`: un grup obligatori (sense
   variant per defecte), que el toc demana en un diàleg menut. */
const PRODUCTES = [
  { id: 'cafe-sol', nom: 'Cafè sol', categoriaId: 'cafes', variants: [{ valor: 'unic', etiqueta: 'Tassa', cents: 110 }] },
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', variants: [{ valor: 'unic', etiqueta: 'Tassa', cents: 130 }] },
  { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', variants: [
    { valor: 'tassa', etiqueta: 'Tassa', cents: 150 }, { valor: 'got', etiqueta: 'Got', cents: 160 }
  ] },
  { id: 'torrada', nom: 'Torrada amb tomaca', categoriaId: 'esmorzars', variants: [{ valor: 'unic', etiqueta: 'Ració', cents: 250 }] },
  { id: 'entrepa-truita', nom: 'Entrepà de truita', categoriaId: 'esmorzars', grup: 'Pa', variants: [
    { valor: 'barra', etiqueta: 'Pa de barra', cents: 350 }, { valor: 'llesca', etiqueta: 'Pa de llesca', cents: 350 }
  ] },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'refrescs', variants: [
    { valor: 'mitjana', etiqueta: 'Mitjana', cents: 100 }, { valor: 'gran', etiqueta: 'Gran', cents: 180 }
  ] },
  { id: 'refresc-cola', nom: 'Refresc de cola', categoriaId: 'refrescs', variants: [{ valor: 'unic', etiqueta: 'Llanda', cents: 180 }] },
  { id: 'cervesa-barril', nom: 'Cervesa de barril', categoriaId: 'cerveses', variants: [
    { valor: 'canya', etiqueta: 'Canya', cents: 160 }, { valor: 'gerra', etiqueta: 'Gerra', cents: 280 }
  ] },
  { id: 'clara', nom: 'Clara', categoriaId: 'cerveses', exhaurit: true, variants: [{ valor: 'unic', etiqueta: 'Canya', cents: 170 }] }
];
const PER_ID = new Map(PRODUCTES.map((p) => [p.id, p]));
const textLinies = (n) => `${n} ${n === 1 ? 'línia' : 'línies'}`;
const valorDe = (p) => (new Set(p.variants.map((v) => v.cents)).size === 1 ? formatEuros(p.variants[0].cents) : `${p.variants.length} variants`);

/* Els tiquets oberts: el tiquet actiu va al camí (/app/bar/caixa/<tiquet>). */
const RUTA_TIQUET = Object.freeze({ parametre: 'tiquet' });
const TIQUETS = [
  { id: 'barra', nom: 'Barra' },
  { id: 'taula-3', nom: 'Taula 3' },
  { id: 'terrassa-2', nom: 'Terrassa 2' }
];
const linia = (producteId, variant, quantitat) => ({ id: `${producteId}-${variant}`, producteId, variant, quantitat, nota: '' });
const COMANDES_INICIALS = {
  barra: [],
  'taula-3': [linia('cafe-sol', 'unic', 1), linia('cafe-llet', 'tassa', 2), linia('torrada', 'unic', 2), linia('aigua', 'mitjana', 1)],
  'terrassa-2': [linia('cervesa-barril', 'canya', 2)]
};

/* La intel·ligència del TPV de mostra: una comanda en memòria per tiquet. */
function useComandesDeMostra(tiquet) {
  const [comandes, setComandes] = useState(COMANDES_INICIALS);
  const [avis, setAvis] = useState('Toca un producte: la variant per defecte, una unitat més. Mantín premut per a triar-ne una altra.');
  const actualitza = (canvi) => setComandes((totes) => ({ ...totes, [tiquet]: canvi(totes[tiquet] || []) }));
  const afig = (producte, variant = producte.variants[0].valor, quantitat = 1, nota = '') => actualitza((actuals) => {
    const id = `${producte.id}-${variant}${nota ? `-${actuals.length}` : ''}`;
    const existent = actuals.find((l) => l.id === id);
    if (existent) return actuals.map((l) => (l.id === id ? { ...l, quantitat: l.quantitat + quantitat } : l));
    return [...actuals, { id, producteId: producte.id, variant, quantitat, nota }];
  });
  const canvia = (id, delta) => actualitza((actuals) => actuals
    .map((l) => (l.id === id ? { ...l, quantitat: l.quantitat + delta } : l))
    .filter((l) => l.quantitat > 0));
  const vestides = (comandes[tiquet] || []).map((l) => {
    const producte = PER_ID.get(l.producteId);
    const variant = producte.variants.find((v) => v.valor === l.variant);
    const detall = [producte.variants.length > 1 ? variant.etiqueta : null, l.nota || null].filter(Boolean).join(' · ');
    return { id: l.id, articleId: producte.id, quantitat: l.quantitat, nom: producte.nom, detall: detall || undefined, valor: formatEuros(variant.cents * l.quantitat), cents: variant.cents * l.quantitat };
  });
  const total = vestides.reduce((suma, l) => suma + l.cents, 0);
  const comptador = (id) => (comandes[id] || []).length;
  return { linies: vestides, total, afig, canvia, avis, setAvis, comptador, buida: () => actualitza(() => []) };
}

function TpvDeMostra() {
  const tiquet = useColleccioActiva({ entrada: 'caixa', rutaColleccio: RUTA_TIQUET }) || 'barra';
  const comanda = useComandesDeMostra(tiquet);
  const aComanda = new Set(comanda.linies.map((l) => l.articleId));
  const articles = useMemo(() => PRODUCTES.map((p) => ({
    id: p.id,
    nom: p.nom,
    categoriaId: p.categoriaId,
    valor: valorDe(p),
    secundari: p.exhaurit ? 'Esgotat' : undefined,
    estat: p.exhaurit ? 'desactivat' : 'normal'
  })), []).map((a) => (aComanda.has(a.id) && a.estat === 'normal' ? { ...a, estat: 'en-colleccio' } : a));
  const resum = { etiqueta: 'Comanda', comptador: comanda.linies.length, textComptador: textLinies, total: formatEuros(comanda.total) };
  return (
    <>
      <MarcEsquelet
        etiqueta="Bar"
        primer="cataleg"
        cataleg={{
          titol: 'Productes',
          categories: CATEGORIES,
          articles,
          /* Disseny del Bar §A.6, flux 1: el toc afig la variant per defecte;
             un grup obligatori obri el diàleg menut (un toc tria i tanca). */
          onTria: (article, { obriDetall }) => {
            const producte = PER_ID.get(article.id);
            if (producte.grup) obriDetall();
            else comanda.afig(producte);
          },
          textosEstat: { 'en-colleccio': 'A la comanda' },
          afegit: { etiqueta: 'Busca…', suggeriments: articles.filter((a) => a.estat !== 'desactivat') },
          detall: {
            triaDirecta: (article) => Boolean(PER_ID.get(article.id).grup),
            etiquetaVariants: (article) => PER_ID.get(article.id).grup || 'Variant',
            variantsDe: (article) => PER_ID.get(article.id).variants.map((v) => ({ valor: v.valor, etiqueta: v.etiqueta, ajuda: formatEuros(v.cents) })),
            etiquetaNota: 'Nota per a la barra',
            onAccepta: ({ variant, quantitat, nota }, article) => comanda.afig(PER_ID.get(article.id), variant, quantitat, nota)
          },
          resum
        }}
        colleccio={{
          titol: 'Comanda',
          linies: comanda.linies,
          resum: { ...resum, accio: { text: 'Cobra', desactivada: comanda.linies.length === 0, onClick: () => {
            comanda.setAvis(`Cobrament de mostra: ${formatEuros(comanda.total)}. No s’ha cobrat res.`);
            comanda.buida();
          } } },
          onResta: (l) => comanda.canvia(l.id, -1),
          onSuma: (l) => comanda.canvia(l.id, 1),
          onLleva: (l) => comanda.canvia(l.id, -l.quantitat),
          textos: { buit: 'La comanda és buida', buitText: 'Toca un producte per a afegir-lo.' }
        }}
        colleccions={{
          titol: 'Tiquets oberts',
          colleccions: TIQUETS.map((t) => ({ ...t, comptador: comanda.comptador(t.id) })),
          actiu: tiquet,
          hrefDe: (t) => `/app/bar/caixa/${t.id}`,
          textComptador: textLinies
        }}
      />
      <p role="status">{comanda.avis}</p>
    </>
  );
}

export default function EspecimenEsqueletBar() {
  return (
    <Especimen id="esquelet-bar" nom="Esquelet · vestit de bar" fitxer="src/apps/comu/esquelet/ (ColumnaCataleg · ColumnaColleccio · ColumnaColleccions)"
      descripcio="El TPV del bar («La Parròquia») sobre l’esquelet comú. Catàleg de productes per categories, la comanda del tiquet actiu i els tiquets oberts: les mateixes columnes que La Compra, amb una altra intel·ligència de dades (preus, variants, cobrament). El tiquet actiu va al camí. Tauleta i escriptori: de costat. Mòbil: el catàleg primer i la barra de la comanda a baix."
      contracte={[
        ['entrada / primer / rutaColleccio', "slug · 'cataleg' · { parametre }", "— · 'cataleg' · null", 'El TPV comença pel catàleg; la comanda és el panell /colleccio i el tiquet actiu, /caixa/<tiquet>.'],
        ['cataleg.onTria(article, { obriDetall })', 'funció', '—', 'El toc afig la variant per defecte; un producte amb grup obligatori obri el diàleg menut.'],
        ['cataleg.detall.triaDirecta', 'boolean | (article) => boolean', 'false', 'El diàleg menut: un toc tria i tanca. Amb el botó dret, el detall sencer (variant, quantitat, nota).'],
        ['colleccio', '{ linies, resum, onResta, onSuma, onLleva }', '—', 'La comanda: «quantitat × nom», total i Cobra.'],
        ['colleccions', '{ colleccions, actiu, hrefDe }', 'null', 'Els tiquets oberts (Barra, taules): cada targeta és un enllaç al seu tiquet.']
      ]}
      a11y={['Cada producte és un botó natiu: nom i preu. El detall s’obri també amb el botó dret o Maj+F10.', 'L’estat «a la comanda» porta text per al lector, no només color.', 'Tota la vista és a la URL: tiquet, categoria, vista, detall obert i panell.']}
      fes={['Passar els preus ja formats (formatEuros): l’esquelet no sap de cèntims.', 'Llegir el tiquet actiu amb useColleccioActiva i muntar EsqueletCatalegColleccio amb la mateixa rutaColleccio.']}
      noFacis={['Fer una graella de productes pròpia al Bar: és la de l’esquelet.', 'Obrir el detall sencer a cada toc d’un producte amb variants: el toc afig la per defecte.', 'Posar colors per categoria: la icona i el nom la distingixen.']}>
      <MostraEsquelet rutaInicial="/app/bar/caixa">
        <TpvDeMostra />
      </MostraEsquelet>
    </Especimen>
  );
}

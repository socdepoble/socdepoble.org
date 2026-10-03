/**
 * SeccionsCategoria.jsx — les categories d'un catàleg (esquelet comú T4/T8).
 *
 * Tres peces que comparteixen la forma de categoria { id, nom, icona?,
 * visible, ordre }:
 *
 *   SeccionsCategoria  els articles agrupats per categoria, en l'ordre de la
 *                      persona. Amb onPlega, cada secció es plega amb un botó
 *                      de capçalera (aria-expanded). El contingut de cada
 *                      secció el pinta qui la munta: children(articles, categoria).
 *   SelectorCategoria  filtra per una categoria: pastilles (PillToggle) o un
 *                      desplegable natiu (Camp + Selector). «Totes» és null.
 *   OrdenaCategories   ordenar amunt i avall amb botons (sense arrossegar) i
 *                      mostrar o amagar cada categoria. El focus no es perd en
 *                      moure una fila, i un avís diu la posició nova.
 *
 * Cap color per categoria: la icona i el nom la distingixen.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { PillToggle } from '../molecules/PillToggle.jsx';
import { Camp, Selector } from './formulari.jsx';
import { TEXTOS_ARTICLES, agrupaPerCategoria, categoriesEnOrdre, categoriesVisibles } from './articles.js';
import { pintaIcona } from './marca.jsx';

const NIVELLS = Object.freeze([3, 4, 5, 6]);

export function SeccionsCategoria({
  categories = [], articles = [], children, plegades = [], onPlega, nivell = 3,
  textSenseCategoria = TEXTOS_ARTICLES.senseCategoria, textArticles = (n) => `${n} ${n === 1 ? 'article' : 'articles'}`,
  buit = null, className
}) {
  const id = useId();
  const grups = agrupaPerCategoria(articles, categories, textSenseCategoria);
  if (grups.length === 0) return buit;
  const Cap = `h${NIVELLS.includes(nivell) ? nivell : 3}`;
  const plegable = typeof onPlega === 'function';
  const tancades = new Set(Array.isArray(plegades) ? plegades : []);
  return (
    <div className={['sdp-seccions', className].filter(Boolean).join(' ')}>
      {grups.map(({ categoria, articles: delGrup }, i) => {
        const plegada = plegable && tancades.has(categoria.id);
        const idCap = `${id}-cap-${i}`;
        const idCos = `${id}-cos-${i}`;
        const nom = (
          <>
            {pintaIcona(categoria.icona)}
            <span className="sdp-seccio__nom">{categoria.nom}</span>
            {' '}<span className="sdp-seccio__comptador">{textArticles(delGrup.length)}</span>
          </>
        );
        return (
          <section key={categoria.id} className="sdp-seccio" aria-labelledby={idCap}>
            <Cap id={idCap} className="sdp-seccio__cap">
              {plegable ? (
                <button type="button" className="sdp-seccio__plega" aria-expanded={!plegada} aria-controls={idCos}
                  onClick={() => onPlega(categoria.id, !plegada)}>
                  {nom}
                  <ChevronRight className="sdp-seccio__fletxa" size={20} aria-hidden="true" focusable="false" />
                </button>
              ) : <span className="sdp-seccio__titol">{nom}</span>}
            </Cap>
            <div id={idCos} className="sdp-seccio__cos" hidden={plegada}>
              {plegada || typeof children !== 'function' ? null : children(delGrup, categoria)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function SelectorCategoria({
  categories = [], valor = null, onCanvi, forma = 'pastilles', etiqueta = 'Categoria', textTotes = 'Totes', className
}) {
  const visibles = categoriesVisibles(categories);
  const classes = ['sdp-selector-categoria', forma === 'desplegable' && 'sdp-selector-categoria--desplegable', className]
    .filter(Boolean).join(' ');
  const tria = (nou) => onCanvi?.(nou ? nou : null);
  if (forma === 'desplegable') {
    return (
      <div className={classes}>
        <Camp etiqueta={etiqueta}>
          <Selector value={valor ?? ''} onChange={(event) => tria(event.target.value)}
            opcions={[{ valor: '', etiqueta: textTotes }, ...visibles.map((c) => ({ valor: c.id, etiqueta: c.nom }))]} />
        </Camp>
      </div>
    );
  }
  return (
    <div className={classes}>
      <PillToggle etiqueta={etiqueta} valor={valor ?? ''} onCanvi={tria}
        opcions={[{ valor: '', text: textTotes }, ...visibles.map((c) => ({ valor: c.id, text: c.nom, icona: pintaIcona(c.icona) }))]} />
    </div>
  );
}

const TEXTOS_ORDENA = Object.freeze({
  puja: (nom) => `Puja ${nom}`,
  baixa: (nom) => `Baixa ${nom}`,
  mostra: (nom) => `Mostra ${nom}`,
  amagada: 'amagada',
  posicio: (nom, posicio, total) => `${nom}: posició ${posicio} de ${total}.`
});

/**
 * onMou(id, -1 | 1) · onVisibilitat(id, visible). Les categories arriben amb
 * l'ordre ja desat; mouCategoria (articles.js) en fa la llista nova.
 */
export function OrdenaCategories({ categories = [], onMou, onVisibilitat, etiqueta = 'Ordre de les categories', textos, className }) {
  const t = { ...TEXTOS_ORDENA, ...textos };
  const ordenades = categoriesEnOrdre(categories);
  const llista = useRef(null);
  const pendent = useRef(null);
  const [avis, setAvis] = useState('');

  /* Moure una fila la treu i la torna a posar al DOM: el navegador perd el
     focus. Es torna al mateix botó o, si ha arribat a la vora i ja no es pot
     prémer, al de la direcció contrària. */
  useLayoutEffect(() => {
    const desti = pendent.current;
    if (!desti || !llista.current) return;
    pendent.current = null;
    const botons = [...llista.current.querySelectorAll('button[data-categoria]')]
      .filter((boto) => boto.dataset.categoria === desti.id);
    const mateix = botons.find((boto) => boto.dataset.accio === desti.accio && !boto.disabled);
    const altre = botons.find((boto) => (boto.dataset.accio === 'puja' || boto.dataset.accio === 'baixa') && !boto.disabled);
    (mateix || altre)?.focus();
  });

  const mou = (categoria, accio, posicio) => {
    pendent.current = { id: categoria.id, accio };
    const nova = posicio + (accio === 'puja' ? -1 : 1);
    setAvis(t.posicio(categoria.nom, nova + 1, ordenades.length));
    onMou?.(categoria.id, accio === 'puja' ? -1 : 1);
  };

  return (
    <div className={['sdp-ordena-categories', className].filter(Boolean).join(' ')}>
      <ol ref={llista} className="sdp-ordena-categories__llista" aria-label={etiqueta}>
        {ordenades.map((categoria, posicio) => {
          const visible = categoria.visible !== false;
          return (
            <li key={categoria.id} className={visible ? 'sdp-ordena-categories__fila' : 'sdp-ordena-categories__fila sdp-ordena-categories__fila--amagada'}>
              {pintaIcona(categoria.icona)}
              <span className="sdp-ordena-categories__nom">
                {categoria.nom}
                {visible ? null : <span className="sdp-nomes-lector">{` (${t.amagada})`}</span>}
              </span>
              {onVisibilitat ? (
                <button type="button" className="sdp-accio-icona" data-categoria={categoria.id} data-accio="mostra"
                  aria-pressed={visible} aria-label={t.mostra(categoria.nom)} onClick={() => onVisibilitat(categoria.id, !visible)}>
                  {visible ? <Eye size={22} aria-hidden="true" focusable="false" /> : <EyeOff size={22} aria-hidden="true" focusable="false" />}
                </button>
              ) : null}
              {onMou ? (
                <>
                  <button type="button" className="sdp-accio-icona" data-categoria={categoria.id} data-accio="puja"
                    aria-label={t.puja(categoria.nom)} disabled={posicio === 0} onClick={() => mou(categoria, 'puja', posicio)}>
                    <ArrowUp size={22} aria-hidden="true" focusable="false" />
                  </button>
                  <button type="button" className="sdp-accio-icona" data-categoria={categoria.id} data-accio="baixa"
                    aria-label={t.baixa(categoria.nom)} disabled={posicio === ordenades.length - 1} onClick={() => mou(categoria, 'baixa', posicio)}>
                    <ArrowDown size={22} aria-hidden="true" focusable="false" />
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="sdp-nomes-lector" role="status">{avis}</p>
    </div>
  );
}

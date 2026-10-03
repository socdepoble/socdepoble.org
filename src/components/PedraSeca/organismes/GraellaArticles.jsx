/**
 * GraellaArticles.jsx — la graella de rajoles 1:1 d'un catàleg (esquelet comú
 * T4/T8): els productes del TPV del bar i els articles de La Compra.
 *
 * Cada article és una Rajola (P2) dins d'una llista. Amb `categories`, la
 * graella s'agrupa en seccions (SeccionsCategoria), en l'ordre de la persona;
 * sense, és una sola graella. La dada (preu, IVA, si està pendent o comprat)
 * no la sap: l'app li passa els articles ja vestits (articles.js).
 *
 *   onTria(article)              el toc. Què fa (afegir una unitat, posar-lo
 *                                a la llista) ho decidix l'app.
 *   onAccioSecundaria(article)   pulsació llarga, botó dret o Maj+F10: el
 *                                detall de l'article (pulsacioLlarga.js).
 *   commutable                   el toc posa i lleva de la col·lecció (La
 *                                Compra): la rajola diu aria-pressed. Sense,
 *                                cada toc és una acció (el TPV).
 *   textos                       { 'en-colleccio', desactivat, pista }: els
 *                                textos d'estat, que no van mai només pel color.
 *   renderMedia(article)         un quadrat propi (la foto definitiva del Bar).
 *   plegades / onPlega           les seccions plegades (SeccionsCategoria).
 */
import { useId } from 'react';
import { Check } from 'lucide-react';
import { Rajola } from '../molecules/Rajola.jsx';
import { pintaArticles } from './agrupacio.jsx';
import { estatArticle, liniaSecundaria } from './articles.js';
import { pintaMarca } from './marca.jsx';
import { usePulsacioLlarga } from './pulsacioLlarga.js';

/* Desactivat no necessita classe: la Rajola ja és disabled i es pinta com a tal. */
const CLASSE_ELEMENT = Object.freeze({
  normal: 'sdp-graella-articles__element',
  'en-colleccio': 'sdp-graella-articles__element sdp-graella-articles__element--en-colleccio',
  desactivat: 'sdp-graella-articles__element'
});

function Reixa({ articles, etiqueta, categoriesPerId, onTria, onAccioSecundaria, commutable, textos, renderMedia, idPista, className }) {
  const id = useId();
  const premuda = usePulsacioLlarga(onAccioSecundaria);
  return (
    <ul className={['sdp-graella-articles', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {articles.map((article, i) => {
        const estat = estatArticle(article);
        const idEstat = `${id}-estat-${i}`;
        const idInsignia = `${id}-insignia-${i}`;
        const descrit = [estat !== 'normal' && idEstat, article.insignia && idInsignia, onAccioSecundaria && idPista]
          .filter(Boolean).join(' ');
        const { handlers, consumeix } = premuda(article);
        return (
          <li key={article.id} className={CLASSE_ELEMENT[estat]}>
            <Rajola
              titol={article.nom}
              secundari={liniaSecundaria(article) || null}
              imatge={article.imatge}
              media={pintaMarca(article, categoriesPerId.get(article.categoriaId), renderMedia)}
              desactivada={estat === 'desactivat'}
              seleccionada={commutable ? estat === 'en-colleccio' : undefined}
              aria-describedby={descrit || undefined}
              aria-keyshortcuts={onAccioSecundaria ? 'Shift+F10' : undefined}
              data-article={article.id}
              {...handlers}
              onClick={() => {
                if (consumeix()) return;
                onTria?.(article);
              }}
            />
            {estat === 'en-colleccio' ? (
              <span className="sdp-graella-articles__marca-colleccio" aria-hidden="true">
                <Check size={16} focusable="false" />
              </span>
            ) : null}
            {article.insignia ? <span id={idInsignia} className="sdp-graella-articles__insignia">{article.insignia}</span> : null}
            {estat !== 'normal' ? <span id={idEstat} className="sdp-nomes-lector">{textos[estat]}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function GraellaArticles(props) {
  const idPista = useId();
  return pintaArticles(Reixa, props, idPista, 'sdp-graella-articles__seccions');
}

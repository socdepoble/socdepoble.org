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
 *   panoramica                   EXCEPCIÓ a la regla 1:1 (Pedra Seca §8),
 *                                autoritzada pel Mestre el 261003 i només per
 *                                al Lector de notícies: imatge i marcador en
 *                                16:9 (agrupacio.jsx). LlistaArticles igual.
 *   estilCompra                  v1.2.17 · Gauntlet R1 (L3-07) · Només amb
 *                                `true`: cada reixa porta el modificador
 *                                .sdp-graella-articles--compra, l'estil de la
 *                                llista de la compra (IDEA-303, La compra de
 *                                la Nevera). Sense, la reixa de sempre, byte a
 *                                byte (el TPV del Bar, Salut i /disseny).
 */
import { useId } from 'react';
import { Check } from 'lucide-react';
import { Rajola } from '../molecules/Rajola.jsx';
import { pintaArticles } from './agrupacio.jsx';
import { estatArticle, liniaSecundaria } from './articles.js';
import { pintaMarca } from './marca.jsx';
import { usePulsacioLlarga } from './pulsacioLlarga.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitCatalegColleccio from '../../../css/diferit-cataleg-colleccio.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'cataleg-colleccio', cssDiferitCatalegColleccio); };

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
    <ul ref={adoptaEstilsDiferits} className={['sdp-graella-articles', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {articles.map((article, i) => {
        const estat = estatArticle(article);
        const idEstat = `${id}-estat-${i}`;
        const idInsignia = `${id}-insignia-${i}`;
        const descrit = [estat !== 'normal' && idEstat, article.insignia && idInsignia, onAccioSecundaria && idPista]
          .filter(Boolean).join(' ');
        const { handlers, consumeix } = premuda(article);
        return (
          <li ref={adoptaEstilsDiferits} key={article.id} className={CLASSE_ELEMENT[estat]}>
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
              data-element={article.id}
              {...handlers}
              onClick={() => {
                if (consumeix()) return;
                onTria?.(article);
              }}
            />
            {estat === 'en-colleccio' ? (
              <span ref={adoptaEstilsDiferits} className="sdp-graella-articles__marca-colleccio" aria-hidden="true">
                <Check size={16} focusable="false" />
              </span>
            ) : null}
            {article.insignia ? <span ref={adoptaEstilsDiferits} id={idInsignia} className="sdp-graella-articles__insignia">{article.insignia}</span> : null}
            {estat !== 'normal' ? <span ref={adoptaEstilsDiferits} id={idEstat} className="sdp-nomes-lector">{textos[estat]}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/* v1.2.17 · Gauntlet R1 (L3-07) · La mateixa reixa amb el modificador de la llista de la compra, a
   cada reixa (també dins de les seccions, on pintaArticles no passa className). */
const CLASSE_COMPRA = 'sdp-graella-articles--compra';
function ReixaCompra({ className, ...props }) {
  return <Reixa {...props} className={[CLASSE_COMPRA, className].filter(Boolean).join(' ')} />;
}

/**
 * @deprecated Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar
 *   targetes»): obsoleta per a codi nou. Una graella de continguts va amb
 *   UniversalCard dins de GraellaTargetes. Salut i el Bar encara la fan
 *   servir: no s'esborra.
 */
export function GraellaArticles({ estilCompra = false, ...props }) {
  const idPista = useId();
  return pintaArticles(estilCompra === true ? ReixaCompra : Reixa, props, idPista, 'sdp-graella-articles__seccions');
}

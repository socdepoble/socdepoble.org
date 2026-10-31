/**
 * LlistaArticles.jsx — la mateixa dada que GraellaArticles en files (esquelet
 * comú T4/T8): miniatura o marcador 1:1, nom, línia secundària i el valor a
 * la dreta («1,50 €», «2 variants», «2 kg»). Les dues vistes accepten les
 * mateixes props i s'intercanvien amb el selector de vista: ningú no ha de
 * pensar en quina de les dues pinta.
 *
 * Cada fila és un <button> natiu de --sdp-touch-comode com a mínim. Estat,
 * insígnia i acció secundària funcionen igual que a la graella.
 *
 *   panoramica   EXCEPCIÓ a la regla 1:1 (Pedra Seca §8), autoritzada pel
 *                Mestre el 261003 i només per al Lector de notícies: la
 *                miniatura i el marcador van en 16:9, amb l'alçada de
 *                --sdp-touch (agrupacio.jsx i src/css/modules.css, bloc
 *                catalegColleccio). La guarda és
 *                PedraSeca/qualitat.panoramica.test.js.
 */
import { useId } from 'react';
import { Check } from 'lucide-react';
import { pintaArticles } from './agrupacio.jsx';
import { estatArticle } from './articles.js';
import { pintaQuadrat } from './marca.jsx';
import { usePulsacioLlarga } from './pulsacioLlarga.js';

/* Desactivat no necessita classe: la fila ja és disabled i es pinta com a tal. */
const CLASSE_ELEMENT = Object.freeze({
  normal: 'sdp-llista-articles__element',
  'en-colleccio': 'sdp-llista-articles__element sdp-llista-articles__element--en-colleccio',
  desactivat: 'sdp-llista-articles__element'
});

function Files({ articles, etiqueta, categoriesPerId, onTria, onAccioSecundaria, commutable, textos, renderMedia, idPista, className }) {
  const id = useId();
  const premuda = usePulsacioLlarga(onAccioSecundaria);
  return (
    <ul className={['sdp-llista-articles', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {articles.map((article, i) => {
        const estat = estatArticle(article);
        const idEstat = `${id}-estat-${i}`;
        const idInsignia = `${id}-insignia-${i}`;
        const descrit = [estat !== 'normal' && idEstat, article.insignia && idInsignia, onAccioSecundaria && idPista]
          .filter(Boolean).join(' ');
        const { handlers, consumeix } = premuda(article);
        return (
          <li key={article.id} className={CLASSE_ELEMENT[estat]}>
            <button
              type="button"
              className="sdp-llista-articles__fila"
              disabled={estat === 'desactivat'}
              aria-pressed={commutable ? estat === 'en-colleccio' : undefined}
              aria-describedby={descrit || undefined}
              aria-keyshortcuts={onAccioSecundaria ? 'Shift+F10' : undefined}
              data-article={article.id}
              {...handlers}
              onClick={() => {
                if (consumeix()) return;
                onTria?.(article);
              }}
            >
              <span className="sdp-llista-articles__quadrat" aria-hidden="true">
                {pintaQuadrat(article, categoriesPerId.get(article.categoriaId), renderMedia)}
              </span>
              <span className="sdp-llista-articles__text">
                <span className="sdp-llista-articles__nom">{article.nom}</span>
                {article.secundari ? <>{' '}<span className="sdp-llista-articles__secundari">{article.secundari}</span></> : null}
              </span>
              {article.valor ? <>{' '}<span className="sdp-llista-articles__valor">{article.valor}</span></> : null}
            </button>
            {estat === 'en-colleccio' ? (
              <span className="sdp-llista-articles__marca-colleccio" aria-hidden="true">
                <Check size={16} focusable="false" />
              </span>
            ) : null}
            {article.insignia ? <span id={idInsignia} className="sdp-llista-articles__insignia">{article.insignia}</span> : null}
            {estat !== 'normal' ? <span id={idEstat} className="sdp-nomes-lector">{textos[estat]}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Les mateixes props que GraellaArticles.
 * @deprecated Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar
 *   targetes»): obsoleta per a codi nou. Una llista de continguts va amb
 *   UniversalCard (variant 'pla') dins de GraellaTargetes (variant 'llista').
 *   Salut i el Bar encara la fan servir: no s'esborra.
 */
export function LlistaArticles(props) {
  const idPista = useId();
  return pintaArticles(Files, props, idPista, 'sdp-llista-articles__seccions');
}

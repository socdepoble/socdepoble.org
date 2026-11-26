/**
 * BlocTerritoriTargeta.jsx — IDEA-360 (v1.2.26 · Taxonomia Geogràfica en text
 * pla clicable centrat, mida paràgraf, zero pastilles/píndoles).
 *
 * Situat davall de les píndoles de categories/etiquetes i just damunt del
 * copyright (`CC BY-NC-SA 4.0`). Lot C1-3 (D1 de l'integrador) · Adopta només
 * el seu full, `diferit-territori-v26.css`, amb la clau 'territori-v26': el seu
 * ?inline viatja amb UniversalCard, i cada targeta ja no arrossega el full
 * sencer de taxonomia. La resta de `diferit-taxonomia-v26.css` es queda per
 * als consumidors diferits.
 * Les rutes internes van sempre amb el Link del router, que sense
 * RouterProvider pinta l'<a> de sempre (RouterContext.jsx, FN0-001). Els dos
 * textos venen d'i18nTerritoriTargetaV26.js: el diccionari sencer de G26-2 no
 * entra a l'arrencada estàtica.
 */
import { Fragment } from 'react';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssTerritoriV26 from '../../../css/diferit-territori-v26.css?inline';
import { isSafeUrl } from '../../universal/UniversalUtils.js';
import { textosTerritoriTargetaV26 } from '../../../data/taxonomia/i18nTerritoriTargetaV26.js';

const adoptaEstilsTerritori = (node) => {
  if (node) adoptaFullDiferit(node, 'territori-v26', cssTerritoriV26);
};

export function BlocTerritoriTargeta({ elements, idioma = 'ca' }) {
  if (!Array.isArray(elements) || elements.length === 0) return null;
  const valids = elements.filter((el) => el && typeof el.text === 'string' && el.text.trim() && isSafeUrl(el.href));
  if (valids.length === 0) return null;
  const tx = textosTerritoriTargetaV26(idioma);

  return (
    <nav ref={adoptaEstilsTerritori} className="sp-card-territori" aria-label={tx.taxonomiaV26TerritoriAria}>
      {valids.map((el, index) => {
        const esExtern = el.href.startsWith('http');
        const labelAria = el.nivell === 'paratge'
          ? tx.taxonomiaV26ObrirMapaParatge.replace('{lloc}', () => el.text)
          : undefined;
        return (
          <Fragment key={el.id || `${el.href}-${index}`}>
            {index > 0 ? <span className="sp-card-territori__sep" aria-hidden="true">·</span> : null}
            {esExtern ? (
              <a
                href={el.href}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-card-territori__enllac"
                aria-label={labelAria}
              >
                {el.text}
              </a>
            ) : (
              <Link to={el.href} className="sp-card-territori__enllac" aria-label={labelAria}>
                {el.text}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default BlocTerritoriTargeta;

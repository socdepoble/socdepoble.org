import React, { useContext, useState } from 'react';
import {
  useResolvedAssetState
} from '../../../hooks/useResolvedAsset.js';
import { GlifCategoriaContext, emojiInicial, esGlif, primerGlif } from './NavGlyph.jsx';
import { emojiSol } from '../../../utils/emoji.js';

/* Ordre del Mestre (261007) · «Allà on ara hi ha emojis menuts a la columna
   central s'han de mostrar a mida XL». Un glif que és un emoji omple el
   quadrat: la classe de l'emoji XL (modules.css), proporcional a la mida de
   la fitxa (96px, o 86px al Bloc de Notes). No és un element «__…» de la
   fitxa: la porta tractor-fitxa-gestor (F8) només en coneix sis. Una icona
   de Lucide, un text que no és cap emoji i la inicial es queden com eren. */
const CLASSE_INICIAL = 'sdp-gestor-fitxa__inicial';
const CLASSE_EMOJI_XL = `${CLASSE_INICIAL} sdp-fitxa-emoji-xl`;

function ResolvedImage({ src, fallback }) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback;

  return (
    <img
      className="sdp-gestor-fitxa__imatge"
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Mitjà de la fitxa. Sense imatge (o si falla), l'ordre és:
 *   1. el glif propi de l'element (`item.icon`: emoji o component);
 *   2. l'emoji amb què comença el títol;
 *   3. el glif de la seua categoria (`categoryGlyph` o, dins d'un espai de
 *      treball, el que resol GlifCategoriaContext);
 *   4. la lletra inicial del títol, només si no hi ha res més.
 * Un emoji (de 1, 2 o 3) es pinta XL (CLASSE_EMOJI_XL).
 */
export function ItemMedia({
  item,
  titleFallback,
  categoryGlyph = null,
  className = '',
  assetScopeKey = ''
}) {
  const assetRef = typeof item?.image === 'string'
    ? item.image.trim()
    : '';

  const { url, status } = useResolvedAssetState(assetRef, {
    scopeKey: assetScopeKey
  });
  const glifDeCategoria = useContext(GlifCategoriaContext);

  const title =
    String(item?.title ?? '').trim()
    || String(titleFallback ?? '').trim()
    || '?';

  const glif = (esGlif(item?.icon) ? item.icon : null)
    || emojiInicial(title)
    || primerGlif(categoryGlyph, glifDeCategoria?.(item));

  let fallback;
  if (typeof glif === 'string') {
    fallback = <span className={emojiSol(glif) ? CLASSE_EMOJI_XL : CLASSE_INICIAL}>{glif}</span>;
  } else if (glif) {
    const Icon = glif;
    fallback = <Icon size={24} />;
  } else {
    fallback = (
      <span className={CLASSE_INICIAL}>
        {Array.from(title)[0].toLocaleUpperCase('ca')}
      </span>
    );
  }

  return (
    <span
      className={`sdp-gestor-fitxa__media ${className}`.trim()}
      aria-hidden="true"
      data-asset-status={status}
    >
      {status === 'ready' && url ? (
        <ResolvedImage
          key={JSON.stringify([assetScopeKey, assetRef, url])}
          src={url}
          fallback={fallback}
        />
      ) : fallback}
    </span>
  );
}

import React, { useContext, useState } from 'react';
import {
  useResolvedAssetState
} from '../../../hooks/useResolvedAsset.js';
import { GlifCategoriaContext, emojiInicial, esGlif, primerGlif } from './NavGlyph.jsx';

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
    fallback = <span className="sdp-gestor-fitxa__inicial">{glif}</span>;
  } else if (glif) {
    const Icon = glif;
    fallback = <Icon size={24} />;
  } else {
    fallback = (
      <span className="sdp-gestor-fitxa__inicial">
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

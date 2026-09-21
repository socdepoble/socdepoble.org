import React, { useState } from 'react';
import {
  useResolvedAssetState
} from '../../../hooks/useResolvedAsset.js';

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

export function ItemMedia({
  item,
  titleFallback,
  className = '',
  assetScopeKey = ''
}) {
  const assetRef = typeof item?.image === 'string'
    ? item.image.trim()
    : '';

  const { url, status } = useResolvedAssetState(assetRef, {
    scopeKey: assetScopeKey
  });

  const Icon = item?.icon;

  const title =
    String(item?.title ?? '').trim()
    || String(titleFallback ?? '').trim()
    || '?';

  const initial = Array.from(title)[0].toLocaleUpperCase('ca');

  const fallback = Icon ? (
    <Icon size={24} className="sdp-gestor-fitxa__icona" />
  ) : (
    <span className="sdp-gestor-fitxa__inicial">
      {initial}
    </span>
  );

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

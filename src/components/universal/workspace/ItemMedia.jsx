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

  let emoji = null;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const firstSegment = [...new Intl.Segmenter('ca', { granularity: 'grapheme' }).segment(title)][0]?.segment || '';
    if (/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u.test(firstSegment)) {
      emoji = firstSegment;
    }
  } else {
    const fallbackMatch = title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    if (fallbackMatch) emoji = fallbackMatch[1];
  }

  const initial = emoji || Array.from(title)[0].toLocaleUpperCase('ca');

  const fallback = Icon ? (
    typeof Icon === 'string' ? (
      <span className="sdp-gestor-fitxa__inicial">{Icon}</span>
    ) : (
      <Icon size={24} />
    )
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

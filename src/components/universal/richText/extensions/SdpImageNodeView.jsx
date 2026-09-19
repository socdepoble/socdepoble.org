import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useResolvedAsset } from '../../../../hooks/useResolvedAsset.js';

export default function SdpImageNodeView(props) {
  const { node } = props;
  const src = node.attrs.src;
  const resolvedSrc = useResolvedAsset(src);

  return (
    <NodeViewWrapper as="span" className="sdp-imatge-wrapper" data-drag-handle>
      <img
        src={resolvedSrc || src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className="sdp-imatge-cos"
        loading="lazy"
        decoding="async"
      />
    </NodeViewWrapper>
  );
}

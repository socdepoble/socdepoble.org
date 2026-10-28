import { NodeViewWrapper } from '@tiptap/react';
import { useResolvedAsset } from '../../../../hooks/useResolvedAsset.js';

/* P1-64 (pla 261028_1526 §3.1.1) · El registre d'una foto del cos (els
   atributs del node SdpImage, richText/extensions/index.js) es pinta com a
   data-* només si hi és: la foto es veu igual (Llei del Píxel). */
const DADES_DE_LA_FOTO = Object.freeze([['lat', 'data-lat'], ['lng', 'data-lng'], ['precisio', 'data-precisio'], ['captura', 'data-captura']]);

export default function SdpImageNodeView(props) {
  const { node } = props;
  const src = node.attrs.src;
  const resolvedSrc = useResolvedAsset(src);
  const dades = Object.fromEntries(DADES_DE_LA_FOTO.filter(([clau]) => node.attrs[clau] != null).map(([clau, nom]) => [nom, String(node.attrs[clau])]));

  return (
    <NodeViewWrapper as="span" data-drag-handle>
      <img
        src={resolvedSrc || src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        {...dades}
        loading="lazy"
        decoding="async"
      />
    </NodeViewWrapper>
  );
}

import { NodeViewWrapper } from '@tiptap/react';
import { useResolvedAsset } from '../../../../hooks/useResolvedAsset.js';
import { CLASSE_ENLLAC_IMATGE, atributsDeLEnllac } from './enllacImatge.js';

/* P1-64 (pla 261028_1526 §3.1.1) · El registre d'una foto del cos (els
   atributs del node SdpImage, richText/extensions/index.js) es pinta com a
   data-* només si hi és: la foto es veu igual (Llei del Píxel). */
const DADES_DE_LA_FOTO = Object.freeze([['lat', 'data-lat'], ['lng', 'data-lng'], ['precisio', 'data-precisio'], ['captura', 'data-captura']]);
/* P0-26 D1 · Una imatge enllaçada (enllacImatge.js) es veu com a tal dins de
   l'editor: l'adreça, davall, sense navegar en fer-hi clic (no és un <a>). */
const CLASSE_ADRECA = `${CLASSE_ENLLAC_IMATGE}__adreca`;

export default function SdpImageNodeView(props) {
  const { node } = props;
  const src = node.attrs.src;
  const resolvedSrc = useResolvedAsset(src);
  const dades = Object.fromEntries(DADES_DE_LA_FOTO.filter(([clau]) => node.attrs[clau] != null).map(([clau, nom]) => [nom, String(node.attrs[clau])]));
  const enllac = atributsDeLEnllac(node.attrs);

  return (
    <NodeViewWrapper as="span" data-drag-handle className={enllac ? CLASSE_ENLLAC_IMATGE : undefined}>
      <img
        src={resolvedSrc || src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        {...dades}
        loading="lazy"
        decoding="async"
      />
      {enllac ? <span className={CLASSE_ADRECA} contentEditable={false}>{enllac.href}</span> : null}
    </NodeViewWrapper>
  );
}

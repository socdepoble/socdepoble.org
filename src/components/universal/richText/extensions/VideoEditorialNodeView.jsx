import { NodeViewWrapper } from '@tiptap/react';
import { VideoEditorial } from '../../VideoEditorial.jsx';

/** R12 · El vídeo es veu també a l'editor; el node es mou o es lleva com una foto.
 *  L'iframe el pinta VideoEditorial amb l'id ja validat; el document no en guarda cap. */
export default function VideoEditorialNodeView({ node }) {
  return (
    <NodeViewWrapper className="aplec-2023__video" contentEditable={false} data-drag-handle="">
      <VideoEditorial id={node.attrs.id} title={node.attrs.title} />
    </NodeViewWrapper>
  );
}

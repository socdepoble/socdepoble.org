/**
 * TargetaIncrustadaNodeView.jsx — Una targeta incrustada, dins de l'editor.
 *
 * T7 (ordre del Mestre, prompt 261004_0515) · És la UniversalCard sencera
 * (caputxa taronja, cos i peu blau) en mode previsualització, com la
 * targeta viva: els botons ensenyen les proporcions però no fan res, i el
 * clic ho diu el diàleg únic del consumidor (TargetesIncrustadesContext ·
 * avisa). Sense mainHref: un Link de tota la targeta dins del contenteditable
 * navegaria fora de l'editor. La boina, en canvi, porta l'autor enllaçat a la
 * seua pàgina (regla d'or 1 del Mestre, 261004): el clic a qualsevol enllaç
 * de la targeta es para en la captura i avisa, com les accions del peu.
 *
 * Amb la targeta triada, davall d'ella: Esquerra i Dreta (només si és la
 * «sola» del seu grup) i Llevar. Els botons els gestiona React: el stopEvent
 * del node (targetesIncrustades.js · esDeLaTargeta) no deixa que l'editor
 * se'ls quede. Arrossegar, en canvi, és de ProseMirror encara que comence a
 * la boina de l'autor: la targeta es mou sencera.
 *
 * Ordre del Mestre (261007) · «Cards de veritat», també a l'editor: si
 * l'original es resol, la previsualització en porta les dades vives
 * (TargetesSincronitzadesContext · useTargetaSincronitzada), les mateixes de la
 * lectura. Les accions continuen sent els avisos de l'editor, i l'HTML desat
 * no canvia: la instantània continua sent la reserva.
 */
import { useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { AlignLeft, AlignRight, Trash2 } from 'lucide-react';
/* Directes, no pel barril de PedraSeca: el mòdul d'extensions el carrega
   l'editor, i el barril arrossegaria tot el sistema de disseny. */
import { UniversalCard } from '../../../../PedraSeca/organismes/UniversalCard.jsx';
import { Boto } from '../../../../PedraSeca/atoms/Boto.jsx';
import { useImatgeResolta } from '../../../../../hooks/useImatgeTargeta.js';
import { useTargetesIncrustades } from './TargetesIncrustadesContext.js';
import { NOM_GRUP, alineacioValida, formaDe, propsDeTargetaIncrustada } from './formaDelGrup.js';
import { useTargetaSincronitzada } from './TargetesSincronitzadesContext.js';

const senseTraductor = (_clau, text) => text;

/* La forma i l'alineació del grup de la targeta en este moment, o null. Es
   llig quan la targeta està triada: és quan es pinten les eines. */
function grupDe(editor, getPos) {
  const pos = typeof getPos === 'function' ? getPos() : null;
  if (typeof pos !== 'number' || !editor?.state) return null;
  const pare = editor.state.doc.resolve(pos).parent;
  if (pare?.type?.name !== NOM_GRUP) return null;
  return { forma: formaDe(pare.childCount), alineacio: alineacioValida(pare.attrs.alineacio) };
}

export default function TargetaIncrustadaNodeView({ node, editor, getPos, selected = false, deleteNode }) {
  const context = useTargetesIncrustades();
  const t = context?.t || senseTraductor;
  const avisaConsumidor = context?.avisa;

  const avisa = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    avisaConsumidor?.();
  }, [avisaConsumidor]);

  /* Regla d'or 1 · Un enllaç de la targeta (la boina de l'autor) no navega
     des de l'editor: el clic es para abans d'arribar-hi (captura) i avisa. */
  const paraEnllac = useCallback((event) => {
    if (event?.target?.closest?.('a')) avisa(event);
  }, [avisa]);

  const props = useTargetaSincronitzada(node.attrs, propsDeTargetaIncrustada(node.attrs, { mode: 'edicio', avisa }));
  const imatge = useImatgeResolta(props.imageUrl);

  const editable = Boolean(editor?.isEditable);
  const grup = selected && editable ? grupDe(editor, getPos) : null;
  const alinea = (alineacio) => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos === 'number') editor.chain().focus().alineaTargetes(alineacio, pos).run();
  };

  return (
    <NodeViewWrapper data-drag-handle="" onClickCapture={paraEnllac}>
      <UniversalCard {...props} imageUrl={imatge} />
      {selected && editable ? (
        <div className="sdp-targeta-incrustada__eines" role="group" aria-label={t('editor.targetes.eines', 'Eines de la targeta')}>
          {grup?.forma === 'sola' ? (
            <>
              <Boto icona={AlignLeft} aria-pressed={grup.alineacio === 'esquerra'} onClick={() => alinea('esquerra')}>
                {t('editor.targetes.esquerra', 'Esquerra')}
              </Boto>
              <Boto icona={AlignRight} aria-pressed={grup.alineacio === 'dreta'} onClick={() => alinea('dreta')}>
                {t('editor.targetes.dreta', 'Dreta')}
              </Boto>
            </>
          ) : null}
          <Boto varietat="fantasma" icona={Trash2} onClick={() => deleteNode?.()}>
            {t('editor.targetes.lleva', 'Llevar la targeta')}
          </Boto>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

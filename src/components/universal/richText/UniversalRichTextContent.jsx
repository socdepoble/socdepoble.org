import { EditorContent } from '@tiptap/react';

export function UniversalRichTextContent({ editor }) {
  const handleClickArea = (e) => {
    // Si la persona clica a l'espai en blanc del full (fora de qualsevol text ja escrit)
    if (editor && !editor.isDestroyed && (e.target === e.currentTarget || e.target.classList?.contains('ProseMirror'))) {
      if (!editor.isFocused) {
        editor.commands.focus('end');
      }
    }
  };

  return (
    <div 
      className="sdp-editor-full-canvas" 
      onClick={handleClickArea}
      data-testid="sdp-editor-full-canvas"
    >
      <EditorContent editor={editor} />
    </div>
  );
}

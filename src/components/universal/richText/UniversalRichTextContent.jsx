import { EditorContent } from '@tiptap/react';

export function UniversalRichTextContent({ editor }) {
  const handleClickArea = (e) => {
    // Si la persona clica a l'espai en blanc del full (fora de qualsevol text ja escrit).
    // AH-02 (Onada R21) · Amb el cos en lectura (el repòs), res: el clic no
    // mou la selecció de la persona al final ni enfoca cap cursor.
    if (editor && !editor.isDestroyed && editor.isEditable && (e.target === e.currentTarget || e.target.classList?.contains('ProseMirror'))) {
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

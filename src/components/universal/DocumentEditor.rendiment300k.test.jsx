/* Pas 8.3 del pla 261029_0216 (T8 · Rendiment de /notes; dimensió 4 del
   barem) · Un cos de 300.000 caràcters al TipTap de veres i deu canvis NOMÉS
   del títol pel canal de sempre (updateLocal, com NotesContext): cap camí
   torna a processar el cos.
     · cap transacció de l'editor (ni setContent ni cap sincronia del cos:
       la sincronia d'useUniversalRichText va lligada a [content, editor, id]);
     · cap serialització del cos (editor.getHTML);
     · cap lectura del cos sencer per DOMParser: ni createDocument de TipTap
       (la normalització de «Proposa Card», cosNormalitzat, es memoritza per
       cos) ni el motor del Bloc (la previsió només llig el principi,
       MIDA_PREVISIO). Les lectures que hi ha són els camps menuts i eixe
       principi.
   Codex (ronda 1) va verificar la memòria per cos de DocumentEditor.jsx i la
   prova de DocumentEditor.proposaCard.test.jsx («teclejar als camps amb un
   cos llarg no torna a llegir el cos sencer»); ací es tanca el CPU: el temps
   dels deu canvis s'escriu al registre i la fita és folgada (< 2 s, amb la
   màquina compartida amb altres IA) per a no caure per contenció. Dos cossos:
   el que comença per text (previsió «proposta») i el que comença per una
   llista (previsió «res»: consulta també el cos normalitzat memoritzat). */
import React, { useCallback, useMemo, useState } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, barra: null, doc: null, updateLocal: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: es captura la instància i les props de la barra. */
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: (props) => { m.barra = props; return null; }
}));
import { DocumentEditor } from './DocumentEditor.jsx';
import { MIDA_PREVISIO, proposaCard } from '../../sections/notes/proposaCard.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.editor = null;
  m.barra = null;
  m.doc = null;
});

/* Tres-cents paràgrafs d'uns mil caràcters: un cos de 300.000 caràcters de
   text de veres (nodes de ProseMirror), no una sola imatge en data:. */
const MIDA_COS = 300_000;
const PARAGRAF = `<p>${'Paraula '.repeat(124).trim()}.</p>`;
const cosDe = (principi) => {
  let cos = principi;
  while (cos.length < MIDA_COS) cos += PARAGRAF;
  return cos;
};
const COSSOS = [
  ['text (previsió «proposta»)', cosDe('<p>La festa del poble</p><p>Tres dies de música.</p>'), false],
  ['llista (previsió «res», pel cos normalitzat)', cosDe('<ul><li>una llista primer</li></ul>'), true]
];
const DOC = Object.freeze({ id: 'd1', title: '', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' });

/* Un Bloc de mentira: updateLocal escriu al document, com NotesContext. */
function Banc({ inicial, saveRemote }) {
  const [doc, setDoc] = useState(inicial);
  const updateLocal = useCallback((id, camp, valor) => setDoc((d) => (d.id === id ? { ...d, [camp]: valor } : d)), []);
  const adapter = useMemo(() => ({
    document: doc, labels: [], seedContent: null, updateLocal, saveRemote, proposaCard, deleteDocument: vi.fn()
  }), [doc, updateLocal, saveRemote]);
  m.doc = doc;
  m.updateLocal = updateLocal;
  return <DocumentEditor adapter={adapter} />;
}

for (const [nom, cos, apagat] of COSSOS) {
  test(`cos de 300.000 caràcters que comença per ${nom}: deu canvis del títol no reprocessen el cos`, async () => {
    expect(cos.length).toBeGreaterThanOrEqual(MIDA_COS);
    const saveRemote = vi.fn();
    render(<Banc inicial={{ ...DOC, content: cos }} saveRemote={saveRemote} />);
    expect(m.editor).toBeTruthy();
    expect(m.editor.getHTML().length).toBeGreaterThanOrEqual(MIDA_COS);
    expect(m.barra.proposaCardDisabled).toBe(apagat);

    /* Els tres camins del cos, vigilats només a partir d'ara (el muntatge sí
       que el llig: una vegada per cos, com ha de ser). */
    const transaccions = vi.fn();
    m.editor.on('transaction', transaccions);
    const serialitzacions = vi.spyOn(m.editor, 'getHTML');
    const mides = [];
    const original = window.DOMParser.prototype.parseFromString;
    vi.spyOn(window.DOMParser.prototype, 'parseFromString').mockImplementation(function (text, tipus) {
      mides.push(text.length);
      return original.call(this, text, tipus);
    });

    const inici = performance.now();
    for (let i = 1; i <= 10; i += 1) {
      await act(async () => { m.updateLocal('d1', 'title', `Títol ${i}`); });
    }
    const durada = performance.now() - inici;
    console.info(`[rendiment] cos de ${cos.length} caràcters (${nom}): 10 canvis del títol en ${durada.toFixed(0)} ms`);
    m.editor.off('transaction', transaccions);

    expect(m.doc.title).toBe('Títol 10');
    expect(transaccions).not.toHaveBeenCalled();
    expect(serialitzacions).not.toHaveBeenCalled();
    /* Cap lectura més llarga que el principi que llig la previsió. */
    expect(mides.filter((mida) => mida > MIDA_PREVISIO)).toEqual([]);
    expect(durada).toBeLessThan(2000);

    /* Ni l'autodesament ni «Proposa Card» canvien: el cos no s'ha desat (no
       ha canviat) i el botó diu el mateix que abans. */
    expect(m.doc.content).toBe(cos);
    expect(saveRemote.mock.calls.filter(([, camp]) => camp === 'content')).toEqual([]);
    expect(m.barra.proposaCardDisabled).toBe(apagat);
    expect(m.barra.proposaCardDesfer).toBe(false);
    expect(serialitzacions).not.toHaveBeenCalled();

    /* Prova de la guarda: un cos nou que arriba de fora (una sincronia) sí
       que passa pels tres camins. Si açò no es veiera, les asseveracions de
       dalt no vigilarien res. */
    m.editor.on('transaction', transaccions);
    await act(async () => { m.updateLocal('d1', 'content', `${cos}<p>Fi.</p>`); });
    m.editor.off('transaction', transaccions);
    expect(transaccions).toHaveBeenCalled();
    expect(serialitzacions).toHaveBeenCalled();
    expect(mides.some((mida) => mida >= MIDA_COS)).toBe(true);
    expect(m.editor.getHTML()).toContain('<p>Fi.</p>');
  });
}

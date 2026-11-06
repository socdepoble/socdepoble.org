/* Onada R9 (carril C5) · El document i l'empremta SHA-256 d'una font, plegats en un <details>. Es pinta només el
   que la font porta: la plantilla buida de rutesDePoble.js (sense document ni empremta) no pinta res i no peta
   (R9V-C5-06). Cap empremta que no siga de 64 xifres hexadecimals. */
const EMPREMTA = /^[a-f0-9]{64}$/;

export default function EmpremtaFont({ font, tr, extra = null }) {
  const empremta = typeof font?.sha256 === 'string' && EMPREMTA.test(font.sha256) ? font.sha256 : '';
  const document = typeof font?.document === 'string' ? font.document.trim() : '';
  if (!empremta && !document) return null;
  return (
    <details>
      <summary>{tr('patrimoni.font.empremta', 'Empremta SHA-256 de la font')}</summary>
      {document && <p>{tr('patrimoni.font.document', 'Document')}: <code>{document}</code>{extra}</p>}
      {empremta && <p><code>{empremta.match(/.{1,8}/g).map((tros, i) => <span key={i}>{tros}<wbr /></span>)}</code></p>}
    </details>
  );
}

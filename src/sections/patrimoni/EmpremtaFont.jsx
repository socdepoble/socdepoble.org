/* Onada R9 (carril C5) · El document i l'empremta SHA-256 d'una font, plegats en un <details>. Es pinta només el
   que la font porta: la plantilla buida de rutesDePoble.js (sense document ni empremta) no pinta res i no peta
   (R9V-C5-06). Cap empremta que no siga de 64 xifres hexadecimals.
   v1.2.22 · Gauntlet R2 (M4-01) · Una font amb `empremtaContrastada: false` (avui, només l'estudi d'oliveres) no té
   cap extracte al repositori: el rètol diu que l'empremta és declarada i no contrastada. Si, a més, el document és
   l'adreça del registre (`webEsRegistreDocument`), la línia ho diu en lloc de «Document». Els dos rètols són al
   mòdul de textos del Banc (i18nBibliotecaAgricola.js), en la llengua que rep `llengua`. */
import { textosBibliotecaAgricola } from './i18nBibliotecaAgricola.js';

const EMPREMTA = /^[a-f0-9]{64}$/;

export default function EmpremtaFont({ font, tr, extra = null, llengua = 'ca' }) {
  const empremta = typeof font?.sha256 === 'string' && EMPREMTA.test(font.sha256) ? font.sha256 : '';
  const document = typeof font?.document === 'string' ? font.document.trim() : '';
  if (!empremta && !document) return null;
  const txBib = textosBibliotecaAgricola(llengua);
  const resum = font?.empremtaContrastada === false
    ? txBib.empremtaDeclarada
    : tr('patrimoni.font.empremta', 'Empremta SHA-256 de la font');
  const etiquetaDocument = font?.webEsRegistreDocument === true && document === font?.web
    ? txBib.registreDocument
    : tr('patrimoni.font.document', 'Document');
  return (
    <details>
      <summary>{resum}</summary>
      {document && <p>{etiquetaDocument}: <code>{document}</code>{extra}</p>}
      {empremta && <p><code>{empremta.match(/.{1,8}/g).map((tros, i) => <span key={i}>{tros}<wbr /></span>)}</code></p>}
    </details>
  );
}

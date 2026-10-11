import { useMemo, useRef, useState } from 'react';
import { BookOpen, Printer } from 'lucide-react';
import { Casella, Dialeg } from '../PedraSeca/index.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

/* El document de l'iframe és autònom (CSP pròpia, sense el full de l'app):
   els tokens --sdp-* no hi arriben, i els colors del paper van escrits ací.
   Són els de sempre; cadascun porta la justificació que admet la guarda. */
const PAPER = Object.freeze({
  tinta: /* ALLOW_RAW_COLOR */ '#171717',
  filet: /* ALLOW_RAW_COLOR */ '#888',
  mesa: /* ALLOW_RAW_COLOR */ '#e5e5e5',
  ombra: /* ALLOW_RAW_COLOR */ '#0002',
});
const AVIS_IMPRESSIO = 'El document es prepara al teu dispositiu. En imprimir, tria A4 i «Desar com a PDF». Revisa els salts de pàgina en la vista prèvia del navegador.';

const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const plain = value => String(value || '').replace(/<[^>]*>/g, '');
// Independent of storage/backend: the same document DTO works in WordPress,
// Sollutia and local mode. The browser's PDF engine performs pagination locally.
/* Onada 11 (261010; prompt 261010_1730, tasca 3) · un sol H1 per document (la
   Regla de les Capçaleres): el de l'article, dins d'un <header class="page-title">
   que al document autònom no té cap CSS (bloc sense marges: els de l'h1
   col·lapsen a través d'ell, cap píxel canvia). El títol de la portada és un
   bloc .cover-titol amb el CSS que tenia l'h1: 36pt, línia 1.2, negreta i els
   marges verticals de 0.67em de l'h1 als navegadors actuals (Chrome 136+,
   Firefox 140+ i Safari 26 van llevar les regles d'h1 niat en <section>; al
   Baseline 2022 eixe h1 duia 0.83em: ahí la portada es mou 2 mm). */
export function buildPrintDocument(doc, cover = false, author = '') {
  const title = escape(plain(doc.title) || 'Sense títol');
  const copyright = escape(doc.copyright);
  const coverHtml = cover ? `<section class="cover"><p>Sóc de Poble · Edició personal</p><p class="cover-titol">${title}</p><p>${escape(plain(doc.subtitle))}</p><p>${escape(author)}</p><footer>${copyright}</footer></section>` : '';
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${title}</title><style>
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; } body { margin: 0; color: ${PAPER.tinta}; background: white; font: 11pt/1.6 Georgia, serif; overflow-wrap: anywhere; }
main { max-width: 174mm; margin: auto; } h1 { font-size: 28pt; line-height: 1.2; } h2,h3,h4 { break-after: avoid; } p,li { orphans: 3; widows: 3; }
img,svg { max-width: 100%; max-height: 225mm; object-fit: contain; } figure,blockquote,pre,tr { break-inside: avoid; } figure { margin: 6mm 0; } table { width: 100%; border-collapse: collapse; } th,td { border: 1px solid ${PAPER.filet}; padding: 2mm; } thead { display: table-header-group; } pre { white-space: pre-wrap; } a { color: inherit; } footer { margin-top: 10mm; font-size: 9pt; }
.cover { min-height: 245mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; } .cover-titol { font-size: 36pt; line-height: 1.2; font-weight: bold; margin: 0.67em 0; } .cover footer { margin-top: 25mm; }
@media screen { body { padding: 4mm; background: ${PAPER.mesa}; } main { background: white; padding: 12mm; box-shadow: 0 2px 12px ${PAPER.ombra}; } .cover { min-height: 80vh; } }
@media screen and (max-width: 120mm) { body { padding: 0; } main { padding: 4mm; } }
</style></head><body><main>${coverHtml}<article><header class="page-title"><h1>${title}</h1></header>${doc.subtitle ? `<h2>${escape(plain(doc.subtitle))}</h2>` : ''}${sanitizeHtml(doc.lead || '')}${sanitizeHtml(doc.content || '')}<footer>${copyright}</footer></article></main></body></html>`;
}

export default function DocumentPrintPreview({ document: doc, author = '' }) {
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState(false);
  const [ready, setReady] = useState(false);
  const frame = useRef(null);
  const html = useMemo(() => open ? buildPrintDocument(doc, cover, author) : '', [doc, cover, author, open]);
  const show = withCover => { setCover(withCover); setReady(false); setOpen(true); };
  return <>
    <button type="button" className="sdp-classificacio-pindola" onClick={() => show(false)}>
      <span className="sp-card-label sdp-badge-buit"><Printer size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">Vista A4 / PDF</span></span>
    </button>
    <button type="button" className="sdp-classificacio-pindola" onClick={() => show(true)}>
      <span className="sp-card-label sdp-badge-buit"><BookOpen size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">Crear portada</span></span>
    </button>
    {/* T42 · l'avís és la descripció del diàleg (fora del cos, sempre a la
        vista i anunciat en obrir); el cos només porta la casella i el
        document, que és l'únic que fa scroll (en pantalla curta, el diàleg
        sencer fa de reserva). */}
    <Dialeg obert={open} onTanca={() => setOpen(false)} titol="Vista prèvia d'impressió" descripcio={AVIS_IMPRESSIO} mida="g" className="sdp-print-dialog"
      accions={<button type="button" className="sdp-boto" disabled={!ready} onClick={() => { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); }}>Imprimir / Desar PDF</button>}>
      <Casella etiqueta="Incloure portada" checked={cover} onChange={event => { setReady(false); setCover(event.target.checked); }} />
      {open && <iframe ref={frame} title="Document A4" className="sdp-print-preview" sandbox="allow-same-origin allow-modals" srcDoc={html} onLoad={() => setReady(true)} />}
    </Dialeg>
  </>;
}

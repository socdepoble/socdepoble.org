import { useMemo, useRef, useState } from 'react';
import { BookOpen, Printer } from 'lucide-react';
import { Dialeg } from '../PedraSeca/organismes/Dialeg.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const plain = value => String(value || '').replace(/<[^>]*>/g, '');
// Independent of storage/backend: the same document DTO works in WordPress,
// Sollutia and local mode. The browser's PDF engine performs pagination locally.
export function buildPrintDocument(doc, cover = false, author = '') {
  const title = escape(plain(doc.title) || 'Sense títol');
  const copyright = escape(doc.copyright);
  const coverHtml = cover ? `<section class="cover"><p>Sóc de Poble · Edició personal</p><h1>${title}</h1><p>${escape(plain(doc.subtitle))}</p><p>${escape(author)}</p><footer>${copyright}</footer></section>` : '';
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${title}</title><style>
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; } body { margin: 0; color: #171717; background: white; font: 11pt/1.6 Georgia, serif; overflow-wrap: anywhere; }
main { max-width: 174mm; margin: auto; } h1 { font-size: 28pt; line-height: 1.2; } h2,h3,h4 { break-after: avoid; } p,li { orphans: 3; widows: 3; }
img,svg { max-width: 100%; max-height: 225mm; object-fit: contain; } figure,blockquote,pre,tr { break-inside: avoid; } figure { margin: 6mm 0; } table { width: 100%; border-collapse: collapse; } th,td { border: 1px solid #888; padding: 2mm; } thead { display: table-header-group; } pre { white-space: pre-wrap; } a { color: inherit; } footer { margin-top: 10mm; font-size: 9pt; }
.cover { min-height: 245mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; } .cover h1 { font-size: 36pt; } .cover footer { margin-top: 25mm; }
@media screen { body { padding: 4mm; background: #e5e5e5; } main { background: white; padding: 12mm; box-shadow: 0 2px 12px #0002; } .cover { min-height: 80vh; } }
</style></head><body><main>${coverHtml}<article><h1>${title}</h1>${doc.subtitle ? `<h2>${escape(plain(doc.subtitle))}</h2>` : ''}${sanitizeHtml(doc.lead || '')}${sanitizeHtml(doc.content || '')}<footer>${copyright}</footer></article></main></body></html>`;
}

export default function DocumentPrintPreview({ document: doc, author = '' }) {
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState(false);
  const [ready, setReady] = useState(false);
  const frame = useRef(null);
  const html = useMemo(() => open ? buildPrintDocument(doc, cover, author) : '', [doc, cover, author, open]);
  const show = withCover => { setCover(withCover); setReady(false); setOpen(true); };
  return <>
    <button type="button" className="sdp-copyright-selector" onClick={() => show(false)}><Printer size={14} aria-hidden="true" />Vista A4 / PDF</button>
    <button type="button" className="sdp-copyright-selector" onClick={() => show(true)}><BookOpen size={14} aria-hidden="true" />Crear portada</button>
    <Dialeg obert={open} onTanca={() => setOpen(false)} titol="Vista prèvia d'impressió" mida="g" className="sdp-print-dialog"
      accions={<button type="button" className="sdp-boto" disabled={!ready} onClick={() => { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); }}>Imprimir / Desar PDF</button>}>
      <p>El document es prepara al teu dispositiu. En imprimir, tria A4 i «Desar com a PDF». Revisa els salts de pàgina en la vista prèvia del navegador.</p>
      <label><input type="checkbox" checked={cover} onChange={event => { setReady(false); setCover(event.target.checked); }} /> Incloure portada</label>
      {open && <iframe ref={frame} title="Document A4" className="sdp-print-preview" sandbox="allow-same-origin allow-modals" srcDoc={html} onLoad={() => setReady(true)} />}
    </Dialeg>
  </>;
}

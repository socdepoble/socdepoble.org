import { sanitizeHtml } from '../../utils/sanitize';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { MARCA_GRUP, segmentsAmbTargetes } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { semblaHtml } from './detailHelpers.jsx';

export function renderRichText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  // SPEC G · els src="/assets/…" prenen la base de l'amfitrió en pintar-se,
  // ABANS del sanejador; sense base, el mateix HTML.
  // Auditoria de seguretat 261019 (F12) · La detecció, lineal (semblaHtml).
  if (semblaHtml(raw)) {
    // T7 (ordre del Mestre, 261004) · Un cos amb targetes incrustades (un grup
    // de primer nivell) es pinta hidratat: cada targeta és la del Mur. Sense
    // cap grup, el camí de sempre, byte a byte (Llei del Píxel).
    if (raw.includes(MARCA_GRUP)) {
      const segments = segmentsAmbTargetes(sanitizeHtml(resolRecursosDeHtml(raw)));
      if (segments.some((segment) => segment.tipus === 'targetes')) return <CosAmbTargetes segments={segments} />;
    }
    return <article className="detail-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(raw)) }} />;
  }

  const paragraphs = raw
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="detail-content">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split(/\n/g);
        return (
          <p
            key={`${index}-${paragraph.slice(0, 18)}`}
            className="detail-content__paragraph"
          >
            {lines.map((line, lineIndex) => (
              <span key={`${index}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </article>
  );
}

export function renderPostContent(text) {
  return renderRichText(text);
}

export function renderPageHtml(text) {
  const html = String(text || '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="detail-content__img" />')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');

  return sanitizeHtml(html);
}

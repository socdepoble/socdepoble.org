import { sanitizeHtml } from '../../utils/sanitize';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';

export function renderRichText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  // SPEC G · els src="/assets/…" prenen la base de l'amfitrió en pintar-se,
  // ABANS del sanejador; sense base, el mateix HTML.
  if (/<[a-z][\s\S]*>/i.test(raw)) {
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

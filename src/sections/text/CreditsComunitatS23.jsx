import { sanitizeHtml } from '../../utils/sanitize.js';
import { htmlCreditsComunitatS23 } from './legalCreditsS23.js';

export default function CreditsComunitatS23({ language = 'ca' }) {
  const codiIdioma = ['ca', 'es', 'en', 'eu', 'gl'].includes(language) ? language : 'ca';
  return (
    <section
      className="cms-preview"
      lang={codiIdioma}
      data-testid="legal-credits-s23"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCreditsComunitatS23(codiIdioma), { enllacosEditorials: true }) }}
    />
  );
}

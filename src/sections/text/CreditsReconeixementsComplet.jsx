import { sanitizeHtml } from '../../utils/sanitize.js';
import { htmlCreditsReconeixementsComplet } from './reconeixementsCredits5L.js';

export default function CreditsReconeixementsComplet({ language = 'ca' }) {
  const codiIdioma = ['ca', 'es', 'en', 'eu', 'gl'].includes(language) ? language : 'ca';
  return (
    <section
      className="sdp-cos-tros"
      lang={codiIdioma}
      data-testid="reconeixements-credits-complet"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCreditsReconeixementsComplet(codiIdioma), { enllacosEditorials: true }) }}
    />
  );
}

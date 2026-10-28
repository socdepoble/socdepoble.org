/**
 * DocumentacioMaquinaria.jsx · Pla 261027_0845 (Guarda Nocturna), §3 · El
 * cos de les tres pàgines de la Maquinària de la IAIA fora de
 * desenvolupament: la porta d'aprovació de tractors i els Sentinelles, amb la
 * seua documentació i l'avís que les accions només funcionen en local; el
 * BIOS dels agents, AGENTS.md sencer, de lectura, com el pinta el panell de
 * desenvolupament.
 *
 * Contingut sense pàgina ni h1: la Wiki hi posa la UniversalPage (títol,
 * subtítol i entradilla de l'ítem). Es carrega a demanda (lazyRoute), perquè
 * el text d'AGENTS.md no pese al tros de la Wiki a cada visita. No importa
 * res dels carrils dels Tractors ni de la Gestoria: ni magatzem, ni WebAuthn,
 * ni el catàleg de fonts (gestoria/privacitat.test.js). Res d'ací demana res
 * a la xarxa ni al servidor de desenvolupament (/__iaia/*).
 *
 * El contenidor és el dels panells (sdp-tractors-panell): la mateixa columna
 * i el mateix ample que la pàgina té en desenvolupament.
 */
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { parseMarkdown } from './parseMarkdown.js';
import { AVIS_NOMES_EN_LOCAL, ID_BIOS, documentacioDe, markdownDelBios } from './documentacioMaquinaria.js';

import agentsMdRaw from '../../../AGENTS.md?raw';

export default function DocumentacioMaquinaria({ id }) {
  const bios = id === ID_BIOS;
  const markdown = bios ? markdownDelBios(agentsMdRaw) : documentacioDe(id);
  if (markdown === null) return null;
  /* El BIOS passa pel parser amb les opcions del panell dels Agents (la seua
     entradilla és la d'AGENTS.md); la documentació no en té cap. */
  const html = bios ? parseMarkdown(markdown) : parseMarkdown(markdown, { entradilla: false });
  return (
    <div className="sdp-tractors-panell">
      {bios ? null : (
        <Alerta to="info" viva={false} titol={AVIS_NOMES_EN_LOCAL.titol}>{AVIS_NOMES_EN_LOCAL.text}</Alerta>
      )}
      <div
        className="sdp-prose sdp-prose--encoixinada"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </div>
  );
}

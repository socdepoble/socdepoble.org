import React from 'react';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { parseMarkdown, extreuEditorial } from '../wiki-de-poble/parseMarkdown.js';

import agentsMdRaw from '../../../AGENTS.md?raw';

export default function PanellAgents() {
  // 1. Extraure el frontmatter
  let rawText = agentsMdRaw;
  let frontmatter = '';
  const fmMatch = rawText.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch) {
    frontmatter = fmMatch[1].trim();
    rawText = rawText.slice(fmMatch[0].length);
  }

  // 2. Corregir enllaços d'Obsidian (ex: [[00_index]])
  rawText = rawText.replace(/\[\[(.*?)\]\]/g, '[$1](?item=$1)');

  // 3. Extraure l'H1 (títol) perquè no isca duplicat, i l'entradilla
  const { entradilla, cos } = extreuEditorial(rawText);

  // 4. Rebaixar la resta de títols (H2 -> H3) perquè l'H2 de la pàgina és el subtítol
  const cosRebaixat = cos.replace(/^(#{2,6}) /gm, '#$1 ');

  // 5. Construir el document final
  const markdownFinal = `
${entradilla ? entradilla + '\n\n' : ''}
${frontmatter ? '> **Metadades del document (Frontmatter):**\n> ' + frontmatter.replace(/\n/g, '  \n> ') + '\n\n' : ''}
${cosRebaixat}
`;

  return (
    <div className="sdp-tractors-panell sdp-m-m">
      <div 
        className="sdp-prose sdp-prose--encoixinada"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(markdownFinal)) }} 
      />
    </div>
  );
}
